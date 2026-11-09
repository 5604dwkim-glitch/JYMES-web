/**
 * 양식 고유 번호 #5006 (GM 9BQC / G/RUN / 조인트-RR Fixed)
 * 방향(RR LH / RR RH) 선택 상태 및 양식 내부 동기화 전용 모듈
 *
 * - 선택지 2종: RR LH / RR RH
 * - 선택된 값에 따라 #5006 내부([data-form-code="5006"])의 RR LH/RR RH 및 LH/RH 표기를 일괄 갱신 (GEMINI.md 원칙 2·8·10·11·12·13)
 */

export const F5006_EQUIP_OPTIONS = [
  { key: 'LH', label: 'RR LH', side: 'LH' },
  { key: 'RH', label: 'RR RH', side: 'RH' }
];

export const F5006_DEFAULT_EQUIP_KEY = 'LH';

/**
 * 저장 키(`LH`, `RH`, 구버전 `LH_1`/`RH_1` 등) 또는 라벨(`RR LH`, `RR RH` 등)로부터 메타 정보를 반환한다.
 * @param {string} [raw]
 */
export function getF5006EquipInfo(raw) {
  if (raw) {
    const trimmed = String(raw).trim();
    const exact = F5006_EQUIP_OPTIONS.find(
      opt => opt.key === trimmed || opt.label === trimmed
    );
    if (exact) return exact;
    if (trimmed.includes('RH')) return F5006_EQUIP_OPTIONS[1];
    if (trimmed.includes('LH')) return F5006_EQUIP_OPTIONS[0];
  }
  return F5006_EQUIP_OPTIONS[0];
}

/**
 * 현재 화면 DOM / 기존 저장 데이터에서 선택된 방향(LH / RH)을 판별한다.
 * (구버전 일보 호환: RH LOT만 입력되어 있으면 RH로 복원)
 * @param {Object|null} existingData
 * @param {HTMLElement|null} [container]
 * @param {Object|null} [extraMap]
 */
export function resolveF5006Equip(existingData = null, container = null, extraMap = null) {
  const domVal = container?.querySelector?.('#f5006_selected_equip')?.value
    || container?.querySelector?.('#f5006_equip_dim')?.value
    || container?.querySelector?.('#f5006_equip_qty')?.value;

  const candidate = extraMap?.f5006_selected_equip
    || extraMap?.f5006_equip_dim
    || extraMap?.f5006_equip_qty
    || domVal
    || existingData?.materialLots?.f5006_selected_equip
    || existingData?.dimData?.f5006_equip_dim
    || existingData?.qtyTable?.f5006_equip_qty;

  if (candidate) return getF5006EquipInfo(candidate);

  // 과거 저장본(LH/RH 분리 키 사용 시절) 하위 호환 추론
  const lots = existingData?.materialLots || extraMap || {};
  const hasRhLot = Boolean(lots['f5006_RR_RH_A_초물'] || lots['f5006_RR_RH_B_초물']);
  const hasLhLot = Boolean(lots['f5006_RR_LH_A_초물'] || lots['f5006_RR_LH_B_초물']);
  if (hasRhLot && !hasLhLot) return getF5006EquipInfo('RH');

  return getF5006EquipInfo(F5006_DEFAULT_EQUIP_KEY);
}

/**
 * #5006 루트 범위 내부의 [data-form-code="5006"] 요소들만 스코프 조회하여
 * RR LH / RR RH 및 방향(LH / RH) 표기를 즉시 동기화한다.
 *
 * @param {HTMLElement} rootScope  폼 컨테이너(#mobileWorkReportForm 등)
 * @param {string} equipKey        선택할 키 ('LH' | 'RH')
 * @param {Function|null} [bindNumberWheelPicker]
 */
export function applyF5006EquipSelection(rootScope, equipKey, bindNumberWheelPicker = null) {
  if (!rootScope) return;
  const equip = getF5006EquipInfo(equipKey);

  // 1) 저장용 hidden 필드 동기화 (materialLots / dimData / qtyTable)
  ['#f5006_selected_equip', '#f5006_equip_dim', '#f5006_equip_qty'].forEach(sel => {
    const input = rootScope.querySelector(`${sel}[data-form-code="5006"]`);
    if (input) input.value = equip.key;
  });

  // 2) 4번 섹션 LH / RH 선택 버튼 활성 상태 갱신
  rootScope.querySelectorAll('button.f5006-equip-btn[data-form-code="5006"]').forEach(btn => {
    const isActive = btn.dataset.equipKey === equip.key;
    btn.classList.toggle('is-active', isActive);
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  // 3) RR LH / RR RH 라벨 갱신 (4번 LOT 상단 헤더, 8번 생산실적 상단 헤더)
  rootScope.querySelectorAll('[data-form-code="5006"][data-f5006-equip-label="1"]').forEach(el => {
    el.textContent = equip.label;
  });

  // 4) 4번 LOT 표의 A, B 행 라벨 갱신 (LH A / LH B 또는 RH A / RH B)
  rootScope.querySelectorAll('[data-form-code="5006"][data-f5006-lot-row]').forEach(el => {
    const rowCode = el.dataset.f5006LotRow;
    if (rowCode) el.textContent = `${equip.side} ${rowCode}`;
  });

  // 5) 방향(LH / RH) 단독 표기 갱신 (6번 사출온도 행 라벨, 8번 공정간불량 열 헤더)
  rootScope.querySelectorAll('[data-form-code="5006"][data-f5006-side-label="1"]').forEach(el => {
    el.textContent = equip.side;
  });

  // 6) 6번 사출온도 휠 피커 모달 타이틀 동기화
  rootScope.querySelectorAll('input[data-form-code="5006"][data-f5006-temp="1"]').forEach(input => {
    const modeLabel = input.dataset.f5006TempMode || '';
    const rowNum = input.dataset.f5006TempIdx || '';
    const zoneLabel = input.dataset.f5006TempZone || '';
    const title = `사출온도 ${modeLabel} ${equip.side} ${rowNum} - ${zoneLabel}`.trim();
    input.dataset.wheelTitle = title;
    if (bindNumberWheelPicker) {
      const spec = parseFloat(input.dataset.wheelParsedSpec) || 200;
      const range = parseFloat(input.dataset.wheelRange) || 80;
      const unit = input.dataset.wheelUnit ?? '℃';
      bindNumberWheelPicker(input, title, spec, range, unit);
    }
  });
}
