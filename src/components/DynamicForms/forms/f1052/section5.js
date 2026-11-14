/**
 * 양식 고유 번호 #1052 (제네시스 JG1 / FRUNK / 조인트)
 * Section 5 전용 렌더러
 *
 * - 5. 조인트 고무 LOT 번호 입력 (`f1052_jointRubberLotNo`)
 * - 6. 설비 가류온도 & 가류시간 입력:
 *   · 구분(Division): Frunk
 *   · 부위(Part): JG 열융착 금형
 *   · 가류온도 (스펙 200 ± 10): 초물(Start) / 중물(Harf) / 종물(Finish) 각 (상)·(하)
 *   · 가류시간 (스펙 90 ± 10): 초물(Start) / 중물(Harf) / 종물(Finish)
 * - 모든 입력칸 ID 는 `f1052_` 접두사 + 명시적 `data-*` 속성만 사용 (GEMINI.md 원칙 1·2·8·10·11·12·13)
 */

import { autoFormatDateTimeString } from '../../sections/formUtils.js';

export const F1052_VULC_STAGES = [
  { key: '초', legacyKey: 'start', label: '초물(Start)', wheelStage: '초물' },
  { key: '중', legacyKey: 'harf', label: '중물(Harf)', wheelStage: '중물' },
  { key: '종', legacyKey: 'finish', label: '종물(Finish)', wheelStage: '종물' }
];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {Object} savedDim   저장/현재 입력된 dimData 맵
 * @param {Object} savedLots  저장/현재 입력된 materialLots 맵
 * @param {Object} legacyVulc 하위 호환용 vulcTable 맵
 * @param {string} legacyJointLot 하위 호환용 jointRubberLotNo
 * @returns {string} Section 5 HTML
 */
export function renderF1052Section5HTML(savedDim = {}, savedLots = {}, legacyVulc = {}, legacyJointLot = '') {
  const jointLotVal = savedLots.f1052_jointRubberLotNo !== undefined
    ? savedLots.f1052_jointRubberLotNo
    : (legacyJointLot || '');

  const tempRowsHtml = F1052_VULC_STAGES.map(stage => {
    const upId = `f1052_temp_${stage.key}_상`;
    const downId = `f1052_temp_${stage.key}_하`;
    const legacyUp = legacyVulc[`temp_${stage.legacyKey}_frt_p_상`] ?? legacyVulc[`temp_${stage.legacyKey}_frt_p`] ?? '';
    const legacyDown = legacyVulc[`temp_${stage.legacyKey}_frt_p_하`] ?? '';
    const upVal = savedDim[upId] !== undefined ? savedDim[upId] : legacyUp;
    const downVal = savedDim[downId] !== undefined ? savedDim[downId] : legacyDown;

    return `
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  ${stage.label}
                </td>
                <td style="border: 1px solid #000; padding: 2px;">
                  <div style="display: flex; gap: 4px;">
                    <input type="text" id="${upId}" data-form-code="1052" data-save-group="dimData" data-f1052-vulc="1" data-wheel-parsed-spec="200" data-wheel-range="30" data-wheel-unit="℃" data-wheel-title="${stage.wheelStage} 가류온도 (상)" class="form-control" style="flex: 1; height: 24px; text-align: center; font-size: 11px; padding: 2px;" placeholder="(상)" value="${escapeHtml(upVal)}" />
                    <input type="text" id="${downId}" data-form-code="1052" data-save-group="dimData" data-f1052-vulc="1" data-wheel-parsed-spec="200" data-wheel-range="30" data-wheel-unit="℃" data-wheel-title="${stage.wheelStage} 가류온도 (하)" class="form-control" style="flex: 1; height: 24px; text-align: center; font-size: 11px; padding: 2px;" placeholder="(하)" value="${escapeHtml(downVal)}" />
                  </div>
                </td>
              </tr>`;
  }).join('');

  const timeRowsHtml = F1052_VULC_STAGES.map(stage => {
    const timeId = `f1052_time_${stage.key}`;
    const legacyTime = legacyVulc[`time_${stage.legacyKey}_frt_p`] ?? '';
    const timeVal = savedDim[timeId] !== undefined ? savedDim[timeId] : legacyTime;

    return `
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                  ${stage.label}
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="${timeId}" data-form-code="1052" data-save-group="dimData" data-f1052-vulc="1" data-wheel-parsed-spec="90" data-wheel-range="30" data-wheel-unit="초" data-wheel-title="${stage.wheelStage} 가류시간" class="form-control" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px;" value="${escapeHtml(timeVal)}" /></td>
              </tr>`;
  }).join('');

  return `
        <div class="card" data-form-code="1052" style="padding: 16px; margin-bottom: 16px;">
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 6px; display: block;">
            🧪 <span class="sec-num"></span> 조인트 고무 LOT 번호 입력
          </label>
          <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 10px;">조인트 고무 소재의 LOT 번호를 입력하세요.</p>
          <input type="text" id="f1052_jointRubberLotNo" data-form-code="1052" data-save-group="materialLots" class="form-control lot-datetime-input"
            style="max-width: 280px; font-family: monospace;"
            placeholder="년월일시분 (예: 2607251330)"
            value="${escapeHtml(jointLotVal)}" />
        </div>

        <div class="card" data-form-code="1052" style="padding: 16px; margin-bottom: 16px;">
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
            ♨️ <span class="sec-num"></span> 설비 가류온도 & 가류시간 입력
          </label>
          <div style="overflow-x: auto;">
            <table data-form-code="1052" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <thead>
                <tr style="background: #fffde7; font-weight: 700; color: #000;">
                  <th colspan="2" style="border: 1px solid #000; padding: 6px;">구 분(Division)</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 72%;">Frunk</th>
                </tr>
                <tr style="background: #fffde7; font-weight: 700; color: #000;">
                  <th colspan="2" style="border: 1px solid #000; padding: 6px;">부 위(Part)</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 72%;">JG 열융착 금형</th>
                </tr>
              </thead>
              <tbody>
                <!-- 1. 가류온도 영역 -->
                <tr>
                  <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle; width: 14%;">
                    가류온도<br>(Temperature) 상<br>(Upper/하(DOWN)
                  </td>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; width: 14%;">
                    스펙(mm)
                  </td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
                </tr>${tempRowsHtml}

                <!-- 2. 가류시간 영역 -->
                <tr>
                  <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    가류시간(Time)- 초<br>(Sec)
                  </td>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">
                    스펙(mm)
                  </td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                </tr>${timeRowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      `;
}

/**
 * Section5Renderer.js 의 `formCode === 1052` 에서 위임 호출.
 * @param {HTMLElement} section5 #section5DynamicContainer
 * @param {Object} ctx           Section5Renderer 컨텍스트
 */
export function renderF1052Section5(section5, ctx = {}) {
  const savedDim = { ...(ctx.existingData?.dimData || {}) };
  const savedLots = { ...(ctx.existingData?.materialLots || {}) };
  const legacyVulc = ctx.existingData?.vulcTable || ctx.existingData?.vulcData || {};
  const legacyJointLot = ctx.existingData?.jointRubberLotNo || '';

  section5.querySelectorAll('input[data-form-code="1052"][data-save-group="dimData"]').forEach(el => {
    if (el.id) savedDim[el.id] = el.value;
  });
  section5.querySelectorAll('input[data-form-code="1052"][data-save-group="materialLots"]').forEach(el => {
    if (el.id) savedLots[el.id] = el.value;
  });

  section5.innerHTML = renderF1052Section5HTML(savedDim, savedLots, legacyVulc, legacyJointLot);

  const jointInput = section5.querySelector('#f1052_jointRubberLotNo');
  if (jointInput) {
    jointInput.addEventListener('blur', () => {
      if (jointInput.value) jointInput.value = autoFormatDateTimeString(jointInput.value);
    });
    jointInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        jointInput.value = autoFormatDateTimeString(jointInput.value);
      }
    });
  }

  if (ctx.bindNumberWheelPicker) {
    section5.querySelectorAll('input[data-form-code="1052"][data-f1052-vulc="1"]').forEach(input => {
      const spec = parseFloat(input.dataset.wheelParsedSpec) || 0;
      const range = parseFloat(input.dataset.wheelRange) || 30;
      const unit = input.dataset.wheelUnit || '℃';
      const title = input.dataset.wheelTitle || '가류온도';
      ctx.bindNumberWheelPicker(input, title, spec, range, unit);
    });
  }
}
