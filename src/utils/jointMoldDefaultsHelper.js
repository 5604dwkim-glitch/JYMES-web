/**
 * 조인트 일보 금형 선택 이력 순수 유틸 / 로컬 캐시 헬퍼
 * - Firebase 의존성 없이 렌더러(Section5Renderer.js) 및 스냅샷 테스트에서 안전하게 사용 가능
 */

export const JOINT_MOLD_DEFAULTS_CACHE_KEY = 'jymes_joint_mold_defaults_v1';

/**
 * 양식별 금형 기본값 저장/조회용 고유 키 생성
 * (FORM_CODE_MAP의 고유 양식 번호가 최우선이며, 미등록 시 차종_부품_공정 조합 사용)
 */
export function buildJointMoldFormKey({ formCode, carModel, partName, processName } = {}) {
  const num = Number(formCode);
  if (Number.isFinite(num) && num > 0 && num < 9000) {
    return String(num);
  }
  return `${carModel || ''}_${partName || ''}_${processName || ''}`;
}

/**
 * 저장된 일보 객체(reportData)에서 조인트 금형 선택값 및 DT CREW L/R 체크 상태를 추출한다.
 * 금형이 하나도 선택되지 않았으면 null을 반환해 기존 기억 값을 덮어쓰지 않도록 한다.
 */
export function extractJointMoldEntryFromReport(reportData) {
  if (!reportData || typeof reportData !== 'object') return null;

  const v1 = reportData.vulcData || reportData.vulcTable || {};
  const v2 = reportData.vulcData2 || reportData.vulcTable2 || {};

  const molds = {};
  Object.keys(v1).forEach((k) => {
    if (k.startsWith('mold_')) {
      molds[`vulc_${k}`] = String(v1[k] ?? '').trim();
    }
  });
  Object.keys(v2).forEach((k) => {
    if (k.startsWith('mold_')) {
      molds[`vulc2_${k}`] = String(v2[k] ?? '').trim();
    }
  });

  if (!Object.values(molds).some(Boolean)) {
    return null;
  }

  const checks = {};
  if (typeof v1.lh_check === 'boolean') checks.vulc_lh_check = v1.lh_check;
  if (typeof v1.rh_check === 'boolean') checks.vulc_rh_check = v1.rh_check;
  if (typeof v2.lh_check === 'boolean') checks.vulc2_lh_check = v2.lh_check;
  if (typeof v2.rh_check === 'boolean') checks.vulc2_rh_check = v2.rh_check;

  return {
    molds,
    checks,
    reportDate: String(reportData.date || ''),
    reportId: String(reportData.id || ''),
    updatedAt: new Date().toISOString()
  };
}

/**
 * 두 엔트리(기존 vs 신규) 중 더 최신 기록을 판별한다.
 */
export function isNewerJointMoldEntry(candidate, existing) {
  if (!candidate) return false;
  if (!existing) return true;
  const candDate = String(candidate.reportDate || '');
  const existDate = String(existing.reportDate || '');
  if (candDate !== existDate) return candDate > existDate;
  const candId = String(candidate.reportId || '');
  const existId = String(existing.reportId || '');
  if (candId && existId && candId !== existId) return candId > existId;
  return String(candidate.updatedAt || '') >= String(existing.updatedAt || '');
}

export function readLocalJointMoldDefaults() {
  try {
    if (typeof localStorage === 'undefined') return {};
    const raw = localStorage.getItem(JOINT_MOLD_DEFAULTS_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function writeLocalJointMoldDefaults(map) {
  try {
    if (typeof localStorage === 'undefined' || !map || typeof map !== 'object') return;
    localStorage.setItem(JOINT_MOLD_DEFAULTS_CACHE_KEY, JSON.stringify(map));
  } catch {
    // localStorage 사용 불가 환경 무시
  }
}
