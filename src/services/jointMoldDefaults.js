import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from '../firebase';
import {
  buildJointMoldFormKey,
  extractJointMoldEntryFromReport,
  isNewerJointMoldEntry,
  readLocalJointMoldDefaults,
  writeLocalJointMoldDefaults
} from '../utils/jointMoldDefaultsHelper';

const DEFAULTS_COLLECTION = 'counters';
const DEFAULTS_DOC_ID = 'joint_mold_defaults_v1';
const REPORTS_COLLECTION = 'reports';

let memoryDefaultsMap = null;
const bootstrappedFormKeys = new Set();

function mergeDefaultsMaps(baseMap, incomingMap) {
  const merged = { ...(baseMap || {}) };
  Object.entries(incomingMap || {}).forEach(([k, entry]) => {
    if (!entry || typeof entry !== 'object') return;
    if (!merged[k] || isNewerJointMoldEntry(entry, merged[k])) {
      merged[k] = entry;
    }
  });
  return merged;
}

export function getCachedJointMoldDefaults() {
  if (memoryDefaultsMap) return memoryDefaultsMap;
  memoryDefaultsMap = readLocalJointMoldDefaults();
  return memoryDefaultsMap;
}

/**
 * Firestore(counters/joint_mold_defaults_v1)와 localStorage 캐시를 병합해
 * 모든 조인트 양식의 최신 선택 금형 번호 맵을 가져온다.
 */
export async function fetchJointMoldDefaults() {
  const localMap = readLocalJointMoldDefaults();
  memoryDefaultsMap = mergeDefaultsMaps(memoryDefaultsMap, localMap);

  try {
    const snap = await getDoc(doc(db, DEFAULTS_COLLECTION, DEFAULTS_DOC_ID));
    if (snap.exists()) {
      const remoteForms = snap.data()?.forms || {};
      memoryDefaultsMap = mergeDefaultsMaps(memoryDefaultsMap, remoteForms);
      writeLocalJointMoldDefaults(memoryDefaultsMap);
    }
  } catch (err) {
    console.warn('fetchJointMoldDefaults fallback to local:', err?.message || err);
  }

  return memoryDefaultsMap || {};
}

/**
 * 콜드 스타트(counters/joint_mold_defaults_v1 에 아직 기록되지 않은 양식) 대비:
 * 기존 저장된 reports 에서 해당 양식의 가장 최근 조인트 일보를 찾아 금형 선택값을 복원한다.
 */
export async function fetchLatestJointMoldEntryForForm({ formCode, carModel, partName, processName } = {}) {
  const formKey = buildJointMoldFormKey({ formCode, carModel, partName, processName });
  const existing = getCachedJointMoldDefaults()[formKey];
  if (existing) return existing;
  if (bootstrappedFormKeys.has(formKey) || !carModel) return null;
  bootstrappedFormKeys.add(formKey);

  try {
    const q = query(collection(db, REPORTS_COLLECTION), where('carModel', '==', carModel));
    const snap = await getDocs(q);
    const numCode = Number(formCode);
    const hasNumericCode = Number.isFinite(numCode) && numCode > 0 && numCode < 9000;

    const candidates = [];
    snap.forEach((d) => {
      const r = { id: d.id, ...d.data() };
      const rCode = Number(r.formCode);
      const matchesCode = hasNumericCode && Number.isFinite(rCode) && rCode === numCode;
      const matchesProc =
        r.carModel === carModel &&
        (!processName || r.processName === processName) &&
        (!partName || !r.itemCode || r.itemCode === partName || r.itemName === partName);
      if (!matchesCode && !matchesProc) return;

      const entry = extractJointMoldEntryFromReport(r);
      if (entry) candidates.push(entry);
    });

    if (candidates.length === 0) return null;

    let newest = candidates[0];
    for (let i = 1; i < candidates.length; i++) {
      if (isNewerJointMoldEntry(candidates[i], newest)) {
        newest = candidates[i];
      }
    }

    memoryDefaultsMap = mergeDefaultsMaps(memoryDefaultsMap, { [formKey]: newest });
    writeLocalJointMoldDefaults(memoryDefaultsMap);

    setDoc(
      doc(db, DEFAULTS_COLLECTION, DEFAULTS_DOC_ID),
      { forms: { [formKey]: newest } },
      { merge: true }
    ).catch(() => {});

    return newest;
  } catch (err) {
    console.warn('fetchLatestJointMoldEntryForForm failed:', err?.message || err);
    return null;
  }
}

/**
 * 일보 신규 등록 / 수정 시 조인트 금형 선택값을 최신 이력으로 저장한다.
 * 과거 날짜 일보 수정 시 현재 최신 선택값을 덮어쓰지 않도록 날짜/ID 비교를 수행한다.
 */
export async function persistJointMoldDefaultsFromReport(reportData) {
  const entry = extractJointMoldEntryFromReport(reportData);
  if (!entry) return;

  const formKey = buildJointMoldFormKey({
    formCode: reportData.formCode,
    carModel: reportData.carModel,
    partName: reportData.itemCode || reportData.itemName,
    processName: reportData.processName
  });

  const currentMap = getCachedJointMoldDefaults();
  const prevEntry = currentMap[formKey];
  if (prevEntry && !isNewerJointMoldEntry(entry, prevEntry)) {
    return;
  }

  memoryDefaultsMap = { ...currentMap, [formKey]: entry };
  writeLocalJointMoldDefaults(memoryDefaultsMap);

  try {
    await setDoc(
      doc(db, DEFAULTS_COLLECTION, DEFAULTS_DOC_ID),
      { forms: { [formKey]: entry } },
      { merge: true }
    );
  } catch (err) {
    console.warn('persistJointMoldDefaultsFromReport Firestore sync failed:', err?.message || err);
  }
}
