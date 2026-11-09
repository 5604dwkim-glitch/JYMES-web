// 읽기 전용: 클립머신 일보의 생산수량(actualQty) 점검. 사용: node scripts/utils/check_clip_qty.mjs 2026-08-01 2026-10-31
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { loadServiceAccount } from './loadServiceAccount.mjs';

const serviceAccount = loadServiceAccount();
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const [from = '2026-08-01', to = '2026-10-31'] = process.argv.slice(2);

const snap = await db.collection('reports').get();
const rows = [];
snap.forEach(doc => {
  const r = doc.data();
  if (!r.date || r.date < from || r.date > to) return;
  if (r.processName !== '클립머신') return;
  rows.push({
    id: doc.id, date: r.date, formCode: r.formCode, car: r.carModel, item: r.itemCode || r.itemName,
    status: r.status, worker: r.workerName,
    target: Number(r.targetQty || 0), actual: Number(r.actualQty || 0), defect: Number(r.defectQty || 0),
  });
});
rows.sort((a, b) => a.date.localeCompare(b.date));
console.log(`clip reports ${from}~${to}: ${rows.length}`);
rows.forEach(r => console.log(JSON.stringify(r)));
