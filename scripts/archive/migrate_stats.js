import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, increment } from 'firebase/firestore';
import { extractDefectBreakdown } from '../src/services/statsAggregator.js';

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
  });

  console.log(`Aggregated stats for ${Object.keys(dailyAgg).length} days. Writing to Firestore...`);

  let count = 0;
  for (const [date, agg] of Object.entries(dailyAgg)) {
    const statsRef = doc(db, 'daily_stats', date);
    await setDoc(statsRef, agg, { merge: true });
    count++;
    if (count % 10 === 0) console.log(`Wrote ${count} days...`);
  }

  console.log("Migration complete!");
}

migrateStats().catch(console.error);
