/**
 * 양식 고유 번호 #5010 (GM 9BQC / G/RUN / 후가공-RR)
 * "6. 생산실적 및 불량 현황" 전용 렌더러
 *
 * - 상단 열 구성 (2단 헤더 × 4열):
 *   · 1행: 구 분 [colspan=2, rowspan=2] | RR LH ( [입력] )호기 [colspan=2] | RR RH ( [입력] )호기 [colspan=2]
 *   · 2행: PRIVACY | TINTED | PRIVACY | TINTED
 * - 제품 수량 (4행): 검 사 / 정 품 / 공정불량(리워크) / 완전불량(폐기)
 * - 압출 소재 불량 (6행 + 소 계): 스코치 / 외면 흠 / 오 염 / 코팅 불량 / 단면 불량 / 기타( ) / 소 계
 * - 조인트 불량 (9행 + 소 계):
 *   떨어짐 / 양부족 / 밀 림 / 단 차 / 기 포 / 씹 힘 / 삽입 불량 / 수 축 / 기타( ) / 소 계
 * - 후가공 불량 (9행 + 소 계):
 *   길이 불량 / 외면 오염 / 과사상 / 미사상 / 마킹 누락 / PAD 누락 / PROTECT FILM 누락 / 본드 오염 / 기타( ) / 소 계
 * - 불량 합계: 열별 압출·조인트·후가공 소계 자동 합산
 * - 모든 ID/저장 키는 `f5010_` 접두사 및 명시적 `data-*` 속성 사용 (GEMINI.md 원칙 1·2·8·9·10·11·12·13·16)
 */

export const F5010_MACHINE_GROUPS = [
  { side: 'LH', id: 'f5010_RR_LH_machine_no', labelPrefix: 'RR LH' },
  { side: 'RH', id: 'f5010_RR_RH_machine_no', labelPrefix: 'RR RH' }
];

export const F5010_QTY_COLS = [
  { key: 'LH_PRI', label: 'PRIVACY', legacyF5010ColKey: 'LH_2', legacyAltKey: 'PRI_LH', legacyKey: 'FL' },
  { key: 'LH_TINT', label: 'TINTED', legacyF5010ColKey: 'LH_3', legacyAltKey: 'PRI_RH', legacyKey: 'FR' },
  { key: 'RH_PRI', label: 'PRIVACY', legacyF5010ColKey: 'RH_2', legacyAltKey: 'TINT_LH', legacyKey: 'RL' },
  { key: 'RH_TINT', label: 'TINTED', legacyF5010ColKey: 'RH_3', legacyAltKey: 'TINT_RH', legacyKey: 'RR' }
];

export const F5010_COUNT_ROWS = [
  { key: 'insp', label: '검 사', role: 'insp', fontSize: '10.5px' },
  { key: 'good', label: '정 품', role: 'good', fontSize: '10.5px' },
  { key: 'rework', label: '공정불량(리워크)', role: 'rework', fontSize: '9.5px', legacyRowKey: 'rework_dv' },
  { key: 'scrap', label: '완전불량(폐기)', role: 'scrap', fontSize: '9.5px' }
];

export const F5010_DEFECT_GROUPS = [
  {
    key: 'ext',
    groupHtml: '압출<br>소재<br>불량',
    items: [
      { key: 'scorch', label: '스코치', legacyPrefix: 'ext_scorch' },
      { key: 'scratch', label: '외면 흠', legacyPrefix: 'ext_scratch' },
      { key: 'contam', label: '오 염', legacyPrefix: 'ext_contam' },
      { key: 'coat', label: '코팅 불량' },
      { key: 'cross', label: '단면 불량', legacyPrefix: 'ext_cross' },
      { key: 'etc', label: '기타', isEtc: true, legacyPrefix: 'ext_etc' }
    ]
  },
  {
    key: 'joint',
    groupHtml: '조인<br>트<br>불량',
    items: [
      { key: 'split', label: '떨어짐', legacyItemKey: 'split_right' },
      { key: 'short', label: '양부족' },
      { key: 'push', label: '밀 림' },
      { key: 'step', label: '단 차' },
      { key: 'bubble', label: '기 포' },
      { key: 'dent', label: '씹 힘' },
      { key: 'insert', label: '삽입 불량' },
      { key: 'sink', label: '수 축' },
      { key: 'etc', label: '기타', isEtc: true }
    ]
  },
  {
    key: 'post',
    groupHtml: '후가<br>공<br>불량',
    items: [
      { key: 'len', label: '길이 불량', legacyPrefix: 'proc_len' },
      { key: 'contam', label: '외면 오염' },
      { key: 'overtrim', label: '과사상' },
      { key: 'undertrim', label: '미사상' },
      { key: 'mark_miss', label: '마킹 누락' },
      { key: 'pad_miss', label: 'PAD 누락' },
      { key: 'film_miss', label: 'PROTECT FILM 누락', fontSize: '8.5px' },
      { key: 'bond_contam', label: '본드 오염' },
      { key: 'etc', label: '기타', isEtc: true, legacyPrefix: 'proc_oth' }
    ]
  }
];

const SOLID = '1px solid #000';
const DOTTED = '1px dotted #000';
const INPUT_STYLE = 'width: 100%; min-width: 0; height: 25px; border: none; text-align: center; font-size: 11px; font-weight: 700; color: #000; padding: 1px 0; background: transparent; outline: none; border-radius: 0; box-sizing: border-box;';

function escapeAttr(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function countIdOf(colKey, rowKey) {
  return `f5010_${colKey}_${rowKey}`;
}

function defIdOf(colKey, groupKey, itemKey) {
  return `f5010_${colKey}_def_${groupKey}_${itemKey}`;
}

function etcNoteIdOf(groupKey) {
  return `f5010_def_${groupKey}_etc_note`;
}

function readCountValue(savedValues, colCfg, rowCfg, hasF5010Keys) {
  const rowKey = typeof rowCfg === 'string' ? rowCfg : rowCfg.key;
  const legacyRowKey = typeof rowCfg === 'object' ? rowCfg.legacyRowKey : undefined;

  const id = countIdOf(colCfg.key, rowKey);
  if (savedValues[id] !== undefined) return savedValues[id];

  const candidateCols = [colCfg.key, colCfg.legacyF5010ColKey, colCfg.legacyAltKey].filter(Boolean);
  const candidateRows = [rowKey, legacyRowKey].filter(Boolean);

  for (const cKey of candidateCols) {
    for (const rKey of candidateRows) {
      const candId = countIdOf(cKey, rKey);
      if (savedValues[candId] !== undefined) return savedValues[candId];
    }
  }

  if (hasF5010Keys) return undefined;

  // 구버전 표준 수량표 키 하위 호환 복원 (GEMINI.md 원칙 11)
  if (rowKey === 'insp') return savedValues[`plan_${colCfg.legacyKey}`];
  if (rowKey === 'good') return savedValues[`act_${colCfg.legacyKey}`];
  return undefined;
}

function readDefectValue(savedValues, colCfg, groupKey, item, hasF5010Keys) {
  const id = defIdOf(colCfg.key, groupKey, item.key);
  if (savedValues[id] !== undefined) return savedValues[id];

  const candidateCols = [colCfg.key, colCfg.legacyF5010ColKey, colCfg.legacyAltKey].filter(Boolean);
  const candidateItems = [item.key, item.legacyItemKey].filter(Boolean);

  for (const cKey of candidateCols) {
    for (const iKey of candidateItems) {
      const candId = defIdOf(cKey, groupKey, iKey);
      if (savedValues[candId] !== undefined) return savedValues[candId];
    }
  }

  if (hasF5010Keys) return undefined;

  if (item.legacyPrefix) {
    return savedValues[`${item.legacyPrefix}_${colCfg.legacyKey}`];
  }
  return undefined;
}

/**
 * 저장값 맵에서 검사·정품·그룹별 소계·열별 불량 합계·전체 불량 총계를 산출한다.
 * - 열별로 `완전불량(폐기)` 입력칸에 값이 있으면 해당 값을, 없으면 해당 열의 불량 합계(압출+조인트+후가공)를 폐기 불량 총계에 반영
 * @param {Object} savedValues (id -> value)
 */
export function computeF5010Totals(savedValues = {}) {
  const hasF5010Keys = Object.keys(savedValues).some(k => k.startsWith('f5010_'));

  let totalInsp = 0;
  let totalGood = 0;
  let totalDefect = 0;

  const groupSubtotals = {};
  const groupHasInput = {};
  const colTotals = {};
  const colHasInput = {};

  F5010_QTY_COLS.forEach(colCfg => {
    const colKey = colCfg.key;

    const rawInsp = readCountValue(savedValues, colCfg, 'insp', hasF5010Keys);
    totalInsp += Number(rawInsp) || 0;

    const rawGood = readCountValue(savedValues, colCfg, 'good', hasF5010Keys);
    totalGood += Number(rawGood) || 0;

    const rawScrap = readCountValue(savedValues, colCfg, 'scrap', hasF5010Keys);
    const hasScrap = rawScrap !== undefined && String(rawScrap).trim() !== '';
    const scrapNum = Number(rawScrap) || 0;

    let colDefSum = 0;
    let colAnyInput = false;

    F5010_DEFECT_GROUPS.forEach(group => {
      const subKey = `${colKey}_${group.key}`;
      let gSum = 0;
      let gHas = false;

      group.items.forEach(item => {
        const raw = readDefectValue(savedValues, colCfg, group.key, item, hasF5010Keys);
        if (raw !== undefined && String(raw).trim() !== '') gHas = true;
        gSum += Number(raw) || 0;
      });

      groupSubtotals[subKey] = gSum;
      groupHasInput[subKey] = gHas;
      colDefSum += gSum;
      if (gHas) colAnyInput = true;
    });

    colTotals[colKey] = colDefSum;
    colHasInput[colKey] = colAnyInput;
    totalDefect += (hasScrap && scrapNum > 0) ? scrapNum : colDefSum;
  });

  const totalTarget = totalInsp > 0 ? totalInsp : (totalGood + totalDefect);

  return {
    totalTarget,
    totalGood,
    totalDefect,
    groupSubtotals,
    groupHasInput,
    colTotals,
    colHasInput,
    hasF5010Keys
  };
}

/**
 * @param {Object} savedValues 저장/현재 입력값 맵
 * @returns {string} 카드 전체 HTML
 */
export function renderF5010QtySectionHTML(savedValues = {}) {
  const {
    totalTarget,
    totalGood,
    totalDefect,
    groupSubtotals,
    groupHasInput,
    colTotals,
    colHasInput,
    hasF5010Keys
  } = computeF5010Totals(savedValues);

  const machineGroupHeaders = F5010_MACHINE_GROUPS
    .map(m => {
      const val = savedValues[m.id] ?? '';
      return `<th colspan="2" scope="colgroup" style="border: ${SOLID}; padding: 5px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; white-space: nowrap; vertical-align: middle;">
                    <span style="display: inline-flex; align-items: center; justify-content: center; gap: 1px;">
                      <span>${m.labelPrefix} (&nbsp;</span>
                      <input type="text" inputmode="numeric" id="${m.id}" data-form-code="5010" data-save-group="qtyTable" data-wheel-skip="1" class="form-control f5010-machine-no-input" value="${escapeAttr(val)}" aria-label="${m.labelPrefix} 호기 번호" />
                      <span>&nbsp;)호기</span>
                    </span>
                  </th>`;
    })
    .join('\n                  ');

  const subHeaderCells = F5010_QTY_COLS
    .map(col => `<th scope="col" style="border: ${SOLID}; padding: 5px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 10.5px; white-space: nowrap; vertical-align: middle;">${col.label}</th>`)
    .join('\n                  ');

  // ── 1) 제품 수량 5행 (검 사 / 정 품 / 리워크 D/V / 리워크 직각,둔각 / 완전불량(폐기)) ──
  const countRowsHtml = F5010_COUNT_ROWS.map((row, rowIdx) => {
    const isFirst = rowIdx === 0;
    const isLast = rowIdx === F5010_COUNT_ROWS.length - 1;
    const top = isFirst ? SOLID : DOTTED;
    const bottom = isLast ? SOLID : DOTTED;

    const groupCell = isFirst
      ? `\n                  <th scope="rowgroup" rowspan="${F5010_COUNT_ROWS.length}" style="border: ${SOLID}; padding: 4px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 10.5px; line-height: 1.25; vertical-align: middle;">제품<br>수량</th>`
      : '';

    const cells = F5010_QTY_COLS.map(col => {
      const id = countIdOf(col.key, row.key);
      const val = readCountValue(savedValues, col, row, hasF5010Keys) ?? '';
      return `<td style="border-left: ${SOLID}; border-right: ${SOLID}; border-top: ${top}; border-bottom: ${bottom}; padding: 0; background: #ffffff; vertical-align: middle;">
                    <input type="number" min="0" inputmode="numeric" id="${id}" data-form-code="5010" data-save-group="qtyTable" data-qty-role="${row.role}" data-col="${col.key}" class="form-control" style="${INPUT_STYLE}" value="${escapeAttr(val)}" />
                  </td>`;
    }).join('\n                  ');

    return `
                <tr>${groupCell}
                  <th scope="row" style="border-left: ${SOLID}; border-right: ${SOLID}; border-top: ${top}; border-bottom: ${bottom}; padding: 3px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: ${row.fontSize}; letter-spacing: -0.3px; white-space: nowrap; vertical-align: middle;">${row.label}</th>
                  ${cells}
                </tr>`;
  }).join('');

  // ── 2) 불량 3개 그룹 (압출 소재 불량 / 조인트 불량 / 후가공 불량) + 각 그룹 소계 ──
  const defectGroupsHtml = F5010_DEFECT_GROUPS.map(group => {
    const totalGroupRows = group.items.length + 1;

    const itemRowsHtml = group.items.map((item, itemIdx) => {
      const isFirst = itemIdx === 0;
      const isLastItem = itemIdx === group.items.length - 1;
      const top = isFirst ? SOLID : DOTTED;
      const bottom = isLastItem ? SOLID : DOTTED;

      const groupCell = isFirst
        ? `\n                  <th scope="rowgroup" rowspan="${totalGroupRows}" style="border: ${SOLID}; padding: 4px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 10.5px; line-height: 1.25; vertical-align: middle;">${group.groupHtml}</th>`
        : '';

      let labelContent = item.label;
      if (item.isEtc) {
        const noteId = etcNoteIdOf(group.key);
        const noteVal = savedValues[noteId] ?? '';
        labelContent = `<span style="display: inline-flex; align-items: center; justify-content: center;">기타(&nbsp;<input type="text" id="${noteId}" data-form-code="5010" data-save-group="qtyTable" data-qty-role="etc-note" class="f5010-etc-note-input" value="${escapeAttr(noteVal)}" aria-label="${group.key} 기타 사유" />&nbsp;)</span>`;
      }

      const fontSize = item.fontSize || '10.5px';

      const cells = F5010_QTY_COLS.map(col => {
        const id = defIdOf(col.key, group.key, item.key);
        const val = readDefectValue(savedValues, col, group.key, item, hasF5010Keys) ?? '';
        return `<td style="border-left: ${SOLID}; border-right: ${SOLID}; border-top: ${top}; border-bottom: ${bottom}; padding: 0; background: #ffffff; vertical-align: middle;">
                    <input type="number" min="0" inputmode="numeric" id="${id}" data-form-code="5010" data-save-group="qtyTable" data-qty-role="defect" data-def-group="${group.key}" data-col="${col.key}" class="form-control" style="${INPUT_STYLE}" value="${escapeAttr(val)}" />
                  </td>`;
      }).join('\n                  ');

      return `
                <tr>${groupCell}
                  <th scope="row" style="border-left: ${SOLID}; border-right: ${SOLID}; border-top: ${top}; border-bottom: ${bottom}; padding: 3px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: ${fontSize}; letter-spacing: -0.3px; white-space: nowrap; vertical-align: middle;">${labelContent}</th>
                  ${cells}
                </tr>`;
    }).join('');

    const subtotalCells = F5010_QTY_COLS.map(col => {
      const subKey = `${col.key}_${group.key}`;
      const gSum = groupSubtotals[subKey] || 0;
      const gHas = groupHasInput[subKey] || false;
      const text = (gSum > 0 || gHas) ? String(gSum) : '';
      return `<td id="f5010_${col.key}_${group.key}_sum" data-form-code="5010" data-qty-role="defect-subtotal" data-def-group="${group.key}" data-col="${col.key}" style="border: ${SOLID}; padding: 3px 2px; background: #ffffff; font-weight: 700; color: var(--accent-rose); font-size: 11px; height: 25px; vertical-align: middle;">${text}</td>`;
    }).join('\n                  ');

    return `${itemRowsHtml}
                <tr>
                  <th scope="row" style="border: ${SOLID}; padding: 3px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 10.5px; vertical-align: middle;">소 계</th>
                  ${subtotalCells}
                </tr>`;
  }).join('');

  // ── 3) 하단 불량 합계 행 ──
  const grandTotalCells = F5010_QTY_COLS.map(col => {
    const cSum = colTotals[col.key] || 0;
    const cHas = colHasInput[col.key] || false;
    const text = (cSum > 0 || cHas) ? String(cSum) : '';
    return `<td id="f5010_${col.key}_def_total" data-form-code="5010" data-qty-role="defect-total" data-col="${col.key}" style="border: ${SOLID}; padding: 4px 2px; background: #ffffff; font-weight: 700; color: var(--accent-rose); font-size: 11.5px; height: 26px; vertical-align: middle;">${text}</td>`;
  }).join('\n                  ');

  return `
        <div class="card f5010-qty-card" data-form-code="5010" style="padding: 14px 10px; margin-bottom: 16px;">
          <style>
            .f5010-qty-card[data-form-code="5010"] input[type="number"]::-webkit-outer-spin-button,
            .f5010-qty-card[data-form-code="5010"] input[type="number"]::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            .f5010-qty-card[data-form-code="5010"] input[type="number"] {
              -moz-appearance: textfield;
              appearance: textfield;
              min-width: 0;
              font-size: 11px !important;
            }
            .f5010-qty-card[data-form-code="5010"] .f5010-machine-no-input {
              width: 28px;
              height: 20px;
              border: none;
              border-bottom: 1px solid #64748b;
              text-align: center;
              font-size: 11px !important;
              font-weight: 700;
              color: #000;
              padding: 0 1px;
              background: transparent;
              outline: none;
              border-radius: 0;
              box-sizing: border-box;
            }
            .f5010-qty-card[data-form-code="5010"] .f5010-machine-no-input:focus {
              border-bottom: 1.5px solid #2563eb;
              background: #eff6ff;
            }
            .f5010-qty-card[data-form-code="5010"] .f5010-etc-note-input {
              width: 36px;
              height: 18px;
              border: none;
              text-align: center;
              font-size: 9.5px !important;
              font-weight: 700;
              color: #000;
              padding: 0 1px;
              background: transparent;
              outline: none;
            }
            .f5010-qty-card[data-form-code="5010"] .f5010-etc-note-input:focus {
              border-bottom: 1px solid #2563eb;
              background: #eff6ff;
            }
          </style>
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; padding: 0 4px; display: block;">
            📊 <span class="sec-num"></span> 생산실적 및 불량 현황
          </label>
          <input type="hidden" id="targetQty" value="${totalTarget}" />
          <input type="hidden" id="actualQty" value="${totalGood}" />
          <input type="hidden" id="defectQty" value="${totalDefect}" />
          <div style="width: 100%; overflow-x: hidden;">
            <table data-form-code="5010" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <colgroup>
                <col style="width: 10%;" />
                <col style="width: 22%;" />
                <col style="width: 17%;" />
                <col style="width: 17%;" />
                <col style="width: 17%;" />
                <col style="width: 17%;" />
              </colgroup>
              <thead>
                <tr>
                  <th colspan="2" rowspan="2" scope="colgroup" style="border: ${SOLID}; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 11.5px; vertical-align: middle;">구 분</th>
                  ${machineGroupHeaders}
                </tr>
                <tr>
                  ${subHeaderCells}
                </tr>
              </thead>
              <tbody>${countRowsHtml}${defectGroupsHtml}
                <tr>
                  <th scope="row" colspan="2" style="border: ${SOLID}; padding: 5px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">불량 합계</th>
                  ${grandTotalCells}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      `;
}

/**
 * qtySection 내부 요소만 스코프 조회하여 소계·불량 합계 셀 및 숨김 총계 필드를 갱신한다. (GEMINI.md 원칙 13)
 * @param {HTMLElement} qtySection #qtySection
 */
export function calcF5010QtySummary(qtySection) {
  if (!qtySection) return;

  let totalInsp = 0;
  let totalGood = 0;
  let totalDefect = 0;

  qtySection.querySelectorAll('input[data-form-code="5010"][data-qty-role="insp"]').forEach(el => {
    totalInsp += Number(el.value) || 0;
  });

  qtySection.querySelectorAll('input[data-form-code="5010"][data-qty-role="good"]').forEach(el => {
    totalGood += Number(el.value) || 0;
  });

  F5010_QTY_COLS.forEach(col => {
    const colKey = col.key;
    let colDefSum = 0;
    let colAnyInput = false;

    F5010_DEFECT_GROUPS.forEach(group => {
      let gSum = 0;
      let gHas = false;
      qtySection
        .querySelectorAll(`input[data-form-code="5010"][data-qty-role="defect"][data-def-group="${group.key}"][data-col="${colKey}"]`)
        .forEach(el => {
          if (String(el.value).trim() !== '') gHas = true;
          gSum += Number(el.value) || 0;
        });

      const subCell = qtySection.querySelector(
        `td[data-form-code="5010"][data-qty-role="defect-subtotal"][data-def-group="${group.key}"][data-col="${colKey}"]`
      );
      if (subCell) subCell.textContent = (gSum > 0 || gHas) ? String(gSum) : '';

      colDefSum += gSum;
      if (gHas) colAnyInput = true;
    });

    const totalCell = qtySection.querySelector(
      `td[data-form-code="5010"][data-qty-role="defect-total"][data-col="${colKey}"]`
    );
    if (totalCell) totalCell.textContent = (colDefSum > 0 || colAnyInput) ? String(colDefSum) : '';

    const scrapEl = qtySection.querySelector(`input[data-form-code="5010"][data-qty-role="scrap"][data-col="${colKey}"]`);
    const hasScrap = scrapEl && String(scrapEl.value).trim() !== '';
    const scrapNum = scrapEl ? (Number(scrapEl.value) || 0) : 0;

    totalDefect += (hasScrap && scrapNum > 0) ? scrapNum : colDefSum;
  });

  const totalTarget = totalInsp > 0 ? totalInsp : (totalGood + totalDefect);

  const targetInput = qtySection.querySelector('#targetQty');
  const actualInput = qtySection.querySelector('#actualQty');
  const defectInput = qtySection.querySelector('#defectQty');
  if (targetInput) targetInput.value = String(totalTarget);
  if (actualInput) actualInput.value = String(totalGood);
  if (defectInput) defectInput.value = String(totalDefect);
}

/**
 * QtySectionRenderer.js 의 `case 5010` 에서 위임 호출.
 * @param {HTMLElement} qtySection #qtySection (새로 교체된 노드)
 * @param {Object} ctx             QtySectionRenderer 컨텍스트
 */
export function renderF5010QtySection(qtySection, ctx = {}) {
  const saved = { ...(ctx.existingData?.qtyTable || {}) };
  qtySection.querySelectorAll('[data-form-code="5010"][data-save-group="qtyTable"]').forEach(el => {
    if (el.id && el.value !== '') saved[el.id] = el.value;
  });

  qtySection.innerHTML = renderF5010QtySectionHTML(saved);

  if (qtySection.dataset.f5010Bound !== '1') {
    qtySection.dataset.f5010Bound = '1';
    qtySection.addEventListener('input', () => calcF5010QtySummary(qtySection));
  }
  calcF5010QtySummary(qtySection);
}
