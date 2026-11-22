import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { loadServiceAccount } from '../utils/loadServiceAccount.mjs';

function sortLikeEquipmentList(a, b) {
  const locA = a.location || '';
  const locB = b.location || '';
  if (locA < locB) return -1;
  if (locA > locB) return 1;

  const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
  const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
  if (orderA !== orderB) return orderA - orderB;

  const codeA = a.code || '';
  const codeB = b.code || '';
  if (codeA < codeB) return -1;
  if (codeA > codeB) return 1;
  return 0;
}

async function main() {
  initializeApp({ credential: cert(loadServiceAccount()) });
  const db = getFirestore();

  const allSnap = await db.collection('equipments').get();
  const jointEquipments = [];
  allSnap.forEach((docSnap) => {
    const d = docSnap.data();
    const cat = String(d?.category || 'joint').trim();
    if (!d?.category || cat === 'joint') {
      jointEquipments.push({ id: docSnap.id, ...d });
    }
  });

  jointEquipments.sort(sortLikeEquipmentList);

  const batch = db.batch();
  jointEquipments.forEach((jointEq, idx) => {
    const seq = idx + 1;
    const docId = `cal_equip_${String(seq).padStart(3, '0')}`;
    const serialNo = `26-G-OU-${String(seq).padStart(3, '0')}`;
    const ref = db.collection('equipments').doc(docId);

    batch.set(
      ref,
      {
        category: 'measuring',
        calibrationGroup: 'equipment',
        sortOrder: seq,
        location: jointEq.location || '',
        code: jointEq.code || '',
        name: '온도지시계',
        serialNo,
        assetNo: serialNo,
        type: '온도',
        spec: '999',
        calibrationCycle: '1년',
        calibrationDate: '2024-03-15',
        nextCalibrationDate: '2025-03-15',
        manufacturer: '화승알앤에이 임대설비',
        installDate: '',
        storageLocation: '현장',
        manager: '김동욱',
        calibrationAgency: '화승알앤에이',
        ownership: '대여',
        status: '정상'
      },
      { merge: true }
    );
  });

  await batch.commit();
  console.log(
    `Seeded ${jointEquipments.length} calibration equipment items (26-G-OU-001 ~ 26-G-OU-${String(
      jointEquipments.length
    ).padStart(3, '0')}).`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
