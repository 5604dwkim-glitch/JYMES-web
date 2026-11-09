import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { CAR_MODELS, DEFAULT_ITEMS } from '../constants/masterData';
import {
  fetchMolds,
  fetchEquipments,
  invalidateMoldsCache,
  invalidateEquipmentsCache,
  invalidateChangePointsCache
} from './firestore';

/**
 * 현대·기아자동차 SQ / 4M 및 변동점 관리 기준 카테고리
 * (기존 항목 100% 하위 호환 + 설비/TPM/금형 자동연동 전용 표준 항목 포함)
 */
export const HYUNDAI_ISSUE_CATEGORY_MAP = {
  '4M': [
    '특별특성 공정 작업자 변경',
    '실명제 제외 인원 공정 투입',
    '금형, 지그 신작',
    '금형 설변/개선',
    '장기 유휴 설비,금형,지그 사용',
    '설비 용량 변경',
    'SUB품 재질 변경',
    'ALT 재질 적용',
    '특수강/철분말 공급처 변경',
    '원자재 사급 변경',
    '고객 포장 사양 변경',
    '공급사 변경',
    '근무형태 조건 변경',
    '작업방법 변경',
    '생산라인 위치 변경',
    '공장 생산 위치 변경',
    '공정조건 변경',
    '미승인된 협력사 자체도면',
    '관리계획서 상이한 기준',
    '검사협정서 상이한 기준'
  ],
  '변동점': [
    '설비 고장/수리',
    'TPM 점검 이상/수리',
    '금형 수리/보수',
    '작업자 임시 대체',
    '작업자 근무 교대시간 변경',
    '작업자 역할 분담 변경',
    '툴(공구) 변경',
    '동일 조건의 설비/라인 변경',
    '도장/토출 조건 변경',
    '작업 속도/주기 변경',
    '설비 온도/압력 변경',
    '작업 각도/방식 변경',
    '그리스/윤활유 정기보충(교체)',
    '냉각수/워터호스 정기보충(교체)',
    '설비 부자재 정기교체',
    '단전/단수 발생',
    '파업 발생',
    '물류/파레트 변경',
    '2/3차사 입고품 변경',
    '상기 16항목 외'
  ]
};

// 설비 셋트 캐시 (짧은 TTL로 중복 읽기 방지)
let equipmentSetsCache = null;
let equipmentSetsCacheAt = 0;
const EQUIPMENT_SETS_TTL_MS = 10 * 60 * 1000;

async function fetchEquipmentSetsCached() {
  if (equipmentSetsCache && Date.now() - equipmentSetsCacheAt < EQUIPMENT_SETS_TTL_MS) {
    return equipmentSetsCache;
  }
  try {
    const snap = await getDocs(collection(db, 'equipment_sets'));
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    equipmentSetsCache = list;
    equipmentSetsCacheAt = Date.now();
    return list;
  } catch (err) {
    console.warn('Failed to load equipment_sets for changePoint sync:', err);
    return [];
  }
}

export function sanitizeDocKey(raw) {
  return String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 120);
}

export function normalizeDateYmd(rawDate) {
  const s = String(rawDate || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const digits = s.replace(/\D/g, '');
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function toMonthLabel(ymd) {
  const parts = String(ymd || '').split('-');
  const m = parseInt(parts[1], 10);
  if (Number.isFinite(m) && m >= 1 && m <= 12) return `${m}월`;
  return `${new Date().getMonth() + 1}월`;
}

const SORTED_CAR_CODES = [...CAR_MODELS]
  .map((c) => c.code)
  .sort((a, b) => b.length - a.length);

/**
 * 설비 셋트명 / 설비코드 / 금형 차종 문자열로부터 표준 차종 코드 및 품명을 추론한다.
 */
export function inferCarAndPart(hintText = '', fallbackCar = '', fallbackPart = '') {
  const combined = `${fallbackCar || ''} ${hintText || ''}`.trim();
  const upper = combined.toUpperCase();

  let matchedCar = '';
  if (fallbackCar && CAR_MODELS.some((c) => c.code === fallbackCar)) {
    matchedCar = fallbackCar;
  } else {
    for (const code of SORTED_CAR_CODES) {
      if (code === '공통') continue;
      if (upper.includes(code.toUpperCase())) {
        matchedCar = code;
        break;
      }
    }
  }

  if (!matchedCar) {
    if (upper.includes('NE1')) matchedCar = 'NE1a';
    else if (upper.includes('ME1')) matchedCar = 'ME1a';
    else if (upper.includes('LQ2')) matchedCar = 'LQ2a';
    else if (upper.includes('MV1')) matchedCar = 'MV1a';
    else if (upper.includes('KMKX') || upper.includes('KM/KX')) matchedCar = 'KM/KX';
    else if (upper.includes('9B-') || upper.includes('9B_')) matchedCar = '9BQC';
    else if (upper.includes('DS CUTLINE')) matchedCar = 'DS CREW';
    else if (upper.startsWith('DS-') || upper.includes(' DS-')) matchedCar = 'DS STD';
    else if (upper.startsWith('DT-') || upper.includes(' DT-')) matchedCar = 'DT CREW';
    else if (upper.startsWith('JG-') || upper.includes(' JG-')) matchedCar = 'JG1';
    else if (upper.startsWith('OV-') || upper.includes(' OV-')) matchedCar = 'OV1K';
    else if (fallbackCar) matchedCar = fallbackCar;
  }

  let matchedPart = fallbackPart || '';
  if (matchedCar) {
    const candidateItems = DEFAULT_ITEMS.filter((it) => it.carModel === matchedCar);
    if (matchedPart && candidateItems.some((it) => it.name === matchedPart)) {
      // keep exact match
    } else if (candidateItems.length === 1 && !matchedPart) {
      matchedPart = candidateItems[0].name;
    } else {
      const partSearch = `${fallbackPart || ''} ${hintText || ''}`.toUpperCase();
      const hit = candidateItems.find((it) => partSearch.includes(String(it.name || '').toUpperCase()));
      if (hit) matchedPart = hit.name;
      else if (partSearch.includes('FRUNK')) {
        const frunkItem = candidateItems.find((it) => String(it.name).toUpperCase().includes('FRUNK'));
        if (frunkItem) matchedPart = frunkItem.name;
      } else if (partSearch.includes('CUTLINE')) {
        const cutItem = candidateItems.find((it) => String(it.name).toUpperCase().includes('CUT'));
        if (cutItem) matchedPart = cutItem.name;
      }
    }
  }

  return {
    carModel: matchedCar || '',
    partName: matchedPart || ''
  };
}

async function resolveEquipmentMeta(equipment, explicitSetName = '', providedSets = null) {
  let setName = explicitSetName || '';
  if (!setName && equipment) {
    const sets = providedSets || (await fetchEquipmentSetsCached());
    const codeStr = equipment.code ? String(equipment.code).trim() : '';
    const hitSet = sets.find((s) => {
      if (Array.isArray(s.equipmentIds) && s.equipmentIds.includes(equipment.id)) return true;
      if (Array.isArray(s.equipments)) {
        return s.equipments.some(
          (item) => item?.id === equipment.id || (codeStr && String(item?.code || '').trim() === codeStr)
        );
      }
      return false;
    });
    if (hitSet?.name) setName = hitSet.name;
  }

  const hint = [setName, equipment?.code, equipment?.name, equipment?.location].filter(Boolean).join(' ');
  const { carModel, partName } = inferCarAndPart(hint);
  return { setName, carModel, partName };
}

/**
 * 현대자동차 Level2 변경 내용 이력표 (Q.POINT) 기본 데이터 생성 (기존 사진·결재 정보 보존)
 */
function buildMergedQPointData(existingQPoint, draft) {
  const prev = existingQPoint || {};
  return {
    reportDate: draft.reportDate || prev.reportDate || normalizeDateYmd(),
    carModel: draft.carModel || prev.carModel || '',
    partName: draft.partName || prev.partName || '',
    partnerName: prev.partnerName || '(주)조영산업',
    devType: prev.devType || '양산',
    partNo: draft.partNo || prev.partNo || '',
    author: draft.author || prev.author || '',
    changeReason: draft.changeReason || prev.changeReason || '',
    changeWorker: draft.changeWorker || prev.changeWorker || '',
    changeDocs: Array.isArray(prev.changeDocs) && prev.changeDocs.length > 0 ? prev.changeDocs : ['변경 내용 이력표'],
    changeDocsOther: prev.changeDocsOther || '',
    reviewNeeds: Array.isArray(prev.reviewNeeds) && prev.reviewNeeds.length > 0 ? prev.reviewNeeds : ['공정점검 필요'],
    reviewNeedsOther: prev.reviewNeedsOther || '',
    changeDate: draft.changeDate || prev.changeDate || draft.reportDate || '',
    applyDate: draft.applyDate || prev.applyDate || draft.reportDate || '',
    identifyMethod: prev.identifyMethod || '초품 식별표 부착 및 LOT 구분 관리',
    changeContentText: draft.changeContentText || prev.changeContentText || '',
    beforeImage: draft.beforeImage || prev.beforeImage || '',
    afterImage: draft.afterImage || prev.afterImage || '',
    qcPartner: draft.qcPartner || prev.qcPartner || '',
    qcQuantity: prev.qcQuantity || '초·중·종품 5EA',
    qcContent: draft.qcContent || prev.qcContent || '',
    qcResult: draft.qcResult || prev.qcResult || '',
    qcApprover1: prev.qcApprover1 || '',
    qcApprover2: prev.qcApprover2 || ''
  };
}

/**
 * 변동점(`changePoints`) 자동 등록/갱신 (결정적 문서 ID 기반 — 중복 생성 원천 차단)
 */
export async function upsertAutoChangePoint(autoKey, payload, qPointDraft = {}) {
  const safeKey = sanitizeDocKey(autoKey);
  if (!safeKey) return null;

  const docId = `cp_auto_${safeKey}`;
  const docRef = doc(db, 'changePoints', docId);
  const dateYmd = normalizeDateYmd(payload.date);
  const monthLabel = payload.month || toMonthLabel(dateYmd);

  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    const qPointData = buildMergedQPointData(null, {
      reportDate: dateYmd,
      carModel: payload.carModel,
      partName: payload.partName,
      ...qPointDraft
    });

    await setDoc(docRef, {
      date: dateYmd,
      month: monthLabel,
      type: payload.type || '변동점',
      issueItem: payload.issueItem || '설비 고장/수리',
      carModel: payload.carModel || '',
      partName: payload.partName || '',
      details: payload.details || '',
      actionTime: payload.actionTime || dateYmd,
      actionPlan: payload.actionPlan || '',
      actionResult: payload.actionResult || '',
      qualityCheck: Boolean(payload.qualityCheck),
      ceoCheck: Boolean(payload.ceoCheck),
      qPointInstall: Boolean(payload.qPointInstall),
      qPointFile: payload.qPointFile || '',
      qPointData,
      note: payload.note || '',
      autoSourceKey: safeKey,
      autoSourceType: payload.autoSourceType || 'auto',
      updatedAt: new Date().toISOString(),
      createdAt: serverTimestamp()
    });
  } else {
    const existing = snap.data() || {};
    const qPointData = buildMergedQPointData(existing.qPointData, {
      reportDate: dateYmd,
      carModel: payload.carModel || existing.carModel,
      partName: payload.partName || existing.partName,
      ...qPointDraft
    });

    await updateDoc(docRef, {
      date: dateYmd,
      month: monthLabel,
      type: payload.type || existing.type || '변동점',
      issueItem: payload.issueItem || existing.issueItem || '설비 고장/수리',
      carModel: payload.carModel || existing.carModel || '',
      partName: payload.partName || existing.partName || '',
      details: payload.details || existing.details || '',
      actionTime: payload.actionTime || existing.actionTime || dateYmd,
      actionPlan: payload.actionPlan || existing.actionPlan || '',
      actionResult: payload.actionResult || existing.actionResult || '',
      qualityCheck: Boolean(existing.qualityCheck || payload.qualityCheck),
      ceoCheck: Boolean(existing.ceoCheck || payload.ceoCheck),
      qPointInstall: Boolean(existing.qPointInstall || payload.qPointInstall),
      qPointData,
      note: payload.note || existing.note || '',
      autoSourceKey: safeKey,
      autoSourceType: payload.autoSourceType || existing.autoSourceType || 'auto',
      updatedAt: new Date().toISOString()
    });
  }

  invalidateChangePointsCache();
  return docId;
}

/**
 * 1) TPM 점검 이상(X) / 수리(△) 발생 시:
 *    - 설비 이력카드(`equipments.history`) 수리의뢰서 자동 연동
 *    - 현대차 변동점 관리(`changePoints`) 자동 등록
 */
export async function syncTpmAbnormalToRepairAndChangePoint({
  equipment,
  dateYmd,
  abnormalItems = [],
  workerName = '',
  setName = '',
  equipmentSets = null,
  skipEquipmentHistoryUpdate = false
}) {
  if (!equipment?.id || !Array.isArray(abnormalItems) || abnormalItems.length === 0) {
    return null;
  }

  const normalizedDate = normalizeDateYmd(dateYmd);
  const compactDate = normalizedDate.replace(/-/g, '');
  const autoKey = `tpm_${equipment.id}_${compactDate}`;

  const summaryParts = abnormalItems.map((it) => {
    const tag = it.mark === '△' ? '△수리' : 'X이상';
    return `${it.label}${it.criterion ? `(${it.criterion})` : ''}: ${tag}`;
  });
  const summaryText = summaryParts.join(', ');
  const hasRepairMark = abnormalItems.some((it) => it.mark === '△');

  // 수리의뢰 구분 및 현대차 변동점 발생항목 자동 판별
  const joinedLabels = abnormalItems.map((it) => `${it.label || ''} ${it.criterion || ''}`).join(' ');
  let requestType = '작동이상';
  if (joinedLabels.includes('온조기') || joinedLabels.includes('온도')) {
    requestType = '온조기';
  } else if (joinedLabels.includes('오일') || joinedLabels.includes('누유')) {
    requestType = '상단누유';
  }

  const issueItem =
    joinedLabels.includes('온조기') || joinedLabels.includes('온도') || joinedLabels.includes('압력')
      ? '설비 온도/압력 변경'
      : 'TPM 점검 이상/수리';

  const meta = await resolveEquipmentMeta(equipment, setName, equipmentSets);
  const eqTitle = `${equipment.name || '설비'}(${equipment.code || equipment.id})`;
  const issueText = `[TPM 일지 이상] ${summaryText}`;

  let updatedHistory = Array.isArray(equipment.history) ? [...equipment.history] : [];

  if (!skipEquipmentHistoryUpdate) {
    const existingIdx = updatedHistory.findIndex(
      (row) =>
        row?.autoSyncKey === autoKey ||
        (row?.date === normalizedDate && String(row?.issue || '').startsWith('[TPM'))
    );

    if (existingIdx >= 0) {
      const prevRow = updatedHistory[existingIdx];
      updatedHistory[existingIdx] = {
        ...prevRow,
        autoSyncKey: autoKey,
        syncId: prevRow.syncId || autoKey,
        date: normalizedDate,
        issue: prevRow.repairDetails?.actionContent ? prevRow.issue : issueText,
        attachment: prevRow.attachment || '수리의뢰서',
        repairDetails: {
          equipmentName: equipment.name || '',
          equipmentCode: equipment.code || '',
          department: '㈜조영산업',
          requestDate: normalizedDate,
          requestType,
          pic: workerName || '',
          completionDate: hasRepairMark ? normalizedDate : '',
          remarks: `TPM 일지 자동연동${meta.setName ? ` (${meta.setName})` : ''}`,
          requestContent: issueText,
          actionContent: hasRepairMark ? '현장 즉시 수리/조치 완료' : '',
          verificationResult: '',
          qualityPic: '',
          ...(prevRow.repairDetails || {})
        }
      };
    } else {
      updatedHistory.push({
        syncId: autoKey,
        autoSyncKey: autoKey,
        date: normalizedDate,
        issue: issueText,
        action: hasRepairMark ? '현장 즉시 수리/조치 완료' : '수리의뢰서 자동접수 (조치 대기)',
        attachment: '수리의뢰서',
        confirmed: false,
        repairDetails: {
          equipmentName: equipment.name || '',
          equipmentCode: equipment.code || '',
          department: '㈜조영산업',
          requestDate: normalizedDate,
          requestType,
          pic: workerName || '',
          completionDate: hasRepairMark ? normalizedDate : '',
          remarks: `TPM 일지 자동연동${meta.setName ? ` (${meta.setName})` : ''}`,
          requestContent: issueText,
          actionContent: hasRepairMark ? '현장 즉시 수리/조치 완료' : '',
          verificationResult: '',
          qualityPic: ''
        }
      });
    }

    await updateDoc(doc(db, 'equipments', equipment.id), { history: updatedHistory });
    invalidateEquipmentsCache();
  }

  await upsertAutoChangePoint(
    autoKey,
    {
      date: normalizedDate,
      type: '변동점',
      issueItem,
      carModel: meta.carModel,
      partName: meta.partName,
      details: `[TPM점검] ${eqTitle} — ${summaryText}`,
      actionTime: normalizedDate,
      actionPlan: '설비 점검·수리 의뢰 및 조치 후 초품 품질 확인',
      actionResult: hasRepairMark ? '현장 수리/조치 반영 (수리의뢰서 연동)' : '수리의뢰서 자동연동 접수',
      qualityCheck: false,
      note: `자동연동(TPM일지${meta.setName ? ` · ${meta.setName}` : ''})`,
      autoSourceType: 'tpm'
    },
    {
      author: workerName || '',
      changeReason: `TPM 일상점검 이상 발생 (${eqTitle})`,
      changeWorker: workerName || '',
      changeDate: normalizedDate,
      applyDate: normalizedDate,
      changeContentText: `${eqTitle} TPM 점검 결과: ${summaryText}`
    }
  );

  return { autoKey, updatedHistory };
}

/**
 * 2) 설비 수리 의뢰서 / 설비이력카드 수리 저장 시 현대차 변동점(`changePoints`) 자동 등록·갱신
 */
export async function syncEquipmentRepairToChangePoint(equipment, historyRow, rowIndex = 0) {
  if (!equipment?.id || !historyRow) return null;

  const rd = historyRow.repairDetails || {};
  const rawIssue = String(rd.requestContent || historyRow.issue || '').trim();
  const rawAction = String(rd.actionContent || historyRow.action || '').trim();
  if (!rawIssue && !rawAction) return null;

  const dateYmd = normalizeDateYmd(rd.requestDate || historyRow.date);
  const compactDate = dateYmd.replace(/-/g, '');

  // 같은 설비·같은 일자의 기존 TPM 자동 변동점이 있으면 해당 문서를 보강하여 중복 방지
  let autoKey = historyRow.autoSyncKey || '';
  if (!autoKey) {
    const candidateTpmKey = sanitizeDocKey(`tpm_${equipment.id}_${compactDate}`);
    const tpmDocSnap = await getDoc(doc(db, 'changePoints', `cp_auto_${candidateTpmKey}`));
    if (tpmDocSnap.exists()) {
      autoKey = `tpm_${equipment.id}_${compactDate}`;
    } else {
      const syncToken = historyRow.syncId || `${compactDate}_${rowIndex}`;
      autoKey = `eqrep_${equipment.id}_${syncToken}`;
    }
  }

  const meta = await resolveEquipmentMeta(equipment);
  const reqType = rd.requestType || '';
  const issueItem =
    reqType === '온조기' || rawIssue.includes('온조기') || rawIssue.includes('온도') || rawIssue.includes('압력')
      ? '설비 온도/압력 변경'
      : '설비 고장/수리';

  const eqTitle = `${rd.equipmentName || equipment.name || '설비'}(${rd.equipmentCode || equipment.code || equipment.id})`;
  const typeTag = reqType ? `[설비수리·${reqType}]` : '[설비수리]';
  const actionTime = rd.completionDate ? normalizeDateYmd(rd.completionDate) : dateYmd;
  const isVerified = Boolean(
    (rd.qualityPic && String(rd.qualityPic).trim()) ||
      (rd.verificationResult && String(rd.verificationResult).trim()) ||
      historyRow.confirmed
  );

  return upsertAutoChangePoint(
    autoKey,
    {
      date: dateYmd,
      type: '변동점',
      issueItem,
      carModel: meta.carModel,
      partName: meta.partName,
      details: `${typeTag} ${eqTitle} — ${rawIssue || '설비 수리 진행'}`,
      actionTime,
      actionPlan: rd.remarks || '설비 수리 및 정상 작동·초품 확인',
      actionResult: rawAction || rd.verificationResult || '수리의뢰서 접수',
      qualityCheck: isVerified,
      note: `자동연동(설비수리 · ${equipment.code || equipment.name || equipment.id})`,
      autoSourceType: 'equipment_repair'
    },
    {
      author: rd.pic || '',
      changeReason: `${typeTag} ${rawIssue}`,
      changeWorker: rd.pic || '',
      changeDate: dateYmd,
      applyDate: actionTime,
      changeContentText: [
        `대상 설비: ${eqTitle}`,
        rawIssue ? `문제 내용: ${rawIssue}` : '',
        rawAction ? `조치 내용: ${rawAction}` : '',
        rd.verificationResult ? `확인 결과: ${rd.verificationResult}` : ''
      ]
        .filter(Boolean)
        .join('\n'),
      beforeImage: rd.beforeImage || '',
      afterImage: rd.afterImage || '',
      qcPartner: rd.qualityPic || '',
      qcContent: rd.verificationResult || '',
      qcResult: isVerified ? '양호' : ''
    }
  );
}

/**
 * 3) 금형 수리 의뢰서 / 금형이력카드 수리 저장 시 현대차 4M·변동점(`changePoints`) 자동 등록·갱신
 */
export async function syncMoldRepairToChangePoint(mold, historyRow, rowIndex = 0) {
  if (!mold?.id || !historyRow) return null;

  const rd = historyRow.repairDetails || {};
  const rawIssue = String(rd.requestContent || historyRow.issue || '').trim();
  const rawAction = String(rd.actionContent || historyRow.action || '').trim();
  if (!rawIssue && !rawAction) return null;

  const dateYmd = normalizeDateYmd(rd.requestDate || historyRow.date);
  const compactDate = dateYmd.replace(/-/g, '');
  const syncToken = historyRow.syncId || `${compactDate}_${rowIndex}`;
  const autoKey = historyRow.autoSyncKey || `moldrep_${mold.id}_${syncToken}`;

  const reqType = rd.requestType || '';
  const isDesignChange =
    reqType === '설변' || rawIssue.includes('설변') || rawIssue.includes('설계변경');

  const cpType = isDesignChange ? '4M' : '변동점';
  const issueItem = isDesignChange ? '금형 설변/개선' : '금형 수리/보수';

  const { carModel, partName } = inferCarAndPart(
    `${mold.name || ''} ${mold.moldNumber || ''} ${mold.code || ''}`,
    mold.carModel || '',
    mold.partName || mold.name || ''
  );

  const moldCodeLabel = mold.code || mold.moldNumber || mold.id;
  const moldTitle = `${mold.name || mold.partName || '금형'}(${moldCodeLabel})`;
  const typeTag = reqType ? `[금형·${reqType}]` : '[금형수리]';
  const actionTime = rd.completionDate ? normalizeDateYmd(rd.completionDate) : dateYmd;
  const isVerified = Boolean(
    (rd.qualityPic && String(rd.qualityPic).trim()) ||
      (rd.verificationResult && String(rd.verificationResult).trim()) ||
      historyRow.confirmed
  );

  return upsertAutoChangePoint(
    autoKey,
    {
      date: dateYmd,
      type: cpType,
      issueItem,
      carModel,
      partName,
      details: `${typeTag} ${moldTitle} — ${rawIssue || '금형 수리/보수'}`,
      actionTime,
      actionPlan: rd.remarks || '금형 수리·습합 후 초품 치수 및 외관 검사',
      actionResult: rawAction || rd.verificationResult || '금형 수리의뢰 접수',
      qualityCheck: isVerified,
      note: `자동연동(금형수리 · ${moldCodeLabel})`,
      autoSourceType: 'mold_repair'
    },
    {
      partNo: mold.itemNo || '',
      author: rd.pic || '',
      changeReason: `${typeTag} ${rawIssue}`,
      changeWorker: rd.pic || '',
      changeDate: dateYmd,
      applyDate: actionTime,
      changeContentText: [
        `대상 금형: ${moldTitle}${mold.itemNo ? ` (품번: ${mold.itemNo})` : ''}`,
        rawIssue ? `문제 내용: ${rawIssue}` : '',
        rawAction ? `조치 내용: ${rawAction}` : '',
        rd.verificationResult ? `확인 결과: ${rd.verificationResult}` : ''
      ]
        .filter(Boolean)
        .join('\n'),
      beforeImage: rd.beforeImage || '',
      afterImage: rd.afterImage || '',
      qcPartner: rd.qualityPic || '',
      qcContent: rd.verificationResult || '',
      qcResult: isVerified ? '양호' : ''
    }
  );
}

/**
 * 비가동 사유가 설비 문제인지 금형 문제인지 판별한다.
 * (소재 불량 / 소재 없음 등 자재 사유는 수리·변동점 대상에서 제외)
 */
export function classifyDowntimeIssueKind(reason = '') {
  const r = String(reason || '').trim();
  if (!r) return null;

  // 자재 사유 명확 제외
  if (r.includes('소재') || r.includes('재료') || r.includes('원자재') || r.includes('자재')) {
    return null;
  }

  if (
    r.includes('금형') ||
    r.includes('몰드') ||
    r.includes('습합') ||
    r.includes('코어') ||
    r.includes('캐비티')
  ) {
    return 'mold';
  }

  if (
    r.includes('설비') ||
    r.includes('기계') ||
    r.includes('고장') ||
    r.includes('온조기') ||
    r.includes('유압') ||
    r.includes('누유') ||
    r.includes('센서') ||
    r.includes('히터') ||
    r.includes('프레스') ||
    r.includes('로봇') ||
    r.includes('컷팅') ||
    r.includes('펀칭') ||
    r.includes('클립')
  ) {
    return 'equipment';
  }

  return null;
}

function extractUnitIndexFromLabel(equipLabel = '') {
  const s = String(equipLabel || '').trim();
  if (!s) return 0;

  // DT/DS CREW 6대 셋트 표준 위치 매핑
  const posOrder = ['LH R', 'LH S', 'LH T', 'RH R', 'RH S', 'RH T'];
  const posIdx = posOrder.findIndex((p) => s.toUpperCase().startsWith(p));
  if (posIdx >= 0) return posIdx;

  // 숫자 호기 추출 (예: '2호', '펀칭기2호', 'RR LH 2호기')
  const numMatch = s.match(/(\d+)\s*호/);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    if (n >= 1) return n - 1;
  }
  return 0;
}

function matchEquipmentForReportDowntime(reportData, slot, allEquipments, allSets) {
  if (!Array.isArray(allEquipments) || allEquipments.length === 0) return null;
  // 계측기(measuring)는 작업일보 공정 비가동 설비 매칭 대상에서 제외 (조인트·가공 설비만 대상)
  const prodEquipments = allEquipments.filter((eq) => eq?.category !== 'measuring');
  if (prodEquipments.length === 0) return null;
  const prodSets = Array.isArray(allSets)
    ? allSets.filter((s) => s?.category !== 'measuring')
    : [];

  const equipLabel = String(slot.equip || '').trim();
  const normLabel = equipLabel.replace(/\s+/g, '').toUpperCase();

  // 1. 관리번호 또는 설비명 직접 일치
  if (normLabel) {
    const direct = prodEquipments.find((eq) => {
      const c = String(eq.code || '').replace(/\s+/g, '').toUpperCase();
      const n = String(eq.name || '').replace(/\s+/g, '').toUpperCase();
      return (c && c === normLabel) || (n && n === normLabel);
    });
    if (direct) return direct;
  }

  const unitIdx = extractUnitIndexFromLabel(equipLabel);

  // 2. 작업일보에 연결된 가동 전 QR TPM 셋트(`tpmCheckSummary`)에서 매칭
  const tpmSummary = reportData.tpmCheckSummary;
  if (tpmSummary?.equipmentCodes?.length > 0) {
    const codes = tpmSummary.equipmentCodes;
    const pickedCode = codes[Math.min(unitIdx, codes.length - 1)];
    const byCode = prodEquipments.find((eq) => String(eq.code || '').trim() === String(pickedCode || '').trim());
    if (byCode) return byCode;
  }
  if (tpmSummary?.setId && prodSets.length > 0) {
    const hitSet = prodSets.find((s) => s.id === tpmSummary.setId);
    if (hitSet?.equipmentIds?.length > 0) {
      const pickedId = hitSet.equipmentIds[Math.min(unitIdx, hitSet.equipmentIds.length - 1)];
      const byId = prodEquipments.find((eq) => eq.id === pickedId);
      if (byId) return byId;
    }
  }

  // 3. 차종·부품명으로 `equipment_sets` 셋트 매칭
  if (prodSets.length > 0 && reportData.carModel) {
    const carUpper = String(reportData.carModel || '').toUpperCase();
    const itemUpper = String(reportData.itemName || '').toUpperCase();
    const candidateSets = prodSets.filter((s) => {
      const sn = String(s.name || '').toUpperCase();
      if (sn.includes(carUpper)) return true;
      if (carUpper === 'NE1A' && sn.includes('NE1')) return true;
      if (carUpper === 'KM/KX' && (sn.includes('KMKX') || sn.includes('KM/KX'))) return true;
      return false;
    });

    if (candidateSets.length > 0) {
      const bestSet =
        candidateSets.find((s) => {
          const sn = String(s.name || '').toUpperCase();
          if (equipLabel.toUpperCase().includes('LH') && sn.includes('LH')) return true;
          if (equipLabel.toUpperCase().includes('RH') && sn.includes('RH')) return true;
          if (itemUpper && sn.includes(itemUpper)) return true;
          return false;
        }) || candidateSets[0];

      if (Array.isArray(bestSet.equipmentIds) && bestSet.equipmentIds.length > 0) {
        const pickedId = bestSet.equipmentIds[Math.min(unitIdx, bestSet.equipmentIds.length - 1)];
        const byId = prodEquipments.find((eq) => eq.id === pickedId);
        if (byId) return byId;
      }
      if (Array.isArray(bestSet.equipments) && bestSet.equipments.length > 0) {
        const picked = bestSet.equipments[Math.min(unitIdx, bestSet.equipments.length - 1)];
        const bySetEq = prodEquipments.find(
          (eq) => eq.id === picked?.id || (picked?.code && eq.code === picked.code)
        );
        if (bySetEq) return bySetEq;
      }
    }
  }

  // 4. 호기 키워드 (단컷팅, 정치절단, 펀칭기, 클립머신, 로봇본딩기 등) 기반 설비명 부분 일치
  if (equipLabel) {
    const keywords = ['로봇본딩', '글라스본딩', '정치절단', '단컷팅', '절단', '펀칭', '클립'];
    const kw = keywords.find((k) => equipLabel.replace(/\s+/g, '').includes(k));
    if (kw) {
      const candidates = prodEquipments.filter((eq) =>
        `${eq.name || ''} ${eq.type || ''} ${eq.spec || ''}`.replace(/\s+/g, '').includes(kw)
      );
      if (candidates.length > 0) {
        return candidates[Math.min(unitIdx, candidates.length - 1)];
      }
    }
  }

  return null;
}

function matchMoldForReportDowntime(reportData, slot, allMolds) {
  if (!Array.isArray(allMolds) || allMolds.length === 0) return null;

  const moldByCode = new Map();
  const moldById = new Map();
  allMolds.forEach((m) => {
    moldById.set(m.id, m);
    if (m.code) moldByCode.set(String(m.code).trim(), m);
    if (m.moldNumber) moldByCode.set(String(m.moldNumber).trim(), m);
  });

  // 1. 작업일보 `vulcTable` / `vulcTable2` 에 입력된 실제 가동 금형 우선 매칭
  //    (호기 번호는 금형 간 중복되므로 일보 저장 시 함께 기록한 금형 고유 ID(moldRefs)를 우선 사용)
  const moldRefs = reportData.moldRefs || {};
  const vTables = [
    [reportData.vulcTable || {}, 'vulc'],
    [reportData.vulcTable2 || {}, 'vulc2']
  ];
  const activeMoldEntries = [];
  vTables.forEach(([vt, prefix]) => {
    Object.entries(vt).forEach(([k, val]) => {
      if (k.startsWith('mold_') && val && String(val).trim()) {
        const refId = moldRefs[`${prefix}_mold_${k.slice(5)}`];
        activeMoldEntries.push({
          key: k.slice(5),
          code: String(val).trim(),
          mold: (refId && moldById.get(refId)) || null
        });
      }
    });
  });

  const equipUpper = String(slot.equip || '').toUpperCase();
  if (activeMoldEntries.length > 0) {
    if (equipUpper) {
      const suffixMatch = activeMoldEntries.find((entry) => {
        const keyUp = entry.key.toUpperCase();
        if (equipUpper.includes('LH') && !keyUp.includes('LH')) return false;
        if (equipUpper.includes('RH') && !keyUp.includes('RH')) return false;
        return true;
      });
      if (suffixMatch) {
        if (suffixMatch.mold) return suffixMatch.mold;
        if (moldByCode.has(suffixMatch.code)) return moldByCode.get(suffixMatch.code);
      }
    }
    for (const entry of activeMoldEntries) {
      if (entry.mold) return entry.mold;
      if (moldByCode.has(entry.code)) return moldByCode.get(entry.code);
    }
  }

  // 2. 차종 + 품명 + 호기 위치 기반 마스터 금형 매칭
  const carCode = String(reportData.carModel || '').trim();
  const itemName = String(reportData.itemName || '').trim();
  const carCandidates = allMolds.filter((m) => {
    if (!carCode) return false;
    return String(m.carModel || '').trim().toUpperCase() === carCode.toUpperCase();
  });

  if (carCandidates.length === 0) return null;

  const partCandidates = itemName
    ? carCandidates.filter((m) => {
        const mp = String(m.partName || m.name || '').toUpperCase();
        const ip = itemName.toUpperCase();
        return mp.includes(ip) || ip.includes(mp);
      })
    : carCandidates;

  const pool = partCandidates.length > 0 ? partCandidates : carCandidates;

  if (equipUpper) {
    const dirMatch = pool.find((m) => {
      const mn = `${m.name || ''} ${m.moldNumber || ''} ${m.moldType || ''}`.toUpperCase();
      if (equipUpper.includes('LH') && mn.includes('LH')) return true;
      if (equipUpper.includes('RH') && mn.includes('RH')) return true;
      return false;
    });
    if (dirMatch) return dirMatch;
  }

  const unitIdx = extractUnitIndexFromLabel(slot.equip);
  return pool[Math.min(unitIdx, pool.length - 1)] || pool[0];
}

export function extractDowntimeSlots(reportData) {
  if (!reportData) return [];
  const hasExplicitSlots =
    reportData.downtimeMinutes1 !== undefined ||
    reportData.downtimeMinutes2 !== undefined ||
    reportData.downtimeMinutes3 !== undefined;

  return [
    {
      slotNum: 1,
      minutes: Number(hasExplicitSlots ? reportData.downtimeMinutes1 : reportData.downtimeMinutes) || 0,
      equip: String(reportData.downtimeEquip1 || '').trim(),
      reason: String((hasExplicitSlots ? reportData.downtimeReason1 : reportData.downtimeReason) ?? reportData.downtimeReason ?? '').trim()
    },
    {
      slotNum: 2,
      minutes: Number(reportData.downtimeMinutes2) || 0,
      equip: String(reportData.downtimeEquip2 || '').trim(),
      reason: String(reportData.downtimeReason2 || '').trim()
    },
    {
      slotNum: 3,
      minutes: Number(reportData.downtimeMinutes3) || 0,
      equip: String(reportData.downtimeEquip3 || '').trim(),
      reason: String(reportData.downtimeReason3 || '').trim()
    }
  ];
}

async function cleanupStaleAutoChangePointIfUnconfirmed(autoKey) {
  const safeKey = sanitizeDocKey(autoKey);
  if (!safeKey) return;
  const docRef = doc(db, 'changePoints', `cp_auto_${safeKey}`);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;
  const data = snap.data() || {};
  if (data.qualityCheck || data.ceoCheck || data.qPointInstall) return;
  await deleteDoc(docRef);
  invalidateChangePointsCache();
}

/**
 * 4) 작업일보(`reports`) 저장/수정 시 비가동 시간이 발생했고 사유가 설비 또는 금형 문제인 경우:
 *    - 설비 수리(`equipments.history`) 또는 금형 수리(`molds.history`) 자동 등록(Upsert)
 *    - 현대차 변동점(`changePoints`) 동일하게 자동 등록(Upsert)
 */
export async function syncReportDowntimeToRepairAndChangePoint(reportData, existingReport = null) {
  if (!reportData || !reportData.id) return;
  if (reportData.status === '임시저장') return;
  if (reportData.isLeaderForm || reportData.isForkliftForm || reportData.isSupportForm) return;

  const slots = extractDowntimeSlots(reportData);
  const prevSlots = existingReport ? extractDowntimeSlots(existingReport) : [];

  const activeSlots = slots
    .map((s) => ({ ...s, kind: s.minutes > 0 ? classifyDowntimeIssueKind(s.reason) : null }))
    .filter((s) => s.kind !== null);

  const hadPrevAutoSlots = prevSlots.some(
    (s) => s.minutes > 0 && classifyDowntimeIssueKind(s.reason) !== null
  );

  if (activeSlots.length === 0 && !hadPrevAutoSlots) {
    return;
  }

  // 비가동이 해제된 슬롯의 미검증 자동 변동점 정리
  for (const s of slots) {
    const kind = s.minutes > 0 ? classifyDowntimeIssueKind(s.reason) : null;
    if (!kind && hadPrevAutoSlots) {
      const prevSlot = prevSlots.find((p) => p.slotNum === s.slotNum);
      if (prevSlot && prevSlot.minutes > 0 && classifyDowntimeIssueKind(prevSlot.reason)) {
        await cleanupStaleAutoChangePointIfUnconfirmed(`report_dt_${reportData.id}_s${s.slotNum}`);
      }
    }
  }

  if (activeSlots.length === 0) return;

  const needEquip = activeSlots.some((s) => s.kind === 'equipment');
  const needMold = activeSlots.some((s) => s.kind === 'mold');

  const [allEquipments, allSets, allMolds] = await Promise.all([
    needEquip ? fetchEquipments() : Promise.resolve([]),
    needEquip ? fetchEquipmentSetsCached() : Promise.resolve([]),
    needMold ? fetchMolds() : Promise.resolve([])
  ]);

  // 동일 설비/금형에 여러 슬롯이 매핑될 때 덮어쓰기 방지를 위해 최신 history 맵 유지
  const dirtyEquipments = new Map();
  const dirtyMolds = new Map();

  const dateYmd = normalizeDateYmd(reportData.date);
  const workerName = reportData.workerName || '';
  const notesSuffix = reportData.notes ? ` (특이사항: ${String(reportData.notes).trim()})` : '';
  const { carModel, partName } = inferCarAndPart(
    `${reportData.carModel || ''} ${reportData.itemName || ''}`,
    reportData.carModel || '',
    reportData.itemName || ''
  );

  for (const slot of activeSlots) {
    const autoKey = `report_dt_${reportData.id}_s${slot.slotNum}`;
    const equipPrefix = slot.equip ? `[${slot.equip}] ` : '';
    const issueHeadline = `[작업일보 ${slot.slotNum}차 비가동 ${slot.minutes}분] ${equipPrefix}${slot.reason}${notesSuffix}`;

    if (slot.kind === 'equipment') {
      const targetEq = matchEquipmentForReportDowntime(reportData, slot, allEquipments, allSets);
      let eqDesc = slot.equip || `${reportData.processName || '공정'} 설비`;

      if (targetEq) {
        eqDesc = `${targetEq.name || '설비'}(${targetEq.code || targetEq.id})${slot.equip ? ` · ${slot.equip}` : ''}`;
        const currentEq = dirtyEquipments.get(targetEq.id) || targetEq;
        const nextHistory = Array.isArray(currentEq.history) ? [...currentEq.history] : [];
        const existingIdx = nextHistory.findIndex((h) => h?.autoSyncKey === autoKey);

        const reqType = slot.reason.includes('온조기') ? '온조기' : '작동이상';
        const baseRepairDetails = {
          equipmentName: targetEq.name || '',
          equipmentCode: targetEq.code || '',
          department: '㈜조영산업',
          requestDate: dateYmd,
          requestType: reqType,
          pic: workerName,
          completionDate: '',
          remarks: `작업일보 #${reportData.id} 자동연동 (${carModel} ${partName} / ${reportData.processName || ''})`,
          requestContent: issueHeadline,
          actionContent: '',
          verificationResult: '',
          qualityPic: ''
        };

        if (existingIdx >= 0) {
          const prevRow = nextHistory[existingIdx];
          nextHistory[existingIdx] = {
            ...prevRow,
            date: dateYmd,
            issue: issueHeadline,
            repairDetails: {
              ...baseRepairDetails,
              ...(prevRow.repairDetails || {}),
              requestDate: dateYmd,
              requestContent: issueHeadline
            }
          };
        } else {
          nextHistory.push({
            syncId: autoKey,
            autoSyncKey: autoKey,
            date: dateYmd,
            issue: issueHeadline,
            action: '작업일보 비가동 자동접수 (원인점검 및 수리요망)',
            attachment: '수리의뢰서',
            confirmed: false,
            repairDetails: baseRepairDetails
          });
        }

        dirtyEquipments.set(targetEq.id, { ...currentEq, history: nextHistory });
      }

      await upsertAutoChangePoint(
        autoKey,
        {
          date: dateYmd,
          type: '변동점',
          issueItem: '설비 고장/수리',
          carModel,
          partName,
          details: `[작업일보 비가동 ${slot.minutes}분] ${eqDesc} — ${slot.reason}${notesSuffix}`,
          actionTime: dateYmd,
          actionPlan: '비가동 원인 설비 점검·수리 후 초품 품질 확인',
          actionResult: targetEq
            ? `설비 수리의뢰 자동등록 (${targetEq.code || targetEq.name})`
            : '설비 비가동 접수 (현장 수리 확인 요망)',
          qualityCheck: false,
          note: `자동연동(작업일보 #${reportData.id} · 설비비가동)`,
          autoSourceType: 'report_downtime_equipment'
        },
        {
          author: workerName,
          changeReason: `작업일보 설비 비가동 ${slot.minutes}분 발생 (${slot.reason})`,
          changeWorker: workerName,
          changeDate: dateYmd,
          applyDate: dateYmd,
          changeContentText: `공정: ${reportData.processName || '-'}\n대상 설비: ${eqDesc}\n내용: ${issueHeadline}`
        }
      );
    } else if (slot.kind === 'mold') {
      const targetMold = matchMoldForReportDowntime(reportData, slot, allMolds);
      let moldDesc = slot.equip ? `${slot.equip} 금형` : `${partName || carModel || '공정'} 금형`;

      if (targetMold) {
        const mCode = targetMold.code || targetMold.moldNumber || targetMold.id;
        moldDesc = `${targetMold.name || targetMold.partName || '금형'}(${mCode})${slot.equip ? ` · ${slot.equip}` : ''}`;
        const currentMold = dirtyMolds.get(targetMold.id) || targetMold;
        const nextHistory = Array.isArray(currentMold.history) ? [...currentMold.history] : [];
        const existingIdx = nextHistory.findIndex((h) => h?.autoSyncKey === autoKey);

        const baseRepairDetails = {
          department: '생산팀',
          requestDate: dateYmd,
          requestType: '수리',
          pic: workerName,
          completionDate: '',
          remarks: `작업일보 #${reportData.id} 자동연동 (${carModel} ${partName} / ${reportData.processName || ''})`,
          requestContent: issueHeadline,
          actionContent: '',
          verificationResult: '',
          qualityPic: ''
        };

        if (existingIdx >= 0) {
          const prevRow = nextHistory[existingIdx];
          nextHistory[existingIdx] = {
            ...prevRow,
            date: dateYmd,
            issue: issueHeadline,
            repairDetails: {
              ...baseRepairDetails,
              ...(prevRow.repairDetails || {}),
              requestDate: dateYmd,
              requestContent: issueHeadline
            }
          };
        } else {
          nextHistory.push({
            syncId: autoKey,
            autoSyncKey: autoKey,
            date: dateYmd,
            issue: issueHeadline,
            action: '작업일보 비가동 자동접수 (금형 점검 및 수리요망)',
            attachment: '수리의뢰서',
            confirmed: false,
            repairDetails: baseRepairDetails
          });
        }

        dirtyMolds.set(targetMold.id, { ...currentMold, history: nextHistory });
      }

      await upsertAutoChangePoint(
        autoKey,
        {
          date: dateYmd,
          type: '변동점',
          issueItem: '금형 수리/보수',
          carModel: targetMold?.carModel || carModel,
          partName: targetMold?.partName || partName,
          details: `[작업일보 비가동 ${slot.minutes}분] ${moldDesc} — ${slot.reason}${notesSuffix}`,
          actionTime: dateYmd,
          actionPlan: '금형 점검·수리/습합 후 초품 치수·외관 검사',
          actionResult: targetMold
            ? `금형 수리의뢰 자동등록 (${targetMold.code || targetMold.moldNumber || targetMold.name})`
            : '금형 비가동 접수 (금형 수리 확인 요망)',
          qualityCheck: false,
          note: `자동연동(작업일보 #${reportData.id} · 금형비가동)`,
          autoSourceType: 'report_downtime_mold'
        },
        {
          partNo: targetMold?.itemNo || '',
          author: workerName,
          changeReason: `작업일보 금형 비가동 ${slot.minutes}분 발생 (${slot.reason})`,
          changeWorker: workerName,
          changeDate: dateYmd,
          applyDate: dateYmd,
          changeContentText: `공정: ${reportData.processName || '-'}\n대상 금형: ${moldDesc}\n내용: ${issueHeadline}`
        }
      );
    }
  }

  if (dirtyEquipments.size > 0) {
    await Promise.all(
      Array.from(dirtyEquipments.values()).map((eq) =>
        writeAutoHistoryRowsMerged('equipments', eq.id, eq.history, `report_dt_${reportData.id}_`)
      )
    );
    invalidateEquipmentsCache();
  }

  if (dirtyMolds.size > 0) {
    await Promise.all(
      Array.from(dirtyMolds.values()).map((m) =>
        writeAutoHistoryRowsMerged('molds', m.id, m.history, `report_dt_${reportData.id}_`)
      )
    );
    invalidateMoldsCache();
  }
}

/**
 * 캐시된 설비/금형 이력(history)으로 문서 전체를 덮어쓰면 그 사이 다른 사용자가 추가한 수리 이력이 사라질 수 있어,
 * 저장 직전에 최신 문서를 다시 읽어 이번 작업일보가 만든 자동 행(autoSyncKey 접두사 일치)만 병합한다.
 */
async function writeAutoHistoryRowsMerged(collectionName, docId, cachedHistory, autoKeyPrefix) {
  const ref = doc(db, collectionName, docId);
  const snap = await getDoc(ref);
  const freshHistory =
    snap.exists() && Array.isArray(snap.data().history) ? [...snap.data().history] : [];

  (cachedHistory || [])
    .filter((row) => row?.autoSyncKey && String(row.autoSyncKey).startsWith(autoKeyPrefix))
    .forEach((row) => {
      const idx = freshHistory.findIndex((h) => h?.autoSyncKey === row.autoSyncKey);
      if (idx >= 0) {
        const freshRow = freshHistory[idx];
        freshHistory[idx] = {
          ...freshRow,
          date: row.date,
          issue: row.issue,
          repairDetails: {
            ...(freshRow.repairDetails || {}),
            requestDate: row.repairDetails?.requestDate,
            requestContent: row.repairDetails?.requestContent
          }
        };
      } else {
        freshHistory.push(row);
      }
    });

  await updateDoc(ref, { history: freshHistory });
}
