/**
 * #4021 (LQ2a_HOOD SIDE_소재준비) 전용 Section 4 (소재 LOT 번호) 템플릿
 * - 기존 #4001 복사본의 PTG 단일 열을 LH / RH 두 열로 분리 (초물 · 중물 · 종물)
 * - 저장 키: f4021_{lh|rh}_{초물|중물|종물} (data-save-group="materialLots", data-form-code="4021")
 * - 레거시 저장 키(LH_초물, RH_초물, LH_FRT_초물, RH_FRT_초물, FRT_초물) 읽기 폴백 지원
 */

const F4021_LOT_COLS = [
  { key: 'lh', label: 'LH', legacyKeys: (stage) => [`LH_${stage}`, `LH_FRT_${stage}`, `FRT_${stage}`] },
  { key: 'rh', label: 'RH', legacyKeys: (stage) => [`RH_${stage}`, `RH_FRT_${stage}`] },
];

const F4021_LOT_STAGES = ['초물', '중물', '종물'];

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
  const fieldId = `f4021_${col.key}_${stage}`;
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

export function renderF4021LotTableHTML(curLots = {}, materialLots = {}) {
  const headerCols = F4021_LOT_COLS.map(
    (col) =>
      `<th style="border: 1px solid #000; padding: 6px 4px; width: 39%; font-weight: 700; color: #000;">${col.label}</th>`
  ).join('');

  const rowsHtml = F4021_LOT_STAGES.map((stage) => {
    const cellsHtml = F4021_LOT_COLS.map((col) => {
      const fieldId = `f4021_${col.key}_${stage}`;
      const val = escapeHtml(resolveLotValue(col, stage, curLots, materialLots));
      return `
        <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
          <textarea id="${fieldId}" name="${fieldId}" data-form-code="4021" data-save-group="materialLots" class="form-control lot-datetime-input" style="${TEXTAREA_STYLE}" placeholder="년월일&#10;시분">${val}</textarea>
        </td>`;
    }).join('');

    return `
      <tr>
        <td style="border: 1px solid #000; padding: 6px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">
          ${stage}
        </td>
        ${cellsHtml}
      </tr>`;
  }).join('');

  return `
    <div data-form-code="4021">
      <table style="width: 100%; border-collapse: collapse; text-align: center; font-size: 11px; border: 1px solid #000;">
        <thead>
          <tr style="background: #fffde7;">
            <th style="border: 1px solid #000; padding: 6px 4px; width: 22%; font-weight: 700; color: #000;">구 분(Division)</th>
            ${headerCols}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  `;
}

export function renderF4021LotTable(lotContainer, curLots = {}, materialLots = {}) {
  const mergedLots = { ...curLots };
  lotContainer.querySelectorAll('textarea[data-form-code="4021"]').forEach((textarea) => {
    if (textarea.id) {
      mergedLots[textarea.id] = textarea.value;
    }
  });
  lotContainer.innerHTML = renderF4021LotTableHTML(mergedLots, materialLots);
}
