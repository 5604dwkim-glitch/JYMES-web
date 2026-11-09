/**
 * 양식 고유 번호 #5001 (GM 9BQC / G/RUN / 소재준비-글라스본딩)
 * "8. 작업 특이사항 (비가동 시간)" 전용 호기·사유 설정 모듈
 *
 * - 호기 선택(`#downtimeEquip1~3`): `로봇본딩기` 단일 항목 고정
 * - 비가동 사유(`#downtimeReason`, `#downtimeReason2`, `#downtimeReason3`): `재료 불량` / `재료 없음` / `설비 고장` 3종
 * - 다른 양식으로 전환 시 기본 `DOWNTIME_REASONS` 로 즉시 복원 가능하도록 `data-custom-reasons-form="5001"` 표식 관리 (GEMINI.md 원칙 2·8·13)
 */

export const F5001_DOWNTIME_EQUIP = '로봇본딩기';

export const F5001_DOWNTIME_REASONS = [
  '재료 불량',
  '재료 없음',
  '설비 고장'
];

/**
 * #5001 전용 비가동 호기 및 사유 드롭다운 적용
 * @param {HTMLElement} container
 * @param {HTMLElement|null} downtimeCard `#downtimeCard`
 * @param {Object|null} existingData
 */
export function applyF5001DowntimeSection(container, downtimeCard, existingData = null) {
  if (!container) return;
  if (downtimeCard) {
    downtimeCard.style.display = 'block';
    downtimeCard.dataset.customReasonsForm = '5001';
  }

  const titleLabel = container.querySelector('#downtimeTitleLabel');
  if (titleLabel) {
    titleLabel.innerHTML = '📝 <span class="sec-num"></span> 작업 특이사항';
  }

  // 1~3차 호기 선택: 로봇본딩기 단일 항목
  [1, 2, 3].forEach(num => {
    const equipSelect = container.querySelector(`#downtimeEquip${num}`);
    if (!equipSelect) return;
    equipSelect.innerHTML = `<option value="${F5001_DOWNTIME_EQUIP}" selected>${F5001_DOWNTIME_EQUIP}</option>`;
    equipSelect.value = F5001_DOWNTIME_EQUIP;
  });

  // 1~3차 비가동 사유: 재료 불량 / 재료 없음 / 설비 고장
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
    const activeVal = F5001_DOWNTIME_REASONS.includes(curVal)
      ? curVal
      : (F5001_DOWNTIME_REASONS.includes(cfg.saved) ? cfg.saved : '');

    sel.innerHTML =
      `<option value=""${cfg.emptyI18n}${activeVal === '' ? ' selected' : ''}>${cfg.emptyLabel}</option>` +
      F5001_DOWNTIME_REASONS.map(
        r => `<option value="${r}"${activeVal === r ? ' selected' : ''}>${r}</option>`
      ).join('');
    sel.value = activeVal;
  });
}

/**
 * #5001 에서 다른 양식으로 전환할 때 사유 드롭다운을 공통 기본 목록(`DOWNTIME_REASONS`)으로 복원한다.
 * @param {HTMLElement} container
 * @param {HTMLElement|null} downtimeCard
 * @param {Array<{name: string}>} defaultReasons
 * @param {Object|null} existingData
 */
export function restoreDefaultDowntimeReasonsIfNeeded(container, downtimeCard, defaultReasons = [], existingData = null) {
  if (!downtimeCard || !downtimeCard.dataset.customReasonsForm) return;
  delete downtimeCard.dataset.customReasonsForm;

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

  const validNames = defaultReasons.map(dr => dr.name);
  reasonConfigs.forEach(cfg => {
    const sel = container.querySelector(`#${cfg.id}`);
    if (!sel) return;
    const activeVal = validNames.includes(cfg.saved) ? cfg.saved : '';
    sel.innerHTML =
      `<option value=""${cfg.emptyI18n}${activeVal === '' ? ' selected' : ''}>${cfg.emptyLabel}</option>` +
      defaultReasons.map(
        dr => `<option value="${dr.name}"${activeVal === dr.name ? ' selected' : ''}>${dr.name}</option>`
      ).join('');
    sel.value = activeVal;
  });
}
