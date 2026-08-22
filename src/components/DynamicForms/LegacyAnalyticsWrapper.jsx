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

  container.innerHTML = `
    <div class="analytics-tabs-wrapper">
      <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 2px solid var(--border-color);">
        <button class="analytics-tab-btn active" data-tab="tab-leader" style="padding: 12px 24px; font-weight: 700; background: var(--accent-purple); color: #fff; border: none; border-radius: 8px 8px 0 0; font-size: 15px; cursor: pointer;">📋 반장 작업일보</button>
        <button class="analytics-tab-btn" data-tab="tab-dtclip" style="padding: 12px 24px; font-weight: 700; background: #e2e8f0; color: #475569; border: none; border-radius: 8px 8px 0 0; font-size: 15px; cursor: pointer;">🛠️ DT 클립머신 실적</button>
        <button class="analytics-tab-btn" data-tab="tab-charts" style="padding: 12px 24px; font-weight: 700; background: #e2e8f0; color: #475569; border: none; border-radius: 8px 8px 0 0; font-size: 15px; cursor: pointer;">📈 공정 및 불량 분석</button>
      </div>

      <!-- Tab 1: Leader Report -->
      <div id="tab-leader" class="analytics-tab-content" style="display: block;">
        <div class="card" style="border: 2px solid var(--accent-purple);">
          <div class="card-header" style="flex-wrap: wrap; gap: 10px;">
            <div class="card-title">
              <span style="background: var(--accent-purple); color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 13px;">
                📋 작업일보(반장)
              </span>
              <span style="font-size: 16px;">월 단위 누적 합산 보고서</span>
            </div>

            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
              <label style="font-size: 12px; font-weight: 700; color: var(--accent-purple);">조회 월 선택:</label>
              <select id="leaderMonthSelector" class="form-control" style="width: auto; min-height: 36px; padding: 4px 12px; font-size: 13px; font-weight: 700;">
                ${months.map(m => `
                  <option value="${m}" ${m === currentSelectedMonth ? 'selected' : ''}>${m.substring(0, 4)}년 ${m.substring(5)}월 합산</option>
                `).join('')}
              </select>
              <button class="btn btn-secondary btn-sm" id="btnPrintLeaderMonthly">🖨️ 합산표 인쇄</button>
              <button class="btn btn-success btn-sm" id="btnExportLeaderMonthlyCsv">📊 엑셀/CSV 다운로드</button>
            </div>
          </div>

          <div id="leaderMonthlyTableArea">
            <!-- Dynamic Leader Monthly Table Render -->
          </div>
        </div>
      </div>

      <!-- Tab 2: DT Clip Machine Report -->
      <div id="tab-dtclip" class="analytics-tab-content" style="display: none;">
        <div class="card" style="border: 2px solid var(--accent-blue);">
          <div class="card-header" style="flex-wrap: wrap; gap: 10px;">
            <div class="card-title">
              <span style="background: var(--accent-blue); color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 13px;">
                🛠️ DT 클립머신
              </span>
              <span style="font-size: 16px;">월 단위 누적 실적 및 불량 보고서</span>
            </div>

            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
              <label style="font-size: 12px; font-weight: 700; color: var(--accent-blue);">조회 월 선택:</label>
              <select id="dtclipMonthSelector" class="form-control" style="width: auto; min-height: 36px; padding: 4px 12px; font-size: 13px; font-weight: 700;">
                ${months.map(m => `
                  <option value="${m}" ${m === currentSelectedMonth ? 'selected' : ''}>${m.substring(0, 4)}년 ${m.substring(5)}월 합산</option>
                `).join('')}
              </select>
              <button class="btn btn-secondary btn-sm" id="btnPrintDtclipMonthly">🖨️ 합산표 인쇄</button>
              <button class="btn btn-success btn-sm" id="btnExportDtclipMonthlyCsv">📊 엑셀/CSV 다운로드</button>

            </div>
          </div>

          <div id="dtclipMonthlyTableArea">
            <!-- Dynamic DT Clip Monthly Table Render -->
          </div>
        </div>
      </div>

      <!-- Tab 3: Charts -->
      <div id="tab-charts" class="analytics-tab-content" style="display: none;">
        <div class="grid-2">
          <div class="card">
            <div class="card-header">
              <div class="card-title">🚨 공정별 불량 원인 파레토 모니터링</div>
            </div>
            <div style="position: relative; height: 240px; width: 100%;">
              <canvas id="defectParetoChart" height="240"></canvas>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div class="card-title">📊 1차 차종별 월간 생산 비중</div>
            </div>
            <div style="position: relative; height: 240px; width: 100%;">
              <canvas id="carModelShareChart" height="240"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
`;


  const monthSelector = container.querySelector('#leaderMonthSelector');
  const tableArea = container.querySelector('#leaderMonthlyTableArea');

  function updateLeaderMonthlyView(selectedMonth) {
    renderLeaderMonthlySummaryTable(tableArea, allReports, selectedMonth);
    i18n.applyTranslations(tableArea);
  }

  
  const tabBtns = container.querySelectorAll('.analytics-tab-btn');
  const tabContents = container.querySelectorAll('.analytics-tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => {
        b.style.background = '#e2e8f0';
        b.style.color = '#475569';
        b.classList.remove('active');
      });
      tabContents.forEach(tc => tc.style.display = 'none');
      
      btn.style.color = '#fff';
      if (btn.dataset.tab === 'tab-leader') btn.style.background = 'var(--accent-purple)';
      else if (btn.dataset.tab === 'tab-dtclip') btn.style.background = 'var(--accent-blue)';
      else btn.style.background = 'var(--text-main)';
      
      btn.classList.add('active');
      const target = container.querySelector('#' + btn.dataset.tab);
      if (target) target.style.display = 'block';
    });
  });

  const dtclipMonthSelector = container.querySelector('#dtclipMonthSelector');
  const dtclipTableArea = container.querySelector('#dtclipMonthlyTableArea');

  function updateDtclipMonthlyView(selectedMonth) {
    if (typeof renderDtclipMonthlySummaryTable === 'function') {
      renderDtclipMonthlySummaryTable(dtclipTableArea, allReports, selectedMonth);
      i18n.applyTranslations(dtclipTableArea);
    }
  }

  updateDtclipMonthlyView(currentSelectedMonth);

  
  const btnPrintDtclipMonthly = container.querySelector('#btnPrintDtclipMonthly');
  if (btnPrintDtclipMonthly) {
    btnPrintDtclipMonthly.addEventListener('click', () => {
      const dtclipTable = container.querySelector('#dtclipMonthlyTableArea');
      if (dtclipTable) {
        printIsolatedReport(dtclipTable, 'DT클립머신_월단위_누적합산표');
      }
    });
  }

  const btnExportDtclipMonthlyCsv = container.querySelector('#btnExportDtclipMonthlyCsv');
  if (btnExportDtclipMonthlyCsv) {
    btnExportDtclipMonthlyCsv.addEventListener('click', () => {
      exportDtclipMonthlyCsv(allReports, dtclipMonthSelector.value);
    });
  }

  if (dtclipMonthSelector) {
    dtclipMonthSelector.addEventListener('change', () => {
      updateDtclipMonthlyView(dtclipMonthSelector.value);
    });
  }

  updateLeaderMonthlyView(currentSelectedMonth);

  if (monthSelector) {
    monthSelector.addEventListener('change', () => {
      updateLeaderMonthlyView(monthSelector.value);
    });
  }

  container.querySelector('#btnPrintLeaderMonthly').addEventListener('click', () => {
    const leaderTable = container.querySelector('#leaderMonthlyTableArea');
    if (leaderTable) {
      printIsolatedReport(leaderTable, '반장_월단위_누적합산표');
    } else {
      window.print();
    }
  });

  container.querySelector('#btnExportLeaderMonthlyCsv').addEventListener('click', () => {
    exportLeaderMonthlyCsv(allReports, monthSelector.value);
  });

  drawParetoChart(container.querySelector('#defectParetoChart'), allReports);
  drawShareChart(container.querySelector('#carModelShareChart'), allReports);
  i18n.applyTranslations(container);
}

function getUniqueMonths(reports) {
  const set = new Set();
  reports.forEach(r => {
    if (r.date) set.add(r.date.substring(0, 7));
  });
  const arr = Array.from(set).sort((a, b) => b.localeCompare(a));
  return arr.length > 0 ? arr : [new Date().toISOString().substring(0, 7)];
}

// Helper to get weeks in a month
function getWeeksOfMonth(yearMonth) {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // JS months are 0-indexed
  
  const weeks = [];
  let currentDate = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  let weekStart = new Date(currentDate);
  
  while (currentDate <= lastDay) {
    if (currentDate.getDay() === 6 || currentDate.getTime() === lastDay.getTime()) {
      weeks.push({
        start: new Date(weekStart),
        end: new Date(currentDate)
      });
      currentDate.setDate(currentDate.getDate() + 1);
      weekStart = new Date(currentDate);
    } else {
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }
  return weeks;
}

const formatDateStr = d => String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');

/**
 * 📊 장수미 반장 작업일보 (HSC-DT-005) 월 단위 누적 합산 표 렌더링
 */
function renderLeaderMonthlySummaryTable(container, reports, selectedMonth) {
  const monthReports = reports.filter(r => 
    r.date && r.date.startsWith(selectedMonth) && (r.isLeaderForm || r.workerName === '장수미')
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
  if (endIdx - startIdx > 3) startIdx = endIdx - 3; // Ensure exactly 4 max if possible

  const displayWeeksCount = endIdx - startIdx + 1;
  const displayWeekTitles = weekTitlesAll.slice(startIdx, endIdx + 1);

  const groups = [
    { id: 1, name: 'DS CREW', variants: ['LH', 'RH'] },
    { id: 2, name: 'DS STD', variants: ['LH', 'RH'] },
    { id: 3, name: 'DT CREW', variants: ['LH', 'RH'] },
    { id: 4, name: 'DT QUAD', variants: ['LH', 'RH'] },
    { id: 5, name: 'KM/KX Hood', variants: ['-'] }
  ];

  const groupData = groups.map(g => {
    return {
      id: g.id,
      name: g.name,
      variants: g.variants.map(v => {
        const itemName = g.name === 'KM/KX Hood' ? g.name : `${g.name} ${v}`;
        
        let monthPacked = 0;
        let monthRework = 0;
        monthReports.forEach(r => {
          const it = r.leaderFormItems?.find(i => i.name === itemName);
          if (it) {
            monthPacked += Number(it.packedQty) || 0;
            monthRework += Number(it.reworkQty) || 0;
          }
        });

        const weeklyScraps = weeks.map(w => {
          const wReports = monthReports.filter(r => {
            const d = new Date(r.date);
            return d >= w.start && d <= w.end;
          });
          
          let wPacked = 0, scrapA = 0, scrapB = 0, scrapC = 0, scrapD = 0, scrapCenter = 0, scrapSide = 0;
          wReports.forEach(r => {
            const it = r.leaderFormItems?.find(i => i.name === itemName);
            if (it) {
              wPacked += Number(it.packedQty) || 0;
              scrapA += Number(it.scrapA) || 0;
              scrapB += Number(it.scrapB) || 0;
              scrapC += Number(it.scrapC) || 0;
              scrapD += Number(it.scrapD) || 0;
              scrapCenter += Number(it.scrapCenter) || 0;
              scrapSide += Number(it.scrapSide) || 0;
            }
          });
          return { wPacked, scrapA, scrapB, scrapC, scrapD, scrapCenter, scrapSide };
        });

        const totalScrap = weeklyScraps.reduce((acc, ws) => ({
          scrapA: acc.scrapA + ws.scrapA,
          scrapB: acc.scrapB + ws.scrapB,
          scrapC: acc.scrapC + ws.scrapC,
          scrapD: acc.scrapD + ws.scrapD,
          scrapCenter: acc.scrapCenter + ws.scrapCenter,
          scrapSide: acc.scrapSide + ws.scrapSide,
        }), { scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapCenter: 0, scrapSide: 0 });

        return {
          variant: v,
          monthPacked,
          monthRework,
          weeklyScraps,
          totalScrap
        };
      })
    };
  });

  const totalMonthlyPacked = groupData.reduce((acc, g) => acc + g.variants.reduce((a, v) => a + v.monthPacked, 0), 0);
  const totalMonthlyRework = groupData.reduce((acc, g) => acc + g.variants.reduce((a, v) => a + v.monthRework, 0), 0);
  const totalMonthlyScrap = groupData.reduce((acc, g) => acc + g.variants.reduce((a, v) => a + Object.values(v.totalScrap).reduce((sa, sv) => sa + sv, 0), 0), 0);
  const avgDefectRate = totalMonthlyPacked > 0 ? ((totalMonthlyScrap / totalMonthlyPacked) * 100).toFixed(2) : '0.00';

  const formatScrap = (item, scrapObj, basePacked) => {
    if (item.includes('Hood')) {
      const pcC = basePacked > 0 ? ((scrapObj.scrapCenter / basePacked) * 100).toFixed(1) : '0.0';
      const pcS = basePacked > 0 ? ((scrapObj.scrapSide / basePacked) * 100).toFixed(1) : '0.0';
      return `<div style="margin-bottom:2px;">센터: ${scrapObj.scrapCenter}&nbsp;&nbsp;&nbsp;(${pcC}%)</div><div>사이드: ${scrapObj.scrapSide}&nbsp;&nbsp;&nbsp;(${pcS}%)</div>`;
    }
    
    const hasD = item.includes('DS CREW');
    const pcA = basePacked > 0 ? ((scrapObj.scrapA / basePacked) * 100).toFixed(1) : '0.0';
    const pcB = basePacked > 0 ? ((scrapObj.scrapB / basePacked) * 100).toFixed(1) : '0.0';
    const pcC = basePacked > 0 ? ((scrapObj.scrapC / basePacked) * 100).toFixed(1) : '0.0';
    let str = `<div style="margin-bottom:2px;">A: ${scrapObj.scrapA}&nbsp;&nbsp;&nbsp;(${pcA}%)</div>
               <div style="margin-bottom:2px;">B: ${scrapObj.scrapB}&nbsp;&nbsp;&nbsp;(${pcB}%)</div>
               <div style="margin-bottom:2px;">C: ${scrapObj.scrapC}&nbsp;&nbsp;&nbsp;(${pcC}%)</div>`;
    if (hasD) {
      const pcD = basePacked > 0 ? ((scrapObj.scrapD / basePacked) * 100).toFixed(1) : '0.0';
      str += `<div>D: ${scrapObj.scrapD}&nbsp;&nbsp;&nbsp;(${pcD}%)</div>`;
    }
    return str;
  };

  const attSum = {
    present: 0,
    absent: 0,
    annualLeave: 0,
    sickLeave: 0,
    halfLeave: 0
  };

  let reportCount = 0;
  let sumTotal = 0;

  monthReports.forEach(r => {
    const att = r.attendanceData;
    if (att && att.total !== undefined) {
      reportCount++;
      sumTotal += Number(att.total) || 0;
      attSum.present += Number(att.present) || 0;
      attSum.absent += Number(att.absent) || 0;
      attSum.annualLeave += Number(att.annualLeave) || 0;
      attSum.sickLeave += Number(att.sickLeave) || 0;
      attSum.halfLeave += Number(att.halfLeave) || 0;
    }
  });

  const avgTotal = reportCount > 0 ? Math.round(sumTotal / reportCount) : 0;

  
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
              <th rowspan="2" style="border: 1px solid #000; text-align: center; width: 120px;">호기</th>
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
              
              if (vIdx === 0) {
                html += `<td style="border: 1px solid #000; padding: 6px; font-weight: 700; text-align: center;">${vData.variant.section}</td>`;
              } else if (vIdx === 1) {
                html += `<td style="border: 1px solid #000; padding: 6px; font-weight: 700; text-align: center;" rowspan="3">B단면</td>`;
              }
              html += `<td style="border: 1px solid #000; padding: 6px; font-weight: 700; text-align: center; color: var(--accent-blue);">${vData.variant.name}</td>`;
  
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
  csvContent += `순번,구분,호기,월간 포장완료 수량,월간 폐기 수량,불량률(%)\n`;

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
    csvContent += `${idx+1},"${v.section}","${v.name}",${packed},${scrap},${rate}%\n`;
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
