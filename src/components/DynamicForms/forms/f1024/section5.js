/**
 * #1024 (JG1_G/RUN 'E'_검사포장) 전용 Section 5 (치수확인) 렌더러
 * - #1044와 공유하던 분기에서 분리(Copy-on-Modify)하여 498 ± 3mm 규격 적용
 */
export function renderF1024Section5(section5, d, bindNumberWheelPicker) {
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
                      스펙(mm)
                    </td>
                    <td colspan="2" style="border: 1px solid #000; font-weight: 700; padding: 4px;">
                      498 ± 3mm
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                      실측(Act) <span style="font-size: 9px; font-weight: normal;">(초/중/종)</span>
                    </td>
                    <td style="border: 1px solid #000; padding: 3px 2px;">
                      <div style="display: flex; flex-direction: column; gap: 4px; padding: 4px;">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                          <input type="text" id="dim_cut_FRT_초" class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" data-wheel-parsed-spec="498" value="${d['cut_FRT_초']  || ''}" readonly  placeholder="(초)" />
                        </div>
                        <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                          <input type="text" id="dim_cut_FRT_중" class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" data-wheel-parsed-spec="498" value="${d['cut_FRT_중']  || ''}" readonly  placeholder="(중)" />
                        </div>
                        <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                          <input type="text" id="dim_cut_FRT_종" class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" data-wheel-parsed-spec="498" value="${d['cut_FRT_종']  || ''}" readonly  placeholder="(종)" />
                        </div>
                      </div>
                    </td>
                    <td style="border: 1px solid #000; padding: 3px 2px;">
                      <div style="display: flex; flex-direction: column; gap: 4px; padding: 4px;">
                        <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                          <input type="text" id="dim_cut_RR_초" class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" data-wheel-parsed-spec="498" value="${d['cut_RR_초']  || ''}" readonly  placeholder="(초)" />
                        </div>
                        <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                          <input type="text" id="dim_cut_RR_중" class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" data-wheel-parsed-spec="498" value="${d['cut_RR_중']  || ''}" readonly  placeholder="(중)" />
                        </div>
                        <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                          <input type="text" id="dim_cut_RR_종" class="form-control" style="flex: 1; height: 26px; padding: 2px; text-align: center; font-size: 11px;" data-wheel-parsed-spec="498" value="${d['cut_RR_종']  || ''}" readonly  placeholder="(종)" />
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        `;
  bindNumberWheelPicker(section5.querySelector('#dim_cut_FRT_초'), '정치절단길이 LH 초', 498, 20);
  bindNumberWheelPicker(section5.querySelector('#dim_cut_FRT_중'), '정치절단길이 LH 중', 498, 20);
  bindNumberWheelPicker(section5.querySelector('#dim_cut_FRT_종'), '정치절단길이 LH 종', 498, 20);
  bindNumberWheelPicker(section5.querySelector('#dim_cut_RR_초'), '정치절단길이 RH 초', 498, 20);
  bindNumberWheelPicker(section5.querySelector('#dim_cut_RR_중'), '정치절단길이 RH 중', 498, 20);
  bindNumberWheelPicker(section5.querySelector('#dim_cut_RR_종'), '정치절단길이 RH 종', 498, 20);
}
