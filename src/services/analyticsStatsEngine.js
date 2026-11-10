/**
 * 대시보드 및 공정·불량 분석 공통 집계 엔진 (순수 함수 · DB 읽기 없음)
 * - daily_stats 문서를 기반으로 기간·비교기간·제조사·차종·세부부품·공정 다중 필터 집계를 수행한다.
 * - 비가동 일보 / 설비 / 금형 / 변동점 데이터를 결합해 설비·금형 영향 분석 지표를 계산한다.
 */
import { MANUFACTURERS, CAR_MODEL_PARTS } from '../constants/masterData';
import { extractDowntimeSlots, classifyDowntimeIssueKind } from './changePointAutoSync';
import { buildLinkedChains } from './downtimeChain';

export const PROC_OPTIONS = ['클립머신', '소재준비', '조인트', '후가공', '검사포장'];

export function sanitizeComboToken(str) {
  return String(str || '').replace(/[./\\[\]]/g, '_');
}

const UNSANITIZED_CAR_MAP = (() => {
  const m = new Map();
  MANUFACTURERS.forEach((mfg) => {
    (mfg.models || []).forEach((model) => {
      m.set(sanitizeComboToken(model.code), model.code);
    });
  });
  return m;
})();

const UNSANITIZED_PART_MAP = (() => {
  const m = new Map();
  Object.values(CAR_MODEL_PARTS).forEach((parts) => {
    (parts || []).forEach((p) => {
      m.set(sanitizeComboToken(p.code), p.code);
    });
  });
  return m;
})();

export function restoreCarCode(token) {
  return UNSANITIZED_CAR_MAP.get(token) || token;
}

export function restorePartCode(token) {
  return UNSANITIZED_PART_MAP.get(token) || token;
}

export function normalizeBaseProc(p) {
  return String(p || '')
    .replace(/-.+$/, '')
    .replace(/\(.*\)$/, '')
    .replace(/\s*V부$/, '')
    .trim();
}

export function procMatches(proc, filterProc) {
  if (!filterProc || filterProc === 'ALL') return true;
  return proc === filterProc || normalizeBaseProc(proc) === filterProc;
}

export function cleanDefectName(rawName, fromComboKey = false) {
  let s = String(rawName || '');
  if (fromComboKey) s = s.replace(/_/g, '/');
  return s
    .replace(/스카치/g, '스코치')
    .replace('[공통] 기타 (상세 미지정)', '[공통] 기타')
    .trim();
}

export function shortDefectLabel(fullName) {
  return String(fullName || '').replace(/^\[[^\]]+\]\s*/, '').trim() || String(fullName || '');
}

export function matchComboKey(comboKey, filters = {}) {
  const {
    filterMfg = 'ALL',
    filterCar = 'ALL',
    filterPart = 'ALL',
    filterProc = 'ALL'
  } = filters;
  const [car, part, proc] = String(comboKey || '').split('::');
  if (filterProc !== 'ALL' && !procMatches(proc, filterProc)) return false;
  const safeCar = filterCar === 'ALL' ? 'ALL' : sanitizeComboToken(filterCar);
  const safePart = filterPart === 'ALL' ? 'ALL' : sanitizeComboToken(filterPart);
  if (safeCar !== 'ALL' && car !== safeCar) return false;
  if (filterMfg !== 'ALL' && safeCar === 'ALL') {
    const mfg = MANUFACTURERS.find((m) => m.name === filterMfg);
    if (!mfg || !mfg.models.some((mod) => sanitizeComboToken(mod.code) === car)) return false;
  }
  if (safePart !== 'ALL' && part !== safePart) return false;
  return true;
}

export function isUnfiltered(filters = {}) {
  const {
    filterMfg = 'ALL',
    filterCar = 'ALL',
    filterPart = 'ALL',
    filterProc = 'ALL'
  } = filters;
  return filterMfg === 'ALL' && filterCar === 'ALL' && filterPart === 'ALL' && filterProc === 'ALL';
}

/**
 * 단일 daily_stats 문서에서 필터에 맞는 생산/목표/불량/세부불량 추출
 */
export function extractStatDayMetrics(statDoc, filters = {}) {
  const defects = {};
  const addDefect = (name, qty) => {
    const n = Number(qty || 0);
    if (n <= 0) return;
    defects[name] = (defects[name] || 0) + n;
  };

  if (isUnfiltered(filters)) {
    const actual = Math.max(0, Number(statDoc?.totalActualQty || 0));
    const target = Math.max(0, Number(statDoc?.totalTargetQty || 0));
    const defect = Math.max(0, Number(statDoc?.totalDefectQty || 0));
    const reports = Math.max(0, Number(statDoc?.totalReports || 0));
    let detailed = 0;
    if (statDoc?.defectBreakdowns) {
      Object.entries(statDoc.defectBreakdowns).forEach(([k, v]) => {
        const val = Number(v || 0);
        if (val > 0) {
          addDefect(cleanDefectName(k, false), val);
          detailed += val;
        }
      });
    }
    if (defect > detailed) addDefect('[공통] 기타', defect - detailed);
    return { actual, target, defect, reports, defects };
  }

  let actual = 0;
  let defect = 0;
  let detailed = 0;
  if (statDoc?.items) {
    Object.entries(statDoc.items).forEach(([comboKey, comboData]) => {
      if (!matchComboKey(comboKey, filters)) return;
      actual += Math.max(0, Number(comboData?.actualQty || 0));
      defect += Math.max(0, Number(comboData?.defectQty || 0));
      if (comboData?.defects) {
        Object.entries(comboData.defects).forEach(([k, v]) => {
          const val = Number(v || 0);
          if (val > 0) {
            addDefect(cleanDefectName(k, true), val);
            detailed += val;
          }
        });
      }
    });
  }
  if (defect > detailed) addDefect('[공통] 기타', defect - detailed);

  // 필터 적용 시 목표 수량은 일 전체 목표 대비 실적 비중으로 비례 추정 (0 나누기 방어)
  const dayTotalActual = Number(statDoc?.totalActualQty || 0);
  const dayTotalTarget = Number(statDoc?.totalTargetQty || 0);
  const target = dayTotalActual > 0 && dayTotalTarget > 0
    ? Math.round(dayTotalTarget * (actual / dayTotalActual))
    : 0;

  return { actual, target, defect, reports: 0, defects };
}

/**
 * YYYY-MM-DD 날짜 계산 헬퍼
 */
export function parseYmd(ymd) {
  const [y, m, d] = String(ymd || '').split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function formatYmd(dateObj) {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function shiftDays(ymd, deltaDays) {
  const dt = parseYmd(ymd);
  if (!dt) return ymd;
  dt.setDate(dt.getDate() + deltaDays);
  return formatYmd(dt);
}

export function shiftMonthsClamped(ymd, deltaMonths) {
  const dt = parseYmd(ymd);
  if (!dt) return ymd;
  const origDay = dt.getDate();
  const target = new Date(dt.getFullYear(), dt.getMonth() + deltaMonths, 1);
  const maxDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(origDay, maxDay));
  return formatYmd(target);
}

export function computeComparisonRange(startDate, endDate, compareMode) {
  if (!startDate || !endDate || compareMode === 'none') return null;
  if (compareMode === 'prevMonth') {
    return {
      startDate: shiftMonthsClamped(startDate, -1),
      endDate: shiftMonthsClamped(endDate, -1),
      label: '전월 동기'
    };
  }
  const s = parseYmd(startDate);
  const e = parseYmd(endDate);
  if (!s || !e) return null;
  const spanDays = Math.max(1, Math.round((e - s) / 86400000) + 1);
  return {
    startDate: shiftDays(startDate, -spanDays),
    endDate: shiftDays(startDate, -1),
    label: '이전 기간'
  };
}

/**
 * 메인 대시보드용: 금일/최근 가동일 KPI + 전일 대비 / 주간 평균 달성률 계산
 */
export function buildDashboardKpiSummary(dailyStats = []) {
  const sorted = [...dailyStats]
    .filter((r) => r?.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  const todayStr = formatYmd(new Date());
  const yesterdayStr = shiftDays(todayStr, -1);

  let targetIdx = sorted.findIndex((r) => r.date === todayStr);
  let targetDateLabel = `오늘 (${todayStr})`;
  if (targetIdx === -1 && sorted.length > 0) {
    targetIdx = sorted.length - 1;
    targetDateLabel = `최근 가동일 (${sorted[targetIdx].date})`;
  }

  const targetStats = targetIdx >= 0 ? sorted[targetIdx] : null;
  const prevStats = targetIdx > 0 ? sorted[targetIdx - 1] : null;

  const totalTarget = Math.max(0, Number(targetStats?.totalTargetQty || 0));
  const totalActual = Math.max(0, Number(targetStats?.totalActualQty || 0));
  const totalDefect = Math.max(0, Number(targetStats?.totalDefectQty || 0));
  const totalReports = Math.max(0, Number(targetStats?.totalReports || 0));
  const attainPct = totalTarget > 0 ? +((totalActual / totalTarget) * 100).toFixed(1) : 0;
  const defectRate = totalActual > 0
    ? +((totalDefect / totalActual) * 100).toFixed(2)
    : (totalDefect > 0 ? 100 : 0);

  let prevDayLabel = null;
  let prevActual = null;
  let actualDelta = null;
  let prevDefectRate = null;
  let defectRateDelta = null;

  if (prevStats) {
    prevDayLabel = prevStats.date === yesterdayStr
      ? '어제'
      : `전 가동일(${prevStats.date.slice(5).replace('-', '/')})`;
    prevActual = Math.max(0, Number(prevStats.totalActualQty || 0));
    actualDelta = totalActual - prevActual;
    const pDef = Math.max(0, Number(prevStats.totalDefectQty || 0));
    prevDefectRate = prevActual > 0 ? +((pDef / prevActual) * 100).toFixed(2) : (pDef > 0 ? 100 : 0);
    defectRateDelta = +(defectRate - prevDefectRate).toFixed(2);
  }

  // 기준일 포함 최근 7일 vs 직전 7일 평균 달성률 비교
  const anchorDate = targetStats?.date || todayStr;
  const weekStart = shiftDays(anchorDate, -6);
  const prevWeekStart = shiftDays(anchorDate, -13);
  const prevWeekEnd = shiftDays(anchorDate, -7);

  const calcRangeAttain = (from, to) => {
    let tSum = 0;
    let aSum = 0;
    sorted.forEach((r) => {
      if (r.date >= from && r.date <= to) {
        tSum += Math.max(0, Number(r.totalTargetQty || 0));
        aSum += Math.max(0, Number(r.totalActualQty || 0));
      }
    });
    return tSum > 0 ? +((aSum / tSum) * 100).toFixed(1) : null;
  };

  const weekAvgAttain = calcRangeAttain(weekStart, anchorDate);
  const prevWeekAvgAttain = calcRangeAttain(prevWeekStart, prevWeekEnd);
  const weekAttainDelta = (weekAvgAttain !== null && prevWeekAvgAttain !== null)
    ? +(weekAvgAttain - prevWeekAvgAttain).toFixed(1)
    : null;

  return {
    targetDate: targetStats?.date || todayStr,
    targetDateLabel,
    totalTarget,
    totalActual,
    totalDefect,
    totalReports,
    attainPct,
    defectRate,
    prevDayLabel,
    prevActual,
    actualDelta,
    prevDefectRate,
    defectRateDelta,
    weekAvgAttain,
    weekAttainDelta
  };
}

/**
 * 메인 대시보드용: 최근 7개 가동일 생산·목표·불량률 미니 추이
 */
export function buildLast7DaysMiniTrend(dailyStats = []) {
  const active = [...dailyStats]
    .filter((r) => r?.date && (Number(r.totalActualQty || 0) > 0 || Number(r.totalDefectQty || 0) > 0 || Number(r.totalReports || 0) > 0))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-7);

  const fullDates = active.map((r) => r.date);
  const labels = active.map((r) => r.date.slice(5).replace('-', '/'));
  const actuals = active.map((r) => Number(r.totalActualQty || 0));
  const targets = active.map((r) => Number(r.totalTargetQty || 0));
  const defects = active.map((r) => Number(r.totalDefectQty || 0));
  const rates = active.map((r) => {
    const a = Number(r.totalActualQty || 0);
    const d = Number(r.totalDefectQty || 0);
    return a > 0 ? +((d / a) * 100).toFixed(2) : 0;
  });

  const nonZeroTargets = targets.filter((t) => t > 0);
  const avgTarget = nonZeroTargets.length > 0
    ? Math.round(nonZeroTargets.reduce((s, v) => s + v, 0) / nonZeroTargets.length)
    : 0;

  return { labels, fullDates, actuals, targets, defects, rates, avgTarget };
}

/**
 * 메인 대시보드용: 이번 주 불량 유형 TOP 5 (월요일 오전 등 이번 주 데이터 0건이면 최근 7일 기준으로 자동 보완)
 */
export function buildThisWeekTop5Defects(dailyStats = []) {
  const now = new Date();
  const dow = now.getDay(); // 0=일, 1=월 ...
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMon);
  const weekStartStr = formatYmd(mon);

  const aggregate = (rows) => {
    const map = {};
    let total = 0;
    let detailed = 0;
    rows.forEach((r) => {
      const def = Number(r.totalDefectQty || 0);
      total += def;
      if (r.defectBreakdowns) {
        Object.entries(r.defectBreakdowns).forEach(([k, v]) => {
          const val = Number(v || 0);
          if (val > 0) {
            const name = cleanDefectName(k, false);
            map[name] = (map[name] || 0) + val;
            detailed += val;
          }
        });
      }
    });
    if (total > detailed) {
      map['[공통] 기타'] = (map['[공통] 기타'] || 0) + (total - detailed);
    }
    const list = Object.entries(map)
      .map(([name, qty]) => ({ name, shortName: shortDefectLabel(name), qty }))
      .filter((d) => d.qty > 0)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);
    return { list, total, maxQty: list[0]?.qty || 1 };
  };

  const thisWeekRows = dailyStats.filter((r) => (r?.date || '') >= weekStartStr);
  const weekAgg = aggregate(thisWeekRows);
  if (weekAgg.total > 0) {
    return { ...weekAgg, periodLabel: `이번 주 (${weekStartStr.slice(5).replace('-', '/')}~)` };
  }

  const sorted = [...dailyStats].filter((r) => r?.date).sort((a, b) => a.date.localeCompare(b.date));
  const last7 = sorted.slice(-7);
  const fallbackAgg = aggregate(last7);
  const rangeNote = last7.length > 0
    ? `최근 7가동일 (${last7[0].date.slice(5).replace('-', '/')}~${last7[last7.length - 1].date.slice(5).replace('-', '/')})`
    : '이번 주';
  return { ...fallbackAgg, periodLabel: rangeNote };
}

/**
 * 공정 및 불량 분석 ① 생산 추이 및 일자별 불량 매트릭스 계산
 */
export function buildTrendAnalysis({
  dailyStats = [],
  startDate,
  endDate,
  compareMode = 'prevMonth',
  groupMode = 'daily',
  filters = {}
}) {
  const sorted = [...dailyStats]
    .filter((r) => r?.date && (!startDate || r.date >= startDate) && (!endDate || r.date <= endDate))
    .sort((a, b) => a.date.localeCompare(b.date));

  const compRange = computeComparisonRange(startDate, endDate, compareMode);
  const compRows = compRange
    ? [...dailyStats]
        .filter((r) => r?.date && r.date >= compRange.startDate && r.date <= compRange.endDate)
        .sort((a, b) => a.date.localeCompare(b.date))
    : [];

  const groups = {};
  const byDefect = {};
  const addDefectCell = (name, key, qty) => {
    if (!(qty > 0)) return;
    if (!byDefect[name]) byDefect[name] = {};
    byDefect[name][key] = (byDefect[name][key] || 0) + qty;
  };

  let curActualSum = 0;
  let curTargetSum = 0;
  let curDefectSum = 0;
  let bestDay = null;
  let worstDay = null;

  sorted.forEach((r) => {
    const key = groupMode === 'monthly' ? r.date.slice(0, 7) : r.date.slice(0, 10);
    if (!groups[key]) groups[key] = { actual: 0, target: 0, defect: 0 };
    const m = extractStatDayMetrics(r, filters);
    groups[key].actual += m.actual;
    groups[key].target += m.target;
    groups[key].defect += m.defect;
    Object.entries(m.defects).forEach(([dName, dQty]) => addDefectCell(dName, key, dQty));

    curActualSum += m.actual;
    curTargetSum += m.target;
    curDefectSum += m.defect;

    if (m.actual > 0) {
      if (!bestDay || m.actual > bestDay.actual) bestDay = { date: r.date, actual: m.actual };
      if (!worstDay || m.actual < worstDay.actual) worstDay = { date: r.date, actual: m.actual };
    }
  });

  const labels = Object.keys(groups).sort();
  const actuals = labels.map((l) => groups[l].actual);
  const targets = labels.map((l) => groups[l].target);
  const defects = labels.map((l) => groups[l].defect);
  const rates = labels.map((l) => (groups[l].actual > 0 ? +((groups[l].defect / groups[l].actual) * 100).toFixed(2) : 0));

  // 비교 기간 집계
  let compActualSum = 0;
  let compTargetSum = 0;
  let compDefectSum = 0;
  const compGroups = {};
  compRows.forEach((r) => {
    const key = groupMode === 'monthly' ? r.date.slice(0, 7) : r.date.slice(0, 10);
    if (!compGroups[key]) compGroups[key] = { actual: 0, target: 0, defect: 0 };
    const m = extractStatDayMetrics(r, filters);
    compGroups[key].actual += m.actual;
    compGroups[key].target += m.target;
    compGroups[key].defect += m.defect;
    compActualSum += m.actual;
    compTargetSum += m.target;
    compDefectSum += m.defect;
  });

  const compKeys = Object.keys(compGroups).sort();
  // 비교 선은 인덱스 기준 매칭 (가동일 순서 대조)
  const compActualSeries = labels.map((_, idx) => (idx < compKeys.length ? compGroups[compKeys[idx]].actual : null));

  const curAttainPct = curTargetSum > 0 ? +((curActualSum / curTargetSum) * 100).toFixed(1) : null;
  const compAttainPct = compTargetSum > 0 ? +((compActualSum / compTargetSum) * 100).toFixed(1) : null;
  const curDefectRate = curActualSum > 0 ? +((curDefectSum / curActualSum) * 100).toFixed(2) : 0;
  const compDefectRate = compActualSum > 0 ? +((compDefectSum / compActualSum) * 100).toFixed(2) : null;

  const actualDeltaPct = compRange && compActualSum > 0
    ? +(((curActualSum - compActualSum) / compActualSum) * 100).toFixed(1)
    : null;
  const attainDeltaPt = (compRange && curAttainPct !== null && compAttainPct !== null)
    ? +(curAttainPct - compAttainPct).toFixed(1)
    : null;
  const defectRateDeltaPt = (compRange && compDefectRate !== null)
    ? +(curDefectRate - compDefectRate).toFixed(2)
    : null;

  const matrixRows = Object.entries(byDefect)
    .map(([name, perLabel]) => ({
      name,
      shortName: shortDefectLabel(name),
      perLabel,
      total: Object.values(perLabel).reduce((a, b) => a + b, 0)
    }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);

  const matrixTop10 = matrixRows.slice(0, 10);
  const matrixGrandTotal = matrixTop10.reduce((a, r) => a + r.total, 0);

  return {
    labels,
    effectiveMode: groupMode,
    actuals,
    targets,
    defects,
    rates,
    compRange,
    compActualSeries,
    summary: {
      actualSum: curActualSum,
      targetSum: curTargetSum,
      defectSum: curDefectSum,
      attainPct: curAttainPct,
      defectRate: curDefectRate,
      actualDeltaPct,
      attainDeltaPt,
      defectRateDeltaPt,
      bestDay,
      worstDay
    },
    defectTable: {
      rows: matrixTop10,
      grandTotal: matrixGrandTotal
    },
    defectBreakdown: {
      list: matrixRows.slice(0, 15).map((r) => ({ name: r.name, shortName: r.shortName, qty: r.total })),
      total: curDefectSum,
      maxQty: matrixRows[0]?.total || 1
    }
  };
}

/**
 * 공정 및 불량 분석 ② 불량 파레토 · 공정별/차종별 비교 · 자동 인사이트 계산
 */
export function buildParetoAnalysis({
  dailyStats = [],
  downtimeReports = [],
  startDate,
  endDate,
  compareMode = 'prevMonth',
  filters = {}
}) {
  const periodRows = [...dailyStats]
    .filter((r) => r?.date && (!startDate || r.date >= startDate) && (!endDate || r.date <= endDate))
    .sort((a, b) => a.date.localeCompare(b.date));

  const compRange = computeComparisonRange(startDate, endDate, compareMode);
  const compRows = compRange
    ? dailyStats.filter((r) => r?.date && r.date >= compRange.startDate && r.date <= compRange.endDate)
    : [];

  // 1) 파레토 불량 유형 집계
  const defectMap = {};
  let totalDefect = 0;
  let totalActual = 0;
  periodRows.forEach((r) => {
    const m = extractStatDayMetrics(r, filters);
    totalActual += m.actual;
    totalDefect += m.defect;
    Object.entries(m.defects).forEach(([k, v]) => {
      defectMap[k] = (defectMap[k] || 0) + v;
    });
  });

  const sortedDefects = Object.entries(defectMap)
    .map(([name, qty]) => ({ name, shortName: shortDefectLabel(name), qty }))
    .filter((d) => d.qty > 0)
    .sort((a, b) => b.qty - a.qty);

  const paretoItems = sortedDefects.slice(0, 10);
  const paretoBaseTotal = sortedDefects.reduce((s, d) => s + d.qty, 0) || 1;
  let running = 0;
  const paretoWithCum = paretoItems.map((it) => {
    running += it.qty;
    const sharePct = +((it.qty / paretoBaseTotal) * 100).toFixed(1);
    const cumPct = +((running / paretoBaseTotal) * 100).toFixed(1);
    return { ...it, sharePct, cumPct };
  });

  const top3Sum = sortedDefects.slice(0, 3).reduce((s, d) => s + d.qty, 0);
  const top3SharePct = sortedDefects.length > 0 ? +((top3Sum / paretoBaseTotal) * 100).toFixed(1) : 0;
  const focusTargets = sortedDefects.slice(0, 2).map((d) => d.shortName).join(' · ') || '—';

  // 2) 공정별 불량률 비교 (현재 차종/부품 조건 유지, 공정만 전체 비교)
  const procStats = {};
  PROC_OPTIONS.forEach((p) => { procStats[p] = { proc: p, actual: 0, defect: 0 }; });
  periodRows.forEach((r) => {
    if (!r.items) return;
    Object.entries(r.items).forEach(([comboKey, comboData]) => {
      if (!matchComboKey(comboKey, { ...filters, filterProc: 'ALL' })) return;
      const [, , rawProc] = comboKey.split('::');
      const base = PROC_OPTIONS.find((p) => procMatches(rawProc, p));
      if (!base) return;
      procStats[base].actual += Number(comboData?.actualQty || 0);
      procStats[base].defect += Number(comboData?.defectQty || 0);
    });
  });
  const processComparison = PROC_OPTIONS.map((p) => {
    const st = procStats[p];
    const rate = st.actual > 0 ? +((st.defect / st.actual) * 100).toFixed(2) : 0;
    return { ...st, rate };
  });

  // 3) 차종별 불량 상위 + 비교 기간 대비 증감(%p)
  const aggregateByCar = (rows) => {
    const map = {};
    rows.forEach((r) => {
      if (!r.items) return;
      Object.entries(r.items).forEach(([comboKey, comboData]) => {
        if (!matchComboKey(comboKey, { ...filters, filterCar: 'ALL', filterPart: 'ALL' })) return;
        const [sanCar] = comboKey.split('::');
        const car = restoreCarCode(sanCar);
        if (!car || car === '공통' || car === '기타') return;
        if (!map[car]) map[car] = { car, actual: 0, defect: 0 };
        map[car].actual += Number(comboData?.actualQty || 0);
        map[car].defect += Number(comboData?.defectQty || 0);
      });
    });
    return map;
  };
  const curCarMap = aggregateByCar(periodRows);
  const compCarMap = aggregateByCar(compRows);
  const carComparison = Object.values(curCarMap)
    .filter((c) => c.actual > 0 || c.defect > 0)
    .map((c) => {
      const rate = c.actual > 0 ? +((c.defect / c.actual) * 100).toFixed(2) : 0;
      const prev = compCarMap[c.car];
      const prevRate = prev && prev.actual > 0 ? +((prev.defect / prev.actual) * 100).toFixed(2) : null;
      const deltaPt = prevRate !== null ? +(rate - prevRate).toFixed(2) : null;
      return { ...c, rate, deltaPt };
    })
    .sort((a, b) => b.defect - a.defect || b.rate - a.rate)
    .slice(0, 6);

  // 4) 세부부품 드릴다운 후보 (차종 선택 시 표시)
  const partBreakdown = [];
  if (filters.filterCar && filters.filterCar !== 'ALL') {
    const pMap = {};
    periodRows.forEach((r) => {
      if (!r.items) return;
      Object.entries(r.items).forEach(([comboKey, comboData]) => {
        if (!matchComboKey(comboKey, { ...filters, filterPart: 'ALL' })) return;
        const [, sanPart] = comboKey.split('::');
        const part = restorePartCode(sanPart);
        if (!pMap[part]) pMap[part] = { part, actual: 0, defect: 0 };
        pMap[part].actual += Number(comboData?.actualQty || 0);
        pMap[part].defect += Number(comboData?.defectQty || 0);
      });
    });
    Object.values(pMap).forEach((p) => {
      partBreakdown.push({
        ...p,
        rate: p.actual > 0 ? +((p.defect / p.actual) * 100).toFixed(2) : 0
      });
    });
    partBreakdown.sort((a, b) => b.defect - a.defect);
  }

  // 5) 실데이터 기반 자동 분석 요약 3줄 생성
  const insights = [];
  if (sortedDefects.length > 0) {
    const top1 = sortedDefects[0];
    const top1Pct = ((top1.qty / paretoBaseTotal) * 100).toFixed(1);
    // 최근 7일 비중 확인
    const recentRows = periodRows.slice(-7);
    let recentTop1 = 0;
    let recentAll = 0;
    recentRows.forEach((r) => {
      const m = extractStatDayMetrics(r, filters);
      recentAll += m.defect;
      recentTop1 += Number(m.defects[top1.name] || 0);
    });
    const recentNote = recentAll > 0 && (recentTop1 / recentAll) > (top1.qty / paretoBaseTotal) * 1.08
      ? '최근 7일 비중이 더 높아 집중 점검이 필요합니다.'
      : '상위 원인 우선 개선 시 효과가 가장 큽니다.';
    const scopePrefix = [
      filters.filterCar !== 'ALL' ? filters.filterCar : '',
      filters.filterProc !== 'ALL' ? `${filters.filterProc} 공정` : ''
    ].filter(Boolean).join(' ') || '전체 공정';
    insights.push({
      tone: 'blue',
      text: `${scopePrefix}에서 「${top1.shortName}」 불량이 ${top1.qty.toLocaleString()}건(${top1Pct}%)으로 가장 큰 비중을 차지합니다. ${recentNote}`
    });
  } else {
    insights.push({
      tone: 'blue',
      text: '선택한 조건·기간에 집계된 불량 내역이 없습니다.'
    });
  }

  // 비가동 발생일 vs 무비가동일 불량률 대조 인사이트
  const dtByDate = {};
  downtimeReports.forEach((rep) => {
    const d = rep?.date;
    if (!d || (startDate && d < startDate) || (endDate && d > endDate)) return;
    if (filters.filterCar !== 'ALL' && rep.carModel !== filters.filterCar) return;
    if (filters.filterProc !== 'ALL' && !procMatches(rep.processName, filters.filterProc)) return;
    const mins = extractDowntimeSlots(rep).reduce((s, sl) => s + (Number(sl.minutes) || 0), 0) || Number(rep.downtimeMinutes || 0);
    if (mins > 0) dtByDate[d] = (dtByDate[d] || 0) + mins;
  });

  let dtAct = 0, dtDef = 0, dtDays = 0;
  let normAct = 0, normDef = 0;
  periodRows.forEach((r) => {
    const m = extractStatDayMetrics(r, filters);
    if (dtByDate[r.date] > 0) {
      dtDays += 1;
      dtAct += m.actual;
      dtDef += m.defect;
    } else {
      normAct += m.actual;
      normDef += m.defect;
    }
  });
  if (dtDays > 0 && dtAct > 0 && normAct > 0) {
    const dtRate = ((dtDef / dtAct) * 100).toFixed(2);
    const normRate = ((normDef / normAct) * 100).toFixed(2);
    insights.push({
      tone: Number(dtRate) > Number(normRate) ? 'red' : 'amber',
      text: `설비·금형 비가동이 발생한 ${dtDays}일의 평균 불량률은 ${dtRate}%로, 무비가동일 평균(${normRate}%) 대비 ${Number(dtRate) >= Number(normRate) ? `+${(Number(dtRate) - Number(normRate)).toFixed(2)}%p 높습니다.` : `${(Number(normRate) - Number(dtRate)).toFixed(2)}%p 낮습니다.`}`
    });
  } else {
    insights.push({
      tone: 'amber',
      text: dtDays === 0
        ? '선택 기간 내 기록된 설비·금형 비가동 일보가 없습니다.'
        : `선택 기간 내 설비·금형 비가동이 ${dtDays}일 기록되었습니다. 「설비·금형 영향」 탭에서 상세 내역을 확인하세요.`
    });
  }

  // 전기 대비 불량률 증감 인사이트
  if (compRange && compRows.length > 0) {
    let cAct = 0, cDef = 0;
    compRows.forEach((r) => {
      const m = extractStatDayMetrics(r, filters);
      cAct += m.actual;
      cDef += m.defect;
    });
    if (cAct > 0 && totalActual > 0) {
      const curR = +((totalDefect / totalActual) * 100).toFixed(2);
      const prevR = +((cDef / cAct) * 100).toFixed(2);
      const diff = +(curR - prevR).toFixed(2);
      insights.push({
        tone: diff <= 0 ? 'green' : 'red',
        text: diff < 0
          ? `${compRange.label} 대비 평균 불량률이 ${Math.abs(diff).toFixed(2)}%p 개선(${prevR}% → ${curR}%)되었습니다.`
          : diff > 0
            ? `${compRange.label} 대비 평균 불량률이 ${diff.toFixed(2)}%p 상승(${prevR}% → ${curR}%)했습니다.`
            : `${compRange.label}과 평균 불량률(${curR}%)이 동일합니다.`
      });
    }
  }

  return {
    totalDefect,
    totalActual,
    top3SharePct,
    focusTargets,
    paretoWithCum,
    processComparison,
    carComparison,
    partBreakdown,
    compLabel: compRange?.label || null,
    insights
  };
}

/**
 * 공정 및 불량 분석 ③ 설비·금형 영향 분석 계산
 */
export function buildEquipMoldImpact({
  dailyStats = [],
  downtimeReports = [],
  equipments = [],
  molds = [],
  changePoints = [],
  startDate,
  endDate,
  filters = {}
}) {
  const periodStats = [...dailyStats]
    .filter((r) => r?.date && (!startDate || r.date >= startDate) && (!endDate || r.date <= endDate))
    .sort((a, b) => a.date.localeCompare(b.date));

  // 연계 체인 전체 생성 후 선택 기간·조건으로 필터링
  const allChains = buildLinkedChains({
    reports: downtimeReports,
    equipments,
    molds,
    changePoints,
    sinceDate: startDate || ''
  });

  const periodChains = allChains.filter((c) => {
    const d = c.date || '';
    if (startDate && d < startDate) return false;
    if (endDate && d > endDate) return false;
    if (c.report) {
      if (filters.filterCar !== 'ALL' && c.report.carModel !== filters.filterCar) return false;
      if (filters.filterProc !== 'ALL' && !procMatches(c.report.processName, filters.filterProc)) return false;
    }
    return true;
  });

  // 1) 일별 비가동 분(설비/금형) vs 불량률
  const dtMinutesByDate = {};
  const assetAgg = new Map(); // key: `${kind}:${id}` -> { kind, id, name, code, minutes, count }

  const addAssetStat = (kind, owner, minutes) => {
    if (!owner?.id) return;
    const mapKey = `${kind}:${owner.id}`;
    const prev = assetAgg.get(mapKey) || {
      kind,
      id: owner.id,
      name: owner.name || owner.code || owner.id,
      code: owner.code || '',
      minutes: 0,
      count: 0
    };
    prev.minutes += Number(minutes || 0);
    prev.count += 1;
    assetAgg.set(mapKey, prev);
  };

  downtimeReports.forEach((rep) => {
    if (!rep || rep.status === '임시저장') return;
    const d = rep.date || '';
    if ((startDate && d < startDate) || (endDate && d > endDate)) return;
    if (filters.filterCar !== 'ALL' && rep.carModel !== filters.filterCar) return;
    if (filters.filterPart !== 'ALL' && (rep.itemCode || rep.itemName) !== filters.filterPart) return;
    if (filters.filterProc !== 'ALL' && !procMatches(rep.processName, filters.filterProc)) return;

    const slots = extractDowntimeSlots(rep);
    let repMins = 0;
    slots.forEach((sl) => {
      const m = Number(sl.minutes || 0);
      if (m <= 0) return;
      const kind = classifyDowntimeIssueKind(sl.reason);
      if (kind === 'equipment' || kind === 'mold' || !sl.reason) {
        repMins += m;
      }
    });
    if (repMins === 0 && Number(rep.downtimeMinutes || 0) > 0) {
      repMins = Number(rep.downtimeMinutes || 0);
    }
    if (repMins > 0) {
      dtMinutesByDate[d] = (dtMinutesByDate[d] || 0) + repMins;
    }
  });

  // 연계 체인에서 특정된 설비/금형별 비가동 분 및 수리 건수 집계
  periodChains.forEach((c) => {
    if (c.repair?.owner) {
      const mins = c.slot?.minutes || 0;
      addAssetStat(c.repair.kind, c.repair.owner, mins);
    }
  });

  const dateSet = new Set([
    ...periodStats.map((s) => s.date),
    ...Object.keys(dtMinutesByDate)
  ]);
  const statByDate = new Map(periodStats.map((s) => [s.date, s]));
  const timelineDates = Array.from(dateSet).sort();

  const dailyDowntime = [];
  let highDtAct = 0, highDtDef = 0, highDtDays = 0;
  let lowDtAct = 0, lowDtDef = 0;

  timelineDates.forEach((d) => {
    const st = statByDate.get(d);
    const m = st ? extractStatDayMetrics(st, filters) : { actual: 0, defect: 0 };
    const downMin = Number(dtMinutesByDate[d] || 0);
    if (m.actual === 0 && m.defect === 0 && downMin === 0) return;
    const rate = m.actual > 0 ? +((m.defect / m.actual) * 100).toFixed(2) : 0;
    dailyDowntime.push({
      date: d,
      label: d.slice(5).replace('-', '/'),
      downtimeMin: downMin,
      defectRate: rate,
      actual: m.actual,
      defect: m.defect,
      isHot: downMin >= 150
    });

    if (downMin >= 60) {
      highDtDays += 1;
      highDtAct += m.actual;
      highDtDef += m.defect;
    } else {
      lowDtAct += m.actual;
      lowDtDef += m.defect;
    }
  });

  const topAssets = Array.from(assetAgg.values())
    .sort((a, b) => b.minutes - a.minutes || b.count - a.count)
    .slice(0, 5);

  // 2) 금형 누적타수 구간별 금형 수 및 해당 차종 평균 불량률
  const carStatsMap = {};
  periodStats.forEach((r) => {
    if (!r.items) return;
    Object.entries(r.items).forEach(([comboKey, comboData]) => {
      const [sanCar] = comboKey.split('::');
      const car = restoreCarCode(sanCar);
      if (!carStatsMap[car]) carStatsMap[car] = { actual: 0, defect: 0 };
      carStatsMap[car].actual += Number(comboData?.actualQty || 0);
      carStatsMap[car].defect += Number(comboData?.defectQty || 0);
    });
  });

  const brackets = [
    { key: 'b0', label: '0 ~ 50%', min: 0, max: 50, color: '#34d399', molds: [], actual: 0, defect: 0 },
    { key: 'b50', label: '50 ~ 70%', min: 50, max: 70, color: '#60a5fa', molds: [], actual: 0, defect: 0 },
    { key: 'b70', label: '70 ~ 90%', min: 70, max: 90, color: '#f59e0b', molds: [], actual: 0, defect: 0 },
    { key: 'b90', label: '90% 이상', min: 90, max: Infinity, color: '#ef4444', molds: [], actual: 0, defect: 0 }
  ];

  molds.forEach((m) => {
    const cur = Number(m.currentStrokes || 0);
    const max = Math.max(1, Number(m.maxStrokes || 300000));
    const pct = (cur / max) * 100;
    const b = brackets.find((br) => pct >= br.min && pct < br.max) || brackets[0];
    b.molds.push(m);
    const car = m.carModel || '';
    if (car && carStatsMap[car]) {
      b.actual += carStatsMap[car].actual;
      b.defect += carStatsMap[car].defect;
    }
  });

  const moldBrackets = brackets.map((b) => ({
    key: b.key,
    label: b.label,
    color: b.color,
    moldCount: b.molds.length,
    rate: b.molds.length > 0 && b.actual > 0 ? +((b.defect / b.actual) * 100).toFixed(2) : null
  }));

  // 3) 비가동 → 수리 → 변동점 처리 현황 (기간 합계)
  const summaryRows = {
    equipment: { label: '설비', reportCount: 0, repairCount: 0, cpCount: 0, doneCount: 0 },
    mold: { label: '금형', reportCount: 0, repairCount: 0, cpCount: 0, doneCount: 0 },
    tpm: { label: 'TPM 이상', reportCount: null, repairCount: 0, cpCount: 0, doneCount: 0 }
  };

  periodChains.forEach((c) => {
    const bucket = c.origin === 'tpm' ? summaryRows.tpm : (c.kind === 'mold' ? summaryRows.mold : summaryRows.equipment);
    if (c.origin === 'report' && bucket.reportCount !== null) bucket.reportCount += 1;
    if (c.repair) bucket.repairCount += 1;
    if (c.cp) bucket.cpCount += 1;
    if (c.overall === 'done') bucket.doneCount += 1;
  });

  // 4) 상단 실데이터 인사이트 문구
  let bannerText = '';
  const highRate = highDtAct > 0 ? +((highDtDef / highDtAct) * 100).toFixed(2) : null;
  const lowRate = lowDtAct > 0 ? +((lowDtDef / lowDtAct) * 100).toFixed(2) : null;
  const urgentMoldCount = (moldBrackets[2].moldCount || 0) + (moldBrackets[3].moldCount || 0);

  if (highDtDays > 0 && highRate !== null && lowRate !== null) {
    const ratio = lowRate > 0 ? (highRate / lowRate).toFixed(1) : null;
    bannerText = `비가동 60분 이상 발생일(${highDtDays}일)의 평균 불량률은 ${highRate}%로, 일반 가동일(${lowRate}%)${ratio ? `의 약 ${ratio}배` : ' 대비'} 수준입니다.`;
  } else if (periodChains.length > 0) {
    bannerText = `선택 기간에 비가동·수리 연계 건이 총 ${periodChains.length}건(완료 ${periodChains.filter((c) => c.overall === 'done').length}건) 집계되었습니다.`;
  } else {
    bannerText = '선택 기간 내 설비·금형 비가동 및 수리 의뢰 내역이 없습니다.';
  }
  bannerText += urgentMoldCount > 0
    ? ` 현재 누적타수 70% 이상 점검 임박 금형은 ${urgentMoldCount}개입니다.`
    : ' 현재 누적타수 70% 이상 점검 임박 금형은 없습니다 (전 금형 정상 범위).';

  return {
    bannerText,
    dailyDowntime,
    topAssets,
    moldBrackets,
    chainSummary: [summaryRows.equipment, summaryRows.mold, summaryRows.tpm]
  };
}

/**
 * 공정 및 불량 분석 ④ 차종별 생산·불량 비중 계산
 */
export function buildCarShareAnalysis({
  dailyStats = [],
  startDate,
  endDate,
  filters = {}
}) {
  const rows = dailyStats.filter(
    (r) => r?.date && (!startDate || r.date >= startDate) && (!endDate || r.date <= endDate)
  );
  const map = {};
  rows.forEach((r) => {
    if (!r.items) return;
    Object.entries(r.items).forEach(([comboKey, comboData]) => {
      if (!matchComboKey(comboKey, { ...filters, filterCar: 'ALL' })) return;
      const [sanCar] = comboKey.split('::');
      const car = restoreCarCode(sanCar);
      if (!car || car === '공통') return;
      if (!map[car]) map[car] = { car, actual: 0, defect: 0 };
      map[car].actual += Number(comboData?.actualQty || 0);
      map[car].defect += Number(comboData?.defectQty || 0);
    });
  });

  const list = Object.values(map)
    .filter((c) => c.actual > 0 || c.defect > 0)
    .sort((a, b) => b.actual - a.actual);

  const totalActual = list.reduce((s, c) => s + c.actual, 0);
  const totalDefect = list.reduce((s, c) => s + c.defect, 0);

  const items = list.map((c) => ({
    ...c,
    prodSharePct: totalActual > 0 ? +((c.actual / totalActual) * 100).toFixed(1) : 0,
    defectSharePct: totalDefect > 0 ? +((c.defect / totalDefect) * 100).toFixed(1) : 0,
    defectRate: c.actual > 0 ? +((c.defect / c.actual) * 100).toFixed(2) : 0
  }));

  return { items, totalActual, totalDefect };
}
