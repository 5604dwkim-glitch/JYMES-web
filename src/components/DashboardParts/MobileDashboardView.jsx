import React, { useEffect, useMemo, useState, Suspense, lazy } from 'react';
import { Bar } from 'react-chartjs-2';
import { buildLinkedChains, ORIGIN_LABEL, REPAIR_STATE_LABEL, CP_STATE_LABEL } from '../../services/downtimeChain';
import { getEquipmentCategory } from '../../constants/equipmentCategories';
import { subscribeFmbInventory } from '../../services/firestore';
import { buildLiveStockSummary, formatKg } from './fmbBoardUtils';

const LegacyDetailModal = lazy(() => import('../DynamicForms/LegacyDetailModal'));

const LOOKBACK_DAYS = 60;
const FMB_LOCAL_CACHE_KEY = 'jymes_fmb_inventory_v1';

const OVERALL_META = {
  progress: { label: '진행중', bg: '#fef2f2', color: '#b91c1c' },
  done: { label: '완료', bg: '#ecfdf5', color: '#047857' },
  unregistered: { label: '미연동', bg: '#f1f5f9', color: '#475569' }
};

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

function parseMetric(raw) {
  if (raw === null || raw === undefined) return null;
  const match = String(raw).trim().match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : null;
}

function calcElapsedDays(dateStr) {
  if (!dateStr) return null;
  const ms = new Date(dateStr).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.max(0, Math.floor((Date.now() - ms) / 86400000));
}

/**
 * 모바일 전용 종합 대시보드 (안 B: 카드 피드형)
 * - PC 대시보드의 4 KPI, 비가동 연계, 금형 임박, 7일 추이/불량 TOP5, FMB 환경·재고 요약을
 *   가로 스크롤 없이 세로 카드 피드로 압축 표시합니다.
 */
export default function MobileDashboardView({
  data,
  kpi,
  miniTrend,
  top5Defects,
  moldCardInfo,
  defectStatus,
  defectBadge,
  miniChartData,
  miniChartPlugins,
  lastRefStr,
  isRefreshing,
  autoRefreshEnabled,
  onToggleAutoRefresh,
  onRefresh,
  onSwitchToPc,
  navigate
}) {
  const [chainFilter, setChainFilter] = useState('progress'); // all | progress | done | unregistered
  const [showAllChains, setShowAllChains] = useState(false);
  const [openReport, setOpenReport] = useState(null);
  const [fmbInvState, setFmbInvState] = useState(() => readCachedFmbInv());

  useEffect(() => {
    const unsub = subscribeFmbInventory((next) => {
      setFmbInvState({
        items: Array.isArray(next?.items) ? next.items : [],
        alarmHistory: Array.isArray(next?.alarmHistory) ? next.alarmHistory : []
      });
    });
    return () => unsub?.();
  }, []);

  const allChains = useMemo(() => {
    const sinceDate = new Date(Date.now() - LOOKBACK_DAYS * 86400000).toLocaleDateString('sv-SE');
    return buildLinkedChains({
      reports: data.downtimeReports || [],
      equipments: data.equipments || [],
      molds: data.molds || [],
      changePoints: data.changePoints || [],
      sinceDate
    });
  }, [data.downtimeReports, data.equipments, data.molds, data.changePoints]);

  const chainCounts = useMemo(() => {
    let progress = 0;
    let overdue = 0;
    let done = 0;
    let unregistered = 0;
    allChains.forEach((c) => {
      if (c.overall === 'progress') {
        progress += 1;
        const d = calcElapsedDays(c.date);
        if (d !== null && d > 7) overdue += 1;
      } else if (c.overall === 'done') {
        done += 1;
      } else {
        unregistered += 1;
      }
    });
    return { all: allChains.length, progress, overdue, done, unregistered };
  }, [allChains]);

  // 진행중이 없으면 기본 보기에서도 최근 내역을 바로 보여 빈 화면 방지
  const effectiveChainFilter = chainFilter === 'progress' && chainCounts.progress === 0 && chainCounts.all > 0
    ? 'all'
    : chainFilter;

  const filteredChains = useMemo(() => {
    const order = { progress: 0, unregistered: 1, done: 2 };
    return allChains
      .filter((c) => effectiveChainFilter === 'all' || c.overall === effectiveChainFilter)
      .sort((a, b) => order[a.overall] - order[b.overall] || (b.date || '').localeCompare(a.date || ''));
  }, [allChains, effectiveChainFilter]);

  const visibleChains = showAllChains ? filteredChains.slice(0, 15) : filteredChains.slice(0, 3);

  const displayMolds = moldCardInfo.urgent.length > 0
    ? moldCardInfo.urgent.slice(0, 4)
    : moldCardInfo.topFallback.slice(0, 3);

  const todayFull = useMemo(() => new Date().toLocaleDateString('sv-SE'), []);
  const stockSummary = useMemo(
    () => buildLiveStockSummary(fmbInvState.items, todayFull),
    [fmbInvState.items, todayFull]
  );

  const fmbRecentSummary = useMemo(() => {
    const reports = [...(data.fmbReports || [])]
      .filter((r) => Boolean(r?.date))
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    const latest = reports[0] || null;
    const latestTemp = parseMetric(latest?.f9004_env?.f9004_temp);
    const latestHum = parseMetric(latest?.f9004_env?.f9004_humidity);

    const curMonth = todayFull.slice(0, 7);
    const monthReports = reports.filter((r) => String(r.date || '').startsWith(`${curMonth}-`));
    const issueDays = new Set();
    monthReports.forEach((r) => {
      const chks = r?.f9004_checks;
      if (chks && Object.values(chks).some((v) => v === false)) {
        issueDays.add(r.date);
      }
    });

    // 최근 7일간 고유 일자별 대표 기록 추출
    const seenDates = new Set();
    const recentDays = [];
    for (const r of reports) {
      if (seenDates.has(r.date)) continue;
      seenDates.add(r.date);
      recentDays.push({
        report: r,
        date: r.date,
        temp: parseMetric(r?.f9004_env?.f9004_temp),
        hum: parseMetric(r?.f9004_env?.f9004_humidity),
        hasIssue: Boolean(r?.f9004_checks && Object.values(r.f9004_checks).some((v) => v === false))
      });
      if (recentDays.length >= 7) break;
    }

    return {
      latestDate: latest?.date || '',
      latestTemp,
      latestHum,
      issueCount: issueDays.size,
      recentDays
    };
  }, [data.fmbReports, todayFull]);

  const handleOpenRepair = (chain) => {
    if (!chain.repair) return;
    const { kind, owner, row } = chain.repair;
    const autoSyncKey = row?.autoSyncKey || chain.key;
    if (kind === 'equipment') {
      const cat = getEquipmentCategory(owner);
      navigate(`/equipment/${cat}`, { state: { openHistory: { equipmentId: owner.id, autoSyncKey } } });
    } else {
      navigate('/mold', { state: { openHistory: { moldId: owner.id, autoSyncKey } } });
    }
  };

  return (
    <div data-mobile-dashboard="1">
      <style>{`
        [data-mobile-dashboard="1"] {
          width: 100%;
          max-width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-bottom: 16px;
          box-sizing: border-box;
        }
        [data-mobile-dashboard="1"] *,
        [data-mobile-dashboard="1"] *::before,
        [data-mobile-dashboard="1"] *::after {
          box-sizing: border-box;
        }
        [data-mobile-dashboard="1"] h2,
        [data-mobile-dashboard="1"] h3 {
          text-wrap: balance;
          overflow-wrap: break-word;
        }
        [data-mobile-dashboard="1"] .mdb-sticky-bar {
          position: sticky;
          top: 0;
          z-index: 20;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 8px 10px;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        [data-mobile-dashboard="1"] .mdb-nav-switch {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px;
          background: #f1f5f9;
          padding: 3px;
          border-radius: 10px;
        }
        [data-mobile-dashboard="1"] .mdb-nav-btn {
          border: 1px solid transparent;
          border-radius: 8px;
          padding: 7px 8px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          background: transparent;
          color: #475569;
          min-height: 36px;
        }
        [data-mobile-dashboard="1"] .mdb-nav-btn.is-active {
          background: #ffffff;
          color: #0f172a;
          border-color: #cbd5e1;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
        }
        [data-mobile-dashboard="1"] .mdb-kpi-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        [data-mobile-dashboard="1"] .mdb-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px;
          min-width: 0;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
        }
        [data-mobile-dashboard="1"] .mdb-chip-row {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          flex-wrap: nowrap;
          scrollbar-width: none;
          padding-bottom: 2px;
        }
        [data-mobile-dashboard="1"] .mdb-chip-row::-webkit-scrollbar {
          display: none;
        }
        [data-mobile-dashboard="1"] .mdb-chip-btn {
          flex: 0 0 auto;
          padding: 5px 10px;
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #475569;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
        }
        [data-mobile-dashboard="1"] .mdb-chip-btn.is-active {
          background: #0f172a;
          color: #ffffff;
          border-color: #0f172a;
        }
        @media (pointer: coarse) {
          [data-mobile-dashboard="1"] button {
            min-height: 36px;
          }
        }
      `}</style>

      {/* ── 상단 컴팩트 상태 & 현황분석 전환 바 ── */}
      <div className="mdb-sticky-bar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0, flex: '1 1 auto' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
              기준일 {kpi.targetDateLabel}
              <span style={{ fontWeight: 500, color: '#64748b', marginLeft: '6px' }}>갱신 {lastRefStr}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={onToggleAutoRefresh}
              style={{
                padding: '4px 8px',
                borderRadius: '999px',
                border: `1px solid ${autoRefreshEnabled ? '#86efac' : '#cbd5e1'}`,
                background: autoRefreshEnabled ? '#ecfdf5' : '#f8fafc',
                color: autoRefreshEnabled ? '#047857' : '#64748b',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              {autoRefreshEnabled ? '🟢 실시간' : '⚪ 수동'}
            </button>
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label="대시보드 새로고침"
              style={{
                padding: '4px 9px',
                borderRadius: '8px',
                border: '1px solid #93c5fd',
                background: '#eff6ff',
                color: '#1d4ed8',
                fontSize: '12px',
                fontWeight: 800,
                cursor: isRefreshing ? 'default' : 'pointer'
              }}
            >
              {isRefreshing ? '⏳' : '🔄'}
            </button>
            <button
              type="button"
              onClick={onSwitchToPc}
              style={{
                padding: '4px 8px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#334155',
                fontSize: '11.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🖥️ PC표
            </button>
          </div>
        </div>

        <nav className="mdb-nav-switch" aria-label="현황분석 화면 전환">
          <button
            type="button"
            className="mdb-nav-btn is-active"
            aria-current="page"
          >
            📊 종합 대시보드
          </button>
          <button
            type="button"
            className="mdb-nav-btn"
            onClick={() => navigate('/analytics')}
          >
            📈 실적 · 불량분석
          </button>
        </nav>
      </div>

      {/* ── 1. 핵심 KPI 2×2 카드 ── */}
      <div className="mdb-kpi-grid">
        <div className="mdb-card" style={{ borderLeft: '4px solid #3b82f6' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b' }}>🎯 금일 목표</div>
          <div style={{ fontSize: '19px', fontWeight: 900, color: '#0f172a', marginTop: '3px', lineHeight: 1.15 }}>
            {kpi.totalTarget.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>EA</span>
          </div>
          <div style={{ marginTop: '7px', height: '5px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.max(0, Math.min(kpi.attainPct, 100))}%`, background: kpi.attainPct >= 100 ? '#10b981' : '#3b82f6' }} />
          </div>
        </div>

        <div className="mdb-card" style={{ borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b' }}>✅ 실제 생산</div>
          <div style={{ fontSize: '19px', fontWeight: 900, color: '#0f172a', marginTop: '3px', lineHeight: 1.15 }}>
            {kpi.totalActual.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748b' }}>EA</span>
          </div>
          <div style={{ fontSize: '11px', marginTop: '6px', color: '#64748b' }}>
            {kpi.prevDayLabel && kpi.prevActual !== null ? (
              <>
                {kpi.prevDayLabel} 대비{' '}
                <strong style={{ color: kpi.actualDelta >= 0 ? '#15803d' : '#b91c1c' }}>
                  {kpi.actualDelta >= 0 ? `▲ ${kpi.actualDelta.toLocaleString()}` : `▼ ${Math.abs(kpi.actualDelta).toLocaleString()}`}
                </strong>
              </>
            ) : (
              `일보 ${kpi.totalReports}건`
            )}
          </div>
        </div>

        <div className="mdb-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b' }}>📈 금일 달성률</div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '4px', marginTop: '3px' }}>
            <span style={{ fontSize: '19px', fontWeight: 900, color: '#0f172a' }}>{kpi.attainPct}%</span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: kpi.attainPct >= 100 ? '#15803d' : kpi.attainPct >= 80 ? '#2563eb' : '#d97706' }}>
              {kpi.attainPct >= 100 ? '달성' : kpi.attainPct >= 80 ? '순조' : '미달'}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
            {kpi.weekAvgAttain !== null ? `7일 평균 ${kpi.weekAvgAttain}%` : '주간 집계 중'}
          </div>
        </div>

        <div className="mdb-card" style={{ borderLeft: `4px solid ${defectBadge[1]}`, background: defectBadge[2] }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b' }}>⚠️ 금일 불량률</div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '4px', marginTop: '3px' }}>
            <span style={{ fontSize: '19px', fontWeight: 900, color: '#0f172a' }}>{kpi.defectRate}%</span>
            <span style={{ fontSize: '11px', fontWeight: 800, padding: '1px 7px', borderRadius: '999px', background: '#ffffff', color: defectBadge[1] }}>
              {defectBadge[0]} {defectStatus === 'danger' ? '위험' : defectStatus === 'warn' ? '주의' : '양호'}
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#475569', marginTop: '6px' }}>
            불량 {kpi.totalDefect.toLocaleString()}건 / 일보 {kpi.totalReports}건
          </div>
        </div>
      </div>

      {/* ── 2. 조치 필요 연계 현황 (세로 카드형) ── */}
      <section className="mdb-card" aria-label="조치 필요 연계 현황">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>🔗 조치 필요 연계 현황</h3>
          <button
            type="button"
            onClick={() => navigate('/change-point', { state: { initialTab: 'linked' } })}
            style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer', padding: '2px 4px', whiteSpace: 'nowrap' }}
          >
            전체 관리 ›
          </button>
        </div>

        <div className="mdb-chip-row" style={{ marginBottom: '8px' }}>
          {[
            { key: 'progress', label: `진행중 ${chainCounts.progress}` },
            { key: 'all', label: `전체 ${chainCounts.all}` },
            { key: 'done', label: `완료 ${chainCounts.done}` },
            { key: 'unregistered', label: `미연동 ${chainCounts.unregistered}` }
          ].map((f) => (
            <button
              key={f.key}
              type="button"
              className={`mdb-chip-btn ${effectiveChainFilter === f.key ? 'is-active' : ''}`}
              onClick={() => {
                setChainFilter(f.key);
                setShowAllChains(false);
              }}
            >
              {f.label}
            </button>
          ))}
          {chainCounts.overdue > 0 && (
            <span style={{ flex: '0 0 auto', alignSelf: 'center', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '999px', background: '#b91c1c', color: '#ffffff' }}>
              D+7 초과 {chainCounts.overdue}
            </span>
          )}
        </div>

        {visibleChains.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '14px 8px', fontSize: '12.5px', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
            ✅ 해당 조건의 연계 건이 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {visibleChains.map((c) => {
              const ov = OVERALL_META[c.overall] || OVERALL_META.unregistered;
              const elapsed = c.overall === 'progress' ? calcElapsedDays(c.date) : null;
              const targetTitle = c.report
                ? `${c.report.carModel || '-'} · ${c.report.processName || '-'}`
                : `${ORIGIN_LABEL[c.origin]} · ${c.repair?.owner?.name || '-'}`;
              const repairLabel = c.repair ? REPAIR_STATE_LABEL[c.repairState] : '미등록';
              const cpLabel = c.cp ? CP_STATE_LABEL[c.cpState] : '미등록';

              return (
                <div
                  key={`${c.origin}_${c.key}`}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '9px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 7px', borderRadius: '999px', background: ov.bg, color: ov.color, flexShrink: 0 }}>
                        {ov.label}
                      </span>
                      {elapsed !== null && (
                        <span style={{ fontSize: '11px', fontWeight: 800, color: elapsed > 7 ? '#b91c1c' : '#64748b', flexShrink: 0 }}>
                          D+{elapsed}
                        </span>
                      )}
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {targetTitle}
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b', flexShrink: 0 }}>{c.date || ''}</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', alignItems: 'center' }}>
                    {c.report ? (
                      <button
                        type="button"
                        onClick={() => setOpenReport(c.report)}
                        style={{ padding: '4px 8px', fontSize: '11.5px', fontWeight: 700, borderRadius: '7px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#1e293b', cursor: 'pointer' }}
                      >
                        ① 발생 ({c.kind === 'mold' ? '금형' : '설비'} {c.slot.minutes}분)
                      </button>
                    ) : (
                      <span style={{ padding: '4px 8px', fontSize: '11.5px', fontWeight: 600, borderRadius: '7px', background: '#f1f5f9', color: '#64748b' }}>
                        ① {ORIGIN_LABEL[c.origin]}
                      </span>
                    )}
                    <span style={{ color: '#94a3b8', fontSize: '11px' }}>→</span>
                    {c.repair ? (
                      <button
                        type="button"
                        onClick={() => handleOpenRepair(c)}
                        style={{ padding: '4px 8px', fontSize: '11.5px', fontWeight: 700, borderRadius: '7px', border: '1px solid #93c5fd', background: '#eff6ff', color: '#1d4ed8', cursor: 'pointer' }}
                      >
                        ② 수리 {repairLabel}
                      </button>
                    ) : (
                      <span style={{ padding: '4px 8px', fontSize: '11.5px', color: '#94a3b8', background: '#f1f5f9', borderRadius: '7px' }}>
                        ② 미등록
                      </span>
                    )}
                    <span style={{ color: '#94a3b8', fontSize: '11px' }}>→</span>
                    {c.cp ? (
                      <button
                        type="button"
                        onClick={() => navigate('/change-point', { state: { focusChangePointId: c.cp.id } })}
                        style={{ padding: '4px 8px', fontSize: '11.5px', fontWeight: 700, borderRadius: '7px', border: '1px solid #ddd6fe', background: '#f5f3ff', color: '#6d28d9', cursor: 'pointer' }}
                      >
                        ③ 변동점 {cpLabel}
                      </button>
                    ) : (
                      <span style={{ padding: '4px 8px', fontSize: '11.5px', color: '#94a3b8', background: '#f1f5f9', borderRadius: '7px' }}>
                        ③ 미등록
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredChains.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllChains((prev) => !prev)}
                style={{ width: '100%', padding: '7px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                {showAllChains ? '3건만 접어보기 ▲' : `나머지 ${Math.min(15, filteredChains.length) - 3}건 더보기 ▼`}
              </button>
            )}
          </div>
        )}
      </section>

      {/* ── 3. 금형 점검 임박 ── */}
      <section className="mdb-card" aria-label="금형 점검 임박 현황">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>⚙️ 금형 점검 임박 (70%+)</h3>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              {moldCardInfo.urgent.length > 0
                ? `점검 임박 ${moldCardInfo.urgent.length}개 · 정상 ${moldCardInfo.normalCount}개`
                : `전체 ${moldCardInfo.totalCount}개 정상 범위 (상위 금형 표시)`}
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/mold')}
            style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer', padding: '2px 4px', whiteSpace: 'nowrap' }}
          >
            더보기 ›
          </button>
        </div>

        {displayMolds.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '12.5px', padding: '12px 0' }}>등록된 금형이 없습니다.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {displayMolds.map((m, idx) => {
              const pct = Math.round(m.pct);
              const [barColor, badgeTxt, badgeBg, badgeFg] = pct >= 90
                ? ['#ef4444', '위험', '#fef2f2', '#b91c1c']
                : pct >= 70
                  ? ['#f59e0b', '주의', '#fffbeb', '#b45309']
                  : ['#3b82f6', '정상', '#eff6ff', '#1d4ed8'];
              return (
                <button
                  key={m.id || idx}
                  type="button"
                  onClick={() => navigate('/mold', { state: { openHistory: { moldId: m.id } } })}
                  style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.name || m.code}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 800, padding: '1px 7px', borderRadius: '999px', background: badgeBg, color: badgeFg, flexShrink: 0 }}>
                      {badgeTxt} {pct}%
                    </span>
                  </div>
                  <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.max(m.cur > 0 ? 2 : 0, Math.min(100, m.pct))}%`, background: barColor }} />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 4. 최근 7일 추이 & 이번 주 불량 TOP 5 ── */}
      <section className="mdb-card" aria-label="최근 7일 추이와 불량 유형 TOP 5">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>📊 최근 7일 생산 · 불량률</h3>
          <button
            type="button"
            onClick={() => navigate('/analytics', { state: { activeTab: 'tab-charts', subTab: 'trend' } })}
            style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer', padding: '2px 4px', whiteSpace: 'nowrap' }}
          >
            상세 분석 ›
          </button>
        </div>

        {miniTrend.labels.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b', fontSize: '12.5px' }}>집계된 생산 데이터가 없습니다.</div>
        ) : (
          <div style={{ height: '190px', position: 'relative' }}>
            <Bar
              data={miniChartData}
              plugins={miniChartPlugins}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                layout: { padding: { top: 16, right: 4, left: 0, bottom: 0 } },
                interaction: { mode: 'index', intersect: false },
                scales: {
                  x: { grid: { display: false }, ticks: { font: { size: 10 }, maxRotation: 0 } },
                  y: { type: 'linear', position: 'left', beginAtZero: true, grace: '18%', grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 }, color: '#64748b', maxTicksLimit: 4 } },
                  y1: { type: 'linear', position: 'right', beginAtZero: true, grace: '25%', grid: { drawOnChartArea: false }, ticks: { font: { size: 10 }, color: '#ef4444', maxTicksLimit: 4, callback: (v) => `${v}%` } }
                },
                plugins: {
                  legend: { position: 'top', align: 'end', labels: { boxWidth: 10, font: { size: 10.5 }, padding: 8 } },
                  tooltip: { backgroundColor: 'rgba(15,23,42,0.92)', padding: 8 }
                }
              }}
            />
          </div>
        )}

        <div style={{ borderTop: '1px solid #f1f5f9', marginTop: '10px', paddingTop: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
              🔍 이번 주 불량 TOP 5 <strong style={{ color: '#ef4444' }}>({top5Defects.total.toLocaleString()}건)</strong>
            </span>
            <button
              type="button"
              onClick={() => navigate('/analytics', { state: { activeTab: 'tab-charts', subTab: 'pareto' } })}
              style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '12px', fontWeight: 700, cursor: 'pointer', padding: '2px 4px', whiteSpace: 'nowrap' }}
            >
              파레토 ›
            </button>
          </div>
          {top5Defects.list.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#64748b', textAlign: 'center', padding: '8px 0' }}>최근 불량 내역이 없습니다.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {top5Defects.list.map((d, i) => {
                const widthPct = Math.round((d.qty / top5Defects.maxQty) * 100);
                return (
                  <div key={d.name} style={{ display: 'grid', gridTemplateColumns: '20px 1fr 48px', gap: '7px', alignItems: 'center' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fef2f2', color: '#ef4444', fontSize: '10.5px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {i + 1}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '3px' }}>
                        {d.name}
                      </div>
                      <div style={{ height: '5px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${widthPct}%`, background: i === 0 ? '#ef4444' : i < 3 ? '#f97316' : '#fbbf24' }} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
                      {d.qty.toLocaleString()}건
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── 5. FMB 보관실 금일 환경 · 재고 요약 (31일 표 대신 모바일 요약 카드) ── */}
      <section className="mdb-card" aria-label="FMB 보관실 환경 및 재고 요약">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>🌡️ FMB 보관실 환경 · 재고</h3>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              {fmbRecentSummary.latestDate ? `최근 기록 ${fmbRecentSummary.latestDate}` : '기록 대기'}
            </div>
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: '999px',
              background: fmbRecentSummary.issueCount > 0 ? '#fef2f2' : '#ecfdf5',
              color: fmbRecentSummary.issueCount > 0 ? '#b91c1c' : '#047857',
              flexShrink: 0
            }}
          >
            {fmbRecentSummary.issueCount > 0 ? `이달 이상 ${fmbRecentSummary.issueCount}일` : '이달 점검 양호'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px', textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '7px 4px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '11px', color: '#64748b' }}>보관 온도</div>
            <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
              {fmbRecentSummary.latestTemp !== null ? `${fmbRecentSummary.latestTemp}℃` : '—'}
            </div>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '7px 4px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '11px', color: '#64748b' }}>보관 습도</div>
            <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
              {fmbRecentSummary.latestHum !== null ? `${fmbRecentSummary.latestHum}%` : '—'}
            </div>
          </div>
          <div style={{ background: '#f8fafc', borderRadius: '8px', padding: '7px 4px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '11px', color: '#64748b' }}>총 재고</div>
            <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
              {formatKg(stockSummary.totalKg)}kg
            </div>
          </div>
        </div>

        <div className="mdb-chip-row" style={{ marginBottom: '8px' }}>
          {stockSummary.grades.map((g) => (
            <span
              key={g.code}
              style={{
                flex: '0 0 auto',
                fontSize: '11.5px',
                padding: '4px 8px',
                borderRadius: '8px',
                background: g.kg <= 0 ? '#fef2f2' : '#f8fafc',
                border: `1px solid ${g.kg <= 0 ? '#fecaca' : '#e2e8f0'}`,
                color: '#1e293b',
                fontWeight: 700
              }}
            >
              {g.code}: <strong>{formatKg(g.kg)}kg</strong>
              {g.earliestExpiry ? ` (~${g.earliestExpiry})` : ''}
            </span>
          ))}
        </div>

        {fmbRecentSummary.recentDays.length > 0 && (
          <details style={{ fontSize: '12px' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700, color: '#2563eb', padding: '4px 0', userSelect: 'none' }}>
              최근 7일 온·습도 기록 펼쳐보기 ({fmbRecentSummary.recentDays.length}건)
            </summary>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '6px' }}>
              {fmbRecentSummary.recentDays.map((d) => (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => setOpenReport(d.report)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: '#f8fafc',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontFamily: 'inherit',
                    color: '#1e293b'
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{d.date}</span>
                  <span>
                    {d.temp !== null ? `${d.temp}℃` : '-'} / {d.hum !== null ? `${d.hum}%` : '-'}
                  </span>
                  <span style={{ fontWeight: 800, color: d.hasIssue ? '#b91c1c' : '#047857' }}>
                    {d.hasIssue ? '주의' : '양호'}
                  </span>
                </button>
              ))}
            </div>
          </details>
        )}
      </section>

      {openReport && (
        <Suspense fallback={null}>
          <LegacyDetailModal report={openReport} onClose={() => setOpenReport(null)} />
        </Suspense>
      )}
    </div>
  );
}
