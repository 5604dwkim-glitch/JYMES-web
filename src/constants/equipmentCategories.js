// 설비 관리 내부 대분류 카테고리 정의
// 1. 조인트 설비 (joint)      : 기존 등록 설비 전체 귀속 (인젝션 프레스, 가류기 등)
// 2. 가공 설비   (processing) : 절단, 펀칭, 클립머신 등 가공 공정 설비
// 3. 계측기      (measuring)  : 검교증(검교정) 관리 대상 계측 장비

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
    label: '계측기',
    subtitle: '검교증(검교정) 관리 대상 계측 장비',
    itemLabel: '계측기',
    listTitle: '계측기 관리 리스트',
    addBtnLabel: '+ 신규 계측기 등록',
    hasSetConfig: false,
    tabLabels: {
      list: '계측기 리스트',
      tpm: '점검(TPM) 일지'
    },
    defaultType: '버니어 캘리퍼스',
    defaultManufacturer: '',
    defaultOwnership: '자가',
    useJointDefaults: false,
    placeholders: {
      code: '예: MS-001',
      name: '예: 디지털 버니어 캘리퍼스',
      spec: '예: 0~150mm (0.01mm) / 검교정 주기 등',
      manufacturer: '예: Mitutoyo',
      location: '예: 품질검사실 / 현장 계측대'
    },
    typeOptions: [
      '버니어 캘리퍼스',
      '마이크로미터',
      '다이얼 게이지',
      '하이트 게이지',
      '두께 게이지',
      '경도계',
      '전자저울',
      '온습도계',
      '인장시험기',
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

export function getCategoryMeta(categoryId) {
  return EQUIPMENT_CATEGORY_MAP[categoryId] || EQUIPMENT_CATEGORY_MAP.joint;
}

export function createInitialEquipmentForm(categoryId = 'joint') {
  const meta = getCategoryMeta(categoryId);
  return {
    id: '',
    category: meta.id,
    code: '',
    name: '',
    type: meta.defaultType,
    location: '',
    status: '정상',
    installDate: '',
    spec: '',
    manufacturer: meta.defaultManufacturer,
    ownership: meta.defaultOwnership,
    assetNo: ''
  };
}
