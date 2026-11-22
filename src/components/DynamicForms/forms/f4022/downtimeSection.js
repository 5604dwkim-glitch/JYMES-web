/**
 * 양식 고유 번호 #4022 (LQ2a / HOOD SIDE / 조인트)
 * "작업 특이사항 (비가동 시간)" 전용 호기 설정 모듈
 *
 * - 호기 선택(`#downtimeEquip1~3`): `X부(L/R)`, `LH Y부`, `RH Y부` 3종
 * - #4022 가류온도/타수 표(3열: X부(L/R), LH Y부, RH Y부)와 호기 목록을 일치시켜 금형 자동매칭 오류를 방지한다.
 * - 양식 전용 로직은 이 파일에만 두고 공통 렌더러에서는 한 줄 위임 (GEMINI.md 원칙 8·9·13)
 */

export const F4022_DOWNTIME_EQUIPS = ['X부(L/R)', 'LH Y부', 'RH Y부'];

/**
 * #4022 전용 비가동 호기 드롭다운 적용
 * @param {HTMLElement} container
 * @param {HTMLElement|null} downtimeCard `#downtimeCard`
 * @param {Object|null} existingData
 */
export function applyF4022DowntimeSection(container, downtimeCard, existingData = null) {
  if (!container) return;
  if (downtimeCard) downtimeCard.style.display = 'block';

  const titleLabel = container.querySelector('#downtimeTitleLabel');
  if (titleLabel) {
    titleLabel.innerHTML = '📝 <span class="sec-num"></span> 작업 특이사항';
  }

  const isEditing4022 = Boolean(existingData && Number(existingData.formCode) === 4022);
  [1, 2, 3].forEach((num) => {
    const select = container.querySelector(`#downtimeEquip${num}`);
    if (!select) return;

    const savedVal = isEditing4022 ? String(existingData[`downtimeEquip${num}`] || '').trim() : '';
    const optionsList = [...F4022_DOWNTIME_EQUIPS];
    if (savedVal && !optionsList.includes(savedVal)) {
      optionsList.push(savedVal);
    }
    const curVal = F4022_DOWNTIME_EQUIPS.includes(select.value)
      ? select.value
      : (optionsList.includes(savedVal) ? savedVal : '');

    select.innerHTML =
      `<option value=""${curVal === '' ? ' selected' : ''}>호기 선택</option>` +
      optionsList
        .map((opt) => {
          const esc = opt
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
          return `<option value="${esc}"${curVal === opt ? ' selected' : ''}>${esc}</option>`;
        })
        .join('');
    select.value = curVal;
  });
}
