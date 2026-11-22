/**
 * #4022 (LQ2a_HOOD SIDE_조인트) 전용 Section 4 (소재 LOT 번호 입력) 템플릿
 * - 기존 #4002 복사본의 구분 상단 헤더 `PTG` -> `Hood Side`로 변경 (하위 LH / RH, 초물·중물·종물 유지)
 * - 저장 키: f4022_{lh|rh}_{초물|중물|종물} (data-save-group="materialLots", data-form-code="4022")
 * - 레거시 저장 키(LH_FRT_{초물|중물|종물}, RH_FRT_{초물|중물|종물}) 읽기 폴백 지원
 */

const F4022_GROUP_LABEL = 'Hood Side';

const F4022_LOT_COLS = [
  { key: 'lh', label: 'LH', legacyKeys: (stage) => [`LH_FRT_${stage}`, `LH_${stage}`] },
  { key: 'rh', label: 'RH', legacyKeys: (stage) => [`RH_FRT_${stage}`, `RH_${stage}`] },
];

const F4022_LOT_STAGES = ['초물', '중물', '종물'];

const TEXTAREA_STYLE =
  'width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 4px 2px; height: 34px; resize: none; overflow: hidden; line-height: 1.2; border-radius: 0; outline: none; background: transparent;';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resolveLotValue(col, stage, curLots, materialLots) {
  const fieldId = `f4022_${col.key}_${stage}`;
  if (curLots[fieldId] !== undefined && curLots[fieldId] !== '') {
    return curLots[fieldId];
  }
  if (materialLots[fieldId] !== undefined && materialLots[fieldId] !== '') {
    return materialLots[fieldId];
  }
  for (const legacyKey of col.legacyKeys(stage)) {
    if (materialLots[legacyKey] !== undefined && materialLots[legacyKey] !== '') {
      return materialLots[legacyKey];
    }
  }
  return '';
}

export function renderF4022LotTableHTML(curLots = {}, materialLots = {}) {
  const subHeaderCols = F4022_LOT_COLS.map(
    (col) =>
      `<th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 39%;">${col.label}</th>`
  ).join('');

  const rowsHtml = F4022_LOT_STAGES.map((stage) => {
    const cellsHtml = F4022_LOT_COLS.map((col) => {
      const fieldId = `f4022_${col.key}_${stage}`;
      const val = escapeHtml(resolveLotValue(col, stage, curLots, materialLots));
      return `
        <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
          <textarea id="${fieldId}" name="${fieldId}" data-form-code="4022" data-save-group="materialLots" class="form-control lot-datetime-input" style="${TEXTAREA_STYLE}" placeholder="년월일&#10;시분">${val}</textarea>
        </td>`;
    }).join('');

    return `
      <tr>
        <td style="border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">${stage}</td>
        ${cellsHtml}
      </tr>`;
  }).join('');

  return `
    <div data-form-code="4022">
      <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
        <thead>
          <tr style="background: #fffde7; font-weight: 700;">
            <th rowspan="2" style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 22%; vertical-align: middle; background: #fffde7;">
              구 분(Division)
            </th>
            <th colspan="${F4022_LOT_COLS.length}" style="border: 1px solid #000; padding: 8px 4px; font-size: 13px; color: #000; width: 78%;">${F4022_GROUP_LABEL}</th>
          </tr>
          <tr style="background: #fffde7;">
            ${subHeaderCols}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;
}

export function renderF4022LotTable(lotContainer, curLots = {}, materialLots = {}) {
  const mergedLots = { ...curLots };
  lotContainer.querySelectorAll('textarea[data-form-code="4022"]').forEach((textarea) => {
    if (textarea.id) {
      mergedLots[textarea.id] = textarea.value;
    }
  });
  lotContainer.innerHTML = renderF4022LotTableHTML(mergedLots, materialLots);
}
