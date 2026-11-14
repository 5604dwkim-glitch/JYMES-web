/**
 * 양식 고유 번호 #5006 (GM 9BQC / G/RUN / 조인트-RR Fixed)
 * "8. 생산실적 및 불량 현황" 전용 렌더러
 *
 * - 동일 방향(RR LH 또는 RR RH) 설비 2대 실적을 입력할 수 있도록 동일한 표 2개(u1, u2)를 상·하 배치
 * - 각 표 상단 헤더: `구분` | `RR LH` (또는 `RR RH`, 4번 섹션 선택값 자동 연동) | `(  [입력칸]  ) 호기` (동일 방향 호기 직접 구분 입력)
 * - 수량(Count): 계획(기본 각 600) / 정품(Good) / 불량(Bad) / 재조인트(Rework)
 * - 폐기불량(Disposal)-조인트작업시(Joint work): A · B · D 열 × 불량 13종
 *   (떨어짐, D/V 떨어짐, 양부족, 밀림, 단차, 기포, 씹힘, 오염, 글라스 파손, 삽입불량, 수축, 단컷팅불량, 기타)
 * - 재조인트(Rework): D 열과 공정간불량 열 사이의 독립 세로줄 1열 × 동일 불량 13종 (폐기 불량 총계에서는 제외)
 * - 공정간불량(Process Bad) 재조인트 포함: 선택된 방향(LH 또는 RH) 1열 × 동일 불량 13종
 * - 합 계(Total): 각 표 열별 자동 합산
 * - 가로 스크롤 방지: `table-layout: fixed` + `<colgroup>` 비율 고정 + `[data-form-code="5006"]` 스코프 스타일
 * - 모든 ID/저장 키는 `f5006_` 접두사 및 명시적 `data-*` 속성 사용 (GEMINI.md 원칙 1·2·8·10·11·12·13)
 *   · 호기 번호 입력칸:          `f5006_RR_{u1|u2}_machine_no`
 *   · 계획/정품/불량/재조인트:   `f5006_RR_{u1|u2}_{plan|good|bad|rework}`
 *   · 불량 입력칸:              `f5006_RR_{u1|u2}_def_{불량키}_{A|B|D|R|P}`  (P = 공정간불량 열)
 */

import { renderF5006CleaningCardHTML, bindF5006CleaningEvents } from './cleaningSection.js';
import { resolveF5006Equip } from './equipConfig.js';
import { syncF5006DowntimeEquips } from './downtimeSection.js';

export const F5006_QTY_UNITS = [
  { unit: 'u1', idx: 1, legacySide: 'LH', defaultPlan: 600, marginBottom: '18px' },
  { unit: 'u2', idx: 2, legacySide: 'RH', defaultPlan: 600, marginBottom: '0' }
];

export const F5006_COUNT_ROWS = [
  { key: 'plan', ko: '계획', en: '', role: 'plan' },
  { key: 'good', ko: '정품', en: '(Good)', role: 'good' },
  { key: 'bad', ko: '불량', en: '(Bad)', role: 'bad' },
  { key: 'rework', ko: '재조인트', en: '(Rework)', role: 'rework' }
];

export const F5006_DISPOSAL_COLS = ['A', 'B', 'D'];
export const F5006_REWORK_COL = 'R'; // 재조인트 (D 열과 공정간불량 열 사이 독립 세로줄)
export const F5006_PROCESS_COL = 'P';
export const F5006_DEFECT_COLS = [...F5006_DISPOSAL_COLS, F5006_REWORK_COL, F5006_PROCESS_COL];

export const F5006_DEFECTS = [
  { key: 'split', ko: '떨어짐', en: '(Split)' },
  { key: 'dv_split', ko: 'D/V 떨어짐', en: '(split)' },
  { key: 'short', ko: '양부족', en: '(Short shot)' },
  { key: 'push', ko: '밀림', en: '(Push)' },
  { key: 'step', ko: '단차', en: '(Step)' },
  { key: 'bubble', ko: '기포', en: '(Bubble)' },
  { key: 'dent', ko: '씹힘', en: '(Dents)' },
  { key: 'contam', ko: '오염', en: '(Contamination)' },
  { key: 'glass_break', ko: '글라스 파손', en: '' },
  { key: 'insert', ko: '삽입불량', en: '(Bad insert)' },
  { key: 'sink', ko: '수축', en: '(Sink mark)' },
  { key: 'cut_ng', ko: '단컷팅불량', en: '(cutting bull)' },
  { key: 'etc', ko: '기타', en: '(The others)' }
];

// 과거 5006 양식으로 저장된 일보 조회 시 하위 호환용 대체 키 (GEMINI.md 원칙 11)
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

function unitIdOf(unit, key) {
  return `f5006_RR_${unit}_${key}`;
}

function unitMachineIdOf(unit) {
  return `f5006_RR_${unit}_machine_no`;
}

function unitDefId(unit, defKey, col) {
  return `f5006_RR_${unit}_def_${defKey}_${col}`;
}

function pick(savedValues, ...keys) {
  for (const k of keys) {
    if (k && savedValues[k] !== undefined) return savedValues[k];
  }
  return undefined;
}

function readCountValue(savedValues, unitCfg, key, hasUnitKeys) {
  const { unit, legacySide } = unitCfg;
  if (hasUnitKeys) return savedValues[unitIdOf(unit, key)];

  const legacy = LEGACY_KEY_MAP[legacySide] || {};
  const singleFallback = unit === 'u1' ? `f5006_RR_${key}` : undefined;
  return pick(
    savedValues,
    unitIdOf(unit, key),
    singleFallback,
    `f5006_RR_${legacySide}_${key}`,
    `f5006_FRT_${legacySide}_${key}`,
    legacy[key]
  );
}

function readDefectValue(savedValues, unitCfg, defKey, col, hasUnitKeys) {
  const { unit, legacySide } = unitCfg;
  if (hasUnitKeys) return savedValues[unitDefId(unit, defKey, col)];

  const singleFallback = unit === 'u1' ? `f5006_RR_def_${defKey}_${col}` : undefined;
  return pick(
    savedValues,
    unitDefId(unit, defKey, col),
    singleFallback,
    `f5006_RR_${legacySide}_def_${defKey}_${col}`,
    `f5006_FRT_${legacySide}_def_${defKey}_${col}`
  );
}

/**
 * 저장값 맵에서 2개 표 합산 계획·정품·불량 합계를 산출한다.
 * - 표별로 `불량(Bad)` 입력칸에 값이 있으면 그 값을, 없으면 해당 표의 불량 열 합(재조인트 R 열 제외)을 합산
 * @param {Object} savedValues (id -> value)
 */
export function computeF5006Totals(savedValues = {}) {
  const hasUnitKeys = Object.keys(savedValues).some(
    k => k.startsWith('f5006_RR_u1_') || k.startsWith('f5006_RR_u2_')
  );

  let totalPlan = 0;
  let totalGood = 0;
  let totalDefect = 0;
  const colSums = {};
  const colHasInput = {};

  F5006_QTY_UNITS.forEach(unitCfg => {
    const { unit, defaultPlan } = unitCfg;

    const rawPlan = readCountValue(savedValues, unitCfg, 'plan', hasUnitKeys);
    totalPlan += Number(rawPlan !== undefined ? rawPlan : defaultPlan) || 0;

    const rawGood = readCountValue(savedValues, unitCfg, 'good', hasUnitKeys);
    totalGood += Number(rawGood) || 0;

    const rawBad = readCountValue(savedValues, unitCfg, 'bad', hasUnitKeys);
    const unitHasBadInput = rawBad !== undefined && String(rawBad).trim() !== '';
    const unitBadInput = Number(rawBad) || 0;

    let unitTableDefect = 0;
    F5006_DEFECT_COLS.forEach(col => {
      const colKey = `${unit}_${col}`;
      let sum = 0;
      let has = false;
      F5006_DEFECTS.forEach(def => {
        const raw = readDefectValue(savedValues, unitCfg, def.key, col, hasUnitKeys);
        if (raw !== undefined && String(raw).trim() !== '') has = true;
        sum += Number(raw) || 0;
      });
      colSums[colKey] = sum;
      colHasInput[colKey] = has;
      if (col !== F5006_REWORK_COL) unitTableDefect += sum; // 재조인트 열은 폐기 불량 총계에서 제외
    });

    totalDefect += (unitHasBadInput && unitBadInput > 0) ? unitBadInput : unitTableDefect;
  });

  return {
    totalPlan,
    totalGood,
    totalDefect,
    colSums,
    colHasInput
  };
}

function renderUnitQtyTable(unitCfg, equip, savedValues, colSums, colHasInput, hasUnitKeys) {
  const { unit, idx, defaultPlan, marginBottom } = unitCfg;
  const side = equip.side;
  const machineNoId = unitMachineIdOf(unit);
  const machineNoVal = savedValues[machineNoId] ?? '';

  // ── 1) 수량(Count) 영역 ──
  const countRowsHtml = F5006_COUNT_ROWS.map((row, rowIdx) => {
    const id = unitIdOf(unit, row.key);
    let val = readCountValue(savedValues, unitCfg, row.key, hasUnitKeys);
    if (val === undefined) val = row.key === 'plan' ? String(defaultPlan) : '';

    const isFirst = rowIdx === 0;
    const isLast = rowIdx === F5006_COUNT_ROWS.length - 1;
    const top = isFirst ? SOLID : DOTTED;
    const bottom = isLast ? SOLID : DOTTED;

    const groupCell = isFirst
      ? `\n                  <th scope="rowgroup" rowspan="${F5006_COUNT_ROWS.length}" style="border: 1px solid #000; padding: 4px 1px; background: #ffffff; font-weight: 700; color: #000; font-size: 10px; line-height: 1.2; letter-spacing: -0.3px; vertical-align: middle;">${twoLine('수량', '(Count)')}</th>`
      : '';

    return `
                <tr>${groupCell}
                  <th scope="row" style="border-left: ${SOLID}; border-right: ${SOLID}; border-top: ${top}; border-bottom: ${bottom}; padding: 2px 1px; background: #ffffff; font-weight: 700; color: #000; font-size: 10px; line-height: 1.15; letter-spacing: -0.3px; vertical-align: middle;">${twoLine(row.ko, row.en)}</th>
                  <td colspan="${F5006_DEFECT_COLS.length}" style="border-left: ${SOLID}; border-right: ${SOLID}; border-top: ${top}; border-bottom: ${bottom}; padding: 0; background: #ffffff; vertical-align: middle;">
                    <input type="number" min="0" inputmode="numeric" id="${id}" data-form-code="5006" data-save-group="qtyTable" data-qty-role="${row.role}" data-f5006-unit="${unit}" class="form-control" style="${INPUT_STYLE}" value="${escapeAttr(val)}" />
                  </td>
                </tr>`;
  }).join('');

  // ── 2) 불량 영역 ──
  const defectRowsHtml = F5006_DEFECTS.map((def, rowIdx) => {
    const top = rowIdx === 0 ? SOLID : DOTTED;
    const bottom = DOTTED;

    const cells = F5006_DEFECT_COLS.map(col => {
      const colKey = `${unit}_${col}`;
      const inDisposal = F5006_DISPOSAL_COLS.includes(col);
      const isFirstOfGroup = !inDisposal || col === F5006_DISPOSAL_COLS[0];
      const isLastOfGroup = !inDisposal || col === F5006_DISPOSAL_COLS[F5006_DISPOSAL_COLS.length - 1];
      const left = isFirstOfGroup ? SOLID : DOTTED;
      const right = isLastOfGroup ? SOLID : DOTTED;
      const id = unitDefId(unit, def.key, col);
      const val = readDefectValue(savedValues, unitCfg, def.key, col, hasUnitKeys) ?? '';
      return `<td style="border-left: ${left}; border-right: ${right}; border-top: ${top}; border-bottom: ${bottom}; padding: 0; background: #ffffff; vertical-align: middle;">
                    <input type="number" min="0" inputmode="numeric" id="${id}" data-form-code="5006" data-save-group="qtyTable" data-qty-role="defect" data-f5006-unit="${unit}" data-sec="${colKey}" class="form-control" style="${INPUT_STYLE}" value="${escapeAttr(val)}" />
                  </td>`;
    }).join('\n                  ');

    return `
                <tr>
                  <th scope="row" colspan="2" style="border-left: ${SOLID}; border-right: ${SOLID}; border-top: ${top}; border-bottom: ${bottom}; padding: 2px 1px; background: #ffffff; font-weight: 700; color: #000; font-size: 10px; line-height: 1.15; letter-spacing: -0.3px; word-break: keep-all; vertical-align: middle;">${twoLine(def.ko, def.en)}</th>
                  ${cells}
                </tr>`;
  }).join('');

  const totalCells = F5006_DEFECT_COLS.map(col => {
    const colKey = `${unit}_${col}`;
    const inDisposal = F5006_DISPOSAL_COLS.includes(col);
    const isFirstOfGroup = !inDisposal || col === F5006_DISPOSAL_COLS[0];
    const isLastOfGroup = !inDisposal || col === F5006_DISPOSAL_COLS[F5006_DISPOSAL_COLS.length - 1];
    const left = isFirstOfGroup ? SOLID : DOTTED;
    const right = isLastOfGroup ? SOLID : DOTTED;
    const sumText = (colSums[colKey] > 0 || colHasInput[colKey]) ? String(colSums[colKey]) : '';
    return `<td id="f5006_RR_${unit}_def_sum_${col}" data-form-code="5006" data-qty-role="defect-sum" data-sec="${colKey}" style="border-left: ${left}; border-right: ${right}; border-top: ${SOLID}; border-bottom: ${SOLID}; padding: 4px 1px; background: #ffffff; font-weight: 700; color: var(--accent-rose); font-size: 11px; height: 26px; vertical-align: middle;">${sumText}</td>`;
  }).join('\n                  ');

  const disposalSubHeadersHtml = F5006_DISPOSAL_COLS
    .map(col => `<th style="${HEAD_TH_STYLE} padding: 3px 1px;">${col}</th>`)
    .join('\n                    ');

  const wrapMb = marginBottom && marginBottom !== '0' ? ` margin-bottom: ${marginBottom};` : '';

  return `
            <div style="width: 100%; overflow-x: hidden;${wrapMb}">
              <table data-form-code="5006" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
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
                    <th colspan="${F5006_DISPOSAL_COLS.length}" data-form-code="5006" data-f5006-equip-label="1" style="${HEAD_TH_STYLE} font-size: 11.5px;">${equip.label}</th>
                    <th colspan="2" style="${HEAD_TH_STYLE} font-size: 11px; padding: 3px 4px; white-space: nowrap;">
                      <span style="display: inline-flex; align-items: center; justify-content: center; gap: 2px;">
                        <span>(</span>
                        <input type="text" inputmode="numeric" id="${machineNoId}" data-form-code="5006" data-save-group="qtyTable" data-wheel-skip="1" class="form-control f5006-machine-no-input" value="${escapeAttr(machineNoVal)}" aria-label="${idx}번째 표 호기 번호" />
                        <span>) 호기</span>
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>${countRowsHtml}
                  <tr>
                    <th colspan="2" rowspan="2" style="${HEAD_TH_STYLE} border-top: 2px solid #000;">${twoLine('구 분', '(Division)')}</th>
                    <th colspan="${F5006_DISPOSAL_COLS.length}" style="${HEAD_TH_STYLE} border-top: 2px solid #000; font-size: 9.5px;">폐기불량(Disposal)-<br>조인트작업시(Joint work)</th>
                    <th rowspan="2" style="${HEAD_TH_STYLE} border-top: 2px solid #000; font-size: 9.5px; letter-spacing: -0.4px;">${twoLine('재조인트', '(Rework)')}</th>
                    <th style="${HEAD_TH_STYLE} border-top: 2px solid #000; font-size: 9px; letter-spacing: -0.4px;">공정간불량<br>(Process Bad)<br>재조인트 포함</th>
                  </tr>
                  <tr>
                    ${disposalSubHeadersHtml}
                    <th data-form-code="5006" data-f5006-side-label="1" style="${HEAD_TH_STYLE} padding: 3px 1px;">${side}</th>
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
 * @param {Object} [equipInfo] 선택된 방향 메타 객체
 * @returns {string} 카드 전체 HTML
 */
export function renderF5006QtySectionHTML(savedValues = {}, equipInfo = null) {
  const equip = equipInfo || resolveF5006Equip(null, null, savedValues);
  const hasUnitKeys = Object.keys(savedValues).some(
    k => k.startsWith('f5006_RR_u1_') || k.startsWith('f5006_RR_u2_')
  );
  const { totalPlan, totalGood, totalDefect, colSums, colHasInput } = computeF5006Totals(savedValues);
  const blocksHtml = F5006_QTY_UNITS
    .map(unitCfg => renderUnitQtyTable(unitCfg, equip, savedValues, colSums, colHasInput, hasUnitKeys))
    .join('\n');

  return `
        <div class="card f5006-qty-card" data-form-code="5006" style="padding: 12px 6px; margin-bottom: 16px;">
          <style>
            .f5006-qty-card[data-form-code="5006"] input[type="number"]::-webkit-outer-spin-button,
            .f5006-qty-card[data-form-code="5006"] input[type="number"]::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            .f5006-qty-card[data-form-code="5006"] input[type="number"] {
              -moz-appearance: textfield;
              appearance: textfield;
              min-width: 0;
              font-size: 11px !important;
              box-sizing: border-box;
            }
            .f5006-qty-card[data-form-code="5006"] input.f5006-machine-no-input {
              width: 38px;
              min-width: 0;
              height: 22px;
              border: 1px solid #94a3b8;
              border-radius: 4px;
              text-align: center;
              font-size: 11.5px !important;
              font-weight: 800;
              color: #0f172a;
              padding: 0 2px;
              background: #f8fafc;
              outline: none;
              box-sizing: border-box;
            }
            .f5006-qty-card[data-form-code="5006"] input.f5006-machine-no-input:focus {
              border-color: #2563eb;
              background: #ffffff;
              box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
            }
          </style>
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; padding: 0 4px; display: block;">
            📊 <span class="sec-num"></span> 생산실적 및 불량 현황
          </label>
          <input type="hidden" id="f5006_equip_qty" data-form-code="5006" data-save-group="qtyTable" value="${escapeAttr(equip.key)}" />
          <input type="hidden" id="targetQty" value="${totalPlan}" />
          <input type="hidden" id="actualQty" value="${totalGood}" />
          <input type="hidden" id="defectQty" value="${totalDefect}" />${blocksHtml}
        </div>
      `;
}

/**
 * qtySection 내부 요소만 스코프 조회하여 2개 표 열별 합계 및 숨김 총계 필드를 갱신한다. (GEMINI.md 원칙 13)
 * @param {HTMLElement} qtySection #qtySection
 */
export function calcF5006QtySummary(qtySection) {
  if (!qtySection) return;

  let totalPlan = 0;
  let totalGood = 0;
  let totalDefect = 0;

  qtySection.querySelectorAll('input[data-form-code="5006"][data-qty-role="plan"]').forEach(el => {
    totalPlan += Number(el.value) || 0;
  });
  qtySection.querySelectorAll('input[data-form-code="5006"][data-qty-role="good"]').forEach(el => {
    totalGood += Number(el.value) || 0;
  });

  F5006_QTY_UNITS.forEach(({ unit }) => {
    const badInputEl = qtySection.querySelector(`input[data-form-code="5006"][data-qty-role="bad"][data-f5006-unit="${unit}"]`);
    const unitHasBadInput = Boolean(badInputEl && String(badInputEl.value).trim() !== '');
    const unitBadInput = Number(badInputEl?.value) || 0;

    let unitTableDefect = 0;
    F5006_DEFECT_COLS.forEach(col => {
      const colKey = `${unit}_${col}`;
      let sum = 0;
      let has = false;
      qtySection.querySelectorAll(`input[data-form-code="5006"][data-qty-role="defect"][data-sec="${colKey}"]`).forEach(el => {
        if (String(el.value).trim() !== '') has = true;
        sum += Number(el.value) || 0;
      });
      const sumCell = qtySection.querySelector(`td[data-form-code="5006"][data-qty-role="defect-sum"][data-sec="${colKey}"]`);
      if (sumCell) sumCell.textContent = (sum > 0 || has) ? String(sum) : '';
      if (col !== F5006_REWORK_COL) unitTableDefect += sum; // 재조인트 열은 폐기 불량 총계에서 제외
    });

    totalDefect += (unitHasBadInput && unitBadInput > 0) ? unitBadInput : unitTableDefect;
  });

  const targetInput = qtySection.querySelector('#targetQty');
  const actualInput = qtySection.querySelector('#actualQty');
  const defectInput = qtySection.querySelector('#defectQty');
  if (targetInput) targetInput.value = String(totalPlan);
  if (actualInput) actualInput.value = String(totalGood);
  if (defectInput) defectInput.value = String(totalDefect);
}

/**
 * QtySectionRenderer.js 의 `case 5006` 에서 위임 호출.
 * @param {HTMLElement} qtySection #qtySection (새로 교체된 노드)
 * @param {Object} ctx             QtySectionRenderer 컨텍스트
 */
export function renderF5006QtySection(qtySection, ctx = {}) {
  const saved = { ...(ctx.existingData?.qtyTable || {}) };
  qtySection.querySelectorAll('[data-form-code="5006"][data-save-group="qtyTable"]').forEach(el => {
    if (el.id && el.value !== '') saved[el.id] = el.value;
  });

  const equip = resolveF5006Equip(ctx.existingData, ctx.container || qtySection, saved);
  qtySection.innerHTML = renderF5006QtySectionHTML(saved, equip) + renderF5006CleaningCardHTML(saved);
  bindF5006CleaningEvents(qtySection, ctx);

  if (qtySection.dataset.f5006Bound !== '1') {
    qtySection.dataset.f5006Bound = '1';
    qtySection.addEventListener('input', (e) => {
      calcF5006QtySummary(qtySection);
      if (e?.target?.matches?.('input.f5006-machine-no-input[data-form-code="5006"]')) {
        const rootScope = ctx?.container || qtySection.closest('form') || qtySection.parentElement;
        syncF5006DowntimeEquips(rootScope);
      }
    });
  }
  calcF5006QtySummary(qtySection);
  syncF5006DowntimeEquips(ctx?.container || qtySection.closest('form') || qtySection.parentElement, ctx?.existingData);
}
