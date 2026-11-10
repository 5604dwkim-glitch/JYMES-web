import React, { useCallback, useEffect, useMemo, useState, Suspense, lazy } from 'react';
import { Bar } from 'react-chartjs-2';
import { fetchFmbInventory, fetchFmbReports, subscribeFmbInventory } from '../../services/firestore';
import { buildLiveStockSummary, buildMonthlyIoAndCheckSummary, formatKg } from './fmbBoardUtils';
import FmbStatusBoardModal from './FmbStatusBoardModal';

const LegacyDetailModal = lazy(() => import('../DynamicForms/LegacyDetailModal'));
const FMB_LOCAL_CACHE_KEY = 'jymes_fmb_inventory_v1';

function readCachedFmbInv() {
  try {
    const raw = localStorage.getItem(FMB_LOCAL_CACHE_KEY);
    if (!raw) return { items: [], alarmHistory: [] };
    const parsed = JSON.parse(raw);
    return {
      items: Array.isArray(parsed?.items) ? parsed.items : [],
      alarmHistory: Array.isArray(parsed?.alarmHistory) ? parsed.alarmHistory : []
    };
  } catch {
    return { items: [], alarmHistory: [] };
  }
}

// 그래프 좌·우 Y축 폭과 하단 표 좌측(항목)·우측(월평균) 열 폭을 동일 픽셀로 고정해 1일~말일 세로선을 1:1 정렬
const LEFT_AXIS_WIDTH = 72;
const RIGHT_AXIS_WIDTH = 56;

function parseMetric(raw) {
  if (raw === null || raw === undefined) return null;
  const str = String(raw).trim();
  if (!str) return null;
  const match = str.match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const num = Number(match[0]);
  return Number.isFinite(num) ? num : null;
}

function shiftYearMonth(ym, deltaMonths) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, (m - 1) + deltaMonths, 1);
  const ny = d.getFullYear();
  const nm = String(d.getMonth() + 1).padStart(2, '0');
  return `${ny}-${nm}`;
}

const STATUS_PRIORITY = {
  '승인 완료': 3,
  '승인 대기': 2,
  '반려': 1,
  '임시저장': 0
};

export default function FmbEnvMonthlyCard({ fmbReports = [], navigate }) {
  const currentYm = useMemo(() => new Date().toLocaleDateString('sv-SE').slice(0, 7), []);
  const todayFull = useMemo(() => new Date().toLocaleDateString('sv-SE'), []);

  const [selectedMonth, setSelectedMonth] = useState(currentYm);
  const [detailReport, setDetailReport] = useState(null);
  const [showStatusBoard, setShowStatusBoard] = useState(false);
  const [liveReports, setLiveReports] = useState(fmbReports);
  const [fmbInvState, setFmbInvState] = useState(() => readCachedFmbInv());

  useEffect(() => {
    setLiveReports(fmbReports);
  }, [fmbReports]);

  useEffect(() => {
    const unsub = subscribeFmbInventory((next) => {
      setFmbInvState({
        items: Array.isArray(next?.items) ? next.items : [],
        alarmHistory: Array.isArray(next?.alarmHistory) ? next.alarmHistory : []
      });
    });
    return () => unsub?.();
  }, []);

  const handleRefreshFmbAll = useCallback(async () => {
    const [freshReports, freshInv] = await Promise.all([
      fetchFmbReports(true),
      fetchFmbInventory()
    ]);
    if (Array.isArray(freshReports)) {
      setLiveReports(freshReports);
    }
    if (freshInv && !freshInv.offlineError) {
      setFmbInvState({
        items: Array.isArray(freshInv.items) ? freshInv.items : [],
        alarmHistory: Array.isArray(freshInv.alarmHistory) ? freshInv.alarmHistory : []
      });
    }
  }, []);

  const stockSummary = useMemo(
    () => buildLiveStockSummary(fmbInvState.items, todayFull),
    [fmbInvState.items, todayFull]
  );

  const ioCheckSummary = useMemo(
    () => buildMonthlyIoAndCheckSummary(liveReports, selectedMonth, fmbInvState.alarmHistory),
    [liveReports, selectedMonth, fmbInvState.alarmHistory]
  );

  // 가장 최근 기록이 있는 월 안내용 (현재 선택 월에 기록이 없을 때 빠른 이동 지원)
  const latestRecordedMonth = useMemo(() => {
    let latest = '';
    liveReports.forEach((r) => {
      const ym = String(r?.date || '').slice(0, 7);
      if (/^\d{4}-\d{2}$/.test(ym) && ym > latest) latest = ym;
    });
    return latest;
  }, [liveReports]);

  const monthly = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    const byDay = new Map();
    liveReports.forEach((r) => {
      const dateStr = String(r?.date || '');
      if (!dateStr.startsWith(`${selectedMonth}-`)) return;
      const dayNum = Number(dateStr.slice(8, 10));
      if (!Number.isInteger(dayNum) || dayNum < 1 || dayNum > daysInMonth) return;
      if (!byDay.has(dayNum)) byDay.set(dayNum, []);
      byDay.get(dayNum).push(r);
    });

    const days = [];
    const labels = [];
    const temps = [];
    const hums = [];

    const validTemps = [];
    const validHums = [];
    let recordedDays = 0;
    let issueDays = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dd = String(d).padStart(2, '0');
      const fullDate = `${selectedMonth}-${dd}`;
      const dow = new Date(year, month - 1, d).getDay(); // 0: 일, 6: 토
      const list = byDay.get(d) || [];

      const sorted = [...list].sort((a, b) => {
        const pa = STATUS_PRIORITY[a?.status] ?? 1;
        const pb = STATUS_PRIORITY[b?.status] ?? 1;
        if (pb !== pa) return pb - pa;
        return String(b?.id || '').localeCompare(String(a?.id || ''));
      });

      const primary = sorted[0] || null;

      // 같은 날 여러 건 작성된 경우 유효 수치 평균(소수 첫째 자리) 계산
      const dayTemps = sorted
        .map((it) => parseMetric(it?.f9004_env?.f9004_temp))
        .filter((v) => v !== null);
      const dayHums = sorted
        .map((it) => parseMetric(it?.f9004_env?.f9004_humidity))
        .filter((v) => v !== null);

      const tempVal = dayTemps.length > 0
        ? +(dayTemps.reduce((acc, v) => acc + v, 0) / dayTemps.length).toFixed(1)
        : null;
      const humVal = dayHums.length > 0
        ? +(dayHums.reduce((acc, v) => acc + v, 0) / dayHums.length).toFixed(1)
        : null;

      const hasCheckIssue = sorted.some((it) => {
        const chks = it?.f9004_checks;
        return chks && Object.values(chks).some((v) => v === false);
      });

      const hasAnyRecord = Boolean(primary);
      if (hasAnyRecord) recordedDays += 1;
      if (hasCheckIssue) issueDays += 1;
      if (tempVal !== null) validTemps.push(tempVal);
      if (humVal !== null) validHums.push(humVal);

      labels.push(`${d}일`);
      temps.push(tempVal);
      hums.push(humVal);

      days.push({
        day: d,
        fullDate,
        dow,
        isToday: fullDate === todayFull,
        primary,
        entryCount: sorted.length,
        tempVal,
        humVal,
        rawTemp: primary?.f9004_env?.f9004_temp || '',
        rawHum: primary?.f9004_env?.f9004_humidity || '',
        envNote: primary?.f9004_env?.f9004_envNote || '',
        hasCheckIssue,
        isDraftOnly: Boolean(primary && primary.status === '임시저장')
      });
    }

    const avgTemp = validTemps.length > 0
      ? +(validTemps.reduce((a, b) => a + b, 0) / validTemps.length).toFixed(1)
      : null;
    const minTemp = validTemps.length > 0 ? Math.min(...validTemps) : null;
    const maxTemp = validTemps.length > 0 ? Math.max(...validTemps) : null;

    const avgHum = validHums.length > 0
      ? +(validHums.reduce((a, b) => a + b, 0) / validHums.length).toFixed(1)
      : null;
    const minHum = validHums.length > 0 ? Math.min(...validHums) : null;
    const maxHum = validHums.length > 0 ? Math.max(...validHums) : null;

    return {
      year,
      month,
      daysInMonth,
      days,
      labels,
      temps,
      hums,
      recordedDays,
      issueDays,
      hasChartValues: validTemps.length > 0 || validHums.length > 0,
      avgTemp,
      minTemp,
      maxTemp,
      avgHum,
      minHum,
      maxHum
    };
  }, [liveReports, selectedMonth, todayFull]);

  const chartData = useMemo(() => ({
    labels: monthly.labels,
    datasets: [
      {
        type: 'line',
        label: '보관실 온도 (℃)',
        data: monthly.temps,
        borderColor: '#ef4444',
        backgroundColor: '#ffffff',
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#ef4444',
        pointBorderWidth: 2.2,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2.4,
        tension: 0.25,
        spanGaps: true,
        yAxisID: 'yTemp',
        order: 1
      },
      {
        type: 'bar',
        label: '보관실 습도 (%)',
        data: monthly.hums,
        backgroundColor: 'rgba(14, 165, 233, 0.28)',
        borderColor: 'rgba(2, 132, 199, 0.75)',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.62,
        categoryPercentage: 0.82,
        yAxisID: 'yHum',
        order: 2
      }
    ]
  }), [monthly.labels, monthly.temps, monthly.hums]);

  const valueLabelsPlugin = useMemo(() => ([{
    id: 'fmbEnvMonthlyValueLabels',
    afterDatasetsDraw(chart) {
      const { ctx, chartArea } = chart;
      if (!chartArea) return;
      const tempIdx = chart.data.datasets.findIndex((d) => d.yAxisID === 'yTemp');
      const humIdx = chart.data.datasets.findIndex((d) => d.yAxisID === 'yHum');

      const clampY = (y) => Math.max(chartArea.top + 11, Math.min(chartArea.bottom - 2, y));

      ctx.save();
      if (humIdx >= 0) {
        const humMeta = chart.getDatasetMeta(humIdx);
        const humDs = chart.data.datasets[humIdx];
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#0369a1';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        humMeta.data.forEach((bar, i) => {
          const val = humDs.data[i];
          if (val !== null && val !== undefined) {
            ctx.fillText(`${val}%`, bar.x, clampY(bar.y - 3));
          }
        });
      }
      if (tempIdx >= 0) {
        const tempMeta = chart.getDatasetMeta(tempIdx);
        const tempDs = chart.data.datasets[tempIdx];
        ctx.font = 'bold 10px sans-serif';
        ctx.fillStyle = '#b91c1c';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        tempMeta.data.forEach((pt, i) => {
          const val = tempDs.data[i];
          if (val !== null && val !== undefined) {
            ctx.fillText(`${val}°`, pt.x, clampY(pt.y - 7));
          }
        });
      }
      ctx.restore();
    }
  }]), []);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 18, right: 0, left: 0, bottom: 0 } },
    interaction: { mode: 'index', intersect: false },
    onClick: (_evt, elements) => {
      if (!elements || elements.length === 0) return;
      const idx = elements[0].index;
      const dayInfo = monthly.days[idx];
      if (dayInfo?.primary) {
        setDetailReport(dayInfo.primary);
      }
    },
    scales: {
      x: {
        offset: true,
        bounds: 'data',
        grid: {
          display: true,
          offset: true,
          color: '#e2e8f0',
          drawTicks: true,
          tickLength: 4,
          tickColor: '#cbd5e1'
        },
        border: {
          display: true,
          color: '#cbd5e1'
        },
        ticks: {
          autoSkip: false,
          maxRotation: 0,
          padding: 4,
          font: { size: 10, weight: '700' },
          color: (ctx) => {
            const info = monthly.days[ctx.index];
            if (!info) return '#64748b';
            if (info.isToday) return '#047857';
            if (info.dow === 0) return '#dc2626';
            if (info.dow === 6) return '#2563eb';
            return '#64748b';
          }
        }
      },
      yTemp: {
        type: 'linear',
        position: 'left',
        min: 10,
        max: 30,
        afterFit: (scale) => {
          scale.width = LEFT_AXIS_WIDTH;
        },
        grid: { color: '#f1f5f9' },
        border: { display: true, color: '#cbd5e1' },
        title: {
          display: true,
          text: '온도 (℃)',
          color: '#dc2626',
          padding: { top: 0, bottom: 2 },
          font: { size: 11, weight: '700' }
        },
        ticks: {
          stepSize: 5,
          padding: 4,
          font: { size: 11, weight: '600' },
          color: '#dc2626',
          callback: (v) => `${v}℃`
        }
      },
      yHum: {
        type: 'linear',
        position: 'right',
        min: 0,
        max: 80,
        afterFit: (scale) => {
          scale.width = RIGHT_AXIS_WIDTH;
        },
        grid: { drawOnChartArea: false },
        border: { display: true, color: '#cbd5e1' },
        title: {
          display: true,
          text: '습도 (%)',
          color: '#0284c7',
          padding: { top: 0, bottom: 2 },
          font: { size: 11, weight: '700' }
        },
        ticks: {
          stepSize: 20,
          padding: 4,
          font: { size: 11, weight: '600' },
          color: '#0284c7',
          callback: (v) => `${v}%`
        }
      }
    },
    plugins: {
      legend: {
        position: 'top',
        align: 'end',
        labels: { boxWidth: 12, font: { size: 11, weight: '700' }, padding: 10 }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.94)',
        padding: 10,
        callbacks: {
          title: (items) => {
            const idx = items?.[0]?.dataIndex;
            const info = monthly.days[idx];
            if (!info) return '';
            const dowName = ['일', '월', '화', '수', '목', '금', '토'][info.dow];
            return `${info.fullDate} (${dowName})`;
          },
          afterBody: (items) => {
            const idx = items?.[0]?.dataIndex;
            const info = monthly.days[idx];
            if (!info?.primary) return ['기록된 FMB보관실 일보 없음'];
            const extra = [
              `작성자: ${info.primary.workerName || '-'} (${info.primary.status || '-'})`
            ];
            if (info.envNote) extra.push(`비고: ${info.envNote}`);
            if (info.hasCheckIssue) extra.push('⚠️ 일일 점검 항목 불량 포함');
            extra.push('클릭 시 작업일보 상세 열기');
            return extra;
          }
        }
      }
    }
  }), [monthly.days]);

  return (
    <div className="card" style={{ margin: '16px 0 0 0' }} data-dashboard-card="fmb-env-monthly">
      <style>{`
        [data-dashboard-card="fmb-env-monthly"] .fmb-month-nav-btn {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #334155;
          border-radius: 6px;
          padding: 4px 9px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          line-height: 1.2;
        }
        [data-dashboard-card="fmb-env-monthly"] .fmb-month-nav-btn:hover {
          background: #f1f5f9;
        }
        [data-dashboard-card="fmb-env-monthly"] .fmb-summary-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: 8px;
          font-size: 12px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          white-space: nowrap;
        }
        [data-dashboard-card="fmb-env-monthly"] .fmb-env-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 11px;
          box-sizing: border-box;
        }
        [data-dashboard-card="fmb-env-monthly"] .fmb-env-table th,
        [data-dashboard-card="fmb-env-monthly"] .fmb-env-table td {
          border: 1px solid #e2e8f0;
          text-align: center;
          padding: 5px 1px;
          box-sizing: border-box;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        [data-dashboard-card="fmb-env-monthly"] .fmb-day-clickable {
          cursor: pointer;
        }
        [data-dashboard-card="fmb-env-monthly"] .fmb-day-clickable:hover {
          background: #ecfdf5 !important;
        }
        [data-dashboard-card="fmb-env-monthly"] .fmb-card-main-split {
          display: grid;
          grid-template-columns: 238px minmax(0, 1fr);
          gap: 14px;
          align-items: stretch;
        }
        body.mobile-preview-mode [data-dashboard-card="fmb-env-monthly"] .fmb-card-main-split {
          grid-template-columns: 1fr;
        }
        @media (max-width: 960px) {
          [data-dashboard-card="fmb-env-monthly"] .fmb-card-main-split {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* ── 카드 헤더: 제목 + 월 선택기 + 요약 배지 ── */}
      <div
        className="card-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h3 className="card-title" style={{ margin: 0, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🌡️💧 FMB보관실 월간 온·습도 기록 현황</span>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '1px 7px', borderRadius: '10px' }}>
                #9004 연동
              </span>
            </h3>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
              온도(10~30℃) · 습도(0~80%) 한 달 추이 그래프 및 일자별 점검 기록표 · 기록된 일자를 클릭하면 상세 일보가 열립니다
            </div>
          </div>

          {/* 월 이동 컨트롤 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: '#f8fafc', padding: '4px 6px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <button
              type="button"
              className="fmb-month-nav-btn"
              onClick={() => setSelectedMonth((prev) => shiftYearMonth(prev, -1))}
              title="이전 달"
            >
              ◀
            </button>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                if (e.target.value) setSelectedMonth(e.target.value);
              }}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '12px',
                fontWeight: 800,
                color: '#0f172a',
                background: '#ffffff',
                cursor: 'pointer'
              }}
            />
            <button
              type="button"
              className="fmb-month-nav-btn"
              onClick={() => setSelectedMonth((prev) => shiftYearMonth(prev, 1))}
              title="다음 달"
            >
              ▶
            </button>
            {selectedMonth !== currentYm && (
              <button
                type="button"
                className="fmb-month-nav-btn"
                onClick={() => setSelectedMonth(currentYm)}
                style={{ color: '#2563eb', borderColor: '#93c5fd', background: '#eff6ff' }}
              >
                이번 달
              </button>
            )}
          </div>
        </div>

        {/* 요약 지표 + 바로가기 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div className="fmb-summary-pill">
            <span style={{ color: '#64748b', fontWeight: 600 }}>기록일수</span>
            <strong style={{ color: '#0f172a' }}>{monthly.recordedDays} / {monthly.daysInMonth}일</strong>
          </div>
          <div className="fmb-summary-pill" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
            <span style={{ color: '#991b1b', fontWeight: 600 }}>평균 온도</span>
            <strong style={{ color: '#dc2626' }}>
              {monthly.avgTemp !== null ? `${monthly.avgTemp}℃` : '—'}
            </strong>
            {monthly.minTemp !== null && (
              <span style={{ fontSize: '10px', color: '#b91c1c' }}>
                ({monthly.minTemp}~{monthly.maxTemp}℃)
              </span>
            )}
          </div>
          <div className="fmb-summary-pill" style={{ borderColor: '#bae6fd', background: '#f0f9ff' }}>
            <span style={{ color: '#075985', fontWeight: 600 }}>평균 습도</span>
            <strong style={{ color: '#0284c7' }}>
              {monthly.avgHum !== null ? `${monthly.avgHum}%` : '—'}
            </strong>
            {monthly.minHum !== null && (
              <span style={{ fontSize: '10px', color: '#0369a1' }}>
                ({monthly.minHum}~{monthly.maxHum}%)
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowStatusBoard(true)}
            style={{
              background: '#0f172a',
              border: '1px solid #0f172a',
              borderRadius: '7px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 800,
              color: '#ffffff',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.16)'
            }}
          >
            <span>🖥️ 전체화면 현황판</span>
          </button>
        </div>
      </div>

      {/* ── 본문: 좌측 고무 종류별 재고 현황 + 우측 월간 온·습도 추이 그래프/기록표 ── */}
      <div style={{ padding: '12px 16px 16px 16px' }}>
        <div className="fmb-card-main-split">
          {/* 좌측면: 고무 종류별 실시간 재고 현황 */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '10px'
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>고무 종류별 재고 현황</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: stockSummary.totalKg > 0 ? '#047857' : '#64748b',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '999px',
                    padding: '1px 8px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <strong translate="no">{`${formatKg(stockSummary.totalKg)} kg`}</strong>
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {stockSummary.grades.map((g) => {
                  const active = g.kg > 0 || g.lotCount > 0;
                  const ratio = stockSummary.totalKg > 0 ? Math.min(100, Math.round((g.kg / stockSummary.totalKg) * 100)) : 0;
                  return (
                    <div
                      key={g.code}
                      style={{
                        background: '#ffffff',
                        border: `1px solid ${active ? '#86efac' : '#e2e8f0'}`,
                        borderRadius: '8px',
                        padding: '8px 10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <strong translate="no" style={{ fontSize: '12px', color: '#0f172a' }}>{g.code}</strong>
                        <strong translate="no" style={{ fontSize: '13.5px', color: active ? '#047857' : '#94a3b8' }}>
                          {`${formatKg(g.kg)} kg`}
                        </strong>
                      </div>
                      <div style={{ height: '5px', background: '#f1f5f9', borderRadius: '999px', overflow: 'hidden', marginBottom: '4px' }}>
                        <div style={{ height: '100%', width: `${active ? Math.max(ratio, 8) : 0}%`, background: '#10b981', borderRadius: '999px' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>
                        <span>{`${g.lotCount}건`}</span>
                        {g.earliestExpiry ? (
                          <span><span>선입</span> <strong translate="no" style={{ color: '#dc2626' }}>{g.earliestExpiry}</strong></span>
                        ) : (
                          <span>보유 재고 없음</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700 }}>
                <span style={{ color: '#047857' }}><span>당월 입고</span> <strong translate="no">{`+${formatKg(ioCheckSummary.inTotalKg)}kg`}</strong></span>
                <span style={{ color: '#be123c' }}><span>당월 출고</span> <strong translate="no">{`-${formatKg(ioCheckSummary.outTotalKg)}kg`}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => setShowStatusBoard(true)}
                style={{
                  width: '100%',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  color: '#1d4ed8',
                  cursor: 'pointer'
                }}
              >
                <span>전체화면 현황판 열기 →</span>
              </button>
            </div>
          </div>

          {/* 우측면: 월간 온·습도 추이 그래프 및 일자별 기록표 */}
          <div style={{ minWidth: 0 }}>
        {!monthly.hasChartValues && (
          <div
            style={{
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              borderRadius: '8px',
              padding: '10px 14px',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              flexWrap: 'wrap',
              fontSize: '12px',
              color: '#64748b'
            }}
          >
            <span>
              📭 <strong>{monthly.year}년 {monthly.month}월</strong>에 기록된 FMB보관실 온·습도 데이터가 아직 없습니다. 작업일보(<strong>[공통] → FMB보관실 #9004</strong>)에서 온·습도를 저장하면 아래 그래프와 일자별 표에 즉시 반영됩니다.
            </span>
            {latestRecordedMonth && latestRecordedMonth !== selectedMonth && (
              <button
                type="button"
                className="fmb-month-nav-btn"
                onClick={() => setSelectedMonth(latestRecordedMonth)}
                style={{ color: '#047857', borderColor: '#6ee7b7', background: '#ecfdf5' }}
              >
                최근 기록 월({latestRecordedMonth}) 보기 →
              </button>
            )}
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: '980px', width: '100%' }}>
            {/* 1) 월간 온·습도 복합 추이 그래프 (좌 72px / 우 56px 고정) */}
            <div style={{ height: '220px', width: '100%', marginBottom: '4px' }}>
              <Bar
                data={chartData}
                plugins={valueLabelsPlugin}
                options={chartOptions}
              />
            </div>

            {/* 2) 한 달(1일~말일) 일자별 온·습도 기록표 (좌 72px / 우 56px 동일 폭 고정) */}
            <table className="fmb-env-table">
              <colgroup>
                <col style={{ width: `${LEFT_AXIS_WIDTH}px` }} />
                {monthly.days.map((d) => (
                  <col key={d.day} />
                ))}
                <col style={{ width: `${RIGHT_AXIS_WIDTH}px` }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ background: '#f1f5f9', color: '#334155', fontWeight: 800 }}>
                    {monthly.month}월 일자
                  </th>
                  {monthly.days.map((d) => {
                    const dayColor = d.isToday
                      ? '#047857'
                      : d.dow === 0
                        ? '#dc2626'
                        : d.dow === 6
                          ? '#2563eb'
                          : '#334155';
                    const headBg = d.isToday
                      ? '#d1fae5'
                      : d.primary
                        ? '#f8fafc'
                        : '#ffffff';
                    return (
                      <th
                        key={d.day}
                        className={d.primary ? 'fmb-day-clickable' : undefined}
                        onClick={() => d.primary && setDetailReport(d.primary)}
                        title={d.primary ? `${d.fullDate} (${d.primary.workerName}) 상세 보기` : d.fullDate}
                        style={{ background: headBg, color: dayColor, fontWeight: 800 }}
                      >
                        {d.day}
                      </th>
                    );
                  })}
                  <th style={{ background: '#f1f5f9', color: '#334155', fontWeight: 800 }}>
                    평균
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* 온도 행 */}
                <tr>
                  <th style={{ background: '#fef2f2', color: '#b91c1c', fontWeight: 800 }}>
                    온도(℃)
                  </th>
                  {monthly.days.map((d) => (
                    <td
                      key={d.day}
                      className={d.primary ? 'fmb-day-clickable' : undefined}
                      onClick={() => d.primary && setDetailReport(d.primary)}
                      title={d.primary ? `${d.fullDate} 온도: ${d.tempVal ?? (d.rawTemp || '-')}℃` : `${d.fullDate} 기록 없음`}
                      style={{
                        background: d.isToday ? 'rgba(209, 250, 229, 0.28)' : '#ffffff',
                        fontWeight: d.tempVal !== null ? 800 : 400,
                        color: d.tempVal !== null ? '#dc2626' : '#cbd5e1'
                      }}
                    >
                      {d.tempVal !== null ? d.tempVal : (d.rawTemp || '-')}
                    </td>
                  ))}
                  <td style={{ background: '#fef2f2', color: '#b91c1c', fontWeight: 800 }}>
                    {monthly.avgTemp !== null ? `${monthly.avgTemp}℃` : '-'}
                  </td>
                </tr>

                {/* 습도 행 */}
                <tr>
                  <th style={{ background: '#f0f9ff', color: '#0369a1', fontWeight: 800 }}>
                    습도(%)
                  </th>
                  {monthly.days.map((d) => (
                    <td
                      key={d.day}
                      className={d.primary ? 'fmb-day-clickable' : undefined}
                      onClick={() => d.primary && setDetailReport(d.primary)}
                      title={d.primary ? `${d.fullDate} 습도: ${d.humVal ?? (d.rawHum || '-')}%` : `${d.fullDate} 기록 없음`}
                      style={{
                        background: d.isToday ? 'rgba(209, 250, 229, 0.28)' : '#ffffff',
                        fontWeight: d.humVal !== null ? 800 : 400,
                        color: d.humVal !== null ? '#0284c7' : '#cbd5e1'
                      }}
                    >
                      {d.humVal !== null ? d.humVal : (d.rawHum || '-')}
                    </td>
                  ))}
                  <td style={{ background: '#f0f9ff', color: '#0369a1', fontWeight: 800 }}>
                    {monthly.avgHum !== null ? `${monthly.avgHum}%` : '-'}
                  </td>
                </tr>

                {/* 점검 상태 행 */}
                <tr>
                  <th style={{ background: '#f8fafc', color: '#475569', fontWeight: 800 }}>
                    점검상태
                  </th>
                  {monthly.days.map((d) => {
                    let badge = '-';
                    let color = '#cbd5e1';
                    if (d.primary) {
                      if (d.hasCheckIssue) {
                        badge = '주의';
                        color = '#dc2626';
                      } else if (d.isDraftOnly) {
                        badge = '임시';
                        color = '#d97706';
                      } else {
                        badge = '양호';
                        color = '#059669';
                      }
                    }
                    return (
                      <td
                        key={d.day}
                        className={d.primary ? 'fmb-day-clickable' : undefined}
                        onClick={() => d.primary && setDetailReport(d.primary)}
                        title={
                          d.primary
                            ? `${d.fullDate} | 작성자: ${d.primary.workerName || '-'} | 상태: ${d.primary.status || '-'}${d.envNote ? ` | ${d.envNote}` : ''}`
                            : `${d.fullDate} 미기록`
                        }
                        style={{
                          background: d.isToday ? 'rgba(209, 250, 229, 0.28)' : '#ffffff',
                          fontSize: '10px',
                          fontWeight: d.primary ? 800 : 400,
                          color
                        }}
                      >
                        {badge}
                      </td>
                    );
                  })}
                  <td style={{ background: '#f8fafc', color: '#475569', fontWeight: 700, fontSize: '10px' }}>
                    {monthly.recordedDays > 0 ? `${monthly.recordedDays}일` : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
          </div>
        </div>
      </div>

      {/* FMB 보관실 전체화면 통합 상황판 모달 */}
      {showStatusBoard && (
        <FmbStatusBoardModal
          selectedMonth={selectedMonth}
          currentYm={currentYm}
          onPrevMonth={() => setSelectedMonth((prev) => shiftYearMonth(prev, -1))}
          onNextMonth={() => setSelectedMonth((prev) => shiftYearMonth(prev, 1))}
          onResetMonth={() => setSelectedMonth(currentYm)}
          onChangeMonth={(val) => setSelectedMonth(val)}
          monthly={monthly}
          chartData={chartData}
          chartOptions={chartOptions}
          valueLabelsPlugin={valueLabelsPlugin}
          stockSummary={stockSummary}
          ioCheckSummary={ioCheckSummary}
          onRefresh={handleRefreshFmbAll}
          onNavigateForm={() => {
            setShowStatusBoard(false);
            navigate('/form');
          }}
          onOpenDetail={(r) => setDetailReport(r)}
          onClose={() => setShowStatusBoard(false)}
        />
      )}

      {/* 일보 상세 조회 / 인쇄 모달 (클릭 시 지연 로드) */}
      {detailReport && (
        <Suspense fallback={null}>
          <LegacyDetailModal
            report={detailReport}
            onClose={() => setDetailReport(null)}
          />
        </Suspense>
      )}
    </div>
  );
}
