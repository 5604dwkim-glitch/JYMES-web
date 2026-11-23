import { evaluateEquipmentDayTpm } from '../../../constants/tpmLogTemplate.js';
import { getEquipmentCategory } from '../../../constants/equipmentCategories.js';
import { fetchReportDowntimePhoto, fetchTodayTpmLogsByDate } from '../../../services/firestore.js';

export const JOINT_DOWNTIME_CATEGORIES = ['설비', '금형', '소재', '기타'];
export const JOINT_DOWNTIME_MATERIAL_OPTIONS = ['단면 불량', '소재결품'];

const CATEGORY_STYLE_MAP = {
  '설비': { bg: '#eff6ff', border: '#2563eb', text: '#1d4ed8', badgeBg: '#dbeafe' },
  '금형': { bg: '#f5f3ff', border: '#7c3aed', text: '#6d28d9', badgeBg: '#ede9fe' },
  '소재': { bg: '#fffbeb', border: '#d97706', text: '#b45309', badgeBg: '#fef3c7' },
  '기타': { bg: '#f1f5f9', border: '#475569', text: '#334155', badgeBg: '#e2e8f0' }
};

const containerStateMap = new WeakMap();

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getContainerState(container) {
  let st = containerStateMap.get(container);
  if (!st) {
    st = {
      items: [],
      ctx: null,
      existingSignature: '',
      tpmLogEquipmentIds: new Set(),
      tpmLogEquipmentCodes: new Set(),
      tpmFetchedDate: '',
      tpmFetchInflightDate: '',
      photoCache: new Map(),
      photoFetchingIds: new Set(),
      listenersBound: false,
      rootListenersBound: false
    };
    containerStateMap.set(container, st);
  }
  return st;
}

function getReportDateString(container, existingData) {
  const dateInput = container?.querySelector('#reportDate');
  const fromDom = String(dateInput?.value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(fromDom)) return fromDom;
  const fromExisting = String(existingData?.date || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(fromExisting)) return fromExisting;
  return '';
}

function parseYmd(dateStr) {
  const m = String(dateStr || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return {
    year: Number(m[1]),
    month: Number(m[2]),
    day: Number(m[3])
  };
}

function inferCategoryFromLegacyReason(reason, equip) {
  const text = `${reason || ''} ${equip || ''}`.trim();
  if (!text) return '';
  if (text.startsWith('[설비]')) return '설비';
  if (text.startsWith('[금형]')) return '금형';
  if (text.startsWith('[소재]')) return '소재';
  if (text.startsWith('[기타]')) return '기타';
  if (/금형|몰드|코어|파팅|핀|히터|센서|가류/.test(text)) return '금형';
  if (/소재|단면 불량|소재결품|원자재|고무|컴파운드|압출/.test(text)) return '소재';
  if (/설비|오류|이상|메탈|클램프|유압|실린더|plc|모터|펀칭|컷팅|조인트|프레스/i.test(text)) return '설비';
  return '기타';
}

function stripCategoryPrefix(reason, category) {
  const str = String(reason || '').trim();
  if (!str) return '';
  if (category && str.startsWith(`[${category}]`)) {
    return str.slice(category.length + 2).trim();
  }
  return str.replace(/^\[(설비|금형|소재|기타)\]\s*/, '').trim();
}

function createEmptyItem() {
  return {
    category: '',
    targetId: '',
    targetCode: '',
    targetName: '',
    detail: '',
    equip: '',
    reason: '',
    minutes: 0,
    photoId: '',
    hasPhoto: false,
    photoDataUrl: ''
  };
}

export function buildFormattedDowntimeFields(item) {
  const category = String(item?.category || '').trim();
  const detail = String(item?.detail || '').trim();
  const equip = String(item?.equip || '').trim();
  const minutes = Math.max(0, Math.round(Number(item?.minutes) || 0));

  let normalizedEquip = equip;
  let normalizedReason = '';

  if (category === '설비') {
    const label = detail || equip || String(item?.targetName || item?.targetCode || '').trim();
    normalizedEquip = normalizedEquip || label;
    normalizedReason = label ? `[설비] ${label}` : '[설비]';
  } else if (category === '금형') {
    const label = detail || equip || String(item?.targetCode || item?.targetName || '').trim();
    normalizedEquip = normalizedEquip || label;
    normalizedReason = label ? `[금형] ${label}` : '[금형]';
  } else if (category === '소재') {
    normalizedEquip = '';
    normalizedReason = detail ? `[소재] ${detail}` : '[소재]';
  } else if (category === '기타') {
    normalizedEquip = '';
    normalizedReason = detail ? `[기타] ${detail}` : '[기타]';
  } else {
    normalizedReason = String(item?.reason || detail || '').trim();
  }

  return {
    category,
    targetId: String(item?.targetId || '').trim(),
    targetCode: String(item?.targetCode || '').trim(),
    targetName: String(item?.targetName || '').trim(),
    detail,
    equip: normalizedEquip,
    reason: normalizedReason,
    minutes
  };
}

export function parseInitialDowntimeItems(existingData) {
  if (!existingData || typeof existingData !== 'object') {
    return [createEmptyItem()];
  }

  if (Array.isArray(existingData.downtimeItems) && existingData.downtimeItems.length > 0) {
    const parsed = existingData.downtimeItems
      .filter((it) => it && typeof it === 'object')
      .map((it) => {
        const category = String(it.category || '').trim() || inferCategoryFromLegacyReason(it.reason, it.equip);
        const detail = String(it.detail || '').trim() || stripCategoryPrefix(it.reason || it.equip || '', category);
        return {
          category,
          targetId: String(it.targetId || '').trim(),
          targetCode: String(it.targetCode || '').trim(),
          targetName: String(it.targetName || '').trim(),
          detail,
          equip: String(it.equip || '').trim(),
          reason: String(it.reason || '').trim(),
          minutes: Math.max(0, Math.round(Number(it.minutes) || 0)),
          photoId: String(it.photoId || '').trim(),
          hasPhoto: Boolean(it.hasPhoto || it.photoId || it.photoDataUrl),
          photoDataUrl: String(it.photoDataUrl || '')
        };
      });
    return parsed.length > 0 ? parsed : [createEmptyItem()];
  }

  const hasExplicitSlots =
    existingData.downtimeMinutes1 !== undefined ||
    existingData.downtimeMinutes2 !== undefined ||
    existingData.downtimeMinutes3 !== undefined;

  const legacySlots = [
    {
      minutes: Number(hasExplicitSlots ? existingData.downtimeMinutes1 : existingData.downtimeMinutes) || 0,
      equip: String(existingData.downtimeEquip1 || '').trim(),
      reason: String((hasExplicitSlots ? existingData.downtimeReason1 : existingData.downtimeReason) ?? existingData.downtimeReason ?? '').trim()
    },
    {
      minutes: Number(existingData.downtimeMinutes2) || 0,
      equip: String(existingData.downtimeEquip2 || '').trim(),
      reason: String(existingData.downtimeReason2 || '').trim()
    },
    {
      minutes: Number(existingData.downtimeMinutes3) || 0,
      equip: String(existingData.downtimeEquip3 || '').trim(),
      reason: String(existingData.downtimeReason3 || '').trim()
    }
  ];

  const items = legacySlots
    .filter((sl) => sl.minutes > 0 || sl.reason || sl.equip)
    .map((sl) => {
      const category = inferCategoryFromLegacyReason(sl.reason, sl.equip);
      const rawDetail = stripCategoryPrefix(sl.reason, category);
      const detail = rawDetail || sl.equip || '';
      return {
        category,
        targetId: '',
        targetCode: '',
        targetName: sl.equip || detail,
        detail,
        equip: sl.equip || '',
        reason: sl.reason || (sl.equip ? `[${category}] ${sl.equip}` : ''),
        minutes: Math.max(0, Math.round(sl.minutes)),
        photoId: '',
        hasPhoto: false,
        photoDataUrl: ''
      };
    });

  return items.length > 0 ? items : [createEmptyItem()];
}

function getColumnHeaderForCell(td) {
  const tr = td?.closest('tr');
  const table = tr?.closest('table');
  if (!tr || !table) return '';

  const cells = Array.from(tr.children);
  let colIdx = 0;
  for (const cell of cells) {
    if (cell === td) break;
    colIdx += Number(cell.colSpan) || 1;
  }

  const theadRow = table.querySelector('thead tr:last-child') || table.querySelector('thead tr');
  if (!theadRow) return '';

  const headers = Array.from(theadRow.children);
  let cursor = 0;
  for (const th of headers) {
    const span = Number(th.colSpan) || 1;
    if (colIdx >= cursor && colIdx < cursor + span) {
      return String(th.textContent || '').replace(/\s+/g, ' ').trim();
    }
    cursor += span;
  }
  return '';
}

function getSectionGroupTitleForSelect(sel) {
  const card = sel?.closest('.card, div[style*="border-bottom"]');
  const tableWrapper = sel?.closest('div');
  if (sel?.id?.startsWith('vulc2_mold_')) return '2차';
  const prevTitle = tableWrapper?.previousElementSibling?.textContent?.trim();
  if (prevTitle && prevTitle.length <= 24) return prevTitle.replace(/\s+/g, ' ');
  const cardLabel = card?.querySelector(':scope > label')?.textContent?.trim();
  if (cardLabel && cardLabel.length <= 30) return '';
  return '';
}

export function getTopSelectedMolds(container, allMolds = [], carCode = '', partName = '') {
  const sec5 = container?.querySelector('#section5DynamicContainer');
  const moldSelects = sec5
    ? Array.from(sec5.querySelectorAll('select[id^="vulc_mold_"], select[id^="vulc2_mold_"]'))
    : [];

  const hasSection5MoldSelects = moldSelects.length > 0;
  const options = [];
  const labelCounts = new Map();

  if (hasSection5MoldSelects) {
    const rawEntries = [];
    moldSelects.forEach((sel, idx) => {
      if (sel.disabled) return;
      const td = sel.closest('td');
      if (td && td.style.display === 'none') return;
      const tr = sel.closest('tr');
      if (tr && tr.style.display === 'none') return;

      const moldNo = String(sel.value || '').trim();
      if (!moldNo) return;

      const selectedOpt = sel.options?.[sel.selectedIndex];
      const moldId = String(selectedOpt?.dataset?.moldId || '').trim();
      const colHeader = getColumnHeaderForCell(td);
      const groupTitle = getSectionGroupTitleForSelect(sel);
      const firstCellText = tr?.querySelector('th, td:first-child');
      const rowLabel = firstCellText && !firstCellText.querySelector('select, input')
        ? String(firstCellText.textContent || '').replace(/\s+/g, ' ').trim()
        : '';

      const posParts = [];
      if (groupTitle && (!colHeader || !colHeader.includes(groupTitle))) posParts.push(groupTitle);
      if (rowLabel && (!colHeader || !colHeader.includes(rowLabel))) posParts.push(rowLabel);
      if (colHeader) posParts.push(colHeader);
      if (posParts.length === 0) posParts.push(`금형 ${idx + 1}`);

      const posLabel = posParts.join(' ');
      const baseDisplay = `${posLabel} · ${moldNo}`;
      labelCounts.set(baseDisplay, (labelCounts.get(baseDisplay) || 0) + 1);

      rawEntries.push({
        key: `${sel.id}::${moldNo}`,
        selectId: sel.id,
        moldId,
        moldNo,
        posLabel,
        baseDisplay
      });
    });

    const seenDisplay = new Map();
    rawEntries.forEach((entry) => {
      const totalSame = labelCounts.get(entry.baseDisplay) || 1;
      const nextNum = (seenDisplay.get(entry.baseDisplay) || 0) + 1;
      seenDisplay.set(entry.baseDisplay, nextNum);
      const displayLabel = totalSame > 1 ? `${entry.posLabel} #${nextNum} · ${entry.moldNo}` : entry.baseDisplay;
      const equipText = totalSame > 1 ? `${entry.posLabel} #${nextNum} (${entry.moldNo})` : `${entry.posLabel} (${entry.moldNo})`;

      options.push({
        value: entry.key,
        targetId: entry.moldId,
        targetCode: entry.moldNo,
        targetName: totalSame > 1 ? `${entry.posLabel} #${nextNum}` : entry.posLabel,
        equip: equipText,
        detail: equipText,
        displayLabel
      });
    });

    return {
      source: 'section5',
      hasSection5MoldSelects: true,
      options
    };
  }

  // 상단에 금형 선택칸이 없는 조인트 양식(1052, 5004, 5005, 5006 등)은 등록 금형 마스터에서 해당 차종/부위 금형 제공
  const normCar = String(carCode || '').trim().toUpperCase();
  const normPart = String(partName || '').trim().toUpperCase();
  const candidates = (allMolds || []).filter((m) => {
    if (!m || m.status === '폐기') return false;
    const cars = [
      String(m.carModel || '').toUpperCase(),
      ...(Array.isArray(m.carModels) ? m.carModels.map((c) => String(c || '').toUpperCase()) : [])
    ].filter(Boolean);
    if (normCar && cars.length > 0 && !cars.includes(normCar)) return false;
    return true;
  });

  const sortedCandidates = [...candidates].sort((a, b) => {
    const aPartMatch = normPart && String(a.partName || a.part || a.moldType || '').toUpperCase().includes(normPart) ? 0 : 1;
    const bPartMatch = normPart && String(b.partName || b.part || b.moldType || '').toUpperCase().includes(normPart) ? 0 : 1;
    if (aPartMatch !== bPartMatch) return aPartMatch - bPartMatch;
    return String(a.moldNumber || a.moldNo || a.code || a.name || '').localeCompare(String(b.moldNumber || b.moldNo || b.code || b.name || ''), 'ko');
  });

  const usedIds = new Set();
  sortedCandidates.forEach((m) => {
    const moldNo = String(m.moldNumber || m.moldNo || m.code || m.name || '').trim();
    if (!moldNo) return;
    const key = `master::${m.id || moldNo}`;
    if (usedIds.has(key)) return;
    usedIds.add(key);
    const typeLabel = String(m.moldType || m.partName || m.part || m.carModel || '금형').trim();
    const equipText = `${typeLabel} (${moldNo})`;
    options.push({
      value: key,
      targetId: String(m.id || '').trim(),
      targetCode: moldNo,
      targetName: typeLabel,
      equip: equipText,
      detail: equipText,
      displayLabel: `${typeLabel} · ${moldNo}`
    });
  });

  return {
    source: 'master',
    hasSection5MoldSelects: false,
    options
  };
}

export function getTpmWrittenEquipments(ctx, state, reportDateStr) {
  const equipments = Array.isArray(ctx?.equipments) ? ctx.equipments : [];
  const tpmSummary = (typeof ctx?.getTpmSummary === 'function' ? ctx.getTpmSummary() : null) || ctx?.existingData?.tpmCheckSummary || null;
  const parsedDate = parseYmd(reportDateStr);

  const eqById = new Map();
  const eqByCode = new Map();
  equipments.forEach((eq) => {
    if (!eq) return;
    if (eq.id) eqById.set(String(eq.id), eq);
    if (eq.code) eqByCode.set(String(eq.code).trim().toUpperCase(), eq);
  });

  const resultMap = new Map();

  const registerEquipment = (rawEq, sourcePriority = 1) => {
    if (!rawEq) return;
    const eqId = String(rawEq.id || '').trim();
    const eqCode = String(rawEq.code || '').trim();
    const fullEq = (eqId && eqById.get(eqId)) || (eqCode && eqByCode.get(eqCode.toUpperCase())) || rawEq;
    if (getEquipmentCategory(fullEq) === 'measuring') return;

    const mapKey = String(fullEq.id || eqCode || fullEq.name || '').trim();
    if (!mapKey || resultMap.has(mapKey)) return;

    const name = String(fullEq.name || '').trim();
    const code = String(fullEq.code || '').trim();
    const location = String(fullEq.location || '').trim();
    const equipText = code ? (name ? `${name} (${code})` : code) : name;
    const displayLabel = [code ? `[${code}]` : '', name || fullEq.type || '', location ? `- ${location}` : '']
      .filter(Boolean)
      .join(' ');

    resultMap.set(mapKey, {
      value: `eq::${mapKey}`,
      targetId: String(fullEq.id || '').trim(),
      targetCode: code,
      targetName: name || code,
      equip: equipText,
      detail: equipText,
      displayLabel: displayLabel || equipText,
      isJointCategory: getEquipmentCategory(fullEq) === 'joint',
      sourcePriority
    });
  };

  // 1) 현재 작업자가 방금 작성했거나 일보에 연결된 TPM 요약 설비
  if (tpmSummary && (!reportDateStr || !tpmSummary.reportDate || tpmSummary.reportDate === reportDateStr)) {
    if (Array.isArray(tpmSummary.equipments)) {
      tpmSummary.equipments.forEach((e) => registerEquipment(e, 0));
    }
    if (Array.isArray(tpmSummary.equipmentIds)) {
      tpmSummary.equipmentIds.forEach((id) => {
        const matched = eqById.get(String(id));
        if (matched) registerEquipment(matched, 0);
      });
    }
    if (Array.isArray(tpmSummary.equipmentCodes)) {
      tpmSummary.equipmentCodes.forEach((code) => {
        const norm = String(code || '').trim().toUpperCase();
        const matched = eqByCode.get(norm);
        if (matched) {
          registerEquipment(matched, 0);
        } else if (norm) {
          registerEquipment({ id: '', code: String(code).trim(), name: tpmSummary.setName ? `${tpmSummary.setName} ${code}` : String(code).trim() }, 0);
        }
      });
    }
  }

  // 2) Firestore tpm_logs 컬렉션에서 오늘(해당 일보 날짜) 작성 확인된 설비
  if (state) {
    state.tpmLogEquipmentIds?.forEach((id) => {
      const matched = eqById.get(String(id));
      if (matched) registerEquipment(matched, 1);
    });
    state.tpmLogEquipmentCodes?.forEach((code) => {
      const norm = String(code || '').trim().toUpperCase();
      const matched = eqByCode.get(norm);
      if (matched) {
        registerEquipment(matched, 1);
      } else if (norm) {
        registerEquipment({ id: '', code: String(code).trim(), name: String(code).trim() }, 1);
      }
    });
  }

  // 3) 설비 마스터 tpmLogs 내 해당 날짜 작업자 점검 기록 보유 설비
  if (parsedDate) {
    equipments.forEach((eq) => {
      if (!eq) return;
      if (getEquipmentCategory(eq) === 'measuring') return;
      const evalRes = evaluateEquipmentDayTpm(eq, parsedDate.year, parsedDate.month, parsedDate.day);
      if (evalRes?.hasWorkerRecord) {
        registerEquipment(eq, 2);
      }
    });
  }

  return Array.from(resultMap.values()).sort((a, b) => {
    if (a.isJointCategory !== b.isJointCategory) return a.isJointCategory ? -1 : 1;
    if (a.sourcePriority !== b.sourcePriority) return a.sourcePriority - b.sourcePriority;
    return a.displayLabel.localeCompare(b.displayLabel, 'ko');
  });
}

function resizeImageFileToDataUrl(file, maxSize = 960, quality = 0.72) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('파일이 없습니다.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('사진 파일을 읽을 수 없습니다.'));
    reader.onload = () => {
      const rawResult = String(reader.result || '');
      const img = new Image();
      img.onerror = () => resolve(rawResult);
      img.onload = () => {
        try {
          let { width, height } = img;
          if (!width || !height) {
            resolve(rawResult);
            return;
          }
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
            width = Math.max(1, Math.round(width * ratio));
            height = Math.max(1, Math.round(height * ratio));
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawResult);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } catch {
          resolve(rawResult);
        }
      };
      img.src = rawResult;
    };
    reader.readAsDataURL(file);
  });
}

function openPhotoLightbox(srcUrl, titleText = '비가동 현장 사진') {
  if (!srcUrl || typeof document === 'undefined') return;
  const overlay = document.createElement('div');
  overlay.style.cssText = [
    'position: fixed',
    'inset: 0',
    'z-index: 99999',
    'background: rgba(15, 23, 42, 0.84)',
    'display: flex',
    'flex-direction: column',
    'align-items: center',
    'justify-content: center',
    'padding: 16px'
  ].join(';');

  overlay.innerHTML = `
    <div style="width:100%;max-width:680px;display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;color:#fff;">
      <span style="font-size:14px;font-weight:700;">${escapeHtml(titleText)}</span>
      <button type="button" data-close-lightbox="1" style="background:rgba(255,255,255,0.16);color:#fff;border:1px solid rgba(255,255,255,0.3);border-radius:8px;padding:6px 12px;font-size:13px;font-weight:700;cursor:pointer;">닫기</button>
    </div>
    <img src="${escapeHtml(srcUrl)}" alt="${escapeHtml(titleText)}" style="max-width:100%;max-height:80vh;border-radius:10px;object-fit:contain;background:#0f172a;box-shadow:0 12px 32px rgba(0,0,0,0.45);" />
  `;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target?.closest?.('[data-close-lightbox="1"]')) {
      overlay.remove();
    }
  });
  document.body.appendChild(overlay);
}

const SCOPED_STYLE_HTML = `<style data-jdt-style="1">
[data-joint-downtime-root="1"] {
  margin-bottom: 10px;
}
[data-joint-downtime-root="1"] .jdt-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
[data-joint-downtime-root="1"] .jdt-item-card {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 10px 11px;
  background: #f8fafc;
}
[data-joint-downtime-root="1"] .jdt-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 9px;
}
[data-joint-downtime-root="1"] .jdt-item-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 800;
  color: #1e293b;
}
[data-joint-downtime-root="1"] .jdt-min-badge {
  font-size: 11px;
  font-weight: 700;
  color: #dc2626;
  background: #fee2e2;
  padding: 2px 7px;
  border-radius: 999px;
}
[data-joint-downtime-root="1"] .jdt-remove-btn {
  padding: 3px 9px;
  font-size: 11px;
  font-weight: 700;
  color: #b91c1c;
  background: #fff;
  border: 1px solid #fca5a5;
  border-radius: 6px;
  cursor: pointer;
}
[data-joint-downtime-root="1"] .jdt-step-block {
  margin-bottom: 9px;
}
[data-joint-downtime-root="1"] .jdt-step-block:last-child {
  margin-bottom: 0;
}
[data-joint-downtime-root="1"] .jdt-step-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  margin-bottom: 5px;
}
[data-joint-downtime-root="1"] .jdt-step-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11.5px;
  font-weight: 700;
  color: #334155;
}
[data-joint-downtime-root="1"] .jdt-step-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  padding: 1px 6px;
  border-radius: 999px;
  background: #e2e8f0;
  color: #1e293b;
  font-size: 10px;
  font-weight: 800;
}
[data-joint-downtime-root="1"] .jdt-cat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}
[data-joint-downtime-root="1"] .jdt-cat-btn {
  padding: 8px 4px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 8px;
  border: 1.5px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  text-align: center;
  transition: all 0.12s ease;
}
[data-joint-downtime-root="1"] .jdt-mat-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
[data-joint-downtime-root="1"] .jdt-mat-btn {
  padding: 8px 10px;
  font-size: 12.5px;
  font-weight: 700;
  border-radius: 8px;
  border: 1.5px solid #cbd5e1;
  background: #ffffff;
  color: #475569;
  cursor: pointer;
  text-align: center;
}
[data-joint-downtime-root="1"] .jdt-mat-btn.is-active {
  background: #fffbeb;
  border-color: #d97706;
  color: #b45309;
  box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.14);
}
[data-joint-downtime-root="1"] .jdt-hint {
  font-size: 11px;
  color: #64748b;
  background: #ffffff;
  border: 1px dashed #cbd5e1;
  border-radius: 7px;
  padding: 7px 10px;
}
[data-joint-downtime-root="1"] .jdt-hint-warn {
  color: #b45309;
  background: #fffbeb;
  border-color: #fcd34d;
  margin-top: 5px;
}
[data-joint-downtime-root="1"] .jdt-tpm-btn {
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid #93c5fd;
  background: #eff6ff;
  color: #1d4ed8;
  cursor: pointer;
}
[data-joint-downtime-root="1"] .jdt-photo-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
[data-joint-downtime-root="1"] .jdt-photo-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  font-size: 11.5px;
  font-weight: 700;
  color: #1e40af;
  background: #eff6ff;
  border: 1px solid #93c5fd;
  border-radius: 7px;
  cursor: pointer;
}
[data-joint-downtime-root="1"] .jdt-photo-label-alt {
  color: #334155;
  background: #ffffff;
  border-color: #cbd5e1;
}
[data-joint-downtime-root="1"] .jdt-photo-preview-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px 4px 4px;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
}
[data-joint-downtime-root="1"] .jdt-photo-thumb {
  width: 52px;
  height: 52px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
}
[data-joint-downtime-root="1"] .jdt-photo-del-btn {
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  cursor: pointer;
}
[data-joint-downtime-root="1"] .jdt-time-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
[data-joint-downtime-root="1"] .jdt-time-input-wrap {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex: 1;
  min-width: 110px;
  max-width: 170px;
}
[data-joint-downtime-root="1"] .jdt-time-quick-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
[data-joint-downtime-root="1"] .jdt-quick-min-btn {
  padding: 5px 8px;
  font-size: 11px;
  font-weight: 700;
  color: #334155;
  background: #ffffff;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
}
[data-joint-downtime-root="1"] .jdt-footer-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 9px;
}
[data-joint-downtime-root="1"] .jdt-add-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 8px 14px;
  font-size: 12.5px;
  font-weight: 800;
  color: #1d4ed8;
  background: #eff6ff;
  border: 1.5px dashed #3b82f6;
  border-radius: 8px;
  cursor: pointer;
  flex: 1;
  min-width: 170px;
}
[data-joint-downtime-root="1"] .jdt-total-summary {
  font-size: 11.5px;
  font-weight: 800;
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
  padding: 6px 10px;
  border-radius: 8px;
}
[data-joint-downtime-root="1"] .jdt-ro-card {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 9px 11px;
  background: #f8fafc;
  margin-bottom: 7px;
}
[data-joint-downtime-root="1"] .jdt-ro-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 5px;
}
[data-joint-downtime-root="1"] .jdt-ro-detail {
  font-size: 12px;
  color: #1e293b;
  font-weight: 600;
  line-height: 1.45;
}
</style>`;

function renderReadOnlyDowntimeHtml(items) {
  const activeItems = items.filter(
    (it) => Number(it.minutes) > 0 || it.category || it.detail || it.reason || it.hasPhoto || it.photoId || it.photoDataUrl
  );

  if (activeItems.length === 0) {
    return `${SCOPED_STYLE_HTML}<div data-joint-downtime-readonly="1" class="jdt-hint">비가동 없음 (정상가동)</div>`;
  }

  const totalMin = activeItems.reduce((sum, it) => sum + (Number(it.minutes) || 0), 0);
  const cardsHtml = activeItems
    .map((item, idx) => {
      const cat = item.category || inferCategoryFromLegacyReason(item.reason, item.equip);
      const style = CATEGORY_STYLE_MAP[cat] || CATEGORY_STYLE_MAP['기타'];
      const detailText = item.detail || item.equip || stripCategoryPrefix(item.reason, cat) || item.reason || '-';
      const photoUrl = item.photoDataUrl || '';
      const photoBlock = item.hasPhoto || item.photoId || photoUrl
        ? `<div style="margin-top:6px;" data-downtime-photo-id="${escapeHtml(item.photoId || '')}">
            ${
              photoUrl
                ? `<img class="downtime-photo-thumb" src="${escapeHtml(photoUrl)}" alt="${idx + 1}차 비가동 사진" style="max-width:160px;max-height:110px;border-radius:6px;border:1px solid #cbd5e1;object-fit:cover;cursor:pointer;" />`
                : `<span style="font-size:11px;color:#64748b;">📷 첨부 사진 불러오는 중...</span>`
            }
          </div>`
        : '';

      return `
        <div class="jdt-ro-card">
          <div class="jdt-ro-top">
            <div style="display:inline-flex;align-items:center;gap:6px;">
              <span style="font-size:11.5px;font-weight:800;color:#1e293b;">${idx + 1}차 비가동</span>
              ${cat ? `<span style="font-size:10.5px;font-weight:800;padding:2px 7px;border-radius:999px;background:${style.badgeBg};color:${style.text};">${escapeHtml(cat)}</span>` : ''}
            </div>
            <span style="font-size:11.5px;font-weight:800;color:#dc2626;">${Number(item.minutes) || 0}분</span>
          </div>
          <div class="jdt-ro-detail">${escapeHtml(detailText)}</div>
          ${photoBlock}
        </div>
      `;
    })
    .join('');

  return `${SCOPED_STYLE_HTML}
    <div data-joint-downtime-readonly="1">
      ${cardsHtml}
      ${activeItems.length > 1 || totalMin > 0 ? `<div class="jdt-total-summary" style="display:inline-block;margin-top:2px;">총 ${activeItems.length}건 · 합계 ${totalMin}분</div>` : ''}
    </div>`;
}

function buildStep2Html(item, idx, equipOptions, moldResult) {
  const cat = item.category || '';
  if (!cat) {
    return `<div class="jdt-hint">위 1단계에서 비가동 원인(설비 · 금형 · 소재 · 기타)을 선택해 주세요.</div>`;
  }

  if (cat === '설비') {
    const savedValue = item.targetId ? `eq::${item.targetId}` : (item.targetCode ? `eq::${item.targetCode}` : '');
    let hasMatchedSaved = false;
    const optionsHtml = equipOptions
      .map((opt) => {
        const isSelected =
          (item.targetId && opt.targetId === item.targetId) ||
          (item.targetCode && opt.targetCode === item.targetCode) ||
          (item.equip && opt.equip === item.equip) ||
          (item.detail && (opt.detail === item.detail || opt.displayLabel === item.detail));
        if (isSelected) hasMatchedSaved = true;
        return `<option value="${escapeHtml(opt.value)}"
          data-target-id="${escapeHtml(opt.targetId)}"
          data-target-code="${escapeHtml(opt.targetCode)}"
          data-target-name="${escapeHtml(opt.targetName)}"
          data-equip="${escapeHtml(opt.equip)}"
          data-detail="${escapeHtml(opt.detail)}"
          ${isSelected ? 'selected' : ''}>${escapeHtml(opt.displayLabel)}</option>`;
      })
      .join('');

    const fallbackSavedOption =
      !hasMatchedSaved && (item.detail || item.equip || item.targetCode)
        ? `<option value="${escapeHtml(savedValue || `saved::${idx}`)}"
            data-target-id="${escapeHtml(item.targetId)}"
            data-target-code="${escapeHtml(item.targetCode)}"
            data-target-name="${escapeHtml(item.targetName)}"
            data-equip="${escapeHtml(item.equip || item.detail)}"
            data-detail="${escapeHtml(item.detail || item.equip)}"
            selected>${escapeHtml((item.detail || item.equip || item.targetCode) + ' (저장됨)')}</option>`
        : '';

    const placeholderText = equipOptions.length > 0
      ? '-- TPM 작성 설비 호기 선택 --'
      : '-- 금일 TPM 일지 작성된 설비 없음 --';

    const emptyWarn = equipOptions.length === 0
      ? `<div class="jdt-hint jdt-hint-warn">오늘 TPM 일지가 작성된 설비가 없습니다. 상단(또는 오른쪽)에서 TPM 일지를 먼저 작성하면 설비 호기가 표시됩니다.</div>`
      : '';

    return `
      <select id="jdt_equip_${idx}" class="form-control" data-jdt-field="equipSelect">
        <option value="">${escapeHtml(placeholderText)}</option>
        ${optionsHtml}
        ${fallbackSavedOption}
      </select>
      ${emptyWarn}
    `;
  }

  if (cat === '금형') {
    const moldOptions = moldResult?.options || [];
    let hasMatchedSaved = false;
    const optionsHtml = moldOptions
      .map((opt) => {
        const isSelected =
          (item.targetCode && opt.targetCode === item.targetCode && (!item.targetName || opt.targetName === item.targetName)) ||
          (item.detail && opt.detail === item.detail) ||
          (item.equip && opt.equip === item.equip) ||
          (item.targetId && opt.targetId === item.targetId && (!item.targetName || opt.targetName === item.targetName));
        if (isSelected) hasMatchedSaved = true;
        return `<option value="${escapeHtml(opt.value)}"
          data-target-id="${escapeHtml(opt.targetId)}"
          data-target-code="${escapeHtml(opt.targetCode)}"
          data-target-name="${escapeHtml(opt.targetName)}"
          data-equip="${escapeHtml(opt.equip)}"
          data-detail="${escapeHtml(opt.detail)}"
          ${isSelected ? 'selected' : ''}>${escapeHtml(opt.displayLabel)}</option>`;
      })
      .join('');

    const fallbackSavedOption =
      !hasMatchedSaved && (item.detail || item.equip || item.targetCode)
        ? `<option value="saved_mold::${idx}"
            data-target-id="${escapeHtml(item.targetId)}"
            data-target-code="${escapeHtml(item.targetCode)}"
            data-target-name="${escapeHtml(item.targetName)}"
            data-equip="${escapeHtml(item.equip || item.detail)}"
            data-detail="${escapeHtml(item.detail || item.equip)}"
            selected>${escapeHtml((item.detail || item.equip || item.targetCode) + ' (저장됨)')}</option>`
        : '';

    const placeholderText = moldOptions.length > 0
      ? (moldResult.hasSection5MoldSelects ? '-- 상단 선택된 금형 호기 선택 --' : '-- 금형 호기 선택 --')
      : (moldResult.hasSection5MoldSelects ? '-- 상단에서 금형 번호를 먼저 선택해 주세요 --' : '-- 등록된 금형 정보 없음 --');

    const emptyWarn = moldOptions.length === 0 && moldResult.hasSection5MoldSelects
      ? `<div class="jdt-hint jdt-hint-warn">상단 금형 입력란에서 사용 중인 금형을 선택하면 여기서 해당 금형 호기를 바로 선택할 수 있습니다.</div>`
      : '';

    return `
      <select id="jdt_mold_${idx}" class="form-control" data-jdt-field="moldSelect">
        <option value="">${escapeHtml(placeholderText)}</option>
        ${optionsHtml}
        ${fallbackSavedOption}
      </select>
      ${emptyWarn}
    `;
  }

  if (cat === '소재') {
    const buttonsHtml = JOINT_DOWNTIME_MATERIAL_OPTIONS.map((optLabel) => {
      const isActive = item.detail === optLabel;
      return `<button type="button" class="jdt-mat-btn ${isActive ? 'is-active' : ''}" data-jdt-mat-opt="${escapeHtml(optLabel)}">${escapeHtml(optLabel)}</button>`;
    }).join('');
    return `<div class="jdt-mat-grid">${buttonsHtml}</div>`;
  }

  return `
    <input type="text"
      id="jdt_etc_${idx}"
      class="form-control"
      data-jdt-field="etcInput"
      placeholder="기타 비가동 사유를 직접 입력하세요"
      value="${escapeHtml(item.detail || '')}" />
  `;
}

function renderEditableDowntimeHtml(ctx, state) {
  const { container } = ctx;
  const items = state.items.length > 0 ? state.items : [createEmptyItem()];
  const reportDateStr = getReportDateString(container, ctx?.existingData);
  const equipOptions = getTpmWrittenEquipments(ctx, state, reportDateStr);
  const carCode = String(ctx?.carModelValue?.value || ctx?.existingData?.carModel || '').trim();
  const partName = String(ctx?.partValueInput?.value || ctx?.existingData?.itemName || '').trim();
  const moldResult = getTopSelectedMolds(container, ctx?.molds || [], carCode, partName);
  const canOpenTpm = typeof ctx?.onOpenTpmModal === 'function';

  const cardsHtml = items
    .map((item, idx) => {
      const cat = item.category || '';
      const mins = Math.max(0, Math.round(Number(item.minutes) || 0));
      const hasAnyData = Boolean(mins > 0 || cat || item.detail || item.hasPhoto || item.photoId || item.photoDataUrl);
      const showRemove = items.length > 1 || hasAnyData;
      const removeLabel = items.length > 1 ? '삭제' : '초기화';

      const catBtnsHtml = JOINT_DOWNTIME_CATEGORIES.map((c) => {
        const isActive = cat === c;
        const st = CATEGORY_STYLE_MAP[c];
        const activeStyle = isActive
          ? `background:${st.bg};border-color:${st.border};color:${st.text};box-shadow:0 0 0 2px ${st.badgeBg};`
          : '';
        return `<button type="button" class="jdt-cat-btn" data-jdt-cat="${escapeHtml(c)}" style="${activeStyle}">${escapeHtml(c)}</button>`;
      }).join('');

      const step2Title =
        cat === '설비'
          ? '설비 호기 선택 (TPM 작성 설비)'
          : cat === '금형'
            ? (moldResult.hasSection5MoldSelects ? '금형 호기 선택 (상단 선택 금형)' : '금형 호기 선택')
            : cat === '소재'
              ? '소재 사유 선택'
              : cat === '기타'
                ? '기타 사유 입력'
                : '세부 선택 / 입력';

      const tpmBtnHtml =
        cat === '설비' && canOpenTpm
          ? `<button type="button" class="jdt-tpm-btn" data-jdt-open-tpm="1">📋 TPM 일지 작성</button>`
          : '';

      const cachedPhotoUrl =
        item.photoDataUrl ||
        (item.photoId ? state.photoCache.get(item.photoId) : '') ||
        '';
      const hasPhotoFlag = Boolean(cachedPhotoUrl || item.hasPhoto || item.photoId);

      const photoPreviewHtml = cachedPhotoUrl
        ? `<div class="jdt-photo-preview-wrap">
            <img src="${escapeHtml(cachedPhotoUrl)}" alt="${idx + 1}차 비가동 사진" class="jdt-photo-thumb" data-jdt-photo-preview="1" />
            <div style="display:flex;flex-direction:column;gap:3px;">
              <span style="font-size:10.5px;font-weight:700;color:#15803d;">사진 첨부됨</span>
              <button type="button" class="jdt-photo-del-btn" data-jdt-photo-remove="1">삭제</button>
            </div>
          </div>`
        : hasPhotoFlag
          ? `<div class="jdt-photo-preview-wrap">
              <span style="font-size:11px;color:#475569;padding:4px;">📷 저장된 사진 불러오는 중...</span>
              <button type="button" class="jdt-photo-del-btn" data-jdt-photo-remove="1">삭제</button>
            </div>`
          : '';

      return `
        <div class="jdt-item-card" data-jdt-item-idx="${idx}">
          <div class="jdt-item-header">
            <div class="jdt-item-title">
              <span>${idx + 1}차 비가동</span>
              ${mins > 0 ? `<span class="jdt-min-badge">${mins}분</span>` : ''}
            </div>
            ${showRemove ? `<button type="button" class="jdt-remove-btn" data-jdt-remove-idx="${idx}">${removeLabel}</button>` : ''}
          </div>

          <div class="jdt-step-block">
            <div class="jdt-step-label-row">
              <span class="jdt-step-label"><span class="jdt-step-num">1단계</span> 비가동 원인</span>
            </div>
            <div class="jdt-cat-grid">${catBtnsHtml}</div>
          </div>

          <div class="jdt-step-block">
            <div class="jdt-step-label-row">
              <span class="jdt-step-label"><span class="jdt-step-num">2단계</span> ${escapeHtml(step2Title)}</span>
              ${tpmBtnHtml}
            </div>
            ${buildStep2Html(item, idx, equipOptions, moldResult)}
          </div>

          <div class="jdt-step-block">
            <div class="jdt-step-label-row">
              <span class="jdt-step-label"><span class="jdt-step-num">3단계</span> 현장 사진 첨부 <span style="font-weight:500;color:#64748b;">(선택)</span></span>
            </div>
            <div class="jdt-photo-row">
              <label class="jdt-photo-label">
                📷 사진 촬영
                <input type="file" accept="image/*" capture="environment" data-jdt-photo-input="camera" style="display:none;" />
              </label>
              <label class="jdt-photo-label jdt-photo-label-alt">
                🖼️ 앨범 선택
                <input type="file" accept="image/*" data-jdt-photo-input="gallery" style="display:none;" />
              </label>
              ${photoPreviewHtml}
            </div>
          </div>

          <div class="jdt-step-block">
            <div class="jdt-step-label-row">
              <span class="jdt-step-label"><span class="jdt-step-num">4단계</span> 비가동 시간</span>
            </div>
            <div class="jdt-time-row">
              <div class="jdt-time-input-wrap">
                <input type="number"
                  id="jdt_min_${idx}"
                  class="form-control"
                  data-jdt-field="minutesInput"
                  min="0"
                  inputmode="numeric"
                  placeholder="0"
                  value="${mins > 0 ? String(mins) : ''}" />
                <span style="font-size:12px;font-weight:700;color:#475569;flex-shrink:0;">분</span>
              </div>
              <div class="jdt-time-quick-group">
                <button type="button" class="jdt-quick-min-btn" data-jdt-add-min="5">+5분</button>
                <button type="button" class="jdt-quick-min-btn" data-jdt-add-min="10">+10분</button>
                <button type="button" class="jdt-quick-min-btn" data-jdt-add-min="30">+30분</button>
              </div>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  const totalMinutes = items.reduce((sum, it) => sum + (Math.max(0, Math.round(Number(it.minutes) || 0))), 0);
  const activeCount = items.filter((it) => Number(it.minutes) > 0 || it.category || it.detail).length;

  return `${SCOPED_STYLE_HTML}
    <div class="jdt-list">${cardsHtml}</div>
    <div class="jdt-footer-bar">
      <button type="button" class="jdt-add-btn" data-jdt-add-btn="1">➕ 비가동 추가 (${items.length + 1}차)</button>
      ${totalMinutes > 0 ? `<div class="jdt-total-summary">총 ${activeCount}건 · 합계 ${totalMinutes}분</div>` : ''}
    </div>
  `;
}

function hydratePhotosIntoState(container, state) {
  if (typeof window === 'undefined' || navigator?.userAgent?.includes('jsdom')) return;
  const needIds = state.items
    .map((it) => String(it.photoId || '').trim())
    .filter((pid) => pid && !state.photoCache.has(pid) && !state.photoFetchingIds.has(pid));

  if (needIds.length === 0) return;

  needIds.forEach((pid) => {
    state.photoFetchingIds.add(pid);
    fetchReportDowntimePhoto(pid)
      .then((url) => {
        state.photoFetchingIds.delete(pid);
        if (url) {
          state.photoCache.set(pid, url);
          const root = container.querySelector('[data-joint-downtime-root="1"]');
          if (root && !state.ctx?.isReadOnlyPreview && state.ctx) {
            root.innerHTML = renderEditableDowntimeHtml(state.ctx, state);
          }
        }
      })
      .catch(() => {
        state.photoFetchingIds.delete(pid);
      });
  });
}

function syncTodayTpmLogsIfNeeded(container, state) {
  if (typeof window === 'undefined' || navigator?.userAgent?.includes('jsdom')) return;
  if (!container?.isConnected || state.ctx?.isReadOnlyPreview) return;
  const reportDateStr = getReportDateString(container, state.ctx?.existingData);
  if (!reportDateStr) return;
  if (state.tpmFetchedDate === reportDateStr || state.tpmFetchInflightDate === reportDateStr) return;

  state.tpmFetchInflightDate = reportDateStr;
  fetchTodayTpmLogsByDate(reportDateStr)
    .then((logs) => {
      state.tpmFetchInflightDate = '';
      state.tpmFetchedDate = reportDateStr;
      state.tpmLogEquipmentIds = new Set();
      state.tpmLogEquipmentCodes = new Set();
      (logs || []).forEach((logDoc) => {
        (logDoc?.equipmentIds || []).forEach((id) => {
          if (id) state.tpmLogEquipmentIds.add(String(id));
        });
        (logDoc?.equipmentCodes || []).forEach((code) => {
          if (code) state.tpmLogEquipmentCodes.add(String(code).trim().toUpperCase());
        });
      });

      const card = container.querySelector('#downtimeCard');
      if (card?.dataset?.jointDowntimeMode === '1' && state.ctx) {
        const root = card.querySelector('[data-joint-downtime-root="1"]');
        if (root) {
          root.innerHTML = renderEditableDowntimeHtml(state.ctx, state);
        }
      }
    })
    .catch(() => {
      state.tpmFetchInflightDate = '';
    });
}

function bindRootEvents(container, root) {
  const state = getContainerState(container);
  if (root.dataset.jdtRootBound === '1') return;
  root.dataset.jdtRootBound = '1';

  const rerenderRoot = () => {
    if (!state.ctx) return;
    root.innerHTML = renderEditableDowntimeHtml(state.ctx, state);
  };

  root.addEventListener('click', (e) => {
    const target = e.target;

    const addBtn = target?.closest?.('[data-jdt-add-btn="1"]');
    if (addBtn) {
      state.items.push(createEmptyItem());
      rerenderRoot();
      return;
    }

    const openTpmBtn = target?.closest?.('[data-jdt-open-tpm="1"]');
    if (openTpmBtn) {
      state.ctx?.onOpenTpmModal?.();
      return;
    }

    const previewImg = target?.closest?.('[data-jdt-photo-preview="1"]');
    if (previewImg) {
      openPhotoLightbox(previewImg.getAttribute('src'), previewImg.getAttribute('alt') || '비가동 현장 사진');
      return;
    }

    const card = target?.closest?.('[data-jdt-item-idx]');
    if (!card) return;
    const idx = Number(card.dataset.jdtItemIdx);
    const item = state.items[idx];
    if (!item) return;

    const removeBtn = target?.closest?.('[data-jdt-remove-idx]');
    if (removeBtn) {
      if (state.items.length > 1) {
        state.items.splice(idx, 1);
      } else {
        state.items[0] = createEmptyItem();
      }
      rerenderRoot();
      return;
    }

    const catBtn = target?.closest?.('[data-jdt-cat]');
    if (catBtn) {
      const nextCat = catBtn.dataset.jdtCat || '';
      if (item.category !== nextCat) {
        item.category = nextCat;
        item.targetId = '';
        item.targetCode = '';
        item.targetName = '';
        item.detail = '';
        item.equip = '';
        item.reason = '';
        rerenderRoot();
      }
      return;
    }

    const matBtn = target?.closest?.('[data-jdt-mat-opt]');
    if (matBtn) {
      const optVal = matBtn.dataset.jdtMatOpt || '';
      item.category = '소재';
      item.detail = item.detail === optVal ? '' : optVal;
      item.equip = '';
      item.targetId = '';
      item.targetCode = '';
      item.targetName = '';
      item.reason = item.detail ? `[소재] ${item.detail}` : '[소재]';
      rerenderRoot();
      return;
    }

    const quickMinBtn = target?.closest?.('[data-jdt-add-min]');
    if (quickMinBtn) {
      const delta = Number(quickMinBtn.dataset.jdtAddMin) || 0;
      item.minutes = Math.max(0, (Number(item.minutes) || 0) + delta);
      rerenderRoot();
      return;
    }

    const photoRemoveBtn = target?.closest?.('[data-jdt-photo-remove="1"]');
    if (photoRemoveBtn) {
      item.photoDataUrl = '';
      item.photoId = '';
      item.hasPhoto = false;
      rerenderRoot();
    }
  });

  root.addEventListener('change', (e) => {
    const target = e.target;
    const card = target?.closest?.('[data-jdt-item-idx]');
    if (!card) return;
    const idx = Number(card.dataset.jdtItemIdx);
    const item = state.items[idx];
    if (!item) return;

    if (target.matches('[data-jdt-field="equipSelect"], [data-jdt-field="moldSelect"]')) {
      const selOpt = target.options?.[target.selectedIndex];
      if (!target.value || !selOpt) {
        item.targetId = '';
        item.targetCode = '';
        item.targetName = '';
        item.equip = '';
        item.detail = '';
        item.reason = '';
      } else {
        item.targetId = String(selOpt.dataset.targetId || '').trim();
        item.targetCode = String(selOpt.dataset.targetCode || '').trim();
        item.targetName = String(selOpt.dataset.targetName || '').trim();
        item.equip = String(selOpt.dataset.equip || '').trim();
        item.detail = String(selOpt.dataset.detail || item.equip).trim();
        const built = buildFormattedDowntimeFields(item);
        item.reason = built.reason;
      }
      return;
    }

    if (target.matches('[data-jdt-photo-input]')) {
      const file = target.files?.[0];
      if (!file) return;
      resizeImageFileToDataUrl(file)
        .then((dataUrl) => {
          item.photoDataUrl = dataUrl;
          item.hasPhoto = true;
          rerenderRoot();
        })
        .catch((err) => {
          console.error('Failed to process downtime photo:', err);
          alert('사진 처리 중 오류가 발생했습니다.');
        });
    }
  });

  root.addEventListener('input', (e) => {
    const target = e.target;
    const card = target?.closest?.('[data-jdt-item-idx]');
    if (!card) return;
    const idx = Number(card.dataset.jdtItemIdx);
    const item = state.items[idx];
    if (!item) return;

    if (target.matches('[data-jdt-field="etcInput"]')) {
      item.category = '기타';
      item.detail = String(target.value || '');
      item.equip = '';
      item.targetId = '';
      item.targetCode = '';
      item.targetName = '';
      item.reason = item.detail.trim() ? `[기타] ${item.detail.trim()}` : '[기타]';
      return;
    }

    if (target.matches('[data-jdt-field="minutesInput"]')) {
      const val = Math.max(0, Math.round(Number(target.value) || 0));
      item.minutes = val;
      const badge = card.querySelector('.jdt-min-badge');
      if (val > 0) {
        if (badge) {
          badge.textContent = `${val}분`;
        } else {
          const titleEl = card.querySelector('.jdt-item-title');
          if (titleEl) {
            const span = document.createElement('span');
            span.className = 'jdt-min-badge';
            span.textContent = `${val}분`;
            titleEl.appendChild(span);
          }
        }
      } else if (badge) {
        badge.remove();
      }
      const totalMinutes = state.items.reduce((sum, it) => sum + (Math.max(0, Math.round(Number(it.minutes) || 0))), 0);
      const activeCount = state.items.filter((it) => Number(it.minutes) > 0 || it.category || it.detail).length;
      const footerBar = root.querySelector('.jdt-footer-bar');
      if (footerBar) {
        let summaryEl = footerBar.querySelector('.jdt-total-summary');
        if (totalMinutes > 0) {
          if (!summaryEl) {
            summaryEl = document.createElement('div');
            summaryEl.className = 'jdt-total-summary';
            footerBar.appendChild(summaryEl);
          }
          summaryEl.textContent = `총 ${activeCount}건 · 합계 ${totalMinutes}분`;
        } else if (summaryEl) {
          summaryEl.remove();
        }
      }
    }
  });
}

function bindExternalSyncListeners(container) {
  const state = getContainerState(container);
  if (state.listenersBound) return;
  state.listenersBound = true;

  const refreshIfJointActive = () => {
    const card = container.querySelector('#downtimeCard');
    if (!card || card.dataset.jointDowntimeMode !== '1' || state.ctx?.isReadOnlyPreview) return;
    const root = card.querySelector('[data-joint-downtime-root="1"]');
    if (!root || !state.ctx) return;
    const reportDateStr = getReportDateString(container, state.ctx?.existingData);
    if (reportDateStr && state.tpmFetchedDate !== reportDateStr) {
      state.tpmFetchedDate = '';
      syncTodayTpmLogsIfNeeded(container, state);
    }
    root.innerHTML = renderEditableDowntimeHtml(state.ctx, state);
  };

  container.addEventListener('change', (e) => {
    const t = e.target;
    if (!t) return;
    if (
      t.matches?.(
        '#section5DynamicContainer select[id^="vulc_mold_"], #section5DynamicContainer select[id^="vulc2_mold_"], #section5DynamicContainer input[id$="_lh_check"], #section5DynamicContainer input[id$="_rh_check"], #reportDate'
      )
    ) {
      refreshIfJointActive();
    }
  });

  ['jymes:tpm-updated', 'jymes:equipments-loaded', 'jymes:molds-loaded'].forEach((evtName) => {
    container.addEventListener(evtName, (e) => {
      if (evtName === 'jymes:tpm-updated') {
        if (e?.detail && state.ctx) {
          const prevGet = state.ctx.getTpmSummary;
          if (!prevGet) state.ctx.getTpmSummary = () => e.detail;
        }
        state.tpmFetchedDate = '';
      }
      refreshIfJointActive();
    });
  });
}

function getOrCreateJointRoot(downtimeCard) {
  let root = downtimeCard.querySelector('[data-joint-downtime-root="1"]');
  if (!root) {
    root = document.createElement('div');
    root.id = 'jointDowntimeRoot';
    root.dataset.jointDowntimeRoot = '1';
    const notesInput = downtimeCard.querySelector('#notesInput');
    if (notesInput && notesInput.parentNode === downtimeCard) {
      downtimeCard.insertBefore(root, notesInput);
    } else {
      downtimeCard.appendChild(root);
    }
  }
  return root;
}

export function restoreNonJointDowntimeBody(container) {
  const downtimeCard = container?.querySelector('#downtimeCard');
  if (!downtimeCard) return;
  if (downtimeCard.dataset.jointDowntimeMode) {
    delete downtimeCard.dataset.jointDowntimeMode;
  }
  const root = downtimeCard.querySelector('[data-joint-downtime-root="1"]');
  if (root) {
    root.style.display = 'none';
  }
  const stdBody = downtimeCard.querySelector('[data-std-downtime-body="1"]');
  if (stdBody) {
    stdBody.style.display = '';
  }
}

export function renderJointDowntimeSection(ctx) {
  const { container, existingData, isReadOnlyPreview } = ctx;
  const downtimeCard = container?.querySelector('#downtimeCard');
  if (!downtimeCard) return;

  const state = getContainerState(container);
  state.ctx = ctx;

  const existingSig = existingData
    ? `${existingData.id || ''}:${existingData.updatedAtMs || ''}:${existingData.downtimeMinutes || 0}:${(existingData.downtimeItems || []).length}`
    : '__new__';

  if (state.existingSignature !== existingSig || state.items.length === 0) {
    state.items = parseInitialDowntimeItems(existingData);
    state.existingSignature = existingSig;
  }

  downtimeCard.style.display = 'block';
  downtimeCard.dataset.jointDowntimeMode = '1';

  const stdBody = downtimeCard.querySelector('[data-std-downtime-body="1"]');
  if (stdBody) {
    stdBody.style.display = 'none';
  }

  const label = downtimeCard.querySelector('#downtimeTitleLabel');
  if (label) {
    label.innerHTML = '⚠️ 📝 <span class="sec-num"></span> 비가동 시간 &amp; 원터치 특이사항 작성';
    label.setAttribute('data-i18n', 'step6_downtime');
  }

  const root = getOrCreateJointRoot(downtimeCard);
  root.style.display = '';

  if (isReadOnlyPreview) {
    root.innerHTML = renderReadOnlyDowntimeHtml(state.items);
    return;
  }

  bindRootEvents(container, root);
  bindExternalSyncListeners(container);
  root.innerHTML = renderEditableDowntimeHtml(ctx, state);
  hydratePhotosIntoState(container, state);
  syncTodayTpmLogsIfNeeded(container, state);
}

export function collectJointDowntimePayload(container) {
  const downtimeCard = container?.querySelector('#downtimeCard');
  const isHidden = !downtimeCard || downtimeCard.style.display === 'none';
  if (isHidden) {
    return {
      downtimeItems: [],
      downtimeMinutes: 0,
      downtimeReason: '',
      downtimeMinutes1: 0,
      downtimeEquip1: '',
      downtimeReason1: '',
      downtimeMinutes2: 0,
      downtimeEquip2: '',
      downtimeReason2: '',
      downtimeMinutes3: 0,
      downtimeEquip3: '',
      downtimeReason3: ''
    };
  }

  const state = containerStateMap.get(container);
  const rawItems = Array.isArray(state?.items) ? state.items : [];

  const activeItems = [];
  rawItems.forEach((raw) => {
    const built = buildFormattedDowntimeFields(raw);
    const hasPhoto = Boolean(raw?.photoDataUrl || raw?.photoId || raw?.hasPhoto);
    const isEmpty =
      built.minutes <= 0 &&
      !built.category &&
      !built.detail &&
      !built.equip &&
      !built.reason &&
      !hasPhoto;

    if (isEmpty) return;

    activeItems.push({
      seq: activeItems.length + 1,
      category: built.category,
      targetId: built.targetId,
      targetCode: built.targetCode,
      targetName: built.targetName,
      detail: built.detail,
      equip: built.equip,
      reason: built.reason,
      minutes: built.minutes,
      photoId: String(raw?.photoId || '').trim(),
      hasPhoto,
      ...(raw?.photoDataUrl ? { photoDataUrl: raw.photoDataUrl } : {})
    });
  });

  const totalDowntimeMinutes = activeItems.reduce((sum, it) => sum + (Number(it.minutes) || 0), 0);
  const reasonsArr = activeItems
    .filter((it) => it.minutes > 0 || it.reason || it.detail)
    .map((it, idx) => `${idx + 1}차: ${it.reason || it.detail || '사유미입력'}(${it.minutes}분)`);

  const slot1 = activeItems[0] || {};
  const slot2 = activeItems[1] || {};
  const slot3 = activeItems[2] || {};

  return {
    downtimeItems: activeItems,
    downtimeMinutes: totalDowntimeMinutes,
    downtimeReason: reasonsArr.join(', '),
    downtimeMinutes1: Number(slot1.minutes) || 0,
    downtimeEquip1: slot1.equip || '',
    downtimeReason1: slot1.reason || '',
    downtimeMinutes2: Number(slot2.minutes) || 0,
    downtimeEquip2: slot2.equip || '',
    downtimeReason2: slot2.reason || '',
    downtimeMinutes3: Number(slot3.minutes) || 0,
    downtimeEquip3: slot3.equip || '',
    downtimeReason3: slot3.reason || ''
  };
}
