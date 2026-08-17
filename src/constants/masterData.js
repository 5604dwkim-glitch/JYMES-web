/**
 * 50인 제조업체 공정별 작업일보 관리 시스템 - Data Store (Refactored)
 * (마스터 데이터 및 반장 일보/근태 공통 상수를 일원화 관리)
 */


// [공통 마스터] 1단계 제조사 및 2단계 세부 차종 마스터 맵
export const MANUFACTURERS = [
  {
    name: '제네시스(Genesis)',
    models: [
      { code: 'JG1', name: 'JG1(스윙도어)' },
      { code: 'JG1S', name: 'JG1S(코치도어)' }
    ]
  },
  {
    name: '현대(HMC)',
    models: [
      { code: 'NE1a', name: 'NE1a' },
      { code: 'ME1a', name: 'ME1a' }
    ]
  },
  {
    name: '기아(KMC)',
    models: [
      { code: 'OV1K', name: 'OV1K' },
      { code: 'LQ2a', name: 'LQ2a' },
      { code: 'MV1a', name: 'MV1a' }
    ]
  },
  {
    name: '스텔란티스(Stellantis)',
    models: [
      { code: 'DT CREW', name: 'DT CREW' },
      { code: 'DT QUAD', name: 'DT QUAD' },
      { code: 'DS CREW', name: 'DS CREW' },
      { code: 'DS STD', name: 'DS STD' },
      { code: 'KM/KX', name: 'KM/KX' }
    ]
  },
  {
    name: '지엠(GM)',
    models: [
      { code: '9BQC', name: '9BQC' }
    ]
  },
  {
    name: '르노(Renault)',
    models: [
      { code: 'P417', name: 'P417' }
    ]
  }
];

export const CAR_MODELS = MANUFACTURERS.flatMap(m => m.models);

// [공통 마스터] 차종별 3단계 세부 부품 목록 (JG1 우선 적용, 향후 확장)
export const CAR_MODEL_PARTS = {
  'JG1': [
    { code: '인벨트', name: '인벨트' },
    { code: "RR C PART'G", name: "RR C PART'G" },
    { code: "G/RUN 'E'", name: "G/RUN 'E'" }
  ],
  'JG1S': [
    { code: '인벨트', name: '인벨트' },
    { code: "G/RUN 'E'", name: "G/RUN 'E'" }
  ],
  'NE1a': [
    { code: 'D/SIDE', name: 'D/SIDE' }
  ],
  'ME1a': [
    { code: "PART'G", name: "PART'G" }
  ],
  'OV1K': [
    { code: 'PTG', name: 'PTG' },
    { code: 'FRUNK', name: 'FRUNK' }
  ],
  'LQ2a': [
    { code: 'HOOD SIDE', name: 'HOOD SIDE' }
  ],
  'MV1a': [
    { code: 'PTG', name: 'PTG' }
  ],
  'DT CREW': [
    { code: 'D/SIDE', name: 'D/SIDE' }
  ],
  'DT QUAD': [
    { code: 'D/SIDE', name: 'D/SIDE' }
  ],
  'DS CREW': [
    { code: 'D/SIDE', name: 'D/SIDE' }
  ],
  'DS STD': [
    { code: 'D/SIDE', name: 'D/SIDE' }
  ],
  'KM/KX': [
    { code: 'HOOD SURROUND', name: 'HOOD SURROUND' }
  ],
  '9BQC': [
    { code: 'G/RUN', name: 'G/RUN' }
  ],
  'P417': [
    { code: 'UPR', name: 'UPR' }
  ]
};


export const DEFAULT_PROCESSES = [
  { id: 'PROC_CLIP', name: '클립머신', code: 'CLIP', lines: ['1라인'], leadTimeMinutes: 25, manager: '김진경' },
  { id: 'PROC_PREP', name: '소재준비', code: 'PREP', lines: ['1라인'], leadTimeMinutes: 30, manager: '김철수' },
  { id: 'PROC_JOIN', name: '조인트', code: 'JOIN', lines: ['1라인'], leadTimeMinutes: 40, manager: '정성훈' },
  { id: 'PROC_POST', name: '후가공', code: 'POST', lines: ['1라인'], leadTimeMinutes: 45, manager: '이영호' },
  { id: 'PROC_INSP', name: '검사포장', code: 'INSP', lines: ['1라인'], leadTimeMinutes: 20, manager: '장수미' }
];

export const DEFAULT_ITEMS = [
  { carModel: 'JG1', code: '인벨트', name: '인벨트', unit: 'EA', targetCycleTimeSec: 45 },
  { carModel: 'JG1', code: `G/RUN 'E'`, name: `G/RUN 'E'`, unit: 'EA', targetCycleTimeSec: 45 },
  
  { carModel: 'JG1S', code: '인벨트', name: '인벨트', unit: 'EA', targetCycleTimeSec: 45 },
  { carModel: 'JG1S', code: `G/RUN 'E'`, name: `G/RUN 'E'`, unit: 'EA', targetCycleTimeSec: 45 },
  
  { carModel: 'DT CREW', code: 'DT CREW LH', name: 'DT CREW LH', unit: 'EA', targetCycleTimeSec: 48 },
  { carModel: 'DT CREW', code: 'DT CREW RH', name: 'DT CREW RH', unit: 'EA', targetCycleTimeSec: 48 },
  { carModel: 'DT QUAD', code: 'DT QUAD LH', name: 'DT QUAD LH', unit: 'EA', targetCycleTimeSec: 52 },
  { carModel: 'DT QUAD', code: 'DT QUAD RH', name: 'DT QUAD RH', unit: 'EA', targetCycleTimeSec: 52 },
  { carModel: 'DS CREW', code: 'DS CREW LH', name: 'DS CREW LH', unit: 'EA', targetCycleTimeSec: 45 },
  { carModel: 'DS CREW', code: 'DS CREW RH', name: 'DS CREW RH', unit: 'EA', targetCycleTimeSec: 45 },
  { carModel: 'DS STD', code: 'DS STD LH', name: 'DS STD LH', unit: 'EA', targetCycleTimeSec: 40 },
  { carModel: 'DS STD', code: 'DS STD RH', name: 'DS STD RH', unit: 'EA', targetCycleTimeSec: 40 },
  { carModel: 'KM/KX', code: 'KM/KX Hood', name: 'KM/KX Hood', unit: 'EA', targetCycleTimeSec: 55 },
  { carModel: 'NE1a', code: 'NE1a D/SIDE', name: 'NE1a D/SIDE', unit: 'EA', targetCycleTimeSec: 50 },
  { carModel: 'OV1K', code: 'KM/KX Hood', name: 'KM/KX Hood', unit: 'EA', targetCycleTimeSec: 55 },
  { carModel: 'MV1a', code: 'MV1a-01', name: 'MV1a 웨더스트립', unit: 'EA', targetCycleTimeSec: 45 },
  { carModel: 'ME1a', code: 'ME1a-01', name: 'ME1a 웨더스트립', unit: 'EA', targetCycleTimeSec: 45 },
  { carModel: '9BQC', code: '9BQC-01', name: '9BQC 웨더스트립', unit: 'EA', targetCycleTimeSec: 45 },
  { carModel: 'P417', code: 'P417-01', name: 'P417 웨더스트립', unit: 'EA', targetCycleTimeSec: 45 },
  { carModel: 'LQ2a', code: 'LQ2a-01', name: 'LQ2a 웨더스트립', unit: 'EA', targetCycleTimeSec: 45 }
];

// [공통 마스터] 장수미 반장 작업일보 (HSC-DT-005) 10대 기본 지정 아이템 목록
export const DEFAULT_LEADER_ITEMS = [
  { seq: 1, name: 'DS CREW LH', packedQty: '', scrapA: '', scrapB: '', scrapC: '', scrapD: '' },
  { seq: 2, name: 'DS CREW RH', packedQty: '', scrapA: '', scrapB: '', scrapC: '', scrapD: '' },
  { seq: 3, name: 'DS STD LH', packedQty: '', scrapA: '', scrapB: '', scrapC: '' },
  { seq: 4, name: 'DS STD RH', packedQty: '', scrapA: '', scrapB: '', scrapC: '' },
  { seq: 5, name: 'DT CREW LH', packedQty: '', scrapA: '', scrapB: '', scrapC: '' },
  { seq: 6, name: 'DT CREW RH', packedQty: '', scrapA: '', scrapB: '', scrapC: '' },
  { seq: 7, name: 'DT QUAD LH', packedQty: '', scrapA: '', scrapB: '', scrapC: '' },
  { seq: 8, name: 'DT QUAD RH', packedQty: '', scrapA: '', scrapB: '', scrapC: '' },
  { seq: 9, name: 'KM/KX Hood', packedQty: '', scrapCenter: '', scrapSide: '' }
];

// [공통 마스터] 근태 현황 기본 객체 구조 (총원, 출근, 결근 및 하단 연차/병가/반차 수량)
export const DEFAULT_ATTENDANCE = {
  total: 50,
  present: 48,
  absent: 2,
  annualLeave: 1,
  sickLeave: 0,
  halfLeave: 1,
  reason: '연차 1명, 반차 1명'
};

export const ATTENDANCE_REASONS = ['연차', '병가', '반차', '병가조퇴', '전원 정상출근'];

export const DEFECT_TYPES = [
  { id: 'DEF_VULC', name: '소재 가황/배합 불량' },
  { id: 'DEF_DIM', name: '후가공 치수/절단 오차' },
  { id: 'DEF_MOLD', name: '조인트 사출 미성형/크랙' },
  { id: 'DEF_COAT', name: '표면 코팅/테이프 박리' },
  { id: 'DEF_PUNCH', name: '노칭/펀칭 이탈' },
  { id: 'DEF_INSP', name: '검사 포장 외관/클립 누락' }
];

export const DOWNTIME_REASONS = [
  { id: 'DOWN_DEFECT', name: '소재 불량' },
  { id: 'DOWN_EQUIP', name: '설비 고장' },
  { id: 'DOWN_NOMAT', name: '소재 없음' }
];

export function generate50Workers() {
  const lastNames = ['김', '이', '박', '최', '정', '강', '조', '윤', '장', '임', '한', '오', '서', '신', '권', '황', '안', '송', '류', '홍'];
  const firstNames = ['민준', '서준', '도윤', '예준', '시우', '하준', '주원', '지호', '지후', '준서', '준우', '현우', '도현', '지훈', '건우', '우진', '선우', '서진', '민재', '현준', '연우', '유준', '정우', '승우', '승현', '시현', '지섭', '태웅', '재원', '수현'];
  
  const processes = DEFAULT_PROCESSES.map(p => p.name);
  const roles = ['작업자', '작업자', '작업자', '작업자', '라인 반장', '직장'];

  const workers = [
    {
      id: 'JY12001',
      name: '김금옥',
      role: '사원',
      dept: '생산팀',
      process: '후가공',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2012-10-23',
      shift: '주간'
    },
    {
      id: 'JY12002',
      name: '김용자',
      role: '사원',
      dept: '생산팀',
      process: '후가공',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2012-11-12',
      shift: '주간'
    },
    {
      id: 'JY12003',
      name: '오상민',
      role: '선임',
      dept: '관리팀',
      process: '관리',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2012-11-19',
      shift: '주간'
    },
    {
      id: 'JY13001',
      name: '정인순',
      role: '사원',
      dept: '생산팀',
      process: '후가공',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2013-04-15',
      shift: '주간'
    },
    {
      id: 'JY13002',
      name: '김동욱',
      role: '책임',
      dept: '관리팀',
      process: '관리',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2013-06-01',
      shift: '주간'
    },
    {
      id: 'JY13003',
      name: '양은주',
      role: '사원',
      dept: '생산팀',
      process: '후가공',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2013-06-05',
      shift: '주간'
    },
    {
      id: 'JY13004',
      name: '장수미',
      role: '반장',
      dept: '생산팀',
      process: '검사',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2013-06-12',
      shift: '주간'
    },
    {
      id: 'JY14001',
      name: '오미해',
      role: '사원',
      dept: '품질팀',
      process: '검사',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2014-08-18',
      shift: '주간'
    },
    {
      id: 'JY14002',
      name: '김진숙',
      role: '사원',
      dept: '품질팀',
      process: '검사',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2014-09-15',
      shift: '주간'
    },
    {
      id: 'JY15001',
      name: '박정화',
      role: '사원',
      dept: '생산팀',
      process: '후가공',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2015-03-30',
      shift: '주간'
    },
    {
      id: 'JY15002',
      name: '서윤엽',
      role: '사원',
      dept: '품질팀',
      process: '검사',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2015-06-30',
      shift: '주간'
    },
    {
      id: 'JY15003',
      name: '김은경',
      role: '사원',
      dept: '생산팀',
      process: '조인트',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2015-08-11',
      shift: '주간'
    },
    {
      id: 'JY15004',
      name: '장윤형',
      role: '사원',
      dept: '품질팀',
      process: '검사',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2015-10-15',
      shift: '주간'
    },
    {
      id: 'JY16001',
      name: '김창희',
      role: '사원',
      dept: '품질팀',
      process: '검사',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2016-11-03',
      shift: '주간'
    },
    {
      id: 'JY16002',
      name: '김진경',
      role: '사원',
      dept: '생산팀',
      process: '소재준비',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2016-12-01',
      shift: '주간'
    },
    {
      id: 'JY17001',
      name: '곽은진',
      role: '사원',
      dept: '생산팀',
      process: '후가공',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2017-04-24',
      shift: '주간'
    },
    {
      id: 'JY17002',
      name: '조은애',
      role: '사원',
      dept: '생산팀',
      process: '후가공',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2017-09-13',
      shift: '주간'
    },
    {
      id: 'JY17003',
      name: '라밀',
      role: '사원',
      dept: '생산팀',
      process: '조인트',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2017-11-03',
      shift: '주간'
    },
    {
      id: 'JY18001',
      name: '윤의정',
      role: '사원',
      dept: '생산팀',
      process: '소재준비',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2018-07-03',
      shift: '주간'
    },
    {
      id: 'JY18002',
      name: '다렌',
      role: '사원',
      dept: '생산팀',
      process: '조인트',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2018-08-20',
      shift: '주간'
    },
    {
      id: 'JY19001',
      name: '박미진',
      role: '사원',
      dept: '품질팀',
      process: '검사',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2019-05-20',
      shift: '주간'
    },
    {
      id: 'JY20001',
      name: '김린',
      role: '사원',
      dept: '생산팀',
      process: '후가공',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2020-06-01',
      shift: '주간'
    },
    {
      id: 'JY22001',
      name: '리차드',
      role: '사원',
      dept: '생산팀',
      process: '조인트',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2022-01-01',
      shift: '주간'
    },
    {
      id: 'JY22002',
      name: '김계연',
      role: '사원',
      dept: '생산팀',
      process: '후가공',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2022-07-11',
      shift: '주간'
    },
    {
      id: 'JY22003',
      name: '준',
      role: '사원',
      dept: '생산팀',
      process: '생산지원',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2022-12-19',
      shift: '주간'
    },
    {
      id: 'JY23001',
      name: '로나',
      role: '사원',
      dept: '생산팀',
      process: '후가공',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2023-01-04',
      shift: '주간'
    },
    {
      id: 'JY23002',
      name: '벤',
      role: '사원',
      dept: '생산팀',
      process: '조인트',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2023-05-04',
      shift: '주간'
    },
    {
      id: 'JY23003',
      name: '이말숙',
      role: '사원',
      dept: '생산팀',
      process: '소재준비',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2023-07-01',
      shift: '주간'
    },
    {
      id: 'JY23004',
      name: '이은숙',
      role: '사원',
      dept: '생산팀',
      process: '조인트',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2023-07-02',
      shift: '주간'
    },
    {
      id: 'JY23005',
      name: '김다혜',
      role: '사원',
      dept: '생산팀',
      process: '후가공',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2023-07-17',
      shift: '주간'
    },
    {
      id: 'JY23006',
      name: '르엉',
      role: '사원',
      dept: '생산팀',
      process: '후가공',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2023-07-17',
      shift: '주간'
    },
    {
      id: 'JY24001',
      name: '제이',
      role: '사원',
      dept: '생산팀',
      process: '조인트',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2024-07-01',
      shift: '주간'
    },
    {
      id: 'JY24002',
      name: '구다혜',
      role: '사원',
      dept: '생산팀',
      process: '후가공',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2024-08-12',
      shift: '주간'
    },
    {
      id: 'JY24003',
      name: '수니아',
      role: '사원',
      dept: '생산팀',
      process: '후가공',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2024-09-02',
      shift: '주간'
    },
    {
      id: 'JY24004',
      name: '유리',
      role: '사원',
      dept: '생산팀',
      process: '생산지원',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2024-09-02',
      shift: '주간'
    },
    {
      id: 'JY24005',
      name: '우창용',
      role: '선임',
      dept: '관리팀',
      process: '관리',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2024-09-09',
      shift: '주간'
    },
    {
      id: 'JY24006',
      name: '웨인',
      role: '사원',
      dept: '생산팀',
      process: '조인트',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2024-10-02',
      shift: '주간'
    },
    {
      id: 'JY24007',
      name: '래리',
      role: '사원',
      dept: '생산팀',
      process: '소재준비',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2024-11-18',
      shift: '주간'
    },
    {
      id: 'JY25001',
      name: '바네사',
      role: '사원',
      dept: '생산팀',
      process: '조인트',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2025-03-17',
      shift: '주간'
    },
    {
      id: 'JY25002',
      name: '우수진',
      role: '사원',
      dept: '생산팀',
      process: '후가공',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2025-04-02',
      shift: '주간'
    },
    {
      id: 'JY25003',
      name: '미',
      role: '사원',
      dept: '생산팀',
      process: '후가공',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2025-08-04',
      shift: '주간'
    },
    {
      id: 'JY25004',
      name: '조엘',
      role: '사원',
      dept: '생산팀',
      process: '조인트',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2025-09-01',
      shift: '주간'
    },
    {
      id: 'JY25005',
      name: '조나스',
      role: '사원',
      dept: '생산팀',
      process: '조인트',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2025-10-13',
      shift: '주간'
    },
    {
      id: 'JY26001',
      name: '제롬',
      role: '사원',
      dept: '생산팀',
      process: '조인트',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2026-01-02',
      shift: '주간'
    },
    {
      id: 'JY26002',
      name: '콰이',
      role: '사원',
      dept: '생산팀',
      process: '후가공',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2026-03-11',
      shift: '주간'
    },
    {
      id: 'JY26003',
      name: '안',
      role: '사원',
      dept: '생산팀',
      process: '조인트',
      status: '근무중',
      phone: '010-0000-0000',
      hireDate: '2026-07-13',
      shift: '주간'
    },
  ];

  return workers;
}

export function generateSampleReports(workers) {
  const reports = [];
  const today = new Date();
  let reportIdCounter = 1001;

  for (let d = 25; d >= 0; d--) {
    const dateObj = new Date(today);
    dateObj.setDate(today.getDate() - d);
    const dateStr = dateObj.toISOString().split('T')[0];

    if (dateObj.getDay() === 0) continue;

    CAR_MODELS.forEach((car) => {
      DEFAULT_PROCESSES.forEach((proc) => {
        if (Math.random() < 0.35) return;

        const carItems = DEFAULT_ITEMS.filter(it => it.carModel === car.code);
        const item = carItems[Math.floor(Math.random() * carItems.length)] || DEFAULT_ITEMS[0];

        const primaryWorker = (proc.name === '검사포장' && Math.random() < 0.7) ? 
          workers.find(w => w.name === '장수미') : 
          (proc.name === '클립머신' && Math.random() < 0.8 ? workers.find(w => w.name === '김진경') : workers[Math.floor(Math.random() * workers.length)]);

        const targetQty = Math.floor(Math.random() * 250) + 300;
        const actualQty = Math.floor(targetQty * (0.88 + Math.random() * 0.18));
        const defectQty = Math.floor(actualQty * (0.008 + Math.random() * 0.035));
        
        const dateClean = dateStr.replace(/-/g, '');
        const materialLots = {
          'FRT_초물': `${dateClean.substring(2)}0800`,
          'FRT_중물': `${dateClean.substring(2)}1200`,
          'FRT_종물': `${dateClean.substring(2)}1700`,
          'RR_초물': `${dateClean.substring(2)}0830`,
          'RR_중물': `${dateClean.substring(2)}1230`,
          'RR_종물': `${dateClean.substring(2)}1730`
        };

        const leaderFormItems = DEFAULT_LEADER_ITEMS.map(it => ({
          seq: it.seq,
          name: it.name,
          packedQty: Math.floor(Math.random() * 150) + 180,
          reworkQty: Math.floor(Math.random() * 5),
          scrapA: Math.floor(Math.random() * 2),
          scrapB: Math.floor(Math.random() * 2),
          scrapC: 0,
          scrapD: 0,
          scrapCenter: 0,
          scrapSide: 0
        }));

        reports.push({
          id: `RPT-${dateClean}-${String(reportIdCounter++).slice(-3)}`,
          date: dateStr,
          workHours: '08:00 ~ 17:00',
          shift: '주간',
          carModel: car.code,
          carModelName: car.name,
          processId: proc.id,
          processName: proc.name,
          line: '1라인',
          workerId: primaryWorker ? primaryWorker.id : 'EMP002',
          workerName: primaryWorker ? primaryWorker.name : '장수미',
          itemCode: item.code,
          itemName: item.name,
          targetQty: targetQty,
          actualQty: actualQty,
          defectQty: defectQty,
          defectRate: Number(((defectQty / (actualQty || 1)) * 100).toFixed(2)),
          attainmentRate: Number(((actualQty / targetQty) * 100).toFixed(1)),
          materialLots: materialLots,
          isLeaderForm: primaryWorker && primaryWorker.name === '장수미',
          formCode: 'HSC-DT-005',
          leaderFormItems: leaderFormItems,
          attendanceData: DEFAULT_ATTENDANCE,
          downtimeMinutes: 0,
          downtimeReason: '',
          notes: primaryWorker && primaryWorker.name === '장수미' ? `[작업일보(반장) HSC-DT-005] 장수미 반장 작성 완료.` : `[${car.code} ${proc.name}] 정상가동.`,
          status: '승인 완료',
          approver: '생산총괄 부장',
          approvedAt: `${dateStr} 18:30`,
          createdAt: `${dateStr} 17:45:00`
        });
      });
    });
  }

  return reports.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
}
