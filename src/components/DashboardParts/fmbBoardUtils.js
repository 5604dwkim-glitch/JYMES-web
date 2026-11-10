export const FMB_RUBBER_GRADES = ['W60664$OS', 'W6082$NA', 'W60905'];

export const FMB_CHECKLIST_META = [
  { id: 'f9004_chk_mon', legacyId: 'f9004_chk1', shortText: '온/습도 모니터링 장비 정상작동 (ON/OFF)', fullText: '온/습도 모니터링 장비는 정상작동중인가? (ON/OFF 유무)' },
  { id: 'f9004_chk_alarm', shortText: '온/습도 경광등 및 경보음 정상작동 (F/proof)', fullText: '온/습도 경광등 및 경보음은 정상작동중인가? (F/proof 정상작동 여부)' },
  { id: 'f9004_chk2', shortText: 'FMB 선입선출(FIFO) 준수 및 적재 구역 구분', fullText: 'FMB(배합고무) 선입선출(FIFO) 준수 및 적재 구역 구분 상태' },
  { id: 'f9004_chk3', shortText: 'LOT 식별표 부착 및 유효기간 경과품 확인', fullText: '원재료 LOT 식별표 부착 및 유효기간(사용기한) 경과품 유무 확인' },
  { id: 'f9004_chk4', shortText: '이물질·직사광선 차단 및 비닐 커버 밀봉', fullText: '이물질·오염·직사광선 차단 및 비닐 커버 밀봉 보관 상태' },
  { id: 'f9004_chk5', shortText: '보관실 통로 정리정돈 및 안전·소방 시설', fullText: '보관실 통로 정리정돈 및 안전·소방 시설 이상 유무' }
];

const STATUS_PRIORITY = {
  '승인 완료': 3,
  '승인 대기': 2,
  '반려': 1,
  '임시저장': 0
};

export function parseKg(raw) {
  if (raw === null || raw === undefined) return 0;
  const clean = String(raw).replace(/,/g, '').replace(/\s*kg$/i, '').trim();
  if (!clean) return 0;
  const m = clean.match(/-?\d+(?:\.\d+)?/);
  if (!m) return 0;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : 0;
}

export function formatKg(num) {
  const rounded = Math.round((Number(num) || 0) * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function formatMmDd(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  const ymd = s.match(/^(?:\d{2}|\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
  if (ymd) return `${ymd[1].padStart(2, '0')}/${ymd[2].padStart(2, '0')}`;
  const md = s.match(/^(\d{1,2})[-./](\d{1,2})$/);
  if (md) return `${md[1].padStart(2, '0')}/${md[2].padStart(2, '0')}`;
  if (/^\d{4}$/.test(s)) return `${s.slice(0, 2)}/${s.slice(2, 4)}`;
  return s;
}

function normalizeIoType(raw) {
  const s = String(raw || '').trim();
  if (s === '불출(투입)') return '불출';
  if (s === '재고점검') return '재고';
  if (s === '보류·격리') return '보류';
  return s;
}

export function buildLiveStockSummary(rawItems = [], todayStr = '') {
  const gradeMap = new Map();
  FMB_RUBBER_GRADES.forEach((g) => {
    gradeMap.set(g, { code: g, kg: 0, lotCount: 0, earliestExpiry: '', earliestIso: '9999-99-99' });
  });

  const normalized = (Array.isArray(rawItems) ? rawItems : [])
    .map((it) => {
      const code = String(it?.f9004_rubberName ?? it?.f9004_carModel ?? '').trim();
      const rawTp = normalizeIoType(it?.f9004_type || '재고') || '재고';
      const createdDate = String(it?.createdDate || '');
      const dispType = (createdDate && todayStr && createdDate < todayStr && rawTp !== '보류' && rawTp !== '불출' && rawTp !== '반납')
        ? '재고'
        : rawTp;
      const expiry = formatMmDd(it?.f9004_expiryDate ?? it?.f9004_compoundLot ?? '');
      const expiryIso = String(it?.f9004_expiryIso || '').trim() || (expiry ? `2026-${expiry.replace('/', '-')}` : '9999-99-99');
      const kg = parseKg(it?.f9004_amount);
      return {
        stockId: it?.stockId || '',
        code,
        dispType,
        expiry,
        expiryIso,
        kg,
        amountDisp: kg > 0 ? `${formatKg(kg)} kg` : (String(it?.f9004_amount || '').trim() || '-'),
        createdDate
      };
    })
    .filter((it) => it.code && it.dispType !== '불출' && it.dispType !== '반납');

  const sortedRows = [...normalized].sort((a, b) => {
    const rank = (r) => (r.dispType === '재고' ? 0 : r.dispType === '입고' ? 1 : 2);
    const diff = rank(a) - rank(b);
    if (diff !== 0) return diff;
    return a.expiryIso.localeCompare(b.expiryIso);
  });

  let totalKg = 0;
  let totalLots = 0;

  sortedRows.forEach((row) => {
    if (!gradeMap.has(row.code)) {
      gradeMap.set(row.code, { code: row.code, kg: 0, lotCount: 0, earliestExpiry: '', earliestIso: '9999-99-99' });
    }
    const entry = gradeMap.get(row.code);
    entry.kg += row.kg;
    entry.lotCount += 1;
    if (row.expiry && row.expiryIso < entry.earliestIso) {
      entry.earliestIso = row.expiryIso;
      entry.earliestExpiry = row.expiry;
    }
    totalKg += row.kg;
    totalLots += 1;
  });

  return {
    grades: Array.from(gradeMap.values()),
    totalKg,
    totalLots,
    sortedRows
  };
}

export function buildMonthlyIoAndCheckSummary(fmbReports = [], selectedMonth = '', fallbackAlarmHistory = []) {
  // 일자별 대표 일보 1건 선정 (중복 집계 방지)
  const byDate = new Map();
  (Array.isArray(fmbReports) ? fmbReports : []).forEach((r) => {
    const d = String(r?.date || '');
    if (!d.startsWith(`${selectedMonth}-`)) return;
    const prev = byDate.get(d);
    if (!prev) {
      byDate.set(d, r);
      return;
    }
    const pa = STATUS_PRIORITY[prev?.status] ?? 1;
    const pb = STATUS_PRIORITY[r?.status] ?? 1;
    if (pb > pa || (pb === pa && String(r?.id || '') > String(prev?.id || ''))) {
      byDate.set(d, r);
    }
  });

  const dailyPrimary = Array.from(byDate.values()).sort((a, b) => String(a.date).localeCompare(String(b.date)));

  // 1) 입고 / 출고(불출·반납) 집계
  const ioByGrade = new Map();
  FMB_RUBBER_GRADES.forEach((g) => ioByGrade.set(g, { code: g, inKg: 0, outKg: 0 }));

  let inTotalKg = 0;
  let outTotalKg = 0;
  const ioLogs = [];
  const seenInboundStockIds = new Set();

  dailyPrimary.forEach((r) => {
    const rDate = String(r.date || '');
    const mmdd = formatMmDd(rDate);
    const worker = r.workerName || '-';

    // 당일 신규 입고분 추출 (이월된 재고 제외)
    (Array.isArray(r.f9004_items) ? r.f9004_items : []).forEach((it) => {
      const code = String(it?.f9004_rubberName ?? it?.f9004_carModel ?? '').trim();
      if (!code) return;
      const tp = normalizeIoType(it?.f9004_type || '');
      if (tp === '불출' || tp === '반납') {
        // 구버전 일보 호환: f9004_items 내 불출/반납 기록
        const kg = parseKg(it?.f9004_amount);
        if (!ioByGrade.has(code)) ioByGrade.set(code, { code, inKg: 0, outKg: 0 });
        ioByGrade.get(code).outKg += kg;
        outTotalKg += kg;
        ioLogs.push({
          date: rDate,
          mmdd,
          ioKind: tp,
          code,
          expiry: formatMmDd(it?.f9004_expiryDate ?? it?.f9004_compoundLot ?? ''),
          kg,
          amountDisp: kg > 0 ? `${formatKg(kg)} kg` : (it?.f9004_amount || '-'),
          worker
        });
        return;
      }

      const isNewToday = it?.createdDate
        ? it.createdDate === rDate && tp === '입고'
        : tp === '입고';
      if (!isNewToday) return;
      if (it?.stockId && seenInboundStockIds.has(it.stockId)) return;
      if (it?.stockId) seenInboundStockIds.add(it.stockId);

      const kg = parseKg(it?.f9004_amount);
      if (!ioByGrade.has(code)) ioByGrade.set(code, { code, inKg: 0, outKg: 0 });
      ioByGrade.get(code).inKg += kg;
      inTotalKg += kg;
      ioLogs.push({
        date: rDate,
        mmdd,
        ioKind: '입고',
        code,
        expiry: formatMmDd(it?.f9004_expiryDate ?? it?.f9004_compoundLot ?? ''),
        kg,
        amountDisp: kg > 0 ? `${formatKg(kg)} kg` : (it?.f9004_amount || '-'),
        worker
      });
    });

    // 당일 출고(불출·반납) 목록 추출
    (Array.isArray(r.f9004_dispatched) ? r.f9004_dispatched : []).forEach((dIt) => {
      const code = String(dIt?.f9004_rubberName || '').trim();
      if (!code) return;
      const tp = normalizeIoType(dIt?.f9004_type || '불출') || '불출';
      const kg = parseKg(dIt?.f9004_amount);
      if (!ioByGrade.has(code)) ioByGrade.set(code, { code, inKg: 0, outKg: 0 });
      ioByGrade.get(code).outKg += kg;
      outTotalKg += kg;
      ioLogs.push({
        date: rDate,
        mmdd,
        ioKind: tp,
        code,
        expiry: formatMmDd(dIt?.f9004_expiryDate || ''),
        kg,
        amountDisp: kg > 0 ? `${formatKg(kg)} kg` : (dIt?.f9004_amount || '-'),
        worker
      });
    });
  });

  // 최신순 정렬
  const recentLogs = [...ioLogs].sort((a, b) => b.date.localeCompare(a.date));

  // 2) 일일 점검 항목별 결과 집계 (당월 최근 일보 기준 + 월간 양호/불량 일수)
  const latestMonthReport = dailyPrimary.length > 0 ? dailyPrimary[dailyPrimary.length - 1] : null;
  const checkResults = FMB_CHECKLIST_META.map((meta, idx) => {
    let passCount = 0;
    let failCount = 0;

    dailyPrimary.forEach((r) => {
      const chks = r?.f9004_checks || {};
      const val = chks[meta.id] ?? (meta.legacyId ? chks[meta.legacyId] : undefined);
      if (val === false) failCount += 1;
      else if (val === true || Object.keys(chks).length > 0) passCount += 1;
    });

    let latestOk = null;
    if (latestMonthReport) {
      const lChks = latestMonthReport.f9004_checks || {};
      const raw = lChks[meta.id] ?? (meta.legacyId ? lChks[meta.legacyId] : undefined);
      latestOk = raw !== false;
    }

    return {
      no: idx + 1,
      id: meta.id,
      shortText: meta.shortText,
      fullText: meta.fullText,
      latestOk,
      passCount,
      failCount
    };
  });

  const rawAlarms = Array.isArray(latestMonthReport?.f9004_alarmHistory) && latestMonthReport.f9004_alarmHistory.some((a) => a?.symptom || a?.action)
    ? latestMonthReport.f9004_alarmHistory
    : (Array.isArray(fallbackAlarmHistory) ? fallbackAlarmHistory : []);

  const activeAlarms = rawAlarms
    .map((a) => ({
      symptom: String(a?.symptom || '').trim(),
      action: String(a?.action || '').trim()
    }))
    .filter((a) => a.symptom || a.action);

  return {
    ioGrades: Array.from(ioByGrade.values()),
    inTotalKg,
    outTotalKg,
    recentLogs,
    latestReport: latestMonthReport,
    checkResults,
    activeAlarms
  };
}
