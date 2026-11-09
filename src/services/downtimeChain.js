/**
 * 비가동 → 수리 의뢰 → 변동점 연계 현황 조립 (순수 함수 · 화면/DB 의존 없음)
 *
 * 연결 키: 작업일보 비가동 자동연동이 만드는 키 `report_dt_{일보ID}_s{슬롯}` 하나로
 *   - 설비/금형 이력(`history[].autoSyncKey`)
 *   - 변동점(`changePoints[].autoSourceKey` 또는 문서 ID `cp_auto_{키}`)
 * 을 서로 연결한다. (changePointAutoSync.js 의 upsert 규칙과 동일)
 */
import {
  classifyDowntimeIssueKind,
  extractDowntimeSlots,
  sanitizeDocKey,
  normalizeDateYmd
} from './changePointAutoSync';

export const REPAIR_STATE_LABEL = {
  done: '완료',
  working: '조치중',
  received: '접수(대기)',
  none: '미등록'
};

export const CP_STATE_LABEL = {
  done: '품질확인 완료',
  pending: '품질확인 대기',
  none: '미등록'
};

export function isCheckTruthy(val) {
  if (val === true) return true;
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  if (s === '' || s === 'x' || s === '-' || s === '미완료' || s === 'no' || s === 'false') return false;
  return true;
}

export function getRepairState(row) {
  if (!row) return 'none';
  if (row.confirmed) return 'done';
  const rd = row.repairDetails || {};
  if (String(rd.actionContent || '').trim() || String(rd.completionDate || '').trim()) return 'working';
  return 'received';
}

export function getChangePointState(cp) {
  if (!cp) return 'none';
  return isCheckTruthy(cp.qualityCheck) ? 'done' : 'pending';
}

export function getChangePointApprovalDetail(cp) {
  if (!cp) {
    return { qcDone: false, ceoDone: false, qPointDone: false, allApproved: false };
  }
  const qcDone = isCheckTruthy(cp.qualityCheck);
  const ceoDone = isCheckTruthy(cp.ceoCheck);
  const qPointDone = Boolean(isCheckTruthy(cp.qPointInstall) || cp.qPointData);
  return {
    qcDone,
    ceoDone,
    qPointDone,
    allApproved: qcDone && ceoDone
  };
}

export const ORIGIN_LABEL = {
  report: '비가동 일보',
  tpm: 'TPM 점검 이상',
  direct: '수리 의뢰 직접 등록',
  auto_cp: '자동연동 변동점',
  manual_cp: '수동 등록(설비·금형)'
};

function buildChangePointIndex(changePoints) {
  const cpIndex = new Map();
  changePoints.forEach((cp) => {
    if (cp?.autoSourceKey) cpIndex.set(String(cp.autoSourceKey), cp);
    else if (cp?.id && String(cp.id).startsWith('cp_auto_')) cpIndex.set(String(cp.id).slice(8), cp);
  });
  return cpIndex;
}

/**
 * @returns {Array} 최신 일보 순의 연계 목록
 *  { key, origin:'report', report, slot, kind('equipment'|'mold'), repair|null, cp|null, repairState, cpState, overall('done'|'progress'|'unregistered') }
 */
export function buildDowntimeChains({ reports = [], equipments = [], molds = [], changePoints = [] }) {
  const repairIndex = new Map();
  equipments.forEach((eq) => {
    (eq.history || []).forEach((row, idx) => {
      if (row?.autoSyncKey && String(row.autoSyncKey).startsWith('report_dt_')) {
        repairIndex.set(row.autoSyncKey, { kind: 'equipment', owner: eq, row, idx });
      }
    });
  });
  molds.forEach((m) => {
    (m.history || []).forEach((row, idx) => {
      if (row?.autoSyncKey && String(row.autoSyncKey).startsWith('report_dt_')) {
        repairIndex.set(row.autoSyncKey, { kind: 'mold', owner: m, row, idx });
      }
    });
  });

  const cpIndex = buildChangePointIndex(changePoints);

  const chains = [];
  reports.forEach((report) => {
    if (!report || report.status === '임시저장') return;
    if (report.isLeaderForm || report.isForkliftForm || report.isSupportForm) return;

    extractDowntimeSlots(report).forEach((slot) => {
      if (!(slot.minutes > 0)) return;
      const kind = classifyDowntimeIssueKind(slot.reason);
      if (!kind) return; // 소재 사유 등은 수리/변동점 자동등록 대상이 아님

      const autoKey = `report_dt_${report.id}_s${slot.slotNum}`;
      const repair = repairIndex.get(autoKey) || null;
      const cp = cpIndex.get(sanitizeDocKey(autoKey)) || null;
      const repairState = getRepairState(repair?.row);
      const cpState = getChangePointState(cp);

      let overall = 'progress';
      if (repairState === 'none' && cpState === 'none') overall = 'unregistered';
      else if ((repairState === 'done' || repairState === 'none') && (cpState === 'done' || cpState === 'none')) overall = 'done';

      chains.push({
        key: autoKey,
        origin: 'report',
        date: report.date || '',
        report,
        slot,
        kind,
        repair,
        cp,
        repairState,
        cpState,
        overall
      });
    });
  });

  chains.sort((a, b) =>
    (b.report.date || '').localeCompare(a.report.date || '') ||
    (b.report.id || '').localeCompare(a.report.id || '') ||
    a.slot.slotNum - b.slot.slotNum
  );
  return chains;
}

/**
 * 작업일보(비가동) 없이 "수리 의뢰"에서 시작되는 연계 목록
 *  - TPM 점검 이상(X/△) 자동 접수 건, 설비/금형 수리 의뢰서·이력카드에 직접 등록한 건
 *  - 변동점은 changePointAutoSync.js 가 수리 저장 시 자동 등록하는 키 규칙(eqrep_ / moldrep_ / tpm_)으로 연결
 * 비가동 일보 연동 행(autoSyncKey 가 report_dt_ 로 시작)은 buildDowntimeChains 쪽에서 처리하므로 제외한다.
 */
export function buildRepairOriginChains({ equipments = [], molds = [], changePoints = [], sinceDate = '' }) {
  const cpIndex = buildChangePointIndex(changePoints);
  const chains = [];

  const collect = (kind, owners) => {
    owners.forEach((owner) => {
      (owner.history || []).forEach((row, idx) => {
        if (!row) return;
        const autoKeyRaw = String(row.autoSyncKey || '');
        if (autoKeyRaw.startsWith('report_dt_')) return;

        const rd = row.repairDetails || {};
        const dateYmd = normalizeDateYmd(rd.requestDate || row.date);
        const compact = dateYmd.replace(/-/g, '');
        const token = row.syncId || `${compact}_${idx}`;

        // 이 행이 변동점으로 자동 등록될 때 사용되는 후보 키 (changePointAutoSync 규칙과 동일)
        const candidateKeys = [];
        if (autoKeyRaw) candidateKeys.push(autoKeyRaw);
        if (kind === 'equipment') {
          candidateKeys.push(`eqrep_${owner.id}_${token}`, `tpm_${owner.id}_${compact}`);
        } else {
          candidateKeys.push(`moldrep_${owner.id}_${token}`);
        }
        let cp = null;
        for (const k of candidateKeys) {
          const hit = cpIndex.get(sanitizeDocKey(k));
          if (hit) { cp = hit; break; }
        }

        const isRepairRequest = String(row.attachment || '').includes('수리의뢰');
        if (!isRepairRequest && !cp) return; // 수리 의뢰도 아니고 변동점 연동도 없는 일반 이력 행은 제외
        if (sinceDate && (row.date || dateYmd) < sinceDate) return;

        const origin = autoKeyRaw.startsWith('tpm_') || (cp && String(cp.autoSourceKey || '').startsWith('tpm_'))
          ? 'tpm'
          : 'direct';
        const repairState = getRepairState(row);
        const cpState = getChangePointState(cp);
        const overall =
          repairState === 'done' && (cpState === 'done' || cpState === 'none') ? 'done' : 'progress';

        chains.push({
          key: `${kind}_${owner.id}_${token}`,
          origin,
          date: row.date || dateYmd,
          report: null,
          slot: null,
          kind,
          repair: { kind, owner, row, idx },
          cp,
          repairState,
          cpState,
          overall
        });
      });
    });
  };

  collect('equipment', equipments);
  collect('mold', molds);

  chains.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return chains;
}

/** 대시보드 표시용: 비가동 일보 기반 + 수리 의뢰 기반 연계 목록을 하나로 합친다 */
export function buildLinkedChains({ reports = [], equipments = [], molds = [], changePoints = [], sinceDate = '' }) {
  return [
    ...buildDowntimeChains({ reports, equipments, molds, changePoints }),
    ...buildRepairOriginChains({ equipments, molds, changePoints, sinceDate })
  ];
}

function isEquipOrMoldManualCp(cp) {
  const item = String(cp?.issueItem || '');
  return /설비|TPM|금형|지그|툴\(공구\)/.test(item);
}

function resolveFallbackAssetForCp(cp, equipments = [], molds = []) {
  const autoKey = String(cp?.autoSourceKey || (String(cp?.id || '').startsWith('cp_auto_') ? cp.id.slice(8) : '') || '');
  const searchText = `${cp?.details || ''} ${cp?.note || ''}`;
  const isMold =
    autoKey.startsWith('moldrep_') ||
    String(cp?.autoSourceType || '').includes('mold') ||
    /금형|지그/.test(String(cp?.issueItem || '')) ||
    (!/설비|TPM/.test(String(cp?.issueItem || '')) && /금형/.test(searchText));

  if (isMold) {
    let matchedMold = null;
    if (autoKey.startsWith('moldrep_')) {
      matchedMold = molds.find((m) => autoKey.startsWith(`moldrep_${sanitizeDocKey(m.id)}_`));
    }
    if (!matchedMold && searchText.trim()) {
      matchedMold = molds.find((m) => {
        const code = String(m.code || m.moldNumber || '').trim();
        return code.length >= 2 && searchText.includes(code);
      });
    }
    return { kind: 'mold', owner: matchedMold || null };
  }

  let matchedEq = null;
  if (autoKey.startsWith('tpm_') || autoKey.startsWith('eqrep_')) {
    matchedEq = equipments.find(
      (eq) =>
        autoKey.startsWith(`tpm_${sanitizeDocKey(eq.id)}_`) ||
        autoKey.startsWith(`eqrep_${sanitizeDocKey(eq.id)}_`)
    );
  }
  if (!matchedEq && searchText.trim()) {
    matchedEq = equipments.find((eq) => {
      const code = String(eq.code || '').trim();
      return code.length >= 2 && searchText.includes(code);
    });
  }
  return { kind: 'equipment', owner: matchedEq || null };
}

/**
 * 변동점 관리 > 🔗 설비·금형 연계 현황 전체 추적 보드용 통합 빌더
 * - 비가동 일보 + 설비/금형 수리의뢰 + 미매칭 자동연동 변동점 + (선택 시) 수동 설비·금형 변동점을 모두 통합
 * - 품질검증(qualityCheck)과 대표이사 승인(ceoCheck) 2단계 마감 상태를 모두 판별한다.
 */
export function buildFullLinkedIssueBoard({
  reports = [],
  equipments = [],
  molds = [],
  changePoints = [],
  includeManualEquipMold = false
}) {
  const baseChains = buildLinkedChains({
    reports,
    equipments,
    molds,
    changePoints,
    sinceDate: ''
  });

  const matchedCpIds = new Set();
  baseChains.forEach((c) => {
    if (c.cp?.id) matchedCpIds.add(c.cp.id);
  });

  const extraChains = [];
  let manualAvailableCount = 0;

  changePoints.forEach((cp) => {
    if (!cp?.id || matchedCpIds.has(cp.id)) return;
    const isAuto = Boolean(cp.autoSourceKey || cp.autoSourceType || String(cp.id).startsWith('cp_auto_'));
    const isManualTarget = !isAuto && isEquipOrMoldManualCp(cp);
    if (isManualTarget) manualAvailableCount += 1;

    if (!isAuto && !(includeManualEquipMold && isManualTarget)) return;

    const autoKey = String(cp.autoSourceKey || (String(cp.id).startsWith('cp_auto_') ? cp.id.slice(8) : cp.id));
    const { kind, owner } = resolveFallbackAssetForCp(cp, equipments, molds);

    let origin = isAuto ? 'auto_cp' : 'manual_cp';
    if (autoKey.startsWith('tpm_') || cp.autoSourceType === 'tpm') origin = 'tpm';
    else if (autoKey.startsWith('report_dt_') || String(cp.autoSourceType || '').startsWith('report_downtime')) origin = 'report';
    else if (autoKey.startsWith('eqrep_') || autoKey.startsWith('moldrep_')) origin = 'direct';

    const cpState = getChangePointState(cp);
    extraChains.push({
      key: `cp_only_${cp.id}`,
      origin,
      date: cp.date || '',
      report: null,
      slot: null,
      kind,
      repair: owner ? { kind, owner, row: null, idx: -1 } : null,
      cp,
      repairState: 'none',
      cpState,
      overall: cpState === 'done' ? 'done' : 'progress'
    });
  });

  const merged = [...baseChains, ...extraChains].map((c) => {
    const approval = getChangePointApprovalDetail(c.cp);
    // 실제 수리 이력 행(row)이 있을 때만 수리 대기/조치중을 판별
    const hasRepairRow = Boolean(c.repair?.row);
    const repairDoneOrSkipped = !hasRepairRow || c.repairState === 'done';

    let stageStatus = 'completed';
    if (!hasRepairRow && !c.cp) {
      stageStatus = 'unregistered';
    } else if (hasRepairRow && c.repairState !== 'done') {
      stageStatus = 'awaiting_repair';
    } else if (c.cp && !approval.allApproved) {
      stageStatus = 'awaiting_approval';
    } else if (repairDoneOrSkipped && (!c.cp || approval.allApproved)) {
      stageStatus = 'completed';
    }

    return {
      ...c,
      hasRepairRow,
      qcDone: approval.qcDone,
      ceoDone: approval.ceoDone,
      qPointDone: approval.qPointDone,
      allApproved: approval.allApproved,
      stageStatus
    };
  });

  merged.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return { items: merged, manualAvailableCount };
}

/**
 * 데이터 관리 표(`ChangePointManagement`)의 각 행 ID(`cp.id`)에서 연결된 일보/설비/금형 객체 빠른 조회 맵 생성
 */
export function buildChangePointLinkLookup(boardItems = []) {
  const map = new Map();
  boardItems.forEach((item) => {
    if (item.cp?.id && !map.has(item.cp.id)) {
      map.set(item.cp.id, item);
    }
  });
  return map;
}
