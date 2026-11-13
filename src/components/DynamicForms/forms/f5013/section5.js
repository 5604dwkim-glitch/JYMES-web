/**
 * 양식 고유 번호 #5013 (GM 9BQC / G/RUN / 검사포장-RR)
 * — #5012 양식틀 복사본
 * Section 5 동적 영역 전용 렌더러
 *
 * - 5. 주요 치수 입력 카드:
 *   · 상단 표: 중요 치수 및 검사 현황 (RR LH)
 *   · 하단 표: 중요 치수 및 검사 현황 (RR RH)
 *   · 구성: 항 목 | 규 격 | 실측치(초물 / 중물 / 종물)
 *     - RR {LH|RH} A : 482±3
 *     - RR {LH|RH} B : 658±5
 * - 모든 입력칸 ID 는 `f5013_` 접두사 + `data-save-group="dimData"` 및 명시적 `data-*` 속성만 사용
 *   (GEMINI.md 원칙 1·2·8·9·10·12·13·16)
 */

export const F5013_DIM_SIDES = ['LH', 'RH'];

export const F5013_DIM_ITEMS = [
  { key: 'A', specText: '482±3', spec: 482, tolerance: 3, range: 30 },
  { key: 'B', specText: '658±5', spec: 658, tolerance: 5, range: 30 }
];

export const F5013_DIM_STAGES = [
  { key: '초물', label: '초물' },
  { key: '중물', label: '중물' },
  { key: '종물', label: '종물' }
];

const INPUT_STYLE = 'width: 100%; min-width: 0; height: 28px; border: none; text-align: center; font-size: 11.5px; font-weight: 700; color: #000; padding: 2px 2px; background: transparent; outline: none; border-radius: 0; box-sizing: border-box;';

function escapeAttr(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderDimTableBySideHTML(side, savedValues = {}, isLast = false) {
  const stageHeaders = F5013_DIM_STAGES
    .map(stage => `<th scope="col" style="border: 1px solid #000; padding: 5px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">${stage.label}</th>`)
    .join('\n                  ');

  const dimRows = F5013_DIM_ITEMS.map((item, idx) => {
    const topBorder = idx === 0 ? '1px solid #000' : '1px dotted #000';
    const bottomBorder = idx === F5013_DIM_ITEMS.length - 1 ? '1px solid #000' : '1px dotted #000';
    const rowCellBase = `border-left: 1px solid #000; border-right: 1px solid #000; border-top: ${topBorder}; border-bottom: ${bottomBorder}; background: #ffffff; vertical-align: middle;`;
    const itemLabel = `RR ${side} ${item.key}`;

    const stageCells = F5013_DIM_STAGES.map(stage => {
      const id = `f5013_dim_RR_${side}_${item.key}_${stage.key}`;
      const legacyFrtId = `f5013_dim_FRT_${side}_${item.key}_${stage.key}`;
      const val = escapeAttr(savedValues[id] ?? savedValues[legacyFrtId]);
      const wheelTitle = `${itemLabel} (${stage.label})`;
      return `<td style="${rowCellBase} padding: 2px;">
                    <input type="text" id="${id}" data-form-code="5013" data-save-group="dimData" data-f5013-dim="1" data-wheel-parsed-spec="${item.spec}" data-wheel-tolerance="${item.tolerance}" data-wheel-unit="mm" data-wheel-range="${item.range}" data-wheel-title="${wheelTitle}" class="form-control" style="${INPUT_STYLE}" value="${val}" />
                  </td>`;
    }).join('\n                  ');

    return `
                <tr>
                  <th scope="row" style="${rowCellBase} padding: 7px 4px; font-weight: 700; color: #000; font-size: 11px; white-space: nowrap;">${itemLabel}</th>
                  <td style="${rowCellBase} padding: 7px 4px; font-weight: 700; color: #000; font-size: 11px; white-space: nowrap;">${item.specText}</td>
                  ${stageCells}
                </tr>`;
  }).join('');

  const mbStyle = isLast ? '' : ' margin-bottom: 14px;';

  return `
            <table data-form-code="5013" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;${mbStyle}">
              <colgroup>
                <col style="width: 22%;" />
                <col style="width: 24%;" />
                <col style="width: 18%;" />
                <col style="width: 18%;" />
                <col style="width: 18%;" />
              </colgroup>
              <thead>
                <tr>
                  <th colspan="5" style="border: 1px solid #000; padding: 7px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12.5px; vertical-align: middle;">중요 치수 및 검사 현황 (RR ${side})</th>
                </tr>
                <tr>
                  <th rowspan="2" scope="col" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 11.5px; vertical-align: middle;">항 목</th>
                  <th rowspan="2" scope="col" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 11.5px; vertical-align: middle;">규 격</th>
                  <th colspan="3" scope="colgroup" style="border: 1px solid #000; padding: 5px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 11.5px; vertical-align: middle;">실측치</th>
                </tr>
                <tr>
                  ${stageHeaders}
                </tr>
              </thead>
              <tbody>${dimRows}
              </tbody>
            </table>`;
}

function renderDimCardHTML(savedValues = {}) {
  const tablesHTML = F5013_DIM_SIDES
    .map((side, idx) => renderDimTableBySideHTML(side, savedValues, idx === F5013_DIM_SIDES.length - 1))
    .join('\n');

  return `
        <div class="card" data-form-code="5013" style="padding: 16px; margin-bottom: 16px;">
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
            📐 <span class="sec-num"></span> 주요 치수 입력
          </label>
          <div class="f5013-dim-wrap" data-form-code="5013" style="width: 100%; overflow-x: hidden;">${tablesHTML}
          </div>
        </div>`;
}

/**
 * @param {Object} savedValues 저장/현재 입력값 맵 (id -> value)
 * @returns {string} 주요 치수 입력 카드 HTML
 */
export function renderF5013Section5HTML(savedValues = {}) {
  return `${renderDimCardHTML(savedValues)}\n      `;
}

/**
 * Section5Renderer.js 의 `formCode === 5013` 에서 위임 호출.
 * @param {HTMLElement} section5 #section5DynamicContainer
 * @param {Object} ctx           Section5Renderer 컨텍스트
 */
export function renderF5013Section5(section5, ctx = {}) {
  const saved = { ...(ctx.existingData?.dimData || {}) };
  section5.querySelectorAll('input[data-form-code="5013"]').forEach(el => {
    if (el.id) saved[el.id] = el.value;
  });

  section5.innerHTML = renderF5013Section5HTML(saved);

  if (ctx.bindNumberWheelPicker) {
    section5.querySelectorAll('input[data-form-code="5013"][data-f5013-dim="1"]').forEach(input => {
      const spec = parseFloat(input.dataset.wheelParsedSpec) || 0;
      const range = parseFloat(input.dataset.wheelRange) || 30;
      const unit = input.dataset.wheelUnit ?? 'mm';
      const tolerance = input.dataset.wheelTolerance !== undefined
        ? parseFloat(input.dataset.wheelTolerance)
        : null;
      const title = input.dataset.wheelTitle || '주요 치수 입력';
      ctx.bindNumberWheelPicker(input, title, spec, range, unit, tolerance);
    });
  }
}
