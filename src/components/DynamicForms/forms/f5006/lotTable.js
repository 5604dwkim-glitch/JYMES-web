/**
 * 양식 고유 번호 #5006 (GM 9BQC / G/RUN / 조인트-RR Fixed)
 * "4. 소재 LOT 번호 입력" 전용 렌더러
 *
 * - 상단 선택: RR LH / RR RH 2종
 * - 선택된 값에 따라 4번 LOT 표(헤더 및 A·B 행의 LH/RH), 6번 사출온도(LH/RH), 8번 생산실적(RR LH/RR RH 및 LH/RH) 자동 동기화
 * - 세로 행: A / B 2행 구성 → 선택된 방향에 따라 `LH A / LH B` 또는 `RH A / RH B` 자동 표기
 * - 모든 입력칸 ID 는 `f5006_` 접두사 및 `data-save-group="materialLots"` 사용 (GEMINI.md 원칙 2·8·10·11·12·13)
 */

import {
  F5006_EQUIP_OPTIONS,
  resolveF5006Equip,
  applyF5006EquipSelection
} from './equipConfig.js';
import { syncF5006DowntimeEquips } from './downtimeSection.js';

export const F5006_LOT_ROWS = [
  { key: 'A', legacySideKey: 'LH' },
  { key: 'B', legacySideKey: null }
];

export const F5006_LOT_STAGES = ['초물', '중물', '종물'];

export const F5006_RECORD_ROWS = [
  { key: 'Glass', label: 'Glass' },
  { key: 'DV', label: 'D/V' },
  { key: 'BRACKET', label: 'BRACKET' }
];

export const F5006_RECORD_STAGES = [
  { key: '초물', label: '초물(Start)' },
  { key: '중물', label: '중물(Half)' },
  { key: '종물', label: '종물(Finish)' }
];

const STAGE_TH_STYLE = 'border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;';
const ROW_LABEL_STYLE = 'border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;';
const TD_STYLE = 'border: 1px solid #000; padding: 2px; background: #ffffff; vertical-align: middle;';
const TEXTAREA_STYLE = 'width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 4px 2px; height: 34px; resize: none; overflow: hidden; line-height: 1.2; border-radius: 0; outline: none; background: transparent;';

/**
 * LotTableRenderer.js 의 `case 5006` 에서 위임 호출.
 * @param {HTMLElement} lotContainer  #section4LotTableContainer
 * @param {Object} curLots            공통 렌더러가 수집한 값 맵
 * @param {Object} materialLots       저장된 일보에서 복원한 값 맵
 * @param {Object} [ctx]              LotTableRenderer 컨텍스트
 */
export function renderF5006LotTable(lotContainer, curLots = {}, materialLots = {}, ctx = {}) {
  const typed = { ...curLots };
  lotContainer.querySelectorAll('[data-form-code="5006"]').forEach(el => {
    if (el.id && (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT')) {
      typed[el.id] = el.value;
    }
  });

  const equip = resolveF5006Equip(ctx?.existingData, ctx?.container || lotContainer, {
    ...materialLots,
    ...typed
  });

  lotContainer.innerHTML = renderF5006LotTableHTML(typed, materialLots, equip);

  const wrap = lotContainer.querySelector('.f5006-lot-wrap[data-form-code="5006"]');
  if (wrap && wrap.dataset.bound !== '1') {
    wrap.dataset.bound = '1';
    wrap.addEventListener('click', (e) => {
      const btn = e.target.closest('button.f5006-equip-btn[data-form-code="5006"]');
      if (!btn) return;
      e.preventDefault();
      const rootScope = ctx?.container || lotContainer.closest('form') || lotContainer;
      applyF5006EquipSelection(rootScope, btn.dataset.equipKey, ctx?.bindNumberWheelPicker);
      syncF5006DowntimeEquips(rootScope);
    });
  }
}

/**
 * @param {Object} curLots      현재 화면 입력값 맵
 * @param {Object} materialLots 저장된 일보 복원값 맵
 * @param {Object} [equipInfo]  선택된 설비 메타 객체
 * @returns {string} LOT 표 HTML
 */
export function renderF5006LotTableHTML(curLots = {}, materialLots = {}, equipInfo = null) {
  const equip = equipInfo || resolveF5006Equip(null, null, { ...materialLots, ...curLots });

  const equipButtonsHTML = F5006_EQUIP_OPTIONS.map(opt => {
    const isActive = opt.key === equip.key;
    return `<button type="button" class="f5006-equip-btn${isActive ? ' is-active' : ''}" data-form-code="5006" data-equip-key="${opt.key}" aria-pressed="${isActive ? 'true' : 'false'}">${opt.label}</button>`;
  }).join('\n              ');

  const stageHeaders = F5006_LOT_STAGES
    .map(stage => `<th style="${STAGE_TH_STYLE}">${stage}</th>`)
    .join('\n                ');

  const bodyRows = F5006_LOT_ROWS.map(row => {
    const cells = F5006_LOT_STAGES.map(stage => {
      const id = `f5006_RR_${row.key}_${stage}`;
      // 구버전 저장 키 하위 호환 복원 (GEMINI.md 원칙 11)
      const prevSideId = `f5006_RR_${equip.side}_${row.key}_${stage}`;
      const prevLhId = `f5006_RR_LH_${row.key}_${stage}`;
      const prevRhId = `f5006_RR_RH_${row.key}_${stage}`;
      const prevFrtId = row.key === 'A' ? `f5006_FRT_${equip.side}_${stage}` : undefined;
      const val = curLots[id]
        ?? materialLots[id]
        ?? materialLots[prevSideId]
        ?? materialLots[prevLhId]
        ?? materialLots[prevRhId]
        ?? (prevFrtId ? materialLots[prevFrtId] : undefined)
        ?? '';
      return `<td style="${TD_STYLE}">
                  <textarea id="${id}" data-form-code="5006" data-save-group="materialLots" class="form-control lot-datetime-input" style="${TEXTAREA_STYLE}" placeholder="년월일\n시분">${val}</textarea>
                </td>`;
    }).join('\n                ');

    return `
              <tr>
                <td data-form-code="5006" data-f5006-lot-row="${row.key}" style="${ROW_LABEL_STYLE}">${equip.side} ${row.key}</td>
                ${cells}
              </tr>`;
  }).join('');

  const recordStageHeaders = F5006_RECORD_STAGES
    .map(stage => `<th style="${STAGE_TH_STYLE} font-size: 10.5px;">${stage.label}</th>`)
    .join('\n                ');

  const recordBodyRows = F5006_RECORD_ROWS.map((row, rowIdx) => {
    const topBorder = rowIdx === 0 ? '1px solid #000' : '1px dotted #000';
    const bottomBorder = rowIdx === F5006_RECORD_ROWS.length - 1 ? '1px solid #000' : '1px dotted #000';
    const rowThStyle = `border-left: 1px solid #000; border-right: 1px solid #000; border-top: ${topBorder}; border-bottom: ${bottomBorder}; padding: 8px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;`;
    const cellTdStyle = `border-left: 1px solid #000; border-right: 1px solid #000; border-top: ${topBorder}; border-bottom: ${bottomBorder}; padding: 2px; background: #ffffff; vertical-align: middle;`;

    const cells = F5006_RECORD_STAGES.map(stage => {
      const id = `f5006_rec_${row.key}_${stage.key}`;
      const val = curLots[id] ?? materialLots[id] ?? '';
      return `<td style="${cellTdStyle}">
                  <textarea id="${id}" data-form-code="5006" data-save-group="materialLots" class="form-control lot-datetime-input" style="${TEXTAREA_STYLE}" placeholder="년월일\n시분">${val}</textarea>
                </td>`;
    }).join('\n                ');

    return `
              <tr>
                <th scope="row" style="${rowThStyle}">${row.label}</th>
                ${cells}
              </tr>`;
  }).join('');

  return `
        <div class="f5006-lot-wrap" data-form-code="5006" style="width: 100%; overflow-x: hidden;">
          <style>
            .f5006-lot-wrap[data-form-code="5006"] textarea.lot-datetime-input {
              font-size: 11px !important;
              min-width: 0;
              box-sizing: border-box;
            }
            .f5006-lot-wrap[data-form-code="5006"] .f5006-equip-selector {
              margin-bottom: 10px;
              padding: 8px;
              background: #f8fafc;
              border: 1px solid #cbd5e1;
              border-radius: 8px;
            }
            .f5006-lot-wrap[data-form-code="5006"] .f5006-equip-selector-title {
              font-size: 11.5px;
              font-weight: 700;
              color: #1e293b;
              margin-bottom: 6px;
            }
            .f5006-lot-wrap[data-form-code="5006"] .f5006-equip-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 6px;
            }
            .f5006-lot-wrap[data-form-code="5006"] .f5006-equip-btn {
              height: 34px;
              border-radius: 6px;
              border: 1px solid #cbd5e1;
              background: #ffffff;
              color: #334155;
              font-size: 12px;
              font-weight: 700;
              cursor: pointer;
              transition: all 0.15s ease;
            }
            .f5006-lot-wrap[data-form-code="5006"] .f5006-equip-btn.is-active {
              background: #2563eb;
              color: #ffffff;
              border-color: #1d4ed8;
              box-shadow: 0 2px 5px rgba(37, 99, 235, 0.25);
            }
            .f5006-lot-wrap[data-form-code="5006"] .f5006-equip-selector:has(button[style*="display: none"]) {
              display: none;
            }
            @media print {
              .f5006-lot-wrap[data-form-code="5006"] .f5006-equip-selector {
                display: none !important;
              }
            }
          </style>
          <input type="hidden" id="f5006_selected_equip" data-form-code="5006" data-save-group="materialLots" value="${equip.key}" />
          <div class="f5006-equip-selector" data-form-code="5006">
            <div class="f5006-equip-selector-title">구분 선택 (RR LH / RR RH 선택 시 하단 항목 자동 반영)</div>
            <div class="f5006-equip-grid">
              ${equipButtonsHTML}
            </div>
          </div>
          <table data-form-code="5006" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif; margin-bottom: 12px;">
            <colgroup>
              <col style="width: 22%;" />
              <col style="width: 26%;" />
              <col style="width: 26%;" />
              <col style="width: 26%;" />
            </colgroup>
            <thead>
              <tr style="background: #fffde7; font-weight: 700;">
                <th rowspan="2" style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; vertical-align: middle; background: #fffde7;">구 분(Division)</th>
                <th colspan="3" data-form-code="5006" data-f5006-equip-label="1" style="border: 1px solid #000; padding: 8px 4px; font-size: 13px; color: #000; vertical-align: middle; background: #fffde7;">${equip.label}</th>
              </tr>
              <tr style="background: #fffde7;">
                ${stageHeaders}
              </tr>
            </thead>
            <tbody>${bodyRows}
            </tbody>
          </table>
          <table data-form-code="5006" style="width: 100%; table-layout: fixed; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <colgroup>
              <col style="width: 22%;" />
              <col style="width: 26%;" />
              <col style="width: 26%;" />
              <col style="width: 26%;" />
            </colgroup>
            <thead>
              <tr>
                <th colspan="4" style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">Record : 년(Year).월(Month).일(Day)/시(Hour):분(Minute)</th>
              </tr>
              <tr>
                <th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 10.5px; letter-spacing: -0.2px; white-space: nowrap; vertical-align: middle;">구분(Division)</th>
                ${recordStageHeaders}
              </tr>
            </thead>
            <tbody>${recordBodyRows}
            </tbody>
          </table>
        </div>
        `;
}
