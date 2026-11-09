/**
 * update_all_equipment_photos.mjs
 * 모든 설비(equipments 컬렉션)의 설비사진 1·2를 기본 설비 이미지로 일괄 업데이트하는 스크립트
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

const equipmentPhoto = '/images/equipment_photo_1.jpg';
const equipmentPhoto2 = '/images/equipment_photo_2.jpg';

const snap = await db.collection('equipments').get();
console.log(`조회된 전체 설비 수: ${snap.size}건`);

const batch = db.batch();
for (const docSnap of snap.docs) {
  batch.update(docSnap.ref, { equipmentPhoto, equipmentPhoto2 });
}
await batch.commit();

console.log(`✅ 전체 설비 ${snap.size}건에 설비사진 1·2 업데이트 완료!`);
process.exit(0);
