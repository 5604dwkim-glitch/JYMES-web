import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { loadServiceAccount } from '../utils/loadServiceAccount.mjs';

async function main() {
  initializeApp({ credential: cert(loadServiceAccount()) });
  const db = getFirestore();

  const [moldsSnap, photosSnap] = await Promise.all([
    db.collection('molds').get(),
    db.collection('mold_photos').get()
  ]);

  const photoIds = new Set();
  photosSnap.forEach((d) => {
    const val = d.data()?.moldPhoto;
    if (typeof val === 'string' && val.trim().length > 0) {
      photoIds.add(d.id);
    }
  });

  const batch = db.batch();
  let trueCount = 0;
  let falseCount = 0;

  moldsSnap.forEach((d) => {
    const hasInline = Boolean(String(d.data()?.moldPhoto || '').trim());
    const hasPhoto = photoIds.has(d.id) || hasInline;
    if (hasPhoto) trueCount += 1;
    else falseCount += 1;
    batch.update(d.ref, { hasPhoto });
  });

  await batch.commit();
  console.log(`Updated ${moldsSnap.size} molds -> hasPhoto=true: ${trueCount}, hasPhoto=false: ${falseCount}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
