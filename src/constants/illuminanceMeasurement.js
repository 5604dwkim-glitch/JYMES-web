// 설비 관리 > 조도 측정 메뉴 설정
// - 조인트/가공/검교정 설비 카테고리(equipmentCategories.js)와 분리된 독립 메뉴입니다.
// - 측정 기록은 별도 컬렉션(illuminance_measurements)에 저장되어 equipments 문서에 영향을 주지 않습니다.

export const ILLUMINANCE_ROUTE_SLUG = 'illuminance';
export const ILLUMINANCE_ROUTE_PATH = `/equipment/${ILLUMINANCE_ROUTE_SLUG}`;
export const ILLUMINANCE_COLLECTION = 'illuminance_measurements';

export const ILLUMINANCE_META = {
  label: '조도 측정',
  subtitle: '작업장 조도(lux) 측정 기록 관리 및 기준 적합 여부 판정',
  listTitle: '조도 측정 기록 리스트',
  addBtnLabel: '+ 신규 조도 측정 등록',
  defaultStandardLux: 300
};

// 측정 장소 입력 시 추천 목록(자유 입력도 가능)
export const ILLUMINANCE_LOCATION_SUGGESTIONS = [
  '조인트 1라인',
  '조인트 2라인',
  '가공 라인',
  '검사/포장',
  '소재 준비',
  '사무실'
];

export const ILLUMINANCE_JUDGEMENT = {
  PASS: '적합',
  FAIL: '부적합',
  NONE: '-'
};

export function toLuxNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

// 측정값이 기준 조도 이상이면 적합
export function judgeIlluminance(measuredLux, standardLux) {
  const measured = toLuxNumber(measuredLux);
  const standard = toLuxNumber(standardLux);
  if (measured === null || standard === null) return ILLUMINANCE_JUDGEMENT.NONE;
  return measured >= standard ? ILLUMINANCE_JUDGEMENT.PASS : ILLUMINANCE_JUDGEMENT.FAIL;
}

export function createInitialIlluminanceForm() {
  return {
    id: '',
    date: new Date().toLocaleDateString('sv-SE'),
    location: '',
    standardLux: String(ILLUMINANCE_META.defaultStandardLux),
    measuredLux: '',
    instrument: '',
    measurer: '',
    remark: ''
  };
}
