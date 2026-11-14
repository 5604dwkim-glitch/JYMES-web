/**
 * 양식 고유 번호 #5007 (GM 9BQC / G/RUN / 후가공-D/V)
 * "4. 소재 LOT 번호 입력" 전용 렌더러
 *
 * - 상단 병합 헤더: 압출소재 LOT NO. / 기록(Record) : 년(Y).월(M).일(D)/시(h):분(m)
 * - 단계 헤더: [공란] | 초 | 중 | 종
 * - 세로 행: D/V L H / D/V R H (행 간 수평 점선 구분)
 * - 모든 입력칸 ID 는 `f5007_` 접두사 + `초물`/`중물`/`종물` 키(`ReportList` 배지 호환) 및
 *   `data-save-group="materialLots"` 사용 (GEMINI.md 원칙 2·8·10·11·12·16)
 */

export const F5007_LOT_ROWS = [
  { key: 'DV_LH', label: 'D/V L H', legacySide: 'LH' },
  { key: 'DV_RH', label: 'D/V R H', legacySide: 'RH' }
];

export const F5007_LOT_STAGES = [
  { key: '초물', label: '초' },
  { key: '중물', label: '중' },
  { key: '종물', label: '종' }
];

const STAGE_TH_STYLE = 'border: 1px solid #000; padding: 5px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11.5px; vertical-align: middle;';
const TEXTAREA_STYLE = 'width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 4px 2px; height: 34px; resize: none; overflow: hidden; line-height: 1.2; border-radius: 0; outline: none; background: transparent;';

/**
 * LotTableRenderer.js 의 `case 5007` 에서 위임 호출.
 * 현재 입력 중인 textarea 값은 DOM 에서 직접 읽어 재렌더 시에도 유지한다.
 *
 * @param {HTMLElement} lotContainer  #section4LotTableContainer
 * @param {Object} curLots            공통 렌더러가 수집한 값 맵
 * @param {Object} materialLots       저장된 일보에서 복원한 값 맵
 */
export function renderF5007LotTable(lotContainer, curLots = {}, materialLots = {}) {
  const typed = { ...curLots };
  lotContainer.querySelectorAll('textarea[data-form-code="5007"]').forEach(el => {
    if (el.id) typed[el.id] = el.value;
  });

  lotContainer.innerHTML = renderF5007LotTableHTML(typed, materialLots);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {Object} curLots      현재 화면 입력값 맵
 * @param {Object} materialLots 저장된 일보 복원값 맵
 * @returns {string} LOT 표 HTML
 */
export function renderF5007LotTableHTML(curLots = {}, materialLots = {}) {
  const stageHeaders = F5007_LOT_STAGES
    .map(stage => `<th scope="col" style="${STAGE_TH_STYLE}">${stage.label}</th>`)
    .join('\n                ');

  const bodyRows = F5007_LOT_ROWS.map((row, rowIdx) => {
    const topBorder = rowIdx === 0 ? '1px solid #000' : '1px dotted #000';
    const bottomBorder = rowIdx === F5007_LOT_ROWS.length - 1 ? '1px solid #000' : '1px dotted #000';
    const rowThStyle = `border-left: 1px solid #000; border-right: 1px solid #000; border-top: ${topBorder}; border-bottom: ${bottomBorder}; padding: 8px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 11.5px; vertical-align: middle; white-space: nowrap;`;
    const cellTdStyle = `border-left: 1px solid #000; border-right: 1px solid #000; border-top: ${topBorder}; border-bottom: ${bottomBorder}; padding: 2px; background: #ffffff; vertical-align: middle;`;

    const cells = F5007_LOT_STAGES.map(stage => {
      const id = `f5007_${row.key}_${stage.key}`;
      // 구버전(공통 기본 LOT 표) 저장 키 하위 호환 복원 (GEMINI.md 원칙 11)
      const legacyRrKey = `${row.legacySide}_RR_${stage.key}`;
      const legacyFrtKey = `${row.legacySide}_FRT_${stage.key}`;
      const val = curLots[id]
        ?? materialLots[id]
        ?? materialLots[legacyRrKey]
        ?? materialLots[legacyFrtKey]
        ?? '';
      return `<td style="${cellTdStyle}">
                  <textarea id="${id}" data-form-code="5007" data-save-group="materialLots" class="form-control lot-datetime-input" style="${TEXTAREA_STYLE}" placeholder="년월일\n시분">${escapeHtml(val)}</textarea>
                </td>`;
    }).join('\n                ');

    return `
              <tr>
                <th scope="row" style="${rowThStyle}">${row.label}</th>
                ${cells}
              </tr>`;
  }).join('');

  return `
        <div class="f5007-lot-wrap" data-form-code="5007" style="width: 100%; overflow-x: hidden;">
          <style>
            .f5007-lot-wrap[data-form-code="5007"] textarea.lot-datetime-input {
              font-size: 11px !important;
              min-width: 0;
              box-sizing: border-box;
            }
          </style>
          <table data-form-code="5007" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <colgroup>
              <col style="width: 22%;" />
              <col style="width: 26%;" />
              <col style="width: 26%;" />
              <col style="width: 26%;" />
            </colgroup>
            <thead>
              <tr>
                <th colspan="4" style="border: 1px solid #000; padding: 7px 4px; background: #ffffff; color: #000; vertical-align: middle; line-height: 1.45;">
                  <div style="font-size: 13px; font-weight: 700; margin-bottom: 2px;">압출소재 LOT NO.</div>
                  <div style="font-size: 11px; font-weight: 700;">기록(Record) : 년(Y).월(M).일(D)/시(h):분(m)</div>
                </th>
              </tr>
              <tr>
                <th style="${STAGE_TH_STYLE}"></th>
                ${stageHeaders}
              </tr>
            </thead>
            <tbody>${bodyRows}
            </tbody>
          </table>
        </div>
        `;
}
