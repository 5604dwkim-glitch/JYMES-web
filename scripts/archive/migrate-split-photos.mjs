/**
 * migrate-split-photos.mjs — 작업자/금형/설비 사진(base64)을 본 문서에서 분리 컬렉션으로 이동 (성능 개선 마이그레이션)
 *
 *   workers.photoData            -> worker_photos/{id}.photoData
 *   molds.moldPhoto              -> mold_photos/{id}.moldPhoto
 *   equipments.equipmentPhoto(2) -> equipment_photos/{id}.equipmentPhoto(2)   (data:image 값만 이동, '/images/..' 경로 등은 그대로 유지)
 *
 * 안전 절차: ① 전체 백업(JSON) → ② 쓰기 권한 점검 → ③ 분리 문서 저장 → ④ 읽어서 동일성 검증 → ⑤ 검증된 경우에만 본 문서에서 필드 제거
 * 사용법:
 *   node scripts/archive/migrate-split-photos.mjs            (미리보기: 읽기만 수행, 백업 파일은 생성)
 *   node scripts/archive/migrate-split-photos.mjs --execute  (실제 이동)
 * 복구: 백업 JSON(scripts/archive/backups/)의 원본 필드를 해당 문서에 되돌려 쓰면 된다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, getDoc, updateDoc, deleteDoc, deleteField } from 'firebase/firestore';

const EXECUTE = process.argv.includes('--execute');
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = initializeApp({
  apiKey: 'AIzaSyBk0b1VfUQsY69YY2ATRIQ4zWKr1pQHMJI',
  authDomain: 'jy001-eb144.firebaseapp.com',
  projectId: 'jy001-eb144',
  appId: '1:1079897779096:web:6f9d2a2acdc1c8a2e2d9ed'
});
const db = getFirestore(app);

const TARGETS = [
  { source: 'workers', photoCollection: 'worker_photos', fields: ['photoData'] },
  { source: 'molds', photoCollection: 'mold_photos', fields: ['moldPhoto'] },
  { source: 'equipments', photoCollection: 'equipment_photos', fields: ['equipmentPhoto', 'equipmentPhoto2'] }
];

const isDataUrl = (v) => typeof v === 'string' && v.startsWith('data:image');
const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

// ① 전체 읽기 + 백업
const snapshots = {};
for (const t of TARGETS) {
  const snap = await getDocs(collection(db, t.source));
  snapshots[t.source] = snap.docs.map((d) => ({ id: d.id, data: d.data() }));
}
const backupDir = path.join(__dirname, 'backups');
fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupPath = path.join(backupDir, `photo-split-backup-${stamp}.json`);
fs.writeFileSync(backupPath, JSON.stringify(snapshots));
console.log(`백업 저장: ${backupPath} (${kb(fs.statSync(backupPath).size)})`);

// 이동 대상 집계
const plan = [];
for (const t of TARGETS) {
  for (const d of snapshots[t.source]) {
    const moving = t.fields.filter((f) => isDataUrl(d.data[f]));
    if (moving.length > 0) plan.push({ ...t, id: d.id, moving, bytes: moving.reduce((s, f) => s + d.data[f].length, 0), data: d.data });
  }
}
console.log(`이동 대상 문서 ${plan.length}건 / 사진 ${kb(plan.reduce((s, p) => s + p.bytes, 0))}`);
TARGETS.forEach((t) => {
  const items = plan.filter((p) => p.source === t.source);
  console.log(`  - ${t.source}: ${items.length}건, ${kb(items.reduce((s, p) => s + p.bytes, 0))}`);
});

if (!EXECUTE) {
  console.log('\n미리보기 모드입니다. 실제 이동은 --execute 옵션으로 실행하세요.');
  process.exit(0);
}

// ② 쓰기 권한 점검 (Firestore에서 __*__ 형태의 문서 ID는 예약어이므로 _write_probe_ 사용)
try {
  const probe = doc(db, 'mold_photos', '_write_probe_');
  await setDoc(probe, { probe: true });
  await deleteDoc(probe);
  console.log('쓰기 권한 점검 통과');
} catch (e) {
  console.error('분리 컬렉션에 쓸 수 없어 중단합니다 (본 문서는 변경되지 않음):', e.message);
  process.exit(1);
}

// ③~⑤ 문서별 이동 (동시 8건 병렬 처리)
let moved = 0;
let failed = 0;
const CONCURRENCY = 8;
for (let i = 0; i < plan.length; i += CONCURRENCY) {
  const batchSlice = plan.slice(i, i + CONCURRENCY);
  await Promise.all(
    batchSlice.map(async (p) => {
      try {
        const photoRef = doc(db, p.photoCollection, p.id);
        const payload = { migratedAt: new Date().toISOString() };
        p.moving.forEach((f) => {
          payload[f] = p.data[f];
        });
        await setDoc(photoRef, payload, { merge: true });

        // ④ 검증: 저장된 값이 원본과 완전히 동일한지 확인
        const check = (await getDoc(photoRef)).data() || {};
        const ok = p.moving.every((f) => check[f] === p.data[f]);
        if (!ok) throw new Error('검증 불일치');

        // ⑤ 본 문서에서 사진 필드 제거
        const removal = {};
        p.moving.forEach((f) => {
          removal[f] = deleteField();
        });
        await updateDoc(doc(db, p.source, p.id), removal);
        moved += 1;
      } catch (e) {
        failed += 1;
        console.error(`  ✗ ${p.source}/${p.id} 이동 실패 (본 문서 유지): ${e.message}`);
      }
    })
  );
}
console.log(`\n완료: 이동 ${moved}건, 실패 ${failed}건`);
process.exit(failed > 0 ? 2 : 0);
