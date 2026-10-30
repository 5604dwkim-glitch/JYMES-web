// 일회성 보정: RPT-20261007-102 의 RH 정품수량 1588514 -> 1588 (앞 4자리만 유지)
// 일보(actualQty/targetQty 포함)를 수정하고, 앱과 동일한 buildStatsUpdate 로 daily_stats 를 증감 보정한다.
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { buildStatsUpdate } from '../../src/services/statsAggregator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
initializeApp({ credential: cert(JSON.parse(readFileSync(resolve(__dirname, '../../serviceAccountKey.json'), 'utf8'))) });
const db = getFirestore();

const REPORT_ID = 'RPT-20261007-102';
const ref = db.collection('reports').doc(REPORT_ID);
const snap = await ref.get();
const oldReport = snap.data();

const oldRH = String(oldReport.dtCrewQty['정품수량_RH']);
const newRH = oldRH.substring(0, 4);
console.log(`RH 정품수량: ${oldRH} -> ${newRH}`);

const newReport = JSON.parse(JSON.stringify(oldReport));
newReport.dtCrewQty['정품수량_RH'] = newRH;

const good = ['LH', 'RH'].reduce((s, p) => s + (Number(newReport.dtCrewQty[`정품수량_${p}`]) || 0), 0)
  + ['LH3', 'LH4', 'RH2', 'RH4'].reduce((s, p) => s + (Number(newReport.dtCrewQtyB?.[`정품수량_${p}`]) || 0), 0);
newReport.actualQty = good;
newReport.targetQty = good + Number(oldReport.defectQty || 0);
console.log(`actualQty: ${oldReport.actualQty} -> ${newReport.actualQty}, targetQty: ${oldReport.targetQty} -> ${newReport.targetQty}`);

const diff = buildStatsUpdate(oldReport, newReport);
const toInc = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) =>
  [k, typeof v === 'number' ? FieldValue.increment(v) : toInc(v)]));
console.log('stats diff:', JSON.stringify(diff));

await ref.update({
  'dtCrewQty.정품수량_RH': newRH,
  actualQty: newReport.actualQty,
  targetQty: newReport.targetQty,
});
if (Object.keys(diff).length) {
  await db.collection('daily_stats').doc(oldReport.date).set(toInc(diff), { merge: true });
}
console.log('done');
const stat = (await db.collection('daily_stats').doc(oldReport.date).get()).data();
console.log('daily_stats', oldReport.date, 'totalActualQty=', stat.totalActualQty, 'totalTargetQty=', stat.totalTargetQty);
