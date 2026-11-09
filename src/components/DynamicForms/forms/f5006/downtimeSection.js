/**
 * 양식 고유 번호 #5006 (GM 9BQC / G/RUN / 조인트-RR Fixed)
 * "10. 작업 특이사항 (비가동 시간)" 전용 호기 설정 및 실시간 동기화 모듈
 *
 * - 상단 4번 섹션의 방향 선택(`RR LH` / `RR RH`)과
 *   8번 생산실적 표 2개의 `(   ) 호기` 입력값(`#f5006_RR_u1_machine_no`, `#f5006_RR_u2_machine_no`)을 조합하여
 *   `#downtimeEquip1~3` 설비 선택 드롭다운 목록을 실시간 반영한다.
 *   · 예: `RR LH` 선택 + 호기 `1`, `2` 입력 -> `['RR LH 1호기', 'RR LH 2호기']`
 *   · 예: `RR RH` 선택 + 호기 `3`, `4` 입력 -> `['RR RH 3호기', 'RR RH 4호기']`
 *   · 호기 번호 미입력 시 -> 선택된 `['RR LH']` 또는 `['RR RH']` 기본 표시
 * - 양식 전용 로직은 이 파일에만 두고 공통 렌더러에서는 한 줄 위임 (GEMINI.md 원칙 8·9·11·13)
 */

import { resolveF5006Equip } from './equipConfig.js';

function escapeHtml(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatMachineEquipOption(equipLabel, rawNo) {
  const cleaned = String(rawNo ?? '').replace(/\s*호기\s*$/u, '').trim();
  if (!cleaned) return '';
  return `${equipLabel} ${cleaned}호기`;
}

/**
 * 현재 화면 DOM 및 저장 데이터로부터 비가동 호기 드롭다운 항목 목록을 생성한다.
 * @param {HTMLElement|null} container
 * @param {Object|null} [existingData]
 * @returns {Array<{ slot: string, label: string }>}
 */
export function buildF5006DowntimeEquipItems(container, existingData = null) {
  const equip = resolveF5006Equip(existingData, container);
  const u1Input = container?.querySelector?.('#f5006_RR_u1_machine_no[data-form-code="5006"]');
  const u2Input = container?.querySelector?.('#f5006_RR_u2_machine_no[data-form-code="5006"]');

  const u1Raw = u1Input ? u1Input.value : (existingData?.qtyTable?.f5006_RR_u1_machine_no ?? '');
  const u2Raw = u2Input ? u2Input.value : (existingData?.qtyTable?.f5006_RR_u2_machine_no ?? '');

  const items = [];
  const seen = new Set();

  const u1Label = formatMachineEquipOption(equip.label, u1Raw);
  if (u1Label && !seen.has(u1Label)) {
    seen.add(u1Label);
    items.push({ slot: 'u1', label: u1Label });
  }

  const u2Label = formatMachineEquipOption(equip.label, u2Raw);
  if (u2Label && !seen.has(u2Label)) {
    seen.add(u2Label);
    items.push({ slot: 'u2', label: u2Label });
  }

  if (items.length === 0) {
    items.push({ slot: 'base', label: equip.label });
  }

  return items;
}

/**
 * 상단 `RR LH`/`RR RH` 변경 또는 8번 섹션 `(   ) 호기` 입력 시 `#downtimeEquip1~3` 옵션을 즉시 갱신한다.
 * @param {HTMLElement|null} rootScope
 * @param {Object|null} [existingData]
 */
export function syncF5006DowntimeEquips(rootScope, existingData = null) {
  if (!rootScope) return;
  const baseItems = buildF5006DowntimeEquipItems(rootScope, existingData);

  [1, 2, 3].forEach(num => {
    const select = rootScope.querySelector(`#downtimeEquip${num}`);
    if (!select) return;

    const wasInit = Array.from(select.options || []).some(opt => Boolean(opt.dataset?.f5006Slot));
    const selectedOpt = select.options?.[select.selectedIndex];
    const prevVal = wasInit ? (select.value || '') : '';
    const prevSlot = wasInit ? (selectedOpt?.dataset?.f5006Slot || '') : '';
    const savedVal = !wasInit && existingData ? String(existingData[`downtimeEquip${num}`] || '').trim() : '';

    const items = [...baseItems];
    if (savedVal && !items.some(it => it.label === savedVal)) {
      items.push({ slot: 'legacy', label: savedVal });
    }

    let nextVal = '';
    if (wasInit) {
      if (prevVal && items.some(it => it.label === prevVal)) {
        nextVal = prevVal;
      } else if (prevSlot === 'u1' || prevSlot === 'u2') {
        const mapped = items.find(it => it.slot === prevSlot);
        nextVal = mapped ? mapped.label : '';
      } else if (prevSlot === 'base' && items.length === 1) {
        nextVal = items[0].label;
      }
    } else if (savedVal && items.some(it => it.label === savedVal)) {
      nextVal = savedVal;
    }

    select.innerHTML =
      `<option value=""${nextVal === '' ? ' selected' : ''}>호기 선택</option>` +
      items.map(it => {
        const esc = escapeHtml(it.label);
        const isSel = nextVal === it.label ? ' selected' : '';
        return `<option value="${esc}" data-f5006-slot="${it.slot}"${isSel}>${esc}</option>`;
      }).join('');

    select.value = nextVal;
  });
}

/**
 * #5006 전용 비가동 호기 드롭다운 적용 (DowntimeSectionRenderer.js 위임 진입점)
 * @param {HTMLElement} container
 * @param {HTMLElement|null} downtimeCard `#downtimeCard`
 * @param {Object|null} existingData
 */
export function applyF5006DowntimeSection(container, downtimeCard, existingData = null) {
  if (!container) return;
  if (downtimeCard) downtimeCard.style.display = 'block';

  const titleLabel = container.querySelector('#downtimeTitleLabel');
  if (titleLabel) {
    titleLabel.innerHTML = '📝 <span class="sec-num"></span> 작업 특이사항';
  }

  syncF5006DowntimeEquips(container, existingData);
}
