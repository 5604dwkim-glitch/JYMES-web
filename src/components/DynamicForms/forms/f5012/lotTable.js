/**
 * 양식 고유 번호 #5012 (GM 9BQC / G/RUN / 검사포장-RR R부)
 * — #5014 양식틀 복사본
 * "4. 소재 LOT 번호 입력" 전용 렌더러
 *
 * - 상단 헤더 1행: [공란] | 초 | 중 | 종
 * - 세로 행(4행, 백색 배경):
 *   · RR LH A (하단 점선)
 *   · RR RH A (상단 점선 / 하단 실선)
 *   · RR LH B (상단 실선 / 하단 점선)
 *   · RR RH B (상단 점선 / 하단 실선)
 * - 모든 입력칸 ID 는 `f5012_` 접두사 + `초물`/`중물`/`종물` 키(`ReportList` 배지 호환) 및
 *   `data-save-group="materialLots"` 사용 (GEMINI.md 원칙 2·8·9·10·11·12·16)
 */

export const F5012_LOT_ROWS = [
  { key: 'RR_LH_A', label: 'RR LH A', topSolid: true, bottomSolid: false, legacyFrtKey: 'LH_A', legacySide: 'LH' },
  { key: 'RR_RH_A', label: 'RR RH A', topSolid: false, bottomSolid: true, legacyFrtKey: 'RH_A', legacySide: 'RH' },
  { key: 'RR_LH_B', label: 'RR LH B', topSolid: true, bottomSolid: false, legacyFrtKey: 'LH_B' },
  { key: 'RR_RH_B', label: 'RR RH B', topSolid: false, bottomSolid: true, legacyFrtKey: 'RH_B' }
];

export const F5012_LOT_STAGES = [
  { key: '초물', label: '초' },
  { key: '중물', label: '중' },
  { key: '종물', label: '종' }
];

const STAGE_TH_STYLE = 'border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11.5px; vertical-align: middle;';
const TEXTAREA_STYLE = 'width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 4px 2px; height: 34px; resize: none; overflow: hidden; line-height: 1.2; border-radius: 0; outline: none; background: transparent;';

function escapeHtml(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * LotTableRenderer.js 의 `case 5012` 에서 위임 호출.
 * 현재 입력 중인 textarea 값은 DOM 에서 직접 읽어 재렌더 시에도 유지한다.
 *
 * @param {HTMLElement} lotContainer  #section4LotTableContainer
 * @param {Object} curLots            공통 렌더러가 수집한 값 맵
 * @param {Object} materialLots       저장된 일보에서 복원한 값 맵
 */
export function renderF5012LotTable(lotContainer, curLots = {}, materialLots = {}) {
  const typed = { ...curLots };
  lotContainer.querySelectorAll('textarea[data-form-code="5012"]').forEach(el => {
    if (el.id) typed[el.id] = el.value;
  });

  lotContainer.innerHTML = renderF5012LotTableHTML(typed, materialLots);
}

/**
 * @param {Object} curLots      현재 화면 입력값 맵
 * @param {Object} materialLots 저장된 일보 복원값 맵
 * @returns {string} LOT 표 HTML
 */
export function renderF5012LotTableHTML(curLots = {}, materialLots = {}) {
  const stageHeaders = F5012_LOT_STAGES
    .map(stage => `<th scope="col" style="${STAGE_TH_STYLE}">${stage.label}</th>`)
    .join('\n                ');

  const bodyRows = F5012_LOT_ROWS.map(row => {
    const topBorder = row.topSolid ? '1px solid #000' : '1px dotted #000';
    const bottomBorder = row.bottomSolid ? '1px solid #000' : '1px dotted #000';
    const rowThStyle = `border-left: 1px solid #000; border-right: 1px solid #000; border-top: ${topBorder}; border-bottom: ${bottomBorder}; padding: 8px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 11.5px; vertical-align: middle; white-space: nowrap;`;
    const cellTdStyle = `border-left: 1px solid #000; border-right: 1px solid #000; border-top: ${topBorder}; border-bottom: ${bottomBorder}; padding: 2px; background: #ffffff; vertical-align: middle;`;

    const cells = F5012_LOT_STAGES.map(stage => {
      const id = `f5012_${row.key}_${stage.key}`;
      // 하위 호환 키 복원 (GEMINI.md 원칙 11)
      const prevFrtId = row.legacyFrtKey ? `f5012_FRT_${row.legacyFrtKey}_${stage.key}` : undefined;
      const legacyRrKey = row.legacySide ? `${row.legacySide}_RR_${stage.key}` : undefined;
      const legacyFrtKey = row.legacySide ? `${row.legacySide}_FRT_${stage.key}` : undefined;
      const val = curLots[id]
        ?? materialLots[id]
        ?? (prevFrtId ? materialLots[prevFrtId] : undefined)
        ?? (legacyRrKey ? materialLots[legacyRrKey] : undefined)
        ?? (legacyFrtKey ? materialLots[legacyFrtKey] : undefined)
        ?? '';
      return `<td style="${cellTdStyle}">
                  <textarea id="${id}" data-form-code="5012" data-save-group="materialLots" class="form-control lot-datetime-input" style="${TEXTAREA_STYLE}" placeholder="년월일\n시분">${escapeHtml(val)}</textarea>
                </td>`;
    }).join('\n                ');

    return `
              <tr>
                <th scope="row" style="${rowThStyle}">${row.label}</th>
                ${cells}
              </tr>`;
  }).join('');

  return `
        <div class="f5012-lot-wrap" data-form-code="5012" style="width: 100%; overflow-x: hidden;">
          <style>
            .f5012-lot-wrap[data-form-code="5012"] textarea.lot-datetime-input {
              font-size: 11px !important;
              min-width: 0;
              box-sizing: border-box;
            }
          </style>
          <table data-form-code="5012" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <colgroup>
              <col style="width: 22%;" />
              <col style="width: 26%;" />
              <col style="width: 26%;" />
              <col style="width: 26%;" />
            </colgroup>
            <thead>
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
