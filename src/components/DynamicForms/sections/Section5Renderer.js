import * as Templates from '../FormTemplates.jsx';
import { autoFormatDateTimeString } from './formUtils.js';

/**
 * Section 5 동적 렌더러 (가류온도/치수확인 등)
 * ctx: { container, processValue, carModelValue, currentCarCode, partValueInput, existingData, getCurrentFormCode, bindNumberWheelPicker }
 */
export function renderSection5(ctx) {
  const { container, processValue, carModelValue, currentCarCode, partValueInput, existingData, getCurrentFormCode, bindNumberWheelPicker } = ctx;
    const section5 = container.querySelector('#section5DynamicContainer');
    if (!section5) return;

    const curProc = processValue ? processValue.value : '';
    const formCode = getCurrentFormCode();
    const d = existingData?.dimensionCheck || {};

    if (!curProc || curProc === '클립머신') {
      section5.innerHTML = '';
      return;
    }

    if (formCode === 4001) {
      section5.innerHTML = `
        <div class="card" style="padding: 16px; margin-bottom: 16px;">
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
            📐 <span class="sec-num"></span> 치수확인
          </label>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <thead>
                <tr style="background: #fffde7; font-weight: 700; color: #000;">
                  <th colspan="3" style="border: 1px solid #000; padding: 6px;">구 분(Division)</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 72%;">PTG</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    정치절단길이<br>(Spec Cutt,g )
                  </td>
                  <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                    규격 (Spec)
                  </td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">
                    326 ± 2mm
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                    실측(Act) <span style="font-size: 9px; font-weight: normal;">(초/중/종)</span>
                  </td>
                  <td style="border: 1px solid #000; padding: 3px 2px;">
                    <div style="display: flex; flex-direction: column; gap: 4px; padding: 4px;">
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(초)</span>
                        <input type="text" id="dim_cut_FRT_초" class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_초'] || '1870'}"  readonly />
                      </div>
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(중)</span>
                        <input type="text" id="dim_cut_FRT_중" class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_중'] || '1870'}"  readonly />
                      </div>
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(종)</span>
                        <input type="text" id="dim_cut_FRT_종" class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_종'] || '1870'}"  readonly />
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
      bindNumberWheelPicker(section5.querySelector('#dim_cut_FRT_초'), '정치절단길이 LH 초', 326, 20);
      bindNumberWheelPicker(section5.querySelector('#dim_cut_FRT_중'), '정치절단길이 LH 중', 326, 20);
      bindNumberWheelPicker(section5.querySelector('#dim_cut_FRT_종'), '정치절단길이 LH 종', 326, 20);
      return;
    } else if (formCode === 4004) {
      section5.innerHTML = `
        <div class="card" style="padding: 16px; margin-bottom: 16px;">
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
            📐 <span class="sec-num"></span> 치수확인
          </label>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <thead>
                <tr style="background: #fffde7; font-weight: 700; color: #000;">
                  <th colspan="3" style="border: 1px solid #000; padding: 6px;">구 분(Division)</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 36%;">LH</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 36%;">RH</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    정치절단길이<br>(Spec Cutt,g )
                  </td>
                  <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                    규격 (Spec)
                  </td>
                  <td colspan="2" style="border: 1px solid #000; font-weight: 700; padding: 4px;">
                    326 ± 2mm
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                    실측(Act) <span style="font-size: 9px; font-weight: normal;">(초/중/종)</span>
                  </td>
                  <td style="border: 1px solid #000; padding: 3px 2px;">
                    <div style="display: flex; flex-direction: column; gap: 4px; padding: 4px;">
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(초)</span>
                        <input type="text" id="dim_cut_FRT_초" class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_초'] || ''}" />
                      </div>
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(중)</span>
                        <input type="text" id="dim_cut_FRT_중" class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_중'] || ''}" />
                      </div>
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(종)</span>
                        <input type="text" id="dim_cut_FRT_종" class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_종'] || ''}" />
                      </div>
                    </div>
                  </td>
                  <td style="border: 1px solid #000; padding: 3px 2px;">
                    <div style="display: flex; flex-direction: column; gap: 4px; padding: 4px;">
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(초)</span>
                        <input type="text" id="dim_cut_RR_초" class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_RR_초'] || '326'}"  readonly />
                      </div>
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(중)</span>
                        <input type="text" id="dim_cut_RR_중" class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_RR_중'] || '326'}"  readonly />
                      </div>
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(종)</span>
                        <input type="text" id="dim_cut_RR_종" class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_RR_종'] || '326'}"  readonly />
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
      bindNumberWheelPicker(section5.querySelector('#dim_cut_FRT_초'), '정치절단길이 LH 초', 326, 20);
      bindNumberWheelPicker(section5.querySelector('#dim_cut_FRT_중'), '정치절단길이 LH 중', 326, 20);
      bindNumberWheelPicker(section5.querySelector('#dim_cut_FRT_종'), '정치절단길이 LH 종', 326, 20);
      bindNumberWheelPicker(section5.querySelector('#dim_cut_RR_초'), '정치절단길이 RH 초', 326, 20);
      bindNumberWheelPicker(section5.querySelector('#dim_cut_RR_중'), '정치절단길이 RH 중', 326, 20);
      bindNumberWheelPicker(section5.querySelector('#dim_cut_RR_종'), '정치절단길이 RH 종', 326, 20);
      return;
    } else if (formCode === 4011 || formCode === 4014) {
      section5.innerHTML = `
        <div class="card" style="padding: 16px; margin-bottom: 16px;">
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
            📐 <span class="sec-num"></span> 치수확인
          </label>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <thead>
                <tr style="background: #fffde7; font-weight: 700; color: #000;">
                  <th colspan="3" style="border: 1px solid #000; padding: 6px;">구 분(Division)</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 72%;">Frunk</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    정치절단길이<br>(Spec Cutt,g )
                  </td>
                  <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                    규격 (Spec)
                  </td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">
                    1870 ± 2.5mm
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                    실측(Act) <span style="font-size: 9px; font-weight: normal;">(초/중/종)</span>
                  </td>
                  <td style="border: 1px solid #000; padding: 3px 2px;">
                    <div style="display: flex; flex-direction: column; gap: 4px; padding: 4px;">
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(초)</span>
                        <input type="text" id="dim_cut_FRT_초" class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_초'] || ''}" />
                      </div>
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(중)</span>
                        <input type="text" id="dim_cut_FRT_중" class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_중'] || ''}" />
                      </div>
                      <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700; width: 20px;">(종)</span>
                        <input type="text" id="dim_cut_FRT_종" class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_종'] || ''}" />
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
      bindNumberWheelPicker(section5.querySelector('#dim_cut_FRT_초'), '정치절단길이 PTG 초', 1870, 50);
      bindNumberWheelPicker(section5.querySelector('#dim_cut_FRT_중'), '정치절단길이 PTG 중', 1870, 50);
      bindNumberWheelPicker(section5.querySelector('#dim_cut_FRT_종'), '정치절단길이 PTG 종', 1870, 50);
      return;
    }

    if (curProc === '조인트' || curProc === '조인트(D)') {
      // 조인트 공정: 조인트 고무 LOT 번호 입력 + 7. 설비 가류온도 & 가류시간 입력
      const jointLotVal = existingData?.jointRubberLotNo || '';
      const v = existingData?.vulcData || {};
      const v2 = existingData?.vulcData2 || {};
      const curCarCode = carModelValue ? carModelValue.value : currentCarCode;
      const isDtCrew = (curCarCode === 'DT CREW' || curCarCode === 'DT QUAD' || curCarCode === 'DS CREW' || curCarCode === 'DS STD');

      const makeDtCrewVulcTable = (pfx, data, tableNum, fixedSide = '') => `
        <div style="overflow-x: auto; ${tableNum > 1 ? 'margin-top: 16px;' : ''}">
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <!-- 구분 및 LH, RH -->
              <tr style="background: #e2e8f0; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px; font-size: 12px;">구분</th>
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
              <!-- 부위 -->
              <tr style="background: #f1f5f9; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">부위 [직각/둔각/직선/엔드]</th>
                <th style="border: 1px solid #000; padding: 6px; width: 25%;">R[직각]</th>
                <th style="border: 1px solid #000; padding: 6px; width: 25%;">S[둔각]</th>
                <th style="border: 1px solid #000; padding: 6px; width: 25%;">T[직선]</th>
              </tr>
              <!-- 금형 No. -->
              <tr style="background: #ffffff; font-weight: 700; color: #000;">
                <td colspan="2" style="border: 1px solid #000; padding: 6px; background: #ffffff; font-weight: 700;">금형 No. [ 호기 ]</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_mold_R" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.mold_R || ''}" placeholder="호기 입력" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_mold_S" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.mold_S || ''}" placeholder="호기 입력" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_mold_T" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.mold_T || ''}" placeholder="호기 입력" /></td>
              </tr>
            </thead>
            <tbody>
              <!-- 가류 온도 (상/하, ℃) -->
              <tr>
                <td rowspan="7" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle; width: 18%;">가류 온도<br>[ 상/하, ℃ ]</td>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #e2e8f0; font-weight: 700; color: #000; width: 14%;">규 격</td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">210 ± 10</td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">210 ± 10</td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">210 ± 10</td>
              </tr>
              <tr>
                <td rowspan="2" style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; vertical-align: middle;">초 물</td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[상]</span><input type="text" id="${pfx}_temp_r_초_상" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_r_초_상 || ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[상]</span><input type="text" id="${pfx}_temp_s_초_상" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_s_초_상 || ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[상]</span><input type="text" id="${pfx}_temp_t_초_상" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_t_초_상 || ''}" /></div></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[하]</span><input type="text" id="${pfx}_temp_r_초_하" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_r_초_하 || ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[하]</span><input type="text" id="${pfx}_temp_s_초_하" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_s_초_하 || ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[하]</span><input type="text" id="${pfx}_temp_t_초_하" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_t_초_하 || ''}" /></div></td>
              </tr>
              <tr>
                <td rowspan="2" style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; vertical-align: middle;">중 물</td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[상]</span><input type="text" id="${pfx}_temp_r_중_상" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_r_중_상 || ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[상]</span><input type="text" id="${pfx}_temp_s_중_상" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_s_중_상 || ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[상]</span><input type="text" id="${pfx}_temp_t_중_상" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_t_중_상 || ''}" /></div></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[하]</span><input type="text" id="${pfx}_temp_r_중_하" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_r_중_하 || ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[하]</span><input type="text" id="${pfx}_temp_s_중_하" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_s_중_하 || ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[하]</span><input type="text" id="${pfx}_temp_t_중_하" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_t_중_하 || ''}" /></div></td>
              </tr>
              <tr>
                <td rowspan="2" style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; vertical-align: middle;">종 물</td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[상]</span><input type="text" id="${pfx}_temp_r_종_상" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_r_종_상 || ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[상]</span><input type="text" id="${pfx}_temp_s_종_상" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_s_종_상 || ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[상]</span><input type="text" id="${pfx}_temp_t_종_상" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_t_종_상 || ''}" /></div></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[하]</span><input type="text" id="${pfx}_temp_r_종_하" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_r_종_하 || ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[하]</span><input type="text" id="${pfx}_temp_s_종_하" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_s_종_하 || ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[하]</span><input type="text" id="${pfx}_temp_t_종_하" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_t_종_하 || ''}" /></div></td>
              </tr>

              <!-- 가류 시간 [ 초 ] -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">가류 시간<br>[ 초 ]</td>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #e2e8f0; font-weight: 700; color: #000;">규 격</td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">90 ± 10</td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">90 ± 10</td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">90 ± 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000;">초 물</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_r_초" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_r_초 || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_s_초" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_s_초 || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_t_초" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_t_초 || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000;">중 물</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_r_중" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_r_중 || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_s_중" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_s_중 || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_t_중" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_t_중 || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000;">종 물</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_r_종" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_r_종 || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_s_종" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_s_종 || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_t_종" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_t_종 || ''}" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;

      const makeDtCrewEndVulcTable = (pfx, data, tableNum) => `
        <div style="overflow-x: auto; ${tableNum > 1 ? 'margin-top: 16px;' : ''}">
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <!-- 부위(엔드) -->
              <tr style="background: #f1f5f9; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">부위(엔드)</th>
                <th style="border: 1px solid #000; padding: 6px; width: 19%;">1호</th>
                <th style="border: 1px solid #000; padding: 6px; width: 19%;">2호</th>
                <th style="border: 1px solid #000; padding: 6px; width: 19%;">3호</th>
                <th style="border: 1px solid #000; padding: 6px; width: 19%;">4호</th>
              </tr>
              <!-- 금형 No. -->
              <tr style="background: #ffffff; font-weight: 700; color: #000;">
                <td colspan="2" style="border: 1px solid #000; padding: 6px; background: #ffffff; font-weight: 700;">금형 No. [ 호기 ]</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_mold_1" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.mold_1 ?? data.mold_R ?? ''}" placeholder="호기 입력" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_mold_2" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.mold_2 ?? data.mold_S ?? ''}" placeholder="호기 입력" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_mold_3" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.mold_3 ?? data.mold_T ?? ''}" placeholder="호기 입력" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_mold_4" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.mold_4 ?? ''}" placeholder="호기 입력" /></td>
              </tr>
            </thead>
            <tbody>
              <!-- 가류 온도 (상/하, ℃) -->
              <tr>
                <td rowspan="7" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle; width: 18%;">가류 온도<br>[ 상/하, ℃ ]</td>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #e2e8f0; font-weight: 700; color: #000; width: 14%;">규 격</td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">210 ± 10</td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">210 ± 10</td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">210 ± 10</td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">210 ± 10</td>
              </tr>
              <tr>
                <td rowspan="2" style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; vertical-align: middle;">초 물</td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[상]</span><input type="text" id="${pfx}_temp_1_초_상" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_1_초_상 ?? data.temp_r_초_상 ?? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[상]</span><input type="text" id="${pfx}_temp_2_초_상" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_2_초_상 ?? data.temp_s_초_상 ?? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[상]</span><input type="text" id="${pfx}_temp_3_초_상" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_3_초_상 ?? data.temp_t_초_상 ?? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[상]</span><input type="text" id="${pfx}_temp_4_초_상" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_4_초_상 ?? ''}" /></div></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[하]</span><input type="text" id="${pfx}_temp_1_초_하" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_1_초_하 ?? data.temp_r_초_하 ?? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[하]</span><input type="text" id="${pfx}_temp_2_초_하" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_2_초_하 ?? data.temp_s_초_하 ?? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[하]</span><input type="text" id="${pfx}_temp_3_초_하" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_3_초_하 ?? data.temp_t_초_하 ?? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[하]</span><input type="text" id="${pfx}_temp_4_초_하" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_4_초_하 ?? ''}" /></div></td>
              </tr>
              <tr>
                <td rowspan="2" style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; vertical-align: middle;">중 물</td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[상]</span><input type="text" id="${pfx}_temp_1_중_상" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_1_중_상 ?? data.temp_r_중_상 ?? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[상]</span><input type="text" id="${pfx}_temp_2_중_상" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_2_중_상 ?? data.temp_s_중_상 ?? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[상]</span><input type="text" id="${pfx}_temp_3_중_상" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_3_중_상 ?? data.temp_t_중_상 ?? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[상]</span><input type="text" id="${pfx}_temp_4_중_상" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_4_중_상 ?? ''}" /></div></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[하]</span><input type="text" id="${pfx}_temp_1_중_하" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_1_중_하 ?? data.temp_r_중_하 ?? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[하]</span><input type="text" id="${pfx}_temp_2_중_하" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_2_중_하 ?? data.temp_s_중_하 ?? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[하]</span><input type="text" id="${pfx}_temp_3_중_하" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_3_중_하 ?? data.temp_t_중_하 ?? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[하]</span><input type="text" id="${pfx}_temp_4_중_하" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_4_중_하 ?? ''}" /></div></td>
              </tr>
              <tr>
                <td rowspan="2" style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; vertical-align: middle;">종 물</td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[상]</span><input type="text" id="${pfx}_temp_1_종_상" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_1_종_상 ?? data.temp_r_종_상 ?? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[상]</span><input type="text" id="${pfx}_temp_2_종_상" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_2_종_상 ?? data.temp_s_종_상 ?? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[상]</span><input type="text" id="${pfx}_temp_3_종_상" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_3_종_상 ?? data.temp_t_종_상 ?? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[상]</span><input type="text" id="${pfx}_temp_4_종_상" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_4_종_상 ?? ''}" /></div></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[하]</span><input type="text" id="${pfx}_temp_1_종_하" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_1_종_하 ?? data.temp_r_종_하 ?? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[하]</span><input type="text" id="${pfx}_temp_2_종_하" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_2_종_하 ?? data.temp_s_종_하 ?? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[하]</span><input type="text" id="${pfx}_temp_3_종_하" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_3_종_하 ?? data.temp_t_종_하 ?? ''}" /></div></td>
                <td style="border: 1px solid #000; padding: 2px;"><div style="display: flex; align-items: center; justify-content: center; gap: 2px;"><span style="font-size: 10px; color: #555;">[하]</span><input type="text" id="${pfx}_temp_4_종_하" class="form-control" style="width: 70%; border: none; text-align: center; font-size: 11px; padding: 3px;" value="${data.temp_4_종_하 ?? ''}" /></div></td>
              </tr>

              <!-- 가류 시간 [ 초 ] -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">가류 시간<br>[ 초 ]</td>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #e2e8f0; font-weight: 700; color: #000;">규 격</td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">90 ± 10</td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">90 ± 10</td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">90 ± 10</td>
                <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700; background: #e2e8f0;">90 ± 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000;">초 물</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_1_초" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_1_초 ?? data.time_r_초 ?? ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_2_초" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_2_초 ?? data.time_s_초 ?? ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_3_초" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_3_초 ?? data.time_t_초 ?? ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_4_초" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_4_초 ?? ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000;">중 물</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_1_중" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_1_중 ?? data.time_r_중 ?? ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_2_중" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_2_중 ?? data.time_s_중 ?? ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_3_중" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_3_중 ?? data.time_t_중 ?? ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_4_중" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_4_중 ?? ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000;">종 물</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_1_종" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_1_종 ?? data.time_r_종 ?? ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_2_종" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_2_종 ?? data.time_s_종 ?? ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_3_종" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_3_종 ?? data.time_t_종 ?? ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${pfx}_time_4_종" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${data.time_4_종 ?? ''}" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      `;

      const makeKmKxJointVulcTable = (pfx, data) => `
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">구 분(Division)</th>
                <th colspan="2" style="border: 1px solid #000; padding: 6px; width: 38%;">1호</th>
                <th colspan="2" style="border: 1px solid #000; padding: 6px; width: 38%;">2호</th>
              </tr>
              <tr style="background: #fffde7; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">부 위(Part)</th>
                <th style="border: 1px solid #000; padding: 6px; width: 19%;">LH</th>
                <th style="border: 1px solid #000; padding: 6px; width: 19%;">RH</th>
                <th style="border: 1px solid #000; padding: 6px; width: 19%;">LH</th>
                <th style="border: 1px solid #000; padding: 6px; width: 19%;">RH</th>
              </tr>
            </thead>
            <tbody>
              <!-- 1. 가류온도 영역 -->
              <tr>
                <td rowspan="7" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle; width: 14%;">
                  가류온도<br>(Temperature) 상<br>(Upper/하(DOWN)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; width: 10%;">
                  규격 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
              </tr>
              <!-- 초물 (상/하) -->
              <tr>
                <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  초물
                </td>
                <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_start_1_lh_상" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(상)" value="${data.temp_start_1_lh_상 || data.temp_start_1_lh || ''}" /></td>
                <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_start_1_rh_상" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(상)" value="${data.temp_start_1_rh_상 || data.temp_start_1_rh || ''}" /></td>
                <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_start_2_lh_상" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(상)" value="${data.temp_start_2_lh_상 || data.temp_start_2_lh || ''}" /></td>
                <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_start_2_rh_상" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(상)" value="${data.temp_start_2_rh_상 || data.temp_start_2_rh || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_start_1_lh_하" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(하)" value="${data.temp_start_1_lh_하 || ''}" /></td>
                <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_start_1_rh_하" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(하)" value="${data.temp_start_1_rh_하 || ''}" /></td>
                <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_start_2_lh_하" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(하)" value="${data.temp_start_2_lh_하 || ''}" /></td>
                <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_start_2_rh_하" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(하)" value="${data.temp_start_2_rh_하 || ''}" /></td>
              </tr>

              <!-- 중물 (상/하) -->
              <tr>
                <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  중물
                </td>
                <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_harf_1_lh_상" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(상)" value="${data.temp_harf_1_lh_상 || data.temp_harf_1_lh || ''}" /></td>
                <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_harf_1_rh_상" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(상)" value="${data.temp_harf_1_rh_상 || data.temp_harf_1_rh || ''}" /></td>
                <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_harf_2_lh_상" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(상)" value="${data.temp_harf_2_lh_상 || data.temp_harf_2_lh || ''}" /></td>
                <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_harf_2_rh_상" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(상)" value="${data.temp_harf_2_rh_상 || data.temp_harf_2_rh || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_harf_1_lh_하" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(하)" value="${data.temp_harf_1_lh_하 || ''}" /></td>
                <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_harf_1_rh_하" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(하)" value="${data.temp_harf_1_rh_하 || ''}" /></td>
                <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_harf_2_lh_하" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(하)" value="${data.temp_harf_2_lh_하 || ''}" /></td>
                <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_harf_2_rh_하" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(하)" value="${data.temp_harf_2_rh_하 || ''}" /></td>
              </tr>

              <!-- 종물 (상/하) -->
              <tr>
                <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  종물
                </td>
                <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_finish_1_lh_상" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(상)" value="${data.temp_finish_1_lh_상 || data.temp_finish_1_lh || ''}" /></td>
                <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_finish_1_rh_상" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(상)" value="${data.temp_finish_1_rh_상 || data.temp_finish_1_rh || ''}" /></td>
                <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_finish_2_lh_상" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(상)" value="${data.temp_finish_2_lh_상 || data.temp_finish_2_lh || ''}" /></td>
                <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_finish_2_rh_상" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(상)" value="${data.temp_finish_2_rh_상 || data.temp_finish_2_rh || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_finish_1_lh_하" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(하)" value="${data.temp_finish_1_lh_하 || ''}" /></td>
                <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_finish_1_rh_하" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(하)" value="${data.temp_finish_1_rh_하 || ''}" /></td>
                <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_finish_2_lh_하" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(하)" value="${data.temp_finish_2_lh_하 || ''}" /></td>
                <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="vulc_temp_finish_2_rh_하" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" placeholder="(하)" value="${data.temp_finish_2_rh_하 || ''}" /></td>
              </tr>

              <!-- 2. 가류시간 영역 -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  가류시간(Time)- 초<br>(Sec)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  규격 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  초물(Start)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_1_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${data.time_start_1_lh || data.time_start_frt_p || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_1_rh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${data.time_start_1_rh || data.time_start_frt_q || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_2_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${data.time_start_2_lh || data.time_start_rr_s_lh || data.time_start_rr_r || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_2_rh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${data.time_start_2_rh || data.time_start_rr_s_rh || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  중물(Harf)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_1_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${data.time_harf_1_lh || data.time_harf_frt_p || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_1_rh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${data.time_harf_1_rh || data.time_harf_frt_q || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_2_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${data.time_harf_2_lh || data.time_harf_rr_s_lh || data.time_harf_rr_r || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_2_rh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${data.time_harf_2_rh || data.time_harf_rr_s_rh || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  종물(Finish)
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
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">구 분(Division)</th>
                <th style="border: 1px solid #000; padding: 6px; width: 72%;">Frunk</th>
              </tr>
              <tr style="background: #fffde7; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">부 위(Part)</th>
                <th style="border: 1px solid #000; padding: 6px; width: 72%;">열융착 연결부분</th>
              </tr>
            </thead>
            <tbody>
              <!-- 1. 가류온도 영역 -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle; width: 14%;">
                  가류온도<br>(Temperature) 상<br>(Upper/하(DOWN)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; width: 14%;">
                  규격 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  초물(Start)
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; gap: 4px;">
                    <input type="text" id="vulc_temp_start_frt_p_상" class="form-control" style="flex: 1; height: 24px; text-align: center; font-size: 11px; padding: 2px;" placeholder="(상)" value="${v.temp_start_frt_p_상 ?? v.temp_start_frt_p ?? ''}" />
                    <input type="text" id="vulc_temp_start_frt_p_하" class="form-control" style="flex: 1; height: 24px; text-align: center; font-size: 11px; padding: 2px;" placeholder="(하)" value="${v.temp_start_frt_p_하 ?? ''}" />
                  </div>
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  중물(Harf)
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; gap: 4px;">
                    <input type="text" id="vulc_temp_harf_frt_p_상" class="form-control" style="flex: 1; height: 24px; text-align: center; font-size: 11px; padding: 2px;" placeholder="(상)" value="${v.temp_harf_frt_p_상 ?? v.temp_harf_frt_p ?? ''}" />
                    <input type="text" id="vulc_temp_harf_frt_p_하" class="form-control" style="flex: 1; height: 24px; text-align: center; font-size: 11px; padding: 2px;" placeholder="(하)" value="${v.temp_harf_frt_p_하 ?? ''}" />
                  </div>
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  종물(Finish)
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; gap: 4px;">
                    <input type="text" id="vulc_temp_finish_frt_p_상" class="form-control" style="flex: 1; height: 24px; text-align: center; font-size: 11px; padding: 2px;" placeholder="(상)" value="${v.temp_finish_frt_p_상 ?? v.temp_finish_frt_p ?? ''}" />
                    <input type="text" id="vulc_temp_finish_frt_p_하" class="form-control" style="flex: 1; height: 24px; text-align: center; font-size: 11px; padding: 2px;" placeholder="(하)" value="${v.temp_finish_frt_p_하 ?? ''}" />
                  </div>
                </td>
              </tr>

              <!-- 2. 가류시간 영역 -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  가류시간(Time)- 초<br>(Sec)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  규격 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  초물(Start)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_frt_p || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  중물(Harf)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_frt_p || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  종물(Finish)
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
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">구 분(Division)</th>
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">LH</th>
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">RH</th>
              </tr>
              <tr style="background: #fffde7; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">부 위(Part)</th>
                <th style="border: 1px solid #000; padding: 6px; width: 16%;">X부</th>
                <th style="border: 1px solid #000; padding: 6px; width: 16%;">Y부</th>
                <th style="border: 1px solid #000; padding: 6px; width: 16%;">X부</th>
                <th style="border: 1px solid #000; padding: 6px; width: 16%;">Y부</th>
              </tr>
            </thead>
            <tbody>
              <!-- 1. 가류온도 영역 -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  가류온도<br>(Temperature) 상<br>(Upper/하(DOWN)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  규격 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
                
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  초물(Start)
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
      <input type="text" id="vulc_temp_start_frt_p_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_frt_p_상 || '200'}" readonly />
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
      <input type="text" id="vulc_temp_start_frt_p_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_frt_p_하 || '200'}" readonly />
    </div>
  </td>
                <td style="border: 1px solid #000; padding: 2px;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
      <input type="text" id="vulc_temp_start_frt_q_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_frt_q_상 || '200'}" readonly />
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
      <input type="text" id="vulc_temp_start_frt_q_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_frt_q_하 || '200'}" readonly />
    </div>
  </td>
                <td style="border: 1px solid #000; padding: 2px;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
      <input type="text" id="vulc_temp_start_rr_r_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_rr_r_상 || '200'}" readonly />
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
      <input type="text" id="vulc_temp_start_rr_r_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_rr_r_하 || '200'}" readonly />
    </div>
  </td>
                <td style="border: 1px solid #000; padding: 2px;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
      <input type="text" id="vulc_temp_start_rr_s_lh_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_rr_s_lh_상 || '200'}" readonly />
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
      <input type="text" id="vulc_temp_start_rr_s_lh_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_rr_s_lh_하 || '200'}" readonly />
    </div>
  </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  중물(Harf)
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
      <input type="text" id="vulc_temp_harf_frt_p_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_frt_p_상 || '200'}" readonly />
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
      <input type="text" id="vulc_temp_harf_frt_p_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_frt_p_하 || '200'}" readonly />
    </div>
  </td>
                <td style="border: 1px solid #000; padding: 2px;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
      <input type="text" id="vulc_temp_harf_frt_q_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_frt_q_상 || '200'}" readonly />
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
      <input type="text" id="vulc_temp_harf_frt_q_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_frt_q_하 || '200'}" readonly />
    </div>
  </td>
                <td style="border: 1px solid #000; padding: 2px;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
      <input type="text" id="vulc_temp_harf_rr_r_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_rr_r_상 || '200'}" readonly />
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
      <input type="text" id="vulc_temp_harf_rr_r_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_rr_r_하 || '200'}" readonly />
    </div>
  </td>
                <td style="border: 1px solid #000; padding: 2px;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
      <input type="text" id="vulc_temp_harf_rr_s_lh_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_rr_s_lh_상 || '200'}" readonly />
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
      <input type="text" id="vulc_temp_harf_rr_s_lh_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_rr_s_lh_하 || '200'}" readonly />
    </div>
  </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  종물(Finish)
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
      <input type="text" id="vulc_temp_finish_frt_p_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_frt_p_상 || '200'}" readonly />
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
      <input type="text" id="vulc_temp_finish_frt_p_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_frt_p_하 || '200'}" readonly />
    </div>
  </td>
                <td style="border: 1px solid #000; padding: 2px;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
      <input type="text" id="vulc_temp_finish_frt_q_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_frt_q_상 || '200'}" readonly />
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
      <input type="text" id="vulc_temp_finish_frt_q_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_frt_q_하 || '200'}" readonly />
    </div>
  </td>
                <td style="border: 1px solid #000; padding: 2px;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
      <input type="text" id="vulc_temp_finish_rr_r_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_rr_r_상 || '200'}" readonly />
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
      <input type="text" id="vulc_temp_finish_rr_r_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_rr_r_하 || '200'}" readonly />
    </div>
  </td>
                <td style="border: 1px solid #000; padding: 2px;">
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
      <input type="text" id="vulc_temp_finish_rr_s_lh_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_rr_s_lh_상 || '200'}" readonly />
    </div>
    <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
      <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
      <input type="text" id="vulc_temp_finish_rr_s_lh_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_rr_s_lh_하 || '200'}" readonly />
    </div>
  </td>
              </tr>

              <!-- 2. 가류시간 영역 -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  가류시간(Time)- 초<br>(Sec)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  규격 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  초물(Start)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_frt_p || '90'}" readonly /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_frt_q" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_frt_q || '90'}" readonly /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_rr_r" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_rr_r || '90'}" readonly /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_rr_s_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_rr_s_lh || '90'}" readonly /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  중물(Harf)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_frt_p || '90'}" readonly /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_frt_q" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_frt_q || '90'}" readonly /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_rr_r" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_rr_r || '90'}" readonly /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_rr_s_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_rr_s_lh || '90'}" readonly /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  종물(Finish)
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
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">구분 (FRT)</th>
                <th style="border: 1px solid #000; padding: 6px; width: 33%;">FRT(P)_L/R</th>
                <th style="border: 1px solid #000; padding: 6px; width: 33%;">FRT(Q)_L/R</th>
              </tr>
            </thead>
            <tbody>
              <!-- 1. 가류온도 영역 -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  가류온도<br>(Temperature) 상<br>(Upper/하(DOWN)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  규격 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">초물(Start)</td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
                    <input type="text" id="vulc_temp_start_frt_p_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_frt_p_상 || '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
                    <input type="text" id="vulc_temp_start_frt_p_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_frt_p_하 || '200'}" readonly />
                  </div>
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
                    <input type="text" id="vulc_temp_start_frt_q_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_frt_q_상 || '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
                    <input type="text" id="vulc_temp_start_frt_q_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_frt_q_하 || '200'}" readonly />
                  </div>
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">중물(Harf)</td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
                    <input type="text" id="vulc_temp_harf_frt_p_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_frt_p_상 || '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
                    <input type="text" id="vulc_temp_harf_frt_p_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_frt_p_하 || '200'}" readonly />
                  </div>
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
                    <input type="text" id="vulc_temp_harf_frt_q_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_frt_q_상 || '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
                    <input type="text" id="vulc_temp_harf_frt_q_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_frt_q_하 || '200'}" readonly />
                  </div>
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">종물(Finish)</td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
                    <input type="text" id="vulc_temp_finish_frt_p_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_frt_p_상 || '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
                    <input type="text" id="vulc_temp_finish_frt_p_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_frt_p_하 || '200'}" readonly />
                  </div>
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
                    <input type="text" id="vulc_temp_finish_frt_q_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_frt_q_상 || '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
                    <input type="text" id="vulc_temp_finish_frt_q_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_frt_q_하 || '200'}" readonly />
                  </div>
                </td>
              </tr>

              <!-- 2. 가류시간 영역 -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  가류시간(Time)- 초<br>(Sec)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  규격 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">초물(Start)</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_frt_p || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_frt_q" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_frt_q || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">중물(Harf)</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_frt_p || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_frt_q" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_frt_q || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">종물(Finish)</td>
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
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">구분 (RR)</th>
                <th style="border: 1px solid #000; padding: 6px; width: 22%;">RR(R)_L/R</th>
                <th style="border: 1px solid #000; padding: 6px; width: 22%;">RR(S)_LH</th>
                <th style="border: 1px solid #000; padding: 6px; width: 22%;">RR(S)_RH</th>
              </tr>
            </thead>
            <tbody>
              <!-- 1. 가류온도 영역 -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  가류온도<br>(Temperature) 상<br>(Upper/하(DOWN)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  규격 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">초물(Start)</td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
                    <input type="text" id="vulc_temp_start_rr_r_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_rr_r_상 || '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
                    <input type="text" id="vulc_temp_start_rr_r_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_rr_r_하 || '200'}" readonly />
                  </div>
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
                    <input type="text" id="vulc_temp_start_rr_s_lh_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_rr_s_lh_상 || '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
                    <input type="text" id="vulc_temp_start_rr_s_lh_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_rr_s_lh_하 || '200'}" readonly />
                  </div>
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
                    <input type="text" id="vulc_temp_start_rr_s_rh_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_rr_s_rh_상 || '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
                    <input type="text" id="vulc_temp_start_rr_s_rh_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_rr_s_rh_하 || '200'}" readonly />
                  </div>
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">중물(Harf)</td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
                    <input type="text" id="vulc_temp_harf_rr_r_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_rr_r_상 || '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
                    <input type="text" id="vulc_temp_harf_rr_r_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_rr_r_하 || '200'}" readonly />
                  </div>
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
                    <input type="text" id="vulc_temp_harf_rr_s_lh_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_rr_s_lh_상 || '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
                    <input type="text" id="vulc_temp_harf_rr_s_lh_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_rr_s_lh_하 || '200'}" readonly />
                  </div>
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
                    <input type="text" id="vulc_temp_harf_rr_s_rh_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_rr_s_rh_상 || '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
                    <input type="text" id="vulc_temp_harf_rr_s_rh_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_rr_s_rh_하 || '200'}" readonly />
                  </div>
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">종물(Finish)</td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
                    <input type="text" id="vulc_temp_finish_rr_r_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_rr_r_상 || '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
                    <input type="text" id="vulc_temp_finish_rr_r_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_rr_r_하 || '200'}" readonly />
                  </div>
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
                    <input type="text" id="vulc_temp_finish_rr_s_lh_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_rr_s_lh_상 || '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
                    <input type="text" id="vulc_temp_finish_rr_s_lh_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_rr_s_lh_하 || '200'}" readonly />
                  </div>
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
                    <input type="text" id="vulc_temp_finish_rr_s_rh_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_rr_s_rh_상 || '200'}" readonly />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
                    <input type="text" id="vulc_temp_finish_rr_s_rh_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_rr_s_rh_하 || '200'}" readonly />
                  </div>
                </td>
              </tr>
              
              <!-- 2. 가류시간 영역 -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  가류시간(Time)- 초<br>(Sec)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  규격 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">초물(Start)</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_rr_r" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_rr_r || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_rr_s_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_rr_s_lh || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_rr_s_rh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_rr_s_rh || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">중물(Harf)</td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_rr_r" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_rr_r || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_rr_s_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_rr_s_lh || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_rr_s_rh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_rr_s_rh || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">종물(Finish)</td>
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
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">구 분(Division)</th>
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">RR C PART'G</th>
              </tr>
              <tr style="background: #fffde7; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">부 위(Part)</th>
                <th style="border: 1px solid #000; padding: 6px; width: 40%;">LH</th>
                <th style="border: 1px solid #000; padding: 6px; width: 40%;">RH</th>
              </tr>
            </thead>
            <tbody>
              <!-- 1. 가류온도 영역 -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  가류온도<br>(Temperature) 상<br>(Upper/하(DOWN)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  규격 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  초물(Start)
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
                    <input type="text" id="vulc_temp_start_frt_p_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_frt_p_상 ?? v.temp_start_frt_p ?? ''}" />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
                    <input type="text" id="vulc_temp_start_frt_p_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_frt_p_하 ?? ''}" />
                  </div>
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
                    <input type="text" id="vulc_temp_start_frt_q_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_frt_q_상 ?? v.temp_start_frt_q ?? ''}" />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
                    <input type="text" id="vulc_temp_start_frt_q_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_start_frt_q_하 ?? ''}" />
                  </div>
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  중물(Harf)
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
                    <input type="text" id="vulc_temp_harf_frt_p_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_frt_p_상 ?? v.temp_harf_frt_p ?? ''}" />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
                    <input type="text" id="vulc_temp_harf_frt_p_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_frt_p_하 ?? ''}" />
                  </div>
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
                    <input type="text" id="vulc_temp_harf_frt_q_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_frt_q_상 ?? v.temp_harf_frt_q ?? ''}" />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
                    <input type="text" id="vulc_temp_harf_frt_q_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_harf_frt_q_하 ?? ''}" />
                  </div>
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  종물(Finish)
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
                    <input type="text" id="vulc_temp_finish_frt_p_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_frt_p_상 ?? v.temp_finish_frt_p ?? ''}" />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
                    <input type="text" id="vulc_temp_finish_frt_p_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_frt_p_하 ?? ''}" />
                  </div>
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
                    <input type="text" id="vulc_temp_finish_frt_q_상" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_frt_q_상 ?? v.temp_finish_frt_q ?? ''}" />
                  </div>
                  <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                    <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
                    <input type="text" id="vulc_temp_finish_frt_q_하" class="form-control" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${v.temp_finish_frt_q_하 ?? ''}" />
                  </div>
                </td>
              </tr>

              <!-- 2. 가류시간 영역 -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  가류시간(Time)- 초<br>(Sec)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  규격 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  초물(Start)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_frt_p || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_frt_q" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_frt_q || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  중물(Harf)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_frt_p || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_frt_q" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_frt_q || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  종물(Finish)
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
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">구 분(Division)</th>
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">FRT</th>
                <th colspan="3" style="border: 1px solid #000; padding: 6px;">RR</th>
              </tr>
              <tr style="background: #fffde7; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">부 위(Part)</th>
                <th style="border: 1px solid #000; padding: 6px; width: 16%;">FRT(P)_L/R</th>
                <th style="border: 1px solid #000; padding: 6px; width: 16%;">FRT(Q)_L/R</th>
                <th style="border: 1px solid #000; padding: 6px; width: 16%;">RR(R)_L/R</th>
                <th style="border: 1px solid #000; padding: 6px; width: 16%;">RR(S)_LH</th>
                <th style="border: 1px solid #000; padding: 6px; width: 16%;">RR(S)_RH</th>
              </tr>
            </thead>
            <tbody>
              <!-- 1. 가류온도 영역 -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  가류온도<br>(Temperature) 상<br>(Upper/하(DOWN)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  규격 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  초물(Start)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_start_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_start_frt_p || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_start_frt_q" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_start_frt_q || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_start_rr_r" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_start_rr_r || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_start_rr_s_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_start_rr_s_lh || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_start_rr_s_rh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_start_rr_s_rh || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  중물(Harf)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_harf_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_harf_frt_p || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_harf_frt_q" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_harf_frt_q || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_harf_rr_r" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_harf_rr_r || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_harf_rr_s_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_harf_rr_s_lh || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_harf_rr_s_rh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_harf_rr_s_rh || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  종물(Finish)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_finish_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_finish_frt_p || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_finish_frt_q" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_finish_frt_q || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_finish_rr_r" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_finish_rr_r || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_finish_rr_s_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_finish_rr_s_lh || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_temp_finish_rr_s_rh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.temp_finish_rr_s_rh || ''}" /></td>
              </tr>

              <!-- 2. 가류시간 영역 -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  가류시간(Time)- 초<br>(Sec)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  규격 (Spec)
                </td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  초물(Start)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_frt_p || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_frt_q" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_frt_q || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_rr_r" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_rr_r || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_rr_s_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_rr_s_lh || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_start_rr_s_rh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_start_rr_s_rh || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  중물(Harf)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_frt_p" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_frt_p || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_frt_q" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_frt_q || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_rr_r" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_rr_r || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_rr_s_lh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_rr_s_lh || ''}" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="vulc_time_harf_rr_s_rh" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${v.time_harf_rr_s_rh || ''}" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  종물(Finish)
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
            🔗 <span class="sec-num"></span> 조인트 고무 LOT 번호 입력
          </label>
          <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 10px;">조인트 고무 소재의 LOT 번호를 입력하세요.</p>
          <input type="text" id="jointRubberLotNo" class="form-control lot-datetime-input"
            style="max-width: 280px; font-family: monospace;"
            placeholder="년월일시분 (예: 2607251330)"
            value="${jointLotVal}" />
        </div>

        <div class="card" style="padding: 16px; margin-bottom: 16px;">
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
            ♨️ <span class="sec-num"></span> 설비 가류온도 & 가류시간 입력
          </label>
          ${vulcTableHTML}
        </div>
      `;
      // blur 이벤트 바인딩
      const jointInput = section5.querySelector('#jointRubberLotNo');
      if (jointInput) {
        jointInput.addEventListener('blur', () => {
          if (jointInput.value) jointInput.value = autoFormatDateTimeString(jointInput.value);
        });
        jointInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') jointInput.value = autoFormatDateTimeString(jointInput.value);
        });
      }

      if (formCode === 4012) {
        bindNumberWheelPicker(section5.querySelector('#vulc_temp_start_frt_p_상'), '초물 가류온도 (상)', 200, 30, '℃');
        bindNumberWheelPicker(section5.querySelector('#vulc_temp_start_frt_p_하'), '초물 가류온도 (하)', 200, 30, '℃');
        bindNumberWheelPicker(section5.querySelector('#vulc_temp_harf_frt_p_상'), '중물 가류온도 (상)', 200, 30, '℃');
        bindNumberWheelPicker(section5.querySelector('#vulc_temp_harf_frt_p_하'), '중물 가류온도 (하)', 200, 30, '℃');
        bindNumberWheelPicker(section5.querySelector('#vulc_temp_finish_frt_p_상'), '종물 가류온도 (상)', 200, 30, '℃');
        bindNumberWheelPicker(section5.querySelector('#vulc_temp_finish_frt_p_하'), '종물 가류온도 (하)', 200, 30, '℃');

        bindNumberWheelPicker(section5.querySelector('#vulc_time_start_frt_p'), '초물 가류시간', 90, 30, '초');
        bindNumberWheelPicker(section5.querySelector('#vulc_time_harf_frt_p'), '중물 가류시간', 90, 30, '초');
        bindNumberWheelPicker(section5.querySelector('#vulc_time_finish_frt_p'), '종물 가류시간', 90, 30, '초');
      }
     else if (formCode === 4002) {
        const phases = [{k:'start', n:'초물'}, {k:'harf', n:'중물'}, {k:'finish', n:'종물'}];
        const cols = [{k:'frt_p', n:'LH X부'}, {k:'frt_q', n:'LH Y부'}, {k:'rr_r', n:'RH X부'}, {k:'rr_s_lh', n:'RH Y부'}];
        phases.forEach(p => {
          cols.forEach(c => {
            ['상', '하'].forEach(pos => {
              const el = section5.querySelector('#vulc_temp_' + p.k + '_' + c.k + '_' + pos);
              if (el) bindNumberWheelPicker(el, p.n + ' 가류온도 ' + c.n + ' (' + pos + ')', 200, 30, '℃');
            });
            const timeEl = section5.querySelector('#vulc_time_' + p.k + '_' + c.k);
            if (timeEl) bindNumberWheelPicker(timeEl, p.n + ' 가류시간 ' + c.n, 90, 30, '초');
          });
        });
      }
    } else if (curProc === '소재준비' || curProc.startsWith('소재준비')) {
      // 소재준비 공정: 치수확인 입력 양식 (사진 표준 동일 양식 적용)
      const d = existingData?.dimData || {};
      const curCarCode = carModelValue ? carModelValue.value : currentCarCode;
      const curPart = partValueInput ? partValueInput.value : '';

      const formCode = getCurrentFormCode();
      const isDtCrew = (curCarCode === 'DT CREW' || curCarCode === 'DT QUAD' || curCarCode === 'DS CREW' || curCarCode === 'DS STD');
      const dtLenSpec = (formCode === 2023) ? '475 ± 5' : ((curCarCode === 'DT QUAD') ? '509 ± 5' : '779 ± 5');
      const dtStep2Spec = (formCode === 2023) ? '40 ± 1' : '28 ± 1';
      const dtStep3Spec = (formCode === 2023) ? '26 ± 1' : '28 ± 1';
      const dimImgSrc = (formCode === 2023) ? 'images/ds_crew_prep_d_dimension.png' : 'images/dt_crew_dimension.png';
      const dimImgMaxWidth = (formCode === 2023) ? '320px' : '650px';
      const dtRowSpan = (formCode === 2023) ? 3 : 4;
      const renderDtRow4 = (pos) => (formCode === 2023) ? '' : `
                  <tr>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">④</td>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">93 ± 0.5</td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_${pos}_4_LH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_' + pos + '_4_LH'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_${pos}_4_RH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_' + pos + '_4_RH'] || ''}" /></td>
                  </tr>
      `;

      if (isDtCrew) {
        section5.innerHTML = `
          <div class="card" style="padding: 16px; margin-bottom: 16px;">
            <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
              📐 <span class="sec-num"></span> 치수확인
            </label>
            <div style="max-width: ${dimImgMaxWidth}; margin: 0 auto 14px auto;">
              <img src="${dimImgSrc}" alt="${curCarCode} D/SIDE 치수확인 도면" style="width: 100%; height: auto; display: block; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);" />
            </div>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #ffffff; font-weight: 700;">
                    <th style="border: 1px solid #000; padding: 6px 2px; width: 15%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">구분</th>
                    <th style="border: 1px solid #000; padding: 6px 2px; width: 12%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">위치</th>
                    <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">스펙(mm)</th>
                    <th style="border: 1px solid #000; padding: 6px 2px; width: 24%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">LH</th>
                    <th style="border: 1px solid #000; padding: 6px 2px; width: 24%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">RH</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- 초물 -->
                  <tr>
                    <td rowspan="${dtRowSpan}" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">초물</td>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">①</td>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">${dtLenSpec}</td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_초_1_LH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_초_1_LH'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_초_1_RH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_초_1_RH'] || ''}" /></td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">②</td>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">${dtStep2Spec}</td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_초_2_LH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_초_2_LH'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_초_2_RH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_초_2_RH'] || ''}" /></td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">③</td>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">${dtStep3Spec}</td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_초_3_LH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_초_3_LH'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_초_3_RH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_초_3_RH'] || ''}" /></td>
                  </tr>
${renderDtRow4('초')}

                  <!-- 중물 -->
                  <tr>
                    <td rowspan="${dtRowSpan}" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">중물</td>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">①</td>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">${dtLenSpec}</td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_중_1_LH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_중_1_LH'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_중_1_RH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_중_1_RH'] || ''}" /></td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">②</td>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">${dtStep2Spec}</td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_중_2_LH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_중_2_LH'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_중_2_RH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_중_2_RH'] || ''}" /></td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">③</td>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">${dtStep3Spec}</td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_중_3_LH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_중_3_LH'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_중_3_RH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_중_3_RH'] || ''}" /></td>
                  </tr>
${renderDtRow4('중')}

                  <!-- 종물 -->
                  <tr>
                    <td rowspan="${dtRowSpan}" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">종물</td>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">①</td>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">${dtLenSpec}</td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_종_1_LH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_종_1_LH'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_종_1_RH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_종_1_RH'] || ''}" /></td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">②</td>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">${dtStep2Spec}</td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_종_2_LH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_종_2_LH'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_종_2_RH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_종_2_RH'] || ''}" /></td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">③</td>
                    <td style="border: 1px solid #000; padding: 6px 2px; font-weight: 700;">${dtStep3Spec}</td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_종_3_LH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_종_3_LH'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_dt_종_3_RH" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${d['dt_종_3_RH'] || ''}" /></td>
                  </tr>
${renderDtRow4('종')}
                </tbody>
              </table>
            </div>
          </div>
        `;
        return;
      }

      const isJg1Inbelt = (curCarCode === 'JG1' || curCarCode === 'JG1S' || (currentMakerName && currentMakerName.includes('제네시스'))) &&
                          (curPart === '인벨트' || !curPart || curPart === '');

      // const diagramHTML = isJg1Inbelt ? `
      //   <div style="max-width: 650px; margin: 14px auto 0 auto;">
      //     <img src="images/jg1_inbelt_dimension.png" alt="JG1 인벨트 치수확인 도면" style="width: 100%; height: auto; display: block; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);" />
      //   </div>
      // ` : '';
      const diagramHTML = '';

      
      if (formCode === 1001 || formCode === 1031) {
        section5.innerHTML = `
          <div class="card" style="padding: 16px; margin-bottom: 16px;">
            <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
              📐 <span class="sec-num"></span> 치수확인 (FRT)
            </label>
            <div style="overflow-x: auto; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #fffde7; font-weight: 700; color: #000;">
                    <th colspan="3" style="border: 1px solid #000; padding: 6px; width: 40%;">구 분(Division)</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 30%;">FRT LH</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 30%;">FRT RH</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- 1. 정치절단길이 -->
                  <tr>
                    <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                      정치절단길이<br>(Spec Cutt,g )
                    </td>
                    <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      규격 (Spec)
                    </td>
                    <td colspan="2" style="border: 1px solid #000; font-weight: 700; padding: 4px;">
                      745 ± 1mm
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      실측(Act) <span style="font-size: 9px; font-weight: normal;">(초/중/종)</span>
                    </td>
                    <td colspan="2" style="border: 1px solid #000; padding: 3px 2px;">
                      <div style="display: flex; align-items: center; justify-content: space-around; gap: 2px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700;">(초)</span>
                        <input type="text" id="dim_cut_FRT_초" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_초'] || ''}" />
                        <span style="font-size: 10px; color: #333; font-weight: 700;">(중)</span>
                        <input type="text" id="dim_cut_FRT_중" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_중'] || ''}" />
                        <span style="font-size: 10px; color: #333; font-weight: 700;">(종)</span>
                        <input type="text" id="dim_cut_FRT_종" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_종'] || ''}" />
                      </div>
                    </td>
                  </tr>

                  <!-- 2. 단컷팅 (Step cutt,g) - 전방 & 후방 -->
                  <tr>
                    <td rowspan="8" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                      단컷팅<br>(Step cutt,g)
                    </td>
                    <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                      전방
                    </td>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      규격(Spec)
                    </td>
                    <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">36</td>
                    <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">36</td>
                  </tr>
                  <tr>
                    <td rowspan="3" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                      실측(Act)
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                        <span style="font-size: 9px; color: #555; font-weight: 700;">(초)</span>
                        <input type="text" id="dim_step_f_초_FL" class="form-control" style="width: 70%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_초_FL'] || ''}" />
                      </div>
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_f_초_FR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_초_FR'] || ''}" />
                    </td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                        <span style="font-size: 9px; color: #555; font-weight: 700;">(중)</span>
                        <input type="text" id="dim_step_f_중_FL" class="form-control" style="width: 70%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_중_FL'] || ''}" />
                      </div>
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_f_중_FR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_중_FR'] || ''}" />
                    </td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                        <span style="font-size: 9px; color: #555; font-weight: 700;">(종)</span>
                        <input type="text" id="dim_step_f_종_FL" class="form-control" style="width: 70%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_종_FL'] || ''}" />
                      </div>
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_f_종_FR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_종_FR'] || ''}" />
                    </td>
                  </tr>
                  
                  <!-- 후방 -->
                  <tr>
                    <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                      후방
                    </td>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      규격(Spec)
                    </td>
                    <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">28</td>
                    <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">28</td>
                  </tr>
                  <tr>
                    <td rowspan="3" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                      실측(Act)
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                        <span style="font-size: 9px; color: #555; font-weight: 700;">(초)</span>
                        <input type="text" id="dim_step_r_초_FL" class="form-control" style="width: 70%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_초_FL'] || ''}" />
                      </div>
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_r_초_FR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_초_FR'] || ''}" />
                    </td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                        <span style="font-size: 9px; color: #555; font-weight: 700;">(중)</span>
                        <input type="text" id="dim_step_r_중_FL" class="form-control" style="width: 70%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_중_FL'] || ''}" />
                      </div>
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_r_중_FR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_중_FR'] || ''}" />
                    </td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                        <span style="font-size: 9px; color: #555; font-weight: 700;">(종)</span>
                        <input type="text" id="dim_step_r_종_FL" class="form-control" style="width: 70%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_종_FL'] || ''}" />
                      </div>
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_r_종_FR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_종_FR'] || ''}" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
              📐 <span class="sec-num"></span> 치수확인 (RR)
            </label>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #fffde7; font-weight: 700; color: #000;">
                    <th colspan="3" style="border: 1px solid #000; padding: 6px; width: 40%;">구 분(Division)</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 30%;">RR LH</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 30%;">RR RH</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- 1. 정치절단길이 -->
                  <tr>
                    <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                      정치절단길이<br>(Spec Cutt,g )
                    </td>
                    <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      규격 (Spec)
                    </td>
                    <td colspan="2" style="border: 1px solid #000; font-weight: 700; padding: 4px;">
                      687 ± 1mm
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      실측(Act) <span style="font-size: 9px; font-weight: normal;">(초/중/종)</span>
                    </td>
                    <td colspan="2" style="border: 1px solid #000; padding: 3px 2px;">
                      <div style="display: flex; align-items: center; justify-content: space-around; gap: 2px;">
                        <span style="font-size: 10px; color: #333; font-weight: 700;">(초)</span>
                        <input type="text" id="dim_cut_RR_초" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_RR_초'] || ''}" />
                        <span style="font-size: 10px; color: #333; font-weight: 700;">(중)</span>
                        <input type="text" id="dim_cut_RR_중" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_RR_중'] || ''}" />
                        <span style="font-size: 10px; color: #333; font-weight: 700;">(종)</span>
                        <input type="text" id="dim_cut_RR_종" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_RR_종'] || ''}" />
                      </div>
                    </td>
                  </tr>

                  <!-- 2. 단컷팅 (Step cutt,g) - 전방 & 후방 -->
                  <tr>
                    <td rowspan="8" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                      단컷팅<br>(Step cutt,g)
                    </td>
                    <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                      전방
                    </td>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      규격(Spec)
                    </td>
                    <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">36</td>
                    <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">36</td>
                  </tr>
                  <tr>
                    <td rowspan="3" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                      실측(Act)
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_f_초_RL" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_초_RL'] || ''}" />
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_f_초_RR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_초_RR'] || ''}" />
                    </td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_f_중_RL" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_중_RL'] || ''}" />
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_f_중_RR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_중_RR'] || ''}" />
                    </td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_f_종_RL" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_종_RL'] || ''}" />
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_f_종_RR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_종_RR'] || ''}" />
                    </td>
                  </tr>
                  
                  <!-- 후방 -->
                  <tr>
                    <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                      후방
                    </td>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      규격(Spec)
                    </td>
                    <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">29</td>
                    <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">29</td>
                  </tr>
                  <tr>
                    <td rowspan="3" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                      실측(Act)
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_r_초_RL" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_초_RL'] || ''}" />
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_r_초_RR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_초_RR'] || ''}" />
                    </td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_r_중_RL" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_중_RL'] || ''}" />
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_r_중_RR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_중_RR'] || ''}" />
                    </td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_r_종_RL" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_종_RL'] || ''}" />
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="text" id="dim_step_r_종_RR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_종_RR'] || ''}" />
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
            📐 <span class="sec-num"></span> 치수확인
          </label>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <thead>
                <tr style="background: #fffde7; font-weight: 700; color: #000;">
                  <th colspan="3" style="border: 1px solid #000; padding: 6px;">구 분(Division)</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 18%;">FRT LH</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 18%;">FRT RH</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 18%;">RR LH</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 18%;">RR RH</th>
                </tr>
              </thead>
              <tbody>
                <!-- 1. 정치절단길이 -->
                <tr>
                  <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    정치절단길이<br>(Spec Cutt,g )
                  </td>
                  <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                    규격 (Spec)
                  </td>
                  <td colspan="2" style="border: 1px solid #000; font-weight: 700; padding: 4px;">
                    745 ± 1mm
                  </td>
                  <td colspan="2" style="border: 1px solid #000; font-weight: 700; padding: 4px;">
                    687 ± 1mm
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                    실측(Act) <span style="font-size: 9px; font-weight: normal;">(초/중/종)</span>
                  </td>
                  <td colspan="2" style="border: 1px solid #000; padding: 3px 2px;">
                    <div style="display: flex; align-items: center; justify-content: space-around; gap: 2px;">
                      <span style="font-size: 10px; color: #333; font-weight: 700;">(초)</span>
                      <input type="text" id="dim_cut_FRT_초" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_초'] || ''}" />
                      <span style="font-size: 10px; color: #333; font-weight: 700;">(중)</span>
                      <input type="text" id="dim_cut_FRT_중" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_중'] || ''}" />
                      <span style="font-size: 10px; color: #333; font-weight: 700;">(종)</span>
                      <input type="text" id="dim_cut_FRT_종" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_FRT_종'] || ''}" />
                    </div>
                  </td>
                  <td colspan="2" style="border: 1px solid #000; padding: 3px 2px;">
                    <div style="display: flex; align-items: center; justify-content: space-around; gap: 2px;">
                      <span style="font-size: 10px; color: #333; font-weight: 700;">(초)</span>
                      <input type="text" id="dim_cut_RR_초" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_RR_초'] || ''}" />
                      <span style="font-size: 10px; color: #333; font-weight: 700;">(중)</span>
                      <input type="text" id="dim_cut_RR_중" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_RR_중'] || ''}" />
                      <span style="font-size: 10px; color: #333; font-weight: 700;">(종)</span>
                      <input type="text" id="dim_cut_RR_종" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value="${d['cut_RR_종'] || ''}" />
                    </div>
                  </td>
                </tr>

                <!-- 2. 단컷팅 (Step cutt,g) - 전방 & 후방 -->
                <tr>
                  <td rowspan="8" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    단컷팅<br>(Step cutt,g)
                  </td>
                  <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    전방
                  </td>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                    규격(Spec)
                  </td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">36</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">36</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">36</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">36</td>
                </tr>
                <tr>
                  <td rowspan="3" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    실측(Act)
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                      <span style="font-size: 9px; color: #555; font-weight: 700;">(초)</span>
                      <input type="text" id="dim_step_f_초_FL" class="form-control" style="width: 70%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_초_FL'] || ''}" />
                    </div>
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_f_초_FR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_초_FR'] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_f_초_RL" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_초_RL'] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_f_초_RR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_초_RR'] || ''}" />
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                      <span style="font-size: 9px; color: #555; font-weight: 700;">(중)</span>
                      <input type="text" id="dim_step_f_중_FL" class="form-control" style="width: 70%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_중_FL'] || ''}" />
                    </div>
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_f_중_FR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_중_FR'] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_f_중_RL" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_중_RL'] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_f_중_RR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_중_RR'] || ''}" />
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                      <span style="font-size: 9px; color: #555; font-weight: 700;">(종)</span>
                      <input type="text" id="dim_step_f_종_FL" class="form-control" style="width: 70%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_종_FL'] || ''}" />
                    </div>
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_f_종_FR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_종_FR'] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_f_종_RL" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_종_RL'] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_f_종_RR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_f_종_RR'] || ''}" />
                  </td>
                </tr>

                <!-- 3. 단컷팅 (Step cutt,g) - 후방 -->
                <tr>
                  <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    후방
                  </td>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                    규격(Spec)
                  </td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">28</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">28</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">29</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">29</td>
                </tr>
                <tr>
                  <td rowspan="3" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    실측(Act)
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                      <span style="font-size: 9px; color: #555; font-weight: 700;">(초)</span>
                      <input type="text" id="dim_step_r_초_FL" class="form-control" style="width: 70%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_초_FL'] || ''}" />
                    </div>
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_r_초_FR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_초_FR'] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_r_초_RL" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_초_RL'] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_r_초_RR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_초_RR'] || ''}" />
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                      <span style="font-size: 9px; color: #555; font-weight: 700;">(중)</span>
                      <input type="text" id="dim_step_r_중_FL" class="form-control" style="width: 70%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_중_FL'] || ''}" />
                    </div>
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_r_중_FR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_중_FR'] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_r_중_RL" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_중_RL'] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_r_중_RR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_중_RR'] || ''}" />
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                      <span style="font-size: 9px; color: #555; font-weight: 700;">(종)</span>
                      <input type="text" id="dim_step_r_종_FL" class="form-control" style="width: 70%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_종_FL'] || ''}" />
                    </div>
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_r_종_FR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_종_FR'] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_r_종_RL" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_종_RL'] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="dim_step_r_종_RR" class="form-control" style="width: 100%; height: 24px; padding: 2px; text-align: center; font-size: 11px;" value="${d['step_r_종_RR'] || ''}" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          ${diagramHTML}
        </div>
      `;
      }

    } else if (curProc === '검사포장' || curProc === '검사/포장') {
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
              📐 <span class="sec-num"></span> 치수확인 (KM/KX HOOD SURROUND - #2044)
            </label>

            <!-- 1. 단면 길이(mm) -->
            <div style="margin-bottom: 20px;">
              <div style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">
                단면 길이(mm)
              </div>
              <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                  <thead>
                    <tr style="background: #ffffff; font-weight: 700;">
                      <th rowspan="2" style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">구분</th>
                      <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">LH</th>
                      <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">MIDDLE</th>
                      <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">RH</th>
                    </tr>
                    <tr style="background: #ffffff; font-weight: 700;">
                      <td style="border: 1px solid #000; padding: 5px 2px; font-weight: 700; color: #000; font-size: 11px;">700±5</td>
                      <td style="border: 1px solid #000; padding: 5px 2px; font-weight: 700; color: #000; font-size: 11px;">1086±5</td>
                      <td style="border: 1px solid #000; padding: 5px 2px; font-weight: 700; color: #000; font-size: 11px;">700±5</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">초</td>
                      <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_LH_초" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_LH_초')}" /></td>
                      <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_MID_초" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_MID_초')}" /></td>
                      <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_RH_초" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_RH_초')}" /></td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">중</td>
                      <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_LH_중" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_LH_중')}" /></td>
                      <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_MID_중" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_MID_중')}" /></td>
                      <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_RH_중" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_RH_중')}" /></td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">종</td>
                      <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_LH_종" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_LH_종')}" /></td>
                      <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_MID_종" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_MID_종')}" /></td>
                      <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="kmkx_cut_len_RH_종" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('cut_len_RH_종')}" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 2. 양 끝단 홀 간격(mm) -->
            <div>
              <div style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">
                양 끝단 홀 간격(mm)
              </div>
              <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                  <thead>
                    <tr style="background: #ffffff; font-weight: 700;">
                      <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">구분</th>
                      <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">LH</th>
                      <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">MIDDLE</th>
                      <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">RH</th>
                    </tr>
                    <tr style="background: #ffffff; font-weight: 700;">
                      <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 4px 2px; font-weight: 700; color: #000; font-size: 11px;">(좌측)</td>
                      <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 4px 2px; font-weight: 700; color: #000; font-size: 11px;">15±1</td>
                      <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 4px 2px; font-weight: 700; color: #000; font-size: 11px;">15±1</td>
                      <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 4px 2px; font-weight: 700; color: #000; font-size: 11px;">15±1</td>
                    </tr>
                    <tr style="background: #ffffff; font-weight: 700;">
                      <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 4px 2px; font-weight: 700; color: #000; font-size: 11px;">(우측)</td>
                      <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 4px 2px; font-weight: 700; color: #000; font-size: 11px;">15±1</td>
                      <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 4px 2px; font-weight: 700; color: #000; font-size: 11px;">15±1</td>
                      <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 4px 2px; font-weight: 700; color: #000; font-size: 11px;">15±1</td>
                    </tr>
                  </thead>
                  <tbody>
                    <!-- 초 -->
                    <tr>
                      <td rowspan="2" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">초</td>
                      <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_LH_초_좌" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_LH_초_좌')}" placeholder="좌" /></td>
                      <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_MID_초_좌" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_MID_초_좌')}" placeholder="좌" /></td>
                      <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_RH_초_좌" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_RH_초_좌')}" placeholder="좌" /></td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_LH_초_우" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_LH_초_우')}" placeholder="우" /></td>
                      <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_MID_초_우" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_MID_초_우')}" placeholder="우" /></td>
                      <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_RH_초_우" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_RH_초_우')}" placeholder="우" /></td>
                    </tr>

                    <!-- 중 -->
                    <tr>
                      <td rowspan="2" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">중</td>
                      <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_LH_중_좌" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_LH_중_좌')}" placeholder="좌" /></td>
                      <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_MID_중_좌" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_MID_중_좌')}" placeholder="좌" /></td>
                      <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_RH_중_좌" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_RH_중_좌')}" placeholder="좌" /></td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_LH_중_우" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_LH_중_우')}" placeholder="우" /></td>
                      <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_MID_중_우" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_MID_중_우')}" placeholder="우" /></td>
                      <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_RH_중_우" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_RH_중_우')}" placeholder="우" /></td>
                    </tr>

                    <!-- 종 -->
                    <tr>
                      <td rowspan="2" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">종</td>
                      <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_LH_종_좌" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_LH_종_좌')}" placeholder="좌" /></td>
                      <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_MID_종_좌" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_MID_종_좌')}" placeholder="좌" /></td>
                      <td style="border: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_RH_종_좌" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_RH_종_좌')}" placeholder="좌" /></td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_LH_종_우" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_LH_종_우')}" placeholder="우" /></td>
                      <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_MID_종_우" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_MID_종_우')}" placeholder="우" /></td>
                      <td style="border: 1px solid #000; border-top: 1px dotted #000; padding: 2px;"><input type="text" id="kmkx_hole_gap_RH_종_우" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="${g('hole_gap_RH_종_우')}" placeholder="우" /></td>
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
          ? '509 ± 5'
          : (formCode === 2035 || curCarCode === 'DS STD')
            ? '1018 ± 5'
            : ((formCode === 2027 || curCarCode === 'DS CREW') ? '707 ± 5' : '779 ± 5');
        const bClipSpec = (formCode === 2035 || curCarCode === 'DS STD') ? '29 ± 1' : '28 ± 1';
        const cSpec = (formCode === 2035 || curCarCode === 'DS STD')
          ? '391 ± 5'
          : ((formCode === 2027 || curCarCode === 'DS CREW')
            ? '379 ± 5'
            : ((formCode === 2015 || curCarCode === 'DT QUAD') ? '216 ± 4' : '246 ± 4'));
        
        const rowsDef = [
          { group: 'A 전장', spec: aSpec, items: [
            { pos: '초물', k: 'cho_A' },
            { pos: '중물', k: 'jung_A' },
            { pos: '종물', k: 'jong_A' }
          ]},
          { group: 'B 좌측 클립', spec: bClipSpec, items: [
            { pos: '초물', k: 'cho_B_left' },
            { pos: '중물', k: 'jung_B_left' },
            { pos: '종물', k: 'jong_B_left' }
          ]},
          { group: 'B 우측 클립', spec: bClipSpec, items: [
            { pos: '초물', k: 'cho_B_right' },
            { pos: '중물', k: 'jung_B_right' },
            { pos: '종물', k: 'jong_B_right' }
          ]},
          { group: 'C 전장', spec: cSpec, items: [
            { pos: '초물', k: 'cho_C' },
            { pos: '중물', k: 'jung_C' },
            { pos: '종물', k: 'jong_C' }
          ]}
        ];

        if (formCode === 2027) {
          rowsDef.push({
            group: 'D 전장',
            spec: '475 ± 5',
            items: [
              { pos: '초물', k: 'cho_D' },
              { pos: '중물', k: 'jung_D' },
              { pos: '종물', k: 'jong_D' }
            ]
          });
        }

        section5.innerHTML = `
          <div class="card" style="padding: 16px; margin-bottom: 16px;">
            <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 12px; display: block;">
              📏 <span class="sec-num"></span> 치수확인 (${curCarCode} D/SIDE - #${formCode})
            </label>

            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 12px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #ffffff; font-weight: 700; color: #000;">
                    <th style="border: 1px solid #000; padding: 6px; width: 26%;">항목</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 20%;">스펙(mm)</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 18%;">구분</th>
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
        const isJg1Inbelt = (curCarCode === 'JG1' || curCarCode === 'JG1S' || (currentMakerName && currentMakerName.includes('제네시스'))) &&
                            (curPart === '인벨트' || !curPart || curPart === '');

        const diagramHTML = isJg1Inbelt ? `
          <div style="max-width: 650px; margin: 0 auto 12px auto;">
            <img src="images/jg1_inbelt_dimension.png" alt="JG1 인벨트 치수확인 도면" style="width: 100%; height: auto; display: block; border: 1px solid #ccc; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.08);" />
          </div>
        ` : `
          <div style="padding: 12px; background: #f8fafc; border: 1px dashed var(--border-color); border-radius: 6px; text-align: center; color: var(--text-main); font-weight: 700; margin-bottom: 12px;">
            📋 [${curCarCode}${curPart ? ' - ' + curPart : ''}] 전장 길이 측정 및 완성품 품질검사 기준표
          </div>
        `;

        if (formCode === 1001) {
        section5.innerHTML = `
          <div class="card" style="padding: 16px; margin-bottom: 16px;">
            <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 8px; display: block;">
              📏 <span class="sec-num"></span> 치수확인 (전장 길이 측정 - ${curCarCode}${curPart ? ' ' + curPart : ''})
            </label>

            ${diagramHTML}

            <div style="overflow-x: auto; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <!-- FRT 헤더 -->
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-bottom: 1px solid #000;">
                    <th colspan="2" style="border: 1px solid #000; padding: 6px;">구분 (FRT)</th>
                    <th colspan="3" style="border: 1px solid #000; padding: 6px; width: 38%;">FRT LH</th>
                    <th colspan="3" style="border: 1px solid #000; padding: 6px; width: 38%;">FRT RH</th>
                  </tr>
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-bottom: 2px solid #000;">
                    <td colspan="2" style="border: 1px solid #000; padding: 4px;">측정(mm)</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 12.6%;">초</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 12.6%;">중</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 12.6%;">종</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 12.6%;">초</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 12.6%;">중</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 12.6%;">종</td>
                  </tr>
                </thead>
                <tbody>
                  <!-- 1. FRT ￠ to ￠ -->
                  <tr>
                    <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle; width: 14%;">
                      전장 길이<br>측정 (FRT)<br>단위 : mm
                    </td>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; width: 10%;">
                      ￠ to ￠
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_lh_초" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_lh_초'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_lh_중" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_lh_중'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_lh_종" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_lh_종'] || ''}" /></td>

                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_rh_초" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_rh_초'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_rh_중" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_rh_중'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_rh_종" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_rh_종'] || ''}" /></td>
                  </tr>

                  <!-- 2. FRT LIP to LIP -->
                  <tr>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      LIP to LIP
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_lh_초" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_lh_초'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_lh_중" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_lh_중'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_lh_종" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_lh_종'] || ''}" /></td>

                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_rh_초" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_rh_초'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_rh_중" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_rh_중'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_rh_종" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_rh_종'] || ''}" /></td>
                  </tr>

                  </tbody>
              </table>
            </div>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>

                  <!-- RR 헤더 -->
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-top: 2px solid #000; border-bottom: 1px solid #000;">
                    <th colspan="2" style="border: 1px solid #000; padding: 6px;">구분 (RR)</th>
                    <th colspan="3" style="border: 1px solid #000; padding: 6px;">RR LH</th>
                    <th colspan="3" style="border: 1px solid #000; padding: 6px;">RR RH</th>
                  </tr>
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-bottom: 2px solid #000;">
                    <td colspan="2" style="border: 1px solid #000; padding: 4px;">측정(mm)</td>
                    <td style="border: 1px solid #000; padding: 4px;">초</td>
                    <td style="border: 1px solid #000; padding: 4px;">중</td>
                    <td style="border: 1px solid #000; padding: 4px;">종</td>
                    <td style="border: 1px solid #000; padding: 4px;">초</td>
                    <td style="border: 1px solid #000; padding: 4px;">중</td>
                    <td style="border: 1px solid #000; padding: 4px;">종</td>
                  </tr>

                  </thead>
                <tbody>
                  <!-- 3. RR ￠ to ￠ -->
                  <tr>
                    <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle; width: 14%;">
                      전장 길이<br>측정 (RR)<br>단위 : mm
                    </td>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; width: 10%;">
                      ￠ to ￠
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_lh_초" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_lh_초'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_lh_중" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_lh_중'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_lh_종" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_lh_종'] || ''}" /></td>

                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_rh_초" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_rh_초'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_rh_중" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_rh_중'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_rh_종" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_rh_종'] || ''}" /></td>
                  </tr>

                  <!-- 4. RR LIP to LIP -->
                  <tr>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      LIP to LIP
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_lh_초" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_lh_초'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_lh_중" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_lh_중'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_lh_종" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_lh_종'] || ''}" /></td>

                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_rh_초" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_rh_초'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_rh_중" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_rh_중'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_rh_종" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_rh_종'] || ''}" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      } else if (formCode === 1004 || formCode === 1034) {
        section5.innerHTML = `
          <div class="card" style="padding: 16px; margin-bottom: 16px;">
            <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 8px; display: block;">
              📏 <span class="sec-num"></span> 치수확인 (전장 길이 측정 - ${curCarCode}${curPart ? ' ' + curPart : ''})
            </label>

            ${diagramHTML}

            <!-- 1. FRT LH Table -->
            <div style="overflow-x: auto; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-bottom: 1px solid #000;">
                    <th colspan="2" style="border: 1px solid #000; padding: 6px;">구분 (FRT)</th>
                    <th colspan="3" style="border: 1px solid #000; padding: 6px; width: 76%;">FRT LH</th>
                  </tr>
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-bottom: 2px solid #000;">
                    <td colspan="2" style="border: 1px solid #000; padding: 4px;">측정(mm)</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">초</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">중</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">종</td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle; width: 14%;">
                      전장 길이<br>측정 (FRT)<br>단위 : mm
                    </td>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; width: 10%;">
                      ￠ to ￠
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_lh_초" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_lh_초'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_lh_중" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_lh_중'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_lh_종" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_lh_종'] || ''}" /></td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      LIP to LIP
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_lh_초" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_lh_초'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_lh_중" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_lh_중'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_lh_종" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_lh_종'] || ''}" /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 2. FRT RH Table -->
            <div style="overflow-x: auto; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-bottom: 1px solid #000;">
                    <th colspan="2" style="border: 1px solid #000; padding: 6px;">구분 (FRT)</th>
                    <th colspan="3" style="border: 1px solid #000; padding: 6px; width: 76%;">FRT RH</th>
                  </tr>
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-bottom: 2px solid #000;">
                    <td colspan="2" style="border: 1px solid #000; padding: 4px;">측정(mm)</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">초</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">중</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">종</td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle; width: 14%;">
                      전장 길이<br>측정 (FRT)<br>단위 : mm
                    </td>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; width: 10%;">
                      ￠ to ￠
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_rh_초" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_rh_초'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_rh_중" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_rh_중'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_rh_종" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_rh_종'] || ''}" /></td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      LIP to LIP
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_rh_초" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_rh_초'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_rh_중" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_rh_중'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_rh_종" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_rh_종'] || ''}" /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 3. RR LH Table -->
            <div style="overflow-x: auto; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-bottom: 1px solid #000;">
                    <th colspan="2" style="border: 1px solid #000; padding: 6px;">구분 (RR)</th>
                    <th colspan="3" style="border: 1px solid #000; padding: 6px; width: 76%;">RR LH</th>
                  </tr>
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-bottom: 2px solid #000;">
                    <td colspan="2" style="border: 1px solid #000; padding: 4px;">측정(mm)</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">초</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">중</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">종</td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle; width: 14%;">
                      전장 길이<br>측정 (RR)<br>단위 : mm
                    </td>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; width: 10%;">
                      ￠ to ￠
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_lh_초" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_lh_초'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_lh_중" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_lh_중'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_lh_종" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_lh_종'] || ''}" /></td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      LIP to LIP
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_lh_초" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_lh_초'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_lh_중" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_lh_중'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_lh_종" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_lh_종'] || ''}" /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- 4. RR RH Table -->
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-bottom: 1px solid #000;">
                    <th colspan="2" style="border: 1px solid #000; padding: 6px;">구분 (RR)</th>
                    <th colspan="3" style="border: 1px solid #000; padding: 6px; width: 76%;">RR RH</th>
                  </tr>
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-bottom: 2px solid #000;">
                    <td colspan="2" style="border: 1px solid #000; padding: 4px;">측정(mm)</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">초</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">중</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 25.3%;">종</td>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle; width: 14%;">
                      전장 길이<br>측정 (RR)<br>단위 : mm
                    </td>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; width: 10%;">
                      ￠ to ￠
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_rh_초" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_rh_초'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_rh_중" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_rh_중'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_rh_종" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_rh_종'] || ''}" /></td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      LIP to LIP
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_rh_초" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_rh_초'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_rh_중" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_rh_중'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_rh_종" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_rh_종'] || ''}" /></td>
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
              📏 <span class="sec-num"></span> 치수확인 (전장 길이 측정 - ${curCarCode}${curPart ? ' ' + curPart : ''})
            </label>

            ${diagramHTML}

            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <!-- FRT 헤더 -->
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-bottom: 1px solid #000;">
                    <th colspan="2" style="border: 1px solid #000; padding: 6px;">구분 (FRT)</th>
                    <th colspan="3" style="border: 1px solid #000; padding: 6px; width: 38%;">FRT LH</th>
                    <th colspan="3" style="border: 1px solid #000; padding: 6px; width: 38%;">FRT RH</th>
                  </tr>
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-bottom: 2px solid #000;">
                    <td colspan="2" style="border: 1px solid #000; padding: 4px;">측정(mm)</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 12.6%;">초</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 12.6%;">중</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 12.6%;">종</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 12.6%;">초</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 12.6%;">중</td>
                    <td style="border: 1px solid #000; padding: 4px; width: 12.6%;">종</td>
                  </tr>
                </thead>
                <tbody>
                  <!-- 1. FRT ￠ to ￠ -->
                  <tr>
                    <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle; width: 14%;">
                      전장 길이<br>측정 (FRT)<br>단위 : mm
                    </td>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; width: 10%;">
                      ￠ to ￠
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_lh_초" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_lh_초'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_lh_중" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_lh_중'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_lh_종" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_lh_종'] || ''}" /></td>

                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_rh_초" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_rh_초'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_rh_중" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_rh_중'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_frt_rh_종" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_frt_rh_종'] || ''}" /></td>
                  </tr>

                  <!-- 2. FRT LIP to LIP -->
                  <tr>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      LIP to LIP
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_lh_초" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_lh_초'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_lh_중" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_lh_중'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_lh_종" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_lh_종'] || ''}" /></td>

                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_rh_초" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_rh_초'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_rh_중" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_rh_중'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_frt_rh_종" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_frt_rh_종'] || ''}" /></td>
                  </tr>

                  <!-- 구분 구분선 -->
                  <tr style="height: 8px; background: #e2e8f0;">
                    <td colspan="8" style="border: 1px solid #000; padding: 0;"></td>
                  </tr>

                  <!-- RR 헤더 -->
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-top: 2px solid #000; border-bottom: 1px solid #000;">
                    <th colspan="2" style="border: 1px solid #000; padding: 6px;">구분 (RR)</th>
                    <th colspan="3" style="border: 1px solid #000; padding: 6px;">RR LH</th>
                    <th colspan="3" style="border: 1px solid #000; padding: 6px;">RR RH</th>
                  </tr>
                  <tr style="background: #fffde7; font-weight: 700; color: #000; border-bottom: 2px solid #000;">
                    <td colspan="2" style="border: 1px solid #000; padding: 4px;">측정(mm)</td>
                    <td style="border: 1px solid #000; padding: 4px;">초</td>
                    <td style="border: 1px solid #000; padding: 4px;">중</td>
                    <td style="border: 1px solid #000; padding: 4px;">종</td>
                    <td style="border: 1px solid #000; padding: 4px;">초</td>
                    <td style="border: 1px solid #000; padding: 4px;">중</td>
                    <td style="border: 1px solid #000; padding: 4px;">종</td>
                  </tr>

                  <!-- 3. RR ￠ to ￠ -->
                  <tr>
                    <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle; width: 14%;">
                      전장 길이<br>측정 (RR)<br>단위 : mm
                    </td>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; width: 10%;">
                      ￠ to ￠
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_lh_초" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_lh_초'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_lh_중" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_lh_중'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_lh_종" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_lh_종'] || ''}" /></td>

                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_rh_초" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_rh_초'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_rh_중" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_rh_중'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ctc_rr_rh_종" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ctc_rr_rh_종'] || ''}" /></td>
                  </tr>

                  <!-- 4. RR LIP to LIP -->
                  <tr>
                    <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      LIP to LIP
                    </td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_lh_초" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_lh_초'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_lh_중" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_lh_중'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_lh_종" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_lh_종'] || ''}" /></td>

                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_rh_초" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_rh_초'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_rh_중" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_rh_중'] || ''}" /></td>
                    <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_ltl_rr_rh_종" class="form-control" style="width:100%; height:26px; padding:2px; text-align:center; font-size:11px;" value="${d['ltl_rr_rh_종'] || ''}" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
      }
      }
    } else {
      // 기타 공정: section5 비움
      section5.innerHTML = '';
    }
}
