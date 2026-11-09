/**
 * 양식 고유 번호 #5001 (GM 9BQC / G/RUN / 소재준비-글라스본딩)
 * "4. 소재 LOT 번호 입력" 표 템플릿
 *
 * - 세로줄(행 이름): 9BQC PRI LH / 9BQC PRI RH / 9BQC TIN LH / 9BQC TIN RH
 * - 가로줄(열 이름): 초물 / 중물 / 종물
 * - 입력칸 id 는 모두 `f5001_` 접두사 (GEMINI.md 원칙 10).
 *   `lot-datetime-input` 클래스를 붙여 기존 LOT 공통 로직(휠 피커·자동 서식·저장)을 그대로 사용하고,
 *   저장 키는 id 와 동일한 `f5001_{행}_{열}` 형태로 materialLots 에 저장됩니다.
 * - 이 파일은 LotTableRenderer.js 의 `case 5001` 에서만 호출됩니다. (다른 양식 영향 없음)
 */

export const F5001_LOT_ROWS = [
  { key: 'PRI_LH', label: '9BQC PRI LH' },
  { key: 'PRI_RH', label: '9BQC PRI RH' },
  { key: 'TIN_LH', label: '9BQC TIN LH' },
  { key: 'TIN_RH', label: '9BQC TIN RH' }
];

export const F5001_LOT_COLS = ['초물', '중물', '종물'];

const TH_STYLE = 'border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 24.67%;';
const ROW_LABEL_STYLE = 'border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;';
const TD_STYLE = 'border: 1px solid #000; padding: 2px; background: #ffffff;';
const TEXTAREA_STYLE = 'width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 4px 2px; height: 34px; resize: none; overflow: hidden; line-height: 1.2; border-radius: 0; outline: none; background: transparent;';

/**
 * LOT 표를 lotContainer 에 그린다. (LotTableRenderer.js 의 `case 5001` 이 호출)
 * 현재 입력 중인 값은 textarea 에서 직접 읽어 다시 그려도 유지한다.
 *
 * @param {HTMLElement} lotContainer  #section4LotTableContainer
 * @param {Object} curLots            공통 렌더러가 수집한 input 값 (id -> value)
 * @param {Object} materialLots       저장된 일보에서 복원한 값 (key -> value)
 */
export function renderF5001LotTable(lotContainer, curLots = {}, materialLots = {}) {
  const typed = { ...curLots };
  lotContainer.querySelectorAll('textarea[data-form-code="5001"]').forEach(el => {
    if (el.id) typed[el.id] = el.value;
  });
  lotContainer.innerHTML = renderF5001LotTableHTML(typed, materialLots);
}

/**
 * @param {Object} curLots     현재 화면에 입력돼 있던 값 (id -> value)
 * @param {Object} materialLots 저장된 일보에서 복원한 값 (key -> value)
 * @returns {string} LOT 표 HTML
 */
export function renderF5001LotTableHTML(curLots = {}, materialLots = {}) {
  const bodyRows = F5001_LOT_ROWS.map(row => `
              <tr>
                <td style="${ROW_LABEL_STYLE}">${row.label}</td>
                ${F5001_LOT_COLS.map(col => {
                  const id = `f5001_${row.key}_${col}`;
                  const value = curLots[id] || materialLots[id] || '';
                  return `<td style="${TD_STYLE}">
                  <textarea id="${id}" data-form-code="5001" class="form-control lot-datetime-input" style="${TEXTAREA_STYLE}" placeholder="년월일\n시분">${value}</textarea>
                </td>`;
                }).join('')}
              </tr>`).join('');

  return `
          <table data-form-code="5001" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700;">
                <th style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 26%; vertical-align: middle; background: #fffde7;">구분</th>
                ${F5001_LOT_COLS.map(col => `<th style="${TH_STYLE}">${col}</th>`).join('\n                ')}
              </tr>
            </thead>
            <tbody>${bodyRows}
            </tbody>
          </table>
        `;
}
