/**
 * 양식 고유 번호 #5003 (GM 9BQC / G/RUN / 소재준비-단컷팅)
 * "6. 생산실적 및 불량 현황" 전용 렌더러 (상단 FRT 표 [FRT LH · FRT RH] / 하단 RR 표 [RR LH · RR RH])
 *
 * - 생산량 (Q,ty): 구 분(Division) | FRT LH · FRT RH (또는 RR LH · RR RH) 헤더,
 *   A (계획 / 실적) + B (계획 / 실적) 총 4행 입력
 * - 불량소재구분 (각 LH/RH 아래 A · B 2열씩 총 4열):
 *   · 압출소재 불량 (Extrusion): 스코치(Scortch), 외면 흠(Scratch), 오염(Contamination), 기타 ( Etc )
 *   · 공정간 불량(Process Badness): 단컷팅(Step Cutt,g), 기타 ( Etc )
 *   · 불량 합계(Bad Sum): 각 열(LH A, LH B, RH A, RH B)별 자동 합산
 * - 가로 스크롤 방지: `table-layout: fixed` + `<colgroup>` 비율 고정 + `[data-form-code="5003"]` 스코프 스타일
 * - 모든 ID/저장 키는 `f5003_` 접두사 및 명시적 `data-*` 속성 사용 (GEMINI.md 원칙 1·2·8·10·11·12·13)
 */

export const F5003_QTY_GROUPS = [
  {
    groupKey: 'FRT',
    sides: [
      { sideKey: 'LH', label: 'FRT LH', legacySuffix: 'FL' },
      { sideKey: 'RH', label: 'FRT RH', legacySuffix: 'FR' }
    ],
    subSections: ['A', 'B'],
    defaultPlan: 1200,
    marginBottom: '18px'
  },
  {
    groupKey: 'RR',
    sides: [
      { sideKey: 'LH', label: 'RR LH', legacySuffix: 'RL' },
      { sideKey: 'RH', label: 'RR RH', legacySuffix: 'RR' }
    ],
    subSections: ['A', 'B'],
    defaultPlan: 1200,
    marginBottom: '0'
  }
];

export const F5003_EXTRUSION_DEFECTS = [
  { key: 'ext_scorch', label: '스코치(Scortch)', legacyKey: 'def_ext_scorch' },
  { key: 'ext_scratch', label: '외면 흠(Scratch)', legacyKey: 'def_ext_scratch' },
  { key: 'ext_contam', label: '오염(Contamination)', legacyKey: 'def_ext_contam' },
  { key: 'ext_etc', label: '기타 ( Etc )', isEtc: true, legacyKey: 'def_ext_etc' }
];

export const F5003_PROCESS_DEFECTS = [
  { key: 'proc_step_cut', label: '단컷팅(Step Cutt,g)', legacyKey: 'def_proc_len' },
  { key: 'proc_etc', label: '기타 ( Etc )', isEtc: true, legacyKey: 'def_proc_etc' }
];

export const F5003_ALL_DEFECTS = [
  ...F5003_EXTRUSION_DEFECTS,
  ...F5003_PROCESS_DEFECTS
];

const INPUT_STYLE = 'width: 100%; min-width: 0; height: 26px; border: none; text-align: center; font-size: 11px; font-weight: 700; color: #000; padding: 1px 0; background: transparent; outline: none; border-radius: 0; box-sizing: border-box;';

/**
 * 저장값 맵에서 계획·실적·불량 합계를 산출한다. (구 저장 키 하위 호환 포함 — GEMINI.md 원칙 11)
 * @param {Object} savedValues (id -> value)
 */
export function computeF5003Totals(savedValues = {}) {
  let totalPlan = 0;
  let totalActual = 0;
  let totalDefect = 0;
  const secDefSums = {};
  const secHasDefectInput = {};

  F5003_QTY_GROUPS.forEach(group => {
    group.sides.forEach(side => {
      group.subSections.forEach(sub => {
        const secId = `${group.groupKey}_${side.sideKey}_${sub}`;
        const planKey = `f5003_${secId}_plan`;
        const actKey = `f5003_${secId}_act`;
        const legacyPlan = sub === 'A' ? savedValues[`plan_${side.legacySuffix}`] : undefined;
        const legacyAct = sub === 'A' ? savedValues[`act_${side.legacySuffix}`] : undefined;

        const rawPlan = savedValues[planKey] ?? legacyPlan;
        const rawAct = savedValues[actKey] ?? legacyAct ?? '';
        const planVal = rawPlan !== undefined ? rawPlan : group.defaultPlan;

        totalPlan += Number(planVal) || 0;
        totalActual += Number(rawAct) || 0;

        let colSum = 0;
        let hasInput = false;
        F5003_ALL_DEFECTS.forEach(def => {
          const defKey = `f5003_${secId}_def_${def.key}`;
          const legacyDef = (sub === 'A' && def.legacyKey)
            ? savedValues[`${def.legacyKey}_${side.legacySuffix}`]
            : undefined;
          const raw = savedValues[defKey] ?? legacyDef;
          if (raw !== undefined && String(raw).trim() !== '') hasInput = true;
          colSum += Number(raw) || 0;
        });

        secDefSums[secId] = colSum;
        secHasDefectInput[secId] = hasInput;
        totalDefect += colSum;
      });
    });
  });

  return { totalPlan, totalActual, totalDefect, secDefSums, secHasDefectInput };
}

function renderGroupBlock(group, savedValues, secDefSums, secHasDefectInput) {
  const colgroupHtml = [
    '<col style="width: 14%;" />',
    '<col style="width: 13%;" />',
    '<col style="width: 5%;" />',
    '<col style="width: 17%;" />',
    '<col style="width: 17%;" />',
    '<col style="width: 17%;" />',
    '<col style="width: 17%;" />'
  ].join('\n                  ');

  // ── 1) 상단 생산량 (Q,ty) 테이블 (A 계획/실적, B 계획/실적) ──
  const sideHeadersHtml = group.sides
    .map(side => `<th colspan="2" style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11.5px; vertical-align: middle;">${side.label}</th>`)
    .join('\n                    ');

  const prodRowsHtml = group.subSections.map((sub, subIdx) => {
    const isFirstSub = subIdx === 0;
    const isLastSub = subIdx === group.subSections.length - 1;
    const planTopBorder = isFirstSub ? 'border-top: 1px solid #000; ' : '';
    const subBottomBorder = isLastSub ? '1px solid #000' : '1px dotted #000';

    const qtyRowspanCell = isFirstSub
      ? `\n                    <td rowspan="4" style="border-top: 1px solid #000; border-bottom: 1px solid #000; border-left: 1px solid #000; border-right: 1px dotted #000; padding: 5px 2px; background: #ffffff; font-weight: 600; color: #000; font-size: 10.5px; letter-spacing: -0.3px; vertical-align: middle;">생산량 (Q,ty)</td>`
      : '';

    const planCells = group.sides.map((side, sideIdx) => {
      const secId = `${group.groupKey}_${side.sideKey}_${sub}`;
      const planId = `f5003_${secId}_plan`;
      const legacyPlan = sub === 'A' ? savedValues[`plan_${side.legacySuffix}`] : undefined;
      const rawPlan = savedValues[planId] ?? legacyPlan;
      const planVal = rawPlan !== undefined ? rawPlan : String(group.defaultPlan);
      const rightBorder = sideIdx === group.sides.length - 1 ? '1px solid #000' : '1px dotted #000';
      return `<td colspan="2" style="${planTopBorder}border-bottom: 1px dotted #000; border-right: ${rightBorder}; padding: 0; background: #ffffff; vertical-align: middle;">
                      <input type="number" min="0" inputmode="numeric" id="${planId}" data-form-code="5003" data-save-group="qtyTable" data-qty-role="plan" class="form-control" style="${INPUT_STYLE}" value="${planVal}" />
                    </td>`;
    }).join('\n                    ');

    const actCells = group.sides.map((side, sideIdx) => {
      const secId = `${group.groupKey}_${side.sideKey}_${sub}`;
      const actId = `f5003_${secId}_act`;
      const legacyAct = sub === 'A' ? savedValues[`act_${side.legacySuffix}`] : undefined;
      const actVal = savedValues[actId] ?? legacyAct ?? '';
      const rightBorder = sideIdx === group.sides.length - 1 ? '1px solid #000' : '1px dotted #000';
      return `<td colspan="2" style="border-bottom: ${subBottomBorder}; border-right: ${rightBorder}; padding: 0; background: #ffffff; vertical-align: middle;">
                      <input type="number" min="0" inputmode="numeric" id="${actId}" data-form-code="5003" data-save-group="qtyTable" data-qty-role="actual" class="form-control" style="${INPUT_STYLE}" value="${actVal}" />
                    </td>`;
    }).join('\n                    ');

    return `
                  <tr>${qtyRowspanCell}
                    <td style="${planTopBorder}border-bottom: 1px dotted #000; border-right: 1px dotted #000; padding: 5px 2px; background: #ffffff; font-weight: 600; color: #000; font-size: 10.5px; vertical-align: middle;">계획</td>
                    <td rowspan="2" style="${planTopBorder}border-bottom: ${subBottomBorder}; border-right: 1px solid #000; padding: 5px 1px; background: #ffffff; font-weight: 600; color: #000; font-size: 10.5px; vertical-align: middle;">${sub}</td>
                    ${planCells}
                  </tr>
                  <tr>
                    <td style="border-bottom: ${subBottomBorder}; border-right: 1px dotted #000; padding: 5px 2px; background: #ffffff; font-weight: 600; color: #000; font-size: 10.5px; vertical-align: middle;">실적</td>
                    ${actCells}
                  </tr>`;
  }).join('');

  // ── 2) 하단 불량소재구분 테이블 ──
  const defSubHeadersHtml = group.sides
    .map(() =>
      group.subSections
        .map(sub => `<th style="border: 1px solid #000; padding: 5px 2px; background: #ffffff; font-weight: 600; color: #000; font-size: 10.5px; vertical-align: middle;">${sub}</th>`)
        .join('\n                    ')
    )
    .join('\n                    ');

  const renderDefectRows = (defList, categoryHtml) =>
    defList.map((def, idx) => {
      const isLast = idx === defList.length - 1;
      const bottomBorder = isLast ? '1px solid #000' : '1px dotted #000';
      const catCell = idx === 0
        ? `\n                    <td rowspan="${defList.length}" style="border: 1px solid #000; padding: 4px 2px; background: #ffffff; font-weight: 600; color: #000; font-size: 10px; line-height: 1.25; letter-spacing: -0.3px; vertical-align: middle;">${categoryHtml}</td>`
        : '';
      const labelFont = def.isEtc ? '10px' : '9px';
      const labelWeight = def.isEtc ? '600' : '500';

      const inputCells = [];
      group.sides.forEach((side, sideIdx) => {
        group.subSections.forEach((sub, subIdx) => {
          const secId = `${group.groupKey}_${side.sideKey}_${sub}`;
          const id = `f5003_${secId}_def_${def.key}`;
          const legacyDef = (sub === 'A' && def.legacyKey)
            ? savedValues[`${def.legacyKey}_${side.legacySuffix}`]
            : undefined;
          const val = savedValues[id] ?? legacyDef ?? '';
          const isLastSubInSide = subIdx === group.subSections.length - 1;
          const isLastSide = sideIdx === group.sides.length - 1;
          const rightBorder = isLastSubInSide
            ? (isLastSide ? '1px solid #000' : '1px solid #000')
            : '1px dotted #000';

          inputCells.push(`<td style="border-bottom: ${bottomBorder}; border-right: ${rightBorder}; padding: 0; background: #ffffff; vertical-align: middle;">
                      <input type="number" min="0" inputmode="numeric" id="${id}" data-form-code="5003" data-save-group="qtyTable" data-qty-role="defect" data-sec="${secId}" class="form-control" style="${INPUT_STYLE}" value="${val}" />
                    </td>`);
        });
      });

      return `
                  <tr>${catCell}
                    <td colspan="2" style="border-bottom: ${bottomBorder}; border-right: 1px solid #000; padding: 4px 2px; background: #ffffff; font-weight: ${labelWeight}; color: #000; font-size: ${labelFont}; letter-spacing: -0.4px; line-height: 1.2; word-break: keep-all; vertical-align: middle;">${def.label}</td>
                    ${inputCells.join('\n                    ')}
                  </tr>`;
    }).join('');

  const extRowsHtml = renderDefectRows(
    F5003_EXTRUSION_DEFECTS,
    '압출소재<br>불량<br>(Extrusion)'
  );
  const procRowsHtml = renderDefectRows(
    F5003_PROCESS_DEFECTS,
    '공정간<br>불량(Process<br>Badness)'
  );

  const sumCells = [];
  group.sides.forEach(side => {
    group.subSections.forEach((sub, subIdx) => {
      const secId = `${group.groupKey}_${side.sideKey}_${sub}`;
      const sumText = (secDefSums[secId] > 0 || secHasDefectInput[secId]) ? String(secDefSums[secId]) : '';
      const isLastSubInSide = subIdx === group.subSections.length - 1;
      const rightBorder = isLastSubInSide ? '1px solid #000' : '1px dotted #000';
      sumCells.push(`<td id="f5003_${secId}_def_sum" data-form-code="5003" data-qty-role="defect-sum" data-sec="${secId}" style="border-top: 1px solid #000; border-bottom: 1px solid #000; border-right: ${rightBorder}; padding: 5px 2px; background: #ffffff; font-weight: 700; color: var(--accent-rose); font-size: 11px; vertical-align: middle;">${sumText}</td>`);
    });
  });

  const wrapMb = group.marginBottom && group.marginBottom !== '0' ? ` margin-bottom: ${group.marginBottom};` : '';

  return `
            <div style="width: 100%; overflow-x: hidden;${wrapMb}">
              <table data-form-code="5003" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif; margin-bottom: 3px;">
                <colgroup>
                  ${colgroupHtml}
                </colgroup>
                <thead>
                  <tr style="background: #ffffff; font-weight: 700; color: #000;">
                    <th colspan="3" style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-size: 11.5px; vertical-align: middle;">구 분(Division)</th>
                    ${sideHeadersHtml}
                  </tr>
                </thead>
                <tbody>${prodRowsHtml}
                </tbody>
              </table>

              <table data-form-code="5003" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <colgroup>
                  ${colgroupHtml}
                </colgroup>
                <thead>
                  <tr style="background: #ffffff; font-weight: 700; color: #000;">
                    <th colspan="3" style="border: 1px solid #000; padding: 5px 2px; background: #ffffff; font-size: 11px; vertical-align: middle;">불량소재구분</th>
                    ${defSubHeadersHtml}
                  </tr>
                </thead>
                <tbody>${extRowsHtml}${procRowsHtml}
                  <tr>
                    <td colspan="3" style="border: 1px solid #000; padding: 5px 2px; background: #ffffff; font-weight: 600; color: #000; font-size: 10.5px; letter-spacing: -0.2px; vertical-align: middle;">불량 합계(Bad Sum)</td>
                    ${sumCells.join('\n                    ')}
                  </tr>
                </tbody>
              </table>
            </div>`;
}

/**
 * @param {Object} savedValues 저장/현재 입력값 맵 (id -> value)
 * @returns {string} 카드 전체 HTML
 */
export function renderF5003QtySectionHTML(savedValues = {}) {
  const { totalPlan, totalActual, totalDefect, secDefSums, secHasDefectInput } = computeF5003Totals(savedValues);
  const blocksHtml = F5003_QTY_GROUPS
    .map(g => renderGroupBlock(g, savedValues, secDefSums, secHasDefectInput))
    .join('\n');

  return `
        <div class="card f5003-qty-card" data-form-code="5003" style="padding: 14px 10px; margin-bottom: 16px;">
          <style>
            .f5003-qty-card[data-form-code="5003"] input[type="number"]::-webkit-outer-spin-button,
            .f5003-qty-card[data-form-code="5003"] input[type="number"]::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            .f5003-qty-card[data-form-code="5003"] input[type="number"] {
              -moz-appearance: textfield;
              appearance: textfield;
              min-width: 0;
              font-size: 11px !important;
              box-sizing: border-box;
            }
          </style>
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; padding: 0 4px; display: block;">
            📊 <span class="sec-num"></span> 생산실적 및 불량 현황
          </label>
          <input type="hidden" id="targetQty" value="${totalPlan}" />
          <input type="hidden" id="actualQty" value="${totalActual}" />
          <input type="hidden" id="defectQty" value="${totalDefect}" />${blocksHtml}
        </div>
      `;
}

/**
 * qtySection 내부 요소만 스코프 조회하여 섹션별 불량 합계 및 숨김 총계 필드를 갱신한다. (GEMINI.md 원칙 13)
 * @param {HTMLElement} qtySection #qtySection
 */
export function calcF5003QtySummary(qtySection) {
  if (!qtySection) return;

  let totalPlan = 0;
  let totalActual = 0;
  let totalDefect = 0;

  qtySection.querySelectorAll('input[data-form-code="5003"][data-qty-role="plan"]').forEach(el => {
    totalPlan += Number(el.value) || 0;
  });

  qtySection.querySelectorAll('input[data-form-code="5003"][data-qty-role="actual"]').forEach(el => {
    totalActual += Number(el.value) || 0;
  });

  F5003_QTY_GROUPS.forEach(group => {
    group.sides.forEach(side => {
      group.subSections.forEach(sub => {
        const secId = `${group.groupKey}_${side.sideKey}_${sub}`;
        let colSum = 0;
        let hasInput = false;
        qtySection.querySelectorAll(`input[data-form-code="5003"][data-qty-role="defect"][data-sec="${secId}"]`).forEach(el => {
          if (String(el.value).trim() !== '') hasInput = true;
          colSum += Number(el.value) || 0;
        });
        const sumCell = qtySection.querySelector(`td[data-form-code="5003"][data-qty-role="defect-sum"][data-sec="${secId}"]`);
        if (sumCell) sumCell.textContent = (colSum > 0 || hasInput) ? String(colSum) : '';
        totalDefect += colSum;
      });
    });
  });

  const targetInput = qtySection.querySelector('#targetQty');
  const actualInput = qtySection.querySelector('#actualQty');
  const defectInput = qtySection.querySelector('#defectQty');
  if (targetInput) targetInput.value = String(totalPlan);
  if (actualInput) actualInput.value = String(totalActual);
  if (defectInput) defectInput.value = String(totalDefect);
}

/**
 * QtySectionRenderer.js 의 `case 5003` 에서 위임 호출.
 * @param {HTMLElement} qtySection #qtySection (새로 교체된 노드)
 * @param {Object} ctx             QtySectionRenderer 컨텍스트
 */
export function renderF5003QtySection(qtySection, ctx = {}) {
  const saved = { ...(ctx.existingData?.qtyTable || {}) };
  qtySection.querySelectorAll('[data-form-code="5003"][data-save-group="qtyTable"]').forEach(el => {
    if (el.id && el.value !== '') saved[el.id] = el.value;
  });

  qtySection.innerHTML = renderF5003QtySectionHTML(saved);

  if (qtySection.dataset.f5003Bound !== '1') {
    qtySection.dataset.f5003Bound = '1';
    qtySection.addEventListener('input', () => calcF5003QtySummary(qtySection));
  }
  calcF5003QtySummary(qtySection);
}
