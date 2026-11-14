import { extractDefectBreakdown } from './statsAggregator.js';
import { resolveF5006Equip } from '../components/DynamicForms/forms/f5006/equipConfig.js';

export const GM_9BQC_GRUN_PROCESS_DEFS = [
  {
    code: 5001,
    processName: '소재준비-글라스본딩',
    shortName: '글라스본딩',
    stageGroup: '소재준비',
    partDesc: 'PRI · TIN (LH/RH)'
  },
  {
    code: 5002,
    processName: '소재준비-정치절단',
    shortName: '정치절단',
    stageGroup: '소재준비',
    partDesc: 'FRT(A~C) · RR(A·B)',
    sideLabelPair: ['FRT', 'RR']
  },
  {
    code: 5003,
    processName: '소재준비-단컷팅',
    shortName: '단컷팅',
    stageGroup: '소재준비',
    partDesc: 'FRT · RR (LH/RH A·B)'
  },
  {
    code: 5004,
    processName: '조인트-FRT',
    shortName: '조인트-FRT',
    stageGroup: '조인트',
    partDesc: 'FRT LH/RH (A~C)'
  },
  {
    code: 5005,
    processName: '조인트-RR R부',
    shortName: '조인트-RR R부',
    stageGroup: '조인트',
    partDesc: 'RR LH/RH (A·B)'
  },
  {
    code: 5006,
    processName: '조인트-RR Fixed',
    shortName: '조인트-RR Fixed',
    stageGroup: '조인트',
    partDesc: 'RR LH/RH (A·B)'
  },
  {
    code: 5007,
    processName: '후가공-D/V',
    shortName: '후가공-D/V',
    stageGroup: '후가공',
    partDesc: 'D/V · RR가공 (LH/RH)'
  },
  {
    code: 5010,
    processName: '후가공-RR',
    shortName: '후가공-RR',
    stageGroup: '후가공',
    partDesc: 'RR LH/RH (A·B)'
  },
  {
    code: 5011,
    processName: '검사포장-FRT',
    shortName: '검사포장-FRT',
    stageGroup: '검사포장',
    partDesc: 'FRT LH/RH (A~C)'
  },
  {
    code: 5012,
    processName: '검사포장-RR R부',
    shortName: '검사포장-RR R부',
    stageGroup: '검사포장',
    partDesc: 'RR LH/RH (A·B)'
  },
  {
    code: 5013,
    processName: '검사포장-RR',
    shortName: '검사포장-RR',
    stageGroup: '검사포장',
    partDesc: 'RR LH/RH (A·B)'
  },
  {
    code: 5014,
    processName: '검사포장-길이',
    shortName: '검사포장-길이',
    stageGroup: '검사포장',
    partDesc: 'PRI · TINT (LH/RH)'
  }
];

const PROCESS_BY_CODE = new Map(GM_9BQC_GRUN_PROCESS_DEFS.map((d) => [d.code, d]));
const PROCESS_BY_NAME = new Map(GM_9BQC_GRUN_PROCESS_DEFS.map((d) => [d.processName, d]));

function toNum(val) {
  if (val === undefined || val === null || val === '') return 0;
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

function pickNum(obj, keys) {
  if (!obj) return 0;
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== '') {
      return toNum(obj[k]);
    }
  }
  return 0;
}

function cleanText(val) {
  if (val === undefined || val === null || typeof val === 'boolean') return '';
  return String(val).replace(/\s+/g, ' ').trim();
}

export function compactLotDisplay(raw) {
  const txt = cleanText(raw);
  if (!txt) return '';
  // '26년 09월 02일 18시 33분' -> '26.09.02 18:33'
  const korMatch = txt.match(/(\d{2,4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일(?:\s*(\d{1,2})\s*시\s*(\d{1,2})\s*분?)?/);
  if (korMatch) {
    const yy = korMatch[1].slice(-2);
    const mm = korMatch[2].padStart(2, '0');
    const dd = korMatch[3].padStart(2, '0');
    if (korMatch[4] !== undefined && korMatch[5] !== undefined) {
      return `${yy}.${mm}.${dd} ${korMatch[4].padStart(2, '0')}:${korMatch[5].padStart(2, '0')}`;
    }
    return `${yy}.${mm}.${dd}`;
  }
  return txt;
}

/**
 * 해당 일보가 GM 9BQC - G/RUN (#5001~#5014) 대상인지 판별하고 공정 코드를 반환한다.
 * 반려/임시저장은 집계 제외(옵션으로 포함 가능).
 */
export function resolveGm9bqcProcessCode(report, { excludeDraftRejected = true } = {}) {
  if (!report) return null;
  if (excludeDraftRejected && (report.status === '반려' || report.status === '임시저장')) {
    return null;
  }

  const codeNum = Number(report.formCode);
  if (PROCESS_BY_CODE.has(codeNum)) return codeNum;

  if (report.carModel === '9BQC') {
    const item = cleanText(report.itemName || report.itemCode);
    if (!item || item === 'G/RUN') {
      const procDef = PROCESS_BY_NAME.get(cleanText(report.processName));
      if (procDef) return procDef.code;
    }
  }
  return null;
}

/**
 * 일보의 작업시간(workHours) 또는 shift 필드로 주간/야간 구분
 */
export function classifyReportShift(report) {
  if (!report) return '주간';
  const shiftStr = cleanText(report.shift);
  if (shiftStr.includes('야간')) return '야간';

  const wh = cleanText(report.workHours);
  if (wh.includes('야간')) return '야간';
  const timeMatch = wh.match(/^(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const startHour = Number(timeMatch[1]);
    if (startHour >= 18 || startHour < 6) return '야간';
  }
  return '주간';
}

/**
 * 단일 일보에서 LH / RH (5002는 FRT / RR) 생산수량·계획수량·불량수량을 추출
 */
export function extractProcessQtyBreakdown(report, code) {
  const q = report?.qtyTable || {};
  let lh = 0;
  let rh = 0;
  let plan = toNum(report?.targetQty);
  const actualTop = toNum(report?.actualQty);
  const defect = toNum(report?.defectQty);

  switch (code) {
    case 5001: {
      lh = pickNum(q, ['f5001_PRI_LH_good']) + pickNum(q, ['f5001_TIN_LH_good']);
      rh = pickNum(q, ['f5001_PRI_RH_good']) + pickNum(q, ['f5001_TIN_RH_good']);
      break;
    }
    case 5002: {
      // 정치절단은 FRT(A/B/C) vs RR(A/B)로 기록됨
      lh =
        pickNum(q, ['f5002_FRT_A_act', 'f5002_FRT_A_act_1']) +
        pickNum(q, ['f5002_FRT_B_act', 'f5002_FRT_B_act_1']) +
        pickNum(q, ['f5002_FRT_C_act', 'f5002_FRT_C_act_1']);
      rh =
        pickNum(q, ['f5002_RR_A_act', 'f5002_RR_A_act_1']) +
        pickNum(q, ['f5002_RR_B_act', 'f5002_RR_B_act_1']);
      break;
    }
    case 5003: {
      lh =
        pickNum(q, ['f5003_FRT_LH_A_act', 'act_FL']) +
        pickNum(q, ['f5003_FRT_LH_B_act']) +
        pickNum(q, ['f5003_RR_LH_A_act', 'act_RL']) +
        pickNum(q, ['f5003_RR_LH_B_act']);
      rh =
        pickNum(q, ['f5003_FRT_RH_A_act', 'act_FR']) +
        pickNum(q, ['f5003_FRT_RH_B_act']) +
        pickNum(q, ['f5003_RR_RH_A_act', 'act_RR']) +
        pickNum(q, ['f5003_RR_RH_B_act']);
      break;
    }
    case 5004: {
      lh = pickNum(q, ['f5004_FRT_LH_good', 'qty_good_FL', 'qty_act_FL']);
      rh = pickNum(q, ['f5004_FRT_RH_good', 'qty_good_FR', 'qty_act_FR']);
      break;
    }
    case 5005: {
      lh = pickNum(q, ['f5005_RR_LH_good', 'f5005_FRT_LH_good', 'qty_good_RL', 'qty_good_FL']);
      rh = pickNum(q, ['f5005_RR_RH_good', 'f5005_FRT_RH_good', 'qty_good_RR', 'qty_good_FR']);
      break;
    }
    case 5006: {
      const qtyKeys = Object.keys(q);
      const hasUnits = qtyKeys.some((k) => k.startsWith('f5006_RR_u1_') || k.startsWith('f5006_RR_u2_'));
      const equip = resolveF5006Equip(report);
      if (hasUnits) {
        const unitGood = pickNum(q, ['f5006_RR_u1_good']) + pickNum(q, ['f5006_RR_u2_good']);
        if (equip.side === 'RH') rh += unitGood;
        else lh += unitGood;
      } else if (q.f5006_RR_good !== undefined) {
        if (equip.side === 'RH') rh += toNum(q.f5006_RR_good);
        else lh += toNum(q.f5006_RR_good);
      } else {
        lh = pickNum(q, ['f5006_RR_LH_good', 'f5006_FRT_LH_good']);
        rh = pickNum(q, ['f5006_RR_RH_good', 'f5006_FRT_RH_good']);
      }
      break;
    }
    case 5007: {
      lh = pickNum(q, ['f5007_LH_DV_good', 'qty_good_FL']) + pickNum(q, ['f5007_LH_RR_good', 'qty_good_RL']);
      rh = pickNum(q, ['f5007_RH_DV_good', 'qty_good_FR']) + pickNum(q, ['f5007_RH_RR_good', 'qty_good_RR']);
      break;
    }
    case 5010: {
      lh =
        pickNum(q, ['f5010_LH_PRI_good', 'f5010_LH_2_good', 'f5010_PRI_LH_good']) +
        pickNum(q, ['f5010_LH_TINT_good', 'f5010_LH_3_good', 'f5010_TINT_LH_good']);
      rh =
        pickNum(q, ['f5010_RH_PRI_good', 'f5010_RH_2_good', 'f5010_PRI_RH_good']) +
        pickNum(q, ['f5010_RH_TINT_good', 'f5010_RH_3_good', 'f5010_TINT_RH_good']);
      break;
    }
    case 5011: {
      lh = pickNum(q, ['f5011_FRT_LH_good', 'qty_good_FL']);
      rh = pickNum(q, ['f5011_FRT_RH_good', 'qty_good_FR']);
      break;
    }
    case 5012: {
      lh =
        pickNum(q, ['f5012_LH_2_good', 'f5012_PRI_LH_good', 'f5012_FRT_LH_good']) +
        pickNum(q, ['f5012_LH_3_good', 'f5012_TINT_LH_good']);
      rh =
        pickNum(q, ['f5012_RH_2_good', 'f5012_PRI_RH_good', 'f5012_FRT_RH_good']) +
        pickNum(q, ['f5012_RH_3_good', 'f5012_TINT_RH_good']);
      break;
    }
    case 5013: {
      lh =
        pickNum(q, ['f5013_LH_PRI_good', 'f5013_LH_2_good', 'f5013_PRI_LH_good']) +
        pickNum(q, ['f5013_LH_TINT_good', 'f5013_LH_3_good', 'f5013_TINT_LH_good']);
      rh =
        pickNum(q, ['f5013_RH_PRI_good', 'f5013_RH_2_good', 'f5013_PRI_RH_good']) +
        pickNum(q, ['f5013_RH_TINT_good', 'f5013_RH_3_good', 'f5013_TINT_RH_good']);
      break;
    }
    case 5014: {
      lh =
        pickNum(q, ['f5014_PRI_LH_good', 'f5014_FRT_LH_good']) +
        pickNum(q, ['f5014_TINT_LH_good']);
      rh =
        pickNum(q, ['f5014_PRI_RH_good', 'f5014_FRT_RH_good']) +
        pickNum(q, ['f5014_TINT_RH_good']);
      break;
    }
    default:
      break;
  }

  const sideSum = lh + rh;
  const actual = sideSum > 0 ? sideSum : actualTop;
  if (sideSum === 0 && actualTop > 0) {
    // 구버전 일보 등으로 좌우 미분리 시 50:50 표기 보조
    lh = Math.ceil(actualTop / 2);
    rh = Math.floor(actualTop / 2);
  }
  if (plan <= 0 && actual > 0) {
    plan = actual;
  }

  return { lh, rh, actual, plan, defect };
}

/**
 * 단일 일보에서 압출소재 LOT (초물/중물/종물) 항목들을 추출한다.
 * (#5006 의 f5006_rec_* 부자재 기록 키와 체크박스 chk1/chk2 및 선택키 제외)
 */
export function extractExtrudedLotsFromReport(report, code) {
  const lots = report?.materialLots || {};
  const stageBuckets = { 초물: [], 중물: [], 종물: [] };
  const detailedEntries = [];

  Object.entries(lots).forEach(([key, rawVal]) => {
    if (!key) return;
    if (key.startsWith('f5006_rec_') || key === 'f5006_selected_equip') return;
    if (key.endsWith('_chk1') || key.endsWith('_chk2')) return;
    if (typeof rawVal === 'boolean') return;

    const val = compactLotDisplay(rawVal);
    if (!val) return;

    let stage = null;
    if (key.includes('초물') || key.endsWith('_초')) stage = '초물';
    else if (key.includes('중물') || key.endsWith('_중')) stage = '중물';
    else if (key.includes('종물') || key.endsWith('_종')) stage = '종물';
    if (!stage) return;

    const partLabel = formatExtrudedLotRowLabel(key, code, report);
    stageBuckets[stage].push({ partLabel, value: val, rawKey: key });
    detailedEntries.push({
      stage,
      partLabel,
      value: val,
      workerName: report.workerName || '',
      date: report.date || '',
      reportId: report.id
    });
  });

  return { stageBuckets, detailedEntries };
}

function formatExtrudedLotRowLabel(key, code, report) {
  let clean = key
    .replace(new RegExp(`^f${code}_`), '')
    .replace(/_(초물|중물|종물|초|중|종)$/, '');

  if (code === 5006 && (clean === 'RR_A' || clean === 'RR_B')) {
    const equip = resolveF5006Equip(report);
    const sec = clean.split('_')[1];
    return `RR ${equip.side} ${sec}`;
  }
  return clean.replace(/_/g, ' ');
}

function pickStageVal(obj, keys) {
  if (!obj) return '';
  for (const k of keys) {
    const v = compactLotDisplay(obj[k]);
    if (v) return v;
  }
  return '';
}

/**
 * 6대 핵심 부자재·원재료 LOT 실시간 카드 데이터 구성 (Proposal C 우측 상단 3x2 벤토 그리드)
 *  1. Glass (#5006)
 *  2. D/V (#5006 · #5013)
 *  3. BRACKET (#5006)
 *  4. 조인트 재료 (#5004 · #5005 · #5006)
 *  5. 패드 5T (#5010 · #5011 · #5014)
 *  6. 패드 7T (#5010 · #5013)
 */
export function buildSubMaterialCards(validEntries) {
  const byCode = (codes) => validEntries.filter((e) => codes.includes(e.code)).map((e) => e.report);

  const collectThreeStageCard = ({ id, title, processBadge, specLabel, reports, extractor }) => {
    const stageValues = { 초: [], 중: [], 종: [] };
    const records = [];

    reports.forEach((r) => {
      const res = extractor(r);
      if (!res) return;
      const s1 = res.초 || '';
      const s2 = res.중 || '';
      const s3 = res.종 || '';
      if (!s1 && !s2 && !s3) return;
      if (s1) stageValues.초.push(s1);
      if (s2) stageValues.중.push(s2);
      if (s3) stageValues.종.push(s3);
      records.push({
        processName: r.processName || `#${r.formCode}`,
        formCode: r.formCode,
        workerName: r.workerName || '-',
        date: r.date || '',
        workHours: r.workHours || '',
        extra: res.extra || '',
        초: s1,
        중: s2,
        종: s3,
        report: r
      });
    });

    const latestRecord = records[0] || null;
    const primaryLot =
      latestRecord?.종 ||
      latestRecord?.중 ||
      latestRecord?.초 ||
      stageValues.종[0] ||
      stageValues.중[0] ||
      stageValues.초[0] ||
      '';

    return {
      id,
      title,
      processBadge,
      specLabel,
      primaryLot,
      subMeta: latestRecord
        ? `${latestRecord.processName}${latestRecord.extra ? ` · ${latestRecord.extra}` : ''} (${latestRecord.workerName})`
        : '금일 입력 대기',
      updatedStamp: latestRecord ? `${latestRecord.date.slice(2).replace(/-/g, '.')} ${extractShortTime(latestRecord.workHours)}` : '-',
      stages: [
        { label: '초', filled: stageValues.초.length > 0, value: stageValues.초[0] || '' },
        { label: '중', filled: stageValues.중.length > 0, value: stageValues.중[0] || '' },
        { label: '종', filled: stageValues.종.length > 0, value: stageValues.종[0] || '' }
      ],
      records
    };
  };

  // 1) Glass (#5006)
  const glassCard = collectThreeStageCard({
    id: 'glass',
    title: 'Glass',
    processBadge: '#5006 조인트-Fixed',
    specLabel: 'Fixed Glass Insert',
    reports: byCode([5006]),
    extractor: (r) => {
      const m = r.materialLots || {};
      const equip = resolveF5006Equip(r);
      return {
        초: pickStageVal(m, ['f5006_rec_Glass_초물']),
        중: pickStageVal(m, ['f5006_rec_Glass_중물']),
        종: pickStageVal(m, ['f5006_rec_Glass_종물']),
        extra: equip.label
      };
    }
  });

  // 2) D/V (#5006 · #5013)
  const dvCard = collectThreeStageCard({
    id: 'dv',
    title: 'D/V',
    processBadge: '#5006 · #5013',
    specLabel: 'Division Bar / Sub LOT',
    reports: byCode([5006, 5013]),
    extractor: (r) => {
      if (Number(r.formCode) === 5006 || r.processName === '조인트-RR Fixed') {
        const m = r.materialLots || {};
        const equip = resolveF5006Equip(r);
        return {
          초: pickStageVal(m, ['f5006_rec_DV_초물']),
          중: pickStageVal(m, ['f5006_rec_DV_중물']),
          종: pickStageVal(m, ['f5006_rec_DV_종물']),
          extra: equip.label
        };
      }
      const d = r.dimData || {};
      return {
        초: pickStageVal(d, ['f5013_sub_DV_초']),
        중: pickStageVal(d, ['f5013_sub_DV_중']),
        종: pickStageVal(d, ['f5013_sub_DV_종']),
        extra: '검사포장-RR'
      };
    }
  });

  // 3) BRACKET (#5006)
  const bracketCard = collectThreeStageCard({
    id: 'bracket',
    title: 'BRACKET',
    processBadge: '#5006 조인트-Fixed',
    specLabel: 'Fixed Bracket Insert',
    reports: byCode([5006]),
    extractor: (r) => {
      const m = r.materialLots || {};
      const equip = resolveF5006Equip(r);
      return {
        초: pickStageVal(m, ['f5006_rec_BRACKET_초물']),
        중: pickStageVal(m, ['f5006_rec_BRACKET_중물']),
        종: pickStageVal(m, ['f5006_rec_BRACKET_종물']),
        extra: equip.label
      };
    }
  });

  // 4) 조인트 재료 (#5004 FRT · #5005 RR R부 · #5006 RR Fixed)
  const jointReports = byCode([5004, 5005, 5006]);
  const jointByProc = { 5004: null, 5005: null, 5006: null };
  const jointRecords = [];
  jointReports.forEach((r) => {
    const c = resolveGm9bqcProcessCode(r, { excludeDraftRejected: false }) || Number(r.formCode);
    const d = r.dimData || {};
    const grade = cleanText(d[`f${c}_joint_grade_name`]);
    const lotNo = compactLotDisplay(d[`f${c}_joint_material_lot`] || r.jointRubberLotNo);
    if (!grade && !lotNo) return;
    const combined = grade && lotNo ? `${grade} / ${lotNo}` : (lotNo || grade);
    if (c && !jointByProc[c]) {
      jointByProc[c] = combined;
    }
    jointRecords.push({
      processName: r.processName || `#${c}`,
      formCode: c,
      workerName: r.workerName || '-',
      date: r.date || '',
      workHours: r.workHours || '',
      extra: grade ? `Grade: ${grade}` : '',
      초: lotNo || grade,
      중: grade || '-',
      종: '',
      report: r
    });
  });
  const latestJoint = jointRecords[0] || null;
  const jointCard = {
    id: 'joint_resin',
    title: '조인트 재료',
    processBadge: '#5004 ~ #5006',
    specLabel: 'Joint Grade / Material LOT',
    primaryLot: jointByProc[5004] || jointByProc[5005] || jointByProc[5006] || '',
    subMeta: latestJoint
      ? `${latestJoint.processName}${latestJoint.extra ? ` · ${latestJoint.extra}` : ''} (${latestJoint.workerName})`
      : '금일 입력 대기',
    updatedStamp: latestJoint ? `${latestJoint.date.slice(2).replace(/-/g, '.')} ${extractShortTime(latestJoint.workHours)}` : '-',
    stages: [
      { label: 'FRT', filled: Boolean(jointByProc[5004]), value: jointByProc[5004] || '' },
      { label: 'RR-R', filled: Boolean(jointByProc[5005]), value: jointByProc[5005] || '' },
      { label: 'Fixed', filled: Boolean(jointByProc[5006]), value: jointByProc[5006] || '' }
    ],
    records: jointRecords
  };

  // 5) 패드 5T (#5010 · #5011 · #5014)
  const pad5tCard = collectThreeStageCard({
    id: 'pad_5t',
    title: '패드 5T',
    processBadge: '#5010 · #5011 · #5014',
    specLabel: '규격 5T*5W*60L',
    reports: byCode([5010, 5011, 5014]),
    extractor: (r) => {
      const c = resolveGm9bqcProcessCode(r, { excludeDraftRejected: false }) || Number(r.formCode);
      const d = r.dimData || {};
      const specVal = cleanText(
        d.f5011_dim_FRT_LH_PAD_5T ||
        d.f5011_dim_FRT_RH_PAD_5T ||
        d.f5014_dim_RR_LH_PAD_5T ||
        d.f5014_dim_RR_RH_PAD_5T
      );
      return {
        초: pickStageVal(d, [`f${c}_sub_PAD_5T_초`, 'f5010_sub_DV_초']),
        중: pickStageVal(d, [`f${c}_sub_PAD_5T_중`, 'f5010_sub_DV_중']),
        종: pickStageVal(d, [`f${c}_sub_PAD_5T_종`, 'f5010_sub_DV_종']),
        extra: specVal ? `실측: ${specVal}` : ''
      };
    }
  });

  // 6) 패드 7T (#5010 · #5013)
  const pad7tCard = collectThreeStageCard({
    id: 'pad_7t',
    title: '패드 7T',
    processBadge: '#5010 · #5013',
    specLabel: '규격 7T*10W*50L',
    reports: byCode([5010, 5013]),
    extractor: (r) => {
      const c = resolveGm9bqcProcessCode(r, { excludeDraftRejected: false }) || Number(r.formCode);
      const d = r.dimData || {};
      if (c === 5013) {
        const lhSpec = cleanText(d.f5013_dim_RR_LH_PAD_7T);
        const rhSpec = cleanText(d.f5013_dim_RR_RH_PAD_7T);
        if (!lhSpec && !rhSpec) return null;
        return {
          초: lhSpec || rhSpec,
          중: rhSpec || '',
          종: '',
          extra: '스폰지패드 7T 확인'
        };
      }
      return {
        초: pickStageVal(d, ['f5010_sub_PAD_7T_초']),
        중: pickStageVal(d, ['f5010_sub_PAD_7T_중']),
        종: pickStageVal(d, ['f5010_sub_PAD_7T_종']),
        extra: '후가공-RR'
      };
    }
  });

  return [glassCard, dvCard, bracketCard, jointCard, pad5tCard, pad7tCard];
}

function extractShortTime(workHours) {
  const txt = cleanText(workHours);
  const m = txt.match(/(\d{1,2}:\d{2})/);
  return m ? m[1] : '';
}

function simplifyDefectLabel(rawName) {
  // '[조인트-FRT] 단차' -> '단차 (조인트-FRT)' 대신 간결하게 핵심 불량명 추출
  const cleaned = String(rawName || '').replace(/^\[[^\]]+\]\s*/, '').trim();
  return cleaned || String(rawName || '기타');
}

/**
 * 필터링된 일보 목록으로부터 Proposal C 전체 관제판 데이터를 계산한다.
 */
export function buildGm9bqcGrunDashboardModel(reports = [], { shiftFilter = 'ALL' } = {}) {
  const validEntries = [];

  reports.forEach((r) => {
    const code = resolveGm9bqcProcessCode(r, { excludeDraftRejected: true });
    if (!code) return;
    const shift = classifyReportShift(r);
    if (shiftFilter !== 'ALL' && shift !== shiftFilter) return;
    validEntries.push({ code, shift, report: r });
  });

  // 최신 일보가 먼저 오도록 정렬
  validEntries.sort((a, b) => {
    const dCmp = String(b.report.date || '').localeCompare(String(a.report.date || ''));
    if (dCmp !== 0) return dCmp;
    return String(b.report.id || '').localeCompare(String(a.report.id || ''));
  });

  const globalDefects = {};
  let totalActual = 0;
  let totalPlan = 0;
  let totalDefect = 0;
  let activeProcessCount = 0;

  const processRows = GM_9BQC_GRUN_PROCESS_DEFS.map((def) => {
    const matching = validEntries.filter((e) => e.code === def.code);
    let lh = 0;
    let rh = 0;
    let actual = 0;
    let plan = 0;
    let defect = 0;
    let downtimeMin = 0;
    const procDefects = {};

    const stageLots = { 초물: [], 중물: [], 종물: [] };
    const allLotDetails = [];
    const workers = new Set();

    matching.forEach(({ report }) => {
      const qBreak = extractProcessQtyBreakdown(report, def.code);
      lh += qBreak.lh;
      rh += qBreak.rh;
      actual += qBreak.actual;
      plan += qBreak.plan;
      defect += qBreak.defect;
      downtimeMin += toNum(report.downtimeMinutes);
      if (report.workerName) workers.add(report.workerName);

      const dMap = extractDefectBreakdown(report);
      Object.entries(dMap).forEach(([dName, cnt]) => {
        const n = toNum(cnt);
        if (n <= 0) return;
        const shortD = simplifyDefectLabel(dName);
        procDefects[shortD] = (procDefects[shortD] || 0) + n;
        globalDefects[shortD] = (globalDefects[shortD] || 0) + n;
      });

      const { stageBuckets, detailedEntries } = extractExtrudedLotsFromReport(report, def.code);
      ['초물', '중물', '종물'].forEach((st) => {
        stageBuckets[st].forEach((item) => {
          stageLots[st].push(item);
        });
      });
      allLotDetails.push(...detailedEntries);
    });

    if (matching.length > 0) activeProcessCount += 1;
    totalActual += actual;
    totalPlan += plan;
    totalDefect += defect;

    const totalInspected = actual + defect;
    const defectRate = totalInspected > 0 ? (defect / totalInspected) * 100 : 0;

    const topDefectEntry = Object.entries(procDefects).sort((a, b) => b[1] - a[1])[0] || null;

    const hasStart = stageLots.초물.length > 0;
    const hasMid = stageLots.중물.length > 0;
    const hasEnd = stageLots.종물.length > 0;
    const filledStages = [hasStart, hasMid, hasEnd].filter(Boolean).length;

    let lotStatus = 'empty'; // empty | partial | complete
    let lotStatusLabel = '미입력';
    if (filledStages === 3) {
      lotStatus = 'complete';
      lotStatusLabel = '완료';
    } else if (filledStages > 0) {
      lotStatus = 'partial';
      lotStatusLabel = hasStart && hasMid ? '초·중' : hasStart ? '초물' : '입력중';
    }

    const uniqueStageSummary = (arr) => {
      const uniq = [...new Set(arr.map((x) => x.value))];
      if (uniq.length === 0) return '';
      if (uniq.length === 1) return uniq[0];
      return `${uniq[0]} 외 ${uniq.length - 1}`;
    };

    return {
      ...def,
      reportCount: matching.length,
      reports: matching.map((m) => m.report),
      workers: [...workers],
      lh,
      rh,
      actual,
      plan,
      defect,
      defectRate,
      downtimeMin,
      topDefect: topDefectEntry ? { name: topDefectEntry[0], count: topDefectEntry[1] } : null,
      lotSummary: {
        초물: uniqueStageSummary(stageLots.초물),
        중물: uniqueStageSummary(stageLots.중물),
        종물: uniqueStageSummary(stageLots.종물),
        hasStart,
        hasMid,
        hasEnd,
        filledStages,
        lotStatus,
        lotStatusLabel,
        details: allLotDetails
      }
    };
  });

  const totalGood = totalActual;
  const totalGross = totalGood + totalDefect;
  const yieldRate = totalGross > 0 ? (totalGood / totalGross) * 100 : (validEntries.length > 0 ? 100 : 0);
  const defectRateTotal = totalGross > 0 ? (totalDefect / totalGross) * 100 : 0;
  const attainmentRate = totalPlan > 0 ? Math.min(999, Math.round((totalActual / totalPlan) * 100)) : 0;

  const worstProcess = [...processRows]
    .filter((p) => p.defect > 0)
    .sort((a, b) => b.defect - a.defect || b.defectRate - a.defectRate)[0] || null;

  const top5Defects = Object.entries(globalDefects)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const subMaterialCards = buildSubMaterialCards(validEntries);

  return {
    totalReports: validEntries.length,
    activeProcessCount,
    totalActual,
    totalPlan,
    totalGood,
    totalDefect,
    yieldRate,
    defectRateTotal,
    attainmentRate,
    worstProcess,
    processRows,
    top5Defects,
    subMaterialCards
  };
}
