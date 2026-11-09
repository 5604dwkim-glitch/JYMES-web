/**
 * 양식 고유 번호 #5011 (GM 9BQC / G/RUN / 검사포장-FRT)
 * "8. 비가동 시간" 항목 전체 삭제(숨김) 전용 모듈
 *
 * - #5011 양식에서는 비가동 시간 카드(`#downtimeCard`) 전체를 비표시(`display: none`) 처리한다.
 * - 다른 양식에서 #5011 로 전환한 경우 잔여 비가동 입력값이 저장되지 않도록 초기화하고,
 *   상세조회/인쇄 시 숨김 카드의 `.sec-num` 번호 밀림을 방지하기 위해 `#downtimeTitleLabel` 도 비운다.
 * - 양식 전용 로직은 이 파일에만 두고 공통 렌더러에서는 한 줄 위임 (GEMINI.md 원칙 8·9·11·13)
 */

/**
 * #5011 비가동 시간 카드 전체 숨김 및 잔여 입력값 초기화
 * @param {HTMLElement} container
 * @param {HTMLElement|null} downtimeCard `#downtimeCard`
 * @param {Object|null} [existingData]
 */
export function applyF5011DowntimeSection(container, downtimeCard, existingData = null) {
  if (downtimeCard) {
    downtimeCard.style.display = 'none';
  }
  if (!container) return;

  const titleLabel = container.querySelector('#downtimeTitleLabel');
  if (titleLabel) {
    titleLabel.innerHTML = '';
  }

  if (!existingData) {
    ['#downtimeMinutes', '#downtimeMinutes2', '#downtimeMinutes3'].forEach(sel => {
      const el = container.querySelector(sel);
      if (el) el.value = '0';
    });

    [
      '#downtimeEquip1',
      '#downtimeEquip2',
      '#downtimeEquip3',
      '#downtimeReason',
      '#downtimeReason2',
      '#downtimeReason3'
    ].forEach(sel => {
      const el = container.querySelector(sel);
      if (el) el.value = '';
    });
  }
}
