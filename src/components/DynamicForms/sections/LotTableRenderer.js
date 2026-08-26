import { autoFormatDateTimeString } from './formUtils.js';

/**
 * Section 4 소재 LOT 번호 테이블 렌더러
 * ctx: { container, processValue, carModelValue, currentCarCode, partValueInput, existingData, getCurrentFormCode }
 */
export function renderSection4LotTable(materialLots = {}, ctx) {
  const { container, processValue, carModelValue, currentCarCode, partValueInput, existingData, getCurrentFormCode, bindLotDateWheelPicker } = ctx;
    const lotContainer = container.querySelector('#section4LotTableContainer');
    if (!lotContainer) return;

    // materialLots: 기존 저장 데이터에서 복원 (파라미터 우선, 없으면 existingData에서)
    const savedLots = (materialLots && Object.keys(materialLots).length > 0)
      ? materialLots
      : (existingData?.materialLots || {});
    
    materialLots = savedLots;

    // 현재 사용자가 입력해 둔 LOT 값 보존
    const curLots = {};
    lotContainer.querySelectorAll('input').forEach(input => {
      if (input.id) {
        curLots[input.id] = input.type === 'checkbox' ? input.checked : input.value;
      }
    });

    const curCarCode = carModelValue ? carModelValue.value : currentCarCode;
    const curPart = partValueInput ? partValueInput.value : '';
    const curProc = processValue ? processValue.value : '';

    const formCode = getCurrentFormCode();
    const section4Card = container.querySelector('#section4Card') || lotContainer.closest('.card');

    // [1] 소재 LOT 영역 표시 여부 판단 (공정 미선택 또는 LOT 입력이 불필요한 고유 양식)
    const noLotFormCodes = [1011, 1012, 1013]; // RR C PART'G 조인트/후가공 등
    const isStellantisInsp = [2005, 2015, 2027, 2035, 2044].includes(formCode);
    
    if (!curProc || noLotFormCodes.includes(formCode) || (curProc.includes('검사') && !isStellantisInsp && formCode !== 4014 && formCode !== 4004 && formCode !== 1004 && formCode !== 1034 && formCode !== 1024 && formCode !== 1044)) {
      if (section4Card) section4Card.style.display = 'none';
      return;
    } else {
      if (section4Card) section4Card.style.display = 'block';
    }

    // [2] 고유번호(formCode)별 독립 LOT 템플릿 렌더러 분기
    switch (formCode) {

      
      case 1034:
      case 1033:
      case 1032:
      case 1004:
      case 1002:
      case 1003: {
        lotContainer.innerHTML = `
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif; margin-bottom: 16px;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700;">
                <th style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 22%; vertical-align: middle; background: #fffde7;">
                  구분 (FRT)
                </th>
                <th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 26%;">초물</th>
                <th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 26%;">중물</th>
                <th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 26%;">종물</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">LH</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_FRT_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LH_FRT_초물'] || materialLots['LH_FRT_초물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_FRT_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LH_FRT_중물'] || materialLots['LH_FRT_중물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_FRT_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LH_FRT_종물'] || materialLots['LH_FRT_종물'] || ''}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">RH</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_FRT_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RH_FRT_초물'] || materialLots['RH_FRT_초물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_FRT_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RH_FRT_중물'] || materialLots['RH_FRT_중물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_FRT_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RH_FRT_종물'] || materialLots['RH_FRT_종물'] || ''}" />
                </td>
              </tr>
            </tbody>
          </table>

          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700;">
                <th style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 22%; vertical-align: middle; background: #fffde7;">
                  구분 (RR)
                </th>
                <th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 26%;">초물</th>
                <th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 26%;">중물</th>
                <th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 26%;">종물</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">LH</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_RR_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LH_RR_초물'] || materialLots['LH_RR_초물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_RR_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LH_RR_중물'] || materialLots['LH_RR_중물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_RR_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LH_RR_종물'] || materialLots['LH_RR_종물'] || ''}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">RH</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_RR_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RH_RR_초물'] || materialLots['RH_RR_초물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_RR_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RH_RR_중물'] || materialLots['RH_RR_중물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_RR_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RH_RR_종물'] || materialLots['RH_RR_종물'] || ''}" />
                </td>
              </tr>
            </tbody>
          </table>
        `;
        break;
      }

      case 4011:
      case 4012:
      case 4013:
      case 4014: {
        lotContainer.innerHTML = `
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #ffffff; font-weight: 700;">
                <th style="border: 1px solid #000; padding: 6px 2px; width: 30%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">구분</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 70%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">LOT 번호</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">초물</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_초물'] || materialLots['초물'] || ''}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">중물</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_중물'] || materialLots['중물'] || ''}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">종물</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_종물'] || materialLots['종물'] || ''}" />
                </td>
              </tr>
            </tbody>
          </table>
        `;
        break;
      }
      // ────────────────────────────────────────────────────────
      // #2041 : KM/KX 클립머신 전용 양식 (Hood 단독 1열)
      // ────────────────────────────────────────────────────────
      case 2041: {
        lotContainer.innerHTML = `
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #ffffff; font-weight: 700;">
                <th style="border: 1px solid #000; padding: 6px 2px; width: 30%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">구분</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 70%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">Hood</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">초</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_Hood_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_Hood_초물'] || curLots['lotNo_DTA_Roll_초물'] || materialLots['Hood_초물'] || materialLots['DTA_Roll_초물'] || ''}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">중</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_Hood_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_Hood_중물'] || curLots['lotNo_DTA_Roll_중물'] || materialLots['Hood_중물'] || materialLots['DTA_Roll_중물'] || ''}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">종</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_Hood_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_Hood_종물'] || curLots['lotNo_DTA_Roll_종물'] || materialLots['Hood_종물'] || materialLots['DTA_Roll_종물'] || ''}" />
                </td>
              </tr>
            </tbody>
          </table>
        `;
        break;
      }

      // ────────────────────────────────────────────────────────
      // #2001, #2011 : 클립머신 전용 양식 (DT A Roll / DT B Roll)
      // ────────────────────────────────────────────────────────
      case 2001:
      case 2011: {
        lotContainer.innerHTML = `
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #ffffff; font-weight: 700;">
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">구분</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 37.5%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">DT A Roll</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 37.5%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">DT B Roll</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">초</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_DTA_Roll_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_DTA_Roll_초물'] || materialLots['DTA_Roll_초물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_DTB_Roll_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_DTB_Roll_초물'] || materialLots['DTB_Roll_초물'] || ''}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">중</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_DTA_Roll_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_DTA_Roll_중물'] || materialLots['DTA_Roll_중물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_DTB_Roll_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_DTB_Roll_중물'] || materialLots['DTB_Roll_중물'] || ''}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">종</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_DTA_Roll_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_DTA_Roll_종물'] || materialLots['DTA_Roll_종물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_DTB_Roll_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_DTB_Roll_종물'] || materialLots['DTB_Roll_종물'] || ''}" />
                </td>
              </tr>
            </tbody>
          </table>
        `;
        break;
      }

      // ────────────────────────────────────────────────────────
      // #2023 : DS CREW 소재준비(D) 전용 양식 (D 단독 1열)
      // ────────────────────────────────────────────────────────
      case 2023: {
        lotContainer.innerHTML = `
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #ffffff; font-weight: 700;">
                <th style="border: 1px solid #000; padding: 6px 2px; width: 30%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">구분</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 70%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">D</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">초</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_D_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_D_초물'] || curLots['lotNo_LHA_초물'] || materialLots['D_초물'] || materialLots['LHA_초물'] || ''}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">중</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_D_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_D_중물'] || curLots['lotNo_LHA_중물'] || materialLots['D_중물'] || materialLots['LHA_중물'] || ''}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">종</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_D_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_D_종물'] || curLots['lotNo_LHA_종물'] || materialLots['D_종물'] || materialLots['LHA_종물'] || ''}" />
                </td>
              </tr>
            </tbody>
          </table>
        `;
        break;
      }

      // ────────────────────────────────────────────────────────
      // #2002, #2012, #2021, #2022, #2031, #2032 : 소재준비 전용 양식 (LH A / RH A)
      // ────────────────────────────────────────────────────────
      case 2002:
      case 2012:
      case 2021:
      case 2022:
      case 2031:
      case 2032: {
        lotContainer.innerHTML = `
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #ffffff; font-weight: 700;">
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">구분</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 37.5%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">LH A</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 37.5%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">RH A</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">초</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LHA_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LHA_초물'] || materialLots['LHA_초물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RHA_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RHA_초물'] || materialLots['RHA_초물'] || ''}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">중</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LHA_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LHA_중물'] || materialLots['LHA_중물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RHA_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RHA_중물'] || materialLots['RHA_중물'] || ''}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">종</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LHA_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LHA_종물'] || materialLots['LHA_종물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RHA_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RHA_종물'] || materialLots['RHA_종물'] || ''}" />
                </td>
              </tr>
            </tbody>
          </table>
        `;
        break;
      }

      // ────────────────────────────────────────────────────────
      // #2024 : DS CREW D/SIDE 조인트 전용 양식 (LH A/B/C/D, RH A/B/C/D)
      // ────────────────────────────────────────────────────────
      case 2024: {
        lotContainer.innerHTML = `
          <!-- LH 테이블 -->
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif; margin-bottom: 12px;">
            <thead>
              <tr style="background: #ffffff; font-weight: 700;">
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">구분</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">초</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">중</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">종</th>
              </tr>
            </thead>
            <tbody>
              ${['A', 'B', 'C', 'D'].map(row => `
                <tr>
                  <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">LH ${row}</td>
                  <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                    <input type="text" id="lotNo_LH_${row}_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots[`lotNo_LH_${row}_초물`] || materialLots[`LH_${row}_초물`] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                    <input type="text" id="lotNo_LH_${row}_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots[`lotNo_LH_${row}_중물`] || materialLots[`LH_${row}_중물`] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                    <input type="text" id="lotNo_LH_${row}_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots[`lotNo_LH_${row}_종물`] || materialLots[`LH_${row}_종물`] || ''}" />
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- RH 테이블 -->
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #ffffff; font-weight: 700;">
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">구분</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">초</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">중</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">종</th>
              </tr>
            </thead>
            <tbody>
              ${['A', 'B', 'C', 'D'].map(row => `
                <tr>
                  <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">RH ${row}</td>
                  <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                    <input type="text" id="lotNo_RH_${row}_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots[`lotNo_RH_${row}_초물`] || materialLots[`RH_${row}_초물`] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                    <input type="text" id="lotNo_RH_${row}_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots[`lotNo_RH_${row}_중물`] || materialLots[`RH_${row}_중물`] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                    <input type="text" id="lotNo_RH_${row}_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots[`lotNo_RH_${row}_종물`] || materialLots[`RH_${row}_종물`] || ''}" />
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;
      }

      // ────────────────────────────────────────────────────────
      // #2025 : DS CREW D/SIDE 조인트(D) 전용 양식 (LH D / RH D 단일 표)
      // ────────────────────────────────────────────────────────
      case 2025: {
        lotContainer.innerHTML = `
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #ffffff; font-weight: 700;">
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">구분</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 37.5%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">LH D</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 37.5%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">RH D</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">초</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_D_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LH_D_초물'] || materialLots['LH_D_초물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_D_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RH_D_초물'] || materialLots['RH_D_초물'] || ''}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">중</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_D_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LH_D_중물'] || materialLots['LH_D_중물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_D_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RH_D_중물'] || materialLots['RH_D_중물'] || ''}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">종</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_D_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LH_D_종물'] || materialLots['LH_D_종물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_D_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RH_D_종물'] || materialLots['RH_D_종물'] || ''}" />
                </td>
              </tr>
            </tbody>
          </table>
        `;
        break;
      }

      // ────────────────────────────────────────────────────────
      // #2042, #2043, #2044 : KM/KX HOOD SURROUND 조인트/후가공/검사포장 전용 양식 (LH / MIDDLE / RH 단일 표)
      // ────────────────────────────────────────────────────────
      case 2042:
      case 2043:
      case 2044: {
        lotContainer.innerHTML = `
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #ffffff; font-weight: 700;">
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">구분</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">초</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">중</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">종</th>
              </tr>
            </thead>
            <tbody>
              ${[
                { key: 'LH', label: 'LH', oldKey: 'LH_A' },
                { key: 'MIDDLE', label: 'MIDDLE', oldKey: 'LH_B' },
                { key: 'RH', label: 'RH', oldKey: 'LH_C' }
              ].map(item => `
                <tr>
                  <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">${item.label}</td>
                  <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                    <input type="text" id="lotNo_${item.key}_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots[`lotNo_${item.key}_초물`] || curLots[`lotNo_${item.oldKey}_초물`] || materialLots[`${item.key}_초물`] || materialLots[`${item.oldKey}_초물`] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                    <input type="text" id="lotNo_${item.key}_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots[`lotNo_${item.key}_중물`] || curLots[`lotNo_${item.oldKey}_중물`] || materialLots[`${item.key}_중물`] || materialLots[`${item.oldKey}_중물`] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                    <input type="text" id="lotNo_${item.key}_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots[`lotNo_${item.key}_종물`] || curLots[`lotNo_${item.oldKey}_종물`] || materialLots[`${item.key}_종물`] || materialLots[`${item.oldKey}_종물`] || ''}" />
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;
      }

      // ────────────────────────────────────────────────────────
      // #2003, #2013, #2033 : 조인트 전용 양식 (LH A/B/C, RH A/B/C)
      // ────────────────────────────────────────────────────────
      case 2003:
      case 2013:
      case 2033: {
        lotContainer.innerHTML = `
          <!-- LH 테이블 -->
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif; margin-bottom: 12px;">
            <thead>
              <tr style="background: #ffffff; font-weight: 700;">
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">구분</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">초</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">중</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">종</th>
              </tr>
            </thead>
            <tbody>
              ${['A', 'B', 'C'].map(row => `
                <tr>
                  <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">LH ${row}</td>
                  <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                    <input type="text" id="lotNo_LH_${row}_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots[`lotNo_LH_${row}_초물`] || materialLots[`LH_${row}_초물`] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                    <input type="text" id="lotNo_LH_${row}_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots[`lotNo_LH_${row}_중물`] || materialLots[`LH_${row}_중물`] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                    <input type="text" id="lotNo_LH_${row}_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots[`lotNo_LH_${row}_종물`] || materialLots[`LH_${row}_종물`] || ''}" />
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <!-- RH 테이블 -->
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #ffffff; font-weight: 700;">
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">구분</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">초</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">중</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">종</th>
              </tr>
            </thead>
            <tbody>
              ${['A', 'B', 'C'].map(row => `
                <tr>
                  <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">RH ${row}</td>
                  <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                    <input type="text" id="lotNo_RH_${row}_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots[`lotNo_RH_${row}_초물`] || materialLots[`RH_${row}_초물`] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                    <input type="text" id="lotNo_RH_${row}_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots[`lotNo_RH_${row}_중물`] || materialLots[`RH_${row}_중물`] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                    <input type="text" id="lotNo_RH_${row}_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots[`lotNo_RH_${row}_종물`] || materialLots[`RH_${row}_종물`] || ''}" />
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
        break;
      }

      // ────────────────────────────────────────────────────────
      // #2026, #2027 : DS CREW D/SIDE 후가공/검사포장 전용 양식 (LH A/B/C/D, RH A/B/C/D)
      // ────────────────────────────────────────────────────────
      case 2026:
      case 2027: {
        const makePostLotTable = (tNum) => {
          const labelPrefix = tNum === 1 ? 'LH' : 'RH';
          const getVal = (row, type) => curLots[`lotNo_${labelPrefix}_${row}_${type}`] || materialLots[`${labelPrefix}_${row}_${type}`] || '';

          return `
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif; ${tNum === 1 ? 'margin-bottom: 12px;' : ''}">
              <thead>
                <tr style="background: #ffffff; font-weight: 700;">
                  <th style="border: 1px solid #000; padding: 6px 2px; width: 22%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">${labelPrefix} 구분</th>
                  <th style="border: 1px solid #000; padding: 6px 2px; width: 26%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">초물</th>
                  <th style="border: 1px solid #000; padding: 6px 2px; width: 26%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">중물</th>
                  <th style="border: 1px solid #000; padding: 6px 2px; width: 26%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">종물</th>
                </tr>
              </thead>
              <tbody>
                ${['A', 'B', 'C', 'D'].map(row => `
                  <tr>
                    <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">${labelPrefix} ${row}</td>
                    <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                      <input type="text" id="lotNo_${labelPrefix}_${row}_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${getVal(row, '초물')}" />
                    </td>
                    <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                      <input type="text" id="lotNo_${labelPrefix}_${row}_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${getVal(row, '중물')}" />
                    </td>
                    <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                      <input type="text" id="lotNo_${labelPrefix}_${row}_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${getVal(row, '종물')}" />
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
        };

        lotContainer.innerHTML = makePostLotTable(1) + makePostLotTable(2);
        break;
      }

      // ────────────────────────────────────────────────────────
      // #2004, #2014, #2034 : 스텔란티스 후가공 전용 양식 (LH/RH 분리형 A/B/C)
      // #2005, #2015, #2035 : 스텔란티스 검사포장 전용 양식 (LH/RH 분리형 A/B/C)
      // ────────────────────────────────────────────────────────
      case 2004:
      case 2014:
      case 2034:
      case 2005:
      case 2015:
      case 2035: {
        const makePostLotTable = (tNum) => {
          const labelPrefix = tNum === 1 ? 'LH' : 'RH';
          const getVal = (row, type) => curLots[`lotNo_${labelPrefix}_${row}_${type}`] || materialLots[`${labelPrefix}_${row}_${type}`] || '';

          return `
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif; ${tNum === 1 ? 'margin-bottom: 12px;' : ''}">
              <thead>
                <tr style="background: #ffffff; font-weight: 700;">
                  <th style="border: 1px solid #000; padding: 6px 2px; width: 22%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">${labelPrefix} 구분</th>
                  <th style="border: 1px solid #000; padding: 6px 2px; width: 26%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">초물</th>
                  <th style="border: 1px solid #000; padding: 6px 2px; width: 26%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">중물</th>
                  <th style="border: 1px solid #000; padding: 6px 2px; width: 26%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">종물</th>
                </tr>
              </thead>
              <tbody>
                ${['A', 'B', 'C'].map(row => `
                  <tr>
                    <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">${labelPrefix} ${row}</td>
                    <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                      <input type="text" id="lotNo_${labelPrefix}_${row}_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${getVal(row, '초물')}" />
                    </td>
                    <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                      <input type="text" id="lotNo_${labelPrefix}_${row}_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${getVal(row, '중물')}" />
                    </td>
                    <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                      <input type="text" id="lotNo_${labelPrefix}_${row}_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${getVal(row, '종물')}" />
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `;
        };

        lotContainer.innerHTML = makePostLotTable(1) + makePostLotTable(2);
        break;
      }

      // ────────────────────────────────────────────────────────
      // #1022, #1042 : JG1 / JG1S G/RUN 'E' 조인트 전용 양식
      // ────────────────────────────────────────────────────────
      case 1022:
      case 1023:
      case 1024:
      case 1042:
      case 1043:
      case 1044: {
        lotContainer.innerHTML = `
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif; margin-bottom: 16px;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700;">
                <th style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 22%; vertical-align: middle; background: #fffde7;">
                  구 분
                </th>
                <th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 26%;">초물</th>
                <th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 26%;">중물</th>
                <th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 26%;">종물</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">
                  G/RUN 'E' LH
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LH_초물'] || materialLots['LH_초물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LH_중물'] || materialLots['LH_중물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LH_종물'] || materialLots['LH_종물'] || ''}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">
                  G/RUN 'E' RH
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RH_초물'] || materialLots['RH_초물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RH_중물'] || materialLots['RH_중물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RH_종물'] || materialLots['RH_종물'] || ''}" />
                </td>
              </tr>
            </tbody>
          </table>
        `;
        break;
      }

      // ────────────────────────────────────────────────────────
      // #1001, #1031 : 제네시스 인벨트 소재준비 전용 양식 (LH/RH 미구분 수직형)
      // ────────────────────────────────────────────────────────
      case 1001:
      case 1031: {
        lotContainer.innerHTML = `
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700;">
                <th style="border: 1px solid #000; padding: 8px 4px; width: 22%; background: #fffde7; font-size: 12px; color: #000;">구분</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 26%; background: #ffffff; font-weight: 700; color: #000; font-size: 11px;">초물</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 26%; background: #ffffff; font-weight: 700; color: #000; font-size: 11px;">중물</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 26%; background: #ffffff; font-weight: 700; color: #000; font-size: 11px;">종물</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">FRT</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_FRT_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_FRT_초물'] || materialLots['FRT_초물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_FRT_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_FRT_중물'] || materialLots['FRT_중물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_FRT_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_FRT_종물'] || materialLots['FRT_종물'] || ''}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle;">RR</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RR_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RR_초물'] || materialLots['RR_초물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RR_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RR_중물'] || materialLots['RR_중물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RR_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RR_종물'] || materialLots['RR_종물'] || ''}" />
                </td>
              </tr>
            </tbody>
          </table>
        `;
        break;
      }

      case 4001: {
        lotContainer.innerHTML = `
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700;">
                <th style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 30%; background: #fffde7;">구 분(Division)</th>
                <th style="border: 1px solid #000; padding: 8px 4px; font-size: 13px; color: #000; width: 70%;">PTG</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 12px;">초물</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_FRT_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_FRT_초물'] || curLots['lotNo_LH_FRT_초물'] || materialLots['FRT_초물'] || materialLots['LH_FRT_초물'] || ''}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 12px;">중물</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_FRT_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_FRT_중물'] || curLots['lotNo_RH_FRT_초물'] || materialLots['FRT_중물'] || materialLots['RH_FRT_초물'] || ''}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 12px;">종물</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_FRT_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_FRT_종물'] || curLots['lotNo_LH_FRT_중물'] || materialLots['FRT_종물'] || materialLots['LH_FRT_중물'] || ''}" />
                </td>
              </tr>
            </tbody>
          </table>
        `;
        break;
      }

      // ────────────────────────────────────────────────────────
      // 기본 표준 양식 (#1002, #1003, #1013, #1021, #1023, #1032, #1033, #1041, #1043, #3001~#6004 등)
      // ────────────────────────────────────────────────────────
            case 4002: {
        lotContainer.innerHTML = `
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700;">
                <th rowspan="2" style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 22%; vertical-align: middle; background: #fffde7;">
                  구 분(Division)
                </th>
                <th colspan="2" style="border: 1px solid #000; padding: 8px 4px; font-size: 13px; color: #000; width: 78%;">PTG</th>
              </tr>
              <tr style="background: #fffde7;">
                <th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 39%;">LH</th>
                <th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 39%;">RH</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">초물</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_FRT_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LH_FRT_초물'] || materialLots['LH_FRT_초물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_FRT_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RH_FRT_초물'] || materialLots['RH_FRT_초물'] || ''}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">중물</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_FRT_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LH_FRT_중물'] || materialLots['LH_FRT_중물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_FRT_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RH_FRT_중물'] || materialLots['RH_FRT_중물'] || ''}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">종물</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_FRT_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LH_FRT_종물'] || materialLots['LH_FRT_종물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_FRT_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RH_FRT_종물'] || materialLots['RH_FRT_종물'] || ''}" />
                </td>
              </tr>
            </tbody>
          </table>
        `;
        break;
      }
      case 4003:
      case 4004: {
        lotContainer.innerHTML = `
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700;">
                <th rowspan="2" style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 22%; vertical-align: middle; background: #fffde7;">
                  구 분(Division)
                </th>
                <th colspan="2" style="border: 1px solid #000; padding: 8px 4px; font-size: 13px; color: #000; width: 78%;">PTG</th>
              </tr>
              <tr style="background: #fffde7;">
                <th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 39%;">LH</th>
                <th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 39%;">RH</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">초물</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_FRT_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LH_FRT_초물'] || materialLots['LH_FRT_초물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_FRT_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RH_FRT_초물'] || materialLots['RH_FRT_초물'] || ''}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">중물</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_FRT_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LH_FRT_중물'] || materialLots['LH_FRT_중물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_FRT_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RH_FRT_중물'] || materialLots['RH_FRT_중물'] || ''}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">종물</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_FRT_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LH_FRT_종물'] || materialLots['LH_FRT_종물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_FRT_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RH_FRT_종물'] || materialLots['RH_FRT_종물'] || ''}" />
                </td>
              </tr>
            </tbody>
          </table>
        `;
        break;
      }
      
      case 1021:
      case 1041: {
        lotContainer.innerHTML = `
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif; margin-bottom: 16px;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700;">
                <th style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 22%; vertical-align: middle; background: #fffde7;">
                  구 분
                </th>
                <th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 26%;">초물</th>
                <th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 26%;">중물</th>
                <th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 26%;">종물</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">
                  G/RUN 'E'
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_GRUNE_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_GRUNE_초물'] || materialLots['GRUNE_초물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_GRUNE_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_GRUNE_중물'] || materialLots['GRUNE_중물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_GRUNE_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_GRUNE_종물'] || materialLots['GRUNE_종물'] || ''}" />
                </td>
              </tr>
            </tbody>
          </table>
        `;
        break;
      }
      default: {
        lotContainer.innerHTML = `
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700;">
                <th rowspan="2" style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 22%; vertical-align: middle; background: #fffde7;">
                  구 분(Division)
                </th>
                <th colspan="3" style="border: 1px solid #000; padding: 8px 4px; font-size: 13px; color: #000; width: 39%;">
                  FRT
                </th>
                <th colspan="3" style="border: 1px solid #000; padding: 8px 4px; font-size: 13px; color: #000; width: 39%;">
                  RR
                </th>
              </tr>
              <tr style="background: #fffde7;">
                <th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 13%;">초물</th>
                <th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 13%;">중물</th>
                <th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 13%;">종물</th>
                <th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 13%;">초물</th>
                <th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 13%;">중물</th>
                <th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 13%;">종물</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">
                  LH
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_FRT_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LH_FRT_초물'] || materialLots['LH_FRT_초물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_FRT_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LH_FRT_중물'] || materialLots['LH_FRT_중물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_FRT_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LH_FRT_종물'] || materialLots['LH_FRT_종물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_RR_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LH_RR_초물'] || materialLots['LH_RR_초물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_RR_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LH_RR_중물'] || materialLots['LH_RR_중물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_RR_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_LH_RR_종물'] || materialLots['LH_RR_종물'] || ''}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">
                  RH
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_FRT_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RH_FRT_초물'] || materialLots['RH_FRT_초물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_FRT_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RH_FRT_중물'] || materialLots['RH_FRT_중물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_FRT_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RH_FRT_종물'] || materialLots['RH_FRT_종물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_RR_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RH_RR_초물'] || materialLots['RH_RR_초물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_RR_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RH_RR_중물'] || materialLots['RH_RR_중물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_RR_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="${curLots['lotNo_RH_RR_종물'] || materialLots['RH_RR_종물'] || ''}" />
                </td>
              </tr>
            </tbody>
          </table>
        `;
        break;
      }
    }

    // 터치 스크롤 휠 피커 바인딩
    if (bindLotDateWheelPicker) {
      lotContainer.querySelectorAll('input[type="text"].lot-datetime-input, input[type="text"][id^="lotNo_"]').forEach(input => {
        bindLotDateWheelPicker(input, '소재 LOT 번호 (일자/시간)');
      });
    }

    // blur / keydown 이벤트 리스너 바인딩 (수동 입력 대비)
    lotContainer.querySelectorAll('.lot-datetime-input').forEach(input => {
      input.addEventListener('blur', () => {
        if (input.value) {
          input.value = autoFormatDateTimeString(input.value);
        }
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          input.value = autoFormatDateTimeString(input.value);
        }
      });
    });

    i18n.applyTranslations(lotContainer);
}
