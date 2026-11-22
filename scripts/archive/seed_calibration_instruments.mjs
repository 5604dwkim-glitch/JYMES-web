import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { loadServiceAccount } from '../utils/loadServiceAccount.mjs';

const ITEMS = [
  {
    id: 'cal_inst_001',
    sortOrder: 1,
    code: '001',
    name: '디지털온도계',
    serialNo: '120200969',
    type: '온도측정',
    spec: '-200℃~1,000℃',
    calibrationCycle: '1년',
    calibrationDate: '2025-10-15',
    nextCalibrationDate: '2026-10-15',
    manufacturer: 'TES',
    installDate: '2022-05-13',
    location: '사무실',
    manager: '김동욱',
    calibrationAgency: '한국측정기술원'
  },
  {
    id: 'cal_inst_002',
    sortOrder: 2,
    code: '002',
    name: '전자저울',
    serialNo: 'TM0390',
    type: '질량/부피',
    spec: '0.2~300g',
    calibrationCycle: '1년',
    calibrationDate: '2025-10-15',
    nextCalibrationDate: '2026-10-15',
    manufacturer: 'CAS',
    installDate: '2022-05-17',
    location: 'DS/DT',
    manager: '김동욱',
    calibrationAgency: '화승알앤에이'
  },
  {
    id: 'cal_inst_003',
    sortOrder: 3,
    code: '003',
    name: '온습도계',
    serialNo: '조영-온도,습도',
    type: '온도,습도',
    spec: '0~1kg',
    calibrationCycle: '2년',
    calibrationDate: '2024-03-15',
    nextCalibrationDate: '2025-03-15',
    manufacturer: '',
    installDate: '2023-08-24',
    location: 'FMB 보관실',
    manager: '김동욱',
    calibrationAgency: '삼정산업'
  },
  {
    id: 'cal_inst_004',
    sortOrder: 4,
    code: '004',
    name: '내외측 캘리퍼',
    serialNo: 'K00816',
    type: '길이측정',
    spec: '0~150 (0.01mm)',
    calibrationCycle: '1년',
    calibrationDate: '2025-03-06',
    nextCalibrationDate: '2026-03-06',
    manufacturer: '미니플',
    installDate: '2024-03-22',
    location: '수입검사실',
    manager: '김동욱',
    calibrationAgency: '한국측정기술원'
  },
  {
    id: 'cal_inst_005',
    sortOrder: 5,
    code: '005',
    name: '분동',
    serialNo: '',
    type: '질량/부피',
    spec: '10~50g',
    calibrationCycle: '2년',
    calibrationDate: '2024-07-22',
    nextCalibrationDate: '2026-07-22',
    manufacturer: '',
    installDate: '2024-04-22',
    location: 'ME1a',
    manager: '김동욱',
    calibrationAgency: '한국측정기술원'
  },
  {
    id: 'cal_inst_006',
    sortOrder: 6,
    code: '006',
    name: '분동',
    serialNo: '',
    type: '질량/부피',
    spec: '100 g',
    calibrationCycle: '2년',
    calibrationDate: '2024-07-22',
    nextCalibrationDate: '2026-07-22',
    manufacturer: '',
    installDate: '2024-04-22',
    location: 'DS/DT',
    manager: '김동욱',
    calibrationAgency: '한국측정기술원'
  },
  {
    id: 'cal_inst_007',
    sortOrder: 7,
    code: '007',
    name: '광조도계',
    serialNo: 'H241292228',
    type: '조도측정',
    spec: '20~20000 Lux',
    calibrationCycle: '1년',
    calibrationDate: '2024-07-25',
    nextCalibrationDate: '2025-07-25',
    manufacturer: '',
    installDate: '2024-05-06',
    location: '사무실',
    manager: '김동욱',
    calibrationAgency: '대영씨엔티'
  },
  {
    id: 'cal_inst_008',
    sortOrder: 8,
    code: '008',
    name: '전자저울',
    serialNo: 'WR0385',
    type: '질량/부피',
    spec: '0.2~300g',
    calibrationCycle: '1년',
    calibrationDate: '2025-10-15',
    nextCalibrationDate: '2026-10-15',
    manufacturer: 'CAS',
    installDate: '2024-03-17',
    location: 'ME1a',
    manager: '김동욱',
    calibrationAgency: '화승알앤에이'
  },
  {
    id: 'cal_inst_009',
    sortOrder: 9,
    code: '009',
    name: '디지털온도계',
    serialNo: '120200969',
    type: '온도측정',
    spec: '-200℃~1,000℃',
    calibrationCycle: '1년',
    calibrationDate: '2025-10-15',
    nextCalibrationDate: '2026-10-15',
    manufacturer: 'TES',
    installDate: '2022-05-13',
    location: '사무실',
    manager: '김동욱',
    calibrationAgency: '한국측정기술원'
  }
];

async function main() {
  initializeApp({ credential: cert(loadServiceAccount()) });
  const db = getFirestore();
  const batch = db.batch();

  for (const item of ITEMS) {
    const { id, ...rest } = item;
    const ref = db.collection('equipments').doc(id);
    batch.set(
      ref,
      {
        ...rest,
        category: 'measuring',
        calibrationGroup: 'instrument',
        assetNo: item.serialNo || '',
        ownership: '자가',
        status: '정상'
      },
      { merge: true }
    );
  }

  await batch.commit();
  const snap = await db.collection('equipments').where('category', '==', 'measuring').get();
  console.log(`Seeded ${ITEMS.length} calibration instruments. Total measuring docs: ${snap.size}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
