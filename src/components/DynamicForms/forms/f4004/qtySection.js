/**
 * 양식 고유 번호 #4004 (기아 OV1K / PTG / 검사포장)
 * "6. 생산실적 및 불량 현황" 전용 렌더러
 *
 * - 구분(Division): LH / RH 2열 구성 (`FL`, `FR`)
 * - 생산량(Q,TY): 계획(기본 300) / 실적
 * - 검사항목(inspection category):
 *   조인트불량(joint N.G), 사상불량(trimming N.G), 외면흠(external blemish),
 *   클립 누락_소재(Missing Clip_Mat.), 클립 누락_성형(Missing Clip_Mold),
 *   길이불량(Bad length), 코팅불량(Coating N.G), 기타(etc)
 * - 불량합계(Total): LH / RH 열별 자동 합산
 * - 모든 입력칸 ID 는 `f4004_` 접두사 + `data-save-group="qtyTable"` 및 명시적 `data-*` 속성만 사용
 *   (GEMINI.md 원칙 1·2·8·10·11·12·13·16)
 */

export const F4004_QTY_COLS = [
  { key: 'FL', label: 'LH', defaultPlan: 300 },
  { key: 'FR', label: 'RH', defaultPlan: 300 }
];

export const F4004_DEFECTS = [
  { key: 'joint', label: '조인트불량<br>(joint N.G)' },
  { key: 'trim', label: '사상불량<br>(trimming N.G)' },
  { key: 'blemish', label: '외면흠<br>(external blemish)', legacyPrefix: 'ext_scratch_' },
  { key: 'clip_mat', label: '클립 누락_소재<br>(Missing Clip_Mat.)' },
  { key: 'clip_mold', label: '클립 누락_성형<br>(Missing Clip_Mold)' },
  { key: 'len', label: '길이불량<br>(Bad length)', legacyPrefix: 'proc_len_' },
  { key: 'coating', label: '코팅불량<br>(Coating N.G)' },
  { key: 'etc', label: '기타(etc)', legacyPrefix: 'proc_oth_' }
];

const INPUT_STYLE = 'width: 100%; border: none; text-align: center; font-size: 10px; padding: 2px 0px; background: transparent; outline: none; box-sizing: border-box;';

function escapeAttr(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getSavedValue(existingData, savedValues, newId, legacyKeys = []) {
  if (savedValues[newId] !== undefined) return savedValues[newId];
  const qtyTable = existingData?.qtyTable || {};
  if (qtyTable[newId] !== undefined) return qtyTable[newId];
  for (const lk of legacyKeys) {
    if (savedValues[lk] !== undefined) return savedValues[lk];
    if (qtyTable[lk] !== undefined) return qtyTable[lk];
    if (existingData && existingData[lk] !== undefined) return existingData[lk];
  }
  return undefined;
}

export function computeF4004Totals(existingData, savedValues = {}) {
  let totalPlan = 0;
  let totalActual = 0;
  let totalDefect = 0;
  const colDefectSums = {};

  F4004_QTY_COLS.forEach(col => {
    const planRaw = getSavedValue(existingData, savedValues, `f4004_plan_${col.key}`, [
      `qty_plan_${col.key}`,
      `plan_${col.key}`
    ]);
    const actRaw = getSavedValue(existingData, savedValues, `f4004_act_${col.key}`, [
      `qty_act_${col.key}`,
      `act_${col.key}`
    ]);
    totalPlan += Number(planRaw !== undefined ? planRaw : col.defaultPlan) || 0;
    totalActual += Number(actRaw) || 0;

    let sum = 0;
    F4004_DEFECTS.forEach(def => {
      const id = `f4004_def_${def.key}_${col.key}`;
      const legacy = def.legacyPrefix ? [`${def.legacyPrefix}${col.key}`] : [];
      const raw = getSavedValue(existingData, savedValues, id, legacy);
      sum += Number(raw) || 0;
    });
    colDefectSums[col.key] = sum;
    totalDefect += sum;
  });

  return { totalPlan, totalActual, totalDefect, colDefectSums };
}

/**
 * @param {Object | null} existingData
 * @param {Object} savedValues DOM에서 수집된 현재 값 맵 (재렌더 보존용)
 */
export function renderF4004QtySectionHTML(existingData = null, savedValues = {}) {
  const { totalPlan, totalActual, totalDefect, colDefectSums } = computeF4004Totals(existingData, savedValues);

  const colHeaders = F4004_QTY_COLS
    .map(col => `<th scope="col" style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 35%; background: #e8eef5;">${col.label}</th>`)
    .join('\n                ');

  const planCells = F4004_QTY_COLS.map(col => {
    const id = `f4004_plan_${col.key}`;
    const raw = getSavedValue(existingData, savedValues, id, [`qty_plan_${col.key}`, `plan_${col.key}`]);
    const val = raw !== undefined && raw !== '' ? raw : col.defaultPlan;
    return `<td style="border: 1px solid #000; padding: 2px; background: #ffffff;"><input type="number" id="${id}" data-form-code="4004" data-save-group="qtyTable" data-qty-role="plan" data-col="${col.key}" class="form-control" style="${INPUT_STYLE}" value="${escapeAttr(val)}" placeholder="0" /></td>`;
  }).join('\n                ');

  const actCells = F4004_QTY_COLS.map(col => {
    const id = `f4004_act_${col.key}`;
    const raw = getSavedValue(existingData, savedValues, id, [`qty_act_${col.key}`, `act_${col.key}`]) ?? '';
    return `<td style="border: 1px solid #000; padding: 2px; background: #ffffff;"><input type="number" id="${id}" data-form-code="4004" data-save-group="qtyTable" data-qty-role="actual" data-col="${col.key}" class="form-control" style="${INPUT_STYLE}" value="${escapeAttr(raw)}" placeholder="0" /></td>`;
  }).join('\n                ');

  const defectRowsHtml = F4004_DEFECTS.map((def, idx) => {
    const groupCell = idx === 0
      ? `\n                <td rowspan="${F4004_DEFECTS.length}" style="border: 1px solid #000; padding: 6px 4px; background: #f1f5f9; font-weight: 700; color: #000; vertical-align: middle; line-height: 1.35;">\n                  검사항목<br>(inspection<br>category)\n                </td>`
      : '';

    const inputCells = F4004_QTY_COLS.map(col => {
      const id = `f4004_def_${def.key}_${col.key}`;
      const legacy = def.legacyPrefix ? [`${def.legacyPrefix}${col.key}`] : [];
      const raw = getSavedValue(existingData, savedValues, id, legacy) ?? '';
      return `<td style="border: 1px solid #000; padding: 2px; background: #ffffff;"><input type="number" id="${id}" data-form-code="4004" data-save-group="qtyTable" data-qty-role="defect" data-col="${col.key}" class="form-control" style="${INPUT_STYLE}" value="${escapeAttr(raw)}" placeholder="0" /></td>`;
    }).join('\n                ');

    return `
              <tr>${groupCell}
                <td style="border: 1px solid #000; padding: 5px 4px; background: #f8fafc; font-weight: 700; color: #000; line-height: 1.25;">
                  ${def.label}
                </td>
                ${inputCells}
              </tr>`;
  }).join('');

  const sumCells = F4004_QTY_COLS.map(col =>
    `<td id="f4004_def_sum_${col.key}" data-form-code="4004" data-qty-role="defect-sum" data-col="${col.key}" style="border: 1px solid #000; padding: 6px; background: #f1f5f9; color: var(--accent-rose); font-weight: 700;">${colDefectSums[col.key] ?? 0}</td>`
  ).join('\n                ');

  return `
      <div class="card f4004-qty-card" data-form-code="4004" style="padding: 16px; margin-bottom: 16px;">
        <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 8px; display: block;">
          📊 <span class="sec-num"></span> 생산실적 및 불량 현황
        </label>

        <input type="hidden" id="targetQty" value="${totalPlan}" />
        <input type="hidden" id="actualQty" value="${totalActual}" />
        <input type="hidden" id="defectQty" value="${totalDefect}" />

        <div style="overflow-x: auto;">
          <table id="f4004QtyTable" data-form-code="4004" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #e8eef5; font-weight: 700;">
                <th colspan="2" style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 30%; background: #e8eef5;">
                  구 분(Division)
                </th>
                ${colHeaders}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td rowspan="2" style="border: 1px solid #000; padding: 6px; background: #f1f5f9; font-weight: 700; color: #000; vertical-align: middle; width: 14%;">
                  생산량(Q,TY)
                </td>
                <td style="border: 1px solid #000; padding: 6px; background: #f8fafc; font-weight: 700; color: #000; width: 16%;">
                  계획
                </td>
                ${planCells}
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #f8fafc; font-weight: 700; color: #000;">
                  실적
                </td>
                ${actCells}
              </tr>
              ${defectRowsHtml}
              <tr style="background: #f1f5f9; font-weight: 700;">
                <td colspan="2" style="border: 1px solid #000; padding: 8px; background: #f1f5f9; color: var(--accent-rose);">
                  불량합계(Total)
                </td>
                ${sumCells}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
}

export function calcF4004QtySummary(qtySection, container = null) {
  if (!qtySection) return;
  const currentValues = {};
  qtySection.querySelectorAll('[data-form-code="4004"][data-save-group="qtyTable"]').forEach(el => {
    if (el.id) currentValues[el.id] = el.value;
  });

  const { totalPlan, totalActual, totalDefect, colDefectSums } = computeF4004Totals(null, currentValues);

  F4004_QTY_COLS.forEach(col => {
    const sumCell = qtySection.querySelector(`#f4004_def_sum_${col.key}`);
    if (sumCell) sumCell.textContent = String(colDefectSums[col.key] ?? 0);
  });

  const roots = [qtySection, container].filter(Boolean);
  roots.forEach(root => {
    const targetInput = root.querySelector('#targetQty');
    const actualInput = root.querySelector('#actualQty');
    const defectInput = root.querySelector('#defectQty');
    if (targetInput) targetInput.value = String(totalPlan);
    if (actualInput) actualInput.value = String(totalActual);
    if (defectInput) defectInput.value = String(totalDefect);
  });
}

export function renderF4004QtySection(qtySection, ctx = {}) {
  const saved = {};
  qtySection.querySelectorAll('[data-form-code="4004"][data-save-group="qtyTable"]').forEach(el => {
    if (el.id && el.value !== '') saved[el.id] = el.value;
  });

  qtySection.innerHTML = renderF4004QtySectionHTML(ctx.existingData || null, saved);

  if (qtySection.dataset.f4004Bound !== '1') {
    qtySection.dataset.f4004Bound = '1';
    qtySection.addEventListener('input', () => calcF4004QtySummary(qtySection, ctx.container));
  }
  calcF4004QtySummary(qtySection, ctx.container);
}
