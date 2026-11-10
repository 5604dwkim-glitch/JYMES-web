import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { formatKg, resolveDayCheckStatus } from './fmbBoardUtils';
import { i18n } from '../../constants/translations';

const BOARD_LEFT_AXIS_WIDTH = 152;
const BOARD_RIGHT_AXIS_WIDTH = 52;

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

  const dayCols = monthly.days.map(() => '<col />').join('');
  const dayHeaders = monthly.days.map((d) => (
    `<th style="padding:1.5px 1px; font-size:7.5px; color:${d.dow === 0 ? '#dc2626' : d.dow === 6 ? '#2563eb' : '#334155'};">${d.day}</th>`
  )).join('');
  const dayTemps = monthly.days.map((d) => {
    const bad = d.tempVal !== null && (d.tempVal < 15 || d.tempVal > 25);
    return `<td translate="no" style="padding:1.5px 1px; font-size:7.5px; font-weight:700; background:${bad ? '#fee2e2' : '#ffffff'}; color:${d.tempVal !== null ? '#dc2626' : '#cbd5e1'};">${d.tempVal ?? '-'}</td>`;
  }).join('');
  const dayHums = monthly.days.map((d) => {
    const bad = d.humVal !== null && (d.humVal < 0 || d.humVal > 70);
    return `<td translate="no" style="padding:1.5px 1px; font-size:7.5px; font-weight:700; background:${bad ? '#fee2e2' : '#ffffff'}; color:${d.humVal !== null ? '#0284c7' : '#cbd5e1'};">${d.humVal ?? '-'}</td>`;
  }).join('');

  const dailyCheckRowsHtml = ioCheckSummary.checkResults.map((c) => {
    const cells = monthly.days.map((d) => {
      const st = resolveDayCheckStatus(d.primary, c);
      if (st === null) {
        return '<td translate="no" style="padding:1.5px 1px; font-size:7.5px; color:#cbd5e1;">-</td>';
      }
      if (st === false) {
        return '<td translate="no" style="padding:1.5px 1px; font-size:7.5px; font-weight:900; color:#dc2626; background:#fef2f2;">X</td>';
      }
      return '<td translate="no" style="padding:1.5px 1px; font-size:7.5px; font-weight:800; color:#059669;">O</td>';
    }).join('');
    const sumCell = c.passCount === 0 && c.failCount === 0
      ? '-'
      : `<span style="color:#059669;">${c.passCount}</span>/<span style="color:${c.failCount > 0 ? '#dc2626' : '#64748b'};">${c.failCount}</span>`;
    return `
      <tr>
        <th style="text-align:left; padding:1.5px 4px; font-size:7.5px; font-weight:700; background:#f8fafc; color:#1e293b;">${escapeHtml(c.rowLabel)}</th>
        ${cells}
        <td translate="no" style="padding:1.5px 2px; font-size:7.5px; font-weight:700; background:#f8fafc;">${sumCell}</td>
      </tr>
    `;
  }).join('');

  const gradeCardsHtml = stockSummary.grades.map((g) => `
    <div style="border:1px solid #94a3b8; border-radius:4px; padding:3px 6px; background:${g.kg > 0 ? '#f0fdf4' : '#f8fafc'}; display:flex; justify-content:space-between; align-items:center;">
      <div style="min-width:0;">
        <div translate="no" style="font-size:9px; font-weight:800; color:#0f172a;">${escapeHtml(g.code)}</div>
        <div style="font-size:7.5px; color:#64748b;">${g.lotCount}건${g.earliestExpiry ? ` · 선입 ${escapeHtml(g.earliestExpiry)}` : ''}</div>
      </div>
      <div translate="no" style="font-size:10.5px; font-weight:800; color:${g.kg > 0 ? '#047857' : '#94a3b8'}; white-space:nowrap;">${formatKg(g.kg)} kg</div>
    </div>
  `).join('');

  const stockRowsHtml = stockSummary.sortedRows.slice(0, 6).map((r, idx) => `
    <tr>
      <td style="text-align:center; font-weight:700;">${idx + 1}</td>
      <td style="text-align:center; font-weight:700; color:${r.dispType === '재고' ? '#1d4ed8' : '#047857'};">${escapeHtml(r.dispType)}</td>
      <td translate="no" style="text-align:center; font-weight:800;">${escapeHtml(r.code)}</td>
      <td translate="no" style="text-align:center;">${escapeHtml(r.expiry || '-')}</td>
      <td translate="no" style="text-align:right; font-weight:800; padding-right:5px;">${escapeHtml(r.amountDisp)}</td>
    </tr>
  `).join('') || '<tr><td colspan="5" style="text-align:center; color:#64748b; padding:8px;">현재 등록된 보관실 재고 없음</td></tr>';

  const ioRowsHtml = ioCheckSummary.recentLogs.slice(0, 6).map((l) => {
    const isIn = l.ioKind === '입고';
    const qtyText = l.kg > 0 ? `${isIn ? '+' : '-'}${l.amountDisp}` : l.amountDisp;
    return `
      <tr>
        <td translate="no" style="text-align:center;">${escapeHtml(l.mmdd)}</td>
        <td style="text-align:center; font-weight:800; color:${isIn ? '#047857' : '#be123c'};">${escapeHtml(l.ioKind)}</td>
        <td translate="no" style="text-align:center; font-weight:800;">${escapeHtml(l.code)}</td>
        <td translate="no" style="text-align:center;">${escapeHtml(l.expiry || '-')}</td>
        <td translate="no" style="text-align:right; font-weight:800; padding-right:5px; color:${l.kg > 0 ? (isIn ? '#047857' : '#be123c') : '#64748b'};">${escapeHtml(qtyText)}</td>
        <td style="text-align:center;">${escapeHtml(l.worker)}</td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="6" style="text-align:center; color:#64748b; padding:8px;">해당 월 입·출고 기록 없음</td></tr>';

  const alarmLogs = Array.isArray(ioCheckSummary.alarmLogs) ? ioCheckSummary.alarmLogs : [];
  const alarmRowsHtml = alarmLogs.slice(0, 6).map((a) => `
    <tr>
      <td translate="no" style="text-align:center; font-weight:700;">${escapeHtml(a.mmdd || '-')}</td>
      <td style="text-align:center; font-weight:800; color:#be123c;">${escapeHtml(a.symptom || '-')}</td>
      <td style="text-align:center; font-weight:700; color:#0369a1;">${escapeHtml(a.action || '-')}</td>
      <td style="text-align:center;">${escapeHtml(a.worker || '-')}</td>
    </tr>
  `).join('') || '<tr><td colspan="4" style="text-align:center; color:#64748b; padding:8px;">등록된 경보장치 이상발생 및 조치 이력 없음</td></tr>';

  const totalIssueCnt = alarmLogs.length + (ioCheckSummary.totalCheckFailCount || 0) + (ioCheckSummary.outOfSpecDays || 0);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8" />
      <title>FMB보관실 통합 현황판 (${monthly.year}-${String(monthly.month).padStart(2, '0')})</title>
      <style>
        @page { size: A4 landscape; margin: 5mm 7mm; }
        * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body { margin: 0; padding: 0; font-family: 'Pretendard', -apple-system, 'Malgun Gothic', sans-serif; color: #0f172a; background: #fff; font-size: 9px; line-height: 1.22; letter-spacing: -0.025em; }
        .sheet { width: 100%; display: flex; flex-direction: column; gap: 5px; }
        .top-bar { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0f172a; padding-bottom: 3px; }
        .kpi-row { display: flex; gap: 5px; align-items: center; }
        .kpi-pill { border: 1px solid #cbd5e1; border-radius: 4px; padding: 2px 7px; background: #f8fafc; font-weight: 700; font-size: 9px; }
        .grid-top { display: grid; grid-template-columns: 214px minmax(0, 1fr); gap: 6px; align-items: stretch; }
        .grid-btm { display: grid; grid-template-columns: 1.05fr 1.15fr 0.95fr; gap: 6px; align-items: stretch; }
        .panel { border: 1px solid #334155; border-radius: 5px; overflow: hidden; display: flex; flex-direction: column; background: #fff; }
        .panel-hd { background: #f1f5f9; border-bottom: 1px solid #64748b; padding: 3.5px 7px; font-size: 9.5px; font-weight: 800; display: flex; justify-content: space-between; align-items: center; gap: 4px; }
        .panel-bd { padding: 4px 5px; flex: 1; display: flex; flex-direction: column; }
        table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        th, td { border: 1px solid #cbd5e1; padding: 2px 2.5px; font-size: 8.2px; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        th { background: #f8fafc; font-weight: 800; color: #334155; }
      </style>
    </head>
    <body>
      <div class="sheet">
        <div class="top-bar">
          <div>
            <div style="font-size:14px; font-weight:900; letter-spacing:-0.02em;">FMB 보관실 통합 관리 현황판 (${monthly.year}년 ${monthly.month}월)</div>
            <div style="font-size:8.5px; color:#475569;">관리기준: 온도 20±5℃ (15~25℃) · 습도 70% 이하 · 유효기간 10일 이내 (선입선출) | 출력일시: ${escapeHtml(printedAt)}</div>
          </div>
          <div class="kpi-row">
            <div class="kpi-pill">최근 온도: <strong translate="no" style="color:#dc2626;">${escapeHtml(curTemp)}</strong></div>
            <div class="kpi-pill">최근 습도: <strong translate="no" style="color:#0284c7;">${escapeHtml(curHum)}</strong></div>
            <div class="kpi-pill">월 평균: <strong translate="no">${monthly.avgTemp !== null ? `${monthly.avgTemp}℃` : '-'} / ${monthly.avgHum !== null ? `${monthly.avgHum}%` : '-'}</strong></div>
            <div class="kpi-pill" style="background:#ecfdf5; border-color:#6ee7b7;">현재 총 재고: <strong translate="no" style="color:#047857;">${formatKg(stockSummary.totalKg)} kg</strong></div>
          </div>
        </div>

        <div class="grid-top">
          <!-- 좌측: FMB 보관실 관리 표준 -->
          <div class="panel">
            <div class="panel-hd" style="justify-content:center; font-size:10px;">FMB 보관실 관리 표준</div>
            <table style="border:0;">
              <thead>
                <tr>
                  <th style="width:19%; border-left:0;">구분</th>
                  <th style="width:22%;">유효기간</th>
                  <th style="width:41%;">관리 기준</th>
                  <th style="width:18%; border-right:0;">비고</th>
                </tr>
              </thead>
              <tbody>
                <tr style="font-weight:700;">
                  <td style="border-left:0; line-height:1.25; white-space:normal;">조인트<br/>고무</td>
                  <td style="color:#dc2626; font-weight:800;">10일 이내</td>
                  <td style="text-align:left; padding:3px 4px; line-height:1.35; white-space:normal; font-size:7.8px;">
                    <div>온도 : 20 ± 5℃ <span translate="no" style="color:#64748b;">(15~25℃)</span></div>
                    <div>습도 : 70% 이하</div>
                  </td>
                  <td style="border-right:0; font-weight:800;">1회/일</td>
                </tr>
              </tbody>
            </table>
            <div style="padding:7px 8px; font-size:8.5px; line-height:1.55; font-weight:600; color:#1e293b; flex:1; display:flex; flex-direction:column; justify-content:center; gap:3px;">
              <div>1. 연고무 <strong style="color:#1d4ed8;">중량 표준</strong>에 따른 작업실시</div>
              <div>2. FMB <strong style="color:#dc2626;">유효기간 준수</strong> (미준수품 반납)</div>
              <div>3. 보관실 <strong style="color:#1d4ed8;">점검 주기는 1회/일</strong> (시업전)</div>
              <div>4. 온습도 유지를 위해 <strong style="color:#1d4ed8;">DOOR 상시 닫음</strong></div>
            </div>
          </div>

          <!-- 우측: 월간 온·습도 추이 및 일일 점검 현황 -->
          <div class="panel">
            <div class="panel-hd">
              <span>월간 온·습도 추이 및 일일 점검 현황</span>
              <span style="font-size:8.5px; color:#475569;"><span>점검표기: O 양호 / X 불량</span> | <span>기록일수</span>: <strong translate="no">${monthly.recordedDays}/${monthly.daysInMonth}</strong></span>
            </div>
            <div class="panel-bd">
              ${chartDataUrl ? `<img src="${chartDataUrl}" alt="온습도 그래프" style="width:100%; height:118px; object-fit:fill; display:block; margin-bottom:3px;" />` : ''}
              <table>
                <colgroup>
                  <col style="width:108px;" />${dayCols}<col style="width:36px;" />
                </colgroup>
                <thead>
                  <tr><th>구분 / 일자</th>${dayHeaders}<th>평균/집계</th></tr>
                </thead>
                <tbody>
                  <tr><th style="background:#fef2f2; color:#b91c1c;">온도(℃)</th>${dayTemps}<td translate="no" style="font-weight:800; color:#b91c1c;">${monthly.avgTemp !== null ? monthly.avgTemp : '-'}</td></tr>
                  <tr><th style="background:#f0f9ff; color:#0369a1;">습도(%)</th>${dayHums}<td translate="no" style="font-weight:800; color:#0369a1;">${monthly.avgHum !== null ? monthly.avgHum : '-'}</td></tr>
                  ${dailyCheckRowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="grid-btm">
          <!-- 하단 1: 재고 현황 -->
          <div class="panel">
            <div class="panel-hd">
              <span>1. 고무 종류별 현재 재고 현황</span>
              <span style="font-size:8.5px; color:#047857;">총 재고: ${formatKg(stockSummary.totalKg)} kg</span>
            </div>
            <div class="panel-bd">
              <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:4px; margin-bottom:4px;">
                ${gradeCardsHtml}
              </div>
              <table>
                <colgroup>
                  <col style="width:22px;" /><col style="width:38px;" /><col /><col style="width:46px;" /><col style="width:54px;" />
                </colgroup>
                <thead>
                  <tr><th>No</th><th>구분</th><th>고무명</th><th>유효기간</th><th>수량(kg)</th></tr>
                </thead>
                <tbody>${stockRowsHtml}</tbody>
              </table>
            </div>
          </div>

          <!-- 하단 2: 입·출고 현황 -->
          <div class="panel">
            <div class="panel-hd">
              <span>2. 입고 · 출고(불출) 현황</span>
              <span style="font-size:8.5px;">입고 <strong translate="no" style="color:#047857;">+${formatKg(ioCheckSummary.inTotalKg)}kg</strong> · 출고 <strong translate="no" style="color:#be123c;">-${formatKg(ioCheckSummary.outTotalKg)}kg</strong></span>
            </div>
            <div class="panel-bd">
              <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:4px; margin-bottom:4px;">
                ${ioCheckSummary.ioGrades.slice(0, 3).map((g) => `
                  <div style="border:1px solid #cbd5e1; border-radius:4px; padding:3px 5px; background:#f8fafc; display:flex; flex-direction:column; gap:1px; font-size:8px;">
                    <strong translate="no" style="color:#0f172a;">${escapeHtml(g.code)}</strong>
                    <span translate="no"><strong style="color:#047857;">+${formatKg(g.inKg)}</strong> / <strong style="color:#be123c;">-${formatKg(g.outKg)}</strong> kg</span>
                  </div>
                `).join('')}
              </div>
              <table>
                <colgroup>
                  <col style="width:36px;" /><col style="width:36px;" /><col /><col style="width:44px;" /><col style="width:54px;" /><col style="width:44px;" />
                </colgroup>
                <thead>
                  <tr><th>일자</th><th>구분</th><th>고무명</th><th>유효기간</th><th>수량(kg)</th><th>작성자</th></tr>
                </thead>
                <tbody>${ioRowsHtml}</tbody>
              </table>
            </div>
          </div>

          <!-- 하단 3: 이상발생 · 조치 현황 -->
          <div class="panel">
            <div class="panel-hd">
              <span>3. 이상발생 · 조치 현황</span>
              <span style="font-size:8.5px; color:${totalIssueCnt > 0 ? '#be123c' : '#047857'};">${totalIssueCnt > 0 ? `<span>⚠️ 이상 발생</span> <strong translate="no">${totalIssueCnt}</strong>` : '<span>이상 없음 (정상)</span>'}</span>
            </div>
            <div class="panel-bd">
              <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:4px; margin-bottom:4px;">
                <div style="border:1px solid #cbd5e1; border-radius:4px; padding:3px 5px; background:${alarmLogs.length > 0 ? '#fff1f2' : '#f8fafc'}; display:flex; justify-content:space-between; align-items:center; font-size:8px;">
                  <span>경보 이상</span><strong style="color:${alarmLogs.length > 0 ? '#be123c' : '#059669'};">${alarmLogs.length}건</strong>
                </div>
                <div style="border:1px solid #cbd5e1; border-radius:4px; padding:3px 5px; background:${(ioCheckSummary.totalCheckFailCount || 0) > 0 ? '#fff1f2' : '#f8fafc'}; display:flex; justify-content:space-between; align-items:center; font-size:8px;">
                  <span>점검 불량</span><strong style="color:${(ioCheckSummary.totalCheckFailCount || 0) > 0 ? '#be123c' : '#059669'};">${ioCheckSummary.totalCheckFailCount || 0}건</strong>
                </div>
                <div style="border:1px solid #cbd5e1; border-radius:4px; padding:3px 5px; background:${(ioCheckSummary.outOfSpecDays || 0) > 0 ? '#fff1f2' : '#f8fafc'}; display:flex; justify-content:space-between; align-items:center; font-size:8px;">
                  <span>기준 이탈</span><strong style="color:${(ioCheckSummary.outOfSpecDays || 0) > 0 ? '#be123c' : '#059669'};">${ioCheckSummary.outOfSpecDays || 0}일</strong>
                </div>
              </div>
              <table>
                <colgroup>
                  <col style="width:38px;" /><col /><col /><col style="width:44px;" />
                </colgroup>
                <thead>
                  <tr><th>일자</th><th>이상 현상</th><th>조치 현황</th><th>작성자</th></tr>
                </thead>
                <tbody>${alarmRowsHtml}</tbody>
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

  // 하단 일일 표의 좌측(점검항목명 152px)·우측(평균/집계 52px) 열 폭과 그래프 좌·우 Y축 폭을 1:1 고정 정렬
  const boardChartOptions = useMemo(() => ({
    ...chartOptions,
    onClick: (_evt, elements) => {
      if (!elements || elements.length === 0) return;
      const idx = elements[0].index;
      const dayInfo = monthly.days[idx];
      if (dayInfo?.primary) {
        onOpenDetail?.(dayInfo.primary);
      }
    },
    scales: {
      ...chartOptions?.scales,
      yTemp: {
        ...chartOptions?.scales?.yTemp,
        afterFit: (scale) => {
          scale.width = BOARD_LEFT_AXIS_WIDTH;
        }
      },
      yHum: {
        ...chartOptions?.scales?.yHum,
        afterFit: (scale) => {
          scale.width = BOARD_RIGHT_AXIS_WIDTH;
        }
      }
    }
  }), [chartOptions, monthly.days, onOpenDetail]);

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

  const alarmLogs = Array.isArray(ioCheckSummary.alarmLogs) ? ioCheckSummary.alarmLogs : [];
  const noteLogs = Array.isArray(ioCheckSummary.noteLogs) ? ioCheckSummary.noteLogs : [];
  const totalCheckFailCount = ioCheckSummary.totalCheckFailCount || 0;
  const outOfSpecDays = ioCheckSummary.outOfSpecDays || 0;
  const totalIssueCount = alarmLogs.length + totalCheckFailCount + outOfSpecDays;

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
          grid-template-rows: minmax(375px, 1.34fr) minmax(235px, 0.86fr);
          gap: 10px;
        }
        [data-fmb-status-board="1"] .fmb-wb-row-top {
          display: grid;
          grid-template-columns: 292px minmax(0, 1fr);
          gap: 10px;
          min-height: 0;
        }
        [data-fmb-status-board="1"] .fmb-wb-row-btm {
          display: grid;
          grid-template-columns: 1.05fr 1.15fr 0.95fr;
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
          padding: 7px 12px;
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
          padding: 3.5px 5px;
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
        [data-fmb-status-board="1"] .fmb-wb-daily-grid th,
        [data-fmb-status-board="1"] .fmb-wb-daily-grid td {
          padding: 2.5px 1px;
          font-size: 10.5px;
          line-height: 1.25;
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
        @media (max-width: 1220px) {
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

      {/* ── 본문 통합 상황판 ── */}
      <div className="fmb-wb-body">
        {/* 상단 행: [좌측] FMB 보관실 관리 표준 | [우측 전체폭] 월간 온·습도 추이 그래프 + 일일 점검 항목별 기록표 */}
        <div className="fmb-wb-row-top">
          {/* 좌측: FMB 보관실 관리 표준 (#9004 작업일보 동일 표준 카드) */}
          <div className="fmb-wb-panel" style={{ border: '1px solid #94a3b8', wordBreak: 'keep-all' }}>
            <div
              style={{
                background: '#f1f5f9',
                borderBottom: '1px solid #cbd5e1',
                padding: '8px 12px',
                textAlign: 'center',
                fontSize: '13.5px',
                fontWeight: 800,
                color: '#0f172a',
                flexShrink: 0
              }}
            >
              FMB 보관실 관리 표준
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'center', color: '#0f172a', flexShrink: 0 }}>
              <thead>
                <tr style={{ background: '#f8fafc', fontWeight: 700, color: '#334155' }}>
                  <th style={{ borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #e2e8f0', padding: '6px 4px', width: '18%', whiteSpace: 'nowrap' }}>구분</th>
                  <th style={{ borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #e2e8f0', padding: '6px 4px', width: '23%', whiteSpace: 'nowrap' }}>유효기간</th>
                  <th style={{ borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #e2e8f0', padding: '6px 5px', width: '42%', whiteSpace: 'nowrap' }}>관리 기준</th>
                  <th style={{ borderBottom: '1px solid #cbd5e1', padding: '6px 4px', width: '17%', whiteSpace: 'nowrap' }}>비고</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: '#ffffff', fontWeight: 700 }}>
                  <td style={{ borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #e2e8f0', padding: '8px 4px', lineHeight: 1.35, whiteSpace: 'nowrap' }}>
                    조인트<br />고무
                  </td>
                  <td style={{ borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #e2e8f0', padding: '8px 4px', color: '#dc2626', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    10일 이내
                  </td>
                  <td style={{ borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #e2e8f0', padding: '8px 6px', textAlign: 'left', lineHeight: 1.45, fontSize: '11.5px' }}>
                    <div>
                      <span>온도 : 20 ± 5℃</span>{' '}
                      <span translate="no" style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>(15~25℃)</span>
                    </div>
                    <div>습도 : 70% 이하</div>
                  </td>
                  <td style={{ borderBottom: '1px solid #cbd5e1', padding: '8px 4px', fontWeight: 800, whiteSpace: 'nowrap' }}>
                    1회/일
                  </td>
                </tr>
              </tbody>
            </table>

            <div
              style={{
                padding: '12px 14px',
                fontSize: '12.5px',
                lineHeight: 1.55,
                color: '#1e293b',
                fontWeight: 600,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '8px',
                background: '#ffffff'
              }}
            >
              <div>
                <span>1. 연고무</span>{' '}
                <strong style={{ color: '#1d4ed8', fontWeight: 700 }}>중량 표준</strong>
                <span>에 따른 작업실시</span>
              </div>
              <div>
                2. FMB <strong style={{ color: '#dc2626', fontWeight: 700 }}>유효기간 준수</strong>{' '}
                <span>(미준수품 반납)</span>
              </div>
              <div>
                <span>3. 보관실</span>{' '}
                <strong style={{ color: '#1d4ed8', fontWeight: 700 }}>점검 주기는 1회/일</strong>{' '}
                <span>(시업전)</span>
              </div>
              <div>
                <span>4. 온습도 유지를 위해</span>{' '}
                <strong style={{ color: '#1d4ed8', fontWeight: 700 }}>DOOR 상시 닫음</strong>
              </div>
            </div>
          </div>

          {/* 우측 전체폭: 월간 온·습도 추이 그래프 + 일일 점검 항목별 기록 현황 */}
          <div className="fmb-wb-panel">
            <div className="fmb-wb-panel-hd">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>월간 온·습도 추이 및 일일 점검 현황</span>
                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>점검표기: O 양호 / X 불량 · 일자 클릭 시 상세 일보 열람</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', fontSize: '11.5px', fontWeight: 700, flexWrap: 'wrap' }}>
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

            <div style={{ flex: 1, minHeight: 0, padding: '6px 12px 8px', overflowX: 'auto', display: 'flex', flexDirection: 'column' }}>
              <div style={{ minWidth: '880px', width: '100%', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {/* 상단: 월간 온·습도 복합 추이 그래프 */}
                <div style={{ flex: 1, minHeight: '135px', position: 'relative', width: '100%' }}>
                  <Bar
                    ref={boardChartRef}
                    data={chartData}
                    plugins={valueLabelsPlugin}
                    options={boardChartOptions}
                  />
                </div>

                {/* 하단: 1일~말일 온도·습도 + 6개 일일 점검 항목 통합 표 (그래프 X축과 1:1 열 정렬) */}
                <table className="fmb-wb-table fmb-wb-daily-grid" style={{ width: '100%', flexShrink: 0 }}>
                  <colgroup>
                    <col style={{ width: `${BOARD_LEFT_AXIS_WIDTH}px` }} />
                    {monthly.days.map((d) => <col key={d.day} />)}
                    <col style={{ width: `${BOARD_RIGHT_AXIS_WIDTH}px` }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>구분 / 일자</th>
                      {monthly.days.map((d) => (
                        <th
                          key={d.day}
                          onClick={() => d.primary && onOpenDetail?.(d.primary)}
                          style={{
                            cursor: d.primary ? 'pointer' : 'default',
                            background: d.isToday ? '#d1fae5' : '#f8fafc',
                            color: d.isToday ? '#047857' : d.dow === 0 ? '#dc2626' : d.dow === 6 ? '#2563eb' : '#334155'
                          }}
                        >
                          {d.day}
                        </th>
                      ))}
                      <th>평균/집계</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* 온도(℃) 행 */}
                    <tr>
                      <th style={{ background: '#fef2f2', color: '#b91c1c', textAlign: 'left', paddingLeft: '7px' }}>온도(℃)</th>
                      {monthly.days.map((d) => {
                        const outSpec = d.tempVal !== null && (d.tempVal < 15 || d.tempVal > 25);
                        return (
                          <td
                            key={d.day}
                            onClick={() => d.primary && onOpenDetail?.(d.primary)}
                            translate="no"
                            style={{
                              cursor: d.primary ? 'pointer' : 'default',
                              fontWeight: 700,
                              background: outSpec ? '#fee2e2' : d.isToday ? 'rgba(209, 250, 229, 0.22)' : '#ffffff',
                              color: d.tempVal !== null ? '#dc2626' : '#cbd5e1'
                            }}
                          >
                            {d.tempVal !== null ? d.tempVal : '-'}
                          </td>
                        );
                      })}
                      <td translate="no" style={{ background: '#fef2f2', fontWeight: 800, color: '#b91c1c' }}>
                        {monthly.avgTemp !== null ? `${monthly.avgTemp}°` : '-'}
                      </td>
                    </tr>

                    {/* 습도(%) 행 */}
                    <tr>
                      <th style={{ background: '#f0f9ff', color: '#0369a1', textAlign: 'left', paddingLeft: '7px' }}>습도(%)</th>
                      {monthly.days.map((d) => {
                        const outSpec = d.humVal !== null && (d.humVal < 0 || d.humVal > 70);
                        return (
                          <td
                            key={d.day}
                            onClick={() => d.primary && onOpenDetail?.(d.primary)}
                            translate="no"
                            style={{
                              cursor: d.primary ? 'pointer' : 'default',
                              fontWeight: 700,
                              background: outSpec ? '#fee2e2' : d.isToday ? 'rgba(209, 250, 229, 0.22)' : '#ffffff',
                              color: d.humVal !== null ? '#0284c7' : '#cbd5e1'
                            }}
                          >
                            {d.humVal !== null ? d.humVal : '-'}
                          </td>
                        );
                      })}
                      <td translate="no" style={{ background: '#f0f9ff', fontWeight: 800, color: '#0369a1' }}>
                        {monthly.avgHum !== null ? `${monthly.avgHum}%` : '-'}
                      </td>
                    </tr>

                    {/* 일일 점검 6개 항목 행 */}
                    {ioCheckSummary.checkResults.map((c) => (
                      <tr key={c.id}>
                        <th
                          title={c.fullText}
                          style={{
                            textAlign: 'left',
                            paddingLeft: '7px',
                            background: '#f8fafc',
                            color: '#1e293b',
                            fontWeight: 700,
                            letterSpacing: '-0.03em'
                          }}
                        >
                          {c.rowLabel}
                        </th>
                        {monthly.days.map((d) => {
                          const st = resolveDayCheckStatus(d.primary, c);
                          return (
                            <td
                              key={d.day}
                              onClick={() => d.primary && onOpenDetail?.(d.primary)}
                              title={
                                d.primary
                                  ? `${d.fullDate} | ${c.shortText}: ${st === false ? '불량 (X)' : '양호 (O)'}`
                                  : `${d.fullDate} 미기록`
                              }
                              translate="no"
                              style={{
                                cursor: d.primary ? 'pointer' : 'default',
                                fontWeight: st === false ? 900 : st === true ? 800 : 400,
                                background: st === false ? '#fef2f2' : d.isToday ? 'rgba(209, 250, 229, 0.22)' : '#ffffff',
                                color: st === false ? '#dc2626' : st === true ? '#059669' : '#cbd5e1'
                              }}
                            >
                              {st === null ? '-' : st ? 'O' : 'X'}
                            </td>
                          );
                        })}
                        <td translate="no" style={{ background: '#f8fafc', fontWeight: 700, fontSize: '10px', color: '#334155' }}>
                          {c.passCount === 0 && c.failCount === 0 ? (
                            '-'
                          ) : (
                            <>
                              <span style={{ color: '#059669' }}>{c.passCount}</span>
                              {'/'}
                              <span style={{ color: c.failCount > 0 ? '#dc2626' : '#94a3b8' }}>{c.failCount}</span>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 행 3분할 가로 배치: [1] 재고 현황 | [2] 입·출고 현황 | [3] 이상발생 · 조치 현황 */}
        <div className="fmb-wb-row-btm">
          {/* 1. 고무 종류별 현재 재고 현황 */}
          <div className="fmb-wb-panel">
            <div className="fmb-wb-panel-hd">
              <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>1. 고무 종류별 현재 재고 현황</span>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '999px', padding: '1px 9px' }}>
                <span>총 재고</span>: <strong translate="no">{formatKg(stockSummary.totalKg)} kg</strong>
              </span>
            </div>

            <div style={{ flex: 1, minHeight: 0, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '7px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px', flexShrink: 0 }}>
                {stockSummary.grades.map((g) => {
                  const active = g.kg > 0 || g.lotCount > 0;
                  return (
                    <div
                      key={g.code}
                      style={{
                        background: active ? '#f0fdf4' : '#f8fafc',
                        border: `1px solid ${active ? '#86efac' : '#e2e8f0'}`,
                        borderRadius: '7px',
                        padding: '6px 8px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        minWidth: 0
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '4px' }}>
                        <strong translate="no" style={{ fontSize: '11.5px', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.code}</strong>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: active ? '#047857' : '#94a3b8', flexShrink: 0 }}>{`${g.lotCount}건`}</span>
                      </div>
                      <div translate="no" style={{ fontSize: '15px', fontWeight: 900, color: active ? '#047857' : '#94a3b8' }}>
                        {formatKg(g.kg)} kg
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {g.earliestExpiry ? (
                          <><span>선입</span>: <strong translate="no" style={{ color: '#dc2626' }}>{g.earliestExpiry}</strong></>
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
                    <col style={{ width: '28px' }} />
                    <col style={{ width: '48px' }} />
                    <col />
                    <col style={{ width: '60px' }} />
                    <col style={{ width: '72px' }} />
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
                          <td translate="no" style={{ textAlign: 'right', paddingRight: '7px', fontWeight: 800, color: '#0f172a' }}>{r.amountDisp}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ padding: '16px 8px', color: '#94a3b8', fontWeight: 600 }}>
                          현재 등록된 고무실 재고가 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 2. 입고 · 출고(불출) 현황 */}
          <div className="fmb-wb-panel">
            <div className="fmb-wb-panel-hd">
              <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>2. 입고 · 출고(불출) 현황</span>
              <div style={{ display: 'flex', gap: '5px', fontSize: '11px', fontWeight: 800 }}>
                <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: '999px', padding: '1px 8px' }}>
                  <span>입고</span> <strong translate="no">+{formatKg(ioCheckSummary.inTotalKg)} kg</strong>
                </span>
                <span style={{ background: '#fff1f2', color: '#be123c', border: '1px solid #fecdd3', borderRadius: '999px', padding: '1px 8px' }}>
                  <span>출고</span> <strong translate="no">-{formatKg(ioCheckSummary.outTotalKg)} kg</strong>
                </span>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '7px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px', flexShrink: 0 }}>
                {ioCheckSummary.ioGrades.slice(0, 3).map((g) => (
                  <div
                    key={g.code}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '7px',
                      padding: '6px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      minWidth: 0
                    }}
                  >
                    <strong translate="no" style={{ fontSize: '11.5px', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.code}</strong>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', fontWeight: 700, gap: '4px' }}>
                      <span style={{ color: '#047857' }}><span>입고</span> <strong translate="no">{formatKg(g.inKg)}kg</strong></span>
                      <span style={{ color: '#be123c' }}><span>출고</span> <strong translate="no">{formatKg(g.outKg)}kg</strong></span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                <table className="fmb-wb-table">
                  <colgroup>
                    <col style={{ width: '46px' }} />
                    <col style={{ width: '48px' }} />
                    <col />
                    <col style={{ width: '56px' }} />
                    <col style={{ width: '70px' }} />
                    <col style={{ width: '58px' }} />
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
                        const qtyText = log.kg > 0 ? `${isIn ? '+' : '-'}${log.amountDisp}` : log.amountDisp;
                        return (
                          <tr key={`${log.date}_${log.code}_${idx}`}>
                            <td translate="no" style={{ fontWeight: 700, color: '#475569' }}>{log.mmdd}</td>
                            <td>
                              <span
                                style={{
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  fontSize: '10.5px',
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
                            <td
                              translate="no"
                              style={{
                                textAlign: 'right',
                                paddingRight: '7px',
                                fontWeight: 800,
                                color: log.kg > 0 ? (isIn ? '#047857' : '#be123c') : '#94a3b8'
                              }}
                            >
                              {qtyText}
                            </td>
                            <td style={{ fontWeight: 600, color: '#334155' }}>{log.worker}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ padding: '16px 8px', color: '#94a3b8', fontWeight: 600 }}>
                          선택된 월의 입고·출고 내역이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 3. 이상발생 · 조치 현황 */}
          <div className="fmb-wb-panel">
            <div className="fmb-wb-panel-hd">
              <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#0f172a' }}>3. 이상발생 · 조치 현황</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '1px 9px',
                  borderRadius: '999px',
                  background: totalIssueCount > 0 ? '#fff1f2' : '#ecfdf5',
                  color: totalIssueCount > 0 ? '#be123c' : '#047857',
                  border: `1px solid ${totalIssueCount > 0 ? '#fecdd3' : '#a7f3d0'}`
                }}
              >
                {totalIssueCount > 0 ? (
                  <><span>⚠️ 이상 발생</span> <strong translate="no">{totalIssueCount}</strong></>
                ) : (
                  <span>✅ 이상 없음 (정상)</span>
                )}
              </span>
            </div>

            <div style={{ flex: 1, minHeight: 0, padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: '7px', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '6px', flexShrink: 0 }}>
                <div
                  style={{
                    background: alarmLogs.length > 0 ? '#fff1f2' : '#f8fafc',
                    border: `1px solid ${alarmLogs.length > 0 ? '#fecdd3' : '#e2e8f0'}`,
                    borderRadius: '7px',
                    padding: '6px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#475569' }}>경보 이상</span>
                  <strong style={{ fontSize: '15px', fontWeight: 900, color: alarmLogs.length > 0 ? '#be123c' : '#059669' }}>
                    {`${alarmLogs.length}건`}
                  </strong>
                </div>

                <div
                  style={{
                    background: totalCheckFailCount > 0 ? '#fff1f2' : '#f8fafc',
                    border: `1px solid ${totalCheckFailCount > 0 ? '#fecdd3' : '#e2e8f0'}`,
                    borderRadius: '7px',
                    padding: '6px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#475569' }}>점검 불량</span>
                  <strong style={{ fontSize: '15px', fontWeight: 900, color: totalCheckFailCount > 0 ? '#be123c' : '#059669' }}>
                    {`${totalCheckFailCount}건`}
                  </strong>
                </div>

                <div
                  style={{
                    background: outOfSpecDays > 0 ? '#fff1f2' : '#f8fafc',
                    border: `1px solid ${outOfSpecDays > 0 ? '#fecdd3' : '#e2e8f0'}`,
                    borderRadius: '7px',
                    padding: '6px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#475569' }}>기준 이탈</span>
                  <strong style={{ fontSize: '15px', fontWeight: 900, color: outOfSpecDays > 0 ? '#be123c' : '#059669' }}>
                    {`${outOfSpecDays}일`}
                  </strong>
                </div>
              </div>

              <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                <table className="fmb-wb-table">
                  <colgroup>
                    <col style={{ width: '48px' }} />
                    <col />
                    <col />
                    <col style={{ width: '58px' }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>일자</th>
                      <th>이상 현상</th>
                      <th>조치 현황</th>
                      <th>작성자</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alarmLogs.length > 0 ? (
                      alarmLogs.map((log, idx) => (
                        <tr
                          key={`${log.date}_${idx}`}
                          onClick={() => log.report && onOpenDetail?.(log.report)}
                          style={{ cursor: log.report ? 'pointer' : 'default' }}
                        >
                          <td translate="no" style={{ fontWeight: 700, color: '#475569' }}>{log.mmdd || '-'}</td>
                          <td title={log.symptom} style={{ fontWeight: 800, color: '#be123c' }}>{log.symptom}</td>
                          <td title={log.action} style={{ fontWeight: 700, color: '#0369a1' }}>{log.action}</td>
                          <td style={{ fontWeight: 600, color: '#334155' }}>{log.worker}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ padding: '16px 8px', color: '#94a3b8', fontWeight: 600 }}>
                          등록된 경보장치 이상발생 및 조치 이력이 없습니다.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {noteLogs.length > 0 && (
                <div
                  onClick={() => noteLogs[0].report && onOpenDetail?.(noteLogs[0].report)}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '5px 8px',
                    fontSize: '11px',
                    color: '#334155',
                    cursor: noteLogs[0].report ? 'pointer' : 'default',
                    flexShrink: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={noteLogs[0].text}
                >
                  <strong style={{ color: '#0f172a' }}>특이사항</strong>{' '}
                  <span translate="no" style={{ color: '#64748b' }}>({noteLogs[0].mmdd})</span>:{' '}
                  <span>{noteLogs[0].text}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
