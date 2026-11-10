/**
 * inspect-heavy-fields.mjs — molds / equipments / workers 문서에서 용량을 차지하는 필드명 상위 목록을 출력 (읽기 전용 일회성 진단)
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyBk0b1VfUQsY69YY2ATRIQ4zWKr1pQHMJI',
  authDomain: 'jy001-eb144.firebaseapp.com',
  projectId: 'jy001-eb144',
  appId: '1:1079897779096:web:6f9d2a2acdc1c8a2e2d9ed'
});
const db = getFirestore(app);

function walk(value, path, acc) {
  if (typeof value === 'string') {
    if (value.startsWith('data:image')) acc.set(path, (acc.get(path) || 0) + value.length);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v) => walk(v, `${path}[]`, acc));
    return;
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([k, v]) => walk(v, path ? `${path}.${k}` : k, acc));
  }
}

for (const name of ['molds', 'equipments', 'workers']) {
  const snap = await getDocs(collection(db, name));
  const acc = new Map();
  snap.forEach((d) => walk(d.data(), '', acc));
  const rows = [...acc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  console.log(`\n[${name}] 이미지 필드 상위`);
  rows.forEach(([p, n]) => console.log(`  ${p.padEnd(40)} ${(n / 1024).toFixed(1)} KB`));
}
process.exit(0);
