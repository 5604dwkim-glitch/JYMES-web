// 설비 관리 > 조도 측정 메뉴 설정
// - 조인트/가공/검교정 설비 카테고리(equipmentCategories.js)와 분리된 독립 메뉴입니다.
// - 측정 기록은 별도 컬렉션(illuminance_measurements)에 저장되어 equipments 문서에 영향을 주지 않습니다.

export const ILLUMINANCE_ROUTE_SLUG = 'illuminance';
export const ILLUMINANCE_ROUTE_PATH = `/equipment/${ILLUMINANCE_ROUTE_SLUG}`;
export const ILLUMINANCE_COLLECTION = 'illuminance_measurements';

export const ILLUMINANCE_TARGET_COMPANY = '조영산업';
export const ILLUMINANCE_PAPER_SPEC = 'A4(210×297)';
export const ILLUMINANCE_MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const ILLUMINANCE_META = {
  label: '조도 측정',
  subtitle: '매월 첫째주 작업장 조도(LUX) 정기 측정 관리 대장 및 구역별 배치도',
  listTitle: '조도측정 관리 대장',
  addBtnLabel: '+ 개별 조도 측정 등록',
  defaultStandardLux: 600
};

// 공장 전체 지도 및 동별 상세 LAY OUT 도면 정의
export const ILLUMINANCE_BUILDING_MAPS = [
  {
    id: 'overview',
    label: '공장 전체 지도 (①~⑩)',
    shortLabel: '전체 배치도',
    image: '/images/illuminance/factory_overview_map.jpg',
    pointNos: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    description: '조영산업 공장 전체 조도 측정 위치도 (① FMB 보관장 ~ ⑩ D동-검사)'
  },
  {
    id: 'fmb',
    label: '① FMB 보관장 상세도',
    shortLabel: '① FMB 보관실',
    image: '/images/illuminance/layout_1_fmb.png',
    pointNos: [1],
    description: 'FMB 보관실 (13,000 × 3,500) — JRMS 컴퓨터, 고무 압출기, 고무 권취기, 롤고무 적재함 구역'
  },
  {
    id: 'a_dong',
    label: '④·⑤ A동 LAY OUT',
    shortLabel: '④·⑤ A동',
    image: '/images/illuminance/layout_a_dong.png',
    pointNos: [4, 5],
    description: 'A동 (32,500 × 15,000) — ④ A동-조인트(600 LUX) / ⑤ A동-검사(750 LUX)'
  },
  {
    id: 'b_dong',
    label: '⑥ B동 LAY OUT',
    shortLabel: '⑥ B동',
    image: '/images/illuminance/layout_b_dong.png',
    pointNos: [6],
    description: 'B동 (32,500 × 15,000) — ⑥ B동-조인트(600 LUX, DT QUAD #1 / DT CREW #1~#2 조인트 라인)'
  },
  {
    id: 'c_dong',
    label: '⑦·⑧ C동 LAY OUT',
    shortLabel: '⑦·⑧ C동',
    image: '/images/illuminance/layout_c_dong.png',
    pointNos: [7, 8],
    description: 'C동 (32,500 × 15,000) — ⑦ C동-조인트(600 LUX) / ⑧ C동-검사(750 LUX)'
  },
  {
    id: 'd_dong',
    label: '⑨·⑩ D동 LAY OUT',
    shortLabel: '⑨·⑩ D동',
    image: '/images/illuminance/layout_d_dong.png',
    pointNos: [9, 10],
    description: 'D동 (32,500 × 15,000) — ⑨ D동-후가공(750 LUX) / ⑩ D동-검사(600 LUX)'
  }
];

// 조도측정 관리 대장 10대 표준 측정공정 (순번 1 ~ 10)
export const ILLUMINANCE_POINTS = [
  {
    no: 1,
    circledNo: '①',
    name: 'FMB 보관장',
    standardLux: 600,
    standardLabel: '600 LUX',
    building: 'FMB 보관실',
    mapId: 'fmb',
    layoutImage: '/images/illuminance/layout_1_fmb.png',
    detailLocation: 'FMB 보관실 내부 (고무 압출기 · 고무 권취기 · 롤고무 적재함 작업 구역)',
    overviewPos: { left: 52.0, top: 54.6 }
  },
  {
    no: 2,
    circledNo: '②',
    name: '수입검사장',
    standardLux: 750,
    standardLabel: '750 LUX',
    building: '수입검사장',
    mapId: 'overview',
    layoutImage: '/images/illuminance/factory_overview_map.jpg',
    detailLocation: '공장 북서측 수입검사장 전용 동 내부 검사 구역',
    overviewPos: { left: 33.4, top: 25.0 }
  },
  {
    no: 3,
    circledNo: '③',
    name: '사무실',
    standardLux: 600,
    standardLabel: '600 LUX',
    building: '사무실',
    mapId: 'overview',
    layoutImage: '/images/illuminance/factory_overview_map.jpg',
    detailLocation: '수입검사장 남측 사무실 동 내부 업무 구역',
    overviewPos: { left: 31.8, top: 36.2 }
  },
  {
    no: 4,
    circledNo: '④',
    name: 'A동-조인트',
    standardLux: 600,
    standardLabel: '600 LUX',
    building: 'A동',
    mapId: 'a_dong',
    layoutImage: '/images/illuminance/layout_a_dong.png',
    detailLocation: 'A동 LAY OUT ④번 구역 (9BQC FRT/RR 작업 및 본드제거·후가공 인접 구역)',
    overviewPos: { left: 26.6, top: 47.4 }
  },
  {
    no: 5,
    circledNo: '⑤',
    name: 'A동-검사',
    standardLux: 750,
    standardLabel: '750 LUX',
    building: 'A동',
    mapId: 'a_dong',
    layoutImage: '/images/illuminance/layout_a_dong.png',
    detailLocation: 'A동 LAY OUT ⑤번 구역 (9BQC RR 절단 / 9BQC FRT 라인 구역)',
    overviewPos: { left: 21.6, top: 57.4 }
  },
  {
    no: 6,
    circledNo: '⑥',
    name: 'B동-조인트',
    standardLux: 600,
    standardLabel: '600 LUX',
    building: 'B동',
    mapId: 'b_dong',
    layoutImage: '/images/illuminance/layout_b_dong.png',
    detailLocation: 'B동 LAY OUT ⑥번 구역 (DT QUAD #1, DT CREW #1~#2 조인트 성형 구역)',
    overviewPos: { left: 55.1, top: 63.0 }
  },
  {
    no: 7,
    circledNo: '⑦',
    name: 'C동-조인트',
    standardLux: 600,
    standardLabel: '600 LUX',
    building: 'C동',
    mapId: 'c_dong',
    layoutImage: '/images/illuminance/layout_c_dong.png',
    detailLocation: 'C동 LAY OUT ⑦번 구역 (하단 INJ FRT/RR, NE1a D/SIDE, JG1/JG1s 조인트 라인)',
    overviewPos: { left: 59.9, top: 49.4 }
  },
  {
    no: 8,
    circledNo: '⑧',
    name: 'C동-검사',
    standardLux: 750,
    standardLabel: '750 LUX',
    building: 'C동',
    mapId: 'c_dong',
    layoutImage: '/images/illuminance/layout_c_dong.png',
    detailLocation: 'C동 LAY OUT ⑧번 구역 (중앙 압출대차 및 JG1s 인벨트·C PART\'G·ME1a 검사 구역)',
    overviewPos: { left: 53.1, top: 43.8 }
  },
  {
    no: 9,
    circledNo: '⑨',
    name: 'D동-후가공',
    standardLux: 750,
    standardLabel: '750 LUX',
    building: 'D동',
    mapId: 'd_dong',
    layoutImage: '/images/illuminance/layout_d_dong.png',
    detailLocation: 'D동 LAY OUT ⑨번 구역 (하단 DS STD / DS CREW 후가공 작업대 구역)',
    overviewPos: { left: 82.3, top: 40.4 }
  },
  {
    no: 10,
    circledNo: '⑩',
    name: 'D동-검사',
    standardLux: 600,
    standardLabel: '600 LUX',
    building: 'D동',
    mapId: 'd_dong',
    layoutImage: '/images/illuminance/layout_d_dong.png',
    detailLocation: 'D동 LAY OUT ⑩번 구역 (상단 DT QUAD / DT CREW 검사 작업대 구역)',
    overviewPos: { left: 79.0, top: 34.4 }
  }
];

// 측정 장소 입력 시 추천 목록 (10대 공식 측정공정)
export const ILLUMINANCE_LOCATION_SUGGESTIONS = ILLUMINANCE_POINTS.map((p) => p.name);

export const ILLUMINANCE_JUDGEMENT = {
  PASS: '적합',
  FAIL: '부적합',
  NONE: '-'
};

export function toLuxNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const n = Number(String(value).replace(/,/g, '').replace(/lux/gi, '').trim());
  return Number.isFinite(n) ? n : null;
}

// 측정값이 기준 조도 이상이면 적합
export function judgeIlluminance(measuredLux, standardLux) {
  const measured = toLuxNumber(measuredLux);
  const standard = toLuxNumber(standardLux);
  if (measured === null || standard === null) return ILLUMINANCE_JUDGEMENT.NONE;
  return measured >= standard ? ILLUMINANCE_JUDGEMENT.PASS : ILLUMINANCE_JUDGEMENT.FAIL;
}

// 공정명 또는 순번으로 표준 측정공정 메타 찾기
export function findIlluminancePoint(locationOrNo) {
  if (locationOrNo === null || locationOrNo === undefined) return null;
  if (typeof locationOrNo === 'number') {
    return ILLUMINANCE_POINTS.find((p) => p.no === locationOrNo) || null;
  }
  const clean = String(locationOrNo)
    .replace(/^[①②③④⑤⑥⑦⑧⑨⑩\d.\-\s]+/, '')
    .replace(/\s+/g, '')
    .toUpperCase();
  return (
    ILLUMINANCE_POINTS.find(
      (p) => p.name.replace(/\s+/g, '').toUpperCase() === clean || String(p.no) === clean
    ) || null
  );
}

const KOR_DOW = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * 해당 연·월의 "첫째주" 평일(월~금) 후보 목록과 기본 추천 측정일(첫째주 월요일 우선) 반환
 */
export function getFirstWeekSchedule(year, month) {
  const y = Number(year) || new Date().getFullYear();
  const m = Number(month) || 1;
  const mm = String(m).padStart(2, '0');
  const weekdays = [];
  let firstMonday = '';

  for (let d = 1; d <= 7; d += 1) {
    const dt = new Date(y, m - 1, d);
    const dow = dt.getDay();
    const iso = `${y}-${mm}-${String(d).padStart(2, '0')}`;
    if (dow >= 1 && dow <= 5) {
      // 1월 1일(신정), 5월 1일(근로자의 날)은 기본 추천일에서 후순위 처리
      const isHoliday = (m === 1 && d === 1) || (m === 5 && d === 1);
      weekdays.push({
        iso,
        day: d,
        dow,
        dowLabel: KOR_DOW[dow],
        label: `${mm}/${String(d).padStart(2, '0')}(${KOR_DOW[dow]})`,
        isHoliday
      });
      if (dow === 1 && !firstMonday && !isHoliday) {
        firstMonday = iso;
      }
    }
  }

  const firstNonHolidayWeekday = weekdays.find((w) => !w.isHoliday)?.iso || weekdays[0]?.iso || `${y}-${mm}-01`;
  const defaultDate = firstMonday || firstNonHolidayWeekday;

  return {
    year: y,
    month: m,
    defaultDate,
    defaultTime: '10:00',
    weekdays
  };
}

export function createInitialIlluminanceForm(defaultPointNo = 1) {
  const pt = findIlluminancePoint(defaultPointNo) || ILLUMINANCE_POINTS[0];
  return {
    id: '',
    pointNo: pt.no,
    date: new Date().toLocaleDateString('sv-SE'),
    measureTime: '10:00',
    location: pt.name,
    standardLux: String(pt.standardLux),
    measuredLux: '',
    instrument: '',
    measurer: '',
    remark: ''
  };
}
