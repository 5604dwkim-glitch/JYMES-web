/**
 * 양식 고유 번호 #5004 (GM 9BQC / G/RUN / 조인트-FRT)
 * "작업 특이사항 (비가동 시간)" 전용 호기 설정 모듈
 *
 * - 호기 선택(`#downtimeEquip1~3`): `FRT LH` / `FRT RH` 2종
 * - 비가동 사유(`#downtimeReason*`)는 공통 기본 목록(`DOWNTIME_REASONS`) 그대로 사용
 *   (#5001/#5002 에서 전환되어 온 사유 목록 복원은 `restoreDefaultDowntimeReasonsIfNeeded` 가 먼저 처리)
 * - 양식 전용 로직은 이 파일에만 두고 공통 렌더러에서는 한 줄 위임 (GEMINI.md 원칙 8·9·13)
 */

export const F5004_DOWNTIME_EQUIPS = ['FRT LH', 'FRT RH'];

/**
 * #5004 전용 비가동 호기 드롭다운 적용
 * @param {HTMLElement} container
 * @param {HTMLElement|null} downtimeCard `#downtimeCard`
 * @param {Object|null} existingData
 */
export function applyF5004DowntimeSection(container, downtimeCard, existingData = null) {
  if (!container) return;
  if (downtimeCard) downtimeCard.style.display = 'block';

  const titleLabel = container.querySelector('#downtimeTitleLabel');
  if (titleLabel) {
    titleLabel.innerHTML = '📝 <span class="sec-num"></span> 작업 특이사항';
  }

  const isEditing5004 = Boolean(existingData && Number(existingData.formCode) === 5004);
  [1, 2, 3].forEach(num => {
    const select = container.querySelector(`#downtimeEquip${num}`);
    if (!select) return;

    const savedVal = isEditing5004 ? String(existingData[`downtimeEquip${num}`] || '').trim() : '';
    const optionsList = [...F5004_DOWNTIME_EQUIPS];
    if (savedVal && !optionsList.includes(savedVal)) {
      optionsList.push(savedVal);
    }
    const curVal = F5004_DOWNTIME_EQUIPS.includes(select.value)
      ? select.value
      : (optionsList.includes(savedVal) ? savedVal : '');

    select.innerHTML =
      `<option value=""${curVal === '' ? ' selected' : ''}>호기 선택</option>` +
      optionsList.map(opt => {
        const esc = opt.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        return `<option value="${esc}"${curVal === opt ? ' selected' : ''}>${esc}</option>`;
      }).join('');
    select.value = curVal;
  });
}
