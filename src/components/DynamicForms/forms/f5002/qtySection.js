/**
 * 양식 고유 번호 #5002 (GM 9BQC / G/RUN / 소재준비-정치절단)
 * "6. 생산실적 및 불량 현황" 전용 렌더러 (상단 FRT 표 [A·B·C] / 하단 RR 표 [A·B])
 *
 * - 생산량 (Q,ty): 구 분(Division)[rowspan=2] | FRT(또는 RR) 아래 A·B(·C) 헤더, 계획(기본 1200) / 실적 각 1행 입력
 * - 불량소재구분 (Section "A"·"B"[·"C"]):
 *   · 압출소재 불량 (Extrusion Badness): 스코치(Scortch), 외면 흠(Scratch), 오염(Contamination), 길이 미달(Length Bad), 와이어 노출, 기타 ( Etc )
 *   · 공정간 불량(Process Badness): 길이 (Length Bad), 기타 ( Etc )
 *   · 불량 합계(Bad Sum): 섹션별 자동 합산
 * - 가로 스크롤 방지: `table-layout: fixed` + `<colgroup>` 비율 고정 + `[data-form-code="5002"]` 스코프 스타일
 * - 모든 ID/저장 키는 `f5002_` 접두사 및 명시적 `data-*` 속성 사용 (GEMINI.md 원칙 1·2·8·10·11·12·13)
 */

export const F5002_QTY_GROUPS = [
  {
    groupKey: 'FRT',
    divisionLabel: 'FRT',
    sections: ['A', 'B', 'C'],
    defaultPlan: 1200,
    marginBottom: '18px'
  },
  {
    groupKey: 'RR',
    divisionLabel: 'RR',
    sections: ['A', 'B'],
    defaultPlan: 1200,
    marginBottom: '0'
  }
];

export const F5002_EXTRUSION_DEFECTS = [
  { key: 'ext_scorch', label: '스코치(Scortch)' },
  { key: 'ext_scratch', label: '외면 흠(Scratch)' },
  { key: 'ext_contam', label: '오염(Contamination)' },
  { key: 'ext_len_short', label: '길이 미달(Length Bad)' },
  { key: 'ext_wire', label: '와이어 노출' },
  { key: 'ext_etc', label: '기타 ( Etc )', isEtc: true }
];

export const F5002_PROCESS_DEFECTS = [
  { key: 'proc_len', label: '길이 (Length Bad)' },
  { key: 'proc_etc', label: '기타 ( Etc )', isEtc: true }
];

export const F5002_ALL_DEFECTS = [
  ...F5002_EXTRUSION_DEFECTS,
  ...F5002_PROCESS_DEFECTS
];

const YELLOW_BG = '#fffde7';
const INPUT_STYLE = 'width: 100%; min-width: 0; height: 26px; border: none; text-align: center; font-size: 11px; font-weight: 700; color: #000; padding: 1px 0; background: transparent; outline: none; border-radius: 0; box-sizing: border-box;';

/**
 * 저장값 맵에서 계획·실적·불량 합계를 산출한다.
 * @param {Object} savedValues (id -> value)
 */
export function computeF5002Totals(savedValues = {}) {
  let totalPlan = 0;
  let totalActual = 0;
  let totalDefect = 0;
  const secDefSums = {};
  const secHasDefectInput = {};

  F5002_QTY_GROUPS.forEach(group => {
    group.sections.forEach(sec => {
      const planKey = `f5002_${group.groupKey}_${sec}_plan`;
      const actKey = `f5002_${group.groupKey}_${sec}_act`;
      const rawPlan = savedValues[planKey] ?? savedValues[`${planKey}_1`];
      const rawAct = savedValues[actKey] ?? savedValues[`${actKey}_1`];
      const planVal = rawPlan !== undefined ? rawPlan : group.defaultPlan;

      totalPlan += Number(planVal) || 0;
      totalActual += Number(rawAct) || 0;

      const secId = `${group.groupKey}_${sec}`;
      let colSum = 0;
      let hasInput = false;
      F5002_ALL_DEFECTS.forEach(def => {
        const raw = savedValues[`f5002_${group.groupKey}_${sec}_def_${def.key}`];
        if (raw !== undefined && String(raw).trim() !== '') hasInput = true;
        colSum += Number(raw) || 0;
      });
      secDefSums[secId] = colSum;
      secHasDefectInput[secId] = hasInput;
      totalDefect += colSum;
    });
  });

  return { totalPlan, totalActual, totalDefect, secDefSums, secHasDefectInput };
}

function renderGroupBlock(group, savedValues, secDefSums, secHasDefectInput) {
  const secCount = group.sections.length;
  const secColWidth = (62 / secCount).toFixed(2);

  const colgroupHtml = [
    '<col style="width: 18%;" />',
    '<col style="width: 20%;" />',
    ...group.sections.map(() => `<col style="width: ${secColWidth}%;" />`)
  ].join('\n                  ');

  // ── 1) 상단 생산량 (Q,ty) 테이블 ──
  const sectionSubHeaders = group.sections
    .map(sec => `<th style="border: 1px solid #000; padding: 5px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">${sec}</th>`)
    .join('\n                    ');

  const planCells = group.sections.map((sec, secIdx) => {
    const planId = `f5002_${group.groupKey}_${sec}_plan`;
    const rawPlan = savedValues[planId] ?? savedValues[`${planId}_1`];
    const planVal = rawPlan !== undefined ? rawPlan : String(group.defaultPlan);
    const rightBorder = secIdx === group.sections.length - 1 ? '1px solid #000' : '1px dotted #475569';
    return `<td style="border-top: 1px solid #000; border-bottom: 1px dotted #475569; border-right: ${rightBorder}; padding: 0; background: #ffffff; vertical-align: middle;">
                      <input type="number" min="0" inputmode="numeric" id="${planId}" data-form-code="5002" data-save-group="qtyTable" data-qty-role="plan" class="form-control" style="${INPUT_STYLE}" value="${planVal}" />
                    </td>`;
  }).join('\n                    ');

  const actCells = group.sections.map((sec, secIdx) => {
    const actId = `f5002_${group.groupKey}_${sec}_act`;
    const actVal = savedValues[actId] ?? savedValues[`${actId}_1`] ?? '';
    const rightBorder = secIdx === group.sections.length - 1 ? '1px solid #000' : '1px dotted #475569';
    return `<td style="border-bottom: 1px solid #000; border-right: ${rightBorder}; padding: 0; background: #ffffff; vertical-align: middle;">
                      <input type="number" min="0" inputmode="numeric" id="${actId}" data-form-code="5002" data-save-group="qtyTable" data-qty-role="actual" class="form-control" style="${INPUT_STYLE}" value="${actVal}" />
                    </td>`;
  }).join('\n                    ');

  // ── 2) 하단 불량소재구분 테이블 ──
  const defSectionHeaders = group.sections
    .map((sec, idx) => {
      const leftBorder = idx === 0 ? '1px solid #000' : '1px dotted #475569';
      return `<th style="border-top: 1px solid #000; border-bottom: 1px solid #000; border-left: ${leftBorder}; border-right: 1px solid #000; padding: 5px 1px; background: ${YELLOW_BG}; font-weight: 700; color: #000; font-size: 10.5px; letter-spacing: -0.3px; vertical-align: middle;">Section "${sec}"</th>`;
    })
    .join('\n                    ');

  const renderDefectRows = (defList, categoryHtml) =>
    defList.map((def, idx) => {
      const isLast = idx === defList.length - 1;
      const bottomBorder = isLast ? '1px solid #000' : '1px dotted #475569';
      const catCell = idx === 0
        ? `\n                    <td rowspan="${defList.length}" style="border: 1px solid #000; padding: 4px 2px; background: ${YELLOW_BG}; font-weight: 700; color: #000; font-size: 10px; line-height: 1.25; letter-spacing: -0.3px; vertical-align: middle;">${categoryHtml}</td>`
        : '';
      const labelFont = def.isEtc ? '10px' : '9px';
      const labelWeight = def.isEtc ? '700' : '600';

      const inputCells = group.sections.map((sec, secIdx) => {
        const id = `f5002_${group.groupKey}_${sec}_def_${def.key}`;
        const val = savedValues[id] ?? '';
        const secId = `${group.groupKey}_${sec}`;
        const rightBorder = secIdx === group.sections.length - 1 ? '1px solid #000' : '1px dotted #475569';
        return `<td style="border-bottom: ${bottomBorder}; border-right: ${rightBorder}; padding: 0; background: #ffffff; vertical-align: middle;">
                      <input type="number" min="0" inputmode="numeric" id="${id}" data-form-code="5002" data-save-group="qtyTable" data-qty-role="defect" data-sec="${secId}" class="form-control" style="${INPUT_STYLE}" value="${val}" />
                    </td>`;
      }).join('\n                    ');

      return `
                  <tr>${catCell}
                    <td style="border-bottom: ${bottomBorder}; border-right: 1px dotted #475569; padding: 4px 2px; background: #ffffff; font-weight: ${labelWeight}; color: #000; font-size: ${labelFont}; letter-spacing: -0.4px; line-height: 1.2; word-break: keep-all; vertical-align: middle;">${def.label}</td>
                    ${inputCells}
                  </tr>`;
    }).join('');

  const extRowsHtml = renderDefectRows(
    F5002_EXTRUSION_DEFECTS,
    '압출소재<br>불량<br>(Extrusion<br>Badness)'
  );
  const procRowsHtml = renderDefectRows(
    F5002_PROCESS_DEFECTS,
    '공정간<br>불량(Process<br>Badness)'
  );

  const sumCells = group.sections.map(sec => {
    const secId = `${group.groupKey}_${sec}`;
    const sumText = (secDefSums[secId] > 0 || secHasDefectInput[secId]) ? String(secDefSums[secId]) : '';
    return `<td id="f5002_${group.groupKey}_${sec}_def_sum" data-form-code="5002" data-qty-role="defect-sum" data-sec="${secId}" style="border: 1px solid #000; padding: 5px 2px; background: #ffffff; font-weight: 700; color: var(--accent-rose); font-size: 11px; vertical-align: middle;">${sumText}</td>`;
  }).join('\n                    ');

  const wrapMb = group.marginBottom && group.marginBottom !== '0' ? ` margin-bottom: ${group.marginBottom};` : '';

  return `
            <div style="width: 100%; overflow-x: hidden;${wrapMb}">
              <table data-form-code="5002" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif; margin-bottom: 3px;">
                <colgroup>
                  ${colgroupHtml}
                </colgroup>
                <thead>
                  <tr style="background: ${YELLOW_BG}; font-weight: 700; color: #000;">
                    <th colspan="2" rowspan="2" style="border: 1px solid #000; padding: 6px 2px; background: ${YELLOW_BG}; font-size: 11px; vertical-align: middle;">구 분(Division)</th>
                    <th colspan="${secCount}" style="border: 1px solid #000; padding: 5px 2px; background: ${YELLOW_BG}; font-size: 11.5px; vertical-align: middle;">${group.divisionLabel}</th>
                  </tr>
                  <tr>
                    ${sectionSubHeaders}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td rowspan="2" style="border: 1px solid #000; padding: 5px 2px; background: ${YELLOW_BG}; font-weight: 700; color: #000; font-size: 10px; letter-spacing: -0.3px; vertical-align: middle;">생산량 (Q,ty)</td>
                    <td style="border: 1px solid #000; padding: 5px 2px; background: ${YELLOW_BG}; font-weight: 700; color: #000; font-size: 10.5px; vertical-align: middle;">계획</td>
                    ${planCells}
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 5px 2px; background: ${YELLOW_BG}; font-weight: 700; color: #000; font-size: 10.5px; vertical-align: middle;">실적</td>
                    ${actCells}
                  </tr>
                </tbody>
              </table>

              <table data-form-code="5002" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <colgroup>
                  ${colgroupHtml}
                </colgroup>
                <thead>
                  <tr style="background: ${YELLOW_BG}; font-weight: 700; color: #000;">
                    <th colspan="2" style="border: 1px solid #000; padding: 5px 2px; background: ${YELLOW_BG}; font-size: 11px; vertical-align: middle;">불량소재구분</th>
                    ${defSectionHeaders}
                  </tr>
                </thead>
                <tbody>${extRowsHtml}${procRowsHtml}
                  <tr>
                    <td colspan="2" style="border: 1px solid #000; padding: 5px 2px; background: ${YELLOW_BG}; font-weight: 700; color: #000; font-size: 10.5px; letter-spacing: -0.2px; vertical-align: middle;">불량 합계(Bad Sum)</td>
                    ${sumCells}
                  </tr>
                </tbody>
              </table>
            </div>`;
}

/**
 * @param {Object} savedValues 저장/현재 입력값 맵 (id -> value)
 * @returns {string} 카드 전체 HTML
 */
export function renderF5002QtySectionHTML(savedValues = {}) {
  const { totalPlan, totalActual, totalDefect, secDefSums, secHasDefectInput } = computeF5002Totals(savedValues);
  const blocksHtml = F5002_QTY_GROUPS
    .map(g => renderGroupBlock(g, savedValues, secDefSums, secHasDefectInput))
    .join('\n');

  return `
        <div class="card f5002-qty-card" data-form-code="5002" style="padding: 14px 10px; margin-bottom: 16px;">
          <style>
            .f5002-qty-card[data-form-code="5002"] input[type="number"]::-webkit-outer-spin-button,
            .f5002-qty-card[data-form-code="5002"] input[type="number"]::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            .f5002-qty-card[data-form-code="5002"] input[type="number"] {
              -moz-appearance: textfield;
              appearance: textfield;
              min-width: 0;
              font-size: 11px !important;
              box-sizing: border-box;
            }
          </style>
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; padding: 0 4px; display: block;">
            📊 <span class="sec-num"></span> 생산실적 및 불량 현황
          </label>
          <input type="hidden" id="targetQty" value="${totalPlan}" />
          <input type="hidden" id="actualQty" value="${totalActual}" />
          <input type="hidden" id="defectQty" value="${totalDefect}" />${blocksHtml}
        </div>
      `;
}

/**
 * qtySection 내부 요소만 스코프 조회하여 섹션별 불량 합계 및 숨김 총계 필드를 갱신한다. (GEMINI.md 원칙 13)
 * @param {HTMLElement} qtySection #qtySection
 */
export function calcF5002QtySummary(qtySection) {
  if (!qtySection) return;

  let totalPlan = 0;
  let totalActual = 0;
  let totalDefect = 0;

  qtySection.querySelectorAll('input[data-form-code="5002"][data-qty-role="plan"]').forEach(el => {
    totalPlan += Number(el.value) || 0;
  });

  qtySection.querySelectorAll('input[data-form-code="5002"][data-qty-role="actual"]').forEach(el => {
    totalActual += Number(el.value) || 0;
  });

  F5002_QTY_GROUPS.forEach(group => {
    group.sections.forEach(sec => {
      const secId = `${group.groupKey}_${sec}`;
      let colSum = 0;
      let hasInput = false;
      qtySection.querySelectorAll(`input[data-form-code="5002"][data-qty-role="defect"][data-sec="${secId}"]`).forEach(el => {
        if (String(el.value).trim() !== '') hasInput = true;
        colSum += Number(el.value) || 0;
      });
      const sumCell = qtySection.querySelector(`td[data-form-code="5002"][data-qty-role="defect-sum"][data-sec="${secId}"]`);
      if (sumCell) sumCell.textContent = (colSum > 0 || hasInput) ? String(colSum) : '';
      totalDefect += colSum;
    });
  });

  const targetInput = qtySection.querySelector('#targetQty');
  const actualInput = qtySection.querySelector('#actualQty');
  const defectInput = qtySection.querySelector('#defectQty');
  if (targetInput) targetInput.value = String(totalPlan);
  if (actualInput) actualInput.value = String(totalActual);
  if (defectInput) defectInput.value = String(totalDefect);
}

/**
 * QtySectionRenderer.js 의 `case 5002` 에서 위임 호출.
 * @param {HTMLElement} qtySection #qtySection (새로 교체된 노드)
 * @param {Object} ctx             QtySectionRenderer 컨텍스트
 */
export function renderF5002QtySection(qtySection, ctx = {}) {
  const saved = { ...(ctx.existingData?.qtyTable || {}) };
  qtySection.querySelectorAll('[data-form-code="5002"][data-save-group="qtyTable"]').forEach(el => {
    if (el.id && el.value !== '') saved[el.id] = el.value;
  });

  qtySection.innerHTML = renderF5002QtySectionHTML(saved);

  if (qtySection.dataset.f5002Bound !== '1') {
    qtySection.dataset.f5002Bound = '1';
    qtySection.addEventListener('input', () => calcF5002QtySummary(qtySection));
  }
  calcF5002QtySummary(qtySection);
}
