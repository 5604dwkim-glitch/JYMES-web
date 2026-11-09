/**
 * 양식 고유 번호 #5001 (GM 9BQC / G/RUN / 소재준비-글라스본딩)
 * "7. 팁 교환 주기 기록" 전용 렌더러
 *
 * - 열 구성(4열 고정, 가로 스크롤 없음): 시간(순번 + 시간선택) | 수량 | 사유(막힘/마모) | 아이템(9BQC PRI LH/RH, TIN LH/RH)
 * - 기본 1행("1.") 표시, 하단 "+ 기록 추가" 버튼 클릭 시 "2.", "3." ... 동일 행 동적 추가 (2행 이상 개별 삭제 지원)
 * - 모든 입력칸/선택칸 ID·저장 키는 `f5001_tip_` 접두사 + `data-save-group="qtyTable"` 사용 (GEMINI.md 원칙 1·2·8·10·12·13)
 */

export const F5001_TIP_REASONS = ['막힘', '마모'];

export const F5001_TIP_ITEMS = [
  '9BQC PRI LH',
  '9BQC PRI RH',
  '9BQC TIN LH',
  '9BQC TIN RH'
];

const TD_STYLE = 'border: 1px solid #000; padding: 2px; background: #ffffff; vertical-align: middle;';
const TIME_INPUT_STYLE = 'width: 100%; min-width: 0; height: 28px; border: none; text-align: center; font-size: 11.5px; font-weight: 700; color: #000; padding: 2px 1px; background: transparent; outline: none; border-radius: 0; cursor: pointer; box-sizing: border-box;';
const QTY_INPUT_STYLE = 'width: 100%; min-width: 0; height: 28px; border: none; text-align: center; font-size: 11.5px; font-weight: 700; color: #000; padding: 2px 1px; background: transparent; outline: none; border-radius: 0; box-sizing: border-box;';
const SELECT_STYLE = 'width: 100%; min-width: 0; height: 28px; border: none; text-align: center; text-align-last: center; font-size: 11px; font-weight: 700; color: #000; padding: 2px 1px; background: transparent; outline: none; border-radius: 0; cursor: pointer; box-sizing: border-box;';

function escapeAttr(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * 저장된 값 맵(qtyTable)에서 복원할 행 배열(최소 1행)을 추출한다.
 * @param {Object} savedValues
 * @returns {Array<{time: string, qty: string, reason: string, item: string}>}
 */
export function extractF5001TipRows(savedValues = {}) {
  let count = parseInt(savedValues.f5001_tip_row_count, 10) || 0;

  // f5001_tip_row_count 가 없더라도 저장된 키에서 최대 행 번호를 탐색 (하위 호환 방어)
  Object.keys(savedValues).forEach(k => {
    const m = /^f5001_tip_(\d+)_(?:time|qty|reason|item)$/.exec(k);
    if (m) {
      const idx = parseInt(m[1], 10);
      if (idx > count) count = idx;
    }
  });

  if (count < 1) count = 1;

  const rows = [];
  for (let i = 1; i <= count; i++) {
    rows.push({
      time: savedValues[`f5001_tip_${i}_time`] ?? '',
      qty: savedValues[`f5001_tip_${i}_qty`] ?? '',
      reason: savedValues[`f5001_tip_${i}_reason`] ?? '',
      item: savedValues[`f5001_tip_${i}_item`] ?? ''
    });
  }
  return rows;
}

/**
 * 단일 행 `<tr>` HTML 생성
 * @param {number} idx 1-based 행 순번
 * @param {{time?: string, qty?: string, reason?: string, item?: string}} row
 */
export function renderF5001TipRowHTML(idx, row = {}) {
  const timeVal = escapeAttr(row.time);
  const qtyVal = escapeAttr(row.qty);
  const reasonVal = row.reason ?? '';
  const itemVal = row.item ?? '';

  const reasonOptions = F5001_TIP_REASONS.map(
    r => `<option value="${r}"${reasonVal === r ? ' selected' : ''}>${r}</option>`
  ).join('');

  const itemOptions = F5001_TIP_ITEMS.map(
    it => `<option value="${it}"${itemVal === it ? ' selected' : ''}>${it}</option>`
  ).join('');

  const removeBtnHTML = idx > 1
    ? `<button type="button" class="remove-btn" data-f5001-tip-remove="1" title="행 삭제" style="flex-shrink: 0; width: 20px; height: 20px; border: 1px solid #fecdd3; background: #fff1f2; color: #e11d48; border-radius: 4px; font-size: 10px; font-weight: 800; line-height: 1; padding: 0; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;">✕</button>`
    : '';

  return `
                <tr data-form-code="5001" data-f5001-tip-row="${idx}">
                  <td style="${TD_STYLE}">
                    <div style="display: flex; align-items: center; gap: 2px; padding: 0 2px;">
                      <span data-f5001-tip-seq="1" style="font-weight: 700; font-size: 11px; color: #000; flex-shrink: 0;">${idx}.</span>
                      <input type="text" id="f5001_tip_${idx}_time" data-form-code="5001" data-save-group="qtyTable" data-f5001-tip-field="time" class="form-control" style="${TIME_INPUT_STYLE}" value="${timeVal}" placeholder="시간선택" readonly />
                    </div>
                  </td>
                  <td style="${TD_STYLE}">
                    <input type="number" min="0" inputmode="numeric" id="f5001_tip_${idx}_qty" data-form-code="5001" data-save-group="qtyTable" data-f5001-tip-field="qty" class="form-control" style="${QTY_INPUT_STYLE}" value="${qtyVal}" />
                  </td>
                  <td style="${TD_STYLE}">
                    <select id="f5001_tip_${idx}_reason" data-form-code="5001" data-save-group="qtyTable" data-f5001-tip-field="reason" data-empty-blank="1" class="form-control" style="${SELECT_STYLE}">
                      <option value=""${reasonVal === '' ? ' selected' : ''}>선택</option>${reasonOptions}
                    </select>
                  </td>
                  <td style="${TD_STYLE}">
                    <div style="display: flex; align-items: center; gap: 2px; padding-right: ${idx > 1 ? '2px' : '0'};">
                      <select id="f5001_tip_${idx}_item" data-form-code="5001" data-save-group="qtyTable" data-f5001-tip-field="item" data-empty-blank="1" class="form-control" style="${SELECT_STYLE} letter-spacing: -0.3px;">
                        <option value=""${itemVal === '' ? ' selected' : ''}>아이템 선택</option>${itemOptions}
                      </select>${removeBtnHTML}
                    </div>
                  </td>
                </tr>`;
}

/**
 * "7. 팁 교환 주기 기록" 카드 전체 HTML 생성
 * @param {Object} savedValues
 */
export function renderF5001TipExchangeHTML(savedValues = {}) {
  const rows = extractF5001TipRows(savedValues);
  const bodyHTML = rows.map((row, i) => renderF5001TipRowHTML(i + 1, row)).join('');

  return `
        <div class="card f5001-tip-card" data-form-code="5001" style="padding: 14px 10px; margin-bottom: 16px;">
          <style>
            .f5001-tip-card[data-form-code="5001"] input[type="number"]::-webkit-outer-spin-button,
            .f5001-tip-card[data-form-code="5001"] input[type="number"]::-webkit-inner-spin-button {
              -webkit-appearance: none;
              margin: 0;
            }
            .f5001-tip-card[data-form-code="5001"] input[type="number"] {
              -moz-appearance: textfield;
              appearance: textfield;
              min-width: 0;
              font-size: 11.5px !important;
            }
            .f5001-tip-card[data-form-code="5001"] input[type="text"] {
              min-width: 0;
              font-size: 11.5px !important;
            }
            .f5001-tip-card[data-form-code="5001"] select {
              min-width: 0;
              font-size: 11px !important;
            }
          </style>
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; padding: 0 4px; display: block;">
            🔧 <span class="sec-num"></span> 팁 교환 주기 기록
          </label>
          <input type="hidden" id="f5001_tip_row_count" data-form-code="5001" data-save-group="qtyTable" value="${rows.length}" />
          <div style="width: 100%; overflow-x: hidden;">
            <table data-form-code="5001" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <colgroup>
                <col style="width: 24%;" />
                <col style="width: 16%;" />
                <col style="width: 22%;" />
                <col style="width: 38%;" />
              </colgroup>
              <thead>
                <tr>
                  <th style="border: 1px solid #000; padding: 7px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">시간</th>
                  <th style="border: 1px solid #000; padding: 7px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">수량</th>
                  <th style="border: 1px solid #000; padding: 7px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">사유</th>
                  <th style="border: 1px solid #000; padding: 7px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">아이템</th>
                </tr>
              </thead>
              <tbody data-f5001-tip-tbody="1">${bodyHTML}
              </tbody>
            </table>
          </div>
          <div style="margin-top: 8px; display: flex; justify-content: center;">
            <button type="button" class="add-btn" data-form-code="5001" data-f5001-tip-add="1" style="width: 100%; padding: 8px 12px; border: 1.5px dashed #0284c7; border-radius: 8px; background: #f0f9ff; color: #0369a1; font-size: 12.5px; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px;">
              <span>➕</span> 항목 추가
            </button>
          </div>
        </div>
      `;
}

/**
 * 행 삭제 후 순번(1., 2., ...) 및 입력 ID(`f5001_tip_{순번}_*`)를 재정렬한다.
 * @param {HTMLElement} card `.f5001-tip-card`
 */
function reindexTipRows(card) {
  const rows = card.querySelectorAll('tr[data-f5001-tip-row]');
  rows.forEach((tr, i) => {
    const idx = i + 1;
    tr.dataset.f5001TipRow = String(idx);
    const seqSpan = tr.querySelector('[data-f5001-tip-seq]');
    if (seqSpan) seqSpan.textContent = `${idx}.`;

    ['time', 'qty', 'reason', 'item'].forEach(field => {
      const el = tr.querySelector(`[data-f5001-tip-field="${field}"]`);
      if (el) el.id = `f5001_tip_${idx}_${field}`;
    });
  });

  const countInput = card.querySelector('#f5001_tip_row_count');
  if (countInput) countInput.value = String(rows.length);
}

/**
 * 카드 내부의 시간 휠 피커 및 행 추가/삭제 이벤트를 스코프 바인딩한다. (GEMINI.md 원칙 13)
 * @param {HTMLElement} qtySection #qtySection
 * @param {Object} ctx
 */
export function bindF5001TipExchangeEvents(qtySection, ctx = {}) {
  if (!qtySection) return;
  const card = qtySection.querySelector('.f5001-tip-card[data-form-code="5001"]');
  if (!card) return;

  const bindTimeInputsInScope = (root) => {
    if (!ctx.bindTimeWheelPicker) return;
    root.querySelectorAll('input[data-f5001-tip-field="time"]').forEach(input => {
      if (input.dataset.timeBound === '1') return;
      input.dataset.timeBound = '1';
      ctx.bindTimeWheelPicker(input, '팁 교환 시간 선택');
    });
  };

  bindTimeInputsInScope(card);

  if (card.dataset.f5001TipBound === '1') return;
  card.dataset.f5001TipBound = '1';

  const tbody = card.querySelector('tbody[data-f5001-tip-tbody="1"]');
  const addBtn = card.querySelector('button[data-f5001-tip-add="1"]');

  if (addBtn && tbody) {
    addBtn.addEventListener('click', () => {
      const nextIdx = tbody.querySelectorAll('tr[data-f5001-tip-row]').length + 1;
      tbody.insertAdjacentHTML('beforeend', renderF5001TipRowHTML(nextIdx, {}));
      const countInput = card.querySelector('#f5001_tip_row_count');
      if (countInput) countInput.value = String(nextIdx);
      const lastRow = tbody.lastElementChild;
      if (lastRow) bindTimeInputsInScope(lastRow);
    });
  }

  if (tbody) {
    tbody.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('button[data-f5001-tip-remove="1"]');
      if (!removeBtn) return;
      const tr = removeBtn.closest('tr[data-f5001-tip-row]');
      if (!tr) return;
      if (tbody.querySelectorAll('tr[data-f5001-tip-row]').length <= 1) return;
      tr.remove();
      reindexTipRows(card);
    });
  }
}
