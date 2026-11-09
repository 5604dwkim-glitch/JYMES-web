/**
 * 조인트 공정 "금일 금형 타수" 가로형 카드 렌더러
 *
 * 상단 "설비 가류온도 & 가류시간 입력" 표(select[id^="vulc_mold_"], select[id^="vulc2_mold_"] 포함)와
 * 동일한 열 구조(<colgroup>, 구분, 부위, 금형 호기)를 복제하되,
 * 가류온도·가류시간 행을 모두 제외하고 "금일 금형 타수" 단일 입력 행으로 구성한다.
 *
 * GEMINI.md 준수 사항:
 * - 명시적 data-* 속성 사용 (data-joint-mold-stroke-card, data-wheel-skip="1", data-stroke-mold-mirror 등)
 * - 저장 키 하위 호환 100% 유지 (vulc_stroke_*, vulc2_stroke_* -> vulcTable / vulcTable2)
 * - section5 루트 내부로 스코프 한정된 이벤트 바인딩 및 중복 바인딩 방지 (data-stroke-sync-bound="1")
 */

function escapeAttr(val) {
  if (val === null || val === undefined) return '';
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function formatSideDisplay(lhChecked, rhChecked) {
  if (lhChecked && rhChecked) {
    return { text: 'LH / RH', color: '#0f172a' };
  }
  if (lhChecked) {
    return { text: 'LH', color: 'var(--accent-cyan)' };
  }
  if (rhChecked) {
    return { text: 'RH', color: 'var(--accent-emerald)' };
  }
  return { text: '-', color: '#94a3b8' };
}

function getSavedMoldFallback(moldSelectId, v, v2) {
  if (moldSelectId.startsWith('vulc2_mold_')) {
    const key = moldSelectId.replace('vulc2_', '');
    return v2[key] ?? v[key] ?? '';
  }
  const key = moldSelectId.replace('vulc_', '');
  if (key === 'mold_1') return v.mold_1 ?? v.mold_R ?? '';
  if (key === 'mold_2') return v.mold_2 ?? v.mold_S ?? '';
  if (key === 'mold_3') return v.mold_3 ?? v.mold_T ?? '';
  return v[key] ?? '';
}

function getSavedStrokeValue(moldSelectId, v, v2) {
  if (moldSelectId.startsWith('vulc2_mold_')) {
    const strokeKey = moldSelectId.replace('vulc2_mold_', 'stroke_');
    return v2[strokeKey] ?? v[strokeKey] ?? '';
  }
  const strokeKey = moldSelectId.replace('vulc_mold_', 'stroke_');
  return v[strokeKey] ?? '';
}

function applyMoldMirrorState(mirrorEl, val) {
  const cleanVal = val ? String(val).trim() : '';
  mirrorEl.textContent = cleanVal || '-';
  mirrorEl.style.cssText = cleanVal
    ? 'min-height: 24px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; color: #0369a1; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 4px; padding: 2px 4px; box-sizing: border-box;'
    : 'min-height: 24px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #94a3b8; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 4px; padding: 2px 4px; box-sizing: border-box;';
}

export function renderJointMoldStrokeCard(section5, existingData) {
  if (!section5) return;

  const prevCard = section5.querySelector('[data-joint-mold-stroke-card="1"]');
  if (prevCard) prevCard.remove();

  const vulcTables = Array.from(section5.querySelectorAll('table')).filter((tbl) =>
    Boolean(tbl.querySelector('select[id^="vulc_mold_"], select[id^="vulc2_mold_"]'))
  );
  if (vulcTables.length === 0) return;

  const doc = section5.ownerDocument || document;
  const v = existingData?.vulcTable || existingData?.vulcData || {};
  const v2 = existingData?.vulcTable2 || existingData?.vulcData2 || {};

  const card = doc.createElement('div');
  card.className = 'card';
  card.setAttribute('data-joint-mold-stroke-card', '1');
  card.style.cssText = 'padding: 16px; margin-bottom: 16px;';

  const titleLabel = doc.createElement('label');
  titleLabel.style.cssText =
    'font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;';
  titleLabel.innerHTML = '🔄 <span class="sec-num"></span> 금일 금형 타수';
  card.appendChild(titleLabel);

  vulcTables.forEach((vulcTable, idx) => {
    const origThead = vulcTable.querySelector('thead');
    if (!origThead) return;

    const tableWrap = doc.createElement('div');
    tableWrap.style.cssText =
      idx < vulcTables.length - 1 ? 'overflow-x: auto; margin-bottom: 16px;' : 'overflow-x: auto;';

    const strokeTable = vulcTable.cloneNode(false);
    const origColgroup = vulcTable.querySelector('colgroup');
    if (origColgroup) {
      strokeTable.appendChild(origColgroup.cloneNode(true));
    }

    const thead = origThead.cloneNode(true);

    // 1) 상단 구분 셀의 LH/RH 체크박스(2003, 2024, 2033)를 읽기 전용 미러 배지로 변환
    const lhChkClone = thead.querySelector('input[type="checkbox"][id$="_lh_check"]');
    const rhChkClone = thead.querySelector('input[type="checkbox"][id$="_rh_check"]');
    if (lhChkClone || rhChkClone) {
      const sampleId = (lhChkClone || rhChkClone).getAttribute('id') || '';
      const pfx = sampleId.replace(/_(lh|rh)_check$/, '');
      const hostCell = (lhChkClone || rhChkClone).closest('th, td');
      if (hostCell && pfx) {
        const origLh = section5.querySelector(`#${pfx}_lh_check`);
        const origRh = section5.querySelector(`#${pfx}_rh_check`);
        const sideInfo = formatSideDisplay(Boolean(origLh?.checked), Boolean(origRh?.checked));
        hostCell.innerHTML = `<span data-stroke-mirror-side="${escapeAttr(pfx)}" style="font-weight: 800; font-size: 13px; color: ${sideInfo.color};">${sideInfo.text}</span>`;
      }
    }

    // 2) 고정 LH/RH 양식(2013)의 hidden input 중복 ID 제거
    thead.querySelectorAll('input[type="hidden"]').forEach((hiddenEl) => {
      hiddenEl.remove();
    });

    // 3) 동적 부위 헤더(vulc_th_R 등) 중복 ID 제거 및 미러 타겟 지정
    thead.querySelectorAll('[id]').forEach((el) => {
      if (el.tagName === 'SELECT') return;
      const origId = el.getAttribute('id');
      el.removeAttribute('id');
      if (origId) {
        el.setAttribute('data-stroke-mirror-th', origId);
      }
    });

    // 4) 좌측 라벨이 "금형선택"(4032)인 경우 읽기 전용 표시에 맞게 "금형 No. [ 호기 ]"로 정돈
    thead.querySelectorAll('td, th').forEach((cell) => {
      if (!cell.querySelector('select') && cell.textContent.trim() === '금형선택') {
        cell.textContent = '금형 No. [ 호기 ]';
      }
    });

    // 5) 금형 호기 <select>를 상단 선택값 자동 연동 미러 셀로 교체
    const moldSelectIds = [];
    thead.querySelectorAll('select[id^="vulc_mold_"], select[id^="vulc2_mold_"]').forEach((selClone) => {
      const moldSelectId = selClone.getAttribute('id');
      if (!moldSelectId) return;
      moldSelectIds.push(moldSelectId);

      const origSel = section5.querySelector(`#${moldSelectId}`);
      const initialVal = (origSel && origSel.value) || getSavedMoldFallback(moldSelectId, v, v2);

      const mirrorDiv = doc.createElement('div');
      mirrorDiv.setAttribute('data-stroke-mold-mirror', moldSelectId);
      applyMoldMirrorState(mirrorDiv, initialVal);
      selClone.parentNode.replaceChild(mirrorDiv, selClone);
    });

    if (moldSelectIds.length === 0) return;

    strokeTable.appendChild(thead);

    // 6) 가류온도·가류시간을 모두 제거하고 "금일 금형 타수" 단일 행 생성
    const isSlateTheme =
      origThead.innerHTML.includes('#f1f5f9') || origThead.innerHTML.includes('#e2e8f0');
    const labelBg = isSlateTheme ? '#f1f5f9' : '#fffde7';

    const tbody = doc.createElement('tbody');
    const strokeRow = doc.createElement('tr');

    const rowHeader = doc.createElement('th');
    rowHeader.setAttribute('scope', 'row');
    rowHeader.setAttribute('colspan', '2');
    rowHeader.style.cssText = `border: 1px solid #000; background: ${labelBg}; font-weight: 700; color: #000; padding: 6px 4px; vertical-align: middle;`;
    rowHeader.textContent = '금일 금형 타수';
    strokeRow.appendChild(rowHeader);

    moldSelectIds.forEach((moldSelectId) => {
      const strokeId = moldSelectId
        .replace('vulc_mold_', 'vulc_stroke_')
        .replace('vulc2_mold_', 'vulc2_stroke_');
      const strokeVal = getSavedStrokeValue(moldSelectId, v, v2);

      const td = doc.createElement('td');
      td.style.cssText = 'border: 1px solid #000; padding: 3px;';
      td.innerHTML = `<input type="number" min="0" inputmode="numeric" id="${escapeAttr(strokeId)}" data-wheel-skip="1" data-stroke-for="${escapeAttr(moldSelectId)}" class="form-control" style="width: 100%; height: 26px; text-align: center; font-size: 12px; font-weight: 700; padding: 2px; box-sizing: border-box;" value="${escapeAttr(strokeVal)}" placeholder="타수 입력" />`;
      strokeRow.appendChild(td);
    });

    tbody.appendChild(strokeRow);
    strokeTable.appendChild(tbody);
    tableWrap.appendChild(strokeTable);
    card.appendChild(tableWrap);
  });

  if (!card.querySelector('table')) return;

  section5.appendChild(card);

  // 7) 스코프 한정 실시간 동기화 이벤트 바인딩 (GEMINI.md 원칙 13)
  const syncMoldMirror = (moldSelectId) => {
    const origSel = section5.querySelector(`#${moldSelectId}`);
    const val = origSel ? origSel.value : '';
    card.querySelectorAll(`[data-stroke-mold-mirror="${moldSelectId}"]`).forEach((mirrorEl) => {
      applyMoldMirrorState(mirrorEl, val);
    });
  };

  section5
    .querySelectorAll('select[id^="vulc_mold_"], select[id^="vulc2_mold_"]')
    .forEach((origSel) => {
      if (origSel.dataset.strokeSyncBound === '1') return;
      origSel.dataset.strokeSyncBound = '1';
      origSel.addEventListener('change', () => {
        syncMoldMirror(origSel.id);
      });
    });

  ['vulc', 'vulc2'].forEach((pfx) => {
    const lhEl = section5.querySelector(`#${pfx}_lh_check`);
    const rhEl = section5.querySelector(`#${pfx}_rh_check`);
    if (!lhEl || !rhEl || lhEl.type !== 'checkbox' || rhEl.type !== 'checkbox') return;

    const syncSideAndHeaders = () => {
      const sideInfo = formatSideDisplay(lhEl.checked, rhEl.checked);
      card.querySelectorAll(`[data-stroke-mirror-side="${pfx}"]`).forEach((sideSpan) => {
        sideSpan.textContent = sideInfo.text;
        sideSpan.style.color = sideInfo.color;
      });

      card.querySelectorAll(`[data-stroke-mirror-th^="${pfx}_th_"]`).forEach((thMirror) => {
        const origThId = thMirror.getAttribute('data-stroke-mirror-th');
        const origTh = origThId ? section5.querySelector(`#${origThId}`) : null;
        if (origTh) {
          thMirror.textContent = origTh.textContent;
        }
      });

      ['R', 'S', 'T'].forEach((part) => {
        syncMoldMirror(`${pfx}_mold_${part}`);
      });
    };

    if (lhEl.dataset.strokeSideSyncBound !== '1') {
      lhEl.dataset.strokeSideSyncBound = '1';
      lhEl.addEventListener('change', syncSideAndHeaders);
    }
    if (rhEl.dataset.strokeSideSyncBound !== '1') {
      rhEl.dataset.strokeSideSyncBound = '1';
      rhEl.addEventListener('change', syncSideAndHeaders);
    }
  });
}
