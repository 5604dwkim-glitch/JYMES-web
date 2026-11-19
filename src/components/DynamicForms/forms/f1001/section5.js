/**
 * 양식 고유 번호 #1001 (JG1 / 인벨트 / 소재준비)
 * "5. 치수확인 (FRT) · 6. 치수확인 (RR)" 전용 렌더러
 *
 * - 정치절단길이 (Spec Cutt,g): LH / RH 분리 세로(초물·중물·종물) 입력
 *   · FRT : 662 ± 1mm (`f1001_cut_FRT_LH_{초|중|종}`, `f1001_cut_FRT_RH_{초|중|종}`)
 *   · RR  : 604 ± 1mm (`f1001_cut_RR_LH_{초|중|종}`,  `f1001_cut_RR_RH_{초|중|종}`)
 * - 모든 새 입력칸 ID 는 `f1001_` 접두사 + `data-save-group="dimData"` 사용 (GEMINI.md 원칙 2·8·10)
 * - 과거 통합 키(`dimData.cut_FRT_*`, `dimData.cut_RR_*`) 하위 호환 복원 유지 (GEMINI.md 원칙 11)
 */

export const F1001_CUT_SECTIONS = [
  {
    key: 'FRT',
    title: '치수확인 (FRT)',
    sides: [
      { key: 'LH', label: 'FRT LH' },
      { key: 'RH', label: 'FRT RH' }
    ],
    spec: 662,
    tolerance: 1,
    specText: '662 ± 1mm',
    marginBottom: '24px'
  },
  {
    key: 'RR',
    title: '치수확인 (RR)',
    sides: [
      { key: 'LH', label: 'RR LH' },
      { key: 'RH', label: 'RR RH' }
    ],
    spec: 604,
    tolerance: 1,
    specText: '604 ± 1mm',
    marginBottom: '0'
  }
];

export const F1001_DIM_STAGES = [
  { key: '초', label: '초물' },
  { key: '중', label: '중물' },
  { key: '종', label: '종물' }
];

const SOLID = '1px solid #000';
const DOTTED = '1px dotted #000';
const INPUT_STYLE = 'width: 100%; height: 26px; border: none; text-align: center; font-size: 11px; padding: 2px; background: transparent; outline: none; box-sizing: border-box;';

function escapeAttr(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderCutSectionBlockHTML(sec, dimData = {}) {
  const totalBodyRows = 1 + F1001_DIM_STAGES.length;

  const sideHeaders = sec.sides
    .map(side => `<th scope="col" style="border: ${SOLID}; padding: 6px; width: 30%;">${side.label}</th>`)
    .join('\n                    ');

  const stageRows = F1001_DIM_STAGES.map((stage, idx) => {
    const isLast = idx === F1001_DIM_STAGES.length - 1;
    const topBorder = idx === 0 ? SOLID : DOTTED;
    const bottomBorder = isLast ? SOLID : DOTTED;

    const cells = sec.sides.map(side => {
      const id = `f1001_cut_${sec.key}_${side.key}_${stage.key}`;
      const legacyKey = `cut_${sec.key}_${stage.key}`;
      const val = escapeAttr(dimData[id] ?? dimData[legacyKey] ?? '');
      const wheelTitle = `${sec.key} ${side.label} 정치절단길이 (${stage.label})`;
      return `<td style="border-left: ${SOLID}; border-right: ${SOLID}; border-top: ${topBorder}; border-bottom: ${bottomBorder}; padding: 2px; background: #ffffff;">
                      <input type="text" id="${id}" data-form-code="1001" data-save-group="dimData" data-wheel-parsed-spec="${sec.spec}" data-wheel-tolerance="${sec.tolerance}" data-wheel-unit="mm" data-wheel-title="${wheelTitle}" class="form-control" style="${INPUT_STYLE}" value="${val}" placeholder="(${stage.key})" />
                    </td>`;
    }).join('\n                    ');

    return `
                  <tr>
                    <td style="border-left: ${SOLID}; border-right: ${SOLID}; border-top: ${topBorder}; border-bottom: ${bottomBorder}; background: #f8fafc; font-weight: 700; padding: 5px 4px;">
                      ${stage.label}
                    </td>
                    ${cells}
                  </tr>`;
  }).join('');

  return `
            <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
              📐 <span class="sec-num"></span> ${sec.title}
            </label>
            <div style="overflow-x: auto; margin-bottom: ${sec.marginBottom};">
              <table data-form-code="1001" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #e8eef5; font-weight: 700; color: #000;">
                    <th colspan="2" style="border: ${SOLID}; padding: 6px; width: 40%;">구 분(Division)</th>
                    ${sideHeaders}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td rowspan="${totalBodyRows}" style="border: ${SOLID}; background: #f1f5f9; font-weight: 700; padding: 4px; width: 22%; vertical-align: middle;">
                      정치절단길이<br>(Spec Cutt,g )
                    </td>
                    <td style="border: ${SOLID}; background: #f8fafc; font-weight: 700; padding: 5px 4px; width: 18%;">
                      스펙(mm)
                    </td>
                    <td colspan="${sec.sides.length}" style="border: ${SOLID}; background: #f8fafc; font-weight: 700; padding: 5px 4px;">
                      ${sec.specText}
                    </td>
                  </tr>${stageRows}
                </tbody>
              </table>
            </div>`;
}

/**
 * @param {Object} dimData existingData.dimData 맵
 * @returns {string}
 */
export function renderF1001Section5HTML(dimData = {}) {
  const blocks = F1001_CUT_SECTIONS.map(sec => renderCutSectionBlockHTML(sec, dimData)).join('\n');
  return `
          <div class="card f1001-dim-card" data-form-code="1001" style="padding: 16px; margin-bottom: 16px;">
            ${blocks}
          </div>
        `;
}

/**
 * Section5Renderer.js 의 `formCode === 1001` 분기에서 호출한다.
 * @param {HTMLElement} section5
 * @param {Object} ctx
 */
export function renderF1001Section5(section5, ctx = {}) {
  const dimData = ctx.existingData?.dimData || {};
  section5.innerHTML = renderF1001Section5HTML(dimData);
}
