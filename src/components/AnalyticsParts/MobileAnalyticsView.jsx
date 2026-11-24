import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  BarController,
  ArcElement,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { db } from '../../firebase';
import { MANUFACTURERS, CAR_MODEL_PARTS } from '../../constants/masterData';
import {
  PROC_OPTIONS,
  formatYmd,
  shiftDays,
  buildTrendAnalysis,
  buildParetoAnalysis,
  buildEquipMoldImpact,
  buildCarShareAnalysis
} from '../../services/analyticsStatsEngine';
import {
  resolveGm9bqcProcessCode,
  buildGm9bqcGrunDashboardModel
} from '../../services/gm9bqcGrunEngine';
import {
  fetch9bqcGrunHistoryWindow,
  get9bqcTodaySnapshotCache,
  set9bqcTodaySnapshotCache
} from '../../services/firestore';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  BarController,
  ArcElement,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SHARE_PALETTE = [
  '#2563eb', '#059669', '#d97706', '#e11d48', '#7c3aed',
  '#0891b2', '#ea580c', '#4f46e5', '#65a30d', '#64748b'
];

const MOBILE_ANALYTICS_TABS = [
  { id: 'trend', label: '생산 추이' },
  { id: 'pareto', label: '불량 파레토' },
  { id: 'equip', label: '설비·금형' },
  { id: 'share', label: '차종 비중' },
  { id: 'weekly', label: '스텔란티스' },
  { id: 'grun', label: '9BQC G/RUN' }
];

const STELLANTIS_GROUPS = [
  { key: 'DS CREW', label: 'DS CREW (반장)', color: '#7c3aed', leaderNames: ['DS CREW LH', 'DS CREW RH'], scrapCols: ['A', 'B', 'C', 'D'] },
  { key: 'DS STD', label: 'DS STD (반장)', color: '#0284c7', leaderNames: ['DS STD LH', 'DS STD RH'], scrapCols: ['A', 'B', 'C'] },
  { key: 'DT CREW', label: 'DT CREW (반장+클립)', color: '#d97706', clipCar: 'DT CREW', leaderNames: ['DT CREW LH', 'DT CREW RH'], scrapCols: ['A', 'B', 'C'] },
  { key: 'DT QUAD', label: 'DT QUAD (반장+클립)', color: '#0891b2', clipCar: 'DT QUAD', leaderNames: ['DT QUAD LH', 'DT QUAD RH'], scrapCols: ['A', 'B', 'C'] },
  { key: 'KM/KX Hood', label: 'KM/KX Hood (반장)', color: '#059669', hood: true, leaderNames: ['KM/KX Hood'], scrapCols: ['센터', '사이드'] }
];

const GRUN_STAGE_GROUPS = ['소재준비', '조인트', '후가공', '검사포장'];

function resolveInitialMobileTab(initialActiveTab, initialSubTab) {
  if (initialActiveTab === 'tab-weekly' || initialActiveTab === 'tab-leader' || initialActiveTab === 'tab-dtclip') {
    return 'weekly';
  }
  if (initialActiveTab === 'tab-9bqc-grun') {
    return 'grun';
  }
  if (['trend', 'pareto', 'equip', 'share'].includes(initialSubTab)) {
    return initialSubTab;
  }
  return 'trend';
}

function summarizeStellantisClip(reps, carModel) {
  const aComps = ['LH', 'RH'];
  const bComps = ['LH', 'RH', 'LH2', 'RH2', 'LH3', 'RH3', 'LH4', 'RH4'];
  let aPacked = 0, aScrap = 0, bPacked = 0, bScrap = 0;
  reps.filter((r) => r.carModel === carModel).forEach((r) => {
    if (r.dtCrewQty) {
      aComps.forEach((cid) => {
        aPacked += Number(r.dtCrewQty[`정품수량_${cid}`]) || 0;
        aScrap += Number(r.dtCrewQty[`불량합계_${cid}`]) || 0;
      });
    }
    if (r.dtCrewQtyB) {
      bComps.forEach((cid) => {
        bPacked += Number(r.dtCrewQtyB[`정품수량_${cid}`]) || 0;
        bScrap += Number(r.dtCrewQtyB[`불량합계_${cid}`]) || 0;
      });
    }
  });
  return { aPacked, aScrap, bPacked, bScrap };
}

/**
 * 모바일 전용 공정·실적·불량 분석 뷰 (안 B: 카드 피드 + 접힘 조건 필터 시트)
 */
export default function MobileAnalyticsView({
  dailyStats = [],
  downtimeReports = [],
  equipments = [],
  molds = [],
  changePoints = [],
  reports = [],
  reportsLoading = false,
  initialActiveTab = 'tab-charts',
  initialSubTab = 'trend',
  hasFullHistory = false,
  onNeedFullHistory = null,
  onSubTabDemand = null,
  onRequestStellantisReports = null,
  onSwitchToPc = null
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(() => resolveInitialMobileTab(initialActiveTab, initialSubTab));
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showRawMatrix, setShowRawMatrix] = useState(false);
  const [exporting, setExporting] = useState(false);

  const tabRefs = useRef({});

  // 기간·필터 상태
  const dateBounds = useMemo(() => {
    const dates = dailyStats.map((d) => d?.date).filter(Boolean).sort();
    const today = formatYmd(new Date());
    const maxDate = dates[dates.length - 1] || today;
    const minDate = dates[0] || shiftDays(maxDate, -29);
    return { minDate, maxDate, defaultStart: shiftDays(maxDate, -29) };
  }, [dailyStats]);

  const [startDate, setStartDate] = useState(() => dateBounds.defaultStart);
  const [endDate, setEndDate] = useState(() => dateBounds.maxDate);
  const userTouchedDateRef = useRef(false);
  const syncedInitialRef = useRef(dailyStats.length > 0);
  const [compareMode, setCompareMode] = useState('prevMonth');
  const [groupMode, setGroupMode] = useState('daily');
  const [filterMfg, setFilterMfg] = useState('ALL');
  const [filterCar, setFilterCar] = useState('ALL');
  const [filterPart, setFilterPart] = useState('ALL');
  const [filterProc, setFilterProc] = useState('ALL');

  // 스텔란티스 월 상태
  const availableMonths = useMemo(() => {
    const set = new Set();
    reports.forEach((r) => {
      if (r?.date) set.add(String(r.date).slice(0, 7));
    });
    const list = Array.from(set).sort((a, b) => b.localeCompare(a));
    return list.length > 0 ? list : [formatYmd(new Date()).slice(0, 7)];
  }, [reports]);
  const [weeklyMonth, setWeeklyMonth] = useState(() => formatYmd(new Date()).slice(0, 7));

  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(weeklyMonth)) {
      setWeeklyMonth(availableMonths[0]);
    }
  }, [availableMonths, weeklyMonth]);

  // 9BQC G/RUN 상태
  const todayYmd = useMemo(() => formatYmd(new Date()), []);
  const [grunDate, setGrunDate] = useState(todayYmd);
  const [grunShift, setGrunShift] = useState('ALL');
  const [grunReports, setGrunReports] = useState(() => get9bqcTodaySnapshotCache(todayYmd) || []);
  const [grunLoading, setGrunLoading] = useState(false);

  useEffect(() => {
    setActiveTab(resolveInitialMobileTab(initialActiveTab, initialSubTab));
  }, [initialActiveTab, initialSubTab]);

  useEffect(() => {
    if (!syncedInitialRef.current && dailyStats.length > 0) {
      syncedInitialRef.current = true;
      if (!userTouchedDateRef.current) {
        setStartDate(dateBounds.defaultStart);
        setEndDate(dateBounds.maxDate);
      }
    }
  }, [dailyStats.length, dateBounds.defaultStart, dateBounds.maxDate]);

  useEffect(() => {
    if ((activeTab === 'pareto' || activeTab === 'equip') && typeof onSubTabDemand === 'function') {
      onSubTabDemand(activeTab);
    }
    if (activeTab === 'weekly' && typeof onRequestStellantisReports === 'function') {
      onRequestStellantisReports();
    }
  }, [activeTab, onSubTabDemand, onRequestStellantisReports]);

  useEffect(() => {
    if (activeTab !== 'grun') return undefined;

    if (grunDate === todayYmd) {
      const cached = get9bqcTodaySnapshotCache(todayYmd);
      if (cached) {
        setGrunReports(cached);
        setGrunLoading(false);
      } else {
        setGrunLoading(true);
      }
      const q = query(collection(db, 'reports'), where('date', '==', todayYmd));
      const unsub = onSnapshot(
        q,
        (snap) => {
          const docs = [];
          snap.forEach((docSnap) => {
            const r = { id: docSnap.id, ...docSnap.data() };
            if (resolveGm9bqcProcessCode(r)) docs.push(r);
          });
          set9bqcTodaySnapshotCache(todayYmd, docs);
          setGrunReports(docs);
          setGrunLoading(false);
        },
        () => {
          setGrunLoading(false);
        }
      );
      return () => unsub();
    }

    let cancelled = false;
    setGrunLoading(true);
    fetch9bqcGrunHistoryWindow({ startDate: grunDate, endDate: grunDate, forceRefresh: false })
      .then((docs) => {
        if (!cancelled) {
          setGrunReports((docs || []).filter((r) => resolveGm9bqcProcessCode(r) && r.date === grunDate));
          setGrunLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setGrunLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, grunDate, todayYmd]);

  const mfgOptions = useMemo(
    () => MANUFACTURERS.filter((m) => m.code !== '공통' && m.name !== '공통(Common)').map((m) => m.name),
    []
  );
  const carOptions = useMemo(() => {
    if (filterMfg === 'ALL') {
      return MANUFACTURERS.flatMap((m) => m.models).map((m) => m.code).filter((c) => c !== '공통');
    }
    const mfg = MANUFACTURERS.find((m) => m.name === filterMfg);
    return mfg ? mfg.models.map((m) => m.code) : [];
  }, [filterMfg]);

  const partOptions = useMemo(() => {
    let cars = [];
    if (filterCar !== 'ALL') cars = [filterCar];
    else if (filterMfg !== 'ALL') {
      const mfg = MANUFACTURERS.find((m) => m.name === filterMfg);
      if (mfg) cars = mfg.models.map((m) => m.code);
    } else {
      cars = Object.keys(CAR_MODEL_PARTS).filter((c) => c !== '공통');
    }
    const parts = cars.flatMap((c) => CAR_MODEL_PARTS[c] || []).map((p) => p.code).filter((p) => p !== '공통');
    return [...new Set(parts)];
  }, [filterMfg, filterCar]);

  const filters = useMemo(
    () => ({ filterMfg, filterCar, filterPart, filterProc }),
    [filterMfg, filterCar, filterPart, filterProc]
  );

  const hasActiveFilter = filterMfg !== 'ALL' || filterCar !== 'ALL' || filterPart !== 'ALL' || filterProc !== 'ALL';

  const resetFilters = () => {
    setFilterMfg('ALL');
    setFilterCar('ALL');
    setFilterPart('ALL');
    setFilterProc('ALL');
  };

  const applyQuickRange = async (type) => {
    userTouchedDateRef.current = true;
    const anchor = dateBounds.maxDate;
    if (type === '7d') {
      setStartDate(shiftDays(anchor, -6));
      setEndDate(anchor);
      setGroupMode('daily');
    } else if (type === '30d') {
      setStartDate(shiftDays(anchor, -29));
      setEndDate(anchor);
      setGroupMode('daily');
    } else if (type === 'month') {
      setStartDate(`${anchor.slice(0, 7)}-01`);
      setEndDate(anchor);
      setGroupMode('daily');
    } else if (type === 'all') {
      setEndDate(anchor);
      setGroupMode('monthly');
      if (!hasFullHistory && typeof onNeedFullHistory === 'function') {
        const fullStats = await onNeedFullHistory();
        const allDates = (fullStats || []).map((d) => d?.date).filter(Boolean).sort();
        setStartDate(allDates[0] || dateBounds.minDate);
      } else {
        setStartDate(dateBounds.minDate);
      }
    }
  };

  const quickRangeChipLabel = useMemo(() => {
    if (startDate === shiftDays(dateBounds.maxDate, -6) && endDate === dateBounds.maxDate) return '최근 7일';
    if (startDate === shiftDays(dateBounds.maxDate, -29) && endDate === dateBounds.maxDate) return '최근 30일';
    if (startDate === `${dateBounds.maxDate.slice(0, 7)}-01` && endDate === dateBounds.maxDate) return '이번달';
    if (groupMode === 'monthly' && startDate === dateBounds.minDate) return '전체(월별)';
    return `${startDate.slice(5)}~${endDate.slice(5)}`;
  }, [startDate, endDate, dateBounds.maxDate, dateBounds.minDate, groupMode]);

  const filterSummaryText = useMemo(() => {
    const tokens = [];
    if (filterMfg !== 'ALL') tokens.push(filterMfg);
    if (filterCar !== 'ALL') tokens.push(filterCar);
    if (filterPart !== 'ALL') tokens.push(filterPart);
    if (filterProc !== 'ALL') tokens.push(filterProc);
    return tokens.length > 0 ? tokens.join(' · ') : '전체 차종·공정';
  }, [filterMfg, filterCar, filterPart, filterProc]);

  const needTrend = activeTab === 'trend' || activeTab === 'pareto';
  const trendData = useMemo(
    () => (needTrend
      ? buildTrendAnalysis({ dailyStats, startDate, endDate, compareMode, groupMode, filters })
      : {
          labels: [],
          actuals: [],
          defects: [],
          rates: [],
          compRange: null,
          compActualSeries: [],
          effectiveMode: groupMode,
          summary: { actualSum: 0, defectSum: 0, attainPct: null, defectRate: 0, actualDeltaPct: null, attainDeltaPt: null, defectRateDeltaPt: null, bestDay: null, worstDay: null },
          defectTable: { rows: [] },
          defectBreakdown: {}
        }),
    [needTrend, dailyStats, startDate, endDate, compareMode, groupMode, filters]
  );

  const paretoData = useMemo(
    () => (activeTab === 'pareto'
      ? buildParetoAnalysis({ dailyStats, downtimeReports, startDate, endDate, compareMode, filters })
      : { totalDefect: 0, top3SharePct: 0, focusTargets: '—', paretoWithCum: [], processComparison: [], carComparison: [], partBreakdown: [], insights: [], compLabel: null }),
    [activeTab, dailyStats, downtimeReports, startDate, endDate, compareMode, filters]
  );

  const equipImpact = useMemo(
    () => (activeTab === 'equip'
      ? buildEquipMoldImpact({ dailyStats, downtimeReports, equipments, molds, changePoints, startDate, endDate, filters })
      : { dailyDowntime: [], topAssets: [], moldBrackets: [], chainSummary: [], bannerText: '' }),
    [activeTab, dailyStats, downtimeReports, equipments, molds, changePoints, startDate, endDate, filters]
  );

  const shareData = useMemo(
    () => (activeTab === 'share'
      ? buildCarShareAnalysis({ dailyStats, startDate, endDate, filters })
      : { items: [], totalActual: 0, totalDefect: 0 }),
    [activeTab, dailyStats, startDate, endDate, filters]
  );

  const stellantisCards = useMemo(() => {
    if (activeTab !== 'weekly') return [];
    const monthReports = reports.filter((r) => String(r?.date || '').startsWith(`${weeklyMonth}-`));
    const leaderReps = monthReports.filter((r) => r.isLeaderForm || r.workerName === '장수미');
    const clipReps = monthReports.filter((r) => (r.carModel === 'DT CREW' || r.carModel === 'DT QUAD') && r.processName === '클립머신');

    return STELLANTIS_GROUPS.map((grp) => {
      let packed = 0;
      let packedLH = 0;
      let packedRH = 0;
      let sA = 0, sB = 0, sC = 0, sD = 0, sCenter = 0, sSide = 0;
      leaderReps.forEach((r) => {
        grp.leaderNames.forEach((name) => {
          const it = r.leaderFormItems?.find((item) => item.name === name);
          if (!it) return;
          const q = Number(it.packedQty) || 0;
          packed += q;
          if (name.includes('LH')) packedLH += q;
          else if (name.includes('RH')) packedRH += q;
          sA += Number(it.scrapA) || 0;
          sB += Number(it.scrapB) || 0;
          sC += Number(it.scrapC) || 0;
          sD += Number(it.scrapD) || 0;
          sCenter += Number(it.scrapCenter) || 0;
          sSide += Number(it.scrapSide) || 0;
        });
      });

      let scrap = grp.hood ? (sCenter + sSide) : (sA + sB + sC + (grp.scrapCols.includes('D') ? sD : 0));
      let clipInfo = null;
      if (grp.clipCar) {
        clipInfo = summarizeStellantisClip(clipReps, grp.clipCar);
        packed += clipInfo.aPacked + clipInfo.bPacked;
        scrap += clipInfo.aScrap + clipInfo.bScrap;
      }

      const defectRate = packed > 0 ? ((scrap / packed) * 100).toFixed(2) : '0.00';
      return {
        ...grp,
        packed,
        packedLH,
        packedRH,
        scrap,
        defectRate,
        clipInfo
      };
    });
  }, [activeTab, reports, weeklyMonth]);

  const grunModel = useMemo(() => {
    if (activeTab !== 'grun') return null;
    return buildGm9bqcGrunDashboardModel(grunReports, { shiftFilter: grunShift });
  }, [activeTab, grunReports, grunShift]);

  const trendChartData = useMemo(() => {
    const datasets = [
      {
        type: 'line',
        label: '불량률 (%)',
        data: trendData.rates.map((r) => r.toFixed(2)),
        borderColor: '#ef4444',
        backgroundColor: '#ef4444',
        borderWidth: 2,
        yAxisID: 'y1',
        tension: 0.3,
        pointRadius: 2.5,
        order: 1
      },
      {
        type: 'bar',
        label: '생산수량',
        data: trendData.actuals,
        backgroundColor: 'rgba(59,130,246,0.78)',
        borderRadius: 4,
        yAxisID: 'y',
        order: 3
      }
    ];
    if (trendData.compRange && trendData.compActualSeries.some((v) => v !== null && v > 0)) {
      datasets.push({
        type: 'line',
        label: trendData.compRange.label,
        data: trendData.compActualSeries,
        borderColor: '#94a3b8',
        borderDash: [4, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        yAxisID: 'y',
        order: 2
      });
    }
    return { labels: trendData.labels, datasets };
  }, [trendData]);

  const paretoChartData = useMemo(() => ({
    labels: paretoData.paretoWithCum.slice(0, 8).map((d) => d.shortName),
    datasets: [
      {
        type: 'line',
        label: '누적 비중 (%)',
        data: paretoData.paretoWithCum.slice(0, 8).map((d) => d.cumPct),
        borderColor: '#1d4ed8',
        backgroundColor: '#ffffff',
        pointBorderColor: '#1d4ed8',
        pointRadius: 3,
        borderWidth: 2,
        tension: 0.2,
        yAxisID: 'y1',
        order: 1
      },
      {
        type: 'bar',
        label: '불량 수량 (건)',
        data: paretoData.paretoWithCum.slice(0, 8).map((d) => d.qty),
        backgroundColor: paretoData.paretoWithCum.slice(0, 8).map((_, i) => (i === 0 ? '#ef4444' : i < 3 ? '#f97316' : '#fbbf24')),
        borderRadius: 4,
        maxBarThickness: 32,
        yAxisID: 'y',
        order: 2
      }
    ]
  }), [paretoData]);

  const shareChartData = useMemo(() => {
    const top = shareData.items.slice(0, 7);
    const restActual = shareData.items.slice(7).reduce((s, c) => s + c.actual, 0);
    const labels = top.map((c) => c.car);
    const values = top.map((c) => c.actual);
    if (restActual > 0) {
      labels.push('기타');
      values.push(restActual);
    }
    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: labels.map((_, i) => SHARE_PALETTE[i % SHARE_PALETTE.length]),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  }, [shareData]);

  const selectTab = (tabId) => {
    setActiveTab(tabId);
    const el = tabRefs.current[tabId];
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  };

  const handleTabKeyDown = (e, idx) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const nextIdx = e.key === 'ArrowRight'
      ? (idx + 1) % MOBILE_ANALYTICS_TABS.length
      : (idx - 1 + MOBILE_ANALYTICS_TABS.length) % MOBILE_ANALYTICS_TABS.length;
    const nextTab = MOBILE_ANALYTICS_TABS[nextIdx];
    selectTab(nextTab.id);
    tabRefs.current[nextTab.id]?.focus();
  };

  const handleDownloadExcel = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const exportTrend = needTrend
        ? trendData
        : buildTrendAnalysis({ dailyStats, startDate, endDate, compareMode, groupMode, filters });
      const rateStr = exportTrend.summary.actualSum > 0
        ? ((exportTrend.summary.defectSum / exportTrend.summary.actualSum) * 100).toFixed(2)
        : '0.00';
      const { exportAnalyticsToExcel } = await import('../../utils/analyticsExcelExport');
      await exportAnalyticsToExcel({
        labels: exportTrend.labels,
        effectiveMode: exportTrend.effectiveMode,
        actuals: exportTrend.actuals,
        defects: exportTrend.defects,
        datasets: [
          { type: 'line', label: '불량률 (%)', data: exportTrend.rates.map((r) => r.toFixed(2)) },
          { type: 'bar', label: '생산수량 (EA)', data: exportTrend.actuals }
        ],
        totals: { actual: exportTrend.summary.actualSum, defect: exportTrend.summary.defectSum, rate: rateStr },
        defectTable: exportTrend.defectTable,
        defectBreakdown: exportTrend.defectBreakdown,
        filterMfg,
        filterCar,
        filterPart,
        filterProc,
        periodLabel: `${startDate} ~ ${endDate} (${groupMode === 'monthly' ? '월별' : '일별'})`
      });
    } catch (err) {
      console.error('Excel export failed:', err);
      alert('엑셀 파일 생성 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleParetoBarClick = (_, elements) => {
    if (!elements || elements.length === 0 || filterProc !== 'ALL') return;
    const item = paretoData.paretoWithCum[elements[0].index];
    if (!item) return;
    const m = String(item.name || '').match(/^\[([^\]]+)\]/);
    if (!m) return;
    const tag = m[1];
    const matchedProc = tag === '검사' || tag.startsWith('검사/')
      ? '검사포장'
      : PROC_OPTIONS.find((p) => tag === p || tag.startsWith(`${p}/`));
    if (matchedProc) setFilterProc(matchedProc);
  };

  const isAnalysisTab = ['trend', 'pareto', 'equip', 'share'].includes(activeTab);
  const maxAssetVal = Math.max(1, ...equipImpact.topAssets.map((a) => (a.minutes > 0 ? a.minutes : a.count * 30)));
  const maxProcRate = Math.max(1, ...paretoData.processComparison.map((p) => p.rate));

  return (
    <div data-mobile-analytics="1">
      <style>{`
        [data-mobile-analytics="1"] {
          width: 100%;
          max-width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-bottom: 16px;
          box-sizing: border-box;
        }
        [data-mobile-analytics="1"] *,
        [data-mobile-analytics="1"] *::before,
        [data-mobile-analytics="1"] *::after {
          box-sizing: border-box;
        }
        [data-mobile-analytics="1"] .man-sticky-bar {
          position: sticky;
          top: 0;
          z-index: 20;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 8px 10px 0;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        [data-mobile-analytics="1"] .man-nav-row {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        [data-mobile-analytics="1"] .man-nav-switch {
          flex: 1;
          min-width: 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          background: #f1f5f9;
          padding: 3px;
          border-radius: 10px;
        }
        [data-mobile-analytics="1"] .man-nav-btn {
          border: 1px solid transparent;
          border-radius: 8px;
          padding: 6px;
          font-size: 12.5px;
          font-weight: 800;
          cursor: pointer;
          background: transparent;
          color: #475569;
          min-height: 36px;
          white-space: nowrap;
        }
        [data-mobile-analytics="1"] .man-nav-btn.is-active {
          background: #ffffff;
          color: #0f172a;
          border-color: #cbd5e1;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
        }
        [data-mobile-analytics="1"] .man-tablist {
          display: flex;
          flex-wrap: nowrap;
          overflow-x: auto;
          gap: 4px;
          scrollbar-width: none;
          border-top: 1px solid #f1f5f9;
        }
        [data-mobile-analytics="1"] .man-tablist::-webkit-scrollbar {
          display: none;
        }
        [data-mobile-analytics="1"] .man-tab {
          flex: 0 0 auto;
          background: transparent;
          border: none;
          border-bottom: 2.5px solid transparent;
          padding: 9px 10px 8px;
          font-size: 12.5px;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          white-space: nowrap;
        }
        [data-mobile-analytics="1"] .man-tab[aria-selected="true"] {
          color: #0f172a;
          font-weight: 900;
          border-bottom-color: #0f172a;
        }
        [data-mobile-analytics="1"] .man-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px;
          min-width: 0;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
        }
        [data-mobile-analytics="1"] .man-kpi-2x2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        @media (pointer: coarse) {
          [data-mobile-analytics="1"] button,
          [data-mobile-analytics="1"] select,
          [data-mobile-analytics="1"] input[type="date"] {
            min-height: 36px;
          }
        }
      `}</style>

      {/* ── 상단 통합 전환 & 단일행 탭 바 ── */}
      <div className="man-sticky-bar">
        <div className="man-nav-row">
          <nav className="man-nav-switch" aria-label="현황분석 화면 전환">
            <button type="button" className="man-nav-btn" onClick={() => navigate('/')}>
              📊 종합 대시보드
            </button>
            <button type="button" className="man-nav-btn is-active" aria-current="page">
              📈 실적 · 불량분석
            </button>
          </nav>
          <button
            type="button"
            onClick={onSwitchToPc}
            style={{
              padding: '6px 9px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#334155',
              fontSize: '11.5px',
              fontWeight: 700,
              cursor: 'pointer',
              flexShrink: 0
            }}
          >
            🖥️ PC표
          </button>
        </div>

        <div className="man-tablist" role="tablist" aria-label="실적·불량분석 하위 보기">
          {MOBILE_ANALYTICS_TABS.map((t, idx) => (
            <button
              key={t.id}
              ref={(el) => { tabRefs.current[t.id] = el; }}
              id={`mobile-tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              tabIndex={activeTab === t.id ? 0 : -1}
              className="man-tab"
              onClick={() => selectTab(t.id)}
              onKeyDown={(e) => handleTabKeyDown(e, idx)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 분석 조건 요약 바 + 접힘 필터 시트 ── */}
      {isAnalysisTab && (
        <section className="man-card" style={{ padding: '10px 12px' }} aria-label="분석 조건 필터">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', minWidth: 0, flex: 1 }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '999px', background: '#eff6ff', color: '#1d4ed8' }}>
                {quickRangeChipLabel}
              </span>
              <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: hasActiveFilter ? '#fef3c7' : '#f1f5f9', color: hasActiveFilter ? '#b45309' : '#475569' }}>
                {filterSummaryText}
              </span>
            </div>
            <button
              type="button"
              aria-expanded={showFilterSheet}
              onClick={() => setShowFilterSheet((prev) => !prev)}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: showFilterSheet ? '#0f172a' : '#f8fafc',
                color: showFilterSheet ? '#ffffff' : '#334155',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              {showFilterSheet ? '닫기 ▲' : '조건 ⚙️'}
            </button>
          </div>

          {showFilterSheet && (
            <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '5px' }}>
                {[
                  { key: '7d', label: '7일' },
                  { key: '30d', label: '30일' },
                  { key: 'month', label: '이번달' },
                  { key: 'all', label: '전체' }
                ].map((r) => (
                  <button
                    key={r.key}
                    type="button"
                    onClick={() => applyQuickRange(r.key)}
                    style={{
                      padding: '6px 4px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#f8fafc',
                      color: '#0f172a',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <input
                  type="date"
                  value={startDate}
                  aria-label="시작 날짜"
                  onChange={(e) => {
                    const nextVal = e.target.value;
                    userTouchedDateRef.current = true;
                    setStartDate(nextVal);
                    if (!hasFullHistory && nextVal && nextVal < dateBounds.minDate && typeof onNeedFullHistory === 'function') {
                      onNeedFullHistory();
                    }
                  }}
                  className="form-control"
                  style={{ fontSize: '12px', padding: '5px 8px' }}
                />
                <input
                  type="date"
                  value={endDate}
                  aria-label="종료 날짜"
                  onChange={(e) => {
                    userTouchedDateRef.current = true;
                    setEndDate(e.target.value);
                  }}
                  className="form-control"
                  style={{ fontSize: '12px', padding: '5px 8px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <select
                  aria-label="제조사 필터"
                  value={filterMfg}
                  onChange={(e) => {
                    setFilterMfg(e.target.value);
                    setFilterCar('ALL');
                    setFilterPart('ALL');
                  }}
                  className="form-control"
                  style={{ fontSize: '12.5px', padding: '5px 8px' }}
                >
                  <option value="ALL">제조사 전체</option>
                  {mfgOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <select
                  aria-label="차종 필터"
                  value={filterCar}
                  onChange={(e) => {
                    setFilterCar(e.target.value);
                    setFilterPart('ALL');
                  }}
                  className="form-control"
                  style={{ fontSize: '12.5px', padding: '5px 8px' }}
                >
                  <option value="ALL">차종 전체</option>
                  {carOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <select
                  aria-label="세부부품 필터"
                  value={filterPart}
                  onChange={(e) => setFilterPart(e.target.value)}
                  className="form-control"
                  style={{ fontSize: '12.5px', padding: '5px 8px' }}
                >
                  <option value="ALL">부품 전체</option>
                  {partOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
                <select
                  aria-label="공정 필터"
                  value={filterProc}
                  onChange={(e) => setFilterProc(e.target.value)}
                  className="form-control"
                  style={{ fontSize: '12.5px', padding: '5px 8px' }}
                >
                  <option value="ALL">공정 전체</option>
                  {PROC_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <select
                  aria-label="비교 기준"
                  value={compareMode}
                  onChange={(e) => setCompareMode(e.target.value)}
                  className="form-control"
                  style={{ flex: 1, fontSize: '12.5px', padding: '5px 8px' }}
                >
                  <option value="prevMonth">전월 동기 비교</option>
                  <option value="prevSpan">이전 동일 기간</option>
                  <option value="none">비교 안함</option>
                </select>
                {hasActiveFilter && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#475569', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    초기화
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  disabled={exporting}
                  style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #16a34a', background: '#16a34a', color: '#ffffff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  📥 {exporting ? '...' : '엑셀'}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── VIEW 1: 생산 추이 + 불량 요약 ── */}
      {activeTab === 'trend' && (
        <div role="tabpanel" aria-labelledby="mobile-tab-trend" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="man-kpi-2x2">
            <div className="man-card">
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b' }}>기간 실적 합계</div>
              <div style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>{trendData.summary.actualSum.toLocaleString()} EA</div>
              {trendData.summary.actualDeltaPct !== null && (
                <div style={{ fontSize: '11px', marginTop: '3px', color: trendData.summary.actualDeltaPct >= 0 ? '#15803d' : '#b91c1c', fontWeight: 700 }}>
                  {trendData.summary.actualDeltaPct >= 0 ? `▲ ${trendData.summary.actualDeltaPct}%` : `▼ ${Math.abs(trendData.summary.actualDeltaPct)}%`}
                </div>
              )}
            </div>
            <div className="man-card">
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b' }}>평균 달성률 · 불량률</div>
              <div style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                {trendData.summary.attainPct !== null ? `${trendData.summary.attainPct}%` : '—'} ·{' '}
                <span style={{ color: '#ef4444' }}>{trendData.summary.defectRate}%</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>총 불량 {trendData.summary.defectSum.toLocaleString()}건</div>
            </div>
          </div>

          <section className="man-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '6px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>
                📊 {groupMode === 'monthly' ? '월별' : '일별'} 생산 · 불량률
              </h3>
              <div style={{ display: 'flex', gap: '3px', background: '#f1f5f9', padding: '2px', borderRadius: '7px' }}>
                <button
                  type="button"
                  onClick={() => setGroupMode('daily')}
                  style={{
                    padding: '4px 9px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    background: groupMode === 'daily' ? '#ffffff' : 'transparent',
                    color: groupMode === 'daily' ? '#0f172a' : '#64748b'
                  }}
                >
                  일별
                </button>
                <button
                  type="button"
                  onClick={() => setGroupMode('monthly')}
                  style={{
                    padding: '4px 9px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    background: groupMode === 'monthly' ? '#ffffff' : 'transparent',
                    color: groupMode === 'monthly' ? '#0f172a' : '#64748b'
                  }}
                >
                  월별
                </button>
              </div>
            </div>

            {trendData.labels.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b', fontSize: '12.5px' }}>조회 기간에 생산 내역이 없습니다.</div>
            ) : (
              <div style={{ height: '215px', position: 'relative' }}>
                <Bar
                  data={trendChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                      x: {
                        grid: { display: false },
                        ticks: {
                          maxTicksLimit: 7,
                          maxRotation: 0,
                          font: { size: 10 },
                          callback(val) {
                            const lbl = trendData.labels[val];
                            return lbl && lbl.length === 10 ? lbl.slice(5).replace('-', '/') : lbl;
                          }
                        }
                      },
                      y: { type: 'linear', position: 'left', beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 }, maxTicksLimit: 5 } },
                      y1: { type: 'linear', position: 'right', beginAtZero: true, grace: '20%', grid: { drawOnChartArea: false }, ticks: { font: { size: 10 }, color: '#ef4444', maxTicksLimit: 4, callback: (v) => `${v}%` } }
                    },
                    plugins: {
                      legend: { position: 'top', align: 'end', labels: { boxWidth: 10, font: { size: 10.5 }, padding: 8 } }
                    }
                  }}
                />
              </div>
            )}
          </section>

          {/* 31일 가로 매트릭스 대신 모바일 불량 유형 요약 리스트 + 선택 시 원시표 토글 */}
          <section className="man-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>📋 기간 주요 불량 유형</h3>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  총 {trendData.summary.defectSum.toLocaleString()}건 · 전체 {trendData.defectTable.rows.length}개 유형
                </div>
              </div>
              {trendData.defectTable.rows.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowRawMatrix((prev) => !prev)}
                  style={{ padding: '4px 9px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#334155', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
                >
                  {showRawMatrix ? '카드로 보기' : '일자표 ↗'}
                </button>
              )}
            </div>

            {trendData.defectTable.rows.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '14px 0', color: '#64748b', fontSize: '12.5px' }}>선택 기간에 불량 내역이 없습니다.</div>
            ) : showRawMatrix ? (
              <div
                tabIndex={0}
                role="region"
                aria-label="일자별 불량 수량 가로 스크롤 표"
                style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px' }}
              >
                <table style={{ borderCollapse: 'collapse', fontSize: '11px', width: 'max-content', minWidth: '100%' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ position: 'sticky', left: 0, background: '#f8fafc', padding: '6px 8px', textAlign: 'left', minWidth: '110px' }}>유형</th>
                      {trendData.labels.map((l) => (
                        <th key={l} style={{ padding: '6px', textAlign: 'center', minWidth: '42px', color: '#64748b' }}>
                          {l.length === 10 ? l.slice(5).replace('-', '/') : l}
                        </th>
                      ))}
                      <th style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800 }}>합계</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trendData.defectTable.rows.map((dt) => (
                      <tr key={dt.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <th style={{ position: 'sticky', left: 0, background: '#ffffff', padding: '6px 8px', textAlign: 'left', fontWeight: 700 }}>{dt.name}</th>
                        {trendData.labels.map((l) => {
                          const q = dt.perLabel[l] || 0;
                          return (
                            <td key={l} style={{ textAlign: 'center', padding: '6px 4px', color: q > 0 ? '#ef4444' : '#cbd5e1', fontWeight: q > 0 ? 700 : 400 }}>
                              {q > 0 ? q.toLocaleString() : '-'}
                            </td>
                          );
                        })}
                        <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 800 }}>{dt.total.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {trendData.defectTable.rows.slice(0, 8).map((dt, idx) => {
                  const pct = trendData.summary.defectSum > 0 ? Math.round((dt.total / trendData.summary.defectSum) * 100) : 0;
                  return (
                    <div key={dt.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '7px 9px', borderRadius: '8px', background: '#f8fafc' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                        <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: idx === 0 ? '#fef2f2' : '#f1f5f9', color: idx === 0 ? '#ef4444' : '#475569', fontSize: '10.5px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dt.name}</span>
                      </div>
                      <div style={{ flexShrink: 0, fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginRight: '5px' }}>{pct}%</span>
                        {dt.total.toLocaleString()}건
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── VIEW 2: 불량 파레토 ── */}
      {activeTab === 'pareto' && (
        <div role="tabpanel" aria-labelledby="mobile-tab-pareto" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <section className="man-card">
            <div style={{ marginBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>🚨 불량 원인 파레토 (누적 %)</h3>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                상위 3개 집중 비중 <strong>{paretoData.top3SharePct}%</strong> · 총 {paretoData.totalDefect.toLocaleString()}건
              </div>
            </div>

            {hasActiveFilter && (
              <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '8px' }}>
                <button type="button" onClick={resetFilters} style={{ padding: '3px 8px', fontSize: '11px', fontWeight: 700, borderRadius: '999px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}>
                  전체 보기 ↺
                </button>
                {filterProc !== 'ALL' && (
                  <span style={{ padding: '3px 8px', fontSize: '11px', fontWeight: 700, borderRadius: '999px', background: '#0f172a', color: '#ffffff' }}>{filterProc}</span>
                )}
                {filterCar !== 'ALL' && (
                  <span style={{ padding: '3px 8px', fontSize: '11px', fontWeight: 700, borderRadius: '999px', background: '#0f172a', color: '#ffffff' }}>{filterCar}</span>
                )}
              </div>
            )}

            {paretoData.paretoWithCum.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#64748b', fontSize: '12.5px' }}>선택 조건의 불량 데이터가 없습니다.</div>
            ) : (
              <div style={{ height: '215px', position: 'relative' }}>
                <Bar
                  data={paretoChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    onClick: handleParetoBarClick,
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                      x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 25 } },
                      y: { type: 'linear', position: 'left', beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 }, maxTicksLimit: 4 } },
                      y1: { type: 'linear', position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false }, ticks: { font: { size: 10 }, color: '#1d4ed8', callback: (v) => `${v}%` } }
                    },
                    plugins: {
                      legend: { position: 'top', align: 'end', labels: { boxWidth: 10, font: { size: 10.5 }, padding: 8 } }
                    }
                  }}
                />
              </div>
            )}
          </section>

          {/* 공정별 불량률 비교 */}
          <section className="man-card">
            <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 800 }}>🏭 공정별 불량률 (터치 시 필터)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {paretoData.processComparison.map((p) => (
                <button
                  key={p.proc}
                  type="button"
                  onClick={() => setFilterProc((prev) => (prev === p.proc ? 'ALL' : p.proc))}
                  style={{ width: '100%', textAlign: 'left', background: filterProc === p.proc ? '#eff6ff' : 'transparent', border: '1px solid #f1f5f9', borderRadius: '8px', padding: '7px 8px', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', fontWeight: 700, marginBottom: '4px' }}>
                    <span>{p.proc}</span>
                    <span>{p.rate}% ({p.defect.toLocaleString()}건)</span>
                  </div>
                  <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100, (p.rate / maxProcRate) * 100)}%`, background: p.rate >= 1.0 ? '#ef4444' : '#3b82f6' }} />
                  </div>
                </button>
              ))}
            </div>
          </section>

          {paretoData.insights.length > 0 && (
            <section className="man-card">
              <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 800 }}>💡 자동 분석 요약</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {paretoData.insights.map((ins, i) => {
                  const tone = typeof ins === 'object' ? ins?.tone : 'blue';
                  const text = typeof ins === 'object' ? (ins?.text || '') : String(ins || '');
                  const palette = tone === 'red'
                    ? { bg: '#fef2f2', border: '#fecaca', color: '#7f1d1d' }
                    : tone === 'green'
                      ? { bg: '#ecfdf5', border: '#a7f3d0', color: '#064e3b' }
                      : tone === 'amber'
                        ? { bg: '#fffbeb', border: '#fde68a', color: '#78350f' }
                        : { bg: '#eff6ff', border: '#bfdbfe', color: '#1e3a8a' };
                  return (
                    <div
                      key={i}
                      style={{
                        background: palette.bg,
                        border: `1px solid ${palette.border}`,
                        color: palette.color,
                        borderRadius: '8px',
                        padding: '8px 10px',
                        fontSize: '12px',
                        lineHeight: 1.5
                      }}
                    >
                      {text}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}

      {/* ── VIEW 3: 설비 · 금형 영향 ── */}
      {activeTab === 'equip' && (
        <div role="tabpanel" aria-labelledby="mobile-tab-equip" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {equipImpact.bannerText && (
            <div style={{ padding: '10px 12px', borderRadius: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e40af', fontSize: '12.5px', fontWeight: 700 }}>
              {equipImpact.bannerText}
            </div>
          )}

          <section className="man-card">
            <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 800 }}>🔧 설비·금형 비가동 발생 TOP</h3>
            {equipImpact.topAssets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '18px 0', color: '#64748b', fontSize: '12.5px' }}>선택 기간 내 비가동·수리 의뢰 내역이 없습니다.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {equipImpact.topAssets.map((a, i) => {
                  const metricVal = a.minutes > 0 ? a.minutes : a.count * 30;
                  const widthPct = Math.round((metricVal / maxAssetVal) * 100);
                  const isEq = a.kind === 'equipment';
                  return (
                    <button
                      key={`${a.kind}_${a.id}`}
                      type="button"
                      onClick={() => navigate(isEq ? '/equipment' : '/mold', { state: { openHistory: isEq ? { equipmentId: a.id } : { moldId: a.id } } })}
                      style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', borderTop: i === 0 ? 'none' : '1px solid #f1f5f9', padding: i === 0 ? '0' : '8px 0 0', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ fontSize: '10.5px', padding: '1px 6px', borderRadius: '999px', marginRight: '5px', background: isEq ? '#ecfdf5' : '#fffbeb', color: isEq ? '#047857' : '#b45309' }}>
                            {isEq ? '설비' : '금형'}
                          </span>
                          {a.name}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', flexShrink: 0 }}>
                          {a.minutes > 0 ? `${a.minutes.toLocaleString()}분` : ''} ({a.count}건)
                        </span>
                      </div>
                      <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${widthPct}%`, background: i === 0 ? '#ef4444' : i < 3 ? '#f97316' : '#fbbf24' }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="man-card">
            <h3 style={{ margin: '0 0 8px', fontSize: '14px', fontWeight: 800 }}>⚙️ 금형 누적타수 구간별 불량률</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '6px' }}>
              {equipImpact.moldBrackets.map((b) => (
                <div key={b.key} style={{ background: '#f8fafc', borderRadius: '8px', padding: '8px', border: '1px solid #f1f5f9' }}>
                  <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569' }}>{b.label}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>{b.moldCount}개</span>
                    <strong style={{ fontSize: '14px', color: b.key === 'b90' && b.rate !== null ? '#b91c1c' : '#0f172a' }}>
                      {b.rate !== null ? `${b.rate}%` : '—'}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="man-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>🔗 비가동 → 수리 → 변동점</h3>
              <button type="button" onClick={() => navigate('/', { state: { focusChain: true, expandChain: true } })} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                상세 열기 ›
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {equipImpact.chainSummary.map((row) => (
                <div key={row.label} style={{ background: '#f8fafc', borderRadius: '8px', padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
                  <strong style={{ color: '#0f172a' }}>{row.label}</strong>
                  <span style={{ color: '#475569' }}>
                    일보 {row.reportCount ?? '—'} · 수리 {row.repairCount} · 완료 <strong style={{ color: '#047857' }}>{row.doneCount}</strong>
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ── VIEW 4: 차종 비중 (6열 표 대신 차종별 카드) ── */}
      {activeTab === 'share' && (
        <div role="tabpanel" aria-labelledby="mobile-tab-share" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <section className="man-card">
            <h3 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 800 }}>🚗 차종별 생산 비중</h3>
            <div style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '8px' }}>
              총 생산 {shareData.totalActual.toLocaleString()} EA · 총 불량 {shareData.totalDefect.toLocaleString()} EA
            </div>
            {shareData.items.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b', fontSize: '12.5px' }}>집계된 차종 데이터가 없습니다.</div>
            ) : (
              <div style={{ height: '240px', position: 'relative' }}>
                <Doughnut
                  data={shareChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 }, padding: 8 } }
                    }
                  }}
                />
              </div>
            )}
          </section>

          <section className="man-card">
            <div style={{ marginBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>📋 차종별 생산 · 불량 카드</h3>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>카드를 누르면 해당 차종 파레토로 이동합니다</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {shareData.items.map((c) => (
                <button
                  key={c.car}
                  type="button"
                  onClick={() => {
                    setFilterCar(c.car);
                    setFilterPart('ALL');
                    selectTab('pareto');
                  }}
                  style={{ width: '100%', textAlign: 'left', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '9px 10px', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: 900, color: '#0f172a' }}>{c.car}</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: c.defectRate >= 1.0 ? '#dc2626' : '#059669' }}>
                      불량률 {c.defectRate}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569' }}>
                    <span>생산 <strong>{c.actual.toLocaleString()}</strong> ({c.prodSharePct}%)</span>
                    <span>불량 <strong>{c.defect.toLocaleString()}</strong> ({c.defectSharePct}%)</span>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* ── VIEW 5: 주간 스텔란티스 실적 (모바일 요약 카드) ── */}
      {activeTab === 'weekly' && (
        <div role="tabpanel" aria-labelledby="mobile-tab-weekly" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <section className="man-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>📊 스텔란티스 월간 통합 요약</h3>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>클립머신 + 반장 작업일보 합산</div>
              </div>
              <select
                aria-label="조회 월 선택"
                value={weeklyMonth}
                onChange={(e) => setWeeklyMonth(e.target.value)}
                className="form-control"
                style={{ width: 'auto', fontSize: '12.5px', fontWeight: 700, padding: '5px 8px' }}
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>{m.slice(0, 4)}년 {m.slice(5)}월</option>
                ))}
              </select>
            </div>

            {reportsLoading ? (
              <div style={{ textAlign: 'center', padding: '24px 0', fontSize: '13px', color: '#64748b' }}>스텔란티스 실적 데이터를 불러오는 중...</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {stellantisCards.map((card) => (
                  <div key={card.key} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderLeft: `4px solid ${card.color}`, borderRadius: '10px', padding: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{card.label}</strong>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: Number(card.defectRate) >= 1.5 ? '#dc2626' : '#059669' }}>
                        불량률 {card.defectRate}%
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569' }}>
                      <span>생산/포장 <strong>{card.packed.toLocaleString()}</strong> EA</span>
                      <span>폐기 <strong style={{ color: '#dc2626' }}>{card.scrap.toLocaleString()}</strong></span>
                    </div>
                    {card.clipInfo && (
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                        클립 A단면 {card.clipInfo.aPacked.toLocaleString()} / B단면 {card.clipInfo.bPacked.toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={onSwitchToPc}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  🖥️ 주차별 상세 표 / 인쇄는 PC 화면에서 보기
                </button>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── VIEW 6: 9BQC G/RUN 공정 현황 (모바일 카드) ── */}
      {activeTab === 'grun' && (
        <div role="tabpanel" aria-labelledby="mobile-tab-grun" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <section className="man-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>🏭 9BQC G/RUN 공정 현황</h3>
              <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                <input
                  type="date"
                  aria-label="9BQC 조회 일자"
                  value={grunDate}
                  onChange={(e) => setGrunDate(e.target.value || todayYmd)}
                  className="form-control"
                  style={{ width: 'auto', fontSize: '12px', padding: '4px 6px' }}
                />
                <select
                  aria-label="주야간 선택"
                  value={grunShift}
                  onChange={(e) => setGrunShift(e.target.value)}
                  className="form-control"
                  style={{ width: 'auto', fontSize: '12px', padding: '4px 6px' }}
                >
                  <option value="ALL">전체</option>
                  <option value="주간">주간</option>
                  <option value="야간">야간</option>
                </select>
              </div>
            </div>

            {grunLoading && (!grunModel || grunModel.totalReports === 0) ? (
              <div style={{ textAlign: 'center', padding: '20px 0', fontSize: '12.5px', color: '#64748b' }}>9BQC 일보를 조회 중...</div>
            ) : grunModel ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px', textAlign: 'center', marginBottom: '10px' }}>
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '7px 4px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>실적 합계</div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>{grunModel.totalActual.toLocaleString()}</div>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '7px 4px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>달성률</div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: '#2563eb', marginTop: '2px' }}>{grunModel.attainmentRate}%</div>
                  </div>
                  <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '7px 4px', border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>불량 ({grunModel.totalDefect})</div>
                    <div style={{ fontSize: '14px', fontWeight: 900, color: grunModel.defectRateTotal >= 1 ? '#dc2626' : '#059669', marginTop: '2px' }}>
                      {grunModel.defectRateTotal.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {GRUN_STAGE_GROUPS.map((stage) => {
                  const rows = grunModel.processRows.filter((p) => p.stageGroup === stage);
                  if (rows.length === 0) return null;
                  return (
                    <div key={stage} style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#475569', marginBottom: '5px' }}>{stage}</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {rows.map((p) => (
                          <div key={p.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', padding: '7px 9px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 800, color: '#0f172a' }}>{p.shortName}</div>
                              <div style={{ fontSize: '11px', color: '#64748b' }}>
                                {p.reportCount > 0 ? `${p.workers.join(', ') || '작업자'} · 초중종 ${p.lotSummary?.lotStatusLabel || '-'}` : '미입력'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <div style={{ fontWeight: 900, color: '#0f172a' }}>{p.actual.toLocaleString()} EA</div>
                              <div style={{ fontSize: '11px', fontWeight: 700, color: p.defect > 0 ? '#dc2626' : '#64748b' }}>
                                불량 {p.defect} ({p.defectRate.toFixed(2)}%)
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={onSwitchToPc}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  🖥️ LOT 타임라인 · 부자재 전체 현황판은 PC 화면에서 보기
                </button>
              </>
            ) : null}
          </section>
        </div>
      )}
    </div>
  );
}
