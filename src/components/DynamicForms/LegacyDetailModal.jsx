import React, { useEffect, useRef } from 'react';
import { renderReportForm, setLegacyFormContext } from './LegacyFormWrapper';
import { DEFAULT_LEADER_ITEMS, DEFAULT_ATTENDANCE, DEFAULT_PROCESSES, DEFAULT_ITEMS } from '../../constants/masterData';

export function printIsolatedReport(element, title = '공정작업일보') {
  if (!element) return;
  
  const oldIframe = document.getElementById('printIsolatedIframe');
  if (oldIframe) oldIframe.remove();
  
  const iframe = document.createElement('iframe');
  iframe.id = 'printIsolatedIframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800;900&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4 portrait;
          margin: 8mm 24mm 8mm 24mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
          color: #000;
          background: #fff;
          font-size: 8px;
          line-height: 1.15;
        }
        .print-report-sheet {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          padding: 0;
        }
        h2 {
          font-size: 13px !important;
          margin: 0 0 1px 0 !important;
          letter-spacing: 0.5px !important;
        }
        .card {
          border: 1px solid #94a3b8 !important;
          border-radius: 2px !important;
          padding: 3px 6px !important;
          margin-bottom: 3px !important;
          break-inside: avoid !important;
          page-break-inside: avoid !important;
          background: #fff !important;
          box-shadow: none !important;
        }
        label {
          font-size: 8.5px !important;
          font-weight: 700 !important;
          margin-bottom: 2px !important;
          display: block !important;
        }
        /* 대형 수량/불량 테이블은 페이지 넘김 허용 */
        table, .data-table {
          width: 100% !important;
          border-collapse: collapse !important;
          break-inside: auto !important;
          page-break-inside: auto !important;
          margin-bottom: 1px !important;
        }
        /* 결재란 테이블은 100% 확장에서 제외하고 고정 크기 유지 */
        table.approval-table {
          width: 100px !important;
          table-layout: fixed !important;
          margin-left: auto !important;
        }
        /* 소형 카드 내부 테이블은 넘김 방지 */
        .card table {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        th, td {
          border: 1px solid #475569 !important;
          padding: 1px 3px !important;
          font-size: 7.5px !important;
          line-height: 1.15 !important;
        }
        th {
          background-color: #f1f5f9 !important;
          font-weight: 700 !important;
        }
        img {
          max-height: 60px !important;
          max-width: 90% !important;
          width: auto !important;
          height: auto !important;
        }
        .status-badge {
          display: inline-block;
          padding: 1px 3px !important;
          border-radius: 2px !important;
          font-size: 7px !important;
          border: 1px solid #cbd5e1 !important;
        }
        /* 폼 배지 컨테이너 간격 최소화 */
        #formCodeBadgeContainer, [id="formCodeBadgeContainer"] {
          margin-bottom: 2px !important;
        }
        /* 각 섹션 간격 최소화 */
        div[style*="margin-bottom"] {
          margin-bottom: 2px !important;
        }
        /* 입력값 표시 스팬 크기 통일 */
        span[style*="fontWeight"] {
          font-size: 8px !important;
        }
        /* 비가동 섹션 불필요 여백 제거 */
        #downtimeCard {
          margin-top: 2px !important;
        }
        /* 터치 칩 그룹 등 UI 요소 숨김 */
        .touch-chip-group, #partSelectSection, #partChipGroup,
        #processChipGroup, p[data-i18n="lot_help"],
        div[style*="height: 120px"] {
          display: none !important;
        }
        @media print {
          .no-print { display: none !important; }
          /* 페이지 하단 고정 여백 제거 */
          div[style*="height: 120px"] { display: none !important; }
        }
      </style>
    </head>
    <body>
      ${element.outerHTML}
      <script>
        window.onload = function() {
          try {
            // A4 portrait: 297mm, 상하 여백 각 8mm → 유효 높이 281mm
            // CSS 기준 96dpi: 1mm = 96/25.4 ≈ 3.7795px
            var PAGE_H_PX = Math.round(281 * 96 / 25.4); // ~1062px

            var body = document.body;
            var origTotalH = body.scrollHeight;
            var origPages  = Math.ceil(origTotalH / PAGE_H_PX);

            // 마지막 페이지에 남은 높이 계산
            var lastPageUsed = origTotalH % PAGE_H_PX || PAGE_H_PX;
            var remaining    = PAGE_H_PX - lastPageUsed;

            // 여백이 30px 이상이고, 전체 2페이지 이하일 때만 확장
            if (remaining > 30 && origPages <= 2) {
              // 결재란 테이블(.approval-table) 행은 제외하고 데이터 테이블 행만 대상으로
              var allRows = Array.from(document.querySelectorAll('table tr')).filter(function(r) {
                var parentTable = r.closest('table');
                // approval-table 클래스가 있으면 제외
                return parentTable && !parentTable.classList.contains('approval-table');
              });

              var origHeights = allRows.map(function(r) {
                return r.getBoundingClientRect().height;
              });

              // scale 1.5 → 1.05 순서로 시도 (5% 단위), 페이지 수가 안 늘어나는 최대값 선택
              var applied = false;
              for (var s = 150; s >= 105; s -= 5) {
                var scale = s / 100;

                // 해당 배율 적용
                allRows.forEach(function(r, i) {
                  var h = Math.round(origHeights[i] * scale);
                  r.style.height    = h + 'px';
                  r.style.minHeight = h + 'px';
                });

                var newH     = body.scrollHeight;
                var newPages = Math.ceil(newH / PAGE_H_PX);

                if (newPages <= origPages) {
                  // 이 배율로 페이지 수가 안 늘어남 → 최적값 확정
                  applied = true;
                  break;
                }

                // 페이지 넘침 → 초기화 후 더 낮은 배율 시도
                allRows.forEach(function(r) {
                  r.style.height    = '';
                  r.style.minHeight = '';
                });
              }

              // 유효한 배율을 못 찾은 경우 원상복구
              if (!applied) {
                allRows.forEach(function(r) {
                  r.style.height    = '';
                  r.style.minHeight = '';
                });
              }
            }
          } catch(e) {
            // 오류 시 그냥 출력
          }

          setTimeout(function() {
            window.print();
          }, 400);
        };
      </script>
    </body>
    </html>
  `);
  doc.close();
}

export default function LegacyDetailModal({ report, onClose }) {
  const modalBodyRef = useRef(null);

  useEffect(() => {
    if (!report || !modalBodyRef.current) return;

    try {
      const r = report;

      if (r.isLeaderForm) {
        const leaderItems = r.leaderFormItems && r.leaderFormItems.length > 0 ? r.leaderFormItems : DEFAULT_LEADER_ITEMS;
        const att = r.attendanceData || DEFAULT_ATTENDANCE;
        let attTotal = 50;
        let attPresent = 48;
        let attAbsent = 2;
        let attAnnualLeave = 1;
        let attSickLeave = 0;
        let attHalfLeave = 1;
        let attReason = '연차 1명, 반차 1명';

        if (att) {
          if (att.total !== undefined) {
            attTotal = att.total;
            attPresent = att.present;
            attAbsent = att.absent;
            attAnnualLeave = att.annualLeave !== undefined ? att.annualLeave : (att.absent || 0);
            attSickLeave = att.sickLeave || 0;
            attHalfLeave = att.halfLeave || 0;
            attReason = att.reason || '전원 정상출근';
          } else if (att.buildingB) {
            attTotal = (att.buildingB.total || 0) + (att.buildingC?.total || 0) + (att.buildingD?.total || 0);
            attPresent = (att.buildingB.present || 0) + (att.buildingC?.present || 0) + (att.buildingD?.present || 0);
            attAbsent = (att.buildingB.absent || 0) + (att.buildingC?.absent || 0) + (att.buildingD?.absent || 0);
            attAnnualLeave = attAbsent;
            attSickLeave = 0;
            attHalfLeave = 0;
            attReason = att.buildingB.reason || '연차';
          }
        }

        modalBodyRef.current.innerHTML = `
          <div class="print-report-sheet" style="font-family: 'Noto Sans KR', sans-serif; color: #000; padding: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px;">
              <div>
                <h2 style="font-size: 24px; font-weight: 800; color: #000; letter-spacing: 2px;">작 업 일 보 (반장)</h2>
                <div style="font-size: 11px; color: #475569; margin-top: 2px;">일보ID: ${r.id} | 작성자: ${r.workerName}</div>
              </div>

              <table style="border-collapse: collapse; border: 1px solid #000; font-size: 11px; text-align: center;">
                <tr>
                  <td style="border: 1px solid #000; width: 45px; background: #f1f5f9; font-weight: 700;">작성</td>
                  <td style="border: 1px solid #000; width: 45px; background: #f1f5f9; font-weight: 700;">승인</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; height: 35px; vertical-align: middle; font-weight: 700;">${r.workerName}</td>
                  <td style="border: 1px solid #000; height: 35px; vertical-align: middle;">${r.approver || '생산부장'}</td>
                </tr>
              </table>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin-bottom: 10px;">
              <div>작성일 : ${r.date}</div>
              <div>근무시간 : ${r.workHours || '08:00 ~ 17:00'}</div>
            </div>

            <div style="margin-bottom: 14px;">
              <div style="font-size: 13px; font-weight: 800; margin-bottom: 4px;">1. 생산현황</div>
              <table class="data-table print-table" style="border: 1px solid #000; font-size: 11px; width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: #f1f5f9; color: #000;">
                    <th style="border: 1px solid #000; text-align: center; padding: 4px; width: 45px;">순번</th>
                    <th style="border: 1px solid #000; text-align: center; padding: 4px; width: 150px;">아이템</th>
                    <th style="border: 1px solid #000; text-align: center; padding: 4px; width: 120px;">포장완료 수량</th>
                    <th style="border: 1px solid #000; text-align: center; padding: 4px; width: 90px;">수정이동</th>
                    <th style="border: 1px solid #000; text-align: center; padding: 4px;" colspan="4">스크랩 (불량 구분)</th>
                  </tr>
                </thead>
                <tbody>
                  ${leaderItems.map((it, idx) => `
                    <tr>
                      <td style="border: 1px solid #000; text-align: center; padding: 4px;">${idx + 1}</td>
                      <td style="border: 1px solid #000; padding: 4px; font-weight: 700;">${it.name}</td>
                      <td style="border: 1px solid #000; text-align: right; padding: 4px; font-weight: 700;">${it.packedQty ? it.packedQty.toLocaleString() : 0}</td>
                      <td style="border: 1px solid #000; text-align: right; padding: 4px;">${it.reworkQty ? it.reworkQty.toLocaleString() : 0}</td>
                      ${it.name === 'KM/KX Hood' ? `
                        <td style="border: 1px solid #000; text-align: center; padding: 4px;" colspan="2">센터: ${it.scrapCenter || 0}</td>
                        <td style="border: 1px solid #000; text-align: center; padding: 4px;" colspan="2">사이드: ${it.scrapSide || 0}</td>
                      ` : `
                        <td style="border: 1px solid #000; text-align: right; padding: 4px;">A: ${it.scrapA || 0}</td>
                        <td style="border: 1px solid #000; text-align: right; padding: 4px;">B: ${it.scrapB || 0}</td>
                        <td style="border: 1px solid #000; text-align: right; padding: 4px;">C: ${it.scrapC || 0}</td>
                        <td style="border: 1px solid #000; text-align: right; padding: 4px;">D: ${it.scrapD || 0}</td>
                      `}
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div style="margin-bottom: 14px;">
              <div style="font-size: 13px; font-weight: 800; margin-bottom: 4px;">2. 근태현황</div>
              <table class="data-table print-table" style="border: 1px solid #000; font-size: 11px; width: 100%; border-collapse: collapse; margin-bottom: 6px;">
                <thead>
                  <tr style="background: #f1f5f9; color: #000;">
                    <th style="border: 1px solid #000; text-align: center; padding: 6px;">총원</th>
                    <th style="border: 1px solid #000; text-align: center; padding: 6px;">출근</th>
                    <th style="border: 1px solid #000; text-align: center; padding: 6px;">결근</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="border: 1px solid #000; text-align: center; font-weight: 700; padding: 6px;">${attTotal} 명</td>
                    <td style="border: 1px solid #000; text-align: center; font-weight: 700; color: #059669; padding: 6px;">${attPresent} 명</td>
                    <td style="border: 1px solid #000; text-align: center; font-weight: 700; color: ${attAbsent > 0 ? '#dc2626' : '#000'}; padding: 6px;">${attAbsent} 명</td>
                  </tr>
                </tbody>
              </table>

              <div style="border: 1px solid #000; padding: 6px 12px; font-size: 11px; background: #fafafa; display: flex; gap: 16px; align-items: center;">
                <span><strong>📋 근태 사유 상세:</strong></span>
                <span>연차: <strong>${attAnnualLeave}</strong>명</span>
                <span>병가: <strong>${attSickLeave}</strong>명</span>
                <span>반차: <strong>${attHalfLeave}</strong>명</span>
                <span style="color: var(--text-muted); margin-left: auto;">(${attReason})</span>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748b; font-family: monospace; border-top: 1px solid #000; padding-top: 8px;">
              <span>HSC-DT-005</span>
              <span>A4 (210×297 mm)</span>
            </div>
          </div>
        `;
      } else {
        const cardDateTime = `
          <div class="card" style="padding: 3px 6px; margin-bottom: 3px; border: 1px solid #94a3b8; background: #fff;">
            <label style="font-size: 8.5px; font-weight: 700; color: #0284c7; margin-bottom: 2px; display: block;">
              📅 1. 작업 기본 정보
            </label>
            <table class="data-table" style="width: 100%; border-collapse: collapse; border: 1px solid #94a3b8; font-size: 8px;">
              <tbody>
                <tr>
                  <th style="width: 18%; background: #f8fafc; font-weight: 700; padding: 2px 4px;">작업 일자</th>
                  <td style="width: 32%; font-weight: 600; padding: 2px 4px;">${r.date}</td>
                  <th style="width: 18%; background: #f8fafc; font-weight: 700; padding: 2px 4px;">근무 시간</th>
                  <td style="width: 32%; font-weight: 600; padding: 2px 4px;">${r.workHours || '08:00 ~ 17:00'}</td>
                </tr>
                <tr>
                  <th style="background: #f8fafc; font-weight: 700; padding: 2px 4px;">작업자</th>
                  <td style="font-weight: 700; color: #0284c7; padding: 2px 4px;">${r.workerName}</td>
                  <th style="background: #f8fafc; font-weight: 700; padding: 2px 4px;">생산 품목</th>
                  <td style="font-weight: 700; padding: 2px 4px;">[${r.itemCode}] ${r.itemName}</td>
                </tr>
              </tbody>
            </table>
          </div>
        `;

        const cardSummary = `
          <div class="card" style="padding: 3px 6px; margin-bottom: 3px; border: 1px solid #94a3b8; background: #fff;">
            <label style="font-size: 8.5px; font-weight: 700; color: #059669; margin-bottom: 2px; display: block;">
              📊 2. 생산 실적 종합 요약
            </label>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 3px; text-align: center;">
              <div style="background: #f8fafc; padding: 3px; border-radius: 3px; border: 1px solid #e2e8f0;">
                <div style="font-size: 7px; color: #64748b; font-weight: 600;">목표 수량</div>
                <div style="font-size: 11px; font-weight: 800; color: #1e293b; margin-top: 1px;">${(r.targetQty || 0).toLocaleString()} EA</div>
              </div>
              <div style="background: rgba(16,185,129,0.08); padding: 3px; border-radius: 3px; border: 1px solid rgba(16,185,129,0.2);">
                <div style="font-size: 7px; color: #047857; font-weight: 600;">생산 완료량</div>
                <div style="font-size: 11px; font-weight: 800; color: #047857; margin-top: 1px;">${(r.actualQty || 0).toLocaleString()} EA</div>
              </div>
              <div style="background: rgba(244,63,94,0.08); padding: 3px; border-radius: 3px; border: 1px solid rgba(244,63,94,0.2);">
                <div style="font-size: 7px; color: #be123c; font-weight: 600;">불량 수량</div>
                <div style="font-size: 11px; font-weight: 800; color: #be123c; margin-top: 1px;">${(r.defectQty || 0).toLocaleString()} EA</div>
              </div>
              <div style="background: rgba(99,102,241,0.08); padding: 3px; border-radius: 3px; border: 1px solid rgba(99,102,241,0.2);">
                <div style="font-size: 7px; color: #6366f1; font-weight: 600;">목표 달성률</div>
                <div style="font-size: 11px; font-weight: 800; color: #6366f1; margin-top: 1px;">${r.attainmentRate || 0}%</div>
              </div>
            </div>
          </div>
        `;

        // ── Render legacy form virtually to extract DOM ──
        setLegacyFormContext({
          existingData: r,
          userRoleInfo: { workerName: r.workerName, role: '작업자' },
          workers: [{ id: 'EMP001', name: r.workerName, role: '작업자' }],
          processes: DEFAULT_PROCESSES,
          getItems: (code) => DEFAULT_ITEMS.filter(item => item.carModel === code),
          onSave: () => {},
          onNavigate: () => {},
          showToast: () => {}
        });

        const tempContainer = document.createElement('div');
        renderReportForm(tempContainer, r.id);

        const materialLotsSection = tempContainer.querySelector('#section4Card');
        const dynamicSection = tempContainer.querySelector('#section5DynamicContainer');
        const qtySection = tempContainer.querySelector('#qtySection');
        const downtimeSection = tempContainer.querySelector('#downtimeCard');

        const makeReadOnly = (el) => {
          if (!el) return '';
          const clone = el.cloneNode(true);
          
          const inputs = clone.querySelectorAll('input, select, textarea');
          inputs.forEach(input => {
            if (input.type === 'hidden') return;
            const span = document.createElement('span');
            span.style.fontWeight = 'bold';
            span.style.color = '#0369a1';
            span.style.fontSize = '12px';
            span.style.padding = '0 4px';
            
            if (input.tagName === 'SELECT') {
               span.textContent = input.options[input.selectedIndex]?.text || '';
            } else if (input.type === 'checkbox' || input.type === 'radio') {
               span.textContent = input.checked ? '[O]' : '[X]';
            } else {
               span.textContent = input.value || '';
            }
            input.parentNode.replaceChild(span, input);
          });

          const buttons = clone.querySelectorAll('button, .remove-btn, .add-btn');
          buttons.forEach(btn => btn.style.display = 'none');
          
          const hints = clone.querySelectorAll('p[style*="var(--text-muted)"]');
          hints.forEach(hint => hint.style.display = 'none');

          clone.style.pointerEvents = 'none';
          return clone.outerHTML;
        };

        const cardDynamicContent = 
          makeReadOnly(materialLotsSection) + 
          makeReadOnly(dynamicSection) + 
          makeReadOnly(qtySection) + 
          makeReadOnly(downtimeSection);

        const cardNotes = `
          <div class="card" style="padding: 3px 6px; margin-bottom: 3px; border: 1px solid #94a3b8; background: #fff;">
            <label style="font-size: 8.5px; font-weight: 700; color: #1e293b; margin-bottom: 2px; display: block;">
              📝 <span class="sec-num"></span> 작업 특이사항
            </label>
            <div style="background: #ffffff; padding: 3px 6px; border-radius: 3px; border: 1px solid #e2e8f0; font-size: 8px; min-height: 16px; line-height: 1.4;">
              ${r.notes || '특이사항 없음.'}
            </div>
          </div>
        `;

        modalBodyRef.current.innerHTML = `
          <div class="print-report-sheet" style="font-size: 9px; max-width: 800px; margin: 0 auto;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 5px;">
              <div>
                <h2 style="font-size: 15px; font-weight: 800; color: #000; margin: 0; letter-spacing: 2px;">공 정 작 업 일 보</h2>
                <div style="font-size: 8px; color: #64748b; margin-top: 1px;">일보 번호: ${r.id} | 작성일시: ${r.createdAt || r.date}</div>
              </div>

              <table class="approval-table" style="border-collapse: collapse; border: 1px solid #000; font-size: 9px; text-align: center; table-layout: fixed; width: 100px;">
                <colgroup>
                  <col style="width: 50px;" />
                  <col style="width: 50px;" />
                </colgroup>
                <tr>
                  <td style="border: 1px solid #000; background: #f1f5f9; font-weight: 700; padding: 2px 4px; height: 16px;">작&nbsp;&nbsp;&nbsp;성</td>
                  <td style="border: 1px solid #000; background: #f1f5f9; font-weight: 700; padding: 2px 4px;">승&nbsp;&nbsp;&nbsp;인</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; height: 59px; vertical-align: middle; font-weight: 700; padding: 2px 4px;">${r.workerName}</td>
                  <td style="border: 1px solid #000; height: 59px; vertical-align: middle; font-weight: 600; padding: 2px 4px;">${r.approver || ''}</td>
                </tr>
              </table>
            </div>

            <div style="background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.12)); border: 1px solid #8b5cf6; border-radius: 3px; padding: 3px 6px; margin-bottom: 3px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 3px;">
              <div style="display: flex; align-items: center; gap: 4px;">
                <span style="font-size: 10px;">🏷️</span>
                <div>
                  <div style="font-size: 8px; font-weight: 800; color: #7c3aed;">
                    양식 고유번호: #${r.formCode}
                  </div>
                  <div style="font-size: 8px; color: #1e293b; font-weight: 600;">
                    [${r.carModel}] ${r.itemName || 'D/SIDE'} - ${r.processName} 공정 전용 양식
                  </div>
                </div>
              </div>
              <span class="status-badge ${r.status === '승인 완료' ? 'approved' : r.status === '반려' ? 'rejected' : 'pending'}" style="font-size: 8px; font-weight: 700;">
                ${r.status}
              </span>
            </div>

            ${cardDateTime}
            ${cardSummary}
            ${cardDynamicContent}
            ${cardNotes}

            <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 3px 6px; border-radius: 3px; border: 1px solid #e2e8f0; margin-top: 2px;">
              <div>
                <span style="color: #64748b; font-size: 8px;">최종 승인 상태:</span>
                <span class="status-badge ${r.status === '승인 완료' ? 'approved' : r.status === '반려' ? 'rejected' : 'pending'}" style="margin-left: 4px;">
                  ${r.status}
                </span>
              </div>
              <div style="font-size: 8px; color: #64748b;">
                ${r.approver ? `승인자: <strong>${r.approver}</strong> (${r.approvedAt || ''})` : '승인 대기중'}
              </div>
            </div>
          </div>
        `;
      }

      let currentSecIdx = 3;
      modalBodyRef.current.querySelectorAll('.sec-num').forEach(el => {
        el.textContent = currentSecIdx + '.';
        currentSecIdx++;
      });
    } catch (err) {
      alert("상세보기 오류: " + err.message);
      console.error(err);
    }
  }, [report]);

  if (!report) return null;

  return (
    <div className="modal-backdrop active" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '820px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ flexShrink: 0 }}>
          <div className="modal-title">📄 공정 작업일보 상세 정보</div>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body" ref={modalBodyRef} style={{ overflowY: 'auto', flex: 1 }}>
          {/* Dynamic Content rendered via useEffect */}
        </div>
        <div className="modal-footer" style={{ flexShrink: 0 }}>
          <button className="btn btn-secondary" onClick={() => {
            const printSheet = modalBodyRef.current.querySelector('.print-report-sheet');
            printIsolatedReport(printSheet, '공정작업일보');
          }}>
            <span>🖨️</span> 인쇄 / PDF 출력
          </button>
          <button className="btn btn-primary" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}
