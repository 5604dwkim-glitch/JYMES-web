/**
 * 변동점(`changePoints`) 선택 삭제 + 연동 데이터 정리 서비스
 *
 * 변동점을 삭제할 때 아래 연동 내용을 함께 정리한다. (기존 changePointAutoSync.js 는 수정하지 않는 별도 모듈)
 *  1) 설비 이력카드(`equipments.history`) / 금형 이력카드(`molds.history`) 의 연동 수리 이력 행 삭제
 *     - 작업일보 비가동 연동(report_dt_…), 설비/금형 수리의뢰 연동(eqrep_… / moldrep_…), TPM 연동(tpm_…)
 *  2) TPM 일지에서 연동된 변동점(`tpm_{설비ID}_{YYYYMMDD}`)은 해당 일자 TPM 점검 내용을 정상으로 되돌림
 *     - `equipments.tpmLogs.{YYYYMM}` (일별 X/△/기준이탈 → 정상, 주간 X/△ → O)
 *     - `tpm_logs` 컬렉션(일자·설비의 marks 정상화 + hasIssue 재계산)
 *     - 작업일보 `tpmCheckSummary.hasIssue` 동기화
 */
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import { sanitizeDocKey, normalizeDateYmd } from './changePointAutoSync';
import {
  fetchEquipmentsSlim,
  fetchMoldsSlim,
  deleteChangePoint,
  invalidateEquipmentsCache,
  invalidateMoldsCache,
  invalidateChangePointsCache
} from './firestore';
import {
  normalizeTpmTemplate,
  normalizeTpmLog,
  getTpmLogKey,
  getRowWheelSpec
} from '../constants/tpmLogTemplate';

function getCpAutoKey(cp) {
  const id = String(cp?.id || '');
  const raw = cp?.autoSourceKey || (id.startsWith('cp_auto_') ? id.slice(8) : '');
  return raw ? sanitizeDocKey(raw) : '';
}

/** 변동점 행이 자동연동으로 생성된 건인지 (확인 메시지용) */
export function isAutoLinkedChangePoint(cp) {
  return Boolean(getCpAutoKey(cp));
}

/** TPM 연동 변동점 키(`tpm_{설비ID}_{YYYYMMDD}`) 파싱 */
function parseTpmKey(key) {
  const m = String(key || '').match(/^tpm_(.+)_(\d{4})(\d{2})(\d{2})$/);
  if (!m) return null;
  return { eqId: m[1], ymd: `${m[2]}-${m[3]}-${m[4]}` };
}

/** 이력 행이 삭제 대상 변동점 키와 연결되어 있는지 판별 */
function historyRowMatches(kind, ownerId, row, idx, targetKeys) {
  if (!row) return false;
  const rawKey = String(row.autoSyncKey || '');
  if (rawKey && targetKeys.has(sanitizeDocKey(rawKey))) return true;

  const rd = row.repairDetails || {};
  const compact = normalizeDateYmd(rd.requestDate || row.date).replace(/-/g, '');
  const token = row.syncId || `${compact}_${idx}`;

  if (kind === 'equipment') {
    if (targetKeys.has(sanitizeDocKey(`eqrep_${ownerId}_${token}`))) return true;
    // TPM 자동 접수 행: 같은 설비·같은 일자의 `[TPM` 이슈 행만 대상
    if (
      String(row.issue || '').startsWith('[TPM') &&
      targetKeys.has(sanitizeDocKey(`tpm_${ownerId}_${compact}`))
    ) {
      return true;
    }
    return false;
  }
  return targetKeys.has(sanitizeDocKey(`moldrep_${ownerId}_${token}`));
}

async function removeLinkedHistoryRows(collectionName, kind, loader, targetKeys) {
  const list = await loader().catch(() => []);
  const affected = (list || []).filter(
    (owner) =>
      Array.isArray(owner?.history) &&
      owner.history.some((row, idx) => historyRowMatches(kind, owner.id, row, idx, targetKeys))
  );

  let removed = 0;
  for (const owner of affected) {
    const ref = doc(db, collectionName, owner.id);
    const snap = await getDoc(ref);
    if (!snap.exists()) continue;
    const freshHistory = Array.isArray(snap.data()?.history) ? snap.data().history : [];
    const filtered = freshHistory.filter(
      (row, idx) => !historyRowMatches(kind, owner.id, row, idx, targetKeys)
    );
    if (filtered.length !== freshHistory.length) {
      await updateDoc(ref, { history: filtered });
      removed += freshHistory.length - filtered.length;
    }
  }
  return removed;
}

const isAbnormalMark = (val, spec) => {
  const v = String(val ?? '').trim();
  if (!v) return false;
  if (v === 'X' || v === '△') return true;
  if (spec && v !== 'O') {
    const n = Number(v);
    if (Number.isFinite(n) && (n < spec.minSpec || n > spec.maxSpec)) return true;
  }
  return false;
};

/**
 * 특정 설비의 지정 일자 TPM 점검 내용을 정상으로 되돌린다.
 * @returns {{ changed: boolean }}
 */
async function revertTpmDayToNormal(eqId, ymd) {
  const eqRef = doc(db, 'equipments', eqId);
  const eqSnap = await getDoc(eqRef);
  if (!eqSnap.exists()) return { changed: false };

  const eq = { id: eqSnap.id, ...eqSnap.data() };
  const [year, month, day] = ymd.split('-').map(Number);
  const ymKey = getTpmLogKey(year, month);
  const template = normalizeTpmTemplate(eq.tpmTemplate, eq);
  const log = normalizeTpmLog(eq.tpmLogs?.[ymKey]);

  let changed = false;
  const markNormalizer = {}; // `${항목명} (${기준})` → { normalVal, spec } (tpm_logs.marks 키와 동일 규칙)

  (template.items || []).forEach((item) => {
    (item.rows || []).forEach((row) => {
      const spec = getRowWheelSpec(row, item);
      const normalVal = spec ? String(spec.defaultCenter) : 'O';
      markNormalizer[`${item.name} (${row.criterion})`] = { normalVal, spec };
      const cur = log.daily?.[row.id]?.[day];
      if (isAbnormalMark(cur, spec)) {
        log.daily[row.id] = { ...(log.daily[row.id] || {}), [day]: normalVal };
        changed = true;
      }
    });
  });

  // 템플릿 외 키로 저장된 일별 항목도 X/△ 이면 O 로 정상화
  Object.entries(log.daily || {}).forEach(([rowId, dayMap]) => {
    if (!dayMap || typeof dayMap !== 'object') return;
    const cur = String(dayMap[day] ?? '').trim();
    if (cur === 'X' || cur === '×' || cur === '△') {
      log.daily[rowId] = { ...dayMap, [day]: 'O' };
      changed = true;
    }
  });

  const weekIdx = Math.min(4, Math.floor((day - 1) / 7));
  const weekResult = String(log.weekly?.[weekIdx]?.result ?? '').trim();
  if (weekResult === 'X' || weekResult === '△') {
    log.weekly[weekIdx] = { ...log.weekly[weekIdx], result: 'O' };
    changed = true;
  }

  if (changed) {
    await updateDoc(eqRef, { [`tpmLogs.${ymKey}`]: log });
  }

  // 셋트 단위 점검 로그(`tpm_logs`) 정상화 + hasIssue 재계산
  const setIssueMap = new Map(); // setId → 재계산된 hasIssue
  try {
    const logSnap = await getDocs(query(collection(db, 'tpm_logs'), where('reportDate', '==', ymd)));
    for (const logDoc of logSnap.docs) {
      const data = logDoc.data() || {};
      const target = data.results?.[eqId];
      if (!target) continue;

      const marks = { ...(target.marks || {}) };
      let marksChanged = false;
      Object.entries(marks).forEach(([k, v]) => {
        const info = markNormalizer[k];
        if (isAbnormalMark(v, info?.spec || null)) {
          marks[k] = info?.normalVal ?? 'O';
          marksChanged = true;
        }
      });

      const nextResults = { ...data.results, [eqId]: { ...target, marks } };
      const nextHasIssue = Object.entries(nextResults).some(([otherId, res]) => {
        if (otherId === eqId) return false;
        return Object.entries(res?.marks || {}).some(([mk, mv]) =>
          isAbnormalMark(mv, markNormalizer[mk]?.spec || null)
        );
      });

      if (marksChanged || Boolean(data.hasIssue) !== nextHasIssue) {
        await updateDoc(doc(db, 'tpm_logs', logDoc.id), { results: nextResults, hasIssue: nextHasIssue });
        changed = true;
      }
      if (data.setId) setIssueMap.set(data.setId, nextHasIssue);
    }
  } catch (err) {
    console.warn('Failed to normalize tpm_logs for deleted change point:', err);
  }

  // 작업일보에 저장된 TPM 요약(hasIssue) 동기화
  try {
    if (setIssueMap.size > 0) {
      const repSnap = await getDocs(query(collection(db, 'reports'), where('date', '==', ymd)));
      for (const repDoc of repSnap.docs) {
        const summary = repDoc.data()?.tpmCheckSummary;
        if (!summary?.hasIssue) continue;
        if (!Array.isArray(summary.equipmentIds) || !summary.equipmentIds.includes(eqId)) continue;
        if (!setIssueMap.has(summary.setId)) continue;
        await updateDoc(doc(db, 'reports', repDoc.id), {
          'tpmCheckSummary.hasIssue': setIssueMap.get(summary.setId)
        });
      }
    }
  } catch (err) {
    console.warn('Failed to sync report tpmCheckSummary after TPM revert:', err);
  }

  return { changed };
}

/**
 * 변동점 선택 삭제 (연동된 설비·금형 이력카드 행 삭제 + TPM 일지 정상화 포함)
 * @param {Array} cpRows 삭제할 changePoints 행 (id 필수)
 * @param {Map|null} [cpLinkLookup] buildChangePointLinkLookup 결과 맵 (보조 매칭용)
 */
export async function deleteChangePointsWithLinks(cpRows = [], cpLinkLookup = null) {
  const summary = {
    requested: cpRows.length,
    deleted: 0,
    historyRemoved: 0,
    tpmReverted: 0,
    errors: []
  };

  const targetKeys = new Set();
  const tpmTargets = new Map(); // `${eqId}|${ymd}` → { eqId, ymd }
  cpRows.forEach((cp) => {
    const key = getCpAutoKey(cp);
    if (key) {
      targetKeys.add(key);
      const tpm = parseTpmKey(key);
      if (tpm) tpmTargets.set(`${tpm.eqId}|${tpm.ymd}`, tpm);
    }

    // cpLinkLookup 에 연결된 수리 이력 행이나 TPM 원본이 있으면 보조 키 추가
    const linkInfo = cpLinkLookup?.get?.(cp?.id);
    const linkedOwnerId = linkInfo?.repair?.owner?.id;
    const linkedRow = linkInfo?.repair?.row;
    if (linkedRow?.autoSyncKey) {
      targetKeys.add(sanitizeDocKey(linkedRow.autoSyncKey));
    }
    if (linkedOwnerId && linkedRow?.syncId) {
      const prefix = linkInfo.kind === 'mold' ? 'moldrep' : 'eqrep';
      targetKeys.add(sanitizeDocKey(`${prefix}_${linkedOwnerId}_${linkedRow.syncId}`));
    }

    const isTpmCp =
      cp?.autoSourceType === 'tpm' ||
      linkInfo?.origin === 'tpm' ||
      String(cp?.issueItem || '').includes('TPM') ||
      String(cp?.details || '').includes('[TPM') ||
      String(cp?.note || '').includes('TPM일지');

    if (isTpmCp && linkedOwnerId && cp?.date) {
      const ymd = normalizeDateYmd(cp.date);
      const compact = ymd.replace(/-/g, '');
      targetKeys.add(sanitizeDocKey(`tpm_${linkedOwnerId}_${compact}`));
      tpmTargets.set(`${linkedOwnerId}|${ymd}`, { eqId: linkedOwnerId, ymd });
    }
  });

  if (targetKeys.size > 0) {
    try {
      summary.historyRemoved += await removeLinkedHistoryRows('equipments', 'equipment', fetchEquipmentsSlim, targetKeys);
    } catch (err) {
      console.error('Failed to remove linked equipment history rows:', err);
      summary.errors.push('설비 이력카드 정리 실패');
    }
    try {
      summary.historyRemoved += await removeLinkedHistoryRows('molds', 'mold', fetchMoldsSlim, targetKeys);
    } catch (err) {
      console.error('Failed to remove linked mold history rows:', err);
      summary.errors.push('금형 이력카드 정리 실패');
    }
  }

  for (const tpm of tpmTargets.values()) {
    try {
      const { changed } = await revertTpmDayToNormal(tpm.eqId, tpm.ymd);
      if (changed) summary.tpmReverted += 1;
    } catch (err) {
      console.error('Failed to revert TPM log to normal:', err);
      summary.errors.push(`TPM 일지 정상화 실패 (${tpm.ymd})`);
    }
  }

  for (const cp of cpRows) {
    if (!cp?.id) continue;
    try {
      await deleteChangePoint(cp.id);
      summary.deleted += 1;
    } catch (err) {
      console.error('Failed to delete change point:', cp.id, err);
      summary.errors.push(`변동점 삭제 실패 (${cp.id})`);
    }
  }

  invalidateEquipmentsCache();
  invalidateMoldsCache();
  invalidateChangePointsCache();
  return summary;
}
