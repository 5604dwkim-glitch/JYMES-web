import React, { useState, useEffect, useMemo, useRef, Suspense, lazy } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import {
  resolveGm9bqcProcessCode,
  buildGm9bqcGrunDashboardModel
} from '../../services/gm9bqcGrunEngine';

const LegacyDetailModal = lazy(() => import('../DynamicForms/LegacyDetailModal'));

function formatTodayYmd() {
  return new Date().toLocaleDateString('sv-SE');
}

function shiftDateYmd(ymd, offsetDays) {
  if (!ymd) return ymd;
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 우하단 부자재 LOT 현황 카드 좌측 미니 바코드 아이콘
 */
function MiniBarcode({ seedText, isEmpty }) {
  const bars = useMemo(() => {
    const seed = seedText || 'JYMES-9BQC';
    const widths = [2, 1, 3, 1, 2, 1, 2, 3, 1, 2, 1];
    const out = [];
    for (let i = 0; i < widths.length; i += 1) {
      const code = seed.charCodeAt(i % seed.length) || 1;
      out.push(((widths[i] + code) % 3) + 1);
    }
    return out;
  }, [seedText]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: '1.5px',
        height: '28px',
        padding: '0 4px',
        opacity: isEmpty ? 0.3 : 0.9,
        flexShrink: 0
      }}
      aria-hidden="true"
    >
      {bars.map((w, idx) => (
        <span
          key={idx}
          style={{
            display: 'inline-block',
            width: `${w * 1.3}px`,
            background: '#0f172a',
            borderRadius: '0.5px'
          }}
        />
      ))}
    </div>
  );
}

export default function Gm9bqcGrunDashboard({ reports = [], reportsLoading = false }) {
  const today = useMemo(() => formatTodayYmd(), []);

  // 최근 reports 중 9BQC G/RUN 일보가 존재하는 가장 최근 가동일 탐색
  const latestActiveGrunDate = useMemo(() => {
    const dates = [];
    reports.forEach((r) => {
      if (r?.date && resolveGm9bqcProcessCode(r)) {
        dates.push(r.date);
      }
    });
    if (dates.length === 0) return null;
    dates.sort();
    return dates[dates.length - 1];
  }, [reports]);

  const [viewMode, setViewMode] = useState('single'); // 'single' | 'range'
  const [selectedDate, setSelectedDate] = useState(today);
  const [rangeStart, setRangeStart] = useState(today);
  const [rangeEnd, setRangeEnd] = useState(today);
  const userChangedDateRef = useRef(false);
  const autoAppliedLatestRef = useRef(false);

  // 오늘 일보가 0건이고 최근 가동일 일보가 있으면 최초 1회 최근 가동일로 자동 맞춤
  useEffect(() => {
    if (userChangedDateRef.current || autoAppliedLatestRef.current) return;
    if (!reportsLoading && latestActiveGrunDate) {
      autoAppliedLatestRef.current = true;
      const hasTodayReport = reports.some(
        (r) => r?.date === today && Boolean(resolveGm9bqcProcessCode(r))
      );
      if (!hasTodayReport && latestActiveGrunDate !== today) {
        setSelectedDate(latestActiveGrunDate);
        setRangeStart(latestActiveGrunDate);
        setRangeEnd(latestActiveGrunDate);
      }
    }
  }, [reportsLoading, latestActiveGrunDate, reports, today]);

  const [shiftFilter, setShiftFilter] = useState('ALL'); // 'ALL' | '주간' | '야간'
  const [lotSearch, setLotSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  // 실시간 Firestore 구독 상태 (LOT 추이도의 공정별 투입일자 연계를 위해 기준 시작일 -14일 구간 함께 구독)
  const [liveWindowReports, setLiveWindowReports] = useState(null);
  const [liveStatus, setLiveStatus] = useState('connecting'); // 'connecting' | 'live' | 'fallback'
  const [lastSyncedAt, setLastSyncedAt] = useState('');

  // 상세 드릴다운 모달 상태
  const [inspectorModal, setInspectorModal] = useState(null); // { type: 'process' | 'sublot' | 'lot_track', data }
  const [detailReport, setDetailReport] = useState(null);

  const effectiveStart =
    viewMode === 'single' ? selectedDate : rangeStart <= rangeEnd ? rangeStart : rangeEnd;
  const effectiveEnd =
    viewMode === 'single' ? selectedDate : rangeStart <= rangeEnd ? rangeEnd : rangeStart;
  const trackingQueryStart = useMemo(() => shiftDateYmd(effectiveStart, -14), [effectiveStart]);

  useEffect(() => {
    if (!trackingQueryStart || !effectiveEnd) return undefined;
    setLiveStatus('connecting');

    const q = query(
      collection(db, 'reports'),
      where('date', '>=', trackingQueryStart),
      where('date', '<=', effectiveEnd)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const docs = [];
        snapshot.forEach((docSnap) => {
          docs.push({ id: docSnap.id, ...docSnap.data() });
        });
        setLiveWindowReports(docs);
        setLiveStatus('live');
        setLastSyncedAt(
          new Date().toLocaleTimeString('ko-KR', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        );
      },
      (err) => {
        console.error('9BQC G/RUN 실시간 구독 오류 (기존 캐시 폴백):', err);
        setLiveStatus('fallback');
        import('../../services/firestore')
          .then(({ fetchReports }) =>
            fetchReports({ startDate: trackingQueryStart, endDate: effectiveEnd })
          )
          .then((docs) => {
            if (Array.isArray(docs)) setLiveWindowReports(docs);
          })
          .catch(() => {});
      }
    );

    return () => {
      unsub();
    };
  }, [trackingQueryStart, effectiveEnd]);

  // 만약 초기 진입 시 오늘 일보가 없고 실시간 윈도우 내에 최근 9BQC 가동일이 있으면 자동 맞춤
  useEffect(() => {
    if (userChangedDateRef.current || autoAppliedLatestRef.current) return;
    if (!Array.isArray(liveWindowReports) || liveWindowReports.length === 0) return;
    const grunDates = liveWindowReports
      .filter((r) => r?.date && resolveGm9bqcProcessCode(r))
      .map((r) => r.date)
      .sort();
    if (grunDates.length > 0 && !grunDates.includes(today)) {
      const latest = grunDates[grunDates.length - 1];
      autoAppliedLatestRef.current = true;
      setSelectedDate(latest);
      setRangeStart(latest);
      setRangeEnd(latest);
    }
  }, [liveWindowReports, today]);

  // 전체 추적 풀 (부모 reports + 실시간 14일 윈도우 병합)
  const trackingReports = useMemo(() => {
    const byId = new Map();
    reports.forEach((r) => {
      if (r?.id && r.date && r.date <= effectiveEnd) byId.set(r.id, r);
    });
    if (Array.isArray(liveWindowReports)) {
      liveWindowReports.forEach((r) => {
        if (r?.id) byId.set(r.id, r);
      });
    }
    return [...byId.values()];
  }, [reports, liveWindowReports, effectiveEnd]);

  // 선택된 기간 [effectiveStart, effectiveEnd] 일보
  const sourceReports = useMemo(() => {
    if (Array.isArray(liveWindowReports)) {
      return liveWindowReports.filter(
        (r) => r?.date && r.date >= effectiveStart && r.date <= effectiveEnd
      );
    }
    return reports.filter((r) => r?.date && r.date >= effectiveStart && r.date <= effectiveEnd);
  }, [liveWindowReports, reports, effectiveStart, effectiveEnd]);

  const model = useMemo(
    () =>
      buildGm9bqcGrunDashboardModel(sourceReports, {
        shiftFilter,
        trackingReports
      }),
    [sourceReports, shiftFilter, trackingReports]
  );

  // 공정별 최대 생산량 및 최대 불량 건수 (차트 스케일용)
  const maxProcActual = useMemo(() => {
    let m = 100;
    model.processRows.forEach((p) => {
      if (p.actual > m) m = p.actual;
      if (p.plan > m) m = p.plan;
    });
    return m;
  }, [model.processRows]);

  const maxProcDefect = useMemo(() => {
    let m = 10;
    model.processRows.forEach((p) => {
      if (p.defect > m) m = p.defect;
    });
    return Math.ceil(m * 1.15);
  }, [model.processRows]);

  const maxParetoCount = useMemo(() => {
    if (model.top5Defects.length === 0) return 10;
    return Math.max(1, model.top5Defects[0].count);
  }, [model.top5Defects]);

  // 좌하단 LOT 추이도 행 필터링
  const filteredTimelineRows = useMemo(() => {
    const rows = model.lotTimeline?.rows || [];
    const kw = lotSearch.trim().toLowerCase();
    if (!kw) return rows;
    return rows.filter(
      (r) =>
        r.group.toLowerCase().includes(kw) ||
        r.sideSec.toLowerCase().includes(kw) ||
        (r.lotKey && r.lotKey.toLowerCase().includes(kw))
    );
  }, [model.lotTimeline, lotSearch]);

  const frtTimelineRows = useMemo(
    () => filteredTimelineRows.filter((r) => r.group === 'FRT'),
    [filteredTimelineRows]
  );
  const rrTimelineRows = useMemo(
    () => filteredTimelineRows.filter((r) => r.group === 'RR'),
    [filteredTimelineRows]
  );

  const periodLabel =
    viewMode === 'single'
      ? selectedDate
      : effectiveStart === effectiveEnd
        ? effectiveStart
        : `${effectiveStart} ~ ${effectiveEnd}`;

  const handleExportExcel = async () => {
    if (exporting) return;
    try {
      setExporting(true);
      const { exportGm9bqcGrunToExcel } = await import('../../utils/gm9bqcGrunExcelExport');
      await exportGm9bqcGrunToExcel({
        model,
        periodLabel,
        shiftLabel: shiftFilter === 'ALL' ? '전체' : shiftFilter
      });
    } catch (e) {
      console.error('Excel export failed:', e);
      alert('엑셀 다운로드 중 오류가 발생했습니다: ' + e.message);
    } finally {
      setExporting(false);
    }
  };

  // 좌상단 12공정 불량 건수 SVG 폴리라인 좌표 (viewBox 0 0 1200 180)
  const defectLinePoints = useMemo(() => {
    return model.processRows.map((p, idx) => {
      const x = ((idx + 0.5) / 12) * 1200;
      const ratio = maxProcDefect > 0 ? Math.min(1, p.defect / maxProcDefect) : 0;
      const y = 166 - ratio * 138;
      return { x, y, defect: p.defect, code: p.code };
    });
  }, [model.processRows, maxProcDefect]);

  const defectPolylineStr = useMemo(
    () => defectLinePoints.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' '),
    [defectLinePoints]
  );

  const worstDefectIssue = model.top5Defects[0] || null;
  const worstDefectShare =
    worstDefectIssue && model.totalDefect > 0
      ? ((worstDefectIssue.count / model.totalDefect) * 100).toFixed(1)
      : '0.0';

  const dateColumns = model.lotTimeline?.dateColumns || [];

  const renderTimelineRow = (row) => {
    const activeColIndices = [];
    row.cells.forEach((cell, cIdx) => {
      if (cell.items && cell.items.length > 0) activeColIndices.push(cIdx);
    });
    const firstActiveIdx = activeColIndices.length > 0 ? activeColIndices[0] : -1;
    const lastActiveIdx =
      activeColIndices.length > 0 ? activeColIndices[activeColIndices.length - 1] : -1;

    const isLh = row.sideSec.startsWith('LH');

    return (
      <div
        key={row.rowKey}
        className="grun-lot-timeline-row"
        onClick={() => {
          if (!row.isEmpty && row.reports?.length > 0) {
            setInspectorModal({ type: 'lot_track', data: row });
          }
        }}
        title={
          row.isEmpty
            ? `${row.group} ${row.sideSec} — 조회 기간 내 입력된 소재 LOT 없음`
            : `${row.group} ${row.sideSec} | 소재 시작 LOT: ${row.lotKey} (클릭 시 투입 공정 일보 상세 보기)`
        }
        style={{
          display: 'grid',
          gridTemplateColumns: `112px repeat(${Math.max(1, dateColumns.length)}, minmax(96px, 1fr))`,
          alignItems: 'center',
          minHeight: '31px',
          padding: '3px 6px',
          borderBottom: '1px solid #f1f5f9',
          cursor: !row.isEmpty && row.reports?.length > 0 ? 'pointer' : 'default',
          position: 'relative',
          transition: 'background 0.12s ease'
        }}
      >
        {/* 좌측 간결 표기: [FRT / RR] + [LH A / RH A ...] */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            paddingRight: '6px',
            zIndex: 2
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '34px',
              height: '20px',
              borderRadius: '5px',
              fontSize: '10.5px',
              fontWeight: 800,
              background: row.group === 'FRT' ? '#e0e7ff' : '#ccfbf1',
              color: row.group === 'FRT' ? '#3730a3' : '#115e59',
              flexShrink: 0
            }}
          >
            {row.group}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '52px',
              height: '20px',
              borderRadius: '5px',
              fontSize: '11px',
              fontWeight: 800,
              background: isLh ? '#f1f5f9' : '#f8fafc',
              color: isLh ? '#0f172a' : '#334155',
              border: '1px solid #cbd5e1',
              flexShrink: 0
            }}
          >
            {row.sideSec}
          </span>
        </div>

        {/* 우측 날짜 타임라인 셀들 */}
        {row.cells.map((cell, cIdx) => {
          const inChain =
            firstActiveIdx !== -1 &&
            lastActiveIdx !== -1 &&
            firstActiveIdx !== lastActiveIdx &&
            cIdx >= firstActiveIdx &&
            cIdx <= lastActiveIdx;
          const isChainStart = cIdx === firstActiveIdx && firstActiveIdx !== lastActiveIdx;
          const isChainEnd = cIdx === lastActiveIdx && firstActiveIdx !== lastActiveIdx;

          return (
            <div
              key={cell.ymd}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                flexWrap: 'wrap',
                minHeight: '24px',
                padding: '1px 4px'
              }}
            >
              {/* 공정 배지 간 가로 연결선 */}
              {inChain && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: isChainStart ? '50%' : 0,
                    right: isChainEnd ? '50%' : 0,
                    height: '2px',
                    background: row.color,
                    transform: 'translateY(-50%)',
                    zIndex: 1,
                    opacity: 0.75
                  }}
                />
              )}

              {row.isEmpty && cIdx === 0 && (
                <span
                  style={{
                    fontSize: '10.5px',
                    color: '#94a3b8',
                    fontWeight: 600,
                    zIndex: 2
                  }}
                >
                  투입 LOT 대기
                </span>
              )}

              {cell.items.map((item, iIdx) => {
                if (item.type === 'missing') {
                  return (
                    <span
                      key={`${cell.ymd}-miss-${iIdx}`}
                      title={item.detail || '중간 공정 데이터 미확인'}
                      style={{
                        position: 'relative',
                        zIndex: 2,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2px 9px',
                        borderRadius: '999px',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        background: '#fef2f2',
                        color: '#e11d48',
                        border: '1px solid #fda4af',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.label}
                    </span>
                  );
                }

                return (
                  <span
                    key={`${cell.ymd}-item-${iIdx}`}
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '2px 10px',
                      borderRadius: '999px',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      background: row.color,
                      color: '#ffffff',
                      boxShadow: '0 1px 2px rgba(15, 23, 42, 0.12)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {item.label}
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className="gm-9bqc-grun-board"
      data-analytics-board="9bqc-grun"
      style={{
        background: '#f1f5f9',
        borderRadius: '14px',
        padding: '14px',
        color: '#0f172a',
        fontFamily: "'Pretendard', 'Malgun Gothic', 'Noto Sans KR', sans-serif"
      }}
    >
      <style>{`
        [data-analytics-board="9bqc-grun"] {
          box-sizing: border-box;
        }
        [data-analytics-board="9bqc-grun"] * {
          box-sizing: border-box;
        }
        @keyframes gm9bqcPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.88); }
        }
        [data-analytics-board="9bqc-grun"] .grun-4quad-grid {
          display: grid;
          grid-template-columns: minmax(0, 2.2fr) minmax(320px, 1fr);
          gap: 14px;
          align-items: stretch;
        }
        [data-analytics-board="9bqc-grun"] .grun-panel-card {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.05);
          display: flex;
          flex-direction: column;
        }
        [data-analytics-board="9bqc-grun"] .grun-panel-header {
          background: #162b4c;
          color: #ffffff;
          padding: 9px 15px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }
        [data-analytics-board="9bqc-grun"] .grun-proc-col:hover {
          background: rgba(79, 70, 229, 0.06);
          border-radius: 6px;
        }
        [data-analytics-board="9bqc-grun"] .grun-lot-timeline-row:hover {
          background: #f8fafc !important;
        }
        [data-analytics-board="9bqc-grun"] .grun-sublot-row:hover {
          border-color: #4f46e5 !important;
          background: #f1f5f9 !important;
          transform: translateY(-1px);
        }
        @media (max-width: 1180px) {
          [data-analytics-board="9bqc-grun"] .grun-4quad-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* ── 상단 통합 헤더 바 (예시 1-B안 스타일) ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '12px',
          padding: '2px 4px'
        }}
      >
        {/* 좌측: 타이틀 + 날짜/기간 + 주·야간 + 실시간 상태 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 900,
              letterSpacing: '-0.4px',
              color: '#0f172a',
              marginRight: '4px'
            }}
          >
            9BQC G/RUN 종합 현황판
          </div>

          {/* 일별 / 기간 토글 */}
          <div
            style={{
              display: 'inline-flex',
              background: '#e2e8f0',
              borderRadius: '8px',
              padding: '2px'
            }}
          >
            {[
              { id: 'single', label: '일별' },
              { id: 'range', label: '기간' }
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setViewMode(m.id)}
                style={{
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: viewMode === m.id ? '#162b4c' : 'transparent',
                  color: viewMode === m.id ? '#ffffff' : '#475569'
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {viewMode === 'single' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="date"
                value={selectedDate}
                max="9999-12-31"
                onChange={(e) => {
                  userChangedDateRef.current = true;
                  setSelectedDate(e.target.value);
                }}
                style={{
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  height: '32px'
                }}
              />
              {selectedDate !== today && (
                <button
                  type="button"
                  onClick={() => {
                    userChangedDateRef.current = true;
                    setSelectedDate(today);
                  }}
                  style={{
                    background: '#ffffff',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '7px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    height: '32px'
                  }}
                >
                  오늘
                </button>
              )}
              {latestActiveGrunDate && selectedDate !== latestActiveGrunDate && (
                <button
                  type="button"
                  onClick={() => {
                    userChangedDateRef.current = true;
                    setSelectedDate(latestActiveGrunDate);
                  }}
                  style={{
                    background: '#eef2ff',
                    color: '#4338ca',
                    border: '1px solid #c7d2fe',
                    borderRadius: '7px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    height: '32px'
                  }}
                >
                  최근가동일
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="date"
                value={rangeStart}
                max="9999-12-31"
                onChange={(e) => {
                  userChangedDateRef.current = true;
                  setRangeStart(e.target.value);
                }}
                style={{
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '5px 8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  height: '32px'
                }}
              />
              <span style={{ color: '#64748b', fontSize: '12px' }}>~</span>
              <input
                type="date"
                value={rangeEnd}
                max="9999-12-31"
                onChange={(e) => {
                  userChangedDateRef.current = true;
                  setRangeEnd(e.target.value);
                }}
                style={{
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '5px 8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  height: '32px'
                }}
              />
            </div>
          )}

          <select
            value={shiftFilter}
            onChange={(e) => setShiftFilter(e.target.value)}
            style={{
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '5px 10px',
              fontSize: '12.5px',
              fontWeight: 700,
              height: '32px',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">전체 (주·야)</option>
            <option value="주간">주간</option>
            <option value="야간">야간</option>
          </select>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 11px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 800,
              background: liveStatus === 'live' ? '#dce4f2' : '#fef3c7',
              color: liveStatus === 'live' ? '#1e293b' : '#b45309',
              border: '1px solid #cbd5e1'
            }}
            title={lastSyncedAt ? `최근 동기화: ${lastSyncedAt}` : ''}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: liveStatus === 'live' ? '#10b981' : '#f59e0b',
                animation: 'gm9bqcPulse 1.8s infinite'
              }}
            />
            {liveStatus === 'live' ? '실시간 ON' : '연결중...'}
          </span>
        </div>

        {/* 우측: 3대 핵심 요약 배지 (종합 수율 / 총 생산 / 불량률) + 엑셀 다운로드 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              background: '#dce4f2',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '999px',
              padding: '5px 13px',
              fontSize: '12.5px',
              fontWeight: 800
            }}
          >
            종합 수율 {model.yieldRate.toFixed(1)}%
          </span>
          <span
            style={{
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '999px',
              padding: '5px 13px',
              fontSize: '12.5px',
              fontWeight: 800
            }}
          >
            총 생산 {model.totalActual.toLocaleString()}
          </span>
          <span
            style={{
              background: '#ffffff',
              color: model.totalDefect > 0 ? '#be123c' : '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '999px',
              padding: '5px 13px',
              fontSize: '12.5px',
              fontWeight: 800
            }}
          >
            불량률 {model.defectRateTotal.toFixed(1)}%
          </span>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: '#162b4c',
              color: '#ffffff',
              border: '1px solid #0f172a',
              borderRadius: '8px',
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: 700,
              height: '32px',
              cursor: exporting ? 'wait' : 'pointer'
            }}
          >
            <span>📥</span> {exporting ? '생성중...' : 'Excel'}
          </button>
        </div>
      </div>

      {/* ── 메인 4분할 그리드 (예시 1-B안) ── */}
      <div className="grun-4quad-grid">
        {/* ==================== 1. 좌상단: 공정별 품질 지수 ==================== */}
        <div className="grun-panel-card">
          <div className="grun-panel-header">
            <span style={{ fontSize: '14.5px', fontWeight: 800 }}>공정별 품질 지수</span>
            <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>
              막대 클릭 시 공정별 작업일보 상세 조회
            </span>
          </div>

          <div style={{ padding: '12px 16px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* 상단 범례 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '16px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#334155',
                marginBottom: '6px'
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    background: '#4338ca'
                  }}
                />
                공정 품질 (%)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    background: '#10b981'
                  }}
                />
                생산 실적 지수
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '16px',
                    height: '2.5px',
                    background: '#9d174d',
                    display: 'inline-block'
                  }}
                />
                불량 건수
              </span>
            </div>

            {/* 복합 차트 본체: 좌측 Y축(%) + 중앙 12개 공정 막대 & 꺾은선 + 우측 Y축(불량 건수) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '38px 1fr 34px',
                alignItems: 'stretch',
                gap: '6px',
                height: '188px'
              }}
            >
              {/* 좌측 Y축 (0% ~ 100%) */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#475569',
                  textAlign: 'right',
                  paddingTop: '14px',
                  paddingBottom: '4px'
                }}
              >
                <span>100%</span>
                <span>80%</span>
                <span>60%</span>
                <span>40%</span>
                <span>20%</span>
                <span>0%</span>
              </div>

              {/* 중앙 12개 공정 막대 + 불량 건수 SVG 오버레이 */}
              <div
                style={{
                  position: 'relative',
                  borderBottom: '1.5px solid #cbd5e1',
                  paddingTop: '18px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
                  alignItems: 'end'
                }}
              >
                {/* 배경 수평 그리드 선 */}
                {[0, 0.2, 0.4, 0.6, 0.8, 1].map((step) => (
                  <div
                    key={step}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: `${18 + step * 148}px`,
                      borderTop: '1px solid #e2e8f0',
                      pointerEvents: 'none'
                    }}
                  />
                ))}

                {model.processRows.map((proc) => {
                  const hasData = proc.reportCount > 0 || proc.actual > 0 || proc.defect > 0;
                  const qPct = hasData ? Math.max(8, Math.min(100, proc.qualityRate)) : 0;
                  const actPct =
                    proc.actual > 0
                      ? Math.max(12, Math.min(100, Math.round((proc.actual / maxProcActual) * 100)))
                      : 0;
                  const shortDisplay = proc.shortName
                    .replace(/^(조인트|후가공|검사포장)-/, '');

                  return (
                    <div
                      key={proc.code}
                      className="grun-proc-col"
                      onClick={() => setInspectorModal({ type: 'process', data: proc })}
                      title={`#${proc.code} ${proc.processName} | 품질 ${proc.qualityRate.toFixed(1)}% | 실적 ${proc.actual.toLocaleString()} EA (LH ${proc.lh.toLocaleString()} / RH ${proc.rh.toLocaleString()}) | 불량 ${proc.defect}건`}
                      style={{
                        position: 'relative',
                        height: '152px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        cursor: 'pointer',
                        zIndex: 2,
                        padding: '0 2px'
                      }}
                    >
                      {hasData && (
                        <span
                          style={{
                            position: 'absolute',
                            top: '-15px',
                            fontSize: '10px',
                            fontWeight: 800,
                            color: proc.defect > 0 ? '#be123c' : '#0f172a',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {proc.qualityRate.toFixed(1)}%
                        </span>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          justifyContent: 'center',
                          gap: '3px',
                          width: '100%',
                          height: '148px'
                        }}
                      >
                        {/* 막대 1: 공정 품질 (%) */}
                        <div
                          style={{
                            width: '34%',
                            maxWidth: '17px',
                            height: hasData ? `${qPct}%` : '4px',
                            background: hasData ? '#4338ca' : '#e2e8f0',
                            borderRadius: '3px 3px 0 0',
                            transition: 'height 0.2s ease'
                          }}
                        />
                        {/* 막대 2: 생산 실적 지수 */}
                        <div
                          style={{
                            width: '34%',
                            maxWidth: '17px',
                            height: hasData ? `${actPct}%` : '4px',
                            background: hasData ? '#10b981' : '#e2e8f0',
                            borderRadius: '3px 3px 0 0',
                            transition: 'height 0.2s ease'
                          }}
                        />
                      </div>

                      <span
                        style={{
                          position: 'absolute',
                          bottom: '-22px',
                          fontSize: '10.5px',
                          fontWeight: 800,
                          color: '#0f172a',
                          whiteSpace: 'nowrap',
                          letterSpacing: '-0.3px'
                        }}
                      >
                        {shortDisplay}
                      </span>
                    </div>
                  );
                })}

                {/* 불량 건수 꺾은선 오버레이 */}
                <svg
                  viewBox="0 0 1200 180"
                  preserveAspectRatio="none"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '166px',
                    pointerEvents: 'none',
                    zIndex: 3
                  }}
                >
                  <polyline
                    fill="none"
                    stroke="#9d174d"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={defectPolylineStr}
                  />
                  {defectLinePoints.map((pt) => (
                    <circle
                      key={pt.code}
                      cx={pt.x}
                      cy={pt.y}
                      r={pt.defect > 0 ? '6' : '4'}
                      fill={pt.defect > 0 ? '#be123c' : '#9d174d'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  ))}
                </svg>
              </div>

              {/* 우측 Y축 (불량 건수) */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#475569',
                  textAlign: 'left',
                  paddingTop: '14px',
                  paddingBottom: '4px'
                }}
              >
                <span>{maxProcDefect}</span>
                <span>{Math.round(maxProcDefect * 0.8)}</span>
                <span>{Math.round(maxProcDefect * 0.6)}</span>
                <span>{Math.round(maxProcDefect * 0.4)}</span>
                <span>{Math.round(maxProcDefect * 0.2)}</span>
                <span>0</span>
              </div>
            </div>

            {/* 하단 4대 공정 단계 그룹 브라켓 (소재준비 3 / 조인트 3 / 후가공 2 / 검사포장 4) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '38px 1fr 34px',
                gap: '6px',
                marginTop: '26px'
              }}
            >
              <div />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '3fr 3fr 2fr 4fr',
                  gap: '8px',
                  textAlign: 'center',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  color: '#1e293b'
                }}
              >
                {['소재준비', '조인트', '후가공', '검사포장'].map((grpName) => (
                  <div key={grpName}>
                    <div
                      style={{
                        height: '5px',
                        borderLeft: '1.5px solid #94a3b8',
                        borderRight: '1.5px solid #94a3b8',
                        borderBottom: '1.5px solid #94a3b8',
                        marginBottom: '4px'
                      }}
                    />
                    {grpName}
                  </div>
                ))}
              </div>
              <div />
            </div>
          </div>
        </div>

        {/* ==================== 2. 우상단: 주요 불량 이슈 ==================== */}
        <div className="grun-panel-card">
          <div className="grun-panel-header">
            <span style={{ fontSize: '14.5px', fontWeight: 800 }}>주요 불량 이슈</span>
            <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>
              총 {model.totalDefect.toLocaleString()}건
            </span>
          </div>

          <div
            style={{
              padding: '12px 14px',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '10px'
            }}
          >
            {/* 상단 Worst Issue 배너 */}
            {worstDefectIssue ? (
              <div
                style={{
                  background: '#ffe4e6',
                  border: '1px solid #fecdd3',
                  borderRadius: '9px',
                  padding: '9px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '15px' }}>⚠️</span>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#9f1239' }}>
                  Worst Issue: {worstDefectIssue.name} {worstDefectIssue.count}건 / {worstDefectShare}%
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '9px',
                  padding: '9px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '15px' }}>✅</span>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#065f46' }}>
                  발생 불량 없음 (전 공정 무결점)
                </div>
              </div>
            )}

            {/* Top 5 파레토 수평 바 리스트 */}
            {model.top5Defects.length > 0 ? (
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '9px',
                  padding: '4px 0'
                }}
              >
                {model.top5Defects.map((d, idx) => {
                  const pct = Math.max(12, Math.round((d.count / maxParetoCount) * 100));
                  const axisLabels = ['100%', '75%', '50%', '25%', '0%'];
                  return (
                    <div
                      key={d.name}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '84px 1fr 42px 36px',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        fontWeight: 800,
                        color: '#0f172a'
                      }}
                    >
                      <div
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={d.name}
                      >
                        {idx + 1}. {d.name}
                      </div>

                      <div
                        style={{
                          height: '11px',
                          background: '#f1f5f9',
                          borderRadius: '999px',
                          overflow: 'hidden',
                          display: 'flex'
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #4338ca 0%, #4338ca 48%, #be123c 48%, #e11d48 100%)',
                            borderRadius: '999px'
                          }}
                        />
                      </div>

                      <div style={{ textAlign: 'right', fontSize: '11.5px', color: '#0f172a' }}>
                        {d.count}건
                      </div>

                      <div style={{ textAlign: 'right', fontSize: '11px', color: '#475569' }}>
                        {axisLabels[idx] || ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  fontSize: '12px',
                  fontWeight: 600,
                  minHeight: '130px'
                }}
              >
                선택된 조건 내 집계된 불량 내역이 없습니다.
              </div>
            )}

            {/* 최다 불량 공정 보조 안내 */}
            <div
              style={{
                borderTop: '1px solid #f1f5f9',
                paddingTop: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '11px',
                color: '#64748b',
                fontWeight: 700
              }}
            >
              <span>최다 발생 공정</span>
              <span style={{ color: model.worstProcess ? '#be123c' : '#059669', fontWeight: 800 }}>
                {model.worstProcess
                  ? `#${model.worstProcess.code} ${model.worstProcess.shortName} (${model.worstProcess.defect}건)`
                  : '이슈 공정 없음'}
              </span>
            </div>
          </div>
        </div>

        {/* ==================== 3. 좌하단: LOT 추이도 (예시 1-B안 날짜 타임라인축) ==================== */}
        <div className="grun-panel-card">
          <div className="grun-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14.5px', fontWeight: 800 }}>LOT 추이도</span>
              <span
                style={{
                  background: '#dce4f2',
                  color: '#0f172a',
                  borderRadius: '999px',
                  padding: '2px 10px',
                  fontSize: '11px',
                  fontWeight: 800
                }}
              >
                일 단위 소재 LOT · 복수 LOT 동시 추적
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 700 }}>
                — 정상 연계 &nbsp;&nbsp; ✕ 공정 끊김(미추적)
              </span>
              <input
                type="text"
                value={lotSearch}
                onChange={(e) => setLotSearch(e.target.value)}
                placeholder="🔍 LOT / 구분 검색"
                style={{
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  width: '124px',
                  height: '24px'
                }}
              />
            </div>
          </div>

          <div style={{ padding: '8px 10px 10px', overflowX: 'auto', flex: 1 }}>
            {/* 상단 날짜 타임라인 헤더 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `112px repeat(${Math.max(1, dateColumns.length)}, minmax(96px, 1fr))`,
                alignItems: 'center',
                background: '#f1f5f9',
                borderRadius: '6px',
                padding: '6px 6px',
                fontSize: '11.5px',
                fontWeight: 800,
                color: '#1e293b',
                marginBottom: '4px'
              }}
            >
              <div style={{ paddingLeft: '10px' }}>구분</div>
              {dateColumns.map((col) => (
                <div key={col.ymd} style={{ textAlign: 'center' }}>
                  {col.label}
                </div>
              ))}
            </div>

            {/* FRT (LH A ~ RH C) 추적 행 */}
            <div>{frtTimelineRows.map((row) => renderTimelineRow(row))}</div>

            {/* FRT / RR 구분선 */}
            {frtTimelineRows.length > 0 && rrTimelineRows.length > 0 && (
              <div
                style={{
                  borderTop: '2px solid #cbd5e1',
                  margin: '4px 0'
                }}
              />
            )}

            {/* RR (LH A ~ RH B) 추적 행 */}
            <div>{rrTimelineRows.map((row) => renderTimelineRow(row))}</div>
          </div>
        </div>

        {/* ==================== 4. 우하단: 부자재 LOT 현황 (5종 카드: 패드/브라켓/조인트재료/Glass/D/V) ==================== */}
        <div className="grun-panel-card">
          <div className="grun-panel-header">
            <span style={{ fontSize: '14.5px', fontWeight: 800 }}>부자재 LOT 현황</span>
            <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>
              클릭 시 상세 이력
            </span>
          </div>

          <div
            style={{
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '7px',
              flex: 1
            }}
          >
            {(model.subMaterial5Cards || []).map((card) => {
              const isEmpty = !card.primaryLot;
              return (
                <div
                  key={card.id}
                  className="grun-sublot-row"
                  onClick={() => setInspectorModal({ type: 'sublot', data: card })}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #dbe2ec',
                    borderRadius: '9px',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* 좌측 바코드 + 품목명/LOT 번호 */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      minWidth: 0,
                      flex: 1
                    }}
                  >
                    <MiniBarcode seedText={card.primaryLot || card.id} isEmpty={isEmpty} />

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 800,
                            color: '#0f172a',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {card.title}
                        </span>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '1px 7px',
                            borderRadius: '999px',
                            fontSize: '10px',
                            fontWeight: 800,
                            background: '#e0f2fe',
                            color: '#0369a1',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {card.shortBadge || card.processBadge}
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop: '3px',
                          fontSize: '11px',
                          fontWeight: 700,
                          fontFamily: "'JetBrains Mono', 'Consolas', monospace",
                          color: isEmpty ? '#94a3b8' : '#475569',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={card.primaryLot || '투입 LOT 미입력'}
                      >
                        {card.primaryLot ? `LOT ${card.primaryLot}` : '투입 LOT 대기중'}
                      </div>
                    </div>
                  </div>

                  {/* 우측 초 · 중 · 종 상태 배지 */}
                  <div style={{ display: 'inline-flex', gap: '4px', flexShrink: 0 }}>
                    {card.stages.map((st, sIdx) => {
                      const activeColors = [
                        { bg: '#10b981', fg: '#ffffff' },
                        { bg: '#d97706', fg: '#ffffff' },
                        { bg: '#475569', fg: '#ffffff' }
                      ];
                      const c = activeColors[sIdx % activeColors.length];
                      return (
                        <span
                          key={st.label}
                          title={st.value ? `${st.label}: ${st.value}` : `${st.label}: 미입력`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '23px',
                            height: '21px',
                            borderRadius: '6px',
                            fontSize: '10.5px',
                            fontWeight: 800,
                            background: st.filled ? c.bg : '#e2e8f0',
                            color: st.filled ? c.fg : '#94a3b8'
                          }}
                        >
                          {st.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 공정 / 부자재 / LOT 추적 상세 드릴다운 팝업 ── */}
      {inspectorModal && (
        <div
          onClick={() => setInspectorModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            zIndex: 2500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '84vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.22)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                background: '#162b4c',
                color: '#ffffff',
                borderRadius: '12px 12px 0 0'
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 800 }}>
                {inspectorModal.type === 'process'
                  ? `🏭 #${inspectorModal.data.code} ${inspectorModal.data.processName} — 상세 현황 (${periodLabel})`
                  : inspectorModal.type === 'lot_track'
                    ? `🧵 [${inspectorModal.data.group} ${inspectorModal.data.sideSec}] 소재 LOT ${inspectorModal.data.lotKey} 공정별 추적 내역`
                    : `🧪 부자재 [${inspectorModal.data.title}] 실시간 LOT 투입 내역 (${periodLabel})`}
              </div>
              <button
                type="button"
                onClick={() => setInspectorModal(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#cbd5e1',
                  fontSize: '22px',
                  cursor: 'pointer',
                  lineHeight: 1
                }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: '16px 18px', overflowY: 'auto', flex: 1 }}>
              {inspectorModal.type === 'process' ? (
                <>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '8px',
                      marginBottom: '14px'
                    }}
                  >
                    {[
                      {
                        label: '총 실적',
                        val: `${inspectorModal.data.actual.toLocaleString()} EA`,
                        color: '#0f172a'
                      },
                      {
                        label: inspectorModal.data.sideLabelPair ? 'FRT / RR' : 'LH / RH',
                        val: `${inspectorModal.data.lh.toLocaleString()} / ${inspectorModal.data.rh.toLocaleString()}`,
                        color: '#2563eb'
                      },
                      {
                        label: '불량 (불량률)',
                        val: `${inspectorModal.data.defect} EA (${inspectorModal.data.defectRate.toFixed(2)}%)`,
                        color: inspectorModal.data.defect > 0 ? '#e11d48' : '#059669'
                      },
                      {
                        label: '비가동 시간',
                        val: `${inspectorModal.data.downtimeMin} 분`,
                        color: '#334155'
                      }
                    ].map((box) => (
                      <div
                        key={box.label}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '8px 10px'
                        }}
                      >
                        <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 700 }}>
                          {box.label}
                        </div>
                        <div
                          style={{
                            fontSize: '13.5px',
                            fontWeight: 800,
                            color: box.color,
                            marginTop: '3px'
                          }}
                        >
                          {box.val}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 800,
                      marginBottom: '6px',
                      color: '#334155'
                    }}
                  >
                    ▪ 투입 압출소재 LOT 세부 목록 ({inspectorModal.data.lotSummary.details.length}건)
                  </div>
                  {inspectorModal.data.lotSummary.details.length > 0 ? (
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '11.5px',
                        marginBottom: '16px',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <thead>
                        <tr style={{ background: '#f8fafc', color: '#475569' }}>
                          <th style={{ padding: '6px', border: '1px solid #e2e8f0' }}>구분</th>
                          <th style={{ padding: '6px', border: '1px solid #e2e8f0' }}>시기</th>
                          <th style={{ padding: '6px', border: '1px solid #e2e8f0' }}>투입 LOT 번호</th>
                          <th style={{ padding: '6px', border: '1px solid #e2e8f0' }}>작업자 / 일자</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspectorModal.data.lotSummary.details.map((d, idx) => (
                          <tr key={`${d.reportId}-${idx}`}>
                            <td
                              style={{
                                padding: '6px',
                                border: '1px solid #e2e8f0',
                                textAlign: 'center',
                                fontWeight: 700
                              }}
                            >
                              {d.partLabel}
                            </td>
                            <td
                              style={{
                                padding: '6px',
                                border: '1px solid #e2e8f0',
                                textAlign: 'center',
                                color: '#2563eb',
                                fontWeight: 700
                              }}
                            >
                              {d.stage}
                            </td>
                            <td
                              style={{
                                padding: '6px',
                                border: '1px solid #e2e8f0',
                                textAlign: 'center',
                                fontFamily: 'monospace',
                                fontWeight: 700
                              }}
                            >
                              {d.value}
                            </td>
                            <td
                              style={{
                                padding: '6px',
                                border: '1px solid #e2e8f0',
                                textAlign: 'center',
                                color: '#64748b'
                              }}
                            >
                              {d.workerName || '-'} ({d.date})
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div
                      style={{
                        padding: '12px',
                        color: '#64748b',
                        fontSize: '12px',
                        marginBottom: '12px'
                      }}
                    >
                      입력된 압출소재 LOT 내역이 없습니다.
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 800,
                      marginBottom: '6px',
                      color: '#334155'
                    }}
                  >
                    ▪ 연결된 작업일보 ({inspectorModal.data.reports.length}건)
                  </div>
                  {inspectorModal.data.reports.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {inspectorModal.data.reports.map((rep) => (
                        <div
                          key={rep.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '8px 12px'
                          }}
                        >
                          <div style={{ fontSize: '12px', color: '#0f172a' }}>
                            <strong>{rep.date}</strong> · 👷 {rep.workerName || '-'}{' '}
                            <span style={{ color: '#64748b' }}>
                              ({rep.workHours || '-'} | 실적{' '}
                              {Number(rep.actualQty || 0).toLocaleString()} EA / 불량{' '}
                              {Number(rep.defectQty || 0)} EA)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDetailReport(rep)}
                            style={{
                              background: '#4f46e5',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            원본 일보 열기
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>
                      해당 일자에 작성된 작업일보가 없습니다.
                    </div>
                  )}
                </>
              ) : inspectorModal.type === 'lot_track' ? (
                <>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '8px',
                      marginBottom: '14px'
                    }}
                  >
                    {['절단', '조인트', '후가공', '출하'].map((st) => {
                      const dates = inspectorModal.data.stageSummary?.[st] || [];
                      const isMissing = (inspectorModal.data.missingStages || []).includes(st);
                      return (
                        <div
                          key={st}
                          style={{
                            background: isMissing ? '#fef2f2' : '#f8fafc',
                            border: isMissing ? '1px solid #fda4af' : '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '8px 10px'
                          }}
                        >
                          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
                            {st} 투입일
                          </div>
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: 800,
                              color:
                                dates.length > 0
                                  ? '#0f172a'
                                  : isMissing
                                    ? '#e11d48'
                                    : '#94a3b8',
                              marginTop: '3px'
                            }}
                          >
                            {dates.length > 0
                              ? dates.join(', ')
                              : isMissing
                                ? '✕ 끊김 (미확인)'
                                : '-'}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 800,
                      marginBottom: '6px',
                      color: '#334155'
                    }}
                  >
                    ▪ 해당 소재 LOT가 기록된 작업일보 ({inspectorModal.data.reports?.length || 0}건)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(inspectorModal.data.reports || []).map((rep) => (
                      <div
                        key={rep.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '8px 12px'
                        }}
                      >
                        <div style={{ fontSize: '12px', color: '#0f172a' }}>
                          <strong>{rep.date}</strong> · #{rep.formCode} {rep.processName} · 👷{' '}
                          {rep.workerName || '-'}
                        </div>
                        <button
                          type="button"
                          onClick={() => setDetailReport(rep)}
                          style={{
                            background: '#4f46e5',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '5px 10px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          원본 일보 열기
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '12px', fontSize: '12px', color: '#64748b' }}>
                    적용 공정:{' '}
                    <strong style={{ color: '#0f172a' }}>{inspectorModal.data.processBadge}</strong> ·{' '}
                    {inspectorModal.data.specLabel}
                  </div>
                  {inspectorModal.data.records.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {inspectorModal.data.records.map((rec, i) => (
                        <div
                          key={`${rec.report?.id || i}-${i}`}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '10px',
                            flexWrap: 'wrap'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
                              #{rec.formCode} {rec.processName}{' '}
                              <span style={{ color: '#4f46e5', fontWeight: 700 }}>
                                {rec.extra ? `(${rec.extra})` : ''}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: '11.5px',
                                color: '#334155',
                                marginTop: '4px',
                                fontFamily: 'monospace'
                              }}
                            >
                              초: <strong>{rec.초 || '-'}</strong> | 중:{' '}
                              <strong>{rec.중 || '-'}</strong> | 종: <strong>{rec.종 || '-'}</strong>
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                              {rec.date} · 👷 {rec.workerName} ({rec.workHours || '-'})
                            </div>
                          </div>
                          {rec.report && (
                            <button
                              type="button"
                              onClick={() => setDetailReport(rec.report)}
                              style={{
                                background: '#4f46e5',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '5px 10px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              원본 일보 열기
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: '#64748b',
                        fontSize: '12.5px'
                      }}
                    >
                      선택된 기간 내 입력된 [{inspectorModal.data.title}] LOT 이력이 없습니다.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 원본 작업일보 상세 모달 연동 */}
      {detailReport && (
        <Suspense fallback={null}>
          <LegacyDetailModal report={detailReport} onClose={() => setDetailReport(null)} />
        </Suspense>
      )}
    </div>
  );
}
