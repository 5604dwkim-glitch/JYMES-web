import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import LeaderMonthlyDashboard from './LeaderMonthlyDashboard';

import { Chart, registerables } from 'chart.js';
import { DEFAULT_LEADER_ITEMS } from '../../constants/masterData';

Chart.register(...registerables);

import { i18n } from '../../constants/translations.js';

let _ctx = {};
export function setLegacyAnalyticsContext(ctx) {
  _ctx = ctx;
}

const store = {
  getReports: () => _ctx.reports
};

const printIsolatedReport = (element, title) => {
  // Simple print logic fallback
  const w = window.open('', '_blank');
  w.document.write('<html><head><title>'+title+'</title>\n' + Array.from(document.querySelectorAll("link[rel='stylesheet'], style")).map(el => el.outerHTML).join('\n') + '</head><body>' + element.innerHTML + '</body></html>');
  w.document.close();
  w.print();
};

/**
 * 50인 제조업체 공정별 작업일보 관리 시스템 - Analytics Component (Refactored)
 * (store.js 공통 마스터 상수를 참조하도록 로직 경량화)
 */





export function renderAnalytics(container) {
  const allReports = store.getReports();

  const months = getUniqueMonths(allReports);
  const currentSelectedMonth = months[0] || new Date().toISOString().substring(0, 7);

  // ----------------------------------------------------
  // React Component Rendering
  // ----------------------------------------------------
  
  if (!container._reactRoot) {
    container._reactRoot = createRoot(container);
  }
  container._reactRoot.render(
    <LeaderMonthlyDashboard
       selectedMonth={selectedMonth}
       weeks={weeks}
       displayWeeksCount={displayWeeksCount}
       displayWeekTitles={displayWeekTitles}
       groupData={groupData}
       totalMonthlyPacked={totalMonthlyPacked}
       totalMonthlyScrap={totalMonthlyScrap}
       avgDefectRate={avgDefectRate}
       avgTotal={avgTotal}
       attSum={attSum}
    />
  );
}

function exportLeaderMonthlyCsv(reports, selectedMonth) {
  const monthReports = reports.filter(r => 
    r.date && r.date.startsWith(selectedMonth) && (r.isLeaderForm || r.workerName === '장수미')
  );

  let csvContent = "\uFEFF";
  csvContent += `(주)조영산업 - 장수미 반장 작업일보(${selectedMonth}) 월간 누적 합산 보고서\n\n`;
  csvContent += `순번,아이템명,월간 포장완료 수량,월간 리워크 수량,월간 폐기 수량,불량률(%)\n`;

  DEFAULT_LEADER_ITEMS.forEach((it, idx) => {
    let packed = 0, rework = 0, scrap = 0;
    monthReports.forEach(r => {
      const found = (r.leaderFormItems || []).find(i => i.name === it.name);
      if (found) {
        packed += Number(found.packedQty) || 0;
        rework += Number(found.reworkQty) || 0;
        const s = (it.name === 'KM/KX Hood') ? (found.scrapCenter + found.scrapSide) : (found.scrapA + found.scrapB + found.scrapC + found.scrapD);
        scrap += Number(s) || 0;
      }
    });
    const rate = packed > 0 ? ((scrap / packed) * 100).toFixed(2) : '0.00';
    csvContent += `${idx+1},"${it.name}",${packed},${rework},${scrap},${rate}%\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `조영산업_반장작업일보_월간합산_${selectedMonth}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function drawParetoChart(canvas, reports) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const processes = ['소재준비', '조인트', '후가공', '검사포장', '클립머신'];
  const data = [42, 28, 18, 8, 4];

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: processes,
      datasets: [{
        label: '불량 발생 건수',
        data: data,
        backgroundColor: 'rgba(225, 29, 72, 0.7)',
        borderColor: '#e11d48',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } }
    }
  });
}

function drawShareChart(canvas, reports) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const labels = ['JG1', 'NE1a', 'OV1K', 'DT CREW', '9BQC', '기타'];
  const data = [35, 25, 15, 12, 8, 5];

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: [
          '#0284c7', '#059669', '#d97706', '#e11d48', '#7c3aed', '#64748b'
        ]
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'right', labels: { font: { size: 11 } } } }
    }
  });
}


import { useI18n } from '../../contexts/I18nContext';

export default function LegacyAnalyticsWrapper({ reports }) {
  const containerRef = useRef(null);
  const { lang } = useI18n();
  
  useEffect(() => {
    if (!containerRef.current) return;
    setLegacyAnalyticsContext({ reports });
    window.Chart = Chart;
    
    try {
      renderAnalytics(containerRef.current);
    } catch (e) {
      console.error(e);
    }
    
  }, [reports, lang]);

  return <div ref={containerRef} className="legacy-analytics-container"></div>;
}



function renderDtclipMonthlySummaryTable(container, reports, selectedMonth) {
  const monthReports = reports.filter(r => 
    r.date && r.date.startsWith(selectedMonth) && 
    r.carModel === 'DT CREW' && r.processName === '클립머신'
  );

  const weeks = getWeeksOfMonth(selectedMonth);
  const weekLabels = ['첫째주', '둘째주', '셋째주', '넷째주', '다섯째주', '여섯째주'];
  const weekTitlesAll = weeks.map((w, i) => `${weekLabels[i] || (i+1)+'주차'}<br>(${formatDateStr(w.start)}~${formatDateStr(w.end)})`);

  let latestWeekIdx = 0;
  weeks.forEach((w, i) => {
    const hasReport = monthReports.some(r => {
      const d = new Date(r.date);
      return d >= w.start && d <= w.end;
    });
    if (hasReport) latestWeekIdx = i;
  });

  let endIdx = Math.max(3, latestWeekIdx);
  if (endIdx >= weeks.length) endIdx = weeks.length - 1;
  let startIdx = endIdx - 3;
  if (startIdx < 0) startIdx = 0;
  if (endIdx - startIdx > 3) startIdx = endIdx - 3;

  const displayWeeksCount = endIdx - startIdx + 1;
  const displayWeekTitles = weekTitlesAll.slice(startIdx, endIdx + 1);

  const variants = [
    { id: 'A_SEC', name: 'A단면(1호기)', components: [{id: 'LH', source: 'A'}, {id: 'RH', source: 'A'}] },
    { id: 'LH3', name: 'LH 3호 (Table B)', components: [{id: 'LH3', source: 'B'}] },
    { id: 'LH4', name: 'LH 4호 (Table B)', components: [{id: 'LH4', source: 'B'}] },
    { id: 'RH2', name: 'RH 2호 (Table B)', components: [{id: 'RH2', source: 'B'}] },
    { id: 'RH4', name: 'RH 4호 (Table B)', components: [{id: 'RH4', source: 'B'}] }
  ];

  const variantData = variants.map(v => {
    let monthPacked = 0;
    let monthScrap = 0;

    const weeklyScraps = weeks.map(w => {
      const wReports = monthReports.filter(r => {
        const d = new Date(r.date);
        return d >= w.start && d <= w.end;
      });
      
      let wPacked = 0, wScrapTotal = 0;
      let d1 = 0, d2 = 0, d3 = 0, d4 = 0, d5 = 0, d6 = 0, d7 = 0, d8 = 0;

      wReports.forEach(r => {
        v.components.forEach(comp => {
          let qtyObj = comp.source === 'A' ? r.dtCrewQty : r.dtCrewQtyB;
          if (!qtyObj) return;

          wPacked += Number(qtyObj[`정품수량_${comp.id}`]) || 0;
          wScrapTotal += Number(qtyObj[`불량합계_${comp.id}`]) || 0;
          
          d1 += Number(qtyObj[`길이미달_${comp.id}`]) || 0;
          d2 += Number(qtyObj[`길이초과_${comp.id}`]) || 0;
          d3 += Number(qtyObj[`끝단부불량_${comp.id}`]) || 0;
          d4 += Number(qtyObj[`클립홀찢어짐_${comp.id}`]) || 0;
          d5 += Number(qtyObj[`클립간격불량_${comp.id}`]) || 0;
          d6 += Number(qtyObj[`드레인홀불량_${comp.id}`]) || 0;
          d7 += Number(qtyObj[`스코치_${comp.id}`]) || 0;
          d8 += Number(qtyObj[`기타_${comp.id}`]) || 0;
        });
      });

      monthPacked += wPacked;
      monthScrap += wScrapTotal;

      return { wPacked, wScrapTotal, d1, d2, d3, d4, d5, d6, d7, d8 };
    });

    const totalScrapDetails = weeklyScraps.reduce((acc, ws) => ({
      d1: acc.d1 + ws.d1,
      d2: acc.d2 + ws.d2,
      d3: acc.d3 + ws.d3,
      d4: acc.d4 + ws.d4,
      d5: acc.d5 + ws.d5,
      d6: acc.d6 + ws.d6,
      d7: acc.d7 + ws.d7,
      d8: acc.d8 + ws.d8,
    }), { d1: 0, d2: 0, d3: 0, d4: 0, d5: 0, d6: 0, d7: 0, d8: 0 });

    return {
      variant: v,
      monthPacked,
      monthScrap,
      weeklyScraps,
      totalScrapDetails
    };
  });

  const totalMonthlyPacked = variantData.reduce((acc, v) => acc + v.monthPacked, 0);
  const totalMonthlyScrap = variantData.reduce((acc, v) => acc + v.monthScrap, 0);
  const avgDefectRate = totalMonthlyPacked > 0 ? ((totalMonthlyScrap / totalMonthlyPacked) * 100).toFixed(2) : '0.00';

  const formatScrapHTML = (obj, basePacked) => {
    return `
      <div style="display:flex; flex-wrap: wrap; gap: 4px; font-size: 10px;">
        <span style="background:#f1f5f9; padding:2px 4px; border-radius:2px;">미달:${obj.d1}</span>
        <span style="background:#f1f5f9; padding:2px 4px; border-radius:2px;">초과:${obj.d2}</span>
        <span style="background:#f1f5f9; padding:2px 4px; border-radius:2px;">끝단:${obj.d3}</span>
        <span style="background:#f1f5f9; padding:2px 4px; border-radius:2px;">찢어짐:${obj.d4}</span>
        <span style="background:#f1f5f9; padding:2px 4px; border-radius:2px;">간격:${obj.d5}</span>
        <span style="background:#f1f5f9; padding:2px 4px; border-radius:2px;">드레인:${obj.d6}</span>
        <span style="background:#f1f5f9; padding:2px 4px; border-radius:2px;">스코치:${obj.d7}</span>
        <span style="background:#f1f5f9; padding:2px 4px; border-radius:2px;">기타:${obj.d8}</span>
      </div>
    `;
  };

  container.innerHTML = `
    <div style="font-size: 15px;">
      <div style="display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap;">
        <div style="background: #f8fafc; border: 1px solid var(--border-color); padding: 16px 20px; border-radius: var(--radius-md); flex: 1;">
          <span style="font-size: 14px; color: var(--text-muted); display: block;">월간 총 정품수량</span>
          <strong style="font-size: 24px; color: var(--accent-blue);">${totalMonthlyPacked.toLocaleString()} EA</strong>
        </div>
        <div style="background: #fff1f2; border: 1px solid #fecdd3; padding: 16px 20px; border-radius: var(--radius-md); flex: 1;">
          <span style="font-size: 14px; color: #f43f5e; display: block;">월간 총 불량수량</span>
          <strong style="font-size: 24px; color: #e11d48;">${totalMonthlyScrap.toLocaleString()} EA</strong>
        </div>
        <div style="background: #f8fafc; border: 1px solid var(--border-color); padding: 16px 20px; border-radius: var(--radius-md); flex: 1;">
          <span style="font-size: 14px; color: var(--text-muted); display: block;">평균 불량률</span>
          <strong style="font-size: 24px; color: var(--text-main);">${avgDefectRate}%</strong>
        </div>
      </div>

      <div class="table-container">
        <table class="data-table" style="font-size: 13px; text-align: left; border-collapse: collapse; width: 100%; min-width: 1200px;">
          <thead>
            <tr style="background: #f8fafc;">
              <th rowspan="2" style="border: 1px solid #000; text-align: center; width: 50px;">순번</th>
              <th rowspan="2" style="border: 1px solid #000; text-align: center; width: 120px;">구분</th>
              <th rowspan="2" style="border: 1px solid #000; text-align: center; width: 120px;">(${parseInt(selectedMonth.split('-')[1], 10)}월) 정품완료</th>
              <th colspan="${displayWeeksCount}" style="border: 1px solid #000; text-align: left; padding-left: 8px;">주차별 불량 현황</th>
              <th rowspan="2" style="border: 1px solid #000; text-align: center; width: 180px;">${parseInt(selectedMonth.split('-')[1], 10)}월 누적 불량 세부</th>
            </tr>
            <tr style="background: #f8fafc;">
              ${displayWeekTitles.map(t => `<th style="border: 1px solid #000; text-align: left; padding: 6px; font-weight: normal; font-size: 12px; width: 140px;">${t}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${variantData.map((vData, vIdx) => {
              let html = `<tr>`;
              html += `<td style="border: 1px solid #000; text-align: center; padding: 6px;">${vIdx + 1}</td>`;
              html += `<td style="border: 1px solid #000; padding: 6px; font-weight: 700; color: var(--text-main);">${vData.variant.name}</td>`;
              html += `<td style="border: 1px solid #000; text-align: center; padding: 6px; font-weight: 800; color: var(--accent-blue);">${vData.monthPacked.toLocaleString()}</td>`;
              
              for (let i = startIdx; i <= endIdx; i++) {
                const ws = vData.weeklyScraps[i];
                html += `<td style="border: 1px solid #000; padding: 6px; vertical-align: top;">
                  <div style="font-weight: 700; color: #e11d48; margin-bottom: 4px;">${ws.wScrapTotal.toLocaleString()} EA (정품: ${ws.wPacked.toLocaleString()})</div>
                  ${formatScrapHTML(ws, ws.wPacked)}
                </td>`;
              }

              html += `<td style="border: 1px solid #000; padding: 6px; vertical-align: top; background: #fff1f2;">
                <div style="font-weight: 800; color: #e11d48; font-size: 14px; margin-bottom: 4px;">총 ${vData.monthScrap.toLocaleString()} EA</div>
                ${formatScrapHTML(vData.totalScrapDetails, vData.monthPacked)}
              </td>`;

              html += `</tr>`;
              return html;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}



function exportDtclipMonthlyCsv(reports, selectedMonth) {
  const monthReports = reports.filter(r => 
    r.date && r.date.startsWith(selectedMonth) && 
    r.carModel === 'DT CREW' && r.processName === '클립머신'
  );

  let csvContent = "\uFEFF";
  csvContent += `(주)조영산업 - DT 클립머신 생산 불량 실적(${selectedMonth}) 월간 누적 합산 보고서\n\n`;
  csvContent += `순번,구분,월간 포장완료 수량,월간 폐기 수량,불량률(%)\n`;

  const variants = [
    { id: 'A_SEC', name: 'A단면(1호기)', components: [{id: 'LH', source: 'A'}, {id: 'RH', source: 'A'}] },
    { id: 'LH3', name: 'LH 3호 (Table B)', components: [{id: 'LH3', source: 'B'}] },
    { id: 'LH4', name: 'LH 4호 (Table B)', components: [{id: 'LH4', source: 'B'}] },
    { id: 'RH2', name: 'RH 2호 (Table B)', components: [{id: 'RH2', source: 'B'}] },
    { id: 'RH4', name: 'RH 4호 (Table B)', components: [{id: 'RH4', source: 'B'}] }
  ];

  variants.forEach((v, idx) => {
    let packed = 0, scrap = 0;
    monthReports.forEach(r => {
      v.components.forEach(comp => {
        let qtyObj = comp.source === 'A' ? r.dtCrewQty : r.dtCrewQtyB;
        if (qtyObj) {
          packed += Number(qtyObj[`정품수량_${comp.id}`]) || 0;
          scrap += Number(qtyObj[`불량합계_${comp.id}`]) || 0;
        }
      });
    });
    const rate = packed > 0 ? ((scrap / packed) * 100).toFixed(2) : '0.00';
    csvContent += `${idx+1},"${v.name}",${packed},${scrap},${rate}%\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `조영산업_DT클립머신_월간합산_${selectedMonth}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
