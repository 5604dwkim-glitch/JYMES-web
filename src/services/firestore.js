import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, deleteField, query, where, orderBy, documentId, writeBatch, limit, runTransaction, addDoc, serverTimestamp, increment, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { CAR_MODELS } from '../constants/masterData';
import { buildStatsUpdate } from './statsAggregator';
import { syncReportDowntimeToRepairAndChangePoint, cleanupReportDowntimeLinks } from './changePointAutoSync';
import { persistJointMoldDefaultsFromReport } from './jointMoldDefaults';
import { resolveGm9bqcProcessCode } from './gm9bqcGrunEngine';

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
  removeSlimCache('workers');
}

// ─────────────────────────────────────────────
// ①-2 경량(slim) 컬렉션 캐시 — 사진(base64 data:image)을 제거한 사본을 localStorage에 보관
//  - workers / molds / equipments 문서에는 사진이 base64로 통째로 들어 있어(합계 약 9.5MB)
//    로그인·대시보드·일보작성 진입마다 전량 다운로드되던 문제를 줄이기 위한 캐시.
//  - 새로고침·새 탭(QR 재접속)에도 유지되며, 저장 원본(Firestore 문서 구조)은 전혀 변경하지 않는다.
//  - 사진이 필요한 화면(작업자관리·금형관리·설비관리 등)은 기존 fetchWorkers / fetchMolds / fetchEquipments 를 계속 사용한다.
// ─────────────────────────────────────────────
const SLIM_CACHE_PREFIX = 'jymes_slim_v1_';
const slimInflight = new Map();

function removeSlimCache(name) {
  try {
    localStorage.removeItem(SLIM_CACHE_PREFIX + name);
  } catch {
    // localStorage 사용 불가 환경 무시
  }
}

function readSlimCache(name) {
  try {
    const raw = localStorage.getItem(SLIM_CACHE_PREFIX + name);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.data) || typeof parsed.timestamp !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSlimCache(name, data) {
  try {
    localStorage.setItem(SLIM_CACHE_PREFIX + name, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // 용량 초과 등은 무시 (다음 조회 때 다시 시도)
  }
}

function stripImageData(value) {
  if (typeof value === 'string') return value.startsWith('data:image') ? '' : value;
  if (Array.isArray(value)) return value.map(stripImageData);
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const out = {};
    Object.keys(value).forEach((k) => {
      out[k] = stripImageData(value[k]);
    });
    return out;
  }
  return value;
}

/**
 * 컬렉션 전체를 읽어 사진을 제거한 목록을 반환 (캐시가 maxAgeMs 이내면 네트워크 없이 즉시 반환)
 * 네트워크 오류 시에는 만료된 캐시라도 있으면 그것을 반환해 화면이 멈추지 않도록 한다.
 */
async function loadSlimCollection(name, { maxAgeMs, forceRefresh = false, sorter = null } = {}) {
  if (!forceRefresh) {
    const cached = readSlimCache(name);
    if (cached && Date.now() - cached.timestamp < maxAgeMs) return cached.data;
  }
  if (slimInflight.has(name)) return slimInflight.get(name);

  const task = (async () => {
    try {
      const snap = await getDocs(collection(db, name));
      let data = snap.docs.map((d) => stripImageData({ id: d.id, ...d.data() }));
      if (sorter) data = data.sort(sorter);
      writeSlimCache(name, data);
      return data;
    } catch (error) {
      console.error(`Error fetching ${name} (slim):`, error);
      const stale = readSlimCache(name);
      return stale ? stale.data : [];
    } finally {
      slimInflight.delete(name);
    }
  })();
  slimInflight.set(name, task);
  return task;
}

const SLIM_WORKERS_MAX_AGE_MS = 30 * 60 * 1000;
const SLIM_MASTER_MAX_AGE_MS = 60 * 60 * 1000;

/** 로그인·일보작성·조회 화면용 작업자 목록 (사진 제외, 30분 캐시) */
export function fetchWorkersSlim(forceRefresh = false) {
  return loadSlimCollection('workers', {
    maxAgeMs: SLIM_WORKERS_MAX_AGE_MS,
    forceRefresh,
    sorter: (a, b) => String(a.id).localeCompare(String(b.id))
  });
}

/** 일보작성·대시보드·분석용 금형 목록 (사진 제외, 기본 60분 캐시) */
export function fetchMoldsSlim({ maxAgeMs = SLIM_MASTER_MAX_AGE_MS, forceRefresh = false } = {}) {
  return loadSlimCollection('molds', { maxAgeMs, forceRefresh });
}

/** 대시보드·분석용 설비 목록 (사진 제외, 기본 60분 캐시) */
export function fetchEquipmentsSlim({ maxAgeMs = SLIM_MASTER_MAX_AGE_MS, forceRefresh = false } = {}) {
  return loadSlimCollection('equipments', { maxAgeMs, forceRefresh });
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
const MY_RECENT_SESSION_PREFIX = 'jymes_my_recent_v1_';

export function invalidateReportsCache({ reset9bqcHistory = false } = {}) {
  reportCache.clear();
  myRecentReportsCache.clear();
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(MY_RECENT_SESSION_PREFIX)) {
        sessionStorage.removeItem(k);
      }
    }
  } catch {
    // ignore storage errors
  }
  downtimeReportsCache = null; // 일보가 저장/수정/삭제되면 비가동 일보 캐시도 함께 무효화
  fmbReportsCache = null; // FMB보관실 월간 온·습도 대시보드 캐시도 함께 무효화
  stellantisReportsCache = null; // 주간 스텔란티스 실적 전용 캐시 무효화
  dailyStatsAllCache = null; // 일별 집계 캐시도 함께 무효화
  dailyStatsRecentCache = null;
  if (reset9bqcHistory) {
    reset9bqcPersistentCaches();
  }
  removeSlimCache('daily_stats');
  removeSlimCache('daily_stats_recent');
  removeSlimCache('downtime_reports');
  removeSlimCache('fmb_reports');
  removeSlimCache('stellantis_reports');
}

// 9BQC G/RUN 종합 현황판 전용 영구 캐시 + 변동분 증분 동기화 (localStorage + RAM)
// - 새로고침·재접속 시에도 캐시를 즉시 렌더링(0ms)하고, 이후 변동된 문서(updatedAtMs) 및 누락 날짜만 증분 조회
const GM9BQC_HISTORY_STORAGE_KEY = 'jymes_9bqc_grun_history_v1';
const GM9BQC_TODAY_STORAGE_KEY = 'jymes_9bqc_grun_today_v1';
const GM9BQC_PERSIST_TTL_MS = 24 * 60 * 60 * 1000; // 24시간마다 1회 안전 전체 정합성 확인 (삭제 문서 정리용)
const GM9BQC_TODAY_CACHE_TTL_MS = 10 * 60 * 1000;
const GM9BQC_DELTA_COOLDOWN_MS = 20 * 1000; // 20초 내 재진입/날짜 이동 시 중복 delta 조회 방지
const GM9BQC_MAX_RETENTION_DAYS = 45;

let gm9bqcCacheHydrated = false;
let gm9bqcHistoryIntervals = []; // [{ start: 'YYYY-MM-DD', end: 'YYYY-MM-DD', fetchedAt: number }]
const gm9bqcHistoryDocsById = new Map();
let gm9bqcLastDeltaSyncMs = 0;
let gm9bqcLastDeltaCheckedAt = 0;
let gm9bqcTodaySnapshotCache = { date: '', docs: null, fetchedAt: 0 };
const gm9bqcHistoryInflight = new Map();
let gm9bqcDeltaInflight = null;

function mergeDateIntervals(intervals) {
  if (!Array.isArray(intervals) || intervals.length === 0) return [];
  const sorted = intervals
    .filter((iv) => iv && iv.start && iv.end && iv.start <= iv.end)
    .map((iv) => ({ start: iv.start, end: iv.end, fetchedAt: Number(iv.fetchedAt) || Date.now() }))
    .sort((a, b) => a.start.localeCompare(b.start));
  const merged = [];
  for (const iv of sorted) {
    const prev = merged[merged.length - 1];
    if (!prev) {
      merged.push({ ...iv });
      continue;
    }
    const prevNextDay = shiftYmdString(prev.end, 1);
    if (iv.start <= prevNextDay) {
      if (iv.end > prev.end) prev.end = iv.end;
      prev.fetchedAt = Math.min(prev.fetchedAt, iv.fetchedAt);
    } else {
      merged.push({ ...iv });
    }
  }
  return merged;
}

function getTodayYmdLocal() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function persist9bqcHistoryCache() {
  try {
    const cutoffYmd = shiftYmdString(getTodayYmdLocal(), -GM9BQC_MAX_RETENTION_DAYS);
    const docsArr = [];
    gm9bqcHistoryDocsById.forEach((r) => {
      if (r?.date && r.date >= cutoffYmd) {
        docsArr.push(r);
      }
    });
    const trimmedIntervals = mergeDateIntervals(gm9bqcHistoryIntervals)
      .map((iv) => ({
        start: iv.start < cutoffYmd ? cutoffYmd : iv.start,
        end: iv.end,
        fetchedAt: iv.fetchedAt
      }))
      .filter((iv) => iv.start <= iv.end);

    localStorage.setItem(
      GM9BQC_HISTORY_STORAGE_KEY,
      JSON.stringify({
        v: 1,
        lastDeltaSyncMs: gm9bqcLastDeltaSyncMs,
        intervals: trimmedIntervals,
        docs: docsArr
      })
    );
  } catch {
    // localStorage 용량 초과 등 무시 (RAM 캐시는 유지)
  }
}

function hydrate9bqcHistoryCache() {
  if (gm9bqcCacheHydrated) return;
  gm9bqcCacheHydrated = true;
  try {
    const raw = localStorage.getItem(GM9BQC_HISTORY_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.v !== 1 || !Array.isArray(parsed.docs) || !Array.isArray(parsed.intervals)) {
      return;
    }
    const now = Date.now();
    const validIntervals = parsed.intervals.filter(
      (iv) => iv && iv.start && iv.end && now - (Number(iv.fetchedAt) || 0) < GM9BQC_PERSIST_TTL_MS
    );
    if (validIntervals.length === 0) return;

    gm9bqcHistoryIntervals = mergeDateIntervals(validIntervals);
    gm9bqcHistoryDocsById.clear();
    parsed.docs.forEach((r) => {
      if (r?.id && resolveGm9bqcProcessCode(r)) {
        gm9bqcHistoryDocsById.set(r.id, r);
      }
    });
    gm9bqcLastDeltaSyncMs = Number(parsed.lastDeltaSyncMs) || 0;
  } catch {
    // 손상된 캐시 무시
  }
}

function reset9bqcPersistentCaches() {
  gm9bqcCacheHydrated = true;
  gm9bqcHistoryIntervals = [];
  gm9bqcHistoryDocsById.clear();
  gm9bqcLastDeltaSyncMs = 0;
  gm9bqcLastDeltaCheckedAt = 0;
  gm9bqcTodaySnapshotCache = { date: '', docs: null, fetchedAt: 0 };
  try {
    localStorage.removeItem(GM9BQC_HISTORY_STORAGE_KEY);
    localStorage.removeItem(GM9BQC_TODAY_STORAGE_KEY);
  } catch {
    // ignore storage errors
  }
}

function isDateCoveredBy9bqcIntervals(dateStr) {
  if (!dateStr) return false;
  return gm9bqcHistoryIntervals.some((iv) => iv.start <= dateStr && dateStr <= iv.end);
}

function upsert9bqcCachedReports(reportList) {
  if (!Array.isArray(reportList) || reportList.length === 0) return;
  hydrate9bqcHistoryCache();
  const todayYmd = getTodayYmdLocal();
  let historyMutated = false;
  let todayMutated = false;

  reportList.forEach((raw) => {
    if (!raw?.id) return;
    const cleaned = stripImageData(raw);
    const isValid9bqc = Boolean(resolveGm9bqcProcessCode(cleaned));

    if (cleaned.date === todayYmd) {
      const prevDocs = Array.isArray(gm9bqcTodaySnapshotCache.docs)
        ? gm9bqcTodaySnapshotCache.docs
        : [];
      const nextDocs = prevDocs.filter((d) => d.id !== cleaned.id);
      if (isValid9bqc) nextDocs.push(cleaned);
      if (gm9bqcTodaySnapshotCache.date === todayYmd) {
        gm9bqcTodaySnapshotCache = {
          date: todayYmd,
          docs: nextDocs,
          fetchedAt: Date.now()
        };
        todayMutated = true;
      }
      return;
    }

    if (isValid9bqc && (gm9bqcHistoryIntervals.length === 0 || isDateCoveredBy9bqcIntervals(cleaned.date))) {
      gm9bqcHistoryDocsById.set(cleaned.id, cleaned);
      historyMutated = true;
    } else if (!isValid9bqc && gm9bqcHistoryDocsById.has(cleaned.id)) {
      gm9bqcHistoryDocsById.delete(cleaned.id);
      historyMutated = true;
    }
  });

  if (historyMutated) persist9bqcHistoryCache();
  if (todayMutated) {
    try {
      localStorage.setItem(GM9BQC_TODAY_STORAGE_KEY, JSON.stringify(gm9bqcTodaySnapshotCache));
    } catch {
      // ignore
    }
  }
}

function remove9bqcCachedReports(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return;
  hydrate9bqcHistoryCache();
  const idSet = new Set(ids);
  let historyMutated = false;

  idSet.forEach((id) => {
    if (gm9bqcHistoryDocsById.delete(id)) {
      historyMutated = true;
    }
  });
  if (historyMutated) persist9bqcHistoryCache();

  if (Array.isArray(gm9bqcTodaySnapshotCache.docs)) {
    const filtered = gm9bqcTodaySnapshotCache.docs.filter((d) => !idSet.has(d.id));
    if (filtered.length !== gm9bqcTodaySnapshotCache.docs.length) {
      gm9bqcTodaySnapshotCache = {
        ...gm9bqcTodaySnapshotCache,
        docs: filtered,
        fetchedAt: Date.now()
      };
      try {
        localStorage.setItem(GM9BQC_TODAY_STORAGE_KEY, JSON.stringify(gm9bqcTodaySnapshotCache));
      } catch {
        // ignore
      }
    }
  }
}

// 비가동 일보 캐시 (대시보드 "연계 현황"용, 15분) — 대시보드 재방문/새로고침 시 중복 읽기 방지
let downtimeReportsCache = null;
let downtimeReportsCacheAt = 0;
const DOWNTIME_REPORTS_CACHE_TTL_MS = 15 * 60 * 1000;

// FMB보관실 일보 캐시 (메인 대시보드 하단 월간 온·습도 현황용, 15분)
let fmbReportsCache = null;
let fmbReportsCacheAt = 0;
const FMB_REPORTS_CACHE_TTL_MS = 15 * 60 * 1000;

// 주간 스텔란티스 실적(반장 작업일보 + DT 클립머신) 전용 경량 캐시 (15분)
let stellantisReportsCache = null;
let stellantisReportsCacheAt = 0;
const STELLANTIS_REPORTS_CACHE_TTL_MS = 15 * 60 * 1000;

// 일별 통계(daily_stats) 전체/최근 캐시 (메인 대시보드 ↔ 공정 및 불량 분석 간 중복 읽기 방지, 10분)
let dailyStatsAllCache = null;
let dailyStatsAllCacheAt = 0;
let dailyStatsRecentCache = null;
let dailyStatsRecentCacheAt = 0;
let dailyStatsRecentSince = '';
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
export function invalidateMoldsCache({ keepSlim = false } = {}) {
  moldsCache = null;
  moldsCacheAt = 0;
  if (!keepSlim) removeSlimCache('molds');
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
  removeSlimCache('equipments');
}

// ─────────────────────────────────────────────
// ④-2 Equipment Sets 캐시 (인메모리, TTL 5분)
// ─────────────────────────────────────────────
let equipmentSetsCache = null;
let equipmentSetsCacheAt = 0;
const EQUIPMENT_SETS_CACHE_TTL_MS = 5 * 60 * 1000;

export function invalidateEquipmentSetsCache() {
  equipmentSetsCache = null;
  equipmentSetsCacheAt = 0;
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
    const { searchQuery, ...serverFilters } = filters;
    // 서버 쿼리는 날짜 범위(startDate/endDate)만 사용하므로 캐시 키를 기간으로 통일하여
    // 차종/공정/상태/작업자 필터 변경 시 동일 기간 데이터를 Firestore에서 다시 읽지 않도록 한다.
    const dateRangeKey = {
      startDate: serverFilters.startDate || '',
      endDate: serverFilters.endDate || ''
    };

    let baseResult = getReportsFromCache(dateRangeKey);

    if (!baseResult) {
      let q = collection(db, REPORTS_COLLECTION);
      const constraints = [];

      if (dateRangeKey.startDate) constraints.push(where('date', '>=', dateRangeKey.startDate));
      if (dateRangeKey.endDate)   constraints.push(where('date', '<=', dateRangeKey.endDate));

      if (constraints.length > 0) {
        q = query(q, ...constraints);
      } else {
        // 날짜 범위가 모두 비어 있을 때는 전 컬렉션 무한 스캔 대신 최신 500건으로 제한
        q = query(q, orderBy(documentId(), 'desc'), limit(500));
      }

      const querySnapshot = await getDocs(q);
      baseResult = [];
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
        baseResult.push(r);
      });

      baseResult = baseResult.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.id || '').localeCompare(a.id || ''));

      // 기간 전체 원본 결과를 캐시에 저장
      setReportsCache(dateRangeKey, baseResult);
    }

    let result = baseResult;

    // 차종/공정/상태/작업자 필터는 캐시된 기간 데이터 위에서 메모리 필터로 처리 (추가 Firestore 읽기 0회)
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
    if (!forceRefresh && (!downtimeReportsCache || expired)) {
      const local = readSlimCache('downtime_reports');
      if (local && Date.now() - local.timestamp < DOWNTIME_REPORTS_CACHE_TTL_MS) {
        downtimeReportsCache = local.data;
        downtimeReportsCacheAt = local.timestamp;
      }
    }
    const stillExpired = Date.now() - downtimeReportsCacheAt > DOWNTIME_REPORTS_CACHE_TTL_MS;
    if (forceRefresh || !downtimeReportsCache || stillExpired) {
      if (!forceRefresh && slimInflight.has('downtime_reports')) {
        await slimInflight.get('downtime_reports');
      } else {
        const task = (async () => {
          const q = query(collection(db, REPORTS_COLLECTION), where('downtimeMinutes', '>', 0));
          const snap = await getDocs(q);
          downtimeReportsCache = snap.docs
            .map((d) => stripImageData({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.id || '').localeCompare(a.id || ''));
          downtimeReportsCacheAt = Date.now();
          writeSlimCache('downtime_reports', downtimeReportsCache);
          return downtimeReportsCache;
        })();
        slimInflight.set('downtime_reports', task);
        try {
          await task;
        } finally {
          slimInflight.delete('downtime_reports');
        }
      }
    }
    return (downtimeReportsCache || []).filter((r) => !sinceDate || (r.date || '') >= sinceDate);
  } catch (error) {
    console.error('Error fetching downtime reports:', error);
    return [];
  }
}

/**
 * FMB보관실(#9004) 일보만 단일 조건으로 조회 (메인 대시보드 하단 월간 온·습도 현황용)
 */
export async function fetchFmbReports(forceRefresh = false) {
  try {
    const expired = Date.now() - fmbReportsCacheAt > FMB_REPORTS_CACHE_TTL_MS;
    if (!forceRefresh && (!fmbReportsCache || expired)) {
      const local = readSlimCache('fmb_reports');
      if (local && Date.now() - local.timestamp < FMB_REPORTS_CACHE_TTL_MS) {
        fmbReportsCache = local.data;
        fmbReportsCacheAt = local.timestamp;
      }
    }
    const stillExpired = Date.now() - fmbReportsCacheAt > FMB_REPORTS_CACHE_TTL_MS;
    if (forceRefresh || !fmbReportsCache || stillExpired) {
      if (!forceRefresh && slimInflight.has('fmb_reports')) {
        return await slimInflight.get('fmb_reports');
      }
      const task = (async () => {
        let snap;
        try {
          const qLimited = query(
            collection(db, REPORTS_COLLECTION),
            where('processName', '==', 'FMB보관실'),
            orderBy(documentId(), 'desc'),
            limit(240)
          );
          snap = await getDocs(qLimited);
        } catch {
          const qFallback = query(collection(db, REPORTS_COLLECTION), where('processName', '==', 'FMB보관실'));
          snap = await getDocs(qFallback);
        }
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
        writeSlimCache('fmb_reports', fmbReportsCache);
        return fmbReportsCache;
      })();
      slimInflight.set('fmb_reports', task);
      try {
        await task;
      } finally {
        slimInflight.delete('fmb_reports');
      }
    }
    return fmbReportsCache || [];
  } catch (error) {
    console.error('Error fetching FMB storage reports:', error);
    return [];
  }
}

/**
 * 주간 스텔란티스 실적(반장 작업일보 + DT 클립머신 실적) 전용 경량 조회
 * 단일 필드 인덱스만 사용하여 복합 인덱스 없이 전체 공장 일보 대신 대상 일보만 빠르게 읽는다.
 */
export async function fetchStellantisAnalyticsReports(forceRefresh = false) {
  try {
    const expired = Date.now() - stellantisReportsCacheAt > STELLANTIS_REPORTS_CACHE_TTL_MS;
    if (!forceRefresh && (!stellantisReportsCache || expired)) {
      const local = readSlimCache('stellantis_reports');
      if (local && Date.now() - local.timestamp < STELLANTIS_REPORTS_CACHE_TTL_MS) {
        stellantisReportsCache = local.data;
        stellantisReportsCacheAt = local.timestamp;
      }
    }
    const stillExpired = Date.now() - stellantisReportsCacheAt > STELLANTIS_REPORTS_CACHE_TTL_MS;
    if (!forceRefresh && stellantisReportsCache && !stillExpired) {
      return stellantisReportsCache;
    }
    if (!forceRefresh && slimInflight.has('stellantis_reports')) {
      return await slimInflight.get('stellantis_reports');
    }

    const task = (async () => {
      const col = collection(db, REPORTS_COLLECTION);
      const [leaderFlagSnap, leaderProcSnap, leaderWorkerSnap, clipSnap] = await Promise.all([
        getDocs(query(col, where('isLeaderForm', '==', true))),
        getDocs(query(col, where('processName', '==', '반장 작업일보'))),
        getDocs(query(col, where('workerName', '==', '장수미'))),
        getDocs(query(col, where('processName', '==', '클립머신')))
      ]);

      const merged = new Map();
      const collect = (snap) => {
        snap.forEach((docSnap) => {
          if (merged.has(docSnap.id)) return;
          const r = stripImageData({ id: docSnap.id, ...docSnap.data() });
          if (r.isLeaderForm || r.processName === '반장 작업일보') {
            r.carModel = '공통';
            r.itemName = '공통';
            r.processName = '반장 작업일보';
            r.isLeaderForm = true;
          }
          merged.set(docSnap.id, r);
        });
      };

      collect(leaderFlagSnap);
      collect(leaderProcSnap);
      collect(leaderWorkerSnap);
      collect(clipSnap);

      const list = Array.from(merged.values()).sort(
        (a, b) => (b.date || '').localeCompare(a.date || '') || (b.id || '').localeCompare(a.id || '')
      );
      stellantisReportsCache = list;
      stellantisReportsCacheAt = Date.now();
      writeSlimCache('stellantis_reports', list);
      return list;
    })();

    slimInflight.set('stellantis_reports', task);
    try {
      return await task;
    } finally {
      slimInflight.delete('stellantis_reports');
    }
  } catch (error) {
    console.error('Error fetching Stellantis analytics reports:', error);
    return stellantisReportsCache || [];
  }
}

export async function fetchDailyStats(startDate, forceRefresh = false) {
  try {
    const cacheValid = !forceRefresh && dailyStatsAllCache && (Date.now() - dailyStatsAllCacheAt < DAILY_STATS_CACHE_TTL_MS);
    if (cacheValid) {
      return startDate ? dailyStatsAllCache.filter((s) => (s.date || '') >= startDate) : dailyStatsAllCache;
    }
    if (!forceRefresh) {
      const localCached = readSlimCache('daily_stats');
      if (localCached && Date.now() - localCached.timestamp < DAILY_STATS_CACHE_TTL_MS) {
        dailyStatsAllCache = localCached.data;
        dailyStatsAllCacheAt = localCached.timestamp;
        return startDate ? dailyStatsAllCache.filter((s) => (s.date || '') >= startDate) : dailyStatsAllCache;
      }
      if (
        startDate &&
        dailyStatsRecentCache &&
        dailyStatsRecentSince &&
        dailyStatsRecentSince <= startDate &&
        Date.now() - dailyStatsRecentCacheAt < DAILY_STATS_CACHE_TTL_MS
      ) {
        return dailyStatsRecentCache.filter((s) => (s.date || '') >= startDate);
      }
    }
    const inflightKey = startDate ? `daily_stats:${startDate}` : 'daily_stats';
    if (!forceRefresh && slimInflight.has(inflightKey)) {
      return slimInflight.get(inflightKey);
    }
    const loadTask = (async () => {
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
        writeSlimCache('daily_stats', stats);
      }
      return stats;
    })();
    slimInflight.set(inflightKey, loadTask);
    loadTask.finally(() => slimInflight.delete(inflightKey));
    return await loadTask;
  } catch (e) {
    console.error('Error fetching daily stats', e);
    const stale = readSlimCache('daily_stats');
    if (stale) {
      return startDate ? stale.data.filter((s) => (s.date || '') >= startDate) : stale.data;
    }
    return [];
  }
}

/**
 * 대시보드·공정불량분석 초기 진입용 최근 N일 daily_stats 고속 조회 (기본 90일)
 * - 전체 기간 수백 건 대신 기본 30일 + 전월 동기 비교에 충분한 최근 구간만 우선 조회·캐싱한다.
 * - 최근 90일 내 가동 실적이 전혀 없는 경우에만 전체 기간 조회로 자동 폴백한다.
 */
export async function fetchRecentDailyStats(days = 90, forceRefresh = false) {
  const sinceDate = new Date(Date.now() - days * 86400000).toLocaleDateString('sv-SE');
  if (!forceRefresh) {
    if (dailyStatsAllCache && Date.now() - dailyStatsAllCacheAt < DAILY_STATS_CACHE_TTL_MS) {
      const sliced = dailyStatsAllCache.filter((s) => (s.date || '') >= sinceDate);
      return sliced.length > 0 ? sliced : dailyStatsAllCache;
    }
    const fullLocal = readSlimCache('daily_stats');
    if (fullLocal && Date.now() - fullLocal.timestamp < DAILY_STATS_CACHE_TTL_MS) {
      dailyStatsAllCache = fullLocal.data;
      dailyStatsAllCacheAt = fullLocal.timestamp;
      const sliced = fullLocal.data.filter((s) => (s.date || '') >= sinceDate);
      return sliced.length > 0 ? sliced : fullLocal.data;
    }
    if (
      dailyStatsRecentCache &&
      dailyStatsRecentCache.length > 0 &&
      dailyStatsRecentSince <= sinceDate &&
      Date.now() - dailyStatsRecentCacheAt < DAILY_STATS_CACHE_TTL_MS
    ) {
      return dailyStatsRecentCache;
    }
    const recentLocal = readSlimCache('daily_stats_recent');
    if (
      recentLocal &&
      recentLocal.data.length > 0 &&
      Date.now() - recentLocal.timestamp < DAILY_STATS_CACHE_TTL_MS
    ) {
      dailyStatsRecentCache = recentLocal.data;
      dailyStatsRecentCacheAt = recentLocal.timestamp;
      dailyStatsRecentSince = recentLocal.data[0]?.date || sinceDate;
      return recentLocal.data;
    }
  }

  if (!forceRefresh && slimInflight.has('daily_stats_recent')) {
    return slimInflight.get('daily_stats_recent');
  }

  const task = (async () => {
    const stats = await fetchDailyStats(sinceDate, forceRefresh);
    if (stats.length === 0) {
      return fetchDailyStats(null, forceRefresh);
    }
    dailyStatsRecentCache = stats;
    dailyStatsRecentCacheAt = Date.now();
    dailyStatsRecentSince = sinceDate;
    writeSlimCache('daily_stats_recent', stats);
    return stats;
  })();

  slimInflight.set('daily_stats_recent', task);
  task.finally(() => slimInflight.delete('daily_stats_recent'));
  return task;
}

/** 사이드바 호버 시 공정·불량 분석 초기 데이터 사전 워밍 */
export function prefetchAnalyticsData() {
  fetchRecentDailyStats(90, false).catch(() => {});
}

export async function fetchMyRecentReports(workerName) {
  if (!workerName) return [];
  const cached = myRecentReportsCache.get(workerName);
  if (cached && Date.now() - cached.timestamp < MY_RECENT_CACHE_TTL_MS) {
    return cached.data;
  }
  try {
    const rawSession = sessionStorage.getItem(MY_RECENT_SESSION_PREFIX + workerName);
    if (rawSession) {
      const parsed = JSON.parse(rawSession);
      if (parsed && Array.isArray(parsed.data) && Date.now() - parsed.timestamp < MY_RECENT_CACHE_TTL_MS) {
        myRecentReportsCache.set(workerName, parsed);
        return parsed.data;
      }
    }
  } catch {
    // ignore storage errors
  }

  const saveWorkerRecentCache = (list) => {
    const entry = { data: list, timestamp: Date.now() };
    myRecentReportsCache.set(workerName, entry);
    try {
      sessionStorage.setItem(MY_RECENT_SESSION_PREFIX + workerName, JSON.stringify(entry));
    } catch {
      // ignore storage errors
    }
  };

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
    saveWorkerRecentCache(top3);
    return top3;
  } catch {
    // 복합 인덱스 미생성 환경 폴백: 해당 작업자 일보를 가져와 날짜·ID 내림차순 정렬 후 최신 3건 반환
    try {
      const qFallback = query(
        collection(db, REPORTS_COLLECTION),
        where('workerName', '==', workerName)
      );
      const snap = await getDocs(qFallback);
      const top3 = sortNewest(snap.docs.map((d) => ({ id: d.id, ...d.data() }))).slice(0, 3);
      saveWorkerRecentCache(top3);
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
  const wasSubmitted = Boolean(
    existingReport &&
      isSubmittedReportStatus(existingReport.status) &&
      existingReport.moldStrokesProcessed
  );
  const isNowSubmitted = Boolean(reportData && isSubmittedReportStatus(reportData.status));
  if (!wasSubmitted && !isNowSubmitted) return false;

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

  const curTotals = isNowSubmitted ? collectStrokeTotals(reportData) : {};
  const prevTotals = wasSubmitted ? collectStrokeTotals(existingReport) : {};

  const strokeUpdates = {};
  new Set([...Object.keys(curTotals), ...Object.keys(prevTotals)]).forEach(target => {
    const diff = (curTotals[target] || 0) - (prevTotals[target] || 0);
    if (diff !== 0) strokeUpdates[target] = diff;
  });

  // [개선④] 경량 금형 캐시에서 차종·부품 우선 룩업 + 동일 금형 문서 ID 기준 증분 병합
  if (Object.keys(strokeUpdates).length > 0) {
    const allMolds = await fetchMoldsSlim(); // 사진 제외 경량 캐시 사용 (9MB+ 다운로드 방지)
    const moldById = {};
    const moldsByCodeOrNumber = new Map();
    allMolds.forEach(m => {
      moldById[m.id] = m;
      [m.code, m.moldNumber].forEach(token => {
        const key = token ? String(token).trim() : '';
        if (!key) return;
        if (!moldsByCodeOrNumber.has(key)) moldsByCodeOrNumber.set(key, []);
        moldsByCodeOrNumber.get(key).push(m);
      });
    });

    const refCar = String(reportData?.carModel || existingReport?.carModel || '').trim().toUpperCase();
    const refPart = String(reportData?.itemName || reportData?.itemCode || existingReport?.itemName || '').trim().toUpperCase();

    const resolveMoldDoc = (target) => {
      if (target.startsWith('id:')) return moldById[target.slice(3)] || null;
      const codeKey = target.slice(5);
      const candidates = moldsByCodeOrNumber.get(codeKey) || [];
      if (candidates.length <= 1) return candidates[0] || null;
      const carMatched = refCar ? candidates.filter(c => String(c.carModel || '').toUpperCase() === refCar) : [];
      const pool = carMatched.length > 0 ? carMatched : candidates;
      if (refPart) {
        const partMatched = pool.find(c => {
          const mp = String(c.partName || c.name || '').toUpperCase();
          return mp.includes(refPart) || refPart.includes(mp);
        });
        if (partMatched) return partMatched;
      }
      return pool[0];
    };

    // id: 와 code: 가 같은 금형 문서를 가리켜도 문서당 1회만 batch.update 되도록 합산
    const updatesByDocId = new Map();
    for (const [target, strokesToAdd] of Object.entries(strokeUpdates)) {
      if (strokesToAdd === 0) continue;
      const moldDoc = resolveMoldDoc(target);
      if (moldDoc?.id) {
        updatesByDocId.set(moldDoc.id, (updatesByDocId.get(moldDoc.id) || 0) + strokesToAdd);
      }
    }

    const batch = writeBatch(db);
    let hasBatch = false;
    updatesByDocId.forEach((delta, moldId) => {
      if (delta === 0) return;
      batch.update(doc(db, 'molds', moldId), {
        currentStrokes: increment(delta)
      });
      hasBatch = true;
    });
    if (hasBatch) {
      try {
        await batch.commit();
        // 타수 변경 시 금형 관리/대시보드 경량 캐시도 즉시 무효화해 누적 타수 지연 표시 방지
        invalidateMoldsCache();
      } catch (err) {
        console.error('Failed to update mold strokes:', err);
        return false;
      }
    }
  }
  return true;
}

async function recomputeDailyStatsForDates(dates) {
  const uniqueDates = [...new Set((dates || []).filter(Boolean))];
  for (const targetDate of uniqueDates) {
    await applyStatsUpdateSingleDate(null, { date: targetDate });
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

function mergeStatsSum(target, src) {
  for (const [k, v] of Object.entries(src)) {
    if (typeof v === 'number') {
      target[k] = (target[k] || 0) + v;
    } else if (v && typeof v === 'object') {
      if (!target[k]) target[k] = {};
      mergeStatsSum(target[k], v);
    }
  }
  return target;
}

async function applyStatsUpdateSingleDate(oldReport, newReport) {
  const targetDate = (newReport && newReport.date) || (oldReport && oldReport.date);
  if (!targetDate) return;

  try {
    // 증분(increment) 누적 오차·음수 드리프트를 원천 차단하기 위해
    // 해당 작업일자의 실제 reports 문서를 기준으로 daily_stats/{targetDate}를 멱등 재계산한다.
    const q = query(collection(db, REPORTS_COLLECTION), where('date', '==', targetDate));
    const snap = await getDocs(q);
    const rebuilt = {};
    snap.forEach((d) => {
      const r = { id: d.id, ...d.data() };
      const diff = buildStatsUpdate(null, r);
      if (Object.keys(diff).length > 0) {
        mergeStatsSum(rebuilt, diff);
      }
    });

    const statsRef = doc(db, 'daily_stats', targetDate);
    if (Object.keys(rebuilt).length > 0) {
      await setDoc(statsRef, rebuilt);
    } else {
      await deleteDoc(statsRef);
    }
    dailyStatsAllCache = null;
    removeSlimCache('daily_stats');
  } catch (error) {
    console.error('Failed to recompute daily_stats, falling back to increment:', error);
    try {
      const diff = buildStatsUpdate(oldReport, newReport);
      if (Object.keys(diff).length === 0) return;
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
      const statsRef = doc(db, 'daily_stats', targetDate);
      await setDoc(statsRef, increments, { merge: true });
      dailyStatsAllCache = null;
      removeSlimCache('daily_stats');
    } catch (fallbackErr) {
      console.error('Failed fallback daily_stats update:', fallbackErr);
    }
  }
}

export async function addReport(reportData) {
  try {
    const todayStr = new Date().toLocaleDateString('sv-SE');
    const prefix = `RPT-${todayStr.replace(/-/g, '')}-`;
    const counterRef = doc(db, 'counters', prefix);

    const { sanitizedItems, pendingPhotoSaves } = prepareDowntimeItemsForSave(reportData?.downtimeItems);
    const preparedReportData = sanitizedItems ? { ...reportData, downtimeItems: sanitizedItems } : reportData;

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

      const targetQty = Number(preparedReportData.targetQty) || 0;
      const actualQty = Number(preparedReportData.actualQty) || 0;
      const defectQty = Number(preparedReportData.defectQty) || 0;

      const attainmentRate = targetQty > 0 ? Number(((actualQty / targetQty) * 100).toFixed(1)) : 0;
      const defectRate = actualQty > 0 ? Number(((defectQty / actualQty) * 100).toFixed(2)) : 0;

      const carModel = preparedReportData.carModel || 'JG1';
      const carObj = CAR_MODELS.find(c => c.code === carModel);

      const reportObj = {
        ...preparedReportData,
        id: newId,
        date: preparedReportData.date || todayStr,
        workHours: preparedReportData.workHours || '08:00 ~ 17:00',
        shift: preparedReportData.shift || '주간',
        carModel: carModel,
        carModelName: carObj ? carObj.name : carModel,
        processId: preparedReportData.processId || '',
        processName: preparedReportData.processName || '검사포장',
        line: preparedReportData.line || '1라인',
        workerId: preparedReportData.workerId || 'EMP001',
        workerName: preparedReportData.workerName || '장수미',
        itemCode: preparedReportData.itemCode || '인벨트',
        itemName: preparedReportData.itemName || '인벨트',
        targetQty,
        actualQty,
        defectQty,
        attainmentRate,
        defectRate,
        materialLots: preparedReportData.materialLots || {},
        isLeaderForm: preparedReportData.isLeaderForm || false,
        isForkliftForm: preparedReportData.isForkliftForm || false,
        isSupportForm: preparedReportData.isSupportForm || false,
        formCode: preparedReportData.formCode || '',
        leaderFormItems: preparedReportData.leaderFormItems || [],
        attendanceData: preparedReportData.attendanceData || {},
        downtimeMinutes: Number(preparedReportData.downtimeMinutes) || 0,
        downtimeReason: preparedReportData.downtimeReason || '',
        notes: preparedReportData.notes || '',
        status: preparedReportData.status || '승인 대기',
        moldStrokesProcessed: isSubmittedReportStatus(preparedReportData.status || '승인 대기'),
        approver: preparedReportData.approver || '',
        approvedAt: preparedReportData.approvedAt || '',
        createdAt: new Date().toLocaleString('ko-KR'),
        updatedAtMs: Date.now()
      };

      Object.keys(reportObj).forEach(key => {
        if (reportObj[key] === undefined) delete reportObj[key];
      });

      const docRef = doc(collection(db, REPORTS_COLLECTION), newId);
      transaction.set(docRef, reportObj);

      return reportObj;
    });

    await saveDowntimePhotosBatch(newReport.id, pendingPhotoSaves);

    invalidateReportsCache();
    upsert9bqcCachedReports([newReport]);
    
    await applyStatsUpdate(null, newReport);
    await processMoldStrokes(newReport);
    try {
      await persistJointMoldDefaultsFromReport(newReport);
    } catch (moldPrefErr) {
      console.warn('Failed to persist joint mold defaults:', moldPrefErr);
    }
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

    const { sanitizedItems, pendingPhotoSaves } = prepareDowntimeItemsForSave(updatedFields?.downtimeItems);
    const cleanedFields = {
      ...updatedFields,
      ...(sanitizedItems ? { downtimeItems: sanitizedItems } : {}),
      updatedAtMs: Date.now()
    };
    Object.keys(cleanedFields).forEach(key => {
      if (cleanedFields[key] === undefined) delete cleanedFields[key];
    });
    await updateDoc(docRef, cleanedFields);
    await saveDowntimePhotosBatch(id, pendingPhotoSaves);
    if (sanitizedItems && Array.isArray(existingReport?.downtimeItems)) {
      const keptIds = new Set(sanitizedItems.map((it) => String(it?.photoId || '').trim()).filter(Boolean));
      const orphanIds = existingReport.downtimeItems
        .map((it) => String(it?.photoId || '').trim())
        .filter((pid) => pid && !keptIds.has(pid));
      if (orphanIds.length > 0) {
        await deleteDowntimePhotosByIds(orphanIds);
      }
    }
    invalidateReportsCache();

    if (existingReport) {
      const mergedReport = { ...existingReport, ...cleanedFields, id };
      upsert9bqcCachedReports([mergedReport]);
      await applyStatsUpdate(existingReport, mergedReport);
      // 임시저장 ↔ 제출완료 전환 및 제출완료 일보 수정 시 금형 타수 증감 반영
      try {
        const isNowSubmitted = isSubmittedReportStatus(mergedReport.status);
        const wasProcessed = Boolean(existingReport.moldStrokesProcessed);
        if (isNowSubmitted || wasProcessed) {
          const ok = await processMoldStrokes(mergedReport, existingReport);
          if (ok && isNowSubmitted && !wasProcessed) {
            await updateDoc(docRef, { moldStrokesProcessed: true });
          } else if (ok && !isNowSubmitted && wasProcessed) {
            await updateDoc(docRef, { moldStrokesProcessed: false });
          }
        }
      } catch (strokeErr) {
        console.error('Failed to process mold strokes on report update:', strokeErr);
      }
      try {
        await persistJointMoldDefaultsFromReport(mergedReport);
      } catch (moldPrefErr) {
        console.warn('Failed to persist updated joint mold defaults:', moldPrefErr);
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
    const existingReport = docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;

    await deleteDoc(docRef);
    invalidateReportsCache();
    remove9bqcCachedReports([id]);

    if (existingReport) {
      if (Array.isArray(existingReport.downtimeItems)) {
        const photoIds = existingReport.downtimeItems.map((it) => String(it?.photoId || '').trim()).filter(Boolean);
        if (photoIds.length > 0) await deleteDowntimePhotosByIds(photoIds);
      }
      await applyStatsUpdate(existingReport, null);
      try {
        await processMoldStrokes(null, existingReport);
      } catch (strokeErr) {
        console.error('Failed to revert mold strokes on report delete:', strokeErr);
      }
      try {
        await cleanupReportDowntimeLinks(existingReport);
      } catch (cleanupErr) {
        console.error('Failed to clean downtime repair/changePoint links on report delete:', cleanupErr);
      }
    }

    return true;
  } catch (error) {
    console.error('Error deleting report:', error);
    throw error;
  }
}

export async function bulkApproveReports(ids, approverName = '관리자') {
  try {
    const existingList = [];
    for (const id of ids) {
      const snap = await getDoc(doc(db, REPORTS_COLLECTION, id));
      if (snap.exists()) {
        existingList.push({ id: snap.id, ...snap.data() });
      }
    }

    const batch = writeBatch(db);
    const now = new Date().toLocaleString('ko-KR');
    const nowMs = Date.now();
    ids.forEach(id => {
      const docRef = doc(db, REPORTS_COLLECTION, id);
      batch.update(docRef, { status: '승인 완료', approver: approverName, approvedAt: now, updatedAtMs: nowMs });
    });
    await batch.commit();
    invalidateReportsCache();

    // 통계 반영 (반려/임시저장 일보가 승인 전환될 때도 날짜별 1회 멱등 재계산)
    await recomputeDailyStatsForDates(existingList.map((r) => r.date));

    // 금형 타수 및 비가동 연동 보완 (임시저장 -> 승인완료 전환 등)
    const updatedReports = [];
    for (const prevDoc of existingList) {
      const nextDoc = { ...prevDoc, status: '승인 완료', approver: approverName, approvedAt: now, updatedAtMs: nowMs };
      if (!prevDoc.moldStrokesProcessed) {
        try {
          const ok = await processMoldStrokes(nextDoc, prevDoc);
          if (ok) {
            await updateDoc(doc(db, REPORTS_COLLECTION, prevDoc.id), { moldStrokesProcessed: true });
            nextDoc.moldStrokesProcessed = true;
          }
        } catch (strokeErr) {
          console.error('Failed to apply mold strokes on bulk approve:', strokeErr);
        }
      }
      if (!isSubmittedReportStatus(prevDoc.status) || prevDoc.status === '반려') {
        try {
          await syncReportDowntimeToRepairAndChangePoint(nextDoc, prevDoc);
        } catch (syncErr) {
          console.error('Failed to sync downtime on bulk approve:', syncErr);
        }
      }
      updatedReports.push(nextDoc);
    }

    hydrate9bqcHistoryCache();
    if (updatedReports.length > 0) {
      upsert9bqcCachedReports(updatedReports);
    } else {
      const updatedCachedDocs = [];
      ids.forEach((id) => {
        const existing = gm9bqcHistoryDocsById.get(id)
          || (Array.isArray(gm9bqcTodaySnapshotCache.docs) ? gm9bqcTodaySnapshotCache.docs.find((d) => d.id === id) : null);
        if (existing) {
          updatedCachedDocs.push({ ...existing, status: '승인 완료', approver: approverName, approvedAt: now, updatedAtMs: nowMs });
        }
      });
      if (updatedCachedDocs.length > 0) upsert9bqcCachedReports(updatedCachedDocs);
    }
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
        existingReports.push({ id: docSnap.id, ...docSnap.data() });
      }
    }

    const batch = writeBatch(db);
    ids.forEach(id => {
      const docRef = doc(db, REPORTS_COLLECTION, id);
      batch.delete(docRef);
    });
    await batch.commit();
    invalidateReportsCache();
    remove9bqcCachedReports(ids);

    await recomputeDailyStatsForDates(existingReports.map((r) => r.date));

    for (const r of existingReports) {
      if (Array.isArray(r?.downtimeItems)) {
        const photoIds = r.downtimeItems.map((it) => String(it?.photoId || '').trim()).filter(Boolean);
        if (photoIds.length > 0) await deleteDowntimePhotosByIds(photoIds);
      }
      try {
        await processMoldStrokes(null, r);
      } catch (strokeErr) {
        console.error('Failed to revert mold strokes on bulk delete:', strokeErr);
      }
      try {
        await cleanupReportDowntimeLinks(r);
      } catch (cleanupErr) {
        console.error('Failed to clean downtime repair/changePoint links on bulk delete:', cleanupErr);
      }
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

// ─────────────────────────────────────────────
// 사진 분리 저장 (성능 개선)
//  - 작업자/금형/설비 사진(base64)은 본 문서가 아닌 별도 컬렉션에 보관해 목록 조회 시 함께 내려받지 않는다.
//  - worker_photos/{workerId}.photoData · mold_photos/{moldId}.moldPhoto · equipment_photos/{id}.equipmentPhoto(2)
//  - 읽기는 "분리 컬렉션 값 ?? 기존 본 문서 값" 순으로 처리하여 이전 데이터도 그대로 표시된다.
// ─────────────────────────────────────────────
const WORKER_PHOTOS_COLLECTION = 'worker_photos';
const MOLD_PHOTOS_COLLECTION = 'mold_photos';
const EQUIPMENT_PHOTOS_COLLECTION = 'equipment_photos';
const CALIBRATION_CERTIFICATES_COLLECTION = 'calibration_certificates';
const REPORT_DOWNTIME_PHOTOS_COLLECTION = 'report_downtime_photos';

const isPhotoDataUrl = (v) => typeof v === 'string' && v.startsWith('data:image');
const downtimePhotoCache = new Map();

function prepareDowntimeItemsForSave(items) {
  if (!Array.isArray(items)) return { sanitizedItems: null, pendingPhotoSaves: [] };
  const pendingPhotoSaves = [];
  const sanitizedItems = items.map((item, idx) => {
    if (!item || typeof item !== 'object') return item;
    const rawPhoto = item.photoDataUrl;
    let photoId = String(item.photoId || '').trim();
    const clean = { ...item };
    delete clean.photoDataUrl;
    if (isPhotoDataUrl(rawPhoto)) {
      if (!photoId) {
        photoId = `dtp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}_${idx}`;
      }
      clean.photoId = photoId;
      clean.hasPhoto = true;
      pendingPhotoSaves.push({ photoId, dataUrl: rawPhoto });
    } else if (photoId && clean.hasPhoto !== false) {
      clean.photoId = photoId;
      clean.hasPhoto = true;
    } else {
      delete clean.photoId;
      clean.hasPhoto = false;
    }
    return clean;
  });
  return { sanitizedItems, pendingPhotoSaves };
}

async function saveDowntimePhotosBatch(reportId, pendingPhotoSaves) {
  if (!Array.isArray(pendingPhotoSaves) || pendingPhotoSaves.length === 0) return;
  await Promise.all(
    pendingPhotoSaves.map(async ({ photoId, dataUrl }) => {
      downtimePhotoCache.set(photoId, dataUrl);
      try {
        await setDoc(doc(db, REPORT_DOWNTIME_PHOTOS_COLLECTION, photoId), {
          reportId: reportId || '',
          dataUrl,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Error saving downtime photo:', photoId, err);
      }
    })
  );
}

async function deleteDowntimePhotosByIds(photoIds) {
  if (!Array.isArray(photoIds) || photoIds.length === 0) return;
  await Promise.all(
    photoIds.map(async (photoId) => {
      if (!photoId) return;
      downtimePhotoCache.delete(photoId);
      try {
        await deleteDoc(doc(db, REPORT_DOWNTIME_PHOTOS_COLLECTION, photoId));
      } catch (err) {
        console.warn('Error deleting downtime photo:', photoId, err);
      }
    })
  );
}

export async function fetchReportDowntimePhoto(photoId) {
  if (!photoId) return '';
  if (downtimePhotoCache.has(photoId)) return downtimePhotoCache.get(photoId) || '';
  try {
    const snap = await getDoc(doc(db, REPORT_DOWNTIME_PHOTOS_COLLECTION, photoId));
    const url = snap.exists() ? String(snap.data()?.dataUrl || '') : '';
    if (url) downtimePhotoCache.set(photoId, url);
    return url;
  } catch (error) {
    console.warn('Error fetching downtime photo:', photoId, error);
    return '';
  }
}

export async function fetchReportDowntimePhotos(photoIds = []) {
  const uniqueIds = [...new Set((photoIds || []).map((id) => String(id || '').trim()).filter(Boolean))];
  const result = {};
  await Promise.all(
    uniqueIds.map(async (photoId) => {
      const url = await fetchReportDowntimePhoto(photoId);
      if (url) result[photoId] = url;
    })
  );
  return result;
}

export async function fetchTodayTpmLogsByDate(dateStr) {
  if (!dateStr) return [];
  try {
    const q = query(collection(db, 'tpm_logs'), where('reportDate', '==', dateStr));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.warn('Error fetching tpm_logs by date:', error);
    return [];
  }
}

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

    // 사진은 별도 컬렉션에서 합쳐서 반환 (작업자 관리·사원증 출력 화면용)
    try {
      const photoSnap = await getDocs(collection(db, WORKER_PHOTOS_COLLECTION));
      const photoMap = new Map();
      photoSnap.forEach((d) => {
        const pd = d.data()?.photoData;
        if (pd) photoMap.set(d.id, pd);
      });
      result.forEach((w) => {
        if (photoMap.has(w.id)) w.photoData = photoMap.get(w.id);
      });
    } catch (photoErr) {
      console.warn('Worker photos fetch skipped:', photoErr);
    }

    result = result.sort((a, b) => a.id.localeCompare(b.id));
    setWorkersCache(result);
    return result;
  } catch (error) {
    console.error('Error fetching workers:', error);
    return [];
  }
}

/** 작업자 문서와 사진을 분리해 저장 (사진이 data URL이면 worker_photos 에 먼저 기록한 뒤 본 문서에서 제거) */
async function splitWorkerPhoto(id, fields) {
  const { photoData, ...rest } = fields || {};
  const hasNewPhoto = isPhotoDataUrl(photoData);
  if (hasNewPhoto) {
    await setDoc(doc(db, WORKER_PHOTOS_COLLECTION, id), { photoData, updatedAt: new Date().toISOString() });
  } else if (typeof photoData === 'string' && photoData) {
    rest.photoData = photoData; // 외부 URL 등 용량이 작은 값은 그대로 유지
  }
  return { rest, hasNewPhoto };
}

export async function addWorker(workerData) {
  try {
    const { rest } = await splitWorkerPhoto(workerData.id, workerData);
    const docRef = doc(collection(db, WORKERS_COLLECTION), workerData.id);
    await setDoc(docRef, rest);
    invalidateWorkersCache();
    return workerData;
  } catch (error) {
    console.error('Error adding worker:', error);
    throw error;
  }
}

export async function updateWorker(id, updatedFields) {
  try {
    const { rest, hasNewPhoto } = await splitWorkerPhoto(id, updatedFields);
    const payload = { ...rest };
    if (hasNewPhoto) payload.photoData = deleteField(); // 본 문서에 남아 있던 기존 사진 제거
    if (Object.keys(payload).length > 0) {
      await updateDoc(doc(db, WORKERS_COLLECTION, id), payload);
    }
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
    try {
      await deleteDoc(doc(db, WORKER_PHOTOS_COLLECTION, id));
    } catch {
      // 사진 문서가 없거나 삭제 실패해도 작업자 삭제는 유지
    }
    invalidateWorkersCache();
    return true;
  } catch (error) {
    console.error('Error deleting worker:', error);
    throw error;
  }
}

// ── 금형 사진 ──
export async function fetchMoldPhoto(moldId) {
  if (!moldId) return '';
  try {
    const snap = await getDoc(doc(db, MOLD_PHOTOS_COLLECTION, moldId));
    return snap.exists() ? String(snap.data()?.moldPhoto || '') : '';
  } catch (error) {
    console.warn('Error fetching mold photo:', error);
    return '';
  }
}

/** photo 가 비어 있으면 사진 문서를 삭제, 있으면 저장 */
export async function saveMoldPhoto(moldId, photo) {
  const ref = doc(db, MOLD_PHOTOS_COLLECTION, moldId);
  if (photo) {
    await setDoc(ref, { moldPhoto: photo, updatedAt: new Date().toISOString() });
  } else {
    await deleteDoc(ref);
  }
}

// ── 설비 사진 (대표사진 2장) ──
export async function fetchEquipmentPhotos(equipmentId) {
  if (!equipmentId) return { equipmentPhoto: '', equipmentPhoto2: '' };
  try {
    const snap = await getDoc(doc(db, EQUIPMENT_PHOTOS_COLLECTION, equipmentId));
    const data = snap.exists() ? snap.data() : {};
    return {
      equipmentPhoto: String(data?.equipmentPhoto || ''),
      equipmentPhoto2: String(data?.equipmentPhoto2 || '')
    };
  } catch (error) {
    console.warn('Error fetching equipment photos:', error);
    return { equipmentPhoto: '', equipmentPhoto2: '' };
  }
}

/** patch: { equipmentPhoto?, equipmentPhoto2? } — data URL 이면 저장, 빈 문자열이면 해당 사진 제거 */
export async function saveEquipmentPhotos(equipmentId, patch) {
  const payload = { updatedAt: new Date().toISOString() };
  ['equipmentPhoto', 'equipmentPhoto2'].forEach((key) => {
    if (!(key in patch)) return;
    payload[key] = isPhotoDataUrl(patch[key]) ? patch[key] : deleteField();
  });
  await setDoc(doc(db, EQUIPMENT_PHOTOS_COLLECTION, equipmentId), payload, { merge: true });
}

// ── 계측기 검교정 인증서 스캔 파일 (PDF / 이미지 분리 저장) ──
export async function fetchCalibrationCertificate(certId) {
  if (!certId) return null;
  try {
    const snap = await getDoc(doc(db, CALIBRATION_CERTIFICATES_COLLECTION, certId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (error) {
    console.warn('Error fetching calibration certificate:', error);
    return null;
  }
}

export async function saveCalibrationCertificate(certId, { equipmentId, fileName, mimeType, dataUrl, fileSize }) {
  if (!certId || !dataUrl) return;
  await setDoc(doc(db, CALIBRATION_CERTIFICATES_COLLECTION, certId), {
    equipmentId: equipmentId || '',
    fileName: fileName || 'certificate',
    mimeType: mimeType || '',
    fileSize: Number(fileSize) || 0,
    dataUrl,
    updatedAt: new Date().toISOString()
  });
}

export async function deleteCalibrationCertificate(certId) {
  if (!certId) return;
  try {
    await deleteDoc(doc(db, CALIBRATION_CERTIFICATES_COLLECTION, certId));
  } catch (error) {
    console.warn('Error deleting calibration certificate:', error);
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

export async function fetchEquipmentSets(forceRefresh = false) {
  if (!forceRefresh && equipmentSetsCache && (Date.now() - equipmentSetsCacheAt < EQUIPMENT_SETS_CACHE_TTL_MS)) {
    return equipmentSetsCache;
  }
  if (!forceRefresh && slimInflight.has('equipment_sets')) {
    return slimInflight.get('equipment_sets');
  }
  const task = (async () => {
    try {
      const snap = await getDocs(collection(db, 'equipment_sets'));
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      equipmentSetsCache = data;
      equipmentSetsCacheAt = Date.now();
      return data;
    } catch (e) {
      console.warn('Error fetching equipment_sets:', e);
      return equipmentSetsCache || [];
    } finally {
      slimInflight.delete('equipment_sets');
    }
  })();
  slimInflight.set('equipment_sets', task);
  return task;
}

// [개선③] fetchChangePoints — 캐시 + 진행중 요청 공유 + limit(500)
export const fetchChangePoints = async (forceRefresh = false) => {
  if (!forceRefresh && changePointsCache && (Date.now() - changePointsCacheAt < CHANGE_POINTS_CACHE_TTL_MS)) {
    return changePointsCache;
  }
  if (!forceRefresh && slimInflight.has('change_points')) {
    return slimInflight.get('change_points');
  }
  const task = (async () => {
    try {
      const q = query(collection(db, 'changePoints'), orderBy('createdAt', 'desc'), limit(500));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      changePointsCache = data;
      changePointsCacheAt = Date.now();
      return data;
    } catch (error) {
      console.error('Error fetching change points:', error);
      throw error;
    } finally {
      slimInflight.delete('change_points');
    }
  })();
  slimInflight.set('change_points', task);
  return task;
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

// ==================== FMB STORAGE INVENTORY (#9004 고무실 실시간 재고) ====================
const FMB_INVENTORY_DOC_ID = 'current';

export async function fetchFmbInventory() {
  try {
    const snap = await getDoc(doc(db, 'fmb_inventory', FMB_INVENTORY_DOC_ID));
    if (snap.exists()) {
      const data = snap.data() || {};
      return {
        items: Array.isArray(data.items) ? data.items : [],
        alarmHistory: Array.isArray(data.alarmHistory) ? data.alarmHistory : [],
        lastReportDate: data.lastReportDate || '',
        updatedAt: data.updatedAt || '',
        fromServer: true
      };
    }

    // 최초 1회 부트스트랩: fmb_inventory 문서가 아직 없으면 직전 FMB 일보에서 잔여 재고 추출
    const recentReports = await fetchFmbReports();
    if (recentReports.length > 0) {
      const latest = recentReports[0];
      const seedItems = (Array.isArray(latest.f9004_items) ? latest.f9004_items : [])
        .filter((it) => {
          const tp = String(it?.f9004_type || '').trim();
          return tp !== '불출' && tp !== '불출(투입)' && tp !== '반납' && (it?.f9004_rubberName || it?.f9004_carModel);
        })
        .map((it, idx) => ({
          stockId: it.stockId || `stk_seed_${latest.id}_${idx}`,
          f9004_rubberName: String(it.f9004_rubberName ?? it.f9004_carModel ?? '').trim(),
          f9004_expiryDate: String(it.f9004_expiryDate ?? it.f9004_compoundLot ?? '').trim(),
          f9004_expiryIso: String(it.f9004_expiryIso || '').trim(),
          f9004_amount: String(it.f9004_amount || '').trim(),
          f9004_type: String(it.f9004_type || '재고').trim(),
          createdDate: String(it.createdDate || latest.date || '')
        }));
      return {
        items: seedItems,
        lastReportDate: latest.date || '',
        updatedAt: '',
        fromServer: true
      };
    }

    return { items: [], lastReportDate: '', updatedAt: '', fromServer: true };
  } catch (error) {
    console.warn('Error fetching FMB inventory:', error);
    return { items: [], lastReportDate: '', updatedAt: '', offlineError: true };
  }
}

export async function saveFmbInventory(items, meta = {}) {
  try {
    const fallbackDate = meta.reportDate || new Date().toLocaleDateString('sv-SE');
    const cleanItems = (Array.isArray(items) ? items : [])
      .map((it, idx) => ({
        stockId: it.stockId || `stk_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
        f9004_rubberName: String(it.f9004_rubberName || '').trim(),
        f9004_expiryDate: String(it.f9004_expiryDate || '').trim(),
        f9004_expiryIso: String(it.f9004_expiryIso || '').trim(),
        f9004_amount: String(it.f9004_amount || '').trim(),
        f9004_type: String(it.f9004_type || '재고').trim(),
        createdDate: String(it.createdDate || fallbackDate)
      }))
      .filter((it) => it.f9004_rubberName);

    const payload = {
      items: cleanItems,
      lastReportDate: fallbackDate,
      updatedBy: meta.workerName || '',
      updatedAt: new Date().toISOString()
    };
    if (Array.isArray(meta.alarmHistory)) {
      payload.alarmHistory = meta.alarmHistory;
    }

    await setDoc(doc(db, 'fmb_inventory', FMB_INVENTORY_DOC_ID), payload, { merge: true });
    return cleanItems;
  } catch (error) {
    console.error('Error saving FMB inventory:', error);
    throw error;
  }
}

export function subscribeFmbInventory(onUpdate) {
  try {
    const ref = doc(db, 'fmb_inventory', FMB_INVENTORY_DOC_ID);
    return onSnapshot(
      ref,
      async (snap) => {
        if (snap.exists()) {
          const data = snap.data() || {};
          onUpdate({
            items: Array.isArray(data.items) ? data.items : [],
            alarmHistory: Array.isArray(data.alarmHistory) ? data.alarmHistory : [],
            lastReportDate: data.lastReportDate || '',
            updatedAt: data.updatedAt || ''
          });
        } else {
          const seeded = await fetchFmbInventory();
          onUpdate({
            items: Array.isArray(seeded.items) ? seeded.items : [],
            alarmHistory: Array.isArray(seeded.alarmHistory) ? seeded.alarmHistory : [],
            lastReportDate: seeded.lastReportDate || '',
            updatedAt: seeded.updatedAt || ''
          });
        }
      },
      (err) => {
        console.warn('FMB inventory live listener warning:', err);
      }
    );
  } catch {
    return () => {};
  }
}

/**
 * 오늘(또는 지정 날짜)의 daily_stats 문서 1건을 실시간 감시 (대시보드 실시간 갱신용)
 * - 불필요한 전체 폴링(90일치 + 각종 컬렉션)을 대체하여 읽기 비용을 극적으로 절감(문서 1개 변경 시 1 read만 발생)
 * - 일보 등록/수정/삭제 시 applyStatsUpdate가 daily_stats/{date}를 갱신하므로 즉각 반영됨
 */
export function subscribeDailyStatsDate(dateStr, onUpdate) {
  if (!dateStr) return () => {};
  try {
    const ref = doc(db, 'daily_stats', dateStr);
    return onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const docData = snap.data() || {};
          const item = { id: snap.id, date: snap.id, ...docData };
          // 인메모리 캐시에도 단일 날짜 반영하여 다른 화면(분석 등) 이동 시 최신화 유지
          if (dailyStatsAllCache && Array.isArray(dailyStatsAllCache)) {
            const idx = dailyStatsAllCache.findIndex((s) => s.date === item.date);
            if (idx >= 0) {
              dailyStatsAllCache[idx] = { ...dailyStatsAllCache[idx], ...item };
            } else {
              dailyStatsAllCache = [item, ...dailyStatsAllCache];
            }
          }
          if (dailyStatsRecentCache && Array.isArray(dailyStatsRecentCache)) {
            const idx = dailyStatsRecentCache.findIndex((s) => s.date === item.date);
            if (idx >= 0) {
              dailyStatsRecentCache[idx] = { ...dailyStatsRecentCache[idx], ...item };
            } else {
              dailyStatsRecentCache = [item, ...dailyStatsRecentCache];
            }
          }
          onUpdate(item);
        } else {
          if (dailyStatsAllCache && Array.isArray(dailyStatsAllCache)) {
            dailyStatsAllCache = dailyStatsAllCache.filter((s) => s.date !== snap.id);
          }
          if (dailyStatsRecentCache && Array.isArray(dailyStatsRecentCache)) {
            dailyStatsRecentCache = dailyStatsRecentCache.filter((s) => s.date !== snap.id);
          }
          onUpdate({ id: snap.id, date: snap.id, _deleted: true });
        }
      },
      (err) => {
        console.warn('daily_stats date listener warning:', err);
      }
    );
  } catch (err) {
    console.warn('subscribeDailyStatsDate failed:', err);
    return () => {};
  }
}

function shiftYmdString(ymd, offsetDays) {
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function get9bqcTodaySnapshotCache(todayYmd) {
  if (!todayYmd) return null;
  if (gm9bqcTodaySnapshotCache.date !== todayYmd || !Array.isArray(gm9bqcTodaySnapshotCache.docs)) {
    try {
      const raw = localStorage.getItem(GM9BQC_TODAY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.date === todayYmd && Array.isArray(parsed.docs)) {
          gm9bqcTodaySnapshotCache = parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
  }
  if (gm9bqcTodaySnapshotCache.date !== todayYmd) return null;
  if (!Array.isArray(gm9bqcTodaySnapshotCache.docs)) return null;
  if (Date.now() - (gm9bqcTodaySnapshotCache.fetchedAt || 0) > GM9BQC_TODAY_CACHE_TTL_MS) return null;
  return gm9bqcTodaySnapshotCache.docs;
}

export function set9bqcTodaySnapshotCache(todayYmd, docs) {
  if (!todayYmd || !Array.isArray(docs)) return;
  gm9bqcTodaySnapshotCache = {
    date: todayYmd,
    docs: docs.filter((r) => Boolean(resolveGm9bqcProcessCode(r))).map(stripImageData),
    fetchedAt: Date.now()
  };
  try {
    localStorage.setItem(GM9BQC_TODAY_STORAGE_KEY, JSON.stringify(gm9bqcTodaySnapshotCache));
  } catch {
    // ignore storage errors
  }
}

function collectCached9bqcDocs(startDate, endDate) {
  const results = [];
  gm9bqcHistoryDocsById.forEach((r) => {
    if (r?.date && r.date >= startDate && r.date <= endDate) {
      results.push(r);
    }
  });
  return results;
}

function computeMissing9bqcRanges(startDate, endDate) {
  const sorted = [...gm9bqcHistoryIntervals].sort((a, b) => a.start.localeCompare(b.start));
  const missingRanges = [];
  let cursor = startDate;

  for (const iv of sorted) {
    if (iv.end < cursor) continue;
    if (iv.start > endDate) break;
    if (iv.start > cursor) {
      missingRanges.push({ start: cursor, end: shiftYmdString(iv.start, -1) });
    }
    const nextCursor = shiftYmdString(iv.end, 1);
    if (nextCursor > cursor) cursor = nextCursor;
    if (cursor > endDate) break;
  }
  if (cursor <= endDate) {
    missingRanges.push({ start: cursor, end: endDate });
  }
  return missingRanges;
}

/** 동기 캐시 조회: 화면 첫 프레임(0ms)에 즉시 기존 데이터를 그리기 위해 사용 */
export function get9bqcGrunHistoryCacheSync(startDate, endDate) {
  if (!startDate || !endDate || startDate > endDate) return [];
  hydrate9bqcHistoryCache();
  return collectCached9bqcDocs(startDate, endDate);
}

/** 요청한 날짜 구간이 영구 캐시로 이미 완전히 덮여 있는지 동기 확인 */
export function has9bqcGrunHistoryCoverageSync(startDate, endDate) {
  if (!startDate || !endDate || startDate > endDate) return false;
  hydrate9bqcHistoryCache();
  if (gm9bqcHistoryIntervals.length === 0) return false;
  return computeMissing9bqcRanges(startDate, endDate).length === 0;
}

/**
 * 마지막 동기화 이후 변경/추가된 문서(updatedAtMs >= lastDeltaSyncMs)만 증분 조회하여 캐시 갱신
 */
export async function sync9bqcGrunDelta({ startDate, endDate, onDeltaSynced = null } = {}) {
  hydrate9bqcHistoryCache();
  if (!gm9bqcLastDeltaSyncMs) return 0;
  const now = Date.now();
  if (now - gm9bqcLastDeltaCheckedAt < GM9BQC_DELTA_COOLDOWN_MS) return 0;
  if (gm9bqcDeltaInflight) return gm9bqcDeltaInflight;

  gm9bqcLastDeltaCheckedAt = now;
  const sinceMs = Math.max(0, gm9bqcLastDeltaSyncMs - 5000);

  gm9bqcDeltaInflight = (async () => {
    try {
      const q = query(
        collection(db, REPORTS_COLLECTION),
        where('updatedAtMs', '>=', sinceMs)
      );
      const snap = await getDocs(q);
      const syncedAt = Date.now();
      let changedCount = 0;

      snap.forEach((docSnap) => {
        const cleaned = stripImageData({ id: docSnap.id, ...docSnap.data() });
        const valid9bqc = Boolean(resolveGm9bqcProcessCode(cleaned));
        if (valid9bqc && isDateCoveredBy9bqcIntervals(cleaned.date)) {
          gm9bqcHistoryDocsById.set(cleaned.id, cleaned);
          changedCount += 1;
        } else if (!valid9bqc && gm9bqcHistoryDocsById.has(cleaned.id)) {
          gm9bqcHistoryDocsById.delete(cleaned.id);
          changedCount += 1;
        }
      });

      gm9bqcLastDeltaSyncMs = syncedAt;
      persist9bqcHistoryCache();

      if (changedCount > 0 && typeof onDeltaSynced === 'function' && startDate && endDate) {
        onDeltaSynced(collectCached9bqcDocs(startDate, endDate));
      }
      return changedCount;
    } catch (err) {
      console.warn('9BQC G/RUN delta sync skipped:', err?.message || err);
      return 0;
    } finally {
      gm9bqcDeltaInflight = null;
    }
  })();

  return gm9bqcDeltaInflight;
}

/**
 * 9BQC G/RUN 종합 현황판용 과거 일보 누적 구간 조회
 * - localStorage + RAM 캐시에 해당 구간이 이미 있으면 즉시(0ms) 반환하고, 백그라운드에서 updatedAtMs 변동분만 증분 반영
 * - 캐시에 없는 과거 날짜 구간만 추가로 getDocs 조회
 */
export async function fetch9bqcGrunHistoryWindow({
  startDate,
  endDate,
  forceRefresh = false,
  onDeltaSynced = null
} = {}) {
  if (!startDate || !endDate || startDate > endDate) return [];

  if (forceRefresh) {
    gm9bqcCacheHydrated = true;
    gm9bqcHistoryIntervals = [];
    gm9bqcHistoryDocsById.clear();
    gm9bqcLastDeltaSyncMs = 0;
    gm9bqcLastDeltaCheckedAt = 0;
  } else {
    hydrate9bqcHistoryCache();
    const now = Date.now();
    gm9bqcHistoryIntervals = mergeDateIntervals(
      gm9bqcHistoryIntervals.filter((iv) => now - iv.fetchedAt < GM9BQC_PERSIST_TTL_MS)
    );
    if (gm9bqcHistoryIntervals.length === 0) {
      gm9bqcHistoryDocsById.clear();
    }
  }

  const missingRanges = computeMissing9bqcRanges(startDate, endDate);

  if (missingRanges.length > 0) {
    await Promise.all(
      missingRanges.map(async (range) => {
        if (range.start > range.end) return;
        const inflightKey = `${range.start}~${range.end}`;
        let promise = gm9bqcHistoryInflight.get(inflightKey);
        if (!promise) {
          promise = (async () => {
            const q = query(
              collection(db, REPORTS_COLLECTION),
              where('date', '>=', range.start),
              where('date', '<=', range.end)
            );
            const snap = await getDocs(q);
            const fetchedAt = Date.now();
            snap.forEach((docSnap) => {
              const r = stripImageData({ id: docSnap.id, ...docSnap.data() });
              if (resolveGm9bqcProcessCode(r)) {
                gm9bqcHistoryDocsById.set(r.id, r);
              }
            });
            gm9bqcHistoryIntervals = mergeDateIntervals([
              ...gm9bqcHistoryIntervals,
              { start: range.start, end: range.end, fetchedAt }
            ]);
            if (!gm9bqcLastDeltaSyncMs || fetchedAt > gm9bqcLastDeltaSyncMs) {
              gm9bqcLastDeltaSyncMs = fetchedAt;
            }
          })();
          gm9bqcHistoryInflight.set(inflightKey, promise);
        }
        try {
          await promise;
        } finally {
          gm9bqcHistoryInflight.delete(inflightKey);
        }
      })
    );
    gm9bqcLastDeltaCheckedAt = Date.now();
    persist9bqcHistoryCache();
  } else if (!forceRefresh && gm9bqcLastDeltaSyncMs > 0) {
    // 이미 캐시된 구간이므로 0ms로 즉시 반환하면서 백그라운드에서만 변동분(updatedAtMs) 증분 확인
    void sync9bqcGrunDelta({ startDate, endDate, onDeltaSynced });
  }

  return collectCached9bqcDocs(startDate, endDate);
}

