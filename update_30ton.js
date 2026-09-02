import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from './src/firebase.js';

const ancillaryEquipments = [
  { name: '디지털 온도계', spec: 'NX4', qty: '2', manufacturer: '오토닉스', note: '' },
  { name: '디지털 타이머', spec: 'FX4S', qty: '1', manufacturer: '오토닉스', note: '' },
  { name: '히타봉', spec: '100*300*220V*1200W', qty: '4', manufacturer: '삼성히타', note: '' },
  { name: '작동 릴레이', spec: 'Φ 80', qty: '3', manufacturer: 'Honeywell', note: '' }
];

async function run() {
  console.log('Updating 30 TON equipments...');
  const coll = collection(db, 'equipments');
  const q = query(coll, where('spec', '==', '30 TON'));
  const snap = await getDocs(q);
  
  for (const eq of snap.docs) {
    await updateDoc(doc(db, 'equipments', eq.id), {
      manufacturingDate: '2023-06-01',
      name: 'TPV 인젝션프레스',
      manufacturer: '극동기계',
      ancillaryEquipments: ancillaryEquipments
    });
    console.log('Updated', eq.data().code);
  }
  console.log('Done!');
  process.exit(0);
}

run();
