import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  getReports: () => _ctx.reports || [],
  isReportsLoading: () => Boolean(_ctx.reportsLoading)
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
        <button class="analytics-tab-btn active" data-tab="tab-charts" style="padding: 12px 24px; font-weight: 700; background: #059669; color: #fff; border: none; border-radius: 8px 8px 0 0; font-size: 15px; cursor: pointer;">📈 공정 및 불량 분석</button>
        <button class="analytics-tab-btn" data-tab="tab-weekly" style="padding: 12px 24px; font-weight: 700; background: #e2e8f0; color: #475569; border: none; border-radius: 8px 8px 0 0; font-size: 15px; cursor: pointer;">📊 주간 스텔란티스 실적</button>
        <button class="analytics-tab-btn" data-tab="tab-9bqc-grun" style="padding: 12px 24px; font-weight: 700; background: #e2e8f0; color: #475569; border: none; border-radius: 8px 8px 0 0; font-size: 15px; cursor: pointer;">🏭 9BQC G/RUN 종합 현황판</button>
      </div>

      <!-- Tab 0: Process & Defect Analysis (React Portal Mount) -->
      <div id="tab-charts" class="analytics-tab-content" style="display: block;">
        <div id="reactProcessDefectAnalysisMount" data-analytics-react-mount="1"></div>
      </div>

      <!-- Tab 1: Weekly Stellantis Performance (Integrated Summary + DT Clip Machine + Leader Report) -->
      <div id="tab-weekly" class="analytics-tab-content" style="display: none;">
        <div class="card" style="border: 2px solid #059669;">
          <div class="card-header" style="flex-wrap: wrap; gap: 12px;">
            <div class="card-title" style="flex-wrap: wrap; gap: 8px;">
              <span style="background: #059669; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 13px; font-weight: 800;">
                📊 주간 스텔란티스 실적
              </span>
              <span style="font-size: 16px; font-weight: 800; color: #0f172a;">주간 통합 요약 (클립머신 + 반장 작업일보 통합 조회)</span>
            </div>
            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
              <!-- 내부 표 필터 버튼 그룹 -->
              <div style="display: inline-flex; background: #f1f5f9; padding: 3px; border-radius: 8px; border: 1px solid #cbd5e1; gap: 3px; flex-wrap: wrap;">
                <button type="button" class="stellantis-view-btn active" data-stellantis-view="all" style="padding: 5px 11px; border-radius: 6px; border: none; font-size: 12px; font-weight: 800; cursor: pointer; background: #059669; color: #ffffff;">📑 전체 한눈에 보기 (3개 표)</button>
                <button type="button" class="stellantis-view-btn" data-stellantis-view="summary" style="padding: 5px 11px; border-radius: 6px; border: none; font-size: 12px; font-weight: 700; cursor: pointer; background: transparent; color: #475569;">📊 1. 주간 통합 요약</button>
                <button type="button" class="stellantis-view-btn" data-stellantis-view="dtclip" style="padding: 5px 11px; border-radius: 6px; border: none; font-size: 12px; font-weight: 700; cursor: pointer; background: transparent; color: #475569;">🛠️ 2. DT 클립머신 실적</button>
                <button type="button" class="stellantis-view-btn" data-stellantis-view="leader" style="padding: 5px 11px; border-radius: 6px; border: none; font-size: 12px; font-weight: 700; cursor: pointer; background: transparent; color: #475569;">📋 3. 반장 작업일보</button>
              </div>

              <label style="font-size: 12px; font-weight: 700; color: #059669; margin-left: 4px;">조회 월 선택:</label>
              <select id="weeklyMonthSelector" class="form-control" style="width: auto; min-height: 36px; padding: 4px 12px; font-size: 13px; font-weight: 700;">
                ${months.map(m => `
                  <option value="${m}" ${m === currentSelectedMonth ? 'selected' : ''}>${m.substring(0, 4)}년 ${m.substring(5)}월</option>
                `).join('')}
              </select>
              <button class="btn btn-secondary btn-sm" id="btnPrintWeeklySummary">🖨️ 인쇄</button>
              <button class="btn btn-success btn-sm" id="btnExportWeeklyCsv">📊 통합 엑셀/CSV 다운로드</button>
            </div>
          </div>

          <div id="stellantisWeeklyPrintRoot" style="display: flex; flex-direction: column; gap: 20px;">
            <!-- 1. 주간 통합 요약 (클립머신 + 반장 작업일보 폐기불량 합계) -->
            <div id="weeklyIntegratedTableArea" data-stellantis-sec="summary"></div>

            <!-- 2. DT 클립머신 실적 (CREW A, B / QUAD A, B 소재 생산 실적 및 폐기 수량) -->
            <div id="dtclipMonthlySectionWrap" data-stellantis-sec="dtclip" style="padding: 0 16px;">
              <div style="border: 2px solid #0284c7; border-radius: 12px; background: #ffffff; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="padding: 12px 16px; background: #f0f9ff; border-bottom: 1px solid #bae6fd; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span style="background: #0284c7; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 13px; font-weight: 800;">
                      🛠️ 2. DT 클립머신 실적
                    </span>
                    <span style="font-size: 15px; font-weight: 800; color: #0f172a;">CREW (A, B) · QUAD (A, B) 소재 생산 실적 및 폐기 수량</span>
                  </div>
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <button class="btn btn-secondary btn-sm" id="btnPrintDtclipMonthly">🖨️ 클립머신 표 인쇄</button>
                    <button class="btn btn-success btn-sm" id="btnExportDtclipMonthlyCsv">📊 클립머신 CSV 다운로드</button>
                  </div>
                </div>
                <div id="dtclipMonthlyTableArea" style="padding: 14px 16px;"></div>
              </div>
            </div>

            <!-- 3. 반장 작업일보 (해당 아이템 완제품 폐기불량 단면별 수량 집계 및 근태현황) -->
            <div id="leaderMonthlySectionWrap" data-stellantis-sec="leader" style="padding: 0 16px 16px;">
              <div style="border: 2px solid #7c3aed; border-radius: 12px; background: #ffffff; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <div style="padding: 12px 16px; background: #f5f3ff; border-bottom: 1px solid #ddd6fe; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                  <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                    <span style="background: #7c3aed; color: #fff; padding: 4px 10px; border-radius: 4px; font-size: 13px; font-weight: 800;">
                      📋 3. 반장 작업일보
                    </span>
                    <span style="font-size: 15px; font-weight: 800; color: #0f172a;">해당 아이템 완제품 포장완료 및 단면별 폐기불량 수량 집계</span>
                  </div>
                  <div style="display: flex; gap: 8px; align-items: center;">
                    <button class="btn btn-secondary btn-sm" id="btnPrintLeaderMonthly">🖨️ 반장일보 표 인쇄</button>
                    <button class="btn btn-success btn-sm" id="btnExportLeaderMonthlyCsv">📊 반장일보 CSV 다운로드</button>
                  </div>
                </div>
                <div id="leaderMonthlyTableArea" style="padding: 14px 16px;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 2: GM 9BQC G/RUN Comprehensive Dashboard (React Portal Mount) -->
      <div id="tab-9bqc-grun" class="analytics-tab-content" style="display: none;">
        <div id="reactGm9bqcGrunMount" data-analytics-react-mount="1"></div>
      </div>
    </div>
`;

  // Tab switching
  const tabBtns = container.querySelectorAll('.analytics-tab-btn');
  const tabContents = container.querySelectorAll('.analytics-tab-content');
  const TAB_COLORS = {
    'tab-weekly': '#059669',
    'tab-charts': '#059669',
    'tab-9bqc-grun': '#4f46e5',
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

  // ── Weekly Stellantis Performance (Integrated + DT Clip + Leader) ──
  const weeklyMonthSelector = container.querySelector('#weeklyMonthSelector');
  const weeklyTableArea = container.querySelector('#weeklyIntegratedTableArea');
  const tableArea = container.querySelector('#leaderMonthlyTableArea');
  const dtclipTableArea = container.querySelector('#dtclipMonthlyTableArea');
  const stellantisViewBtns = container.querySelectorAll('.stellantis-view-btn');
  const stellantisSecEls = container.querySelectorAll('[data-stellantis-sec]');

  function applyStellantisSubView(viewMode) {
    stellantisViewBtns.forEach(b => {
      const isAct = b.dataset.stellantisView === viewMode;
      b.classList.toggle('active', isAct);
      b.style.background = isAct ? '#059669' : 'transparent';
      b.style.color = isAct ? '#ffffff' : '#475569';
      b.style.fontWeight = isAct ? '800' : '700';
    });
    stellantisSecEls.forEach(sec => {
      const secKey = sec.getAttribute('data-stellantis-sec');
      sec.style.display = (viewMode === 'all' || viewMode === secKey) ? 'block' : 'none';
    });
  }

  stellantisViewBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      applyStellantisSubView(btn.dataset.stellantisView || 'all');
    });
  });

  const renderedTabs = new Set();
  const loadingHtml = '<div style="padding: 40px; text-align: center; color: #64748b; font-size: 13px;">데이터를 불러오는 중...</div>';

  function updateWeeklyView(selectedMonth) {
    const currentReports = store.getReports();
    if (store.isReportsLoading() && currentReports.length === 0) {
      if (weeklyTableArea) weeklyTableArea.innerHTML = loadingHtml;
      if (dtclipTableArea) dtclipTableArea.innerHTML = loadingHtml;
      if (tableArea && !tableArea._reactRoot) tableArea.innerHTML = loadingHtml;
      return;
    }
    renderWeeklyIntegratedSummaryTable(weeklyTableArea, currentReports, selectedMonth, applyStellantisSubView);
    i18n.applyTranslations(weeklyTableArea);

    if (typeof renderDtclipMonthlySummaryTable === 'function') {
      renderDtclipMonthlySummaryTable(dtclipTableArea, currentReports, selectedMonth);
      i18n.applyTranslations(dtclipTableArea);
    }

    renderLeaderMonthlySummaryTable(tableArea, currentReports, selectedMonth);
    i18n.applyTranslations(tableArea);

    renderedTabs.add('tab-weekly');
  }

  function ensureLegacyTabRendered(tabId, force = false) {
    if (!force && renderedTabs.has(tabId)) return;
    if (tabId === 'tab-weekly' && weeklyMonthSelector) {
      updateWeeklyView(weeklyMonthSelector.value || currentSelectedMonth);
    }
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      ensureLegacyTabRendered(btn.dataset.tab, false);
    });
  });

  container._syncAnalyticsReports = () => {
    const currentReports = store.getReports();
    const nextMonths = getUniqueMonths(currentReports);
    const defaultMonth = nextMonths[0] || currentSelectedMonth;

    const syncSelector = (sel, isSumLabel) => {
      if (!sel) return;
      const prevVal = sel.value;
      const nextVal = nextMonths.includes(prevVal) ? prevVal : defaultMonth;
      sel.innerHTML = nextMonths.map(m => `
        <option value="${m}" ${m === nextVal ? 'selected' : ''}>${m.substring(0, 4)}년 ${m.substring(5)}월${isSumLabel ? ' 합산' : ''}</option>
      `).join('');
      sel.value = nextVal;
    };

    syncSelector(weeklyMonthSelector, false);

    renderedTabs.clear();
    const activeBtn = container.querySelector('.analytics-tab-btn.active');
    const activeTab = activeBtn?.dataset?.tab || 'tab-charts';
    if (activeTab !== 'tab-charts' && activeTab !== 'tab-9bqc-grun') {
      ensureLegacyTabRendered(activeTab, true);
    }
  };

  if (weeklyMonthSelector) {
    weeklyMonthSelector.addEventListener('change', () => {
      updateWeeklyView(weeklyMonthSelector.value);
    });
  }

  const btnPrintWeeklySummary = container.querySelector('#btnPrintWeeklySummary');
  if (btnPrintWeeklySummary) {
    btnPrintWeeklySummary.addEventListener('click', () => {
      const area = container.querySelector('#stellantisWeeklyPrintRoot') || container.querySelector('#weeklyIntegratedTableArea');
      if (area) printIsolatedReport(area, '주간_스텔란티스_실적_통합보고서');
    });
  }

  const btnExportWeeklyCsv = container.querySelector('#btnExportWeeklyCsv');
  if (btnExportWeeklyCsv) {
    btnExportWeeklyCsv.addEventListener('click', () => {
      exportStellantisWeeklyIntegratedCsv(store.getReports(), weeklyMonthSelector.value);
    });
  }

  const btnPrintLeaderMonthly = container.querySelector('#btnPrintLeaderMonthly');
  if (btnPrintLeaderMonthly) {
    btnPrintLeaderMonthly.addEventListener('click', () => {
      const leaderTable = container.querySelector('#leaderMonthlyTableArea');
      if (leaderTable) {
        printIsolatedReport(leaderTable, '반장_월단위_누적합산표');
      } else {
        window.print();
      }
    });
  }

  const btnExportLeaderMonthlyCsv = container.querySelector('#btnExportLeaderMonthlyCsv');
  if (btnExportLeaderMonthlyCsv) {
    btnExportLeaderMonthlyCsv.addEventListener('click', () => {
      exportLeaderMonthlyCsv(store.getReports(), weeklyMonthSelector.value);
    });
  }

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
      exportDtclipMonthlyCsv(store.getReports(), weeklyMonthSelector.value);
    });
  }

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
// 📊 주간 스텔란티스 실적 - 1. 주간 통합 요약 테이블 (반장일보 + DT 클립머신 합산)
// DT 클립머신(CREW A·B, QUAD A·B) + 반장 작업일보(완제품 단면별 폐기불량) 합계
// ══════════════════════════════════════════════════════════
function renderWeeklyIntegratedSummaryTable(container, reports, selectedMonth, applyStellantisSubView) {
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
    (r.carModel === 'DT CREW' || r.carModel === 'DT QUAD') && r.processName === '클립머신'
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

  // Helper: clip machine data for a set of reports (filtered by carModel: 'DT CREW' or 'DT QUAD')
  function getClipData(reps, targetCarModel) {
    let aPacked = 0, aScrap = 0;
    let bPacked = 0, bScrap = 0;
    const aComps = ['LH', 'RH'];
    const bComps = ['LH', 'RH', 'LH2', 'RH2', 'LH3', 'RH3', 'LH4', 'RH4'];
    const filtered = targetCarModel ? reps.filter(r => r.carModel === targetCarModel) : reps;
    filtered.forEach(r => {
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
  const rowGroups = [
    {
      group: 'DS CREW\n(반장 작업일보)', color: '#7c3aed',
      type: 'std',
      leaderNames: ['DS CREW LH', 'DS CREW RH'],
      scrapCols: ['A', 'B', 'C', 'D']
    },
    {
      group: 'DS STD\n(반장 작업일보)', color: '#0284c7',
      type: 'std',
      leaderNames: ['DS STD LH', 'DS STD RH'],
      scrapCols: ['A', 'B', 'C']
    },
    {
      group: 'DT CREW\n(반장+클립 합산)', color: '#d97706',
      type: 'dtclip_merged',
      clipCar: 'DT CREW',
      leaderNames: ['DT CREW LH', 'DT CREW RH'],
      scrapCols: ['A', 'B', 'C']
    },
    {
      group: 'DT QUAD\n(반장+클립 합산)', color: '#0891b2',
      type: 'dtclip_merged',
      clipCar: 'DT QUAD',
      leaderNames: ['DT QUAD LH', 'DT QUAD RH'],
      scrapCols: ['A', 'B', 'C']
    },
    {
      group: 'KM/KX Hood\n(반장 작업일보)', color: '#059669',
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

    if (row.type === 'dtclip_merged') {
      const ld = getLeaderDataMerged(wLeader, row.leaderNames);
      const clip = getClipData(wClip, row.clipCar);
      
      const totalA = ld.scrapA + clip.aScrap;
      const totalB = ld.scrapB + clip.bScrap;
      const totalC = ld.scrapC;
      const totalScrap = totalA + totalB + totalC;
      const totalPacked = ld.packed + clip.aPacked + clip.bPacked;
      
      return {
        packedLH: ld.packedLH, packedRH: ld.packedRH, packedOther: ld.packedOther,
        leaderPacked: ld.packed,
        clipAPacked: clip.aPacked, clipBPacked: clip.bPacked,
        packed: totalPacked,
        scrap: totalScrap,
        leaderScrap: ld.scrapA + ld.scrapB + ld.scrapC,
        clipScrap: clip.aScrap + clip.bScrap,
        detail: { 'A': totalA, 'B': totalB, 'C': totalC },
        ldDetail: { 'A': ld.scrapA, 'B': ld.scrapB, 'C': ld.scrapC },
        clipDetail: { 'A': clip.aScrap, 'B': clip.bScrap, 'C': 0 }
      };
    } else if (row.type === 'hood') {
      const d = getLeaderDataMerged(wLeader, row.leaderNames);
      const scrap = d.scrapCenter + d.scrapSide;
      return {
        packedLH: d.packedLH, packedRH: d.packedRH, packedOther: d.packedOther,
        leaderPacked: d.packed, clipAPacked: 0, clipBPacked: 0,
        packed: d.packed, scrap, leaderScrap: scrap, clipScrap: 0,
        detail: { '센터': d.scrapCenter, '사이드': d.scrapSide },
        ldDetail: { '센터': d.scrapCenter, '사이드': d.scrapSide },
        clipDetail: {}
      };
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
      return {
        packedLH: d.packedLH, packedRH: d.packedRH, packedOther: d.packedOther,
        leaderPacked: d.packed, clipAPacked: 0, clipBPacked: 0,
        packed: d.packed, scrap, leaderScrap: scrap, clipScrap: 0,
        detail, ldDetail: { ...detail }, clipDetail: {}
      };
    }
  }

  // Compute all data
  const allRowData = rowGroups.map(row => {
    const weekData = weeks.map(w => computeWeekData(w, row));
    const totalPackedLH = weekData.reduce((s, w) => s + w.packedLH, 0);
    const totalPackedRH = weekData.reduce((s, w) => s + w.packedRH, 0);
    const totalPackedOther = weekData.reduce((s, w) => s + w.packedOther, 0);
    const totalLeaderPacked = weekData.reduce((s, w) => s + (w.leaderPacked || 0), 0);
    const totalClipAPacked = weekData.reduce((s, w) => s + (w.clipAPacked || 0), 0);
    const totalClipBPacked = weekData.reduce((s, w) => s + (w.clipBPacked || 0), 0);
    const totalPacked = weekData.reduce((s, w) => s + w.packed, 0);
    const totalScrap = weekData.reduce((s, w) => s + w.scrap, 0);
    const totalLeaderScrap = weekData.reduce((s, w) => s + (w.leaderScrap || 0), 0);
    const totalClipScrap = weekData.reduce((s, w) => s + (w.clipScrap || 0), 0);
    const totalDetail = {};
    const totalLdDetail = {};
    const totalClipDetail = {};
    row.scrapCols.forEach(col => {
      totalDetail[col] = weekData.reduce((s, w) => s + (w.detail[col] || 0), 0);
      totalLdDetail[col] = weekData.reduce((s, w) => s + (w.ldDetail?.[col] || 0), 0);
      totalClipDetail[col] = weekData.reduce((s, w) => s + (w.clipDetail?.[col] || 0), 0);
    });
    return {
      ...row, weekData,
      totalPackedLH, totalPackedRH, totalPackedOther,
      totalLeaderPacked, totalClipAPacked, totalClipBPacked,
      totalPacked, totalScrap, totalLeaderScrap, totalClipScrap,
      totalDetail, totalLdDetail, totalClipDetail
    };
  });

  // Grand totals
  const grandPacked = allRowData.reduce((s, r) => s + r.totalPacked, 0);
  const grandScrap = allRowData.reduce((s, r) => s + r.totalScrap, 0);
  const grandRate = grandPacked > 0 ? ((grandScrap / grandPacked) * 100).toFixed(2) : '0.00';

  // Component breakdown totals for the formula diagram banner
  const crewClipMonth = getClipData(clipReports, 'DT CREW');
  const quadClipMonth = getClipData(clipReports, 'DT QUAD');
  const totalClipPackedAll = crewClipMonth.aPacked + crewClipMonth.bPacked + quadClipMonth.aPacked + quadClipMonth.bPacked;
  const totalClipScrapAll = crewClipMonth.aScrap + crewClipMonth.bScrap + quadClipMonth.aScrap + quadClipMonth.bScrap;
  const totalLeaderPackedAll = allRowData.reduce((s, r) => s + r.totalLeaderPacked, 0);
  const totalLeaderScrapAll = allRowData.reduce((s, r) => s + r.totalLeaderScrap, 0);

  // Weekly grand totals
  const weekGrandData = weeks.map((_, wi) => {
    const p = allRowData.reduce((s, r) => s + r.weekData[wi].packed, 0);
    const sc = allRowData.reduce((s, r) => s + r.weekData[wi].scrap, 0);
    return { packed: p, scrap: sc };
  });

  // Render a scrap detail chip (shows qty, %, and optional 반장+클립 breakdown)
  const scrapChip = (label, count, basePacked, isHighlight, breakdownInfo) => {
    const pct = basePacked > 0 ? ((count / basePacked) * 100).toFixed(1) : '0.0';
    const subTag = (breakdownInfo && breakdownInfo.isMerged && (breakdownInfo.ld > 0 || breakdownInfo.clip > 0))
      ? `<div style="font-size:10px;color:#64748b;font-weight:600;margin-top:1px;">반장 ${breakdownInfo.ld} + 클립 ${breakdownInfo.clip}</div>`
      : '';
    if (count === 0) {
      return `<div style="display:flex;align-items:center;justify-content:space-between;padding:3px 8px;margin-bottom:2px;background:#f8fafc;border-radius:4px;border:1px solid #e2e8f0;">
        <span style="font-size:12px;font-weight:700;color:#94a3b8;">${label}</span>
        <span style="font-size:12px;color:#cbd5e1;">0 <span style="font-size:10px;">(0.0%)</span></span>
      </div>`;
    }
    const bg = isHighlight ? '#fef2f2' : '#fff7f0';
    const textColor = isHighlight ? '#dc2626' : '#b45309';
    return `<div style="padding:3px 8px;margin-bottom:2px;background:${bg};border-radius:4px;border:1px solid ${isHighlight ? '#fecdd3' : '#fed7aa'};">
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:12px;font-weight:700;color:${textColor};">${label}</span>
        <span style="font-size:12px;font-weight:700;color:${textColor};">${count} <span style="font-size:10px;opacity:0.8;">(${pct}%)</span></span>
      </div>
      ${subTag}
    </div>`;
  };

  // Render one table cell
  const renderCell = (wData, bgColor, row) => {
    const { packedLH, packedRH, packedOther, clipAPacked, clipBPacked, packed, scrap, detail, ldDetail, clipDetail } = wData;
    const isMerged = row.type === 'dtclip_merged';
    const hasData = packed > 0 || scrap > 0;
    const detailChips = row.scrapCols.map(col => scrapChip(
      col,
      detail[col] || 0,
      packed,
      scrap > 0,
      { isMerged: isMerged && (col === 'A' || col === 'B'), ld: ldDetail?.[col] || 0, clip: clipDetail?.[col] || 0 }
    )).join('');

    let topHtml = '';
    if (packedOther > 0 || (packedLH === 0 && packedRH === 0 && packed > 0 && !isMerged)) {
       topHtml = `<span style="font-weight:700;font-size:12px;color:#065f46;">완제품: ${packed.toLocaleString()} EA</span>`;
    } else if (isMerged) {
       topHtml = `
         <div style="font-size:11px;line-height:1.35;">
           <div><span style="color:#6d28d9;font-weight:700;">반장(완제품):</span> <span style="font-weight:800;color:#065f46;">LH ${packedLH.toLocaleString()} | RH ${packedRH.toLocaleString()}</span></div>
           <div style="margin-top:2px;"><span style="color:#0369a1;font-weight:700;">클립(소재):</span> <span style="font-weight:800;color:#0284c7;">A ${clipAPacked.toLocaleString()} | B ${clipBPacked.toLocaleString()}</span></div>
         </div>
       `;
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
    <div style="padding:16px 16px 4px;font-family:'Noto Sans KR',sans-serif;color:#1f2937;">
      <!-- 통합 구조 시각화 다이어그램 (DT 클립머신 실적 + 반장 작업일보 = 주간 통합 요약) -->
      <div style="display:grid;grid-template-columns:1fr auto 1fr auto 1.15fr;gap:10px;align-items:stretch;margin-bottom:18px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;padding:14px;">
        <!-- Box 1: DT 클립머신 실적 -->
        <div data-jump-stellantis="dtclip" style="background:#ffffff;border:2px solid #0284c7;border-radius:10px;padding:12px 14px;cursor:pointer;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 1px 2px rgba(0,0,0,0.04);" title="클릭하여 DT 클립머신 실적 상세 표 보기">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="background:#e0f2fe;color:#0369a1;font-weight:800;font-size:12px;padding:2px 8px;border-radius:5px;">🛠️ DT 클립머신 실적</span>
              <span style="font-size:11px;color:#0284c7;font-weight:700;">상세 조회 →</span>
            </div>
            <div style="font-size:12px;font-weight:700;color:#334155;margin-bottom:8px;">CREW (A, B) · QUAD (A, B) 소재 생산 실적 및 폐기 수량</div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;background:#f0f9ff;padding:8px 10px;border-radius:7px;border:1px solid #bae6fd;font-size:11px;">
            <div>
              <div style="color:#0369a1;font-weight:800;">CREW A·B</div>
              <div style="color:#0f172a;font-weight:700;">실적 ${(crewClipMonth.aPacked + crewClipMonth.bPacked).toLocaleString()} / <span style="color:#dc2626;">폐기 ${(crewClipMonth.aScrap + crewClipMonth.bScrap).toLocaleString()}</span></div>
            </div>
            <div>
              <div style="color:#0891b2;font-weight:800;">QUAD A·B</div>
              <div style="color:#0f172a;font-weight:700;">실적 ${(quadClipMonth.aPacked + quadClipMonth.bPacked).toLocaleString()} / <span style="color:#dc2626;">폐기 ${(quadClipMonth.aScrap + quadClipMonth.bScrap).toLocaleString()}</span></div>
            </div>
          </div>
        </div>

        <!-- Plus Sign -->
        <div style="display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#0f172a;padding:0 2px;">➕</div>

        <!-- Box 2: 반장 작업일보 -->
        <div data-jump-stellantis="leader" style="background:#ffffff;border:2px solid #7c3aed;border-radius:10px;padding:12px 14px;cursor:pointer;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 1px 2px rgba(0,0,0,0.04);" title="클릭하여 반장 작업일보 상세 표 보기">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="background:#ede9fe;color:#6d28d9;font-weight:800;font-size:12px;padding:2px 8px;border-radius:5px;">📋 반장 작업일보</span>
              <span style="font-size:11px;color:#7c3aed;font-weight:700;">상세 조회 →</span>
            </div>
            <div style="font-size:12px;font-weight:700;color:#334155;margin-bottom:8px;">해당 아이템 완제품 포장완료 및 단면별 폐기불량 수량 집계</div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;background:#f5f3ff;padding:8px 10px;border-radius:7px;border:1px solid #ddd6fe;font-size:12px;">
            <div><span style="color:#5b21b6;font-weight:700;">완제품 포장:</span> <strong style="color:#065f46;">${totalLeaderPackedAll.toLocaleString()} EA</strong></div>
            <div><span style="color:#5b21b6;font-weight:700;">완제품 폐기:</span> <strong style="color:#dc2626;">${totalLeaderScrapAll.toLocaleString()} EA</strong></div>
          </div>
        </div>

        <!-- Equals Sign -->
        <div style="display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:900;color:#059669;padding:0 2px;">🟰</div>

        <!-- Box 3: 주간 통합 요약 -->
        <div data-jump-stellantis="all" style="background:#ecfdf5;border:2px solid #059669;border-radius:10px;padding:12px 14px;cursor:pointer;display:flex;flex-direction:column;justify-content:space-between;box-shadow:0 1px 2px rgba(0,0,0,0.04);" title="클릭하여 전체 통합 표 보기">
          <div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
              <span style="background:#059669;color:#ffffff;font-weight:800;font-size:12px;padding:2px 8px;border-radius:5px;">📊 주간 통합 요약</span>
              <span style="font-size:11px;color:#065f46;font-weight:800;">불량률 ${grandRate}%</span>
            </div>
            <div style="font-size:12px;font-weight:800;color:#064e3b;margin-bottom:8px;">클립머신 + 반장 작업일보 폐기불량 합계</div>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;background:#ffffff;padding:8px 10px;border-radius:7px;border:1px solid #a7f3d0;font-size:12px;">
            <div><span style="color:#065f46;font-weight:700;">총 실적합계:</span> <strong style="color:#065f46;font-size:14px;">${grandPacked.toLocaleString()} EA</strong></div>
            <div><span style="color:#991b1b;font-weight:700;">총 폐기합계:</span> <strong style="color:#dc2626;font-size:14px;">${grandScrap.toLocaleString()} EA</strong> <span style="font-size:10px;color:#64748b;">(클립 ${totalClipScrapAll}+반장 ${totalLeaderScrapAll})</span></div>
          </div>
        </div>
      </div>

      <!-- Main Table: 1. 주간 통합 요약 표 -->
      <div style="background:#fff;border:2px solid #059669;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
        <div style="padding:12px 16px;background:#ecfdf5;border-bottom:1px solid #a7f3d0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span style="background:#059669;color:#fff;padding:4px 10px;border-radius:4px;font-size:13px;font-weight:800;">
              📊 1. 주간 통합 요약
            </span>
            <span style="font-weight:800;font-size:15px;color:#0f172a;">
              ${yearNum}년 ${monthNum}월 클립머신 + 반장 작업일보 폐기불량 합계표 (LH·RH 합산)
            </span>
          </div>
          <span style="font-size:12px;color:#065f46;font-weight:700;">
            💡 DT CREW · DT QUAD 행은 [반장 완제품 + 클립머신 A·B단면] 실적 및 폐기수량이 함께 표시됩니다.
          </span>
        </div>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;min-width:1000px;table-layout:fixed;">
            <colgroup>
              <col style="width:135px;"/>
              ${Array(displayWeeksCount + 1).fill('<col/>').join('')}
            </colgroup>
            <thead>
              <tr style="background:#f1f5f9;">
                <th rowspan="2" style="border:1px solid #e2e8f0;padding:10px 8px;text-align:center;font-size:13px;font-weight:700;color:#374151;">차종 / 구분</th>
                <th colspan="${displayWeeksCount}" style="border:1px solid #e2e8f0;padding:8px;text-align:center;font-size:13px;font-weight:700;color:#374151;">
                  주차별 생산수량 (완제품·클립소재) / 단면별 폐기불량 합계
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
    const isMerged = row.type === 'dtclip_merged';
    tableHtml += `<tr style="background:${rowBg};">`;

    // Car model label cell
    tableHtml += `<td style="border:1px solid #e2e8f0;padding:8px;text-align:center;vertical-align:middle;font-weight:800;font-size:12px;background:${row.color}12;color:${row.color};white-space:pre-line;">${row.group}</td>`;

    // Week cells
    for (let wi = startIdx; wi <= endIdx; wi++) {
      tableHtml += renderCell(row.weekData[wi], rowBg, row);
    }

    // Cumulative total cell
    const totalChips = row.scrapCols.map(col => scrapChip(
      col,
      row.totalDetail[col] || 0,
      row.totalPacked,
      true,
      { isMerged: isMerged && (col === 'A' || col === 'B'), ld: row.totalLdDetail?.[col] || 0, clip: row.totalClipDetail?.[col] || 0 }
    )).join('');

    let topHtmlTotal = '';
    if (row.totalPackedOther > 0 || (row.totalPackedLH === 0 && row.totalPackedRH === 0 && row.totalPacked > 0 && !isMerged)) {
       topHtmlTotal = `<span style="font-weight:800;font-size:13px;color:#065f46;">완제품: ${row.totalPacked.toLocaleString()} EA</span>`;
    } else if (isMerged) {
       topHtmlTotal = `
         <div style="font-size:11px;line-height:1.4;">
           <div><span style="color:#6d28d9;font-weight:700;">반장(완제품):</span> <span style="font-weight:800;color:#065f46;">LH ${row.totalPackedLH.toLocaleString()} | RH ${row.totalPackedRH.toLocaleString()}</span></div>
           <div style="margin-top:2px;"><span style="color:#0369a1;font-weight:700;">클립(소재):</span> <span style="font-weight:800;color:#0284c7;">A ${row.totalClipAPacked.toLocaleString()} | B ${row.totalClipBPacked.toLocaleString()}</span></div>
         </div>
       `;
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
    </div>
  `;

  container.innerHTML = tableHtml;

  if (typeof applyStellantisSubView === 'function') {
    container.querySelectorAll('[data-jump-stellantis]').forEach(el => {
      el.addEventListener('click', () => {
        const targetMode = el.getAttribute('data-jump-stellantis') || 'all';
        applyStellantisSubView(targetMode);
      });
    });
  }
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

        const weeklyScrapsAll = weeks.map(w => {
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

        const totalScrap = weeklyScrapsAll.reduce((acc, ws) => ({
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
          weeklyScraps: weeklyScrapsAll.slice(startIdx, endIdx + 1),
          totalScrap
        };
      })
    };
  });

  const totalMonthlyPacked = groupData.reduce((acc, g) => acc + g.variants.reduce((a, v) => a + v.monthPacked, 0), 0);
  const totalMonthlyScrap = groupData.reduce((acc, g) => acc + g.variants.reduce((a, v) => a + Object.values(v.totalScrap).reduce((sa, sv) => sa + sv, 0), 0), 0);
  const avgDefectRate = totalMonthlyPacked > 0 ? ((totalMonthlyScrap / totalMonthlyPacked) * 100).toFixed(2) : '0.00';

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
    container.innerHTML = '';
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
  csvContent += `순번,아이템명,월간 포장완료 수량,월간 리워크 수량,A단면 폐기,B단면 폐기,C단면 폐기,D단면 폐기,센터 폐기,사이드 폐기,월간 폐기 합계,불량률(%)\n`;

  DEFAULT_LEADER_ITEMS.forEach((it, idx) => {
    let packed = 0, rework = 0, sA = 0, sB = 0, sC = 0, sD = 0, sCenter = 0, sSide = 0, scrap = 0;
    monthReports.forEach(r => {
      const found = (r.leaderFormItems || []).find(i => i.name === it.name);
      if (found) {
        packed += Number(found.packedQty) || 0;
        rework += Number(found.reworkQty) || 0;
        sA += Number(found.scrapA) || 0;
        sB += Number(found.scrapB) || 0;
        sC += Number(found.scrapC) || 0;
        sD += Number(found.scrapD) || 0;
        sCenter += Number(found.scrapCenter) || 0;
        sSide += Number(found.scrapSide) || 0;
      }
    });
    scrap = (it.name === 'KM/KX Hood') ? (sCenter + sSide) : (sA + sB + sC + sD);
    const rate = packed > 0 ? ((scrap / packed) * 100).toFixed(2) : '0.00';
    csvContent += `${idx+1},"${it.name}",${packed},${rework},${sA},${sB},${sC},${sD},${sCenter},${sSide},${scrap},${rate}%\n`;
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

import { useI18n } from '../../contexts/I18nContext';

export default function LegacyAnalyticsWrapper({ reports, reportsLoading = false, initialActiveTab, chartsContent, grunContent }) {
  const containerRef = useRef(null);
  const latestCtxRef = useRef({ reports, reportsLoading });
  latestCtxRef.current = { reports, reportsLoading };
  const { lang } = useI18n();
  const [chartsMount, setChartsMount] = useState(null);
  const [grunMount, setGrunMount] = useState(null);
  const normalizedInitialTab = (initialActiveTab === 'tab-leader' || initialActiveTab === 'tab-dtclip')
    ? 'tab-weekly'
    : (initialActiveTab || 'tab-charts');
  const [activeTabId, setActiveTabId] = useState(normalizedInitialTab);

  useEffect(() => {
    const rootEl = containerRef.current;
    if (!rootEl) return;
    i18n.setLang(lang, false);
    setLegacyAnalyticsContext(latestCtxRef.current);
    window.Chart = Chart;

    try {
      renderAnalytics(rootEl);
    } catch (e) {
      console.error(e);
    }

    const mountEl = rootEl.querySelector('#reactProcessDefectAnalysisMount');
    setChartsMount(mountEl);
    setGrunMount(rootEl.querySelector('#reactGm9bqcGrunMount'));

    const tabBtns = rootEl.querySelectorAll('.analytics-tab-btn');
    const onTabClick = (e) => {
      const tabId = e.currentTarget?.dataset?.tab;
      if (tabId) setActiveTabId(tabId);
    };
    tabBtns.forEach((btn) => btn.addEventListener('click', onTabClick));

    const targetTab = (initialActiveTab === 'tab-leader' || initialActiveTab === 'tab-dtclip')
      ? 'tab-weekly'
      : (initialActiveTab || 'tab-charts');
    if (targetTab !== 'tab-charts') {
      const targetBtn = rootEl.querySelector(`.analytics-tab-btn[data-tab="${targetTab}"]`);
      if (targetBtn) targetBtn.click();
      if (initialActiveTab === 'tab-leader') {
        rootEl.querySelector('.stellantis-view-btn[data-stellantis-view="leader"]')?.click();
      } else if (initialActiveTab === 'tab-dtclip') {
        rootEl.querySelector('.stellantis-view-btn[data-stellantis-view="dtclip"]')?.click();
      }
    } else {
      setActiveTabId('tab-charts');
    }

    return () => {
      tabBtns.forEach((btn) => btn.removeEventListener('click', onTabClick));
    };
  }, [lang, initialActiveTab]);

  useEffect(() => {
    setLegacyAnalyticsContext({ reports, reportsLoading });
    const rootEl = containerRef.current;
    if (rootEl && typeof rootEl._syncAnalyticsReports === 'function') {
      rootEl._syncAnalyticsReports();
    }
  }, [reports, reportsLoading]);

  return (
    <>
      <div ref={containerRef} className="legacy-analytics-container"></div>
      {chartsMount && activeTabId === 'tab-charts' && chartsContent
        ? createPortal(chartsContent, chartsMount)
        : null}
      {grunMount && activeTabId === 'tab-9bqc-grun' && grunContent
        ? createPortal(grunContent, grunMount)
        : null}
    </>
  );
}

// ══════════════════════════════════════════════════════════
// 🛠️ 주간 스텔란티스 실적 - 2. DT 클립머신 실적 표
// CREW A, B / QUAD A, B 소재 생산 실적 및 폐기 수량 집계
// ══════════════════════════════════════════════════════════
const DTCLIP_ROWS_CONFIG = [
  {
    seq: 1,
    carModel: 'DT CREW',
    carColor: '#d97706',
    sectionKey: 'CREW A',
    sectionLabel: 'CREW A (A단면)',
    equipLabel: '1호기 (LH / RH)',
    source: 'A',
    lhComps: ['LH'],
    rhComps: ['RH'],
    subEquipGroups: [
      { name: '1호기', comps: ['LH', 'RH'] }
    ]
  },
  {
    seq: 2,
    carModel: 'DT CREW',
    carColor: '#d97706',
    sectionKey: 'CREW B',
    sectionLabel: 'CREW B (B단면)',
    equipLabel: '2·3·4호기 (LH 3·4호 / RH 2·4호)',
    source: 'B',
    lhComps: ['LH', 'LH2', 'LH3', 'LH4'],
    rhComps: ['RH', 'RH2', 'RH3', 'RH4'],
    subEquipGroups: [
      { name: '2호기', comps: ['RH2', 'LH2'] },
      { name: '3호기', comps: ['LH3', 'RH3'] },
      { name: '4호기', comps: ['LH4', 'RH4'] }
    ]
  },
  {
    seq: 3,
    carModel: 'DT QUAD',
    carColor: '#0891b2',
    sectionKey: 'QUAD A',
    sectionLabel: 'QUAD A (A단면)',
    equipLabel: '1호기 (LH / RH)',
    source: 'A',
    lhComps: ['LH'],
    rhComps: ['RH'],
    subEquipGroups: [
      { name: '1호기', comps: ['LH', 'RH'] }
    ]
  },
  {
    seq: 4,
    carModel: 'DT QUAD',
    carColor: '#0891b2',
    sectionKey: 'QUAD B',
    sectionLabel: 'QUAD B (B단면)',
    equipLabel: '2·3호기 (LH 2호 / RH 3호)',
    source: 'B',
    lhComps: ['LH', 'LH2', 'LH3', 'LH4'],
    rhComps: ['RH', 'RH2', 'RH3', 'RH4'],
    subEquipGroups: [
      { name: 'LH(2호)', comps: ['LH3', 'LH2', 'LH'] },
      { name: 'RH(3호)', comps: ['RH2', 'RH3', 'RH'] }
    ]
  }
];

function renderDtclipMonthlySummaryTable(container, reports, selectedMonth) {
  const weeks = getWeeksOfMonth(selectedMonth);
  const minDateStr = toLocalYMD(weeks[0].start);
  const maxDateStr = toLocalYMD(weeks[weeks.length - 1].end);

  const monthReports = reports.filter(r =>
    r.date && r.date >= minDateStr && r.date <= maxDateStr &&
    (r.carModel === 'DT CREW' || r.carModel === 'DT QUAD') && r.processName === '클립머신'
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

  const variantData = DTCLIP_ROWS_CONFIG.map(cfg => {
    let monthPackedLH = 0;
    let monthPackedRH = 0;
    let monthPacked = 0;
    let monthScrap = 0;
    const allComps = [...cfg.lhComps, ...cfg.rhComps];

    const weeklyScraps = weeks.map(w => {
      const wStartStr = toLocalYMD(w.start);
      const wEndStr = toLocalYMD(w.end);
      const wReports = monthReports.filter(r =>
        r.carModel === cfg.carModel && r.date >= wStartStr && r.date <= wEndStr
      );

      let wPackedLH = 0, wPackedRH = 0, wPacked = 0, wScrapTotal = 0;
      let d1 = 0, d2 = 0, d3 = 0, d4 = 0, d5 = 0, d6 = 0, d7 = 0, d8 = 0;

      wReports.forEach(r => {
        const qtyObj = cfg.source === 'A' ? r.dtCrewQty : r.dtCrewQtyB;
        if (!qtyObj) return;

        cfg.lhComps.forEach(cid => {
          wPackedLH += Number(qtyObj[`정품수량_${cid}`]) || 0;
        });
        cfg.rhComps.forEach(cid => {
          wPackedRH += Number(qtyObj[`정품수량_${cid}`]) || 0;
        });

        allComps.forEach(cid => {
          wScrapTotal += Number(qtyObj[`불량합계_${cid}`]) || 0;
          d1 += Number(qtyObj[`길이미달_${cid}`]) || 0;
          d2 += Number(qtyObj[`길이초과_${cid}`]) || 0;
          d3 += Number(qtyObj[`끝단부불량_${cid}`]) || 0;
          d4 += Number(qtyObj[`클립홀찢어짐_${cid}`]) || 0;
          d5 += Number(qtyObj[`클립간격불량_${cid}`]) || 0;
          d6 += Number(qtyObj[`드레인홀불량_${cid}`]) || 0;
          d7 += Number(qtyObj[`스코치_${cid}`]) || 0;
          d8 += Number(qtyObj[`기타_${cid}`]) || 0;
        });
      });

      wPacked = wPackedLH + wPackedRH;
      monthPackedLH += wPackedLH;
      monthPackedRH += wPackedRH;
      monthPacked += wPacked;
      monthScrap += wScrapTotal;

      return { wPackedLH, wPackedRH, wPacked, wScrapTotal, d1, d2, d3, d4, d5, d6, d7, d8 };
    });

    // 호기별 월간 요약
    const equipSummary = (cfg.subEquipGroups || []).map(eg => {
      let eqPacked = 0, eqScrap = 0;
      monthReports.filter(r => r.carModel === cfg.carModel).forEach(r => {
        const qtyObj = cfg.source === 'A' ? r.dtCrewQty : r.dtCrewQtyB;
        if (!qtyObj) return;
        eg.comps.forEach(cid => {
          eqPacked += Number(qtyObj[`정품수량_${cid}`]) || 0;
          eqScrap += Number(qtyObj[`불량합계_${cid}`]) || 0;
        });
      });
      return { name: eg.name, packed: eqPacked, scrap: eqScrap };
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
      cfg,
      monthPackedLH,
      monthPackedRH,
      monthPacked,
      monthScrap,
      equipSummary,
      weeklyScraps,
      totalScrapDetails
    };
  });

  const crewRows = variantData.filter(v => v.cfg.carModel === 'DT CREW');
  const quadRows = variantData.filter(v => v.cfg.carModel === 'DT QUAD');
  const crewPacked = crewRows.reduce((s, v) => s + v.monthPacked, 0);
  const crewScrap = crewRows.reduce((s, v) => s + v.monthScrap, 0);
  const quadPacked = quadRows.reduce((s, v) => s + v.monthPacked, 0);
  const quadScrap = quadRows.reduce((s, v) => s + v.monthScrap, 0);

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
    <div style="width: 100%; font-family: 'Noto Sans KR', sans-serif; color: #1f2937; display: flex; flex-direction: column; gap: 12px;">
      
      <!-- 클립머신 KPI 카드 4개 (CREW A·B / QUAD A·B / 총 정품 / 총 폐기) -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
        <div style="background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 11px 14px;">
          <div style="font-size: 12px; font-weight: 700; color: #b45309; margin-bottom: 3px;">DT CREW (A·B단면) 소재 실적</div>
          <div style="font-size: 19px; font-weight: 800; color: #111827;">
            ${crewPacked.toLocaleString()} <span style="font-size: 12px; font-weight: 600; color: #6b7280;">EA</span>
            <span style="font-size: 12px; font-weight: 700; color: #dc2626; margin-left: 6px;">(폐기 ${crewScrap.toLocaleString()})</span>
          </div>
        </div>

        <div style="background: #ecfeff; border: 1px solid #a5f3fc; border-radius: 10px; padding: 11px 14px;">
          <div style="font-size: 12px; font-weight: 700; color: #0e7490; margin-bottom: 3px;">DT QUAD (A·B단면) 소재 실적</div>
          <div style="font-size: 19px; font-weight: 800; color: #111827;">
            ${quadPacked.toLocaleString()} <span style="font-size: 12px; font-weight: 600; color: #6b7280;">EA</span>
            <span style="font-size: 12px; font-weight: 700; color: #dc2626; margin-left: 6px;">(폐기 ${quadScrap.toLocaleString()})</span>
          </div>
        </div>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 11px 14px;">
          <div style="font-size: 12px; font-weight: 700; color: #065f46; margin-bottom: 3px;">클립머신 월간 총 소재 생산(정품)</div>
          <div style="font-size: 20px; font-weight: 800; color: #065f46;">${totalMonthlyPacked.toLocaleString()} <span style="font-size: 13px; font-weight: normal;">EA</span></div>
        </div>
        
        <div style="background: #fff1f2; border: 1px solid #fecdd3; border-radius: 10px; padding: 11px 14px;">
          <div style="font-size: 12px; font-weight: 700; color: #be123c; margin-bottom: 3px;">클립머신 월간 총 폐기수량 (불량률)</div>
          <div style="font-size: 20px; font-weight: 800; color: #be123c;">${totalMonthlyScrap.toLocaleString()} <span style="font-size: 13px; font-weight: normal;">EA (${avgDefectRate}%)</span></div>
        </div>
      </div>

      <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); overflow: hidden;">
        <div style="padding: 8px 14px; border-bottom: 1px solid #e5e7eb; background: #f9fafb; font-size: 14px; font-weight: 700; color: #1f2937; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
          <span>${monthNum}월 DT 클립머신 단면별 소재 생산 실적 및 폐기 수량 (CREW A·B / QUAD A·B)</span>
          <span style="font-size: 12px; color: #64748b; font-weight: 600;">각 셀 상단: 정품수량 (LH/RH) 및 폐기합계 · 하단: 8대 불량유형별 수량</span>
        </div>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; table-layout: fixed; min-width: 1020px;">
            <colgroup>
              <col style="width: 85px;" />
              <col style="width: 130px;" />
              <col style="width: 125px;" />
              ${Array.from({ length: displayWeeksCount }).map(() => '<col />').join('')}
              <col />
            </colgroup>
            <thead>
              <tr>
                <th rowspan="2" style="border: 1px solid #d1d5db; padding: 6px 7px; text-align: center; font-weight: 700; font-size: 13px; background: #f8fafc; color: #374151;">차종</th>
                <th rowspan="2" style="border: 1px solid #d1d5db; padding: 6px 7px; text-align: center; font-weight: 700; font-size: 13px; background: #f8fafc; color: #374151;">단면 / 호기 구분</th>
                <th rowspan="2" style="border: 1px solid #d1d5db; padding: 6px 7px; text-align: center; font-weight: 700; font-size: 13px; background: #f0fdf4; color: #065f46;">월간 소재 생산<br><span style="font-size:11px;font-weight:600;">(정품 / 폐기)</span></th>
                <th colspan="${displayWeeksCount}" style="border: 1px solid #d1d5db; padding: 6px 7px; text-align: center; font-weight: 700; font-size: 13px; background: #f8fafc; color: #374151; border-bottom: 1px solid #d1d5db;">주차별 소재 생산실적 및 폐기불량 현황</th>
                <th rowspan="2" style="border: 1px solid #d1d5db; padding: 6px 7px; text-align: center; font-weight: 700; font-size: 13px; background: #fff7f7; color: #991b1b;">${monthNum}월 누적 불량 세부내역</th>
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
                const { cfg } = vData;
                const rowBg = vIdx % 2 === 0 ? "#fff" : "#f9fafb";
                const isFirstOfCar = vIdx === 0 || variantData[vIdx - 1].cfg.carModel !== cfg.carModel;
                let html = `<tr style="background: ${rowBg};">`;

                if (isFirstOfCar) {
                  html += `<td rowspan="2" style="border: 1px solid #d1d5db; padding: 6px; text-align: center; vertical-align: middle; font-size: 13px; font-weight: 800; color: ${cfg.carColor}; background: ${cfg.carColor}12;">${cfg.carModel}</td>`;
                }

                const equipBadges = vData.equipSummary.length > 1
                  ? `<div style="margin-top:4px;display:flex;flex-wrap:wrap;gap:3px;justify-content:center;">
                      ${vData.equipSummary.map(eq => `<span style="font-size:10px;background:#f1f5f9;border:1px solid #cbd5e1;border-radius:4px;padding:1px 5px;color:#334155;font-weight:700;">${eq.name}: ${eq.packed}/${eq.scrap}</span>`).join('')}
                    </div>`
                  : '';

                html += `<td style="border: 1px solid #d1d5db; padding: 6px; text-align: center; vertical-align: middle;">
                  <div style="font-size: 13px; font-weight: 800; color: #0f172a;">${cfg.sectionLabel}</div>
                  <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${cfg.equipLabel}</div>
                  ${equipBadges}
                </td>`;

                const totalRate = vData.monthPacked > 0 ? ((vData.monthScrap / vData.monthPacked) * 100).toFixed(1) : "0.0";
                html += `<td style="border: 1px solid #d1d5db; padding: 6px; text-align: center; vertical-align: middle; background: #f0fdf422;">
                  <div style="font-size: 14px; font-weight: 800; color: #065f46;">정품 ${vData.monthPacked.toLocaleString()} EA</div>
                  <div style="font-size: 11px; color: #475569; font-weight: 600; margin-top: 2px;">LH ${vData.monthPackedLH.toLocaleString()} | RH ${vData.monthPackedRH.toLocaleString()}</div>
                  <div style="font-size: 12px; font-weight: 700; color: #be123c; margin-top: 3px;">폐기 ${vData.monthScrap.toLocaleString()} EA (${totalRate}%)</div>
                </td>`;
                
                for (let i = startIdx; i <= endIdx; i++) {
                  const ws = vData.weeklyScraps[i];
                  const rate = ws.wPacked > 0 ? ((ws.wScrapTotal / ws.wPacked) * 100).toFixed(1) : "0.0";
                  
                  html += `<td style="border: 1px solid #d1d5db; padding: 5px 6px; vertical-align: top;">`;
                  
                  if (ws.wScrapTotal === 0 && ws.wPacked === 0) {
                     html += `<div style="text-align: center; color: #d1d5db; font-size: 13px; font-style: italic; padding: 8px 0;">-</div>`;
                  } else {
                     html += `<div style="font-weight: 700; color: #065f46; margin-bottom: 5px; font-size: 12px; text-align: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
                                <span>정품 ${ws.wPacked.toLocaleString()}</span>
                                <span style="font-size:11px;color:#64748b;font-weight:600;"> (LH ${ws.wPackedLH}/RH ${ws.wPackedRH})</span>
                                <span style="color:#be123c; margin-left: 4px;">폐기 ${ws.wScrapTotal.toLocaleString()} (${rate}%)</span>
                              </div>
                              ${formatScrapChipsHoriz(ws, ws.wPacked)}`;
                  }
                  
                  html += `</td>`;
                }

                html += `<td style="border: 1px solid #d1d5db; padding: 6px 8px; vertical-align: top; background: #fff7f7;">
                  ${(vData.monthScrap === 0 && vData.monthPacked === 0) ? 
                    '<div style="text-align: center; color: #d1d5db; font-size: 13px; font-style: italic; padding: 8px 0;">-</div>' 
                    : `<div style="text-align: left; font-weight: 800; font-size: 13px; margin-bottom: 6px; color: #065f46; border-bottom: 1px solid #fecdd3; padding-bottom: 4px;">
                         정품 ${vData.monthPacked.toLocaleString()} EA <span style="color: #be123c; font-size: 12px;">(폐기 ${vData.monthScrap.toLocaleString()}, ${totalRate}%)</span>
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
    (r.carModel === 'DT CREW' || r.carModel === 'DT QUAD') && r.processName === '클립머신'
  );

  let csvContent = "\uFEFF";
  csvContent += `(주)조영산업 - DT 클립머신(CREW A·B / QUAD A·B) 생산 불량 실적(${selectedMonth}) 월간 누적 합산 보고서\n\n`;
  csvContent += `순번,차종,단면구분,설비구분,월간 정품(LH),월간 정품(RH),월간 정품합계,월간 폐기수량,불량률(%)\n`;

  DTCLIP_ROWS_CONFIG.forEach((cfg) => {
    let packedLH = 0, packedRH = 0, scrap = 0;
    const allComps = [...cfg.lhComps, ...cfg.rhComps];
    monthReports.filter(r => r.carModel === cfg.carModel).forEach(r => {
      const qtyObj = cfg.source === 'A' ? r.dtCrewQty : r.dtCrewQtyB;
      if (qtyObj) {
        cfg.lhComps.forEach(cid => { packedLH += Number(qtyObj[`정품수량_${cid}`]) || 0; });
        cfg.rhComps.forEach(cid => { packedRH += Number(qtyObj[`정품수량_${cid}`]) || 0; });
        allComps.forEach(cid => { scrap += Number(qtyObj[`불량합계_${cid}`]) || 0; });
      }
    });
    const packed = packedLH + packedRH;
    const rate = packed > 0 ? ((scrap / packed) * 100).toFixed(2) : '0.00';
    csvContent += `${cfg.seq},"${cfg.carModel}","${cfg.sectionLabel}","${cfg.equipLabel}",${packedLH},${packedRH},${packed},${scrap},${rate}%\n`;
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

function exportStellantisWeeklyIntegratedCsv(reports, selectedMonth) {
  const leaderReports = reports.filter(r =>
    r.date && r.date.startsWith(selectedMonth) && (r.isLeaderForm || r.workerName === '장수미')
  );
  const clipReports = reports.filter(r =>
    r.date && r.date.startsWith(selectedMonth) &&
    (r.carModel === 'DT CREW' || r.carModel === 'DT QUAD') && r.processName === '클립머신'
  );

  let csvContent = "\uFEFF";
  csvContent += `(주)조영산업 - 주간 스텔란티스 실적 통합 보고서 (${selectedMonth})\n`;
  csvContent += `[주간 통합 요약 = 반장 작업일보 + DT 클립머신 실적]\n\n`;

  // 1. DT 클립머신 실적
  csvContent += `[1] DT 클립머신 실적 (CREW A·B / QUAD A·B 소재 생산 실적 및 폐기 수량)\n`;
  csvContent += `순번,차종,단면구분,설비구분,소재정품(LH),소재정품(RH),소재정품합계,폐기수량,불량률(%)\n`;
  DTCLIP_ROWS_CONFIG.forEach((cfg) => {
    let packedLH = 0, packedRH = 0, scrap = 0;
    const allComps = [...cfg.lhComps, ...cfg.rhComps];
    clipReports.filter(r => r.carModel === cfg.carModel).forEach(r => {
      const qtyObj = cfg.source === 'A' ? r.dtCrewQty : r.dtCrewQtyB;
      if (qtyObj) {
        cfg.lhComps.forEach(cid => { packedLH += Number(qtyObj[`정품수량_${cid}`]) || 0; });
        cfg.rhComps.forEach(cid => { packedRH += Number(qtyObj[`정품수량_${cid}`]) || 0; });
        allComps.forEach(cid => { scrap += Number(qtyObj[`불량합계_${cid}`]) || 0; });
      }
    });
    const packed = packedLH + packedRH;
    const rate = packed > 0 ? ((scrap / packed) * 100).toFixed(2) : '0.00';
    csvContent += `${cfg.seq},"${cfg.carModel}","${cfg.sectionLabel}","${cfg.equipLabel}",${packedLH},${packedRH},${packed},${scrap},${rate}%\n`;
  });

  // 2. 반장 작업일보
  csvContent += `\n[2] 반장 작업일보 (완제품 포장완료 및 단면별 폐기불량 집계)\n`;
  csvContent += `순번,아이템명,완제품 포장완료,A단면 폐기,B단면 폐기,C단면 폐기,D단면 폐기,센터 폐기,사이드 폐기,폐기합계,불량률(%)\n`;
  DEFAULT_LEADER_ITEMS.forEach((it, idx) => {
    let packed = 0, sA = 0, sB = 0, sC = 0, sD = 0, sCenter = 0, sSide = 0;
    leaderReports.forEach(r => {
      const found = (r.leaderFormItems || []).find(i => i.name === it.name);
      if (found) {
        packed += Number(found.packedQty) || 0;
        sA += Number(found.scrapA) || 0;
        sB += Number(found.scrapB) || 0;
        sC += Number(found.scrapC) || 0;
        sD += Number(found.scrapD) || 0;
        sCenter += Number(found.scrapCenter) || 0;
        sSide += Number(found.scrapSide) || 0;
      }
    });
    const scrap = (it.name === 'KM/KX Hood') ? (sCenter + sSide) : (sA + sB + sC + sD);
    const rate = packed > 0 ? ((scrap / packed) * 100).toFixed(2) : '0.00';
    csvContent += `${idx+1},"${it.name}",${packed},${sA},${sB},${sC},${sD},${sCenter},${sSide},${scrap},${rate}%\n`;
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `조영산업_주간스텔란티스실적_통합_${selectedMonth}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
