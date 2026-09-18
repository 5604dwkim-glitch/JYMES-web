import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, writeBatch, limit, runTransaction, addDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { CAR_MODELS } from '../constants/masterData';
import { buildStatsUpdate } from './statsAggregator';

const REPORTS_COLLECTION = 'reports';

// ─────────────────────────────────────────────
// ① Workers 캐시 (sessionStorage, TTL 30분)
// ─────────────────────────────────────────────
const WORKERS_CACHE_KEY = 'jymes_workers_cache';
const WORKERS_CACHE_TTL_MS = 30 * 60 * 1000; // 30분

function getWorkersFromCache() {
  try {
    const raw = sessionStorage.getItem(WORKERS_CACHE_KEY);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > WORKERS_CACHE_TTL_MS) {
      sessionStorage.removeItem(WORKERS_CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setWorkersCache(data) {
  try {
    sessionStorage.setItem(WORKERS_CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // sessionStorage 용량 초과 등 무시
  }
}

export function invalidateWorkersCache() {
  sessionStorage.removeItem(WORKERS_CACHE_KEY);
}

// ─────────────────────────────────────────────
// ② 리포트 인메모리 캐시 (같은 필터 조건 재조회 방지)
// ─────────────────────────────────────────────
const reportCache = new Map(); // key: JSON.stringify(serverFilters) → { data, timestamp }
const REPORT_CACHE_TTL_MS = 10 * 60 * 1000; // 10분

function getReportsFromCache(serverFilters) {
  const key = JSON.stringify(serverFilters);
  const entry = reportCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > REPORT_CACHE_TTL_MS) {
    reportCache.delete(key);
    return null;
  }
  return entry.data;
}

function setReportsCache(serverFilters, data) {
  const key = JSON.stringify(serverFilters);
  reportCache.set(key, { data, timestamp: Date.now() });
  // 캐시 크기 제한 (최대 20개 엔트리)
  if (reportCache.size > 20) {
    const firstKey = reportCache.keys().next().value;
    reportCache.delete(firstKey);
  }
}

export function invalidateReportsCache() {
  reportCache.clear();
}

// ─────────────────────────────────────────────
// ③ Molds 캐시 (인메모리, TTL 60분) — 작업일보 작성·대시보드 중복 읽기 방지
// ─────────────────────────────────────────────
let moldsCache = null;
let moldsCacheAt = 0;
const MOLDS_CACHE_TTL_MS = 60 * 60 * 1000; // 60분

export function getMoldsFromCache() {
  if (!moldsCache || Date.now() - moldsCacheAt > MOLDS_CACHE_TTL_MS) return null;
  return moldsCache;
}
export function setMoldsCache(data) {
  moldsCache = data;
  moldsCacheAt = Date.now();
}
export function invalidateMoldsCache() {
  moldsCache = null;
  moldsCacheAt = 0;
}

// ─────────────────────────────────────────────
// ④ Equipments 캐시 (인메모리, TTL 60분)
// ─────────────────────────────────────────────
let equipmentsCache = null;
let equipmentsCacheAt = 0;
const EQUIPMENTS_CACHE_TTL_MS = 60 * 60 * 1000; // 60분

export function getEquipmentsFromCache() {
  if (!equipmentsCache || Date.now() - equipmentsCacheAt > EQUIPMENTS_CACHE_TTL_MS) return null;
  return equipmentsCache;
}
export function setEquipmentsCache(data) {
  equipmentsCache = data;
  equipmentsCacheAt = Date.now();
}
export function invalidateEquipmentsCache() {
  equipmentsCache = null;
  equipmentsCacheAt = 0;
}

// ─────────────────────────────────────────────
// ⑤ ChangePoints 캐시 (인메모리, TTL 30분)
// ─────────────────────────────────────────────
let changePointsCache = null;
let changePointsCacheAt = 0;
const CHANGE_POINTS_CACHE_TTL_MS = 30 * 60 * 1000; // 30분

// ─────────────────────────────────────────────
// Reports CRUD
// ─────────────────────────────────────────────

export async function fetchReports(filters = {}) {
  try {
    // searchQuery는 클라이언트 필터이므로 캐시 키에서 제외
    const { searchQuery, ...serverFilters } = filters;

    // 캐시 체크 (날짜/상태/차종/공정 기준)
    let result = getReportsFromCache(serverFilters);

    if (!result) {
      let q = collection(db, REPORTS_COLLECTION);
      let constraints = [];

      if (serverFilters.startDate) constraints.push(where('date', '>=', serverFilters.startDate));
      if (serverFilters.endDate)   constraints.push(where('date', '<=', serverFilters.endDate));

      if (constraints.length > 0) {
        q = query(q, ...constraints);
      }

      const querySnapshot = await getDocs(q);
      result = [];
      querySnapshot.forEach((doc) => {
        const r = { id: doc.id, ...doc.data() };
        // [구버전 반장일보 소급 매핑] DB에 잘못 저장된 과거 반장 일보를 메모리상 '공통'으로 통일
        if (r.isLeaderForm || r.processName === '반장 작업일보') {
          r.carModel = '공통';
          r.itemName = '공통';
          r.processName = '반장 작업일보';
          r.isLeaderForm = true;
        }
        if (r.isForkliftForm || r.processName === '지게차작업') {
          r.carModel = '공통';
          r.itemName = '공통';
          r.processName = '지게차작업';
          r.isForkliftForm = true;
        }
        if (r.isSupportForm || r.processName === '출하지원') {
          r.carModel = '공통';
          r.itemName = '공통';
          r.processName = '출하지원';
          r.isSupportForm = true;
        }
        result.push(r);
      });

      // 서버필터 기반 클라이언트 필터
      if (serverFilters.carModel && serverFilters.carModel !== 'ALL')
        result = result.filter(r => r.carModel === serverFilters.carModel);
      if (serverFilters.processName && serverFilters.processName !== 'ALL')
        result = result.filter(r => r.processName === serverFilters.processName);
      if (serverFilters.status && serverFilters.status !== 'ALL')
        result = result.filter(r => r.status === serverFilters.status);
      if (serverFilters.workerName) {
        const kw = serverFilters.workerName.toLowerCase();
        result = result.filter(r => r.workerName && r.workerName.toLowerCase().includes(kw));
      }

      result = result.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.id || '').localeCompare(a.id || ''));

      // 캐시 저장
      setReportsCache(serverFilters, result);
    }

    // searchQuery는 항상 클라이언트에서만 처리 (Firestore 호출 없음)
    if (searchQuery) {
      const kw = searchQuery.toLowerCase();
      result = result.filter(r =>
        (r.id && r.id.toLowerCase().includes(kw)) ||
        (r.carModel && r.carModel.toLowerCase().includes(kw)) ||
        (r.itemName && r.itemName.toLowerCase().includes(kw)) ||
        (r.workerName && r.workerName.toLowerCase().includes(kw)) ||
        (r.notes && r.notes.toLowerCase().includes(kw))
      );
    }

    return result;
  } catch (error) {
    console.error('Error fetching reports:', error);
    return [];
  }
}

export async function fetchDailyStats(startDate) {
  try {
    let q = collection(db, 'daily_stats');
    if (startDate) {
      q = query(q, where('__name__', '>=', startDate));
    }
    const snap = await getDocs(q);
    const stats = [];
    snap.forEach(doc => {
      stats.push({ date: doc.id, ...doc.data() });
    });
    return stats;
  } catch (e) {
    console.error('Error fetching daily stats', e);
    return [];
  }
}

export async function fetchMyRecentReports(workerName) {
  try {
    // limit(20) 추가: 전체 스캔 방지 → 최신 20건만 읽고 3개 반환
    const q = query(
      collection(db, REPORTS_COLLECTION),
      where('workerName', '==', workerName),
      limit(20)
    );
    const querySnapshot = await getDocs(q);
    let result = [];
    querySnapshot.forEach((doc) => {
      result.push({ id: doc.id, ...doc.data() });
    });
    return result.sort((a, b) => b.id.localeCompare(a.id)).slice(0, 3);
  } catch (error) {
    console.error('Error fetching my recent reports:', error);
    return [];
  }
}

export async function fetchAdminDashboardReports(dateStr) {
  try {
    const q = query(collection(db, REPORTS_COLLECTION), where('date', '==', dateStr));
    const querySnapshot = await getDocs(q);
    let result = [];
    querySnapshot.forEach((doc) => {
      result.push({ id: doc.id, ...doc.data() });
    });
    return result;
  } catch (error) {
    console.error('Error fetching admin dashboard reports:', error);
    return [];
  }
}

export async function getReportById(id) {
  try {
    const docRef = doc(db, REPORTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting report:', error);
    return null;
  }
}


export async function processMoldStrokes(reportData, existingReport = null) {
  // Only process when submitting (not drafting)
  if (reportData.status !== '제출완료') return;

  const isUpdate = existingReport && existingReport.status === '제출완료' && existingReport.moldStrokesProcessed;
  
  const v = reportData.vulcTable || {};
  const prevV = existingReport ? (existingReport.vulcTable || {}) : {};

  // Aggregate strokes per mold ID
  const strokeUpdates = {};
  
  Object.keys(v).forEach(key => {
    if (key.startsWith('mold_')) {
      const suffix = key.substring(5);
      const moldId = v[key];
      if (moldId && moldId.trim() !== '') {
        const strokeKey = 'stroke_' + suffix;
        const currentStroke = Number(v[strokeKey]) || 0;
        const prevStroke = isUpdate ? (Number(prevV[strokeKey]) || 0) : 0;
        const diff = currentStroke - prevStroke;
        
        if (diff !== 0) {
          if (!strokeUpdates[moldId]) strokeUpdates[moldId] = 0;
          strokeUpdates[moldId] += diff;
        }
      }
    }
  });

  // [개선④] 금형 코드별 개별 쿼리 → 캐시된 전체 목록에서 메모리 룩업 (N회 → 0~1회)
  if (Object.keys(strokeUpdates).length > 0) {
    const allMolds = await fetchMolds(); // 캐시 적용: 이미 읽었으면 Firestore 호출 없음
    const moldMap = {};
    allMolds.forEach(m => { if (m.code) moldMap[m.code] = m; });

    const batch = writeBatch(db);
    let hasBatch = false;
    for (const [moldCode, strokesToAdd] of Object.entries(strokeUpdates)) {
      if (strokesToAdd === 0) continue;
      const moldDoc = moldMap[moldCode];
      if (moldDoc) {
        const currentStrokes = moldDoc.currentStrokes || 0;
        batch.update(doc(db, 'molds', moldDoc.id), {
          currentStrokes: currentStrokes + strokesToAdd
        });
        hasBatch = true;
      }
    }
    if (hasBatch) {
      try {
        await batch.commit();
        invalidateMoldsCache(); // 타수 변경 후 캐시 무효화
      } catch (err) {
        console.error('Failed to update mold strokes:', err);
      }
    }
  }
}

async function applyStatsUpdate(oldReport, newReport) {
  try {
    const diff = buildStatsUpdate(oldReport, newReport);
    if (Object.keys(diff).length === 0) return;
    
    // 재귀적으로 숫자를 increment()로 변환
    const convertToIncrements = (obj) => {
      const result = {};
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === 'number') {
          result[k] = increment(v);
        } else if (v && typeof v === 'object') {
          result[k] = convertToIncrements(v);
        }
      }
      return result;
    };
    
    const increments = convertToIncrements(diff);
    
    const targetDate = (newReport && newReport.date) || (oldReport && oldReport.date);
    if (!targetDate) return;
    
    const statsRef = doc(db, 'daily_stats', targetDate);
    await setDoc(statsRef, increments, { merge: true });
  } catch (error) {
    console.error('Failed to update daily_stats:', error);
  }
}

export async function addReport(reportData) {
  try {
    const todayStr = new Date().toLocaleDateString('sv-SE');
    const prefix = `RPT-${todayStr.replace(/-/g, '')}-`;
    const counterRef = doc(db, 'counters', prefix);

    // Migration check: If counter doesn't exist, check existing reports to initialize properly
    let startCount = 100; // Legacy started from 101
    const counterSnap = await getDoc(counterRef);
    if (!counterSnap.exists()) {
      const q = query(
        collection(db, REPORTS_COLLECTION),
        where('id', '>=', prefix),
        where('id', '<=', prefix + '\uf8ff'),
        orderBy('id', 'desc'),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const lastId = snapshot.docs[0].id;
        startCount = parseInt(lastId.slice(-3), 10);
      }
    }

    const newReport = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let seq = startCount + 1;
      if (counterDoc.exists()) {
        seq = counterDoc.data().count + 1;
      }
      
      const seqStr = String(seq).padStart(3, '0');
      const newId = `${prefix}${seqStr}`;
      
      // Update the counter
      transaction.set(counterRef, { count: seq }, { merge: true });

      const targetQty = Number(reportData.targetQty) || 0;
      const actualQty = Number(reportData.actualQty) || 0;
      const defectQty = Number(reportData.defectQty) || 0;

      const attainmentRate = targetQty > 0 ? Number(((actualQty / targetQty) * 100).toFixed(1)) : 0;
      const defectRate = actualQty > 0 ? Number(((defectQty / actualQty) * 100).toFixed(2)) : 0;

      const carModel = reportData.carModel || 'JG1';
      const carObj = CAR_MODELS.find(c => c.code === carModel);

      const reportObj = {
        ...reportData,
        id: newId,
        date: reportData.date || todayStr,
        workHours: reportData.workHours || '08:00 ~ 17:00',
        shift: reportData.shift || '주간',
        carModel: carModel,
        carModelName: carObj ? carObj.name : carModel,
        processId: reportData.processId || '',
        processName: reportData.processName || '검사포장',
        line: reportData.line || '1라인',
        workerId: reportData.workerId || 'EMP001',
        workerName: reportData.workerName || '장수미',
        itemCode: reportData.itemCode || '인벨트',
        itemName: reportData.itemName || '인벨트',
        targetQty,
        actualQty,
        defectQty,
        attainmentRate,
        defectRate,
        materialLots: reportData.materialLots || {},
        isLeaderForm: reportData.isLeaderForm || false,
        isForkliftForm: reportData.isForkliftForm || false,
        isSupportForm: reportData.isSupportForm || false,
        formCode: reportData.formCode || '',
        leaderFormItems: reportData.leaderFormItems || [],
        attendanceData: reportData.attendanceData || {},
        downtimeMinutes: Number(reportData.downtimeMinutes) || 0,
        downtimeReason: reportData.downtimeReason || '',
        notes: reportData.notes || '',
        status: reportData.status || '승인 대기',
        approver: reportData.approver || '',
        approvedAt: reportData.approvedAt || '',
        createdAt: new Date().toLocaleString('ko-KR')
      };

      Object.keys(reportObj).forEach(key => {
        if (reportObj[key] === undefined) delete reportObj[key];
      });

      const docRef = doc(collection(db, REPORTS_COLLECTION), newId);
      transaction.set(docRef, reportObj);

      return reportObj;
    });

    invalidateReportsCache();
    // Mark as processed if submitted
    if (newReport.status === '제출완료') {
      await updateDoc(doc(db, REPORTS_COLLECTION, newId), { moldStrokesProcessed: true });
      newReport.moldStrokesProcessed = true;
    }
    
    await processMoldStrokes(newReport);
    await applyStatsUpdate(null, newReport);
    
    return newReport;
  } catch (error) {
    console.error('Error adding report:', error);
    throw error;
  }
}

export async function updateReport(id, updatedFields) {
  try {
    const docRef = doc(db, REPORTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    const existingReport = docSnap.exists() ? docSnap.data() : null;

    const cleanedFields = { ...updatedFields };
    Object.keys(cleanedFields).forEach(key => {
      if (cleanedFields[key] === undefined) delete cleanedFields[key];
    });
    await updateDoc(docRef, cleanedFields);
    invalidateReportsCache();
    
    if (existingReport) {
      const mergedReport = { ...existingReport, ...cleanedFields };
      await applyStatsUpdate(existingReport, mergedReport);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating report:', error);
    throw error;
  }
}

export async function deleteReport(id) {
  try {
    const docRef = doc(db, REPORTS_COLLECTION, id);
    const docSnap = await getDoc(docRef);
    const existingReport = docSnap.exists() ? docSnap.data() : null;

    await deleteDoc(docRef);
    invalidateReportsCache();

    if (existingReport) {
      await applyStatsUpdate(existingReport, null);
    }

    return true;
  } catch (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
}

export async function bulkApproveReports(ids, approverName = '관리자') {
  try {
    const batch = writeBatch(db);
    const now = new Date().toLocaleString('ko-KR');
    ids.forEach(id => {
      const docRef = doc(db, REPORTS_COLLECTION, id);
      batch.update(docRef, { status: '승인 완료', approver: approverName, approvedAt: now });
    });
    await batch.commit();
    invalidateReportsCache();
    return ids.length;
  } catch (error) {
    console.error('Error bulk approving:', error);
    throw error;
  }
}

export async function bulkDeleteReports(ids) {
  try {
    const existingReports = [];
    for (const id of ids) {
      const docSnap = await getDoc(doc(db, REPORTS_COLLECTION, id));
      if (docSnap.exists()) {
        existingReports.push(docSnap.data());
      }
    }

    const batch = writeBatch(db);
    ids.forEach(id => {
      const docRef = doc(db, REPORTS_COLLECTION, id);
      batch.delete(docRef);
    });
    await batch.commit();
    invalidateReportsCache();

    for (const r of existingReports) {
      await applyStatsUpdate(r, null);
    }

    return ids.length;
  } catch (error) {
    console.error('Error bulk deleting:', error);
    throw error;
  }
}

// ─────────────────────────────────────────────
// Workers (sessionStorage 캐시 적용)
// ─────────────────────────────────────────────
const WORKERS_COLLECTION = 'workers';

export async function fetchWorkers() {
  // 캐시 hit: Firestore 호출 없이 즉시 반환
  const cached = getWorkersFromCache();
  if (cached) {
    return cached;
  }

  try {
    const q = collection(db, WORKERS_COLLECTION);
    const querySnapshot = await getDocs(q);
    let result = [];
    querySnapshot.forEach((doc) => {
      result.push({ id: doc.id, ...doc.data() });
    });
    result = result.sort((a, b) => a.id.localeCompare(b.id));
    setWorkersCache(result);
    return result;
  } catch (error) {
    console.error('Error fetching workers:', error);
    return [];
  }
}

export async function addWorker(workerData) {
  try {
    const docRef = doc(collection(db, WORKERS_COLLECTION), workerData.id);
    await setDoc(docRef, workerData);
    invalidateWorkersCache();
    return workerData;
  } catch (error) {
    console.error('Error adding worker:', error);
    throw error;
  }
}

export async function updateWorker(id, updatedFields) {
  try {
    const docRef = doc(db, WORKERS_COLLECTION, id);
    await updateDoc(docRef, updatedFields);
    invalidateWorkersCache();
    return true;
  } catch (error) {
    console.error('Error updating worker:', error);
    throw error;
  }
}

export async function deleteWorker(id) {
  try {
    const docRef = doc(db, WORKERS_COLLECTION, id);
    await deleteDoc(docRef);
    invalidateWorkersCache();
    return true;
  } catch (error) {
    console.error('Error deleting worker:', error);
    throw error;
  }
}


// ==================== CHANGE POINTS (변동점 관리) ====================
export const addChangePoint = async (data) => {
  try {
    const docRef = await addDoc(collection(db, 'changePoints'), {
      ...data,
      createdAt: serverTimestamp(),
    });
    changePointsCache = null; // 캐시 무효화
    return docRef.id;
  } catch (error) {
    console.error('Error adding change point:', error);
    throw error;
  }
};

// ─────────────────────────────────────────────
// [개선①②] Molds / Equipments — 캐시 통합 조회 함수
// ─────────────────────────────────────────────
export async function fetchMolds() {
  const cached = getMoldsFromCache();
  if (cached) return cached;
  try {
    const snap = await getDocs(collection(db, 'molds'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setMoldsCache(data);
    return data;
  } catch (e) {
    console.error('Error fetching molds:', e);
    return [];
  }
}

export async function fetchEquipments() {
  const cached = getEquipmentsFromCache();
  if (cached) return cached;
  try {
    const snap = await getDocs(collection(db, 'equipments'));
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setEquipmentsCache(data);
    return data;
  } catch (e) {
    console.error('Error fetching equipments:', e);
    return [];
  }
}

// [개선③] fetchChangePoints — 캐시 + limit(50)
export const fetchChangePoints = async (forceRefresh = false) => {
  if (!forceRefresh && changePointsCache && (Date.now() - changePointsCacheAt < CHANGE_POINTS_CACHE_TTL_MS)) {
    return changePointsCache;
  }
  try {
    const q = query(collection(db, 'changePoints'), orderBy('createdAt', 'desc'), limit(50));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    changePointsCache = data;
    changePointsCacheAt = Date.now();
    return data;
  } catch (error) {
    console.error('Error fetching change points:', error);
    throw error;
  }
};

export const updateChangePoint = async (id, data) => {
  try {
    const docRef = doc(db, 'changePoints', id);
    await updateDoc(docRef, data);
    changePointsCache = null; // 캐시 무효화
  } catch (error) {
    console.error('Error updating change point:', error);
    throw error;
  }
};

export const deleteChangePoint = async (id) => {
  try {
    const docRef = doc(db, 'changePoints', id);
    await deleteDoc(docRef);
    changePointsCache = null; // 캐시 무효화
  } catch (error) {
    console.error('Error deleting change point:', error);
    throw error;
  }
};
