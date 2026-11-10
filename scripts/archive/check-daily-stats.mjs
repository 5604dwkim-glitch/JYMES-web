/**
 * check-daily-stats.mjs
 * 왜 특정 일보들이 daily_stats에 반영되지 않았거나 차감만 되었는지 확인하는 스크립트.
 */
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyBk0b1VfUQsY69YY2ATRIQ4zWKr1pQHMJI',
  authDomain: 'jy001-eb144.firebaseapp.com',
  projectId: 'jy001-eb144',
  appId: '1:1079897779096:web:6f9d2a2acdc1c8a2e2d9ed'
});
const db = getFirestore(app);

for (const dt of ['2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10']) {
  const repSnap = await getDocs(query(collection(db, 'reports'), where('date', '==', dt)));
  const reps = [];
  repSnap.forEach((d) => reps.push({ id: d.id, ...d.data() }));
  reps.sort((a, b) => a.id.localeCompare(b.id));
  const valid = reps.filter((r) => r.status !== '반려' && r.status !== '임시저장');
  console.log(`\n=== ${dt} VALID REPORTS (${valid.length}) ===`);
  let sumT = 0, sumA = 0, sumD = 0;
  for (const r of valid) {
    sumT += Number(r.targetQty || 0);
    sumA += Number(r.actualQty || 0);
    sumD += Number(r.defectQty || 0);
    console.log(
      `${r.id.padEnd(18)} | status=${r.status} | code=${String(r.formCode).padEnd(5)} | ${String(r.carModel).padEnd(8)} | ${String(r.processName).padEnd(10)} | worker=${String(r.workerName).padEnd(6)} | T=${String(r.targetQty).padStart(5)} | A=${String(r.actualQty).padStart(5)} | D=${String(r.defectQty).padStart(3)} | cum(T=${sumT}, A=${sumA}, D=${sumD}) | created=${r.createdAt}`
    );
  }
}
process.exit(0);
