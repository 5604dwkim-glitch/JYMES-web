// 설비 일상 점검(TPM) 일지 기본 양식 (종이 일지 "설비 일상 점검 일지" 기준)
// - 설비별로 수정한 양식은 equipments/{id}.tpmTemplate 에 저장되며, 없으면 이 기본값을 사용합니다.

export const TPM_MARKS = ['', 'O', 'X', '△'];

export const TPM_CIRCLED_NUMBERS = [
  '①',
  '②',
  '③',
  '④',
  '⑤',
  '⑥',
  '⑦',
  '⑧',
  '⑨',
  '⑩',
  '⑪',
  '⑫',
  '⑬',
  '⑭',
  '⑮'
];

const DEFAULT_INJECTION_TPM_SPECS = new Set(['10ton', '15ton', '30ton']);

export const isHeatFusionEquipment = (equipment) => {
  const compactName = String(equipment?.name || '').replace(/\s+/g, '').trim();
  return compactName === '열융착기' || compactName === 'PE열융착기';
};

export const isTpv22TonEquipment = (equipment) => {
  const compactName = String(equipment?.name || '').replace(/\s+/g, '').toLowerCase();
  const compactSpec = String(equipment?.spec || '').replace(/\s+/g, '').toLowerCase();
  return (compactName === 'tpv인젝션' || compactName === 'tpv사출기') && compactSpec === '22ton';
};

export const isTpv300TonEquipment = (equipment) => {
  const compactName = String(equipment?.name || '').replace(/\s+/g, '').toLowerCase();
  const compactSpec = String(equipment?.spec || '').replace(/\s+/g, '').toLowerCase();
  return (compactName === 'tpv인젝션' || compactName === 'tpv사출기') && compactSpec === '300ton';
};

export const isHydraulicPress11TonEquipment = (equipment) => {
  const compactName = String(equipment?.name || '').replace(/\s+/g, '').toLowerCase();
  const compactSpec = String(equipment?.spec || '').replace(/\s+/g, '').toLowerCase();
  return compactName === '유압프레스' && (!compactSpec || compactSpec === '11ton');
};

/**
 * 설비별 TPM 일지 적용 정책을 판별합니다.
 * - 'custom'                   : 설비 문서에 개별/전용 tpmTemplate 이 등록된 경우
 * - 'default_injection'        : 조인트 인젝션 프레스(10ton / 15ton / 30ton) — 기본 동일 TPM 일지 사용
 * - 'dedicated_heat_fusion'    : 조인트 열융착기(PE 열융착기) 전용 TPM 일지 사용
 * - 'dedicated_tpv_22ton'      : 조인트 22ton TPV 인젝션(사출기) 전용 TPM 일지 사용
 * - 'dedicated_tpv_300ton'     : 조인트 300ton TPV 인젝션(사출기) 전용 TPM 일지 사용
 * - 'dedicated_hydraulic_11ton': 조인트 11ton 유압 프레스 전용 TPM 일지 사용
 * - 'unassigned'               : 전용 TPM 일지 미지정 설비
 */
export const getEquipmentTpmPolicy = (equipment) => {
  if (!equipment || equipment.tpmDisabled === true) return 'unassigned';
  if (Array.isArray(equipment.tpmTemplate?.items) && equipment.tpmTemplate.items.length > 0) {
    return 'custom';
  }
  const cat = String(equipment.category || 'joint').trim();
  if (cat && cat !== 'joint') {
    return 'default_injection';
  }
  const compactName = String(equipment.name || '').replace(/\s+/g, '').trim();
  const compactSpec = String(equipment.spec || '').replace(/\s+/g, '').toLowerCase();
  if (compactName === '인젝션프레스' && DEFAULT_INJECTION_TPM_SPECS.has(compactSpec)) {
    return 'default_injection';
  }
  if (isHeatFusionEquipment(equipment)) {
    return 'dedicated_heat_fusion';
  }
  if (isTpv22TonEquipment(equipment)) {
    return 'dedicated_tpv_22ton';
  }
  if (isTpv300TonEquipment(equipment)) {
    return 'dedicated_tpv_300ton';
  }
  if (isHydraulicPress11TonEquipment(equipment)) {
    return 'dedicated_hydraulic_11ton';
  }
  return 'unassigned';
};

export const hasEquipmentTpmLog = (equipment) => getEquipmentTpmPolicy(equipment) !== 'unassigned';

// 종이 TPM 일지 좌측 상단의 번호 표시 설비 가이드 이미지
export const DEFAULT_TPM_GUIDE_PHOTO = '/images/tpm_guide_photo.jpg';
export const HEAT_FUSION_TPM_GUIDE_PHOTO = '/images/tpm_guide_heat_fusion.jpg';
export const TPV_22TON_TPM_GUIDE_PHOTO = '/images/tpm_guide_tpv_22ton.jpg';
export const TPV_300TON_TPM_GUIDE_PHOTO = '/images/tpm_guide_tpv_300ton.jpg';
export const HYDRAULIC_11TON_TPM_GUIDE_PHOTO = '/images/tpm_guide_hydraulic_11ton.jpg';

export const TPV_22TON_STEP_PHOTOS = {
  1: '/images/tpm_tpv22_1_4.jpg',
  2: '/images/tpm_tpv22_2.jpg',
  3: '/images/tpm_tpv22_3.jpg',
  4: '/images/tpm_tpv22_1_4.jpg',
  5: '/images/tpm_tpv22_5.jpg',
  6: '/images/tpm_tpv22_6.jpg',
  7: '/images/tpm_tpv22_7.jpg',
  8: '/images/tpm_tpv22_8.jpg'
};

export const TPV_300TON_STEP_PHOTOS = {
  1: '/images/tpm_tpv300_1_7.jpg',
  2: '/images/tpm_tpv300_2_6.jpg',
  3: '/images/tpm_tpv300_3.jpg',
  4: '/images/tpm_tpv300_4.jpg',
  5: '/images/tpm_tpv300_5.jpg',
  6: '/images/tpm_tpv300_2_6.jpg',
  7: '/images/tpm_tpv300_1_7.jpg',
  8: '/images/tpm_tpv300_8.jpg',
  9: '/images/tpm_tpv300_9.jpg',
  10: '/images/tpm_tpv300_10.jpg',
  11: '/images/tpm_tpv300_11.jpg'
};

export const getDefaultTpmPhotoForEquipment = (equipment) => {
  if (isHeatFusionEquipment(equipment)) return HEAT_FUSION_TPM_GUIDE_PHOTO;
  if (isTpv22TonEquipment(equipment)) return TPV_22TON_TPM_GUIDE_PHOTO;
  if (isTpv300TonEquipment(equipment)) return TPV_300TON_TPM_GUIDE_PHOTO;
  if (isHydraulicPress11TonEquipment(equipment)) return HYDRAULIC_11TON_TPM_GUIDE_PHOTO;
  return DEFAULT_TPM_GUIDE_PHOTO;
};

export const createDefaultTpmTemplate = () => ({
  // 사진 옆 "번호 / 부위명칭" 표 (10행)
  legend: ['콘트롤판넬', '온조기', '압력게이지', '비상스위치', '오일게이지', '안전센스', '비상벨', '', '', ''],
  // 주간 점검 기록 (제1~5주)
  weekly: Array.from({ length: 5 }, () => ({
    part: '오일게이지',
    criterion: '관리선(Max, Min)내에 있는가?(설비하단 게이지)'
  })),
  // 일상 점검 항목 (rows 는 점검기준 행, id 는 일별 기록 저장 키)
  items: [
    { id: 'i1', name: '콘드롤 판넬', nameEn: '(Control panel)', rows: [{ id: 'i1a', criterion: '정상적으로 작동하는가' }] },
    { id: 'i2', name: '온조기', nameEn: '(Water Temprature)', rows: [{ id: 'i2a', criterion: '60℃±10' }] },
    {
      id: 'i3',
      name: '압력 게이지',
      nameEn: '(Pressure gauge)',
      rows: [
        { id: 'i3a', criterion: '형체압력:100~150kg/cm²' },
        { id: 'i3b', criterion: '메인압력:100~150kg/cm²' }
      ]
    },
    { id: 'i4', name: '비상 스위치', nameEn: '(Emergency switch)', rows: [{ id: 'i4a', criterion: '정상적으로 작동하는가' }] },
    { id: 'i5', name: '금형온도 F/Proof', nameEn: '(Mold Temp F/proof)', rows: [{ id: 'i5a', criterion: '정상적으로 작동하는가' }] },
    { id: 'i6', name: '안전센서', nameEn: '(Safety Sensor)', rows: [{ id: 'i6a', criterion: '정상적으로 작동하는가' }] },
    { id: 'i7', name: '비상벨', nameEn: '(Emergency bell)', rows: [{ id: 'i7a', criterion: '정상적으로 작동하는가' }] }
  ]
});

// PE 열융착기 전용 TPM 점검 일지 템플릿
export const createHeatFusionTpmTemplate = () => ({
  legend: ['콘트롤판넬', '압력게이지', '', '', '', '', '', '', '', ''],
  weekly: Array.from({ length: 5 }, () => ({
    part: '설비',
    criterion: '설비, 금형작동에 이상없는가 ?'
  })),
  items: [
    {
      id: 'hf1',
      name: "CONT'L PANEL",
      nameEn: '',
      rows: [{ id: 'hf1a', criterion: 'PANEL 조건의 특이사항은 없는가 (출력값,온도)' }]
    },
    {
      id: 'hf2',
      name: '압력',
      nameEn: '',
      rows: [{ id: 'hf2a', criterion: '범위 : 0.5±0.1kg/cm²' }]
    },
    {
      id: 'hf3',
      name: '램프',
      nameEn: '',
      rows: [{ id: 'hf3a', criterion: '모든 램프 작동 이상 없는가' }]
    },
    {
      id: 'hf5',
      badgeText: '',
      name: '금형',
      nameEn: '',
      rows: [
        { id: 'hf5a', criterion: '1.금형의 청소상태는 양호한가' },
        { id: 'hf5b', criterion: '2.조인트상태는 양호한가(단차,눌림)' },
        { id: 'hf5c', criterion: '3.작업시 JOINT 필름의 녹는정도는 적당한가' },
        { id: 'hf5d', criterion: '4.금형의 좌우 밸런스는 적정한가' }
      ]
    }
  ]
});

// 22ton TPV 인젝션(사출기) 전용 TPM 점검 일지 템플릿
export const createTpv22TonTpmTemplate = () => ({
  layoutType: 'top_photo_strip',
  hideWeeklyAndLegend: true,
  topPhotos: [
    { badge: '①·④', label: '상.하 실린더 / 실린더 누유', src: TPV_22TON_STEP_PHOTOS[1], flex: 1.55 },
    { badge: '②', label: '모니터', src: TPV_22TON_STEP_PHOTOS[2], flex: 1.05 },
    { badge: '③', label: '압력계', src: TPV_22TON_STEP_PHOTOS[3], flex: 1 },
    { badge: '⑤', label: '동작 스위치', src: TPV_22TON_STEP_PHOTOS[5], flex: 1 },
    { badge: '⑥', label: '온도계 (호퍼드라이어)', src: TPV_22TON_STEP_PHOTOS[6], flex: 1.3 },
    { badge: '⑦', label: '전원판넬 (호퍼로더)', src: TPV_22TON_STEP_PHOTOS[7], flex: 1.05 },
    { badge: '⑧', label: '콤파운드 양 (호퍼로더)', src: TPV_22TON_STEP_PHOTOS[8], flex: 1.05 }
  ],
  legend: [
    '상.하 실린더',
    '모니터',
    '압력계',
    '실린더 누유',
    '동작 스위치',
    '온도계',
    '전원판넬',
    '콤파운드 양',
    '',
    ''
  ],
  weekly: Array.from({ length: 5 }, () => ({
    part: '',
    criterion: ''
  })),
  items: [
    {
      id: 'tpv1',
      category: '사출기',
      name: '상.하 실린더',
      nameEn: '',
      guidePhoto: TPV_22TON_STEP_PHOTOS[1],
      rows: [
        {
          id: 'tpv1a',
          criterion: '상하실린더 동작상태 확인할것\n- 상하작동상태 확인(작동센서 육안확인)'
        }
      ]
    },
    {
      id: 'tpv2',
      category: '사출기',
      name: '모니터',
      nameEn: '',
      guidePhoto: TPV_22TON_STEP_PHOTOS[2],
      rows: [
        {
          id: 'tpv2a',
          criterion: '조작판넬(모니터)는 정상적으로 작동되는가?\n- 모니터 스위치 수동으로 작동하면서 상태확인(육안)'
        }
      ]
    },
    {
      id: 'tpv3',
      category: '사출기',
      name: '압력계',
      nameEn: '',
      guidePhoto: TPV_22TON_STEP_PHOTOS[3],
      rows: [
        {
          id: 'tpv3a',
          criterion: '압력계는 정상적으로 작동되는가?\n- 압력표준: 0~120kgf/cm²'
        }
      ]
    },
    {
      id: 'tpv4',
      category: '사출기',
      name: '실린더 누유',
      nameEn: '',
      guidePhoto: TPV_22TON_STEP_PHOTOS[4],
      rows: [
        {
          id: 'tpv4a',
          criterion: '유압실린더 누유가 없는가?\n- 실린더 누유 상태확인 할 것(육안)'
        }
      ]
    },
    {
      id: 'tpv5',
      category: '사출기',
      name: '동작 스위치',
      nameEn: '',
      guidePhoto: TPV_22TON_STEP_PHOTOS[5],
      rows: [
        {
          id: 'tpv5a',
          criterion: '동작스위치는 정상으로 작동되는가?\n- 동작,비상스위치,수동작동 이상없을 것'
        }
      ]
    },
    {
      id: 'tpv6',
      category: '호퍼로더',
      name: '온도계',
      nameEn: '',
      guidePhoto: TPV_22TON_STEP_PHOTOS[6],
      rows: [
        {
          id: 'tpv6a',
          criterion: '온도계는 정상적으로 작동되는가?\n- 온도표준: 60~80℃'
        }
      ]
    },
    {
      id: 'tpv7',
      category: '호퍼로더',
      name: '전원판넬',
      nameEn: '',
      guidePhoto: TPV_22TON_STEP_PHOTOS[7],
      rows: [
        {
          id: 'tpv7a',
          criterion: '호파로더 전원은 정상적으로 작동하는가?\n- 전원스위치,송풍기,히터 전원확인'
        }
      ]
    },
    {
      id: 'tpv8',
      category: '호퍼로더',
      name: '콤파운드 양',
      nameEn: '',
      guidePhoto: TPV_22TON_STEP_PHOTOS[8],
      rows: [
        {
          id: 'tpv8a',
          criterion: '시업전(06시30분)콤파운드 MIN/MAX 상태 확인할 것\n- 콤파운드 보충 이상없을 것'
        }
      ]
    }
  ]
});

// 300ton TPV 인젝션(사출기) 전용 TPM 점검 일지 템플릿
export const createTpv300TonTpmTemplate = () => ({
  layoutType: 'top_photo_strip',
  hideWeeklyAndLegend: true,
  topPhotos: [
    { badge: '①·⑦', label: '상.하 실린더 / 실린더 누유', src: TPV_300TON_STEP_PHOTOS[1], flex: 1.35 },
    { badge: '②·⑥', label: '모니터 / 유량 게이지', src: TPV_300TON_STEP_PHOTOS[2], flex: 1.15 },
    { badge: '③', label: '베드센서', src: TPV_300TON_STEP_PHOTOS[3], flex: 1.15 },
    { badge: '④', label: '동작 스위치', src: TPV_300TON_STEP_PHOTOS[4], flex: 0.78 },
    { badge: '⑤', label: '유압 호스', src: TPV_300TON_STEP_PHOTOS[5], flex: 1.05 },
    { badge: '⑧', label: '압력계', src: TPV_300TON_STEP_PHOTOS[8], flex: 0.85 },
    { badge: '⑨', label: '온도계', src: TPV_300TON_STEP_PHOTOS[9], flex: 0.95 },
    { badge: '⑩', label: '전원판넬', src: TPV_300TON_STEP_PHOTOS[10], flex: 1.25 },
    { badge: '⑪', label: '콤파운드 양', src: TPV_300TON_STEP_PHOTOS[11], flex: 0.82 }
  ],
  legend: [
    '상.하 실린더',
    '모니터',
    '베드센서',
    '동작 스위치',
    '유압 호스',
    '유량 게이지',
    '실린더 누유',
    '압력계',
    '온도계',
    '전원판넬',
    '콤파운드 양'
  ],
  weekly: Array.from({ length: 5 }, () => ({
    part: '',
    criterion: ''
  })),
  items: [
    {
      id: 'tpv300_1',
      category: '사출기',
      name: '상.하 실린더',
      nameEn: '',
      guidePhoto: TPV_300TON_STEP_PHOTOS[1],
      rows: [
        {
          id: 'tpv300_1a',
          criterion: '상하실린더 동작상태 확인할것\n- 상하작동상태 확인(작동센서 육안확인)'
        }
      ]
    },
    {
      id: 'tpv300_2',
      category: '사출기',
      name: '모니터',
      nameEn: '',
      guidePhoto: TPV_300TON_STEP_PHOTOS[2],
      rows: [
        {
          id: 'tpv300_2a',
          criterion: '작동상태는 양호한가\n- 표시, 터치'
        }
      ]
    },
    {
      id: 'tpv300_3',
      category: '사출기',
      name: '베드센서',
      nameEn: '',
      guidePhoto: TPV_300TON_STEP_PHOTOS[3],
      rows: [
        {
          id: 'tpv300_3a',
          criterion: '베드 슬라이딩 센서 및 안전센서 동작상태 확인할 것\n-베드 슬라이딩 상태확인(작동센서 육안확인)'
        }
      ]
    },
    {
      id: 'tpv300_4',
      category: '사출기',
      name: '동작 스위치',
      nameEn: '',
      guidePhoto: TPV_300TON_STEP_PHOTOS[4],
      rows: [
        {
          id: 'tpv300_4a',
          criterion: '동작스위치는 정상으로 작동되는가?\n- 동작,비상스위치,수동작동 이상없을 것'
        }
      ]
    },
    {
      id: 'tpv300_5',
      category: '사출기',
      name: '유압 호스',
      nameEn: '',
      guidePhoto: TPV_300TON_STEP_PHOTOS[5],
      rows: [
        {
          id: 'tpv300_5a',
          criterion: '유압호스 누유가 발생하는가?\n- 카플링 체결 및 누유확인(육안)'
        }
      ]
    },
    {
      id: 'tpv300_6',
      category: '사출기',
      name: '유량 게이지',
      nameEn: '',
      guidePhoto: TPV_300TON_STEP_PHOTOS[6],
      rows: [
        {
          id: 'tpv300_6a',
          criterion: '유량은 넉넉하게 있는가?\n- 게이지 및 모니터 유량확인(육안)'
        }
      ]
    },
    {
      id: 'tpv300_7',
      category: '사출기',
      name: '실린더 누유',
      nameEn: '',
      guidePhoto: TPV_300TON_STEP_PHOTOS[7],
      rows: [
        {
          id: 'tpv300_7a',
          criterion: '유압실린더 누유가 없는가?\n- 실린더 누유 상태확인 할 것(육안)'
        }
      ]
    },
    {
      id: 'tpv300_8',
      category: '사출기',
      name: '압력계',
      nameEn: '',
      guidePhoto: TPV_300TON_STEP_PHOTOS[8],
      rows: [
        {
          id: 'tpv300_8a',
          criterion: '압력계는 정상적으로 작동되는가?\n- 압력표준: 0~240kgf/cm²'
        }
      ]
    },
    {
      id: 'tpv300_9',
      category: '호퍼로더',
      name: '온도계',
      nameEn: '',
      guidePhoto: TPV_300TON_STEP_PHOTOS[9],
      rows: [
        {
          id: 'tpv300_9a',
          criterion: '온도계는 정상적으로 작동되는가?\n- 온도표준: 60~80℃'
        }
      ]
    },
    {
      id: 'tpv300_10',
      category: '호퍼로더',
      name: '전원판넬',
      nameEn: '',
      guidePhoto: TPV_300TON_STEP_PHOTOS[10],
      rows: [
        {
          id: 'tpv300_10a',
          criterion: '호파로더 전원은 정상적으로 작동하는가?\n- 전원스위치,송풍기,히터 전원확인'
        }
      ]
    },
    {
      id: 'tpv300_11',
      category: '호퍼로더',
      name: '콤파운드 양',
      nameEn: '',
      guidePhoto: TPV_300TON_STEP_PHOTOS[11],
      rows: [
        {
          id: 'tpv300_11a',
          criterion: '시업전(06시30분)콤파운드 MIN/MAX 상태 확인할 것\n- 콤파운드 보충 이상없을 것'
        }
      ]
    }
  ]
});

// 11ton 유압 프레스 전용 TPM 점검 일지 템플릿
export const createHydraulicPress11TonTpmTemplate = () => ({
  legend: ['콘트롤판넬', '압력게이지', '비상스위치', '오일게이지', '안전센스', '비상벨', '', '', '', ''],
  weekly: Array.from({ length: 5 }, () => ({
    part: '오일게이지',
    criterion: '관리선(Max, Min)내에 있는가?'
  })),
  items: [
    {
      id: 'hp1',
      name: '콘드롤 판넬',
      nameEn: '(Control panel)',
      rows: [{ id: 'hp1a', criterion: '정상적으로 작동하는가' }]
    },
    {
      id: 'hp2',
      name: '에어유닛',
      nameEn: '(Air unit)',
      rows: [{ id: 'hp2a', criterion: '압력범위 : 5±1.5kg/cm²' }]
    },
    {
      id: 'hp3',
      name: '온조기',
      nameEn: '(Water Temprature)',
      rows: [{ id: 'hp3a', criterion: '60℃±10' }]
    },
    {
      id: 'hp4',
      name: '압력 게이지',
      nameEn: '(Pressure gage)',
      rows: [{ id: 'hp4a', criterion: '사출조건대비 정상적으로 작동하는가' }]
    },
    {
      id: 'hp5',
      name: '비상 스위치',
      nameEn: '(Emergency switch)',
      rows: [{ id: 'hp5a', criterion: '정상적으로 작동하는가' }]
    },
    {
      id: 'hp6',
      name: '오일 게이지',
      nameEn: '(Oil gage)',
      rows: [{ id: 'hp6a', criterion: '관리선내에 있는가' }]
    },
    {
      id: 'hp7',
      name: '안전센스',
      nameEn: '(Safety Sense)',
      rows: [{ id: 'hp7a', criterion: '정상적으로 작동하는가' }]
    },
    {
      id: 'hp8',
      name: '비상벨',
      nameEn: '(Emergency bell)',
      rows: [{ id: 'hp8a', criterion: '정상적으로 작동하는가' }]
    }
  ]
});

export const getBaseTpmTemplateForEquipment = (equipment) => {
  if (isHeatFusionEquipment(equipment)) return createHeatFusionTpmTemplate();
  if (isTpv22TonEquipment(equipment)) return createTpv22TonTpmTemplate();
  if (isTpv300TonEquipment(equipment)) return createTpv300TonTpmTemplate();
  if (isHydraulicPress11TonEquipment(equipment)) return createHydraulicPress11TonTpmTemplate();
  return createDefaultTpmTemplate();
};

export const createEmptyTpmLog = () => ({
  weekly: Array.from({ length: 5 }, () => ({ result: '', action: '', confirm: '' })),
  daily: {}, // { [rowId]: { [day]: 'O' | 'X' | '△' } }
  worker: {}, // { [day]: 작업자 확인(이름) }
  manager: {} // { [day]: 관리자 확인(이름) }
});

export const getTpmLogKey = (year, month) => `${year}${String(month).padStart(2, '0')}`;

export const normalizeTpmTemplate = (tpl, equipment = null) => {
  const base = getBaseTpmTemplateForEquipment(equipment);
  if (!tpl || !Array.isArray(tpl.items) || tpl.items.length === 0) return base;
  const legendLen = Math.max(10, tpl.legend?.length || 0, base.legend?.length || 10);
  const resolvedLayoutType = tpl.layoutType || base.layoutType;
  const resolvedHideWeekly = tpl.hideWeeklyAndLegend ?? base.hideWeeklyAndLegend;
  const resolvedTopPhotos = Array.isArray(tpl.topPhotos) && tpl.topPhotos.length > 0 ? tpl.topPhotos : base.topPhotos;
  return {
    ...(resolvedLayoutType ? { layoutType: resolvedLayoutType } : {}),
    ...(resolvedHideWeekly ? { hideWeeklyAndLegend: true } : {}),
    ...(Array.isArray(resolvedTopPhotos) && resolvedTopPhotos.length > 0 ? { topPhotos: resolvedTopPhotos } : {}),
    legend: Array.from({ length: legendLen }, (_, i) => (tpl.legend && tpl.legend[i]) || ''),
    weekly: Array.from({ length: 5 }, (_, i) => ({
      part: tpl.weekly?.[i]?.part ?? base.weekly[i].part,
      criterion: tpl.weekly?.[i]?.criterion ?? base.weekly[i].criterion
    })),
    items: tpl.items.map((it, idx) => {
      const baseItem = base.items?.find(b => b.id === it.id) || base.items?.[idx];
      const resolvedGuidePhoto = it.guidePhoto || baseItem?.guidePhoto;
      const resolvedCategory = it.category !== undefined ? it.category : baseItem?.category;
      return {
        id: it.id,
        ...(it.badgeText !== undefined ? { badgeText: it.badgeText } : {}),
        ...(resolvedCategory ? { category: resolvedCategory } : {}),
        ...(resolvedGuidePhoto ? { guidePhoto: resolvedGuidePhoto } : {}),
        name: it.name || '',
        nameEn: it.nameEn || '',
        rows: (it.rows || []).map(r => ({ id: r.id, criterion: r.criterion || '' }))
      };
    })
  };
};

export const normalizeTpmLog = (log) => {
  const empty = createEmptyTpmLog();
  if (!log) return empty;
  return {
    weekly: empty.weekly.map((w, i) => ({ ...w, ...(log.weekly?.[i] || {}) })),
    daily: log.daily ? { ...log.daily } : {},
    worker: log.worker ? { ...log.worker } : {},
    manager: log.manager ? { ...log.manager } : {}
  };
};

/**
 * 온조기 / 호퍼로더 온도계 항목 여부 판별
 * - 직접 타이핑이 아닌 기준값(예: 60℃±10, 60~80℃) 셋팅 스크롤 휠 방식으로 수치를 선택합니다.
 */
export const isWaterTempWheelRow = (row, item) => {
  if (
    row?.id === 'i2a' ||
    item?.id === 'i2' ||
    row?.id === 'hp3a' ||
    item?.id === 'hp3' ||
    row?.id === 'tpv6a' ||
    item?.id === 'tpv6' ||
    row?.id === 'tpv300_9a' ||
    item?.id === 'tpv300_9'
  ) {
    return true;
  }
  const partName = String(item?.name || '');
  const crit = String(row?.criterion || '');
  if (/온조기|온도계|water\s*temp/i.test(partName)) return true;
  if (/(?:℃|°C)/.test(crit) && !/형체\s*압력|메인\s*압력/.test(crit)) return true;
  return false;
};

/**
 * 압력(형체압력·메인압력·열융착기 압력·에어유닛 압력·사출기 압력계 등) 수치 선택 항목 여부 판별
 * - 범위/기준값 셋팅 스크롤 휠 방식 또는 X(이상) 선택을 사용합니다.
 */
export const isPressureValueRow = (row, item) => {
  if (!row) return false;
  if (
    row.id === 'i3a' ||
    row.id === 'i3b' ||
    row.id === 'hf2a' ||
    item?.id === 'hf2' ||
    row.id === 'hp2a' ||
    item?.id === 'hp2' ||
    row.id === 'tpv3a' ||
    item?.id === 'tpv3' ||
    row.id === 'tpv300_8a' ||
    item?.id === 'tpv300_8'
  ) {
    return true;
  }
  const crit = String(row.criterion || '');
  const partName = String(item?.name || '');
  if (/형체\s*압력|메인\s*압력/.test(crit)) return true;
  if ((/압력/.test(partName) || /압력/.test(crit)) && /kgf?\/(?:cm|㎠)|MPa|bar/i.test(crit)) return true;
  return false;
};

const countTokenDecimals = (token) => {
  const s = String(token || '');
  const idx = s.indexOf('.');
  return idx >= 0 ? s.length - idx - 1 : 0;
};

const roundWithDecimals = (val, decimals) =>
  decimals > 0 ? Number(Number(val).toFixed(decimals)) : Math.round(Number(val));

const snapWithStep = (val, step, decimals) => {
  const safeStep = step > 0 ? step : 1;
  const snapped = Math.round(Number(val) / safeStep) * safeStep;
  return roundWithDecimals(snapped, decimals);
};

export const getWheelRowShortLabel = (row, item) => {
  const crit = String(row?.criterion || '');
  if (crit.includes(':') && !crit.includes('\n')) {
    const prefix = crit.split(':')[0].trim();
    if (prefix && prefix !== '범위' && prefix !== '압력범위' && !/[?？]|표준/.test(prefix)) return prefix;
  }
  return String(item?.name || '').trim() || '점검항목';
};

/**
 * 점검기준 문자열(예: "60℃±10", "형체압력:100~150kg/cm²", "범위 : 0.5±0.1kg/cm²", "0~120kgf/cm²")에서
 * 스크롤 휠 기본값(기준/중간값)·범위·단위·스텝을 추출합니다.
 */
export const parseWheelSpecFromCriterion = (
  criterion,
  fallback = { defaultCenter: 60, tolerance: 10, minSpec: 50, maxSpec: 70, range: 30, step: 1, unit: '℃', centerLabel: '기준' }
) => {
  const crit = String(criterion || '');
  const detectedUnit = /kgf?\/(?:cm|㎠)/i.test(crit)
    ? 'kg/cm²'
    : (/(?:℃|°C)/.test(crit) ? '℃' : fallback.unit);

  // 1) 범위 형태 (예: "형체압력:100~150kg/cm²", "0.4~0.6kg/cm²") -> 중간값 셋팅
  const rangeMatch = crit.match(/(\d+(?:\.\d+)?)\s*[~∼]\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    const rawA = Number(rangeMatch[1]);
    const rawB = Number(rangeMatch[2]);
    if (Number.isFinite(rawA) && Number.isFinite(rawB)) {
      const decimals = Math.min(2, Math.max(countTokenDecimals(rangeMatch[1]), countTokenDecimals(rangeMatch[2])));
      const step = decimals > 0 ? Number(Math.pow(10, -decimals).toFixed(decimals)) : 1;
      const minSpec = roundWithDecimals(Math.min(rawA, rawB), decimals);
      const maxSpec = roundWithDecimals(Math.max(rawA, rawB), decimals);
      const midpoint = snapWithStep((minSpec + maxSpec) / 2, step, decimals);
      const halfSpan = decimals > 0
        ? roundWithDecimals(Math.max(step, (maxSpec - minSpec) / 2), decimals)
        : Math.max(5, Math.round((maxSpec - minSpec) / 2));
      const rangeVal = decimals > 0
        ? roundWithDecimals(Math.max(step * 5, (maxSpec - minSpec) * 1.5), decimals)
        : Math.max(40, maxSpec - minSpec);
      return {
        defaultCenter: midpoint,
        tolerance: halfSpan,
        minSpec,
        maxSpec,
        range: rangeVal,
        step,
        unit: detectedUnit,
        centerLabel: '기본'
      };
    }
  }

  // 2) 기준 ± 공차 형태 (예: "60℃±10", "범위 : 0.5±0.1kg/cm²") -> 기준값 셋팅
  const tolMatch = crit.match(/(-?\d+(?:\.\d+)?)\s*(?:℃|°C|도)?\s*(?:[±+-]\s*(\d+(?:\.\d+)?))?/i);
  if (tolMatch) {
    const decimals = Math.min(2, Math.max(countTokenDecimals(tolMatch[1]), countTokenDecimals(tolMatch[2])));
    const step = decimals > 0 ? Number(Math.pow(10, -decimals).toFixed(decimals)) : 1;
    const center = snapWithStep(Number(tolMatch[1]), step, decimals);
    const tol = tolMatch[2] !== undefined
      ? snapWithStep(Number(tolMatch[2]), step, decimals)
      : fallback.tolerance;
    if (Number.isFinite(center)) {
      const safeTol = Number.isFinite(tol) ? tol : fallback.tolerance;
      const rangeVal = decimals > 0
        ? roundWithDecimals(Math.max(step * 5, safeTol * 5), decimals)
        : Math.max(30, safeTol * 3);
      return {
        defaultCenter: center,
        tolerance: safeTol,
        minSpec: roundWithDecimals(center - safeTol, decimals),
        maxSpec: roundWithDecimals(center + safeTol, decimals),
        range: rangeVal,
        step,
        unit: detectedUnit,
        centerLabel: '기준'
      };
    }
  }

  return { step: 1, ...fallback, unit: detectedUnit };
};

/**
 * 행(row, item)에 해당하는 스크롤 휠 스펙을 반환합니다.
 */
export const getRowWheelSpec = (row, item) => {
  if (isPressureValueRow(row, item)) {
    return parseWheelSpecFromCriterion(row?.criterion, {
      defaultCenter: 125,
      tolerance: 25,
      minSpec: 100,
      maxSpec: 150,
      range: 50,
      step: 1,
      unit: 'kg/cm²',
      centerLabel: '기본'
    });
  }
  if (isWaterTempWheelRow(row, item)) {
    return parseWheelSpecFromCriterion(row?.criterion, {
      defaultCenter: 60,
      tolerance: 10,
      minSpec: 50,
      maxSpec: 70,
      range: 30,
      step: 1,
      unit: '℃',
      centerLabel: '기준'
    });
  }
  return null;
};

/**
 * 셋트 내 여러 설비의 TPM 템플릿을 항목별 질문 단위로 묶어 반환합니다.
 * - 동일한 부위·점검기준 질문은 하나의 단계로 통합되어 설비 1..N 을 한 화면에서 체크합니다.
 */
export const buildGroupedTpmQuestions = (equipments = [], weekIndex = 0) => {
  const targetEquipments = (equipments || []).filter(hasEquipmentTpmLog);
  if (targetEquipments.length === 0) return [];

  const questionMap = new Map();
  const orderedQuestions = [];

  targetEquipments.forEach((eq) => {
    const tpl = normalizeTpmTemplate(eq.tpmTemplate, eq);
    const eqGuidePhoto = eq.tpmPhoto || getDefaultTpmPhotoForEquipment(eq);
    tpl.items.forEach((item, itemIdx) => {
      const totalRows = item.rows.length;
      const resolvedBadge = item.badgeText !== undefined
        ? String(item.badgeText)
        : (TPM_CIRCLED_NUMBERS[itemIdx] || `${itemIdx + 1}`);
      const normalizePartKey = (s) =>
        String(s || '')
          .replace(/\s+/g, '')
          .replace(/콘드롤/g, '콘트롤')
          .replace(/센서/g, '센스')
          .replace(/^cont'?lpanel$/i, '콘트롤판넬');
      const cleanN = normalizePartKey(item.name);
      const matchedLegendIdx = tpl.legend.findIndex((l) => {
        const cleanL = normalizePartKey(l);
        return cleanL && cleanN && (cleanL === cleanN || cleanL.includes(cleanN) || cleanN.includes(cleanL));
      });
      const resolvedGuideIdx = matchedLegendIdx >= 0 ? matchedLegendIdx : -1;

      item.rows.forEach((row, rowIdx) => {
        const groupKey = `daily::${item.name.trim()}::${row.criterion.trim()}`;
        const rowWheelSpec = getRowWheelSpec(row, item);
        const nextMode = rowWheelSpec ? 'wheel_number' : 'mark';
        const itemGuidePhoto = item.guidePhoto || eqGuidePhoto;
        let q = questionMap.get(groupKey);
        if (!q) {
          q = {
            key: groupKey,
            kind: 'daily',
            inputMode: nextMode,
            wheelSpec: rowWheelSpec,
            badgeNumber: resolvedBadge,
            guideIndex: resolvedGuideIdx, // 0-based -> on photo legend
            guidePhoto: itemGuidePhoto,
            hasStepSpecificPhoto: Boolean(item.guidePhoto),
            guideLegend: tpl.legend,
            partName: item.name,
            partNameEn: item.category ? `[${item.category}]` : (item.nameEn || ''),
            shortLabel: getWheelRowShortLabel(row, item),
            subStepLabel: totalRows > 1 ? `${rowIdx + 1}/${totalRows}` : '',
            criterion: row.criterion,
            targets: []
          };
          questionMap.set(groupKey, q);
          orderedQuestions.push(q);
        } else if (nextMode !== 'mark' && q.inputMode === 'mark') {
          q.inputMode = nextMode;
          if (rowWheelSpec && !q.wheelSpec) {
            q.wheelSpec = rowWheelSpec;
          }
        }
        q.targets.push({
          eqId: eq.id,
          eqCode: eq.code,
          eqName: eq.name,
          rowId: row.id
        });
      });
    });
  });

  // 주간 점검 기록 (해당 주차: 제1주~제5주) 질문 추가
  const safeWeekIdx = Math.max(0, Math.min(4, weekIndex));
  const weeklyMap = new Map();
  targetEquipments.forEach((eq) => {
    const tpl = normalizeTpmTemplate(eq.tpmTemplate, eq);
    if (tpl.hideWeeklyAndLegend) return;
    const eqGuidePhoto = eq.tpmPhoto || getDefaultTpmPhotoForEquipment(eq);
    const w = tpl.weekly[safeWeekIdx] || tpl.weekly[0] || { part: '설비', criterion: '설비, 금형작동에 이상없는가 ?' };
    const groupKey = `weekly::${safeWeekIdx}::${w.part.trim()}::${w.criterion.trim()}`;
    let q = weeklyMap.get(groupKey);
    if (!q) {
      const isLowerGauge = String(w.criterion || '').includes('설비하단');
      const legendIdx = isLowerGauge
        ? -1
        : tpl.legend.findIndex(l => l && w.part && l.replace(/\s+/g, '') === w.part.replace(/\s+/g, ''));
      q = {
        key: groupKey,
        kind: 'weekly',
        weekIndex: safeWeekIdx,
        badgeNumber: `제${safeWeekIdx + 1}주`,
        guideIndex: legendIdx >= 0 ? legendIdx : -1,
        guidePhoto: eqGuidePhoto,
        guideLegend: tpl.legend,
        partName: `${w.part} (주간점검)`,
        partNameEn: `제(${safeWeekIdx + 1})주 주간 점검 기록`,
        subStepLabel: '',
        criterion: w.criterion,
        targets: []
      };
      weeklyMap.set(groupKey, q);
      orderedQuestions.push(q);
    }
    q.targets.push({
      eqId: eq.id,
      eqCode: eq.code,
      eqName: eq.name,
      weekIndex: safeWeekIdx
    });
  });

  return orderedQuestions;
};

export const TPM_MANAGER_STAMP_STORAGE_KEY = 'jymes_tpm_manager_stamp';

export const getSavedManagerStamp = (fallbackName = '') => {
  try {
    const saved = window.localStorage.getItem(TPM_MANAGER_STAMP_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {
    // ignore storage errors
  }
  const cleanFallback = String(fallbackName || '').trim();
  if (cleanFallback && cleanFallback !== '관리자') return cleanFallback;
  return '확인';
};

export const saveManagerStamp = (stampValue) => {
  const trimmed = String(stampValue || '').trim();
  try {
    if (trimmed) {
      window.localStorage.setItem(TPM_MANAGER_STAMP_STORAGE_KEY, trimmed);
    }
  } catch {
    // ignore storage errors
  }
  return trimmed || '확인';
};

/**
 * 특정 설비의 지정 일자(year, month, day) TPM 점검 상태 및 이상 유무를 평가합니다.
 * - status:
 *   'unchecked'       : 작업자 점검 기록 없음 (미가동/미작성)
 *   'issue_pending'   : 이상(X/△/기준이탈) 있음 & 관리자 미확인
 *   'issue_confirmed' : 이상(X/△/기준이탈) 있음 & 관리자 확인 완료
 *   'pending'         : 정상 점검 완료 & 관리자 미확인
 *   'confirmed'       : 정상 점검 완료 & 관리자 확인 완료
 */
export const evaluateEquipmentDayTpm = (equipment, year, month, day, overrideLogKey = null) => {
  const tpl = normalizeTpmTemplate(equipment?.tpmTemplate, equipment);
  const logKey = overrideLogKey || getTpmLogKey(year, month);
  const monthLog = equipment?.tpmLogs?.[logKey] || null;

  const allRows = [];
  (tpl.items || []).forEach((item) => {
    (item.rows || []).forEach((row) => {
      allRows.push({
        item,
        row,
        wheelSpec: getRowWheelSpec(row, item)
      });
    });
  });

  let checkedCount = 0;
  const issues = [];
  const numericHighlights = [];

  allRows.forEach(({ item, row, wheelSpec }) => {
    const rawVal = monthLog?.daily?.[row.id]?.[day];
    const val = rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : '';
    if (!val) return;

    checkedCount += 1;
    const shortPart = getWheelRowShortLabel(row, item);

    if (val === 'X') {
      issues.push({ type: 'X', label: `${shortPart}: X(이상)` });
    } else if (val === '△') {
      issues.push({ type: '△', label: `${shortPart}: △(수리)` });
    } else if (wheelSpec && val !== 'O') {
      const num = Number(val);
      if (Number.isFinite(num)) {
        if (num < wheelSpec.minSpec || num > wheelSpec.maxSpec) {
          issues.push({
            type: 'OUT_OF_SPEC',
            label: `${shortPart}: ${val}${wheelSpec.unit}(기준이탈)`
          });
        } else {
          numericHighlights.push(`${shortPart} ${val}${wheelSpec.unit}`);
        }
      }
    }
  });

  const workerStamp = String(monthLog?.worker?.[day] ?? '').trim();
  const managerStamp = String(monthLog?.manager?.[day] ?? '').trim();
  const hasWorkerRecord = Boolean(workerStamp) || checkedCount > 0;

  let status = 'unchecked';
  if (!hasWorkerRecord) {
    status = 'unchecked';
  } else if (issues.length > 0) {
    status = managerStamp ? 'issue_confirmed' : 'issue_pending';
  } else {
    status = managerStamp ? 'confirmed' : 'pending';
  }

  return {
    logKey,
    totalRows: allRows.length,
    checkedCount,
    workerStamp,
    managerStamp,
    hasWorkerRecord,
    issues,
    numericHighlights,
    status
  };
};

/**
 * 단일 설비의 tpmLogs 전체 월 데이터를 스캔하여
 * 작업자 점검 기록은 있으나 관리자 확인(managerStamp)이 완료되지 않은
 * 모든 미승인(미확인) 일지 항목을 수집합니다.
 */
export const collectUnapprovedEquipmentTpmLogs = (equipment) => {
  const logsMap = equipment?.tpmLogs;
  if (!logsMap || typeof logsMap !== 'object') return [];

  const entries = [];

  Object.entries(logsMap).forEach(([rawKey, monthLog]) => {
    if (!monthLog || typeof monthLog !== 'object') return;
    const keyMatch = String(rawKey).trim().match(/^(\d{4})-?(\d{1,2})$/);
    if (!keyMatch) return;

    const year = Number(keyMatch[1]);
    const month = Number(keyMatch[2]);
    if (!year || month < 1 || month > 12) return;

    const candidateDays = new Set();

    if (monthLog.worker && typeof monthLog.worker === 'object') {
      Object.entries(monthLog.worker).forEach(([dKey, val]) => {
        if (String(val ?? '').trim() !== '') {
          const d = Number(dKey);
          if (Number.isInteger(d) && d >= 1 && d <= 31) candidateDays.add(d);
        }
      });
    }

    if (monthLog.daily && typeof monthLog.daily === 'object') {
      Object.values(monthLog.daily).forEach((rowMap) => {
        if (!rowMap || typeof rowMap !== 'object') return;
        Object.entries(rowMap).forEach(([dKey, val]) => {
          if (String(val ?? '').trim() !== '') {
            const d = Number(dKey);
            if (Number.isInteger(d) && d >= 1 && d <= 31) candidateDays.add(d);
          }
        });
      });
    }

    candidateDays.forEach((day) => {
      const mgrStamp = String(monthLog?.manager?.[day] ?? '').trim();
      if (mgrStamp) return;

      const evalResult = evaluateEquipmentDayTpm(equipment, year, month, day, rawKey);
      if (evalResult.hasWorkerRecord && !evalResult.managerStamp) {
        const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        entries.push({
          year,
          month,
          day,
          date,
          logKey: rawKey,
          evalResult
        });
      }
    });
  });

  entries.sort((a, b) => a.date.localeCompare(b.date));
  return entries;
};
