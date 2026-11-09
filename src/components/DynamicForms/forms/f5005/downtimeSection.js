/**
 * 양식 고유 번호 #5005 (GM 9BQC / G/RUN / 조인트-RR R부)
 * "작업 특이사항 (비가동 시간)" 전용 호기 설정 모듈
 *
 * - 호기 선택(`#downtimeEquip1~3`): `2호기` / `3호기` 2종
 * - 비가동 사유(`#downtimeReason*`)는 공통 기본 목록(`DOWNTIME_REASONS`) 그대로 사용
 *   (#5001/#5002 에서 전환되어 온 사유 목록 복원은 `restoreDefaultDowntimeReasonsIfNeeded` 가 먼저 처리)
 * - 양식 전용 로직은 이 파일에만 두고 공통 렌더러에서는 한 줄 위임 (GEMINI.md 원칙 8·9·13)
 */

export const F5005_DOWNTIME_EQUIPS = ['2호기', '3호기'];

/**
 * #5005 전용 비가동 호기 드롭다운 적용
 * @param {HTMLElement} container
 * @param {HTMLElement|null} downtimeCard `#downtimeCard`
 * @param {Object|null} existingData
 */
export function applyF5005DowntimeSection(container, downtimeCard, existingData = null) {
  if (!container) return;
  if (downtimeCard) downtimeCard.style.display = 'block';

  const titleLabel = container.querySelector('#downtimeTitleLabel');
  if (titleLabel) {
    titleLabel.innerHTML = '📝 <span class="sec-num"></span> 작업 특이사항';
  }

  [1, 2, 3].forEach(num => {
    const select = container.querySelector(`#downtimeEquip${num}`);
    if (!select) return;

    const savedVal = existingData ? existingData[`downtimeEquip${num}`] : '';
    const curVal = F5005_DOWNTIME_EQUIPS.includes(select.value)
      ? select.value
      : (F5005_DOWNTIME_EQUIPS.includes(savedVal) ? savedVal : '');

    select.innerHTML =
      `<option value=""${curVal === '' ? ' selected' : ''}>호기 선택</option>` +
      F5005_DOWNTIME_EQUIPS.map(
        opt => `<option value="${opt}"${curVal === opt ? ' selected' : ''}>${opt}</option>`
      ).join('');
    select.value = curVal;
  });
}
