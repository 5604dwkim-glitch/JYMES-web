import { store, windowMock } from '../../LegacyFormWrapper.jsx';
import { i18n } from '../../../../constants/translations.js';
import { fetchFmbInventory, saveFmbInventory } from '../../../../services/firestore.js';

export const F9004_CHECKLIST_ITEMS = [
  { id: 'f9004_chk_mon', text: '온/습도 모니터링 장비는 정상작동중인가? (ON/OFF 유무)', refNote: 'F/Proof 작동요령서 참조' },
  { id: 'f9004_chk_alarm', text: '온/습도 경광등 및 경보음은 정상작동중인가? (F/proof 정상작동 여부)', refNote: 'F/Proof 작동요령서 참조' },
  { id: 'f9004_chk2', text: 'FMB(배합고무) 선입선출(FIFO) 준수 및 적재 구역 구분 상태' },
  { id: 'f9004_chk3', text: '원재료 LOT 식별표 부착 및 유효기간(사용기한) 경과품 유무 확인' },
  { id: 'f9004_chk4', text: '이물질·오염·직사광선 차단 및 비닐 커버 밀봉 보관 상태' },
  { id: 'f9004_chk5', text: '보관실 통로 정리정돈 및 안전·소방 시설 이상 유무' }
];

// 과거 저장된 일보 조회용 하위 호환 체크리스트 (원칙 11)
const F9004_LEGACY_CHECKLIST_ITEMS = [
  { id: 'f9004_chk1', text: '보관실 항온·항습기 가동 및 기준 온·습도 유지 상태' },
  { id: 'f9004_chk2', text: 'FMB(배합고무) 선입선출(FIFO) 준수 및 적재 구역 구분 상태' },
  { id: 'f9004_chk3', text: '원재료 LOT 식별표 부착 및 유효기간(사용기한) 경과품 유무 확인' },
  { id: 'f9004_chk4', text: '이물질·오염·직사광선 차단 및 비닐 커버 밀봉 보관 상태' },
  { id: 'f9004_chk5', text: '보관실 통로 정리정돈 및 안전·소방 시설 이상 유무' }
];

const F9004_IO_TYPES = ['입고', '불출', '반납', '재고', '보류'];
export const F9004_RUBBER_OPTIONS = ['W60664$OS', 'W6082$NA', 'W60905'];
const FMB_LOCAL_CACHE_KEY = 'jymes_fmb_inventory_v1';

// 고무 압출(Piece) 및 고무 권선(Roll) 표준 사양
export const F9004_EXTRUSION_SPECS = [
  { key: 'w60664', code: 'W60664$OS', specLabel: '5.40 ± 0.5 g', min: 4.9, max: 5.9 },
  { key: 'w6082', code: 'W6082$NA', specLabel: '20.2 ± 0.5 g', min: 19.7, max: 20.7 }
];

export const F9004_WINDING_SPECS = [
  { key: 'w6082', code: 'W6082$NA' },
  { key: 'w60905', code: 'W60905$OS' },
  { key: 'w60664', code: 'W60664$$OS' }
];

export const F9004_INIT_PIECE_COUNT = 20;

function normalizeIoType(raw) {
  const s = String(raw || '').trim();
  if (s === '불출(투입)') return '불출';
  if (s === '재고점검') return '재고';
  if (s === '보류·격리') return '보류';
  return s;
}

function isOutflowType(raw) {
  const tp = normalizeIoType(raw);
  return tp === '불출' || tp === '반납';
}

export function formatExpiryMonthDay(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  const ymd = s.match(/^(?:\d{2}|\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
  if (ymd) {
    return `${ymd[1].padStart(2, '0')}/${ymd[2].padStart(2, '0')}`;
  }
  const md = s.match(/^(\d{1,2})[-./](\d{1,2})$/);
  if (md) {
    return `${md[1].padStart(2, '0')}/${md[2].padStart(2, '0')}`;
  }
  if (/^\d{4}$/.test(s)) {
    return `${s.slice(0, 2)}/${s.slice(2, 4)}`;
  }
  return s;
}

function toExpiryIso(raw, baseDateStr) {
  const s = String(raw || '').trim();
  if (!s) return '';
  const fullYmd = s.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
  if (fullYmd) {
    return `${fullYmd[1]}-${fullYmd[2].padStart(2, '0')}-${fullYmd[3].padStart(2, '0')}`;
  }
  const shortYmd = s.match(/^(\d{2})[-./](\d{1,2})[-./](\d{1,2})$/);
  if (shortYmd) {
    return `20${shortYmd[1]}-${shortYmd[2].padStart(2, '0')}-${shortYmd[3].padStart(2, '0')}`;
  }
  const mmdd = formatExpiryMonthDay(s);
  const md = mmdd.match(/^(\d{2})\/(\d{2})$/);
  if (md) {
    const baseParts = String(baseDateStr || '').split('-');
    const baseYear = Number(baseParts[0]) || new Date().getFullYear();
    const baseMonth = Number(baseParts[1]) || 1;
    const expMonth = Number(md[1]);
    const year = (baseMonth >= 11 && expMonth <= 2) ? baseYear + 1 : baseYear;
    return `${year}-${md[1]}-${md[2]}`;
  }
  return '';
}

function stripKgUnit(raw) {
  return String(raw || '').replace(/,/g, '').replace(/\s*kg$/i, '').trim();
}

function parseKgNum(raw) {
  const clean = stripKgUnit(raw);
  if (!clean) return null;
  const m = clean.match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : null;
}

function formatKgNumber(num) {
  const rounded = Math.round(num * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

function formatQtyWithKg(raw) {
  const clean = stripKgUnit(raw);
  return clean ? `${clean}kg` : '';
}

function makeStockId(idx = 0) {
  return `stk_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * 등록일(createdDate)이 작성일(reportDate)보다 이전이면 다음날 이월된 항목이므로
 * 구분을 자동으로 '재고'로 전환 (보류 상태는 보류 유지)
 */
export function resolveDisplayType(item, reportDate) {
  const tp = normalizeIoType(item?.f9004_type || '재고') || '재고';
  if (isOutflowType(tp)) return tp;
  if (item?.createdDate && reportDate && item.createdDate < reportDate) {
    return tp === '보류' ? '보류' : '재고';
  }
  return tp;
}

/**
 * 이월된 '재고' 항목을 최상단(유효기간 임박순 FIFO)에 배치하고,
 * 이어서 금일 '입고', 마지막에 '보류' 순으로 정렬
 */
export function sortStockItems(items, reportDate) {
  const rankOf = (it) => {
    const disp = resolveDisplayType(it, reportDate);
    if (disp === '재고') {
      return (it?.createdDate && reportDate && it.createdDate < reportDate) ? 0 : 1;
    }
    if (disp === '입고') return 2;
    if (disp === '보류') return 3;
    return 4;
  };

  return [...items].sort((a, b) => {
    const rDiff = rankOf(a) - rankOf(b);
    if (rDiff !== 0) return rDiff;
    const isoA = a?.f9004_expiryIso || toExpiryIso(a?.f9004_expiryDate, a?.createdDate || reportDate) || '9999-99-99';
    const isoB = b?.f9004_expiryIso || toExpiryIso(b?.f9004_expiryDate, b?.createdDate || reportDate) || '9999-99-99';
    if (isoA !== isoB) return isoA.localeCompare(isoB);
    return 0;
  });
}

function normalizeStockItem(raw, fallbackDate, idx = 0) {
  const createdDate = String(raw?.createdDate || fallbackDate || '');
  const rubberName = String(raw?.f9004_rubberName ?? raw?.f9004_carModel ?? '').trim();
  const rawExpiry = raw?.f9004_expiryDate ?? raw?.f9004_compoundLot ?? '';
  const expiryDate = formatExpiryMonthDay(rawExpiry);
  const expiryIso = String(raw?.f9004_expiryIso || toExpiryIso(rawExpiry || expiryDate, createdDate)).trim();
  const amount = formatQtyWithKg(raw?.f9004_amount || '');
  const ioType = normalizeIoType(raw?.f9004_type || '재고') || '재고';
  return {
    stockId: raw?.stockId || makeStockId(idx),
    f9004_rubberName: rubberName,
    f9004_expiryDate: expiryDate,
    f9004_expiryIso: expiryIso,
    f9004_amount: amount,
    f9004_type: ioType,
    createdDate
  };
}

function readLocalFmbCache() {
  try {
    const raw = localStorage.getItem(FMB_LOCAL_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLocalFmbCache(items, lastReportDate) {
  try {
    localStorage.setItem(FMB_LOCAL_CACHE_KEY, JSON.stringify({
      items,
      lastReportDate: lastReportDate || '',
      updatedAt: new Date().toISOString()
    }));
  } catch {
    // localStorage quota/disabled ignore
  }
}

function computeRubberTotals(items) {
  const byRubber = new Map();
  F9004_RUBBER_OPTIONS.forEach((rb) => byRubber.set(rb, { kg: 0, count: 0 }));

  let totalKg = 0;
  let totalCount = 0;

  (Array.isArray(items) ? items : []).forEach((it) => {
    if (isOutflowType(it?.f9004_type)) return;
    const rb = String(it?.f9004_rubberName ?? it?.f9004_carModel ?? '').trim();
    if (!rb) return;
    const kg = parseKgNum(it?.f9004_amount) || 0;
    if (!byRubber.has(rb)) {
      byRubber.set(rb, { kg: 0, count: 0 });
    }
    const entry = byRubber.get(rb);
    entry.kg += kg;
    entry.count += 1;
    totalKg += kg;
    totalCount += 1;
  });

  return { byRubber, totalKg, totalCount };
}

const escapeHtml = (val) => String(val ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

function buildStockSummaryBarHTML(items, compact = false) {
  const { byRubber, totalKg, totalCount } = computeRubberTotals(items);
  const cardsHtml = Array.from(byRubber.entries()).map(([rb, info]) => {
    const active = info.kg > 0 || info.count > 0;
    return `
      <div style="background: ${active ? '#ffffff' : '#f8fafc'}; border: 1px solid ${active ? '#94a3b8' : '#e2e8f0'}; border-radius: 6px; padding: ${compact ? '4px 8px' : '6px 10px'}; display: flex; justify-content: space-between; align-items: center; gap: 6px; min-width: 0;">
        <span translate="no" style="font-size: ${compact ? '11.5px' : '12px'}; font-weight: 800; color: ${active ? '#0f172a' : '#64748b'}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(rb)}</span>
        <span translate="no" style="font-size: ${compact ? '12px' : '13px'}; font-weight: 800; color: ${active ? '#047857' : '#94a3b8'}; white-space: nowrap;">${formatKgNumber(info.kg)} kg</span>
      </div>
    `;
  }).join('');

  return `
    <div style="background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 6px; padding: ${compact ? '6px 8px' : '8px 10px'}; margin-bottom: 8px;">
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap;">
        <span style="font-size: 12px; font-weight: 800; color: #1e293b;">📦 고무실 현재 재고 현황</span>
        <span style="font-size: 12px; font-weight: 800; color: ${totalCount > 0 ? '#1d4ed8' : '#64748b'}; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 999px; padding: 1px 10px;">
          <span>총 재고</span>: <strong translate="no">${formatKgNumber(totalKg)} kg</strong>
        </span>
      </div>
      <div class="f9004-stock-summary-grid">
        ${cardsHtml}
      </div>
    </div>
  `;
}

function parseEnvNumber(raw) {
  if (raw === null || raw === undefined) return null;
  const str = String(raw).trim();
  if (!str) return null;
  const m = str.match(/-?\d+(?:\.\d+)?/);
  if (!m) return null;
  const num = Number(m[0]);
  return Number.isFinite(num) ? num : null;
}

/**
 * FMB 보관실 관리 표준 기준 판정
 * - 온도: 20 ± 5℃ (15.0 ~ 25.0℃)
 * - 습도: 70% 이하 (0 ~ 70.0%)
 */
export function evaluateF9004EnvSpec(tempRaw, humRaw) {
  const t = parseEnvNumber(tempRaw);
  const h = parseEnvNumber(humRaw);
  const tempOk = t === null ? null : (t >= 15 && t <= 25);
  const humOk = h === null ? null : (h >= 0 && h <= 70);
  return { tempVal: t, humVal: h, tempOk, humOk };
}

function buildFmbStandardLeftBoxHTML(compact = false) {
  const cellPad = compact ? '4px 6px' : '6px 8px';
  const fontSize = compact ? '11.5px' : '12.5px';
  const ruleFont = compact ? '11.5px' : '12.5px';
  return `
    <div class="f9004-std-box" style="border: 1.5px solid #1e293b; border-radius: 6px; overflow: hidden; background: #ffffff; display: flex; flex-direction: column; height: 100%; word-break: keep-all;">
      <div style="background: #ebf1de; border-bottom: 1.5px solid #1e293b; padding: ${compact ? '6px 10px' : '8px 12px'}; text-align: center; font-size: ${compact ? '13px' : '14px'}; font-weight: 800; color: #0f172a; letter-spacing: 0.5px;">
        FMB 보관실 관리 표준
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: ${fontSize}; text-align: center; color: #0f172a; word-break: keep-all;">
        <thead>
          <tr style="background: #dbeef4; font-weight: 800;">
            <th style="border-bottom: 1px solid #1e293b; border-right: 1px solid #1e293b; padding: ${cellPad}; width: 19%; white-space: nowrap;">구분</th>
            <th style="border-bottom: 1px solid #1e293b; border-right: 1px solid #1e293b; padding: ${cellPad}; width: 22%; white-space: nowrap;">유효기간</th>
            <th style="border-bottom: 1px solid #1e293b; border-right: 1px solid #1e293b; padding: ${cellPad}; width: 41%; white-space: nowrap;">관리 기준</th>
            <th style="border-bottom: 1px solid #1e293b; padding: ${cellPad}; width: 18%; white-space: nowrap;">비고</th>
          </tr>
        </thead>
        <tbody>
          <tr style="background: #ffffff; font-weight: 700;">
            <td style="border-bottom: 1.5px solid #1e293b; border-right: 1px solid #1e293b; padding: ${cellPad}; line-height: 1.35; white-space: nowrap;">조인트<br/>고무</td>
            <td style="border-bottom: 1.5px solid #1e293b; border-right: 1px solid #1e293b; padding: ${cellPad}; color: #dc2626; font-weight: 800; white-space: nowrap;">10일 이내</td>
            <td style="border-bottom: 1.5px solid #1e293b; border-right: 1px solid #1e293b; padding: ${cellPad}; text-align: left; line-height: 1.45;">
              <div>온도 : 20 ± 5℃ <span style="font-size: 11px; color: #475569; font-weight: 600;">(15~25℃)</span></div>
              <div>습도 : 70% 이하</div>
            </td>
            <td style="border-bottom: 1.5px solid #1e293b; padding: ${cellPad}; font-weight: 800; white-space: nowrap;">1회/일</td>
          </tr>
        </tbody>
      </table>
      <div style="padding: ${compact ? '7px 10px' : '10px 12px'}; font-size: ${ruleFont}; line-height: 1.65; color: #0f172a; font-weight: 600; flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 2px; background: #fcfdfd; word-break: keep-all;">
        <div>1. 연고무 <strong style="color: #1d4ed8; font-weight: 800;">중량 표준</strong>에 따른 작업실시</div>
        <div>2. FMB <strong style="color: #dc2626; font-weight: 800;">유효기간 준수</strong> (미준수품 반납)</div>
        <div>3. 보관실 <strong style="color: #1d4ed8; font-weight: 800;">점검 주기는 1회/일</strong> (시업전)</div>
        <div>4. 온습도 유지를 위해 <strong style="color: #1d4ed8; font-weight: 800;">DOOR 상시 닫음</strong></div>
      </div>
    </div>
  `;
}

function buildStockRowHTML(item, idx, reportDate) {
  const curType = resolveDisplayType(item, reportDate);
  const curRubber = String(item?.f9004_rubberName ?? item?.f9004_carModel ?? '').trim();
  const curExpiry = formatExpiryMonthDay(item?.f9004_expiryDate ?? item?.f9004_compoundLot ?? '');
  const curExpiryIso = String(item?.f9004_expiryIso || toExpiryIso(curExpiry, item?.createdDate || reportDate)).trim();
  const curQtyNum = stripKgUnit(item?.f9004_amount || '');

  const rowBg = curType === '재고'
    ? '#f8fafc'
    : curType === '입고'
      ? '#f0fdf4'
      : curType === '보류'
        ? '#fffbeb'
        : '#ffffff';
  const typeColor = curType === '재고'
    ? '#1d4ed8'
    : curType === '입고'
      ? '#047857'
      : curType === '보류'
        ? '#b45309'
        : '#0f172a';

  const typeOptions = F9004_IO_TYPES.map((tp) => (
    `<option value="${escapeHtml(tp)}" ${curType === tp ? 'selected' : ''}>${escapeHtml(tp)}</option>`
  )).join('');

  const rubberList = curRubber && !F9004_RUBBER_OPTIONS.includes(curRubber)
    ? [curRubber, ...F9004_RUBBER_OPTIONS]
    : F9004_RUBBER_OPTIONS;
  const rubberOptions = rubberList.map((rb) => (
    `<option value="${escapeHtml(rb)}" translate="no" ${curRubber === rb ? 'selected' : ''}>${escapeHtml(rb)}</option>`
  )).join('');

  return `
    <tr data-f9004-row="${idx}" data-stock-id="${escapeHtml(item?.stockId || '')}" data-created-date="${escapeHtml(item?.createdDate || reportDate || '')}" style="background: ${rowBg};">
      <td data-f9004-col="no" style="border: 1px solid #000; text-align: center; font-weight: 700; padding: 4px 2px;">${idx + 1}</td>
      <td style="border: 1px solid #000; padding: 3px 2px;">
        <select id="f9004_type_${idx}" name="f9004_type_${idx}" data-f9004-field="type" class="form-control" style="font-size: 12px; font-weight: 800; color: ${typeColor}; padding: 4px 2px; height: auto; width: 100%; background: #ffffff;">
          ${typeOptions}
        </select>
      </td>
      <td style="border: 1px solid #000; padding: 3px 4px;">
        <select id="f9004_rubber_${idx}" name="f9004_rubber_${idx}" data-f9004-field="rubberName" class="form-control" style="font-size: 12.5px; font-weight: 700; padding: 4px 6px; height: auto; width: 100%; background: #ffffff;">
          <option value="">선택</option>
          ${rubberOptions}
        </select>
      </td>
      <td style="border: 1px solid #000; padding: 3px 3px;">
        <div class="f9004-mmdd-wrap" style="position: relative; width: 100%;">
          <input type="text" readonly tabindex="-1" id="f9004_expiry_${idx}" name="f9004_expiry_${idx}" data-f9004-field="expiryDate" data-expiry-iso="${escapeHtml(curExpiryIso)}" data-wheel-skip="1" class="form-control" value="${escapeHtml(curExpiry)}" placeholder="MM/DD" style="font-size: 12.5px; font-weight: 700; padding: 4px 2px; height: auto; width: 100%; text-align: center; background: #ffffff; pointer-events: none;" />
          <input type="date" id="f9004_expiry_picker_${idx}" data-f9004-date-picker="1" data-wheel-skip="1" aria-label="유효기간 날짜 선택" value="${escapeHtml(curExpiryIso)}" style="position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; margin: 0; padding: 0; border: 0; z-index: 2;" />
        </div>
      </td>
      <td style="border: 1px solid #000; padding: 3px 3px;">
        <div style="position: relative; display: flex; align-items: center;">
          <input type="text" inputmode="decimal" maxlength="6" id="f9004_qty_${idx}" name="f9004_qty_${idx}" data-f9004-field="amount" data-wheel-skip="1" class="form-control" value="${escapeHtml(curQtyNum)}" placeholder="000" style="font-size: 12.5px; font-weight: 700; padding: 4px 21px 4px 4px; height: auto; width: 100%; text-align: right; background: #ffffff;" />
          <span translate="no" style="position: absolute; right: 4px; top: 50%; transform: translateY(-50%); font-size: 11px; font-weight: 800; color: #475569; pointer-events: none;">kg</span>
        </div>
      </td>
    </tr>
  `;
}

function buildEmptyStockRowHTML() {
  return `
    <tr data-f9004-empty="1">
      <td colspan="5" style="border: 1px solid #000; padding: 12px 8px; text-align: center; color: #64748b; font-size: 12px; font-weight: 600; background: #f8fafc;">
        현재 등록된 고무실 재고가 없습니다. 아래 입력란에서 입고/재고 기록 후 업데이트하세요.
      </td>
    </tr>
  `;
}

function buildEntryRowHTML() {
  const typeOptions = F9004_IO_TYPES.map((tp) => (
    `<option value="${escapeHtml(tp)}" ${tp === '입고' ? 'selected' : ''}>${escapeHtml(tp)}</option>`
  )).join('');

  const rubberOptions = F9004_RUBBER_OPTIONS.map((rb) => (
    `<option value="${escapeHtml(rb)}" translate="no">${escapeHtml(rb)}</option>`
  )).join('');

  return `
    <tr data-f9004-entry-row="1" style="background: #eff6ff; border-top: 2px solid #0f172a;">
      <td style="border: 1px solid #000; text-align: center; font-size: 11px; font-weight: 800; color: #1d4ed8; padding: 4px 2px; white-space: nowrap;">신규</td>
      <td style="border: 1px solid #000; padding: 3px 2px;">
        <select id="f9004_new_type" name="f9004_new_type" data-f9004-new="type" class="form-control" style="font-size: 12px; font-weight: 800; padding: 4px 2px; height: auto; width: 100%; background: #ffffff;">
          ${typeOptions}
        </select>
      </td>
      <td style="border: 1px solid #000; padding: 3px 4px;">
        <select id="f9004_new_rubber" name="f9004_new_rubber" data-f9004-new="rubberName" class="form-control" style="font-size: 12.5px; font-weight: 700; padding: 4px 6px; height: auto; width: 100%; background: #ffffff;">
          <option value="">선택</option>
          ${rubberOptions}
        </select>
      </td>
      <td style="border: 1px solid #000; padding: 3px 3px;">
        <div class="f9004-mmdd-wrap" style="position: relative; width: 100%;">
          <input type="text" readonly tabindex="-1" id="f9004_new_expiry" name="f9004_new_expiry" data-f9004-new="expiryDate" data-expiry-iso="" data-wheel-skip="1" class="form-control" value="" placeholder="MM/DD" style="font-size: 12.5px; font-weight: 700; padding: 4px 2px; height: auto; width: 100%; text-align: center; background: #ffffff; pointer-events: none;" />
          <input type="date" id="f9004_new_expiry_picker" data-f9004-date-picker="1" data-wheel-skip="1" aria-label="유효기간 날짜 선택" value="" style="position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; margin: 0; padding: 0; border: 0; z-index: 2;" />
        </div>
      </td>
      <td style="border: 1px solid #000; padding: 3px 3px;">
        <div style="position: relative; display: flex; align-items: center;">
          <input type="text" inputmode="decimal" maxlength="6" id="f9004_new_qty" name="f9004_new_qty" data-f9004-new="amount" data-wheel-skip="1" class="form-control" value="" placeholder="000" style="font-size: 12.5px; font-weight: 700; padding: 4px 21px 4px 4px; height: auto; width: 100%; text-align: right; background: #ffffff;" />
          <span translate="no" style="position: absolute; right: 4px; top: 50%; transform: translateY(-50%); font-size: 11px; font-weight: 800; color: #475569; pointer-events: none;">kg</span>
        </div>
      </td>
    </tr>
  `;
}

function buildDispatchedBoxHTML(dispatchedToday) {
  if (!Array.isArray(dispatchedToday) || dispatchedToday.length === 0) return '';
  const rows = dispatchedToday.map((it, idx) => {
    const tp = normalizeIoType(it?.f9004_type || '불출');
    const rb = String(it?.f9004_rubberName || '').trim();
    const exp = formatExpiryMonthDay(it?.f9004_expiryDate || '');
    const amt = formatQtyWithKg(it?.f9004_amount || '') || '-';
    return `
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 4px 8px; background: #ffffff; border: 1px solid #fecdd3; border-radius: 4px; font-size: 12px;">
        <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
          <span style="padding: 1px 6px; border-radius: 4px; background: #ffe4e6; color: #be123c; font-weight: 800; font-size: 11px;">${escapeHtml(tp)}</span>
          <strong translate="no" style="color: #0f172a;">${escapeHtml(rb)}</strong>
          ${exp ? `<span style="color: #64748b;" translate="no">(${escapeHtml(exp)})</span>` : ''}
          <strong translate="no" style="color: #be123c;">${escapeHtml(amt)}</strong>
        </div>
        <button type="button" data-f9004-undo-dispatch="${idx}" style="font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px; border: 1px solid #cbd5e1; background: #f8fafc; color: #334155; cursor: pointer; white-space: nowrap;">되돌리기</button>
      </div>
    `;
  }).join('');

  return `
    <div style="margin-top: 8px; padding: 8px 10px; background: #fff1f2; border: 1px solid #fda4af; border-radius: 6px;">
      <div style="font-size: 11.5px; font-weight: 800; color: #9f1239; margin-bottom: 6px;">📤 금일 불출·반납 완료 (재고 차감됨)</div>
      <div style="display: flex; flex-direction: column; gap: 4px;">
        ${rows}
      </div>
    </div>
  `;
}

export function evaluateExtrusionWeight(specKey, rawVal) {
  const num = parseEnvNumber(rawVal);
  if (num === null) return { val: null, ok: null };
  const spec = F9004_EXTRUSION_SPECS.find((s) => s.key === specKey);
  if (!spec) return { val: num, ok: null };
  return { val: num, ok: num >= spec.min && num <= spec.max };
}

function buildFmbWorkSectionInputHTML(workLog) {
  const extData = workLog?.extrusion || {};
  const rollData = workLog?.winding || {};
  const stages = [
    { field: 'first', label: '초물' },
    { field: 'mid', label: '중물' },
    { field: 'last', label: '종물' }
  ];

  const init20Blocks = F9004_EXTRUSION_SPECS.map((spec, sIdx) => {
    const savedArr = Array.isArray(extData[spec.key]?.initial20) ? extData[spec.key].initial20 : [];
    const cellsHtml = Array.from({ length: F9004_INIT_PIECE_COUNT }, (_, i) => {
      const n = i + 1;
      const cellVal = String(savedArr[i] ?? '').trim();
      return `
        <div style="border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 2px 3px 3px 3px; background: #ffffff; display: flex; flex-direction: column; min-width: 0;">
          <span translate="no" style="font-size: 10px; font-weight: 800; color: #475569; line-height: 1.1; margin-bottom: 1px;">${n}</span>
          <input
            type="text"
            inputmode="decimal"
            maxlength="6"
            id="f9004_ext_${spec.key}_init_${n}"
            name="f9004_ext_${spec.key}_init_${n}"
            data-f9004-weight-spec="${spec.key}"
            data-f9004-init-group="${spec.key}"
            data-f9004-init-idx="${n}"
            data-wheel-skip="1"
            class="form-control"
            value="${escapeHtml(cellVal)}"
            placeholder="-"
            style="font-size: 12px; font-weight: 700; padding: 3px 2px; height: auto; width: 100%; text-align: center; background: #ffffff;"
          />
        </div>
      `;
    }).join('');

    return `
      <div style="${sIdx > 0 ? 'border-top: 1.5px solid #1e293b;' : ''}">
        <div style="background: #f8fafc; border-bottom: 1px solid #cbd5e1; padding: 5px 10px; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 6px; font-size: 12.5px;">
            <strong translate="no" style="color: #0f172a; font-weight: 800;">${escapeHtml(spec.code)}</strong>
            <span translate="no" style="font-size: 11.5px; color: #475569; font-weight: 700;">(${escapeHtml(spec.specLabel)})</span>
          </div>
          <span id="f9004_init20_badge_${spec.key}" style="font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: #e2e8f0; color: #334155; border: 1px solid #cbd5e1;">측정 0 / 20개</span>
        </div>
        <div class="f9004-init20-grid" style="border-right: 0; border-bottom: 0;">
          ${cellsHtml}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="margin-bottom: 20px; container-type: inline-size;">
      <h3 style="font-size: 14px; font-weight: 800; color: #000; margin-bottom: 8px;">3. 고무 압출(Piece) · 권선(Roll) 작업 및 중량 측정 기록</h3>

      <div class="f9004-work-split-grid">
        <!-- 좌측(모바일 상단): 고무 압출(Piece) -->
        <div style="border: 1.5px solid #000; border-radius: 4px; overflow: hidden; background: #ffffff; display: flex; flex-direction: column;">
          <table class="data-table" style="width: 100%; border-collapse: collapse; font-size: 12.5px; table-layout: fixed; border: 0;">
            <colgroup>
              <col style="width: 42px;" />
              <col style="width: 48px;" />
              <col />
              <col />
            </colgroup>
            <tbody>
              <tr style="background: #fef9c3;">
                <th colspan="2" style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 6px 4px; text-align: center; font-weight: 800; color: #0f172a;">작업방법</th>
                <th colspan="2" style="border-bottom: 1px solid #000; padding: 6px 6px; text-align: center; font-size: 13px; font-weight: 800; color: #0f172a;">고무 압출(Piece)</th>
              </tr>
              <tr style="background: #f8fafc;">
                <th colspan="2" style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 5px 4px; text-align: center; font-weight: 800; color: #0f172a;">배합코드</th>
                ${F9004_EXTRUSION_SPECS.map((sp, idx) => `
                  <th translate="no" style="border-bottom: 1px solid #000; ${idx === 0 ? 'border-right: 1px solid #000;' : ''} padding: 5px 4px; text-align: center; font-weight: 800; color: #0f172a;">${escapeHtml(sp.code)}</th>
                `).join('')}
              </tr>
              <tr>
                <th colspan="2" translate="no" style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 5px 4px; text-align: center; font-weight: 800; background: #f8fafc; line-height: 1.2;">FMB<br/>LOT</th>
                ${F9004_EXTRUSION_SPECS.map((sp, idx) => {
                  const lotVal = extData[sp.key]?.lot || '';
                  return `
                    <td style="border-bottom: 1px solid #000; ${idx === 0 ? 'border-right: 1px solid #000;' : ''} padding: 4px;">
                      <input type="text" id="f9004_ext_${sp.key}_lot" name="f9004_ext_${sp.key}_lot" data-wheel-skip="1" class="form-control" value="${escapeHtml(lotVal)}" placeholder="LOT 입력" style="font-size: 12px; font-weight: 700; padding: 4px 6px; height: auto; width: 100%; text-align: center;" />
                    </td>
                  `;
                }).join('')}
              </tr>
              <tr style="background: #fffbeb;">
                <th colspan="2" style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 5px 4px; text-align: center; font-weight: 800; color: #0f172a;">작업중량</th>
                ${F9004_EXTRUSION_SPECS.map((sp, idx) => `
                  <td translate="no" style="border-bottom: 1px solid #000; ${idx === 0 ? 'border-right: 1px solid #000;' : ''} padding: 5px 4px; text-align: center; font-weight: 800; color: #1e293b;">${escapeHtml(sp.specLabel)}</td>
                `).join('')}
              </tr>
              ${stages.map((st, stIdx) => {
                const isLast = stIdx === stages.length - 1;
                const btmBorder = isLast ? '0' : '1px dashed #64748b';
                return `
                  <tr>
                    ${stIdx === 0 ? `
                      <th rowspan="3" style="border-right: 1px solid #000; background: #fef9c3; padding: 4px 3px; text-align: center; font-weight: 800; line-height: 1.3; color: #0f172a; word-break: keep-all;">측정중량</th>
                    ` : ''}
                    <th style="border-bottom: ${btmBorder}; border-right: 1px solid #000; background: #e0f2fe; padding: 5px 4px; text-align: center; font-weight: 800; color: #0f172a;">${st.label}</th>
                    ${F9004_EXTRUSION_SPECS.map((sp, idx) => {
                      const stageVal = extData[sp.key]?.[st.field] || '';
                      return `
                        <td style="border-bottom: ${btmBorder}; ${idx === 0 ? 'border-right: 1px solid #000;' : ''} padding: 4px;">
                          <div style="position: relative; display: flex; align-items: center;">
                            <input
                              type="text"
                              inputmode="decimal"
                              maxlength="6"
                              id="f9004_ext_${sp.key}_${st.field}"
                              name="f9004_ext_${sp.key}_${st.field}"
                              data-f9004-weight-spec="${sp.key}"
                              data-f9004-stage-seq="${sp.key}_${stIdx}"
                              data-wheel-skip="1"
                              class="form-control"
                              value="${escapeHtml(stageVal)}"
                              placeholder="0.00"
                              style="font-size: 13px; font-weight: 800; padding: 4px 18px 4px 6px; height: auto; width: 100%; text-align: right; background: #ffffff;"
                            />
                            <span translate="no" style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); font-size: 11px; font-weight: 800; color: #64748b; pointer-events: none;">g</span>
                          </div>
                        </td>
                      `;
                    }).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- 우측(모바일 하단): 고무 권선(Roll) -->
        <div style="border: 1.5px solid #000; border-radius: 4px; overflow: hidden; background: #ffffff; display: flex; flex-direction: column;">
          <table class="data-table" style="width: 100%; height: 100%; border-collapse: collapse; font-size: 12.5px; table-layout: fixed; border: 0;">
            <colgroup>
              <col style="width: 68px;" />
              <col />
              <col />
              <col />
            </colgroup>
            <tbody>
              <tr style="background: #fef9c3;">
                <th style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 6px 4px; text-align: center; font-weight: 800; color: #0f172a;">작업방법</th>
                <th colspan="3" style="border-bottom: 1px solid #000; padding: 6px 6px; text-align: center; font-size: 13px; font-weight: 800; color: #0f172a;">고무 권선(Roll)</th>
              </tr>
              <tr style="background: #f8fafc;">
                <th style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 5px 4px; text-align: center; font-weight: 800; color: #0f172a;">배합코드</th>
                ${F9004_WINDING_SPECS.map((sp, idx) => `
                  <th translate="no" style="border-bottom: 1px solid #000; ${idx < F9004_WINDING_SPECS.length - 1 ? 'border-right: 1px solid #000;' : ''} padding: 5px 2px; text-align: center; font-size: 11.5px; font-weight: 800; color: #0f172a;">${escapeHtml(sp.code)}</th>
                `).join('')}
              </tr>
              <tr>
                <th translate="no" style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 5px 4px; text-align: center; font-weight: 800; background: #f8fafc; line-height: 1.2;">FMB<br/>LOT</th>
                ${F9004_WINDING_SPECS.map((sp, idx) => {
                  const lotVal = rollData[sp.key]?.lot || '';
                  return `
                    <td style="border-bottom: 1px solid #000; ${idx < F9004_WINDING_SPECS.length - 1 ? 'border-right: 1px solid #000;' : ''} padding: 4px 3px;">
                      <input type="text" id="f9004_roll_${sp.key}_lot" name="f9004_roll_${sp.key}_lot" data-wheel-skip="1" class="form-control" value="${escapeHtml(lotVal)}" placeholder="LOT 입력" style="font-size: 12px; font-weight: 700; padding: 4px 4px; height: auto; width: 100%; text-align: center;" />
                    </td>
                  `;
                }).join('')}
              </tr>
              <tr style="background: #fef9c3;">
                <th style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 5px 4px; text-align: center; font-weight: 800; color: #0f172a;">권선 수량</th>
                <td colspan="3" style="border-bottom: 1px solid #000; padding: 5px 8px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; flex-wrap: wrap;">
                    <span style="font-weight: 800; color: #0f172a;">※ 권선 수량 기록(EA)</span>
                    <span id="f9004_rollTotalBadge" style="font-size: 11px; font-weight: 800; padding: 1px 8px; border-radius: 999px; background: #ffffff; color: #1d4ed8; border: 1px solid #cbd5e1;">총 권선: 0 EA</span>
                  </div>
                </td>
              </tr>
              <tr>
                <th style="border-right: 1px solid #000; background: #e0f2fe; padding: 8px 4px; text-align: center; font-weight: 800; color: #0f172a;">수량<br/><span translate="no" style="font-size: 11px;">(EA)</span></th>
                ${F9004_WINDING_SPECS.map((sp, idx) => {
                  const qtyVal = String(rollData[sp.key]?.qty ?? '').replace(/\s*EA$/i, '').trim();
                  return `
                    <td style="${idx < F9004_WINDING_SPECS.length - 1 ? 'border-right: 1px solid #000;' : ''} padding: 8px 4px; vertical-align: middle;">
                      <div style="position: relative; display: flex; align-items: center;">
                        <input
                          type="text"
                          inputmode="numeric"
                          maxlength="5"
                          id="f9004_roll_${sp.key}_qty"
                          name="f9004_roll_${sp.key}_qty"
                          data-f9004-roll-qty="1"
                          data-wheel-skip="1"
                          class="form-control"
                          value="${escapeHtml(qtyVal)}"
                          placeholder="0"
                          style="font-size: 15px; font-weight: 800; padding: 8px 25px 8px 6px; height: auto; width: 100%; text-align: right; background: #ffffff;"
                        />
                        <span translate="no" style="position: absolute; right: 5px; top: 50%; transform: translateY(-50%); font-size: 11px; font-weight: 800; color: #475569; pointer-events: none;">EA</span>
                      </div>
                    </td>
                  `;
                }).join('')}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 압출 시작 후 최초 20개 전수 중량 측정 기록 -->
      <div style="border: 1.5px solid #000; border-radius: 4px; overflow: hidden; background: #ffffff;">
        <div style="background: #fef9c3; border-bottom: 1.5px solid #000; padding: 6px 10px; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span style="font-size: 12.5px; font-weight: 800; color: #0f172a;">⚖️ 압출 시작 후 최초 20개 중량 측정 기록 (초기허용불량 확인 · 단위: g)</span>
          <span style="font-size: 11px; font-weight: 700; color: #475569;">Enter 입력 시 다음 번호(1→20)로 이동</span>
        </div>
        ${init20Blocks}
      </div>
    </div>
  `;
}

function buildFmbWorkSectionDetailHTML(workLog) {
  const extData = workLog?.extrusion || {};
  const rollData = workLog?.winding || {};
  const stages = [
    { field: 'first', label: '초물' },
    { field: 'mid', label: '중물' },
    { field: 'last', label: '종물' }
  ];

  let rollTotal = 0;
  F9004_WINDING_SPECS.forEach((sp) => {
    const n = parseEnvNumber(rollData[sp.key]?.qty);
    if (n !== null && n > 0) rollTotal += n;
  });

  const init20DetailBlocks = F9004_EXTRUSION_SPECS.map((spec, sIdx) => {
    const savedArr = Array.isArray(extData[spec.key]?.initial20) ? extData[spec.key].initial20 : [];
    const filledCount = savedArr.filter((v) => String(v ?? '').trim() !== '').length;
    const cellsHtml = Array.from({ length: F9004_INIT_PIECE_COUNT }, (_, i) => {
      const n = i + 1;
      const raw = String(savedArr[i] ?? '').trim();
      const { ok } = evaluateExtrusionWeight(spec.key, raw);
      const valColor = ok === false ? '#dc2626' : '#0f172a';
      const cellBg = ok === false ? '#fff1f2' : '#ffffff';
      return `
        <div style="border-right: 1px solid #000; border-bottom: 1px solid #000; padding: 2px 3px; background: ${cellBg}; min-height: 30px; display: flex; flex-direction: column; justify-content: space-between;">
          <span translate="no" style="font-size: 9.5px; font-weight: 700; color: #64748b; line-height: 1;">${n}</span>
          <span translate="no" style="font-size: 11.5px; font-weight: 800; color: ${valColor}; text-align: center;">${escapeHtml(raw || '-')}</span>
        </div>
      `;
    }).join('');

    return `
      <div style="${sIdx > 0 ? 'border-top: 1.5px solid #000;' : ''}">
        <div style="background: #f8fafc; border-bottom: 1px solid #cbd5e1; padding: 4px 8px; display: flex; justify-content: space-between; align-items: center; gap: 6px; font-size: 11.5px;">
          <div>
            <strong translate="no" style="color: #0f172a;">${escapeHtml(spec.code)}</strong>
            <span translate="no" style="color: #475569; font-weight: 700;"> (${escapeHtml(spec.specLabel)})</span>
          </div>
          <span style="font-weight: 800; color: ${filledCount === F9004_INIT_PIECE_COUNT ? '#047857' : '#475569'};">측정 ${filledCount} / ${F9004_INIT_PIECE_COUNT}개</span>
        </div>
        <div class="f9004-init20-grid" style="border-right: 0; border-bottom: 0;">
          ${cellsHtml}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div style="margin-bottom: 14px; container-type: inline-size;">
      <div style="font-size: 13px; font-weight: 800; margin-bottom: 4px;">3. 고무 압출(Piece) · 권선(Roll) 작업 및 중량 측정 기록</div>
      <div class="f9004-work-split-grid">
        <div style="border: 1px solid #000; overflow: hidden; background: #ffffff;">
          <table class="data-table print-table" style="width: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; border: 0;">
            <colgroup>
              <col style="width: 58px;" />
              <col />
              <col />
            </colgroup>
            <tbody>
              <tr style="background: #fef9c3;">
                <th style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 4px; text-align: center;">작업방법</th>
                <th colspan="2" style="border-bottom: 1px solid #000; padding: 4px; text-align: center; font-weight: 800;">고무 압출(Piece)</th>
              </tr>
              <tr style="background: #f8fafc;">
                <th style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 4px; text-align: center;">배합코드</th>
                ${F9004_EXTRUSION_SPECS.map((sp, idx) => `
                  <th translate="no" style="border-bottom: 1px solid #000; ${idx === 0 ? 'border-right: 1px solid #000;' : ''} padding: 4px; text-align: center;">${escapeHtml(sp.code)}</th>
                `).join('')}
              </tr>
              <tr>
                <th translate="no" style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 4px; text-align: center; background: #f8fafc;">FMB LOT</th>
                ${F9004_EXTRUSION_SPECS.map((sp, idx) => `
                  <td translate="no" style="border-bottom: 1px solid #000; ${idx === 0 ? 'border-right: 1px solid #000;' : ''} padding: 4px; text-align: center; font-weight: 700;">${escapeHtml(extData[sp.key]?.lot || '-')}</td>
                `).join('')}
              </tr>
              <tr style="background: #fffbeb;">
                <th style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 4px; text-align: center;">작업중량</th>
                ${F9004_EXTRUSION_SPECS.map((sp, idx) => `
                  <td translate="no" style="border-bottom: 1px solid #000; ${idx === 0 ? 'border-right: 1px solid #000;' : ''} padding: 4px; text-align: center; font-weight: 800;">${escapeHtml(sp.specLabel)}</td>
                `).join('')}
              </tr>
              ${stages.map((st, stIdx) => {
                const btmBorder = stIdx === stages.length - 1 ? '0' : '1px solid #cbd5e1';
                return `
                  <tr>
                    <th style="border-bottom: ${btmBorder}; border-right: 1px solid #000; background: #e0f2fe; padding: 4px; text-align: center;">${st.label}</th>
                    ${F9004_EXTRUSION_SPECS.map((sp, idx) => {
                      const raw = String(extData[sp.key]?.[st.field] || '').trim();
                      const { ok } = evaluateExtrusionWeight(sp.key, raw);
                      return `
                        <td translate="no" style="border-bottom: ${btmBorder}; ${idx === 0 ? 'border-right: 1px solid #000;' : ''} padding: 4px; text-align: center; font-weight: 800; color: ${ok === false ? '#dc2626' : '#0f172a'};">${escapeHtml(raw ? `${raw} g` : '-')}</td>
                      `;
                    }).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div style="border: 1px solid #000; overflow: hidden; background: #ffffff;">
          <table class="data-table print-table" style="width: 100%; height: 100%; border-collapse: collapse; font-size: 12px; table-layout: fixed; border: 0;">
            <colgroup>
              <col style="width: 62px;" />
              <col />
              <col />
              <col />
            </colgroup>
            <tbody>
              <tr style="background: #fef9c3;">
                <th style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 4px; text-align: center;">작업방법</th>
                <th colspan="3" style="border-bottom: 1px solid #000; padding: 4px; text-align: center; font-weight: 800;">고무 권선(Roll)</th>
              </tr>
              <tr style="background: #f8fafc;">
                <th style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 4px; text-align: center;">배합코드</th>
                ${F9004_WINDING_SPECS.map((sp, idx) => `
                  <th translate="no" style="border-bottom: 1px solid #000; ${idx < F9004_WINDING_SPECS.length - 1 ? 'border-right: 1px solid #000;' : ''} padding: 4px 2px; text-align: center; font-size: 11px;">${escapeHtml(sp.code)}</th>
                `).join('')}
              </tr>
              <tr>
                <th translate="no" style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 4px; text-align: center; background: #f8fafc;">FMB LOT</th>
                ${F9004_WINDING_SPECS.map((sp, idx) => `
                  <td translate="no" style="border-bottom: 1px solid #000; ${idx < F9004_WINDING_SPECS.length - 1 ? 'border-right: 1px solid #000;' : ''} padding: 4px; text-align: center; font-weight: 700;">${escapeHtml(rollData[sp.key]?.lot || '-')}</td>
                `).join('')}
              </tr>
              <tr style="background: #fef9c3;">
                <th style="border-bottom: 1px solid #000; border-right: 1px solid #000; padding: 4px; text-align: center;">권선 수량</th>
                <td colspan="3" style="border-bottom: 1px solid #000; padding: 4px 6px; font-weight: 800;">※ 권선 수량 기록(EA) · <span>총 권선: ${formatKgNumber(rollTotal)} EA</span></td>
              </tr>
              <tr>
                <th style="border-right: 1px solid #000; background: #e0f2fe; padding: 6px 4px; text-align: center;">수량</th>
                ${F9004_WINDING_SPECS.map((sp, idx) => {
                  const q = String(rollData[sp.key]?.qty ?? '').replace(/\s*EA$/i, '').trim();
                  return `
                    <td translate="no" style="${idx < F9004_WINDING_SPECS.length - 1 ? 'border-right: 1px solid #000;' : ''} padding: 6px 4px; text-align: center; font-size: 13px; font-weight: 800;">${escapeHtml(q ? `${q} EA` : '-')}</td>
                  `;
                }).join('')}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div style="border: 1px solid #000; overflow: hidden; background: #ffffff;">
        <div style="background: #fef9c3; border-bottom: 1px solid #000; padding: 4px 8px; font-size: 12px; font-weight: 800;">⚖️ 압출 시작 후 최초 20개 중량 측정 기록 (단위: g)</div>
        ${init20DetailBlocks}
      </div>
    </div>
  `;
}

export function renderFmbPaperForm(container, existingData, loggedInWorkerName) {
  const todayStr = new Date().toLocaleDateString('sv-SE');
  let currentReportDate = existingData?.date || todayStr;
  const dateParts = currentReportDate.split('-');

  let defaultStartTime = '08:00';
  let defaultEndTime = '17:00';
  if (existingData?.workHours) {
    const times = existingData.workHours.split('~').map((t) => t.trim());
    if (times[0]) defaultStartTime = times[0];
    if (times[1]) defaultEndTime = times[1];
  }

  const envData = existingData?.f9004_env || {};
  const chkData = existingData?.f9004_checks || {};
  const workLogData = existingData?.f9004_workLog || {};
  const workDetails = existingData?.workDetails || '';

  // 초기 재고 및 금일 불출 목록 구성
  let stockItems = [];
  let dispatchedToday = [];
  let lastKnownServerDate = '';
  let hasUserAppliedUpdate = false;

  if (existingData) {
    const rawSaved = Array.isArray(existingData.f9004_items) ? existingData.f9004_items : [];
    const rawDispatched = Array.isArray(existingData.f9004_dispatched) ? existingData.f9004_dispatched : [];
    rawSaved.forEach((it, idx) => {
      const norm = normalizeStockItem(it, currentReportDate, idx);
      if (!norm.f9004_rubberName && !norm.f9004_expiryDate && !norm.f9004_amount) return;
      if (isOutflowType(norm.f9004_type)) {
        dispatchedToday.push(norm);
      } else {
        stockItems.push(norm);
      }
    });
    rawDispatched.forEach((it, idx) => {
      const norm = normalizeStockItem(it, currentReportDate, idx + 100);
      if (norm.f9004_rubberName || norm.f9004_amount) {
        dispatchedToday.push(norm);
      }
    });
  } else {
    const cached = readLocalFmbCache();
    if (cached && Array.isArray(cached.items)) {
      lastKnownServerDate = cached.lastReportDate || '';
      stockItems = cached.items
        .map((it, idx) => normalizeStockItem(it, cached.lastReportDate || currentReportDate, idx))
        .filter((it) => it.f9004_rubberName && !isOutflowType(it.f9004_type));
    }
  }

  stockItems = sortStockItems(stockItems, currentReportDate);

  container.innerHTML = `
    <div data-form-code="9004" class="paper-form-container" style="font-family: 'Noto Sans KR', sans-serif; color: #000; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 820px; margin: 0 auto;">
      <!-- 양식 상단 배지 -->
      <div style="background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(13,148,136,0.14)); border: 1px solid #10b981; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 24px;">🏷️</span>
          <div>
            <div style="font-size: 16px; font-weight: 800; color: #047857; margin-bottom: 4px;">
              양식 고유번호: #9004
            </div>
            <div style="font-size: 13px; color: #1e293b; font-weight: 600;">
              [공통] 공통 - FMB보관실 공정 전용 양식
            </div>
          </div>
        </div>
      </div>

      <!-- 종이양식 헤더 (상단 공통 카드와 병행 시 자동 숨김) -->
      <div data-f9004-paper-header="1" style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 14px;">
        <h2 style="font-size: 24px; font-weight: 800; color: #000; letter-spacing: 2px; margin: 0;">FMB보관실 작업일보</h2>
        <table style="border-collapse: collapse; border: 1px solid #000; font-size: 13px; text-align: center;">
          <tr>
            <td style="border: 1px solid #000; width: 60px; background: #f1f5f9; font-weight: 700;">작성</td>
            <td style="border: 1px solid #000; width: 60px; background: #f1f5f9; font-weight: 700;">승인</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; height: 40px; vertical-align: middle; font-weight: 700;">${escapeHtml(loggedInWorkerName || '작업자')}</td>
            <td style="border: 1px solid #000; height: 40px;"></td>
          </tr>
        </table>
      </div>

      <!-- 동기화용 숨김 날짜·시간 필드 -->
      <div data-f9004-paper-date="1" style="display: none; margin-bottom: 14px;">
        <input type="hidden" id="f9004_year" value="${escapeHtml(dateParts[0]?.substring(2) || '26')}" />
        <input type="hidden" id="f9004_month" value="${escapeHtml(dateParts[1] || '01')}" />
        <input type="hidden" id="f9004_day" value="${escapeHtml(dateParts[2] || '01')}" />
        <input type="hidden" id="f9004_startTime" value="${escapeHtml(defaultStartTime)}" />
        <input type="hidden" id="f9004_endTime" value="${escapeHtml(defaultEndTime)}" />
      </div>

      <!-- 1. 보관실 온·습도 및 일일 관리 점검표 -->
      <div class="f9004-env-split-wrap" style="margin-bottom: 20px; container-type: inline-size;">
        <style>
          [data-form-code="9004"] .f9004-env-split-grid {
            display: grid;
            grid-template-columns: 1.12fr 1fr;
            gap: 12px;
            align-items: stretch;
            margin-bottom: 12px;
          }
          [data-form-code="9004"] .f9004-temp-hum-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          [data-form-code="9004"] .f9004-stock-summary-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 6px;
          }
          [data-form-code="9004"] .f9004-work-split-grid {
            display: grid;
            grid-template-columns: 1.04fr 1fr;
            gap: 10px;
            align-items: stretch;
            margin-bottom: 10px;
          }
          [data-form-code="9004"] .f9004-init20-grid {
            display: grid;
            grid-template-columns: repeat(10, minmax(0, 1fr));
            border-top: 1px solid #000;
            border-left: 1px solid #000;
          }
          [data-form-code="9004"] input[data-f9004-date-picker="1"]::-webkit-calendar-picker-indicator {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            opacity: 0;
            cursor: pointer;
          }
          body.mobile-preview-mode [data-form-code="9004"] .f9004-env-split-grid,
          body.mobile-preview-mode [data-form-code="9004"] .f9004-stock-summary-grid,
          body.mobile-preview-mode [data-form-code="9004"] .f9004-work-split-grid {
            grid-template-columns: 1fr;
          }
          body.mobile-preview-mode [data-form-code="9004"] .f9004-init20-grid {
            grid-template-columns: repeat(5, minmax(0, 1fr));
          }
          @container (max-width: 640px) {
            [data-form-code="9004"] .f9004-env-split-grid,
            [data-form-code="9004"] .f9004-work-split-grid {
              grid-template-columns: 1fr;
            }
            [data-form-code="9004"] .f9004-init20-grid {
              grid-template-columns: repeat(5, minmax(0, 1fr));
            }
          }
          @container (max-width: 520px) {
            [data-form-code="9004"] .f9004-stock-summary-grid {
              grid-template-columns: 1fr;
            }
          }
          @container (max-width: 340px) {
            [data-form-code="9004"] .f9004-temp-hum-grid {
              grid-template-columns: 1fr;
            }
          }
          @media (max-width: 768px) {
            [data-form-code="9004"] .f9004-env-split-grid,
            [data-form-code="9004"] .f9004-stock-summary-grid,
            [data-form-code="9004"] .f9004-work-split-grid {
              grid-template-columns: 1fr;
            }
            [data-form-code="9004"] .f9004-init20-grid {
              grid-template-columns: repeat(5, minmax(0, 1fr));
            }
          }
        </style>
        <h3 style="font-size: 14px; font-weight: 800; color: #000; margin-bottom: 8px;">1. 보관실 온·습도 및 선입선출 일일 점검표</h3>

        <div class="f9004-env-split-grid">
          <!-- 좌측(모바일 상단): FMB 보관실 관리 표준 -->
          ${buildFmbStandardLeftBoxHTML(false)}

          <!-- 우측(모바일 하단): 당일 온·습도 기록 입력란 -->
          <div class="f9004-env-input-box" style="border: 1.5px solid #1e293b; border-radius: 6px; overflow: hidden; background: #ffffff; display: flex; flex-direction: column; word-break: keep-all;">
            <div style="background: #eff6ff; border-bottom: 1.5px solid #1e293b; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span style="font-size: 14px; font-weight: 800; color: #0f172a; white-space: nowrap;">🌡️💧 당일 온·습도 기록</span>
              <span id="f9004_envStatusBadge" style="font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 999px; background: #e2e8f0; color: #334155; border: 1px solid #cbd5e1; white-space: nowrap;">시업전 1회/일</span>
            </div>

            <div style="padding: 12px; background: #f8fafc; flex: 1; display: flex; flex-direction: column; justify-content: space-between; gap: 10px;">
              <div class="f9004-temp-hum-grid">
                <div style="min-width: 0;">
                  <label for="f9004_temp" style="display: block; font-size: 12px; font-weight: 800; color: #b91c1c; margin-bottom: 4px; white-space: nowrap;">🌡️ 당일 온도 (℃)</label>
                  <div style="position: relative;">
                    <input type="text" inputmode="decimal" id="f9004_temp" name="f9004_temp" data-wheel-skip="1" class="form-control" value="${escapeHtml(envData.f9004_temp || '')}" placeholder="예: 24.8" style="font-size: 16px; padding: 8px 28px 8px 10px; height: auto; font-weight: 800; text-align: right; color: #0f172a; background: #ffffff; width: 100%;" />
                    <span style="position: absolute; right: 9px; top: 50%; transform: translateY(-50%); font-size: 12px; font-weight: 800; color: #64748b; pointer-events: none;">℃</span>
                  </div>
                  <div id="f9004_tempHint" style="font-size: 11px; font-weight: 700; color: #64748b; margin-top: 4px;">기준: 20 ± 5℃ (15~25℃)</div>
                </div>

                <div style="min-width: 0;">
                  <label for="f9004_humidity" style="display: block; font-size: 12px; font-weight: 800; color: #0369a1; margin-bottom: 4px; white-space: nowrap;">💧 당일 습도 (%)</label>
                  <div style="position: relative;">
                    <input type="text" inputmode="decimal" id="f9004_humidity" name="f9004_humidity" data-wheel-skip="1" class="form-control" value="${escapeHtml(envData.f9004_humidity || '')}" placeholder="예: 60.7" style="font-size: 16px; padding: 8px 26px 8px 10px; height: auto; font-weight: 800; text-align: right; color: #0f172a; background: #ffffff; width: 100%;" />
                    <span style="position: absolute; right: 9px; top: 50%; transform: translateY(-50%); font-size: 12px; font-weight: 800; color: #64748b; pointer-events: none;">%</span>
                  </div>
                  <div id="f9004_humHint" style="font-size: 11px; font-weight: 700; color: #64748b; margin-top: 4px;">기준: 70% 이하</div>
                </div>
              </div>

              <div style="padding-top: 8px; border-top: 1px dashed #cbd5e1;">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: 6px; margin-bottom: 4px; flex-wrap: wrap;">
                  <label for="f9004_envNote" style="font-size: 11.5px; font-weight: 800; color: #334155; margin: 0; white-space: nowrap;">🕒 점검 시각 / 환경 비고</label>
                  <button type="button" id="f9004_btnStampPreShift" data-f9004-now-btn="1" style="font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; border: 1px solid #93c5fd; background: #eff6ff; color: #1d4ed8; cursor: pointer; white-space: nowrap; flex-shrink: 0;">시업전 시각 자동기입</button>
                </div>
                <input type="text" id="f9004_envNote" name="f9004_envNote" data-wheel-skip="1" class="form-control" value="${escapeHtml(envData.f9004_envNote || '')}" placeholder="예: 07:50 시업전 점검 정상" style="font-size: 13px; padding: 6px 8px; height: auto; background: #ffffff; width: 100%;" />
              </div>
            </div>
          </div>
        </div>

        <table class="data-table" style="border: 1px solid #000; font-size: 13px; width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f1f5f9; color: #000;">
              <th style="border: 1px solid #000; text-align: center; padding: 6px; width: 50px;">No</th>
              <th style="border: 1px solid #000; text-align: center; padding: 6px;">점검 항목</th>
              <th style="border: 1px solid #000; text-align: center; padding: 6px; width: 130px;">상태 (양호/불량)</th>
            </tr>
          </thead>
          <tbody>
            ${F9004_CHECKLIST_ITEMS.map((item, idx) => {
              const rawVal = chkData[item.id] ?? (item.id === 'f9004_chk_mon' ? chkData.f9004_chk1 : undefined);
              const isGood = rawVal !== false;
              const refBadge = item.refNote
                ? ` <span style="display: inline-block; margin-left: 6px; padding: 1px 6px; font-size: 11px; font-weight: 700; color: #0369a1; background: #e0f2fe; border: 1px solid #bae6fd; border-radius: 4px; vertical-align: middle;">${escapeHtml(item.refNote)}</span>`
                : '';
              return `
                <tr>
                  <td style="border: 1px solid #000; text-align: center; font-weight: 700; padding: 6px;">${idx + 1}</td>
                  <td style="border: 1px solid #000; font-weight: 600; padding: 6px;"><span>${escapeHtml(item.text)}</span>${refBadge}</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 6px;">
                    <div style="display: flex; justify-content: center; gap: 10px;">
                      <label style="cursor: pointer; display: flex; align-items: center; gap: 4px;">
                        <input type="radio" name="${item.id}" value="true" ${isGood ? 'checked' : ''} />
                        양호
                      </label>
                      <label style="cursor: pointer; display: flex; align-items: center; gap: 4px; color: #dc2626;">
                        <input type="radio" name="${item.id}" value="false" ${!isGood ? 'checked' : ''} />
                        불량
                      </label>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- 2. 금일 입고·불출 및 재고 관리 내역 -->
      <div style="margin-bottom: 20px; container-type: inline-size;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 8px; flex-wrap: wrap;">
          <h3 style="font-size: 14px; font-weight: 800; color: #000; margin: 0;">2. 금일 입고 · 불출 및 재고 관리 내역</h3>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span id="f9004_stockSyncStatus" style="font-size: 11px; font-weight: 700; color: #64748b;"></span>
            <button type="button" id="f9004_btnUpdateStock" class="btn btn-primary btn-sm" style="font-size: 12px; font-weight: 800; padding: 5px 12px; border-radius: 6px; cursor: pointer;">
              🔄 기록 업데이트
            </button>
          </div>
        </div>

        <div id="f9004_stockSummaryBar">
          ${buildStockSummaryBarHTML(stockItems, false)}
        </div>

        <div style="overflow-x: auto;">
          <table class="data-table" style="border: 1px solid #000; font-size: 13px; width: 100%; border-collapse: collapse; table-layout: fixed; min-width: 340px;">
            <colgroup>
              <col style="width: 28px;" />
              <col style="width: 66px;" />
              <col />
              <col style="width: 68px;" />
              <col style="width: 76px;" />
            </colgroup>
            <thead>
              <tr style="background: #f1f5f9; color: #000;">
                <th style="border: 1px solid #000; text-align: center; padding: 5px 2px; white-space: nowrap;">No</th>
                <th style="border: 1px solid #000; text-align: center; padding: 5px 2px; white-space: nowrap;">구분</th>
                <th style="border: 1px solid #000; text-align: center; padding: 5px 6px; white-space: nowrap;">고무명</th>
                <th style="border: 1px solid #000; text-align: center; padding: 5px 2px; white-space: nowrap;">유효기간</th>
                <th style="border: 1px solid #000; text-align: center; padding: 5px 2px; white-space: nowrap;">수량(kg)</th>
              </tr>
            </thead>
            <tbody id="f9004_tbody">
              ${stockItems.length > 0
                ? stockItems.map((item, idx) => buildStockRowHTML(item, idx, currentReportDate)).join('')
                : buildEmptyStockRowHTML()}
            </tbody>
            <tfoot id="f9004_entryTfoot">
              ${buildEntryRowHTML()}
            </tfoot>
          </table>
        </div>

        <div id="f9004_dispatchedBox">
          ${buildDispatchedBoxHTML(dispatchedToday)}
        </div>
      </div>

      <!-- 3. 고무 압출(Piece) · 권선(Roll) 작업 및 중량 측정 기록 -->
      ${buildFmbWorkSectionInputHTML(workLogData)}

      <!-- 4. 특이사항 -->
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; font-weight: 800; color: #000; margin-bottom: 8px;">4. 금일 주요 작업 내용 및 특이사항</h3>
        <textarea id="f9004_workDetails" name="f9004_workDetails" class="form-control" rows="3" placeholder="유효기간 임박 원재료 현황, 항온항습 특이사항, 교대 전달사항 등을 입력하세요." style="font-size: 13px; resize: vertical; width: 100%; border: 1px solid #000; border-radius: 4px; padding: 8px;">${escapeHtml(workDetails)}</textarea>
      </div>

      <!-- 하단 저장·제출 버튼 -->
      <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px dashed #cbd5e1;">
        <button type="button" id="f9004_btnDraftSave" class="btn btn-secondary" style="font-weight: 700; min-width: 120px;">
          📁 중간 저장
        </button>
        <button type="button" id="f9004_btnFinalSubmit" class="btn btn-primary" style="font-weight: 700; min-width: 120px;">
          ✅ 제출 (승인 대기)
        </button>
      </div>
    </div>
  `;

  const root = container.querySelector('[data-form-code="9004"]');
  if (!root) return;

  const tbody = root.querySelector('#f9004_tbody');
  const entryTfoot = root.querySelector('#f9004_entryTfoot');
  const stockSummaryBar = root.querySelector('#f9004_stockSummaryBar');
  const dispatchedBox = root.querySelector('#f9004_dispatchedBox');
  const stockSyncStatus = root.querySelector('#f9004_stockSyncStatus');
  const btnUpdateStock = root.querySelector('#f9004_btnUpdateStock');
  const btnDraftSave = root.querySelector('#f9004_btnDraftSave');
  const btnFinalSubmit = root.querySelector('#f9004_btnFinalSubmit');
  const tempInput = root.querySelector('#f9004_temp');
  const humInput = root.querySelector('#f9004_humidity');
  const envNoteInput = root.querySelector('#f9004_envNote');
  const tempHint = root.querySelector('#f9004_tempHint');
  const humHint = root.querySelector('#f9004_humHint');
  const envStatusBadge = root.querySelector('#f9004_envStatusBadge');
  const btnStampPreShift = root.querySelector('#f9004_btnStampPreShift');

  const setTranslatableText = (el, koText) => {
    if (!el) return;
    const doc = el.ownerDocument || document;
    el.replaceChildren(doc.createTextNode(koText));
    i18n.applyTranslations(el);
  };

  const resolveEffectiveDate = () => {
    const formRoot = container.closest('form, [id="mobileWorkReportForm"]')?.parentElement || container.closest('[data-form-root]');
    const outerDate = formRoot?.querySelector('#reportDate')?.value;
    if (outerDate) return outerDate;
    const yy = root.querySelector('#f9004_year')?.value;
    const mm = root.querySelector('#f9004_month')?.value;
    const dd = root.querySelector('#f9004_day')?.value;
    if (yy && mm && dd) return `20${yy}-${mm}-${dd}`;
    return currentReportDate;
  };

  const renderStockSection = () => {
    currentReportDate = resolveEffectiveDate();
    stockItems = sortStockItems(stockItems, currentReportDate);
    if (tbody) {
      tbody.innerHTML = stockItems.length > 0
        ? stockItems.map((item, idx) => buildStockRowHTML(item, idx, currentReportDate)).join('')
        : buildEmptyStockRowHTML();
      i18n.applyTranslations(tbody);
    }
    if (stockSummaryBar) {
      stockSummaryBar.innerHTML = buildStockSummaryBarHTML(stockItems, false);
      i18n.applyTranslations(stockSummaryBar);
    }
    if (dispatchedBox) {
      dispatchedBox.innerHTML = buildDispatchedBoxHTML(dispatchedToday);
      i18n.applyTranslations(dispatchedBox);
    }
  };

  const resetEntryRow = () => {
    if (!entryTfoot) return;
    entryTfoot.innerHTML = buildEntryRowHTML();
    i18n.applyTranslations(entryTfoot);
  };

  const persistLiveInventory = (effectiveDate) => {
    // 과거 날짜의 이미 저장된 일보를 사후 수정할 때는 최신 실시간 재고를 덮어쓰지 않음
    if (existingData?.id && lastKnownServerDate && effectiveDate < lastKnownServerDate) {
      return;
    }
    writeLocalFmbCache(stockItems, effectiveDate);
    const roleInfo = store.getUserRole?.();
    const worker = existingData?.workerName || roleInfo?.workerName || loggedInWorkerName || '작업자';
    saveFmbInventory(stockItems, { reportDate: effectiveDate, workerName: worker })
      .then(() => {
        lastKnownServerDate = effectiveDate;
        if (stockSyncStatus && root.isConnected) {
          stockSyncStatus.style.color = '#059669';
          setTranslatableText(stockSyncStatus, '✓ 재고 업데이트됨');
        }
      })
      .catch(() => {
        if (stockSyncStatus && root.isConnected) {
          stockSyncStatus.style.color = '#64748b';
          setTranslatableText(stockSyncStatus, '로컬 저장됨');
        }
      });
  };

  /**
   * [🔄 기록 업데이트] 실행:
   * 1) 기존 재고 행에서 수정된 내용 반영 (구분을 '불출'/'반납'으로 변경한 행은 재고에서 즉시 제거)
   * 2) 하단 '신규' 입력 행에 기록된 입고/재고 추가 또는 불출/반납 차감·제거
   * 3) 이월 재고 최상단 정렬 및 실시간 재고(Firestore + localStorage) 동기화
   */
  const applyStockUpdate = ({ fromSave = false } = {}) => {
    currentReportDate = resolveEffectiveDate();
    hasUserAppliedUpdate = true;

    // 1. 기존 재고 행 동기화
    if (tbody) {
      const nextStock = [];
      tbody.querySelectorAll('tr[data-f9004-row]').forEach((tr, idx) => {
        const prev = stockItems[idx] || {};
        const rawType = normalizeIoType(tr.querySelector('[data-f9004-field="type"]')?.value || '재고');
        const rubberName = String(tr.querySelector('[data-f9004-field="rubberName"]')?.value || '').trim();
        const expiryInput = tr.querySelector('[data-f9004-field="expiryDate"]');
        const expiryDate = formatExpiryMonthDay(expiryInput?.value || '');
        const createdDate = tr.getAttribute('data-created-date') || prev.createdDate || currentReportDate;
        const expiryIso = expiryInput?.getAttribute('data-expiry-iso') || toExpiryIso(expiryDate, createdDate);
        const qtyRaw = tr.querySelector('[data-f9004-field="amount"]')?.value || '';
        const qtyNum = parseKgNum(qtyRaw);
        const amount = formatQtyWithKg(qtyRaw);

        if (!rubberName) return;

        // 기존 행의 구분을 '불출' 또는 '반납'으로 변경하거나 수량을 0으로 만든 경우 -> 고무실 재고에서 제거
        if (isOutflowType(rawType) || (qtyRaw.trim() !== '' && qtyNum !== null && qtyNum <= 0)) {
          dispatchedToday.push({
            stockId: prev.stockId || makeStockId(idx),
            f9004_type: isOutflowType(rawType) ? rawType : '불출',
            f9004_rubberName: rubberName,
            f9004_expiryDate: expiryDate,
            f9004_expiryIso: expiryIso,
            f9004_amount: amount || prev.f9004_amount || '',
            createdDate
          });
          return;
        }

        nextStock.push({
          stockId: prev.stockId || tr.getAttribute('data-stock-id') || makeStockId(idx),
          f9004_type: rawType,
          f9004_rubberName: rubberName,
          f9004_expiryDate: expiryDate,
          f9004_expiryIso: expiryIso,
          f9004_amount: amount,
          createdDate
        });
      });
      stockItems = nextStock;
    }

    // 2. 하단 '신규' 입력 행 처리
    if (entryTfoot) {
      const newType = normalizeIoType(entryTfoot.querySelector('#f9004_new_type')?.value || '입고');
      const newRubberEl = entryTfoot.querySelector('#f9004_new_rubber');
      const newRubber = String(newRubberEl?.value || '').trim();
      const newExpiryEl = entryTfoot.querySelector('#f9004_new_expiry');
      const newExpiry = formatExpiryMonthDay(newExpiryEl?.value || '');
      const newExpiryIso = newExpiryEl?.getAttribute('data-expiry-iso') || toExpiryIso(newExpiry, currentReportDate);
      const newQtyRaw = String(entryTfoot.querySelector('#f9004_new_qty')?.value || '').trim();
      const newAmount = formatQtyWithKg(newQtyRaw);

      if (!newRubber && (newExpiry || newQtyRaw)) {
        if (!fromSave) {
          windowMock?.showToast?.('⚠️ 고무명을 선택해 주세요.', 'warning');
          newRubberEl?.focus?.();
          return false;
        }
      } else if (newRubber) {
        if (isOutflowType(newType)) {
          // 불출/반납 등록 -> 현재 고무실 재고에서 일치 항목 제거 또는 중량 차감
          stockItems = sortStockItems(stockItems, currentReportDate);
          const reqKg = parseKgNum(newQtyRaw);
          const candidateIndices = [];
          // 유효기간 지정 시 해당 유효기간 재고 우선 매칭, 그 외 선입선출(FIFO) 순서 매칭
          stockItems.forEach((st, i) => {
            if (st.f9004_rubberName === newRubber && newExpiry && st.f9004_expiryDate === newExpiry) {
              candidateIndices.push(i);
            }
          });
          stockItems.forEach((st, i) => {
            if (st.f9004_rubberName === newRubber && !candidateIndices.includes(i)) {
              candidateIndices.push(i);
            }
          });

          if (candidateIndices.length === 0) {
            if (!fromSave) {
              windowMock?.showToast?.('⚠️ 해당 고무명의 현재 재고가 없습니다.', 'warning');
            }
          } else if (reqKg === null || reqKg <= 0) {
            // 수량 미입력 불출 시 최우선 매칭 재고 1건을 전량 불출 제거
            const targetIdx = candidateIndices[0];
            const removed = stockItems.splice(targetIdx, 1)[0];
            dispatchedToday.push({
              ...removed,
              f9004_type: newType
            });
          } else {
            let remaining = reqKg;
            const toRemove = new Set();
            let matchedExpiry = newExpiry;
            for (const cIdx of candidateIndices) {
              if (remaining <= 0) break;
              const st = stockItems[cIdx];
              if (!matchedExpiry && st.f9004_expiryDate) matchedExpiry = st.f9004_expiryDate;
              const stKg = parseKgNum(st.f9004_amount);
              if (stKg === null || stKg <= remaining) {
                toRemove.add(cIdx);
                remaining -= (stKg || remaining);
              } else {
                st.f9004_amount = `${formatKgNumber(stKg - remaining)}kg`;
                remaining = 0;
              }
            }
            stockItems = stockItems.filter((_, i) => !toRemove.has(i));
            dispatchedToday.push({
              stockId: makeStockId(dispatchedToday.length),
              f9004_type: newType,
              f9004_rubberName: newRubber,
              f9004_expiryDate: matchedExpiry,
              f9004_expiryIso: newExpiryIso || toExpiryIso(matchedExpiry, currentReportDate),
              f9004_amount: `${formatKgNumber(reqKg)}kg`,
              createdDate: currentReportDate
            });
          }
        } else {
          // 입고 / 재고 / 보류 신규 등록
          stockItems.push({
            stockId: makeStockId(stockItems.length),
            f9004_type: newType || '입고',
            f9004_rubberName: newRubber,
            f9004_expiryDate: newExpiry,
            f9004_expiryIso: newExpiryIso,
            f9004_amount: newAmount,
            createdDate: currentReportDate
          });
        }
        resetEntryRow();
      }
    }

    renderStockSection();
    persistLiveInventory(currentReportDate);
    return true;
  };

  // 날짜 변경 동기화 콜백 등록 (작성일을 다음날로 바꾸면 이월 항목이 즉시 최상단 '재고'로 표시됨)
  container._onF9004DateSync = (newDateVal) => {
    if (newDateVal && newDateVal !== currentReportDate) {
      currentReportDate = newDateVal;
      renderStockSection();
    }
  };

  // 신규 일보 작성 시 Firestore 실시간 고무실 재고 로드
  if (!existingData) {
    fetchFmbInventory().then((res) => {
      if (!root.isConnected || hasUserAppliedUpdate || res?.offlineError) return;
      lastKnownServerDate = res.lastReportDate || '';
      const loaded = (Array.isArray(res.items) ? res.items : [])
        .map((it, idx) => normalizeStockItem(it, res.lastReportDate || currentReportDate, idx))
        .filter((it) => it.f9004_rubberName && !isOutflowType(it.f9004_type));
      stockItems = sortStockItems(loaded, resolveEffectiveDate());
      writeLocalFmbCache(stockItems, res.lastReportDate || resolveEffectiveDate());
      renderStockSection();
    });
  } else {
    fetchFmbInventory().then((res) => {
      if (!res?.offlineError) {
        lastKnownServerDate = res.lastReportDate || '';
      }
    });
  }

  // 유효기간 달력 선택창(showPicker) 및 MM/DD 표기 동기화 (root 내부 한정 - 원칙 13)
  root.addEventListener('click', (e) => {
    const picker = e.target.closest?.('input[data-f9004-date-picker="1"]');
    if (picker) {
      if (typeof picker.showPicker === 'function') {
        try {
          picker.showPicker();
        } catch {
          // 모바일 등 기본 브라우저 데이트피커 동작으로 위임
        }
      }
      return;
    }

    const undoBtn = e.target.closest?.('[data-f9004-undo-dispatch]');
    if (undoBtn) {
      const uIdx = Number(undoBtn.getAttribute('data-f9004-undo-dispatch'));
      if (Number.isInteger(uIdx) && dispatchedToday[uIdx]) {
        const restored = dispatchedToday.splice(uIdx, 1)[0];
        hasUserAppliedUpdate = true;
        const restoreDate = restored.createdDate || currentReportDate;
        stockItems.push({
          ...restored,
          f9004_type: restoreDate < currentReportDate ? '재고' : '입고'
        });
        renderStockSection();
        persistLiveInventory(currentReportDate);
      }
    }
  });

  const syncDatePickerValue = (e) => {
    const picker = e.target.closest?.('input[data-f9004-date-picker="1"]');
    if (!picker) return;
    const wrap = picker.closest('.f9004-mmdd-wrap');
    const dispInput = wrap?.querySelector('[data-f9004-field="expiryDate"], #f9004_new_expiry');
    if (dispInput) {
      const iso = picker.value || '';
      dispInput.value = formatExpiryMonthDay(iso);
      dispInput.setAttribute('data-expiry-iso', iso);
    }
  };
  root.addEventListener('input', syncDatePickerValue);
  root.addEventListener('change', (e) => {
    syncDatePickerValue(e);
    // 기존 재고 행에서 구분을 '불출'/'반납'으로 바꾸면 업데이트 대기 강조 표시
    const sel = e.target.closest?.('tr[data-f9004-row] [data-f9004-field="type"]');
    if (sel) {
      const tr = sel.closest('tr[data-f9004-row]');
      if (tr) {
        if (isOutflowType(sel.value)) {
          tr.style.background = '#fff1f2';
          sel.style.color = '#be123c';
        } else {
          tr.style.background = sel.value === '재고' ? '#f8fafc' : sel.value === '입고' ? '#f0fdf4' : '#fffbeb';
          sel.style.color = sel.value === '재고' ? '#1d4ed8' : sel.value === '입고' ? '#047857' : '#b45309';
        }
      }
    }
  });

  if (entryTfoot) {
    entryTfoot.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target?.id === 'f9004_new_qty') {
        e.preventDefault();
        applyStockUpdate({ fromSave: false });
      }
    });
  }

  if (btnUpdateStock) {
    btnUpdateStock.addEventListener('click', () => {
      applyStockUpdate({ fromSave: false });
    });
  }

  const updateEnvSpecFeedback = () => {
    const { tempOk, humOk } = evaluateF9004EnvSpec(tempInput?.value, humInput?.value);

    if (tempInput && tempHint) {
      if (tempOk === null) {
        tempInput.style.borderColor = '';
        tempHint.style.color = '#64748b';
        setTranslatableText(tempHint, '기준: 20 ± 5℃ (15~25℃)');
      } else if (tempOk) {
        tempInput.style.borderColor = '#10b981';
        tempHint.style.color = '#059669';
        setTranslatableText(tempHint, '적합 (15~25℃ 이내)');
      } else {
        tempInput.style.borderColor = '#ef4444';
        tempHint.style.color = '#dc2626';
        setTranslatableText(tempHint, '기준 이탈! (15~25℃)');
      }
    }

    if (humInput && humHint) {
      if (humOk === null) {
        humInput.style.borderColor = '';
        humHint.style.color = '#64748b';
        setTranslatableText(humHint, '기준: 70% 이하');
      } else if (humOk) {
        humInput.style.borderColor = '#10b981';
        humHint.style.color = '#059669';
        setTranslatableText(humHint, '적합 (70% 이하)');
      } else {
        humInput.style.borderColor = '#ef4444';
        humHint.style.color = '#dc2626';
        setTranslatableText(humHint, '기준 이탈! (70% 이하)');
      }
    }

    if (envStatusBadge) {
      if (tempOk === false || humOk === false) {
        envStatusBadge.style.background = '#fef2f2';
        envStatusBadge.style.color = '#dc2626';
        envStatusBadge.style.borderColor = '#fca5a5';
        setTranslatableText(envStatusBadge, '⚠️ 관리기준 이탈');
      } else if (tempOk === true && humOk === true) {
        envStatusBadge.style.background = '#ecfdf5';
        envStatusBadge.style.color = '#047857';
        envStatusBadge.style.borderColor = '#6ee7b7';
        setTranslatableText(envStatusBadge, '✅ 관리기준 적합');
      } else {
        envStatusBadge.style.background = '#e2e8f0';
        envStatusBadge.style.color = '#334155';
        envStatusBadge.style.borderColor = '#cbd5e1';
        setTranslatableText(envStatusBadge, '시업전 1회/일');
      }
    }
  };

  if (tempInput) tempInput.addEventListener('input', updateEnvSpecFeedback);
  if (humInput) humInput.addEventListener('input', updateEnvSpecFeedback);

  if (btnStampPreShift && envNoteInput) {
    btnStampPreShift.addEventListener('click', () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mi = String(now.getMinutes()).padStart(2, '0');
      envNoteInput.value = `${hh}:${mi} 시업전 점검`;
      envNoteInput.focus();
    });
  }

  const updateWorkLogFeedback = () => {
    root.querySelectorAll('input[data-f9004-weight-spec]').forEach((inp) => {
      const specKey = inp.getAttribute('data-f9004-weight-spec');
      const { ok } = evaluateExtrusionWeight(specKey, inp.value);
      if (ok === null) {
        inp.style.borderColor = '';
        inp.style.color = '#0f172a';
        inp.style.background = '#ffffff';
      } else if (ok) {
        inp.style.borderColor = '#10b981';
        inp.style.color = '#047857';
        inp.style.background = '#ffffff';
      } else {
        inp.style.borderColor = '#ef4444';
        inp.style.color = '#dc2626';
        inp.style.background = '#fff1f2';
      }
    });

    F9004_EXTRUSION_SPECS.forEach((sp) => {
      const badge = root.querySelector(`#f9004_init20_badge_${sp.key}`);
      if (!badge) return;
      let filled = 0;
      for (let i = 1; i <= F9004_INIT_PIECE_COUNT; i += 1) {
        const val = (root.querySelector(`#f9004_ext_${sp.key}_init_${i}`)?.value || '').trim();
        if (val !== '') filled += 1;
      }
      if (filled === F9004_INIT_PIECE_COUNT) {
        badge.style.background = '#ecfdf5';
        badge.style.color = '#047857';
        badge.style.borderColor = '#6ee7b7';
        setTranslatableText(badge, '✅ 20 / 20개 측정 완료');
      } else if (filled > 0) {
        badge.style.background = '#eff6ff';
        badge.style.color = '#1d4ed8';
        badge.style.borderColor = '#93c5fd';
        setTranslatableText(badge, `측정 ${filled} / ${F9004_INIT_PIECE_COUNT}개`);
      } else {
        badge.style.background = '#e2e8f0';
        badge.style.color = '#334155';
        badge.style.borderColor = '#cbd5e1';
        setTranslatableText(badge, `측정 0 / ${F9004_INIT_PIECE_COUNT}개`);
      }
    });

    const rollTotalBadge = root.querySelector('#f9004_rollTotalBadge');
    if (rollTotalBadge) {
      let sum = 0;
      root.querySelectorAll('input[data-f9004-roll-qty="1"]').forEach((inp) => {
        const n = parseEnvNumber(inp.value);
        if (n !== null && n > 0) sum += n;
      });
      setTranslatableText(rollTotalBadge, `총 권선: ${formatKgNumber(sum)} EA`);
    }
  };

  root.addEventListener('input', (e) => {
    const t = e.target;
    if (t?.hasAttribute?.('data-f9004-weight-spec') || t?.hasAttribute?.('data-f9004-roll-qty')) {
      updateWorkLogFeedback();
    }
  });

  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const t = e.target;
    if (!t) return;
    const initGroup = t.getAttribute?.('data-f9004-init-group');
    if (initGroup) {
      e.preventDefault();
      const curIdx = Number(t.getAttribute('data-f9004-init-idx') || 0);
      const nextInp = root.querySelector(`#f9004_ext_${initGroup}_init_${curIdx + 1}`);
      nextInp?.focus?.();
      return;
    }
    const stageSeq = t.getAttribute?.('data-f9004-stage-seq');
    if (stageSeq) {
      e.preventDefault();
      const [spKey, stIdxStr] = stageSeq.split('_');
      const nextStageInp = root.querySelector(`[data-f9004-stage-seq="${spKey}_${Number(stIdxStr) + 1}"]`);
      nextStageInp?.focus?.();
    }
  });

  i18n.applyTranslations(root);
  updateEnvSpecFeedback();
  updateWorkLogFeedback();

  const processFmbSave = (targetStatus) => {
    try {
      // 저장/제출 전 입력란에 남아있는 미반영 기록도 자동 업데이트
      applyStockUpdate({ fromSave: true });

      const fullDate = resolveEffectiveDate();
      const formRoot = container.closest('form, [id="mobileWorkReportForm"]')?.parentElement || container.closest('[data-form-root]');

      const stFromOuter = formRoot?.querySelector('#startTimeInput')?.value;
      const etFromOuter = formRoot?.querySelector('#endTimeInput')?.value;
      const st = stFromOuter || root.querySelector('#f9004_startTime')?.value || '08:00';
      const et = etFromOuter || root.querySelector('#f9004_endTime')?.value || '17:00';
      const workHours = `${st} ~ ${et}`;

      const f9004_env = {
        f9004_temp: (root.querySelector('#f9004_temp')?.value || '').trim(),
        f9004_humidity: (root.querySelector('#f9004_humidity')?.value || '').trim(),
        f9004_envNote: (root.querySelector('#f9004_envNote')?.value || '').trim()
      };

      const f9004_checks = {};
      F9004_CHECKLIST_ITEMS.forEach((item) => {
        const checked = root.querySelector(`input[name="${item.id}"]:checked`);
        f9004_checks[item.id] = checked ? checked.value === 'true' : true;
      });

      const f9004_items = sortStockItems(stockItems, fullDate).map((it) => ({
        stockId: it.stockId,
        f9004_type: resolveDisplayType(it, fullDate),
        f9004_rubberName: it.f9004_rubberName,
        f9004_expiryDate: formatExpiryMonthDay(it.f9004_expiryDate),
        f9004_expiryIso: it.f9004_expiryIso || toExpiryIso(it.f9004_expiryDate, it.createdDate || fullDate),
        f9004_amount: formatQtyWithKg(it.f9004_amount),
        createdDate: it.createdDate || fullDate
      }));

      const f9004_dispatched = dispatchedToday.map((it) => ({
        stockId: it.stockId || '',
        f9004_type: normalizeIoType(it.f9004_type || '불출'),
        f9004_rubberName: it.f9004_rubberName || '',
        f9004_expiryDate: formatExpiryMonthDay(it.f9004_expiryDate || ''),
        f9004_expiryIso: it.f9004_expiryIso || '',
        f9004_amount: formatQtyWithKg(it.f9004_amount || ''),
        createdDate: it.createdDate || fullDate
      }));

      const f9004_workLog = { extrusion: {}, winding: {} };
      F9004_EXTRUSION_SPECS.forEach((sp) => {
        const initial20 = Array.from({ length: F9004_INIT_PIECE_COUNT }, (_, i) => (
          (root.querySelector(`#f9004_ext_${sp.key}_init_${i + 1}`)?.value || '').trim()
        ));
        f9004_workLog.extrusion[sp.key] = {
          code: sp.code,
          lot: (root.querySelector(`#f9004_ext_${sp.key}_lot`)?.value || '').trim(),
          first: (root.querySelector(`#f9004_ext_${sp.key}_first`)?.value || '').trim(),
          mid: (root.querySelector(`#f9004_ext_${sp.key}_mid`)?.value || '').trim(),
          last: (root.querySelector(`#f9004_ext_${sp.key}_last`)?.value || '').trim(),
          initial20
        };
      });
      F9004_WINDING_SPECS.forEach((sp) => {
        f9004_workLog.winding[sp.key] = {
          code: sp.code,
          lot: (root.querySelector(`#f9004_roll_${sp.key}_lot`)?.value || '').trim(),
          qty: (root.querySelector(`#f9004_roll_${sp.key}_qty`)?.value || '').trim()
        };
      });

      const workDetailsText = root.querySelector('#f9004_workDetails')?.value || '';
      const currentUserRole = store.getUserRole();
      const currentWorkerName = existingData?.workerName || currentUserRole?.workerName || loggedInWorkerName || '작업자';

      const reportData = {
        date: fullDate,
        workHours,
        shift: '주간',
        carModel: '공통',
        processName: 'FMB보관실',
        line: '1라인',
        workerName: currentWorkerName,
        workerId: existingData?.workerId || 'EMP001',
        itemCode: '공통',
        itemName: '공통',
        targetQty: 0,
        actualQty: 0,
        defectQty: 0,
        isFmbForm: true,
        formCode: 9004,
        f9004_env,
        f9004_checks,
        f9004_items,
        f9004_dispatched,
        f9004_workLog,
        workDetails: workDetailsText,
        status: targetStatus,
        notes: targetStatus === '임시저장'
          ? `[FMB보관실] ${currentWorkerName} 중간 저장 (${workHours}).`
          : `[FMB보관실] ${currentWorkerName} 작성 완료 (${workHours}).`
      };

      if (existingData?.id) {
        store.updateReport(existingData.id, reportData);
        if (targetStatus === '임시저장') {
          windowMock.showToast('📁 작업일보가 중간 저장되었습니다.', 'info');
        } else {
          windowMock.showToast('✅ 작업일보가 등록 완료되었습니다.', 'success');
        }
      } else {
        store.addReport(reportData);
        if (targetStatus === '임시저장') {
          windowMock.showToast('📁 FMB보관실 작업일보 중간 저장 성공!', 'info');
        } else {
          windowMock.showToast('✅ FMB보관실 작업일보 등록 완료 성공!', 'success');
        }
      }

      if (windowMock.appInstance) {
        if (targetStatus === '임시저장') return;
        const userRoleInfo = store.getUserRole();
        if (userRoleInfo && userRoleInfo.role === 'worker') {
          windowMock.appInstance.switchTab('drafts');
        } else {
          windowMock.appInstance.switchTab('reports');
        }
      }
    } catch (err) {
      console.error('Error saving FMB storage report:', err);
      windowMock.showToast(`⚠️ 저장 중 오류가 발생했습니다: ${err.message}`, 'error');
    }
  };

  if (btnDraftSave) {
    btnDraftSave.addEventListener('click', () => processFmbSave('임시저장'));
  }
  if (btnFinalSubmit) {
    btnFinalSubmit.addEventListener('click', () => processFmbSave('승인 대기'));
  }
}

export function mountF9004InReportForm(container, existingData, loggedInWorkerName) {
  ['#leaderFormContainer', '#forkliftFormContainer', '#supportFormContainer'].forEach((sel) => {
    const el = container.querySelector(sel);
    if (el) el.style.display = 'none';
  });

  const hideOtherFixedBars = () => {
    ['standardFixedActionBar', 'leaderFixedActionBar', 'forkliftFixedActionBar'].forEach((barId) => {
      const barEl = document.getElementById(barId);
      if (barEl) barEl.style.display = 'none';
    });
  };
  hideOtherFixedBars();
  setTimeout(hideOtherFixedBars, 50);

  let fmbContainer = container.querySelector('#f9004FormContainer');
  if (!fmbContainer) {
    fmbContainer = document.createElement('div');
    fmbContainer.id = 'f9004FormContainer';
    const formEl = container.querySelector('#mobileWorkReportForm') || container;
    formEl.appendChild(fmbContainer);
  }
  if (fmbContainer._syncAbort) {
    fmbContainer._syncAbort.abort();
    fmbContainer._syncAbort = null;
  }
  fmbContainer.style.display = 'block';

  renderFmbPaperForm(fmbContainer, existingData, loggedInWorkerName);

  const paperHeader = fmbContainer.querySelector('[data-f9004-paper-header="1"]');
  if (paperHeader) paperHeader.style.display = 'none';

  const AbortCtrl = container.ownerDocument?.defaultView?.AbortController || AbortController;
  const syncAbort = new AbortCtrl();
  const syncDate = (val) => {
    const parts = String(val || '').split('-');
    if (parts.length === 3) {
      const fy = fmbContainer.querySelector('#f9004_year');
      const fm = fmbContainer.querySelector('#f9004_month');
      const fd = fmbContainer.querySelector('#f9004_day');
      if (fy) fy.value = parts[0].substring(2);
      if (fm) fm.value = parts[1];
      if (fd) fd.value = parts[2];
      if (typeof fmbContainer._onF9004DateSync === 'function') {
        fmbContainer._onF9004DateSync(val);
      }
    }
  };

  const reportDate = container.querySelector('#reportDate');
  if (reportDate) {
    syncDate(reportDate.value);
    reportDate.addEventListener('change', (e) => syncDate(e.target.value), { signal: syncAbort.signal });
  }
  const stInput = container.querySelector('#startTimeInput');
  if (stInput) {
    const fSt = fmbContainer.querySelector('#f9004_startTime');
    if (fSt) {
      fSt.value = stInput.value;
      stInput.addEventListener('change', (e) => { fSt.value = e.target.value; }, { signal: syncAbort.signal });
    }
  }
  const etInput = container.querySelector('#endTimeInput');
  if (etInput) {
    const fEt = fmbContainer.querySelector('#f9004_endTime');
    if (fEt) {
      fEt.value = etInput.value;
      etInput.addEventListener('change', (e) => { fEt.value = e.target.value; }, { signal: syncAbort.signal });
    }
  }
  fmbContainer._syncAbort = syncAbort;
}

export function buildFmbDetailHTML(r) {
  const env = r?.f9004_env || {};
  const chkData = r?.f9004_checks || {};
  const rawItems = Array.isArray(r?.f9004_items) ? r.f9004_items : [];
  const dispatched = Array.isArray(r?.f9004_dispatched) ? r.f9004_dispatched : [];
  const items = sortStockItems(rawItems, r?.date || '');
  const statusClass = r?.status === '승인 완료' ? 'approved' : r?.status === '반려' ? 'rejected' : 'pending';

  return `
    <div class="print-report-sheet" data-form-code="9004" style="font-family: 'Noto Sans KR', sans-serif; color: #000; padding: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px;">
        <div>
          <h2 style="font-size: 24px; font-weight: 800; color: #000; letter-spacing: 2px; margin: 0;">FMB보관실 작업일보</h2>
          <div style="font-size: 13px; color: #475569; margin-top: 2px;">일보ID: ${escapeHtml(r?.id || '')} | 작성자: ${escapeHtml(r?.workerName || '')}</div>
        </div>
        <table style="border-collapse: collapse; border: 1px solid #000; font-size: 13px; text-align: center;">
          <tr>
            <td style="border: 1px solid #000; width: 45px; background: #f1f5f9; font-weight: 700;">작성</td>
            <td style="border: 1px solid #000; width: 45px; background: #f1f5f9; font-weight: 700;">승인</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; height: 35px; vertical-align: middle; font-weight: 700;">${escapeHtml(r?.workerName || '')}</td>
            <td style="border: 1px solid #000; height: 35px; vertical-align: middle;">${escapeHtml(r?.approver || '생산부장')}</td>
          </tr>
        </table>
      </div>

      <div style="background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(13,148,136,0.14)); border: 1px solid #10b981; border-radius: 3px; padding: 4px 8px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 4px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 13px;">🏷️</span>
          <div>
            <div style="font-size: 13px; font-weight: 800; color: #047857;">
              양식 고유번호: #${escapeHtml(r?.formCode || 9004)}
            </div>
            <div style="font-size: 13px; color: #1e293b; font-weight: 600;">
              [공통] 공통 - FMB보관실 공정 전용 양식
            </div>
          </div>
        </div>
        <span class="status-badge ${statusClass}" style="font-size: 13px; font-weight: 700;">
          ${escapeHtml(r?.status || '')}
        </span>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
        <div>작성일 : ${escapeHtml(r?.date || '')}</div>
        <div>근무시간 : ${escapeHtml(r?.workHours || '08:00 ~ 17:00')}</div>
      </div>

      <div style="margin-bottom: 14px; container-type: inline-size;">
        <style>
          [data-form-code="9004"] .f9004-detail-split-grid {
            display: grid;
            grid-template-columns: 1.15fr 1fr;
            gap: 10px;
            align-items: stretch;
            margin-bottom: 8px;
          }
          [data-form-code="9004"] .f9004-stock-summary-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 6px;
          }
          [data-form-code="9004"] .f9004-work-split-grid {
            display: grid;
            grid-template-columns: 1.04fr 1fr;
            gap: 8px;
            align-items: stretch;
            margin-bottom: 8px;
          }
          [data-form-code="9004"] .f9004-init20-grid {
            display: grid;
            grid-template-columns: repeat(10, minmax(0, 1fr));
            border-top: 1px solid #000;
            border-left: 1px solid #000;
          }
          @media screen {
            body.mobile-preview-mode [data-form-code="9004"] .f9004-detail-split-grid,
            body.mobile-preview-mode [data-form-code="9004"] .f9004-stock-summary-grid,
            body.mobile-preview-mode [data-form-code="9004"] .f9004-work-split-grid {
              grid-template-columns: 1fr;
            }
            body.mobile-preview-mode [data-form-code="9004"] .f9004-init20-grid {
              grid-template-columns: repeat(5, minmax(0, 1fr));
            }
            @container (max-width: 640px) {
              [data-form-code="9004"] .f9004-detail-split-grid,
              [data-form-code="9004"] .f9004-work-split-grid {
                grid-template-columns: 1fr;
              }
              [data-form-code="9004"] .f9004-init20-grid {
                grid-template-columns: repeat(5, minmax(0, 1fr));
              }
            }
            @container (max-width: 520px) {
              [data-form-code="9004"] .f9004-stock-summary-grid {
                grid-template-columns: 1fr;
              }
            }
            @media (max-width: 768px) {
              [data-form-code="9004"] .f9004-detail-split-grid,
              [data-form-code="9004"] .f9004-stock-summary-grid,
              [data-form-code="9004"] .f9004-work-split-grid {
                grid-template-columns: 1fr;
              }
              [data-form-code="9004"] .f9004-init20-grid {
                grid-template-columns: repeat(5, minmax(0, 1fr));
              }
            }
          }
        </style>
        <div style="font-size: 13px; font-weight: 800; margin-bottom: 6px;">1. 보관실 온·습도 및 선입선출 일일 점검표</div>
        ${(() => {
          const { tempOk, humOk } = evaluateF9004EnvSpec(env.f9004_temp, env.f9004_humidity);
          const judgeText = (tempOk === false || humOk === false)
            ? '관리기준 이탈'
            : (tempOk === true && humOk === true)
              ? '관리기준 적합'
              : '미입력';
          const judgeColor = (tempOk === false || humOk === false)
            ? '#dc2626'
            : (tempOk === true && humOk === true)
              ? '#059669'
              : '#64748b';
          return `
            <div class="f9004-detail-split-grid">
              ${buildFmbStandardLeftBoxHTML(true)}
              <div style="border: 1.5px solid #1e293b; border-radius: 6px; overflow: hidden; background: #ffffff; display: flex; flex-direction: column;">
                <div style="background: #eff6ff; border-bottom: 1.5px solid #1e293b; padding: 6px 10px; text-align: center; font-size: 13px; font-weight: 800; color: #0f172a;">
                  당일 온·습도 기록
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px; flex: 1;">
                  <tbody>
                    <tr>
                      <th style="border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; background: #fef2f2; color: #991b1b; padding: 6px 8px; width: 38%; text-align: left;">당일 온도 (℃)</th>
                      <td style="border-bottom: 1px solid #cbd5e1; padding: 6px 10px; font-size: 14px; font-weight: 800; color: ${tempOk === false ? '#dc2626' : '#0f172a'};">
                        ${escapeHtml(env.f9004_temp ? `${env.f9004_temp} ℃` : '-')}
                      </td>
                    </tr>
                    <tr>
                      <th style="border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; background: #f0f9ff; color: #075985; padding: 6px 8px; text-align: left;">당일 습도 (%)</th>
                      <td style="border-bottom: 1px solid #cbd5e1; padding: 6px 10px; font-size: 14px; font-weight: 800; color: ${humOk === false ? '#dc2626' : '#0f172a'};">
                        ${escapeHtml(env.f9004_humidity ? `${env.f9004_humidity} %` : '-')}
                      </td>
                    </tr>
                    <tr>
                      <th style="border-bottom: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1; background: #f8fafc; color: #334155; padding: 6px 8px; text-align: left;">기준 판정</th>
                      <td style="border-bottom: 1px solid #cbd5e1; padding: 6px 10px; font-weight: 800; color: ${judgeColor};">${judgeText}</td>
                    </tr>
                    <tr>
                      <th style="border-right: 1px solid #cbd5e1; background: #f8fafc; color: #334155; padding: 6px 8px; text-align: left;">점검 시각 / 비고</th>
                      <td style="padding: 6px 10px; font-weight: 600; color: #334155;">${escapeHtml(env.f9004_envNote || '-')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          `;
        })()}
        <table class="data-table print-table" style="border: 1px solid #000; font-size: 13px; width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f1f5f9; color: #000;">
              <th style="border: 1px solid #000; text-align: center; padding: 4px; width: 45px;">No</th>
              <th style="border: 1px solid #000; text-align: center; padding: 4px;">점검 항목</th>
              <th style="border: 1px solid #000; text-align: center; padding: 4px; width: 100px;">상태</th>
            </tr>
          </thead>
          <tbody>
            ${((('f9004_chk1' in chkData) && !('f9004_chk_mon' in chkData)) ? F9004_LEGACY_CHECKLIST_ITEMS : F9004_CHECKLIST_ITEMS).map((item, idx) => {
              const isGood = chkData[item.id] !== false;
              const refBadge = item.refNote
                ? ` <span style="display: inline-block; margin-left: 6px; padding: 1px 6px; font-size: 10.5px; font-weight: 700; color: #0369a1; background: #e0f2fe; border: 1px solid #bae6fd; border-radius: 4px; vertical-align: middle;">${escapeHtml(item.refNote)}</span>`
                : '';
              return `
                <tr>
                  <td style="border: 1px solid #000; text-align: center; padding: 4px; font-weight: 700;">${idx + 1}</td>
                  <td style="border: 1px solid #000; padding: 4px; font-weight: 600;"><span>${escapeHtml(item.text)}</span>${refBadge}</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 4px; font-weight: 800; color: ${isGood ? '#059669' : '#dc2626'};">
                    ${isGood ? '양호 (O)' : '불량 (X)'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div style="margin-bottom: 14px; container-type: inline-size;">
        <div style="font-size: 13px; font-weight: 800; margin-bottom: 4px;">2. 금일 입고 · 불출 및 재고 관리 내역</div>
        ${buildStockSummaryBarHTML(items, true)}
        <table class="data-table print-table" style="border: 1px solid #000; font-size: 13px; width: 100%; border-collapse: collapse; table-layout: fixed;">
          <colgroup>
            <col style="width: 34px;" />
            <col style="width: 68px;" />
            <col />
            <col style="width: 78px;" />
            <col style="width: 86px;" />
          </colgroup>
          <thead>
            <tr style="background: #f1f5f9; color: #000;">
              <th style="border: 1px solid #000; text-align: center; padding: 4px 2px;">No</th>
              <th style="border: 1px solid #000; text-align: center; padding: 4px 2px;">구분</th>
              <th style="border: 1px solid #000; text-align: center; padding: 4px 6px;">고무명</th>
              <th style="border: 1px solid #000; text-align: center; padding: 4px 2px;">유효기간</th>
              <th style="border: 1px solid #000; text-align: center; padding: 4px 2px;">수량(kg)</th>
            </tr>
          </thead>
          <tbody>
            ${items.length > 0 ? items.map((row, idx) => {
              const ioType = resolveDisplayType(row, r?.date || '');
              const rubberName = row.f9004_rubberName ?? row.f9004_carModel ?? '';
              const expiryDate = formatExpiryMonthDay(row.f9004_expiryDate ?? row.f9004_compoundLot ?? '');
              const amountDisp = formatQtyWithKg(row.f9004_amount || '');
              return `
                <tr>
                  <td style="border: 1px solid #000; text-align: center; padding: 4px 2px; font-weight: 700;">${idx + 1}</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 4px 2px; font-weight: 700;">${escapeHtml(ioType)}</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 4px 6px; font-weight: 700;" translate="no">${escapeHtml(rubberName)}</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 4px 2px;">${escapeHtml(expiryDate)}</td>
                  <td style="border: 1px solid #000; text-align: right; padding: 4px 8px; font-weight: 700;">${escapeHtml(amountDisp)}</td>
                </tr>
              `;
            }).join('') : `
              <tr>
                <td colspan="5" style="border: 1px solid #000; text-align: center; padding: 8px; color: #64748b;">등록된 잔여 재고 없음</td>
              </tr>
            `}
          </tbody>
        </table>
        ${dispatched.length > 0 ? `
          <div style="margin-top: 6px; padding: 6px 8px; background: #fff1f2; border: 1px solid #fda4af; border-radius: 4px; font-size: 12px;">
            <div style="font-weight: 800; color: #9f1239; margin-bottom: 4px;">📤 금일 불출·반납 완료 내역</div>
            ${dispatched.map((d) => {
              const tp = normalizeIoType(d.f9004_type || '불출');
              const rb = d.f9004_rubberName || '';
              const exp = formatExpiryMonthDay(d.f9004_expiryDate || '');
              const amt = formatQtyWithKg(d.f9004_amount || '') || '-';
              return `<div style="color: #0f172a;">• [${escapeHtml(tp)}] <strong translate="no">${escapeHtml(rb)}</strong> ${exp ? `(${escapeHtml(exp)})` : ''} — <strong translate="no">${escapeHtml(amt)}</strong></div>`;
            }).join('')}
          </div>
        ` : ''}
      </div>

      ${buildFmbWorkSectionDetailHTML(r?.f9004_workLog)}

      <div style="margin-bottom: 14px;">
        <div style="font-size: 13px; font-weight: 800; margin-bottom: 4px;">4. 금일 주요 작업 내용 및 특이사항</div>
        <div style="border: 1px solid #000; padding: 10px; min-height: 90px; font-size: 12px; white-space: pre-wrap;">${escapeHtml(r?.workDetails || '입력된 내용 없음')}</div>
      </div>
    </div>
  `;
}
