import { db } from '../../src/firebase.js';
import { collection, getDocs } from 'firebase/firestore';

const [repSnap, moldSnap] = await Promise.all([
  getDocs(collection(db, 'reports')),
  getDocs(collection(db, 'molds'))
]);

const today = new Date().toLocaleDateString('sv-SE');
const reports = repSnap.docs
  .map(d => ({ id: d.id, ...d.data() }))
  .filter(r => (r.date || '') >= '2026-11-01' && r.vulcTable)
  .sort((a, b) => (b.id || '').localeCompare(a.id || ''))
  .slice(0, 6);

console.log('오늘:', today, '/ 최근 조인트 일보', reports.length, '건');
for (const r of reports) {
  const pick = (t) => Object.fromEntries(Object.entries(t || {}).filter(([k, v]) => /^(mold|stroke)_/.test(k) && v !== '' && v != null));
  console.log('---', r.id, 'code=' + r.formCode, r.carModel, r.partName || '', r.processName, 'status=' + r.status,
    'processed=' + r.moldStrokesProcessed, 'worker=' + r.workerName, 'created=' + r.createdAt);
  console.log('  vulcTable:', JSON.stringify(pick(r.vulcTable)));
  if (r.vulcTable2) console.log('  vulcTable2:', JSON.stringify(pick(r.vulcTable2)));
  console.log('  moldRefs:', JSON.stringify(r.moldRefs || null));
}

const molds = moldSnap.docs.map(d => ({ id: d.id, ...d.data() }));
const withStrokes = molds.filter(m => Number(m.currentStrokes || 0) > 0);
console.log('\n누적타수 > 0 인 금형:', withStrokes.length, '/', molds.length);
withStrokes.forEach(m => console.log(' -', m.id, m.code, m.moldNumber, m.carModel, m.partName, m.moldType, '=>', m.currentStrokes));
process.exit(0);
