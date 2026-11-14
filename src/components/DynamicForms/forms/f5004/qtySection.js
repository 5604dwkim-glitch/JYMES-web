/**
 * 양식 고유 번호 #5004 (GM 9BQC / G/RUN / 조인트-FRT)
 * "8. 생산실적 및 불량 현황" 전용 렌더러 (상단 FRT LH 표 / 하단 FRT RH 표, 가로 폭 축소를 위해 2개 표로 분리)
 *
 * - 수량(Count): 계획(기본 600) / 정품(Good) / 불량(Bad) / 재조인트(Rework)
 * - 폐기불량(Disposal)-조인트작업시(Joint work): A · B · C 열 × 불량 10종
 *   (떨어짐, 양부족, 밀림, 단차, 기포, 씹힘, 오염, 삽입불량, 수축, 기타)
 * - 재조인트(Rework): C 열과 공정간불량 열 사이의 독립 세로줄 1열 × 동일 불량 10종 (폐기 불량 총계에서는 제외)
 * - 공정간불량(Process Bad) 재조인트 포함: LH(또는 RH) 1열 × 동일 불량 10종
 * - 합 계(Total): 열별 자동 합산
 * - 가로 스크롤 방지: `table-layout: fixed` + `<colgroup>` 비율 고정 + `[data-form-code="5004"]` 스코프 스타일
 * - 모든 ID/저장 키는 `f5004_` 접두사 및 명시적 `data-*` 속성 사용 (GEMINI.md 원칙 1·2·8·10·11·12·13)
 *   · 계획/정품/불량/재조인트: `f5004_FRT_{LH|RH}_{plan|good|bad|rework}`
 *   · 불량 입력칸:              `f5004_FRT_{LH|RH}_def_{불량키}_{A|B|C|P}`  (P = 공정간불량 열)
 */

import { renderF5004CleaningCardHTML, bindF5004CleaningEvents } from './cleaningSection.js';

export const F5004_QTY_SIDES = [
  { side: 'LH', title: 'FRT LH', defaultPlan: 600, marginBottom: '18px' },
  { side: 'RH', title: 'FRT RH', defaultPlan: 600, marginBottom: '0' }
];

export const F5004_COUNT_ROWS = [
  { key: 'plan', ko: '계획', en: '', role: 'plan' },
  { key: 'good', ko: '정품', en: '(Good)', role: 'good' },
  { key: 'bad', ko: '불량', en: '(Bad)', role: 'bad' },
  { key: 'rework', ko: '재조인트', en: '(Rework)', role: 'rework' }
];

export const F5004_DISPOSAL_COLS = ['A', 'B', 'C'];
export const F5004_REWORK_COL = 'R'; // 재조인트 (C 열과 공정간불량 열 사이 독립 세로줄)
export const F5004_PROCESS_COL = 'P';
export const F5004_DEFECT_COLS = [...F5004_DISPOSAL_COLS, F5004_REWORK_COL, F5004_PROCESS_COL];

export const F5004_DEFECTS = [
  { key: 'split', ko: '떨어짐', en: '(Split)' },
  { key: 'short', ko: '양부족', en: '(Short shot)' },
  { key: 'push', ko: '밀림', en: '(Push)' },
  { key: 'step', ko: '단차', en: '(Step)' },
  { key: 'bubble', ko: '기포', en: '(Bubble)' },
  { key: 'dent', ko: '씹힘', en: '(Dents)' },
  { key: 'contam', ko: '오염', en: '(Contamination)' },
  { key: 'insert', ko: '삽입불량', en: '(Bad insert)' },
  { key: 'sink', ko: '수축', en: '(Sink mark)' },
  { key: 'etc', ko: '기타', en: '(The others)' }
];

// 과거 5004 공통 표(qty_plan_FL 등)로 저장된 일보 조회 시 하위 호환용 대체 키 (GEMINI.md 원칙 11)
const LEGACY_KEY_MAP = {
  LH: { plan: 'plan_FL', good: 'act_FL' },
  RH: { plan: 'plan_FR', good: 'act_FR' }
};

const SOLID = '1px solid #000';
const DOTTED = '1px dotted #000';

const HEAD_TH_STYLE = 'border: 1px solid #000; padding: 4px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 10.5px; line-height: 1.2; letter-spacing: -0.3px; vertical-align: middle;';
const INPUT_STYLE = 'width: 100%; min-width: 0; height: 26px; border: none; text-align: center; font-size: 11px; font-weight: 700; color: #000; padding: 1px 0; background: transparent; outline: none; border-radius: 0; box-sizing: border-box;';

function twoLine(ko, en) {
  if (!en) return ko;
  return `${ko}<br><span style="font-size: 8.5px; font-weight: 600; letter-spacing: -0.3px;">${en}</span>`;
}

function escapeAttr(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function idOf(side, key) {
  return `f5004_FRT_${side}_${key}`;
}

function defId(side, defKey, col) {
  return `f5004_FRT_${side}_def_${defKey}_${col}`;
}

function pick(savedValues, ...keys) {
  for (const k of keys) {
    if (k && savedValues[k] !== undefined) return savedValues[k];
  }
  return undefined;
}

/**
 * 저장값 맵에서 계획·정품·불량 합계를 산출한다.
 * - 불량 합계(defectQty): `불량(Bad)` 입력칸에 값이 있으면 그 합, 없으면 불량 표 전체 합을 사용
 * @param {Object} savedValues (id -> value)
 */
export function computeF5004Totals(savedValues = {}) {
  let totalPlan = 0;
  let totalGood = 0;
  let totalDefect = 0;
  const colSums = {};
  const colHasInput = {};

  F5004_QTY_SIDES.forEach(({ side, defaultPlan }) => {
    const legacy = LEGACY_KEY_MAP[side] || {};
    const rawPlan = pick(savedValues, idOf(side, 'plan'), legacy.plan);
    totalPlan += Number(rawPlan !== undefined ? rawPlan : defaultPlan) || 0;
    totalGood += Number(pick(savedValues, idOf(side, 'good'), legacy.good)) || 0;

    const rawBad = savedValues[idOf(side, 'bad')];
    const sideHasBad = rawBad !== undefined && String(rawBad).trim() !== '';
    const sideBadNum = Number(rawBad) || 0;

    let sideTableDefect = 0;
    F5004_DEFECT_COLS.forEach(col => {
      const colKey = `${side}_${col}`;
      let sum = 0;
      let has = false;
      F5004_DEFECTS.forEach(def => {
        const raw = savedValues[defId(side, def.key, col)];
        if (raw !== undefined && String(raw).trim() !== '') has = true;
        sum += Number(raw) || 0;
      });
      colSums[colKey] = sum;
      colHasInput[colKey] = has;
      if (col !== F5004_REWORK_COL) sideTableDefect += sum; // 재조인트 열은 폐기 불량 총계에서 제외
    });

    totalDefect += (sideHasBad && sideBadNum > 0) ? sideBadNum : sideTableDefect;
  });

  return {
    totalPlan,
    totalGood,
    totalDefect,
    colSums,
    colHasInput
  };
}

function renderSideTable(sideCfg, savedValues, colSums, colHasInput) {
  const { side, title, defaultPlan, marginBottom } = sideCfg;
  const legacy = LEGACY_KEY_MAP[side] || {};

  // ── 1) 수량(Count) 영역 ──
  const countRowsHtml = F5004_COUNT_ROWS.map((row, rowIdx) => {
    const id = idOf(side, row.key);
    let val = pick(savedValues, id, legacy[row.key]);
    if (val === undefined) val = row.key === 'plan' ? String(defaultPlan) : '';

    const isFirst = rowIdx === 0;
    const isLast = rowIdx === F5004_COUNT_ROWS.length - 1;
    const top = isFirst ? SOLID : DOTTED;
    const bottom = isLast ? SOLID : DOTTED;

    const groupCell = isFirst
      ? `\n                  <th scope="rowgroup" rowspan="${F5004_COUNT_ROWS.length}" style="border: 1px solid #000; padding: 4px 1px; background: #ffffff; font-weight: 700; color: #000; font-size: 10px; line-height: 1.2; letter-spacing: -0.3px; vertical-align: middle;">${twoLine('수량', '(Count)')}</th>`
      : '';

    return `
                <tr>${groupCell}
                  <th scope="row" style="border-left: ${SOLID}; border-right: ${SOLID}; border-top: ${top}; border-bottom: ${bottom}; padding: 2px 1px; background: #ffffff; font-weight: 700; color: #000; font-size: 10px; line-height: 1.15; letter-spacing: -0.3px; vertical-align: middle;">${twoLine(row.ko, row.en)}</th>
                  <td colspan="${F5004_DEFECT_COLS.length}" style="border-left: ${SOLID}; border-right: ${SOLID}; border-top: ${top}; border-bottom: ${bottom}; padding: 0; background: #ffffff; vertical-align: middle;">
                    <input type="number" min="0" inputmode="numeric" id="${id}" data-form-code="5004" data-save-group="qtyTable" data-qty-role="${row.role}" class="form-control" style="${INPUT_STYLE}" value="${escapeAttr(val)}" />
                  </td>
                </tr>`;
  }).join('');

  // ── 2) 불량 영역 ──
  const defectRowsHtml = F5004_DEFECTS.map((def, rowIdx) => {
    const top = rowIdx === 0 ? SOLID : DOTTED;
    const bottom = DOTTED;

    const cells = F5004_DEFECT_COLS.map(col => {
      const inDisposal = F5004_DISPOSAL_COLS.includes(col);
      const isFirstOfGroup = !inDisposal || col === F5004_DISPOSAL_COLS[0];
      const isLastOfGroup = !inDisposal || col === F5004_DISPOSAL_COLS[F5004_DISPOSAL_COLS.length - 1];
      const left = isFirstOfGroup ? SOLID : DOTTED;
      const right = isLastOfGroup ? SOLID : DOTTED;
      const id = defId(side, def.key, col);
      const val = savedValues[id] ?? '';
      return `<td style="border-left: ${left}; border-right: ${right}; border-top: ${top}; border-bottom: ${bottom}; padding: 0; background: #ffffff; vertical-align: middle;">
                    <input type="number" min="0" inputmode="numeric" id="${id}" data-form-code="5004" data-save-group="qtyTable" data-qty-role="defect" data-sec="${side}_${col}" class="form-control" style="${INPUT_STYLE}" value="${escapeAttr(val)}" />
                  </td>`;
    }).join('\n                  ');

    return `
                <tr>
                  <th scope="row" colspan="2" style="border-left: ${SOLID}; border-right: ${SOLID}; border-top: ${top}; border-bottom: ${bottom}; padding: 2px 1px; background: #ffffff; font-weight: 700; color: #000; font-size: 10px; line-height: 1.15; letter-spacing: -0.3px; word-break: keep-all; vertical-align: middle;">${twoLine(def.ko, def.en)}</th>
                  ${cells}
                </tr>`;
  }).join('');

  const totalCells = F5004_DEFECT_COLS.map(col => {
    const colKey = `${side}_${col}`;
    const inDisposal = F5004_DISPOSAL_COLS.includes(col);
    const isFirstOfGroup = !inDisposal || col === F5004_DISPOSAL_COLS[0];
    const isLastOfGroup = !inDisposal || col === F5004_DISPOSAL_COLS[F5004_DISPOSAL_COLS.length - 1];
    const left = isFirstOfGroup ? SOLID : DOTTED;
    const right = isLastOfGroup ? SOLID : DOTTED;
    const sumText = (colSums[colKey] > 0 || colHasInput[colKey]) ? String(colSums[colKey]) : '';
    return `<td id="f5004_FRT_${side}_def_sum_${col}" data-form-code="5004" data-qty-role="defect-sum" data-sec="${colKey}" style="border-left: ${left}; border-right: ${right}; border-top: ${SOLID}; border-bottom: ${SOLID}; padding: 4px 1px; background: #ffffff; font-weight: 700; color: var(--accent-rose); font-size: 11px; height: 26px; vertical-align: middle;">${sumText}</td>`;
  }).join('\n                  ');

  const wrapMb = marginBottom && marginBottom !== '0' ? ` margin-bottom: ${marginBottom};` : '';

  return `
            <div style="width: 100%; overflow-x: hidden;${wrapMb}">
              <table data-form-code="5004" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <colgroup>
                  <col style="width: 13%;" />
                  <col style="width: 17%;" />
                  <col style="width: 12%;" />
                  <col style="width: 12%;" />
                  <col style="width: 12%;" />
                  <col style="width: 14%;" />
                  <col style="width: 20%;" />
                </colgroup>
                <thead>
                  <tr>
                    <th colspan="2" style="${HEAD_TH_STYLE} font-size: 11px;">구분</th>
                    <th colspan="${F5004_DEFECT_COLS.length}" style="${HEAD_TH_STYLE} font-size: 11.5px;">${title}</th>
                  </tr>
                </thead>
                <tbody>${countRowsHtml}
                  <tr>
                    <th colspan="2" rowspan="2" style="${HEAD_TH_STYLE} border-top: 2px solid #000;">${twoLine('구 분', '(Division)')}</th>
                    <th colspan="3" style="${HEAD_TH_STYLE} border-top: 2px solid #000; font-size: 9.5px;">폐기불량(Disposal)-<br>조인트작업시(Joint work)</th>
                    <th rowspan="2" style="${HEAD_TH_STYLE} border-top: 2px solid #000; font-size: 9.5px; letter-spacing: -0.4px;">${twoLine('재조인트', '(Rework)')}</th>
                    <th style="${HEAD_TH_STYLE} border-top: 2px solid #000; font-size: 9px; letter-spacing: -0.4px;">공정간불량<br>(Process Bad)<br>재조인트 포함</th>
                  </tr>
                  <tr>
                    <th style="${HEAD_TH_STYLE} padding: 3px 1px;">A</th>
                    <th style="${HEAD_TH_STYLE} padding: 3px 1px;">B</th>
                    <th style="${HEAD_TH_STYLE} padding: 3px 1px;">C</th>
                    <th style="${HEAD_TH_STYLE} padding: 3px 1px;">${side}</th>
                  </tr>${defectRowsHtml}
                  <tr>
                    <th scope="row" colspan="2" style="${HEAD_TH_STYLE} border-top: ${SOLID};">${twoLine('합 계', '(Total)')}</th>
                    ${totalCells}
                  </tr>
                </tbody>
              </table>
            </div>`;
}

/**
 * @param {Object} savedValues 저장/현재 입력값 맵 (id -> value)
 * @returns {string} 카드 전체 HTML
 */
export function renderF5004QtySectionHTML(savedValues = {}) {
  const { totalPlan, totalGood, totalDefect, colSums, colHasInput } = computeF5004Totals(savedValues);
  const blocksHtml = F5004_QTY_SIDES
    .map(cfg => renderSideTable(cfg, savedValues, colSums, colHasInput))
    .join('\n');

  return `
        <div class="card f5004-qty-card" data-form-code="5004" style="padding: 12px 6px; margin-bottom: 16px;">
          <style>
            .f5004-qty-card[data-form-code="5004"] input[type="number"]::-webkit-outer-spin-button,
            .f5004-qty-card[data-form-code="5004"] input[type="number"]::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            .f5004-qty-card[data-form-code="5004"] input[type="number"] {
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
          <input type="hidden" id="actualQty" value="${totalGood}" />
          <input type="hidden" id="defectQty" value="${totalDefect}" />${blocksHtml}
        </div>
      `;
}

/**
 * qtySection 내부 요소만 스코프 조회하여 열별 합계 및 숨김 총계 필드를 갱신한다. (GEMINI.md 원칙 13)
 * @param {HTMLElement} qtySection #qtySection
 */
export function calcF5004QtySummary(qtySection) {
  if (!qtySection) return;

  let totalPlan = 0;
  let totalGood = 0;
  let totalDefect = 0;

  qtySection.querySelectorAll('input[data-form-code="5004"][data-qty-role="plan"]').forEach(el => {
    totalPlan += Number(el.value) || 0;
  });
  qtySection.querySelectorAll('input[data-form-code="5004"][data-qty-role="good"]').forEach(el => {
    totalGood += Number(el.value) || 0;
  });

  F5004_QTY_SIDES.forEach(({ side }) => {
    const badEl = qtySection.querySelector(`#${idOf(side, 'bad')}`);
    const sideHasBad = Boolean(badEl && String(badEl.value).trim() !== '');
    const sideBadNum = Number(badEl?.value) || 0;

    let sideTableDefect = 0;
    F5004_DEFECT_COLS.forEach(col => {
      const colKey = `${side}_${col}`;
      let sum = 0;
      let has = false;
      qtySection.querySelectorAll(`input[data-form-code="5004"][data-qty-role="defect"][data-sec="${colKey}"]`).forEach(el => {
        if (String(el.value).trim() !== '') has = true;
        sum += Number(el.value) || 0;
      });
      const sumCell = qtySection.querySelector(`td[data-form-code="5004"][data-qty-role="defect-sum"][data-sec="${colKey}"]`);
      if (sumCell) sumCell.textContent = (sum > 0 || has) ? String(sum) : '';
      if (col !== F5004_REWORK_COL) sideTableDefect += sum; // 재조인트 열은 폐기 불량 총계에서 제외
    });

    totalDefect += (sideHasBad && sideBadNum > 0) ? sideBadNum : sideTableDefect;
  });

  const targetInput = qtySection.querySelector('#targetQty');
  const actualInput = qtySection.querySelector('#actualQty');
  const defectInput = qtySection.querySelector('#defectQty');
  if (targetInput) targetInput.value = String(totalPlan);
  if (actualInput) actualInput.value = String(totalGood);
  if (defectInput) defectInput.value = String(totalDefect);
}

/**
 * QtySectionRenderer.js 의 `case 5004` 에서 위임 호출.
 * @param {HTMLElement} qtySection #qtySection (새로 교체된 노드)
 * @param {Object} ctx             QtySectionRenderer 컨텍스트
 */
export function renderF5004QtySection(qtySection, ctx = {}) {
  const saved = { ...(ctx.existingData?.qtyTable || {}) };
  qtySection.querySelectorAll('[data-form-code="5004"][data-save-group="qtyTable"]').forEach(el => {
    if (el.id && el.value !== '') saved[el.id] = el.value;
  });

  qtySection.innerHTML = renderF5004QtySectionHTML(saved) + renderF5004CleaningCardHTML(saved);
  bindF5004CleaningEvents(qtySection, ctx);

  if (qtySection.dataset.f5004Bound !== '1') {
    qtySection.dataset.f5004Bound = '1';
    qtySection.addEventListener('input', () => calcF5004QtySummary(qtySection));
  }
  calcF5004QtySummary(qtySection);
}
