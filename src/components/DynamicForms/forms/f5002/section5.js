/**
 * 양식 고유 번호 #5002 (GM 9BQC / G/RUN / 소재준비-정치절단)
 * "5. 치수확인" 전용 렌더러 (상단 FRT 치수확인 표 / 하단 RR 치수확인 표)
 *
 * - 단컷팅 항목 없음 (정치절단길이만 표시)
 * - 상단 표 (FRT): 정치절단길이 체크 항목 A, B, C (각 스펙 및 초물·중물·종물 실측 입력)
 * - 하단 표 (RR):  정치절단길이 체크 항목 A, B   (각 스펙 및 초물·중물·종물 실측 입력)
 * - 모든 입력칸 ID 는 `f5002_` 접두사, 동작/저장은 명시적 `data-*` 속성만 사용 (GEMINI.md 원칙 1·2·8·10·11·12·13)
 */

export const F5002_DIM_GROUPS = [
  {
    groupKey: 'FRT',
    subTitle: '▪ FRT 치수 확인',
    headerLabel: '구 분 (FRT)',
    items: [
      { key: 'A', label: 'A', spec: 881, tolerance: 3 },
      { key: 'B', label: 'B', spec: 608, tolerance: 5 },
      { key: 'C', label: 'C', spec: 582, tolerance: 5 }
    ],
    marginBottom: '18px'
  },
  {
    groupKey: 'RR',
    subTitle: '▪ RR 치수 확인',
    headerLabel: '구 분 (RR)',
    items: [
      { key: 'A', label: 'A', spec: 488, tolerance: 3 },
      { key: 'B', label: 'B', spec: 658, tolerance: 5 }
    ],
    marginBottom: '0'
  }
];

export const F5002_DIM_STAGES = [
  { key: '초', label: '초물' },
  { key: '중', label: '중물' },
  { key: '종', label: '종물' }
];

const LABEL_BG_TD = 'border: 1px solid #000; background: #fffde7; font-weight: 700; color: #000; padding: 5px 2px; vertical-align: middle;';
const SPEC_TD = 'border: 1px solid #000; background: #ffffff; font-weight: 700; color: #000; padding: 5px 2px; vertical-align: middle; font-size: 11px;';
const INPUT_TD = 'border: 1px solid #000; background: #ffffff; padding: 2px; vertical-align: middle;';
const INPUT_STYLE = 'width: 100%; height: 26px; padding: 2px; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center; font-size: 11px; font-weight: 700; background: #ffffff; box-sizing: border-box;';

function renderGroupTable(group, savedValues) {
  const itemColWidth = (60 / group.items.length).toFixed(2);
  const colgroupHtml = [
    '<col style="width: 19%;" />',
    '<col style="width: 11%;" />',
    '<col style="width: 10%;" />',
    ...group.items.map(() => `<col style="width: ${itemColWidth}%;" />`)
  ].join('\n                  ');

  const headerItemCells = group.items
    .map(item => `<th style="border: 1px solid #000; padding: 6px 2px; background: #fffde7; font-size: 12px;">${item.label}</th>`)
    .join('\n                    ');

  const specCells = group.items
    .map(item => `<td style="${SPEC_TD}">${item.spec}±${item.tolerance}</td>`)
    .join('\n                    ');

  const stageRows = F5002_DIM_STAGES.map((stage, stageIdx) => {
    const actCell = stageIdx === 0
      ? `\n                    <td rowspan="${F5002_DIM_STAGES.length}" style="${LABEL_BG_TD}">실측<br>(Act)</td>`
      : '';

    const inputCells = group.items.map(item => {
      const id = `f5002_cut_${group.groupKey}_${item.key}_${stage.key}`;
      const val = savedValues[id] ?? '';
      const range = Math.max(20, Math.round(item.spec * 0.08));
      const title = `${group.groupKey} ${item.label} 정치절단길이 (${stage.label})`;
      return `<td style="${INPUT_TD}">
                      <input type="text" id="${id}" data-form-code="5002" data-save-group="dimData" data-wheel-parsed-spec="${item.spec}" data-wheel-tolerance="${item.tolerance}" data-wheel-unit="mm" data-wheel-range="${range}" data-wheel-title="${title}" class="form-control" style="${INPUT_STYLE}" value="${val}" placeholder="(${stage.key})" />
                    </td>`;
    }).join('\n                    ');

    return `
                  <tr>${actCell}
                    <td style="${LABEL_BG_TD}">${stage.label}</td>
                    ${inputCells}
                  </tr>`;
  }).join('');

  const wrapMb = group.marginBottom && group.marginBottom !== '0' ? ` margin-bottom: ${group.marginBottom};` : '';

  return `
            <div style="width: 100%; overflow-x: hidden;${wrapMb}">
              <div style="font-size: 12.5px; font-weight: 800; color: #1e293b; margin-bottom: 6px; padding-left: 2px;">${group.subTitle}</div>
              <table data-form-code="5002" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <colgroup>
                  ${colgroupHtml}
                </colgroup>
                <thead>
                  <tr style="background: #fffde7; font-weight: 700; color: #000;">
                    <th colspan="3" style="border: 1px solid #000; padding: 6px 4px; background: #fffde7;">${group.headerLabel}</th>
                    ${headerItemCells}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td rowspan="${1 + F5002_DIM_STAGES.length}" style="${LABEL_BG_TD}">정치절단길이<br>(Spec Cutt,g )</td>
                    <td colspan="2" style="${LABEL_BG_TD}">스펙(mm)</td>
                    ${specCells}
                  </tr>${stageRows}
                </tbody>
              </table>
            </div>`;
}

/**
 * @param {Object} savedValues 저장/현재 입력값 맵 (id -> value)
 * @returns {string} 카드 전체 HTML
 */
export function renderF5002Section5HTML(savedValues = {}) {
  const tablesHtml = F5002_DIM_GROUPS.map(g => renderGroupTable(g, savedValues)).join('\n');

  return `
        <div class="card f5002-sec5-card" data-form-code="5002" style="padding: 16px; margin-bottom: 16px;">
          <style>
            .f5002-sec5-card[data-form-code="5002"] input[type="text"] {
              font-size: 11px !important;
              min-width: 0;
              box-sizing: border-box;
            }
          </style>
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
            📐 <span class="sec-num"></span> 치수확인
          </label>${tablesHtml}
        </div>
      `;
}

/**
 * Section5Renderer.js 의 `formCode === 5002` 에서 위임 호출.
 * @param {HTMLElement} section5 #section5DynamicContainer
 * @param {Object} ctx           Section5Renderer 컨텍스트
 */
export function renderF5002Section5(section5, ctx = {}) {
  const saved = { ...(ctx.existingData?.dimData || {}) };
  section5.querySelectorAll('input[data-form-code="5002"]').forEach(el => {
    if (el.id) saved[el.id] = el.value;
  });

  section5.innerHTML = renderF5002Section5HTML(saved);

  if (ctx.bindNumberWheelPicker) {
    section5.querySelectorAll('input[data-form-code="5002"]').forEach(input => {
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
