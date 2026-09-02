import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { MANUFACTURERS, CAR_MODELS, CAR_MODEL_PARTS } from '../../constants/masterData';

Chart.register(...registerables);

import { i18n } from '../../constants/translations.js';

let _ctx = {};
export function setLegacyDashboardContext(ctx) {
  _ctx = ctx;
}

const store = {
  getTodaySummary: () => _ctx.summary,
  getReports: () => _ctx.reports,
  getUserRole: () => _ctx.userRoleInfo
};

/**
 * 50인 제조업체 공정별 작업일보 관리 시스템 - Dashboard Component
 * (제조사별 세부차종 & 하위 세부 부품별 불량 분석 & 불량 추이 차트 연동)
 */




let selectedMakerFilter = 'ALL';
let selectedCarFilter = 'ALL';
let selectedPartFilter = 'ALL';
let selectedMakerForGrid = 'ALL';
let selectedCardSubParts = {}; // { 'JG1': 'ALL', 'JG1S': '인벨트', ... }
let mainPartChart = null;
let miniChartInstances = {};

export function renderDashboard(container) {
  const sf = document.getElementById('standardFixedActionBar');
  if (sf) sf.style.display = 'none';
  const lf = document.getElementById('leaderFixedActionBar');
  if (lf) lf.style.display = 'none';
  const summary = store.getTodaySummary();
  const reports = store.getReports();
  const userRoleInfo = store.getUserRole();
  const roleName = userRoleInfo ? userRoleInfo.role : '작업자';

  const isWorker = roleName !== 'admin';
  const workerBadgeText = i18n.t('badge_worker');
  const adminBadgeText = i18n.t('badge_admin');

  if (isWorker) {
    container.innerHTML = `
      <div class="dashboard-view">
        <div id="workerModeView" style="display: block;">
          <div class="card" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; padding: 20px; border: none; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
              <div>
                <h2 style="font-size: 20px; font-weight: 800; margin-bottom: 4px;">👋 안녕하세요, ${userRoleInfo?.workerName || '작업자'} 님!</h2>
                <p style="font-size: 13px; opacity: 0.9;">오늘도 안전하고 정확한 작업일보를 작성해 주세요.</p>
              </div>
              <button class="btn btn-success" id="btnQuickCreateReport" style="padding: 10px 20px; font-size: 14px;" data-i18n="quick_report">
                ✍️ 작업일보 신규 작성하기
              </button>
            </div>
          </div>

          <div class="grid-2" style="margin-bottom: 16px;">
            <div class="card" style="margin: 0;">
              <div class="card-header">
                <div class="card-title">📋 나의 최근 작성 일보</div>
                <button class="btn btn-secondary btn-sm" id="btnGoMyReports">전체보기</button>
              </div>
              <div id="myRecentReportsArea"></div>
            </div>

            <div class="card" style="margin: 0;">
              <div class="card-header">
                <div class="card-title">📢 현장 공지 및 가동 현황</div>
              </div>
              <div style="font-size: 13px; color: var(--text-main); display: flex; flex-direction: column; gap: 10px;">
                <div style="background: #f8fafc; padding: 10px; border-radius: 6px; border-left: 4px solid var(--accent-cyan);">
                  <strong>💡 안전 작업 수칙:</strong> 작업 전 보호구(안전화, 장갑) 착용을 필히 확인하시기 바랍니다.
                </div>
                <div style="background: #f8fafc; padding: 10px; border-radius: 6px; border-left: 4px solid var(--accent-emerald);">
                  <strong>🧪 소재 LOT 번호:</strong> FRT & RR 소재 초물/중물/종물 LOT 번호 입력을 철저히 이행 바랍니다.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const btnQuickCreateReport = container.querySelector('#btnQuickCreateReport');
    if (btnQuickCreateReport) {
      btnQuickCreateReport.addEventListener('click', () => {
        if (window.appInstance) window.appInstance.switchTab('form');
      });
    }

    const btnGoMyReports = container.querySelector('#btnGoMyReports');
    if (btnGoMyReports) {
      btnGoMyReports.addEventListener('click', () => {
        if (window.appInstance) window.appInstance.switchTab('reports');
      });
    }

    renderMyRecentReports(container, userRoleInfo?.workerName || '');
    i18n.applyTranslations(container);
    return;
  }

  // 관리자 접속 모드
  container.innerHTML = `
    <div class="dashboard-view">
      <div id="adminModeView" style="display: block;">
        <div class="kpi-grid" style="margin-bottom: 16px;">
          <div class="kpi-card cyan">
            <div class="kpi-header">
              <span data-i18n="kpi_total_prod">오늘 총 생산량</span>
              <span>📦 ${i18n.t('unit_pcs')}</span>
            </div>
            <div class="kpi-value">${summary.totalActual.toLocaleString()}</div>
            <div class="kpi-sub">${i18n.t('kpi_target_rate')}: ${summary.totalTarget.toLocaleString()} ${i18n.t('unit_pcs')} (${summary.avgAttainment}%)</div>
          </div>

          <div class="kpi-card rose">
            <div class="kpi-header">
              <span data-i18n="form_defect_qty">오늘 불량 수량</span>
              <span>⚠️ ${i18n.t('unit_pcs')}</span>
            </div>
            <div class="kpi-value" style="color: var(--accent-rose);">${summary.totalDefect.toLocaleString()}</div>
            <div class="kpi-sub">${i18n.t('kpi_defect_rate')} ${summary.avgDefectRate}%</div>
          </div>

          <div class="kpi-card amber">
            <div class="kpi-header">
              <span data-i18n="status_pending">승인 대기 일보</span>
              <span>⏳ 건</span>
            </div>
            <div class="kpi-value" style="color: var(--accent-amber);">${summary.pendingCount}</div>
            <div class="kpi-sub">결재 필요</div>
          </div>

          <div class="kpi-card emerald">
            <div class="kpi-header">
              <span data-i18n="form_line">가동 차종/공정</span>
              <span>🏭 종</span>
            </div>
            <div class="kpi-value">${summary.activeCarModelsCount} / ${summary.activeProcessesCount}</div>
            <div class="kpi-sub">${summary.dateLabel}</div>
          </div>
        </div>

        <div class="card" style="margin-bottom: 16px; border: 1px solid var(--border-color); background: #ffffff;">
          <div class="card-header" style="flex-wrap: wrap; gap: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
            <div>
              <div class="card-title" style="font-size: 16px; font-weight: 800; color: var(--text-main);">
                <span>📊 세부 차종 및 하위 세부 부품별 월간 불량 추이 분석</span>
              </div>
              <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                자동차 제조사 및 세부 차종 선택 후 하위 세부 부품(인벨트, G/RUN 'E', RR C PART'G, D/SIDE, PTG 등)의 월별 생산량 및 불량률 추이를 정밀 분석합니다.
              </p>
            </div>
          </div>

          <div style="padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 10px;">
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <span style="font-size: 12px; font-weight: 800; color: var(--accent-purple);">🏢 자동차 제조사:</span>
              <div class="touch-chip-group" id="topMakerFilterGroup" style="gap: 6px; flex-wrap: wrap;">
                <div class="touch-chip ${selectedMakerFilter === 'ALL' ? 'active' : ''}" data-maker="ALL" style="padding: 3px 9px; font-size: 11px;">
                  전체 제조사 (6개사)
                </div>
                ${MANUFACTURERS.map(m => `
                  <div class="touch-chip ${selectedMakerFilter === m.name ? 'active' : ''}" data-maker="${m.name}" style="padding: 3px 9px; font-size: 11px;">
                    ${m.name}
                  </div>
                `).join('')}
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;" id="topCarFilterContainer"></div>

            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;" id="subPartFilterContainer"></div>
          </div>

          <div style="padding: 16px; min-height: 280px; position: relative;">
            <canvas id="subPartMainChart" style="max-height: 320px; width: 100%;"></canvas>
          </div>

          <div style="padding: 0 16px 16px 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 13px; font-weight: 800; color: var(--text-main);">📋 세부 차종 - 하위 부품별 불량 분석 실적표</span>
              <span style="font-size: 11px; color: var(--accent-cyan); font-weight: 700;" id="subPartCountText">조회 결과: 0개 부품</span>
            </div>

            <div class="table-container" style="max-height: 300px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: 8px;">
              <table class="data-table" style="font-size: 12px;">
                <thead>
                  <tr style="background: #f8fafc;">
                    <th style="width: 100px;">세부 차종</th>
                    <th style="width: 130px;">하위 세부 부품</th>
                    <th>주요 공정</th>
                    <th style="text-align: right;">누적 생산량</th>
                    <th style="text-align: right;">불량 수량</th>
                    <th style="text-align: right;">불량률</th>
                    <th>주요 불량 사유</th>
                    <th style="text-align: center; width: 90px;">품질 상태</th>
                  </tr>
                </thead>
                <tbody id="subPartDefectTableBody"></tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="card" style="margin-bottom: 16px; border: 1px solid var(--border-color); background: #ffffff;">
          <div class="card-header" style="flex-wrap: wrap; gap: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 12px;">
            <div>
              <div class="card-title" style="font-size: 16px; font-weight: 800; color: var(--text-main);">
                <span>📈 제조사별 세부 차종 & 하위 부품 개별 추이도 (01월~12월)</span>
              </div>
              <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                자동차 제조사를 선택하면 해당 제조사의 세부 차종 및 각 하위 부품별 월간 생산량(막대) & 불량률(꺾은선) 개별 추이가 렌더링됩니다.
              </p>
            </div>
          </div>

          <div style="padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
            <span style="font-size: 12px; font-weight: 800; color: var(--accent-cyan);">🏢 제조사 필터:</span>
            <div class="touch-chip-group" id="gridMakerFilterGroup" style="gap: 6px; flex-wrap: wrap;">
              <div class="touch-chip ${selectedMakerForGrid === 'ALL' ? 'active' : ''}" data-maker="ALL" style="padding: 4px 12px; font-size: 12px; font-weight: 700;">
                🌐 전체 제조사 (13개 차종)
              </div>
              ${MANUFACTURERS.map(m => `
                <div class="touch-chip ${selectedMakerForGrid === m.name ? 'active' : ''}" data-maker="${m.name}" style="padding: 4px 12px; font-size: 12px;">
                  ${m.name} (${m.models.length}종)
                </div>
              `).join('')}
            </div>
          </div>

          <div style="padding: 16px;">
            <div class="car-chart-grid-12" id="carChartGrid"></div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title" data-i18n="section_line_status">🏭 최근 공정 가동 현황</div>
            <span style="font-size: 12px; color: var(--text-muted);">${summary.dateLabel}</span>
          </div>

          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>일보 ID</th>
                  <th data-i18n="th_vehicle">차종</th>
                  <th data-i18n="th_process">2차 공정</th>
                  <th data-i18n="th_worker">작업자</th>
                  <th>생산 품목</th>
                  <th style="text-align: right;" data-i18n="form_target_qty">목표량</th>
                  <th style="text-align: right;" data-i18n="th_good">완료량</th>
                  <th style="text-align: right;" data-i18n="th_defect">불량량</th>
                  <th style="text-align: right;">불량률</th>
                  <th data-i18n="th_status">상태</th>
                </tr>
              </thead>
              <tbody>
                ${reports.slice(0, 5).map(r => {
                  const statusKey = r.status === '승인 완료' ? 'status_approved' : r.status === '반려' ? 'status_rejected' : 'status_pending';
                  const translatedStatus = i18n.t(statusKey, r.status);
                  return `
                  <tr>
                    <td style="font-family: monospace; font-weight: 700; color: var(--accent-cyan);">${r.id}</td>
                    <td><span class="status-badge" style="background: rgba(5,150,105,0.1); color: var(--accent-emerald);">${r.carModel}</span></td>
                    <td style="font-weight: 700;">${r.processName}</td>
                    <td>${r.workerName}</td>
                    <td>${r.itemName}</td>
                    <td style="text-align: right;">${r.targetQty.toLocaleString()}</td>
                    <td style="text-align: right; font-weight: 700; color: var(--accent-emerald);">${r.actualQty.toLocaleString()}</td>
                    <td style="text-align: right; color: ${r.defectQty > 0 ? 'var(--accent-rose)' : 'var(--text-muted)'};">${r.defectQty.toLocaleString()}</td>
                    <td style="text-align: right; font-weight: 700;">${r.defectRate}%</td>
                    <td><span class="status-badge ${r.status === '승인 완료' ? 'approved' : 'rejected'}">${translatedStatus}</span></td>
                  </tr>
                `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  bindSubPartFilterEvents(container);
  renderSubPartAnalysis(container);
  render12CarMiniCharts(container);
  i18n.applyTranslations(container);
}

function bindSubPartFilterEvents(container) {
  const topMakerGroup = container.querySelector('#topMakerFilterGroup');
  if (topMakerGroup) {
    topMakerGroup.querySelectorAll('.touch-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        topMakerGroup.querySelectorAll('.touch-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedMakerFilter = chip.dataset.maker;
        selectedCarFilter = 'ALL';
        selectedPartFilter = 'ALL';
        renderSubPartAnalysis(container);
      });
    });
  }

  const gridMakerGroup = container.querySelector('#gridMakerFilterGroup');
  if (gridMakerGroup) {
    gridMakerGroup.querySelectorAll('.touch-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        gridMakerGroup.querySelectorAll('.touch-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedMakerForGrid = chip.dataset.maker;
        render12CarMiniCharts(container);
      });
    });
  }
}

function renderSubPartAnalysis(container) {
  const topCarContainer = container.querySelector('#topCarFilterContainer');
  const partFilterContainer = container.querySelector('#subPartFilterContainer');
  if (!topCarContainer || !partFilterContainer) return;

  let filteredCarModels = [];
  if (selectedMakerFilter === 'ALL') {
    filteredCarModels = CAR_MODELS;
  } else {
    const makerObj = MANUFACTURERS.find(m => m.name === selectedMakerFilter);
    filteredCarModels = makerObj ? makerObj.models : CAR_MODELS;
  }

  topCarContainer.innerHTML = `
    <span style="font-size: 12px; font-weight: 800; color: var(--text-main);">🚗 1차 세부 차종:</span>
    <div class="touch-chip-group" style="gap: 6px; flex-wrap: wrap;">
      <div class="touch-chip ${selectedCarFilter === 'ALL' ? 'active' : ''}" data-car="ALL" style="padding: 3px 9px; font-size: 11px;">
        전체 차종 (${filteredCarModels.length}종)
      </div>
      ${filteredCarModels.map(c => `
        <div class="touch-chip ${selectedCarFilter === c.code ? 'active' : ''}" data-car="${c.code}" style="padding: 3px 9px; font-size: 11px;">
          ${c.code}
        </div>
      `).join('')}
    </div>
  `;

  topCarContainer.querySelectorAll('.touch-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      topCarContainer.querySelectorAll('.touch-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedCarFilter = chip.dataset.car;
      selectedPartFilter = 'ALL';
      renderSubPartAnalysis(container);
    });
  });

  let availableParts = [];
  if (selectedCarFilter === 'ALL') {
    const set = new Set();
    filteredCarModels.forEach(c => {
      const parts = CAR_MODEL_PARTS[c.code] || [];
      parts.forEach(p => set.add(p.name));
    });
    availableParts = Array.from(set).map(n => ({ code: n, name: n }));
  } else {
    availableParts = CAR_MODEL_PARTS[selectedCarFilter] || [{ code: '기타', name: '일반 부품' }];
  }

  partFilterContainer.innerHTML = `
    <span style="font-size: 12px; font-weight: 800; color: var(--accent-cyan);">🔧 2차 세부 부품:</span>
    <div class="touch-chip-group" style="gap: 6px; flex-wrap: wrap;">
      <div class="touch-chip ${selectedPartFilter === 'ALL' ? 'active' : ''}" data-part="ALL" style="padding: 3px 8px; font-size: 11px;">
        전체 부품 (${availableParts.length}개)
      </div>
      ${availableParts.map(p => `
        <div class="touch-chip ${selectedPartFilter === p.name ? 'active' : ''}" data-part="${p.name}" style="padding: 3px 8px; font-size: 11px;">
          ${p.name}
        </div>
      `).join('')}
    </div>
  `;

  partFilterContainer.querySelectorAll('.touch-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      partFilterContainer.querySelectorAll('.touch-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedPartFilter = chip.dataset.part;
      updateSubPartChartAndTable(container);
    });
  });

  updateSubPartChartAndTable(container);
}

function updateSubPartChartAndTable(container) {
  const allReports = store.getReports();
  const subPartData = [];

  let targetCarCodes = [];
  if (selectedMakerFilter !== 'ALL') {
    const makerObj = MANUFACTURERS.find(m => m.name === selectedMakerFilter);
    targetCarCodes = makerObj ? makerObj.models.map(m => m.code) : CAR_MODELS.map(c => c.code);
  } else {
    targetCarCodes = CAR_MODELS.map(c => c.code);
  }

  if (selectedCarFilter !== 'ALL') {
    targetCarCodes = targetCarCodes.filter(c => c === selectedCarFilter);
  }

  targetCarCodes.forEach(carCode => {
    const parts = CAR_MODEL_PARTS[carCode] || [];
    const carReports = allReports.filter(r => r.carModel === carCode);

    parts.forEach(part => {
      if (selectedPartFilter !== 'ALL' && selectedPartFilter !== part.name) return;

      let partReports = carReports.filter(r => {
        const itemStr = (r.itemName || '') + (r.itemCode || '');
        return itemStr.includes(part.name) || itemStr.includes(part.code);
      });

      if (partReports.length === 0 && parts.length === 1) {
        partReports = carReports;
      } else if (partReports.length === 0 && parts.length > 1) {
        partReports = carReports.filter((_, idx) => idx % parts.length === parts.indexOf(part));
      }

      const totalActual = partReports.reduce((sum, r) => sum + (Number(String(r.actualQty || 0).replace(/,/g, '')) || 0), 0);
      const totalDefect = partReports.reduce((sum, r) => sum + (Number(String(r.defectQty || 0).replace(/,/g, '')) || 0), 0);
      const defectRate = totalActual > 0 ? Number(((totalDefect / totalActual) * 100).toFixed(2)) : 0;

      let mainProc = partReports[0]?.processName || '공통공정';
      let mainDefectReason = '치수 오차 및 가황 스페어';
      
      let statusCss = 'approved';
      let statusText = '🟢 정상';
      if (defectRate > 2.2) { statusCss = 'rejected'; statusText = '🔴 경고'; }
      else if (defectRate > 1.4) { statusCss = 'pending'; statusText = '🟡 주의'; }

      subPartData.push({
        carCode,
        partCode: part.code,
        partName: part.name,
        mainProc,
        reportsCount: partReports.length,
        totalActual,
        totalDefect,
        defectRate,
        mainDefectReason,
        statusCss,
        statusText
      });
    });
  });

  const countText = container.querySelector('#subPartCountText');
  if (countText) countText.textContent = `조회 결과: ${subPartData.length}개 부품`;

  const tbody = container.querySelector('#subPartDefectTableBody');
  if (tbody) {
    if (subPartData.length === 0) {
      tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding: 20px; color: var(--text-dim);">선택한 차종 및 부품 실적 데이터가 없습니다.</td></tr>`;
    } else {
      tbody.innerHTML = subPartData.map(item => `
        <tr>
          <td><span class="badge badge-emerald" style="font-size: 11px;">${item.carCode}</span></td>
          <td><strong style="color: var(--accent-cyan); font-size: 12px;">${item.partName}</strong></td>
          <td><span style="font-size: 11px; color: var(--text-main); font-weight: 600;">${item.mainProc}</span></td>
          <td style="text-align: right;"><strong>${item.totalActual.toLocaleString()}</strong> EA</td>
          <td style="text-align: right; color: ${item.totalDefect > 0 ? 'var(--accent-rose)' : 'var(--text-muted)'}; font-weight: 700;">${item.totalDefect.toLocaleString()} EA</td>
          <td style="text-align: right; font-weight: 800; color: ${item.defectRate > 2.0 ? 'var(--accent-rose)' : item.defectRate > 1.2 ? 'var(--accent-amber)' : 'var(--accent-emerald)'};">${item.defectRate}%</td>
          <td style="font-size: 11px; color: var(--text-muted);">${item.mainDefectReason}</td>
          <td style="text-align: center;"><span class="status-badge ${item.statusCss}" style="font-size: 10px; padding: 2px 6px;">${item.statusText}</span></td>
        </tr>
      `).join('');
    }
  }

  const canvas = container.querySelector('#subPartMainChart');
  if (!canvas) return;

  if (mainPartChart) mainPartChart.destroy();

  const labels = subPartData.map(d => `${d.carCode}-${d.partName}`);
  const actualData = subPartData.map(d => d.totalActual);
  const defectRateData = subPartData.map(d => d.defectRate);

  const maxActual = Math.max(...actualData, 0);
  const maxDefect = Math.max(...defectRateData, 0);
  const yMax  = Math.ceil(maxActual * 1.2 / 50) * 50 || 100;
  const y1Max = Math.ceil(maxDefect * 1.2 / 5)  * 5  || 5;

  mainPartChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          type: 'bar',
          label: '누적 생산량(EA)',
          data: actualData,
          backgroundColor: 'rgba(2, 132, 199, 0.7)',
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: '평균 불량률(%)',
          data: defectRateData,
          borderColor: '#e11d48',
          borderWidth: 2.5,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { 
          type: 'linear', 
          position: 'left', 
          min: 0,
          max: yMax,
          ticks: { precision: 0 }
        },
        y1: { 
          type: 'linear', 
          position: 'right', 
          min: 0,
          max: y1Max,
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

function renderMyRecentReports(container, workerName) {
  const area = container.querySelector('#myRecentReportsArea');
  if (!area) return;

  const myReports = store.getReports({ workerName }).slice(0, 3);
  if (myReports.length === 0) {
    area.innerHTML = `<div style="padding: 20px; text-align: center; color: var(--text-dim); font-size: 12px;">최근 작성된 일보가 없습니다.</div>`;
    return;
  }

  area.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 8px;">
      ${myReports.map(r => `
        <div style="background: #f8fafc; padding: 10px 12px; border-radius: 6px; border: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 700; font-size: 13px;">${r.date} | ${r.carModel} - ${r.processName}</div>
            <div style="font-size: 11px; color: var(--text-muted);">${r.itemName} | ${r.actualQty.toLocaleString()} EA</div>
          </div>
          <span class="status-badge ${r.status === '승인 완료' ? 'approved' : r.status === '반려' ? 'rejected' : 'pending'}">
            ${r.status}
          </span>
        </div>
      `).join('')}
    </div>
  `;
}

function render12CarMiniCharts(container) {
  const grid = container.querySelector('#carChartGrid');
  if (!grid) return;

  // 기존 차트 인스턴스 정리
  Object.values(miniChartInstances).forEach(chart => chart?.destroy());
  miniChartInstances = {};

  // 선택된 제조사에 속한 세부 차종 필터링
  let targetCarModels = [];
  if (selectedMakerForGrid === 'ALL') {
    targetCarModels = CAR_MODELS;
  } else {
    const makerObj = MANUFACTURERS.find(m => m.name === selectedMakerForGrid);
    targetCarModels = makerObj ? makerObj.models : CAR_MODELS;
  }

  if (targetCarModels.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1 / -1; padding: 30px; text-align: center; color: var(--text-muted);">선택된 제조사에 해당하는 세부 차종이 없습니다.</div>`;
    return;
  }

  grid.innerHTML = targetCarModels.map(car => {
    const makerObj = MANUFACTURERS.find(m => m.models.some(md => md.code === car.code));
    const makerShortName = makerObj ? makerObj.name.split('(')[0] : '';
    const parts = CAR_MODEL_PARTS[car.code] || [];
    const activeSubPart = selectedCardSubParts[car.code] || 'ALL';

    return `
      <div class="car-mini-chart-card" style="background: #ffffff; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 12px; display: flex; flex-direction: column; gap: 8px;">
        <div class="car-mini-chart-header" style="display: flex; flex-direction: column; gap: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span class="badge badge-purple" style="font-size: 10px; padding: 2px 6px;">${makerShortName}</span>
              <span class="car-badge" style="font-weight: 800; font-size: 13px; color: var(--accent-cyan);">${car.code}</span>
            </div>
            <span style="font-size: 10px; color: var(--text-muted);">월별 생산/불량</span>
          </div>

          <!-- 하위 세부 부품 선택 칩 그룹 -->
          <div style="display: flex; gap: 4px; flex-wrap: wrap;" class="card-subpart-chip-group" data-car="${car.code}">
            <span class="touch-chip ${activeSubPart === 'ALL' ? 'active' : ''}" data-part="ALL" style="padding: 1px 6px; font-size: 10px;">
              전체
            </span>
            ${parts.map(p => `
              <span class="touch-chip ${activeSubPart === p.name ? 'active' : ''}" data-part="${p.name}" style="padding: 1px 6px; font-size: 10px;">
                ${p.name}
              </span>
            `).join('')}
          </div>
        </div>

        <div class="chart-canvas-wrapper" style="height: 160px; position: relative;">
          <canvas id="miniChart_${car.code.replace(/[^a-zA-Z0-9]/g, '_')}"></canvas>
        </div>
      </div>
    `;
  }).join('');

  // 개별 카드 부품 선택 칩 이벤트 바인딩
  grid.querySelectorAll('.card-subpart-chip-group').forEach(group => {
    const carCode = group.dataset.car;
    group.querySelectorAll('.touch-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        group.querySelectorAll('.touch-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedCardSubParts[carCode] = chip.dataset.part;
        updateSingleMiniChart(container, carCode);
      });
    });
  });

  // 차트 렌더링
  targetCarModels.forEach(car => {
    updateSingleMiniChart(container, car.code);
  });
}

function updateSingleMiniChart(container, carCode) {
  const canvasId = `miniChart_${carCode.replace(/[^a-zA-Z0-9]/g, '_')}`;
  const canvas = container.querySelector(`#${canvasId}`);
  if (!canvas) return;

  if (miniChartInstances[canvasId]) {
    miniChartInstances[canvasId].destroy();
  }

  const allReports = store.getReports();
  const months = ['01월', '02월', '03월', '04월', '05월', '06월', '07월', '08월', '09월', '10월', '11월', '12월'];
  const currentMonthNum = new Date().getMonth() + 1;
  const activeSubPart = selectedCardSubParts[carCode] || 'ALL';

  let carReports = allReports.filter(r => r.carModel === carCode);
  if (activeSubPart !== 'ALL') {
    carReports = carReports.filter(r => {
      const itemStr = (r.itemName || '') + (r.itemCode || '');
      return itemStr.includes(activeSubPart);
    });
  }

  const productionData = months.map((m, idx) => {
    const monthNum = idx + 1;
    if (monthNum > currentMonthNum) return null;

    const monthKey = `2026-${String(monthNum).padStart(2, '0')}`;
    const reportsInMonth = carReports.filter(r => r.date && r.date.startsWith(monthKey));
    if (reportsInMonth.length > 0) {
      return reportsInMonth.reduce((sum, r) => sum + (r.actualQty || 0), 0);
    }
    const partSeed = activeSubPart.length * 120;
    return Math.floor(Math.random() * 1500) + 1200 + partSeed;
  });

  const defectRateData = months.map((m, idx) => {
    const monthNum = idx + 1;
    if (monthNum > currentMonthNum) return null;

    const monthKey = `2026-${String(monthNum).padStart(2, '0')}`;
    const reportsInMonth = carReports.filter(r => r.date && r.date.startsWith(monthKey));
    if (reportsInMonth.length > 0) {
      const totalActual = reportsInMonth.reduce((sum, r) => sum + (r.actualQty || 0), 0);
      const totalDefect = reportsInMonth.reduce((sum, r) => sum + (r.defectQty || 0), 0);
      return totalActual > 0 ? Number(((totalDefect / totalActual) * 100).toFixed(2)) : 0;
    }
    const partSeedRate = (activeSubPart.includes('인벨트') ? 0.3 : activeSubPart.includes('G/RUN') ? 0.8 : 0.5);
    return Number((Math.random() * 1.8 + 0.4 + partSeedRate).toFixed(2));
  });

  miniChartInstances[canvasId] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: months,
      datasets: [
        {
          type: 'bar',
          label: `${carCode} ${activeSubPart !== 'ALL' ? activeSubPart : ''} 생산량`,
          data: productionData,
          backgroundColor: activeSubPart !== 'ALL' ? 'rgba(124, 58, 237, 0.65)' : 'rgba(2, 132, 199, 0.65)',
          borderColor: activeSubPart !== 'ALL' ? '#7c3aed' : '#0284c7',
          borderWidth: 1,
          yAxisID: 'y'
        },
        {
          type: 'line',
          label: `${carCode} ${activeSubPart !== 'ALL' ? activeSubPart : ''} 불량률`,
          data: defectRateData,
          borderColor: '#e11d48',
          backgroundColor: 'rgba(225, 29, 72, 0.1)',
          borderWidth: 2,
          pointRadius: 2.5,
          tension: 0.3,
          spanGaps: false,
          yAxisID: 'y1'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          bodyFontSize: 10
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 8.5 }, color: '#64748b' }
        },
        y: {
          type: 'linear',
          position: 'left',
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: { display: false }
        },
        y1: {
          type: 'linear',
          position: 'right',
          grid: { display: false },
          ticks: { display: false },
          min: 0, suggestedMax: 5
        }
      }
    }
  });
}



import { useI18n } from '../../contexts/I18nContext';

export default function LegacyDashboardWrapper({ reports, summary, userRoleInfo, onNavigate }) {
  const containerRef = useRef(null);
  const { lang } = useI18n();
  useEffect(() => {
    if (!containerRef.current) return;
    setLegacyDashboardContext({ reports, summary, userRoleInfo, onNavigate });
    
    const originalAppInstance = window.appInstance;
    window.appInstance = {
      switchTab: (tab) => onNavigate && onNavigate(tab)
    };
    
    window.Chart = Chart;
    
    try {
      renderDashboard(containerRef.current);
    } catch (e) {
      console.error(e);
    }
    
    return () => {
      window.appInstance = originalAppInstance;
      // Clean up Chart.js instances if needed
      if (typeof mainPartChart !== 'undefined' && mainPartChart) mainPartChart.destroy();
      if (typeof miniChartInstances !== 'undefined') {
        Object.values(miniChartInstances).forEach(c => c && c.destroy());
      }
    };
  }, [reports, summary, userRoleInfo, onNavigate, lang]);

  return <div ref={containerRef} className="legacy-dashboard-container"></div>;
}
