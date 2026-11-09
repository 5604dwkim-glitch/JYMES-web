import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, documentId, writeBatch, limit, runTransaction, addDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../firebase';
import { CAR_MODELS } from '../constants/masterData';
import { buildStatsUpdate } from './statsAggregator';
import { syncReportDowntimeToRepairAndChangePoint } from './changePointAutoSync';

const REPORTS_COLLECTION = 'reports';

// ─────────────────────────────────────────────
// ① Workers 캐시 (sessionStorage, TTL 30분)
// ─────────────────────────────────────────────
const WORKERS_CACHE_KEY = 'jymes_workers_cache_v2';
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

const myRecentReportsCache = new Map(); // workerName -> { data, timestamp }
const MY_RECENT_CACHE_TTL_MS = 5 * 60 * 1000;

export function invalidateReportsCache() {
  reportCache.clear();
  myRecentReportsCache.clear();
  downtimeReportsCache = null; // 일보가 저장/수정/삭제되면 비가동 일보 캐시도 함께 무효화
  fmbReportsCache = null; // FMB보관실 월간 온·습도 대시보드 캐시도 함께 무효화
  dailyStatsAllCache = null; // 일별 집계 캐시도 함께 무효화
}

// 비가동 일보 캐시 (대시보드 "연계 현황"용, 10분) — 대시보드 재방문 때마다 다시 읽지 않도록 한다
let downtimeReportsCache = null;
let downtimeReportsCacheAt = 0;
const DOWNTIME_REPORTS_CACHE_TTL_MS = 10 * 60 * 1000;

// FMB보관실 일보 캐시 (메인 대시보드 하단 월간 온·습도 현황용, 10분)
let fmbReportsCache = null;
let fmbReportsCacheAt = 0;
const FMB_REPORTS_CACHE_TTL_MS = 10 * 60 * 1000;

// 일별 통계(daily_stats) 전체 캐시 (메인 대시보드 ↔ 공정 및 불량 분석 간 중복 읽기 방지, 10분)
let dailyStatsAllCache = null;
let dailyStatsAllCacheAt = 0;
const DAILY_STATS_CACHE_TTL_MS = 10 * 60 * 1000;

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

export function invalidateChangePointsCache() {
  changePointsCache = null;
  changePointsCacheAt = 0;
}

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
        if (r.isFmbForm || r.processName === 'FMB보관실') {
          r.carModel = '공통';
          r.itemName = '공통';
          r.processName = 'FMB보관실';
          r.isFmbForm = true;
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

/**
 * 비가동 시간이 기록된 작업일보만 조회 (대시보드 "비가동 → 수리 → 변동점 연계 현황"용)
 * downtimeMinutes > 0 단일 조건이라 복합 인덱스가 필요 없고, 일보 전체를 읽지 않는다.
 */
export async function fetchDowntimeReports(sinceDate = '', forceRefresh = false) {
  try {
    const expired = Date.now() - downtimeReportsCacheAt > DOWNTIME_REPORTS_CACHE_TTL_MS;
    if (forceRefresh || !downtimeReportsCache || expired) {
      const q = query(collection(db, REPORTS_COLLECTION), where('downtimeMinutes', '>', 0));
      const snap = await getDocs(q);
      downtimeReportsCache = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.id || '').localeCompare(a.id || ''));
      downtimeReportsCacheAt = Date.now();
    }
    return downtimeReportsCache.filter((r) => !sinceDate || (r.date || '') >= sinceDate);
  } catch (error) {
    console.error('Error fetching downtime reports:', error);
    return [];
  }
}

/**
 * FMB보관실(#9004) 일보만 단일 조건으로 조회 (메인 대시보드 하단 월간 온·습도 현황용)
 * processName == 'FMB보관실' 단일 필터이므로 복합 인덱스가 필요 없고 타 공정 일보를 읽지 않는다.
 */
export async function fetchFmbReports(forceRefresh = false) {
  try {
    const expired = Date.now() - fmbReportsCacheAt > FMB_REPORTS_CACHE_TTL_MS;
    if (forceRefresh || !fmbReportsCache || expired) {
      const q = query(collection(db, REPORTS_COLLECTION), where('processName', '==', 'FMB보관실'));
      const snap = await getDocs(q);
      fmbReportsCache = snap.docs
        .map((d) => ({
          id: d.id,
          ...d.data(),
          carModel: '공통',
          itemName: '공통',
          processName: 'FMB보관실',
          isFmbForm: true
        }))
        .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.id || '').localeCompare(a.id || ''));
      fmbReportsCacheAt = Date.now();
    }
    return fmbReportsCache;
  } catch (error) {
    console.error('Error fetching FMB storage reports:', error);
    return [];
  }
}

export async function fetchDailyStats(startDate, forceRefresh = false) {
  try {
    const cacheValid = !forceRefresh && dailyStatsAllCache && (Date.now() - dailyStatsAllCacheAt < DAILY_STATS_CACHE_TTL_MS);
    if (cacheValid) {
      return startDate ? dailyStatsAllCache.filter((s) => (s.date || '') >= startDate) : dailyStatsAllCache;
    }
    let q = collection(db, 'daily_stats');
    if (startDate) {
      q = query(q, where('__name__', '>=', startDate));
    }
    const snap = await getDocs(q);
    const stats = [];
    snap.forEach((d) => {
      stats.push({ date: d.id, ...d.data() });
    });
    if (!startDate) {
      dailyStatsAllCache = stats;
      dailyStatsAllCacheAt = Date.now();
    }
    return stats;
  } catch (e) {
    console.error('Error fetching daily stats', e);
    return [];
  }
}

export async function fetchMyRecentReports(workerName) {
  if (!workerName) return [];
  const cached = myRecentReportsCache.get(workerName);
  if (cached && Date.now() - cached.timestamp < MY_RECENT_CACHE_TTL_MS) {
    return cached.data;
  }

  const sortNewest = (arr) =>
    arr.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.id || '').localeCompare(a.id || ''));

  try {
    // 복합 인덱스(workerName ASC + __name__ DESC)가 있는 경우 최신 3건만 정확히 읽기
    const qOrdered = query(
      collection(db, REPORTS_COLLECTION),
      where('workerName', '==', workerName),
      orderBy(documentId(), 'desc'),
      limit(3)
    );
    const snap = await getDocs(qOrdered);
    const top3 = sortNewest(snap.docs.map((d) => ({ id: d.id, ...d.data() }))).slice(0, 3);
    myRecentReportsCache.set(workerName, { data: top3, timestamp: Date.now() });
    return top3;
  } catch {
    // 복합 인덱스 미생성 환경 폴백: 해당 작업자 일보를 모두 가져와 날짜·ID 내림차순 정렬 후 최신 3건 반환
    // (기존 orderBy 없는 limit(20)은 오름차순 상위 20건만 읽어 20건 초과 시 최신 일보가 누락되던 문제 해결)
    try {
      const qFallback = query(
        collection(db, REPORTS_COLLECTION),
        where('workerName', '==', workerName)
      );
      const snap = await getDocs(qFallback);
      const top3 = sortNewest(snap.docs.map((d) => ({ id: d.id, ...d.data() }))).slice(0, 3);
      myRecentReportsCache.set(workerName, { data: top3, timestamp: Date.now() });
      return top3;
    } catch (fallbackErr) {
      console.error('Error fetching my recent reports:', fallbackErr);
      return [];
    }
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


// 임시저장이 아닌 모든 상태('승인 대기' / '승인 완료' 등)를 "제출된 일보"로 본다.
// (기존에는 사용되지 않는 '제출완료' 값과 비교해 금형 누적 타수가 한 번도 반영되지 않았음)
export function isSubmittedReportStatus(status) {
  return Boolean(status) && status !== '임시저장';
}

export async function processMoldStrokes(reportData, existingReport = null) {
  // Only process when submitting (not drafting)
  if (!isSubmittedReportStatus(reportData.status)) return;

  const isUpdate = existingReport && existingReport.moldStrokesProcessed;
  
  // 금형 호기 번호(1~7)는 금형 간 중복되므로, 저장 시 함께 기록한 금형 고유 ID(moldRefs)를 우선 사용하고
  // moldRefs 가 없는 과거 일보는 기존 방식(호기 값 기준)으로 처리한다. (목표 금형별로 현재값 - 이전값 = 증감분)
  const collectStrokeTotals = (report) => {
    const totals = {};
    if (!report) return totals;
    const refs = report.moldRefs || {};
    [
      [report.vulcTable || report.vulcData || {}, 'vulc'],
      [report.vulcTable2 || report.vulcData2 || {}, 'vulc2']
    ].forEach(([table, prefix]) => {
      Object.keys(table).forEach(key => {
        if (!key.startsWith('mold_')) return;
        const moldVal = String(table[key] || '').trim();
        if (!moldVal) return;
        const suffix = key.substring(5);
        const stroke = Number(table['stroke_' + suffix]) || 0;
        if (!stroke) return;
        const refId = refs[`${prefix}_mold_${suffix}`];
        const target = refId ? `id:${refId}` : `code:${moldVal}`;
        totals[target] = (totals[target] || 0) + stroke;
      });
    });
    return totals;
  };

  const curTotals = collectStrokeTotals(reportData);
  const prevTotals = isUpdate ? collectStrokeTotals(existingReport) : {};

  const strokeUpdates = {};
  new Set([...Object.keys(curTotals), ...Object.keys(prevTotals)]).forEach(target => {
    const diff = (curTotals[target] || 0) - (prevTotals[target] || 0);
    if (diff !== 0) strokeUpdates[target] = diff;
  });

  // [개선④] 금형 코드별 개별 쿼리 → 캐시된 전체 목록에서 메모리 룩업 (N회 → 0~1회)
  if (Object.keys(strokeUpdates).length > 0) {
    const allMolds = await fetchMolds(); // 캐시 적용: 이미 읽었으면 Firestore 호출 없음
    const moldMap = {};
    const moldById = {};
    allMolds.forEach(m => {
      moldById[m.id] = m;
      if (m.code) moldMap[m.code] = m;
      if (m.moldNumber) moldMap[m.moldNumber] = m;
    });

    const batch = writeBatch(db);
    let hasBatch = false;
    for (const [target, strokesToAdd] of Object.entries(strokeUpdates)) {
      if (strokesToAdd === 0) continue;
      const moldDoc = target.startsWith('id:')
        ? moldById[target.slice(3)]
        : moldMap[target.slice(5)];
      if (moldDoc) {
        // 캐시된 타수 값 + 증감 방식은 동시 제출 시 덮어쓰기 위험이 있어 서버 측 증분(increment)으로 반영
        batch.update(doc(db, 'molds', moldDoc.id), {
          currentStrokes: increment(strokesToAdd)
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
    // 작업일자가 변경된 경우: 이전 날짜 통계에서는 전량 차감, 새 날짜 통계에는 전량 가산
    // (기존에는 새 날짜 문서에서 차이만 계산해 이전 날짜 통계가 남고 새 날짜가 음수/중복되는 오류 발생)
    if (oldReport && newReport && oldReport.date && newReport.date && oldReport.date !== newReport.date) {
      await applyStatsUpdateSingleDate(oldReport, null);
      await applyStatsUpdateSingleDate(null, newReport);
      return;
    }
    await applyStatsUpdateSingleDate(oldReport, newReport);
  } catch (error) {
    console.error('Failed to update daily_stats:', error);
  }
}

async function applyStatsUpdateSingleDate(oldReport, newReport) {
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
        moldStrokesProcessed: isSubmittedReportStatus(reportData.status || '승인 대기'),
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
    
    await processMoldStrokes(newReport);
    await applyStatsUpdate(null, newReport);
    try {
      await syncReportDowntimeToRepairAndChangePoint(newReport, null);
    } catch (syncErr) {
      console.error('Failed to auto-sync report downtime to repair/changePoint:', syncErr);
    }
    
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
      const mergedReport = { ...existingReport, ...cleanedFields, id };
      await applyStatsUpdate(existingReport, mergedReport);
      // 임시저장 → 제출완료 전환 및 제출완료 일보 수정 시에도 금형 타수 누적 반영 (기존에는 신규 등록 시에만 반영됨)
      try {
        if (isSubmittedReportStatus(mergedReport.status)) {
          await processMoldStrokes(mergedReport, existingReport);
          if (!existingReport.moldStrokesProcessed) {
            await updateDoc(docRef, { moldStrokesProcessed: true });
          }
        }
      } catch (strokeErr) {
        console.error('Failed to process mold strokes on report update:', strokeErr);
      }
      try {
        await syncReportDowntimeToRepairAndChangePoint(mergedReport, existingReport);
      } catch (syncErr) {
        console.error('Failed to auto-sync updated report downtime to repair/changePoint:', syncErr);
      }
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

// [개선③] fetchChangePoints — 캐시 + limit(200)
export const fetchChangePoints = async (forceRefresh = false) => {
  if (!forceRefresh && changePointsCache && (Date.now() - changePointsCacheAt < CHANGE_POINTS_CACHE_TTL_MS)) {
    return changePointsCache;
  }
  try {
    const q = query(collection(db, 'changePoints'), orderBy('createdAt', 'desc'), limit(200));
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
