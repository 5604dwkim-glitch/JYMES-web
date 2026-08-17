/**
 * 50인 제조업체 공정별 작업일보 관리 시스템 - Analytics Component (Refactored)
 * (store.js 공통 마스터 상수를 참조하도록 로직 경량화)
 */

import { store, CAR_MODELS, DEFAULT_LEADER_ITEMS } from '../store.js';
import { i18n } from '../i18n.js';
import { printIsolatedReport } from './reportList.js';

export function renderAnalytics(container) {
  const allReports = store.getReports();

  const months = getUniqueMonths(allReports);
  const currentSelectedMonth = months[0] || new Date().toISOString().substring(0, 7);

  container.innerHTML = `
    <div class="analytics-view">
      <!-- 1. 장수미 반장 작업일보 (HSC-DT-005) 월 단위 누적 합산 전용 카드 -->
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

      <!-- 2. 공정 불량 파레토 분석 및 차종별 KPI -->
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
  `;

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

/**
 * 📊 장수미 반장 작업일보 (HSC-DT-005) 월 단위 누적 합산 표 렌더링
 */
function renderLeaderMonthlySummaryTable(container, reports, selectedMonth) {
  const monthReports = reports.filter(r => 
    r.date && r.date.startsWith(selectedMonth) && (r.isLeaderForm || r.workerName === '장수미')
  );

  const itemSums = DEFAULT_LEADER_ITEMS.map(it => {
    let packedSum = 0;
    let reworkSum = 0;
    let scrapASum = 0, scrapBSum = 0, scrapCSum = 0, scrapDSum = 0;
    let scrapCenterSum = 0, scrapSideSum = 0;

    monthReports.forEach(r => {
      const items = r.leaderFormItems || [];
      const found = items.find(i => i.name === it.name);
      if (found) {
        packedSum += Number(found.packedQty) || 0;
        reworkSum += Number(found.reworkQty) || 0;
        scrapASum += Number(found.scrapA) || 0;
        scrapBSum += Number(found.scrapB) || 0;
        scrapCSum += Number(found.scrapC) || 0;
        scrapDSum += Number(found.scrapD) || 0;
        scrapCenterSum += Number(found.scrapCenter) || 0;
        scrapSideSum += Number(found.scrapSide) || 0;
      }
    });

    const totalScrap = (it.name === 'KM/KX Hood') ? (scrapCenterSum + scrapSideSum) : (scrapASum + scrapBSum + scrapCSum + scrapDSum);
    const defectRate = packedSum > 0 ? ((totalScrap / packedSum) * 100).toFixed(2) : '0.00';

    return {
      seq: it.seq,
      name: it.name,
      packedSum,
      reworkSum,
      scrapASum, scrapBSum, scrapCSum, scrapDSum, scrapCenterSum, scrapSideSum,
      totalScrap,
      defectRate
    };
  });

  const totalMonthlyPacked = itemSums.reduce((acc, i) => acc + i.packedSum, 0);
  const totalMonthlyRework = itemSums.reduce((acc, i) => acc + i.reworkSum, 0);
  const totalMonthlyScrap = itemSums.reduce((acc, i) => acc + i.totalScrap, 0);
  const avgDefectRate = totalMonthlyPacked > 0 ? ((totalMonthlyScrap / totalMonthlyPacked) * 100).toFixed(2) : '0.00';

  const attSum = {
    buildingB: { total: 18, present: 0, absent: 0, earlyLeave: 0, reasons: [] },
    buildingC: { total: 16, present: 0, absent: 0, earlyLeave: 0, reasons: [] },
    buildingD: { total: 16, present: 0, absent: 0, earlyLeave: 0, reasons: [] }
  };

  monthReports.forEach(r => {
    const att = r.attendanceData;
    if (att) {
      ['buildingB', 'buildingC', 'buildingD'].forEach(bKey => {
        if (att[bKey]) {
          attSum[bKey].present += Number(att[bKey].present) || 0;
          attSum[bKey].absent += Number(att[bKey].absent) || 0;
          attSum[bKey].earlyLeave += Number(att[bKey].earlyLeave) || 0;
          if (att[bKey].reason && !attSum[bKey].reasons.includes(att[bKey].reason)) {
            attSum[bKey].reasons.push(att[bKey].reason);
          }
        }
      });
    }
  });

  container.innerHTML = `
    <div style="font-size: 13px;">
      <!-- 월간 요약 카드 -->
      <div style="display: flex; gap: 12px; margin-bottom: 14px; flex-wrap: wrap;">
        <div style="background: #f8fafc; border: 1px solid var(--border-color); padding: 10px 16px; border-radius: var(--radius-md); flex: 1;">
          <span style="font-size: 11px; color: var(--text-muted); display: block;">월간 총 포장완료 수량</span>
          <strong style="font-size: 18px; color: var(--accent-emerald);">${totalMonthlyPacked.toLocaleString()} EA</strong>
        </div>
        <div style="background: #f8fafc; border: 1px solid var(--border-color); padding: 10px 16px; border-radius: var(--radius-md); flex: 1;">
          <span style="font-size: 11px; color: var(--text-muted); display: block;">월간 총 리워크 수량</span>
          <strong style="font-size: 18px; color: var(--accent-amber);">${totalMonthlyRework.toLocaleString()} EA</strong>
        </div>
        <div style="background: #f8fafc; border: 1px solid var(--border-color); padding: 10px 16px; border-radius: var(--radius-md); flex: 1;">
          <span style="font-size: 11px; color: var(--text-muted); display: block;">월간 총 폐기 수량 (불량률)</span>
          <strong style="font-size: 18px; color: var(--accent-rose);">${totalMonthlyScrap.toLocaleString()} EA (${avgDefectRate}%)</strong>
        </div>
        <div style="background: #f8fafc; border: 1px solid var(--border-color); padding: 10px 16px; border-radius: var(--radius-md); flex: 1;">
          <span style="font-size: 11px; color: var(--text-muted); display: block;">작성된 일보 건수</span>
          <strong style="font-size: 18px; color: var(--accent-cyan);">${monthReports.length} 건</strong>
        </div>
      </div>

      <!-- 1. 월간 생산현황 누적 합산 표 -->
      <div style="margin-bottom: 16px;">
        <h4 style="font-size: 13px; font-weight: 800; color: var(--text-main); margin-bottom: 6px;">
          1. ${selectedMonth} 생산현황 월간 누적 합산
        </h4>
        <div class="table-container">
          <table class="data-table" style="font-size: 12px;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="text-align: center; width: 40px;">순번</th>
                <th style="width: 140px;">아이템명</th>
                <th style="text-align: right; color: var(--accent-emerald);">월간 포장완료 총수량</th>
                <th style="text-align: right; color: var(--accent-amber);">월간 리워크 총수량</th>
                <th style="text-align: center;">월간 폐기 세부 수량 (A,B,C,D / 중앙,사이드)</th>
                <th style="text-align: right; color: var(--accent-rose);">월간 폐기 총수량</th>
                <th style="text-align: right;">월간 불량률</th>
              </tr>
            </thead>
            <tbody>
              ${itemSums.map(i => `
                <tr>
                  <td style="text-align: center; font-weight: 700;">${i.seq}</td>
                  <td style="font-weight: 700; color: var(--text-main);">${i.name}</td>
                  <td style="text-align: right; font-weight: 700; color: var(--accent-emerald);">${i.packedSum.toLocaleString()} EA</td>
                  <td style="text-align: right; color: var(--accent-amber);">${i.reworkSum.toLocaleString()} EA</td>
                  <td style="text-align: center; font-size: 11px; color: var(--text-muted);">
                    ${i.name === 'KM/KX Hood' ? `중앙: ${i.scrapCenterSum}, 사이드: ${i.scrapSideSum}` : `A:${i.scrapASum}, B:${i.scrapBSum}, C:${i.scrapCSum}, D:${i.scrapDSum}`}
                  </td>
                  <td style="text-align: right; font-weight: 700; color: var(--accent-rose);">${i.totalScrap.toLocaleString()} EA</td>
                  <td style="text-align: right; font-weight: 700;">${i.defectRate}%</td>
                </tr>
              `).join('')}
              <tr style="background: rgba(2, 132, 199, 0.08); font-weight: 800;">
                <td colspan="2" style="text-align: center; color: var(--accent-cyan);">월간 합계 (Total)</td>
                <td style="text-align: right; color: var(--accent-emerald); font-size: 13px;">${totalMonthlyPacked.toLocaleString()} EA</td>
                <td style="text-align: right; color: var(--accent-amber); font-size: 13px;">${totalMonthlyRework.toLocaleString()} EA</td>
                <td style="text-align: center; font-size: 11px; color: var(--text-dim);">-</td>
                <td style="text-align: right; color: var(--accent-rose); font-size: 13px;">${totalMonthlyScrap.toLocaleString()} EA</td>
                <td style="text-align: right; color: var(--accent-rose); font-size: 13px;">${avgDefectRate}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 2. 월간 근태현황 누적 합산 표 -->
      <div>
        <h4 style="font-size: 13px; font-weight: 800; color: var(--text-main); margin-bottom: 6px;">
          2. ${selectedMonth} 근태현황 월간 누적 합산 (인일 기준)
        </h4>
        <div class="table-container">
          <table class="data-table" style="font-size: 12px;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="text-align: center; width: 70px;">구분</th>
                <th style="text-align: center; width: 80px;">평균 총원</th>
                <th style="text-align: center; width: 100px; color: var(--accent-emerald);">월 누적 출근</th>
                <th style="text-align: center; width: 100px; color: var(--accent-rose);">월 누적 결근</th>
                <th style="text-align: center; width: 100px;">월 누적 조퇴</th>
                <th>주요 결근 / 조퇴 사유 요약</th>
              </tr>
            </thead>
            <tbody>
              ${['buildingB', 'buildingC', 'buildingD'].map(bKey => {
                const bName = bKey === 'buildingB' ? 'B동' : bKey === 'buildingC' ? 'C동' : 'D동';
                const bData = attSum[bKey];
                return `
                  <tr>
                    <td style="text-align: center; font-weight: 700;">${bName}</td>
                    <td style="text-align: center;">${bData.total} 명</td>
                    <td style="text-align: center; font-weight: 700; color: var(--accent-emerald);">${bData.present} 인일</td>
                    <td style="text-align: center; font-weight: 700; color: var(--accent-rose);">${bData.absent} 인일</td>
                    <td style="text-align: center;">${bData.earlyLeave} 인일</td>
                    <td style="color: var(--text-muted);">${bData.reasons.join(', ') || '특이 사유 없음 (정상 근태)'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
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
