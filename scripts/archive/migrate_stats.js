import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, increment } from 'firebase/firestore';
import { extractDefectBreakdown } from '../../src/services/statsAggregator.js';

const firebaseConfig = {
  apiKey: "AIzaSyBk0b1VfUQsY69YY2ATRIQ4zWKr1pQHMJI",
  authDomain: "jy001-eb144.firebaseapp.com",
  projectId: "jy001-eb144",
  storageBucket: "jy001-eb144.firebasestorage.app",
  messagingSenderId: "1079897779096",
  appId: "1:1079897779096:web:6f9d2a2acdc1c8a2e2d9ed",
  measurementId: "G-LX68WLEF4R"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateStats() {
  console.log("Fetching all reports...");
  const snapshot = await getDocs(collection(db, 'reports'));
  
  const dailyAgg = {};

  snapshot.forEach(docSnap => {
    const r = docSnap.data();
    if (r.status === '반려' || r.status === '임시저장') return;
    if (!r.date) return;

    if (!dailyAgg[r.date]) {
      dailyAgg[r.date] = {
        totalReports: 0,
        totalTargetQty: 0,
        totalActualQty: 0,
        totalDefectQty: 0,
        defectBreakdowns: {}
      };
    }

    const agg = dailyAgg[r.date];
    agg.totalReports += 1;
    agg.totalTargetQty += Number(r.targetQty || 0);
    agg.totalActualQty += Number(r.actualQty || 0);
    agg.totalDefectQty += Number(r.defectQty || 0);

    const defects = extractDefectBreakdown(r);
    for (const [k, v] of Object.entries(defects)) {
      agg.defectBreakdowns[k] = (agg.defectBreakdowns[k] || 0) + v;
    }

    if (!agg.items) agg.items = {};
    const car = r.carModel || '기타';
    const item = r.itemCode || r.itemName || '기타';
    const proc = r.processName || '기타';
    const comboKey = `${car}::${item}::${proc}`.replace(/[\.\/\[\]]/g, '_');
    
    if (!agg.items[comboKey]) agg.items[comboKey] = {};
    const combo = agg.items[comboKey];
    
    const act = Number(r.actualQty || 0);
    const def = Number(r.defectQty || 0);
    if (act !== 0) combo.actualQty = (combo.actualQty || 0) + act;
    if (def !== 0) combo.defectQty = (combo.defectQty || 0) + def;
    
    if (Object.keys(defects).length > 0) {
      if (!combo.defects) combo.defects = {};
      Object.entries(defects).forEach(([k, v]) => {
        const dk = k.replace(/[\.\/]/g, '_');
        combo.defects[dk] = (combo.defects[dk] || 0) + v;
      });
    }
  });

  console.log(`Aggregated stats for ${Object.keys(dailyAgg).length} days. Writing to Firestore...`);

  let count = 0;
  for (const [date, agg] of Object.entries(dailyAgg)) {
    const statsRef = doc(db, 'daily_stats', date);
    await setDoc(statsRef, agg);
    count++;
    if (count % 10 === 0) console.log(`Wrote ${count} days...`);
  }

  console.log("Migration complete!");
}

migrateStats().catch(console.error);
