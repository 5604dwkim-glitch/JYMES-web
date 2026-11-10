/**
 * rebuild_daily_stats.mjs
 * reports 컬렉션 전체를 기준으로 daily_stats(대시보드 차트 집계)를 처음부터 다시 계산합니다.
 *  - 기본(드라이런): 현재 daily_stats 와 재계산 결과의 차이만 출력
 *  - --apply        : 재계산 결과로 daily_stats 를 교체(없는 날짜 문서는 삭제)
 * 집계 기준은 src/services/statsAggregator.js 의 buildStatsUpdate 와 동일합니다.
 * (상태가 '임시저장' / '반려' 인 일보는 제외)
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { buildStatsUpdate } from '../../src/services/statsAggregator.js';
import { loadServiceAccount } from './loadServiceAccount.mjs';

const APPLY = process.argv.includes('--apply');
const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = loadServiceAccount();
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function mergeSum(target, src) {
  for (const [k, v] of Object.entries(src)) {
    if (typeof v === 'number') target[k] = (target[k] || 0) + v;
    else if (v && typeof v === 'object') mergeSum(target[k] || (target[k] = {}), v);
  }
  return target;
}

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj || {})) {
    const p = prefix ? `${prefix}\u0001${k}` : k;
    if (typeof v === 'number') { if (v !== 0) out[p] = v; }
    else if (v && typeof v === 'object') flatten(v, p, out);
  }
  return out;
}

// 반장/지게차/출하지원/FMB보관실 일보는 앱(fetchReports)과 동일하게 '공통' 으로 통일 (품목코드도 '공통')
function normalize(r) {
  if (r.isLeaderForm || r.processName === '반장 작업일보') { r.carModel = '공통'; r.itemName = '공통'; r.itemCode = '공통'; r.processName = '반장 작업일보'; }
  if (r.isForkliftForm || r.processName === '지게차작업') { r.carModel = '공통'; r.itemName = '공통'; r.itemCode = '공통'; r.processName = '지게차작업'; }
  if (r.isSupportForm || r.processName === '출하지원') { r.carModel = '공통'; r.itemName = '공통'; r.itemCode = '공통'; r.processName = '출하지원'; }
  if (r.isFmbForm || r.processName === 'FMB보관실') { r.carModel = '공통'; r.itemName = '공통'; r.itemCode = '공통'; r.processName = 'FMB보관실'; }
  return r;
}

async function main() {
  const repSnap = await db.collection('reports').get();
  const rebuilt = {};
  let counted = 0;
  repSnap.forEach(d => {
    const r = normalize({ id: d.id, ...d.data() });
    if (!r.date) return;
    const diff = buildStatsUpdate(null, r);
    if (Object.keys(diff).length === 0) return;
    counted++;
    mergeSum(rebuilt[r.date] || (rebuilt[r.date] = {}), diff);
  });
  console.log(`reports ${repSnap.size}건 중 집계 대상 ${counted}건 → ${Object.keys(rebuilt).length}개 날짜`);

  const statSnap = await db.collection('daily_stats').get();
  const existing = {};
  statSnap.forEach(d => { existing[d.id] = d.data(); });

  let diffDates = 0;
  const allDates = new Set([...Object.keys(existing), ...Object.keys(rebuilt)]);
  for (const date of [...allDates].sort()) {
    const a = flatten(existing[date]);
    const b = flatten(rebuilt[date]);
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    const diffs = [];
    keys.forEach(k => { if ((a[k] || 0) !== (b[k] || 0)) diffs.push(`${k.replace(/\u0001/g, '.')}: ${a[k] || 0} → ${b[k] || 0}`); });
    if (diffs.length) {
      diffDates++;
      console.log(`\n[${date}] 차이 ${diffs.length}건` + (!rebuilt[date] ? ' (재계산 결과 없음 → 삭제 대상)' : ''));
      diffs.slice(0, 12).forEach(x => console.log('   ', x));
      if (diffs.length > 12) console.log(`    ... 외 ${diffs.length - 12}건`);
    }
  }
  console.log(`\n차이가 있는 날짜: ${diffDates}개 / 전체 ${allDates.size}개`);

  if (!APPLY) { console.log('\n(드라이런) 반영하려면 --apply 옵션으로 다시 실행하세요.'); return; }

  // 반영 전 현재 daily_stats 백업 (문제 시 복원용)
  const backupPath = resolve(__dirname, `../archive/backups/daily_stats_backup_${Date.now()}.json`);
  writeFileSync(backupPath, JSON.stringify(existing, null, 1), 'utf8');
  console.log(`백업 저장: ${backupPath}`);

  let written = 0, deleted = 0;
  for (const date of allDates) {
    if (rebuilt[date]) { await db.collection('daily_stats').doc(date).set(rebuilt[date]); written++; }
    else if (existing[date]) { await db.collection('daily_stats').doc(date).delete(); deleted++; }
  }
  console.log(`\n✅ 반영 완료: ${written}개 문서 갱신, ${deleted}개 문서 삭제`);
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
