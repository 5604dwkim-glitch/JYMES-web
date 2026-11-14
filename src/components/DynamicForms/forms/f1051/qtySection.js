/**
 * 양식 고유 번호 #1051 (제네시스 JG1 / FRUNK / 소재준비)
 * "6. 생산실적 및 불량 현황" 전용 렌더러
 *
 * - 구분(Division): 타공 단면 / 무타공 단면 2열 구성
 * - 생산량(Q,TY): 계획(기본 300) / 실적
 * - 압출소재불량(Extrusion Badness): 스코치(Scortch), 외면흠 (Scratch), 후로킹 (Flock,g), 오염 (Contamination)
 * - 공정간불량(Process Badness): 길이 (Length), 컷팅 (Cutting), 찍힘/변형
 * - 기타불량(Etc Badness): 조인트 (Joint), 기타 (Etc), 합계
 * - 모든 입력칸 ID 는 `f1051_` 접두사 + `data-save-group="qtyTable"` 및 명시적 `data-*` 속성만 사용 (GEMINI.md 원칙 1·2·8·10·11·12·13)
 */

export const F1051_QTY_COLS = [
  { key: 'perf', label: '타공 단면', legacySuffix: 'FL' },
  { key: 'nonperf', label: '무타공 단면', legacySuffix: null }
];

export const F1051_DEFECT_GROUPS = [
  {
    groupLabel: '압출소재불량<br>(Extrusion Badness)',
    items: [
      { key: 'ext_scorch', label: '스코치(Scortch)' },
      { key: 'ext_scratch', label: '외면흠 (Scratch)' },
      { key: 'ext_flock', label: '후로킹 (Flock,g)' },
      { key: 'ext_contam', label: '오염 (Contamination)' }
    ]
  },
  {
    groupLabel: '공정간불량<br>(Process Badness)',
    items: [
      { key: 'proc_len', label: '길이 (Length)' },
      { key: 'proc_cut', label: '컷팅 (Cutting)' },
      { key: 'proc_deform', label: '찍힘/변형' }
    ]
  },
  {
    groupLabel: '기타불량<br>(Etc Badness)',
    hasSumRow: true,
    items: [
      { key: 'etc_joint', label: '조인트 (Joint)' },
      { key: 'etc_other', label: '기타 (Etc)' }
    ]
  }
];

export const F1051_ALL_DEFECT_KEYS = F1051_DEFECT_GROUPS.flatMap(g => g.items.map(it => it.key));

const INPUT_STYLE = 'width: 100%; border: none; text-align: center; font-size: 10px; padding: 2px 0px;';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * 저장값 맵에서 계획·실적·불량 합계를 산출한다.
 * @param {Object} savedValues (id -> value)
 */
export function computeF1051QtyTotals(savedValues = {}) {
  let totalPlan = 0;
  let totalActual = 0;
  let totalDefect = 0;
  const colDefSums = {};

  F1051_QTY_COLS.forEach(col => {
    const planId = `f1051_qty_plan_${col.key}`;
    const actId = `f1051_qty_act_${col.key}`;
    const legacyPlan = col.legacySuffix ? savedValues[`plan_${col.legacySuffix}`] : undefined;
    const legacyAct = col.legacySuffix ? savedValues[`act_${col.legacySuffix}`] : undefined;

    const rawPlan = savedValues[planId] !== undefined
      ? savedValues[planId]
      : (legacyPlan !== undefined ? legacyPlan : '300');
    const rawAct = savedValues[actId] !== undefined
      ? savedValues[actId]
      : (legacyAct !== undefined ? legacyAct : '');

    totalPlan += Number(rawPlan) || 0;
    totalActual += Number(rawAct) || 0;

    let colSum = 0;
    F1051_ALL_DEFECT_KEYS.forEach(defKey => {
      const defId = `f1051_def_${defKey}_${col.key}`;
      const legacyDef = col.legacySuffix ? savedValues[`${defKey}_${col.legacySuffix}`] : undefined;
      const rawDef = savedValues[defId] !== undefined ? savedValues[defId] : legacyDef;
      colSum += Number(rawDef) || 0;
    });
    colDefSums[col.key] = colSum;
    totalDefect += colSum;
  });

  return { totalPlan, totalActual, totalDefect, colDefSums };
}

/**
 * @param {Object} savedValues 저장/현재 입력값 맵 (id -> value)
 * @returns {string} 생산실적 카드 HTML
 */
export function renderF1051QtySectionHTML(savedValues = {}) {
  const { totalPlan, totalActual, totalDefect, colDefSums } = computeF1051QtyTotals(savedValues);

  const headerCols = F1051_QTY_COLS.map(
    col => `<th style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 35%;">${col.label}</th>`
  ).join('\n                ');

  const planCells = F1051_QTY_COLS.map(col => {
    const id = `f1051_qty_plan_${col.key}`;
    const legacyVal = col.legacySuffix ? savedValues[`plan_${col.legacySuffix}`] : undefined;
    const val = savedValues[id] !== undefined ? savedValues[id] : (legacyVal !== undefined ? legacyVal : '300');
    return `<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="${id}" data-form-code="1051" data-save-group="qtyTable" data-qty-role="plan" data-col="${col.key}" class="form-control" style="${INPUT_STYLE}" value="${escapeHtml(val)}" placeholder="0" /></td>`;
  }).join('\n                ');

  const actCells = F1051_QTY_COLS.map(col => {
    const id = `f1051_qty_act_${col.key}`;
    const legacyVal = col.legacySuffix ? savedValues[`act_${col.legacySuffix}`] : undefined;
    const val = savedValues[id] !== undefined ? savedValues[id] : (legacyVal !== undefined ? legacyVal : '');
    return `<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="${id}" data-form-code="1051" data-save-group="qtyTable" data-qty-role="actual" data-col="${col.key}" class="form-control" style="${INPUT_STYLE}" value="${escapeHtml(val)}" placeholder="0" /></td>`;
  }).join('\n                ');

  const defectGroupsHtml = F1051_DEFECT_GROUPS.map(group => {
    const rowspan = group.items.length + (group.hasSumRow ? 1 : 0);
    const itemRows = group.items.map((item, idx) => {
      const firstCell = idx === 0
        ? `\n                <td rowspan="${rowspan}" style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; vertical-align: middle;">${group.groupLabel}</td>`
        : '';
      const inputCells = F1051_QTY_COLS.map(col => {
        const id = `f1051_def_${item.key}_${col.key}`;
        const legacyVal = col.legacySuffix ? savedValues[`${item.key}_${col.legacySuffix}`] : undefined;
        const val = savedValues[id] !== undefined ? savedValues[id] : (legacyVal !== undefined ? legacyVal : '');
        return `<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="${id}" data-form-code="1051" data-save-group="qtyTable" data-qty-role="defect" data-col="${col.key}" class="form-control" style="${INPUT_STYLE}" value="${escapeHtml(val)}" placeholder="0" /></td>`;
      }).join('\n                ');

      return `
              <tr>${firstCell}
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">${item.label}</td>
                ${inputCells}
              </tr>`;
    }).join('');

    const sumRow = group.hasSumRow
      ? `
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">합계</td>
                ${F1051_QTY_COLS.map(col => `<td style="border: 1px solid #000; padding: 2px; font-weight: bold; background: #f8f9fa;"><span id="f1051_def_sum_${col.key}" data-form-code="1051" data-qty-role="defect-sum" data-col="${col.key}">${colDefSums[col.key] || 0}</span></td>`).join('\n                ')}
              </tr>`
      : '';

    return `${itemRows}${sumRow}`;
  }).join('');

  return `
      <div class="card" data-form-code="1051" style="padding: 16px; margin-bottom: 16px;">
        <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 8px; display: block;">
          📊 <span class="sec-num"></span> 생산실적 및 불량 현황
        </label>
        <input type="hidden" id="targetQty" value="${totalPlan}" />
        <input type="hidden" id="actualQty" value="${totalActual}" />
        <input type="hidden" id="defectQty" value="${totalDefect}" />
        <div style="overflow-x: auto;">
          <table data-form-code="1051" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700;">
                <th colspan="2" style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 24%;">
                  구 분(Division)
                </th>
                ${headerCols}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td rowspan="2" style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; vertical-align: middle; width: 12%;">
                  생산량(Q,TY)
                </td>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; width: 13%;">계획</td>
                ${planCells}
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">실적</td>
                ${actCells}
              </tr>${defectGroupsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;
}

/**
 * qtySection 내부 요소만 스코프 조회하여 단면별 불량 합계 및 숨김 총계 필드를 갱신한다. (GEMINI.md 원칙 13)
 * @param {HTMLElement} qtySection #qtySection
 */
export function calcF1051QtySummary(qtySection) {
  if (!qtySection) return;

  let totalPlan = 0;
  let totalActual = 0;
  let totalDefect = 0;

  qtySection.querySelectorAll('input[data-form-code="1051"][data-qty-role="plan"]').forEach(el => {
    totalPlan += Number(el.value) || 0;
  });

  qtySection.querySelectorAll('input[data-form-code="1051"][data-qty-role="actual"]').forEach(el => {
    totalActual += Number(el.value) || 0;
  });

  F1051_QTY_COLS.forEach(col => {
    let colSum = 0;
    qtySection.querySelectorAll(`input[data-form-code="1051"][data-qty-role="defect"][data-col="${col.key}"]`).forEach(el => {
      colSum += Number(el.value) || 0;
    });
    const sumSpan = qtySection.querySelector(`span[data-form-code="1051"][data-qty-role="defect-sum"][data-col="${col.key}"]`);
    if (sumSpan) sumSpan.textContent = String(colSum);
    totalDefect += colSum;
  });

  const targetInput = qtySection.querySelector('#targetQty');
  const actualInput = qtySection.querySelector('#actualQty');
  const defectInput = qtySection.querySelector('#defectQty');
  if (targetInput) targetInput.value = String(totalPlan);
  if (actualInput) actualInput.value = String(totalActual);
  if (defectInput) defectInput.value = String(totalDefect);
}

/**
 * QtySectionRenderer.js 의 `case 1051` 에서 위임 호출.
 * @param {HTMLElement} qtySection #qtySection (새로 교체된 노드)
 * @param {Object} ctx             QtySectionRenderer 컨텍스트
 */
export function renderF1051QtySection(qtySection, ctx = {}) {
  const saved = { ...(ctx.existingData?.qtyTable || {}) };
  qtySection.querySelectorAll('[data-form-code="1051"][data-save-group="qtyTable"]').forEach(el => {
    if (el.id && el.value !== '') saved[el.id] = el.value;
  });

  qtySection.innerHTML = renderF1051QtySectionHTML(saved);

  if (qtySection.dataset.f1051Bound !== '1') {
    qtySection.dataset.f1051Bound = '1';
    qtySection.addEventListener('input', () => calcF1051QtySummary(qtySection));
  }
  calcF1051QtySummary(qtySection);
}
