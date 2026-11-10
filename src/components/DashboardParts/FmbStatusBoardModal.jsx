import React, { useEffect, useRef, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { formatKg } from './fmbBoardUtils';
import { i18n } from '../../constants/translations';

const escapeHtml = (val) => String(val ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

function printFmbStatusBoard({
  monthly,
  stockSummary,
  ioCheckSummary,
  latestDayWithEnv,
  chartDataUrl
}) {
  const oldIframe = document.getElementById('fmbBoardPrintIframe');
  if (oldIframe) oldIframe.remove();

  const iframe = document.createElement('iframe');
  iframe.id = 'fmbBoardPrintIframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const printedAt = new Date().toLocaleString('sv-SE').slice(0, 16);
  const curTemp = latestDayWithEnv?.tempVal !== null && latestDayWithEnv?.tempVal !== undefined
    ? `${latestDayWithEnv.tempVal}℃`
    : '미기록';
  const curHum = latestDayWithEnv?.humVal !== null && latestDayWithEnv?.humVal !== undefined
    ? `${latestDayWithEnv.humVal}%`
    : '미기록';

  const dayHeaders = monthly.days.map((d) => `<th style="padding:2px 1px; font-size:8px; color:${d.dow === 0 ? '#dc2626' : d.dow === 6 ? '#2563eb' : '#334155'};">${d.day}</th>`).join('');
  const dayTemps = monthly.days.map((d) => `<td style="padding:2px 1px; font-size:8px; font-weight:700; color:#dc2626;">${d.tempVal ?? '-'}</td>`).join('');
  const dayHums = monthly.days.map((d) => `<td style="padding:2px 1px; font-size:8px; font-weight:700; color:#0284c7;">${d.humVal ?? '-'}</td>`).join('');

  const checkRowsHtml = ioCheckSummary.checkResults.map((c) => {
    const statusText = c.latestOk === null ? '미점검' : c.latestOk ? '양호 (O)' : '불량 (X)';
    const statusColor = c.latestOk === null ? '#64748b' : c.latestOk ? '#059669' : '#dc2626';
    return `
      <tr>
        <td style="text-align:center; font-weight:700; width:26px;">${c.no}</td>
        <td style="text-align:left; font-weight:600; padding:3px 6px;">${escapeHtml(c.shortText)}</td>
        <td style="text-align:center; font-weight:800; width:62px; color:${statusColor};">${statusText}</td>
        <td style="text-align:center; font-weight:700; width:74px;">${c.passCount}일 / <span style="color:${c.failCount > 0 ? '#dc2626' : '#64748b'};">${c.failCount}일</span></td>
      </tr>
    `;
  }).join('');

  const gradeCardsHtml = stockSummary.grades.map((g) => `
    <div style="border:1px solid #94a3b8; border-radius:4px; padding:4px 8px; background:${g.kg > 0 ? '#f0fdf4' : '#f8fafc'}; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <div style="font-size:10px; font-weight:800; color:#0f172a;">${escapeHtml(g.code)}</div>
        <div style="font-size:8.5px; color:#64748b;">${g.lotCount}건${g.earliestExpiry ? ` · 선입 ${escapeHtml(g.earliestExpiry)}` : ''}</div>
      </div>
      <div style="font-size:12px; font-weight:800; color:${g.kg > 0 ? '#047857' : '#94a3b8'};">${formatKg(g.kg)} kg</div>
    </div>
  `).join('');

  const stockRowsHtml = stockSummary.sortedRows.slice(0, 7).map((r, idx) => `
    <tr>
      <td style="text-align:center; font-weight:700;">${idx + 1}</td>
      <td style="text-align:center; font-weight:700; color:${r.dispType === '재고' ? '#1d4ed8' : '#047857'};">${escapeHtml(r.dispType)}</td>
      <td style="text-align:center; font-weight:800;">${escapeHtml(r.code)}</td>
      <td style="text-align:center;">${escapeHtml(r.expiry || '-')}</td>
      <td style="text-align:right; font-weight:800; padding-right:6px;">${escapeHtml(r.amountDisp)}</td>
    </tr>
  `).join('') || `<tr><td colspan="5" style="text-align:center; color:#64748b; padding:8px;">현재 등록된 보관실 재고 없음</td></tr>`;

  const ioRowsHtml = ioCheckSummary.recentLogs.slice(0, 7).map((l) => {
    const isIn = l.ioKind === '입고';
    return `
      <tr>
        <td style="text-align:center;">${escapeHtml(l.mmdd)}</td>
        <td style="text-align:center; font-weight:800; color:${isIn ? '#047857' : '#be123c'};">${escapeHtml(l.ioKind)}</td>
        <td style="text-align:center; font-weight:800;">${escapeHtml(l.code)}</td>
        <td style="text-align:center;">${escapeHtml(l.expiry || '-')}</td>
        <td style="text-align:right; font-weight:800; padding-right:6px; color:${isIn ? '#047857' : '#be123c'};">${isIn ? '+' : '-'}${escapeHtml(l.amountDisp)}</td>
        <td style="text-align:center;">${escapeHtml(l.worker)}</td>
      </tr>
    `;
  }).join('') || `<tr><td colspan="6" style="text-align:center; color:#64748b; padding:8px;">해당 월 입·출고 기록 없음</td></tr>`;

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8" />
      <title>FMB보관실 통합 현황판 (${monthly.year}-${String(monthly.month).padStart(2, '0')})</title>
      <style>
        @page { size: A4 landscape; margin: 6mm 8mm; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body { margin: 0; padding: 0; font-family: 'Pretendard', -apple-system, 'Malgun Gothic', sans-serif; color: #0f172a; background: #fff; font-size: 9.5px; line-height: 1.25; }
        .sheet { width: 100%; display: flex; flex-direction: column; gap: 6px; }
        .top-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 4px; }
        .kpi-row { display: flex; gap: 6px; align-items: center; }
        .kpi-pill { border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 8px; background: #f8fafc; font-weight: 700; font-size: 9.5px; }
        .grid-top { display: grid; grid-template-columns: 1.55fr 1fr; gap: 8px; }
        .grid-btm { display: grid; grid-template-columns: 1fr 1.2fr; gap: 8px; }
        .panel { border: 1px solid #334155; border-radius: 5px; overflow: hidden; display: flex; flex-direction: column; }
        .panel-hd { background: #f1f5f9; border-bottom: 1px solid #64748b; padding: 4px 8px; font-size: 10.5px; font-weight: 800; display: flex; justify-content: space-between; align-items: center; }
        .panel-bd { padding: 5px 6px; flex: 1; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        th, td { border: 1px solid #cbd5e1; padding: 2.5px 3px; font-size: 9px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        th { background: #f8fafc; font-weight: 800; color: #334155; }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="top-bar">
          <div>
            <div style="font-size:15px; font-weight:900; letter-spacing:-0.02em;">FMB 보관실 통합 관리 현황판 (${monthly.year}년 ${monthly.month}월)</div>
            <div style="font-size:9px; color:#475569;">관리기준: 온도 20±5℃ (15~25℃) · 습도 70% 이하 · 유효기간 10일 이내 (선입선출) | 출력일시: ${escapeHtml(printedAt)}</div>
          </div>
          <div class="kpi-row">
            <div class="kpi-pill">최근 온도: <strong style="color:#dc2626;">${escapeHtml(curTemp)}</strong></div>
            <div class="kpi-pill">최근 습도: <strong style="color:#0284c7;">${escapeHtml(curHum)}</strong></div>
            <div class="kpi-pill">월 평균: <strong>${monthly.avgTemp !== null ? `${monthly.avgTemp}℃` : '-'} / ${monthly.avgHum !== null ? `${monthly.avgHum}%` : '-'}</strong></div>
            <div class="kpi-pill" style="background:#ecfdf5; border-color:#6ee7b7;">현재 총 재고: <strong style="color:#047857;">${formatKg(stockSummary.totalKg)} kg</strong></div>
          </div>
        </div>

        <div class="grid-top">
          <div class="panel">
            <div class="panel-hd">
              <span>1. 월간 온·습도 추이 그래프 및 일자별 현황</span>
              <span style="font-size:9px; color:#475569;">기록일수: ${monthly.recordedDays} / ${monthly.daysInMonth}일</span>
            </div>
            <div class="panel-bd">
              ${chartDataUrl ? `<img src="${chartDataUrl}" alt="온습도 그래프" style="width:100%; height:145px; object-fit:fill; display:block; margin-bottom:4px;" />` : ''}
              <table>
                <thead>
                  <tr><th style="width:44px;">일자</th>${dayHeaders}<th style="width:38px;">평균</th></tr>
                </thead>
                <tbody>
                  <tr><th style="background:#fef2f2; color:#b91c1c;">온도</th>${dayTemps}<td style="font-weight:800; color:#b91c1c;">${monthly.avgTemp !== null ? monthly.avgTemp : '-'}</td></tr>
                  <tr><th style="background:#f0f9ff; color:#0369a1;">습도</th>${dayHums}<td style="font-weight:800; color:#0369a1;">${monthly.avgHum !== null ? monthly.avgHum : '-'}</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="panel">
            <div class="panel-hd">
              <span>2. 일일 점검 항목별 결과</span>
              <span style="font-size:9px; color:#475569;">최근 점검일: ${escapeHtml(ioCheckSummary.latestReport?.date || '미기록')}</span>
            </div>
            <div class="panel-bd">
              <table>
                <thead>
                  <tr>
                    <th style="width:26px;">No</th>
                    <th>점검 항목</th>
                    <th style="width:62px;">최근 판정</th>
                    <th style="width:74px;">당월(양호/불량)</th>
                  </tr>
                </thead>
                <tbody>${checkRowsHtml}</tbody>
              </table>
              ${ioCheckSummary.activeAlarms.length > 0 ? `
                <div style="margin-top:4px; padding:3px 6px; background:#fff1f2; border:1px solid #fecdd3; border-radius:4px; font-size:8.5px;">
                  <strong style="color:#be123c;">경보장치 이상·조치:</strong>
                  ${ioCheckSummary.activeAlarms.map((a) => `${escapeHtml(a.symptom || '-')} → ${escapeHtml(a.action || '-')}`).join(' / ')}
                </div>
              ` : ''}
            </div>
          </div>
        </div>

        <div class="grid-btm">
          <div class="panel">
            <div class="panel-hd">
              <span>3. 고무 종류별 현재 재고 현황 (선입선출)</span>
              <span style="font-size:9.5px; color:#047857;">총 재고: ${formatKg(stockSummary.totalKg)} kg (${stockSummary.totalLots}건)</span>
            </div>
            <div class="panel-bd">
              <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:5px; margin-bottom:5px;">
                ${gradeCardsHtml}
              </div>
              <table>
                <colgroup>
                  <col style="width:26px;" /><col style="width:46px;" /><col /><col style="width:56px;" /><col style="width:68px;" />
                </colgroup>
                <thead>
                  <tr><th>No</th><th>구분</th><th>고무명</th><th>유효기간</th><th>수량(kg)</th></tr>
                </thead>
                <tbody>${stockRowsHtml}</tbody>
              </table>
            </div>
          </div>

          <div class="panel">
            <div class="panel-hd">
              <span>4. 당월 입고 · 출고(불출) 현황</span>
              <span style="font-size:9px;">당월 입고 <strong style="color:#047857;">+${formatKg(ioCheckSummary.inTotalKg)} kg</strong> · 당월 출고 <strong style="color:#be123c;">-${formatKg(ioCheckSummary.outTotalKg)} kg</strong></span>
            </div>
            <div class="panel-bd">
              <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:5px; margin-bottom:5px;">
                ${ioCheckSummary.ioGrades.slice(0, 3).map((g) => `
                  <div style="border:1px solid #cbd5e1; border-radius:4px; padding:3px 6px; background:#f8fafc; display:flex; justify-content:space-between; align-items:center; font-size:8.5px;">
                    <strong style="color:#0f172a;">${escapeHtml(g.code)}</strong>
                    <span><strong style="color:#047857;">+${formatKg(g.inKg)}</strong> / <strong style="color:#be123c;">-${formatKg(g.outKg)}</strong> kg</span>
                  </div>
                `).join('')}
              </div>
              <table>
                <colgroup>
                  <col style="width:44px;" /><col style="width:46px;" /><col /><col style="width:52px;" /><col style="width:68px;" /><col style="width:54px;" />
                </colgroup>
                <thead>
                  <tr><th>일자</th><th>구분</th><th>고무명</th><th>유효기간</th><th>수량(kg)</th><th>작성자</th></tr>
                </thead>
                <tbody>${ioRowsHtml}</tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
  doc.close();
  i18n.applyTranslations(doc.body);

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
  }, 250);
}

export default function FmbStatusBoardModal({
  selectedMonth,
  currentYm,
  onPrevMonth,
  onNextMonth,
  onResetMonth,
  onChangeMonth,
  monthly,
  chartData,
  chartOptions,
  valueLabelsPlugin,
  stockSummary,
  ioCheckSummary,
  onRefresh,
  onNavigateForm,
  onOpenDetail,
  onClose
}) {
  const boardRootRef = useRef(null);
  const boardChartRef = useRef(null);
  const [clockStr, setClockStr] = useState(() => new Date().toLocaleString('sv-SE'));
  const [isNativeFullscreen, setIsNativeFullscreen] = useState(() => Boolean(document.fullscreenElement));
  const [refreshing, setRefreshing] = useState(false);

  // 오늘 또는 가장 최근 온·습도 기록 일자 추출
  const latestDayWithEnv = [...monthly.days]
    .reverse()
    .find((d) => d.tempVal !== null || d.humVal !== null || d.primary);

  const tempInSpec = latestDayWithEnv?.tempVal !== null && latestDayWithEnv?.tempVal !== undefined
    ? latestDayWithEnv.tempVal >= 15 && latestDayWithEnv.tempVal <= 25
    : null;
  const humInSpec = latestDayWithEnv?.humVal !== null && latestDayWithEnv?.humVal !== undefined
    ? latestDayWithEnv.humVal >= 0 && latestDayWithEnv.humVal <= 70
    : null;

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const clockTimer = setInterval(() => {
      setClockStr(new Date().toLocaleString('sv-SE'));
    }, 1000);

    // FMB 보관실 PC 상시 현황판용 5분 주기 자동 갱신
    const autoRefreshTimer = setInterval(() => {
      onRefresh?.();
    }, 5 * 60 * 1000);

    const onFsChange = () => {
      setIsNativeFullscreen(Boolean(document.fullscreenElement));
    };
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !document.fullscreenElement) {
        onClose?.();
      }
    };

    document.addEventListener('fullscreenchange', onFsChange);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      clearInterval(clockTimer);
      clearInterval(autoRefreshTimer);
      document.removeEventListener('fullscreenchange', onFsChange);
      window.removeEventListener('keydown', onKeyDown);
      if (document.fullscreenElement) {
        document.exitFullscreen?.().catch(() => {});
      }
    };
  }, [onClose, onRefresh]);

  useEffect(() => {
    if (boardRootRef.current) {
      i18n.applyTranslations(boardRootRef.current);
    }
  });

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await (boardRootRef.current?.requestFullscreen?.() || document.documentElement.requestFullscreen?.());
      } else {
        await document.exitFullscreen?.();
      }
    } catch {
      // 브라우저 권한 제한 시 무시 (이미 100vw x 100vh 전체창 표시 중)
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh?.();
    } finally {
      setRefreshing(false);
    }
  };

  const handlePrintBoard = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // ignore
      }
    }
    let chartDataUrl = '';
    try {
      const chartInst = boardChartRef.current;
      chartDataUrl = chartInst?.toBase64Image?.() || chartInst?.canvas?.toDataURL?.('image/png') || '';
    } catch {
      chartDataUrl = '';
    }
    printFmbStatusBoard({
      monthly,
      stockSummary,
      ioCheckSummary,
      latestDayWithEnv,
      chartDataUrl
    });
  };

  const hasAnyCheckFail = ioCheckSummary.checkResults.some((c) => c.latestOk === false);

  return (
    <div
      ref={boardRootRef}
      data-fmb-status-board="1"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 950,
        background: '#e2e8f0',
        color: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        padding: '10px 14px',
        gap: '10px',
        overflowY: 'auto',
        fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif",
        letterSpacing: '-0.025em'
      }}
    >
      <style>{`
        [data-fmb-status-board="1"] .fmb-wb-body {
          flex: 1;
          min-height: 0;
          display: grid;
          grid-template-rows: minmax(290px, 1.08fr) minmax(250px, 0.92fr);
          gap: 10px;
        }
        [data-fmb-status-board="1"] .fmb-wb-row-top {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 10px;
          min-height: 0;
        }
        [data-fmb-status-board="1"] .fmb-wb-row-btm {
          display: grid;
          grid-template-columns: 1fr 1.22fr;
          gap: 10px;
          min-height: 0;
        }
        [data-fmb-status-board="1"] .fmb-wb-panel {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.05);
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }
        [data-fmb-status-board="1"] .fmb-wb-panel-hd {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 8px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        [data-fmb-status-board="1"] .fmb-wb-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 11.5px;
        }
        [data-fmb-status-board="1"] .fmb-wb-table th,
        [data-fmb-status-board="1"] .fmb-wb-table td {
          border: 1px solid #e2e8f0;
          padding: 4px 5px;
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        [data-fmb-status-board="1"] .fmb-wb-table th {
          background: #f1f5f9;
          color: #334155;
          font-weight: 800;
        }
        [data-fmb-status-board="1"] .fmb-wb-btn {
          border: 1px solid #cbd5e1;
          background: #ffffff;
          color: #1e293b;
          border-radius: 6px;
          padding: 5px 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }
        [data-fmb-status-board="1"] .fmb-wb-btn:hover {
          background: #f1f5f9;
        }
        @media (max-width: 1120px) {
          [data-fmb-status-board="1"] .fmb-wb-body {
            display: flex;
            flex-direction: column;
          }
          [data-fmb-status-board="1"] .fmb-wb-row-top,
          [data-fmb-status-board="1"] .fmb-wb-row-btm {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* ── 상단 통합 상황판 헤더 바 ── */}
      <div
        style={{
          background: '#0f172a',
          color: '#f8fafc',
          borderRadius: '10px',
          padding: '9px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          flexWrap: 'wrap',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981', display: 'inline-block' }} />
            <span style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff' }}>FMB 보관실 실시간 통합 현황판</span>
          </div>

          {/* 기준월 선택 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#1e293b', padding: '3px 6px', borderRadius: '6px', border: '1px solid #334155' }}>
            <button type="button" onClick={onPrevMonth} style={{ background: 'transparent', border: 0, color: '#cbd5e1', cursor: 'pointer', fontWeight: 800, padding: '2px 6px' }}>◀</button>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => e.target.value && onChangeMonth(e.target.value)}
              style={{ background: '#0f172a', color: '#ffffff', border: '1px solid #475569', borderRadius: '4px', padding: '2px 6px', fontSize: '12px', fontWeight: 700 }}
            />
            <button type="button" onClick={onNextMonth} style={{ background: 'transparent', border: 0, color: '#cbd5e1', cursor: 'pointer', fontWeight: 800, padding: '2px 6px' }}>▶</button>
            {selectedMonth !== currentYm && (
              <button type="button" onClick={onResetMonth} style={{ background: '#2563eb', border: 0, color: '#fff', borderRadius: '4px', padding: '2px 7px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>이번 달</button>
            )}
          </div>

          <span translate="no" style={{ fontSize: '12px', fontFamily: 'monospace', color: '#94a3b8', background: 'rgba(255,255,255,0.06)', padding: '3px 8px', borderRadius: '4px' }}>
            {clockStr}
          </span>
        </div>

        {/* 상단 핵심 실시간 수치 + 제어 버튼 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ background: '#1e293b', border: `1px solid ${tempInSpec === false ? '#ef4444' : '#334155'}`, borderRadius: '6px', padding: '4px 10px', fontSize: '12px' }}>
            <span style={{ color: '#94a3b8', marginRight: '5px' }}>최근 온도</span>
            <strong translate="no" style={{ color: tempInSpec === false ? '#f87171' : '#fca5a5', fontSize: '13.5px' }}>
              {latestDayWithEnv?.tempVal !== null && latestDayWithEnv?.tempVal !== undefined ? `${latestDayWithEnv.tempVal}℃` : '—'}
            </strong>
          </div>
          <div style={{ background: '#1e293b', border: `1px solid ${humInSpec === false ? '#ef4444' : '#334155'}`, borderRadius: '6px', padding: '4px 10px', fontSize: '12px' }}>
            <span style={{ color: '#94a3b8', marginRight: '5px' }}>최근 습도</span>
            <strong translate="no" style={{ color: humInSpec === false ? '#f87171' : '#7dd3fc', fontSize: '13.5px' }}>
              {latestDayWithEnv?.humVal !== null && latestDayWithEnv?.humVal !== undefined ? `${latestDayWithEnv.humVal}%` : '—'}
            </strong>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.16)', border: '1px solid #10b981', borderRadius: '6px', padding: '4px 10px', fontSize: '12px' }}>
            <span style={{ color: '#a7f3d0', marginRight: '5px' }}>총 재고</span>
            <strong translate="no" style={{ color: '#34d399', fontSize: '13.5px' }}>{formatKg(stockSummary.totalKg)} kg</strong>
          </div>

          <button type="button" className="fmb-wb-btn" onClick={handleManualRefresh} disabled={refreshing}>
            <span>{refreshing ? '갱신 중...' : '🔄 새로고침'}</span>
          </button>
          <button type="button" className="fmb-wb-btn" onClick={onNavigateForm} style={{ background: '#ecfdf5', borderColor: '#6ee7b7', color: '#047857' }}>
            <span>📝 일보 작성</span>
          </button>
          <button type="button" className="fmb-wb-btn" onClick={handlePrintBoard} style={{ background: '#eff6ff', borderColor: '#93c5fd', color: '#1d4ed8' }}>
            <span>🖨️ 현황판 출력</span>
          </button>
          <button type="button" className="fmb-wb-btn" onClick={handleToggleFullscreen} style={{ background: '#334155', borderColor: '#475569', color: '#f8fafc' }}>
            <span>{isNativeFullscreen ? '전체화면 해제' : '⛶ 모니터 전체화면'}</span>
          </button>
          <button type="button" className="fmb-wb-btn" onClick={onClose} style={{ background: '#e11d48', borderColor: '#e11d48', color: '#ffffff' }}>
            <span>✕ 닫기</span>
          </button>
        </div>
      </div>

      {/* ── 본문 4분할 통합 상황판 ── */}
      <div className="fmb-wb-body">
        {/* 상단 행: [1] 온습도 추이 그래프 | [2] 점검 항목별 결과 */}
        <div className="fmb-wb-row-top">
          {/* 1. 월간 온·습도 그래프 및 일자별 요약 */}
          <div className="fmb-wb-panel">
            <div className="fmb-wb-panel-hd">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>1. 월간 온·습도 추이 그래프</span>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>기준: 온도 20±5℃ (15~25℃) · 습도 70% 이하</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', fontSize: '11.5px', fontWeight: 700 }}>
                <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '999px', padding: '1px 8px' }}>
                  <span>평균 온도</span> <strong translate="no">{monthly.avgTemp !== null ? `${monthly.avgTemp}℃` : '—'}</strong>
                </span>
                <span style={{ background: '#f0f9ff', color: '#0284c7', border: '1px solid #bae6fd', borderRadius: '999px', padding: '1px 8px' }}>
                  <span>평균 습도</span> <strong translate="no">{monthly.avgHum !== null ? `${monthly.avgHum}%` : '—'}</strong>
                </span>
                <span style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '999px', padding: '1px 8px' }}>
                  <span>기록일수</span> <strong translate="no">{monthly.recordedDays}/{monthly.daysInMonth}</strong>
                </span>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ flex: 1, minHeight: '150px', position: 'relative' }}>
                <Bar
                  ref={boardChartRef}
                  data={chartData}
                  plugins={valueLabelsPlugin}
                  options={chartOptions}
                />
              </div>

              <div style={{ overflowX: 'auto', flexShrink: 0 }}>
                <table className="fmb-wb-table" style={{ minWidth: '720px', fontSize: '10px' }}>
                  <colgroup>
                    <col style={{ width: '54px' }} />
                    {monthly.days.map((d) => <col key={d.day} />)}
                  </colgroup>
                  <thead>
                    <tr>
                      <th>일자</th>
                      {monthly.days.map((d) => (
                        <th
                          key={d.day}
                          onClick={() => d.primary && onOpenDetail?.(d.primary)}
                          style={{
                            cursor: d.primary ? 'pointer' : 'default',
                            background: d.isToday ? '#d1fae5' : '#f8fafc',
                            color: d.isToday ? '#047857' : d.dow === 0 ? '#dc2626' : d.dow === 6 ? '#2563eb' : '#334155',
                            padding: '2px 1px'
                          }}
                        >
                          {d.day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th style={{ background: '#fef2f2', color: '#b91c1c', padding: '2px 2px' }}>온도(℃)</th>
                      {monthly.days.map((d) => (
                        <td
                          key={d.day}
                          onClick={() => d.primary && onOpenDetail?.(d.primary)}
                          translate="no"
                          style={{ cursor: d.primary ? 'pointer' : 'default', padding: '2px 1px', fontWeight: 700, color: d.tempVal !== null ? '#dc2626' : '#cbd5e1' }}
                        >
                          {d.tempVal !== null ? d.tempVal : '-'}
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <th style={{ background: '#f0f9ff', color: '#0369a1', padding: '2px 2px' }}>습도(%)</th>
                      {monthly.days.map((d) => (
                        <td
                          key={d.day}
                          onClick={() => d.primary && onOpenDetail?.(d.primary)}
                          translate="no"
                          style={{ cursor: d.primary ? 'pointer' : 'default', padding: '2px 1px', fontWeight: 700, color: d.humVal !== null ? '#0284c7' : '#cbd5e1' }}
                        >
                          {d.humVal !== null ? d.humVal : '-'}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 2. 일일 점검 항목별 결과 */}
          <div className="fmb-wb-panel">
            <div className="fmb-wb-panel-hd">
              <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>2. 점검 항목별 결과</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                  <span>최근 점검일</span>: <strong translate="no">{ioCheckSummary.latestReport?.date || '—'}</strong>
                </span>
                {ioCheckSummary.latestReport && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '1px 8px',
                      borderRadius: '999px',
                      background: hasAnyCheckFail ? '#fef2f2' : '#ecfdf5',
                      color: hasAnyCheckFail ? '#dc2626' : '#047857',
                      border: `1px solid ${hasAnyCheckFail ? '#fca5a5' : '#6ee7b7'}`
                    }}
                  >
                    {hasAnyCheckFail ? '⚠️ 불량 항목 있음' : '✅ 전 항목 양호'}
                  </span>
                )}
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, padding: '8px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '6px' }}>
              <table className="fmb-wb-table">
                <colgroup>
                  <col style={{ width: '30px' }} />
                  <col />
                  <col style={{ width: '68px' }} />
                  <col style={{ width: '82px' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>점검 항목</th>
                    <th>최근 판정</th>
                    <th>당월(양호/불량)</th>
                  </tr>
                </thead>
                <tbody>
                  {ioCheckSummary.checkResults.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700, color: '#475569' }}>{c.no}</td>
                      <td style={{ textAlign: 'left', fontWeight: 600, color: '#0f172a', whiteSpace: 'normal', lineHeight: 1.3 }} title={c.fullText}>
                        {c.shortText}
                      </td>
                      <td>
                        {c.latestOk === null ? (
                          <span style={{ color: '#94a3b8', fontSize: '11px' }}>미기록</span>
                        ) : c.latestOk ? (
                          <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: '4px', padding: '1px 6px', fontWeight: 800, fontSize: '11px' }}>양호</span>
                        ) : (
                          <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '4px', padding: '1px 6px', fontWeight: 800, fontSize: '11px' }}>불량</span>
                        )}
                      </td>
                      <td translate="no" style={{ fontWeight: 700, color: '#334155' }}>
                        <span style={{ color: '#059669' }}>{c.passCount}</span>
                        {' / '}
                        <span style={{ color: c.failCount > 0 ? '#dc2626' : '#94a3b8' }}>{c.failCount}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {ioCheckSummary.activeAlarms.length > 0 && (
                <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: '6px', padding: '6px 10px', fontSize: '11.5px' }}>
                  <div style={{ fontWeight: 800, color: '#be123c', marginBottom: '2px' }}>경보장치 이상 발생 이력</div>
                  {ioCheckSummary.activeAlarms.map((a, idx) => (
                    <div key={idx} style={{ color: '#1e293b', fontWeight: 600 }}>
                      • {a.symptom || '-'} → <span style={{ color: '#0369a1' }}>{a.action || '-'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 하단 행: [3] 고무 종류별 현재 재고 현황 | [4] 입고·출고 현황 */}
        <div className="fmb-wb-row-btm">
          {/* 3. 고무 종류별 현재 재고 현황 */}
          <div className="fmb-wb-panel">
            <div className="fmb-wb-panel-hd">
              <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>3. 고무 종류별 현재 재고 현황</span>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '999px', padding: '1px 10px' }}>
                <span>총 재고</span>: <strong translate="no">{formatKg(stockSummary.totalKg)} kg</strong>
              </span>
            </div>

            <div style={{ flex: 1, minHeight: 0, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px', flexShrink: 0 }}>
                {stockSummary.grades.map((g) => {
                  const active = g.kg > 0 || g.lotCount > 0;
                  return (
                    <div
                      key={g.code}
                      style={{
                        background: active ? '#f0fdf4' : '#f8fafc',
                        border: `1px solid ${active ? '#86efac' : '#e2e8f0'}`,
                        borderRadius: '8px',
                        padding: '8px 10px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '3px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                        <strong translate="no" style={{ fontSize: '12px', color: '#0f172a' }}>{g.code}</strong>
                        <span style={{ fontSize: '10.5px', fontWeight: 700, color: active ? '#047857' : '#94a3b8' }}>{`${g.lotCount}건`}</span>
                      </div>
                      <div translate="no" style={{ fontSize: '17px', fontWeight: 900, color: active ? '#047857' : '#94a3b8' }}>
                        {formatKg(g.kg)} kg
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>
                        {g.earliestExpiry ? (
                          <><span>선입 유효기간</span>: <strong translate="no" style={{ color: '#dc2626' }}>{g.earliestExpiry}</strong></>
                        ) : (
                          <span>보유 재고 없음</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                <table className="fmb-wb-table">
                  <colgroup>
                    <col style={{ width: '32px' }} />
                    <col style={{ width: '56px' }} />
                    <col />
                    <col style={{ width: '68px' }} />
                    <col style={{ width: '80px' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>구분</th>
                      <th>고무명</th>
                      <th>유효기간</th>
                      <th>수량(kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockSummary.sortedRows.length > 0 ? (
                      stockSummary.sortedRows.map((r, idx) => (
                        <tr key={r.stockId || idx}>
                          <td style={{ fontWeight: 700, color: '#475569' }}>{idx + 1}</td>
                          <td>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: r.dispType === '재고' ? '#1d4ed8' : r.dispType === '입고' ? '#047857' : '#b45309'
                              }}
                            >
                              {r.dispType}
                            </span>
                          </td>
                          <td translate="no" style={{ fontWeight: 800, color: '#0f172a' }}>{r.code}</td>
                          <td translate="no" style={{ fontWeight: 700, color: '#dc2626' }}>{r.expiry || '-'}</td>
                          <td translate="no" style={{ textAlign: 'right', paddingRight: '8px', fontWeight: 800, color: '#0f172a' }}>{r.amountDisp}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ padding: '18px 8px', color: '#94a3b8', fontWeight: 600 }}>
                          현재 등록된 고무실 재고가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 4. 당월 입고 · 출고(불출) 현황 */}
          <div className="fmb-wb-panel">
            <div className="fmb-wb-panel-hd">
              <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>4. 입고 · 출고(불출) 현황</span>
              <div style={{ display: 'flex', gap: '6px', fontSize: '11.5px', fontWeight: 800 }}>
                <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: '999px', padding: '1px 9px' }}>
                  <span>당월 입고</span> <strong translate="no">+{formatKg(ioCheckSummary.inTotalKg)} kg</strong>
                </span>
                <span style={{ background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3', borderRadius: '999px', padding: '1px 9px' }}>
                  <span>당월 출고</span> <strong translate="no">-{formatKg(ioCheckSummary.outTotalKg)} kg</strong>
                </span>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto' }}>
              {/* 품목별 누적 입고 / 출고 요약 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px', flexShrink: 0 }}>
                {ioCheckSummary.ioGrades.slice(0, 3).map((g) => (
                  <div
                    key={g.code}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '6px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}
                  >
                    <strong translate="no" style={{ fontSize: '11.5px', color: '#0f172a' }}>{g.code}</strong>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700 }}>
                      <span style={{ color: '#047857' }}><span>입고</span> <strong translate="no">{formatKg(g.inKg)}kg</strong></span>
                      <span style={{ color: '#be123c' }}><span>출고</span> <strong translate="no">{formatKg(g.outKg)}kg</strong></span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 최근 입고·출고 이력 테이블 */}
              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                <table className="fmb-wb-table">
                  <colgroup>
                    <col style={{ width: '54px' }} />
                    <col style={{ width: '56px' }} />
                    <col />
                    <col style={{ width: '64px' }} />
                    <col style={{ width: '80px' }} />
                    <col style={{ width: '68px' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>일자</th>
                      <th>구분</th>
                      <th>고무명</th>
                      <th>유효기간</th>
                      <th>수량(kg)</th>
                      <th>작성자</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ioCheckSummary.recentLogs.length > 0 ? (
                      ioCheckSummary.recentLogs.map((log, idx) => {
                        const isIn = log.ioKind === '입고';
                        return (
                          <tr key={`${log.date}_${log.code}_${idx}`}>
                            <td translate="no" style={{ fontWeight: 700, color: '#475569' }}>{log.mmdd}</td>
                            <td>
                              <span
                                style={{
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  background: isIn ? '#ecfdf5' : '#fff1f2',
                                  color: isIn ? '#047857' : '#be123c'
                                }}
                              >
                                {log.ioKind}
                              </span>
                            </td>
                            <td translate="no" style={{ fontWeight: 800, color: '#0f172a' }}>{log.code}</td>
                            <td translate="no" style={{ color: '#64748b', fontWeight: 600 }}>{log.expiry || '-'}</td>
                            <td translate="no" style={{ textAlign: 'right', paddingRight: '8px', fontWeight: 800, color: isIn ? '#047857' : '#be123c' }}>
                              {isIn ? '+' : '-'}{log.amountDisp}
                            </td>
                            <td style={{ fontWeight: 600, color: '#334155' }}>{log.worker}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ padding: '18px 8px', color: '#94a3b8', fontWeight: 600 }}>
                          선택된 월의 입고·출고 내역이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
