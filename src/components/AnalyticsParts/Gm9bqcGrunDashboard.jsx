import React, { useState, useEffect, useMemo, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import LegacyDetailModal from '../DynamicForms/LegacyDetailModal';
import {
  resolveGm9bqcProcessCode,
  buildGm9bqcGrunDashboardModel
} from '../../services/gm9bqcGrunEngine';
import { exportGm9bqcGrunToExcel } from '../../utils/gm9bqcGrunExcelExport';

function formatTodayYmd() {
  return new Date().toLocaleDateString('sv-SE');
}

/**
 * 시각적 바코드 스트립 (Proposal C 부자재 LOT 카드 스타일 — 라이트 테마)
 */
function BarcodePlate({ lotText, isEmpty }) {
  const bars = useMemo(() => {
    const seedStr = lotText || 'JYMES-9BQC-WAIT';
    let hash = 2166136261;
    for (let i = 0; i < seedStr.length; i += 1) {
      hash ^= seedStr.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    const widths = [];
    for (let i = 0; i < 28; i += 1) {
      const bit = (Math.abs(hash + i * 2654435761) % 3) + 1;
      widths.push(bit);
    }
    return widths;
  }, [lotText]);

  return (
    <div
      style={{
        background: isEmpty ? '#f1f5f9' : '#ffffff',
        border: isEmpty ? '1px dashed #cbd5e1' : '1px solid #cbd5e1',
        borderRadius: '6px',
        padding: '6px 8px 5px',
        marginTop: '6px',
        marginBottom: '7px',
        textAlign: 'center'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'center',
          gap: '1.5px',
          height: '20px',
          opacity: isEmpty ? 0.25 : 0.88,
          overflow: 'hidden'
        }}
      >
        {bars.map((w, idx) => (
          <span
            key={idx}
            style={{
              display: 'inline-block',
              width: `${w * 1.5}px`,
              background: isEmpty ? '#64748b' : '#0f172a',
              borderRadius: '0.5px'
            }}
          />
        ))}
      </div>
      <div
        style={{
          marginTop: '3px',
          fontSize: '11px',
          fontWeight: 800,
          fontFamily: "'JetBrains Mono', 'Consolas', monospace",
          color: isEmpty ? '#64748b' : '#0f172a',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          letterSpacing: '-0.2px'
        }}
        title={lotText || '투입 LOT 미입력'}
      >
        {lotText ? `LOT ${lotText}` : '투입 LOT 대기중'}
      </div>
    </div>
  );
}

/**
 * 좌측 상단 KPI 원형 게이지 (총 생산 실적 / 달성률 또는 가동률)
 */
function RadialRing({ percent = 0, label = '' }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const r = 21;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;

  return (
    <div style={{ position: 'relative', width: '54px', height: '54px', flexShrink: 0 }}>
      <svg width="54" height="54" viewBox="0 0 54 54">
        <circle cx="27" cy="27" r={r} fill="none" stroke="#e2e8f0" strokeWidth="5.5" />
        <circle
          cx="27"
          cy="27"
          r={r}
          fill="none"
          stroke="#4f46e5"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform="rotate(-90 27 27)"
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 800,
          color: '#1e293b'
        }}
      >
        {label}
      </div>
    </div>
  );
}

/**
 * 좌측 상단 KPI 반원형 양품률 게이지
 */
function SemiGauge({ percent = 100 }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const angleDeg = -90 + (clamped / 100) * 180;

  return (
    <svg width="64" height="40" viewBox="0 0 64 40" style={{ flexShrink: 0 }}>
      <path
        d="M 8 34 A 24 24 0 0 1 56 34"
        fill="none"
        stroke="#e2e8f0"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M 8 34 A 24 24 0 0 1 56 34"
        fill="none"
        stroke="#059669"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="75.4"
        strokeDashoffset={75.4 - (clamped / 100) * 75.4}
      />
      <g transform={`translate(32, 34) rotate(${angleDeg})`}>
        <line x1="0" y1="0" x2="0" y2="-18" stroke="#0f172a" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="0" cy="0" r="3" fill="#059669" />
      </g>
    </svg>
  );
}

export default function Gm9bqcGrunDashboard({ reports = [], reportsLoading = false }) {
  const today = useMemo(() => formatTodayYmd(), []);

  // 최근 30일 reports 중 9BQC G/RUN 일보가 존재하는 가장 최근 가동일 탐색
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

  // 오늘 일보가 아직 0건이고 최근 가동일 일보가 있으면 최초 1회 최근 가동일로 자동 맞춤
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
  const [lotStageGroupFilter, setLotStageGroupFilter] = useState('ALL'); // 'ALL' | '소재준비' | '조인트' | '후가공·검사'
  const [lotSearch, setLotSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  // 실시간 Firestore 구독 상태
  const [liveReports, setLiveReports] = useState(null);
  const [liveStatus, setLiveStatus] = useState('connecting'); // 'connecting' | 'live' | 'fallback'
  const [lastSyncedAt, setLastSyncedAt] = useState('');

  // 상세 드릴다운 모달 상태
  const [inspectorModal, setInspectorModal] = useState(null); // { type: 'process' | 'sublot', data }
  const [detailReport, setDetailReport] = useState(null);

  const effectiveStart = viewMode === 'single' ? selectedDate : (rangeStart <= rangeEnd ? rangeStart : rangeEnd);
  const effectiveEnd = viewMode === 'single' ? selectedDate : (rangeStart <= rangeEnd ? rangeEnd : rangeStart);

  // 선택된 날짜/기간에 대해 Firestore 실시간 onSnapshot 구독 (작업자 저장 즉시 자동 반영)
  useEffect(() => {
    if (!effectiveStart || !effectiveEnd) return undefined;
    setLiveStatus('connecting');

    const q = query(
      collection(db, 'reports'),
      where('date', '>=', effectiveStart),
      where('date', '<=', effectiveEnd)
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const docs = [];
        snapshot.forEach((docSnap) => {
          docs.push({ id: docSnap.id, ...docSnap.data() });
        });
        setLiveReports(docs);
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
      }
    );

    return () => {
      unsub();
    };
  }, [effectiveStart, effectiveEnd]);

  // 실시간 스냅샷이 도착하기 전에는 부모가 전달한 reports 중 날짜 일치분을 즉시 표시
  const sourceReports = useMemo(() => {
    if (liveReports !== null) return liveReports;
    return reports.filter((r) => r?.date && r.date >= effectiveStart && r.date <= effectiveEnd);
  }, [liveReports, reports, effectiveStart, effectiveEnd]);

  const model = useMemo(
    () => buildGm9bqcGrunDashboardModel(sourceReports, { shiftFilter }),
    [sourceReports, shiftFilter]
  );

  // 좌측 바 차트 최대값 (LH / RH 대칭 스케일 산정)
  const maxSideQty = useMemo(() => {
    let maxVal = 100;
    model.processRows.forEach((p) => {
      if (p.lh > maxVal) maxVal = p.lh;
      if (p.rh > maxVal) maxVal = p.rh;
    });
    return maxVal;
  }, [model.processRows]);

  const maxParetoCount = useMemo(() => {
    if (model.top5Defects.length === 0) return 10;
    return Math.max(1, model.top5Defects[0].count);
  }, [model.top5Defects]);

  // 우측 하단 압출소재 LOT 필터링
  const filteredLotRows = useMemo(() => {
    const kw = lotSearch.trim().toLowerCase();
    return model.processRows.filter((row) => {
      if (lotStageGroupFilter === '소재준비' && row.stageGroup !== '소재준비') return false;
      if (lotStageGroupFilter === '조인트' && row.stageGroup !== '조인트') return false;
      if (
        lotStageGroupFilter === '후가공·검사' &&
        row.stageGroup !== '후가공' &&
        row.stageGroup !== '검사포장'
      ) {
        return false;
      }
      if (!kw) return true;
      const inProc =
        String(row.code).includes(kw) ||
        row.processName.toLowerCase().includes(kw) ||
        row.partDesc.toLowerCase().includes(kw);
      const inLots =
        row.lotSummary.초물.toLowerCase().includes(kw) ||
        row.lotSummary.중물.toLowerCase().includes(kw) ||
        row.lotSummary.종물.toLowerCase().includes(kw) ||
        row.lotSummary.details.some(
          (d) => d.value.toLowerCase().includes(kw) || d.partLabel.toLowerCase().includes(kw)
        );
      return inProc || inLots;
    });
  }, [model.processRows, lotStageGroupFilter, lotSearch]);

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

  const ringPercent =
    model.totalPlan > 0
      ? Math.min(100, model.attainmentRate)
      : Math.round((model.activeProcessCount / 12) * 100);
  const ringLabel =
    model.totalPlan > 0 ? `${model.attainmentRate}%` : `${model.activeProcessCount}/12`;

  return (
    <div
      className="gm-9bqc-grun-board"
      data-analytics-board="9bqc-grun"
      style={{
        background: 'transparent',
        color: '#0f172a',
        fontFamily: "'Pretendard', 'Noto Sans KR', sans-serif"
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
        [data-analytics-board="9bqc-grun"] .grun-split-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 14px;
          align-items: stretch;
        }
        [data-analytics-board="9bqc-grun"] .grun-kpi-grid {
          display: grid;
          grid-template-columns: 1.05fr 1fr 1.15fr;
          gap: 10px;
          margin-bottom: 12px;
        }
        [data-analytics-board="9bqc-grun"] .grun-sublot-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 9px;
        }
        [data-analytics-board="9bqc-grun"] .grun-proc-row:hover {
          background: #eff6ff !important;
        }
        [data-analytics-board="9bqc-grun"] .grun-subcard:hover {
          border-color: #4f46e5 !important;
          box-shadow: 0 4px 12px rgba(79, 70, 229, 0.08);
          transform: translateY(-1px);
        }
        [data-analytics-board="9bqc-grun"] .grun-lot-tr:hover {
          background: #f1f5f9 !important;
        }
        @media (max-width: 1200px) {
          [data-analytics-board="9bqc-grun"] .grun-split-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 768px) {
          [data-analytics-board="9bqc-grun"] .grun-kpi-grid {
            grid-template-columns: 1fr;
          }
          [data-analytics-board="9bqc-grun"] .grun-sublot-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      `}</style>

      {/* ── 상단 관제 헤더 바 (기존 공정 및 불량 분석 조건 바 스타일과 통일) ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '12px 16px',
          marginBottom: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '17px', fontWeight: 900, letterSpacing: '-0.3px', color: '#0f172a' }}>
            🏭 GM 9BQC - G/RUN 실시간 종합 관제판
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '999px',
              fontSize: '11.5px',
              fontWeight: 700,
              background: liveStatus === 'live' ? '#ecfdf5' : '#fffbeb',
              color: liveStatus === 'live' ? '#047857' : '#b45309',
              border: liveStatus === 'live' ? '1px solid #a7f3d0' : '1px solid #fde68a'
            }}
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
            {liveStatus === 'live'
              ? `실시간 연동중${lastSyncedAt ? ` (${lastSyncedAt})` : ''}`
              : liveStatus === 'connecting'
                ? '실시간 연결중...'
                : '캐시 데이터 표시중'}
          </span>
          <span
            style={{
              fontSize: '11.5px',
              color: '#475569',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              padding: '3px 9px',
              borderRadius: '6px',
              fontWeight: 700
            }}
          >
            가동 {model.activeProcessCount}/12 공정 · 일보 {model.totalReports}건
          </span>
        </div>

        {/* 우측 컨트롤: 조회모드 · 날짜 · 시프트 · 엑셀 다운로드 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              background: '#e2e8f0',
              borderRadius: '7px',
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
                  borderRadius: '5px',
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: viewMode === m.id ? '#4f46e5' : 'transparent',
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
                  borderRadius: '7px',
                  padding: '5px 9px',
                  fontSize: '12px',
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
                    borderRadius: '6px',
                    padding: '5px 8px',
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
                    borderRadius: '6px',
                    padding: '5px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    height: '32px'
                  }}
                  title={`최근 9BQC 가동일 (${latestActiveGrunDate}) 조회`}
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
                  borderRadius: '7px',
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
                  borderRadius: '7px',
                  padding: '5px 8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  height: '32px'
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ fontSize: '11.5px', color: '#475569', fontWeight: 700 }}>시프트</span>
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              style={{
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid #cbd5e1',
                borderRadius: '7px',
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: 700,
                height: '32px',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">전체 (주·야)</option>
              <option value="주간">주간</option>
              <option value="야간">야간</option>
            </select>
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: '#059669',
              color: '#ffffff',
              border: '1px solid #047857',
              borderRadius: '7px',
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: 700,
              height: '32px',
              cursor: exporting ? 'wait' : 'pointer'
            }}
          >
            <span>📥</span> {exporting ? '생성중...' : 'Excel 다운로드'}
          </button>
        </div>
      </div>

      {/* ── 메인 좌·우 50:50 분할 관제 보드 (밝은 카드 테마) ── */}
      <div className="grun-split-grid">
        {/* ==================== LEFT PANEL: 공정별 생산실적 및 품질 현황 ==================== */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '11px',
            padding: '14px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '11px'
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                📊 공정별 생산실적 및 품질 현황
              </div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                공정 클릭 시 작업일보 상세 확인
              </span>
            </div>

            {/* 상단 3대 KPI 카드 */}
            <div className="grun-kpi-grid">
              {/* KPI 1: 총 생산 실적 */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '9px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                <div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 700 }}>
                    총 생산 실적
                  </div>
                  <div
                    style={{
                      fontSize: '21px',
                      fontWeight: 900,
                      color: '#0f172a',
                      marginTop: '3px',
                      lineHeight: 1.15
                    }}
                  >
                    {model.totalActual.toLocaleString()}{' '}
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>EA</span>
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '3px' }}>
                    계획 {model.totalPlan.toLocaleString()} EA
                  </div>
                </div>
                <RadialRing percent={ringPercent} label={ringLabel} />
              </div>

              {/* KPI 2: 종합 양품률 */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '9px',
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '6px'
                }}
              >
                <div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 700 }}>
                    종합 양품률
                  </div>
                  <div
                    style={{
                      fontSize: '21px',
                      fontWeight: 900,
                      color: '#059669',
                      marginTop: '3px',
                      lineHeight: 1.15
                    }}
                  >
                    {model.yieldRate.toFixed(2)}%
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '3px' }}>
                    불량 {model.totalDefect.toLocaleString()} EA ({model.defectRateTotal.toFixed(2)}%)
                  </div>
                </div>
                <SemiGauge percent={model.yieldRate} />
              </div>

              {/* KPI 3: 최다 불량 공정 */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '9px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 700 }}>
                  최다 불량 공정
                </div>
                {model.worstProcess ? (
                  <>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 800,
                        color: '#be123c',
                        marginTop: '4px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      title={`#${model.worstProcess.code} ${model.worstProcess.processName}`}
                    >
                      #{model.worstProcess.code} {model.worstProcess.shortName}{' '}
                      <span style={{ color: '#e11d48' }}>({model.worstProcess.defect}건)</span>
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '3px' }}>
                      {model.worstProcess.topDefect
                        ? `주요유형: ${model.worstProcess.topDefect.name} (${model.worstProcess.topDefect.count}건)`
                        : `불량률 ${model.worstProcess.defectRate.toFixed(2)}%`}
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 800,
                        color: '#059669',
                        marginTop: '4px'
                      }}
                    >
                      발생 불량 없음 (0건)
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748b', marginTop: '3px' }}>
                      전 공정 품질 양호 상태
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 12개 공정 LH vs RH 양방향 비교 바 차트 */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '9px',
                padding: '10px 12px'
              }}
            >
              {/* 범례 헤더 */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '142px 1fr 94px',
                  alignItems: 'center',
                  paddingBottom: '6px',
                  marginBottom: '4px',
                  borderBottom: '1px solid #e2e8f0',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  color: '#475569'
                }}
              >
                <div>공정 (#5001~#5014)</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#1d4ed8' }}>
                    <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#2563eb' }} />
                    LH (FRT)
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#0f766e' }}>
                    <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#0d9488' }} />
                    RH (RR)
                  </span>
                </div>
                <div style={{ textAlign: 'right', color: '#be123c' }}>불량 / 불량률</div>
              </div>

              {/* 12 공정 행 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {model.processRows.map((proc) => {
                  const lhPct = proc.lh > 0 ? Math.max(8, Math.round((proc.lh / maxSideQty) * 100)) : 0;
                  const rhPct = proc.rh > 0 ? Math.max(8, Math.round((proc.rh / maxSideQty) * 100)) : 0;
                  const hasDef = proc.defect > 0;
                  const isIdle = proc.reportCount === 0;

                  return (
                    <div
                      key={proc.code}
                      className="grun-proc-row"
                      onClick={() => setInspectorModal({ type: 'process', data: proc })}
                      title={`#${proc.code} ${proc.processName} | 총 실적 ${proc.actual.toLocaleString()} EA | 일보 ${proc.reportCount}건${proc.workers.length ? ` (${proc.workers.join(', ')})` : ''}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '142px 1fr 94px',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '4px 6px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                        opacity: isIdle ? 0.72 : 1
                      }}
                    >
                      {/* 좌측 공정명 */}
                      <div
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 700,
                          color: isIdle ? '#64748b' : '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        <span style={{ color: '#4f46e5', fontFamily: 'monospace', fontWeight: 800, marginRight: '4px' }}>
                          #{proc.code}
                        </span>
                        {proc.shortName}
                      </div>

                      {/* 중앙 LH / RH 버터플라이 바 */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '3px',
                          alignItems: 'center'
                        }}
                      >
                        {/* LH bar */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            background: '#e2e8f0',
                            borderRadius: '4px 0 0 4px',
                            height: '20px',
                            overflow: 'hidden',
                            position: 'relative'
                          }}
                        >
                          {proc.lh > 0 && (
                            <div
                              style={{
                                width: `${lhPct}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                                borderRadius: '4px 0 0 4px'
                              }}
                            />
                          )}
                          <span
                            style={{
                              position: 'absolute',
                              right: '6px',
                              fontSize: '10.5px',
                              fontWeight: 800,
                              color: proc.lh > 0 ? '#1e293b' : '#64748b',
                              background: proc.lh > 0 ? 'rgba(255,255,255,0.78)' : 'transparent',
                              padding: proc.lh > 0 ? '0 4px' : '0',
                              borderRadius: '3px'
                            }}
                          >
                            {proc.sideLabelPair ? `${proc.sideLabelPair[0]} ` : ''}
                            {proc.lh.toLocaleString()}
                          </span>
                        </div>

                        {/* RH bar */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                            background: '#e2e8f0',
                            borderRadius: '0 4px 4px 0',
                            height: '20px',
                            overflow: 'hidden',
                            position: 'relative'
                          }}
                        >
                          {proc.rh > 0 && (
                            <div
                              style={{
                                width: `${rhPct}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #0d9488 0%, #14b8a6 100%)',
                                borderRadius: '0 4px 4px 0'
                              }}
                            />
                          )}
                          <span
                            style={{
                              position: 'absolute',
                              left: '6px',
                              fontSize: '10.5px',
                              fontWeight: 800,
                              color: proc.rh > 0 ? '#1e293b' : '#64748b',
                              background: proc.rh > 0 ? 'rgba(255,255,255,0.78)' : 'transparent',
                              padding: proc.rh > 0 ? '0 4px' : '0',
                              borderRadius: '3px'
                            }}
                          >
                            {proc.sideLabelPair ? `${proc.sideLabelPair[1]} ` : ''}
                            {proc.rh.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* 우측 불량 알약 배지 */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            minWidth: '86px',
                            padding: '2px 8px',
                            borderRadius: '999px',
                            fontSize: '10.5px',
                            fontWeight: 800,
                            background: hasDef ? '#ffe4e6' : '#f1f5f9',
                            color: hasDef ? '#be123c' : '#64748b',
                            border: hasDef ? '1px solid #fecdd3' : '1px solid #cbd5e1'
                          }}
                        >
                          <span>{proc.defect}</span>
                          <span>{proc.defectRate.toFixed(2)}%</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 하단 Top 5 불량 유형 파레토 차트 */}
          <div
            style={{
              marginTop: '12px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '9px',
              padding: '10px 14px'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}
            >
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
                Top 5 불량 유형 (전 공정 합산)
              </span>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                총 불량 {model.totalDefect.toLocaleString()} EA
              </span>
            </div>

            {model.top5Defects.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.max(model.top5Defects.length, 5)}, minmax(0, 1fr))`,
                  gap: '10px',
                  alignItems: 'end',
                  height: '96px',
                  paddingTop: '16px'
                }}
              >
                {model.top5Defects.map((d, idx) => {
                  const barH = Math.max(10, Math.round((d.count / maxParetoCount) * 56));
                  const barColors = ['#2563eb', '#0284c7', '#0d9488', '#4f46e5', '#6366f1'];
                  return (
                    <div
                      key={d.name}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        height: '100%'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#0f172a',
                          marginBottom: '3px'
                        }}
                      >
                        {d.count}
                      </span>
                      <div
                        style={{
                          width: '56%',
                          maxWidth: '46px',
                          height: `${barH}px`,
                          background: barColors[idx % barColors.length],
                          borderRadius: '4px 4px 0 0'
                        }}
                      />
                      <span
                        style={{
                          marginTop: '5px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          color: '#334155',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '100%'
                        }}
                        title={d.name}
                      >
                        {d.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  height: '72px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                선택 조건 내 집계된 불량 내역이 없습니다.
              </div>
            )}
          </div>
        </div>

        {/* ==================== RIGHT PANEL: 실시간 투입 소재 & 부자재 LOT 현황 보드 ==================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* 우측 상단: 6대 부자재 LOT 실시간 벤토 카드 그리드 */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '11px',
              padding: '14px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                🧪 실시간 투입 부자재 &amp; 원재료 LOT 보드
              </div>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                카드 클릭 시 공정별 투입 이력 조회
              </span>
            </div>

            <div className="grun-sublot-grid">
              {model.subMaterialCards.map((card) => {
                const isEmpty = !card.primaryLot;
                return (
                  <div
                    key={card.id}
                    className="grun-subcard"
                    onClick={() => setInspectorModal({ type: 'sublot', data: card })}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '9px',
                      padding: '9px 10px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        gap: '4px'
                      }}
                    >
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                        {card.title}
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: '#4f46e5',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={card.processBadge}
                      >
                        ({card.processBadge})
                      </span>
                    </div>

                    <BarcodePlate lotText={card.primaryLot} isEmpty={isEmpty} />

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span
                        style={{
                          fontSize: '10px',
                          color: '#64748b',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={card.subMeta}
                      >
                        {card.updatedStamp !== '-' ? card.updatedStamp : card.specLabel}
                      </span>

                      {/* 초 · 중 · 종 (또는 FRT/RR-R/Fixed) 상태 도트 */}
                      <div style={{ display: 'inline-flex', gap: '3px', flexShrink: 0 }}>
                        {card.stages.map((st) => (
                          <span
                            key={st.label}
                            title={st.value ? `${st.label}: ${st.value}` : `${st.label}: 미입력`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              minWidth: st.label.length > 1 ? '28px' : '19px',
                              height: '19px',
                              padding: '0 4px',
                              borderRadius: '999px',
                              fontSize: '9.5px',
                              fontWeight: 800,
                              background: st.filled ? '#d1fae5' : '#e2e8f0',
                              color: st.filled ? '#047857' : '#64748b',
                              border: st.filled ? '1px solid #6ee7b7' : '1px solid #cbd5e1'
                            }}
                          >
                            {st.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 우측 하단: 공정별 압출소재 LOT 실시간 현황 매트릭스 */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '11px',
              padding: '14px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              flex: 1,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                marginBottom: '10px'
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                🧵 공정별 압출소재 LOT 실시간 현황
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                {['ALL', '소재준비', '조인트', '후가공·검사'].map((grp) => (
                  <button
                    key={grp}
                    type="button"
                    onClick={() => setLotStageGroupFilter(grp)}
                    style={{
                      border: '1px solid',
                      borderColor: lotStageGroupFilter === grp ? '#4f46e5' : '#cbd5e1',
                      background: lotStageGroupFilter === grp ? '#4f46e5' : '#ffffff',
                      color: lotStageGroupFilter === grp ? '#ffffff' : '#475569',
                      borderRadius: '6px',
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {grp === 'ALL' ? '전체(12)' : grp}
                  </button>
                ))}

                <input
                  type="text"
                  value={lotSearch}
                  onChange={(e) => setLotSearch(e.target.value)}
                  placeholder="🔍 LOT / 공정 검색"
                  style={{
                    background: '#ffffff',
                    color: '#0f172a',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    width: '126px'
                  }}
                />
              </div>
            </div>

            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '9px',
                overflowX: 'auto'
              }}
            >
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '11px',
                  textAlign: 'center',
                  tableLayout: 'fixed'
                }}
              >
                <colgroup>
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '21%' }} />
                  <col style={{ width: '18%' }} />
                  <col style={{ width: '13.5%' }} />
                  <col style={{ width: '13.5%' }} />
                  <col style={{ width: '13.5%' }} />
                  <col style={{ width: '7.5%' }} />
                </colgroup>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#475569', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '7px 4px', fontWeight: 800 }}>구분</th>
                    <th style={{ padding: '7px 4px', fontWeight: 800, textAlign: 'left' }}>공정명</th>
                    <th style={{ padding: '7px 4px', fontWeight: 800 }}>품목군</th>
                    <th style={{ padding: '7px 4px', fontWeight: 800 }}>초물 LOT</th>
                    <th style={{ padding: '7px 4px', fontWeight: 800 }}>중물 LOT</th>
                    <th style={{ padding: '7px 4px', fontWeight: 800 }}>종물 LOT</th>
                    <th style={{ padding: '7px 4px', fontWeight: 800 }}>상태</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLotRows.map((row) => {
                    const st = row.lotSummary.lotStatus;
                    const badgeStyle =
                      st === 'complete'
                        ? {
                            bg: '#d1fae5',
                            fg: '#047857',
                            bd: '#6ee7b7'
                          }
                        : st === 'partial'
                          ? {
                              bg: '#fef3c7',
                              fg: '#b45309',
                              bd: '#fcd34d'
                            }
                          : {
                              bg: '#f1f5f9',
                              fg: '#64748b',
                              bd: '#cbd5e1'
                            };

                    return (
                      <tr
                        key={row.code}
                        className="grun-lot-tr"
                        onClick={() => setInspectorModal({ type: 'process', data: row })}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          cursor: 'pointer',
                          transition: 'background 0.12s ease'
                        }}
                      >
                        <td style={{ padding: '6px 4px', color: '#64748b', fontWeight: 700, fontSize: '10.5px' }}>
                          {row.stageGroup}
                        </td>
                        <td
                          style={{
                            padding: '6px 4px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#0f172a',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={`#${row.code} ${row.processName}`}
                        >
                          <span style={{ color: '#4f46e5', fontFamily: 'monospace', fontWeight: 800, marginRight: '3px' }}>
                            #{row.code}
                          </span>
                          {row.shortName}
                        </td>
                        <td
                          style={{
                            padding: '6px 4px',
                            color: '#475569',
                            fontSize: '10px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                          title={row.partDesc}
                        >
                          {row.partDesc}
                        </td>
                        {['초물', '중물', '종물'].map((stageKey) => {
                          const val = row.lotSummary[stageKey];
                          return (
                            <td
                              key={stageKey}
                              style={{
                                padding: '6px 3px',
                                fontFamily: 'monospace',
                                fontSize: '10px',
                                fontWeight: val ? 700 : 400,
                                color: val ? '#0f172a' : '#94a3b8',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                              title={val || '미입력'}
                            >
                              {val || '-'}
                            </td>
                          );
                        })}
                        <td style={{ padding: '6px 3px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '1.5px 5px',
                              borderRadius: '999px',
                              fontSize: '9.5px',
                              fontWeight: 800,
                              background: badgeStyle.bg,
                              color: badgeStyle.fg,
                              border: `1px solid ${badgeStyle.bd}`
                            }}
                          >
                            {row.lotSummary.lotStatusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── 공정 / 부자재 상세 드릴다운 팝업 (밝은 모달 테마) ── */}
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
                background: '#f8fafc',
                borderBottom: '1px solid #e2e8f0',
                borderRadius: '12px 12px 0 0'
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                {inspectorModal.type === 'process'
                  ? `🏭 #${inspectorModal.data.code} ${inspectorModal.data.processName} — 상세 현황 (${periodLabel})`
                  : `🧪 부자재 [${inspectorModal.data.title}] 실시간 LOT 투입 내역 (${periodLabel})`}
              </div>
              <button
                type="button"
                onClick={() => setInspectorModal(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
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
                      { label: '총 실적', val: `${inspectorModal.data.actual.toLocaleString()} EA`, color: '#0f172a' },
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
                        <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 700 }}>{box.label}</div>
                        <div style={{ fontSize: '13.5px', fontWeight: 800, color: box.color, marginTop: '3px' }}>
                          {box.val}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: '12.5px', fontWeight: 800, marginBottom: '6px', color: '#334155' }}>
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
                            <td style={{ padding: '6px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 700 }}>
                              {d.partLabel}
                            </td>
                            <td style={{ padding: '6px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#2563eb', fontWeight: 700 }}>
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
                            <td style={{ padding: '6px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#64748b' }}>
                              {d.workerName || '-'} ({d.date})
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: '12px', color: '#64748b', fontSize: '12px', marginBottom: '12px' }}>
                      입력된 압출소재 LOT 내역이 없습니다.
                    </div>
                  )}

                  <div style={{ fontSize: '12.5px', fontWeight: 800, marginBottom: '6px', color: '#334155' }}>
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
                              ({rep.workHours || '-'} | 실적 {Number(rep.actualQty || 0).toLocaleString()} EA / 불량{' '}
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
              ) : (
                <>
                  <div style={{ marginBottom: '12px', fontSize: '12px', color: '#64748b' }}>
                    적용 공정: <strong style={{ color: '#0f172a' }}>{inspectorModal.data.processBadge}</strong> ·{' '}
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
                            <div style={{ fontSize: '11.5px', color: '#334155', marginTop: '4px', fontFamily: 'monospace' }}>
                              초: <strong>{rec.초 || '-'}</strong> | 중: <strong>{rec.중 || '-'}</strong> | 종:{' '}
                              <strong>{rec.종 || '-'}</strong>
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
                    <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '12.5px' }}>
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
        <LegacyDetailModal report={detailReport} onClose={() => setDetailReport(null)} />
      )}
    </div>
  );
}
