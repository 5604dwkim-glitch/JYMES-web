/**
 * backfill_mold_strokes.mjs
 * 금형 누적 타수 소급 반영 (일회성 · 기본은 미리보기 / --apply 를 붙여야 실제 반영)
 *
 * 배경: 작업일보 최종 제출 상태는 '승인 대기' 인데 누적 로직이 '제출완료' 만 처리하여
 *       제출된 일보의 금형 타수가 누적에 한 번도 반영되지 않았다. (버그 수정 이후 신규 일보부터는 자동 반영)
 *
 * 대상: 임시저장이 아니고 moldStrokesProcessed 가 없으며 금일 금형 타수가 입력된 일보
 * 금형 식별: 저장된 moldRefs(금형 고유 ID) 우선, 없으면 3002 양식에 한해 (차종 + 부위 라벨 + 호기)로 유일 매칭
 * 사용: node scripts/utils/backfill_mold_strokes.mjs          (미리보기)
 *       node scripts/utils/backfill_mold_strokes.mjs --apply  (실제 반영)
 */
import { db } from '../../src/firebase.js';
import { collection, getDocs, doc, writeBatch, increment } from 'firebase/firestore';

const APPLY = process.argv.includes('--apply');

const [repSnap, moldSnap] = await Promise.all([
  getDocs(collection(db, 'reports')),
  getDocs(collection(db, 'molds'))
]);
const molds = moldSnap.docs.map(d => ({ id: d.id, ...d.data() }));
const moldById = new Map(molds.map(m => [m.id, m]));
const reports = repSnap.docs
  .map(d => ({ id: d.id, ...d.data() }))
  .filter(r => r.status && r.status !== '임시저장' && !r.moldStrokesProcessed)
  .sort((a, b) => (a.id || '').localeCompare(b.id || ''));

const label3002 = (suffix) => {
  const isRh = suffix.endsWith('_2');
  const base = suffix.replace(/_2$/, '');
  const side = isRh ? 'RH' : 'LH';
  const map = {
    frt_p: `FRT ${side}(P)`,
    frt_q: `FRT ${side}(Q)`,
    rr_r: `RR ${side}(R)`,
    rr_s: `RR ${side}(S)`
  };
  return map[base] || null;
};

const addByMold = new Map(); // moldId -> 증가분
const reportsToFlag = [];
const unresolvedLog = [];
let scanned = 0;

for (const r of reports) {
  const refs = r.moldRefs || {};
  const tables = [
    [r.vulcTable || r.vulcData || {}, 'vulc'],
    [r.vulcTable2 || r.vulcData2 || {}, 'vulc2']
  ];
  const entries = [];
  for (const [table, prefix] of tables) {
    for (const key of Object.keys(table)) {
      if (!key.startsWith('mold_')) continue;
      const moldVal = String(table[key] || '').trim();
      const suffix = key.slice(5);
      const stroke = Number(table['stroke_' + suffix]) || 0;
      if (!moldVal || !stroke) continue;
      entries.push({ prefix, suffix, moldVal, stroke });
    }
  }
  if (entries.length === 0) continue;
  scanned++;

  let resolvedCount = 0;
  const lines = [];
  for (const e of entries) {
    let mold = null;
    const refId = refs[`${e.prefix}_mold_${e.suffix}`];
    if (refId && moldById.has(refId)) mold = moldById.get(refId);
    if (!mold && Number(r.formCode) === 3002) {
      const label = label3002(e.suffix);
      if (label) {
        const cands = molds.filter(m =>
          m.carModel === r.carModel && m.moldType === label && String(m.moldNumber || m.code) === e.moldVal);
        if (cands.length === 1) mold = cands[0];
      }
    }
    if (mold) {
      resolvedCount++;
      addByMold.set(mold.id, (addByMold.get(mold.id) || 0) + e.stroke);
      lines.push(`   ✔ ${e.prefix}_${e.suffix} 호기 ${e.moldVal} +${e.stroke} → ${mold.carModel}/${mold.partName}/${mold.moldType} #${mold.moldNumber}`);
    } else {
      lines.push(`   ✘ ${e.prefix}_${e.suffix} 호기 ${e.moldVal} +${e.stroke} → 금형 특정 불가(건너뜀)`);
      unresolvedLog.push(`${r.id} ${e.prefix}_${e.suffix} 호기 ${e.moldVal} +${e.stroke}`);
    }
  }
  console.log(`[${r.id}] code=${r.formCode} ${r.carModel} status=${r.status} (${resolvedCount}/${entries.length} 반영 가능)`);
  lines.forEach(l => console.log(l));
  if (resolvedCount > 0) reportsToFlag.push(r.id);
}

console.log(`\n타수 입력 일보 ${scanned}건 / 반영 대상 금형 ${addByMold.size}개 / 특정 불가 항목 ${unresolvedLog.length}건`);
if (!APPLY) {
  console.log('※ 미리보기입니다. 실제 반영은 --apply 옵션을 붙여 다시 실행하세요.');
  process.exit(0);
}

let batch = writeBatch(db);
let ops = 0;
const flush = async () => { if (ops > 0) { await batch.commit(); batch = writeBatch(db); ops = 0; } };
for (const [moldId, add] of addByMold) {
  batch.update(doc(db, 'molds', moldId), { currentStrokes: increment(add) });
  if (++ops >= 400) await flush();
}
for (const rid of reportsToFlag) {
  batch.update(doc(db, 'reports', rid), { moldStrokesProcessed: true });
  if (++ops >= 400) await flush();
}
await flush();
console.log(`반영 완료: 금형 ${addByMold.size}개 타수 증가, 일보 ${reportsToFlag.length}건 처리 표시`);
process.exit(0);
