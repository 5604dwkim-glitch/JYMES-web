/**
 * 양식 고유 번호 #5005 (GM 9BQC / G/RUN / 조인트-RR R부)
 * "4. 소재 LOT 번호 입력" 전용 렌더러
 *
 * - RR 단독 표 구성
 * - 상단 헤더: 구 분(Division)[rowspan=2] | RR[colspan=3] → 초물 / 중물 / 종물
 * - 세로 행: LH A / LH B / RH A / RH B
 * - 모든 입력칸 ID 는 `f5005_` 접두사 및 `data-save-group="materialLots"` 사용 (GEMINI.md 원칙 2·8·10·11·12)
 */

// legacySide: 복사 직후(FRT 표기, LH / RH 단일 행) 저장 데이터 복원용. 기존 LH → LH A, 기존 RH → RH A 로 표시 (GEMINI.md 원칙 11)
export const F5005_LOT_ROWS = [
  { key: 'LH_A', label: 'LH A', legacySide: 'LH' },
  { key: 'LH_B', label: 'LH B' },
  { key: 'RH_A', label: 'RH A', legacySide: 'RH' },
  { key: 'RH_B', label: 'RH B' }
];

export const F5005_LOT_STAGES = ['초물', '중물', '종물'];

const STAGE_TH_STYLE = 'border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;';
const ROW_LABEL_STYLE = 'border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;';
const TD_STYLE = 'border: 1px solid #000; padding: 2px; background: #ffffff; vertical-align: middle;';
const TEXTAREA_STYLE = 'width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 4px 2px; height: 34px; resize: none; overflow: hidden; line-height: 1.2; border-radius: 0; outline: none; background: transparent;';

/**
 * LotTableRenderer.js 의 `case 5005` 에서 위임 호출.
 * @param {HTMLElement} lotContainer  #section4LotTableContainer
 * @param {Object} curLots            공통 렌더러가 수집한 값 맵
 * @param {Object} materialLots       저장된 일보에서 복원한 값 맵
 */
export function renderF5005LotTable(lotContainer, curLots = {}, materialLots = {}) {
  const typed = { ...curLots };
  lotContainer.querySelectorAll('textarea[data-form-code="5005"]').forEach(el => {
    if (el.id) typed[el.id] = el.value;
  });
  lotContainer.innerHTML = renderF5005LotTableHTML(typed, materialLots);
}

/**
 * @param {Object} curLots      현재 화면 입력값 맵
 * @param {Object} materialLots 저장된 일보 복원값 맵
 * @returns {string} LOT 표 HTML
 */
export function renderF5005LotTableHTML(curLots = {}, materialLots = {}) {
  const stageHeaders = F5005_LOT_STAGES
    .map(stage => `<th style="${STAGE_TH_STYLE}">${stage}</th>`)
    .join('\n                ');

  const bodyRows = F5005_LOT_ROWS.map(row => {
    const cells = F5005_LOT_STAGES.map(stage => {
      const id = `f5005_RR_${row.key}_${stage}`;
      const oldId = row.legacySide ? `f5005_FRT_${row.legacySide}_${stage}` : undefined;
      const legacyKey = row.legacySide ? `${row.legacySide}_FRT_${stage}` : undefined;
      const val = curLots[id] ?? materialLots[id]
        ?? (oldId ? materialLots[oldId] : undefined)
        ?? (legacyKey ? materialLots[legacyKey] : undefined)
        ?? '';
      return `<td style="${TD_STYLE}">
                  <textarea id="${id}" data-form-code="5005" data-save-group="materialLots" class="form-control lot-datetime-input" style="${TEXTAREA_STYLE}" placeholder="년월일\n시분">${val}</textarea>
                </td>`;
    }).join('\n                ');

    return `
              <tr>
                <td style="${ROW_LABEL_STYLE}">${row.label}</td>
                ${cells}
              </tr>`;
  }).join('');

  return `
        <div class="f5005-lot-wrap" data-form-code="5005" style="width: 100%; overflow-x: hidden;">
          <style>
            .f5005-lot-wrap[data-form-code="5005"] textarea.lot-datetime-input {
              font-size: 11px !important;
              min-width: 0;
              box-sizing: border-box;
            }
          </style>
          <table data-form-code="5005" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <colgroup>
              <col style="width: 22%;" />
              <col style="width: 26%;" />
              <col style="width: 26%;" />
              <col style="width: 26%;" />
            </colgroup>
            <thead>
              <tr style="background: #fffde7; font-weight: 700;">
                <th rowspan="2" style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; vertical-align: middle; background: #fffde7;">구 분(Division)</th>
                <th colspan="3" style="border: 1px solid #000; padding: 8px 4px; font-size: 13px; color: #000; vertical-align: middle; background: #fffde7;">RR</th>
              </tr>
              <tr style="background: #fffde7;">
                ${stageHeaders}
              </tr>
            </thead>
            <tbody>${bodyRows}
            </tbody>
          </table>
        </div>
        `;
}
