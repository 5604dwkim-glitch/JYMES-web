import * as Templates from '../FormTemplates.jsx';
import { autoFormatDateTimeString } from './formUtils.js';

/**
 * Section 5 ?숈쟻 ?뚮뜑??(媛瑜섏삩??移섏닔?뺤씤 ??
 * ctx: { container, processValue, carModelValue, currentCarCode, partValueInput, existingData, getCurrentFormCode, bindNumberWheelPicker }
 */
export function renderSection5(ctx) {
  const { container, processValue, carModelValue, currentCarCode, partValueInput, existingData, getCurrentFormCode, bindNumberWheelPicker } = ctx;
    const section5 = container.querySelector('#section5DynamicContainer');
    if (!section5) return;

    const curProc = processValue ? processValue.value : '';
    const formCode = getCurrentFormCode();
    const d = existingData?.dimData || {};

    if (!curProc || curProc === '?대┰癒몄떊') {
      section5.innerHTML = '';
      return;
    }

    if (formCode === 4001) {
      section5.innerHTML = `
        <div class="card" style="padding: 16px; margin-bottom: 16px;">
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
            ?뱪 <span class="sec-num"></span> 移섏닔?뺤씤
          </label>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <thead>
                <tr style="background: #fffde7; font-weight: 700; color: #000;">
                  <th colspan="3" style="border: 1px solid #000; padding: 6px;">援?遺?Division)</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 72%;">PTG</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    ?뺤튂?덈떒湲몄씠<br>(Spec Cutt,g )
                  </td>
                  <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                    洹쒓꺽 (Spec)
                  </td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">
                    326 짹 2mm
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                    ?ㅼ륫(Act) <span style="font-size: 9px; font-weight: normal;">(珥?以?醫?</span>
                  </td>
                  <td style="border: 1px solid #000; padding: 3px 2px;">
                    <div style="display: flex; flex-direction: column; gap: 4px; padding: 4px;">
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(珥?</span>
                        <input type="text" id="dim_cut_FRT_珥? class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_珥?] || '326'}"  readonly />
                      </div>
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(以?</span>
                        <input type="text" id="dim_cut_FRT_以? class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_以?] || '326'}"  readonly />
                      </div>
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(醫?</span>
                        <input type="text" id="dim_cut_FRT_醫? class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_醫?] || '326'}"  readonly />
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
      bindNumberWheelPicker(section5.querySelector('#dim_cut_FRT_珥?), '?뺤튂?덈떒湲몄씠 PTG 珥?, 326, 20);
      bindNumberWheelPicker(section5.querySelector('#dim_cut_FRT_以?), '?뺤튂?덈떒湲몄씠 PTG 以?, 326, 20);
      bindNumberWheelPicker(section5.querySelector('#dim_cut_FRT_醫?), '?뺤튂?덈떒湲몄씠 PTG 醫?, 326, 20);
      return;
    } else if (formCode === 4004) {
      section5.innerHTML = `
        <div class="card" style="padding: 16px; margin-bottom: 16px;">
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
            ?뱪 <span class="sec-num"></span> 移섏닔?뺤씤
          </label>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <thead>
                <tr style="background: #fffde7; font-weight: 700; color: #000;">
                  <th colspan="3" style="border: 1px solid #000; padding: 6px;">援?遺?Division)</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 36%;">LH</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 36%;">RH</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    ?뺤튂?덈떒湲몄씠<br>(Spec Cutt,g )
                  </td>
                  <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                    洹쒓꺽 (Spec)
                  </td>
                  <td colspan="2" style="border: 1px solid #000; font-weight: 700; padding: 4px;">
                    326 짹 2mm
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                    ?ㅼ륫(Act) <span style="font-size: 9px; font-weight: normal;">(珥?以?醫?</span>
                  </td>
                  <td style="border: 1px solid #000; padding: 3px 2px;">
                    <div style="display: flex; flex-direction: column; gap: 4px; padding: 4px;">
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(珥?</span>
                        <input type="text" id="dim_cut_FRT_珥? class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_珥?] || ''}" />
                      </div>
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(以?</span>
                        <input type="text" id="dim_cut_FRT_以? class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_以?] || ''}" />
                      </div>
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(醫?</span>
                        <input type="text" id="dim_cut_FRT_醫? class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_醫?] || ''}" />
                      </div>
                    </div>
                  </td>
                  <td style="border: 1px solid #000; padding: 3px 2px;">
                    <div style="display: flex; flex-direction: column; gap: 4px; padding: 4px;">
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(珥?</span>
                        <input type="text" id="dim_cut_RR_珥? class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_RR_珥?] || '326'}"  readonly />
                      </div>
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(以?</span>
                        <input type="text" id="dim_cut_RR_以? class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_RR_以?] || '326'}"  readonly />
                      </div>
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(醫?</span>
                        <input type="text" id="dim_cut_RR_醫? class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_RR_醫?] || '326'}"  readonly />
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
      bindNumberWheelPicker(section5.querySelector('#dim_cut_FRT_珥?), '?뺤튂?덈떒湲몄씠 LH 珥?, 326, 20);
      bindNumberWheelPicker(section5.querySelector('#dim_cut_FRT_以?), '?뺤튂?덈떒湲몄씠 LH 以?, 326, 20);
      bindNumberWheelPicker(section5.querySelector('#dim_cut_FRT_醫?), '?뺤튂?덈떒湲몄씠 LH 醫?, 326, 20);
      bindNumberWheelPicker(section5.querySelector('#dim_cut_RR_珥?), '?뺤튂?덈떒湲몄씠 RH 珥?, 326, 20);
      bindNumberWheelPicker(section5.querySelector('#dim_cut_RR_以?), '?뺤튂?덈떒湲몄씠 RH 以?, 326, 20);
      bindNumberWheelPicker(section5.querySelector('#dim_cut_RR_醫?), '?뺤튂?덈떒湲몄씠 RH 醫?, 326, 20);
      return;
    } else if (formCode === 4011 || formCode === 4014) {
      section5.innerHTML = `
        <div class="card" style="padding: 16px; margin-bottom: 16px;">
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
            ?뱪 <span class="sec-num"></span> 移섏닔?뺤씤
          </label>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <thead>
                <tr style="background: #fffde7; font-weight: 700; color: #000;">
                  <th colspan="3" style="border: 1px solid #000; padding: 6px;">援?遺?Division)</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 72%;">Frunk</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    ?뺤튂?덈떒湲몄씠<br>(Spec Cutt,g )
                  </td>
                  <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                    洹쒓꺽 (Spec)
                  </td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">
                    1870 짹 2.5mm
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                    ?ㅼ륫(Act) <span style="font-size: 9px; font-weight: normal;">(珥?以?醫?</span>
                  </td>
                  <td style="border: 1px solid #000; padding: 3px 2px;">
                    <div style="display: flex; flex-direction: column; gap: 4px; padding: 4px;">
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(珥?</span>
                        <input type="text" id="dim_cut_FRT_珥? class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_珥?] || ''}" />
                      </div>
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(以?</span>
                        <input type="text" id="dim_cut_FRT_以? class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_以?] || ''}" />
                      </div>
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(醫?</span>
                        <input type="text" id="dim_cut_FRT_醫? class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_醫?] || ''}" />
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
      bindNumberWheelPicker(section5.querySelector('#dim_cut_FRT_珥?), '?뺤튂?덈떒湲몄씠 PTG 珥?, 1870, 50);
      bindNumberWheelPicker(section5.querySelector('#dim_cut_FRT_以?), '?뺤튂?덈떒湲몄씠 PTG 以?, 1870, 50);
      bindNumberWheelPicker(section5.querySelector('#dim_cut_FRT_醫?), '?뺤튂?덈떒湲몄씠 PTG 醫?, 1870, 50);
      return;
    }

    if (curProc === '議곗씤?? || curProc === '議곗씤??D)') {

      if (formCode === 1022 || formCode === 1042) {
        const jointLotVal = existingData?.jointRubberLotNo || '';
        const v = existingData?.vulcData || {};
        section5.innerHTML = `
          <div class="card" style="padding: 16px; margin-bottom: 16px;">
            <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
              ?뵢 <span class="sec-num"></span> 議곗씤??怨좊Т LOT 踰덊샇 ?낅젰
            </label>
            <input type="text" id="jointRubberLotNo" class="form-control" style="width: 100%; border: 1px solid var(--border-color); text-align: center; font-size: 12px; padding: 10px; border-radius: 6px; box-sizing: border-box;" placeholder="議곗씤??怨좊Т LOT ?낅젰" value="${jointLotVal}" />
          </div>

          <div class="card" style="padding: 16px; margin-bottom: 16px;">
            <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
              ?뙜截?<span class="sec-num"></span> ?ъ텧?⑤룄 ?낅젰
            </label>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #cfd8dc; font-weight: 700; color: #000;">
                    <th style="border: 1px solid #000; padding: 8px;">援щ텇</th>
                    <th style="border: 1px solid #000; padding: 8px;">?몄쫹<br>(Nozzle)</th>
                    <th style="border: 1px solid #000; padding: 8px;">?ㅻ┛??1<br>(H1)</th>
                    <th style="border: 1px solid #000; padding: 8px;">?ㅻ┛??2<br>(H2)</th>
                    <th style="border: 1px solid #000; padding: 8px;">?ㅻ┛??3<br>(H1)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="border: 1px solid #000; padding: 8px; background: #cfd8dc; font-weight: 700; border-bottom: 1px dotted #000;">?ㅼ젙媛?set)</td>
                    <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="number" id="vulc_set_nozzle" class="form-control" style="width:100%; border:none; text-align:center; background:transparent;" value="${v.set_nozzle || ''}" /></td>
                    <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="number" id="vulc_set_h1" class="form-control" style="width:100%; border:none; text-align:center; background:transparent;" value="${v.set_h1 || ''}" /></td>
                    <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="number" id="vulc_set_h2" class="form-control" style="width:100%; border:none; text-align:center; background:transparent;" value="${v.set_h2 || ''}" /></td>
                    <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="number" id="vulc_set_h3" class="form-control" style="width:100%; border:none; text-align:center; background:transparent;" value="${v.set_h3 || ''}" /></td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 8px; background: #cfd8dc; font-weight: 700; border-top: 1px dotted #000;">?ㅼ륫移?act)</td>
                    <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px dotted #000; border-bottom: 1px solid #000; padding: 2px;"><input type="number" id="vulc_act_nozzle" class="form-control" style="width:100%; border:none; text-align:center; background:transparent;" value="${v.act_nozzle || ''}" /></td>
                    <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px dotted #000; border-bottom: 1px solid #000; padding: 2px;"><input type="number" id="vulc_act_h1" class="form-control" style="width:100%; border:none; text-align:center; background:transparent;" value="${v.act_h1 || ''}" /></td>
                    <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px dotted #000; border-bottom: 1px solid #000; padding: 2px;"><input type="number" id="vulc_act_h2" class="form-control" style="width:100%; border:none; text-align:center; background:transparent;" value="${v.act_h2 || ''}" /></td>
                    <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px dotted #000; border-bottom: 1px solid #000; padding: 2px;"><input type="number" id="vulc_act_h3" class="form-control" style="width:100%; border:none; text-align:center; background:transparent;" value="${v.act_h3 || ''}" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
        return;
      }

      // 議곗씤??怨듭젙: 議곗씤??怨좊Т LOT 踰덊샇 ?낅젰 + 7. ?ㅻ퉬 媛瑜섏삩??& 媛瑜섏떆媛??낅젰
      const jointLotVal = existingData?.jointRubberLotNo || '';
      const v = existingData?.vulcData || {};
      const v2 = existingData?.vulcData2 || {};
      const curCarCode = carModelValue ? carModelValue.value : currentCarCode;
      const isDtCrew = (curCarCode === 'DT CREW' || curCarCode === 'DT QUAD' || curCarCode === 'DS CREW' || curCarCode === 'DS STD');

      const makeDtCrewVulcTable = (pfx, data, tableNum, fixedSide = '') => `
        <div style="overflow-x: auto; ${tableNum > 1 ? 'margin-top: 16px;' : ''}">
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif; table-layout: fixed;">
            <colgroup>
              <col style="width: 15%;" />
              <col style="width: 10%;" />
              <col style="width: 25%;" />
              <col style="width: 25%;" />
              <col style="width: 25%;" />
            </colgroup>
            <thead>
              <!-- 援щ텇 諛?LH, RH -->
              <tr style="background: #e2e8f0; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px; font-size: 12px;">援щ텇</th>
                <th colspan="3" style="border: 1px solid #000; padding: 6px; font-size: 12px;">
                  ${fixedSide ? `
                    <span style="font-weight: 800; font-size: 13px; color: ${fixedSide === 'LH' ? 'var(--accent-cyan)' : 'var(--accent-emerald)'};">${fixedSide}</span>
                    <input type="hidden" id="${pfx}_${fixedSide.toLowerCase()}_check" value="true" />
                  ` : `
                    <div style="display: flex; justify-content: center; align-items: center; gap: 16px;">
                      <label style="cursor: pointer; display: flex; align-items: center; gap: 4px;">
                        <input type="checkbox" id="${pfx}_lh_check" ${data.lh_check ? 'checked' : ''} style="width: 14px; height: 14px;" /> LH
                      </label>
                      <label style="cursor: pointer; display: flex; align-items: center; gap: 4px;">
                        <input type="checkbox" id="${pfx}_rh_check" ${data.rh_check ? 'checked' : ''} style="width: 14px; height: 14px;" /> RH
                      </label>
                    </div>
                  `}
                </th>
              </tr>
              <!-- 遺??-->
              <tr style="background: #f1f5f9; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">遺??[吏곴컖/?붽컖/吏곸꽑/?붾뱶]</th>
                <th style="border: 1px solid #000; padding: 6px; width: 25%;">R[吏곴컖]</th>
                <th style="border: 1px solid #000; padding: 6px; width: 25%;">S[?붽컖]</th>
                <th style="border: 1px solid #000; padding: 6px; width: 25%;">T[吏곸꽑]</th>
              </tr>
              <!-- 湲덊삎 No. -->
              <tr style="background: #ffffff; font-weight: 700; color: #000;">
                <td colspan="2" style="border: 1px solid #000; padding: 6px; background: #ffffff; font-weight: 700;">湲덊삎 No. [ ?멸린 ]</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_mold_R" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.mold_R || ''}" placeholder="?멸린 ?낅젰" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_mold_S" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.mold_S || ''}" placeholder="?멸린 ?낅젰" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_mold_T" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.mold_T || ''}" placeholder="?멸린 ?낅젰" /></td>
              </tr>
            </thead>
            <tbody>
              <!-- 媛瑜??⑤룄 (???? ?? -->
              <tr>
                <td rowspan="7" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle; width: 18%;">媛瑜??⑤룄<br>[ ???? ??]</td>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #e2e8f0; font-weight: 700; color: #000; width: 14%;">洹?寃?/td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">210 짹 10</td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">210 짹 10</td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">210 짹 10</td>
              </tr>
              <tr>
                <td rowspan="2" style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; vertical-align: middle;">珥?臾?/td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_r_珥??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_r_珥???|| ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_s_珥??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_s_珥???|| ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_t_珥??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_t_珥???|| ''}" /></div></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_r_珥??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_r_珥???|| ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_s_珥??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_s_珥???|| ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_t_珥??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_t_珥???|| ''}" /></div></td>
              </tr>
              <tr>
                <td rowspan="2" style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; vertical-align: middle;">以?臾?/td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_r_以??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_r_以???|| ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_s_以??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_s_以???|| ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_t_以??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_t_以???|| ''}" /></div></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_r_以??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_r_以???|| ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_s_以??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_s_以???|| ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_t_以??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_t_以???|| ''}" /></div></td>
              </tr>
              <tr>
                <td rowspan="2" style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; vertical-align: middle;">醫?臾?/td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_r_醫??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_r_醫???|| ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_s_醫??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_s_醫???|| ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_t_醫??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_t_醫???|| ''}" /></div></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_r_醫??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_r_醫???|| ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_s_醫??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_s_醫???|| ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_t_醫??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_t_醫???|| ''}" /></div></td>
              </tr>

              <!-- 媛瑜??쒓컙 [ 珥?] -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">媛瑜??쒓컙<br>[ 珥?]</td>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #e2e8f0; font-weight: 700; color: #000;">洹?寃?/td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">90 짹 10</td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">90 짹 10</td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">90 짹 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000;">珥?臾?/td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_r_珥? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_r_珥?|| ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_s_珥? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_s_珥?|| ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_t_珥? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_t_珥?|| ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000;">以?臾?/td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_r_以? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_r_以?|| ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_s_以? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_s_以?|| ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_t_以? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_t_以?|| ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000;">醫?臾?/td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_r_醫? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_r_醫?|| ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_s_醫? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_s_醫?|| ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_t_醫? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_t_醫?|| ''}" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;

      const makeDtCrewEndVulcTable = (pfx, data, tableNum) => `
        <div style="overflow-x: auto; ${tableNum > 1 ? 'margin-top: 16px;' : ''}">
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif; table-layout: fixed;">
            <colgroup>
              <col style="width: 14%;" />
              <col style="width: 10%;" />
              <col style="width: 19%;" />
              <col style="width: 19%;" />
              <col style="width: 19%;" />
              <col style="width: 19%;" />
            </colgroup>
            <thead>
              <!-- 遺???붾뱶) -->
              <tr style="background: #f1f5f9; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">遺???붾뱶)</th>
                <th style="border: 1px solid #000; padding: 6px; width: 19%;">1??/th>
                <th style="border: 1px solid #000; padding: 6px; width: 19%;">2??/th>
                <th style="border: 1px solid #000; padding: 6px; width: 19%;">3??/th>
                <th style="border: 1px solid #000; padding: 6px; width: 19%;">4??/th>
              </tr>
              <!-- 湲덊삎 No. -->
              <tr style="background: #ffffff; font-weight: 700; color: #000;">
                <td colspan="2" style="border: 1px solid #000; padding: 6px; background: #ffffff; font-weight: 700;">湲덊삎 No. [ ?멸린 ]</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_mold_1" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.mold_1 ?? data.mold_R ?? ''}" placeholder="?멸린 ?낅젰" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_mold_2" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.mold_2 ?? data.mold_S ?? ''}" placeholder="?멸린 ?낅젰" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_mold_3" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.mold_3 ?? data.mold_T ?? ''}" placeholder="?멸린 ?낅젰" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_mold_4" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.mold_4 ?? ''}" placeholder="?멸린 ?낅젰" /></td>
              </tr>
            </thead>
            <tbody>
              <!-- 媛瑜??⑤룄 (???? ?? -->
              <tr>
                <td rowspan="7" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle; width: 18%;">媛瑜??⑤룄<br>[ ???? ??]</td>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #e2e8f0; font-weight: 700; color: #000; width: 14%;">洹?寃?/td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">210 짹 10</td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">210 짹 10</td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">210 짹 10</td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">210 짹 10</td>
              </tr>
              <tr>
                <td rowspan="2" style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; vertical-align: middle;">珥?臾?/td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_1_珥??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_1_珥????? data.temp_r_珥????? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_2_珥??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_2_珥????? data.temp_s_珥????? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_3_珥??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_3_珥????? data.temp_t_珥????? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_4_珥??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_4_珥????? ''}" /></div></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_1_珥??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_1_珥????? data.temp_r_珥????? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_2_珥??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_2_珥????? data.temp_s_珥????? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_3_珥??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_3_珥????? data.temp_t_珥????? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_4_珥??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_4_珥????? ''}" /></div></td>
              </tr>
              <tr>
                <td rowspan="2" style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; vertical-align: middle;">以?臾?/td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_1_以??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_1_以????? data.temp_r_以????? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_2_以??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_2_以????? data.temp_s_以????? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_3_以??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_3_以????? data.temp_t_以????? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_4_以??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_4_以????? ''}" /></div></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_1_以??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_1_以????? data.temp_r_以????? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_2_以??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_2_以????? data.temp_s_以????? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_3_以??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_3_以????? data.temp_t_以????? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_4_以??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_4_以????? ''}" /></div></td>
              </tr>
              <tr>
                <td rowspan="2" style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; vertical-align: middle;">醫?臾?/td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_1_醫??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_1_醫????? data.temp_r_醫????? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_2_醫??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_2_醫????? data.temp_s_醫????? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_3_醫??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_3_醫????? data.temp_t_醫????? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_4_醫??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_4_醫????? ''}" /></div></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_1_醫??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_1_醫????? data.temp_r_醫????? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_2_醫??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_2_醫????? data.temp_s_醫????? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_3_醫??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_3_醫????? data.temp_t_醫????? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[??</span><input type="text" id="${pfx}_temp_4_醫??? class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_4_醫????? ''}" /></div></td>
              </tr>

              <!-- 媛瑜??쒓컙 [ 珥?] -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">媛瑜??쒓컙<br>[ 珥?]</td>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #e2e8f0; font-weight: 700; color: #000;">洹?寃?/td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">90 짹 10</td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">90 짹 10</td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">90 짹 10</td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">90 짹 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000;">珥?臾?/td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_1_珥? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_1_珥??? data.time_r_珥??? ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_2_珥? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_2_珥??? data.time_s_珥??? ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_3_珥? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_3_珥??? data.time_t_珥??? ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_4_珥? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_4_珥??? ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000;">以?臾?/td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_1_以? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_1_以??? data.time_r_以??? ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_2_以? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_2_以??? data.time_s_以??? ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_3_以? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_3_以??? data.time_t_以??? ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_4_以? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_4_以??? ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000;">醫?臾?/td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_1_醫? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_1_醫??? data.time_r_醫??? ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_2_醫? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_2_醫??? data.time_s_醫??? ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_3_醫? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_3_醫??? data.time_t_醫??? ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_4_醫? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_4_醫??? ''}" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;

      const makeKmKxJointVulcTable = (pfx, data) => `
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif; table-layout: fixed;">
            <colgroup>
              <col style="width: 14%;" />
              <col style="width: 10%;" />
              <col style="width: 19%;" />
              <col style="width: 19%;" />
              <col style="width: 19%;" />
              <col style="width: 19%;" />
            </colgroup>
            <thead>
              <tr style="background: #fffde7; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">援?遺?Division)</th>
                <th colspan="2" style="border: 1px solid #000; padding: 6px; width: 38%;">1??/th>
                <th colspan="2" style="border: 1px solid #000; padding: 6px; width: 38%;">2??/th>
              </tr>
              <tr style="background: #fffde7; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">遺 ??Part)</th>
                <th style="border: 1px solid #000; padding: 6px; width: 19%;">LH</th>
                <th style="border: 1px solid #000; padding: 6px; width: 19%;">RH</th>
                <th style="border: 1px solid #000; padding: 6px; width: 19%;">LH</th>
                <th style="border: 1px solid #000; padding: 6px; width: 19%;">RH</th>
              </tr>
            </thead>
            <tbody>
              <!-- 1. 媛瑜섏삩???곸뿭 -->
              <tr>
                <td rowspan="7" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle; width: 14%;">
                  媛瑜섏삩??br>(Temperature) ??br>(Upper/??DOWN)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; width: 10%;">
                  洹쒓꺽 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 짹 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 짹 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 짹 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 짹 10</td>
              </tr>
              <!-- 珥덈Ъ (???? -->
              <tr>
                <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  珥덈Ъ
                </td>
                <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_start_1_lh_?? class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(??" value="${data.temp_start_1_lh_??|| data.temp_start_1_lh || ''}" /></td>
                <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_start_1_rh_?? class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(??" value="${data.temp_start_1_rh_??|| data.temp_start_1_rh || ''}" /></td>
                <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_start_2_lh_?? class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(??" value="${data.temp_start_2_lh_??|| data.temp_start_2_lh || ''}" /></td>
                <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_start_2_rh_?? class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(??" value="${data.temp_start_2_rh_??|| data.temp_start_2_rh || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_start_1_lh_?? class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(??" value="${data.temp_start_1_lh_??|| ''}" /></td>
                <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_start_1_rh_?? class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(??" value="${data.temp_start_1_rh_??|| ''}" /></td>
                <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_start_2_lh_?? class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(??" value="${data.temp_start_2_lh_??|| ''}" /></td>
                <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_start_2_rh_?? class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(??" value="${data.temp_start_2_rh_??|| ''}" /></td>
              </tr>

              <!-- 以묐Ъ (???? -->
              <tr>
                <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  以묐Ъ
                </td>
                <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_harf_1_lh_?? class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(??" value="${data.temp_harf_1_lh_??|| data.temp_harf_1_lh || ''}" /></td>
                <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_harf_1_rh_?? class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(??" value="${data.temp_harf_1_rh_??|| data.temp_harf_1_rh || ''}" /></td>
                <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_harf_2_lh_?? class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(??" value="${data.temp_harf_2_lh_??|| data.temp_harf_2_lh || ''}" /></td>
                <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_harf_2_rh_?? class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(??" value="${data.temp_harf_2_rh_??|| data.temp_harf_2_rh || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_harf_1_lh_?? class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(??" value="${data.temp_harf_1_lh_??|| ''}" /></td>
                <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_harf_1_rh_?? class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(??" value="${data.temp_harf_1_rh_??|| ''}" /></td>
                <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_harf_2_lh_?? class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(??" value="${data.temp_harf_2_lh_??|| ''}" /></td>
                <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_harf_2_rh_?? class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(??" value="${data.temp_harf_2_rh_??|| ''}" /></td>
              </tr>

              <!-- 醫낅Ъ (???? -->
              <tr>
                <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  醫낅Ъ
                </td>
                <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_finish_1_lh_?? class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(??" value="${data.temp_finish_1_lh_??|| data.temp_finish_1_lh || ''}" /></td>
                <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_finish_1_rh_?? class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(??" value="${data.temp_finish_1_rh_??|| data.temp_finish_1_rh || ''}" /></td>
                <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_finish_2_lh_?? class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(??" value="${data.temp_finish_2_lh_??|| data.temp_finish_2_lh || ''}" /></td>
                <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_finish_2_rh_?? class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(??" value="${data.temp_finish_2_rh_??|| data.temp_finish_2_rh || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_finish_1_lh_?? class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(??" value="${data.temp_finish_1_lh_??|| ''}" /></td>
                <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_finish_1_rh_?? class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(??" value="${data.temp_finish_1_rh_??|| ''}" /></td>
                <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_finish_2_lh_?? class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(??" value="${data.temp_finish_2_lh_??|| ''}" /></td>
                <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_finish_2_rh_?? class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(??" value="${data.temp_finish_2_rh_??|| ''}" /></td>
              </tr>

              <!-- 2. 媛瑜섏떆媛??곸뿭 -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  媛瑜섏떆媛?Time)- 珥?br>(Sec)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  洹쒓꺽 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 짹 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 짹 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 짹 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 짹 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  珥덈Ъ(Start)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_1_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${data.time_start_1_lh || data.time_start_frt_p || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_1_rh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${data.time_start_1_rh || data.time_start_frt_q || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_2_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${data.time_start_2_lh || data.time_start_rr_s_lh || data.time_start_rr_r || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_2_rh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${data.time_start_2_rh || data.time_start_rr_s_rh || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  以묐Ъ(Harf)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_1_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${data.time_harf_1_lh || data.time_harf_frt_p || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_1_rh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${data.time_harf_1_rh || data.time_harf_frt_q || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_2_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${data.time_harf_2_lh || data.time_harf_rr_s_lh || data.time_harf_rr_r || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_2_rh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${data.time_harf_2_rh || data.time_harf_rr_s_rh || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  醫낅Ъ(Finish)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_finish_1_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${data.time_finish_1_lh || data.time_finish_frt_p || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_finish_1_rh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${data.time_finish_1_rh || data.time_finish_frt_q || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_finish_2_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${data.time_finish_2_lh || data.time_finish_rr_s_lh || data.time_finish_rr_r || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_finish_2_rh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${data.time_finish_2_rh || data.time_finish_rr_s_rh || ''}" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;

      const formCode = getCurrentFormCode();
      let vulcTableHTML = '';
      if (formCode === 4012) {
        vulcTableHTML = `
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">援?遺?Division)</th>
                <th style="border: 1px solid #000; padding: 6px; width: 72%;">Frunk</th>
              </tr>
              <tr style="background: #fffde7; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">遺 ??Part)</th>
                <th style="border: 1px solid #000; padding: 6px; width: 72%;">?댁쑖李??곌껐遺遺?/th>
              </tr>
            </thead>
            <tbody>
              <!-- 1. 媛瑜섏삩???곸뿭 -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle; width: 14%;">
                  媛瑜섏삩??br>(Temperature) ??br>(Upper/??DOWN)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; width: 14%;">
                  洹쒓꺽 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 짹 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  珥덈Ъ(Start)
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; gap: 4px;">
                    <input type="text" id="vulc_temp_start_frt_p_?? class="form-control" style="flex: 1; height: 24px; text-align: center; font-size: 11px; padding: 2px;" placeholder="(??" value="${v.temp_start_frt_p_???? v.temp_start_frt_p ?? ''}" />
                    <input type="text" id="vulc_temp_start_frt_p_?? class="form-control" style="flex: 1; height: 24px; text-align: center; font-size: 11px; padding: 2px;" placeholder="(??" value="${v.temp_start_frt_p_???? ''}" />
                  </div>
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  以묐Ъ(Harf)
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; gap: 4px;">
                    <input type="text" id="vulc_temp_harf_frt_p_?? class="form-control" style="flex: 1; height: 24px; text-align: center; font-size: 11px; padding: 2px;" placeholder="(??" value="${v.temp_harf_frt_p_???? v.temp_harf_frt_p ?? ''}" />
                    <input type="text" id="vulc_temp_harf_frt_p_?? class="form-control" style="flex: 1; height: 24px; text-align: center; font-size: 11px; padding: 2px;" placeholder="(??" value="${v.temp_harf_frt_p_???? ''}" />
                  </div>
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  醫낅Ъ(Finish)
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; gap: 4px;">
                    <input type="text" id="vulc_temp_finish_frt_p_?? class="form-control" style="flex: 1; height: 24px; text-align: center; font-size: 11px; padding: 2px;" placeholder="(??" value="${v.temp_finish_frt_p_???? v.temp_finish_frt_p ?? ''}" />
                    <input type="text" id="vulc_temp_finish_frt_p_?? class="form-control" style="flex: 1; height: 24px; text-align: center; font-size: 11px; padding: 2px;" placeholder="(??" value="${v.temp_finish_frt_p_???? ''}" />
                  </div>
                </td>
              </tr>

              <!-- 2. 媛瑜섏떆媛??곸뿭 -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  媛瑜섏떆媛?Time)- 珥?br>(Sec)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  洹쒓꺽 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 짹 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  珥덈Ъ(Start)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_frt_p || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  以묐Ъ(Harf)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_frt_p || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  醫낅Ъ(Finish)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_finish_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_finish_frt_p || ''}" /></td>
              </tr>
            </tbody>
          </table>
        </div>
        `;
      } else if (formCode === 2042) {
        vulcTableHTML = makeKmKxJointVulcTable('vulc', v);
      } else if (formCode === 2025) {
        vulcTableHTML = makeDtCrewEndVulcTable('vulc', v, 1);
      } else if (formCode === 2013) {
        vulcTableHTML = makeDtCrewVulcTable('vulc', v, 1, 'LH') + makeDtCrewVulcTable('vulc2', v2, 2, 'RH');
      } else if (isDtCrew) {
        vulcTableHTML = makeDtCrewVulcTable('vulc', v, 1) + makeDtCrewVulcTable('vulc2', v2, 2);
      } else if (formCode === 4002) {
        vulcTableHTML = `
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">援?遺?Division)</th>
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">LH</th>
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">RH</th>
              </tr>
              <tr style="background: #fffde7; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">遺 ??Part)</th>
                <th style="border: 1px solid #000; padding: 6px; width: 16%;">X遺</th>
                <th style="border: 1px solid #000; padding: 6px; width: 16%;">Y遺</th>
                <th style="border: 1px solid #000; padding: 6px; width: 16%;">X遺</th>
                <th style="border: 1px solid #000; padding: 6px; width: 16%;">Y遺</th>
              </tr>
            </thead>
            <tbody>
              <!-- 1. 媛瑜섏삩???곸뿭 -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  媛瑜섏삩??br>(Temperature) ??br>(Upper/??DOWN)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  洹쒓꺽 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 짹 10</td>
                
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 짹 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 짹 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 짹 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  珥덈Ъ(Start)
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
      <input type="text" id="vulc_temp_start_frt_p_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_frt_p_??|| '200'}" readonly />
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
      <input type="text" id="vulc_temp_start_frt_p_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_frt_p_??|| '200'}" readonly />
    </div>
  </td>
                <td style="border: 1px solid #000; padding: 2px;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
      <input type="text" id="vulc_temp_start_frt_q_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_frt_q_??|| '200'}" readonly />
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
      <input type="text" id="vulc_temp_start_frt_q_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_frt_q_??|| '200'}" readonly />
    </div>
  </td>
                <td style="border: 1px solid #000; padding: 2px;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
      <input type="text" id="vulc_temp_start_rr_r_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_rr_r_??|| '200'}" readonly />
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
      <input type="text" id="vulc_temp_start_rr_r_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_rr_r_??|| '200'}" readonly />
    </div>
  </td>
                <td style="border: 1px solid #000; padding: 2px;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
      <input type="text" id="vulc_temp_start_rr_s_lh_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_rr_s_lh_??|| '200'}" readonly />
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
      <input type="text" id="vulc_temp_start_rr_s_lh_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_rr_s_lh_??|| '200'}" readonly />
    </div>
  </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  以묐Ъ(Harf)
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
      <input type="text" id="vulc_temp_harf_frt_p_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_frt_p_??|| '200'}" readonly />
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
      <input type="text" id="vulc_temp_harf_frt_p_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_frt_p_??|| '200'}" readonly />
    </div>
  </td>
                <td style="border: 1px solid #000; padding: 2px;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
      <input type="text" id="vulc_temp_harf_frt_q_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_frt_q_??|| '200'}" readonly />
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
      <input type="text" id="vulc_temp_harf_frt_q_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_frt_q_??|| '200'}" readonly />
    </div>
  </td>
                <td style="border: 1px solid #000; padding: 2px;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
      <input type="text" id="vulc_temp_harf_rr_r_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_rr_r_??|| '200'}" readonly />
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
      <input type="text" id="vulc_temp_harf_rr_r_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_rr_r_??|| '200'}" readonly />
    </div>
  </td>
                <td style="border: 1px solid #000; padding: 2px;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
      <input type="text" id="vulc_temp_harf_rr_s_lh_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_rr_s_lh_??|| '200'}" readonly />
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
      <input type="text" id="vulc_temp_harf_rr_s_lh_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_rr_s_lh_??|| '200'}" readonly />
    </div>
  </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  醫낅Ъ(Finish)
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
      <input type="text" id="vulc_temp_finish_frt_p_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_frt_p_??|| '200'}" readonly />
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
      <input type="text" id="vulc_temp_finish_frt_p_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_frt_p_??|| '200'}" readonly />
    </div>
  </td>
                <td style="border: 1px solid #000; padding: 2px;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
      <input type="text" id="vulc_temp_finish_frt_q_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_frt_q_??|| '200'}" readonly />
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
      <input type="text" id="vulc_temp_finish_frt_q_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_frt_q_??|| '200'}" readonly />
    </div>
  </td>
                <td style="border: 1px solid #000; padding: 2px;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
      <input type="text" id="vulc_temp_finish_rr_r_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_rr_r_??|| '200'}" readonly />
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
      <input type="text" id="vulc_temp_finish_rr_r_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_rr_r_??|| '200'}" readonly />
    </div>
  </td>
                <td style="border: 1px solid #000; padding: 2px;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
      <input type="text" id="vulc_temp_finish_rr_s_lh_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_rr_s_lh_??|| '200'}" readonly />
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
      <input type="text" id="vulc_temp_finish_rr_s_lh_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_rr_s_lh_??|| '200'}" readonly />
    </div>
  </td>
              </tr>

              <!-- 2. 媛瑜섏떆媛??곸뿭 -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  媛瑜섏떆媛?Time)- 珥?br>(Sec)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  洹쒓꺽 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 짹 10</td>
                
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 짹 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 짹 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 짹 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  珥덈Ъ(Start)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_frt_p || '90'}" readonly /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_frt_q" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_frt_q || '90'}" readonly /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_rr_r" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_rr_r || '90'}" readonly /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_rr_s_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_rr_s_lh || '90'}" readonly /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  以묐Ъ(Harf)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_frt_p || '90'}" readonly /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_frt_q" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_frt_q || '90'}" readonly /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_rr_r" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_rr_r || '90'}" readonly /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_rr_s_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_rr_s_lh || '90'}" readonly /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  醫낅Ъ(Finish)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_finish_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_finish_frt_p || '90'}" readonly /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_finish_frt_q" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_finish_frt_q || '90'}" readonly /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_finish_rr_r" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_finish_rr_r || '90'}" readonly /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_finish_rr_s_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_finish_rr_s_lh || '90'}" readonly /></td>
              </tr>
            </tbody>
          </table>
        </div>
        `;
      
      } else if (formCode === 1002 || formCode === 1032) {
        vulcTableHTML = `
        <div style="overflow-x: auto; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">援щ텇 (FRT)</th>
                <th style="border: 1px solid #000; padding: 6px; width: 33%;">FRT(P)_L/R</th>
                <th style="border: 1px solid #000; padding: 6px; width: 33%;">FRT(Q)_L/R</th>
              </tr>
            </thead>
            <tbody>
              <!-- 1. 媛瑜섏삩???곸뿭 -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  媛瑜섏삩??br>(Temperature) ??br>(Upper/??DOWN)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  洹쒓꺽 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 짹 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 짹 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">珥덈Ъ(Start)</td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_start_frt_p_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_frt_p_??|| '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_start_frt_p_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_frt_p_??|| '200'}" readonly />
                  </div>
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_start_frt_q_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_frt_q_??|| '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_start_frt_q_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_frt_q_??|| '200'}" readonly />
                  </div>
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">以묐Ъ(Harf)</td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_harf_frt_p_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_frt_p_??|| '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_harf_frt_p_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_frt_p_??|| '200'}" readonly />
                  </div>
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_harf_frt_q_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_frt_q_??|| '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_harf_frt_q_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_frt_q_??|| '200'}" readonly />
                  </div>
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">醫낅Ъ(Finish)</td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_finish_frt_p_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_frt_p_??|| '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_finish_frt_p_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_frt_p_??|| '200'}" readonly />
                  </div>
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_finish_frt_q_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_frt_q_??|| '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_finish_frt_q_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_frt_q_??|| '200'}" readonly />
                  </div>
                </td>
              </tr>

              <!-- 2. 媛瑜섏떆媛??곸뿭 -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  媛瑜섏떆媛?Time)- 珥?br>(Sec)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  洹쒓꺽 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 짹 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 짹 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">珥덈Ъ(Start)</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_frt_p || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_frt_q" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_frt_q || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">以묐Ъ(Harf)</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_frt_p || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_frt_q" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_frt_q || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">醫낅Ъ(Finish)</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_finish_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_finish_frt_p || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_finish_frt_q" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_finish_frt_q || ''}" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">援щ텇 (RR)</th>
                <th style="border: 1px solid #000; padding: 6px; width: 22%;">RR(R)_L/R</th>
                <th style="border: 1px solid #000; padding: 6px; width: 22%;">RR(S)_LH</th>
                <th style="border: 1px solid #000; padding: 6px; width: 22%;">RR(S)_RH</th>
              </tr>
            </thead>
            <tbody>
              <!-- 1. 媛瑜섏삩???곸뿭 -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  媛瑜섏삩??br>(Temperature) ??br>(Upper/??DOWN)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  洹쒓꺽 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 짹 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 짹 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 짹 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">珥덈Ъ(Start)</td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_start_rr_r_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_rr_r_??|| '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_start_rr_r_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_rr_r_??|| '200'}" readonly />
                  </div>
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_start_rr_s_lh_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_rr_s_lh_??|| '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_start_rr_s_lh_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_rr_s_lh_??|| '200'}" readonly />
                  </div>
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_start_rr_s_rh_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_rr_s_rh_??|| '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_start_rr_s_rh_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_rr_s_rh_??|| '200'}" readonly />
                  </div>
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">以묐Ъ(Harf)</td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_harf_rr_r_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_rr_r_??|| '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_harf_rr_r_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_rr_r_??|| '200'}" readonly />
                  </div>
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_harf_rr_s_lh_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_rr_s_lh_??|| '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_harf_rr_s_lh_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_rr_s_lh_??|| '200'}" readonly />
                  </div>
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_harf_rr_s_rh_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_rr_s_rh_??|| '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_harf_rr_s_rh_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_rr_s_rh_??|| '200'}" readonly />
                  </div>
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">醫낅Ъ(Finish)</td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_finish_rr_r_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_rr_r_??|| '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_finish_rr_r_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_rr_r_??|| '200'}" readonly />
                  </div>
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_finish_rr_s_lh_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_rr_s_lh_??|| '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_finish_rr_s_lh_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_rr_s_lh_??|| '200'}" readonly />
                  </div>
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_finish_rr_s_rh_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_rr_s_rh_??|| '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_finish_rr_s_rh_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_rr_s_rh_??|| '200'}" readonly />
                  </div>
                </td>
              </tr>
              
              <!-- 2. 媛瑜섏떆媛??곸뿭 -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  媛瑜섏떆媛?Time)- 珥?br>(Sec)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  洹쒓꺽 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 짹 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 짹 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 짹 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">珥덈Ъ(Start)</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_rr_r" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_rr_r || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_rr_s_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_rr_s_lh || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_rr_s_rh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_rr_s_rh || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">以묐Ъ(Harf)</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_rr_r" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_rr_r || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_rr_s_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_rr_s_lh || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_rr_s_rh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_rr_s_rh || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">醫낅Ъ(Finish)</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_finish_rr_r" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_finish_rr_r || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_finish_rr_s_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_finish_rr_s_lh || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_finish_rr_s_rh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_finish_rr_s_rh || ''}" /></td>
              </tr>
            </tbody>
          </table>
        </div>
        `;
} else if (formCode === 1011) {
        vulcTableHTML = `
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">援?遺?Division)</th>
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">RR C PART'G</th>
              </tr>
              <tr style="background: #fffde7; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">遺 ??Part)</th>
                <th style="border: 1px solid #000; padding: 6px; width: 40%;">LH</th>
                <th style="border: 1px solid #000; padding: 6px; width: 40%;">RH</th>
              </tr>
            </thead>
            <tbody>
              <!-- 1. 媛瑜섏삩???곸뿭 -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  媛瑜섏삩??br>(Temperature) ??br>(Upper/??DOWN)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  洹쒓꺽 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 짹 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 짹 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  珥덈Ъ(Start)
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_start_frt_p_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_frt_p_???? v.temp_start_frt_p ?? ''}" />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_start_frt_p_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_frt_p_???? ''}" />
                  </div>
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_start_frt_q_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_frt_q_???? v.temp_start_frt_q ?? ''}" />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_start_frt_q_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_frt_q_???? ''}" />
                  </div>
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  以묐Ъ(Harf)
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_harf_frt_p_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_frt_p_???? v.temp_harf_frt_p ?? ''}" />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_harf_frt_p_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_frt_p_???? ''}" />
                  </div>
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_harf_frt_q_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_frt_q_???? v.temp_harf_frt_q ?? ''}" />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_harf_frt_q_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_frt_q_???? ''}" />
                  </div>
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  醫낅Ъ(Finish)
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_finish_frt_p_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_frt_p_???? v.temp_finish_frt_p ?? ''}" />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_finish_frt_p_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_frt_p_???? ''}" />
                  </div>
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_finish_frt_q_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_frt_q_???? v.temp_finish_frt_q ?? ''}" />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(??</span>
                    <input type="text" id="vulc_temp_finish_frt_q_?? class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_frt_q_???? ''}" />
                  </div>
                </td>
              </tr>

              <!-- 2. 媛瑜섏떆媛??곸뿭 -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  媛瑜섏떆媛?Time)- 珥?br>(Sec)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  洹쒓꺽 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 짹 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 짹 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  珥덈Ъ(Start)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_frt_p || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_frt_q" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_frt_q || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  以묐Ъ(Harf)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_frt_p || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_frt_q" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_frt_q || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  醫낅Ъ(Finish)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_finish_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_finish_frt_p || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_finish_frt_q" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_finish_frt_q || ''}" /></td>
              </tr>
            </tbody>
          </table>
        </div>
        `;
      
      } else {
        vulcTableHTML = `
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">援?遺?Division)</th>
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">FRT</th>
                <th colspan="3" style="border: 1px solid #000; padding: 6px;">RR</th>
              </tr>
              <tr style="background: #fffde7; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">遺 ??Part)</th>
                <th style="border: 1px solid #000; padding: 6px; width: 16%;">FRT(P)_L/R</th>
                <th style="border: 1px solid #000; padding: 6px; width: 16%;">FRT(Q)_L/R</th>
                <th style="border: 1px solid #000; padding: 6px; width: 16%;">RR(R)_L/R</th>
                <th style="border: 1px solid #000; padding: 6px; width: 16%;">RR(S)_LH</th>
                <th style="border: 1px solid #000; padding: 6px; width: 16%;">RR(S)_RH</th>
              </tr>
            </thead>
            <tbody>
              <!-- 1. 媛瑜섏삩???곸뿭 -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  媛瑜섏삩??br>(Temperature) ??br>(Upper/??DOWN)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  洹쒓꺽 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 짹 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 짹 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 짹 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 짹 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 짹 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  珥덈Ъ(Start)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_start_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_start_frt_p || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_start_frt_q" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_start_frt_q || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_start_rr_r" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_start_rr_r || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_start_rr_s_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_start_rr_s_lh || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_start_rr_s_rh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_start_rr_s_rh || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  以묐Ъ(Harf)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_harf_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_harf_frt_p || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_harf_frt_q" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_harf_frt_q || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_harf_rr_r" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_harf_rr_r || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_harf_rr_s_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_harf_rr_s_lh || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_harf_rr_s_rh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_harf_rr_s_rh || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  醫낅Ъ(Finish)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_finish_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_finish_frt_p || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_finish_frt_q" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_finish_frt_q || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_finish_rr_r" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_finish_rr_r || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_finish_rr_s_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_finish_rr_s_lh || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_finish_rr_s_rh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_finish_rr_s_rh || ''}" /></td>
              </tr>

              <!-- 2. 媛瑜섏떆媛??곸뿭 -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  媛瑜섏떆媛?Time)- 珥?br>(Sec)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  洹쒓꺽 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 짹 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 짹 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 짹 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 짹 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 짹 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  珥덈Ъ(Start)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_frt_p || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_frt_q" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_frt_q || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_rr_r" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_rr_r || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_rr_s_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_rr_s_lh || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_rr_s_rh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_rr_s_rh || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  以묐Ъ(Harf)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_frt_p || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_frt_q" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_frt_q || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_rr_r" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_rr_r || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_rr_s_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_rr_s_lh || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_rr_s_rh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_rr_s_rh || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  醫낅Ъ(Finish)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_finish_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_finish_frt_p || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_finish_frt_q" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_finish_frt_q || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_finish_rr_r" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_finish_rr_r || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_finish_rr_s_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_finish_rr_s_lh || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_finish_rr_s_rh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_finish_rr_s_rh || ''}" /></td>
              </tr>
            </tbody>
          </table>
        </div>
        `;
      }

      const dimCardForQuad = '';

      section5.innerHTML = `
        ${dimCardForQuad}
        <div class="card" style="padding: 16px; margin-bottom: 16px;">
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 6px; display: block;">
            ?뵕 <span class="sec-num"></span> 議곗씤??怨좊Т LOT 踰덊샇 ?낅젰
          </label>
          <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 10px;">議곗씤??怨좊Т ?뚯옱??LOT 踰덊샇瑜??낅젰?섏꽭??</p>
          <input type="text" id="jointRubberLotNo" class="form-control lot-datetime-input"
            style="max-width: 280px; font-family: monospace;"
            placeholder="?꾩썡?쇱떆遺?(?? 2607251330)"
            value="${jointLotVal}" />
        </div>

        <div class="card" style="padding: 16px; margin-bottom: 16px;">
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
            ?⑨툘 <span class="sec-num"></span> ?ㅻ퉬 媛瑜섏삩??& 媛瑜섏떆媛??낅젰
          </label>
          ${vulcTableHTML}
        </div>
      `;
      // blur ?대깽??諛붿씤??      const jointInput = section5.querySelector('#jointRubberLotNo');
      if (jointInput) {
        jointInput.addEventListener('blur', () => {
          if (jointInput.value) jointInput.value = autoFormatDateTimeString(jointInput.value);
        });
        jointInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') jointInput.value = autoFormatDateTimeString(jointInput.value);
        });
      }

      if (formCode === 4012) {
        bindNumberWheelPicker(section5.querySelector('#vulc_temp_start_frt_p_??), '珥덈Ъ 媛瑜섏삩??(??', 200, 30, '??);
        bindNumberWheelPicker(section5.querySelector('#vulc_temp_start_frt_p_??), '珥덈Ъ 媛瑜섏삩??(??', 200, 30, '??);
        bindNumberWheelPicker(section5.querySelector('#vulc_temp_harf_frt_p_??), '以묐Ъ 媛瑜섏삩??(??', 200, 30, '??);
        bindNumberWheelPicker(section5.querySelector('#vulc_temp_harf_frt_p_??), '以묐Ъ 媛瑜섏삩??(??', 200, 30, '??);
        bindNumberWheelPicker(section5.querySelector('#vulc_temp_finish_frt_p_??), '醫낅Ъ 媛瑜섏삩??(??', 200, 30, '??);
        bindNumberWheelPicker(section5.querySelector('#vulc_temp_finish_frt_p_??), '醫낅Ъ 媛瑜섏삩??(??', 200, 30, '??);

        bindNumberWheelPicker(section5.querySelector('#vulc_time_start_frt_p'), '珥덈Ъ 媛瑜섏떆媛?, 90, 30, '珥?);
        bindNumberWheelPicker(section5.querySelector('#vulc_time_harf_frt_p'), '以묐Ъ 媛瑜섏떆媛?, 90, 30, '珥?);
        bindNumberWheelPicker(section5.querySelector('#vulc_time_finish_frt_p'), '醫낅Ъ 媛瑜섏떆媛?, 90, 30, '珥?);
      }
     else if (formCode === 4002) {
        const phases = [{k:'start', n:'珥덈Ъ'}, {k:'harf', n:'以묐Ъ'}, {k:'finish', n:'醫낅Ъ'}];
        const cols = [{k:'frt_p', n:'LH X遺'}, {k:'frt_q', n:'LH Y遺'}, {k:'rr_r', n:'RH X遺'}, {k:'rr_s_lh', n:'RH Y遺'}];
        phases.forEach(p => {
          cols.forEach(c => {
            ['??, '??].forEach(pos => {
              const el = section5.querySelector('#vulc_temp_' + p.k + '_' + c.k + '_' + pos);
              if (el) bindNumberWheelPicker(el, p.n + ' 媛瑜섏삩??' + c.n + ' (' + pos + ')', 200, 30, '??);
            });
            const timeEl = section5.querySelector('#vulc_time_' + p.k + '_' + c.k);
            if (timeEl) bindNumberWheelPicker(timeEl, p.n + ' 媛瑜섏떆媛?' + c.n, 90, 30, '珥?);
          });
        });
      }
    } else if (curProc === '?뚯옱以鍮? || curProc.startsWith('?뚯옱以鍮?)) {
      if (formCode === 1021) {
        const d = existingData?.dimData || {};
        section5.innerHTML = `
          <div class="card" style="padding: 16px; margin-bottom: 16px;">
            <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
              ?뱪 <span class="sec-num"></span> 移섏닔?뺤씤
            </label>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #fffde7; font-weight: 700; color: #000;">
                    <th colspan="2" style="border: 1px solid #000; padding: 6px;">援?遺?Division)</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 60%;">PTG</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                      ?뺤튂?덈떒湲몄씠<br>(Spec Cutt,g )
                    </td>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">洹쒓꺽 (Spec)</td>
                    <td style="border: 1px solid #000; font-weight: 700; padding: 4px; background: #ffffff;">326 짹 2mm</td>
                  </tr>
                  <tr>
                    <td rowspan="3" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                      ?ㅼ륫(Act) (珥?以?醫?
                    </td>
                    <td style="border: 1px solid #000; padding: 4px; text-align: left; background: #ffffff;">
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-weight: 700; width: 24px; text-align: center;">(珥?</span>
                        <input type="text" id="dim_ptg_act_珥? class="form-control" style="flex: 1; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center; padding: 4px;" placeholder="326" value="${d['ptg_act_珥?] || ''}" />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 4px; text-align: left; background: #ffffff;">
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-weight: 700; width: 24px; text-align: center;">(以?</span>
                        <input type="text" id="dim_ptg_act_以? class="form-control" style="flex: 1; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center; padding: 4px;" placeholder="326" value="${d['ptg_act_以?] || ''}" />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 4px; text-align: left; background: #ffffff;">
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-weight: 700; width: 24px; text-align: center;">(醫?</span>
                        <input type="text" id="dim_ptg_act_醫? class="form-control" style="flex: 1; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center; padding: 4px;" placeholder="326" value="${d['ptg_act_醫?] || ''}" />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
        return;
      }

      // ?뚯옱以鍮?怨듭젙: 移섏닔?뺤씤 ?낅젰 ?묒떇 (?ъ쭊 ?쒖? ?숈씪 ?묒떇 ?곸슜)
      const d = existingData?.dimData || {};
      const curCarCode = carModelValue ? carModelValue.value : currentCarCode;
      const curPart = partValueInput ? partValueInput.value : '';

      const formCode = getCurrentFormCode();
      const isDtCrew = (curCarCode === 'DT CREW' || curCarCode === 'DT QUAD' || curCarCode === 'DS CREW' || curCarCode === 'DS STD');
      const dtLenSpec = (formCode === 2023) ? '475 짹 5' : ((curCarCode === 'DT QUAD') ? '509 짹 5' : '779 짹 5');
      const dtStep2Spec = (formCode === 2023) ? '40 짹 1' : '28 짹 1';
      const dtStep3Spec = (formCode === 2023) ? '26 짹 1' : '28 짹 1';
      const dimImgSrc = (formCode === 2023) ? 'images/ds_crew_prep_d_dimension.png' : 'images/dt_crew_dimension.png';
      const dimImgMaxWidth = (formCode === 2023) ? '320px' : '650px';
      const dtRowSpan = (formCode === 2023) ? 3 : 4;
      const renderDtRow4 = (pos) => (formCode === 2023) ? '' : `
                  <tr>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">??/td>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">93 짹 0.5</td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_${pos}_4_LH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_' + pos + '_4_LH'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_${pos}_4_RH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_' + pos + '_4_RH'] || ''}" /></td>
                  </tr>
      `;

      if (isDtCrew) {
        section5.innerHTML = `
          <div class="card" style="padding: 16px; margin-bottom: 16px;">
            <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
              ?뱪 <span class="sec-num"></span> 移섏닔?뺤씤
            </label>
            <div style="max-width: ${dimImgMaxWidth}; margin: 0 auto 14px auto;">
              <img src="${dimImgSrc}" alt="${curCarCode} D/SIDE 移섏닔?뺤씤 ?꾨㈃" style="width: 100%; height: auto; display: block; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);" />
            </div>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #ffffff; font-weight: 700;">
                    <th style="border: 1px solid #000; padding: 6px 2px; width: 15%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">援щ텇</th>
                    <th style="border: 1px solid #000; padding: 6px 2px; width: 12%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">?꾩튂</th>
                    <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">?ㅽ럺(mm)</th>
                    <th style="border: 1px solid #000; padding: 6px 2px; width: 24%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">LH</th>
                    <th style="border: 1px solid #000; padding: 6px 2px; width: 24%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">RH</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- 珥덈Ъ -->
                  <tr>
                    <td rowspan="${dtRowSpan}" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">珥덈Ъ</td>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">??/td>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">${dtLenSpec}</td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_珥?1_LH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_珥?1_LH'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_珥?1_RH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_珥?1_RH'] || ''}" /></td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">??/td>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">${dtStep2Spec}</td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_珥?2_LH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_珥?2_LH'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_珥?2_RH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_珥?2_RH'] || ''}" /></td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">??/td>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">${dtStep3Spec}</td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_珥?3_LH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_珥?3_LH'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_珥?3_RH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_珥?3_RH'] || ''}" /></td>
                  </tr>
${renderDtRow4('珥?)}

                  <!-- 以묐Ъ -->
                  <tr>
                    <td rowspan="${dtRowSpan}" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">以묐Ъ</td>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">??/td>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">${dtLenSpec}</td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_以?1_LH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_以?1_LH'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_以?1_RH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_以?1_RH'] || ''}" /></td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">??/td>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">${dtStep2Spec}</td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_以?2_LH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_以?2_LH'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_以?2_RH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_以?2_RH'] || ''}" /></td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">??/td>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">${dtStep3Spec}</td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_以?3_LH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_以?3_LH'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_以?3_RH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_以?3_RH'] || ''}" /></td>
                  </tr>
${renderDtRow4('以?)}

                  <!-- 醫낅Ъ -->
                  <tr>
                    <td rowspan="${dtRowSpan}" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">醫낅Ъ</td>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">??/td>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">${dtLenSpec}</td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_醫?1_LH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_醫?1_LH'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_醫?1_RH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_醫?1_RH'] || ''}" /></td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">??/td>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">${dtStep2Spec}</td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_醫?2_LH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_醫?2_LH'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_醫?2_RH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_醫?2_RH'] || ''}" /></td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">??/td>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">${dtStep3Spec}</td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_醫?3_LH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_醫?3_LH'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_醫?3_RH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_醫?3_RH'] || ''}" /></td>
                  </tr>
${renderDtRow4('醫?)}
                </tbody>
              </table>
            </div>
          </div>
        `;
        return;
      }

      const isJg1Inbelt = (curCarCode === 'JG1' || curCarCode === 'JG1S' || (currentMakerName && currentMakerName.includes('?쒕꽕?쒖뒪'))) &&
                          (curPart === '?몃꺼?? || !curPart || curPart === '');

      // const diagramHTML = isJg1Inbelt ? `
      //   <div style="max-width: 650px; margin: 14px auto 0 auto;">
      //     <img src="images/jg1_inbelt_dimension.png" alt="JG1 ?몃꺼??移섏닔?뺤씤 ?꾨㈃" style="width: 100%; height: auto; display: block; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);" />
      //   </div>
      // ` : '';
      const diagramHTML = '';

      
      if (formCode === 1001 || formCode === 1031) {
        section5.innerHTML = `
          <div class="card" style="padding: 16px; margin-bottom: 16px;">
            <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
              ?뱪 <span class="sec-num"></span> 移섏닔?뺤씤 (FRT)
            </label>
            <div style="overflow-x: auto; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #fffde7; font-weight: 700; color: #000;">
                    <th colspan="3" style="border: 1px solid #000; padding: 6px; width: 40%;">援?遺?Division)</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 30%;">FRT LH</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 30%;">FRT RH</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- 1. ?뺤튂?덈떒湲몄씠 -->
                  <tr>
                    <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                      ?뺤튂?덈떒湲몄씠<br>(Spec Cutt,g )
                    </td>
                    <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      洹쒓꺽 (Spec)
                    </td>
                    <td colspan="2" style="border: 1px solid #000; font-weight: 700; padding: 4px;">
                      745 짹 1mm
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      ?ㅼ륫(Act) <span style="font-size: 9px; font-weight: normal;">(珥?以?醫?</span>
                    </td>
                    <td colspan="2" style="border: 1px solid #000; padding: 3px 2px;">
                      <div style="display: flex; align-items: center; justify-content: space-around; gap: 2px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700;">(珥?</span>
                        <input type="text" id="dim_cut_FRT_珥? class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_珥?] || ''}" />
                        <span style="font-size: 10px; color: #333; font-weight: 700;">(以?</span>
                        <input type="text" id="dim_cut_FRT_以? class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_以?] || ''}" />
                        <span style="font-size: 10px; color: #333; font-weight: 700;">(醫?</span>
                        <input type="text" id="dim_cut_FRT_醫? class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_醫?] || ''}" />
                      </div>
                    </td>
                  </tr>

                  <!-- 2. ?⑥뻔??(Step cutt,g) - ?꾨갑 & ?꾨갑 -->
                  <tr>
                    <td rowspan="8" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                      ?⑥뻔??br>(Step cutt,g)
                    </td>
                    <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                      ?꾨갑
                    </td>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      洹쒓꺽(Spec)
                    </td>
                    <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">36</td>
                    <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">36</td>
                  </tr>
                  <tr>
                    <td rowspan="3" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                      ?ㅼ륫(Act)
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                        <span style="font-size: 9px; color: #555; font-weight: 700;">(珥?</span>
                        <input type="text" id="dim_step_f_珥?FL" class="form-control" style="width: 70%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_珥?FL'] || ''}" />
                      </div>
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_f_珥?FR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_珥?FR'] || ''}" />
                    </td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                        <span style="font-size: 9px; color: #555; font-weight: 700;">(以?</span>
                        <input type="text" id="dim_step_f_以?FL" class="form-control" style="width: 70%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_以?FL'] || ''}" />
                      </div>
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_f_以?FR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_以?FR'] || ''}" />
                    </td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                        <span style="font-size: 9px; color: #555; font-weight: 700;">(醫?</span>
                        <input type="text" id="dim_step_f_醫?FL" class="form-control" style="width: 70%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_醫?FL'] || ''}" />
                      </div>
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_f_醫?FR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_醫?FR'] || ''}" />
                    </td>
                  </tr>
                  
                  <!-- ?꾨갑 -->
                  <tr>
                    <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                      ?꾨갑
                    </td>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      洹쒓꺽(Spec)
                    </td>
                    <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">28</td>
                    <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">28</td>
                  </tr>
                  <tr>
                    <td rowspan="3" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                      ?ㅼ륫(Act)
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                        <span style="font-size: 9px; color: #555; font-weight: 700;">(珥?</span>
                        <input type="text" id="dim_step_r_珥?FL" class="form-control" style="width: 70%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_珥?FL'] || ''}" />
                      </div>
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_r_珥?FR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_珥?FR'] || ''}" />
                    </td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                        <span style="font-size: 9px; color: #555; font-weight: 700;">(以?</span>
                        <input type="text" id="dim_step_r_以?FL" class="form-control" style="width: 70%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_以?FL'] || ''}" />
                      </div>
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_r_以?FR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_以?FR'] || ''}" />
                    </td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                        <span style="font-size: 9px; color: #555; font-weight: 700;">(醫?</span>
                        <input type="text" id="dim_step_r_醫?FL" class="form-control" style="width: 70%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_醫?FL'] || ''}" />
                      </div>
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_r_醫?FR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_醫?FR'] || ''}" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
              ?뱪 <span class="sec-num"></span> 移섏닔?뺤씤 (RR)
            </label>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #fffde7; font-weight: 700; color: #000;">
                    <th colspan="3" style="border: 1px solid #000; padding: 6px; width: 40%;">援?遺?Division)</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 30%;">RR LH</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 30%;">RR RH</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- 1. ?뺤튂?덈떒湲몄씠 -->
                  <tr>
                    <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                      ?뺤튂?덈떒湲몄씠<br>(Spec Cutt,g )
                    </td>
                    <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      洹쒓꺽 (Spec)
                    </td>
                    <td colspan="2" style="border: 1px solid #000; font-weight: 700; padding: 4px;">
                      687 짹 1mm
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      ?ㅼ륫(Act) <span style="font-size: 9px; font-weight: normal;">(珥?以?醫?</span>
                    </td>
                    <td colspan="2" style="border: 1px solid #000; padding: 3px 2px;">
                      <div style="display: flex; align-items: center; justify-content: space-around; gap: 2px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700;">(珥?</span>
                        <input type="text" id="dim_cut_RR_珥? class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_RR_珥?] || ''}" />
                        <span style="font-size: 10px; color: #333; font-weight: 700;">(以?</span>
                        <input type="text" id="dim_cut_RR_以? class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_RR_以?] || ''}" />
                        <span style="font-size: 10px; color: #333; font-weight: 700;">(醫?</span>
                        <input type="text" id="dim_cut_RR_醫? class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_RR_醫?] || ''}" />
                      </div>
                    </td>
                  </tr>

                  <!-- 2. ?⑥뻔??(Step cutt,g) - ?꾨갑 & ?꾨갑 -->
                  <tr>
                    <td rowspan="8" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                      ?⑥뻔??br>(Step cutt,g)
                    </td>
                    <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                      ?꾨갑
                    </td>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      洹쒓꺽(Spec)
                    </td>
                    <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">36</td>
                    <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">36</td>
                  </tr>
                  <tr>
                    <td rowspan="3" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                      ?ㅼ륫(Act)
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_f_珥?RL" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_珥?RL'] || ''}" />
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_f_珥?RR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_珥?RR'] || ''}" />
                    </td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_f_以?RL" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_以?RL'] || ''}" />
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_f_以?RR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_以?RR'] || ''}" />
                    </td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_f_醫?RL" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_醫?RL'] || ''}" />
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_f_醫?RR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_醫?RR'] || ''}" />
                    </td>
                  </tr>
                  
                  <!-- ?꾨갑 -->
                  <tr>
                    <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                      ?꾨갑
                    </td>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      洹쒓꺽(Spec)
                    </td>
                    <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">29</td>
                    <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">29</td>
                  </tr>
                  <tr>
                    <td rowspan="3" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                      ?ㅼ륫(Act)
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_r_珥?RL" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_珥?RL'] || ''}" />
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_r_珥?RR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_珥?RR'] || ''}" />
                    </td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_r_以?RL" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_以?RL'] || ''}" />
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_r_以?RR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_以?RR'] || ''}" />
                    </td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_r_醫?RL" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_醫?RL'] || ''}" />
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_r_醫?RR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_醫?RR'] || ''}" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else {
        section5.innerHTML = `
        <div class="card" style="padding: 16px; margin-bottom: 16px;">
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
            ?뱪 <span class="sec-num"></span> 移섏닔?뺤씤
          </label>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <thead>
                <tr style="background: #fffde7; font-weight: 700; color: #000;">
                  <th colspan="3" style="border: 1px solid #000; padding: 6px;">援?遺?Division)</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 18%;">FRT LH</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 18%;">FRT RH</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 18%;">RR LH</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 18%;">RR RH</th>
                </tr>
              </thead>
              <tbody>
                <!-- 1. ?뺤튂?덈떒湲몄씠 -->
                <tr>
                  <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    ?뺤튂?덈떒湲몄씠<br>(Spec Cutt,g )
                  </td>
                  <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                    洹쒓꺽 (Spec)
                  </td>
                  <td colspan="2" style="border: 1px solid #000; font-weight: 700; padding: 4px;">
                    745 짹 1mm
                  </td>
                  <td colspan="2" style="border: 1px solid #000; font-weight: 700; padding: 4px;">
                    687 짹 1mm
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                    ?ㅼ륫(Act) <span style="font-size: 9px; font-weight: normal;">(珥?以?醫?</span>
                  </td>
                  <td colspan="2" style="border: 1px solid #000; padding: 3px 2px;">
                    <div style="display: flex; align-items: center; justify-content: space-around; gap: 2px;">
                      <span style="font-size: 10px; color: #333; font-weight: 700;">(珥?</span>
                      <input type="text" id="dim_cut_FRT_珥? class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_珥?] || ''}" />
                      <span style="font-size: 10px; color: #333; font-weight: 700;">(以?</span>
                      <input type="text" id="dim_cut_FRT_以? class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_以?] || ''}" />
                      <span style="font-size: 10px; color: #333; font-weight: 700;">(醫?</span>
                      <input type="text" id="dim_cut_FRT_醫? class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_醫?] || ''}" />
                    </div>
                  </td>
                  <td colspan="2" style="border: 1px solid #000; padding: 3px 2px;">
                    <div style="display: flex; align-items: center; justify-content: space-around; gap: 2px;">
                      <span style="font-size: 10px; color: #333; font-weight: 700;">(珥?</span>
                      <input type="text" id="dim_cut_RR_珥? class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_RR_珥?] || ''}" />
                      <span style="font-size: 10px; color: #333; font-weight: 700;">(以?</span>
                      <input type="text" id="dim_cut_RR_以? class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_RR_以?] || ''}" />
                      <span style="font-size: 10px; color: #333; font-weight: 700;">(醫?</span>
                      <input type="text" id="dim_cut_RR_醫? class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_RR_醫?] || ''}" />
                    </div>
                  </td>
                </tr>

                <!-- 2. ?⑥뻔??(Step cutt,g) - ?꾨갑 & ?꾨갑 -->
                <tr>
                  <td rowspan="8" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    ?⑥뻔??br>(Step cutt,g)
                  </td>
                  <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    ?꾨갑
                  </td>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                    洹쒓꺽(Spec)
                  </td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">36</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">36</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">36</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">36</td>
                </tr>
                <tr>
                  <td rowspan="3" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    ?ㅼ륫(Act)
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                      <span style="font-size: 9px; color: #555; font-weight: 700;">(珥?</span>
                      <input type="text" id="dim_step_f_珥?FL" class="form-control" style="width: 70%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_珥?FL'] || ''}" />
                    </div>
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_f_珥?FR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_珥?FR'] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_f_珥?RL" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_珥?RL'] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_f_珥?RR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_珥?RR'] || ''}" />
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                      <span style="font-size: 9px; color: #555; font-weight: 700;">(以?</span>
                      <input type="text" id="dim_step_f_以?FL" class="form-control" style="width: 70%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_以?FL'] || ''}" />
                    </div>
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_f_以?FR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_以?FR'] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_f_以?RL" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_以?RL'] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_f_以?RR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_以?RR'] || ''}" />
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                      <span style="font-size: 9px; color: #555; font-weight: 700;">(醫?</span>
                      <input type="text" id="dim_step_f_醫?FL" class="form-control" style="width: 70%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_醫?FL'] || ''}" />
                    </div>
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_f_醫?FR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_醫?FR'] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_f_醫?RL" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_醫?RL'] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_f_醫?RR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_醫?RR'] || ''}" />
                  </td>
                </tr>

                <!-- 3. ?⑥뻔??(Step cutt,g) - ?꾨갑 -->
                <tr>
                  <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    ?꾨갑
                  </td>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                    洹쒓꺽(Spec)
                  </td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">28</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">28</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">29</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">29</td>
                </tr>
                <tr>
                  <td rowspan="3" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    ?ㅼ륫(Act)
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                      <span style="font-size: 9px; color: #555; font-weight: 700;">(珥?</span>
                      <input type="text" id="dim_step_r_珥?FL" class="form-control" style="width: 70%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_珥?FL'] || ''}" />
                    </div>
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_r_珥?FR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_珥?FR'] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_r_珥?RL" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_珥?RL'] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_r_珥?RR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_珥?RR'] || ''}" />
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                      <span style="font-size: 9px; color: #555; font-weight: 700;">(以?</span>
                      <input type="text" id="dim_step_r_以?FL" class="form-control" style="width: 70%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_以?FL'] || ''}" />
                    </div>
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_r_以?FR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_以?FR'] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_r_以?RL" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_以?RL'] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_r_以?RR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_以?RR'] || ''}" />
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                      <span style="font-size: 9px; color: #555; font-weight: 700;">(醫?</span>
                      <input type="text" id="dim_step_r_醫?FL" class="form-control" style="width: 70%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_醫?FL'] || ''}" />
                    </div>
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_r_醫?FR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_醫?FR'] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_r_醫?RL" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_醫?RL'] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_r_醫?RR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_醫?RR'] || ''}" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          ${diagramHTML}
        </div>
      `;
      }

    } else if (curProc === '寃?ы룷?? || curProc === '寃???ъ옣') {
      const formCode = getCurrentFormCode();
      if (formCode === 1013) {
        section5.innerHTML = '';
        return;
      }
      const curCarCode = carModelValue ? carModelValue.value : currentCarCode;
      const curPart = partValueInput ? partValueInput.value : '';

      if (formCode === 2044) {
        const g = (id) => existingData?.kmkxClipQty?.[id] || existingData?.dimData?.[id] || '';
        section5.innerHTML = `
          <div class="card" style="padding: 16px; margin-bottom: 16px;">
            <label style="font-size: 14px; font-weight: 800; color: var(--accent-blue); margin-bottom: 14px; display: block;">
              ?뱪 <span class="sec-num"></span> 移섏닔?뺤씤 (KM/KX HOOD SURROUND - #2044)
            </label>

            <!-- 1. ?⑤㈃ 湲몄씠(mm) -->
            <div style="margin-bottom: 20px;">
              <div style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">
                ?⑤㈃ 湲몄씠(mm)
              </div>
              <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                  <thead>
                    <tr style="background: #ffffff; font-weight: 700;">
                      <th rowspan="2" style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">援щ텇</th>
                      <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">LH</th>
                      <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">MIDDLE</th>
                      <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">RH</th>
                    </tr>
                    <tr style="background: #ffffff; font-weight: 700;">
                      <td style="border: 1px solid #000; padding: 5px 2px; font-weight: 700; color: #000; font-size: 11px;">700짹5</td>
                      <td style="border: 1px solid #000; padding: 5px 2px; font-weight: 700; color: #000; font-size: 11px;">1086짹5</td>
                      <td style="border: 1px solid #000; padding: 5px 2px; font-weight: 700; color: #000; font-size: 11px;">700짹5</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">珥?/td>
                      <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_LH_珥? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_LH_珥?)}" /></td>
                      <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_MID_珥? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_MID_珥?)}" /></td>
                      <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_RH_珥? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_RH_珥?)}" /></td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">以?/td>
                      <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_LH_以? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_LH_以?)}" /></td>
                      <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_MID_以? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_MID_以?)}" /></td>
                      <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_RH_以? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_RH_以?)}" /></td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">醫?/td>
                      <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_LH_醫? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_LH_醫?)}" /></td>
                      <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_MID_醫? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_MID_醫?)}" /></td>
                      <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_RH_醫? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_RH_醫?)}" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 2. ???앸떒 ? 媛꾧꺽(mm) -->
            <div>
              <div style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">
                ???앸떒 ? 媛꾧꺽(mm)
              </div>
              <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                  <thead>
                    <tr style="background: #ffffff; font-weight: 700;">
                      <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">援щ텇</th>
                      <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">LH</th>
                      <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">MIDDLE</th>
                      <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">RH</th>
                    </tr>
                    <tr style="background: #ffffff; font-weight: 700;">
                      <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 4px 2px; font-weight: 700; color: #000; font-size: 11px;">(醫뚯륫)</td>
                      <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 4px 2px; font-weight: 700; color: #000; font-size: 11px;">15짹1</td>
                      <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 4px 2px; font-weight: 700; color: #000; font-size: 11px;">15짹1</td>
                      <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 4px 2px; font-weight: 700; color: #000; font-size: 11px;">15짹1</td>
                    </tr>
                    <tr style="background: #ffffff; font-weight: 700;">
                      <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 4px 2px; font-weight: 700; color: #000; font-size: 11px;">(?곗륫)</td>
                      <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 4px 2px; font-weight: 700; color: #000; font-size: 11px;">15짹1</td>
                      <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 4px 2px; font-weight: 700; color: #000; font-size: 11px;">15짹1</td>
                      <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 4px 2px; font-weight: 700; color: #000; font-size: 11px;">15짹1</td>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- 珥?-->
                    <tr>
                      <td rowspan="2" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">珥?/td>
                      <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_LH_珥?醫? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_LH_珥?醫?)}" placeholder="醫? /></td>
                      <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_MID_珥?醫? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_MID_珥?醫?)}" placeholder="醫? /></td>
                      <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_RH_珥?醫? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_RH_珥?醫?)}" placeholder="醫? /></td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_LH_珥??? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_LH_珥???)}" placeholder="?? /></td>
                      <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_MID_珥??? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_MID_珥???)}" placeholder="?? /></td>
                      <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_RH_珥??? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_RH_珥???)}" placeholder="?? /></td>
                    </tr>

                    <!-- 以?-->
                    <tr>
                      <td rowspan="2" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">以?/td>
                      <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_LH_以?醫? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_LH_以?醫?)}" placeholder="醫? /></td>
                      <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_MID_以?醫? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_MID_以?醫?)}" placeholder="醫? /></td>
                      <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_RH_以?醫? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_RH_以?醫?)}" placeholder="醫? /></td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_LH_以??? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_LH_以???)}" placeholder="?? /></td>
                      <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_MID_以??? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_MID_以???)}" placeholder="?? /></td>
                      <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_RH_以??? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_RH_以???)}" placeholder="?? /></td>
                    </tr>

                    <!-- 醫?-->
                    <tr>
                      <td rowspan="2" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">醫?/td>
                      <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_LH_醫?醫? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_LH_醫?醫?)}" placeholder="醫? /></td>
                      <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_MID_醫?醫? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_MID_醫?醫?)}" placeholder="醫? /></td>
                      <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_RH_醫?醫? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_RH_醫?醫?)}" placeholder="醫? /></td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_LH_醫??? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_LH_醫???)}" placeholder="?? /></td>
                      <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_MID_醫??? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_MID_醫???)}" placeholder="?? /></td>
                      <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_RH_醫??? class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_RH_醫???)}" placeholder="?? /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `;
      } else if ([2005, 2015, 2027, 2035].includes(formCode)) {
        const d2005 = existingData?.dim2005Data || {};
        const aSpec = (formCode === 2015 || curCarCode === 'DT QUAD')
          ? '509 짹 5'
          : (formCode === 2035 || curCarCode === 'DS STD')
            ? '1018 짹 5'
            : ((formCode === 2027 || curCarCode === 'DS CREW') ? '707 짹 5' : '779 짹 5');
        const bClipSpec = (formCode === 2035 || curCarCode === 'DS STD') ? '29 짹 1' : '28 짹 1';
        const cSpec = (formCode === 2035 || curCarCode === 'DS STD')
          ? '391 짹 5'
          : ((formCode === 2027 || curCarCode === 'DS CREW')
            ? '379 짹 5'
            : ((formCode === 2015 || curCarCode === 'DT QUAD') ? '216 짹 4' : '246 짹 4'));
        
        const rowsDef = [
          { group: 'A ?꾩옣', spec: aSpec, items: [
            { pos: '珥덈Ъ', k: 'cho_A' },
            { pos: '以묐Ъ', k: 'jung_A' },
            { pos: '醫낅Ъ', k: 'jong_A' }
          ]},
          { group: 'B 醫뚯륫 ?대┰', spec: bClipSpec, items: [
            { pos: '珥덈Ъ', k: 'cho_B_left' },
            { pos: '以묐Ъ', k: 'jung_B_left' },
            { pos: '醫낅Ъ', k: 'jong_B_left' }
          ]},
          { group: 'B ?곗륫 ?대┰', spec: bClipSpec, items: [
            { pos: '珥덈Ъ', k: 'cho_B_right' },
            { pos: '以묐Ъ', k: 'jung_B_right' },
            { pos: '醫낅Ъ', k: 'jong_B_right' }
          ]},
          { group: 'C ?꾩옣', spec: cSpec, items: [
            { pos: '珥덈Ъ', k: 'cho_C' },
            { pos: '以묐Ъ', k: 'jung_C' },
            { pos: '醫낅Ъ', k: 'jong_C' }
          ]}
        ];

        if (formCode === 2027) {
          rowsDef.push({
            group: 'D ?꾩옣',
            spec: '475 짹 5',
            items: [
              { pos: '珥덈Ъ', k: 'cho_D' },
              { pos: '以묐Ъ', k: 'jung_D' },
              { pos: '醫낅Ъ', k: 'jong_D' }
            ]
          });
        }

        section5.innerHTML = `
          <div class="card" style="padding: 16px; margin-bottom: 16px;">
            <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 12px; display: block;">
              ?뱩 <span class="sec-num"></span> 移섏닔?뺤씤 (${curCarCode} D/SIDE - #${formCode})
            </label>

            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 12px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #ffffff; font-weight: 700; color: #000;">
                    <th style="border: 1px solid #000; padding: 6px; width: 26%;">??ぉ</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 20%;">?ㅽ럺(mm)</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 18%;">援щ텇</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 18%;">LH</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 18%;">RH</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsDef.map(g => g.items.map((it, idx) => `
                    <tr>
                      ${idx === 0 ? `<td rowspan="${g.items.length}" style="border: 1px solid #000; padding: 6px; font-weight: 700; background: #ffffff; vertical-align: middle;">${g.group}</td>` : ''}
                      ${idx === 0 ? `<td rowspan="${g.items.length}" style="border: 1px solid #000; padding: 6px; font-weight: 700; background: #ffffff; vertical-align: middle;">${g.spec}</td>` : ''}
                      <td style="border: 1px solid #000; padding: 6px; font-weight: 700; background: #ffffff;">${it.pos}</td>
                      <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                        <input type="text" id="dim2005_${it.k}_lh" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" value="${d2005[it.k + '_lh'] || ''}" />
                      </td>
                      <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                        <input type="text" id="dim2005_${it.k}_rh" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" value="${d2005[it.k + '_rh'] || ''}" />
                      </td>
                    </tr>
                  `).join('')).join('')}
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else {
        const d = existingData?.dimData || {};
        const isJg1Inbelt = (curCarCode === 'JG1' || curCarCode === 'JG1S' || (currentMakerName && currentMakerName.includes('?쒕꽕?쒖뒪'))) &&
                            (curPart === '?몃꺼?? || !curPart || curPart === '');

        const diagramHTML = isJg1Inbelt ? `
          <div style="max-width: 650px; margin: 0 auto 12px auto;">
            <img src="images/jg1_inbelt_dimension.png" alt="JG1 ?몃꺼??移섏닔?뺤씤 ?꾨㈃" style="width: 100%; height: auto; display: block; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);" />
          </div>
        ` : `
          <div style="padding: 12px; background: #f8fafc; border: 1px dashed var(--border-color); border-radius: 6px; text-align: center; color: var(--text-main); font-weight: 700; margin-bottom: 12px;">
            ?뱥 [${curCarCode}${curPart ? ' - ' + curPart : ''}] ?꾩옣 湲몄씠 痢≪젙 諛??꾩꽦???덉쭏寃??湲곗???          </div>
        `;

        if (formCode === 1004 || formCode === 1034) {
        section5.innerHTML = `
          <div class="card" style="padding: 16px; margin-bottom: 16px;">
            <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 8px; display: block;">
              ?뱩 <span class="sec-num"></span> 移섏닔?뺤씤 (?꾩옣 湲몄씠 痢≪젙 - ${curCarCode}${curPart ? ' ' + curPart : ''})
            </label>

            ${diagramHTML}

            <!-- 1. FRT LH Table -->
            <div style="overflow-x: auto; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-bottom: 1px solid #000;">
                    <th colspan="2" style="border: 1px solid #000; padding: 6px;">援щ텇 (FRT)</th>
                    <th colspan="3" style="border: 1px solid #000; padding: 6px; width: 76%;">FRT LH</th>
                  </tr>
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-bottom: 2px solid #000;">
                    <td colspan="2" style="border: 1px solid #000; padding: 4px;">痢≪젙(mm)</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">珥?/td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">以?/td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">醫?/td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle; width: 14%;">
                      ?꾩옣 湲몄씠<br>痢≪젙 (FRT)<br>?⑥쐞 : mm
                    </td>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; width: 10%;">
                      占?to 占?                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_lh_珥? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_lh_珥?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_lh_以? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_lh_以?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_lh_醫? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_lh_醫?] || ''}" /></td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      LIP to LIP
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_lh_珥? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_lh_珥?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_lh_以? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_lh_以?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_lh_醫? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_lh_醫?] || ''}" /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 2. FRT RH Table -->
            <div style="overflow-x: auto; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-bottom: 1px solid #000;">
                    <th colspan="2" style="border: 1px solid #000; padding: 6px;">援щ텇 (FRT)</th>
                    <th colspan="3" style="border: 1px solid #000; padding: 6px; width: 76%;">FRT RH</th>
                  </tr>
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-bottom: 2px solid #000;">
                    <td colspan="2" style="border: 1px solid #000; padding: 4px;">痢≪젙(mm)</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">珥?/td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">以?/td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">醫?/td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle; width: 14%;">
                      ?꾩옣 湲몄씠<br>痢≪젙 (FRT)<br>?⑥쐞 : mm
                    </td>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; width: 10%;">
                      占?to 占?                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_rh_珥? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_rh_珥?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_rh_以? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_rh_以?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_rh_醫? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_rh_醫?] || ''}" /></td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      LIP to LIP
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_rh_珥? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_rh_珥?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_rh_以? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_rh_以?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_rh_醫? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_rh_醫?] || ''}" /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 3. RR LH Table -->
            <div style="overflow-x: auto; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-bottom: 1px solid #000;">
                    <th colspan="2" style="border: 1px solid #000; padding: 6px;">援щ텇 (RR)</th>
                    <th colspan="3" style="border: 1px solid #000; padding: 6px; width: 76%;">RR LH</th>
                  </tr>
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-bottom: 2px solid #000;">
                    <td colspan="2" style="border: 1px solid #000; padding: 4px;">痢≪젙(mm)</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">珥?/td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">以?/td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">醫?/td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle; width: 14%;">
                      ?꾩옣 湲몄씠<br>痢≪젙 (RR)<br>?⑥쐞 : mm
                    </td>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; width: 10%;">
                      占?to 占?                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_lh_珥? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_lh_珥?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_lh_以? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_lh_以?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_lh_醫? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_lh_醫?] || ''}" /></td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      LIP to LIP
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_lh_珥? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_lh_珥?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_lh_以? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_lh_以?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_lh_醫? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_lh_醫?] || ''}" /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 4. RR RH Table -->
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-bottom: 1px solid #000;">
                    <th colspan="2" style="border: 1px solid #000; padding: 6px;">援щ텇 (RR)</th>
                    <th colspan="3" style="border: 1px solid #000; padding: 6px; width: 76%;">RR RH</th>
                  </tr>
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-bottom: 2px solid #000;">
                    <td colspan="2" style="border: 1px solid #000; padding: 4px;">痢≪젙(mm)</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">珥?/td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">以?/td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">醫?/td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle; width: 14%;">
                      ?꾩옣 湲몄씠<br>痢≪젙 (RR)<br>?⑥쐞 : mm
                    </td>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; width: 10%;">
                      占?to 占?                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_rh_珥? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_rh_珥?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_rh_以? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_rh_以?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_rh_醫? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_rh_醫?] || ''}" /></td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      LIP to LIP
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_rh_珥? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_rh_珥?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_rh_以? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_rh_以?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_rh_醫? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_rh_醫?] || ''}" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else {
        section5.innerHTML = `
          <div class="card" style="padding: 16px; margin-bottom: 16px;">
            <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 8px; display: block;">
              ?뱩 <span class="sec-num"></span> 移섏닔?뺤씤 (?꾩옣 湲몄씠 痢≪젙 - ${curCarCode}${curPart ? ' ' + curPart : ''})
            </label>

            ${diagramHTML}

            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <!-- FRT ?ㅻ뜑 -->
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-bottom: 1px solid #000;">
                    <th colspan="2" style="border: 1px solid #000; padding: 6px;">援щ텇 (FRT)</th>
                    <th colspan="3" style="border: 1px solid #000; padding: 6px; width: 38%;">FRT LH</th>
                    <th colspan="3" style="border: 1px solid #000; padding: 6px; width: 38%;">FRT RH</th>
                  </tr>
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-bottom: 2px solid #000;">
                    <td colspan="2" style="border: 1px solid #000; padding: 4px;">痢≪젙(mm)</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 12.6%;">珥?/td>
                    <td style="border: 1px solid #000; padding: 4px; width: 12.6%;">以?/td>
                    <td style="border: 1px solid #000; padding: 4px; width: 12.6%;">醫?/td>
                    <td style="border: 1px solid #000; padding: 4px; width: 12.6%;">珥?/td>
                    <td style="border: 1px solid #000; padding: 4px; width: 12.6%;">以?/td>
                    <td style="border: 1px solid #000; padding: 4px; width: 12.6%;">醫?/td>
                  </tr>
                </thead>
                <tbody>
                  <!-- 1. FRT 占?to 占?-->
                  <tr>
                    <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle; width: 14%;">
                      ?꾩옣 湲몄씠<br>痢≪젙 (FRT)<br>?⑥쐞 : mm
                    </td>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; width: 10%;">
                      占?to 占?                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_lh_珥? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_lh_珥?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_lh_以? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_lh_以?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_lh_醫? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_lh_醫?] || ''}" /></td>

                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_rh_珥? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_rh_珥?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_rh_以? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_rh_以?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_rh_醫? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_rh_醫?] || ''}" /></td>
                  </tr>

                  <!-- 2. FRT LIP to LIP -->
                  <tr>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      LIP to LIP
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_lh_珥? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_lh_珥?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_lh_以? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_lh_以?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_lh_醫? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_lh_醫?] || ''}" /></td>

                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_rh_珥? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_rh_珥?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_rh_以? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_rh_以?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_rh_醫? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_rh_醫?] || ''}" /></td>
                  </tr>

                  <!-- 援щ텇 援щ텇??-->
                  <tr style="height: 8px; background: #e2e8f0;">
                    <td colspan="8" style="border: 1px solid #000; padding: 0;"></td>
                  </tr>

                  <!-- RR ?ㅻ뜑 -->
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-top: 2px solid #000; border-bottom: 1px solid #000;">
                    <th colspan="2" style="border: 1px solid #000; padding: 6px;">援щ텇 (RR)</th>
                    <th colspan="3" style="border: 1px solid #000; padding: 6px;">RR LH</th>
                    <th colspan="3" style="border: 1px solid #000; padding: 6px;">RR RH</th>
                  </tr>
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-bottom: 2px solid #000;">
                    <td colspan="2" style="border: 1px solid #000; padding: 4px;">痢≪젙(mm)</td>
                    <td style="border: 1px solid #000; padding: 4px;">珥?/td>
                    <td style="border: 1px solid #000; padding: 4px;">以?/td>
                    <td style="border: 1px solid #000; padding: 4px;">醫?/td>
                    <td style="border: 1px solid #000; padding: 4px;">珥?/td>
                    <td style="border: 1px solid #000; padding: 4px;">以?/td>
                    <td style="border: 1px solid #000; padding: 4px;">醫?/td>
                  </tr>

                  <!-- 3. RR 占?to 占?-->
                  <tr>
                    <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle; width: 14%;">
                      ?꾩옣 湲몄씠<br>痢≪젙 (RR)<br>?⑥쐞 : mm
                    </td>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; width: 10%;">
                      占?to 占?                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_lh_珥? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_lh_珥?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_lh_以? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_lh_以?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_lh_醫? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_lh_醫?] || ''}" /></td>

                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_rh_珥? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_rh_珥?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_rh_以? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_rh_以?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_rh_醫? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_rh_醫?] || ''}" /></td>
                  </tr>

                  <!-- 4. RR LIP to LIP -->
                  <tr>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      LIP to LIP
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_lh_珥? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_lh_珥?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_lh_以? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_lh_以?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_lh_醫? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_lh_醫?] || ''}" /></td>

                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_rh_珥? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_rh_珥?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_rh_以? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_rh_以?] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_rh_醫? class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_rh_醫?] || ''}" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      }
      }
    } else {
      // 湲고? 怨듭젙: section5 鍮꾩?
      section5.innerHTML = '';
    }
}
