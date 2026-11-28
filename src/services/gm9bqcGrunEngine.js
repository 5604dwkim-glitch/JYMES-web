import { extractDefectBreakdown } from './statsAggregator.js';
import { normalizeDefectName } from '../constants/defectAliases.js';
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
      const g1Good =
        pickNum(q, ['f5013_LH_PRI_good', 'f5013_LH_2_good', 'f5013_PRI_LH_good']) +
        pickNum(q, ['f5013_LH_TINT_good', 'f5013_LH_3_good', 'f5013_TINT_LH_good']);
      const g2Good =
        pickNum(q, ['f5013_RH_PRI_good', 'f5013_RH_2_good', 'f5013_PRI_RH_good']) +
        pickNum(q, ['f5013_RH_TINT_good', 'f5013_RH_3_good', 'f5013_TINT_RH_good']);
      const g1Side = q.f5013_group1_side || 'RR LH';
      const g2Side = q.f5013_group2_side || 'RR RH';
      lh = (g1Side === 'RR RH' ? 0 : g1Good) + (g2Side === 'RR LH' ? g2Good : 0);
      rh = (g1Side === 'RR RH' ? g1Good : 0) + (g2Side === 'RR LH' ? 0 : g2Good);
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

  // 2) D/V (#5006 · #5007 · #5013)
  const dvCard = collectThreeStageCard({
    id: 'dv',
    title: 'D/V lot',
    shortBadge: '#5006·5013',
    processBadge: '#5006 · #5007 · #5013',
    specLabel: 'Division Bar / Sub LOT',
    reports: byCode([5006, 5007, 5013]),
    extractor: (r) => {
      const c = resolveGm9bqcProcessCode(r, { excludeDraftRejected: false }) || Number(r.formCode);
      if (c === 5006 || r.processName === '조인트-RR Fixed') {
        const m = r.materialLots || {};
        const equip = resolveF5006Equip(r);
        return {
          초: pickStageVal(m, ['f5006_rec_DV_초물']),
          중: pickStageVal(m, ['f5006_rec_DV_중물']),
          종: pickStageVal(m, ['f5006_rec_DV_종물']),
          extra: equip.label
        };
      }
      if (c === 5007 || r.processName === '후가공-D/V') {
        const m = r.materialLots || {};
        return {
          초: pickStageVal(m, ['f5007_DV_LH_초물', 'f5007_DV_RH_초물', 'LH_초물', 'RH_초물']),
          중: pickStageVal(m, ['f5007_DV_LH_중물', 'f5007_DV_RH_중물', 'LH_중물', 'RH_중물']),
          종: pickStageVal(m, ['f5007_DV_LH_종물', 'f5007_DV_RH_종물', 'LH_종물', 'RH_종물']),
          extra: '후가공-D/V'
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
  // '[조인트-FRT] 단차' -> '단차' : 분류 제거 + 유사 명칭 표준화 (src/constants/defectAliases.js)
  const cleaned = normalizeDefectName(rawName);
  return cleaned || String(rawName || '기타');
}

/**
 * LOT 입력 문자열(년·월·일·시·분·초 포함)에서 시·분·초를 제외하고 '년.월.일'만 추출한다.
 * 예:
 *  - '26년 11월 03일 14시 22분 10초' -> { lotKey: '26.11.03', lotYmd: '2026-11-03', lotMmDd: '11/03' }
 *  - '2026-11-03 18:10'             -> { lotKey: '26.11.03', lotYmd: '2026-11-03', lotMmDd: '11/03' }
 *  - '26.11.03 09:00'               -> { lotKey: '26.11.03', lotYmd: '2026-11-03', lotMmDd: '11/03' }
 */
export function extractLotYmdInfo(raw) {
  const txt = cleanText(raw);
  if (!txt) return null;

  // 1) '26년 11월 03일 ...'
  const kor = txt.match(/(\d{2,4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일/);
  if (kor) {
    const yy = kor[1].slice(-2);
    const yyyy = kor[1].length === 4 ? kor[1] : `20${yy}`;
    const mm = kor[2].padStart(2, '0');
    const dd = kor[3].padStart(2, '0');
    return {
      lotKey: `${yy}.${mm}.${dd}`,
      lotYmd: `${yyyy}-${mm}-${dd}`,
      lotMmDd: `${mm}/${dd}`
    };
  }

  // 2) '2026.11.03', '26.11.03', '2026-11-03', '26/11/03' (뒤에 시:분:초가 있어도 무시)
  const sep = txt.match(/(?:^|\D)(\d{2}|\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})(?:\D|$)/);
  if (sep) {
    const yy = sep[1].slice(-2);
    const yyyy = sep[1].length === 4 ? sep[1] : `20${yy}`;
    const mmNum = Number(sep[2]);
    const ddNum = Number(sep[3]);
    if (mmNum >= 1 && mmNum <= 12 && ddNum >= 1 && ddNum <= 31) {
      const mm = String(mmNum).padStart(2, '0');
      const dd = String(ddNum).padStart(2, '0');
      return {
        lotKey: `${yy}.${mm}.${dd}`,
        lotYmd: `${yyyy}-${mm}-${dd}`,
        lotMmDd: `${mm}/${dd}`
      };
    }
  }

  // 3) '20261103...' 또는 '261103...' 연속 숫자형
  const digits = txt.match(/^(\d{8}|\d{6})(?:\D|$)/);
  if (digits) {
    const dStr = digits[1];
    const yyyy = dStr.length === 8 ? dStr.slice(0, 4) : `20${dStr.slice(0, 2)}`;
    const yy = yyyy.slice(-2);
    const mmNum = Number(dStr.slice(-4, -2));
    const ddNum = Number(dStr.slice(-2));
    if (mmNum >= 1 && mmNum <= 12 && ddNum >= 1 && ddNum <= 31) {
      const mm = String(mmNum).padStart(2, '0');
      const dd = String(ddNum).padStart(2, '0');
      return {
        lotKey: `${yy}.${mm}.${dd}`,
        lotYmd: `${yyyy}-${mm}-${dd}`,
        lotMmDd: `${mm}/${dd}`
      };
    }
  }

  // 4) 날짜 형식이 아닌 일반 LOT 코드일 경우 시:분 제거 후 원문 보존
  const fallback = compactLotDisplay(txt).replace(/\s+\d{1,2}:\d{2}(?::\d{2})?$/, '').trim();
  if (!fallback) return null;
  return {
    lotKey: fallback,
    lotYmd: '',
    lotMmDd: ''
  };
}

export const LOT_TRACE_SLOTS = [
  { group: 'FRT', sideSec: 'LH A' },
  { group: 'FRT', sideSec: 'RH A' },
  { group: 'FRT', sideSec: 'LH B' },
  { group: 'FRT', sideSec: 'RH B' },
  { group: 'FRT', sideSec: 'LH C' },
  { group: 'FRT', sideSec: 'RH C' },
  { group: 'RR', sideSec: 'LH A' },
  { group: 'RR', sideSec: 'RH A' },
  { group: 'RR', sideSec: 'LH B' },
  { group: 'RR', sideSec: 'RH B' }
];

/**
 * 단일 일보의 materialLots 키를 (group: 'FRT'|'RR', sideSec: 'LH A'~'RH C', stageKey: '절단'|'조인트'|'후가공'|'출하')로 매핑한다.
 * (D/V 관련 키는 부자재 LOT 현황으로 이동했으므로 제외)
 */
function resolveLotTraceTargets(key, code, report) {
  if (!key || typeof key !== 'string') return null;
  if (key.startsWith('f5006_rec_') || key === 'f5006_selected_equip') return null;
  if (key.endsWith('_chk1') || key.endsWith('_chk2')) return null;
  if (!(key.includes('초물') || key.includes('중물') || key.includes('종물') || /_(초|중|종)$/.test(key))) {
    return null;
  }

  const clean = key
    .replace(new RegExp(`^f${code}_`), '')
    .replace(/_(초물|중물|종물|초|중|종)$/, '');

  // D/V (#5007) 제외 (우하단 부자재 LOT 현황에 표시)
  if (code === 5007 || clean.startsWith('DV_')) return null;

  // 1) #5002 소재준비-정치절단 (FRT A/B/C, RR A/B -> 좌·우 공용 절단 단계)
  if (code === 5002) {
    const m = clean.match(/^(FRT|RR)_([ABC])$/);
    if (!m) return null;
    const grp = m[1];
    const sec = m[2];
    if (grp === 'RR' && sec === 'C') return null;
    return {
      stageKey: '절단',
      targets: [
        { group: grp, sideSec: `LH ${sec}` },
        { group: grp, sideSec: `RH ${sec}` }
      ]
    };
  }

  // 2) #5003 소재준비-단컷팅 (FRT_LH_A, FRT_RH_B, RR_LH_A, RR_RH_B 및 레거시 LH_FRT 등)
  if (code === 5003) {
    const m = clean.match(/^(FRT|RR)_(LH|RH)_([AB])$/);
    if (m) {
      return { stageKey: '절단', targets: [{ group: m[1], sideSec: `${m[2]} ${m[3]}` }] };
    }
    const leg = clean.match(/^(LH|RH)_(FRT|RR)$/);
    if (leg) {
      return { stageKey: '절단', targets: [{ group: leg[2], sideSec: `${leg[1]} A` }] };
    }
    return null;
  }

  // 3) #5004 조인트-FRT
  if (code === 5004) {
    const m = clean.match(/^FRT_(LH|RH)_([ABC])$/);
    if (m) {
      return { stageKey: '조인트', targets: [{ group: 'FRT', sideSec: `${m[1]} ${m[2]}` }] };
    }
    const leg = clean.match(/^(?:FRT_(LH|RH)|(LH|RH)_FRT)$/);
    if (leg) {
      const side = leg[1] || leg[2];
      return { stageKey: '조인트', targets: [{ group: 'FRT', sideSec: `${side} A` }] };
    }
    return null;
  }

  // 4) #5005 조인트-RR R부
  if (code === 5005) {
    const m = clean.match(/^RR_(LH|RH)_([AB])$/);
    if (m) {
      return { stageKey: '조인트', targets: [{ group: 'RR', sideSec: `${m[1]} ${m[2]}` }] };
    }
    const leg = clean.match(/^(?:FRT_(LH|RH)|(LH|RH)_FRT)$/);
    if (leg) {
      const side = leg[1] || leg[2];
      return { stageKey: '조인트', targets: [{ group: 'RR', sideSec: `${side} A` }] };
    }
    return null;
  }

  // 5) #5006 조인트-RR Fixed
  if (code === 5006) {
    const equip = resolveF5006Equip(report);
    const mSide = clean.match(/^RR_(LH|RH)_([AB])$/);
    if (mSide) {
      return { stageKey: '조인트', targets: [{ group: 'RR', sideSec: `${mSide[1]} ${mSide[2]}` }] };
    }
    const mSec = clean.match(/^RR_([AB])$/);
    if (mSec) {
      return { stageKey: '조인트', targets: [{ group: 'RR', sideSec: `${equip.side} ${mSec[1]}` }] };
    }
    const leg = clean.match(/^FRT_(LH|RH)$/);
    if (leg) {
      return { stageKey: '조인트', targets: [{ group: 'RR', sideSec: `${leg[1]} A` }] };
    }
    return null;
  }

  // 6) #5010 후가공-RR
  if (code === 5010) {
    const m = clean.match(/^(?:RR|FRT)_(LH|RH)_([AB])$/);
    if (m) {
      return { stageKey: '후가공', targets: [{ group: 'RR', sideSec: `${m[1]} ${m[2]}` }] };
    }
    return null;
  }

  // 7) #5011 검사포장-FRT (출하)
  if (code === 5011) {
    const m = clean.match(/^FRT_(LH|RH)_([ABC])$/);
    if (m) {
      return { stageKey: '출하', targets: [{ group: 'FRT', sideSec: `${m[1]} ${m[2]}` }] };
    }
    const leg = clean.match(/^(?:FRT_(LH|RH)|(LH|RH)_FRT)$/);
    if (leg) {
      const side = leg[1] || leg[2];
      return { stageKey: '출하', targets: [{ group: 'FRT', sideSec: `${side} A` }] };
    }
    return null;
  }

  // 8) #5012 · #5013 · #5014 검사포장-RR (출하)
  if (code === 5012 || code === 5013 || code === 5014) {
    const m = clean.match(/^(?:RR|FRT)_(LH|RH)_([AB])$/);
    if (m) {
      return { stageKey: '출하', targets: [{ group: 'RR', sideSec: `${m[1]} ${m[2]}` }] };
    }
    return null;
  }

  return null;
}

function formatMmDd(ymd) {
  if (!ymd || typeof ymd !== 'string') return '';
  const m = ymd.match(/^\d{4}-(\d{2})-(\d{2})$/);
  if (m) return `${m[1]}/${m[2]}`;
  return ymd;
}

/**
 * 1-B안 좌하단 'LOT 추이도' (날짜 타임라인축 + FRT/RR LH·RH 구분 + 복수 동시 LOT 전수 표시 + 중간 공정 끊김 표현)
 */
export function buildLotTraceabilityTimeline(validEntries = [], trackingEntries = null) {
  const sourcePool = Array.isArray(trackingEntries) && trackingEntries.length > 0 ? trackingEntries : validEntries;

  // 선택된 기간(validEntries)에 등장한 (group|sideSec|lotKey) 집합 파악
  const activeTrackKeys = new Set();
  const collectFromEntries = (entries, recordIntoMap) => {
    entries.forEach(({ code, report }) => {
      const lots = report?.materialLots || {};
      const reportDate = cleanText(report?.date);
      if (!reportDate) return;

      Object.entries(lots).forEach(([key, rawVal]) => {
        if (typeof rawVal === 'boolean') return;
        const resolved = resolveLotTraceTargets(key, code, report);
        if (!resolved) return;
        const lotInfo = extractLotYmdInfo(rawVal);
        if (!lotInfo || !lotInfo.lotKey) return;

        resolved.targets.forEach(({ group, sideSec }) => {
          const trackId = `${group}|${sideSec}|${lotInfo.lotKey}`;
          if (recordIntoMap) {
            recordIntoMap({
              trackId,
              group,
              sideSec,
              lotKey: lotInfo.lotKey,
              lotYmd: lotInfo.lotYmd,
              lotMmDd: lotInfo.lotMmDd,
              stageKey: resolved.stageKey,
              reportDate,
              report,
              code
            });
          } else {
            activeTrackKeys.add(trackId);
          }
        });
      });
    });
  };

  collectFromEntries(validEntries, null);

  // 전체 추적 풀(최근 가동 구간 포함)에서 동일 (group, sideSec, lotKey)의 모든 공정 투입 날짜 수집
  const tracksById = new Map();
  collectFromEntries(sourcePool, (item) => {
    if (activeTrackKeys.size > 0 && !activeTrackKeys.has(item.trackId)) return;
    let tr = tracksById.get(item.trackId);
    if (!tr) {
      tr = {
        trackId: item.trackId,
        group: item.group,
        sideSec: item.sideSec,
        lotKey: item.lotKey,
        lotYmd: item.lotYmd,
        lotMmDd: item.lotMmDd,
        stages: {
          절단: new Map(), // reportDate -> Set<report>
          조인트: new Map(),
          후가공: new Map(),
          출하: new Map()
        },
        allReports: new Map()
      };
      tracksById.set(item.trackId, tr);
    }
    const stageMap = tr.stages[item.stageKey];
    if (stageMap) {
      if (!stageMap.has(item.reportDate)) {
        stageMap.set(item.reportDate, []);
      }
      stageMap.get(item.reportDate).push(item.report);
    }
    if (item.report?.id) {
      tr.allReports.set(item.report.id, item.report);
    }
  });

  // 전체 타임라인 날짜 축(dateColumns) 구성
  const allDatesSet = new Set();
  tracksById.forEach((tr) => {
    if (tr.lotYmd) allDatesSet.add(tr.lotYmd);
    ['절단', '조인트', '후가공', '출하'].forEach((st) => {
      tr.stages[st].forEach((_, rDate) => {
        if (rDate) allDatesSet.add(rDate);
      });
    });
  });

  // 데이터가 아직 없을 경우 선택된 일보 날짜들을 기본 타임라인 컬럼으로 구성
  if (allDatesSet.size === 0) {
    validEntries.forEach(({ report }) => {
      if (report?.date) allDatesSet.add(report.date);
    });
  }

  let sortedDates = [...allDatesSet].filter(Boolean).sort();
  // 타임라인 가독성을 위해 날짜가 1~3개뿐이면 전후 날짜를 보강해 최소 5~6개 날짜 컬럼 확보
  if (sortedDates.length > 0 && sortedDates.length < 5) {
    const baseStr = sortedDates[0];
    const baseDate = new Date(`${baseStr}T00:00:00`);
    if (!Number.isNaN(baseDate.getTime())) {
      for (let offset = 0; offset < 6; offset += 1) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() + offset);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        allDatesSet.add(`${y}-${m}-${day}`);
      }
      sortedDates = [...allDatesSet].sort();
    }
  }
  if (sortedDates.length > 8) {
    sortedDates = sortedDates.slice(-8);
  }

  const dateColumns = sortedDates.map((ymd) => ({
    ymd,
    label: formatMmDd(ymd)
  }));

  const palette = ['#4338ca', '#0d9488', '#0284c7', '#475569', '#7c3aed'];

  // 10개 고정 슬롯(FRT LH A ~ RR RH B) 순서대로 행 생성 (동일 슬롯에 복수 LOT 존재 시 전부 별도 행으로 생성!)
  const rows = [];
  LOT_TRACE_SLOTS.forEach((slot) => {
    const matchingTracks = [...tracksById.values()]
      .filter((t) => t.group === slot.group && t.sideSec === slot.sideSec)
      .sort((a, b) => a.lotKey.localeCompare(b.lotKey));

    if (matchingTracks.length === 0) {
      rows.push({
        rowKey: `${slot.group}_${slot.sideSec}_empty`,
        group: slot.group,
        sideSec: slot.sideSec,
        lotKey: '',
        lotYmd: '',
        isEmpty: true,
        color: '#94a3b8',
        cells: dateColumns.map((col) => ({ ymd: col.ymd, items: [] })),
        stageSummary: { 절단: [], 조인트: [], 후가공: [], 출하: [] },
        missingStages: [],
        reports: []
      });
      return;
    }

    matchingTracks.forEach((tr, idx) => {
      const color = palette[idx % palette.length];
      const expectedStages = tr.group === 'FRT' ? ['절단', '조인트', '출하'] : ['절단', '조인트', '후가공', '출하'];
      const stageDates = {
        절단: [...tr.stages.절단.keys()].sort(),
        조인트: [...tr.stages.조인트.keys()].sort(),
        후가공: [...tr.stages.후가공.keys()].sort(),
        출하: [...tr.stages.출하.keys()].sort()
      };

      // 관측된 공정 중 가장 마지막 공정 이전에 누락된 중간 공정 판별
      let lastObservedStageIdx = -1;
      expectedStages.forEach((st, sIdx) => {
        if (stageDates[st].length > 0) lastObservedStageIdx = sIdx;
      });

      const missingStages = [];
      const missingBetweenPairs = []; // { afterStage, beforeStage, missingStage, prevDate, nextDate }
      if (lastObservedStageIdx > 0) {
        let lastKnownStage = null;
        let lastKnownDate = tr.lotYmd || '';
        for (let sIdx = 0; sIdx <= lastObservedStageIdx; sIdx += 1) {
          const st = expectedStages[sIdx];
          if (stageDates[st].length > 0) {
            const firstDate = stageDates[st][0];
            if (missingStages.length > 0 && lastKnownDate) {
              const latestMiss = missingStages[missingStages.length - 1];
              if (!latestMiss.placed) {
                missingBetweenPairs.push({
                  missingStage: latestMiss.stage,
                  prevDate: lastKnownDate,
                  nextDate: firstDate
                });
                latestMiss.placed = true;
              }
            }
            lastKnownStage = st;
            lastKnownDate = stageDates[st][stageDates[st].length - 1];
          } else {
            missingStages.push({
              stage: st,
              afterStage: lastKnownStage,
              prevDate: lastKnownDate,
              placed: false
            });
          }
        }
      }

      // 날짜 컬럼별 배지 아이템 배치
      const cellMap = new Map(dateColumns.map((c) => [c.ymd, []]));
      let lotBadgePlaced = false;
      if (tr.lotYmd && cellMap.has(tr.lotYmd)) {
        cellMap.get(tr.lotYmd).push({
          type: 'lot',
          label: `소재 ${tr.lotKey}`,
          lotKey: tr.lotKey,
          ymd: tr.lotYmd
        });
        lotBadgePlaced = true;
      }

      ['절단', '조인트', '후가공', '출하'].forEach((st) => {
        stageDates[st].forEach((rDate) => {
          const targetColYmd = cellMap.has(rDate) ? rDate : (dateColumns[0]?.ymd || '');
          if (targetColYmd && cellMap.has(targetColYmd)) {
            cellMap.get(targetColYmd).push({
              type: 'stage',
              stage: st,
              label: `${st} ${formatMmDd(rDate)}`,
              ymd: rDate
            });
          }
        });
      });

      // 소재 시작일이 표시된 날짜 컬럼 범위 이전일 경우 첫 번째 활성 컬럼 앞에 소재 LOT 배지 삽입
      if (!lotBadgePlaced && dateColumns.length > 0) {
        let firstActiveCol = dateColumns[0].ymd;
        for (const col of dateColumns) {
          if ((cellMap.get(col.ymd) || []).length > 0) {
            firstActiveCol = col.ymd;
            break;
          }
        }
        cellMap.get(firstActiveCol).unshift({
          type: 'lot',
          label: `소재 ${tr.lotKey}`,
          lotKey: tr.lotKey,
          ymd: tr.lotYmd
        });
      }

      // 중간 누락 공정(✕ 끊김) 배지를 이전 날짜와 다음 날짜 사이의 빈 날짜 컬럼(없으면 다음 공정 컬럼 앞)에 배치
      missingBetweenPairs.forEach((gap) => {
        const emptyBetweenCol = dateColumns.find(
          (c) =>
            c.ymd > gap.prevDate &&
            c.ymd < gap.nextDate &&
            (cellMap.get(c.ymd) || []).length === 0
        );
        if (emptyBetweenCol) {
          cellMap.get(emptyBetweenCol.ymd).push({
            type: 'missing',
            stage: gap.missingStage,
            label: '✕ 끊김',
            detail: `${gap.missingStage} LOT 미확인`
          });
        } else if (gap.nextDate && cellMap.has(gap.nextDate)) {
          cellMap.get(gap.nextDate).unshift({
            type: 'missing',
            stage: gap.missingStage,
            label: '✕ 끊김',
            detail: `${gap.missingStage} LOT 미확인`
          });
        }
      });

      rows.push({
        rowKey: tr.trackId,
        group: tr.group,
        sideSec: tr.sideSec,
        lotKey: tr.lotKey,
        lotYmd: tr.lotYmd,
        isEmpty: false,
        color,
        cells: dateColumns.map((col) => ({
          ymd: col.ymd,
          items: cellMap.get(col.ymd) || []
        })),
        stageSummary: stageDates,
        missingStages: missingStages.map((m) => m.stage),
        reports: [...tr.allReports.values()]
      });
    });
  });

  return {
    dateColumns,
    rows
  };
}

export const MATERIAL_TRACE_OPTIONS = [
  { key: 'FRT_A', group: 'FRT', section: 'A', label: 'FRT A', branchStages: ['단컷팅', '조인트', '출하'] },
  { key: 'FRT_B', group: 'FRT', section: 'B', label: 'FRT B', branchStages: ['단컷팅', '조인트', '출하'] },
  { key: 'FRT_C', group: 'FRT', section: 'C', label: 'FRT C', branchStages: ['조인트', '출하'] },
  { key: 'RR_A', group: 'RR', section: 'A', label: 'RR A', branchStages: ['단컷팅', '조인트', '후가공', '출하'] },
  { key: 'RR_B', group: 'RR', section: 'B', label: 'RR B', branchStages: ['단컷팅', '조인트', '후가공', '출하'] }
];

const MATERIAL_OPTION_MAP = new Map(MATERIAL_TRACE_OPTIONS.map((opt) => [opt.key, opt]));
const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'];

function shiftYmdLocal(ymd, deltaDays) {
  const [y, m, d] = String(ymd || '').split('-').map(Number);
  if (!y || !m || !d) return '';
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  const ny = dt.getFullYear();
  const nm = String(dt.getMonth() + 1).padStart(2, '0');
  const nd = String(dt.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

function getWeekdayKo(ymd) {
  const [y, m, d] = String(ymd || '').split('-').map(Number);
  if (!y || !m || !d) return '';
  const dt = new Date(y, m - 1, d);
  return WEEKDAY_KO[dt.getDay()] || '';
}

function getTodayYmdFallback() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 단일 materialLots 키를 소재(FRT_A..RR_B) + 갈래(COMMON | LH | RH) + 공정 단계로 매핑한다.
 */
function resolveMaterialLotBranchEvent(key, code, report) {
  if (!key || typeof key !== 'string') return null;
  if (key.startsWith('f5006_rec_') || key === 'f5006_selected_equip') return null;
  if (key.endsWith('_chk1') || key.endsWith('_chk2')) return null;
  if (!(key.includes('초물') || key.includes('중물') || key.includes('종물') || /_(초|중|종)$/.test(key))) {
    return null;
  }

  const clean = key
    .replace(new RegExp(`^f${code}_`), '')
    .replace(/_(초물|중물|종물|초|중|종)$/, '');

  if (code === 5007 || clean.startsWith('DV_')) return null;

  if (code === 5002) {
    const m = clean.match(/^(FRT|RR)_([ABC])$/);
    if (!m) return null;
    if (m[1] === 'RR' && m[2] === 'C') return null;
    return {
      materialKey: `${m[1]}_${m[2]}`,
      branch: 'COMMON',
      stageGroup: '정치절단',
      stageLabel: '정치절단',
      stageOrder: 0
    };
  }

  if (code === 5003) {
    const m = clean.match(/^(FRT|RR)_(LH|RH)_([AB])$/);
    if (m) {
      return {
        materialKey: `${m[1]}_${m[3]}`,
        branch: m[2],
        stageGroup: '단컷팅',
        stageLabel: '단컷팅',
        stageOrder: 1
      };
    }
    const leg = clean.match(/^(LH|RH)_(FRT|RR)$/);
    if (leg) {
      return {
        materialKey: `${leg[2]}_A`,
        branch: leg[1],
        stageGroup: '단컷팅',
        stageLabel: '단컷팅',
        stageOrder: 1
      };
    }
    return null;
  }

  if (code === 5004) {
    const m = clean.match(/^FRT_(LH|RH)_([ABC])$/);
    if (m) {
      return {
        materialKey: `FRT_${m[2]}`,
        branch: m[1],
        stageGroup: '조인트',
        stageLabel: '조인트',
        stageOrder: 2
      };
    }
    const leg = clean.match(/^(?:FRT_(LH|RH)|(LH|RH)_FRT)$/);
    if (leg) {
      return {
        materialKey: 'FRT_A',
        branch: leg[1] || leg[2],
        stageGroup: '조인트',
        stageLabel: '조인트',
        stageOrder: 2
      };
    }
    return null;
  }

  if (code === 5005) {
    const m = clean.match(/^RR_(LH|RH)_([AB])$/);
    if (m) {
      return {
        materialKey: `RR_${m[2]}`,
        branch: m[1],
        stageGroup: '조인트',
        stageLabel: '조인트(R)',
        stageOrder: 2
      };
    }
    const leg = clean.match(/^(?:FRT_(LH|RH)|(LH|RH)_FRT)$/);
    if (leg) {
      return {
        materialKey: 'RR_A',
        branch: leg[1] || leg[2],
        stageGroup: '조인트',
        stageLabel: '조인트(R)',
        stageOrder: 2
      };
    }
    return null;
  }

  if (code === 5006) {
    const equip = resolveF5006Equip(report);
    const mSide = clean.match(/^RR_(LH|RH)_([AB])$/);
    if (mSide) {
      return {
        materialKey: `RR_${mSide[2]}`,
        branch: mSide[1],
        stageGroup: '조인트',
        stageLabel: '조인트(Fix)',
        stageOrder: 2
      };
    }
    const mSec = clean.match(/^RR_([AB])$/);
    if (mSec) {
      return {
        materialKey: `RR_${mSec[1]}`,
        branch: equip.side,
        stageGroup: '조인트',
        stageLabel: '조인트(Fix)',
        stageOrder: 2
      };
    }
    const leg = clean.match(/^FRT_(LH|RH)$/);
    if (leg) {
      return {
        materialKey: 'RR_A',
        branch: leg[1],
        stageGroup: '조인트',
        stageLabel: '조인트(Fix)',
        stageOrder: 2
      };
    }
    return null;
  }

  if (code === 5010) {
    const m = clean.match(/^(?:RR|FRT)_(LH|RH)_([AB])$/);
    if (m) {
      return {
        materialKey: `RR_${m[2]}`,
        branch: m[1],
        stageGroup: '후가공',
        stageLabel: '후가공',
        stageOrder: 3
      };
    }
    return null;
  }

  if (code === 5011) {
    const m = clean.match(/^FRT_(LH|RH)_([ABC])$/);
    if (m) {
      return {
        materialKey: `FRT_${m[2]}`,
        branch: m[1],
        stageGroup: '출하',
        stageLabel: '검사포장',
        stageOrder: 4
      };
    }
    const leg = clean.match(/^(?:FRT_(LH|RH)|(LH|RH)_FRT)$/);
    if (leg) {
      return {
        materialKey: 'FRT_A',
        branch: leg[1] || leg[2],
        stageGroup: '출하',
        stageLabel: '검사포장',
        stageOrder: 4
      };
    }
    return null;
  }

  if (code === 5012 || code === 5013 || code === 5014) {
    const m = clean.match(/^(?:RR|FRT)_(LH|RH)_([AB])$/);
    if (m) {
      return {
        materialKey: `RR_${m[2]}`,
        branch: m[1],
        stageGroup: '출하',
        stageLabel: code === 5012 ? '포장(R)' : code === 5014 ? '포장(길이)' : '포장(RR)',
        stageOrder: 4
      };
    }
    return null;
  }

  return null;
}

/**
 * 선택된 단일 소재(FRT_A..RR_B)의 주간(7일) 분기형 LOT 추이도 모델을 계산한다.
 * - 출발 LOT(정치절단 #5002)는 L/R 구별 없이 단일 출발 노드로 시작
 * - 이후 공정(#5003~#5014)은 LH / RH 갈래로 나뉘어 7일 타임라인을 따라 표기
 */
export function buildMaterialWeeklyLotTimeline(
  reports = [],
  { materialKey = 'FRT_A', weekEndDate = '', shiftFilter = 'ALL' } = {}
) {
  const matOption = MATERIAL_OPTION_MAP.get(materialKey) || MATERIAL_TRACE_OPTIONS[0];
  const resolvedEnd = weekEndDate || getTodayYmdFallback();
  const weekStart = shiftYmdLocal(resolvedEnd, -6) || resolvedEnd;

  const dateColumns = [];
  for (let offset = -6; offset <= 0; offset += 1) {
    const ymd = shiftYmdLocal(resolvedEnd, offset);
    if (ymd) {
      dateColumns.push({
        ymd,
        label: formatMmDd(ymd),
        weekday: getWeekdayKo(ymd)
      });
    }
  }
  const weekDateSet = new Set(dateColumns.map((c) => c.ymd));

  // 주간 활성 LOT 집합 (전체 5개 소재별 카운트 계산용)
  const activeLotsByMaterial = new Map(MATERIAL_TRACE_OPTIONS.map((o) => [o.key, new Set()]));
  // 선택된 소재의 전체 추적(과거 14일+주간 포함) 이벤트 버킷
  const selectedLotTracks = new Map();

  const createEmptyBranch = () => ({
    eventsByDate: new Map(), // reportDate -> Map(stageLabel -> stageInfo)
    stageDates: { 단컷팅: new Set(), 조인트: new Set(), 후가공: new Set(), 출하: new Set() },
    reportsById: new Map()
  });

  reports.forEach((r) => {
    const code = resolveGm9bqcProcessCode(r, { excludeDraftRejected: true });
    if (!code) return;
    const shift = classifyReportShift(r);
    if (shiftFilter !== 'ALL' && shift !== shiftFilter) return;

    const reportDate = cleanText(r?.date);
    if (!reportDate || reportDate > resolvedEnd) return;

    const lots = r?.materialLots || {};
    Object.entries(lots).forEach(([key, rawVal]) => {
      if (typeof rawVal === 'boolean') return;
      const evt = resolveMaterialLotBranchEvent(key, code, r);
      if (!evt) return;

      const lotInfo = extractLotYmdInfo(rawVal);
      if (!lotInfo || !lotInfo.lotKey) return;

      if (weekDateSet.has(reportDate)) {
        activeLotsByMaterial.get(evt.materialKey)?.add(lotInfo.lotKey);
      }

      if (evt.materialKey !== matOption.key) return;

      let tr = selectedLotTracks.get(lotInfo.lotKey);
      if (!tr) {
        tr = {
          lotKey: lotInfo.lotKey,
          lotYmd: lotInfo.lotYmd,
          lotMmDd: lotInfo.lotMmDd,
          common: {
            datesSet: new Set(),
            reportsById: new Map()
          },
          LH: createEmptyBranch(),
          RH: createEmptyBranch(),
          allReportsById: new Map()
        };
        selectedLotTracks.set(lotInfo.lotKey, tr);
      }

      if (r.id) {
        tr.allReportsById.set(r.id, r);
      }

      if (evt.branch === 'COMMON') {
        tr.common.datesSet.add(reportDate);
        if (r.id) tr.common.reportsById.set(r.id, r);
      } else {
        const br = evt.branch === 'RH' ? tr.RH : tr.LH;
        if (!br.eventsByDate.has(reportDate)) {
          br.eventsByDate.set(reportDate, new Map());
        }
        const stageMap = br.eventsByDate.get(reportDate);
        if (!stageMap.has(evt.stageLabel)) {
          stageMap.set(evt.stageLabel, {
            stageGroup: evt.stageGroup,
            stageLabel: evt.stageLabel,
            stageOrder: evt.stageOrder,
            code
          });
        }
        if (br.stageDates[evt.stageGroup]) {
          br.stageDates[evt.stageGroup].add(reportDate);
        }
        if (r.id) br.reportsById.set(r.id, r);
      }
    });
  });

  const materialCounts = {};
  MATERIAL_TRACE_OPTIONS.forEach((opt) => {
    materialCounts[opt.key] = activeLotsByMaterial.get(opt.key)?.size || 0;
  });

  const activeSetForSelected = activeLotsByMaterial.get(matOption.key) || new Set();
  const expectedBranchStages = matOption.branchStages;
  const palette = ['#2563eb', '#0d9488', '#7c3aed', '#0284c7', '#475569'];

  const buildBranchView = (br, branchKey, color) => {
    const cellMap = new Map(dateColumns.map((c) => [c.ymd, []]));

    dateColumns.forEach((col) => {
      const dateStages = br.eventsByDate.get(col.ymd);
      if (!dateStages) return;
      const items = [...dateStages.values()]
        .sort((a, b) => a.stageOrder - b.stageOrder || a.code - b.code)
        .map((st) => ({
          type: 'stage',
          stageGroup: st.stageGroup,
          label: st.stageLabel,
          ymd: col.ymd,
          code: st.code
        }));
      cellMap.get(col.ymd).push(...items);
    });

    const stageDatesSorted = {
      단컷팅: [...br.stageDates.단컷팅].sort(),
      조인트: [...br.stageDates.조인트].sort(),
      후가공: [...br.stageDates.후가공].sort(),
      출하: [...br.stageDates.출하].sort()
    };

    let lastObservedIdx = -1;
    expectedBranchStages.forEach((st, idx) => {
      if ((stageDatesSorted[st] || []).length > 0) lastObservedIdx = idx;
    });

    const missingStages = [];
    if (lastObservedIdx > 0) {
      let lastKnownDate = '';
      for (let idx = 0; idx <= lastObservedIdx; idx += 1) {
        const st = expectedBranchStages[idx];
        const dates = stageDatesSorted[st] || [];
        if (dates.length > 0) {
          if (missingStages.length > 0) {
            const firstInWeekDate = dates.find((d) => weekDateSet.has(d));
            const latestMiss = missingStages[missingStages.length - 1];
            if (!latestMiss.placed && firstInWeekDate) {
              const emptyGapCol = lastKnownDate
                ? dateColumns.find(
                    (c) =>
                      c.ymd > lastKnownDate &&
                      c.ymd < firstInWeekDate &&
                      (cellMap.get(c.ymd) || []).length === 0
                  )
                : null;
              const targetCol = emptyGapCol ? emptyGapCol.ymd : firstInWeekDate;
              if (targetCol && cellMap.has(targetCol)) {
                cellMap.get(targetCol).unshift({
                  type: 'missing',
                  stage: latestMiss.stage,
                  label: `✕ ${latestMiss.stage} 끊김`,
                  detail: `${branchKey} ${latestMiss.stage} 공정 미확인`
                });
                latestMiss.placed = true;
              }
            }
          }
          lastKnownDate = dates[dates.length - 1];
        } else {
          missingStages.push({ stage: st, placed: false });
        }
      }
    }

    const cells = dateColumns.map((c) => ({
      ymd: c.ymd,
      items: cellMap.get(c.ymd) || []
    }));

    const hasWeekActivity = cells.some((c) => c.items.some((it) => it.type === 'stage'));
    const preWeekDates = Object.values(stageDatesSorted)
      .flat()
      .filter((d) => d < weekStart)
      .sort();

    return {
      branch: branchKey,
      color,
      cells,
      hasWeekActivity,
      preWeekLastDate: preWeekDates.length > 0 ? formatMmDd(preWeekDates[preWeekDates.length - 1]) : '',
      stageSummary: stageDatesSorted,
      missingStages: missingStages.map((m) => m.stage),
      reports: [...br.reportsById.values()]
    };
  };

  const isValidCalendarLotKey = (lotKey) => {
    const m = String(lotKey || '').match(/^(\d{2})\.(\d{2})\.(\d{2})$/);
    if (!m) return false;
    const mm = Number(m[2]);
    const dd = Number(m[3]);
    return mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31;
  };

  const lots = [...activeSetForSelected]
    .sort((a, b) => {
      const aValid = isValidCalendarLotKey(a) ? 0 : 1;
      const bValid = isValidCalendarLotKey(b) ? 0 : 1;
      if (aValid !== bValid) return aValid - bValid;
      return String(a).localeCompare(String(b), 'ko', { numeric: true });
    })
    .map((lotKey, idx) => {
      const tr = selectedLotTracks.get(lotKey);
      const commonDatesAll = [...tr.common.datesSet].sort();
      const commonPreDates = commonDatesAll.filter((d) => d < weekStart);
      const originColor = palette[idx % palette.length];

      const originCells = dateColumns.map((col) => ({
        ymd: col.ymd,
        items: tr.common.datesSet.has(col.ymd)
          ? [{ type: 'origin', stageGroup: '정치절단', label: '정치절단', ymd: col.ymd, code: 5002 }]
          : []
      }));

      const lhBranch = buildBranchView(tr.LH, 'LH', '#2563eb');
      const rhBranch = buildBranchView(tr.RH, 'RH', '#0d9488');

      const allReports = [...tr.allReportsById.values()].sort((a, b) => {
        const dCmp = String(a.date || '').localeCompare(String(b.date || ''));
        if (dCmp !== 0) return dCmp;
        return Number(a.formCode || 0) - Number(b.formCode || 0);
      });

      return {
        lotKey,
        lotYmd: tr.lotYmd,
        materialKey: matOption.key,
        materialLabel: matOption.label,
        group: matOption.group,
        section: matOption.section,
        originColor,
        origin: {
          datesAll: commonDatesAll,
          preWeekLastDate: commonPreDates.length > 0 ? formatMmDd(commonPreDates[commonPreDates.length - 1]) : '',
          hasWeekActivity: commonDatesAll.some((d) => weekDateSet.has(d)),
          cells: originCells,
          reports: [...tr.common.reportsById.values()]
        },
        lh: lhBranch,
        rh: rhBranch,
        reports: allReports
      };
    });

  return {
    material: matOption,
    weekStart,
    weekEnd: resolvedEnd,
    dateColumns,
    materialCounts,
    lots
  };
}

/**
 * 우하단 '부자재 LOT 현황' 5종 카드 구성 (패드 lot [5T/7T], 브라켓 lot, 조인트 재료 lot, Glass lot, D/V lot)
 */
export function buildSubMaterial5Cards(subMaterialCards = []) {
  const byId = new Map(subMaterialCards.map((c) => [c.id, c]));
  const pad5 = byId.get('pad_5t');
  const pad7 = byId.get('pad_7t');
  const bracket = byId.get('bracket');
  const joint = byId.get('joint_resin');
  const glass = byId.get('glass');
  const dv = byId.get('dv');

  const p5Lot = pad5?.primaryLot || '';
  const p7Lot = pad7?.primaryLot || '';
  let padPrimaryLot = '';
  if (p5Lot && p7Lot) {
    padPrimaryLot = p5Lot === p7Lot ? `${p5Lot} (5T·7T)` : `${p5Lot} (5T) · ${p7Lot} (7T)`;
  } else if (p5Lot) {
    padPrimaryLot = `${p5Lot} (5T)`;
  } else if (p7Lot) {
    padPrimaryLot = `${p7Lot} (7T)`;
  }

  const padCombinedCard = {
    id: 'pad_combined',
    title: '패드 lot',
    shortBadge: '5T / 7T',
    processBadge: '#5010 · #5011 · #5013 · #5014',
    specLabel: '패드 5T(5*5*60) · 7T(7*10*50)',
    primaryLot: padPrimaryLot,
    subMeta: pad5?.records?.length ? pad5.subMeta : (pad7?.subMeta || '금일 입력 대기'),
    updatedStamp: pad5?.updatedStamp !== '-' ? pad5?.updatedStamp : (pad7?.updatedStamp || '-'),
    stages: [
      {
        label: '초',
        filled: Boolean(pad5?.stages?.[0]?.filled || pad7?.stages?.[0]?.filled),
        value: [pad5?.stages?.[0]?.value, pad7?.stages?.[0]?.value].filter(Boolean).join(' / ')
      },
      {
        label: '중',
        filled: Boolean(pad5?.stages?.[1]?.filled || pad7?.stages?.[1]?.filled),
        value: [pad5?.stages?.[1]?.value, pad7?.stages?.[1]?.value].filter(Boolean).join(' / ')
      },
      {
        label: '종',
        filled: Boolean(pad5?.stages?.[2]?.filled || pad7?.stages?.[2]?.filled),
        value: [pad5?.stages?.[2]?.value, pad7?.stages?.[2]?.value].filter(Boolean).join(' / ')
      }
    ],
    records: [...(pad5?.records || []), ...(pad7?.records || [])]
  };

  return [
    padCombinedCard,
    bracket ? { ...bracket, title: '브라켓 lot', shortBadge: '#5006' } : null,
    joint
      ? {
          ...joint,
          title: '조인트 재료 lot',
          shortBadge: 'FRT·RR',
          stages: [
            { label: '초', filled: Boolean(joint.stages?.[0]?.filled), value: joint.stages?.[0]?.value || '' },
            { label: '중', filled: Boolean(joint.stages?.[1]?.filled), value: joint.stages?.[1]?.value || '' },
            { label: '종', filled: Boolean(joint.stages?.[2]?.filled), value: joint.stages?.[2]?.value || '' }
          ]
        }
      : null,
    glass ? { ...glass, title: 'Glass lot', shortBadge: '#5006' } : null,
    dv ? { ...dv, title: 'D/V lot', shortBadge: '#5006·5013' } : null
  ].filter(Boolean);
}

/**
 * 필터링된 일보 목록으로부터 Proposal C 전체 관제판 데이터를 계산한다.
 */
export function buildGm9bqcGrunDashboardModel(reports = [], { shiftFilter = 'ALL', trackingReports = null } = {}) {
  const validEntries = [];

  reports.forEach((r) => {
    const code = resolveGm9bqcProcessCode(r, { excludeDraftRejected: true });
    if (!code) return;
    const shift = classifyReportShift(r);
    if (shiftFilter !== 'ALL' && shift !== shiftFilter) return;
    validEntries.push({ code, shift, report: r });
  });

  const trackingEntries = [];
  if (Array.isArray(trackingReports) && trackingReports.length > 0) {
    trackingReports.forEach((r) => {
      const code = resolveGm9bqcProcessCode(r, { excludeDraftRejected: true });
      if (!code) return;
      const shift = classifyReportShift(r);
      if (shiftFilter !== 'ALL' && shift !== shiftFilter) return;
      trackingEntries.push({ code, shift, report: r });
    });
  }

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
    const qualityRate = totalInspected > 0 ? (actual / totalInspected) * 100 : (matching.length > 0 ? 100 : 0);

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
      qualityRate,
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
  const subMaterial5Cards = buildSubMaterial5Cards(subMaterialCards);
  const lotTimeline = buildLotTraceabilityTimeline(
    validEntries,
    trackingEntries.length > 0 ? trackingEntries : validEntries
  );

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
    subMaterialCards,
    subMaterial5Cards,
    lotTimeline
  };
}
