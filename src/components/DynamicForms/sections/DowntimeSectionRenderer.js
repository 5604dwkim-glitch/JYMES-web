import { DOWNTIME_REASONS } from '../../../constants/masterData.js';
import { applyF5001DowntimeSection, restoreDefaultDowntimeReasonsIfNeeded } from '../forms/f5001/downtimeSection.js';
import { applyF5002DowntimeSection } from '../forms/f5002/downtimeSection.js';
import { applyF5003DowntimeSection } from '../forms/f5003/downtimeSection.js';
import { applyF5004DowntimeSection } from '../forms/f5004/downtimeSection.js';
import { applyF5005DowntimeSection } from '../forms/f5005/downtimeSection.js';
import { applyF5006DowntimeSection } from '../forms/f5006/downtimeSection.js';
import { applyF5007DowntimeSection } from '../forms/f5007/downtimeSection.js';
import { applyF5011DowntimeSection } from '../forms/f5011/downtimeSection.js';
import { applyF5012DowntimeSection } from '../forms/f5012/downtimeSection.js';
import { applyF5014DowntimeSection } from '../forms/f5014/downtimeSection.js';

/**
 * 비가동 시간 섹션 업데이트
 * ctx: { container, processValue, existingData, getCurrentFormCode }
 */
export function updateDowntimeSection(ctx) {
  const { container, processValue, existingData, getCurrentFormCode, carModelValue, currentCarCode } = ctx;
    const curProc = processValue ? processValue.value : '';
    const downtimeCard = container.querySelector('#downtimeCard');
    const formCode = getCurrentFormCode();

    if (!curProc) {
      if (downtimeCard) downtimeCard.style.display = 'none';
      return;
    }

    if (formCode === 5001) {
      applyF5001DowntimeSection(container, downtimeCard, existingData);
      return;
    }
    if (formCode === 5002) {
      applyF5002DowntimeSection(container, downtimeCard, existingData);
      return;
    }
    if (formCode === 5003) {
      restoreDefaultDowntimeReasonsIfNeeded(container, downtimeCard, DOWNTIME_REASONS, existingData);
      applyF5003DowntimeSection(container, downtimeCard, existingData);
      return;
    }
    if (formCode === 5004) {
      restoreDefaultDowntimeReasonsIfNeeded(container, downtimeCard, DOWNTIME_REASONS, existingData);
      applyF5004DowntimeSection(container, downtimeCard, existingData);
      return;
    }
    if (formCode === 5005) {
      restoreDefaultDowntimeReasonsIfNeeded(container, downtimeCard, DOWNTIME_REASONS, existingData);
      applyF5005DowntimeSection(container, downtimeCard, existingData);
      return;
    }
    if (formCode === 5006) {
      restoreDefaultDowntimeReasonsIfNeeded(container, downtimeCard, DOWNTIME_REASONS, existingData);
      applyF5006DowntimeSection(container, downtimeCard, existingData);
      return;
    }
    if (formCode === 5007) {
      restoreDefaultDowntimeReasonsIfNeeded(container, downtimeCard, DOWNTIME_REASONS, existingData);
      applyF5007DowntimeSection(container, downtimeCard, existingData);
      return;
    }
    if (formCode === 5011) {
      restoreDefaultDowntimeReasonsIfNeeded(container, downtimeCard, DOWNTIME_REASONS, existingData);
      applyF5011DowntimeSection(container, downtimeCard, existingData);
      return;
    }
    if (formCode === 5012) {
      restoreDefaultDowntimeReasonsIfNeeded(container, downtimeCard, DOWNTIME_REASONS, existingData);
      applyF5012DowntimeSection(container, downtimeCard, existingData);
      return;
    }
    if (formCode === 5014) {
      restoreDefaultDowntimeReasonsIfNeeded(container, downtimeCard, DOWNTIME_REASONS, existingData);
      applyF5014DowntimeSection(container, downtimeCard, existingData);
      return;
    }
    restoreDefaultDowntimeReasonsIfNeeded(container, downtimeCard, DOWNTIME_REASONS, existingData);

    if (formCode === 1021 || formCode === 1041 || formCode === 4013 || formCode === 4014 || formCode === 4004 || (curProc === '후가공' || curProc === '검사포장' || curProc === '검사/포장')) {
      if (downtimeCard) downtimeCard.style.display = 'none';
      return;
    } else {
      if (downtimeCard) downtimeCard.style.display = 'block';
    }

    const isJoint = curProc === '조인트' || curProc === '조인트 V부' || curProc.includes('조인트');

    // 1. 비가동 라벨 타이틀 렌더링
    const titleLabel = container.querySelector('#downtimeTitleLabel');
    if (titleLabel) {
      titleLabel.innerHTML = '📝 <span class="sec-num"></span> 작업 특이사항';
    }

    // 2. 호기 드롭다운 옵션 변경
    const curCarCode = carModelValue ? carModelValue.value : currentCarCode;
    
    const dtCrewJointEquipOptions = ['LH R(직각)', 'LH S(둔각)', 'LH T(직선)', 'RH R(직각)', 'RH S(둔각)', 'RH T(직선)'];
    const fourNumEquipOptions = ['1호', '2호', '3호', '4호'];
    const threeNumEquipOptions = ['1호', '2호', '3호'];
    const prepCutEquipOptions = ['단컷팅1호', '단컷팅2호'];
    const stdJointEquipOptions = ['FRT P', 'FRT Q', 'RR R', 'RR S LH', 'RR S RH'];
    const stdEquipOptions = ['단컷팅', '펀칭기1호', '펀칭기2호'];
    const kmkxClipEquipOptions = ['전용 클립머신'];
    const kmkxJointEquipOptions = ['LH 1호', 'RH 1호', 'LH 2호', 'RH 2호'];
    const lhRhEquipOptions = ['LH', 'RH'];
    const ne1aPrepEquipOptions = ['정치절단', '단컷팅 A', '단컷팅 C', '단컷팅 D'];

    const targetOptions = (formCode === 3001)
      ? ne1aPrepEquipOptions
      : (formCode === 1011 || formCode === 1022)
      ? lhRhEquipOptions
      : (formCode === 2041)
        ? kmkxClipEquipOptions
        : (formCode === 2042)
          ? kmkxJointEquipOptions
        : (formCode === 2001 || formCode === 2025)
          ? fourNumEquipOptions
          : (formCode === 2011
            ? threeNumEquipOptions
            : (formCode === 2002 || formCode === 2012
              ? prepCutEquipOptions
              : ([2003, 2013, 2024, 2033].includes(formCode) || (isJoint && ['DT CREW', 'DT QUAD', 'DS CREW', 'DS STD'].includes(curCarCode))
                ? dtCrewJointEquipOptions
                : (isJoint ? stdJointEquipOptions : stdEquipOptions))));

    [1, 2, 3].forEach(num => {
      const select = container.querySelector(`#downtimeEquip${num}`);
      if (!select) return;

      if (formCode === 2041) {
        select.innerHTML = `<option value="전용 클립머신" selected>전용 클립머신</option>`;
        select.value = '전용 클립머신';
      } else if (formCode === 4001) {
        select.innerHTML = `<option value="정치 절단기" selected>정치 절단기</option>`;
        select.value = '정치 절단기';
      } else if (formCode === 4002) {
        const currentVal = select.value;
        const opts = ['LH X부', 'LH Y부', 'RH X부', 'RH Y부'];
        select.innerHTML = `<option value="">호기 선택</option>` + opts.map(opt => `<option value="${opt}" ${currentVal === opt ? 'selected' : ''}>${opt}</option>`).join('');
        const savedVal = existingData ? existingData[`downtimeEquip${num}`] : '';
        if (savedVal && opts.includes(savedVal)) select.value = savedVal;
      } else {
        const currentVal = select.value;
        select.innerHTML = `<option value="">호기 선택</option>` +
          targetOptions.map(opt => `<option value="${opt}" ${currentVal === opt ? 'selected' : ''}>${opt}</option>`).join('');

        // 기존 저장 데이터 반영
        const savedVal = existingData ? existingData[`downtimeEquip${num}`] : '';
        if (savedVal && targetOptions.includes(savedVal)) {
          select.value = savedVal;
        }
      }
    });
}
