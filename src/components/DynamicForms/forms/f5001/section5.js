/**
 * 양식 고유 번호 #5001 (GM 9BQC / G/RUN / 소재준비-글라스본딩)
 * "5. 본딩설비 셋팅" (구 치수확인 대체) 전용 렌더러
 *
 * - 제품명 6종: 9BQC PRI LH / 9BQC PRI RH / 9BQC TIN LH / 9BQC TIN RH / 9BQB LH / 9BQB RH
 * - 구분: 초 / 중 / 종 (표준: 예열온도 40, 건조로온도 80)
 * - 모든 입력칸 ID 는 `f5001_` 접두사, 동작/저장은 명시적 `data-*` 속성만 사용 (GEMINI.md 원칙 1·2·8·10·13)
 */

export const F5001_BONDING_PRODUCTS = [
  { key: 'PRI_LH', label: '9BQC PRI LH' },
  { key: 'PRI_RH', label: '9BQC PRI RH' },
  { key: 'TIN_LH', label: '9BQC TIN LH' },
  { key: 'TIN_RH', label: '9BQC TIN RH' },
  { key: '9BQB_LH', label: '9BQB LH' },
  { key: '9BQB_RH', label: '9BQB RH' }
];

export const F5001_BONDING_STAGES = ['초', '중', '종'];

export const F5001_BONDING_COLUMNS = [
  { key: 'preheat', label: '예열온도', spec: 40, unit: '℃', range: 30 },
  { key: 'dryer', label: '건조로온도', spec: 80, unit: '℃', range: 30 }
];

const PRODUCT_TD_STYLE = 'border: 1px solid #000; padding: 6px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;';
const STAGE_TD_STYLE = 'border: 1px solid #000; padding: 5px 4px; background: #ffffff; font-weight: 600; color: #000; font-size: 11px; vertical-align: middle;';
const INPUT_TD_STYLE = 'border: 1px solid #000; padding: 2px; background: #ffffff;';
const INPUT_STYLE = 'width: 100%; height: 26px; border: none; text-align: center; font-size: 12px; font-weight: 700; padding: 2px; background: transparent; outline: none; border-radius: 0;';

/**
 * @param {Object} savedValues 저장/현재 입력값 맵 (id -> value)
 * @returns {string} 카드 전체 HTML
 */
export function renderF5001Section5HTML(savedValues = {}) {
  const bodyRows = F5001_BONDING_PRODUCTS.map(prod =>
    F5001_BONDING_STAGES.map((stage, stageIdx) => {
      const prodCell = stageIdx === 0
        ? `\n                <td rowspan="3" style="${PRODUCT_TD_STYLE}">${prod.label}</td>`
        : '';
      const inputCells = F5001_BONDING_COLUMNS.map(col => {
        const id = `f5001_${prod.key}_${col.key}_${stage}`;
        const val = savedValues[id] ?? '';
        const title = `${prod.label} ${col.label} (${stage})`;
        return `<td style="${INPUT_TD_STYLE}">
                  <input type="text" id="${id}" data-form-code="5001" data-save-group="dimData" data-wheel-parsed-spec="${col.spec}" data-wheel-unit="${col.unit}" data-wheel-range="${col.range}" data-wheel-title="${title}" class="form-control" style="${INPUT_STYLE}" value="${val}" />
                </td>`;
      }).join('\n                ');

      return `
              <tr>${prodCell}
                <td style="${STAGE_TD_STYLE}">${stage}</td>
                ${inputCells}
              </tr>`;
    }).join('')
  ).join('');

  return `
        <div class="card" data-form-code="5001" style="padding: 16px; margin-bottom: 16px;">
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
            ♨️ <span class="sec-num"></span> 본딩설비 셋팅
          </label>
          <div style="overflow-x: auto;">
            <table data-form-code="5001" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <thead>
                <tr>
                  <th rowspan="3" style="border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 12px; width: 30%; vertical-align: middle;">제품명</th>
                  <th colspan="3" style="border: 1px solid #000; padding: 8px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">설비 설정값</th>
                </tr>
                <tr>
                  <th style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 16%; vertical-align: middle;">구분</th>
                  <th style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 27%; vertical-align: middle;">예열온도</th>
                  <th style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 27%; vertical-align: middle;">건조로온도</th>
                </tr>
                <tr>
                  <th style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">표준</th>
                  <th style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">40</th>
                  <th style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">80</th>
                </tr>
              </thead>
              <tbody>${bodyRows}
              </tbody>
            </table>
          </div>
        </div>
      `;
}

/**
 * Section5Renderer.js 의 `formCode === 5001` 에서 위임 호출.
 * @param {HTMLElement} section5 #section5DynamicContainer
 * @param {Object} ctx           Section5Renderer 컨텍스트
 */
export function renderF5001Section5(section5, ctx = {}) {
  const saved = { ...(ctx.existingData?.dimData || {}) };
  section5.querySelectorAll('input[data-form-code="5001"]').forEach(el => {
    if (el.id && el.value !== '') saved[el.id] = el.value;
  });

  section5.innerHTML = renderF5001Section5HTML(saved);

  if (ctx.bindNumberWheelPicker) {
    section5.querySelectorAll('input[data-form-code="5001"]').forEach(input => {
      const spec = parseFloat(input.dataset.wheelParsedSpec) || 40;
      const range = parseFloat(input.dataset.wheelRange) || 30;
      const unit = input.dataset.wheelUnit ?? '℃';
      const title = input.dataset.wheelTitle || '본딩설비 셋팅';
      ctx.bindNumberWheelPicker(input, title, spec, range, unit);
    });
  }
}
