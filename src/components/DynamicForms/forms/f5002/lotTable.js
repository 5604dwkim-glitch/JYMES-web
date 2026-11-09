/**
 * 양식 고유 번호 #5002 (GM 9BQC / G/RUN / 소재준비-정치절단)
 * "4. 소재 LOT 번호 입력" 표 템플릿
 *
 * - 상단 표 (FRT): 구분 (FRT) | 세로줄 A, B, C | 가로줄 초물 · 장착확인 · 중물 · 장착확인 · 종물
 * - 하단 표 (RR):  구분 (RR)  | 세로줄 A, B    | 가로줄 초물 · 장착확인 · 중물 · 장착확인 · 종물
 * - 입력칸·체크박스 id 는 모두 `f5002_` 접두사 + `data-save-group="materialLots"` (GEMINI.md 원칙 2·10).
 *   체크박스 키(`f5002_{FRT|RR}_{행}_chk1`, `chk2`)에는 '초물'/'중물'/'종물' 문자열을 포함하지 않아
 *   ReportList 의 초·중·종 LOT 작성 여부 배지 판정에 간섭하지 않습니다 (원칙 16).
 * - 이 파일은 LotTableRenderer.js 의 `case 5002` 에서만 호출됩니다. (다른 양식 영향 없음)
 */

export const F5002_LOT_GROUPS = [
  { groupKey: 'FRT', title: '구분 (FRT)', rows: ['A', 'B', 'C'], marginBottom: '16px' },
  { groupKey: 'RR', title: '구분 (RR)', rows: ['A', 'B'], marginBottom: '0' }
];

const LOT_TH_STYLE = 'border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;';
const CHK_TH_STYLE = 'border: 1px solid #000; padding: 4px 1px; background: #ffffff; font-weight: 700; color: #000; font-size: 10.5px; line-height: 1.2; vertical-align: middle;';
const ROW_LABEL_STYLE = 'border: 1px solid #000; padding: 8px 2px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;';
const TD_STYLE = 'border: 1px solid #000; padding: 2px; background: #ffffff; vertical-align: middle;';
const CHK_TD_STYLE = 'border: 1px solid #000; padding: 0; background: #ffffff; vertical-align: middle; text-align: center;';
const TEXTAREA_STYLE = 'width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 4px 1px; height: 34px; resize: none; overflow: hidden; line-height: 1.2; border-radius: 0; outline: none; background: transparent;';
const CHK_LABEL_STYLE = 'display: flex; align-items: center; justify-content: center; width: 100%; height: 34px; cursor: pointer; margin: 0;';

/**
 * LOT 표를 lotContainer 에 그린다. (LotTableRenderer.js 의 `case 5002` 이 호출)
 * 현재 입력 중인 textarea·checkbox 값은 DOM 에서 직접 읽어 다시 그려도 유지한다.
 *
 * @param {HTMLElement} lotContainer  #section4LotTableContainer
 * @param {Object} curLots            공통 렌더러가 수집한 input 값 (id -> value)
 * @param {Object} materialLots       저장된 일보에서 복원한 값 (key -> value)
 */
export function renderF5002LotTable(lotContainer, curLots = {}, materialLots = {}) {
  const typed = { ...curLots };
  lotContainer.querySelectorAll('textarea[data-form-code="5002"]').forEach(el => {
    if (el.id) typed[el.id] = el.value;
  });
  lotContainer.querySelectorAll('input[type="checkbox"][data-form-code="5002"]').forEach(el => {
    if (el.id) typed[el.id] = el.checked;
  });
  lotContainer.innerHTML = renderF5002LotTableHTML(typed, materialLots);
}

function renderLotTextareaCell(id, curLots, materialLots) {
  const value = curLots[id] !== undefined ? curLots[id] : (materialLots[id] || '');
  return `<td style="${TD_STYLE}">
                  <textarea id="${id}" data-form-code="5002" data-save-group="materialLots" class="form-control lot-datetime-input" style="${TEXTAREA_STYLE}" placeholder="년월일\n시분">${value}</textarea>
                </td>`;
}

function renderCheckCell(id, curLots, materialLots) {
  const isChecked = id in curLots ? Boolean(curLots[id]) : Boolean(materialLots[id]);
  return `<td style="${CHK_TD_STYLE}">
                  <label style="${CHK_LABEL_STYLE}">
                    <input type="checkbox" id="${id}" data-form-code="5002" data-save-group="materialLots" data-check-symbol="1" ${isChecked ? 'checked' : ''} />
                  </label>
                </td>`;
}

/**
 * @param {Object} curLots     현재 화면에 입력돼 있던 값 (id -> value)
 * @param {Object} materialLots 저장된 일보에서 복원한 값 (key -> value)
 * @returns {string} LOT 표 HTML (FRT 상단 / RR 하단 2개 표)
 */
export function renderF5002LotTableHTML(curLots = {}, materialLots = {}) {
  const tablesHtml = F5002_LOT_GROUPS.map(group => {
    const bodyRows = group.rows.map(row => {
      const pfx = `f5002_${group.groupKey}_${row}`;
      return `
              <tr>
                <td style="${ROW_LABEL_STYLE}">${row}</td>
                ${renderLotTextareaCell(`${pfx}_초물`, curLots, materialLots)}
                ${renderCheckCell(`${pfx}_chk1`, curLots, materialLots)}
                ${renderLotTextareaCell(`${pfx}_중물`, curLots, materialLots)}
                ${renderCheckCell(`${pfx}_chk2`, curLots, materialLots)}
                ${renderLotTextareaCell(`${pfx}_종물`, curLots, materialLots)}
              </tr>`;
    }).join('');

    const mbStyle = group.marginBottom && group.marginBottom !== '0' ? ` margin-bottom: ${group.marginBottom};` : '';

    return `
          <table data-form-code="5002" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;${mbStyle}">
            <colgroup>
              <col style="width: 15%;" />
              <col style="width: 22.6%;" />
              <col style="width: 8.6%;" />
              <col style="width: 22.6%;" />
              <col style="width: 8.6%;" />
              <col style="width: 22.6%;" />
            </colgroup>
            <thead>
              <tr style="background: #fffde7; font-weight: 700;">
                <th style="border: 1px solid #000; padding: 6px 2px; font-size: 11px; line-height: 1.25; color: #000; vertical-align: middle; background: #fffde7;">${group.title}</th>
                <th style="${LOT_TH_STYLE}">초물</th>
                <th style="${CHK_TH_STYLE}">장착<br>확인</th>
                <th style="${LOT_TH_STYLE}">중물</th>
                <th style="${CHK_TH_STYLE}">장착<br>확인</th>
                <th style="${LOT_TH_STYLE}">종물</th>
              </tr>
            </thead>
            <tbody>${bodyRows}
            </tbody>
          </table>`;
  }).join('\n');

  return `
        <div class="f5002-lot-wrap" data-form-code="5002" style="width: 100%; overflow-x: hidden;">
          <style>
            .f5002-lot-wrap[data-form-code="5002"] textarea.lot-datetime-input {
              font-size: 11px !important;
              min-width: 0;
              box-sizing: border-box;
            }
            .f5002-lot-wrap[data-form-code="5002"] input[type="checkbox"] {
              width: 18px;
              height: 18px;
              cursor: pointer;
              accent-color: #2563eb;
              margin: 0;
            }
          </style>${tablesHtml}
        </div>
        `;
}
