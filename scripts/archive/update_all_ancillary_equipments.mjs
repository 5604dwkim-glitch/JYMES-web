/**
 * update_all_ancillary_equipments.mjs
 * 모든 설비(equipments 컬렉션)의 부대설비(ancillaryEquipments) 일괄 업데이트 스크립트
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(resolve(__dirname, '../../serviceAccountKey.json'), 'utf8'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const ancillaryEquipments = [
  { name: '디지털 온도계', spec: 'NX4', qty: '2', manufacturer: '오토닉스', note: '' },
  { name: '디지털 타이머', spec: 'FX4S', qty: '1', manufacturer: '오토닉스', note: '' },
  { name: '히타봉', spec: '100*300*220V*1200W', qty: '4', manufacturer: '삼성히타', note: '' },
  { name: '작동 릴레이', spec: 'Φ 80', qty: '3', manufacturer: 'Honeywell', note: '' }
];

const snap = await db.collection('equipments').get();
console.log(`조회된 전체 설비 수: ${snap.size}건`);

const batch = db.batch();
for (const docSnap of snap.docs) {
  batch.update(docSnap.ref, { ancillaryEquipments });
}
await batch.commit();

console.log(`✅ 전체 설비 ${snap.size}건의 부대설비(ancillaryEquipments) 업데이트 완료!`);
process.exit(0);
