import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function ProcessDefectAnalysis({
  dailyStats = [],
  downtimeReports = [],
  equipments = [],
  molds = [],
  changePoints = [],
  initialSubTab = 'trend',
  hasFullHistory = false,
  onNeedFullHistory = null,
  onSubTabDemand = null
}) {
  const navigate = useNavigate();

  // 가장 최근 가동일 기준 기본 30일 범위 산정
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
  const syncedInitialBoundsRef = useRef(dailyStats.length > 0);
  const [compareMode, setCompareMode] = useState('prevMonth'); // prevMonth | prevSpan | none
  const [groupMode, setGroupMode] = useState('daily'); // daily | monthly
  const [subTab, setSubTab] = useState(initialSubTab || 'trend'); // trend | pareto | equip | share

  useEffect(() => {
    if (!syncedInitialBoundsRef.current && dailyStats.length > 0) {
      syncedInitialBoundsRef.current = true;
      if (!userTouchedDateRef.current) {
        setStartDate(dateBounds.defaultStart);
        setEndDate(dateBounds.maxDate);
      }
    }
  }, [dailyStats.length, dateBounds.defaultStart, dateBounds.maxDate]);

  // 다중 조건 필터 (기존 메인 대시보드에서 이관)
  const [filterMfg, setFilterMfg] = useState('ALL');
  const [filterCar, setFilterCar] = useState('ALL');
  const [filterPart, setFilterPart] = useState('ALL');
  const [filterProc, setFilterProc] = useState('ALL');

  const [chartGeom, setChartGeom] = useState({ left: 170, rightGap: 60 });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (initialSubTab) setSubTab(initialSubTab);
  }, [initialSubTab]);

  useEffect(() => {
    if ((subTab === 'pareto' || subTab === 'equip') && typeof onSubTabDemand === 'function') {
      onSubTabDemand(subTab);
    }
  }, [subTab, onSubTabDemand]);

  // 제조사 변경 시 하위 차종/부품 자동 보정
  const mfgOptions = useMemo(() => MANUFACTURERS.filter((m) => m.code !== '공통' && m.name !== '공통(Common)').map((m) => m.name), []);
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

  const handleMfgChange = (val) => {
    setFilterMfg(val);
    setFilterCar('ALL');
    setFilterPart('ALL');
  };

  const handleCarChange = (val) => {
    setFilterCar(val);
    setFilterPart('ALL');
  };

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

  const filters = useMemo(
    () => ({ filterMfg, filterCar, filterPart, filterProc }),
    [filterMfg, filterCar, filterPart, filterProc]
  );

  const hasActiveFilter = filterMfg !== 'ALL' || filterCar !== 'ALL' || filterPart !== 'ALL' || filterProc !== 'ALL';

  const filterSummaryNote = useMemo(() => {
    const tokens = [];
    if (filterMfg !== 'ALL') tokens.push(filterMfg);
    if (filterCar !== 'ALL') tokens.push(filterCar);
    if (filterPart !== 'ALL') tokens.push(filterPart);
    if (filterProc !== 'ALL') tokens.push(`${filterProc} 공정`);
    return tokens.length > 0 ? `${tokens.join(' · ')} 기준` : '전체 차종 · 전체 공정 기준';
  }, [filterMfg, filterCar, filterPart, filterProc]);

  // ── 4대 분석 뷰 데이터 계산 (활성 하위 탭만 지연 계산하여 초기 진입 속도 최적화) ──
  const needTrend = subTab === 'trend' || subTab === 'pareto';
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
          summary: {
            actualSum: 0,
            defectSum: 0,
            attainPct: null,
            defectRate: 0,
            actualDeltaPct: null,
            attainDeltaPt: null,
            defectRateDeltaPt: null,
            bestDay: null,
            worstDay: null
          },
          defectTable: { rows: [] },
          defectBreakdown: {}
        }),
    [needTrend, dailyStats, startDate, endDate, compareMode, groupMode, filters]
  );

  const needPareto = subTab === 'pareto';
  const paretoData = useMemo(
    () => (needPareto
      ? buildParetoAnalysis({ dailyStats, downtimeReports, startDate, endDate, compareMode, filters })
      : {
          totalDefect: 0,
          top3SharePct: 0,
          focusTargets: '—',
          paretoWithCum: [],
          processComparison: [],
          carComparison: [],
          partBreakdown: [],
          insights: [],
          compLabel: null
        }),
    [needPareto, dailyStats, downtimeReports, startDate, endDate, compareMode, filters]
  );

  const needEquip = subTab === 'equip';
  const equipImpact = useMemo(
    () => (needEquip
      ? buildEquipMoldImpact({ dailyStats, downtimeReports, equipments, molds, changePoints, startDate, endDate, filters })
      : {
          dailyDowntime: [],
          topAssets: [],
          moldBrackets: [],
          chainSummary: [],
          bannerText: ''
        }),
    [needEquip, dailyStats, downtimeReports, equipments, molds, changePoints, startDate, endDate, filters]
  );

  const needShare = subTab === 'share';
  const shareData = useMemo(
    () => (needShare
      ? buildCarShareAnalysis({ dailyStats, startDate, endDate, filters })
      : {
          items: [],
          totalActual: 0,
          totalDefect: 0
        }),
    [needShare, dailyStats, startDate, endDate, filters]
  );

  // ── 차트 데이터셋 조립 ───────────────────────────────────
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
        pointRadius: 4,
        order: 1
      },
      {
        type: 'bar',
        label: '생산수량 (EA)',
        data: trendData.actuals,
        backgroundColor: 'rgba(59,130,246,0.78)',
        borderRadius: 5,
        yAxisID: 'y',
        order: 3
      }
    ];
    if (trendData.compRange && trendData.compActualSeries.some((v) => v !== null && v > 0)) {
      datasets.push({
        type: 'line',
        label: `${trendData.compRange.label} 생산수량`,
        data: trendData.compActualSeries,
        borderColor: '#94a3b8',
        backgroundColor: '#94a3b8',
        borderDash: [5, 4],
        borderWidth: 1.8,
        pointRadius: 2,
        tension: 0.25,
        yAxisID: 'y',
        order: 2
      });
    }
    return { labels: trendData.labels, datasets };
  }, [trendData]);

  const paretoChartData = useMemo(() => ({
    labels: paretoData.paretoWithCum.map((d) => d.shortName),
    datasets: [
      {
        type: 'line',
        label: '누적 비중 (%)',
        data: paretoData.paretoWithCum.map((d) => d.cumPct),
        borderColor: '#1d4ed8',
        backgroundColor: '#ffffff',
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#1d4ed8',
        pointBorderWidth: 2,
        pointRadius: 4,
        borderWidth: 2.3,
        tension: 0.2,
        yAxisID: 'y1',
        order: 1
      },
      {
        type: 'line',
        label: '80% 기준선',
        data: paretoData.paretoWithCum.map(() => 80),
        borderColor: 'rgba(29,78,216,0.45)',
        borderDash: [4, 4],
        borderWidth: 1.4,
        pointRadius: 0,
        yAxisID: 'y1',
        order: 2
      },
      {
        type: 'bar',
        label: '불량 수량 (건)',
        data: paretoData.paretoWithCum.map((d) => d.qty),
        backgroundColor: paretoData.paretoWithCum.map((_, i) => (i === 0 ? '#ef4444' : i < 3 ? '#f97316' : '#fbbf24')),
        borderRadius: 4,
        maxBarThickness: 44,
        yAxisID: 'y',
        order: 3
      }
    ]
  }), [paretoData]);

  const equipChartData = useMemo(() => ({
    labels: equipImpact.dailyDowntime.map((d) => d.label),
    datasets: [
      {
        type: 'line',
        label: '불량률 (%)',
        data: equipImpact.dailyDowntime.map((d) => d.defectRate),
        borderColor: '#1d4ed8',
        backgroundColor: '#ffffff',
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#1d4ed8',
        pointBorderWidth: 2,
        pointRadius: 3.5,
        borderWidth: 2.3,
        tension: 0.25,
        yAxisID: 'y1',
        order: 1
      },
      {
        type: 'bar',
        label: '설비·금형 비가동 (분)',
        data: equipImpact.dailyDowntime.map((d) => d.downtimeMin),
        backgroundColor: equipImpact.dailyDowntime.map((d) => (d.isHot ? '#fca5a5' : '#cbd5e1')),
        borderColor: equipImpact.dailyDowntime.map((d) => (d.isHot ? '#ef4444' : 'transparent')),
        borderWidth: equipImpact.dailyDowntime.map((d) => (d.isHot ? 2 : 0)),
        borderRadius: 4,
        maxBarThickness: 34,
        yAxisID: 'y',
        order: 2
      }
    ]
  }), [equipImpact]);

  const shareChartData = useMemo(() => {
    const top = shareData.items.slice(0, 8);
    const restActual = shareData.items.slice(8).reduce((s, c) => s + c.actual, 0);
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

  // ── 엑셀 다운로드 핸들러 ─────────────────────────────────
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
          {
            type: 'line',
            label: '불량률 (%)',
            data: exportTrend.rates.map((r) => r.toFixed(2))
          },
          {
            type: 'bar',
            label: '생산수량 (EA)',
            data: exportTrend.actuals
          }
        ],
        totals: {
          actual: exportTrend.summary.actualSum,
          defect: exportTrend.summary.defectSum,
          rate: rateStr
        },
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

  // 파레토 막대 클릭 시 불량명의 [공정] 태그로 공정 드릴다운 지원
  const handleParetoBarClick = (_, elements) => {
    if (!elements || elements.length === 0) return;
    const idx = elements[0].index;
    const item = paretoData.paretoWithCum[idx];
    if (!item) return;
    const m = String(item.name || '').match(/^\[([^\]]+)\]/);
    if (m && PROC_OPTIONS.includes(m[1]) && filterProc === 'ALL') {
      setFilterProc(m[1]);
    }
  };

  const selectStyle = {
    padding: '6px 26px 6px 10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    outline: 'none'
  };

  const quickRangeBtnStyle = (active) => ({
    padding: '4px 10px',
    fontSize: '11px',
    fontWeight: 700,
    borderRadius: '14px',
    border: `1px solid ${active ? '#0f172a' : '#cbd5e1'}`,
    background: active ? '#0f172a' : '#ffffff',
    color: active ? '#ffffff' : '#64748b',
    cursor: 'pointer'
  });

  const subTabBtnStyle = (active) => ({
    padding: '7px 16px',
    fontSize: '13px',
    fontWeight: 700,
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    background: active ? '#0f172a' : 'transparent',
    color: active ? '#ffffff' : '#64748b',
    transition: 'all 0.15s'
  });

  const kpiBoxStyle = {
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '10px 12px'
  };

  const maxProcRate = Math.max(1, ...paretoData.processComparison.map((p) => p.rate));
  const maxMoldBracketRate = Math.max(1, ...equipImpact.moldBrackets.map((b) => b.rate || 0));
  const maxAssetVal = Math.max(1, ...equipImpact.topAssets.map((a) => (a.minutes > 0 ? a.minutes : a.count * 30)));

  return (
    <div data-process-defect-analysis="1">
      <style>{`
        [data-process-defect-analysis="1"] .pda-grid-2 {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 14px;
          margin-bottom: 14px;
        }
        [data-process-defect-analysis="1"] .pda-grid-equip {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
          gap: 14px;
          margin-bottom: 14px;
        }
        [data-process-defect-analysis="1"] .pda-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }
        [data-process-defect-analysis="1"] .pda-kpi-4 {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          margin-bottom: 14px;
        }
        @media (max-width: 1180px) {
          [data-process-defect-analysis="1"] .pda-grid-2,
          [data-process-defect-analysis="1"] .pda-grid-equip,
          [data-process-defect-analysis="1"] .pda-grid-3 {
            grid-template-columns: 1fr;
          }
          [data-process-defect-analysis="1"] .pda-kpi-4 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>

      {/* ── 상단 통합 분석 조건 바 ── */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '14px'
        }}
      >
        <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🎯</span> 분석 조건
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>기간</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              const nextVal = e.target.value;
              userTouchedDateRef.current = true;
              setStartDate(nextVal);
              if (!hasFullHistory && nextVal && nextVal < dateBounds.minDate && typeof onNeedFullHistory === 'function') {
                onNeedFullHistory();
              }
            }}
            style={{ ...selectStyle, padding: '5px 8px' }}
          />
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>~</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              userTouchedDateRef.current = true;
              setEndDate(e.target.value);
            }}
            style={{ ...selectStyle, padding: '5px 8px' }}
          />
          <div style={{ display: 'flex', gap: '4px' }}>
            <button type="button" style={quickRangeBtnStyle(startDate === shiftDays(dateBounds.maxDate, -6) && endDate === dateBounds.maxDate)} onClick={() => applyQuickRange('7d')}>7일</button>
            <button type="button" style={quickRangeBtnStyle(startDate === shiftDays(dateBounds.maxDate, -29) && endDate === dateBounds.maxDate)} onClick={() => applyQuickRange('30d')}>30일</button>
            <button type="button" style={quickRangeBtnStyle(startDate === `${dateBounds.maxDate.slice(0, 7)}-01` && endDate === dateBounds.maxDate)} onClick={() => applyQuickRange('month')}>이번달</button>
            <button type="button" style={quickRangeBtnStyle(startDate === dateBounds.minDate && endDate === dateBounds.maxDate && groupMode === 'monthly')} onClick={() => applyQuickRange('all')}>전체</button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>비교</label>
          <select value={compareMode} onChange={(e) => setCompareMode(e.target.value)} style={selectStyle}>
            <option value="prevMonth">전월 동기</option>
            <option value="prevSpan">이전 동일 기간</option>
            <option value="none">비교 안함</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>제조사</label>
          <select value={filterMfg} onChange={(e) => handleMfgChange(e.target.value)} style={selectStyle}>
            <option value="ALL">전체</option>
            {mfgOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>차종</label>
          <select value={filterCar} onChange={(e) => handleCarChange(e.target.value)} style={selectStyle}>
            <option value="ALL">전체</option>
            {carOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>세부부품</label>
          <select value={filterPart} onChange={(e) => setFilterPart(e.target.value)} style={selectStyle}>
            <option value="ALL">전체</option>
            {partOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>생산공정</label>
          <select value={filterProc} onChange={(e) => setFilterProc(e.target.value)} style={selectStyle}>
            <option value="ALL">전체</option>
            {PROC_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        {hasActiveFilter && (
          <button
            type="button"
            onClick={resetFilters}
            style={{
              padding: '5px 10px',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#475569',
              cursor: 'pointer'
            }}
          >
            조건 초기화
          </button>
        )}

        <div style={{ flex: 1 }} />

        <button
          type="button"
          onClick={handleDownloadExcel}
          disabled={exporting}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '8px',
            border: '1px solid #16a34a',
            backgroundColor: '#16a34a',
            color: '#ffffff',
            fontSize: '12px',
            fontWeight: 700,
            cursor: exporting ? 'default' : 'pointer',
            opacity: exporting ? 0.7 : 1
          }}
        >
          📥 {exporting ? '생성 중...' : '엑셀 다운로드'}
        </button>
      </div>

      {/* ── 하위 분석 뷰 전환 탭 ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', gap: '4px', background: '#e2e8f0', borderRadius: '8px', padding: '3px' }}>
          <button type="button" style={subTabBtnStyle(subTab === 'trend')} onClick={() => setSubTab('trend')}>생산 추이</button>
          <button
            type="button"
            style={subTabBtnStyle(subTab === 'pareto')}
            onMouseEnter={() => onSubTabDemand && onSubTabDemand('pareto')}
            onClick={() => setSubTab('pareto')}
          >
            불량 파레토
          </button>
          <button
            type="button"
            style={subTabBtnStyle(subTab === 'equip')}
            onMouseEnter={() => onSubTabDemand && onSubTabDemand('equip')}
            onClick={() => setSubTab('equip')}
          >
            설비·금형 영향
          </button>
          <button type="button" style={subTabBtnStyle(subTab === 'share')} onClick={() => setSubTab('share')}>차종 비중</button>
        </div>

        {subTab === 'trend' && (
          <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', borderRadius: '6px', padding: '3px' }}>
            <button
              type="button"
              onClick={() => setGroupMode('daily')}
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                background: groupMode === 'daily' ? '#ffffff' : 'transparent',
                color: groupMode === 'daily' ? '#0f172a' : '#64748b'
              }}
            >
              일별 보기
            </button>
            <button
              type="button"
              onClick={() => setGroupMode('monthly')}
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 700,
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                background: groupMode === 'monthly' ? '#ffffff' : 'transparent',
                color: groupMode === 'monthly' ? '#0f172a' : '#64748b'
              }}
            >
              월별 보기
            </button>
          </div>
        )}
      </div>

      {/* ================================================================
          VIEW 1: 생산 추이 + 일자별 불량 매트릭스
         ================================================================ */}
      {subTab === 'trend' && (
        <div className="card" style={{ margin: 0, padding: '18px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                📊 {groupMode === 'monthly' ? '월별' : '일별'} 생산 · 불량률 추이
                {trendData.compRange ? ` (${trendData.compRange.label} 비교)` : ''}
              </h3>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>{filterSummaryNote}</div>
            </div>
          </div>

          {/* 기간 요약 KPI 4개 */}
          <div className="pda-kpi-4">
            <div style={kpiBoxStyle}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>기간 실적 합계</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                {trendData.summary.actualSum.toLocaleString()} EA
              </div>
              {trendData.compRange && trendData.summary.actualDeltaPct !== null && (
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  {trendData.compRange.label} 대비{' '}
                  <span style={{ fontWeight: 700, color: trendData.summary.actualDeltaPct >= 0 ? '#15803d' : '#b91c1c' }}>
                    {trendData.summary.actualDeltaPct >= 0 ? `▲ ${trendData.summary.actualDeltaPct}%` : `▼ ${Math.abs(trendData.summary.actualDeltaPct)}%`}
                  </span>
                </div>
              )}
            </div>

            <div style={kpiBoxStyle}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>평균 달성률</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                {trendData.summary.attainPct !== null ? `${trendData.summary.attainPct}%` : '—'}
              </div>
              {trendData.compRange && trendData.summary.attainDeltaPt !== null && (
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  {trendData.compRange.label} 대비{' '}
                  <span style={{ fontWeight: 700, color: trendData.summary.attainDeltaPt >= 0 ? '#15803d' : '#b91c1c' }}>
                    {trendData.summary.attainDeltaPt >= 0 ? `▲ ${trendData.summary.attainDeltaPt}%p` : `▼ ${Math.abs(trendData.summary.attainDeltaPt)}%p`}
                  </span>
                </div>
              )}
            </div>

            <div style={kpiBoxStyle}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>평균 불량률</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                {trendData.summary.defectRate}%
              </div>
              {trendData.compRange && trendData.summary.defectRateDeltaPt !== null && (
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  {trendData.compRange.label} 대비{' '}
                  <span style={{ fontWeight: 700, color: trendData.summary.defectRateDeltaPt <= 0 ? '#15803d' : '#b91c1c' }}>
                    {trendData.summary.defectRateDeltaPt <= 0 ? `▼ ${Math.abs(trendData.summary.defectRateDeltaPt)}%p` : `▲ ${trendData.summary.defectRateDeltaPt}%p`}
                  </span>
                </div>
              )}
            </div>

            <div style={kpiBoxStyle}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>최고 / 최저 가동일</div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {trendData.summary.bestDay
                  ? `${trendData.summary.bestDay.actual.toLocaleString()} / ${trendData.summary.worstDay.actual.toLocaleString()}`
                  : '—'}
              </div>
              {trendData.summary.bestDay && (
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                  {trendData.summary.bestDay.date.slice(5).replace('-', '/')} · {trendData.summary.worstDay.date.slice(5).replace('-', '/')}
                </div>
              )}
            </div>
          </div>

          {trendData.labels.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '48px 0', fontSize: '14px' }}>
              선택한 기간 및 필터 조건에 해당하는 생산 내역이 없습니다.
            </div>
          ) : (
            <>
              <div style={{ height: '330px' }}>
                <Bar
                  data={trendChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: { padding: { left: 110, top: 14, right: 24 } },
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                      x: {
                        grid: { display: false },
                        ticks: {
                          maxRotation: 0,
                          minRotation: 0,
                          autoSkip: trendData.labels.length > 35,
                          font: { size: 10 },
                          color(context) {
                            if (trendData.effectiveMode === 'daily' && context.tick && typeof context.tick.value === 'number') {
                              const label = trendData.labels[context.tick.value];
                              if (label) {
                                const d = new Date(label);
                                if (!Number.isNaN(d.getTime()) && d.getDay() === 0) return '#ef4444';
                              }
                            }
                            return '#64748b';
                          },
                          callback(val, index) {
                            const label = trendData.labels[val];
                            if (trendData.effectiveMode !== 'daily' || !label) return label;
                            const d = new Date(label);
                            if (Number.isNaN(d.getTime())) return label;
                            const days = ['일', '월', '화', '수', '목', '금', '토'];
                            const dayStr = `${d.getDate()}일`;
                            const dowStr = `(${days[d.getDay()]})`;
                            return index === 0 ? [`${d.getFullYear()}년 ${d.getMonth() + 1}월 ${dayStr}`, dowStr] : [dayStr, dowStr];
                          }
                        }
                      },
                      y: { type: 'linear', position: 'left', title: { display: true, text: '수량 (EA)', font: { size: 12 } }, grid: { color: '#f1f5f9' } },
                      y1: { type: 'linear', position: 'right', title: { display: true, text: '불량률 (%)', font: { size: 12 } }, grid: { drawOnChartArea: false }, min: 0, grace: '22%' }
                    },
                    plugins: {
                      legend: { position: 'top', labels: { font: { size: 12 }, boxWidth: 12, padding: 14 } },
                      tooltip: { backgroundColor: 'rgba(15,23,42,0.92)', padding: 12 }
                    }
                  }}
                  plugins={[{
                    id: 'chartGeomReporter',
                    afterLayout(chart) {
                      const left = Math.round(chart.chartArea.left);
                      const rightGap = Math.round(chart.width - chart.chartArea.right);
                      setChartGeom((prev) => (prev.left === left && prev.rightGap === rightGap ? prev : { left, rightGap }));
                    }
                  }, {
                    id: 'defectRateLabels',
                    afterDatasetsDraw(chart) {
                      if (chart.data.labels.length > 35) return;
                      const ds = chart.data.datasets[0];
                      if (!ds) return;
                      const meta = chart.getDatasetMeta(0);
                      const ctx2 = chart.ctx;
                      ctx2.save();
                      ctx2.font = 'bold 12px sans-serif';
                      ctx2.fillStyle = '#ef4444';
                      ctx2.textAlign = 'center';
                      ctx2.textBaseline = 'bottom';
                      meta.data.forEach((pt, i) => {
                        const val = ds.data[i];
                        if (val === null || val === undefined || val === '') return;
                        ctx2.fillText(`${val}%`, pt.x, pt.y - 9);
                      });
                      ctx2.restore();
                    }
                  }, {
                    id: 'productionQtyLabels',
                    afterDatasetsDraw(chart) {
                      if (chart.data.labels.length > 35) return;
                      const ds = chart.data.datasets[1];
                      if (!ds) return;
                      const meta = chart.getDatasetMeta(1);
                      const ctx2 = chart.ctx;
                      ctx2.save();
                      ctx2.font = 'bold 11px sans-serif';
                      ctx2.fillStyle = '#1d4ed8';
                      ctx2.textAlign = 'center';
                      ctx2.textBaseline = 'bottom';
                      const rateDs = chart.data.datasets[0];
                      const rateMeta = chart.getDatasetMeta(0);
                      meta.data.forEach((bar, i) => {
                        const val = Number(ds.data[i]);
                        if (!val) return;
                        let y = bar.y - 4;
                        const pt = rateMeta.data[i];
                        const rv = rateDs && rateDs.data[i];
                        if (pt && rv !== null && rv !== undefined && rv !== '') {
                          const rBottom = pt.y - 9;
                          const rTop = rBottom - 14;
                          const qTop = y - 12;
                          if (y > rTop - 2 && qTop < rBottom + 2) y = rTop - 4;
                        }
                        ctx2.fillText(val.toLocaleString(), bar.x, y);
                      });
                      ctx2.restore();
                    }
                  }]}
                />
              </div>

              {/* 차트 하단 불량 유형별 일자별 수량 매트릭스 */}
              <div data-chart-defect-table="true" style={{ marginTop: '8px', overflowX: 'auto' }}>
                {trendData.defectTable.rows.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '14px 0', color: '#94a3b8', fontSize: '12px' }}>선택 기간에 불량 내역이 없습니다.</div>
                ) : (
                  <>
                    <div style={{ fontSize: '11px', color: '#94a3b8', margin: '6px 0 4px', paddingLeft: '4px' }}>
                      총 불량 <strong style={{ color: '#ef4444' }}>{trendData.summary.defectSum.toLocaleString()}</strong>건 (상위 {trendData.defectTable.rows.length}개 유형)
                    </div>
                    <div style={{ display: 'flex', alignItems: 'stretch' }}>
                      <div style={{ width: chartGeom.left, flexShrink: 0, boxSizing: 'border-box', paddingRight: '6px' }}>
                        {trendData.defectTable.rows.map((dt, i) => (
                          <div key={dt.name} title={`${dt.name} (합계 ${dt.total.toLocaleString()}건)`} style={{ height: '24px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #f1f5f9', overflow: 'hidden' }}>
                            <span style={{ flexShrink: 0, width: '16px', height: '16px', borderRadius: '50%', background: '#fef2f2', color: '#ef4444', fontSize: '9px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>{dt.name}</span>
                            <span style={{ flexShrink: 0, fontSize: '11px', fontWeight: 800, color: i === 0 ? '#ef4444' : i < 3 ? '#f97316' : '#64748b' }}>{dt.total.toLocaleString()}</span>
                          </div>
                        ))}
                        <div style={{ height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', paddingLeft: '4px', paddingRight: '2px', fontSize: '11px', fontWeight: 800, color: '#0f172a' }}>
                          <span>합계 / 전체 불량률</span>
                          <span style={{ color: '#ef4444' }}>{trendData.summary.defectSum.toLocaleString()}</span>
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }}>
                          <tbody>
                            {trendData.defectTable.rows.map((dt) => (
                              <tr key={dt.name} style={{ height: '24px' }}>
                                {trendData.labels.map((l) => {
                                  const q = dt.perLabel[l] || 0;
                                  return (
                                    <td key={l} style={{ border: '1px solid #e2e8f0', textAlign: 'center', fontSize: '10px', padding: 0, color: q > 0 ? '#ef4444' : '#cbd5e1', fontWeight: q > 0 ? 700 : 400 }}>
                                      {q > 0 ? q.toLocaleString() : '-'}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                            <tr style={{ height: '26px', background: '#f8fafc' }}>
                              {trendData.labels.map((l, i) => {
                                const dq = trendData.defects[i] || 0;
                                return (
                                  <td key={l} style={{ border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '10px', padding: 0, color: '#0f172a', fontWeight: 800 }}>
                                    {dq > 0 ? dq.toLocaleString() : '-'}
                                  </td>
                                );
                              })}
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div style={{ width: chartGeom.rightGap, flexShrink: 0, boxSizing: 'border-box', paddingLeft: '4px' }}>
                        {trendData.defectTable.rows.map((dt) => (
                          <div key={dt.name} style={{ height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #f1f5f9', fontSize: '11px', fontWeight: 800, color: '#334155' }}>
                            {dt.total.toLocaleString()}
                          </div>
                        ))}
                        <div style={{ height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fef2f2', borderRadius: '4px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#ef4444' }}>{trendData.summary.defectRate}%</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ================================================================
          VIEW 2: 불량 파레토 · 드릴다운 · 공정/차종 비교 · 자동 분석 요약
         ================================================================ */}
      {subTab === 'pareto' && (
        <>
          <div className="pda-grid-2">
            {/* 좌측: 일별 생산 추이 비교 카드 */}
            <div className="card" style={{ margin: 0, padding: '16px 18px' }}>
              <div style={{ marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>
                  📊 생산 추이 요약 {trendData.compRange ? `(이번 기간 vs ${trendData.compRange.label})` : ''}
                </h3>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>{filterSummaryNote}</div>
              </div>

              <div className="pda-kpi-4">
                <div style={kpiBoxStyle}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>기간 실적 합계</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '2px' }}>{trendData.summary.actualSum.toLocaleString()} EA</div>
                  {trendData.summary.actualDeltaPct !== null && (
                    <div style={{ fontSize: '11px', marginTop: '2px', color: '#64748b' }}>
                      비교 대비 <span style={{ fontWeight: 700, color: trendData.summary.actualDeltaPct >= 0 ? '#15803d' : '#b91c1c' }}>{trendData.summary.actualDeltaPct >= 0 ? `▲ ${trendData.summary.actualDeltaPct}%` : `▼ ${Math.abs(trendData.summary.actualDeltaPct)}%`}</span>
                    </div>
                  )}
                </div>
                <div style={kpiBoxStyle}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>평균 달성률</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '2px' }}>{trendData.summary.attainPct !== null ? `${trendData.summary.attainPct}%` : '—'}</div>
                  {trendData.summary.attainDeltaPt !== null && (
                    <div style={{ fontSize: '11px', marginTop: '2px', color: '#64748b' }}>
                      비교 대비 <span style={{ fontWeight: 700, color: trendData.summary.attainDeltaPt >= 0 ? '#15803d' : '#b91c1c' }}>{trendData.summary.attainDeltaPt >= 0 ? `▲ ${trendData.summary.attainDeltaPt}%p` : `▼ ${Math.abs(trendData.summary.attainDeltaPt)}%p`}</span>
                    </div>
                  )}
                </div>
                <div style={kpiBoxStyle}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>평균 불량률</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, marginTop: '2px' }}>{trendData.summary.defectRate}%</div>
                  {trendData.summary.defectRateDeltaPt !== null && (
                    <div style={{ fontSize: '11px', marginTop: '2px', color: '#64748b' }}>
                      비교 대비 <span style={{ fontWeight: 700, color: trendData.summary.defectRateDeltaPt <= 0 ? '#15803d' : '#b91c1c' }}>{trendData.summary.defectRateDeltaPt <= 0 ? `▼ ${Math.abs(trendData.summary.defectRateDeltaPt)}%p` : `▲ ${trendData.summary.defectRateDeltaPt}%p`}</span>
                    </div>
                  )}
                </div>
                <div style={kpiBoxStyle}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>최고 / 최저 일</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, marginTop: '4px' }}>
                    {trendData.summary.bestDay ? `${trendData.summary.bestDay.actual.toLocaleString()} / ${trendData.summary.worstDay.actual.toLocaleString()}` : '—'}
                  </div>
                  {trendData.summary.bestDay && (
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                      {trendData.summary.bestDay.date.slice(5).replace('-', '/')} · {trendData.summary.worstDay.date.slice(5).replace('-', '/')}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ height: '235px' }}>
                <Bar
                  data={{
                    labels: trendData.labels.map((l) => (l.length === 10 ? l.slice(5).replace('-', '/') : l)),
                    datasets: [
                      {
                        type: 'line',
                        label: '이번 기간 실적',
                        data: trendData.actuals,
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(59,130,246,0.12)',
                        fill: true,
                        borderWidth: 2.3,
                        pointRadius: 2.5,
                        tension: 0.25
                      },
                      ...(trendData.compRange ? [{
                        type: 'line',
                        label: trendData.compRange.label,
                        data: trendData.compActualSeries,
                        borderColor: '#94a3b8',
                        borderDash: [5, 4],
                        borderWidth: 1.8,
                        pointRadius: 0,
                        fill: false,
                        tension: 0.25
                      }] : [])
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                      x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#94a3b8', maxTicksLimit: 8 } },
                      y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, color: '#94a3b8' } }
                    },
                    plugins: {
                      legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
                    }
                  }}
                />
              </div>
            </div>

            {/* 우측: 불량 원인 파레토 (드릴다운 브레드크럼 포함) */}
            <div className="card" style={{ margin: 0, padding: '16px 18px' }}>
              <div style={{ marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>🚨 불량 원인 파레토 (누적 %)</h3>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                  막대·하단 공정·차종을 누르면 조건을 좁혀 원인을 파고듭니다
                </div>
              </div>

              {/* 드릴다운 브레드크럼 */}
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', fontSize: '12px', marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={resetFilters}
                  style={{
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: '12px',
                    background: !hasActiveFilter ? '#0f172a' : '#eff6ff',
                    color: !hasActiveFilter ? '#ffffff' : '#1d4ed8'
                  }}
                >
                  전체
                </button>
                {filterProc !== 'ALL' && (
                  <>
                    <span style={{ color: '#94a3b8' }}>›</span>
                    <button
                      type="button"
                      onClick={() => setFilterProc('ALL')}
                      title="클릭하여 공정 필터 해제"
                      style={{ border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '12px', background: '#eff6ff', color: '#1d4ed8' }}
                    >
                      {filterProc} 공정 ✕
                    </button>
                  </>
                )}
                {filterMfg !== 'ALL' && (
                  <>
                    <span style={{ color: '#94a3b8' }}>›</span>
                    <button
                      type="button"
                      onClick={() => handleMfgChange('ALL')}
                      style={{ border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '12px', background: '#eff6ff', color: '#1d4ed8' }}
                    >
                      {filterMfg} ✕
                    </button>
                  </>
                )}
                {filterCar !== 'ALL' && (
                  <>
                    <span style={{ color: '#94a3b8' }}>›</span>
                    <button
                      type="button"
                      onClick={() => handleCarChange('ALL')}
                      style={{ border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '12px', background: '#0f172a', color: '#ffffff' }}
                    >
                      {filterCar} ✕
                    </button>
                  </>
                )}
                {filterPart !== 'ALL' && (
                  <>
                    <span style={{ color: '#94a3b8' }}>›</span>
                    <button
                      type="button"
                      onClick={() => setFilterPart('ALL')}
                      style={{ border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '12px', background: '#ecfdf5', color: '#047857' }}
                    >
                      {filterPart} ✕
                    </button>
                  </>
                )}
                {filterCar !== 'ALL' && filterPart === 'ALL' && paretoData.partBreakdown.length > 1 && (
                  <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center', marginLeft: '4px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '11px' }}>세부부품:</span>
                    {paretoData.partBreakdown.map((pb) => (
                      <button
                        key={pb.part}
                        type="button"
                        onClick={() => setFilterPart(pb.part)}
                        style={{ border: '1px solid #cbd5e1', background: '#fff', borderRadius: '10px', fontSize: '11px', padding: '1px 7px', cursor: 'pointer', color: '#334155', fontWeight: 600 }}
                      >
                        {pb.part} ({pb.defect})
                      </button>
                    ))}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px', marginBottom: '12px' }}>
                <div style={kpiBoxStyle}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>불량 합계</div>
                  <div style={{ fontSize: '19px', fontWeight: 800, marginTop: '2px' }}>{paretoData.totalDefect.toLocaleString()} 건</div>
                </div>
                <div style={kpiBoxStyle}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>상위 3개 유형 비중</div>
                  <div style={{ fontSize: '19px', fontWeight: 800, marginTop: '2px' }}>{paretoData.top3SharePct}%</div>
                </div>
                <div style={kpiBoxStyle}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>집중 개선 대상</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#b91c1c', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={paretoData.focusTargets}>
                    {paretoData.focusTargets}
                  </div>
                </div>
              </div>

              {paretoData.paretoWithCum.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '48px 0', fontSize: '13px' }}>선택 조건에 해당하는 불량 내역이 없습니다.</div>
              ) : (
                <div style={{ height: '235px' }}>
                  <Bar
                    data={paretoChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      onClick: handleParetoBarClick,
                      interaction: { mode: 'index', intersect: false },
                      scales: {
                        x: { grid: { display: false }, ticks: { font: { size: 11, weight: '600' }, color: '#475569' } },
                        y: { type: 'linear', position: 'left', beginAtZero: true, grace: '15%', grid: { color: '#f1f5f9' }, ticks: { font: { size: 11 }, color: '#94a3b8' } },
                        y1: { type: 'linear', position: 'right', min: 0, max: 100, grid: { drawOnChartArea: false }, ticks: { font: { size: 11 }, color: '#1d4ed8', callback: (v) => `${v}%` } }
                      },
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: 'rgba(15,23,42,0.92)',
                          callbacks: {
                            title: (ctx) => paretoData.paretoWithCum[ctx[0].dataIndex]?.name || ctx[0].label
                          }
                        }
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 하단 3열: 공정별 불량률 비교 | 차종별 불량 상위 | 자동 분석 요약 */}
          <div className="pda-grid-3">
            {/* 1) 공정별 불량률 비교 */}
            <div className="card" style={{ margin: 0, padding: '16px 18px' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 800 }}>🏭 공정별 불량률 비교</h3>
              {paretoData.processComparison.map((p) => {
                const isSelected = filterProc === p.proc;
                const barColor = p.rate >= 2.5 ? '#ef4444' : p.rate >= 1.5 ? '#f59e0b' : p.rate > 0 ? '#60a5fa' : '#cbd5e1';
                return (
                  <button
                    key={p.proc}
                    type="button"
                    onClick={() => setFilterProc(isSelected ? 'ALL' : p.proc)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      border: isSelected ? '1px solid #2563eb' : '1px solid transparent',
                      background: isSelected ? '#eff6ff' : 'transparent',
                      borderRadius: '6px',
                      padding: '7px 8px',
                      cursor: 'pointer',
                      fontFamily: 'inherit'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '5px' }}>
                      <span>{p.proc}</span>
                      <span>
                        {p.rate}% <span style={{ fontSize: '11px', fontWeight: 400, color: '#94a3b8' }}>({p.defect.toLocaleString()}건)</span>
                      </span>
                    </div>
                    <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (p.rate / maxProcRate) * 100)}%`, background: barColor, borderRadius: '4px' }} />
                    </div>
                  </button>
                );
              })}
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>※ 공정을 누르면 해당 공정으로 필터가 전환됩니다</div>
            </div>

            {/* 2) 차종별 불량 상위 */}
            <div className="card" style={{ margin: 0, padding: '16px 18px' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 800 }}>🚗 차종별 불량 상위</h3>
              {paretoData.carComparison.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 0', fontSize: '13px' }}>집계된 차종 데이터가 없습니다.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', color: '#64748b', fontSize: '12px', padding: '6px 8px', borderBottom: '1px solid #e2e8f0' }}>차종</th>
                      <th style={{ textAlign: 'right', color: '#64748b', fontSize: '12px', padding: '6px 8px', borderBottom: '1px solid #e2e8f0' }}>불량</th>
                      <th style={{ textAlign: 'right', color: '#64748b', fontSize: '12px', padding: '6px 8px', borderBottom: '1px solid #e2e8f0' }}>불량률</th>
                      <th style={{ textAlign: 'right', color: '#64748b', fontSize: '12px', padding: '6px 8px', borderBottom: '1px solid #e2e8f0' }}>
                        {paretoData.compLabel ? `${paretoData.compLabel} 대비` : '생산량'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paretoData.carComparison.map((c) => {
                      const active = filterCar === c.car;
                      return (
                        <tr
                          key={c.car}
                          onClick={() => handleCarChange(active ? 'ALL' : c.car)}
                          title="클릭 시 해당 차종으로 필터링"
                          style={{ cursor: 'pointer', background: active ? '#eff6ff' : 'transparent' }}
                        >
                          <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: active ? '#1d4ed8' : '#0f172a' }}>{c.car}</td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 700 }}>{c.defect.toLocaleString()}</td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>{c.rate}%</td>
                          <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 700 }}>
                            {paretoData.compLabel ? (
                              c.deltaPt !== null ? (
                                <span style={{ color: c.deltaPt <= 0 ? '#15803d' : '#b91c1c' }}>
                                  {c.deltaPt <= 0 ? `▼ ${Math.abs(c.deltaPt)}%p` : `▲ ${c.deltaPt}%p`}
                                </span>
                              ) : <span style={{ color: '#94a3b8' }}>—</span>
                            ) : `${c.actual.toLocaleString()} EA`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* 3) 자동 분석 요약 */}
            <div className="card" style={{ margin: 0, padding: '16px 18px' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: '15px', fontWeight: 800 }}>💡 자동 분석 요약</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {paretoData.insights.map((ins, i) => {
                  const palette = ins.tone === 'red'
                    ? { bg: '#fef2f2', border: '#fecaca', color: '#7f1d1d' }
                    : ins.tone === 'green'
                      ? { bg: '#ecfdf5', border: '#a7f3d0', color: '#064e3b' }
                      : ins.tone === 'amber'
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
                        padding: '10px 14px',
                        fontSize: '13px',
                        lineHeight: 1.5
                      }}
                    >
                      {ins.text}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================================================================
          VIEW 3: 설비·금형 영향 분석
         ================================================================ */}
      {subTab === 'equip' && (
        <>
          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              color: '#1e3a8a',
              borderRadius: '8px',
              padding: '11px 15px',
              fontSize: '13px',
              fontWeight: 600,
              marginBottom: '14px'
            }}
          >
            💡 {equipImpact.bannerText}
          </div>

          <div className="pda-grid-equip">
            {/* 일별 비가동 시간 vs 불량률 복합 차트 */}
            <div className="card" style={{ margin: 0, padding: '16px 18px' }}>
              <div style={{ marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>⏱️ 일별 비가동 시간 vs 불량률</h3>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                  막대 = 설비·금형 비가동(분) · 선 = 불량률(%) · 붉은 강조 막대 = 비가동 150분 이상 발생일
                </div>
              </div>
              {equipImpact.dailyDowntime.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '48px 0', fontSize: '13px' }}>선택 기간에 집계된 가동 내역이 없습니다.</div>
              ) : (
                <div style={{ height: '255px' }}>
                  <Bar
                    data={equipChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: { mode: 'index', intersect: false },
                      scales: {
                        x: { grid: { display: false }, ticks: { font: { size: 11 }, color: '#64748b', maxTicksLimit: 16 } },
                        y: { type: 'linear', position: 'left', beginAtZero: true, grace: '15%', title: { display: true, text: '비가동 (분)', font: { size: 11 } }, grid: { color: '#f1f5f9' } },
                        y1: { type: 'linear', position: 'right', beginAtZero: true, grace: '22%', title: { display: true, text: '불량률 (%)', font: { size: 11 } }, grid: { drawOnChartArea: false }, ticks: { callback: (v) => `${v}%` } }
                      },
                      plugins: {
                        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {/* 설비·금형별 비가동 TOP 5 */}
            <div className="card" style={{ margin: 0, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>🔧 설비·금형별 비가동 · 수리 TOP 5</h3>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>항목을 누르면 해당 설비/금형 이력카드로 이동합니다</div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/equipment')}
                  style={{ background: 'none', border: 'none', fontSize: '12px', fontWeight: 700, color: '#2563eb', cursor: 'pointer' }}
                >
                  설비관리 →
                </button>
              </div>

              {equipImpact.topAssets.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '44px 0', fontSize: '13px' }}>
                  선택 기간 내 설비·금형 비가동 및 수리 의뢰 내역이 없습니다.
                </div>
              ) : (
                equipImpact.topAssets.map((a, i) => {
                  const metricVal = a.minutes > 0 ? a.minutes : a.count * 30;
                  const widthPct = Math.round((metricVal / maxAssetVal) * 100);
                  const isEq = a.kind === 'equipment';
                  return (
                    <button
                      key={`${a.kind}_${a.id}`}
                      type="button"
                      onClick={() => {
                        if (isEq) navigate('/equipment', { state: { openHistory: { equipmentId: a.id } } });
                        else navigate('/mold', { state: { openHistory: { moldId: a.id } } });
                      }}
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        borderTop: i === 0 ? 'none' : '1px solid #f1f5f9',
                        padding: '9px 0',
                        cursor: 'pointer',
                        fontFamily: 'inherit'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#0f172a' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              marginRight: '6px',
                              background: isEq ? '#ecfdf5' : '#fffbeb',
                              color: isEq ? '#047857' : '#b45309'
                            }}
                          >
                            {isEq ? '설비' : '금형'}
                          </span>
                          {a.name}{a.code && !String(a.name).includes(a.code) ? ` (${a.code})` : ''}
                        </span>
                        <span style={{ flexShrink: 0, color: '#0f172a' }}>
                          {a.minutes > 0 ? `${a.minutes.toLocaleString()}분 ` : ''}
                          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>({a.count}건)</span>
                        </span>
                      </div>
                      <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${widthPct}%`, background: i === 0 ? '#ef4444' : i < 3 ? '#f97316' : '#fbbf24', borderRadius: '4px' }} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="pda-grid-2" style={{ marginBottom: 0 }}>
            {/* 금형 누적타수 구간별 불량률 */}
            <div className="card" style={{ margin: 0, padding: '16px 18px' }}>
              <div style={{ marginBottom: '10px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>⚙️ 금형 누적타수 구간별 분포 · 평균 불량률</h3>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>금형 수명 소진 구간별 등록 금형 수와 해당 차종 평균 불량률</div>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', color: '#64748b', fontSize: '12px', padding: '7px 8px', borderBottom: '1px solid #e2e8f0' }}>누적타수 구간</th>
                    <th style={{ textAlign: 'right', color: '#64748b', fontSize: '12px', padding: '7px 8px', borderBottom: '1px solid #e2e8f0' }}>금형 수</th>
                    <th style={{ width: '42%', textAlign: 'left', color: '#64748b', fontSize: '12px', padding: '7px 8px', borderBottom: '1px solid #e2e8f0' }}>평균 불량률</th>
                    <th style={{ textAlign: 'right', color: '#64748b', fontSize: '12px', padding: '7px 8px', borderBottom: '1px solid #e2e8f0' }}>수치</th>
                  </tr>
                </thead>
                <tbody>
                  {equipImpact.moldBrackets.map((b) => (
                    <tr key={b.key}>
                      <td style={{ padding: '9px 8px', borderBottom: '1px solid #f1f5f9', fontWeight: 700 }}>{b.label}</td>
                      <td style={{ padding: '9px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>{b.moldCount}개</td>
                      <td style={{ padding: '9px 8px', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ height: '9px', background: '#f1f5f9', borderRadius: '5px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: b.rate !== null ? `${Math.min(100, (b.rate / maxMoldBracketRate) * 100)}%` : '0%', background: b.color, borderRadius: '5px' }} />
                        </div>
                      </td>
                      <td style={{ padding: '9px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 700, color: b.key === 'b90' && b.rate !== null ? '#b91c1c' : '#0f172a' }}>
                        {b.rate !== null ? `${b.rate}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 비가동 → 수리 → 변동점 처리 현황 기간 합계 */}
            <div className="card" style={{ margin: 0, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>🔗 비가동 → 수리 → 변동점 처리 현황 (기간 합계)</h3>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>원인 발생 후 후속 조치 및 품질확인 완료 집계</div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/', { state: { focusChain: true, expandChain: true } })}
                  style={{ background: 'none', border: 'none', fontSize: '12px', fontWeight: 700, color: '#2563eb', cursor: 'pointer' }}
                >
                  연계 현황 열기 →
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', color: '#64748b', fontSize: '12px', padding: '7px 8px', borderBottom: '1px solid #e2e8f0' }}>구분</th>
                    <th style={{ textAlign: 'right', color: '#64748b', fontSize: '12px', padding: '7px 8px', borderBottom: '1px solid #e2e8f0' }}>비가동 일보</th>
                    <th style={{ textAlign: 'right', color: '#64748b', fontSize: '12px', padding: '7px 8px', borderBottom: '1px solid #e2e8f0' }}>수리 의뢰</th>
                    <th style={{ textAlign: 'right', color: '#64748b', fontSize: '12px', padding: '7px 8px', borderBottom: '1px solid #e2e8f0' }}>변동점 등록</th>
                    <th style={{ textAlign: 'right', color: '#64748b', fontSize: '12px', padding: '7px 8px', borderBottom: '1px solid #e2e8f0' }}>완료</th>
                  </tr>
                </thead>
                <tbody>
                  {equipImpact.chainSummary.map((row) => {
                    const baseTotal = Math.max(row.reportCount || 0, row.repairCount || 0);
                    const allDone = baseTotal > 0 && row.doneCount >= baseTotal;
                    return (
                      <tr key={row.label}>
                        <td style={{ padding: '9px 8px', borderBottom: '1px solid #f1f5f9', fontWeight: 700 }}>{row.label}</td>
                        <td style={{ padding: '9px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>
                          {row.reportCount === null ? '—' : `${row.reportCount}건`}
                        </td>
                        <td style={{ padding: '9px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>{row.repairCount}건</td>
                        <td style={{ padding: '9px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>{row.cpCount}건</td>
                        <td style={{ padding: '9px 8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '12px',
                              background: baseTotal === 0 ? '#f1f5f9' : allDone ? '#ecfdf5' : '#fffbeb',
                              color: baseTotal === 0 ? '#64748b' : allDone ? '#047857' : '#b45309'
                            }}
                          >
                            {row.doneCount}건
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '8px' }}>
                ※ 미완료(진행중) 건은 메인 대시보드 「조치 필요」 카드에서 바로 확인·이동할 수 있습니다
              </div>
            </div>
          </div>
        </>
      )}

      {/* ================================================================
          VIEW 4: 차종 비중 (실데이터 도넛 + 비교표)
         ================================================================ */}
      {subTab === 'share' && (
        <div className="pda-grid-2" style={{ marginBottom: 0 }}>
          <div className="card" style={{ margin: 0, padding: '16px 18px' }}>
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>🚗 차종별 생산 비중</h3>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                선택 기간 총 생산 {shareData.totalActual.toLocaleString()} EA · 총 불량 {shareData.totalDefect.toLocaleString()} EA
              </div>
            </div>
            {shareData.items.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '48px 0', fontSize: '13px' }}>선택 기간에 집계된 차종 데이터가 없습니다.</div>
            ) : (
              <div style={{ height: '290px' }}>
                <Doughnut
                  data={shareChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'right', labels: { font: { size: 12 }, padding: 12 } }
                    }
                  }}
                />
              </div>
            )}
          </div>

          <div className="card" style={{ margin: 0, padding: '16px 18px' }}>
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>📋 차종별 생산 · 불량 점유율 비교표</h3>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>행을 누르면 해당 차종의 불량 파레토 분석으로 바로 이동합니다</div>
            </div>
            {shareData.items.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '48px 0', fontSize: '13px' }}>데이터 없음</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', color: '#64748b', fontSize: '12px', padding: '7px 8px', borderBottom: '1px solid #e2e8f0' }}>차종</th>
                      <th style={{ textAlign: 'right', color: '#64748b', fontSize: '12px', padding: '7px 8px', borderBottom: '1px solid #e2e8f0' }}>생산수량</th>
                      <th style={{ textAlign: 'right', color: '#64748b', fontSize: '12px', padding: '7px 8px', borderBottom: '1px solid #e2e8f0' }}>생산 비중</th>
                      <th style={{ textAlign: 'right', color: '#64748b', fontSize: '12px', padding: '7px 8px', borderBottom: '1px solid #e2e8f0' }}>불량수량</th>
                      <th style={{ textAlign: 'right', color: '#64748b', fontSize: '12px', padding: '7px 8px', borderBottom: '1px solid #e2e8f0' }}>불량 비중</th>
                      <th style={{ textAlign: 'right', color: '#64748b', fontSize: '12px', padding: '7px 8px', borderBottom: '1px solid #e2e8f0' }}>불량률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shareData.items.map((c) => (
                      <tr
                        key={c.car}
                        onClick={() => {
                          handleCarChange(c.car);
                          setSubTab('pareto');
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', fontWeight: 700, color: '#0f172a' }}>{c.car}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 600 }}>{c.actual.toLocaleString()}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', color: '#2563eb', fontWeight: 700 }}>{c.prodSharePct}%</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', color: c.defect > 0 ? '#dc2626' : '#94a3b8', fontWeight: 700 }}>{c.defect.toLocaleString()}</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right' }}>{c.defectSharePct}%</td>
                        <td style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', textAlign: 'right', fontWeight: 700 }}>{c.defectRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
