/**
 * 양식 고유 번호 #1052 (제네시스 JG1 / FRUNK / 조인트)
 * "7. 생산실적 및 불량 현황" 전용 렌더러
 *
 * - 구분(Division): Frunk
 * - 생산량(Q,TY): 계획(기본 300) / 실적
 * - 압출소재불량(Extrusion Badness): 스코치(Scortch), 외면흠 (Scratch), 오염 (Contamination) — 후로킹(Flock,g) 항목 삭제
 * - 공정간불량(Process Badness): 길이 (Length), 컷팅 (Cutting), 기타 (The others)
 * - 불량합계(Total)
 * - 모든 입력칸 ID 는 `f1052_` 접두사 + `data-save-group="qtyTable"` 및 명시적 `data-*` 속성만 사용 (GEMINI.md 원칙 1·2·8·10·11·12·13)
 */

export const F1052_DEFECT_GROUPS = [
  {
    groupLabel: '압출소재불량<br>(Extrusion Badness)',
    items: [
      { key: 'ext_scorch', label: '스코치(Scortch)' },
      { key: 'ext_scratch', label: '외면흠 (Scratch)' },
      { key: 'ext_contam', label: '오염 (Contamination)' }
    ]
  },
  {
    groupLabel: '공정간불량<br>(Process Badness)',
    items: [
      { key: 'proc_len', label: '길이 (Length)' },
      { key: 'proc_cut', label: '컷팅 (Cutting)' },
      { key: 'proc_oth', label: '기타 (The others)' }
    ]
  }
];

export const F1052_ALL_DEFECT_KEYS = F1052_DEFECT_GROUPS.flatMap(g => g.items.map(it => it.key));

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
export function computeF1052QtyTotals(savedValues = {}) {
  const rawPlan = savedValues.f1052_qty_plan_FL !== undefined
    ? savedValues.f1052_qty_plan_FL
    : (savedValues.plan_FL !== undefined ? savedValues.plan_FL : '300');
  const rawAct = savedValues.f1052_qty_act_FL !== undefined
    ? savedValues.f1052_qty_act_FL
    : (savedValues.act_FL !== undefined ? savedValues.act_FL : '');

  const totalPlan = Number(rawPlan) || 0;
  const totalActual = Number(rawAct) || 0;

  let totalDefect = 0;
  F1052_ALL_DEFECT_KEYS.forEach(defKey => {
    const defId = `f1052_def_${defKey}_FL`;
    const rawDef = savedValues[defId] !== undefined ? savedValues[defId] : savedValues[`${defKey}_FL`];
    totalDefect += Number(rawDef) || 0;
  });

  return { totalPlan, totalActual, totalDefect, rawPlan, rawAct };
}

/**
 * @param {Object} savedValues 저장/현재 입력값 맵 (id -> value)
 * @returns {string} 생산실적 카드 HTML
 */
export function renderF1052QtySectionHTML(savedValues = {}) {
  const { totalPlan, totalActual, totalDefect, rawPlan, rawAct } = computeF1052QtyTotals(savedValues);

  const defectGroupsHtml = F1052_DEFECT_GROUPS.map(group => {
    const rowspan = group.items.length;
    return group.items.map((item, idx) => {
      const firstCell = idx === 0
        ? `\n                <td rowspan="${rowspan}" style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; vertical-align: middle;">\n                  ${group.groupLabel}\n                </td>`
        : '';
      const id = `f1052_def_${item.key}_FL`;
      const val = savedValues[id] !== undefined
        ? savedValues[id]
        : (savedValues[`${item.key}_FL`] !== undefined ? savedValues[`${item.key}_FL`] : '');

      return `
              <tr>${firstCell}
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">
                  ${item.label}
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="${id}" data-form-code="1052" data-save-group="qtyTable" data-qty-role="defect" class="form-control" style="${INPUT_STYLE}" value="${escapeHtml(val)}" placeholder="0" /></td>
              </tr>`;
    }).join('');
  }).join('');

  return `
      <div class="card" data-form-code="1052" style="padding: 16px; margin-bottom: 16px;">
        <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 8px; display: block;">
          📊 <span class="sec-num"></span> 생산실적 및 불량 현황
        </label>

        <input type="hidden" id="targetQty" value="${totalPlan}" />
        <input type="hidden" id="actualQty" value="${totalActual}" />
        <input type="hidden" id="defectQty" value="${totalDefect}" />

        <div style="overflow-x: auto;">
          <table data-form-code="1052" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700;">
                <th colspan="2" style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 24%;">
                  구 분(Division)
                </th>
                <th style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 70%;">Frunk</th>
              </tr>
            </thead>
            <tbody>
              <!-- 1. 생산량(Q,TY) -->
              <tr>
                <td rowspan="2" style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; vertical-align: middle; width: 12%;">
                  생산량(Q,TY)
                </td>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; width: 12%;">
                  계획
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="f1052_qty_plan_FL" data-form-code="1052" data-save-group="qtyTable" data-qty-role="plan" class="form-control" style="${INPUT_STYLE}" value="${escapeHtml(rawPlan)}" placeholder="0" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">
                  실적
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="f1052_qty_act_FL" data-form-code="1052" data-save-group="qtyTable" data-qty-role="actual" class="form-control" style="${INPUT_STYLE}" value="${escapeHtml(rawAct)}" placeholder="0" /></td>
              </tr>${defectGroupsHtml}

              <!-- 4. 불량합계(Total) -->
              <tr style="background: #fffde7; font-weight: 700;">
                <td colspan="2" style="border: 1px solid #000; padding: 8px; color: var(--accent-rose);">
                  불량합계(Total)
                </td>
                <td id="f1052_def_sum_FL" data-form-code="1052" data-qty-role="defect-sum" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">${totalDefect}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
}

/**
 * qtySection 내부 요소만 스코프 조회하여 불량 합계 및 숨김 총계 필드를 갱신한다. (GEMINI.md 원칙 13)
 * @param {HTMLElement} qtySection #qtySection
 */
export function calcF1052QtySummary(qtySection) {
  if (!qtySection) return;

  let totalPlan = 0;
  let totalActual = 0;
  let totalDefect = 0;

  qtySection.querySelectorAll('input[data-form-code="1052"][data-qty-role="plan"]').forEach(el => {
    totalPlan += Number(el.value) || 0;
  });

  qtySection.querySelectorAll('input[data-form-code="1052"][data-qty-role="actual"]').forEach(el => {
    totalActual += Number(el.value) || 0;
  });

  qtySection.querySelectorAll('input[data-form-code="1052"][data-qty-role="defect"]').forEach(el => {
    totalDefect += Number(el.value) || 0;
  });

  const sumTd = qtySection.querySelector('td[data-form-code="1052"][data-qty-role="defect-sum"]');
  if (sumTd) sumTd.textContent = String(totalDefect);

  const targetInput = qtySection.querySelector('#targetQty');
  const actualInput = qtySection.querySelector('#actualQty');
  const defectInput = qtySection.querySelector('#defectQty');
  if (targetInput) targetInput.value = String(totalPlan);
  if (actualInput) actualInput.value = String(totalActual);
  if (defectInput) defectInput.value = String(totalDefect);
}

/**
 * QtySectionRenderer.js 의 `case 1052` 에서 위임 호출.
 * @param {HTMLElement} qtySection #qtySection (새로 교체된 노드)
 * @param {Object} ctx             QtySectionRenderer 컨텍스트
 */
export function renderF1052QtySection(qtySection, ctx = {}) {
  const saved = { ...(ctx.existingData?.qtyTable || {}) };
  qtySection.querySelectorAll('[data-form-code="1052"][data-save-group="qtyTable"]').forEach(el => {
    if (el.id && el.value !== '') saved[el.id] = el.value;
  });

  qtySection.innerHTML = renderF1052QtySectionHTML(saved);

  if (qtySection.dataset.f1052Bound !== '1') {
    qtySection.dataset.f1052Bound = '1';
    qtySection.addEventListener('input', () => calcF1052QtySummary(qtySection));
  }
  calcF1052QtySummary(qtySection);
}
