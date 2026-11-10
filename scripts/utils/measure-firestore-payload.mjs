/**
 * measure-firestore-payload.mjs
 * 대시보드/일보작성 진입 시 읽는 Firestore 컬렉션의 실제 전송량(문서 수·바이트·base64 이미지 비중)을 측정하는 읽기 전용 진단 도구.
 * 사용법: node scripts/utils/measure-firestore-payload.mjs
 * (쓰기/삭제 없음. 앱이 사용하는 공개 클라이언트 설정으로 앱과 동일한 조회만 수행)
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyBk0b1VfUQsY69YY2ATRIQ4zWKr1pQHMJI',
  authDomain: 'jy001-eb144.firebaseapp.com',
  projectId: 'jy001-eb144',
  appId: '1:1079897779096:web:6f9d2a2acdc1c8a2e2d9ed'
});
const db = getFirestore(app);

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;

function imgBytes(value) {
  // data:image/...;base64,.... 문자열의 총 길이를 재귀 합산
  if (typeof value === 'string') return value.startsWith('data:image') ? value.length : 0;
  if (Array.isArray(value)) return value.reduce((s, v) => s + imgBytes(v), 0);
  if (value && typeof value === 'object') return Object.values(value).reduce((s, v) => s + imgBytes(v), 0);
  return 0;
}

async function measure(label, q) {
  const t0 = Date.now();
  const snap = await getDocs(q);
  const ms = Date.now() - t0;
  let total = 0;
  let img = 0;
  let maxDoc = { id: '', size: 0 };
  snap.forEach((d) => {
    const data = d.data();
    const size = JSON.stringify(data).length;
    total += size;
    img += imgBytes(data);
    if (size > maxDoc.size) maxDoc = { id: d.id, size };
  });
  console.log(
    `${label.padEnd(34)} 문서 ${String(snap.size).padStart(5)}건 | 합계 ${kb(total).padStart(11)} | 이미지(base64) ${kb(img).padStart(11)} | 최대문서 ${kb(maxDoc.size).padStart(10)} (${maxDoc.id}) | ${ms}ms`
  );
}

const runs = [
  ['workers (로그인/일보작성)', collection(db, 'workers')],
  ['equipments (대시보드/일보작성)', collection(db, 'equipments')],
  ['molds (대시보드/일보작성)', collection(db, 'molds')],
  ['equipment_sets', collection(db, 'equipment_sets')],
  ['daily_stats (대시보드)', collection(db, 'daily_stats')],
  ['reports 비가동>0 (대시보드)', query(collection(db, 'reports'), where('downtimeMinutes', '>', 0))],
  ['reports FMB보관실 (대시보드)', query(collection(db, 'reports'), where('processName', '==', 'FMB보관실'))],
  ['changePoints limit200 (대시보드)', query(collection(db, 'changePoints'), orderBy('createdAt', 'desc'), limit(200))]
];

for (const [label, q] of runs) {
  try {
    await measure(label, q);
  } catch (e) {
    console.log(`${label.padEnd(34)} 조회 실패: ${e.message}`);
  }
}
process.exit(0);
