/**
 * scan_defect_names.mjs  (읽기 전용 — Firestore에 쓰지 않음)
 *
 * 운영 Firestore daily_stats 의 defectBreakdowns / items.*.defects 에 저장된
 * 불량 명칭을 모두 모아 표준명(src/constants/defectAliases.js)으로 어떻게 합쳐지는지 보고한다.
 *
 * 실행: node scripts/utils/scan_defect_names.mjs [출력JSON경로]
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { writeFileSync } from 'node:fs';
import { loadServiceAccount } from './loadServiceAccount.mjs';
import { normalizeDefectName } from '../../src/constants/defectAliases.js';

initializeApp({ credential: cert(loadServiceAccount()) });
const db = getFirestore();

const snap = await db.collection('daily_stats').get();
const raw = {};      // 저장된 원본 명칭 → 합계 (defectBreakdowns 기준)
const rawItems = {}; // items.*.defects 기준
snap.forEach((doc) => {
  const d = doc.data();
  for (const [k, v] of Object.entries(d.defectBreakdowns || {})) raw[k] = (raw[k] || 0) + Number(v || 0);
  for (const combo of Object.values(d.items || {})) {
    for (const [k, v] of Object.entries(combo?.defects || {})) rawItems[k] = (rawItems[k] || 0) + Number(v || 0);
  }
});

const toGroups = (src) => {
  const g = {};
  for (const [k, v] of Object.entries(src)) {
    const c = normalizeDefectName(k);
    (g[c] ||= { total: 0, variants: {} });
    g[c].total += v;
    g[c].variants[k] = v;
  }
  return g;
};
const groups = toGroups(raw);
const out = process.argv[2];
if (out) writeFileSync(out, JSON.stringify({ docs: snap.size, raw, rawItems, groups }, null, 1));

console.log(`daily_stats 문서 ${snap.size}건, 원본 불량명 ${Object.keys(raw).length}종 → 표준명 ${Object.keys(groups).length}종`);
const legacy = Object.entries(raw).filter(([k]) => /^\[검사_|기스|스카치|쪼개짐|기장|조인트 빠짐/.test(k));
console.log('과거 표기 잔존:', legacy.length ? legacy.map(([k, v]) => `${k}=${v}`).join(', ') : '없음');
console.log('--- 표준명별 합계 (원본이 2종 이상 합쳐진 것) ---');
Object.entries(groups)
  .filter(([, g]) => Object.keys(g.variants).length > 1)
  .sort((a, b) => b[1].total - a[1].total)
  .forEach(([c, g]) => console.log(`${c}: ${g.total} ← ${Object.keys(g.variants).length}종`));
