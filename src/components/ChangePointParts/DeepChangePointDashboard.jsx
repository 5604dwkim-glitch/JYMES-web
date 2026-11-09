import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { CAR_MODELS } from '../../constants/masterData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  LineElement,
  LineController,
  PointElement,
  Tooltip,
  Legend
);

// 마스터 차종 코드 대소문자 정규화 맵 (예: OV1k / Ov1k -> OV1K, ne1a -> NE1a, lq2a -> LQ2a)
const CANONICAL_CAR_MAP = (() => {
  const map = new Map();
  CAR_MODELS.forEach((m) => {
    if (m?.code) {
      map.set(String(m.code).trim().toUpperCase(), m.code);
      map.set(String(m.code).replace(/\s+/g, '').toUpperCase(), m.code);
    }
  });
  // 자주 쓰이는 축약/변형 표기 보강
  map.set('KMKX', 'KM/KX');
  return map;
})();

export function normalizeCarModelName(rawCar) {
  const trimmed = String(rawCar || '').trim();
  if (!trimmed) return '미분류';

  const upper = trimmed.toUpperCase();
  const compact = trimmed.replace(/\s+/g, '').toUpperCase();

  if (CANONICAL_CAR_MAP.has(upper)) return CANONICAL_CAR_MAP.get(upper);
  if (CANONICAL_CAR_MAP.has(compact)) return CANONICAL_CAR_MAP.get(compact);

  // 설비명이 차종 칸에 잘못 기재된 레거시 항목 방어
  if (/압출기|프레스|절단기|펀칭기|클립|설비/.test(trimmed)) {
    return '공통(설비)';
  }

  // 기존 약칭(DS, DT, LQ2, CL4 등)은 대문자 통일하여 대소문자 파편화 방지
  return upper;
}

// 6대 4M·변동점 핵심 요인 그룹 정의
export const FACTOR_GROUPS = [
  { key: 'equip', shortLabel: '설비·TPM', label: '🔧 설비·TPM', color: '#2563eb', softBg: '#dbeafe' },
  { key: 'mold', shortLabel: '금형·지그', label: '🗜️ 금형·지그', color: '#7c3aed', softBg: '#ede9fe' },
  { key: 'man', shortLabel: '작업자(Man)', label: '👷 작업자(Man)', color: '#d97706', softBg: '#fef3c7' },
  { key: 'method', shortLabel: '조건·공법', label: '📐 조건·공법', color: '#0891b2', softBg: '#cffafe' },
  { key: 'material', shortLabel: '자재·사양', label: '🧪 자재·사양', color: '#059669', softBg: '#d1fae5' },
  { key: 'maint_etc', shortLabel: '정기·기타', label: '🔄 정기·기타', color: '#64748b', softBg: '#f1f5f9' }
];

const FACTOR_GROUP_MAP = Object.fromEntries(FACTOR_GROUPS.map((g) => [g.key, g]));

export function classifyChangePointFactor(row) {
  const item = String(row?.issueItem || '').trim();
  const detail = String(row?.details || '').trim();

  if (
    /금형|지그|툴\(공구\)/.test(item) ||
    (!item && /금형|파팅|코어/.test(detail))
  ) {
    return 'mold';
  }
  if (
    /설비 고장|TPM|설비 온도|설비 용량|장기 유휴 설비|동일 조건의 설비/.test(item) ||
    (!item && /설비|TPM|온조기|유압|프레스|비가동/.test(detail))
  ) {
    return 'equip';
  }
  if (/작업자|인원|교대시간|역할 분담|근무형태/.test(item)) {
    return 'man';
  }
  if (/재질|특수강|원자재|포장 사양|공급사/.test(item)) {
    return 'material';
  }
  if (/작업방법|생산라인 위치|생산 위치|공정조건|도장\/토출|속도\/주기|각도\/방식|자체도면|관리계획서|검사협정서/.test(item)) {
    return 'method';
  }
  if (/그리스|냉각수|부자재 정기교체|단전|파업|상기 16항목/.test(item)) {
    return 'maint_etc';
  }

  // 상세내용 보조 추론
  if (/작업자|투입|대체/.test(detail)) return 'man';
  if (/슬라이드|위치|속도|조건|온도|압력/.test(detail)) return 'method';
  if (/재질|원자재|고무|소재/.test(detail)) return 'material';
  if (/설비|수리|고장/.test(detail)) return 'equip';

  return 'maint_etc';
}

function isAutoSyncedChangePoint(row) {
  return Boolean(
    row?.autoSourceKey ||
      row?.autoSourceType ||
      String(row?.id || '').startsWith('cp_auto_')
  );
}

function getWeekOfMonthLabel(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = String(dateStr).split('-').map(Number);
  if (!y || !m || !d) return '';
  const startOfMonth = new Date(y, m - 1, 1);
  let startDay = startOfMonth.getDay();
  startDay = startDay === 0 ? 7 : startDay;
  const weekNumber = Math.ceil((d + startDay - 1) / 7);
  return `${weekNumber}주차`;
}

// 누적 막대 상단에 합계 숫자를 깔끔하게 그려주는 로컬 Chart.js 플러그인
const stackedBarTotalLabelPlugin = {
  id: 'cpStackedBarTotalLabel',
  afterDatasetsDraw(chart) {
    const { ctx, data, scales } = chart;
    if (!scales?.x || !scales?.y) return;
    const labels = data.labels || [];
    ctx.save();
    ctx.font = '700 11px Pretendard, system-ui, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    labels.forEach((_, idx) => {
      let sum = 0;
      data.datasets.forEach((ds) => {
        if (ds.type === 'line') return;
        const val = Number(ds.data?.[idx] || 0);
        if (val > 0) sum += val;
      });
      if (sum <= 0) return;
      const xPos = scales.x.getPixelForValue(idx);
      const yPos = scales.y.getPixelForValue(sum);
      ctx.fillText(`${sum}`, xPos, Math.max(14, yPos - 4));
    });
    ctx.restore();
  }
};

export default function DeepChangePointDashboard({
  data = [],
  isLegacyChecked,
  onJumpToDataRow,
  onOpenQPointModal
}) {
  // 상단 글로벌 필터 상태
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL'); // 'ALL' or '01'..'12'
  const [selectedWeek, setSelectedWeek] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL'); // 'ALL' | '4M' | '변동점' | 'AUTO'
  const [carFilter, setCarFilter] = useState('ALL');
  const [approvalFilter, setApprovalFilter] = useState('ALL'); // 'ALL' | 'UNCOMPLETED' | 'UNVERIFIED_QC' | 'UNAPPROVED_CEO'

  // 차트/매트릭스 클릭 드릴다운 상태
  const [drillMonthKey, setDrillMonthKey] = useState(null); // 'YYYY-MM'
  const [drillCar, setDrillCar] = useState(null);
  const [drillFactor, setDrillFactor] = useState(null);
  const [matrixViewMode, setMatrixViewMode] = useState('heatmap'); // 'heatmap' | 'pareto'

  // 전처리된 정규화 데이터
  const enrichedRows = useMemo(() => {
    return data.map((row) => {
      const dateStr = String(row.date || '').trim();
      const year = /^\d{4}/.test(dateStr) ? dateStr.slice(0, 4) : '';
      const month = /^\d{4}-\d{2}/.test(dateStr) ? dateStr.slice(5, 7) : '';
      const yearMonth = year && month ? `${year}-${month}` : '';
      const normCar = normalizeCarModelName(row.carModel);
      const factorKey = classifyChangePointFactor(row);
      const qcDone = Boolean(isLegacyChecked(row.qualityCheck));
      const ceoDone = Boolean(isLegacyChecked(row.ceoCheck));
      const qPointDone = Boolean(row.qPointInstall || row.qPointData);
      const isAuto = isAutoSyncedChangePoint(row);
      const weekLabel = getWeekOfMonthLabel(dateStr);

      return {
        raw: row,
        id: row.id,
        dateStr,
        year,
        month,
        yearMonth,
        weekLabel,
        normCar,
        factorKey,
        typeLabel: row.type || '변동점',
        issueItem: row.issueItem || '기타 변동',
        partName: row.partName || '',
        details: row.details || '',
        actionResult: row.actionResult || row.actionPlan || '',
        qcDone,
        ceoDone,
        isCompleted: qcDone && ceoDone,
        qPointDone,
        isAuto
      };
    });
  }, [data, isLegacyChecked]);

  // 선택 가능한 연도 및 차종 목록
  const availableYears = useMemo(() => {
    const set = new Set();
    enrichedRows.forEach((r) => {
      if (r.year) set.add(r.year);
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [enrichedRows]);

  const availableCars = useMemo(() => {
    const counts = new Map();
    enrichedRows.forEach((r) => {
      counts.set(r.normCar, (counts.get(r.normCar) || 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ko'))
      .map(([car]) => car);
  }, [enrichedRows]);

  const weekOptions = useMemo(() => {
    if (selectedMonth === 'ALL') return [];
    const targetYear =
      selectedYear !== 'ALL'
        ? Number(selectedYear)
        : Number(availableYears[0]) || new Date().getFullYear();
    const m = Number(selectedMonth);
    if (!m) return [];

    const startOfMonth = new Date(targetYear, m - 1, 1);
    const endOfMonth = new Date(targetYear, m, 0);
    const weeks = [];
    let curStart = new Date(startOfMonth);
    let startDow = startOfMonth.getDay();
    startDow = startDow === 0 ? 7 : startDow;

    let curEnd = new Date(startOfMonth);
    curEnd.setDate(curStart.getDate() + (7 - startDow));
    if (curEnd > endOfMonth) curEnd = new Date(endOfMonth);

    let wNum = 1;
    while (curStart <= endOfMonth) {
      const s = `${String(curStart.getMonth() + 1).padStart(2, '0')}/${String(curStart.getDate()).padStart(2, '0')}`;
      const e = `${String(curEnd.getMonth() + 1).padStart(2, '0')}/${String(curEnd.getDate()).padStart(2, '0')}`;
      weeks.push({ value: `${wNum}주차`, label: `${wNum}주차 (${s}~${e})` });
      wNum += 1;
      curStart = new Date(curEnd);
      curStart.setDate(curStart.getDate() + 1);
      curEnd = new Date(curStart);
      curEnd.setDate(curEnd.getDate() + 6);
      if (curEnd > endOfMonth) curEnd = new Date(endOfMonth);
    }
    return weeks;
  }, [selectedYear, selectedMonth, availableYears]);

  // 1차 필터링 (상단 필터 바 기준)
  const baseFilteredRows = useMemo(() => {
    return enrichedRows.filter((r) => {
      if (selectedYear !== 'ALL' && r.year !== selectedYear) return false;
      if (selectedMonth !== 'ALL' && r.month !== selectedMonth) return false;
      if (selectedWeek !== 'ALL' && r.weekLabel !== selectedWeek) return false;
      if (sourceFilter === '4M' && r.typeLabel !== '4M') return false;
      if (sourceFilter === '변동점' && r.typeLabel !== '변동점') return false;
      if (sourceFilter === 'AUTO' && !r.isAuto) return false;
      if (carFilter !== 'ALL' && r.normCar !== carFilter) return false;
      if (approvalFilter === 'UNCOMPLETED' && r.isCompleted) return false;
      if (approvalFilter === 'UNVERIFIED_QC' && r.qcDone) return false;
      if (approvalFilter === 'UNAPPROVED_CEO' && r.ceoDone) return false;
      return true;
    });
  }, [
    enrichedRows,
    selectedYear,
    selectedMonth,
    selectedWeek,
    sourceFilter,
    carFilter,
    approvalFilter
  ]);

  // KPI 요약 계산
  const kpi = useMemo(() => {
    const total = baseFilteredRows.length;
    let count4M = 0;
    let countCp = 0;
    let countAuto = 0;
    let qcDoneCount = 0;
    let ceoDoneCount = 0;
    let uncompletedCount = 0;
    let qPointCount = 0;

    const factorCounter = new Map();
    const carCounter = new Map();
    const byMonth = new Map();

    baseFilteredRows.forEach((r) => {
      if (r.typeLabel === '4M') count4M += 1;
      else countCp += 1;
      if (r.isAuto) countAuto += 1;
      if (r.qcDone) qcDoneCount += 1;
      if (r.ceoDone) ceoDoneCount += 1;
      if (!r.isCompleted) uncompletedCount += 1;
      if (r.qPointDone) qPointCount += 1;

      factorCounter.set(r.factorKey, (factorCounter.get(r.factorKey) || 0) + 1);
      carCounter.set(r.normCar, (carCounter.get(r.normCar) || 0) + 1);
      if (r.yearMonth) {
        byMonth.set(r.yearMonth, (byMonth.get(r.yearMonth) || 0) + 1);
      }
    });

    const sortedMonths = Array.from(byMonth.keys()).sort();
    let momDiff = null;
    let latestMonthLabel = '';
    if (sortedMonths.length >= 2) {
      const lastKey = sortedMonths[sortedMonths.length - 1];
      const prevKey = sortedMonths[sortedMonths.length - 2];
      momDiff = (byMonth.get(lastKey) || 0) - (byMonth.get(prevKey) || 0);
      latestMonthLabel = `${Number(lastKey.slice(5, 7))}월`;
    }

    const topFactorEntry = Array.from(factorCounter.entries()).sort((a, b) => b[1] - a[1])[0];
    const topCarEntry = Array.from(carCounter.entries()).sort((a, b) => b[1] - a[1])[0];

    return {
      total,
      count4M,
      countCp,
      countAuto,
      qcDoneCount,
      unverifiedQcCount: total - qcDoneCount,
      ceoDoneCount,
      unapprovedCeoCount: total - ceoDoneCount,
      uncompletedCount,
      qPointCount,
      qcRate: total > 0 ? Math.round((qcDoneCount / total) * 100) : 0,
      ceoRate: total > 0 ? Math.round((ceoDoneCount / total) * 100) : 0,
      momDiff,
      latestMonthLabel,
      topFactorLabel: topFactorEntry ? FACTOR_GROUP_MAP[topFactorEntry[0]]?.shortLabel : '-',
      topFactorKey: topFactorEntry ? topFactorEntry[0] : null,
      topFactorCount: topFactorEntry ? topFactorEntry[1] : 0,
      topCarLabel: topCarEntry ? topCarEntry[0] : '-',
      topCarCount: topCarEntry ? topCarEntry[1] : 0
    };
  }, [baseFilteredRows]);

  // 좌측 차트: 월별 발생 추이 (4M 누적막대 + 변동점 누적막대 + 미완료 꺾은선)
  const monthlyTrend = useMemo(() => {
    const bucket = new Map();
    baseFilteredRows.forEach((r) => {
      const key = r.yearMonth || '날짜미상';
      if (!bucket.has(key)) {
        bucket.set(key, { count4M: 0, countCp: 0, uncompleted: 0, dayMap: new Map() });
      }
      const entry = bucket.get(key);
      if (r.typeLabel === '4M') entry.count4M += 1;
      else entry.countCp += 1;
      if (!r.isCompleted) entry.uncompleted += 1;
      if (r.dateStr) {
        entry.dayMap.set(r.dateStr, (entry.dayMap.get(r.dateStr) || 0) + 1);
      }
    });

    const rawKeys = Array.from(bucket.keys()).sort((a, b) => {
      if (a === '날짜미상') return 1;
      if (b === '날짜미상') return -1;
      return a.localeCompare(b);
    });

    let prevYear = '';
    const labels = rawKeys.map((k, idx) => {
      if (k === '날짜미상') return k;
      const [y, m] = k.split('-');
      const mNum = Number(m);
      if (idx === 0 || y !== prevYear) {
        prevYear = y;
        return `${y.slice(2)}년 ${mNum}월`;
      }
      return `${mNum}월`;
    });

    return {
      rawKeys,
      labels,
      data4M: rawKeys.map((k) => bucket.get(k).count4M),
      dataCp: rawKeys.map((k) => bucket.get(k).countCp),
      dataUncompleted: rawKeys.map((k) => bucket.get(k).uncompleted),
      dayTooltips: rawKeys.map((k) => {
        const entries = Array.from(bucket.get(k).dayMap.entries()).sort((a, b) =>
          a[0].localeCompare(b[0])
        );
        return entries.slice(0, 8).map(([dt, cnt]) => `${dt}: ${cnt}건`);
      })
    };
  }, [baseFilteredRows]);

  // 우측 매트릭스 대상 행 (월 드릴다운이 걸린 경우 해당 월 반영)
  const matrixSourceRows = useMemo(() => {
    if (!drillMonthKey) return baseFilteredRows;
    return baseFilteredRows.filter((r) => (r.yearMonth || '날짜미상') === drillMonthKey);
  }, [baseFilteredRows, drillMonthKey]);

  // 차종 × 6대 요인 히트맵 매트릭스 데이터 (건수 내림차순 정렬)
  const matrixStats = useMemo(() => {
    const carMap = new Map();
    let maxCellCount = 0;

    matrixSourceRows.forEach((r) => {
      if (!carMap.has(r.normCar)) {
        carMap.set(r.normCar, {
          car: r.normCar,
          total: 0,
          uncompleted: 0,
          cells: Object.fromEntries(
            FACTOR_GROUPS.map((g) => [g.key, { count: 0, uncompleted: 0 }])
          )
        });
      }
      const rowStat = carMap.get(r.normCar);
      rowStat.total += 1;
      if (!r.isCompleted) rowStat.uncompleted += 1;

      const cell = rowStat.cells[r.factorKey];
      if (cell) {
        cell.count += 1;
        if (!r.isCompleted) cell.uncompleted += 1;
        if (cell.count > maxCellCount) maxCellCount = cell.count;
      }
    });

    const rows = Array.from(carMap.values()).sort(
      (a, b) => b.total - a.total || a.car.localeCompare(b.car, 'ko')
    );

    const colTotals = Object.fromEntries(
      FACTOR_GROUPS.map((g) => [
        g.key,
        rows.reduce((sum, r) => sum + (r.cells[g.key]?.count || 0), 0)
      ])
    );

    return { rows, colTotals, maxCellCount: Math.max(1, maxCellCount) };
  }, [matrixSourceRows]);

  // 3단 하단 드릴다운 상세 리스트
  const drilldownRows = useMemo(() => {
    const filtered = matrixSourceRows.filter((r) => {
      if (drillCar && r.normCar !== drillCar) return false;
      if (drillFactor && r.factorKey !== drillFactor) return false;
      return true;
    });

    // 드릴다운 조건이 없을 때는 미완료 건을 상단에 우선 배치하여 즉시 조치 가능하도록 정렬
    const copy = [...filtered];
    copy.sort((a, b) => {
      if (!drillCar && !drillFactor && !drillMonthKey && approvalFilter === 'ALL') {
        if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
      }
      return b.dateStr.localeCompare(a.dateStr);
    });
    return copy;
  }, [matrixSourceRows, drillCar, drillFactor, drillMonthKey, approvalFilter]);

  const hasAnyActiveFilter =
    selectedYear !== 'ALL' ||
    selectedMonth !== 'ALL' ||
    selectedWeek !== 'ALL' ||
    sourceFilter !== 'ALL' ||
    carFilter !== 'ALL' ||
    approvalFilter !== 'ALL' ||
    Boolean(drillMonthKey) ||
    Boolean(drillCar) ||
    Boolean(drillFactor);

  const resetAllFilters = () => {
    setSelectedYear('ALL');
    setSelectedMonth('ALL');
    setSelectedWeek('ALL');
    setSourceFilter('ALL');
    setCarFilter('ALL');
    setApprovalFilter('ALL');
    setDrillMonthKey(null);
    setDrillCar(null);
    setDrillFactor(null);
  };

  const toggleMatrixCell = (car, factorKey) => {
    if (drillCar === car && drillFactor === factorKey) {
      setDrillCar(null);
      setDrillFactor(null);
    } else {
      setDrillCar(car);
      setDrillFactor(factorKey);
    }
  };

  const getHeatmapCellStyle = (count, maxCount, isSelected) => {
    if (count <= 0) {
      return {
        background: isSelected ? '#eff6ff' : '#ffffff',
        color: '#cbd5e1',
        border: isSelected ? '2px solid #2563eb' : '1px solid #f1f5f9',
        fontWeight: 500
      };
    }
    const ratio = Math.min(1, count / maxCount);
    // 건수 비중에 따른 4단계 블루-인디고 히트맵 스케일
    let bg = '#eff6ff';
    let fg = '#1e40af';
    if (ratio >= 0.7) {
      bg = '#1d4ed8';
      fg = '#ffffff';
    } else if (ratio >= 0.35) {
      bg = '#60a5fa';
      fg = '#ffffff';
    } else if (ratio >= 0.15) {
      bg = '#bfdbfe';
      fg = '#1e3a8a';
    }
    return {
      background: bg,
      color: fg,
      border: isSelected ? '2px solid #0f172a' : '1px solid #e2e8f0',
      fontWeight: 800
    };
  };

  return (
    <div
      data-deep-cp-dashboard="1"
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        paddingRight: '2px'
      }}
    >
      {/* 1단-A: 상단 컴팩트 통합 필터 바 (기존 좌측 200px 사이드바 공간 절약) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          padding: '10px 14px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>조회 조건:</span>

          <select
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setDrillMonthKey(null);
            }}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              fontWeight: 700,
              color: '#0f172a',
              background: '#f8fafc'
            }}
          >
            <option value="ALL">전체 연도</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}년
              </option>
            ))}
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setSelectedWeek('ALL');
              setDrillMonthKey(null);
            }}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              fontWeight: 700,
              color: '#0f172a',
              background: '#f8fafc'
            }}
          >
            <option value="ALL">전체 월</option>
            {Array.from({ length: 12 }, (_, i) => {
              const mVal = String(i + 1).padStart(2, '0');
              return (
                <option key={mVal} value={mVal}>
                  {i + 1}월
                </option>
              );
            })}
          </select>

          <select
            value={selectedWeek}
            disabled={selectedMonth === 'ALL'}
            onChange={(e) => setSelectedWeek(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              fontWeight: 600,
              color: selectedMonth === 'ALL' ? '#94a3b8' : '#0f172a',
              background: selectedMonth === 'ALL' ? '#f1f5f9' : '#f8fafc'
            }}
          >
            <option value="ALL">전체 주차</option>
            {weekOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={carFilter}
            onChange={(e) => {
              setCarFilter(e.target.value);
              setDrillCar(null);
            }}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              fontWeight: 700,
              color: '#0f172a',
              background: '#f8fafc'
            }}
          >
            <option value="ALL">전체 차종 ({availableCars.length}종)</option>
            {availableCars.map((car) => (
              <option key={car} value={car}>
                {car}
              </option>
            ))}
          </select>

          {/* 구분 빠른 필 버튼 */}
          <div style={{ display: 'inline-flex', gap: '4px', marginLeft: '4px', flexWrap: 'wrap' }}>
            {[
              { key: 'ALL', label: '전체 구분' },
              { key: '4M', label: '4M' },
              { key: '변동점', label: '변동점' },
              { key: 'AUTO', label: '⚡ 자동연동' }
            ].map((btn) => {
              const active = sourceFilter === btn.key;
              return (
                <button
                  key={btn.key}
                  type="button"
                  onClick={() => setSourceFilter(btn.key)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: active ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
                    background: active ? '#eff6ff' : '#ffffff',
                    color: active ? '#1d4ed8' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() =>
              setApprovalFilter((prev) => (prev === 'UNCOMPLETED' ? 'ALL' : 'UNCOMPLETED'))
            }
            style={{
              padding: '6px 12px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 800,
              border:
                approvalFilter === 'UNCOMPLETED' ? '1px solid #dc2626' : '1px solid #fca5a5',
              background: approvalFilter === 'UNCOMPLETED' ? '#dc2626' : '#fef2f2',
              color: approvalFilter === 'UNCOMPLETED' ? '#ffffff' : '#b91c1c',
              cursor: 'pointer'
            }}
          >
            🚨 미승인·미검증만 보기
          </button>

          {hasAnyActiveFilter && (
            <button
              type="button"
              onClick={resetAllFilters}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#334155',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              전체 필터 초기화
            </button>
          )}
        </div>
      </div>

      {/* 1단-B: 액션형 고시인성 KPI 카드 5종 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(185px, 1fr))',
          gap: '12px'
        }}
      >
        {/* KPI 1: 총 발생 건수 & 구성비 */}
        <div
          onClick={() => setApprovalFilter('ALL')}
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '14px 16px',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #2563eb',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '6px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>총 발생 건수</span>
            {kpi.momDiff !== null && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '999px',
                  background: kpi.momDiff > 0 ? '#fee2e2' : kpi.momDiff < 0 ? '#dcfce7' : '#f1f5f9',
                  color: kpi.momDiff > 0 ? '#b91c1c' : kpi.momDiff < 0 ? '#15803d' : '#475569'
                }}
              >
                {kpi.latestMonthLabel} 전월비{' '}
                {kpi.momDiff > 0 ? `▲${kpi.momDiff}` : kpi.momDiff < 0 ? `▼${Math.abs(kpi.momDiff)}` : '보합'}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
              {kpi.total}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>건</span>
          </div>
          <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>
            4M <strong>{kpi.count4M}</strong> · 변동점 <strong>{kpi.countCp}</strong> · ⚡자동{' '}
            <strong style={{ color: '#2563eb' }}>{kpi.countAuto}</strong>
          </div>
        </div>

        {/* KPI 2: 미승인·미검증 대기 (Action 강조 카드) */}
        <div
          onClick={() =>
            setApprovalFilter((prev) => (prev === 'UNCOMPLETED' ? 'ALL' : 'UNCOMPLETED'))
          }
          title="클릭 시 미완료 건만 필터링합니다"
          style={{
            background: kpi.uncompletedCount > 0 ? '#fffafa' : '#f0fdf4',
            borderRadius: '12px',
            padding: '14px 16px',
            border:
              approvalFilter === 'UNCOMPLETED'
                ? '2px solid #dc2626'
                : kpi.uncompletedCount > 0
                  ? '1px solid #fecaca'
                  : '1px solid #bbf7d0',
            borderLeft: kpi.uncompletedCount > 0 ? '4px solid #dc2626' : '4px solid #16a34a',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '6px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: 800,
                color: kpi.uncompletedCount > 0 ? '#b91c1c' : '#15803d'
              }}
            >
              {kpi.uncompletedCount > 0 ? '🚨 미승인·미검증 대기' : '✅ 검증·승인 완료'}
            </span>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>클릭 필터</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
            <span
              style={{
                fontSize: '28px',
                fontWeight: 900,
                color: kpi.uncompletedCount > 0 ? '#dc2626' : '#15803d',
                lineHeight: 1.1
              }}
            >
              {kpi.uncompletedCount}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748b' }}>건 대기</span>
          </div>
          <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>
            품질 미검증 <strong style={{ color: '#b91c1c' }}>{kpi.unverifiedQcCount}</strong> · 승인 대기{' '}
            <strong style={{ color: '#b91c1c' }}>{kpi.unapprovedCeoCount}</strong>
          </div>
        </div>

        {/* KPI 3: 품질 검증 완료율 */}
        <div
          onClick={() =>
            setApprovalFilter((prev) => (prev === 'UNVERIFIED_QC' ? 'ALL' : 'UNVERIFIED_QC'))
          }
          title="클릭 시 품질 미검증 항목만 필터링합니다"
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '14px 16px',
            border: approvalFilter === 'UNVERIFIED_QC' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
            borderLeft: '4px solid #8b5cf6',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '6px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>품질 검증 완료율</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#6d28d9' }}>
              {kpi.qcDoneCount} / {kpi.total}건
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
            <span style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
              {kpi.qcRate}
            </span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#8b5cf6' }}>%</span>
          </div>
          <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${kpi.qcRate}%`,
                height: '100%',
                background: '#8b5cf6',
                borderRadius: '999px'
              }}
            />
          </div>
        </div>

        {/* KPI 4: 공장장(대표이사) 승인 완료율 */}
        <div
          onClick={() =>
            setApprovalFilter((prev) => (prev === 'UNAPPROVED_CEO' ? 'ALL' : 'UNAPPROVED_CEO'))
          }
          title="클릭 시 대표이사 승인 대기 항목만 필터링합니다"
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '14px 16px',
            border: approvalFilter === 'UNAPPROVED_CEO' ? '2px solid #059669' : '1px solid #e2e8f0',
            borderLeft: '4px solid #10b981',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '6px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>공장장 승인 완료율</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#047857' }}>
              {kpi.ceoDoneCount} / {kpi.total}건
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '3px' }}>
            <span style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
              {kpi.ceoRate}
            </span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#10b981' }}>%</span>
          </div>
          <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${kpi.ceoRate}%`,
                height: '100%',
                background: '#10b981',
                borderRadius: '999px'
              }}
            />
          </div>
        </div>

        {/* KPI 5: 최다 발생 요인 & 차종 요약 */}
        <div
          onClick={() => {
            if (kpi.topCarLabel && kpi.topCarLabel !== '-') {
              setDrillCar((prev) => (prev === kpi.topCarLabel ? null : kpi.topCarLabel));
              setDrillFactor(null);
            }
          }}
          title="클릭 시 최다 발생 차종을 집중 조회합니다"
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            padding: '14px 16px',
            border: '1px solid #e2e8f0',
            borderLeft: '4px solid #f59e0b',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '5px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>최다 발생 집중 구간</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#b45309' }}>
              Q-Point {kpi.qPointCount}건
            </span>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            차종: <span style={{ color: '#1d4ed8' }}>{kpi.topCarLabel}</span> ({kpi.topCarCount}건)
          </div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            주요 요인: <strong>{kpi.topFactorLabel}</strong> ({kpi.topFactorCount}건)
          </div>
        </div>
      </div>

      {/* 2단: 비율 최적화 핵심 시각화 영역 (월별 복합 추이 + 차종×요인 히트맵 매트릭스) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 5fr) minmax(480px, 7fr)', gap: '14px' }}>
        {/* 좌측: 월별 발생 추이 & 미완료 추세 (고정 높이로 세로 늘어남 왜곡 방지) */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                📅 월별 발생 추이 & 미완료 추세
              </h3>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                막대를 클릭하면 해당 월 데이터로 우측 매트릭스와 하단 리스트가 연동됩니다.
              </div>
            </div>
            {drillMonthKey && (
              <button
                type="button"
                onClick={() => setDrillMonthKey(null)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '999px',
                  border: '1px solid #93c5fd',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                선택 월: {drillMonthKey} ✕
              </button>
            )}
          </div>

          <div style={{ height: '300px', position: 'relative' }}>
            {monthlyTrend.labels.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
                표시할 월별 트렌드 데이터가 없습니다.
              </div>
            ) : (
              <Bar
                plugins={[stackedBarTotalLabelPlugin]}
                data={{
                  labels: monthlyTrend.labels,
                  datasets: [
                    {
                      type: 'line',
                      label: '미승인·미검증 잔여',
                      data: monthlyTrend.dataUncompleted,
                      borderColor: '#ef4444',
                      backgroundColor: '#ef4444',
                      borderWidth: 2,
                      pointRadius: 4,
                      pointHoverRadius: 6,
                      tension: 0.25,
                      stack: 'uncompleted_line',
                      order: 0
                    },
                    {
                      type: 'bar',
                      label: '4M',
                      data: monthlyTrend.data4M,
                      backgroundColor: '#1d4ed8',
                      borderRadius: 3,
                      stack: 'total',
                      maxBarThickness: 34,
                      order: 1
                    },
                    {
                      type: 'bar',
                      label: '변동점',
                      data: monthlyTrend.dataCp,
                      backgroundColor: '#60a5fa',
                      borderRadius: 3,
                      stack: 'total',
                      maxBarThickness: 34,
                      order: 2
                    }
                  ]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  layout: { padding: { top: 18 } },
                  onClick: (_evt, elements) => {
                    if (elements && elements.length > 0) {
                      const idx = elements[0].index;
                      const clickedKey = monthlyTrend.rawKeys[idx];
                      setDrillMonthKey((prev) => (prev === clickedKey ? null : clickedKey));
                    }
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                      align: 'end',
                      labels: { boxWidth: 12, font: { size: 11, weight: '700' } }
                    },
                    tooltip: {
                      callbacks: {
                        afterBody: (ctx) => {
                          if (!ctx || ctx.length === 0) return [];
                          const idx = ctx[0].dataIndex;
                          const lines = monthlyTrend.dayTooltips[idx] || [];
                          return lines.length > 0 ? ['', '[일자별 발생 요약]', ...lines] : [];
                        }
                      }
                    }
                  },
                  scales: {
                    x: {
                      stacked: true,
                      grid: { display: false },
                      ticks: { font: { size: 11, weight: '600' }, maxRotation: 0 }
                    },
                    y: {
                      stacked: true,
                      beginAtZero: true,
                      ticks: { precision: 0, font: { size: 11 } },
                      grid: { color: '#f1f5f9' }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>

        {/* 우측: 차종 × 6대 요인 히트맵 매트릭스 (파레토 가로막대 전환 지원) */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            minWidth: 0
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                🧩 차종 × 4M·발생요인 매트릭스 (Matrix View)
              </h3>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                대소문자 중복 표기 자동 통합 · 셀 클릭 시 하단 상세 내역으로 즉시 드릴다운 (붉은 점 = 미완료 포함)
              </div>
            </div>

            <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', gap: '2px' }}>
              {[
                { id: 'heatmap', label: '히트맵 표' },
                { id: 'pareto', label: '파레토 막대' }
              ].map((m) => {
                const active = matrixViewMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMatrixViewMode(m.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: 'none',
                      fontSize: '11px',
                      fontWeight: 800,
                      background: active ? '#ffffff' : 'transparent',
                      color: active ? '#0f172a' : '#64748b',
                      boxShadow: active ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {matrixStats.rows.length === 0 ? (
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
              조건에 해당하는 차종별 데이터가 없습니다.
            </div>
          ) : matrixViewMode === 'heatmap' ? (
            <div style={{ maxHeight: '300px', overflowY: 'auto', overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'center' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 2, background: '#f8fafc' }}>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap' }}>
                      차종 ({matrixStats.rows.length})
                    </th>
                    {FACTOR_GROUPS.map((g) => {
                      const colActive = drillFactor === g.key && !drillCar;
                      return (
                        <th
                          key={g.key}
                          onClick={() => {
                            setDrillCar(null);
                            setDrillFactor((prev) => (prev === g.key ? null : g.key));
                          }}
                          title={`${g.label} 전체 조회`}
                          style={{
                            padding: '8px 6px',
                            fontWeight: 800,
                            color: colActive ? '#1d4ed8' : '#334155',
                            background: colActive ? '#eff6ff' : '#f8fafc',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {g.shortLabel}
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>
                            ({matrixStats.colTotals[g.key] || 0})
                          </div>
                        </th>
                      );
                    })}
                    <th style={{ padding: '8px 8px', fontWeight: 900, color: '#0f172a', background: '#f1f5f9', whiteSpace: 'nowrap' }}>
                      합계
                    </th>
                    <th style={{ padding: '8px 8px', fontWeight: 800, color: '#b91c1c', background: '#fef2f2', whiteSpace: 'nowrap' }}>
                      미완료
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {matrixStats.rows.map((r) => {
                    const isCarSelected = drillCar === r.car && !drillFactor;
                    return (
                      <tr
                        key={r.car}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: isCarSelected ? '#eff6ff' : '#ffffff'
                        }}
                      >
                        <td
                          onClick={() => {
                            setDrillFactor(null);
                            setDrillCar((prev) => (prev === r.car ? null : r.car));
                          }}
                          style={{
                            padding: '6px 10px',
                            textAlign: 'left',
                            fontWeight: 800,
                            color: isCarSelected ? '#1d4ed8' : '#0f172a',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {r.car}
                        </td>
                        {FACTOR_GROUPS.map((g) => {
                          const cell = r.cells[g.key] || { count: 0, uncompleted: 0 };
                          const isCellSelected = drillCar === r.car && drillFactor === g.key;
                          const cellStyle = getHeatmapCellStyle(
                            cell.count,
                            matrixStats.maxCellCount,
                            isCellSelected
                          );
                          return (
                            <td key={g.key} style={{ padding: '3px 4px' }}>
                              <button
                                type="button"
                                disabled={cell.count === 0}
                                onClick={() => toggleMatrixCell(r.car, g.key)}
                                style={{
                                  position: 'relative',
                                  width: '100%',
                                  minWidth: '42px',
                                  padding: '5px 4px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  cursor: cell.count > 0 ? 'pointer' : 'default',
                                  ...cellStyle
                                }}
                              >
                                {cell.count > 0 ? cell.count : '·'}
                                {cell.uncompleted > 0 && (
                                  <span
                                    title={`미승인·미검증 ${cell.uncompleted}건 포함`}
                                    style={{
                                      position: 'absolute',
                                      top: '3px',
                                      right: '3px',
                                      width: '6px',
                                      height: '6px',
                                      borderRadius: '50%',
                                      background: '#ef4444',
                                      boxShadow: '0 0 0 1px #ffffff'
                                    }}
                                  />
                                )}
                              </button>
                            </td>
                          );
                        })}
                        <td
                          onClick={() => {
                            setDrillFactor(null);
                            setDrillCar((prev) => (prev === r.car ? null : r.car));
                          }}
                          style={{
                            padding: '6px 8px',
                            fontWeight: 900,
                            color: '#0f172a',
                            background: '#f8fafc',
                            cursor: 'pointer'
                          }}
                        >
                          {r.total}
                        </td>
                        <td style={{ padding: '6px 8px', background: '#fffafa' }}>
                          {r.uncompleted > 0 ? (
                            <span
                              style={{
                                padding: '2px 7px',
                                borderRadius: '999px',
                                fontSize: '11px',
                                fontWeight: 800,
                                background: '#fee2e2',
                                color: '#b91c1c'
                              }}
                            >
                              {r.uncompleted}
                            </span>
                          ) : (
                            <span style={{ color: '#16a34a', fontWeight: 700, fontSize: '11px' }}>✓</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* 파레토 가로 누적 막대 보기 (차종명 겹침 원천 차단 + 건수 내림차순) */
            <div style={{ height: '300px', position: 'relative' }}>
              <Bar
                data={{
                  labels: matrixStats.rows.slice(0, 12).map((r) => r.car),
                  datasets: FACTOR_GROUPS.map((g) => ({
                    label: g.shortLabel,
                    data: matrixStats.rows.slice(0, 12).map((r) => r.cells[g.key]?.count || 0),
                    backgroundColor: g.color,
                    borderRadius: 2,
                    maxBarThickness: 20
                  }))
                }}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  maintainAspectRatio: false,
                  onClick: (_evt, elements) => {
                    if (elements && elements.length > 0) {
                      const carName = matrixStats.rows[elements[0].index]?.car;
                      if (carName) {
                        setDrillCar((prev) => (prev === carName ? null : carName));
                        setDrillFactor(null);
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                      align: 'end',
                      labels: { boxWidth: 11, font: { size: 11, weight: '700' } }
                    }
                  },
                  scales: {
                    x: {
                      stacked: true,
                      beginAtZero: true,
                      ticks: { precision: 0, font: { size: 11 } },
                      grid: { color: '#f1f5f9' }
                    },
                    y: {
                      stacked: true,
                      grid: { display: false },
                      ticks: { font: { size: 12, weight: '800' }, color: '#0f172a' }
                    }
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* 3단: 클릭 연동 상세 내역 리스트 (Drill-down Table) */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            padding: '12px 16px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>
              📋 연동 상세 변동점 리스트
            </span>
            <span
              style={{
                padding: '2px 9px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 800,
                background: '#dbeafe',
                color: '#1d4ed8'
              }}
            >
              {drilldownRows.length}건
            </span>

            {drillMonthKey && (
              <span style={{ padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 800, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #93c5fd' }}>
                월: {drillMonthKey}
              </span>
            )}
            {drillCar && (
              <span style={{ padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 800, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #93c5fd' }}>
                차종: {drillCar}
              </span>
            )}
            {drillFactor && (
              <span style={{ padding: '3px 9px', borderRadius: '999px', fontSize: '11px', fontWeight: 800, background: '#ede9fe', color: '#6d28d9', border: '1px solid #c4b5fd' }}>
                요인: {FACTOR_GROUP_MAP[drillFactor]?.label}
              </span>
            )}
            {!drillMonthKey && !drillCar && !drillFactor && (
              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                (미승인·미검증 항목이 상단에 우선 표시됩니다 — 위 차트나 매트릭스 셀을 클릭해 조건별로 좁혀보세요)
              </span>
            )}
          </div>

          {(drillMonthKey || drillCar || drillFactor) && (
            <button
              type="button"
              onClick={() => {
                setDrillMonthKey(null);
                setDrillCar(null);
                setDrillFactor(null);
              }}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              셀 선택 해제
            </button>
          )}
        </div>

        <div style={{ maxHeight: '320px', overflowY: 'auto', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: '#f8fafc' }}>
              <tr style={{ borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                <th style={{ padding: '8px 12px', width: '100px', whiteSpace: 'nowrap' }}>작성일자</th>
                <th style={{ padding: '8px 10px', width: '115px', whiteSpace: 'nowrap' }}>구분</th>
                <th style={{ padding: '8px 10px', width: '140px', whiteSpace: 'nowrap' }}>차종 / 품명</th>
                <th style={{ padding: '8px 10px', width: '180px', whiteSpace: 'nowrap' }}>발생항목</th>
                <th style={{ padding: '8px 10px' }}>상세내용 및 조치 요약</th>
                <th style={{ padding: '8px 10px', width: '185px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  검증 · 승인 상태
                </th>
                <th style={{ padding: '8px 12px', width: '140px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                  관리 이동
                </th>
              </tr>
            </thead>
            <tbody>
              {drilldownRows.slice(0, 60).map((r) => {
                const factorMeta = FACTOR_GROUP_MAP[r.factorKey];
                return (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: !r.isCompleted ? '#fffdf9' : '#ffffff'
                    }}
                  >
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#334155', whiteSpace: 'nowrap' }}>
                      {r.dateStr || '-'}
                    </td>
                    <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                        <span
                          style={{
                            padding: '2px 7px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 800,
                            background: r.typeLabel === '4M' ? '#dbeafe' : '#f1f5f9',
                            color: r.typeLabel === '4M' ? '#1d4ed8' : '#334155'
                          }}
                        >
                          {r.typeLabel}
                        </span>
                        {r.isAuto && (
                          <span
                            style={{
                              padding: '2px 5px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 800,
                              background: '#eff6ff',
                              color: '#2563eb',
                              border: '1px solid #bfdbfe'
                            }}
                          >
                            ⚡자동
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{r.normCar}</div>
                      {r.partName && (
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{r.partName}</div>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <div style={{ fontWeight: 700, color: '#1e293b' }}>{r.issueItem}</div>
                      {factorMeta && (
                        <span
                          style={{
                            display: 'inline-block',
                            marginTop: '2px',
                            padding: '1px 6px',
                            borderRadius: '999px',
                            fontSize: '10px',
                            fontWeight: 700,
                            background: factorMeta.softBg,
                            color: factorMeta.color
                          }}
                        >
                          {factorMeta.shortLabel}
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px', color: '#334155' }}>
                      <div style={{ fontWeight: 600 }}>{r.details || '-'}</div>
                      {r.actionResult && (
                        <div style={{ fontSize: '11px', color: '#059669', marginTop: '2px' }}>
                          ↳ 조치: {r.actionResult}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '8px 10px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 800,
                            background: r.qcDone ? '#dcfce7' : '#fee2e2',
                            color: r.qcDone ? '#15803d' : '#b91c1c'
                          }}
                        >
                          품질 {r.qcDone ? '✓' : '미검증'}
                        </span>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 800,
                            background: r.ceoDone ? '#dbeafe' : '#fef3c7',
                            color: r.ceoDone ? '#1d4ed8' : '#b45309'
                          }}
                        >
                          승인 {r.ceoDone ? '✓' : '대기'}
                        </span>
                        {r.raw?.qPointData && onOpenQPointModal && (
                          <button
                            type="button"
                            onClick={() => onOpenQPointModal(r.raw)}
                            style={{
                              padding: '2px 6px',
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#334155',
                              fontSize: '10px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Q-Point
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {onJumpToDataRow && (
                        <button
                          type="button"
                          onClick={() => onJumpToDataRow(r.id)}
                          style={{
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid #93c5fd',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          데이터 관리 →
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {drilldownRows.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '28px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    선택한 조건에 일치하는 변동점 내역이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {drilldownRows.length > 60 && (
            <div style={{ padding: '8px 14px', textAlign: 'center', fontSize: '11px', color: '#64748b', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
              상위 60건만 미리보기로 표시 중입니다. (전체 {drilldownRows.length}건 — 상단 필터나 셀 클릭으로 범위를 좁히거나 데이터 관리 탭에서 전체 조회 가능)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
