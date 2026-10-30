/**
 * fix_scorch_typo.mjs
 * Firestore daily_stats 및 reports 컬렉션 내 '스카치' 오타를 '스코치'로 일괄 수정합니다.
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, FieldPath } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = resolve(__dirname, '../../serviceAccountKey.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  console.log('🔍 Firestore daily_stats 문서에서 "스카치" 검색 및 수정 시작...');
  const statsSnap = await db.collection('daily_stats').get();
  let updatedStats = 0;

  for (const docSnap of statsSnap.docs) {
    const data = docSnap.data();
    const updateMap = new Map();
    let hasChange = false;

    // 1. defectBreakdowns 필드 확인
    const breakdowns = data.defectBreakdowns || {};
    for (const [k, v] of Object.entries(breakdowns)) {
      if (k.includes('스카치')) {
        const newKey = k.replace(/스카치/g, '스코치');
        const existing = breakdowns[newKey] || 0;
        updateMap.set(`defectBreakdowns.${k}`, {
          path: new FieldPath('defectBreakdowns', k),
          val: FieldValue.delete()
        });
        updateMap.set(`defectBreakdowns.${newKey}`, {
          path: new FieldPath('defectBreakdowns', newKey),
          val: existing + Number(v || 0)
        });
        hasChange = true;
      }
    }

    // 2. items.*.defects 필드 확인
    const items = data.items || {};
    for (const [itemKey, itemData] of Object.entries(items)) {
      const defects = (itemData && itemData.defects) || {};
      for (const [k, v] of Object.entries(defects)) {
        if (k.includes('스카치')) {
          const newKey = k.replace(/스카치/g, '스코치');
          const existing = defects[newKey] || 0;
          updateMap.set(`items.${itemKey}.defects.${k}`, {
            path: new FieldPath('items', itemKey, 'defects', k),
            val: FieldValue.delete()
          });
          updateMap.set(`items.${itemKey}.defects.${newKey}`, {
            path: new FieldPath('items', itemKey, 'defects', newKey),
            val: existing + Number(v || 0)
          });
          hasChange = true;
        }
      }
    }

    if (hasChange && updateMap.size > 0) {
      const updates = [];
      for (const [_, item] of updateMap) {
        updates.push(item.path, item.val);
      }
      await docSnap.ref.update(...updates);
      updatedStats++;
      console.log(`  ✅ daily_stats/${docSnap.id} 수정 완료`);
    }
  }

  console.log(`\n📊 daily_stats 총 ${statsSnap.size}개 문서 중 ${updatedStats}개 문서 수정 완료.`);

  // 3. reports 컬렉션에서도 혹시 '스카치' 문자열이 있는지 점검
  console.log('\n🔍 Firestore reports 문서에서 "스카치" 검색 중...');
  const reportsSnap = await db.collection('reports').get();
  let foundReports = 0;
  for (const docSnap of reportsSnap.docs) {
    const raw = JSON.stringify(docSnap.data());
    if (raw.includes('스카치')) {
      foundReports++;
      console.log(`  ⚠️ reports/${docSnap.id} 에서 '스카치' 발견`);
    }
  }
  console.log(`📋 reports 총 ${reportsSnap.size}개 문서 중 '스카치' 포함 문서: ${foundReports}개`);
}

run().catch(err => {
  console.error('❌ 오류 발생:', err);
  process.exit(1);
});
