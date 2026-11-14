/**
 * 양식 고유 번호 #1052 (제네시스 / JG1 / FRUNK / 조인트)
 * "8. 작업 특이사항 (비가동 시간)" 전용 호기 설정 모듈
 *
 * - 호기 선택(`#downtimeEquip1~3`): `열융착기` 단일 항목 고정
 * - 비가동 사유(`#downtimeReason*`)는 공통 기본 목록(`DOWNTIME_REASONS`) 그대로 사용
 * - 양식 전용 로직은 이 파일에만 두고 공통 렌더러에서는 한 줄 위임 (GEMINI.md 원칙 8·9·11·13)
 */

export const F1052_DOWNTIME_EQUIP = '열융착기';

/**
 * #1052 전용 비가동 호기 드롭다운 적용
 * @param {HTMLElement} container
 * @param {HTMLElement|null} downtimeCard `#downtimeCard`
 * @param {Object|null} [existingData]
 */
export function applyF1052DowntimeSection(container, downtimeCard, existingData = null) {
  if (!container) return;
  if (downtimeCard) {
    downtimeCard.style.display = 'block';
  }

  const titleLabel = container.querySelector('#downtimeTitleLabel');
  if (titleLabel) {
    titleLabel.innerHTML = '📝 <span class="sec-num"></span> 작업 특이사항';
  }

  const isEditing1052 = Boolean(existingData && Number(existingData.formCode) === 1052);
  [1, 2, 3].forEach(num => {
    const equipSelect = container.querySelector(`#downtimeEquip${num}`);
    if (!equipSelect) return;

    const savedVal = isEditing1052 ? String(existingData[`downtimeEquip${num}`] || '').trim() : '';
    if (savedVal && savedVal !== F1052_DOWNTIME_EQUIP) {
      const esc = savedVal.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      equipSelect.innerHTML =
        `<option value="${F1052_DOWNTIME_EQUIP}">${F1052_DOWNTIME_EQUIP}</option>` +
        `<option value="${esc}" selected>${esc}</option>`;
      equipSelect.value = savedVal;
    } else {
      equipSelect.innerHTML = `<option value="${F1052_DOWNTIME_EQUIP}" selected>${F1052_DOWNTIME_EQUIP}</option>`;
      equipSelect.value = F1052_DOWNTIME_EQUIP;
    }
  });
}
