/**
 * update_b_dong_equipments.mjs
 * B동 설비 리스트(52건) 교체 마이그레이션 스크립트
 *
 * 사용법:
 *   node scripts/archive/update_b_dong_equipments.mjs --dry-run
 *   node scripts/archive/update_b_dong_equipments.mjs --apply
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const isApply = process.argv.includes('--apply');
const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(resolve(__dirname, '../../serviceAccountKey.json'), 'utf8'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const rawRows = [
  ['DS-S-001', '인젝션 프레스', '2013-03-01', '유압', '15 TON', '극동기계', '대여'],
  ['DS-S-002', '인젝션 프레스', '2013-03-01', '유압', '10 TON', '극동기계', '대여'],
  ['DS-S-003', '인젝션 프레스', '2013-03-01', '유압', '15 TON', '극동기계', '대여'],
  ['DS-S-004', '인젝션 프레스', '2013-03-01', '유압', '15 TON', '극동기계', '대여'],
  ['DS-S-005', '인젝션 프레스', '2013-03-01', '유압', '10 TON', '극동기계', '대여'],
  ['DS-S-006', '인젝션 프레스', '2013-03-01', '유압', '15 TON', '극동기계', '대여'],
  ['DS-C-001', '인젝션 프레스', '2013-03-01', '유압', '10 TON', '극동기계', '대여'],
  ['DS-C-002', '인젝션 프레스', '2013-03-01', '유압', '10 TON', '극동기계', '대여'],
  ['DS-C-003', '인젝션 프레스', '2013-03-01', '유압', '10 TON', '극동기계', '대여'],
  ['DS-C-004', '인젝션 프레스', '2013-03-01', '유압', '10 TON', '극동기계', '대여'],
  ['DS-C-005', '인젝션 프레스', '2013-03-01', '유압', '10 TON', '극동기계', '대여'],
  ['DS-C-006', '인젝션 프레스', '2013-03-01', '유압', '10 TON', '극동기계', '대여'],
  ['DS-C-007', '인젝션 프레스', '2013-03-01', '유압', '10 TON', '극동기계', '대여'],
  ['DS-C-008', '인젝션 프레스', '2013-03-01', '유압', '10 TON', '극동기계', '대여'],
  ['DS-C-009', '인젝션 프레스', '2013-03-01', '유압', '10 TON', '극동기계', '대여'],
  ['DS-C-010', '인젝션 프레스', '2013-03-01', '유압', '10 TON', '극동기계', '대여'],
  ['DS-C-011', '인젝션 프레스', '2013-03-01', '유압', '10 TON', '극동기계', '대여'],
  ['DS-C-012', '인젝션 프레스', '2013-03-01', '유압', '10 TON', '극동기계', '대여'],
  ['DS-D-001', '유압 프레스', '2013-03-01', '유압', '11 TON', '극동기계', '대여'],
  ['DS-D-002', '유압 프레스', '2013-03-01', '유압', '11 TON', '극동기계', '대여'],
  ['DS-D-003', '유압 프레스', '2013-03-01', '유압', '11 TON', '극동기계', '대여'],
  ['DS-D-004', '유압 프레스', '2013-03-01', '유압', '11 TON', '극동기계', '대여'],
  ['DT-Q-001', '인젝션 프레스', '2018-05-01', '유압', '15 TON', '극동기계', '대여'],
  ['DT-Q-002', '인젝션 프레스', '2018-05-01', '유압', '10 TON', '극동기계', '대여'],
  ['DT-Q-003', '인젝션 프레스', '2018-05-01', '유압', '15 TON', '극동기계', '대여'],
  ['DT-Q-004', '인젝션 프레스', '2018-05-01', '유압', '15 TON', '극동기계', '대여'],
  ['DT-Q-005', '인젝션 프레스', '2018-05-01', '유압', '10 TON', '극동기계', '대여'],
  ['DT-Q-006', '인젝션 프레스', '2018-05-01', '유압', '15 TON', '극동기계', '대여'],
  ['DT-C-001', '인젝션 프레스', '2018-05-01', '유압', '30 TON', '극동기계', '대여'],
  ['DT-C-002', '인젝션 프레스', '2018-05-01', '유압', '10 TON', '극동기계', '대여'],
  ['DT-C-003', '인젝션 프레스', '2018-05-01', '유압', '30 TON', '극동기계', '대여'],
  ['DT-C-004', '인젝션 프레스', '2018-05-01', '유압', '30 TON', '극동기계', '대여'],
  ['DT-C-005', '인젝션 프레스', '2018-05-01', '유압', '10 TON', '극동기계', '대여'],
  ['DT-C-006', '인젝션 프레스', '2018-05-01', '유압', '30 TON', '극동기계', '대여'],
  ['DT-C-007', '인젝션 프레스', '2018-05-01', '유압', '30 TON', '극동기계', '대여'],
  ['DT-C-008', '인젝션 프레스', '2018-05-01', '유압', '10 TON', '극동기계', '대여'],
  ['DT-C-009', '인젝션 프레스', '2018-05-01', '유압', '30 TON', '극동기계', '대여'],
  ['DT-C-010', '인젝션 프레스', '2018-05-01', '유압', '30 TON', '극동기계', '대여'],
  ['DT-C-011', '인젝션 프레스', '2018-05-01', '유압', '10 TON', '극동기계', '대여'],
  ['DT-C-012', '인젝션 프레스', '2018-05-01', '유압', '30 TON', '극동기계', '대여'],
  ['DT-C-013', '인젝션 프레스', '2018-05-01', '유압', '15 TON', '극동기계', '대여'],
  ['DT-C-014', '인젝션 프레스', '2018-05-01', '유압', '30 TON', '극동기계', '대여'],
  ['DT-C-015', '인젝션 프레스', '2018-05-01', '유압', '30 TON', '극동기계', '대여'],
  ['DT-C-016', '인젝션 프레스', '2018-05-01', '유압', '30 TON', '극동기계', '대여'],
  ['DT-C-017', '인젝션 프레스', '2018-05-01', '유압', '30 TON', '극동기계', '대여'],
  ['DT-C-018', '인젝션 프레스', '2018-05-01', '유압', '15 TON', '극동기계', '대여'],
  ['P4-U-001', '인젝션 프레스', '2024-09-01', '유압', '30 TON', '극동기계', '대여'],
  ['P4-U-002', '인젝션 프레스', '2024-09-01', '유압', '15 TON', '극동기계', '대여'],
  ['P4-U-003', '인젝션 프레스', '2024-09-01', '유압', '10 TON', '극동기계', '대여'],
  ['JG-F-001', '열융착기', '2026-10-01', '유압', '', '극동기계', '대여'],
  ['NE-V-001', '유압 프레스', '2024-09-01', '유압', '11 TON', '극동기계', '대여'],
  ['OV-F-001', '열융착기', '2025-04-01', '유압', '', '극동기계', '대여']
];

const newBDongEquipments = rawRows.map(([code, name, installDate, type, spec, manufacturer, ownership], idx) => ({
  location: 'B동',
  code,
  name,
  installDate,
  type,
  spec,
  manufacturer,
  ownership,
  assetNo: '',
  status: '정상',
  sortOrder: idx + 1
}));

const snap = await db.collection('equipments').get();
const allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

const byLoc = {};
for (const d of allDocs) {
  byLoc[d.location || '(none)'] = (byLoc[d.location || '(none)'] || 0) + 1;
}
console.log('[현재 equipments 현황]', byLoc, `총 ${allDocs.length}건`);

const existingBDong = snap.docs.filter(d => d.data().location === 'B동');
console.log(`기존 B동 설비 건수: ${existingBDong.length}건 -> 신규 등록 예정: ${newBDongEquipments.length}건`);

const withExtra = existingBDong
  .map(d => ({ id: d.id, ...d.data() }))
  .filter(d => (d.history && d.history.length > 0) || d.equipmentPhoto || d.assetNo);

if (withExtra.length > 0) {
  console.log('참고 - 이력/사진/자산번호가 있던 기존 B동 설비:', withExtra.map(d => ({
    code: d.code,
    historyCount: d.history?.length || 0,
    hasPhoto: !!d.equipmentPhoto,
    assetNo: d.assetNo
  })));
} else {
  console.log('참고 - 기존 B동 설비 중 수리이력/사진/자산번호 보유 건수: 0건');
}

const setsSnap = await db.collection('equipment_sets').get();
const bIds = new Set(existingBDong.map(d => d.id));
const affectedSets = setsSnap.docs
  .map(s => ({ id: s.id, ...s.data() }))
  .filter(s => (s.equipmentIds || []).some(id => bIds.has(id)));
console.log(`참고 - B동 설비를 참조하는 설비 셋트(equipment_sets): ${affectedSets.length}건`);

if (!isApply) {
  const sampleA = allDocs.find(d => d.location === 'A동');
  const sampleC = allDocs.find(d => d.location === 'C동');
  console.log('A동 샘플:', sampleA);
  console.log('C동 샘플:', sampleC);
  console.log('\n[DRY-RUN 완료] 실제 반영하려면 --apply 옵션을 사용하세요.');
  process.exit(0);
}

// 백업 저장
const scratchDir = 'C:/Users/wookw/.gemini/antigravity/brain/d30d5e97-44e1-49e3-94ad-b9bd5618efaf/scratch';
mkdirSync(scratchDir, { recursive: true });
writeFileSync(
  `${scratchDir}/b_dong_backup_${Date.now()}.json`,
  JSON.stringify(existingBDong.map(d => ({ id: d.id, ...d.data() })), null, 2),
  'utf8'
);

// Batch 처리 (삭제 54건 + 추가 52건 = 약 106건, Firestore batch 한도 500건 이내)
const batch = db.batch();
for (const docSnap of existingBDong) {
  batch.delete(docSnap.ref);
}
for (const eq of newBDongEquipments) {
  const newRef = db.collection('equipments').doc();
  batch.set(newRef, eq);
}
await batch.commit();

console.log(`✅ B동 기존 ${existingBDong.length}건 삭제 및 신규 ${newBDongEquipments.length}건 등록 완료!`);
process.exit(0);
