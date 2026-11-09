/**
 * 양식 고유 번호 #5001 (GM 9BQC / G/RUN / 소재준비-글라스본딩)
 * "6. 생산실적 및 불량 현황" 전용 렌더러
 *
 * - 제품명 4종(상단 헤더만 연노랑): 9BQC PRI LH (계획 1200) / 9BQC PRI RH (계획 1200) / 9BQC TIN LH (계획 120) / 9BQC TIN RH (계획 120)
 * - 행 구성(흰색 배경): 계획 / 정품 생산량(EA) / 불량수량(EA)[곡률·스크래치·도트(세라믹)불량·면취불량·조개피(유리깨짐)·불량 합계]
 * - 가로 스크롤 방지: `table-layout: fixed` + `<colgroup>` 비율 고정 + 스코프 스타일 (GEMINI.md 원칙 1·2·8·10·12·13)
 */

import { renderF5001TipExchangeHTML, bindF5001TipExchangeEvents } from './tipExchangeSection';

export const F5001_QTY_PRODUCTS = [
  { key: 'PRI_LH', label: '9BQC PRI LH', defaultPlan: 1200 },
  { key: 'PRI_RH', label: '9BQC PRI RH', defaultPlan: 1200 },
  { key: 'TIN_LH', label: '9BQC TIN LH', defaultPlan: 120 },
  { key: 'TIN_RH', label: '9BQC TIN RH', defaultPlan: 120 }
];

export const F5001_DEFECT_TYPES = [
  { key: 'curv', label: '곡률' },
  { key: 'scratch', label: '스크래치' },
  { key: 'dot', label: '도트(세라믹)불량' },
  { key: 'chamfer', label: '면취불량' },
  { key: 'chip', label: '조개피(유리깨짐)' }
];

const WHITE_INPUT_TD_STYLE = 'border: 1px solid #000; padding: 1px; background: #ffffff;';
const INPUT_STYLE = 'width: 100%; min-width: 0; height: 28px; border: none; text-align: center; font-size: 12px; font-weight: 700; color: #000; padding: 2px 1px; background: transparent; outline: none; border-radius: 0; box-sizing: border-box;';

/**
 * 저장값 맵에서 계획·정품·제품별 불량 합계·전체 불량 합계를 산출한다.
 * @param {Object} savedValues (id -> value)
 */
export function computeF5001Totals(savedValues = {}) {
  let totalPlan = 0;
  let totalGood = 0;
  let totalDefect = 0;
  const colDefSums = {};
  const colHasDefectInput = {};

  F5001_QTY_PRODUCTS.forEach(prod => {
    const planKey = `f5001_${prod.key}_plan`;
    const planVal = savedValues[planKey] !== undefined ? savedValues[planKey] : prod.defaultPlan;
    totalPlan += Number(planVal) || 0;
    totalGood += Number(savedValues[`f5001_${prod.key}_good`]) || 0;

    let colSum = 0;
    let hasInput = false;
    F5001_DEFECT_TYPES.forEach(def => {
      const raw = savedValues[`f5001_${prod.key}_def_${def.key}`];
      if (raw !== undefined && String(raw).trim() !== '') hasInput = true;
      colSum += Number(raw) || 0;
    });
    colDefSums[prod.key] = colSum;
    colHasDefectInput[prod.key] = hasInput;
    totalDefect += colSum;
  });

  return { totalPlan, totalGood, totalDefect, colDefSums, colHasDefectInput };
}

/**
 * @param {Object} savedValues 저장/현재 입력값 맵 (id -> value)
 * @returns {string} 카드 전체 HTML
 */
export function renderF5001QtySectionHTML(savedValues = {}) {
  const { totalPlan, totalGood, totalDefect, colDefSums, colHasDefectInput } = computeF5001Totals(savedValues);

  const headerCols = F5001_QTY_PRODUCTS.map(
    prod => `<th style="border: 1px solid #000; padding: 7px 1px; background: #fffde7; font-weight: 700; color: #000; font-size: 10px; letter-spacing: -0.3px; line-height: 1.2; word-break: keep-all; vertical-align: middle;">${prod.label}</th>`
  ).join('\n                  ');

  const planCols = F5001_QTY_PRODUCTS.map(prod => {
    const id = `f5001_${prod.key}_plan`;
    const val = savedValues[id] !== undefined ? savedValues[id] : String(prod.defaultPlan);
    return `<td style="${WHITE_INPUT_TD_STYLE}">
                    <input type="number" min="0" inputmode="numeric" id="${id}" data-form-code="5001" data-save-group="qtyTable" data-qty-role="plan" data-prod="${prod.key}" class="form-control" style="${INPUT_STYLE}" value="${val}" />
                  </td>`;
  }).join('\n                  ');

  const goodCols = F5001_QTY_PRODUCTS.map(prod => {
    const id = `f5001_${prod.key}_good`;
    const val = savedValues[id] ?? '';
    return `<td style="${WHITE_INPUT_TD_STYLE}">
                    <input type="number" min="0" inputmode="numeric" id="${id}" data-form-code="5001" data-save-group="qtyTable" data-qty-role="good" data-prod="${prod.key}" class="form-control" style="${INPUT_STYLE}" value="${val}" />
                  </td>`;
  }).join('\n                  ');

  const defectRows = F5001_DEFECT_TYPES.map((def, idx) => {
    const groupCell = idx === 0
      ? `\n                  <td rowspan="6" style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 10.5px; letter-spacing: -0.3px; line-height: 1.25; word-break: keep-all; vertical-align: middle;">불량수량<wbr>(EA)</td>`
      : '';
    const cols = F5001_QTY_PRODUCTS.map(prod => {
      const id = `f5001_${prod.key}_def_${def.key}`;
      const val = savedValues[id] ?? '';
      return `<td style="${WHITE_INPUT_TD_STYLE}">
                    <input type="number" min="0" inputmode="numeric" id="${id}" data-form-code="5001" data-save-group="qtyTable" data-qty-role="defect" data-prod="${prod.key}" class="form-control" style="${INPUT_STYLE}" value="${val}" />
                  </td>`;
    }).join('\n                  ');

    return `
                <tr>${groupCell}
                  <td style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 10px; letter-spacing: -0.3px; line-height: 1.2; word-break: keep-all; vertical-align: middle;">${def.label}</td>
                  ${cols}
                </tr>`;
  }).join('');

  const defectSumCols = F5001_QTY_PRODUCTS.map(prod => {
    const sumText = (colDefSums[prod.key] > 0 || colHasDefectInput[prod.key]) ? String(colDefSums[prod.key]) : '';
    return `<td id="f5001_${prod.key}_def_sum" data-form-code="5001" data-qty-role="defect-sum" data-prod="${prod.key}" style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: var(--accent-rose); font-size: 12px; vertical-align: middle;">${sumText}</td>`;
  }).join('\n                  ');

  return `
        <div class="card f5001-qty-card" data-form-code="5001" style="padding: 14px 10px; margin-bottom: 16px;">
          <style>
            .f5001-qty-card[data-form-code="5001"] input[type="number"]::-webkit-outer-spin-button,
            .f5001-qty-card[data-form-code="5001"] input[type="number"]::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            .f5001-qty-card[data-form-code="5001"] input[type="number"] {
              -moz-appearance: textfield;
              appearance: textfield;
              min-width: 0;
              font-size: 12px !important;
            }
          </style>
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; padding: 0 4px; display: block;">
            📊 <span class="sec-num"></span> 생산실적 및 불량 현황
          </label>
          <input type="hidden" id="targetQty" value="${totalPlan}" />
          <input type="hidden" id="actualQty" value="${totalGood}" />
          <input type="hidden" id="defectQty" value="${totalDefect}" />
          <div style="width: 100%; overflow-x: hidden;">
            <table data-form-code="5001" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <colgroup>
                <col style="width: 13%;" />
                <col style="width: 21%;" />
                <col style="width: 16.5%;" />
                <col style="width: 16.5%;" />
                <col style="width: 16.5%;" />
                <col style="width: 16.5%;" />
              </colgroup>
              <thead>
                <tr>
                  <th colspan="2" style="border: 1px solid #000; padding: 7px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">제품명</th>
                  ${headerCols}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colspan="2" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">계획</td>
                  ${planCols}
                </tr>
                <tr>
                  <td colspan="2" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 10.5px; vertical-align: middle;">정품 생산량(EA)</td>
                  ${goodCols}
                </tr>${defectRows}
                <tr>
                  <td style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 600; color: #000; font-size: 10.5px; vertical-align: middle;">불량 합계</td>
                  ${defectSumCols}
                </tr>
              </tbody>
            </table>
          </div>
        </div>${renderF5001TipExchangeHTML(savedValues)}
      `;
}

/**
 * qtySection 내부 요소만 스코프 조회하여 합계 셀 및 숨김 총계 필드를 갱신한다. (GEMINI.md 원칙 13)
 * @param {HTMLElement} qtySection #qtySection
 */
export function calcF5001QtySummary(qtySection) {
  if (!qtySection) return;

  let totalPlan = 0;
  let totalGood = 0;
  let totalDefect = 0;

  qtySection.querySelectorAll('input[data-form-code="5001"][data-qty-role="plan"]').forEach(el => {
    totalPlan += Number(el.value) || 0;
  });

  qtySection.querySelectorAll('input[data-form-code="5001"][data-qty-role="good"]').forEach(el => {
    totalGood += Number(el.value) || 0;
  });

  F5001_QTY_PRODUCTS.forEach(prod => {
    let colSum = 0;
    let hasInput = false;
    qtySection.querySelectorAll(`input[data-form-code="5001"][data-qty-role="defect"][data-prod="${prod.key}"]`).forEach(el => {
      if (String(el.value).trim() !== '') hasInput = true;
      colSum += Number(el.value) || 0;
    });
    const sumCell = qtySection.querySelector(`td[data-form-code="5001"][data-qty-role="defect-sum"][data-prod="${prod.key}"]`);
    if (sumCell) sumCell.textContent = (colSum > 0 || hasInput) ? String(colSum) : '';
    totalDefect += colSum;
  });

  const targetInput = qtySection.querySelector('#targetQty');
  const actualInput = qtySection.querySelector('#actualQty');
  const defectInput = qtySection.querySelector('#defectQty');
  if (targetInput) targetInput.value = String(totalPlan);
  if (actualInput) actualInput.value = String(totalGood);
  if (defectInput) defectInput.value = String(totalDefect);
}

/**
 * QtySectionRenderer.js 의 `case 5001` 에서 위임 호출.
 * @param {HTMLElement} qtySection #qtySection (새로 교체된 노드)
 * @param {Object} ctx             QtySectionRenderer 컨텍스트
 */
export function renderF5001QtySection(qtySection, ctx = {}) {
  const saved = { ...(ctx.existingData?.qtyTable || {}) };
  qtySection.querySelectorAll('[data-form-code="5001"][data-save-group="qtyTable"]').forEach(el => {
    if (el.id && el.value !== '') saved[el.id] = el.value;
  });

  qtySection.innerHTML = renderF5001QtySectionHTML(saved);

  if (qtySection.dataset.f5001Bound !== '1') {
    qtySection.dataset.f5001Bound = '1';
    qtySection.addEventListener('input', () => calcF5001QtySummary(qtySection));
  }
  calcF5001QtySummary(qtySection);
  bindF5001TipExchangeEvents(qtySection, ctx);
}
