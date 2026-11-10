/**
 * 양식 고유 번호 #5014 (GM 9BQC / G/RUN / 검사포장-길이)
 * — #5011 양식틀 복사본
 * Section 5 동적 영역 전용 렌더러
 *
 * - 5. 부자재 LOT 번호 입력 카드:
 *   · 헤더: 부자재 LOT NO.(초/중/종) | 초 | 중 | 종
 *   · 세로 행: 패드(5T) / 패드(7T) (`data-wheel-skip="1"`, 자유 입력)
 * - 6. 주요 치수 입력 카드:
 *   · 상단 표: 중요 치수 및 검사 현황 (FRT LH)
 *   · 하단 표: 중요 치수 및 검사 현황 (FRT RH)
 *   · 구성: 항 목 | 규 격 | 실측치(초물 / 중물 / 종물)
 *     - FRT {LH|RH} A : 881±3
 *     - FRT {LH|RH} B : 608±5
 *     - FRT {LH|RH} C : 582±5
 *     - 패드 규격     : 5T*5W*60L (실측치 3열 병합 `colspan="3"`, 자유 입력 `data-wheel-skip="1"`)
 * - 모든 입력칸 ID 는 `f5014_` 접두사 + `data-save-group="dimData"` 및 명시적 `data-*` 속성만 사용
 *   (GEMINI.md 원칙 1·2·8·9·10·12·13·16)
 */

export const F5014_SUBLOT_ROWS = [
  { key: 'PAD_5T', label: '패드(5T)' },
  { key: 'PAD_7T', label: '패드(7T)' }
];

export const F5014_SUBLOT_STAGES = [
  { key: '초', label: '초' },
  { key: '중', label: '중' },
  { key: '종', label: '종' }
];

export const F5014_DIM_SIDES = ['LH', 'RH'];

export const F5014_DIM_ITEMS = [
  { key: 'A', specText: '881±3', spec: 881, tolerance: 3, range: 30 },
  { key: 'B', specText: '608±5', spec: 608, tolerance: 5, range: 30 },
  { key: 'C', specText: '582±5', spec: 582, tolerance: 5, range: 30 }
];

export const F5014_DIM_STAGES = [
  { key: '초물', label: '초물' },
  { key: '중물', label: '중물' },
  { key: '종물', label: '종물' }
];

const FIRST_TH_STYLE = 'border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 10.5px; line-height: 1.25; word-break: keep-all; vertical-align: middle;';
const STAGE_TH_STYLE = 'border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11.5px; vertical-align: middle;';
const ROW_TH_STYLE = 'border: 1px solid #000; padding: 8px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 11.5px; vertical-align: middle; white-space: nowrap;';
const TD_STYLE = 'border: 1px solid #000; padding: 2px 3px; background: #ffffff; vertical-align: middle;';
const INPUT_STYLE = 'width: 100%; min-width: 0; height: 28px; border: none; text-align: center; font-size: 11.5px; font-weight: 700; color: #000; padding: 2px 2px; background: transparent; outline: none; border-radius: 0; box-sizing: border-box;';

function escapeAttr(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderSubLotCardHTML(savedValues = {}) {
  const stageHeaders = F5014_SUBLOT_STAGES
    .map(stage => `<th scope="col" style="${STAGE_TH_STYLE}">${stage.label}</th>`)
    .join('\n                  ');

  const bodyRows = F5014_SUBLOT_ROWS.map(row => {
    const cells = F5014_SUBLOT_STAGES.map(stage => {
      const id = `f5014_sub_${row.key}_${stage.key}`;
      const val = escapeAttr(savedValues[id]);
      return `<td style="${TD_STYLE}">
                    <input type="text" id="${id}" data-form-code="5014" data-save-group="dimData" data-wheel-skip="1" class="form-control" style="${INPUT_STYLE} height: 30px;" value="${val}" />
                  </td>`;
    }).join('\n                  ');

    return `
                <tr>
                  <th scope="row" style="${ROW_TH_STYLE}">${row.label}</th>
                  ${cells}
                </tr>`;
  }).join('');

  return `
        <div class="card" data-form-code="5014" style="padding: 16px; margin-bottom: 16px;">
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
            🧪 <span class="sec-num"></span> 부자재 LOT 번호 입력
          </label>
          <div class="f5014-sublot-wrap" data-form-code="5014" style="width: 100%; overflow-x: hidden;">
            <table data-form-code="5014" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <colgroup>
                <col style="width: 28%;" />
                <col style="width: 24%;" />
                <col style="width: 24%;" />
                <col style="width: 24%;" />
              </colgroup>
              <thead>
                <tr>
                  <th scope="col" style="${FIRST_TH_STYLE}">부자재 LOT NO.(초/중/종)</th>
                  ${stageHeaders}
                </tr>
              </thead>
              <tbody>${bodyRows}
              </tbody>
            </table>
          </div>
        </div>`;
}

function renderDimTableBySideHTML(side, savedValues = {}, isLast = false) {
  const stageHeaders = F5014_DIM_STAGES
    .map(stage => `<th scope="col" style="border: 1px solid #000; padding: 5px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">${stage.label}</th>`)
    .join('\n                  ');

  const dimRows = F5014_DIM_ITEMS.map((item, idx) => {
    const topBorder = idx === 0 ? '1px solid #000' : '1px dotted #000';
    const bottomBorder = '1px dotted #000';
    const rowCellBase = `border-left: 1px solid #000; border-right: 1px solid #000; border-top: ${topBorder}; border-bottom: ${bottomBorder}; background: #ffffff; vertical-align: middle;`;
    const itemLabel = `FRT ${side} ${item.key}`;

    const stageCells = F5014_DIM_STAGES.map(stage => {
      const id = `f5014_dim_FRT_${side}_${item.key}_${stage.key}`;
      const val = escapeAttr(savedValues[id]);
      const wheelTitle = `${itemLabel} (${stage.label})`;
      return `<td style="${rowCellBase} padding: 2px;">
                    <input type="text" id="${id}" data-form-code="5014" data-save-group="dimData" data-f5014-dim="1" data-wheel-parsed-spec="${item.spec}" data-wheel-tolerance="${item.tolerance}" data-wheel-unit="mm" data-wheel-range="${item.range}" data-wheel-title="${wheelTitle}" class="form-control" style="${INPUT_STYLE}" value="${val}" />
                  </td>`;
    }).join('\n                  ');

    return `
                <tr>
                  <th scope="row" style="${rowCellBase} padding: 7px 4px; font-weight: 700; color: #000; font-size: 11px; white-space: nowrap;">${itemLabel}</th>
                  <td style="${rowCellBase} padding: 7px 4px; font-weight: 700; color: #000; font-size: 11px; white-space: nowrap;">${item.specText}</td>
                  ${stageCells}
                </tr>`;
  }).join('');

  const padId = `f5014_dim_FRT_${side}_PAD_SPEC`;
  const padVal = escapeAttr(savedValues[padId]);
  const padRowCellBase = 'border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px dotted #000; border-bottom: 1px solid #000; background: #ffffff; vertical-align: middle;';
  const mbStyle = isLast ? '' : ' margin-bottom: 14px;';

  return `
            <table data-form-code="5014" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;${mbStyle}">
              <colgroup>
                <col style="width: 22%;" />
                <col style="width: 24%;" />
                <col style="width: 18%;" />
                <col style="width: 18%;" />
                <col style="width: 18%;" />
              </colgroup>
              <thead>
                <tr>
                  <th colspan="5" style="border: 1px solid #000; padding: 7px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12.5px; vertical-align: middle;">중요 치수 및 검사 현황 (FRT ${side})</th>
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
                <tr>
                  <th scope="row" style="${padRowCellBase} padding: 7px 4px; font-weight: 700; color: #000; font-size: 11px; white-space: nowrap;">패드 규격</th>
                  <td style="${padRowCellBase} padding: 7px 2px; font-weight: 700; color: #000; font-size: 10.5px; white-space: nowrap;">5T*5W*60L</td>
                  <td colspan="3" style="${padRowCellBase} padding: 2px 4px;">
                    <input type="text" id="${padId}" data-form-code="5014" data-save-group="dimData" data-wheel-skip="1" class="form-control" style="${INPUT_STYLE}" value="${padVal}" />
                  </td>
                </tr>
              </tbody>
            </table>`;
}

function renderDimCardHTML(savedValues = {}) {
  const tablesHTML = F5014_DIM_SIDES
    .map((side, idx) => renderDimTableBySideHTML(side, savedValues, idx === F5014_DIM_SIDES.length - 1))
    .join('\n');

  return `
        <div class="card" data-form-code="5014" style="padding: 16px; margin-bottom: 16px;">
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
            📐 <span class="sec-num"></span> 주요 치수 입력
          </label>
          <div class="f5014-dim-wrap" data-form-code="5014" style="width: 100%; overflow-x: hidden;">${tablesHTML}
          </div>
        </div>`;
}

/**
 * @param {Object} savedValues 저장/현재 입력값 맵 (id -> value)
 * @returns {string} 부자재 LOT 번호 입력 + 주요 치수 입력 카드 HTML
 */
export function renderF5014Section5HTML(savedValues = {}) {
  return `${renderSubLotCardHTML(savedValues)}\n${renderDimCardHTML(savedValues)}\n      `;
}

/**
 * Section5Renderer.js 의 `formCode === 5014` 에서 위임 호출.
 * @param {HTMLElement} section5 #section5DynamicContainer
 * @param {Object} ctx           Section5Renderer 컨텍스트
 */
export function renderF5014Section5(section5, ctx = {}) {
  const saved = { ...(ctx.existingData?.dimData || {}) };
  section5.querySelectorAll('input[data-form-code="5014"]').forEach(el => {
    if (el.id) saved[el.id] = el.value;
  });

  section5.innerHTML = renderF5014Section5HTML(saved);

  if (ctx.bindNumberWheelPicker) {
    section5.querySelectorAll('input[data-form-code="5014"][data-f5014-dim="1"]').forEach(input => {
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
