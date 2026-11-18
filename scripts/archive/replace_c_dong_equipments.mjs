/**
 * replace_c_dong_equipments.mjs
 * C동 설비 리스트 전체 교체 (기존 C동 삭제 → 신규 등록). 삭제 전 JSON 백업 저장.
 *
 * 사용법:
 *   node scripts/archive/replace_c_dong_equipments.mjs            (dry-run, 기본)
 *   node scripts/archive/replace_c_dong_equipments.mjs --apply
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync, mkdirSync } from 'fs';
import { loadServiceAccount } from '../utils/loadServiceAccount.mjs';

const isApply = process.argv.includes('--apply');
initializeApp({ credential: cert(loadServiceAccount()) });
const db = getFirestore();

// [관리번호, 설비명, 분류, 사양, 제작처, 소유, 상태, 도입일자]
// ※ 사용자 제공 엑셀 캡처(19행)만 반영됨. 캡처 이후 행이 더 있으면 아래에 추가할 것.
const rawRows = [
  ['JG-P-001', '인젝션 프레스', '유압', '15 TON', '극동기계', '대여', '정상', '2025-11-30'],
  ['JG-I-001', '인젝션 프레스', '유압', '15 TON', '극동기계', '대여', '정상', '2025-11-30'],
  ['JG-I-002', '인젝션 프레스', '유압', '10 TON', '극동기계', '대여', '정상', '2025-11-30'],
  ['JG-I-003', '인젝션 프레스', '유압', '15 TON', '극동기계', '대여', '정상', '2025-11-30'],
  ['JG-I-004', '인젝션 프레스', '유압', '10 TON', '극동기계', '대여', '정상', '2025-11-30'],
  ['JG-I-005', '인젝션 프레스', '유압', '10 TON', '극동기계', '대여', '정상', '2025-11-30'],
  ['JG-E-001', 'TPV 사출기', '유압', '22 TON', '동신유압', '대여', '정상', '2025-11-30'],
  ['JG-E-002', 'TPV 사출기', '유압', '22 TON', '동신유압', '대여', '정상', '2025-11-30'],
  ['NE-D-001', '인젝션 프레스', '유압', '15 TON', '극동기계', '대여', '정상', '2024-05-01'],
  ['NE-D-002', '인젝션 프레스', '유압', '10 TON', '극동기계', '대여', '정상', '2024-05-01'],
  ['NE-D-003', '인젝션 프레스', '유압', '10 TON', '극동기계', '대여', '정상', '2024-05-01'],
  ['NE-D-004', '인젝션 프레스', '유압', '10 TON', '극동기계', '대여', '정상', '2024-05-01'],
  ['NE-D-005', '인젝션 프레스', '유압', '10 TON', '극동기계', '대여', '정상', '2024-05-01'],
  ['NE-D-006', '인젝션 프레스', '유압', '10 TON', '극동기계', '대여', '정상', '2024-05-01'],
  ['NE-D-007', '인젝션 프레스', '유압', '10 TON', '극동기계', '대여', '정상', '2024-05-01'],
  ['NE-D-008', '인젝션 프레스', '유압', '15 TON', '극동기계', '대여', '정상', '2024-05-01'],
  ['OV-P-001', '인젝션 프레스', '유압', '15 TON', '극동기계', '대여', '정상', '2025-04-01'],
  ['OV-P-002', '인젝션 프레스', '유압', '15 TON', '극동기계', '대여', '정상', '2025-04-01'],
  ['OV-P-003', '인젝션 프레스', '유압', '15 TON', '극동기계', '대여', '정상', '2025-04-01'],
  ['OV-P-004', '인젝션 프레스', '유압', '15 TON', '극동기계', '대여', '정상', '2025-04-01']
];

const defaultAncillaryEquipments = [
  { name: '디지털 온도계', spec: 'NX4', qty: '2', manufacturer: '오토닉스', note: '' },
  { name: '디지털 타이머', spec: 'FX4S', qty: '1', manufacturer: '오토닉스', note: '' },
  { name: '히타봉', spec: '100*300*220V*1200W', qty: '4', manufacturer: '삼성히타', note: '' },
  { name: '작동 릴레이', spec: 'Φ 80', qty: '3', manufacturer: 'Honeywell', note: '' }
];

const newDocs = rawRows.map(([code, name, type, spec, manufacturer, ownership, status, installDate], idx) => ({
  location: 'C동',
  code,
  name,
  installDate,
  type,
  spec,
  manufacturer,
  ownership,
  assetNo: '',
  status,
  sortOrder: idx + 1,
  equipmentPhoto: '/images/equipment_photo_1.jpg',
  equipmentPhoto2: '/images/equipment_photo_2.jpg',
  ancillaryEquipments: defaultAncillaryEquipments
}));

const snap = await db.collection('equipments').get();
const existing = snap.docs.filter(d => d.data().location === 'C동');
console.log(`기존 C동 ${existing.length}건 -> 신규 ${newDocs.length}건`);
console.log('기존 코드:', existing.map(d => d.data().code).join(', '));

const withExtra = existing.map(d => ({ id: d.id, ...d.data() }))
  .filter(d => (d.history && d.history.length) || d.equipmentPhoto || d.assetNo);
console.log(`이력/사진/자산번호 보유 기존 C동 설비: ${withExtra.length}건`);

const setsSnap = await db.collection('equipment_sets').get();
const ids = new Set(existing.map(d => d.id));
const affected = setsSnap.docs.filter(s => (s.data().equipmentIds || []).some(id => ids.has(id)));
console.log(`C동 설비를 참조하는 equipment_sets: ${affected.length}건 (삭제 시 참조가 끊김)`);

if (!isApply) {
  console.log('\n[DRY-RUN] 반영하려면 --apply 옵션을 사용하세요.');
  process.exit(0);
}

const scratchDir = 'C:/Users/wookw/.gemini/antigravity/brain/85456755-700b-4c43-8672-7fa98e812cd9/scratch';
mkdirSync(scratchDir, { recursive: true });
writeFileSync(`${scratchDir}/c_dong_backup_${Date.now()}.json`,
  JSON.stringify(existing.map(d => ({ id: d.id, ...d.data() })), null, 2), 'utf8');

const batch = db.batch();
existing.forEach(d => batch.delete(d.ref));
newDocs.forEach(eq => batch.set(db.collection('equipments').doc(), eq));
await batch.commit();
console.log(`✅ C동 기존 ${existing.length}건 삭제, 신규 ${newDocs.length}건 등록 완료`);
process.exit(0);
