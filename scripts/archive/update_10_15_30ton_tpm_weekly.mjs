import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { loadServiceAccount } from '../utils/loadServiceAccount.mjs';

const TARGET_SPECS = new Set(['10ton', '15ton', '30ton']);
const NEW_CRITERION = '관리선(Max, Min)내에 있는가?(설비하단 게이지)';

async function main() {
  initializeApp({ credential: cert(loadServiceAccount()) });
  const db = getFirestore();
  const snap = await db.collection('equipments').get();

  const batch = db.batch();
  let updatedCount = 0;

  snap.forEach((docSnap) => {
    const data = docSnap.data();
    const spec = String(data.spec || '').replace(/\s+/g, '').toLowerCase();
    if (!TARGET_SPECS.has(spec)) return;
    if (!data.tpmTemplate || !Array.isArray(data.tpmTemplate.weekly)) return;

    let changed = false;
    const nextWeekly = data.tpmTemplate.weekly.map((w) => {
      const partCompact = String(w?.part || '').replace(/\s+/g, '');
      const crit = String(w?.criterion || '').trim();
      if (partCompact === '오일게이지' && crit !== NEW_CRITERION) {
        changed = true;
        return { ...w, criterion: NEW_CRITERION };
      }
      return w;
    });

    if (changed) {
      batch.update(docSnap.ref, {
        'tpmTemplate.weekly': nextWeekly
      });
      updatedCount += 1;
      console.log(`Queued update: ${docSnap.id} (${data.code} / ${data.spec})`);
    }
  });

  if (updatedCount > 0) {
    await batch.commit();
  }
  console.log(`Updated ${updatedCount} custom tpmTemplate docs.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
