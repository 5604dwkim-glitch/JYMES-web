/**
 * 양식 고유 번호 #4021 (LQ2a_HOOD SIDE_소재준비)
 * "5. 치수확인" 및 "클립간격 확인" 전용 렌더러
 *
 * - 5. 치수확인: LH / RH 2열 구성, 정치절단길이 스펙 732±5mm, 초/중/종 실측
 * - 클립간격 확인: 도면 이미지(images/f4021_clip_spacing.png) + LH 표 + RH 동일 표
 *   · 측정(mm) 1~7번 위치별 초(start) / 중(middle) / 종(end)
 * - 모든 입력칸 ID 는 `f4021_` 접두사 + `data-save-group="dimData"` 및 명시적 `data-*` 속성 사용 (GEMINI.md 원칙 1·2·8·10·11·12·13)
 */

export const F4021_DIM_COLS = [
  { key: 'lh', label: 'LH', spec: 732, tolerance: 5, legacyKeyPrefix: 'cut_FRT_' },
  { key: 'rh', label: 'RH', spec: 732, tolerance: 5, legacyKeyPrefix: 'cut_RR_' },
];

export const F4021_DIM_STAGES = ['초', '중', '종'];
export const F4021_SPEC_TEXT = '732±5mm';

export const F4021_CLIP_SIDES = [
  { key: 'lh', label: 'LH' },
  { key: 'rh', label: 'RH' },
];

export const F4021_CLIP_POSITIONS = [
  { pos: 1, spec: 83, tolerance: 1.5 },
  { pos: 2, spec: 100, tolerance: 1.5 },
  { pos: 3, spec: 100, tolerance: 1.5 },
  { pos: 4, spec: 110, tolerance: 1.5 },
  { pos: 5, spec: 120, tolerance: 1.5 },
  { pos: 6, spec: 120, tolerance: 1.5 },
  { pos: 7, spec: 99, tolerance: 1.5 },
];

export const F4021_CLIP_ROWS = [
  { key: '초', label: '초(start)' },
  { key: '중', label: '중(middle)' },
  { key: '종', label: '종(end)' },
];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderClipTableHTML(side, savedValues = {}) {
  const posHeaderCells = F4021_CLIP_POSITIONS.map(
    (p) =>
      `<th style="border: 1px solid #000; border-left: 1px dotted #94a3b8; border-right: 1px dotted #94a3b8; padding: 5px 2px; width: 11%; font-weight: 700;">${p.pos}</th>`
  ).join('');

  const bodyRows = F4021_CLIP_ROWS.map((row) => {
    const cellsHtml = F4021_CLIP_POSITIONS.map((p) => {
      const id = `f4021_clip_${side.key}_${p.pos}_${row.key}`;
      const val = savedValues[id] !== undefined ? savedValues[id] : '';
      const title = `클립간격 ${side.label} ${p.pos}번 (${row.label})`;
      return `<td style="border: 1px dotted #94a3b8; border-bottom: 1px solid #000; padding: 2px; background: #ffffff;">
                      <input type="text" id="${id}" name="${id}" data-form-code="4021" data-save-group="dimData" data-wheel-parsed-spec="${p.spec}" data-wheel-tolerance="${p.tolerance}" data-wheel-unit="mm" data-wheel-range="15" data-wheel-preset-step="1" data-wheel-title="${title}" class="form-control" style="width: 100%; height: 26px; padding: 2px; text-align: center; font-size: 11px; border: none; background: transparent;" value="${escapeHtml(val)}" readonly />
                    </td>`;
    }).join('');

    return `
                <tr>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 6px 4px; white-space: nowrap;">
                    ${row.label}
                  </td>
                  ${cellsHtml}
                </tr>`;
  }).join('');

  return `
            <div style="overflow-x: auto; ${side.key === 'lh' ? 'margin-bottom: 12px;' : ''}">
              <table data-form-code="4021" data-clip-side="${side.key}" style="width: 100%; min-width: 480px; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #fffde7; font-weight: 700; color: #000;">
                    <th rowspan="2" style="border: 1px solid #000; padding: 6px 4px; width: 23%; vertical-align: middle;">측정(mm)</th>
                    <th colspan="${F4021_CLIP_POSITIONS.length}" style="border: 1px solid #000; padding: 6px 4px; font-size: 12px;">${side.label}</th>
                  </tr>
                  <tr style="background: #fffde7; font-weight: 700; color: #000;">
                    ${posHeaderCells}
                  </tr>
                </thead>
                <tbody>${bodyRows}
                </tbody>
              </table>
            </div>`;
}

/**
 * @param {Object} savedValues 저장/현재 입력값 맵 (id -> value)
 * @returns {string} 치수확인 + 클립간격 확인 카드 HTML
 */
export function renderF4021Section5HTML(savedValues = {}) {
  const headerCols = F4021_DIM_COLS.map(
    (col) => `<th style="border: 1px solid #000; padding: 6px; width: 36%;">${col.label}</th>`
  ).join('\n                  ');

  const actCols = F4021_DIM_COLS.map((col) => {
    const inputsHtml = F4021_DIM_STAGES.map((stage) => {
      const id = `f4021_cut_${col.key}_${stage}`;
      const legacyVal = col.legacyKeyPrefix ? (savedValues[`${col.legacyKeyPrefix}${stage}`] || '') : '';
      const val = savedValues[id] !== undefined && savedValues[id] !== '' ? savedValues[id] : legacyVal;
      const title = `정치절단길이 ${col.label} ${stage}`;
      return `                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <input type="text" id="${id}" name="${id}" data-form-code="4021" data-save-group="dimData" data-wheel-parsed-spec="${col.spec}" data-wheel-tolerance="${col.tolerance}" data-wheel-unit="mm" data-wheel-range="30" data-wheel-title="${title}" class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${escapeHtml(val)}" readonly placeholder="(${stage})" />
                      </div>`;
    }).join('\n');

    return `<td style="border: 1px solid #000; padding: 3px 2px;">
                    <div style="display: flex; flex-direction: column; gap: 4px; padding: 4px;">
${inputsHtml}
                    </div>
                  </td>`;
  }).join('\n                  ');

  const clipTablesHtml = F4021_CLIP_SIDES.map((side) => renderClipTableHTML(side, savedValues)).join('\n');

  return `
        <div class="card" data-form-code="4021" style="padding: 16px; margin-bottom: 16px;">
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
            📐 <span class="sec-num"></span> 치수확인
          </label>
          <div style="overflow-x: auto;">
            <table data-form-code="4021" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
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
                  <td colspan="2" style="border: 1px solid #000; font-weight: 700; padding: 4px;">
                    ${F4021_SPEC_TEXT}
                  </td>
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

        <div class="card" data-form-code="4021" style="padding: 16px; margin-bottom: 16px;">
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
            📏 클립간격 확인
          </label>
          <div style="max-width: 720px; margin: 0 auto 14px auto;">
            <img src="images/f4021_clip_spacing.png" alt="LQ2a HOOD SIDE 클립간격 도면" style="width: 100%; height: auto; display: block; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);" />
          </div>
          ${clipTablesHtml}
        </div>
      `;
}

/**
 * Section5Renderer.js 의 `formCode === 4021` 에서 위임 호출.
 * @param {HTMLElement} section5 #section5DynamicContainer
 * @param {Object} ctx           Section5Renderer 컨텍스트
 */
export function renderF4021Section5(section5, ctx = {}) {
  const saved = { ...(ctx.existingData?.dimData || {}) };
  section5.querySelectorAll('input[data-form-code="4021"]').forEach((el) => {
    if (el.id) saved[el.id] = el.value;
  });

  section5.innerHTML = renderF4021Section5HTML(saved);

  if (ctx.bindNumberWheelPicker) {
    section5.querySelectorAll('input[data-form-code="4021"]').forEach((input) => {
      const spec = parseFloat(input.dataset.wheelParsedSpec) || 0;
      const tolerance = parseFloat(input.dataset.wheelTolerance);
      const range = parseFloat(input.dataset.wheelRange) || 30;
      const unit = input.dataset.wheelUnit || 'mm';
      const title = input.dataset.wheelTitle || '정치절단길이';
      ctx.bindNumberWheelPicker(input, title, spec, range, unit, Number.isNaN(tolerance) ? null : tolerance);
    });
  }
}
