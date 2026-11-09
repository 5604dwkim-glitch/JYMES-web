/**
 * query_reports.mjs  (읽기 전용 - 데이터를 수정/삭제하지 않습니다)
 * reports 컬렉션에서 조건에 맞는 일보를 조회해 목록으로 출력합니다.
 *
 * 사용법 (프로젝트 루트에서):
 *   node scripts/utils/query_reports.mjs                      -> 기본: 9BQC 차종 일보
 *   node scripts/utils/query_reports.mjs --car=DT CREW
 *   node scripts/utils/query_reports.mjs --code=5001,5002     -> 양식 고유 번호로 조회
 *   node scripts/utils/query_reports.mjs --from=2026-10-01 --to=2026-10-31
 *   node scripts/utils/query_reports.mjs --status=임시저장
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { loadServiceAccount } from './loadServiceAccount.mjs';

const arg = (name) => {
  const hit = process.argv.find(a => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};

const car = arg('car');
const codes = (arg('code') || '').split(',').map(s => s.trim()).filter(Boolean);
const from = arg('from');
const to = arg('to');
const status = arg('status');
const hasAnyFilter = car || codes.length || from || to || status;

const serviceAccount = loadServiceAccount();
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const snap = await db.collection('reports').get();
let rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
const total = rows.length;

if (!hasAnyFilter) rows = rows.filter(r => r.carModel === '9BQC');
if (car) rows = rows.filter(r => r.carModel === car);
if (codes.length) rows = rows.filter(r => codes.includes(String(r.formCode)));
if (from) rows = rows.filter(r => (r.date || '') >= from);
if (to) rows = rows.filter(r => (r.date || '') <= to);
if (status) rows = rows.filter(r => r.status === status);

rows.sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.id || '').localeCompare(a.id || ''));

console.log(`reports 전체 ${total}건 중 조회 결과 ${rows.length}건` + (hasAnyFilter ? '' : ' (기본 조건: 차종 9BQC)'));
for (const r of rows) {
  console.log([
    r.date || '-', r.id, `code=${r.formCode ?? '-'}`, r.carModel || '-', r.partName || '-',
    r.processName || '-', r.status || '-', r.workerName || '-',
    `생산 ${r.actualQty ?? '-'}`, `불량 ${r.defectQty ?? '-'}`
  ].join(' | '));
}

// 차종별/양식번호별 요약
const byCar = {};
for (const r of snap.docs.map(d => d.data())) byCar[r.carModel || '(없음)'] = (byCar[r.carModel || '(없음)'] || 0) + 1;
console.log('\n[전체 차종별 건수]');
for (const [k, v] of Object.entries(byCar).sort((a, b) => b[1] - a[1])) console.log(`  ${k}: ${v}`);
process.exit(0);
