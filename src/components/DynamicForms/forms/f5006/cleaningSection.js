/**
 * 양식 고유 번호 #5006 (GM 9BQC / G/RUN / 조인트-RR Fixed)
 * "금형 청소(Cleaning Mold) 시간 기록" 전용 카드 (생산실적 및 불량 현황 바로 아래)
 *
 * - 구성: 금형 청소(Cleaning Mold) 시간 기록[rowspan=2] | 시업전(S) / 시업중(H) / 시업후(F) 시간 입력 (HH:MM)
 * - 모든 입력칸 ID/저장 키는 `f5006_clean_` 접두사 + `data-save-group="qtyTable"` 사용
 *   (GEMINI.md 원칙 1·2·8·10·11·12·13)
 */

export const F5006_CLEAN_FIELDS = [
  { key: 'before', label: '시업전(S)', title: '금형 청소 시간 - 시업전(S)' },
  { key: 'during', label: '시업중(H)', title: '금형 청소 시간 - 시업중(H)' },
  { key: 'after', label: '시업후(F)', title: '금형 청소 시간 - 시업후(F)' }
];

const TH_STYLE = 'border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 10.5px; line-height: 1.25; letter-spacing: -0.3px; vertical-align: middle;';
const TIME_INPUT_STYLE = 'width: 100%; min-width: 0; height: 28px; border: none; text-align: center; font-size: 12px; font-weight: 700; color: #000; padding: 1px 0; background: transparent; outline: none; border-radius: 0; cursor: pointer; box-sizing: border-box;';

function escapeAttr(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * @param {Object} savedValues 저장/현재 입력값 맵 (id -> value)
 * @returns {string} 카드 전체 HTML
 */
export function renderF5006CleaningCardHTML(savedValues = {}) {
  const headerCells = F5006_CLEAN_FIELDS
    .map(f => `<th style="${TH_STYLE}">${f.label}</th>`)
    .join('\n                  ');

  const inputCells = F5006_CLEAN_FIELDS.map(f => {
    const id = `f5006_clean_${f.key}`;
    const val = escapeAttr(savedValues[id]);
    return `<td style="border: 1px solid #000; padding: 0; background: #ffffff; vertical-align: middle;">
                    <input type="text" id="${id}" data-form-code="5006" data-save-group="qtyTable" data-f5006-clean-time="1" data-time-title="${f.title}" class="form-control" style="${TIME_INPUT_STYLE}" value="${val}" placeholder=":" readonly />
                  </td>`;
  }).join('\n                  ');

  return `
        <div class="card f5006-clean-card" data-form-code="5006" style="padding: 12px 6px; margin-bottom: 16px;">
          <style>
            .f5006-clean-card[data-form-code="5006"] input[type="text"] {
              min-width: 0;
              font-size: 12px !important;
              box-sizing: border-box;
            }
          </style>
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; padding: 0 4px; display: block;">
            🧹 <span class="sec-num"></span> 금형 청소 시간 기록
          </label>
          <div style="width: 100%; overflow-x: hidden;">
            <table data-form-code="5006" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <colgroup>
                <col style="width: 31%;" />
                <col style="width: 23%;" />
                <col style="width: 23%;" />
                <col style="width: 23%;" />
              </colgroup>
              <tbody>
                <tr>
                  <th scope="rowgroup" rowspan="2" style="${TH_STYLE} font-size: 10.5px;">금형 청소<br>(Cleaning<br>Mold)시간 기록</th>
                  ${headerCells}
                </tr>
                <tr>
                  ${inputCells}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
}

/**
 * 카드 내부 시간 입력칸에만 스코프 바인딩한다. (GEMINI.md 원칙 13)
 * @param {HTMLElement} qtySection #qtySection (innerHTML 교체 직후이므로 중복 바인딩 없음)
 * @param {Object} ctx             QtySectionRenderer 컨텍스트 (bindTimeWheelPicker 제공)
 */
export function bindF5006CleaningEvents(qtySection, ctx = {}) {
  if (!qtySection || !ctx.bindTimeWheelPicker) return;
  qtySection
    .querySelectorAll('input[data-form-code="5006"][data-f5006-clean-time="1"]')
    .forEach(input => {
      if (input.dataset.timeBound === '1') return;
      input.dataset.timeBound = '1';
      ctx.bindTimeWheelPicker(input, input.dataset.timeTitle || '금형 청소 시간 선택');
    });
}
