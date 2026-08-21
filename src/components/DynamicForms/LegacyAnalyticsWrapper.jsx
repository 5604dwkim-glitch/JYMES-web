import React, { useEffect, useRef } from 'react';
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
  w.document.write('<html><head><title>'+title+'</title></head><body>' + element.innerHTML + '</body></html>');
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

  container.innerHTML = `
    <div style="font-size: 15px;">
      <!-- 월간 요약 카드 -->
      <div style="display: flex; gap: 16px; margin-bottom: 20px; flex-wrap: wrap;">
        <div style="background: #f8fafc; border: 1px solid var(--border-color); padding: 16px 20px; border-radius: var(--radius-md); flex: 1;">
          <span style="font-size: 14px; color: var(--text-muted); display: block;">월간 총 포장완료 수량</span>
          <strong style="font-size: 24px; color: var(--accent-emerald);">${totalMonthlyPacked.toLocaleString()} EA</strong>
        </div>
        <div style="background: #f8fafc; border: 1px solid var(--border-color); padding: 16px 20px; border-radius: var(--radius-md); flex: 1;">
          <span style="font-size: 14px; color: var(--text-muted); display: block;">월간 총 폐기 수량 (불량률)</span>
          <strong style="font-size: 24px; color: var(--accent-rose);">${totalMonthlyScrap.toLocaleString()} EA (${avgDefectRate}%)</strong>
        </div>
        <div style="background: #f8fafc; border: 1px solid var(--border-color); padding: 16px 20px; border-radius: var(--radius-md); flex: 1;">
          <span style="font-size: 14px; color: var(--text-muted); display: block;">작성된 일보 건수</span>
          <strong style="font-size: 24px; color: var(--accent-cyan);">${monthReports.length} 건</strong>
        </div>
      </div>

      <!-- 1. 월간 생산현황 누적 합산 표 -->
      <div style="margin-bottom: 20px; overflow-x: auto;">
        <h4 style="font-size: 16px; font-weight: 800; color: var(--text-main); margin-bottom: 10px;">
          1. ${selectedMonth} 생산현황 주차별 누적 합산
        </h4>
        <div class="table-container">
          <table class="data-table" style="font-size: 14px; text-align: left; border-collapse: collapse; width: 100%; min-width: 1200px;">
            <thead>
              <tr style="background: #f8fafc;">
                <th rowspan="2" style="border: 1px solid #000; text-align: center; width: 40px;">순번</th>
                <th rowspan="2" style="border: 1px solid #000; text-align: center; width: 110px;">아이템</th>
                <th rowspan="2" style="border: 1px solid #000; text-align: center; width: 140px;">(${parseInt(selectedMonth.split('-')[1], 10)}월) 포장완료</th>
                <th colspan="${displayWeeksCount}" style="border: 1px solid #000; text-align: left; padding-left: 8px; font-size: 14px;">폐기불량</th>
                <th rowspan="2" style="border: 1px solid #000; text-align: center; width: 110px; font-size: 14px;">${parseInt(selectedMonth.split('-')[1], 10)}월 누적 불량</th>
              </tr>
              <tr style="background: #f8fafc;">
                ${displayWeekTitles.map(t => `<th style="border: 1px solid #000; text-align: left; padding: 6px; font-weight: normal; font-size: 13px; width: 100px;">${t}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${groupData.map((g, gIdx) => {
                // Calculate group-level aggregated scrap
                const groupWeeklyScraps = weeks.map((w, wIdx) => {
                  return g.variants.reduce((acc, v) => {
                    const ws = v.weeklyScraps[wIdx];
                    return {
                      wPacked: acc.wPacked + ws.wPacked,
                      scrapA: acc.scrapA + ws.scrapA,
                      scrapB: acc.scrapB + ws.scrapB,
                      scrapC: acc.scrapC + ws.scrapC,
                      scrapD: acc.scrapD + ws.scrapD,
                      scrapCenter: acc.scrapCenter + ws.scrapCenter,
                      scrapSide: acc.scrapSide + ws.scrapSide,
                    };
                  }, { wPacked: 0, scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapCenter: 0, scrapSide: 0 });
                });
                
                const groupTotalScrap = g.variants.reduce((acc, v) => {
                  const ts = v.totalScrap;
                  return {
                    scrapA: acc.scrapA + ts.scrapA,
                    scrapB: acc.scrapB + ts.scrapB,
                    scrapC: acc.scrapC + ts.scrapC,
                    scrapD: acc.scrapD + ts.scrapD,
                    scrapCenter: acc.scrapCenter + ts.scrapCenter,
                    scrapSide: acc.scrapSide + ts.scrapSide,
                  };
                }, { scrapA: 0, scrapB: 0, scrapC: 0, scrapD: 0, scrapCenter: 0, scrapSide: 0 });
                
                const groupMonthPacked = g.variants.reduce((acc, v) => acc + v.monthPacked, 0);

                return g.variants.map((vData, vIdx) => {
                  const isFirst = vIdx === 0;
                  const isLast = vIdx === g.variants.length - 1;
                  const itemName = g.name === 'KM/KX Hood' ? g.name : `${g.name}`; // Used for formatting D scrap logic check
                  
                  let html = `<tr>`;
                  if (isFirst) {
                    html += `<td rowspan="${g.variants.length}" style="border: 1px solid #000; text-align: center; padding: 6px;">${g.id}</td>`;
                    html += `<td rowspan="${g.variants.length}" style="border: 1px solid #000; padding: 6px; font-weight: 700; color: var(--text-main);">${g.name}</td>`;
                  }
                  
                  const bottomBorder = isLast ? '1px solid #000' : '1px solid #e2e8f0';
                  
                  html += `<td style="border-left: 1px solid #000; border-right: 1px solid #000; border-bottom: ${bottomBorder}; border-top: ${isFirst ? '1px solid #000' : 'none'}; padding: 6px;">
                             <div style="display: flex; justify-content: space-between;">
                               <span>${vData.variant === '-' ? '전체' : vData.variant}(</span>
                               <span style="font-weight: 700; color: var(--accent-emerald);">${vData.monthPacked}</span>
                               <span>)</span>
                             </div>
                           </td>`;
                           
                  if (isFirst) {
                    const displayGroupWeeklyScraps = groupWeeklyScraps.slice(startIdx, endIdx + 1);
                    displayGroupWeeklyScraps.forEach(ws => {
                      html += `<td rowspan="${g.variants.length}" style="border: 1px solid #000; padding: 6px; font-size: 13px; line-height: 1.4;">
                                 ${formatScrap(itemName, ws, ws.wPacked)}
                               </td>`;
                    });
                    
                    html += `<td rowspan="${g.variants.length}" style="border: 1px solid #000; padding: 6px; font-size: 13px; line-height: 1.4; background: #fffde7;">
                               ${formatScrap(itemName, groupTotalScrap, groupMonthPacked)}
                             </td>`;
                  }
                           
                  html += `</tr>`;
                  return html;
                }).join('');
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
          </table>
        </div>
      </div>

      <!-- 2. 월간 근태현황 누적 합산 표 -->
      <div>
        <h4 style="font-size: 16px; font-weight: 800; color: var(--text-main); margin-bottom: 10px;">
          2. ${selectedMonth} 근태현황 월간 누적 합산 (인일 기준)
        </h4>
        <div class="table-container">
          <table class="data-table" style="font-size: 14px; width: 100%;">
            <thead>
              <tr style="background: #f8fafc;">
                <th style="text-align: center; width: 80px; padding: 8px;">구분</th>
                <th style="text-align: center; width: 100px; padding: 8px;">평균 총원</th>
                <th style="text-align: center; width: 120px; color: var(--accent-emerald); padding: 8px;">월 누적 출근</th>
                <th style="text-align: center; width: 120px; color: var(--accent-rose); padding: 8px;">월 누적 결근</th>
                <th style="text-align: center; width: 120px; color: var(--accent-blue); padding: 8px;">연차</th>
                <th style="text-align: center; width: 120px; color: var(--accent-blue); padding: 8px;">병가</th>
                <th style="text-align: center; width: 120px; color: var(--accent-purple); padding: 8px;">반차</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #000; text-align: center; font-weight: 700; padding: 12px;">전체</td>
                <td style="border: 1px solid #000; text-align: center; padding: 12px;">${avgTotal} 명</td>
                <td style="border: 1px solid #000; text-align: center; font-weight: 700; color: var(--accent-emerald); padding: 12px;">${attSum.present} 인일</td>
                <td style="border: 1px solid #000; text-align: center; font-weight: 700; color: var(--accent-rose); padding: 12px;">${attSum.absent} 인일</td>
                <td style="border: 1px solid #000; text-align: center; font-weight: 700; color: var(--accent-blue); padding: 12px;">${attSum.annualLeave} 인일</td>
                <td style="border: 1px solid #000; text-align: center; font-weight: 700; color: var(--accent-blue); padding: 12px;">${attSum.sickLeave} 인일</td>
                <td style="border: 1px solid #000; text-align: center; font-weight: 700; color: var(--accent-purple); padding: 12px;">${attSum.halfLeave} 인일</td>
              </tr>
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
