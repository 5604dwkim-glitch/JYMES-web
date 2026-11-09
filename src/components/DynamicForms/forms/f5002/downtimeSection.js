/**
 * 양식 고유 번호 #5002 (GM 9BQC / G/RUN / 소재준비-정치절단)
 * "7. 작업 특이사항 (비가동 시간)" 전용 호기·사유 설정 모듈
 *
 * - 호기 선택(`#downtimeEquip1~3`): `정치절단` 단일 항목 고정
 * - 비가동 사유(`#downtimeReason`, `#downtimeReason2`, `#downtimeReason3`): `소재 불량` / `소재 없음` / `설비 이상` 3종
 * - 다른 양식으로 전환 시 기본 `DOWNTIME_REASONS` 로 즉시 복원 가능하도록 `data-custom-reasons-form="5002"` 표식 관리 (GEMINI.md 원칙 2·8·13)
 */

export const F5002_DOWNTIME_EQUIP = '정치절단';

export const F5002_DOWNTIME_REASONS = [
  '소재 불량',
  '소재 없음',
  '설비 이상'
];

/**
 * #5002 전용 비가동 호기 및 사유 드롭다운 적용
 * @param {HTMLElement} container
 * @param {HTMLElement|null} downtimeCard `#downtimeCard`
 * @param {Object|null} existingData
 */
export function applyF5002DowntimeSection(container, downtimeCard, existingData = null) {
  if (!container) return;
  if (downtimeCard) {
    downtimeCard.style.display = 'block';
    downtimeCard.dataset.customReasonsForm = '5002';
  }

  const titleLabel = container.querySelector('#downtimeTitleLabel');
  if (titleLabel) {
    titleLabel.innerHTML = '📝 <span class="sec-num"></span> 작업 특이사항';
  }

  // 1~3차 호기 선택: 정치절단 단일 항목
  [1, 2, 3].forEach(num => {
    const equipSelect = container.querySelector(`#downtimeEquip${num}`);
    if (!equipSelect) return;
    equipSelect.innerHTML = `<option value="${F5002_DOWNTIME_EQUIP}" selected>${F5002_DOWNTIME_EQUIP}</option>`;
    equipSelect.value = F5002_DOWNTIME_EQUIP;
  });

  // 1~3차 비가동 사유: 소재 불량 / 소재 없음 / 설비 이상
  const reasonConfigs = [
    {
      id: 'downtimeReason',
      emptyLabel: '사유 없음 (정상가동)',
      emptyI18n: ' data-i18n="downtime_none"',
      saved: existingData ? (existingData.downtimeReason1 ?? existingData.downtimeReason ?? '') : ''
    },
    {
      id: 'downtimeReason2',
      emptyLabel: '추가 사유 선택',
      emptyI18n: '',
      saved: existingData?.downtimeReason2 ?? ''
    },
    {
      id: 'downtimeReason3',
      emptyLabel: '추가 사유 선택',
      emptyI18n: '',
      saved: existingData?.downtimeReason3 ?? ''
    }
  ];

  reasonConfigs.forEach(cfg => {
    const sel = container.querySelector(`#${cfg.id}`);
    if (!sel) return;
    const curVal = sel.value;
    const activeVal = F5002_DOWNTIME_REASONS.includes(curVal)
      ? curVal
      : (F5002_DOWNTIME_REASONS.includes(cfg.saved) ? cfg.saved : '');

    sel.innerHTML =
      `<option value=""${cfg.emptyI18n}${activeVal === '' ? ' selected' : ''}>${cfg.emptyLabel}</option>` +
      F5002_DOWNTIME_REASONS.map(
        r => `<option value="${r}"${activeVal === r ? ' selected' : ''}>${r}</option>`
      ).join('');
    sel.value = activeVal;
  });
}
