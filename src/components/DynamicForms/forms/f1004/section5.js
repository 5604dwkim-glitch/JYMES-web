/**
 * 양식 고유 번호 #1004 (JG1 / 인벨트 / 검사포장)
 * "5. 치수확인" 전용 렌더러
 *
 * - FRT (FRT LH / FRT RH): 674±1 (￠ to ￠), 735±1 (LIP to LIP)
 * - RR  (RR LH  / RR RH ): 616±1 (￠ to ￠), 679±1 (LIP to LIP)
 * - 기존 Firestore 저장 키(`dimData.ctc_*`, `dimData.ltl_*`) 하위 호환 유지 (GEMINI.md 원칙 8·9·11·12)
 */

export const F1004_TABLES = [
  {
    divisionTitle: '구분 (FRT)',
    sideTitle: 'FRT LH',
    rowTitle: '전장 길이<br>측정 (FRT)<br>단위 : mm',
    marginBottom: '24px',
    specs: [
      { keyPrefix: 'ctc_frt_lh', spec: 674, specHtml: '674±1<br>(￠ to ￠)' },
      { keyPrefix: 'ltl_frt_lh', spec: 735, specHtml: '735±1<br>(LIP to LIP)' }
    ]
  },
  {
    divisionTitle: '구분 (FRT)',
    sideTitle: 'FRT RH',
    rowTitle: '전장 길이<br>측정 (FRT)<br>단위 : mm',
    marginBottom: '24px',
    specs: [
      { keyPrefix: 'ctc_frt_rh', spec: 674, specHtml: '674±1<br>(￠ to ￠)' },
      { keyPrefix: 'ltl_frt_rh', spec: 735, specHtml: '735±1<br>(LIP to LIP)' }
    ]
  },
  {
    divisionTitle: '구분 (RR)',
    sideTitle: 'RR LH',
    rowTitle: '전장 길이<br>측정 (RR)<br>단위 : mm',
    marginBottom: '24px',
    specs: [
      { keyPrefix: 'ctc_rr_lh', spec: 616, specHtml: '616±1<br>(￠ to ￠)' },
      { keyPrefix: 'ltl_rr_lh', spec: 679, specHtml: '679±1<br>(LIP to LIP)' }
    ]
  },
  {
    divisionTitle: '구분 (RR)',
    sideTitle: 'RR RH',
    rowTitle: '전장 길이<br>측정 (RR)<br>단위 : mm',
    marginBottom: '0',
    specs: [
      { keyPrefix: 'ctc_rr_rh', spec: 616, specHtml: '616±1<br>(￠ to ￠)' },
      { keyPrefix: 'ltl_rr_rh', spec: 679, specHtml: '679±1<br>(LIP to LIP)' }
    ]
  }
];

export const F1004_DIM_STAGES = ['초', '중', '종'];

function escapeAttr(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderSpecRowHTML(tbl, specRow, isFirst, d) {
  const leadCell = isFirst
    ? `\n                    <td rowspan="2" style="border: 1px solid #000; background: #f1f5f9; font-weight: 700; padding: 4px; vertical-align: middle; width: 14%;">\n                      ${tbl.rowTitle}\n                    </td>`
    : '';
  const specWidth = isFirst ? ' width: 10%;' : '';

  const inputs = F1004_DIM_STAGES.map(stage => {
    const key = `${specRow.keyPrefix}_${stage}`;
    const id = `dim_${key}`;
    const val = escapeAttr(d[key] ?? d[id] ?? '');
    return `<td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${id}" data-form-code="1004" data-wheel-parsed-spec="${specRow.spec}" data-wheel-tolerance="1" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${val}" placeholder="(${stage})" /></td>`;
  }).join('\n                    ');

  return `
                  <tr>${leadCell}
                    <td style="border: 1px solid #000; background: #f8fafc; font-weight: 700; padding: 4px;${specWidth}">
                      ${specRow.specHtml}
                    </td>
                    ${inputs}
                  </tr>`;
}

function renderDimTableHTML(tbl, d) {
  const wrapStyle = tbl.marginBottom && tbl.marginBottom !== '0'
    ? ` style="overflow-x: auto; margin-bottom: ${tbl.marginBottom};"`
    : ' style="overflow-x: auto;"';

  const bodyRows = tbl.specs.map((s, idx) => renderSpecRowHTML(tbl, s, idx === 0, d)).join('');

  return `
            <div${wrapStyle}>
              <table data-form-code="1004" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #e8eef5; font-weight: 700; color: #000; border-bottom: 1px solid #000;">
                    <th colspan="2" style="border: 1px solid #000; padding: 6px;">${tbl.divisionTitle}</th>
                    <th colspan="3" style="border: 1px solid #000; padding: 6px; width: 76%;">${tbl.sideTitle}</th>
                  </tr>
                  <tr style="background: #e8eef5; font-weight: 700; color: #000; border-bottom: 2px solid #000;">
                    <td colspan="2" style="border: 1px solid #000; padding: 4px;">측정(mm)</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">초</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">중</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">종</td>
                  </tr>
                </thead>
                <tbody>${bodyRows}
                </tbody>
              </table>
            </div>`;
}

/**
 * @param {Object} dimData existingData.dimData 맵
 * @returns {string}
 */
export function renderF1004Section5HTML(dimData = {}) {
  const tablesHtml = F1004_TABLES.map(tbl => renderDimTableHTML(tbl, dimData)).join('\n');
  return `
          <div class="card f1004-dim-card" data-form-code="1004" style="padding: 16px; margin-bottom: 16px;">
            <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 8px; display: block;">
              📐 <span class="sec-num"></span> 치수확인
            </label>

            <div style="max-width: 650px; margin: 0 auto 12px auto;">
              <img src="images/jg1_inbelt_dimension_1004.png" alt="JG1 인벨트 치수확인 도면" style="width: 100%; height: auto; display: block; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);" />
            </div>

            ${tablesHtml}
          </div>
        `;
}

/**
 * Section5Renderer.js 의 `formCode === 1004` 분기에서 호출한다.
 * @param {HTMLElement} section5
 * @param {Object} ctx
 */
export function renderF1004Section5(section5, ctx = {}) {
  const dimData = ctx.existingData?.dimData || {};
  section5.innerHTML = renderF1004Section5HTML(dimData);
}
