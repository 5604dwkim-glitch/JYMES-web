/**
 * 양식 고유 번호 #5003 (GM 9BQC / G/RUN / 소재준비-단컷팅)
 * "5. 치수확인" 전용 렌더러
 *
 * - 상단 헤더: 구 분(Division)[colspan=3] | FRT LH | FRT RH
 * - 좌측 병합(rowspan=7): FRT / 단 컷팅 / (Step cutting)
 * - 1행(규격): 규격[colspan=2] | 83mm | 83mm
 * - 2~4행(A): A[rowspan=3] | 초물 / 중물 / 종물 | FRT LH 실측 | FRT RH 실측
 * - 5~7행(B): B[rowspan=3] | 초물 / 중물 / 종물 | FRT LH 실측 | FRT RH 실측
 * - 모든 입력칸 ID 는 `f5003_` 접두사 + `data-save-group="dimData"` 및 명시적 `data-*` 속성만 사용
 *   (GEMINI.md 원칙 1·2·8·9·10·11·12·13·16)
 */

export const F5003_STEP_SPEC = 83;
export const F5003_STEP_SPEC_TEXT = '83mm';
export const F5003_STEP_RANGE = 20;

export const F5003_DIM_GROUPS = [
  { key: 'A', label: 'A', legacyPrefix: 'step_f' },
  { key: 'B', label: 'B', legacyPrefix: 'step_r' }
];

export const F5003_DIM_STAGES = [
  { key: '초', label: '초물' },
  { key: '중', label: '중물' },
  { key: '종', label: '종물' }
];

export const F5003_DIM_SIDES = [
  { key: 'FL', label: 'FRT LH' },
  { key: 'FR', label: 'FRT RH' }
];

const INPUT_STYLE = 'width: 100%; min-width: 0; height: 28px; border: none; text-align: center; font-size: 11.5px; font-weight: 700; color: #000; padding: 2px; background: transparent; outline: none; border-radius: 0; box-sizing: border-box;';

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
export function renderF5003Section5HTML(savedValues = {}) {
  const totalBodyRows = 1 + F5003_DIM_GROUPS.length * F5003_DIM_STAGES.length;

  const sideHeaders = F5003_DIM_SIDES
    .map(side => `<th scope="col" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 11.5px; vertical-align: middle;">${side.label}</th>`)
    .join('\n                  ');

  const specCells = F5003_DIM_SIDES
    .map(() => `<td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px dotted #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">${F5003_STEP_SPEC_TEXT}</td>`)
    .join('\n                  ');

  const groupRows = F5003_DIM_GROUPS.map((group, gIdx) => {
    const isLastGroup = gIdx === F5003_DIM_GROUPS.length - 1;
    const groupBottomBorder = isLastGroup ? '1px solid #000' : '1px dotted #000';

    return F5003_DIM_STAGES.map((stage, sIdx) => {
      const isLastRow = isLastGroup && sIdx === F5003_DIM_STAGES.length - 1;
      const rowBottomBorder = isLastRow ? '1px solid #000' : '1px dotted #000';

      const groupCell = sIdx === 0
        ? `\n                  <th rowspan="${F5003_DIM_STAGES.length}" scope="rowgroup" style="border-left: 1px solid #000; border-right: 1px dotted #000; border-top: 1px dotted #000; border-bottom: ${groupBottomBorder}; padding: 4px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">${group.label}</th>`
        : '';

      const stageCell = `<th scope="row" style="border-left: 1px dotted #000; border-right: 1px solid #000; border-top: 1px dotted #000; border-bottom: ${rowBottomBorder}; padding: 5px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle; white-space: nowrap;">${stage.label}</th>`;

      const inputCells = F5003_DIM_SIDES.map(side => {
        const id = `f5003_step_${group.key}_${stage.key}_${side.key}`;
        // 구버전(공통 단컷팅 표) 저장 키 하위 호환 복원 (GEMINI.md 원칙 11)
        const legacyKey = `${group.legacyPrefix}_${stage.key}_${side.key}`;
        const val = escapeAttr(savedValues[id] ?? savedValues[legacyKey] ?? '');
        const wheelTitle = `FRT 단 컷팅 ${group.label} ${side.label} (${stage.label})`;
        return `<td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px dotted #000; border-bottom: ${rowBottomBorder}; padding: 2px; background: #ffffff; vertical-align: middle;">
                    <input type="text" id="${id}" data-form-code="5003" data-save-group="dimData" data-f5003-dim="1" data-wheel-parsed-spec="${F5003_STEP_SPEC}" data-wheel-unit="mm" data-wheel-range="${F5003_STEP_RANGE}" data-wheel-title="${wheelTitle}" class="form-control" style="${INPUT_STYLE}" value="${val}" />
                  </td>`;
      }).join('\n                  ');

      return `
                <tr>${groupCell}
                  ${stageCell}
                  ${inputCells}
                </tr>`;
    }).join('');
  }).join('');

  return `
        <div class="card f5003-sec5-card" data-form-code="5003" style="padding: 16px; margin-bottom: 16px;">
          <style>
            .f5003-sec5-card[data-form-code="5003"] input[type="text"] {
              font-size: 11px !important;
              min-width: 0;
              box-sizing: border-box;
            }
          </style>
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
            📐 <span class="sec-num"></span> 치수확인
          </label>
          <div class="f5003-sec5-wrap" data-form-code="5003" style="width: 100%; overflow-x: hidden;">
            <table data-form-code="5003" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <colgroup>
                <col style="width: 15%;" />
                <col style="width: 5%;" />
                <col style="width: 10%;" />
                <col style="width: 35%;" />
                <col style="width: 35%;" />
              </colgroup>
              <thead>
                <tr>
                  <th colspan="3" scope="colgroup" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">구 분(Division)</th>
                  ${sideHeaders}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th rowspan="${totalBodyRows}" scope="rowgroup" style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle; line-height: 1.35;">FRT<br>단 컷팅<br>(Step cutting)</th>
                  <th colspan="2" scope="row" style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px dotted #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">규격</th>
                  ${specCells}
                </tr>${groupRows}
              </tbody>
            </table>
          </div>
        </div>
      `;
}

/**
 * Section5Renderer.js 의 `formCode === 5003` 에서 위임 호출.
 * @param {HTMLElement} section5 #section5DynamicContainer
 * @param {Object} ctx           Section5Renderer 컨텍스트
 */
export function renderF5003Section5(section5, ctx = {}) {
  const saved = { ...(ctx.existingData?.dimData || {}) };
  section5.querySelectorAll('input[data-form-code="5003"]').forEach(el => {
    if (el.id) saved[el.id] = el.value;
  });

  section5.innerHTML = renderF5003Section5HTML(saved);

  if (ctx.bindNumberWheelPicker) {
    section5.querySelectorAll('input[data-form-code="5003"][data-f5003-dim="1"]').forEach(input => {
      const spec = parseFloat(input.dataset.wheelParsedSpec) || 0;
      const range = parseFloat(input.dataset.wheelRange) || 20;
      const unit = input.dataset.wheelUnit ?? 'mm';
      const tolerance = input.dataset.wheelTolerance !== undefined
        ? parseFloat(input.dataset.wheelTolerance)
        : null;
      const title = input.dataset.wheelTitle || '치수확인';
      ctx.bindNumberWheelPicker(input, title, spec, range, unit, tolerance);
    });
  }
}
