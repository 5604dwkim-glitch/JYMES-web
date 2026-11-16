import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import {
  fetchMyRecentReports,
  fetchChangePoints,
  fetchRecentDailyStats,
  fetchMoldsSlim,
  fetchEquipmentsSlim,
  fetchDowntimeReports,
  fetchFmbReports,
  invalidateMoldsCache,
  invalidateEquipmentsCache,
  subscribeDailyStatsDate
} from '../services/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import DowntimeChainCard from './DashboardParts/DowntimeChainCard';
import FmbEnvMonthlyCard from './DashboardParts/FmbEnvMonthlyCard';
import {
  buildDashboardKpiSummary,
  buildLast7DaysMiniTrend,
  buildThisWeekTop5Defects
} from '../services/analyticsStatsEngine';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  BarController,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard() {
  const { userRole } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const [reports, setReports] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    dailyStats: [],
    equipments: [],
    molds: [],
    changePoints: [],
    downtimeReports: [],
    fmbReports: []
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const loadSeqRef = useRef(0);
  const hasLoadedRef = useRef(false);

  // 🔄 자동 갱신 ON/OFF 상태 (기본값 ON, localStorage 보관)
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(() => {
    try {
      return localStorage.getItem('jymes_dashboard_auto_refresh') !== 'false';
    } catch {
      return true;
    }
  });

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('jymes_dashboard_auto_refresh', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // 📡 실시간 스마트 이벤트 감지 리스너 (daily_stats/{today}):
  // 작업자가 일보를 등록·수정·삭제할 때 applyStatsUpdate가 daily_stats/{today} 문서를 갱신하므로,
  // 3분마다 전체 컬렉션을 폴링할 필요 없이 당일 문서 1건의 변경만 실시간 즉시 화면에 반영 (읽기 비용 99.9% 절감).
  // 갱신 OFF 스위치를 끄면 즉시 unsubscribe되어 Firestore 읽기가 완전 0이 됨.
  useEffect(() => {
    if (userRole?.role !== 'admin' || !autoRefreshEnabled) return undefined;

    const todayStr = new Date().toLocaleDateString('sv-SE');
    const unsubscribe = subscribeDailyStatsDate(todayStr, (updatedDoc) => {
      setDashboardData((prev) => {
        const list = Array.isArray(prev.dailyStats) ? prev.dailyStats : [];
        const idx = list.findIndex((s) => s.date === updatedDoc.date);
        let nextList;
        if (idx >= 0) {
          nextList = [...list];
          nextList[idx] = { ...nextList[idx], ...updatedDoc };
        } else {
          nextList = [updatedDoc, ...list];
        }
        return { ...prev, dailyStats: nextList };
      });
      setLastRefreshed(new Date());
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [userRole?.role, autoRefreshEnabled]);

  const loadData = useCallback(async (forceRefresh = false) => {
    const seq = ++loadSeqRef.current;
    const isLatest = () => seq === loadSeqRef.current;

    if (userRole?.role === 'worker') {
      // 작업자 화면은 서버 응답을 기다리지 않고 즉시 표시 (일보 작성 버튼 등은 데이터 없이도 사용 가능)
      setLoading(false);
      setReportsLoading(true);
      try {
        const data = await fetchMyRecentReports(userRole.workerName);
        if (isLatest()) setReports(data);
      } catch (e) {
        console.error('Failed to load worker reports', e);
      } finally {
        if (isLatest()) setReportsLoading(false);
      }
      return;
    }

    if (!hasLoadedRef.current) {
      setLoading(true);
    } else {
      setIsRefreshing(true);
    }
    if (forceRefresh) {
      invalidateMoldsCache();
      invalidateEquipmentsCache();
    }
    const dtSince = new Date(Date.now() - 60 * 86400000).toLocaleDateString('sv-SE');

    // 각 데이터가 도착하는 대로 화면에 반영하고, 느린 항목 하나 때문에 대시보드 전체가 멈추지 않도록
    // 최대 6초까지만 기다린 뒤 화면을 먼저 보여준다 (나머지는 도착 즉시 채워짐)
    const patch = (key, promise) => promise
      .then((value) => {
        if (isLatest()) setDashboardData((prev) => ({ ...prev, [key]: value || [] }));
      })
      .catch((e) => console.error(`Failed to load dashboard ${key}`, e));

    const dailyStatsTask = patch('dailyStats', fetchRecentDailyStats(90, forceRefresh));
    const tasks = [
      dailyStatsTask,
      patch('equipments', fetchEquipmentsSlim({ maxAgeMs: 10 * 60 * 1000, forceRefresh })),
      patch('molds', fetchMoldsSlim({ maxAgeMs: 10 * 60 * 1000, forceRefresh })),
      patch('changePoints', fetchChangePoints(forceRefresh)),
      patch('downtimeReports', fetchDowntimeReports(dtSince, forceRefresh)),
      patch('fmbReports', fetchFmbReports(forceRefresh))
    ];
    const allDone = Promise.allSettled(tasks);
    await Promise.race([dailyStatsTask, new Promise((resolve) => setTimeout(resolve, 2500))]);
    if (!isLatest()) return;
    hasLoadedRef.current = true;
    setLastRefreshed(new Date());
    setLoading(false);
    // 첫 화면 표시 직후 경량화된 Analytics 청크를 유휴 시간에 미리 워밍
    setTimeout(() => {
      import('./Analytics').catch(() => {});
    }, 150);
    allDone.then(() => {
      if (isLatest()) {
        setLastRefreshed(new Date());
        setIsRefreshing(false);
      }
    });
  }, [userRole]);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  useEffect(() => {
    if (!loading && location.state?.focusChain) {
      const el = document.querySelector('[data-dashboard-card="downtime-chain"]');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading, location.state]);

  const isWorker = userRole?.role !== 'admin';

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px', color: '#64748b' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: '14px' }}>대시보드 데이터 로딩 중...</div>
      </div>
    );
  }

  if (isWorker) {
    return <WorkerDashboard reports={reports} reportsLoading={reportsLoading} workerName={userRole?.workerName} navigate={navigate} t={t} />;
  }

  return (
    <AdminDashboard
      data={dashboardData}
      navigate={navigate}
      onRefresh={() => loadData(true)}
      lastRefreshed={lastRefreshed}
      isRefreshing={isRefreshing}
      expandChain={Boolean(location.state?.expandChain)}
      autoRefreshEnabled={autoRefreshEnabled}
      onToggleAutoRefresh={toggleAutoRefresh}
    />
  );
}

function WorkerDashboard({ reports, reportsLoading, workerName, navigate, t }) {
  const myReports = reports.filter((r) => r.workerName === workerName).slice(0, 3);

  return (
    <div className="dashboard-view">
      <div id="workerModeView" style={{ display: 'block' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff', padding: '20px', border: 'none', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>안녕하세요, {workerName || '작업자'} 님!</h2>
              <p style={{ fontSize: '13px', opacity: 0.9, lineHeight: '1.4' }}>오늘도 안전하고 즐거운 하루 되세요!<br />작업 정보는 시간에 맞춰 담당 폼에 기입 부탁드리며 품질 관리에 최선을 다해 주세요.</p>
            </div>
            <button className="btn btn-success" onClick={() => navigate('/form')} style={{ padding: '10px 20px', fontSize: '14px' }}>
              📝 {t('quick_report')}
            </button>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: '16px' }}>
          <div className="card" style={{ margin: 0 }}>
            <div className="card-header">
              <div className="card-title">내 오늘의 최근 작성 정보</div>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/reports')}>전체보기</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {myReports.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
                  {reportsLoading ? '불러오는 중...' : '최근 작성한 정보가 없습니다.'}
                </div>
              ) : myReports.map((r) => (
                <div key={r.id} style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>{r.date} | {r.carModel} - {r.processName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.itemName} | {r.actualQty?.toLocaleString()} EA</div>
                  </div>
                  <span className={`status-badge ${r.status === '승인 완료' ? 'approved' : r.status === '반려' ? 'rejected' : 'pending'}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ margin: 0 }}>
            <div className="card-header">
              <div className="card-title">현 공장 공지 및 전달사항</div>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', borderLeft: '4px solid var(--accent-cyan)' }}>
                <strong>※ 안전 작업 수칙:</strong> 작업 전 보호구(안전모, 장갑) 착용을 필히 확인하시기 바랍니다.
              </div>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', borderLeft: '4px solid var(--accent-emerald)' }}>
                <strong>※ 자재 LOT 번호:</strong> FRT &amp; RR 자재 초물/중물/종물 LOT 번호 입력을 철저히 이행 바랍니다.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 원형 게이지 SVG 컴포넌트 ───────────────────────────────
function CircleGauge({ pct, size = 62, color = '#3b82f6', trackColor = '#e2e8f0', children }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const safePct = Math.max(0, Math.min(Number(pct) || 0, 100));
  const filled = (circ * safePct) / 100;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={6.5} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={6.5}
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={size < 56 ? 9 : 12}
        fontWeight={800}
        fill="#1e293b"
      >
        {children}
      </text>
    </svg>
  );
}

// ── 자동 갱신 ON / OFF 슬라이더 스위치 컴포넌트 ───────────
function AutoRefreshSwitch({ enabled, onToggle, isMonitorFullscreen }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle?.();
        }
      }}
      title={
        enabled
          ? '자동 갱신 ON (실시간 스마트 감지 활성화됨 - 클릭 시 갱신 OFF 전환)'
          : '자동 갱신 OFF (실시간 감지 정지됨 - 클릭 시 갱신 ON 전환)'
      }
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isMonitorFullscreen ? '6px' : '8px',
        padding: isMonitorFullscreen ? '4px 10px' : '7px 13px',
        borderRadius: '8px',
        background: enabled ? '#f0fdf4' : '#f8fafc',
        border: `1.5px solid ${enabled ? '#86efac' : '#cbd5e1'}`,
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'all 0.15s ease'
      }}
    >
      <span
        style={{
          fontSize: isMonitorFullscreen ? '11.5px' : '12.5px',
          fontWeight: 700,
          color: enabled ? '#166534' : '#64748b'
        }}
      >
        자동 갱신
      </span>
      {/* 슬라이더 스위치 */}
      <div
        style={{
          width: isMonitorFullscreen ? '30px' : '34px',
          height: isMonitorFullscreen ? '17px' : '19px',
          borderRadius: '999px',
          background: enabled ? '#10b981' : '#cbd5e1',
          position: 'relative',
          transition: 'background-color 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          padding: '2px',
          boxSizing: 'border-box'
        }}
      >
        <div
          style={{
            width: isMonitorFullscreen ? '13px' : '15px',
            height: isMonitorFullscreen ? '13px' : '15px',
            borderRadius: '50%',
            background: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            transform: enabled
              ? `translateX(${isMonitorFullscreen ? '13px' : '15px'})`
              : 'translateX(0)',
            transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        />
      </div>
      <span
        style={{
          fontSize: isMonitorFullscreen ? '11px' : '12px',
          fontWeight: 800,
          color: enabled ? '#059669' : '#94a3b8',
          minWidth: '24px'
        }}
      >
        {enabled ? 'ON' : 'OFF'}
      </span>
    </div>
  );
}

// ── AdminDashboard ("지금 상태 확인과 조치" 중심) ───────────
function AdminDashboard({
  data,
  navigate,
  onRefresh,
  lastRefreshed,
  isRefreshing,
  expandChain,
  autoRefreshEnabled = true,
  onToggleAutoRefresh
}) {
  const [isMonitorFullscreen, setIsMonitorFullscreen] = useState(false);
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(() => Boolean(document.fullscreenElement));
  const [liveClock, setLiveClock] = useState(() => new Date().toLocaleTimeString('ko-KR', { hour12: false }));
  const hadNativeFsRef = useRef(false);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  const enterMonitorFullscreen = useCallback(async () => {
    setIsMonitorFullscreen(true);
    try {
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        hadNativeFsRef.current = true;
      }
    } catch {
      // 브라우저 권한 제한 시에도 100vw x 100vh 모니터 전체화면 레이아웃 유지
    }
  }, []);

  const exitMonitorFullscreen = useCallback(async () => {
    hadNativeFsRef.current = false;
    setIsMonitorFullscreen(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  }, []);

  const handleToggleNativeFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
        hadNativeFsRef.current = true;
      } else {
        hadNativeFsRef.current = false;
        await document.exitFullscreen?.();
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isMonitorFullscreen) return undefined;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const clockTimer = setInterval(() => {
      setLiveClock(new Date().toLocaleTimeString('ko-KR', { hour12: false }));
    }, 1000);

    // 모니터 전체화면 상시 표시 시: 실시간 리스너가 daily_stats 변경을 즉시 감지하므로,
    // 전체 컬렉션 갱신은 30분 보조 주기로 대폭 완화하여 Firestore 과다 읽기를 방지합니다.
    // 사용자가 갱신 OFF로 설정했을 때는 타이머를 동작시키지 않습니다.
    let autoRefreshTimer = null;
    if (autoRefreshEnabled) {
      autoRefreshTimer = setInterval(() => {
        onRefreshRef.current?.();
      }, 30 * 60 * 1000);
    }

    let wakeLockSentinel = null;
    if (typeof navigator !== 'undefined' && navigator.wakeLock?.request) {
      navigator.wakeLock.request('screen').then((s) => {
        wakeLockSentinel = s;
      }).catch(() => {});
    }

    const onFsChange = () => {
      const active = Boolean(document.fullscreenElement);
      setIsNativeFullscreen(active);
      if (active) {
        hadNativeFsRef.current = true;
      } else if (hadNativeFsRef.current) {
        hadNativeFsRef.current = false;
        const hasSubModal = Boolean(document.querySelector('[data-fmb-status-board="1"], .modal-overlay'));
        if (!hasSubModal) {
          setIsMonitorFullscreen(false);
        }
      }
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !document.fullscreenElement) {
        const hasSubModal = Boolean(document.querySelector('[data-fmb-status-board="1"], .modal-overlay'));
        if (!hasSubModal) {
          setIsMonitorFullscreen(false);
        }
      }
    };

    document.addEventListener('fullscreenchange', onFsChange);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      clearInterval(clockTimer);
      if (autoRefreshTimer) clearInterval(autoRefreshTimer);
      document.removeEventListener('fullscreenchange', onFsChange);
      window.removeEventListener('keydown', onKeyDown);
      if (wakeLockSentinel && typeof wakeLockSentinel.release === 'function') {
        wakeLockSentinel.release().catch(() => {});
      }
    };
  }, [isMonitorFullscreen, autoRefreshEnabled]);

  useEffect(() => {
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    };
  }, []);

  const kpi = useMemo(() => buildDashboardKpiSummary(data.dailyStats || []), [data.dailyStats]);
  const miniTrend = useMemo(() => buildLast7DaysMiniTrend(data.dailyStats || []), [data.dailyStats]);
  const top5Defects = useMemo(() => buildThisWeekTop5Defects(data.dailyStats || []), [data.dailyStats]);

  const defectStatus = (kpi.totalActual <= 0 && kpi.totalDefect > 0)
    ? 'danger'
    : kpi.defectRate === 0
      ? 'safe'
      : kpi.defectRate <= 1
        ? 'good'
        : kpi.defectRate <= 3
          ? 'warn'
          : 'danger';
  const defectBadge = {
    safe: ['🟢', '#10b981', '#f0fdf4'],
    good: ['🟢', '#10b981', '#f0fdf4'],
    warn: ['🟡', '#d97706', '#fefce8'],
    danger: ['🔴', '#b91c1c', '#fef2f2']
  }[defectStatus];

  // 금형 점검 임박 (누적타수 70% 이상 우선 노출, 0개일 때는 상위 5개 보조 표시)
  const moldCardInfo = useMemo(() => {
    const all = [...(data.molds || [])].map((m) => {
      const cur = Number(m.currentStrokes || 0);
      const max = Math.max(1, Number(m.maxStrokes || 300000));
      const pct = Math.min(100, +((cur / max) * 100).toFixed(1));
      return { ...m, cur, max, pct };
    });
    const urgent = all.filter((m) => m.pct >= 70).sort((a, b) => b.pct - a.pct);
    const topFallback = [...all].sort((a, b) => b.cur - a.cur).slice(0, 5);
    return {
      totalCount: all.length,
      normalCount: Math.max(0, all.length - urgent.length),
      urgent,
      topFallback
    };
  }, [data.molds]);

  // 최근 7일 미니 차트 데이터
  const miniChartData = useMemo(() => {
    const lastIdx = miniTrend.labels.length - 1;
    const datasets = [
      {
        type: 'line',
        label: '불량률 (%)',
        data: miniTrend.rates,
        borderColor: '#ef4444',
        backgroundColor: '#ffffff',
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#ef4444',
        pointBorderWidth: 2,
        pointRadius: 4,
        borderWidth: 2.3,
        tension: 0.25,
        yAxisID: 'y1',
        order: 1
      },
      {
        type: 'bar',
        label: '생산수량 (EA)',
        data: miniTrend.actuals,
        backgroundColor: miniTrend.actuals.map((_, i) => (i === lastIdx ? '#3b82f6' : '#93c5fd')),
        borderRadius: 4,
        maxBarThickness: 42,
        yAxisID: 'y',
        order: 3
      }
    ];
    if (miniTrend.avgTarget > 0) {
      datasets.splice(1, 0, {
        type: 'line',
        label: `평균 목표 (${miniTrend.avgTarget.toLocaleString()} EA)`,
        data: miniTrend.labels.map(() => miniTrend.avgTarget),
        borderColor: '#10b981',
        borderDash: [5, 4],
        borderWidth: 1.8,
        pointRadius: 0,
        fill: false,
        yAxisID: 'y',
        order: 2
      });
    }
    return { labels: miniTrend.labels, datasets };
  }, [miniTrend]);

  const miniChartPlugins = useMemo(() => ([{
    id: 'miniTrendValueLabels',
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx;
      const rateIdx = chart.data.datasets.findIndex((d) => d.yAxisID === 'y1');
      const barIdx = chart.data.datasets.findIndex((d) => d.type === 'bar');

      ctx.save();
      if (barIdx >= 0) {
        const barMeta = chart.getDatasetMeta(barIdx);
        const barDs = chart.data.datasets[barIdx];
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#475569';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        barMeta.data.forEach((bar, i) => {
          const val = Number(barDs.data[i]);
          if (val > 0) ctx.fillText(val.toLocaleString(), bar.x, bar.y - 4);
        });
      }
      if (rateIdx >= 0) {
        const rateMeta = chart.getDatasetMeta(rateIdx);
        const rateDs = chart.data.datasets[rateIdx];
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#b91c1c';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        rateMeta.data.forEach((pt, i) => {
          const val = rateDs.data[i];
          if (val !== null && val !== undefined) ctx.fillText(`${val}%`, pt.x, pt.y - 8);
        });
      }
      ctx.restore();
    }
  }]), []);

  const lastRefStr = lastRefreshed
    ? lastRefreshed.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    : '—';

  const linkBtnStyle = {
    background: 'none',
    border: 'none',
    padding: '2px 4px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#2563eb',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  };

  const displayMolds = moldCardInfo.urgent.length > 0
    ? moldCardInfo.urgent.slice(0, isMonitorFullscreen ? 4 : 6)
    : moldCardInfo.topFallback.slice(0, isMonitorFullscreen ? 4 : 5);

  return (
    <div
      data-dashboard-admin="1"
      data-monitor-fullscreen={isMonitorFullscreen ? '1' : undefined}
      style={{ padding: '20px 24px', maxWidth: '1600px', margin: '0 auto' }}
    >
      <style>{`
        [data-dashboard-admin="1"] .dash-kpi-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 16px;
        }
        [data-dashboard-admin="1"] .dash-two-col {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
          gap: 14px;
          margin-bottom: 16px;
          align-items: stretch;
        }
        [data-dashboard-admin="1"] .dash-monitor-body {
          display: contents;
        }
        [data-dashboard-admin="1"][data-monitor-fullscreen="1"] {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          max-width: none !important;
          margin: 0 !important;
          padding: 8px 14px !important;
          background: #f1f5f9;
          z-index: 900;
          display: flex;
          flex-direction: column;
          gap: 6px;
          overflow: hidden !important;
          box-sizing: border-box;
        }
        [data-dashboard-admin="1"][data-monitor-fullscreen="1"] .dash-kpi-grid {
          gap: 8px;
          margin-bottom: 0 !important;
          flex-shrink: 0;
        }
        [data-dashboard-admin="1"][data-monitor-fullscreen="1"] .dash-monitor-body {
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-rows: minmax(0, 1fr) minmax(0, 0.92fr) minmax(0, 1.38fr);
          gap: 6px;
          overflow: hidden;
        }
        [data-dashboard-admin="1"][data-monitor-fullscreen="1"] .dash-two-col {
          gap: 8px;
          margin-bottom: 0 !important;
          min-height: 0;
          height: 100%;
          overflow: hidden;
        }
        [data-dashboard-admin="1"][data-monitor-fullscreen="1"] .card {
          padding: 7px 12px !important;
          margin-bottom: 0 !important;
          min-height: 0;
        }
        [data-dashboard-admin="1"][data-monitor-fullscreen="1"] .card-header {
          margin-bottom: 4px !important;
          gap: 6px !important;
        }
        [data-dashboard-admin="1"][data-monitor-fullscreen="1"] .card-header .card-title {
          font-size: 13.5px !important;
        }
        [data-dashboard-admin="1"][data-monitor-fullscreen="1"] .card-header .card-title + div {
          display: none !important;
        }
        [data-dashboard-admin="1"][data-monitor-fullscreen="1"] [data-chain-stage="1"] {
          padding: 4px 8px !important;
        }
        [data-dashboard-admin="1"][data-monitor-fullscreen="1"] [data-chain-row] {
          padding: 3px 0 !important;
        }
        [data-dashboard-admin="1"][data-monitor-fullscreen="1"] [data-dashboard-card="fmb-env-monthly"] .fmb-env-table th,
        [data-dashboard-admin="1"][data-monitor-fullscreen="1"] [data-dashboard-card="fmb-env-monthly"] .fmb-env-table td {
          padding: 2px 1px !important;
          font-size: 10.5px !important;
          line-height: 1.15 !important;
        }
        [data-dashboard-admin="1"][data-monitor-fullscreen="1"] [data-dashboard-card="fmb-env-monthly"] .fmb-summary-pill {
          padding: 3px 8px !important;
          font-size: 11px !important;
        }
        @media (max-width: 1180px) {
          [data-dashboard-admin="1"]:not([data-monitor-fullscreen="1"]) .dash-kpi-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          [data-dashboard-admin="1"]:not([data-monitor-fullscreen="1"]) .dash-two-col {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          [data-dashboard-admin="1"]:not([data-monitor-fullscreen="1"]) .dash-kpi-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* ── 헤더 ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: isMonitorFullscreen ? 0 : '16px',
          flexWrap: 'wrap',
          gap: '10px',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: isMonitorFullscreen ? '18px' : '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            생산 통합 모니터링 대시보드
          </h1>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: isMonitorFullscreen ? 0 : '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span>기준일: {kpi.targetDateLabel} &nbsp;|&nbsp; 마지막 갱신: {lastRefStr}</span>
            {isMonitorFullscreen && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '2px 9px',
                  borderRadius: '999px',
                  background: autoRefreshEnabled ? '#ecfdf5' : '#f8fafc',
                  border: `1px solid ${autoRefreshEnabled ? '#6ee7b7' : '#cbd5e1'}`,
                  color: autoRefreshEnabled ? '#047857' : '#64748b',
                  fontSize: '11px',
                  fontWeight: 800
                }}
              >
                <span>{autoRefreshEnabled ? '🟢 상시 모니터링 (실시간 감지)' : '⚪ 갱신 정지 (수동 모드)'}</span>
                <span translate="no" style={{ fontFamily: 'monospace', fontWeight: 900 }}>{liveClock}</span>
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <AutoRefreshSwitch
            enabled={autoRefreshEnabled}
            onToggle={onToggleAutoRefresh}
            isMonitorFullscreen={isMonitorFullscreen}
          />

          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: isMonitorFullscreen ? '6px 13px' : '9px 18px',
              borderRadius: '8px',
              border: '1.5px solid #3b82f6',
              background: isRefreshing ? '#eff6ff' : '#ffffff',
              color: '#3b82f6',
              fontWeight: 700,
              fontSize: isMonitorFullscreen ? '12px' : '13px',
              cursor: isRefreshing ? 'default' : 'pointer'
            }}
          >
            <span style={{ display: 'inline-block', animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }}>🔄</span>
            {isRefreshing ? '갱신 중...' : '수동 새로고침'}
          </button>

          {!isMonitorFullscreen ? (
            <button
              type="button"
              onClick={enterMonitorFullscreen}
              title="스크롤 없이 한 화면에 꽉 차는 상시 모니터링 전체화면으로 전환합니다"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1.5px solid #0f172a',
                background: '#0f172a',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.16)'
              }}
            >
              <span>🖥️</span>
              <span>모니터 전체화면 보기</span>
            </button>
          ) : (
            <>
              {!isNativeFullscreen && (
                <button
                  type="button"
                  onClick={handleToggleNativeFullscreen}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <span>⛶ 브라우저 전체창</span>
                </button>
              )}
              <button
                type="button"
                onClick={exitMonitorFullscreen}
                title="모니터 전체화면 종료 (ESC)"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 13px',
                  borderRadius: '8px',
                  border: '1.5px solid #dc2626',
                  background: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <span>✕ 모니터 전체화면 종료 (ESC)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Row 1: KPI 카드 4개 (전일/전주 비교 지표 포함) ── */}
      <div className="dash-kpi-grid">
        {/* 1) 목표 생산량 */}
        <div className="card" style={{ margin: 0, padding: '16px 18px', borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: isMonitorFullscreen ? '11px' : '12px', color: '#64748b', fontWeight: 700, marginBottom: isMonitorFullscreen ? '2px' : '8px' }}>🎯 금일 목표 생산량</div>
          <div style={{ fontSize: isMonitorFullscreen ? '20px' : '26px', fontWeight: 800, color: '#0f172a', lineHeight: 1.15 }}>
            {kpi.totalTarget.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 400 }}>EA</span>
          </div>
          <div style={{ marginTop: isMonitorFullscreen ? '4px' : '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: isMonitorFullscreen ? '2px' : '4px' }}>
              <span>실적 {kpi.totalActual.toLocaleString()}</span>
              <span>{kpi.attainPct}%</span>
            </div>
            <div style={{ height: isMonitorFullscreen ? '4px' : '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.max(0, Math.min(kpi.attainPct, 100))}%`,
                  background: kpi.attainPct >= 100 ? '#10b981' : '#3b82f6',
                  borderRadius: '3px',
                  transition: 'width .4s'
                }}
              />
            </div>
          </div>
        </div>

        {/* 2) 실제 생산량 + 전일 대비 */}
        <div className="card" style={{ margin: 0, padding: '16px 18px', borderLeft: '4px solid #10b981', display: 'flex', alignItems: 'center', gap: isMonitorFullscreen ? '10px' : '14px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: isMonitorFullscreen ? '11px' : '12px', color: '#64748b', fontWeight: 700, marginBottom: isMonitorFullscreen ? '2px' : '8px' }}>✅ 금일 실제 생산량</div>
            <div style={{ fontSize: isMonitorFullscreen ? '20px' : '26px', fontWeight: 800, color: '#0f172a', lineHeight: 1.15 }}>
              {kpi.totalActual.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 400 }}>EA</span>
            </div>
            {kpi.prevDayLabel && kpi.prevActual !== null && (
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: isMonitorFullscreen ? '2px' : '6px' }}>
                {kpi.prevDayLabel} {kpi.prevActual.toLocaleString()} 대비{' '}
                <span style={{ fontWeight: 700, color: kpi.actualDelta >= 0 ? '#15803d' : '#b91c1c' }}>
                  {kpi.actualDelta >= 0 ? `▲ ${kpi.actualDelta.toLocaleString()}` : `▼ ${Math.abs(kpi.actualDelta).toLocaleString()}`}
                </span>
              </div>
            )}
          </div>
          <CircleGauge pct={kpi.attainPct} size={isMonitorFullscreen ? 44 : 62} color={kpi.attainPct >= 100 ? '#10b981' : kpi.attainPct >= 80 ? '#3b82f6' : '#f59e0b'}>
            {kpi.attainPct}%
          </CircleGauge>
        </div>

        {/* 3) 달성률 + 주간 평균/전주 대비 */}
        <div className="card" style={{ margin: 0, padding: '16px 18px', borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: isMonitorFullscreen ? '11px' : '12px', color: '#64748b', fontWeight: 700, marginBottom: isMonitorFullscreen ? '2px' : '8px' }}>📈 금일 달성률</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <div style={{ fontSize: isMonitorFullscreen ? '20px' : '26px', fontWeight: 800, color: '#0f172a', lineHeight: 1.15 }}>
              {kpi.attainPct} <span style={{ fontSize: '12px', fontWeight: 400 }}>%</span>
            </div>
            <div style={{ fontSize: '11px', color: kpi.attainPct >= 100 ? '#15803d' : kpi.attainPct >= 80 ? '#3b82f6' : '#d97706', fontWeight: 700 }}>
              {kpi.attainPct >= 100 ? '✅ 목표 달성' : kpi.attainPct >= 80 ? '⚡ 순조 진행' : '⚠️ 목표 미달'}
            </div>
          </div>
          {kpi.weekAvgAttain !== null && (
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: isMonitorFullscreen ? '3px' : '4px' }}>
              최근 7일 평균 {kpi.weekAvgAttain}%
              {kpi.weekAttainDelta !== null && (
                <>
                  {' · 직전 주 대비 '}
                  <span style={{ fontWeight: 700, color: kpi.weekAttainDelta >= 0 ? '#15803d' : '#b91c1c' }}>
                    {kpi.weekAttainDelta >= 0 ? `▲ ${kpi.weekAttainDelta}%p` : `▼ ${Math.abs(kpi.weekAttainDelta)}%p`}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* 4) 불량률 + 전일 대비 */}
        <div className="card" style={{ margin: 0, padding: '16px 18px', borderLeft: `4px solid ${defectBadge[1]}`, background: defectBadge[2] }}>
          <div style={{ fontSize: isMonitorFullscreen ? '11px' : '12px', color: '#64748b', fontWeight: 700, marginBottom: isMonitorFullscreen ? '2px' : '8px' }}>⚠️ 금일 불량률</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <div style={{ fontSize: isMonitorFullscreen ? '20px' : '26px', fontWeight: 800, color: '#0f172a', lineHeight: 1.15 }}>
              {kpi.defectRate} <span style={{ fontSize: '12px', fontWeight: 400 }}>%</span>
            </div>
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: '#ffffff', color: defectBadge[1] }}>
              {defectBadge[0]} {defectStatus === 'danger' ? '위험' : defectStatus === 'warn' ? '주의' : '양호'}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: isMonitorFullscreen ? '3px' : '6px' }}>
            불량 {kpi.totalDefect.toLocaleString()}개 / 일보 {kpi.totalReports}건
            {kpi.prevDayLabel && kpi.defectRateDelta !== null && (
              <>
                {` · ${kpi.prevDayLabel} 대비 `}
                <span style={{ fontWeight: 700, color: kpi.defectRateDelta <= 0 ? '#15803d' : '#b91c1c' }}>
                  {kpi.defectRateDelta <= 0 ? `▼ ${Math.abs(kpi.defectRateDelta)}%p` : `▲ ${kpi.defectRateDelta}%p`}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="dash-monitor-body">
        {/* ── Row 2: 조치 필요 연계 현황 (2fr) + 금형 점검 임박 (1fr) ── */}
        <div className="dash-two-col">
          <DowntimeChainCard
            reports={data.downtimeReports || []}
            equipments={data.equipments || []}
            molds={data.molds || []}
            changePoints={data.changePoints || []}
            navigate={navigate}
            initialExpanded={expandChain}
            compact={isMonitorFullscreen}
          />

          <div className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }} data-dashboard-card="mold-urgent">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <div>
                <h3 className="card-title" style={{ margin: 0, fontSize: '15px' }}>⚙️ 금형 점검 임박 (누적타수 70% 이상)</h3>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                  {moldCardInfo.urgent.length > 0
                    ? `점검 임박 ${moldCardInfo.urgent.length}개 · 나머지 ${moldCardInfo.normalCount}개 금형은 정상 범위`
                    : `전체 ${moldCardInfo.totalCount}개 금형 정상 범위 (70% 미만)`}
                </div>
              </div>
              <button type="button" style={linkBtnStyle} onClick={() => navigate('/mold')}>
                더보기 →
              </button>
            </div>

            <div style={{ padding: isMonitorFullscreen ? '2px 0 0 0' : '12px 16px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: isMonitorFullscreen ? 'space-evenly' : 'flex-start', overflow: 'hidden' }}>
              {moldCardInfo.urgent.length === 0 && moldCardInfo.totalCount > 0 && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: isMonitorFullscreen ? '10.5px' : '11px', fontWeight: 700, padding: isMonitorFullscreen ? '3px 8px' : '6px 10px', borderRadius: '8px', marginBottom: isMonitorFullscreen ? '3px' : '8px', flexShrink: 0 }}>
                  ✅ 점검 임박(70% 이상) 금형 없음 — 현재 누적타수 상위 금형
                </div>
              )}

              {displayMolds.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: isMonitorFullscreen ? '12px 0' : '20px 0', fontSize: '13px' }}>등록된 금형이 없습니다.</div>
              ) : (
                displayMolds.map((m, i) => {
                  const pctDisp = Math.round(m.pct);
                  const [barColor, levelLabel, levelColor, chipBg] = m.pct >= 90
                    ? ['#ef4444', '위험', '#b91c1c', '#fef2f2']
                    : m.pct >= 70
                      ? ['#f59e0b', '주의', '#b45309', '#fffbeb']
                      : ['#3b82f6', '정상', '#1d4ed8', '#eff6ff'];
                  return (
                    <button
                      type="button"
                      key={m.id || i}
                      onClick={() => navigate('/mold', { state: { openHistory: { moldId: m.id } } })}
                      title="클릭 시 해당 금형 이력카드로 이동"
                      style={{
                        display: 'block',
                        width: '100%',
                        textAlign: 'left',
                        background: 'transparent',
                        border: 'none',
                        borderTop: i === 0 ? 'none' : '1px solid #f1f5f9',
                        padding: isMonitorFullscreen ? '3px 0' : '9px 0',
                        cursor: 'pointer',
                        fontFamily: 'inherit'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: isMonitorFullscreen ? '3px' : '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: isMonitorFullscreen ? '12px' : '13px', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {m.name || m.code}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                          <span style={{ fontSize: isMonitorFullscreen ? '10.5px' : '11px', fontWeight: 700, padding: '1px 7px', borderRadius: '12px', background: chipBg, color: levelColor }}>
                            {levelLabel} {pctDisp}%
                          </span>
                          <span style={{ fontSize: isMonitorFullscreen ? '10.5px' : '11px', color: '#94a3b8' }}>
                            {m.cur.toLocaleString()} / {m.max.toLocaleString()}
                          </span>
                        </span>
                      </div>
                      <div style={{ height: isMonitorFullscreen ? '5px' : '7px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${Math.max(m.cur > 0 ? 2 : 0, Math.min(100, m.pct))}%`, background: barColor, borderRadius: '4px' }} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── Row 3: 최근 7일 생산·불량률 추이 (2fr) + 이번 주 불량 TOP 5 (1fr) ── */}
        <div className="dash-two-col" style={{ marginBottom: 0 }}>
          {/* 최근 7일 추이 미니 차트 */}
          <div className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }} data-dashboard-card="mini-trend">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <div>
                <h3 className="card-title" style={{ margin: 0, fontSize: '15px' }}>📊 최근 7일 생산 · 불량률 추이</h3>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                  필터 없이 전체 기준 · 조건을 바꿔 비교하려면 「공정 및 불량 분석」으로 이동
                </div>
              </div>
              <button
                type="button"
                style={linkBtnStyle}
                onClick={() => navigate('/analytics', { state: { activeTab: 'tab-charts', subTab: 'trend' } })}
              >
                상세 분석 보기 →
              </button>
            </div>
            <div style={{ padding: isMonitorFullscreen ? '2px 0 0 0' : '12px 16px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
              {miniTrend.labels.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: isMonitorFullscreen ? '16px 0' : '40px 0', fontSize: '13px' }}>집계된 생산 데이터가 없습니다.</div>
              ) : (
                <div style={{ height: isMonitorFullscreen ? '100%' : '215px', flex: isMonitorFullscreen ? 1 : undefined, minHeight: 0, position: 'relative' }}>
                  <Bar
                    data={miniChartData}
                    plugins={miniChartPlugins}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      layout: { padding: { top: isMonitorFullscreen ? 14 : 18, right: 8, left: 4, bottom: 0 } },
                      interaction: { mode: 'index', intersect: false },
                      scales: {
                        x: {
                          grid: { display: false },
                          ticks: {
                            font: { size: isMonitorFullscreen ? 10.5 : 11, weight: '600' },
                            color: (ctx) => (ctx.index === miniTrend.labels.length - 1 ? '#1d4ed8' : '#64748b')
                          }
                        },
                        y: {
                          type: 'linear',
                          position: 'left',
                          beginAtZero: true,
                          grace: '18%',
                          grid: { color: '#f1f5f9' },
                          ticks: { font: { size: isMonitorFullscreen ? 10 : 11 }, color: '#94a3b8' }
                        },
                        y1: {
                          type: 'linear',
                          position: 'right',
                          beginAtZero: true,
                          grace: '25%',
                          grid: { drawOnChartArea: false },
                          ticks: { font: { size: isMonitorFullscreen ? 10 : 11 }, color: '#ef4444', callback: (v) => `${v}%` }
                        }
                      },
                      plugins: {
                        legend: {
                          position: 'top',
                          align: 'end',
                          labels: { boxWidth: 11, font: { size: isMonitorFullscreen ? 10.5 : 11 }, padding: isMonitorFullscreen ? 6 : 12 }
                        },
                        tooltip: {
                          backgroundColor: 'rgba(15,23,42,0.92)',
                          padding: 10
                        }
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 이번 주 불량 유형 TOP 5 */}
          <div className="card" style={{ margin: 0, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }} data-dashboard-card="week-top5-defect">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <div>
                <h3 className="card-title" style={{ margin: 0, fontSize: '15px' }}>🔍 이번 주 불량 유형 TOP 5</h3>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                  {top5Defects.periodLabel} · 총 불량 <strong style={{ color: '#ef4444' }}>{top5Defects.total.toLocaleString()}</strong>건
                </div>
              </div>
              <button
                type="button"
                style={linkBtnStyle}
                onClick={() => navigate('/analytics', { state: { activeTab: 'tab-charts', subTab: 'pareto' } })}
              >
                파레토 보기 →
              </button>
            </div>

            <div style={{ padding: isMonitorFullscreen ? '2px 0 0 0' : '12px 16px', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: isMonitorFullscreen ? 'space-evenly' : 'flex-start', overflow: 'hidden' }}>
              {top5Defects.list.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: isMonitorFullscreen ? '16px 0' : '32px 0', fontSize: '13px' }}>최근 집계된 불량 내역이 없습니다.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: isMonitorFullscreen ? '4px' : '10px', flex: isMonitorFullscreen ? 1 : undefined, justifyContent: isMonitorFullscreen ? 'space-evenly' : undefined }}>
                  {top5Defects.list.map((d, i) => {
                    const pctWidth = Math.round((d.qty / top5Defects.maxQty) * 100);
                    const barColor = i === 0 ? '#ef4444' : i < 3 ? '#f97316' : '#fbbf24';
                    return (
                      <div
                        key={d.name}
                        style={{ display: 'grid', gridTemplateColumns: '22px 1fr 56px', gap: '8px', alignItems: 'center', padding: isMonitorFullscreen ? '1px 0' : '3px 0' }}
                      >
                        <span
                          style={{
                            width: isMonitorFullscreen ? '18px' : '20px',
                            height: isMonitorFullscreen ? '18px' : '20px',
                            borderRadius: '50%',
                            background: '#fef2f2',
                            color: '#ef4444',
                            fontSize: '11px',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {i + 1}
                        </span>
                        <div style={{ minWidth: 0 }}>
                          <div
                            title={d.name}
                            style={{ fontSize: isMonitorFullscreen ? '12px' : '13px', fontWeight: 700, color: '#1e293b', marginBottom: isMonitorFullscreen ? '2px' : '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                          >
                            {d.name}
                          </div>
                          <div style={{ height: isMonitorFullscreen ? '5px' : '7px', background: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pctWidth}%`, background: barColor, borderRadius: '4px' }} />
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: isMonitorFullscreen ? '12px' : '13px', fontWeight: 800, color: '#0f172a' }}>
                          {d.qty.toLocaleString()}건
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Row 4: FMB보관실 한 달 단위 온·습도 추이 그래프 및 일자별 기록표 (최하단) ── */}
        <FmbEnvMonthlyCard
          fmbReports={data.fmbReports || []}
          navigate={navigate}
          compact={isMonitorFullscreen}
        />
      </div>
    </div>
  );
}
