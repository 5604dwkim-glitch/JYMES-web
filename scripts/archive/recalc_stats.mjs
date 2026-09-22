import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { extractDefectBreakdown } from '../../src/services/statsAggregator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccount = JSON.parse(readFileSync(resolve(__dirname, '../../serviceAccountKey.json'), 'utf8'));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

async function run() {
  console.log('Fetching all reports...');
  const reportsSnap = await db.collection('reports').get();
  
  const dailyMap = {};
  
  reportsSnap.forEach(doc => {
    const r = doc.data();
    if (r.status === '반려' || r.status === '임시저장') return;
    
    const date = r.date;
    if (!date) return;
    
    if (!dailyMap[date]) {
      dailyMap[date] = {
        defectBreakdowns: {},
        items: {}
      };
    }
    
    const stats = dailyMap[date];
    const defects = extractDefectBreakdown(r);
    
    // Aggregate global breakdowns
    Object.entries(defects).forEach(([k, v]) => {
      const encodedK = k.replace(/[\.\\/]/g, '_');
      stats.defectBreakdowns[encodedK] = (stats.defectBreakdowns[encodedK] || 0) + v;
    });
    
    // Aggregate item breakdowns
    const car = r.carModel || '기타';
    const item = r.itemCode || r.itemName || '기타';
    const proc = r.processName || '기타';
    const itemKey = `${car}::${item}::${proc}`.replace(/[\.\\/\[\]]/g, '_');
    
    if (!stats.items[itemKey]) {
      stats.items[itemKey] = { defects: {} };
    }
    const itemStats = stats.items[itemKey];
    
    Object.entries(defects).forEach(([k, v]) => {
      const encodedK = k.replace(/[\.\\/]/g, '_');
      itemStats.defects[encodedK] = (itemStats.defects[encodedK] || 0) + v;
    });
  });
  
  console.log(`Found ${Object.keys(dailyMap).length} days of data to update.`);
  
  const batch = db.batch();
  let count = 0;
  let batchCount = 0;
  
  for (const [date, stats] of Object.entries(dailyMap)) {
    const docRef = db.collection('daily_stats').doc(date);
    
    // We overwrite defectBreakdowns and update items.*.defects
    const existing = await docRef.get();
    if (existing.exists) {
      const data = existing.data();
      const updates = {};
      
      updates.defectBreakdowns = stats.defectBreakdowns;
      
      const existingItems = data.items || {};
      const newItems = { ...existingItems };
      
      // For all items in our recalculation, overwrite their defects field
      Object.entries(stats.items).forEach(([itemKey, itemData]) => {
        if (!newItems[itemKey]) {
            newItems[itemKey] = {};
        }
        newItems[itemKey].defects = itemData.defects;
      });
      
      // Also for items that exist in DB but not in recalculation (e.g. deleted reports), we should probably clear their defects?
      // Yes, clear them if they are not in our recalc.
      Object.keys(newItems).forEach(itemKey => {
          if (!stats.items[itemKey]) {
              newItems[itemKey].defects = {};
          }
      });
      
      updates.items = newItems;
      
      batch.update(docRef, updates);
      count++;
      batchCount++;
      
      if (batchCount === 400) {
        await batch.commit();
        console.log(`Committed ${count} updates`);
        batchCount = 0;
      }
    }
  }
  
  if (batchCount > 0) {
    await batch.commit();
    console.log(`Committed ${count} updates`);
  }
  
  console.log('Done!');
}

run().catch(console.error);
