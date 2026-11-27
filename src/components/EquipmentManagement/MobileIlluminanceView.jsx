import React, { useMemo, useState } from 'react';
import {
  ILLUMINANCE_BUILDING_MAPS,
  ILLUMINANCE_JUDGEMENT,
  ILLUMINANCE_MONTHS,
  ILLUMINANCE_POINTS,
  ILLUMINANCE_TARGET_COMPANY,
  findIlluminancePoint,
  getFirstWeekSchedule,
  judgeIlluminance,
  toLuxNumber
} from '../../constants/illuminanceMeasurement';

const MOBILE_TABS = [
  { id: 'monthly', label: '📝 월별 점검·입력' },
  { id: 'maps', label: '🗺️ 배치도·도면' },
  { id: 'annual', label: '📊 연간 현황·이력' }
];

/**
 * 조도 점검 모바일 전용 뷰 (종합 대시보드 / 실적·불량 분석과 동일한 카드 피드형 모바일 모드)
 * - 가로 스크롤 없이 모바일 화면 폭(100%)에 맞춰 ①~⑩ 측정공정 카드별 입력, 첫째주 날짜 원터치 선택,
 *   공장 전체 지도 및 동별 상세 도면 확인, 연간 1~12월 미니 그리드 조회를 제공합니다.
 */
export default function MobileIlluminanceView({
  selectedYear,
  onChangeYear,
  ledgerDraft,
  isLedgerDirty,
  savingLedger,
  onCellChange,
  onMetaChange,
  onAutoFillMonthDate,
  onSaveLedgerAll,
  onOpenMonthlyBatchModal,
  onOpenIndividualModal,
  onDeleteRow,
  onExportExcel,
  onRefresh,
  onSwitchToPc,
  historyRows = []
}) {
  const currentMonth = new Date().getMonth() + 1;
  const [activeTab, setActiveTab] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedPointNo, setSelectedPointNo] = useState(1);
  const [activeMapId, setActiveMapId] = useState('overview');
  const [zoomModal, setZoomModal] = useState(null);

  const selectedPoint = useMemo(
    () => findIlluminancePoint(selectedPointNo) || ILLUMINANCE_POINTS[0],
    [selectedPointNo]
  );

  const activeMap = useMemo(
    () => ILLUMINANCE_BUILDING_MAPS.find((m) => m.id === activeMapId) || ILLUMINANCE_BUILDING_MAPS[0],
    [activeMapId]
  );

  const monthSchedule = useMemo(
    () => getFirstWeekSchedule(selectedYear, selectedMonth),
    [selectedYear, selectedMonth]
  );

  // 선택된 월의 통계
  const monthStats = useMemo(() => {
    let measuredCount = 0;
    let passCount = 0;
    let failCount = 0;
    ILLUMINANCE_POINTS.forEach((pt) => {
      const raw = ledgerDraft?.cells?.[pt.no]?.[selectedMonth];
      const num = toLuxNumber(raw);
      if (num !== null) {
        measuredCount += 1;
        if (num >= pt.standardLux) passCount += 1;
        else failCount += 1;
      }
    });
    const dateStr = ledgerDraft?.meta?.[selectedMonth]?.date || '';
    const timeStr = ledgerDraft?.meta?.[selectedMonth]?.measureTime || '';
    const pct = Math.round((measuredCount / ILLUMINANCE_POINTS.length) * 100);
    return { measuredCount, passCount, failCount, dateStr, timeStr, pct };
  }, [ledgerDraft, selectedMonth]);

  // 월별 입력 건수 맵 (1~12월 칩 배지 표시용)
  const monthCountsMap = useMemo(() => {
    const map = {};
    ILLUMINANCE_MONTHS.forEach((m) => {
      let count = 0;
      let hasFail = false;
      ILLUMINANCE_POINTS.forEach((pt) => {
        const num = toLuxNumber(ledgerDraft?.cells?.[pt.no]?.[m]);
        if (num !== null) {
          count += 1;
          if (num < pt.standardLux) hasFail = true;
        }
      });
      map[m] = { count, hasFail };
    });
    return map;
  }, [ledgerDraft]);

  // 연간 전체 통계
  const annualStats = useMemo(() => {
    let recordedMonths = 0;
    let totalCells = 0;
    let passCells = 0;
    let failCells = 0;
    ILLUMINANCE_MONTHS.forEach((m) => {
      const mc = monthCountsMap[m]?.count || 0;
      if (mc > 0) recordedMonths += 1;
      ILLUMINANCE_POINTS.forEach((pt) => {
        const num = toLuxNumber(ledgerDraft?.cells?.[pt.no]?.[m]);
        if (num !== null) {
          totalCells += 1;
          if (num >= pt.standardLux) passCells += 1;
          else failCells += 1;
        }
      });
    });
    return { recordedMonths, totalCells, passCells, failCells };
  }, [ledgerDraft, monthCountsMap]);

  const handleSelectPointAndMap = (pointNo) => {
    const pt = findIlluminancePoint(pointNo);
    if (!pt) return;
    setSelectedPointNo(pt.no);
    if (pt.mapId) setActiveMapId(pt.mapId);
  };

  return (
    <div data-mobile-illuminance="1">
      <style>{`
        [data-mobile-illuminance="1"] {
          width: 100%;
          max-width: 100%;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding-bottom: 24px;
          box-sizing: border-box;
        }
        [data-mobile-illuminance="1"] *,
        [data-mobile-illuminance="1"] *::before,
        [data-mobile-illuminance="1"] *::after {
          box-sizing: border-box;
        }
        [data-mobile-illuminance="1"] .mil-sticky-bar {
          position: sticky;
          top: 0;
          z-index: 20;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 9px 10px 0;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        [data-mobile-illuminance="1"] .mil-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px;
          min-width: 0;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03);
        }
        [data-mobile-illuminance="1"] .mil-kpi-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }
        [data-mobile-illuminance="1"] .mil-tablist {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 2px;
          border-top: 1px solid #f1f5f9;
        }
        [data-mobile-illuminance="1"] .mil-tab {
          background: transparent;
          border: none;
          border-bottom: 2.5px solid transparent;
          padding: 9px 4px 8px;
          font-size: 12.5px;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          white-space: nowrap;
          text-align: center;
        }
        [data-mobile-illuminance="1"] .mil-tab[aria-selected="true"] {
          color: #0f172a;
          font-weight: 900;
          border-bottom-color: #1d4ed8;
        }
        [data-mobile-illuminance="1"] .mil-chip-row {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          flex-wrap: nowrap;
          scrollbar-width: none;
          padding-bottom: 2px;
        }
        [data-mobile-illuminance="1"] .mil-chip-row::-webkit-scrollbar {
          display: none;
        }
        [data-mobile-illuminance="1"] .mil-chip-btn {
          flex: 0 0 auto;
          padding: 6px 11px;
          border-radius: 999px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #475569;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        [data-mobile-illuminance="1"] .mil-chip-btn.is-active {
          background: #1d4ed8;
          color: #ffffff;
          border-color: #1d4ed8;
        }
        [data-mobile-illuminance="1"] .mil-input {
          width: 100%;
          padding: 7px 10px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          font-family: inherit;
          color: #0f172a;
          background: #fff;
        }
        [data-mobile-illuminance="1"] .mil-input:focus {
          outline: 2px solid #2563eb;
          outline-offset: 1px;
        }
        @media (pointer: coarse) {
          [data-mobile-illuminance="1"] button,
          [data-mobile-illuminance="1"] select,
          [data-mobile-illuminance="1"] input {
            min-height: 36px;
          }
        }
      `}</style>

      {/* ── 상단 고정 헤더 & 탭 전환 바 ── */}
      <div className="mil-sticky-bar">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <span style={{ fontSize: '13.5px', fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap' }}>
              💡 조도측정 대장
            </span>
            <select
              aria-label="조도 점검 연도 선택"
              value={selectedYear}
              onChange={(e) => onChangeYear(Number(e.target.value))}
              style={{
                padding: '3px 8px',
                fontSize: '12px',
                fontWeight: 800,
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#0f172a'
              }}
            >
              {[2025, 2026, 2027, 2028].map((yr) => (
                <option key={yr} value={yr}>
                  {yr}년
                </option>
              ))}
            </select>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#475569',
                background: '#f1f5f9',
                padding: '2px 6px',
                borderRadius: '999px',
                whiteSpace: 'nowrap'
              }}
            >
              {ILLUMINANCE_TARGET_COMPANY}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={onRefresh}
              aria-label="조도 데이터 새로고침"
              style={{
                padding: '4px 8px',
                borderRadius: '8px',
                border: '1px solid #93c5fd',
                background: '#eff6ff',
                color: '#1d4ed8',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              🔄
            </button>
            <button
              type="button"
              onClick={onSwitchToPc}
              style={{
                padding: '4px 9px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#334155',
                fontSize: '11.5px',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              🖥️ PC표
            </button>
          </div>
        </div>

        {/* 모바일 3대 핵심 탭 */}
        <div className="mil-tablist" role="tablist" aria-label="조도 점검 모바일 탭">
          {MOBILE_TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              className="mil-tab"
              aria-selected={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          탭 1: 📝 월별 점검 · 입력 (매월 첫째주 현장 입력 및 판정)
         ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'monthly' && (
        <>
          {/* 1~12월 가로 스와이프 선택 칩 */}
          <div className="mil-card" style={{ padding: '10px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px'
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>
                📆 점검 월 선택 (매월 첫째주 정기 측정)
              </span>
              <button
                type="button"
                onClick={() => onOpenMonthlyBatchModal(selectedMonth)}
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 800,
                  borderRadius: '6px',
                  border: '1px solid #93c5fd',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  cursor: 'pointer'
                }}
              >
                📋 전체 시트창
              </button>
            </div>
            <div className="mil-chip-row">
              {ILLUMINANCE_MONTHS.map((m) => {
                const isSelected = m === selectedMonth;
                const info = monthCountsMap[m] || { count: 0, hasFail: false };
                return (
                  <button
                    key={m}
                    type="button"
                    className={`mil-chip-btn ${isSelected ? 'is-active' : ''}`}
                    onClick={() => setSelectedMonth(m)}
                  >
                    <span>{m}월</span>
                    {info.count > 0 && (
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '1px 5px',
                          borderRadius: '999px',
                          background: isSelected
                            ? 'rgba(255,255,255,0.25)'
                            : info.hasFail
                              ? '#fee2e2'
                              : '#dcfce7',
                          color: isSelected ? '#fff' : info.hasFail ? '#b91c1c' : '#15803d',
                          fontWeight: 800
                        }}
                      >
                        {info.count}/10
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2×2 핵심 KPI 요약 카드 */}
          <div className="mil-kpi-grid">
            <div className="mil-card" style={{ borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b' }}>
                📅 {selectedMonth}월 첫째주 측정일
              </div>
              <div
                style={{
                  fontSize: '15px',
                  fontWeight: 900,
                  color: '#0f172a',
                  marginTop: '4px',
                  lineHeight: 1.2
                }}
              >
                {monthStats.dateStr || monthSchedule.defaultDate}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', fontWeight: 600 }}>
                측정시간: {monthStats.timeStr || monthSchedule.defaultTime}
              </div>
            </div>

            <div className="mil-card" style={{ borderLeft: '4px solid #0ea5e9' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b' }}>
                📊 측정 진행률 (10개소)
              </div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 900,
                  color: '#0f172a',
                  marginTop: '3px',
                  lineHeight: 1.15
                }}
              >
                {monthStats.measuredCount} / 10{' '}
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0284c7' }}>
                  ({monthStats.pct}%)
                </span>
              </div>
              <div
                style={{
                  marginTop: '6px',
                  height: '5px',
                  background: '#e2e8f0',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${monthStats.pct}%`,
                    background: monthStats.pct === 100 ? '#10b981' : '#0ea5e9'
                  }}
                />
              </div>
            </div>

            <div className="mil-card" style={{ borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b' }}>✅ 적합 공정</div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 900,
                  color: '#047857',
                  marginTop: '3px',
                  lineHeight: 1.15
                }}
              >
                {monthStats.passCount}{' '}
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>개소</span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                기준 조도(600/750) 이상
              </div>
            </div>

            <div
              className="mil-card"
              style={{
                borderLeft: `4px solid ${monthStats.failCount > 0 ? '#ef4444' : '#94a3b8'}`,
                background: monthStats.failCount > 0 ? '#fef2f2' : '#ffffff'
              }}
            >
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b' }}>🚨 부적합 공정</div>
              <div
                style={{
                  fontSize: '18px',
                  fontWeight: 900,
                  color: monthStats.failCount > 0 ? '#b91c1c' : '#0f172a',
                  marginTop: '3px',
                  lineHeight: 1.15
                }}
              >
                {monthStats.failCount}{' '}
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>개소</span>
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: monthStats.failCount > 0 ? '#b91c1c' : '#64748b',
                  marginTop: '3px',
                  fontWeight: monthStats.failCount > 0 ? 700 : 400
                }}
              >
                {monthStats.failCount > 0 ? '조명 점검·개선 필요' : '부적합 없음'}
              </div>
            </div>
          </div>

          {/* 해당 월 측정일 · 측정시간 설정 카드 */}
          <div className="mil-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                gap: '6px'
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                🕒 {selectedYear}년 {selectedMonth}월 측정일 · 측정시간
              </span>
              <button
                type="button"
                onClick={() => onAutoFillMonthDate(selectedMonth)}
                style={{
                  padding: '4px 9px',
                  fontSize: '11px',
                  fontWeight: 800,
                  borderRadius: '6px',
                  border: '1px solid #93c5fd',
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  cursor: 'pointer'
                }}
              >
                📅 첫째주 자동세팅
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '8px' }}>
              <div>
                <label
                  style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}
                >
                  측정일
                </label>
                <input
                  type="date"
                  className="mil-input"
                  value={monthStats.dateStr}
                  onChange={(e) => onMetaChange(selectedMonth, 'date', e.target.value)}
                />
              </div>
              <div>
                <label
                  style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '3px' }}
                >
                  측정시간
                </label>
                <input
                  type="text"
                  className="mil-input"
                  placeholder="예: 10:00"
                  value={monthStats.timeStr}
                  onChange={(e) => onMetaChange(selectedMonth, 'measureTime', e.target.value)}
                />
              </div>
            </div>

            {/* 첫째주 평일 원터치 선택 칩 */}
            <div style={{ marginTop: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>
                {selectedMonth}월 첫째주 평일 빠른 선택:
              </div>
              <div className="mil-chip-row">
                {monthSchedule.weekdays.map((w) => {
                  const isSel = monthStats.dateStr === w.iso;
                  return (
                    <button
                      key={w.iso}
                      type="button"
                      onClick={() => {
                        onMetaChange(selectedMonth, 'date', w.iso);
                        if (!monthStats.timeStr) {
                          onMetaChange(selectedMonth, 'measureTime', monthSchedule.defaultTime);
                        }
                      }}
                      style={{
                        flex: '0 0 auto',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        border: isSel ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
                        background: isSel ? '#dbeafe' : '#f8fafc',
                        color: isSel ? '#1e40af' : '#334155',
                        cursor: 'pointer'
                      }}
                    >
                      {w.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ① ~ ⑩ 측정공정별 모바일 입력 카드 피드 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ILLUMINANCE_POINTS.map((pt) => {
              const rawVal = ledgerDraft?.cells?.[pt.no]?.[selectedMonth] ?? '';
              const judgement = judgeIlluminance(rawVal, pt.standardLux);
              const isFail = judgement === ILLUMINANCE_JUDGEMENT.FAIL;
              const isPass = judgement === ILLUMINANCE_JUDGEMENT.PASS;

              return (
                <div
                  key={pt.no}
                  className="mil-card"
                  style={{
                    borderLeft: `4px solid ${isFail ? '#ef4444' : isPass ? '#10b981' : '#cbd5e1'}`,
                    background: isFail ? '#fff5f5' : '#ffffff'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '8px',
                      marginBottom: '6px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '14.5px', fontWeight: 900, color: '#0f172a' }}>
                          {pt.circledNo} {pt.name}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '999px',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            border: '1px solid #bfdbfe'
                          }}
                        >
                          표준 {pt.standardLabel}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '6px',
                            background: '#f1f5f9',
                            color: '#475569'
                          }}
                        >
                          {pt.building}
                        </span>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '3px', lineHeight: 1.35 }}>
                        {pt.detailLocation}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setZoomModal({
                          title: `${pt.circledNo} ${pt.name} (표준 ${pt.standardLabel})`,
                          image: pt.layoutImage,
                          description: pt.detailLocation
                        })
                      }
                      style={{
                        flexShrink: 0,
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        background: '#f8fafc',
                        color: '#1e40af',
                        cursor: 'pointer'
                      }}
                    >
                      🗺️ 도면
                    </button>
                  </div>

                  {/* 측정값(LUX) 입력 + 실시간 판정 배지 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        step="any"
                        aria-label={`${pt.name} ${selectedMonth}월 측정 조도(LUX)`}
                        placeholder={`${selectedMonth}월 측정값 입력 (기준 ${pt.standardLux} 이상)`}
                        value={rawVal}
                        onChange={(e) => onCellChange(pt.no, selectedMonth, e.target.value)}
                        className="mil-input"
                        style={{
                          paddingRight: '46px',
                          borderColor: isFail ? '#ef4444' : isPass ? '#10b981' : '#cbd5e1',
                          color: isFail ? '#b91c1c' : '#0f172a'
                        }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#64748b',
                          pointerEvents: 'none'
                        }}
                      >
                        LUX
                      </span>
                    </div>

                    <span
                      style={{
                        minWidth: '64px',
                        textAlign: 'center',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        fontSize: '12.5px',
                        fontWeight: 800,
                        background: isFail ? '#fee2e2' : isPass ? '#dcfce7' : '#f1f5f9',
                        color: isFail ? '#991b1b' : isPass ? '#166534' : '#64748b',
                        border: `1px solid ${isFail ? '#fca5a5' : isPass ? '#86efac' : '#e2e8f0'}`
                      }}
                    >
                      {judgement === '-' ? '미입력' : judgement}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 하단 고정형 저장 바 */}
          <div
            style={{
              position: 'sticky',
              bottom: '10px',
              zIndex: 15,
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              padding: '10px 12px',
              boxShadow: '0 8px 20px rgba(15, 23, 42, 0.14)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
              {selectedMonth}월 입력: <strong>{monthStats.measuredCount}/10개소</strong>
              {isLedgerDirty && (
                <span style={{ color: '#d97706', marginLeft: '6px', fontWeight: 800 }}>
                  (변경됨)
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onSaveLedgerAll}
              disabled={savingLedger}
              style={{
                padding: '9px 16px',
                borderRadius: '8px',
                border: 'none',
                background: isLedgerDirty ? '#059669' : '#1d4ed8',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 900,
                cursor: 'pointer'
              }}
            >
              {savingLedger ? '저장 중...' : '💾 조도 기록 저장'}
            </button>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════
          탭 2: 🗺️ 배치도 · 도면 (공장 전체 지도 ①~⑩ & 동별 상세 LAY OUT)
         ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'maps' && (
        <>
          {/* 도면 선택 칩 */}
          <div className="mil-card" style={{ padding: '10px' }}>
            <div style={{ fontSize: '12px', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
              🗺️ 공장 전체 지도 및 동별 상세 도면 선택
            </div>
            <div className="mil-chip-row">
              {ILLUMINANCE_BUILDING_MAPS.map((mp) => (
                <button
                  key={mp.id}
                  type="button"
                  className={`mil-chip-btn ${activeMapId === mp.id ? 'is-active' : ''}`}
                  onClick={() => {
                    setActiveMapId(mp.id);
                    if (mp.pointNos.length > 0 && !mp.pointNos.includes(selectedPointNo)) {
                      setSelectedPointNo(mp.pointNos[0]);
                    }
                  }}
                >
                  {mp.shortLabel}
                </button>
              ))}
            </div>
          </div>

          {/* 1) 공장 전체 배치도 인터랙티브 핀 카드 */}
          <div className="mil-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                📍 공장 전체 조도 측정 위치도 (①~⑩ 터치)
              </span>
              <button
                type="button"
                onClick={() =>
                  setZoomModal({
                    title: '공장 전체 조도 측정 위치도 (①~⑩)',
                    image: '/images/illuminance/factory_overview_map.jpg',
                    description: '번호(1~10)를 터치하면 아래에 해당 동의 상세 도면이 표시됩니다.'
                  })
                }
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#334155',
                  cursor: 'pointer'
                }}
              >
                🔍 전체화면
              </button>
            </div>

            <div
              style={{
                position: 'relative',
                width: '100%',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid #cbd5e1',
                background: '#0f172a'
              }}
            >
              <img
                src="/images/illuminance/factory_overview_map.jpg"
                alt="공장 전체 지도"
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
              {ILLUMINANCE_POINTS.map((pt) => {
                const isSelected = pt.no === selectedPointNo;
                return (
                  <button
                    key={pt.no}
                    type="button"
                    onClick={() => handleSelectPointAndMap(pt.no)}
                    title={`${pt.circledNo} ${pt.name}`}
                    style={{
                      position: 'absolute',
                      left: `${pt.overviewPos.left}%`,
                      top: `${pt.overviewPos.top}%`,
                      transform: 'translate(-50%, -50%)',
                      width: isSelected ? '32px' : '26px',
                      height: isSelected ? '32px' : '26px',
                      minHeight: '26px',
                      borderRadius: '50%',
                      border: isSelected ? '2.5px solid #dc2626' : '1.5px solid rgba(29, 78, 216, 0.85)',
                      background: isSelected ? 'rgba(254, 240, 138, 0.95)' : 'rgba(250, 204, 21, 0.25)',
                      color: '#0f172a',
                      fontWeight: 900,
                      fontSize: '12px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    {isSelected ? pt.no : ''}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2) 선택된 동 상세 CAD 도면 및 공정 정보 */}
          <div className="mil-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                📐 {activeMap.label}
              </span>
              <button
                type="button"
                onClick={() =>
                  setZoomModal({
                    title: activeMap.label,
                    image: activeMap.image,
                    description: activeMap.description
                  })
                }
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#334155',
                  cursor: 'pointer'
                }}
              >
                🔍 도면 확대
              </button>
            </div>

            <div
              onClick={() =>
                setZoomModal({
                  title: activeMap.label,
                  image: activeMap.image,
                  description: activeMap.description
                })
              }
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '6px',
                background: '#f8fafc',
                textAlign: 'center',
                cursor: 'zoom-in'
              }}
            >
              <img
                src={activeMap.image}
                alt={activeMap.label}
                style={{ width: '100%', maxHeight: '230px', objectFit: 'contain' }}
              />
            </div>

            <div
              style={{
                marginTop: '8px',
                padding: '8px 10px',
                borderRadius: '8px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                fontSize: '12px',
                color: '#1e3a8a'
              }}
            >
              <div style={{ fontWeight: 800 }}>
                {selectedPoint.circledNo} {selectedPoint.name} — 표준 조도:{' '}
                <span style={{ color: '#1d4ed8' }}>{selectedPoint.standardLabel}</span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#334155', marginTop: '2px' }}>
                {selectedPoint.detailLocation}
              </div>
            </div>

            {/* ①~⑩ 공정 선택 2열 버튼 그리드 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '6px',
                marginTop: '10px'
              }}
            >
              {ILLUMINANCE_POINTS.map((pt) => {
                const isSelected = pt.no === selectedPointNo;
                return (
                  <button
                    key={pt.no}
                    type="button"
                    onClick={() => handleSelectPointAndMap(pt.no)}
                    style={{
                      padding: '7px 9px',
                      borderRadius: '8px',
                      border: isSelected ? '2px solid #1d4ed8' : '1px solid #cbd5e1',
                      background: isSelected ? '#eff6ff' : '#f8fafc',
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: isSelected ? '#1d4ed8' : '#0f172a'
                      }}
                    >
                      {pt.circledNo} {pt.name}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
                      {pt.standardLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════
          탭 3: 📊 연간 현황 · 이력 (공정별 1~12월 미니 그리드 & 이력)
         ════════════════════════════════════════════════════════════════ */}
      {activeTab === 'annual' && (
        <>
          {/* 연간 요약 카드 + 엑셀 다운로드 */}
          <div className="mil-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '10px'
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>
                  ■ ({selectedYear}년) 조도측정 연간 요약
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                  기록 월: {annualStats.recordedMonths}/12개월 · 총 {annualStats.totalCells}건 (적합{' '}
                  <strong style={{ color: '#15803d' }}>{annualStats.passCells}</strong> / 부적합{' '}
                  <strong style={{ color: '#b91c1c' }}>{annualStats.failCells}</strong>)
                </div>
              </div>
              <button
                type="button"
                onClick={onExportExcel}
                style={{
                  padding: '6px 10px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  borderRadius: '8px',
                  border: '1px solid #15803d',
                  background: '#f0fdf4',
                  color: '#166534',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                📥 엑셀 저장
              </button>
            </div>

            {/* ①~⑩ 공정별 1~12월 미니 현황 (가로 스크롤 없는 6×2 모바일 그리드) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ILLUMINANCE_POINTS.map((pt) => (
                <div
                  key={pt.no}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px 10px',
                    background: '#f8fafc'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '6px'
                    }}
                  >
                    <span style={{ fontSize: '12.5px', fontWeight: 900, color: '#0f172a' }}>
                      {pt.circledNo} {pt.name}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#1d4ed8' }}>
                      표준 {pt.standardLabel}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
                      gap: '4px'
                    }}
                  >
                    {ILLUMINANCE_MONTHS.map((m) => {
                      const raw = ledgerDraft?.cells?.[pt.no]?.[m];
                      const num = toLuxNumber(raw);
                      const isFail = num !== null && num < pt.standardLux;
                      const isPass = num !== null && num >= pt.standardLux;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setSelectedMonth(m);
                            setActiveTab('monthly');
                          }}
                          title={`${m}월 측정 화면으로 이동`}
                          style={{
                            padding: '4px 2px',
                            borderRadius: '6px',
                            border: `1px solid ${isFail ? '#fca5a5' : isPass ? '#86efac' : '#e2e8f0'}`,
                            background: isFail ? '#fee2e2' : isPass ? '#dcfce7' : '#ffffff',
                            textAlign: 'center',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>
                            {m}월
                          </div>
                          <div
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              color: isFail ? '#b91c1c' : isPass ? '#166534' : '#94a3b8'
                            }}
                          >
                            {num !== null ? num : '-'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 최근 상세 측정 이력 카드 리스트 */}
          <div className="mil-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}
            >
              <span style={{ fontSize: '13.5px', fontWeight: 900, color: '#0f172a' }}>
                📑 최근 측정 이력 ({historyRows.length}건)
              </span>
              <button
                type="button"
                onClick={() => onOpenIndividualModal(null)}
                style={{
                  padding: '5px 10px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  borderRadius: '6px',
                  border: '1px solid #1d4ed8',
                  background: '#1d4ed8',
                  color: '#ffffff',
                  cursor: 'pointer'
                }}
              >
                + 개별 등록
              </button>
            </div>

            {historyRows.length === 0 ? (
              <div style={{ padding: '20px 10px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>
                등록된 조도 측정 기록이 없습니다.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {historyRows.slice(0, 25).map((r) => {
                  const judgement = judgeIlluminance(r.measuredLux, r.standardLux);
                  const isFail = judgement === ILLUMINANCE_JUDGEMENT.FAIL;
                  const pt = findIlluminancePoint(r.pointNo || r.location);
                  return (
                    <div
                      key={r.id}
                      style={{
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '8px',
                        background: isFail ? '#fff5f5' : '#ffffff'
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
                            {pt ? `${pt.circledNo} ${pt.name}` : r.location}
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              background: isFail ? '#fee2e2' : '#dcfce7',
                              color: isFail ? '#991b1b' : '#166534'
                            }}
                          >
                            {r.measuredLux} LUX ({judgement})
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          측정일: {r.date || '-'} {r.measureTime ? `(${r.measureTime})` : ''} · 표준{' '}
                          {r.standardLux} LUX
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => onOpenIndividualModal(r)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: '1px solid #bfdbfe',
                            background: '#eff6ff',
                            color: '#1d4ed8',
                            cursor: 'pointer'
                          }}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteRow(r)}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 700,
                            borderRadius: '6px',
                            border: 'none',
                            background: '#fee2e2',
                            color: '#991b1b',
                            cursor: 'pointer'
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* 도면 확대 모달 */}
      {zoomModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={zoomModal.title}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.82)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '12px'
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setZoomModal(null);
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '12px',
              width: '100%',
              maxWidth: '640px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>
                {zoomModal.title}
              </span>
              <button
                type="button"
                onClick={() => setZoomModal(null)}
                style={{
                  padding: '4px 9px',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  cursor: 'pointer'
                }}
              >
                닫기 ✕
              </button>
            </div>
            <div
              style={{
                overflow: 'auto',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                padding: '6px',
                textAlign: 'center'
              }}
            >
              <img
                src={zoomModal.image}
                alt={zoomModal.title}
                style={{ maxWidth: '100%', maxHeight: '72vh', objectFit: 'contain' }}
              />
            </div>
            {zoomModal.description && (
              <div style={{ fontSize: '12px', color: '#334155', fontWeight: 600 }}>
                {zoomModal.description}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
