import { db } from '../../src/firebase.js';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

const HW_WORKERS = [
  { id: 'HW21001', name: '황수현', role: '책임', dept: '관리팀', process: '관리', hireDate: '2021-11-01' },
  { id: 'HW23001', name: '위간', role: '사원', dept: '생산팀', process: '소재준비', hireDate: '2023-05-02' },
  { id: 'HW23002', name: '언', role: '사원', dept: '품질팀', process: '검사', hireDate: '2023-08-02' },
  { id: 'HW23003', name: '박종미', role: '반장', dept: '관리팀', process: '관리', hireDate: '2023-08-04' },
  { id: 'HW23004', name: '프랭클린', role: '사원', dept: '생산팀', process: '조인트', hireDate: '2023-08-16' },
  { id: 'HW24001', name: '마크', role: '사원', dept: '품질팀', process: '검사', hireDate: '2024-01-08' },
  { id: 'HW24002', name: '로렉스', role: '사원', dept: '품질팀', process: '검사', hireDate: '2024-01-08' },
  { id: 'HW24003', name: '마이클', role: '사원', dept: '생산팀', process: '조인트', hireDate: '2024-02-16' },
  { id: 'HW24004', name: '무피드', role: '사원', dept: '생산팀', process: '조인트', hireDate: '2024-04-08' },
  { id: 'HW24005', name: '마틴', role: '사원', dept: '생산팀', process: '조인트', hireDate: '2024-06-20' },
  { id: 'HW24006', name: '박민정', role: '사원', dept: '생산팀', process: '소재준비', hireDate: '2024-07-08' },
  { id: 'HW24007', name: '지라완', role: '사원', dept: '품질팀', process: '검사', hireDate: '2024-10-02' },
  { id: 'HW24008', name: '레이놀드', role: '사원', dept: '생산팀', process: '조인트', hireDate: '2024-10-28' },
  { id: 'HW25001', name: '맥', role: '사원', dept: '생산팀', process: '소재준비', hireDate: '2025-02-19' },
  { id: 'HW25002', name: '알프레도', role: '사원', dept: '생산팀', process: '소재준비', hireDate: '2025-04-01' },
  { id: 'HW25003', name: '에릭', role: '사원', dept: '생산팀', process: '조인트', hireDate: '2025-04-07' },
  { id: 'HW25004', name: '조제인', role: '사원', dept: '생산팀', process: '후가공', hireDate: '2025-09-01' },
  { id: 'HW25005', name: '아이린', role: '사원', dept: '생산팀', process: '조인트', hireDate: '2025-10-20' },
  { id: 'HW25007', name: '니사낫', role: '사원', dept: '생산팀', process: '후가공', hireDate: '2025-11-21' },
  { id: 'HW25008', name: '새드릭', role: '사원', dept: '생산팀', process: '소재준비', hireDate: '2025-11-21' },
  { id: 'HW26001', name: '수파따', role: '사원', dept: '품질팀', process: '검사', hireDate: '2026-03-04' },
  { id: 'HW26002', name: '와히드', role: '사원', dept: '생산팀', process: '조인트', hireDate: '2026-04-17' },
  { id: 'HW26003', name: '에일리', role: '사원', dept: '생산팀', process: '후가공', hireDate: '2026-04-22' },
  { id: 'HW26004', name: '마이카', role: '사원', dept: '품질팀', process: '검사', hireDate: '2026-05-19' },
  { id: 'HW26005', name: '찬티마', role: '사원', dept: '생산팀', process: '후가공', hireDate: '2026-06-24' },
  { id: 'HW26006', name: '데이브', role: '사원', dept: '생산팀', process: '조인트', hireDate: '2026-08-18' }
];

async function run() {
  const snap = await getDocs(collection(db, 'workers'));
  console.log(`기존 등록 작업자 수: ${snap.docs.length}명`);

  const existingByUpper = new Map();
  for (const docSnap of snap.docs) {
    existingByUpper.set(docSnap.id.toUpperCase(), { docId: docSnap.id, data: docSnap.data() });
  }

  let addedCount = 0;
  let updatedCount = 0;

  for (const w of HW_WORKERS) {
    const prev = existingByUpper.get(w.id.toUpperCase());
    if (prev && prev.docId !== w.id) {
      await deleteDoc(doc(db, 'workers', prev.docId));
    }

    const payload = {
      ...(prev ? prev.data : {}),
      id: w.id,
      name: w.name,
      role: w.role,
      dept: w.dept,
      process: w.process,
      status: prev?.data?.status || '근무중',
      phone: prev?.data?.phone || '010-0000-0000',
      hireDate: w.hireDate,
      shift: prev?.data?.shift || '주간'
    };

    await setDoc(doc(db, 'workers', w.id), payload);
    if (prev) updatedCount++;
    else addedCount++;
  }

  const afterSnap = await getDocs(collection(db, 'workers'));
  console.log(`완료: 신규 추가 ${addedCount}명, 갱신 ${updatedCount}명 → 전체 작업자 총 ${afterSnap.docs.length}명`);
}

run()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .then(() => process.exit(0));
