/**
 * 양식 고유 번호 #1054 (제네시스 JG1 / FRUNK / 검사포장)
 * "5. 치수확인" 전용 렌더러 (#1051 치수확인 항목과 동일 구조)
 *
 * - 구분: 타공 단면 (스펙 1454±5) / 무타공 단면 (스펙 864±5) 2열 구성
 * - 실측(Act): 각 단면별 초/중/종 2열 기록
 * - 모든 입력칸 ID 는 `f1054_` 접두사 + `data-save-group="dimData"` 및 명시적 `data-*` 속성만 사용 (GEMINI.md 원칙 1·2·8·10·11·12·13)
 */

export const F1054_DIM_COLS = [
  { key: 'perf', label: '타공 단면', spec: 1454, tolerance: 5, specText: '1454±5', legacyKeyPrefix: 'cut_FRT_' },
  { key: 'nonperf', label: '무타공 단면', spec: 864, tolerance: 5, specText: '864±5', legacyKeyPrefix: null }
];

export const F1054_DIM_STAGES = ['초', '중', '종'];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {Object} savedValues 저장/현재 입력값 맵 (id -> value)
 * @returns {string} 치수확인 카드 HTML
 */
export function renderF1054Section5HTML(savedValues = {}) {
  const headerCols = F1054_DIM_COLS.map(
    col => `<th style="border: 1px solid #000; padding: 6px; width: 36%;">${col.label}</th>`
  ).join('\n                  ');

  const specCols = F1054_DIM_COLS.map(
    col => `<td style="border: 1px solid #000; font-weight: 700; padding: 4px;">${col.specText}</td>`
  ).join('\n                  ');

  const actCols = F1054_DIM_COLS.map(col => {
    const inputsHtml = F1054_DIM_STAGES.map(stage => {
      const id = `f1054_cut_${col.key}_${stage}`;
      const legacyVal = col.legacyKeyPrefix ? (savedValues[`${col.legacyKeyPrefix}${stage}`] || '') : '';
      const val = savedValues[id] !== undefined ? savedValues[id] : legacyVal;
      const title = `정치절단길이 ${col.label} ${stage}`;
      return `                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <input type="text" id="${id}" data-form-code="1054" data-save-group="dimData" data-wheel-parsed-spec="${col.spec}" data-wheel-tolerance="${col.tolerance}" data-wheel-unit="mm" data-wheel-range="50" data-wheel-title="${title}" class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${escapeHtml(val)}" placeholder="(${stage})" />
                      </div>`;
    }).join('\n');

    return `<td style="border: 1px solid #000; padding: 3px 2px;">
                    <div style="display: flex; flex-direction: column; gap: 4px; padding: 4px;">
${inputsHtml}
                    </div>
                  </td>`;
  }).join('\n                  ');

  return `
        <div class="card" data-form-code="1054" style="padding: 16px; margin-bottom: 16px;">
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
            📐 <span class="sec-num"></span> 치수확인
          </label>
          <div style="overflow-x: auto;">
            <table data-form-code="1054" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <thead>
                <tr style="background: #fffde7; font-weight: 700; color: #000;">
                  <th colspan="3" style="border: 1px solid #000; padding: 6px;">구 분(Division)</th>
                  ${headerCols}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    정치절단길이<br>(Spec Cutt,g )
                  </td>
                  <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                    스펙(mm)
                  </td>
                  ${specCols}
                </tr>
                <tr>
                  <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                    실측(Act) <span style="font-size: 9px; font-weight: normal;">(초/중/종)</span>
                  </td>
                  ${actCols}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
}

/**
 * Section5Renderer.js 의 `formCode === 1054` 에서 위임 호출.
 * @param {HTMLElement} section5 #section5DynamicContainer
 * @param {Object} ctx           Section5Renderer 컨텍스트
 */
export function renderF1054Section5(section5, ctx = {}) {
  const saved = { ...(ctx.existingData?.dimData || {}) };
  section5.querySelectorAll('input[data-form-code="1054"]').forEach(el => {
    if (el.id) saved[el.id] = el.value;
  });

  section5.innerHTML = renderF1054Section5HTML(saved);

  if (ctx.bindNumberWheelPicker) {
    section5.querySelectorAll('input[data-form-code="1054"]').forEach(input => {
      const spec = parseFloat(input.dataset.wheelParsedSpec) || 0;
      const range = parseFloat(input.dataset.wheelRange) || 50;
      const unit = input.dataset.wheelUnit || 'mm';
      const title = input.dataset.wheelTitle || '정치절단길이';
      ctx.bindNumberWheelPicker(input, title, spec, range, unit);
    });
  }
}
