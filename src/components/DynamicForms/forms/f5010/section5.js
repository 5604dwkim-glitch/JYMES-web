/**
 * 양식 고유 번호 #5010 (GM 9BQC / G/RUN / 후가공-RR)
 * Section 5 동적 영역 전용 렌더러
 *
 * - 5. 부자재 LOT 번호 입력 카드:
 *   · 헤더: [공란] | 초 | 중 | 종
 *   · 세로 행: 패드(5T), 패드(7T) (`data-wheel-skip="1"`, 자유 입력)
 * - 주요 치수 입력 카드는 #5010 양식에서 제외됨
 * - 모든 입력칸 ID 는 `f5010_` 접두사 + `data-save-group="dimData"` 및 명시적 `data-*` 속성만 사용
 *   (GEMINI.md 원칙 1·2·8·9·10·12·13·16)
 */

export const F5010_SUBLOT_ROWS = [
  { key: 'PAD_5T', label: '패드(5T)', legacyKey: 'DV' },
  { key: 'PAD_7T', label: '패드(7T)' }
];

export const F5010_SUBLOT_STAGES = [
  { key: '초', label: '초' },
  { key: '중', label: '중' },
  { key: '종', label: '종' }
];

const FIRST_TH_STYLE = 'border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 11.5px; vertical-align: middle;';
const STAGE_TH_STYLE = 'border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11.5px; vertical-align: middle;';
const INPUT_STYLE = 'width: 100%; min-width: 0; height: 28px; border: none; text-align: center; font-size: 11.5px; font-weight: 700; color: #000; padding: 2px 2px; background: transparent; outline: none; border-radius: 0; box-sizing: border-box;';

function escapeAttr(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderSubLotCardHTML(savedValues = {}) {
  const stageHeaders = F5010_SUBLOT_STAGES
    .map(stage => `<th scope="col" style="${STAGE_TH_STYLE}">${stage.label}</th>`)
    .join('\n                  ');

  const bodyRows = F5010_SUBLOT_ROWS.map((row, rowIdx) => {
    const topBorder = rowIdx === 0 ? '1px solid #000' : '1px dotted #000';
    const bottomBorder = rowIdx === F5010_SUBLOT_ROWS.length - 1 ? '1px solid #000' : '1px dotted #000';
    const rowThStyle = `border-left: 1px solid #000; border-right: 1px solid #000; border-top: ${topBorder}; border-bottom: ${bottomBorder}; padding: 8px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 11.5px; vertical-align: middle; white-space: nowrap;`;
    const tdStyle = `border-left: 1px solid #000; border-right: 1px solid #000; border-top: ${topBorder}; border-bottom: ${bottomBorder}; padding: 2px 3px; background: #ffffff; vertical-align: middle;`;

    const cells = F5010_SUBLOT_STAGES.map(stage => {
      const id = `f5010_sub_${row.key}_${stage.key}`;
      const legacyId = row.legacyKey ? `f5010_sub_${row.legacyKey}_${stage.key}` : undefined;
      const val = escapeAttr(savedValues[id] ?? (legacyId ? savedValues[legacyId] : undefined));
      return `<td style="${tdStyle}">
                    <input type="text" id="${id}" data-form-code="5010" data-save-group="dimData" data-wheel-skip="1" class="form-control" style="${INPUT_STYLE} height: 30px;" value="${val}" />
                  </td>`;
    }).join('\n                  ');

    return `
                <tr>
                  <th scope="row" style="${rowThStyle}">${row.label}</th>
                  ${cells}
                </tr>`;
  }).join('');

  return `
        <div class="card" data-form-code="5010" style="padding: 16px; margin-bottom: 16px;">
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
            🧪 <span class="sec-num"></span> 부자재 LOT 번호 입력
          </label>
          <div class="f5010-sublot-wrap" data-form-code="5010" style="width: 100%; overflow-x: hidden;">
            <table data-form-code="5010" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <colgroup>
                <col style="width: 22%;" />
                <col style="width: 26%;" />
                <col style="width: 26%;" />
                <col style="width: 26%;" />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col" style="${FIRST_TH_STYLE}"></th>
                  ${stageHeaders}
                </tr>
              </thead>
              <tbody>${bodyRows}
              </tbody>
            </table>
          </div>
        </div>`;
}

/**
 * @param {Object} savedValues 저장/현재 입력값 맵 (id -> value)
 * @returns {string} 부자재 LOT 번호 입력 카드 HTML
 */
export function renderF5010Section5HTML(savedValues = {}) {
  return `${renderSubLotCardHTML(savedValues)}\n      `;
}

/**
 * Section5Renderer.js 의 `formCode === 5010` 에서 위임 호출.
 * @param {HTMLElement} section5 #section5DynamicContainer
 * @param {Object} ctx           Section5Renderer 컨텍스트
 */
export function renderF5010Section5(section5, ctx = {}) {
  const saved = { ...(ctx.existingData?.dimData || {}) };
  section5.querySelectorAll('input[data-form-code="5010"]').forEach(el => {
    if (el.id) saved[el.id] = el.value;
  });

  section5.innerHTML = renderF5010Section5HTML(saved);
}
