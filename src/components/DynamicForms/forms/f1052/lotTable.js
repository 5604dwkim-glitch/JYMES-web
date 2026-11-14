/**
 * 양식 고유 번호 #1052 (제네시스 JG1 / FRUNK / 조인트)
 * "4. 소재 LOT 번호 입력" 표 템플릿 (#1051 과 동일한 2열 구조)
 *
 * - 가로줄(열 이름): 구분 / 타공단면 LOT / 무다공단면 LOT (세로 2열 분할)
 * - 세로줄(행 이름): 초물 / 중물 / 종물
 * - 입력칸 id 는 모두 `f1052_` 접두사 + `data-save-group="materialLots"` (GEMINI.md 원칙 2·10).
 *   `lot-datetime-input` 클래스를 붙여 기존 LOT 공통 로직(휠 피커·자동 서식·저장)을 그대로 사용하고,
 *   저장 키는 id 와 동일한 `f1052_perf_{초물/중물/종물}`, `f1052_nonperf_{초물/중물/종물}` 형태로 materialLots 에 저장됩니다.
 * - 하위 호환(원칙 11): 과거 단일 열(`초물`/`중물`/`종물`)로 저장된 데이터가 있을 경우 첫 번째 열(타공단면 LOT)로 복원합니다.
 * - 이 파일은 LotTableRenderer.js 의 `case 1052` 에서만 호출됩니다. (다른 양식 영향 없음)
 */

export const F1052_LOT_COLS = [
  { key: 'perf', label: '타공단면 LOT', legacyFallback: true },
  { key: 'nonperf', label: '무다공단면 LOT', legacyFallback: false }
];

export const F1052_LOT_STAGES = ['초물', '중물', '종물'];

const TH_GUBUN_STYLE = 'border: 1px solid #000; padding: 6px 2px; width: 24%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;';
const TH_COL_STYLE = 'border: 1px solid #000; padding: 6px 2px; width: 38%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;';
const ROW_LABEL_STYLE = 'border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;';
const TD_STYLE = 'border: 1px solid #000; padding: 2px; background: #ffffff;';
const TEXTAREA_STYLE = 'width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;';

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * LOT 표를 lotContainer 에 그린다. (LotTableRenderer.js 의 `case 1052` 이 호출)
 * 현재 입력 중인 값은 textarea 에서 직접 읽어 다시 그려도 유지한다.
 *
 * @param {HTMLElement} lotContainer  #section4LotTableContainer
 * @param {Object} curLots            공통 렌더러가 수집한 input 값 (id -> value)
 * @param {Object} materialLots       저장된 일보에서 복원한 값 (key -> value)
 */
export function renderF1052LotTable(lotContainer, curLots = {}, materialLots = {}) {
  const typed = { ...curLots };
  lotContainer.querySelectorAll('textarea[data-form-code="1052"]').forEach(el => {
    if (el.id) typed[el.id] = el.value;
  });
  lotContainer.innerHTML = renderF1052LotTableHTML(typed, materialLots);
}

/**
 * @param {Object} curLots      현재 화면에 입력돼 있던 값 (id -> value)
 * @param {Object} materialLots 저장된 일보에서 복원한 값 (key -> value)
 * @returns {string} LOT 표 HTML
 */
export function renderF1052LotTableHTML(curLots = {}, materialLots = {}) {
  const bodyRows = F1052_LOT_STAGES.map(stage => `
              <tr>
                <td style="${ROW_LABEL_STYLE}">${stage}</td>
                ${F1052_LOT_COLS.map(col => {
                  const id = `f1052_${col.key}_${stage}`;
                  const fallback = col.legacyFallback ? (materialLots[stage] || '') : '';
                  const value = curLots[id] !== undefined
                    ? curLots[id]
                    : (materialLots[id] !== undefined ? materialLots[id] : fallback);
                  return `<td style="${TD_STYLE}">
                  <textarea id="${id}" data-form-code="1052" data-save-group="materialLots" class="form-control lot-datetime-input" style="${TEXTAREA_STYLE}" placeholder="년월일\n시분">${escapeHtml(value)}</textarea>
                </td>`;
                }).join('\n                ')}
              </tr>`).join('');

  return `
          <table data-form-code="1052" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #ffffff; font-weight: 700;">
                <th style="${TH_GUBUN_STYLE}">구분</th>
                ${F1052_LOT_COLS.map(col => `<th style="${TH_COL_STYLE}">${col.label}</th>`).join('\n                ')}
              </tr>
            </thead>
            <tbody>${bodyRows}
            </tbody>
          </table>
        `;
}
