// 설비 관리 내부 대분류 카테고리 정의
// 1. 조인트 설비 (joint)      : 기존 등록 설비 전체 귀속 (인젝션 프레스, 가류기 등)
// 2. 가공 설비   (processing) : 절단, 펀칭, 클립머신 등 가공 공정 설비
// 3. 검교정      (measuring)  : 검교증(검교정) 관리 대상 계측기 · 설비

export const EQUIPMENT_CATEGORIES = [
  {
    id: 'joint',
    order: 1,
    icon: '🔧',
    label: '조인트 설비',
    subtitle: '인젝션 프레스 · 가류기 등 조인트 공정 설비',
    itemLabel: '조인트 설비',
    listTitle: '조인트 설비 관리 리스트',
    addBtnLabel: '+ 신규 조인트 설비 등록',
    hasSetConfig: true,
    hasTpmTab: true,
    tabLabels: {
      list: '설비 리스트',
      config: '설비 셋트 구성',
      tpm: 'TPM 일지'
    },
    defaultType: '유압',
    defaultManufacturer: '극동기계',
    defaultOwnership: '대여',
    useJointDefaults: true,
    placeholders: {
      code: '예: DS-C-001',
      name: '예: 인젝션 프레스',
      spec: '예: 150TON / 열판 크기 등',
      manufacturer: '예: 극동기계',
      location: '예: 조인트 1라인'
    },
    typeOptions: ['유압', '사출기', '프레스', '가류기', '컨베이어', '기타']
  },
  {
    id: 'processing',
    order: 2,
    icon: '⚙️',
    label: '가공 설비',
    subtitle: '절단 · 펀칭 · 클립머신 등 가공 공정 설비',
    itemLabel: '가공 설비',
    listTitle: '가공 설비 관리 리스트',
    addBtnLabel: '+ 신규 가공 설비 등록',
    hasSetConfig: true,
    hasTpmTab: true,
    tabLabels: {
      list: '설비 리스트',
      config: '설비 셋트 구성',
      tpm: 'TPM 일지'
    },
    defaultType: '절단기',
    defaultManufacturer: '',
    defaultOwnership: '자가',
    useJointDefaults: false,
    placeholders: {
      code: '예: PR-C-001',
      name: '예: 정치절단기 #1 / 클립머신 #1',
      spec: '예: 공압식 / 작업규격 등',
      manufacturer: '제작처 입력',
      location: '예: 가공 라인 / 클립 공정'
    },
    typeOptions: [
      '절단기',
      '정치절단기',
      '단컷팅기',
      '펀칭기',
      '클립머신',
      '노칭기',
      '사상기',
      '로봇본딩기',
      '프레스',
      '유압',
      '컨베이어',
      '기타'
    ]
  },
  {
    id: 'measuring',
    order: 3,
    icon: '📏',
    label: '검교정 리스트',
    subtitle: '검교증(검교정) 관리 대상 계측기 · 설비',
    itemLabel: '검교정 리스트',
    listTitle: '검교정 관리 리스트 (계측기)',
    addBtnLabel: '+ 신규 계측기 등록',
    equipListTitle: '검교정 관리 리스트 (설비)',
    equipAddBtnLabel: '+ 신규 검교정 설비 등록',
    hasSetConfig: false,
    hasTpmTab: false,
    tabLabels: {
      list: '검교정 리스트(계측기)',
      equipCalibration: '검교정 리스트(설비)'
    },
    defaultType: '온도측정',
    equipDefaultType: '온도',
    defaultManufacturer: '',
    defaultOwnership: '자가',
    useJointDefaults: false,
    placeholders: {
      code: '예: 001',
      name: '예: 디지털온도계',
      serialNo: '예: 120200969',
      spec: '예: -200℃~1,000℃',
      manufacturer: '예: TES, CAS',
      location: '예: 사무실, DS/DT',
      manager: '예: 김동욱',
      calibrationAgency: '예: 한국측정기술원'
    },
    equipPlaceholders: {
      code: '예: 9B-F-001',
      name: '예: 온도지시계',
      serialNo: '예: 26-G-OU-001',
      spec: '예: 999',
      manufacturer: '예: 화승알앤에이 임대설비',
      location: '예: A동, B동, C동',
      storageLocation: '예: 현장',
      manager: '예: 김동욱',
      calibrationAgency: '예: 화승알앤에이'
    },
    typeOptions: [
      '온도측정',
      '질량/부피',
      '온도,습도',
      '길이측정',
      '조도측정',
      '경도/물성',
      '압력/힘',
      '버니어 캘리퍼스',
      '마이크로미터',
      '다이얼 게이지',
      '기타'
    ],
    equipTypeOptions: [
      '온도',
      '압력',
      '시험기',
      '인장시험기',
      '경도계',
      '온도조절기',
      '건조기/오븐',
      '항온항습기',
      '압력계',
      '유량계',
      '저울/계량기',
      '두께 게이지',
      '프레스',
      '가류기',
      '기타'
    ]
  }
];

export const EQUIPMENT_CATEGORY_MAP = EQUIPMENT_CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = cat;
  return acc;
}, {});

/**
 * 설비 문서의 카테고리를 판별합니다.
 * - 기존 등록되어 있던 설비(category 필드 없음)는 전부 '조인트 설비(joint)'로 귀속됩니다.
 */
export function getEquipmentCategory(eq) {
  const raw = String(eq?.category || '').trim();
  if (raw === 'processing' || raw === 'measuring' || raw === 'joint') {
    return raw;
  }
  return 'joint';
}

/**
 * 설비 셋트 문서의 카테고리를 판별합니다.
 * - 기존 생성되어 있던 셋트(category 필드 없음)는 전부 '조인트 설비(joint)'로 귀속됩니다.
 */
export function getEquipmentSetCategory(eqSet) {
  const raw = String(eqSet?.category || '').trim();
  if (raw === 'processing' || raw === 'measuring' || raw === 'joint') {
    return raw;
  }
  return 'joint';
}

/**
 * 검교정(measuring) 카테고리 내 세부 구분(계측기 / 설비)을 판별합니다.
 * - 기존 등록되어 있던 계측기(calibrationGroup 필드 없음)는 'instrument'로 귀속됩니다.
 */
export function getCalibrationGroup(eq) {
  return String(eq?.calibrationGroup || '').trim() === 'equipment' ? 'equipment' : 'instrument';
}

export function getCategoryMeta(categoryId) {
  return EQUIPMENT_CATEGORY_MAP[categoryId] || EQUIPMENT_CATEGORY_MAP.joint;
}

export function createInitialEquipmentForm(categoryId = 'joint', calibrationGroup = 'instrument') {
  const meta = getCategoryMeta(categoryId);
  const normalizedGroup = calibrationGroup === 'equipment' ? 'equipment' : 'instrument';
  const defaultType =
    meta.id === 'measuring' && normalizedGroup === 'equipment'
      ? meta.equipDefaultType || meta.defaultType
      : meta.defaultType;
  return {
    id: '',
    category: meta.id,
    calibrationGroup: normalizedGroup,
    code: '',
    name: '',
    serialNo: '',
    type: defaultType,
    location: '',
    storageLocation: '',
    status: '정상',
    installDate: '',
    spec: '',
    manufacturer: meta.defaultManufacturer,
    ownership: meta.defaultOwnership,
    assetNo: '',
    calibrationCycle: '1년',
    calibrationDate: '',
    nextCalibrationDate: '',
    manager: '',
    calibrationAgency: ''
  };
}
