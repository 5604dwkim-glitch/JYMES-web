import { collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from './src/firebase.js';

const equipments = [
  { location: 'A동', code: '9B-F-001', name: '인젝션 프레스', installDate: '2024-02-01', type: '유압', spec: '300 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'A동', code: '9B-F-002', name: '인젝션 프레스', installDate: '2024-02-01', type: '유압', spec: '300 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'A동', code: '9B-F-003', name: '인젝션 프레스', installDate: '2024-02-01', type: '유압', spec: '300 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'A동', code: '9B-F-004', name: '인젝션 프레스', installDate: '2024-02-01', type: '유압', spec: '300 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'A동', code: '9B-R-001', name: '인젝션 프레스', installDate: '2024-02-01', type: '유압', spec: '30 TON', manufacturer: '동원유압', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'A동', code: '9B-R-002', name: '인젝션 프레스', installDate: '2024-02-01', type: '유압', spec: '30 TON', manufacturer: '동원유압', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'A동', code: '9B-R-003', name: '인젝션 프레스', installDate: '2024-02-01', type: '유압', spec: '30 TON', manufacturer: '동원유압', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'A동', code: '9B-R-004', name: '인젝션 프레스', installDate: '2024-02-01', type: '유압', spec: '30 TON', manufacturer: '동원유압', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'A동', code: '9B-R-005', name: '유압 프레스', installDate: '2024-02-01', type: '유압', spec: '30 TON', manufacturer: '동원유압', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'A동', code: '9B-R-006', name: '인젝션 프레스', installDate: '2023-12-19', type: '유압', spec: '30 TON', manufacturer: '동원유압', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'A동', code: 'VF-F-001', name: '인젝션 프레스', installDate: '2020-01-01', type: '유압', spec: '22 TON', manufacturer: '동신유압', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'A동', code: 'VF-F-002', name: '인젝션 프레스', installDate: '2020-01-01', type: '유압', spec: '22 TON', manufacturer: '동신유압', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'A동', code: 'VF-F-003', name: '인젝션 프레스', installDate: '2020-01-01', type: '유압', spec: '22 TON', manufacturer: '동신유압', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'A동', code: 'VF-F-004', name: '인젝션 프레스', installDate: '2020-01-01', type: '유압', spec: '22 TON', manufacturer: '동신유압', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'A동', code: 'VF-R-001', name: '인젝션 프레스', installDate: '2020-01-01', type: '유압', spec: '22 TON', manufacturer: '동신유압', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'A동', code: 'VF-R-002', name: '인젝션 프레스', installDate: '2020-01-01', type: '유압', spec: '22 TON', manufacturer: '동신유압', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'A동', code: 'VF-R-003', name: '인젝션 프레스', installDate: '2020-01-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'A동', code: 'VF-R-004', name: '인젝션 프레스', installDate: '2020-01-01', type: '유압', spec: '22 TON', manufacturer: '동신유압', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'A동', code: 'VF-R-005', name: '인젝션 프레스', installDate: '2020-01-01', type: '유압', spec: '22 TON', manufacturer: '동신유압', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'A동', code: 'VF-R-006', name: '인젝션 프레스', installDate: '2020-01-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-Q-001', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-Q-002', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-Q-003', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-Q-004', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-Q-005', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-Q-006', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-S-001', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '30 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-S-002', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '15 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-S-003', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '30 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-S-004', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '30 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-S-005', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '15 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-S-006', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '30 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-C-001', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-C-002', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-C-003', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-C-004', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-C-005', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-C-006', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-C-007', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-C-008', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-C-009', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-C-010', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-C-011', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-C-012', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-C-013', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-C-014', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-C-015', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-C-016', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-C-017', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DS-C-018', name: '인젝션 프레스', installDate: '2013-03-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DT-Q-001', name: '인젝션 프레스', installDate: '2018-05-01', type: '유압', spec: '30 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DT-Q-002', name: '인젝션 프레스', installDate: '2018-05-01', type: '유압', spec: '15 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DT-Q-003', name: '인젝션 프레스', installDate: '2018-05-01', type: '유압', spec: '30 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DT-Q-004', name: '인젝션 프레스', installDate: '2018-05-01', type: '유압', spec: '30 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DT-Q-005', name: '인젝션 프레스', installDate: '2018-05-01', type: '유압', spec: '15 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DT-Q-006', name: '인젝션 프레스', installDate: '2018-05-01', type: '유압', spec: '30 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DT-C-001', name: '인젝션 프레스', installDate: '2018-05-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DT-C-002', name: '인젝션 프레스', installDate: '2018-05-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DT-C-003', name: '인젝션 프레스', installDate: '2018-05-01', type: '유압', spec: '30 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DT-C-004', name: '인젝션 프레스', installDate: '2018-05-01', type: '유압', spec: '30 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DT-C-005', name: '인젝션 프레스', installDate: '2018-05-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DT-C-006', name: '인젝션 프레스', installDate: '2018-05-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DT-C-007', name: '인젝션 프레스', installDate: '2018-05-01', type: '유압', spec: '30 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DT-C-008', name: '인젝션 프레스', installDate: '2018-05-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DT-C-009', name: '인젝션 프레스', installDate: '2018-05-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DT-C-010', name: '인젝션 프레스', installDate: '2018-05-01', type: '유압', spec: '30 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DT-C-011', name: '인젝션 프레스', installDate: '2018-05-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DT-C-012', name: '인젝션 프레스', installDate: '2018-05-01', type: '유압', spec: '30 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DT-C-013', name: '인젝션 프레스', installDate: '2018-05-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DT-C-014', name: '인젝션 프레스', installDate: '2018-05-01', type: '유압', spec: '30 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DT-C-015', name: '인젝션 프레스', installDate: '2018-05-01', type: '유압', spec: '30 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DT-C-016', name: '인젝션 프레스', installDate: '2018-05-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DT-C-017', name: '인젝션 프레스', installDate: '2018-05-01', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'B동', code: 'DT-C-018', name: '인젝션 프레스', installDate: '2018-05-01', type: '유압', spec: '30 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'C동', code: 'ME-P-001', name: '인젝션 프레스', installDate: '2024-03-05', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'C동', code: 'ME-P-002', name: '인젝션 프레스', installDate: '2024-03-05', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'C동', code: 'ME-P-003', name: '인젝션 프레스', installDate: '2024-03-05', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' },
  { location: 'C동', code: 'ME-P-004', name: '인젝션 프레스', installDate: '2024-03-05', type: '유압', spec: '10 TON', manufacturer: '극동기계', ownership: '대여', assetNo: '', status: '정상' }
];

async function run() {
  console.log('Uploading 78 equipments...');
  const coll = collection(db, 'equipments');
  // First, fetch existing and delete them if you want a clean slate, or just add.
  // Wait, I should just delete all existing to avoid duplicates.
  const snap = await getDocs(coll);
  for (const doc of snap.docs) {
    await deleteDoc(doc.ref);
  }
  
  for (const eq of equipments) {
    await addDoc(coll, eq);
  }
  console.log('Upload complete.');
  process.exit(0);
}

run();
