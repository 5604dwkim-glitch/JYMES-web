/**
 * 양식 고유 번호 #5004 (GM 9BQC / G/RUN / 조인트-FRT)
 * Section 5 전용 렌더러
 *
 * - 5. 재료(Joint material) 카드:
 *   · 조인트 재료명 (Joint grade name)      -> f5004_joint_grade_name
 *   · 조인트 재료일자 (Joint material lot no) -> f5004_joint_material_lot
 * - 6. 사출온도 ( Temperature ) 카드:
 *   · 구분: Sett'g / Actual × 직각 / 둔각 × Injection A / Injection B
 *   · 열: 노즐(Nozzle) / 실린더 1(N2) / 실린더 2(H3) / 실린더 3(H4)
 * - 7. 사출조건 ( Injection condition ) 카드:
 *   · 상단 블록: Injection 직각 Machine / 하단 블록: Injection 둔각 Machine
 *   · 행: 거리 (Distance) / 속도 (Speed) / 압력 (Press) / 시간 (Time)
 *   · 열: 초물(Start) [1·2·3단] / 중물(Half) [1·2·3단] / 종물(Finish) [1·2·3단]
 * - 모든 입력칸 ID 는 `f5004_` 접두사 및 명시적 `data-*` 속성만 사용 (GEMINI.md 원칙 1·2·8·10·12·13)
 */

export const F5004_JOINT_MATERIAL_FIELDS = [
  {
    id: 'f5004_joint_grade_name',
    label: '조인트 재료명 (Joint grade name)',
    fontSize: '11px'
  },
  {
    id: 'f5004_joint_material_lot',
    label: '조인트 재료일자 (Joint material lot no)',
    fontSize: '10.5px'
  }
];

export const F5004_TEMP_MODES = [
  { key: 'set', labelHtml: "Sett<br>'g", titleLabel: "Sett'g" },
  { key: 'act', labelHtml: 'Act<br>ual', titleLabel: 'Actual' }
];

export const F5004_TEMP_ANGLES = [
  { key: 'right', label: '직각' },
  { key: 'obtuse', label: '둔각' }
];

export const F5004_TEMP_INJECTIONS = [
  { key: 'A', label: 'Injection A' },
  { key: 'B', label: 'Injection B' }
];

export const F5004_TEMP_ZONES = [
  { key: 'nozzle', labelHtml: '노즐<br>(Nozzle)', titleLabel: '노즐(Nozzle)' },
  { key: 'n2', labelHtml: '실린더 1<br>(N2)', titleLabel: '실린더 1(N2)' },
  { key: 'h3', labelHtml: '실린더 2<br>(H3)', titleLabel: '실린더 2(H3)' },
  { key: 'h4', labelHtml: '실린더 3<br>(H4)', titleLabel: '실린더 3(H4)' }
];

export const F5004_COND_MACHINES = [
  { key: 'right', bannerLabel: 'Injection \u00a0직각 \u00a0Machine' },
  { key: 'obtuse', bannerLabel: 'Injection \u00a0둔각 \u00a0Machine' }
];

export const F5004_COND_STAGES = [
  { key: '초', label: '초물(Start)' },
  { key: '중', label: '중물(Half)' },
  { key: '종', label: '종물(Finish)' }
];

export const F5004_COND_PARAMS = [
  { key: 'dist', labelHtml: '거리<br><span style="font-size: 8.5px; font-weight: 600;">(Distance)</span>' },
  { key: 'speed', labelHtml: '속도<br><span style="font-size: 8.5px; font-weight: 600;">(Speed)</span>' },
  { key: 'press', labelHtml: '압력<br><span style="font-size: 8.5px; font-weight: 600;">(Press)</span>' },
  { key: 'time', labelHtml: '시간<br><span style="font-size: 8.5px; font-weight: 600;">(Time)</span>' }
];

export const F5004_COND_STEPS = [1, 2, 3];

const LABEL_TH_BASE_STYLE = 'border: 1px solid #000; padding: 8px 6px; background: #ffffff; font-weight: 700; color: #000; letter-spacing: -0.2px; vertical-align: middle;';
const INPUT_TD_STYLE = 'border: 1px solid #000; padding: 2px 4px; background: #ffffff; vertical-align: middle;';
const TEXT_INPUT_STYLE = 'width: 100%; min-width: 0; height: 28px; border: none; text-align: center; font-size: 12px; font-weight: 700; color: #000; padding: 2px 4px; background: transparent; outline: none; border-radius: 0; box-sizing: border-box;';

const TEMP_HEADER_TH_STYLE = 'border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 10.5px; line-height: 1.25; vertical-align: middle;';
const TEMP_MODE_TH_STYLE = 'border: 1px solid #000; padding: 4px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 10.5px; line-height: 1.2; vertical-align: middle;';
const TEMP_ANGLE_TH_STYLE = 'border: 1px solid #000; padding: 4px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 10.5px; vertical-align: middle;';
const TEMP_INPUT_STYLE = 'width: 100%; min-width: 0; height: 24px; border: none; text-align: center; font-size: 11px; font-weight: 700; color: #000; padding: 1px 2px; background: transparent; outline: none; border-radius: 0; box-sizing: border-box;';

const COND_DIV_TH_STYLE = 'border: 1px solid #000; padding: 3px 1px; background: #ffffff; font-weight: 700; color: #000; font-size: 10px; line-height: 1.15; letter-spacing: -0.3px; white-space: nowrap; vertical-align: middle;';
const COND_HEADER_TH_STYLE = 'border: 1px solid #000; padding: 5px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 10.5px; letter-spacing: -0.2px; white-space: nowrap; vertical-align: middle;';
const COND_BANNER_TH_STYLE = 'border: 1px solid #000; padding: 4px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;';
const COND_INPUT_STYLE = 'width: 100%; min-width: 0; height: 26px; border: none; text-align: center; font-size: 11px; font-weight: 700; color: #000; padding: 1px 0; background: transparent; outline: none; border-radius: 0; box-sizing: border-box;';

function escapeAttr(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderJointMaterialCardHTML(savedValues = {}) {
  const rowsHTML = F5004_JOINT_MATERIAL_FIELDS.map(field => {
    const val = escapeAttr(savedValues[field.id]);
    return `
                <tr>
                  <th scope="row" style="${LABEL_TH_BASE_STYLE} font-size: ${field.fontSize};">${field.label}</th>
                  <td style="${INPUT_TD_STYLE}">
                    <input type="text" id="${field.id}" data-form-code="5004" data-save-group="dimData" data-wheel-skip="1" class="form-control" style="${TEXT_INPUT_STYLE}" value="${val}" />
                  </td>
                </tr>`;
  }).join('');

  return `
        <div class="card f5004-joint-material-card" data-form-code="5004" style="padding: 16px; margin-bottom: 16px;">
          <style>
            .f5004-joint-material-card[data-form-code="5004"] input[type="text"] {
              min-width: 0;
              box-sizing: border-box;
            }
          </style>
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
            🧪 <span class="sec-num"></span> 재료(Joint material)
          </label>
          <div style="width: 100%; overflow-x: hidden;">
            <table data-form-code="5004" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <colgroup>
                <col style="width: 54%;" />
                <col style="width: 46%;" />
              </colgroup>
              <tbody>${rowsHTML}
              </tbody>
            </table>
          </div>
        </div>`;
}

function renderInjectionTempCardHTML(savedValues = {}) {
  const zoneHeadersHTML = F5004_TEMP_ZONES
    .map(z => `<th style="${TEMP_HEADER_TH_STYLE}">${z.labelHtml}</th>`)
    .join('\n                  ');

  const bodyRowsHTML = F5004_TEMP_MODES.map(mode =>
    F5004_TEMP_ANGLES.map((angle, angleIdx) =>
      F5004_TEMP_INJECTIONS.map((inj, injIdx) => {
        const isFirstOfMode = angleIdx === 0 && injIdx === 0;
        const isFirstOfAngle = injIdx === 0;

        const modeCell = isFirstOfMode
          ? `\n                  <th scope="rowgroup" rowspan="4" style="${TEMP_MODE_TH_STYLE}">${mode.labelHtml}</th>`
          : '';
        const angleCell = isFirstOfAngle
          ? `\n                  <th scope="rowgroup" rowspan="2" style="${TEMP_ANGLE_TH_STYLE}">${angle.label}</th>`
          : '';

        const rowTopBorder = isFirstOfAngle ? '1px solid #000' : '1px dotted #000';
        const rowBottomBorder = isFirstOfAngle ? '1px dotted #000' : '1px solid #000';

        const injThStyle = `border-left: 1px solid #000; border-right: 1px solid #000; border-top: ${rowTopBorder}; border-bottom: ${rowBottomBorder}; padding: 4px 2px; background: #ffffff; font-weight: 600; color: #000; font-size: 9.5px; letter-spacing: -0.2px; white-space: nowrap; vertical-align: middle;`;
        const cellTdStyle = `border-left: 1px solid #000; border-right: 1px solid #000; border-top: ${rowTopBorder}; border-bottom: ${rowBottomBorder}; padding: 1px 2px; background: #ffffff; vertical-align: middle;`;

        const zoneCellsHTML = F5004_TEMP_ZONES.map(zone => {
          const id = `f5004_temp_${mode.key}_${angle.key}_inj${inj.key}_${zone.key}`;
          const val = escapeAttr(savedValues[id]);
          const wheelTitle = `사출온도 ${mode.titleLabel} ${angle.label} ${inj.label} - ${zone.titleLabel}`;
          return `<td style="${cellTdStyle}">
                    <input type="text" id="${id}" data-form-code="5004" data-save-group="dimData" data-f5004-temp="1" data-wheel-parsed-spec="200" data-wheel-unit="℃" data-wheel-range="80" data-wheel-title="${wheelTitle}" class="form-control" style="${TEMP_INPUT_STYLE}" value="${val}" />
                  </td>`;
        }).join('\n                  ');

        return `
                <tr>${modeCell}${angleCell}
                  <th scope="row" style="${injThStyle}">${inj.label}</th>
                  ${zoneCellsHTML}
                </tr>`;
      }).join('')
    ).join('')
  ).join('');

  return `
        <div class="card f5004-temp-card" data-form-code="5004" style="padding: 14px 10px; margin-bottom: 16px;">
          <style>
            .f5004-temp-card[data-form-code="5004"] input[type="text"] {
              min-width: 0;
              box-sizing: border-box;
            }
          </style>
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; padding: 0 4px; display: block;">
            ♨️ <span class="sec-num"></span> 사출온도 ( Temperature )
          </label>
          <div style="width: 100%; overflow-x: hidden;">
            <table data-form-code="5004" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <colgroup>
                <col style="width: 8%;" />
                <col style="width: 9%;" />
                <col style="width: 19%;" />
                <col style="width: 16%;" />
                <col style="width: 16%;" />
                <col style="width: 16%;" />
                <col style="width: 16%;" />
              </colgroup>
              <thead>
                <tr>
                  <th colspan="3" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 11.5px; vertical-align: middle;">구분</th>
                  ${zoneHeadersHTML}
                </tr>
              </thead>
              <tbody>${bodyRowsHTML}
              </tbody>
            </table>
          </div>
        </div>`;
}

function renderInjectionConditionCardHTML(savedValues = {}) {
  const stageHeadersHTML = F5004_COND_STAGES
    .map(st => `<th colspan="3" style="${COND_HEADER_TH_STYLE}">${st.label}</th>`)
    .join('\n                  ');

  const subColsHTML = Array.from({ length: 9 }, () => '<col style="width: 9.6667%;" />')
    .join('\n                ');

  const bodyBlocksHTML = F5004_COND_MACHINES.map(machine => {
    const paramRowsHTML = F5004_COND_PARAMS.map((param, rowIdx) => {
      const topBorder = rowIdx === 0 ? '1px solid #000' : '1px dotted #000';
      const bottomBorder = rowIdx === F5004_COND_PARAMS.length - 1 ? '1px solid #000' : '1px dotted #000';

      const paramThStyle = `border-left: 1px solid #000; border-right: 1px solid #000; border-top: ${topBorder}; border-bottom: ${bottomBorder}; padding: 2px 1px; background: #ffffff; font-weight: 700; color: #000; font-size: 10px; line-height: 1.15; letter-spacing: -0.3px; white-space: nowrap; vertical-align: middle;`;

      const stageStepCellsHTML = F5004_COND_STAGES.map(stage =>
        F5004_COND_STEPS.map((step, stepIdx) => {
          const leftBorder = stepIdx === 0 ? '1px solid #000' : '1px dotted #000';
          const rightBorder = stepIdx === F5004_COND_STEPS.length - 1 ? '1px solid #000' : '1px dotted #000';
          const tdStyle = `border-left: ${leftBorder}; border-right: ${rightBorder}; border-top: ${topBorder}; border-bottom: ${bottomBorder}; padding: 1px 0; background: #ffffff; vertical-align: middle;`;

          const id = `f5004_cond_${machine.key}_${param.key}_${stage.key}_${step}`;
          const val = escapeAttr(savedValues[id]);
          return `<td style="${tdStyle}">
                    <input type="text" inputmode="decimal" id="${id}" data-form-code="5004" data-save-group="dimData" data-wheel-skip="1" class="form-control" style="${COND_INPUT_STYLE}" value="${val}" />
                  </td>`;
        }).join('\n                  ')
      ).join('\n                  ');

      return `
                <tr>
                  <th scope="row" style="${paramThStyle}">${param.labelHtml}</th>
                  ${stageStepCellsHTML}
                </tr>`;
    }).join('');

    return `
                <tr>
                  <th colspan="10" style="${COND_BANNER_TH_STYLE}">${machine.bannerLabel}</th>
                </tr>${paramRowsHTML}`;
  }).join('');

  return `
        <div class="card f5004-cond-card" data-form-code="5004" style="padding: 12px 6px; margin-bottom: 16px;">
          <style>
            .f5004-cond-card[data-form-code="5004"] input[type="text"] {
              min-width: 0;
              box-sizing: border-box;
            }
          </style>
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; padding: 0 4px; display: block;">
            ⚙️ <span class="sec-num"></span> 사출조건 ( Injection condition )
          </label>
          <div style="width: 100%; overflow-x: hidden;">
            <table data-form-code="5004" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <colgroup>
                <col style="width: 13%;" />
                ${subColsHTML}
              </colgroup>
              <thead>
                <tr>
                  <th style="${COND_DIV_TH_STYLE}">구분<br><span style="font-size: 8.5px; font-weight: 600;">(Division)</span></th>
                  ${stageHeadersHTML}
                </tr>
              </thead>
              <tbody>${bodyBlocksHTML}
              </tbody>
            </table>
          </div>
        </div>`;
}

/**
 * @param {Object} savedValues 저장/현재 입력값 맵 (id -> value)
 * @returns {string} Section 5 HTML
 */
export function renderF5004Section5HTML(savedValues = {}) {
  return `${renderJointMaterialCardHTML(savedValues)}
${renderInjectionTempCardHTML(savedValues)}
${renderInjectionConditionCardHTML(savedValues)}
      `;
}

/**
 * Section5Renderer.js 의 `formCode === 5004` 에서 위임 호출.
 * @param {HTMLElement} section5 #section5DynamicContainer
 * @param {Object} ctx           Section5Renderer 컨텍스트
 */
export function renderF5004Section5(section5, ctx = {}) {
  const saved = { ...(ctx.existingData?.dimData || {}) };
  section5.querySelectorAll('input[data-form-code="5004"]').forEach(el => {
    if (el.id) saved[el.id] = el.value;
  });

  section5.innerHTML = renderF5004Section5HTML(saved);

  if (ctx.bindNumberWheelPicker) {
    section5.querySelectorAll('input[data-form-code="5004"][data-f5004-temp="1"]').forEach(input => {
      const spec = parseFloat(input.dataset.wheelParsedSpec) || 200;
      const range = parseFloat(input.dataset.wheelRange) || 80;
      const unit = input.dataset.wheelUnit ?? '℃';
      const title = input.dataset.wheelTitle || '사출온도';
      ctx.bindNumberWheelPicker(input, title, spec, range, unit);
    });
  }
}
