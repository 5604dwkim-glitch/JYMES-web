/**
 * 양식 고유 번호 #5003 (GM 9BQC / G/RUN / 소재준비-단컷팅)
 * "4. 소재 LOT 번호 입력" 전용 렌더러
 *
 * - 상단 헤더 1행: 구 분(Division) | 초물(Start) | 중물(Half) | 종물(Finish)
 * - 세로 행(8행, 백색 배경):
 *   · FRT LH A / FRT LH B / RR LH A / RR LH B (LH 그룹 — 내부 점선, 그룹 하단 실선)
 *   · FRT RH A / FRT RH B / RR RH A / RR RH B (RH 그룹 — 내부 점선, 그룹 하단 실선)
 * - 모든 입력칸 ID 는 `f5003_` 접두사 + `초물`/`중물`/`종물` 키(`ReportList` 배지 호환) 및
 *   `data-save-group="materialLots"` 사용 (GEMINI.md 원칙 2·8·9·10·11·12·16)
 */

export const F5003_LOT_ROWS = [
  { key: 'FRT_LH_A', label: 'FRT LH A', topSolid: true, bottomSolid: false, legacyKey: 'LH_FRT' },
  { key: 'FRT_LH_B', label: 'FRT LH B', topSolid: false, bottomSolid: false },
  { key: 'RR_LH_A', label: 'RR LH A', topSolid: false, bottomSolid: false, legacyKey: 'LH_RR' },
  { key: 'RR_LH_B', label: 'RR LH B', topSolid: false, bottomSolid: true },
  { key: 'FRT_RH_A', label: 'FRT RH A', topSolid: true, bottomSolid: false, legacyKey: 'RH_FRT' },
  { key: 'FRT_RH_B', label: 'FRT RH B', topSolid: false, bottomSolid: false },
  { key: 'RR_RH_A', label: 'RR RH A', topSolid: false, bottomSolid: false, legacyKey: 'RH_RR' },
  { key: 'RR_RH_B', label: 'RR RH B', topSolid: false, bottomSolid: true }
];

export const F5003_LOT_STAGES = [
  { key: '초물', label: '초물(Start)' },
  { key: '중물', label: '중물(Half)' },
  { key: '종물', label: '종물(Finish)' }
];

const DIV_TH_STYLE = 'border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px; vertical-align: middle; white-space: nowrap;';
const TEXTAREA_STYLE = 'width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 4px 2px; height: 34px; resize: none; overflow: hidden; line-height: 1.2; border-radius: 0; outline: none; background: transparent;';

function escapeHtml(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * LotTableRenderer.js 의 `case 5003` 에서 위임 호출.
 * 현재 입력 중인 textarea 값은 DOM 에서 직접 읽어 재렌더 시에도 유지한다.
 *
 * @param {HTMLElement} lotContainer  #section4LotTableContainer
 * @param {Object} curLots            공통 렌더러가 수집한 값 맵
 * @param {Object} materialLots       저장된 일보에서 복원한 값 맵
 */
export function renderF5003LotTable(lotContainer, curLots = {}, materialLots = {}) {
  const typed = { ...curLots };
  lotContainer.querySelectorAll('textarea[data-form-code="5003"]').forEach(el => {
    if (el.id) typed[el.id] = el.value;
  });

  lotContainer.innerHTML = renderF5003LotTableHTML(typed, materialLots);
}

/**
 * @param {Object} curLots      현재 화면 입력값 맵
 * @param {Object} materialLots 저장된 일보 복원값 맵
 * @returns {string} LOT 표 HTML
 */
export function renderF5003LotTableHTML(curLots = {}, materialLots = {}) {
  const stageHeaders = F5003_LOT_STAGES
    .map((stage, stageIdx) => {
      const leftBorder = stageIdx === 0 ? '1px solid #000' : '1px dotted #000';
      const rightBorder = stageIdx === F5003_LOT_STAGES.length - 1 ? '1px solid #000' : '1px dotted #000';
      const thStyle = `border-left: ${leftBorder}; border-right: ${rightBorder}; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;`;
      return `<th scope="col" style="${thStyle}">${stage.label}</th>`;
    })
    .join('\n                ');

  const bodyRows = F5003_LOT_ROWS.map(row => {
    const topBorder = row.topSolid ? '1px solid #000' : '1px dotted #000';
    const bottomBorder = row.bottomSolid ? '1px solid #000' : '1px dotted #000';
    const rowThStyle = `border-left: 1px solid #000; border-right: 1px solid #000; border-top: ${topBorder}; border-bottom: ${bottomBorder}; padding: 8px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle; white-space: nowrap;`;

    const cells = F5003_LOT_STAGES.map((stage, stageIdx) => {
      const leftBorder = stageIdx === 0 ? '1px solid #000' : '1px dotted #000';
      const rightBorder = stageIdx === F5003_LOT_STAGES.length - 1 ? '1px solid #000' : '1px dotted #000';
      const cellTdStyle = `border-left: ${leftBorder}; border-right: ${rightBorder}; border-top: ${topBorder}; border-bottom: ${bottomBorder}; padding: 2px; background: #ffffff; vertical-align: middle;`;

      const id = `f5003_${row.key}_${stage.key}`;
      // 구버전(공통 기본 LOT 표) 저장 키 하위 호환 복원 (GEMINI.md 원칙 11)
      const legacyId = row.legacyKey ? `${row.legacyKey}_${stage.key}` : undefined;
      const val = curLots[id]
        ?? materialLots[id]
        ?? (legacyId ? materialLots[legacyId] : undefined)
        ?? '';
      return `<td style="${cellTdStyle}">
                  <textarea id="${id}" data-form-code="5003" data-save-group="materialLots" class="form-control lot-datetime-input" style="${TEXTAREA_STYLE}" placeholder="년월일\n시분">${escapeHtml(val)}</textarea>
                </td>`;
    }).join('\n                ');

    return `
              <tr>
                <th scope="row" style="${rowThStyle}">${row.label}</th>
                ${cells}
              </tr>`;
  }).join('');

  return `
        <div class="f5003-lot-wrap" data-form-code="5003" style="width: 100%; overflow-x: hidden;">
          <style>
            .f5003-lot-wrap[data-form-code="5003"] textarea.lot-datetime-input {
              font-size: 11px !important;
              min-width: 0;
              box-sizing: border-box;
            }
          </style>
          <table data-form-code="5003" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <colgroup>
              <col style="width: 22%;" />
              <col style="width: 26%;" />
              <col style="width: 26%;" />
              <col style="width: 26%;" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" style="${DIV_TH_STYLE}">구 분(Division)</th>
                ${stageHeaders}
              </tr>
            </thead>
            <tbody>${bodyRows}
            </tbody>
          </table>
        </div>
        `;
}
