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
  const w = window.open('', '_blank');
  w.document.write('<html><head><title>'+title+'</title>\n' + Array.from(document.querySelectorAll("link[rel='stylesheet'], style")).map(el => el.outerHTML).join('\n') + '</head><body>' + element.innerHTML + '</body></html>');
  w.document.close();
  w.print();
};

/**
 * 50인 제조업체 공정별 작업일보 관리 시스템 - Analytics Component (Refactored)
 */

let selectedMakerFilter = 'ALL';
let selectedCarFilter = 'ALL';
let selectedPartFilter = 'ALL';
let selectedMakerForGrid = 'ALL';

export function renderAnalytics(container) {
  const allReports = store.getReports();

  const months = getUniqueMonths(allReports);
  const currentSelectedMonth = months[0] || new Date().toLocaleDateString('sv-SE').substring(0, 7);

  container.innerHTML = `
    <div class="analytics-tabs-wrapper">
      <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 2px solid var(--border-color); flex-wrap: wrap;">
        <button class="analytics-tab-btn active" data-tab="tab-weekly" style="padding: 12px 24px; font-weight: 700; background: #059669; color: #fff; border: none; border-radius: 8px 8px 0 0; font-size: 15px; cursor: pointer;">📊 주간 통합 요약</button>
        <button class="analytics-tab-btn" data-tab="tab-leader" style="padding: 12px 24px; font-weight: 700; background: #e2e8f0; color: #475569; border: none; border-radius: 8px 8px 0 0; font-size: 15px; cursor: pointer;">📋 반장 작업일보</button>
        <button class="analytics-tab-btn" data-tab="tab-dtclip" style="padding: 12px 24px; font-weight: 700; background: #e2e8f0; color: #475569; border: none; border-radius: 8px 8px 0 0; font-size: 15px; cursor: pointer;">🛠️ DT 클립머신 실적</button>
        <button class="analytics-tab-btn" data-tab="tab-charts" style="padding: 12px 24px; font-weight: 700; background: #e2e8f0; color: #475569; border: none; border-radius: 8px 8px 0 0; font-size: 15px; cursor: pointer;">📈 공정 및 불량 분석</button>
      </div>

      <!-- Tab 0: Weekly Integrated Summary -->
      <div id="tab-weekly" class="analytics-tab-content" style="display: block;">
        <div class="card" style="border: 2px solid #059669;">
          <div class="card-header" style="flex-wrap: wrap; gap: 10px;">
            <div class="card-title">
              <span style="background: #059669; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 13px;">
                📊 주간 통합 요약
              </span>
              <span style="font-size: 16px;">주간 단위 폐기불량 통합 보고서</span>
            </div>
            <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
              <label style="font-size: 12px; font-weight: 700; color: #059669;">조회 월 선택:</label>
              <select id="weeklyMonthSelector" class="form-control" style="width: auto; min-height: 36px; padding: 4px 12px; font-size: 13px; font-weight: 700;">
                ${months.map(m => `
                  <option value="${m}" ${m === currentSelectedMonth ? 'selected' : ''}>${m.substring(0, 4)}년 ${m.substring(5)}월</option>
                `).join('')}
              </select>
              <button class="btn btn-secondary btn-sm" id="btnPrintWeeklySummary">🖨️ 인쇄</button>
            </div>
          </div>
          <div id="weeklyIntegratedTableArea">
            <!-- Weekly Integrated Summary renders here -->
          </div>
        </div>
      </div>

      <!-- Tab 1: Leader Report -->
      <div id="tab-leader" class="analytics-tab-content" style="display: none;">
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

  // Tab switching
  const tabBtns = container.querySelectorAll('.analytics-tab-btn');
  const tabContents = container.querySelectorAll('.analytics-tab-content');
  const TAB_COLORS = {
    'tab-weekly': '#059669',
    'tab-leader': 'var(--accent-purple)',
    'tab-dtclip': 'var(--accent-blue)',
    'tab-charts': 'var(--text-main)',
  };

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => {
        b.style.background = '#e2e8f0';
        b.style.color = '#475569';
        b.classList.remove('active');
      });
      tabContents.forEach(tc => tc.style.display = 'none');
      btn.style.color = '#fff';
      btn.style.background = TAB_COLORS[btn.dataset.tab] || 'var(--text-main)';
      btn.classList.add('active');
      const target = container.querySelector('#' + btn.dataset.tab);
      if (target) target.style.display = 'block';
    });
  });

  // ── Weekly Integrated Summary ──
  const weeklyMonthSelector = container.querySelector('#weeklyMonthSelector');
  const weeklyTableArea = container.querySelector('#weeklyIntegratedTableArea');

  function updateWeeklyView(selectedMonth) {
    renderWeeklyIntegratedSummaryTable(weeklyTableArea, allReports, selectedMonth);
    i18n.applyTranslations(weeklyTableArea);
  }

  updateWeeklyView(currentSelectedMonth);

  if (weeklyMonthSelector) {
    weeklyMonthSelector.addEventListener('change', () => {
      updateWeeklyView(weeklyMonthSelector.value);
    });
  }

  const btnPrintWeeklySummary = container.querySelector('#btnPrintWeeklySummary');
  if (btnPrintWeeklySummary) {
    btnPrintWeeklySummary.addEventListener('click', () => {
      const area = container.querySelector('#weeklyIntegratedTableArea');
      if (area) printIsolatedReport(area, '주간_통합_폐기불량_요약표');
    });
  }

  // ── Leader Monthly ──
  const monthSelector = container.querySelector('#leaderMonthSelector');
  const tableArea = container.querySelector('#leaderMonthlyTableArea');

  function updateLeaderMonthlyView(selectedMonth) {
    renderLeaderMonthlySummaryTable(tableArea, allReports, selectedMonth);
    i18n.applyTranslations(tableArea);
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

  // ── DT Clip Machine ──
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
  return arr.length > 0 ? arr : [new Date().toLocaleDateString('sv-SE').substring(0, 7)];
}

// Helper to get standard Sun-Sat weeks for a month calendar
function getWeeksOfMonth(yearMonth) {
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;

  const weeks = [];
  
  // 첫째 주의 일요일 찾기
  let firstDayOfMonth = new Date(year, month, 1);
  let currentStart = new Date(firstDayOfMonth);
  currentStart.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());

  // 마지막 주의 토요일 찾기
  let lastDayOfMonth = new Date(year, month + 1, 0);
  let endLimit = new Date(lastDayOfMonth);
  endLimit.setDate(lastDayOfMonth.getDate() + (6 - lastDayOfMonth.getDay()));

  while (currentStart <= endLimit) {
    let currentEnd = new Date(currentStart);
    currentEnd.setDate(currentStart.getDate() + 6); // Add 6 days to get Saturday
    
    // JS dates are mutable, create new instances for array
    weeks.push({
      start: new Date(currentStart),
      end: new Date(currentEnd)
    });
    
    // 다음 주로 이동
    currentStart.setDate(currentStart.getDate() + 7);
  }
  
  return weeks;
}

const toLocalYMD = d => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const d2 = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${d2}`;
};
const formatDateStr = d => String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0');

// ══════════════════════════════════════════════════════════
// 📊 주간 통합 요약 테이블 (반장일보 + DT 클립머신 합산)
// LH/RH 합산, 불량 항목별 수량 및 퍼센트 표시
// ══════════════════════════════════════════════════════════
function renderWeeklyIntegratedSummaryTable(container, reports, selectedMonth) {
  const weeks = getWeeksOfMonth(selectedMonth);
  const monthNum = parseInt(selectedMonth.split('-')[1], 10);
  const yearNum = selectedMonth.split('-')[0];
  const weekLabels = ['첫째주', '둘째주', '셋째주', '넷째주', '다섯째주', '여섯째주'];
  const weekTitlesAll = weeks.map((w, i) => ({
    name: weekLabels[i] || `${i+1}주차`,
    dates: `(${formatDateStr(w.start)}~${formatDateStr(w.end)})`
  }));

  const minDateStr = toLocalYMD(weeks[0].start);
  const maxDateStr = toLocalYMD(weeks[weeks.length - 1].end);

  const leaderReports = reports.filter(r =>
    r.date && r.date >= minDateStr && r.date <= maxDateStr && (r.isLeaderForm || r.workerName === '장수미')
  );
  const clipReports = reports.filter(r =>
    r.date && r.date >= minDateStr && r.date <= maxDateStr &&
    r.carModel === 'DT CREW' && r.processName === '클립머신'
  );

  // Determine display weeks (latest 4)
  let latestWeekIdx = 0;
  weeks.forEach((w, i) => {
    const wStartStr = toLocalYMD(w.start);
    const wEndStr = toLocalYMD(w.end);
    const hasReport = [...leaderReports, ...clipReports].some(r => r.date >= wStartStr && r.date <= wEndStr);
    if (hasReport) latestWeekIdx = i;
  });

  let endIdx = Math.max(3, latestWeekIdx);
  if (endIdx >= weeks.length) endIdx = weeks.length - 1;
  let startIdx = endIdx - 3;
  if (startIdx < 0) startIdx = 0;
  const displayWeeksCount = endIdx - startIdx + 1;
  const displayWeekTitles = weekTitlesAll.slice(startIdx, endIdx + 1);

  // Helper: sum leader data for multiple item names (LH+RH merged)
  function getLeaderDataMerged(reps, itemNames) {
    let packedLH = 0, packedRH = 0, packedOther = 0;
    let scrapA = 0, scrapB = 0, scrapC = 0, scrapD = 0, scrapCenter = 0, scrapSide = 0;
    reps.forEach(r => {
      itemNames.forEach(itemName => {
        const it = r.leaderFormItems?.find(i => i.name === itemName);
        if (it) {
          const qty = Number(it.packedQty) || 0;
          if (itemName.includes('LH')) packedLH += qty;
          else if (itemName.includes('RH')) packedRH += qty;
          else packedOther += qty;

          scrapA += Number(it.scrapA) || 0;
          scrapB += Number(it.scrapB) || 0;
          scrapC += Number(it.scrapC) || 0;
          scrapD += Number(it.scrapD) || 0;
          scrapCenter += Number(it.scrapCenter) || 0;
          scrapSide += Number(it.scrapSide) || 0;
        }
      });
    });
    return { packedLH, packedRH, packedOther, packed: packedLH + packedRH + packedOther, scrapA, scrapB, scrapC, scrapD, scrapCenter, scrapSide };
  }

  // Helper: clip machine data for a set of reports
  function getClipData(reps) {
    let aPacked = 0, aScrap = 0;
    let bPacked = 0, bScrap = 0;
    const aComps = ['LH', 'RH'];
    const bComps = ['LH2', 'RH2', 'LH3', 'RH3', 'LH4', 'RH4'];
    reps.forEach(r => {
      aComps.forEach(id => {
        const obj = r.dtCrewQty;
        if (!obj) return;
        aPacked += Number(obj[`정품수량_${id}`]) || 0;
        aScrap += Number(obj[`불량합계_${id}`]) || 0;
      });
      bComps.forEach(id => {
        const obj = r.dtCrewQtyB;
        if (!obj) return;
        bPacked += Number(obj[`정품수량_${id}`]) || 0;
        bScrap += Number(obj[`불량합계_${id}`]) || 0;
      });
    });
    return { aPacked, aScrap, bPacked, bScrap };
  }

  // Row group definitions (LH+RH merged into one row per car model)
  // scrapCols: list of defect types to show with qty and %
  const rowGroups = [
    {
      group: 'DS CREW', color: '#7c3aed',
      type: 'std',
      leaderNames: ['DS CREW LH', 'DS CREW RH'],
      scrapCols: ['A', 'B', 'C', 'D']
    },
    {
      group: 'DS STD', color: '#0284c7',
      type: 'std',
      leaderNames: ['DS STD LH', 'DS STD RH'],
      scrapCols: ['A', 'B', 'C']
    },
    {
      group: 'DT CREW\n(반장+클립 합산)', color: '#d97706',
      type: 'dtcrew',
      leaderNames: ['DT CREW LH', 'DT CREW RH'],
      scrapCols: ['A', 'B', 'C']
    },
    {
      group: 'DT QUAD', color: '#0891b2',
      type: 'std',
      leaderNames: ['DT QUAD LH', 'DT QUAD RH'],
      scrapCols: ['A', 'B', 'C']
    },
    {
      group: 'KM/KX Hood', color: '#059669',
      type: 'hood',
      leaderNames: ['KM/KX Hood'],
      scrapCols: ['센터', '사이드']
    },
  ];

  // Compute data for one week period
  function computeWeekData(week, row) {
    const wStartStr = toLocalYMD(week.start);
    const wEndStr = toLocalYMD(week.end);
    
    const wLeader = leaderReports.filter(r => r.date >= wStartStr && r.date <= wEndStr);
    const wClip = clipReports.filter(r => r.date >= wStartStr && r.date <= wEndStr);

    if (row.type === 'dtcrew') {
      const ld = getLeaderDataMerged(wLeader, row.leaderNames);
      const clip = getClipData(wClip);
      
      const totalA = ld.scrapA + clip.aScrap;
      const totalB = ld.scrapB + clip.bScrap;
      const totalC = ld.scrapC;
      const totalScrap = totalA + totalB + totalC;
      const totalPacked = ld.packed + clip.aPacked + clip.bPacked;
      
      return {
        packedLH: ld.packedLH, packedRH: ld.packedRH, packedOther: ld.packedOther, packed: totalPacked,
        scrap: totalScrap,
        detail: { 'A': totalA, 'B': totalB, 'C': totalC }
      };
    } else if (row.type === 'hood') {
      const d = getLeaderDataMerged(wLeader, row.leaderNames);
      const scrap = d.scrapCenter + d.scrapSide;
      return { packedLH: d.packedLH, packedRH: d.packedRH, packedOther: d.packedOther, packed: d.packed, scrap, detail: { '센터': d.scrapCenter, '사이드': d.scrapSide } };
    } else {
      // std: LH+RH merged
      const d = getLeaderDataMerged(wLeader, row.leaderNames);
      const hasD = row.scrapCols.includes('D');
      const scrap = d.scrapA + d.scrapB + d.scrapC + (hasD ? d.scrapD : 0);
      const detail = {};
      if (row.scrapCols.includes('A')) detail['A'] = d.scrapA;
      if (row.scrapCols.includes('B')) detail['B'] = d.scrapB;
      if (row.scrapCols.includes('C')) detail['C'] = d.scrapC;
      if (hasD) detail['D'] = d.scrapD;
      return { packedLH: d.packedLH, packedRH: d.packedRH, packedOther: d.packedOther, packed: d.packed, scrap, detail };
    }
  }

  // Compute all data
  const allRowData = rowGroups.map(row => {
    const weekData = weeks.map(w => computeWeekData(w, row));
    const totalPackedLH = weekData.reduce((s, w) => s + w.packedLH, 0);
    const totalPackedRH = weekData.reduce((s, w) => s + w.packedRH, 0);
    const totalPackedOther = weekData.reduce((s, w) => s + w.packedOther, 0);
    const totalPacked = weekData.reduce((s, w) => s + w.packed, 0);
    const totalScrap = weekData.reduce((s, w) => s + w.scrap, 0);
    const totalDetail = {};
    row.scrapCols.forEach(col => {
      totalDetail[col] = weekData.reduce((s, w) => s + (w.detail[col] || 0), 0);
    });
    return { ...row, weekData, totalPackedLH, totalPackedRH, totalPackedOther, totalPacked, totalScrap, totalDetail };
  });

  // Grand totals
  const grandPacked = allRowData.reduce((s, r) => s + r.totalPacked, 0);
  const grandScrap = allRowData.reduce((s, r) => s + r.totalScrap, 0);
  const grandRate = grandPacked > 0 ? ((grandScrap / grandPacked) * 100).toFixed(2) : '0.00';

  // Weekly grand totals
  const weekGrandData = weeks.map((_, wi) => {
    const p = allRowData.reduce((s, r) => s + r.weekData[wi].packed, 0);
    const sc = allRowData.reduce((s, r) => s + r.weekData[wi].scrap, 0);
    return { packed: p, scrap: sc };
  });

  // Render a scrap detail chip (shows qty AND %)
  const scrapChip = (label, count, basePacked, isHighlight) => {
    const pct = basePacked > 0 ? ((count / basePacked) * 100).toFixed(1) : '0.0';
    if (count === 0) {
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:3px 8px;margin-bottom:2px;background:#f8fafc;border-radius:4px;border:1px solid #e2e8f0;">
        <span style="font-size:12px;font-weight:700;color:#94a3b8;">${label}</span>
        <span style="font-size:12px;color:#cbd5e1;">0 <span style="font-size:10px;">(0.0%)</span></span>
      </div>`;
    }
    const bg = isHighlight ? '#fef2f2' : '#fff7f0';
    const textColor = isHighlight ? '#dc2626' : '#b45309';
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:3px 8px;margin-bottom:2px;background:${bg};border-radius:4px;border:1px solid ${isHighlight ? '#fecdd3' : '#fed7aa'};">
      <span style="font-size:12px;font-weight:700;color:${textColor};">${label}</span>
      <span style="font-size:12px;font-weight:700;color:${textColor};">${count} <span style="font-size:10px;opacity:0.8;">(${pct}%)</span></span>
    </div>`;
  };

  // Render one table cell
  const renderCell = (wData, bgColor, scrapCols) => {
    const { packedLH, packedRH, packedOther, packed, scrap, detail } = wData;
    const hasData = packed > 0 || scrap > 0;
    const detailChips = scrapCols.map(col => scrapChip(col, detail[col] || 0, packed, scrap > 0)).join('');

    let topHtml = '';
    if (packedOther > 0 || (packedLH === 0 && packedRH === 0 && packed > 0)) {
       // e.g. KM/KX Hood where there is no LH/RH
       topHtml = `<span style="font-weight:700;font-size:12px;color:#065f46;">수량: ${packed.toLocaleString()} EA</span>`;
    } else {
       topHtml = `
         <span style="font-weight:700;color:#065f46;">LH ${packedLH.toLocaleString()}</span>
         <span style="margin:0 4px;color:#cbd5e1;">|</span>
         <span style="font-weight:700;color:#065f46;">RH ${packedRH.toLocaleString()}</span>
       `;
    }

    return `<td style="border:1px solid #e2e8f0;padding:6px 8px;vertical-align:top;background:${bgColor || '#fff'};">
      ${!hasData
        ? `<div style="text-align:center;color:#d1d5db;font-size:12px;padding:10px 0;">-</div>`
        : `<div style="text-align:center;padding:4px 0 6px;border-bottom:1px solid #e2e8f0;margin-bottom:5px;font-size:12px;">
            ${topHtml}
          </div>
          <div>${detailChips}</div>`
      }
    </td>`;
  };

  // Build HTML
  let tableHtml = `
    <div style="padding:16px;font-family:'Noto Sans KR',sans-serif;color:#1f2937;">
      <!-- Summary Cards -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px;">
        <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;">
          <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">📦 월간 총 생산수량</div>
          <div style="font-size:26px;font-weight:800;color:#065f46;">${grandPacked.toLocaleString()} <span style="font-size:13px;font-weight:400;">EA</span></div>
        </div>
        <div style="background:#fff7f7;border:1px solid #fecdd3;border-radius:10px;padding:14px 18px;">
          <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">⚠️ 월간 총 폐기수량</div>
          <div style="font-size:26px;font-weight:800;color:#991b1b;">${grandScrap.toLocaleString()} <span style="font-size:13px;font-weight:400;">EA</span></div>
        </div>
        <div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;">
          <div style="font-size:12px;color:#6b7280;margin-bottom:4px;">📉 월간 평균 불량률</div>
          <div style="font-size:26px;font-weight:800;color:#92400e;">${grandRate}%</div>
        </div>
      </div>

      <!-- Main Table -->
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <div style="padding:10px 16px;background:#f9fafb;border-bottom:1px solid #e5e7eb;font-weight:700;font-size:15px;color:#1f2937;">
          ${yearNum}년 ${monthNum}월 주간 폐기불량 통합 요약표 (반장일보 + DT클립머신 합산, LH·RH 합계)
        </div>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;min-width:1000px;table-layout:fixed;">
            <colgroup>
              <col style="width:120px;"/>
              ${Array(displayWeeksCount + 1).fill('<col/>').join('')}
            </colgroup>
            <thead>
              <tr style="background:#f1f5f9;">
                <th rowspan="2" style="border:1px solid #e2e8f0;padding:10px 8px;text-align:center;font-size:13px;font-weight:700;color:#374151;">차종 / 구분</th>
                <th colspan="${displayWeeksCount}" style="border:1px solid #e2e8f0;padding:8px;text-align:center;font-size:13px;font-weight:700;color:#374151;">
                  주차별 생산수량 / 폐기불량 상세
                </th>
                <th rowspan="2" style="border:1px solid #e2e8f0;padding:10px 8px;text-align:center;font-size:13px;font-weight:700;color:#991b1b;background:#fff7f7;">${monthNum}월 누적 합계</th>
              </tr>
              <tr style="background:#f8fafc;">
                ${displayWeekTitles.map(wt => `
                  <th style="border:1px solid #e2e8f0;padding:7px 8px;text-align:center;">
                    <div style="font-weight:700;font-size:13px;color:#1f2937;">${wt.name}</div>
                    <div style="font-size:11px;color:#9ca3af;font-weight:400;">${wt.dates}</div>
                  </th>`).join('')}
              </tr>
            </thead>
            <tbody>
  `;

  allRowData.forEach((row, gi) => {
    const rowBg = gi % 2 === 0 ? '#fff' : '#fafafa';
    tableHtml += `<tr style="background:${rowBg};">`;

    // Car model label cell
    tableHtml += `<td style="border:1px solid #e2e8f0;padding:8px;text-align:center;vertical-align:middle;font-weight:800;font-size:12px;background:${row.color}12;color:${row.color};white-space:pre-line;">${row.group}</td>`;

    // Week cells
    for (let wi = startIdx; wi <= endIdx; wi++) {
      tableHtml += renderCell(row.weekData[wi], rowBg, row.scrapCols);
    }

    // Cumulative total cell
    const totalChips = row.scrapCols.map(col => scrapChip(col, row.totalDetail[col] || 0, row.totalPacked, true)).join('');

    let topHtmlTotal = '';
    if (row.totalPackedOther > 0 || (row.totalPackedLH === 0 && row.totalPackedRH === 0 && row.totalPacked > 0)) {
       topHtmlTotal = `<span style="font-weight:800;font-size:13px;color:#065f46;">수량: ${row.totalPacked.toLocaleString()} EA</span>`;
    } else {
       topHtmlTotal = `
         <span style="font-weight:800;color:#065f46;">LH ${row.totalPackedLH.toLocaleString()}</span>
         <span style="margin:0 4px;color:#cbd5e1;">|</span>
         <span style="font-weight:800;color:#065f46;">RH ${row.totalPackedRH.toLocaleString()}</span>
       `;
    }

    tableHtml += `<td style="border:1px solid #e2e8f0;padding:8px;vertical-align:top;background:#fff7f7;">
      ${row.totalPacked === 0 && row.totalScrap === 0
        ? `<div style="text-align:center;color:#d1d5db;font-size:12px;padding:10px 0;">-</div>`
        : `<div style="text-align:center;padding:4px 0 6px;border-bottom:1px solid #fecdd3;margin-bottom:5px;font-size:13px;">
            ${topHtmlTotal}
          </div>
          <div>${totalChips}</div>`
      }
    </td>`;

    tableHtml += `</tr>`;
  });

  // Grand total row
  tableHtml += `
      <tr style="background:#eff6ff;">
        <td style="border:1px solid #e2e8f0;padding:10px;text-align:center;font-size:14px;font-weight:800;color:#1e40af;">전체 합계</td>
        ${Array.from({length: displayWeeksCount}, (_, di) => {
          const wi = startIdx + di;
          const wg = weekGrandData[wi];
          const wr = wg.packed > 0 ? ((wg.scrap / wg.packed) * 100).toFixed(1) : '0.0';
          return `<td style="border:1px solid #e2e8f0;padding:10px;text-align:center;background:#eff6ff;">
            <div style="font-weight:800;color:#1e40af;font-size:14px;">${wg.packed.toLocaleString()} EA</div>
            ${wg.scrap > 0 ? `<div style="color:#dc2626;font-weight:700;font-size:13px;">${wg.scrap.toLocaleString()}개 (${wr}%)</div>` : `<div style="color:#10b981;font-size:12px;">폐기 없음</div>`}
          </td>`;
        }).join('')}
        <td style="border:1px solid #e2e8f0;padding:10px;text-align:center;background:#fef3c7;">
          <div style="font-weight:800;color:#1e40af;font-size:15px;">${grandPacked.toLocaleString()} EA</div>
          <div style="font-weight:800;color:#dc2626;font-size:14px;">${grandScrap.toLocaleString()}개 (${grandRate}%)</div>
        </td>
      </tr>
    </tbody></table></div></div>
    <div style="margin-top:12px;padding:10px 14px;background:#f8fafc;border-radius:8px;font-size:12px;color:#6b7280;border:1px solid #e2e8f0;">
      💡 <strong>DT CREW (반장+클립 합산)</strong> : 반장 작업일보 데이터와 DT 클립머신 실적(A단면=1호기, B단면=2·3·4호기)이 모두 합산되어 표시됩니다. &nbsp;|&nbsp;
      <strong>모든 차종 LH·RH 합산</strong> 기준으로 표시됩니다.
    </div>
    </div>
  `;

  container.innerHTML = tableHtml;
}

/**
 * 📊 장수미 반장 작업일보 (HSC-DT-005) 월 단위 누적 합산 표 렌더링
 */
function renderLeaderMonthlySummaryTable(container, reports, selectedMonth) {
  const weeks = getWeeksOfMonth(selectedMonth);
  const minDateStr = toLocalYMD(weeks[0].start);
  const maxDateStr = toLocalYMD(weeks[weeks.length - 1].end);

  const monthReports = reports.filter(r =>
    r.date && r.date >= minDateStr && r.date <= maxDateStr && (r.isLeaderForm || r.workerName === '장수미')
  );

  const weekLabels = ['첫째주', '둘째주', '셋째주', '넷째주', '다섯째주', '여섯째주'];
  const weekTitlesAll = weeks.map((w, i) => `${weekLabels[i] || (i+1)+'주차'}<br>(${formatDateStr(w.start)}~${formatDateStr(w.end)})`);

  let latestWeekIdx = 0;
  weeks.forEach((w, i) => {
    const wStartStr = toLocalYMD(w.start);
    const wEndStr = toLocalYMD(w.end);
    const hasReport = monthReports.some(r => r.date >= wStartStr && r.date <= wEndStr);
    if (hasReport) latestWeekIdx = i;
  });

  let endIdx = Math.max(3, latestWeekIdx);
  if (endIdx >= weeks.length) endIdx = weeks.length - 1;
  let startIdx = endIdx - 3;
  if (startIdx < 0) startIdx = 0;
  if (endIdx - startIdx > 3) startIdx = endIdx - 3;

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
          const wStartStr = toLocalYMD(w.start);
          const wEndStr = toLocalYMD(w.end);
          const wReports = monthReports.filter(r => {
            return r.date >= wStartStr && r.date <= wEndStr;
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
  const weeks = getWeeksOfMonth(selectedMonth);
  const minDateStr = toLocalYMD(weeks[0].start);
  const maxDateStr = toLocalYMD(weeks[weeks.length - 1].end);

  const monthReports = reports.filter(r =>
    r.date && r.date >= minDateStr && r.date <= maxDateStr &&
    r.carModel === 'DT CREW' && r.processName === '클립머신'
  );

  const monthNum = parseInt(selectedMonth.split('-')[1], 10);
  const weekLabels = ['첫째주', '둘째주', '셋째주', '넷째주', '다섯째주', '여섯째주'];
  const weekTitlesAll = weeks.map((w, i) => `${weekLabels[i] || (i+1)+'주차'}<br>(${formatDateStr(w.start)}~${formatDateStr(w.end)})`);

  let latestWeekIdx = 0;
  weeks.forEach((w, i) => {
    const wStartStr = toLocalYMD(w.start);
    const wEndStr = toLocalYMD(w.end);
    const hasReport = monthReports.some(r => r.date >= wStartStr && r.date <= wEndStr);
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
    { id: '1호기', section: 'A단면', name: '1호기', components: [{id: 'LH', source: 'A'}, {id: 'RH', source: 'A'}] },
    { id: '2호기', section: 'B단면', name: '2호기', components: [{id: 'RH2', source: 'B'}, {id: 'LH2', source: 'B'}] },
    { id: '3호기', section: 'B단면', name: '3호기', components: [{id: 'LH3', source: 'B'}, {id: 'RH3', source: 'B'}] },
    { id: '4호기', section: 'B단면', name: '4호기', components: [{id: 'LH4', source: 'B'}, {id: 'RH4', source: 'B'}] }
  ];

  const variantData = variants.map(v => {
    let monthPacked = 0;
    let monthScrap = 0;

    const weeklyScraps = weeks.map(w => {
      const wStartStr = toLocalYMD(w.start);
      const wEndStr = toLocalYMD(w.end);
      const wReports = monthReports.filter(r => {
        return r.date >= wStartStr && r.date <= wEndStr;
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

  const formatScrapChipsHoriz = (obj, basePacked) => {
    const defects = [
      { label: '미달', count: obj.d1 },
      { label: '초과', count: obj.d2 },
      { label: '끝단', count: obj.d3 },
      { label: '찢어짐', count: obj.d4 },
      { label: '간격', count: obj.d5 },
      { label: '드레인', count: obj.d6 },
      { label: '스코치', count: obj.d7 },
      { label: '기타', count: obj.d8 }
    ];

    let html = '<div style="display: flex; flex-direction: row; flex-wrap: wrap; gap: 4px; font-size: 13px;">';

    defects.forEach((def) => {
      const rate = basePacked > 0 ? ((def.count / basePacked) * 100).toFixed(1) : "0.0";
      if (def.count === 0) {
        html += `<div style="display: flex; align-items: center; gap: 4px; color: #cbd5e1; background: #f8fafc; border-radius: 3px; padding: 2px 6px; border: 1px solid #f1f5f9; font-size: 12px;">
          <span style="font-weight: 600;">${def.label}</span><span>0</span>
        </div>`;
      } else {
        html += `<div style="display: flex; align-items: center; gap: 4px; background: #fff1f2; color: #be123c; border: 1px solid #fecdd3; border-radius: 3px; padding: 2px 6px; font-weight: 700; font-size: 12px;">
          <span>${def.label}</span>
          <span style="display: flex; align-items: baseline; gap: 2px;">
            <span style="font-size: 13px;">${def.count}</span>
            <span style="font-size: 10px; opacity: 0.8;">(${rate}%)</span>
          </span>
        </div>`;
      }
    });

    html += '</div>';
    return html;
  };

  const parseTitle = (t) => {
    const parts = t.split("<br>");
    return { name: parts[0] || "", dates: parts[1] || "" };
  };

  container.innerHTML = `
    <div style="width: 100%; font-family: 'Noto Sans KR', sans-serif; color: #1f2937; display: flex; flex-direction: column; gap: 10px; margin-top: 15px;">
      
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
        <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 11px 15px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
          <div>
            <div style="font-size: 13px; color: #6b7280; margin-bottom: 3px;">월간 총 정품수량</div>
            <div style="font-size: 22px; font-weight: 800; color: #111827;">${totalMonthlyPacked.toLocaleString()} <span style="font-size: 14px; font-weight: normal; color: #6b7280;">EA</span></div>
          </div>
        </div>
        
        <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 11px 15px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
          <div>
            <div style="font-size: 13px; color: #6b7280; margin-bottom: 3px;">월간 총 불량수량</div>
            <div style="font-size: 22px; font-weight: 800; color: #111827;">${totalMonthlyScrap.toLocaleString()} <span style="font-size: 14px; font-weight: normal; color: #6b7280;">EA</span></div>
          </div>
        </div>
        
        <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 11px 15px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 1px 3px rgba(0,0,0,0.06);">
          <div>
            <div style="font-size: 13px; color: #6b7280; margin-bottom: 3px;">평균 불량률</div>
            <div style="font-size: 22px; font-weight: 800; color: #111827;">${avgDefectRate}%</div>
          </div>
        </div>
      </div>

      <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); overflow: hidden;">
        <div style="padding: 7px 14px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; font-size: 15px; font-weight: 700; color: #1f2937;">
          1. ${monthNum}월 공정별 실적 현황 (DT 클립머신)
        </div>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; table-layout: fixed; min-width: 960px;">
            <colgroup>
              <col style="width: 40px;" />
              <col style="width: 52px;" />
              <col style="width: 90px;" />
              ${Array.from({ length: displayWeeksCount }).map(() => '<col />').join('')}
              <col />
            </colgroup>
            <thead>
              <tr>
                <th rowspan="2" style="border: 1px solid #d1d5db; padding: 6px 7px; text-align: center; font-weight: 700; font-size: 14px; background: #f8fafc; color: #374151;">순번</th>
                <th rowspan="2" style="border: 1px solid #d1d5db; padding: 6px 7px; text-align: center; font-weight: 700; font-size: 14px; background: #f8fafc; color: #374151;">구분</th>
                <th rowspan="2" style="border: 1px solid #d1d5db; padding: 6px 7px; text-align: center; font-weight: 700; font-size: 14px; background: #f8fafc; color: #374151;">호기</th>
                <th colspan="${displayWeeksCount}" style="border: 1px solid #d1d5db; padding: 6px 7px; text-align: center; font-weight: 700; font-size: 14px; background: #f8fafc; color: #374151; border-bottom: 1px solid #d1d5db;">주차별 폐기불량 현황</th>
                <th rowspan="2" style="border: 1px solid #d1d5db; padding: 6px 7px; text-align: center; font-weight: 700; font-size: 14px; background: #fff7f7; color: #991b1b;">${monthNum}월 누적 불량 세부내역</th>
              </tr>
              <tr>
                ${displayWeekTitles.map(t => {
                  const pt = parseTitle(t);
                  return `<th style="border: 1px solid #d1d5db; padding: 6px 7px; text-align: center; background: #f8fafc; font-weight: 600; font-size: 13px;">
                    <div style="font-weight: 700; color: #1f2937;">${pt.name}</div>
                    <div style="font-size: 11px; color: #9ca3af; font-weight: 400;">${pt.dates}</div>
                  </th>`;
                }).join('')}
              </tr>
            </thead>
            <tbody>
              ${variantData.map((vData, vIdx) => {
                let rowBg = vIdx % 2 === 0 ? "#fff" : "#f9fafb";
                let html = `<tr style="background: ${rowBg};">`;
                html += `<td style="border: 1px solid #d1d5db; padding: 4px 6px; text-align: center; vertical-align: middle; font-size: 13px; color: #6b7280; font-weight: 600;">${vIdx + 1}</td>`;
                
                if (vIdx === 0) {
                  html += `<td style="border: 1px solid #d1d5db; padding: 4px 6px; text-align: center; vertical-align: middle; font-size: 13px; font-weight: 700;">${vData.variant.section}</td>`;
                } else if (vIdx === 1) {
                  html += `<td style="border: 1px solid #d1d5db; padding: 4px 6px; text-align: center; vertical-align: middle; font-size: 13px; font-weight: 700;" rowspan="3">B단면</td>`;
                }
                html += `<td style="border: 1px solid #d1d5db; padding: 4px 6px; text-align: center; vertical-align: middle; font-size: 13px; font-weight: 700; color: #111827;">${vData.variant.name}</td>`;
                
                for (let i = startIdx; i <= endIdx; i++) {
                  const ws = vData.weeklyScraps[i];
                  const rate = ws.wPacked > 0 ? ((ws.wScrapTotal / ws.wPacked) * 100).toFixed(1) : "0.0";
                  
                  html += `<td style="border: 1px solid #d1d5db; padding: 4px 5px; vertical-align: top;">`;
                  
                  if (ws.wScrapTotal === 0 && ws.wPacked === 0) {
                     html += `<div style="text-align: center; color: #d1d5db; font-size: 13px; font-style: italic;">0</div>`;
                  } else {
                     html += `<div style="font-weight: 700; color: #e11d48; margin-bottom: 5px; font-size: 13px; text-align: center;">${ws.wPacked.toLocaleString()} (<span style="color:#be123c;">${ws.wScrapTotal.toLocaleString()}, ${rate}%</span>)</div>
                               ${formatScrapChipsHoriz(ws, ws.wPacked)}`;
                  }
                  
                  html += `</td>`;
                }

                const totalRate = vData.monthPacked > 0 ? ((vData.monthScrap / vData.monthPacked) * 100).toFixed(1) : "0.0";
                html += `<td style="border: 1px solid #d1d5db; padding: 6px 8px; vertical-align: top; background: #fff7f7;">
                  ${(vData.monthScrap === 0 && vData.monthPacked === 0) ? 
                    '<div style="text-align: center; color: #d1d5db; font-size: 13px; font-style: italic;">0</div>' 
                    : `<div style="text-align: left; font-weight: 800; font-size: 15px; margin-bottom: 6px; color: #065f46;">
                         ${vData.monthPacked.toLocaleString()} <span style="color: #be123c; font-size: 13px;">(${vData.monthScrap.toLocaleString()}, ${totalRate}%)</span>
                       </div>
                       ${formatScrapChipsHoriz(vData.totalScrapDetails, vData.monthPacked)}`
                  }
                </td>`;

                html += `</tr>`;
                return html;
              }).join('')}
            </tbody>
          </table>
        </div>
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
    { id: '1호기', section: 'A단면', name: '1호기', components: [{id: 'LH', source: 'A'}, {id: 'RH', source: 'A'}] },
    { id: '2호기', section: 'B단면', name: '2호기', components: [{id: 'RH2', source: 'B'}, {id: 'LH2', source: 'B'}] },
    { id: '3호기', section: 'B단면', name: '3호기', components: [{id: 'LH3', source: 'B'}, {id: 'RH3', source: 'B'}] },
    { id: '4호기', section: 'B단면', name: '4호기', components: [{id: 'LH4', source: 'B'}, {id: 'RH4', source: 'B'}] }
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
