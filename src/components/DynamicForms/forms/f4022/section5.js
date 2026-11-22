/**
 * 양식 고유 번호 #4022 (LQ2a_HOOD SIDE_조인트)
 * Section 5 전용 렌더러
 *
 * - 5. 조인트 고무 LOT 번호 입력 (`#jointRubberLotNo`)
 * - 6. 설비 가류온도 & 가류시간 입력: 3열 구조 (`X부(L/R)`, `LH Y부`, `RH Y부`)
 *   · 기존 #4002 복사본의 4열(LH X부/LH Y부/RH X부/RH Y부)에서 마지막 RH Y부 열 삭제 및 X부 통합
 *   · 가류온도 스펙 200 ± 10 (초물/중물/종물 × 상/하)
 *   · 가류시간 스펙 90 ± 10 (초물/중물/종물)
 * - 금형 선택(`vulc_mold_x_lr`, `vulc_mold_lh_y`, `vulc_mold_rh_y`) 및 금일 금형 타수 카드 연동
 * - 레거시 저장 키(`frt_p`, `frt_q`, `rr_r`, `rr_s_lh`) 하위 호환 읽기 폴백 지원 (GEMINI.md 원칙 2·8·9·11·13)
 */

import { autoFormatDateTimeString } from '../../sections/formUtils.js';
import { renderJointMoldStrokeCard } from '../../sections/jointMoldStrokeCard.js';

export const F4022_VULC_COLS = [
  {
    key: 'x_lr',
    moldKey: 'mold_x_lr',
    moldType: 'X부',
    label: 'X부(L/R)',
    legacyMoldKeys: ['mold_lh_x', 'mold_rh_x'],
    legacyDataKeys: ['frt_p'],
  },
  {
    key: 'frt_q',
    moldKey: 'mold_lh_y',
    moldType: 'LH Y부',
    label: 'LH Y부',
    legacyMoldKeys: [],
    legacyDataKeys: [],
  },
  {
    key: 'rh_y',
    moldKey: 'mold_rh_y',
    moldType: 'RH Y부',
    label: 'RH Y부',
    legacyMoldKeys: ['mold_rh_x'],
    legacyDataKeys: ['rr_s_lh', 'rr_r'],
  },
];

export const F4022_VULC_PHASES = [
  { key: 'start', label: '초물(Start)', shortLabel: '초물' },
  { key: 'harf', label: '중물(Harf)', shortLabel: '중물' },
  { key: 'finish', label: '종물(Finish)', shortLabel: '종물' },
];

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resolveMoldVal(col, v) {
  if (v[col.moldKey]) return v[col.moldKey];
  for (const lk of col.legacyMoldKeys) {
    if (v[lk]) return v[lk];
  }
  return '';
}

function resolveVulcFieldVal(v, primaryKey, fallbackKeys) {
  if (v[primaryKey] !== undefined && v[primaryKey] !== '') {
    return v[primaryKey];
  }
  for (const fk of fallbackKeys) {
    if (v[fk] !== undefined && v[fk] !== '') {
      return v[fk];
    }
  }
  return '';
}

export function renderF4022Section5HTML(v = {}, jointLotVal = '', renderMoldSelect) {
  const colHeaders = F4022_VULC_COLS.map(
    (col) => `<th style="border: 1px solid #000; padding: 6px; width: 25%;">${col.label}</th>`
  ).join('\n                  ');

  const moldSelectCells = F4022_VULC_COLS.map((col) => {
    const selectId = `vulc_${col.moldKey}`;
    const savedVal = resolveMoldVal(col, v);
    const selectHtml = renderMoldSelect
      ? renderMoldSelect(selectId, col.moldType, savedVal)
      : `<select id="${selectId}" class="form-control vulc-input-dynamic" style="width:100%; height:24px; text-align:center; font-size:11px; padding:2px; border:1px solid #ccc; background:#f9fafb; outline:none; border-radius:4px;"><option value="">금형선택</option></select>`;
    return `<td style="border: 1px solid #000; padding: 4px;">${selectHtml}</td>`;
  }).join('\n                  ');

  const tempSpecCells = F4022_VULC_COLS.map(
    () => `<td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>`
  ).join('\n                  ');

  const timeSpecCells = F4022_VULC_COLS.map(
    () => `<td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>`
  ).join('\n                  ');

  const tempRowsHtml = F4022_VULC_PHASES.map((phase) => {
    const cellsHtml = F4022_VULC_COLS.map((col) => {
      const upKey = `temp_${phase.key}_${col.key}_상`;
      const downKey = `temp_${phase.key}_${col.key}_하`;
      const upVal = resolveVulcFieldVal(
        v,
        upKey,
        col.legacyDataKeys.map((dk) => `temp_${phase.key}_${dk}_상`)
      );
      const downVal = resolveVulcFieldVal(
        v,
        downKey,
        col.legacyDataKeys.map((dk) => `temp_${phase.key}_${dk}_하`)
      );
      return `<td style="border: 1px solid #000; padding: 2px;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
                      <input type="text" id="vulc_${upKey}" data-form-code="4022" data-wheel-parsed-spec="200" data-wheel-tolerance="10" data-wheel-unit="도" data-wheel-range="30" data-wheel-title="${phase.shortLabel} 가류온도 ${col.label} (상)" class="form-control" style="width: 100%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${escapeHtml(upVal)}" placeholder="(상)" readonly />
                    </div>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
                      <input type="text" id="vulc_${downKey}" data-form-code="4022" data-wheel-parsed-spec="200" data-wheel-tolerance="10" data-wheel-unit="도" data-wheel-range="30" data-wheel-title="${phase.shortLabel} 가류온도 ${col.label} (하)" class="form-control" style="width: 100%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${escapeHtml(downVal)}" placeholder="(하)" readonly />
                    </div>
                  </td>`;
    }).join('\n                  ');

    return `
                <tr>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 2px;">${phase.label}</td>
                  ${cellsHtml}
                </tr>`;
  }).join('');

  const timeRowsHtml = F4022_VULC_PHASES.map((phase) => {
    const cellsHtml = F4022_VULC_COLS.map((col) => {
      const timeKey = `time_${phase.key}_${col.key}`;
      const timeVal = resolveVulcFieldVal(
        v,
        timeKey,
        col.legacyDataKeys.map((dk) => `time_${phase.key}_${dk}`)
      );
      return `<td style="border: 1px solid #000; padding: 2px;">
                    <input type="text" id="vulc_${timeKey}" data-form-code="4022" data-wheel-parsed-spec="90" data-wheel-tolerance="10" data-wheel-unit="초" data-wheel-range="30" data-wheel-title="${phase.shortLabel} 가류시간 ${col.label}" class="form-control" style="width: 100%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="${escapeHtml(timeVal)}" placeholder="" readonly />
                  </td>`;
    }).join('\n                  ');

    return `
                <tr>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 2px;">${phase.label}</td>
                  ${cellsHtml}
                </tr>`;
  }).join('');

  return `
        <div class="card" data-form-code="4022" style="padding: 16px; margin-bottom: 16px;">
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 6px; display: block;">
            🧪 <span class="sec-num"></span> 조인트 고무 LOT 번호 입력
          </label>
          <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 10px;">조인트 고무 소재의 LOT 번호를 입력하세요.</p>
          <input type="text" id="jointRubberLotNo" data-form-code="4022" class="form-control lot-datetime-input"
            style="max-width: 280px; font-family: monospace;"
            placeholder="년월일시분 (예: 2607251330)"
            value="${escapeHtml(jointLotVal)}" />
        </div>

        <div class="card" data-form-code="4022" style="padding: 16px; margin-bottom: 16px;">
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
            ♨️ <span class="sec-num"></span> 설비 가류온도 & 가류시간 입력
          </label>
          <div style="overflow-x: auto;">
            <table data-form-code="4022" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <thead>
                <tr style="background: #fffde7; font-weight: 700; color: #000;">
                  <th colspan="2" style="border: 1px solid #000; padding: 6px; width: 25%;">부 위(Part)</th>
                  ${colHeaders}
                </tr>
                <tr style="background: #ffffff; font-weight: 700; color: #000;">
                  <td colspan="2" style="border: 1px solid #000; padding: 4px;">금형 No. [ 호기 ]</td>
                  ${moldSelectCells}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    가류온도<br>(Temperature) 상<br>(Upper/하DOWN)
                  </td>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">스펙(mm)</td>
                  ${tempSpecCells}
                </tr>${tempRowsHtml}
                <tr>
                  <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    가류시간(Time) - 초<br>(Sec)
                  </td>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">스펙(mm)</td>
                  ${timeSpecCells}
                </tr>${timeRowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      `;
}

export function renderF4022Section5(section5, ctx = {}, helpers = {}) {
  const existingData = ctx.existingData || null;
  const v = existingData?.vulcTable || existingData?.vulcData || {};
  const jointLotVal = existingData?.jointRubberLotNo || '';

  section5.innerHTML = renderF4022Section5HTML(v, jointLotVal, helpers.renderMoldSelect);

  const jointInput = section5.querySelector('#jointRubberLotNo');
  if (jointInput) {
    jointInput.addEventListener('blur', () => {
      if (jointInput.value) jointInput.value = autoFormatDateTimeString(jointInput.value);
    });
    jointInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        jointInput.value = autoFormatDateTimeString(jointInput.value);
      }
    });
  }

  if (ctx.bindNumberWheelPicker) {
    F4022_VULC_PHASES.forEach((phase) => {
      F4022_VULC_COLS.forEach((col) => {
        ['상', '하'].forEach((pos) => {
          const el = section5.querySelector(`#vulc_temp_${phase.key}_${col.key}_${pos}`);
          if (el) {
            ctx.bindNumberWheelPicker(
              el,
              `${phase.shortLabel} 가류온도 ${col.label} (${pos})`,
              200,
              30,
              '도',
              10
            );
          }
        });
        const timeEl = section5.querySelector(`#vulc_time_${phase.key}_${col.key}`);
        if (timeEl) {
          ctx.bindNumberWheelPicker(
            timeEl,
            `${phase.shortLabel} 가류시간 ${col.label}`,
            90,
            30,
            '초',
            10
          );
        }
      });
    });
  }

  if (helpers.bindMoldDuplicatePrevention) {
    helpers.bindMoldDuplicatePrevention();
  }
  renderJointMoldStrokeCard(section5, existingData);
}
