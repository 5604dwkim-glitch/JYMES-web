/**
 * 양식 고유 번호 #1001 (JG1 / 인벨트 / 소재준비)
 * "5. 치수확인 (FRT) · 6. 치수확인 (RR)" 전용 렌더러
 *
 * - 정치절단길이 (Spec Cutt,g) 전용 구성 (단컷팅 항목 제거)
 *   · FRT : 662 ± 1mm (`dim_cut_FRT_초`, `dim_cut_FRT_중`, `dim_cut_FRT_종`)
 *   · RR  : 604 ± 1mm (`dim_cut_RR_초`,  `dim_cut_RR_중`,  `dim_cut_RR_종`)
 * - 기존 Firestore 저장 키(`dimData.cut_FRT_*`, `dimData.cut_RR_*`) 하위 호환 유지 (GEMINI.md 원칙 8·9·11·12)
 */

export const F1001_CUT_SECTIONS = [
  {
    key: 'FRT',
    title: '치수확인 (FRT)',
    leftLabel: 'FRT LH',
    rightLabel: 'FRT RH',
    spec: 662,
    tolerance: 1,
    specText: '662 ± 1mm',
    marginBottom: '24px'
  },
  {
    key: 'RR',
    title: '치수확인 (RR)',
    leftLabel: 'RR LH',
    rightLabel: 'RR RH',
    spec: 604,
    tolerance: 1,
    specText: '604 ± 1mm',
    marginBottom: '0'
  }
];

export const F1001_DIM_STAGES = ['초', '중', '종'];

function escapeAttr(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderCutSectionBlockHTML(sec, dimData = {}) {
  const inputsHtml = F1001_DIM_STAGES.map(stage => {
    const key = `cut_${sec.key}_${stage}`;
    const id = `dim_${key}`;
    const val = escapeAttr(dimData[key] ?? dimData[id] ?? '');
    return `<input type="text" id="${id}" data-form-code="1001" data-wheel-parsed-spec="${sec.spec}" data-wheel-tolerance="${sec.tolerance}" class="form-control" style="width: 32%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${val}" placeholder="(${stage})" />`;
  }).join('\n                        ');

  return `
            <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
              📐 <span class="sec-num"></span> ${sec.title}
            </label>
            <div style="overflow-x: auto; margin-bottom: ${sec.marginBottom};">
              <table data-form-code="1001" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #e8eef5; font-weight: 700; color: #000;">
                    <th colspan="2" style="border: 1px solid #000; padding: 6px; width: 40%;">구 분(Division)</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 30%;">${sec.leftLabel}</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 30%;">${sec.rightLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td rowspan="2" style="border: 1px solid #000; background: #f1f5f9; font-weight: 700; padding: 4px; width: 20%; vertical-align: middle;">
                      정치절단길이<br>(Spec Cutt,g )
                    </td>
                    <td style="border: 1px solid #000; background: #f8fafc; font-weight: 700; padding: 4px; width: 20%;">
                      스펙(mm)
                    </td>
                    <td colspan="2" style="border: 1px solid #000; background: #f8fafc; font-weight: 700; padding: 4px;">
                      ${sec.specText}
                    </td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; background: #f8fafc; font-weight: 700; padding: 4px;">
                      실측(Act) <span style="font-size: 9px; font-weight: normal;">(초/중/종)</span>
                    </td>
                    <td colspan="2" style="border: 1px solid #000; background: #ffffff; padding: 3px 2px;">
                      <div style="display: flex; align-items: center; justify-content: space-around; gap: 2px;">
                        ${inputsHtml}
                      </div>
                    </td>
                  </tr>
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
