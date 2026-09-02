const fs = require('fs');
let code = fs.readFileSync('src/services/firestore.js', 'utf8');

const moldStrokesLogic = `
export async function processMoldStrokes(reportData, existingReport = null) {
  // Only process for formCode 3002 (조인트) and when submitting (not drafting)
  if (reportData.formCode !== 3002 || reportData.status !== '제출완료') return;

  // If already processed previously, we should calculate the diff.
  // For simplicity now, if it was already processed, we skip or handle basic diff.
  const isUpdate = existingReport && existingReport.status === '제출완료' && existingReport.moldStrokesProcessed;
  
  const v = reportData.vulcTable || {};
  const qty = reportData.jointQtyTable || {};
  const prevQty = existingReport ? (existingReport.jointQtyTable || {}) : {};

  // Table 1 (usually LH)
  const molds1 = [
    { moldId: v.mold_frt_p_1, qtyKey: '3002_qty_ok_FRT LH' },
    { moldId: v.mold_frt_q_1, qtyKey: '3002_qty_ok_FRT LH' },
    { moldId: v.mold_rr_r_1, qtyKey: '3002_qty_ok_RR LH' },
    { moldId: v.mold_rr_s_1, qtyKey: '3002_qty_ok_RR LH' },
  ];

  // Table 2 (usually RH)
  const molds2 = [
    { moldId: v.mold_frt_p_2, qtyKey: '3002_qty_ok_FRT RH' },
    { moldId: v.mold_frt_q_2, qtyKey: '3002_qty_ok_FRT RH' },
    { moldId: v.mold_rr_r_2, qtyKey: '3002_qty_ok_RR RH' },
    { moldId: v.mold_rr_s_2, qtyKey: '3002_qty_ok_RR RH' },
  ];

  const allMolds = [...molds1, ...molds2];

  // Aggregate strokes per mold ID
  const strokeUpdates = {};
  for (const item of allMolds) {
    if (item.moldId && item.moldId.trim() !== '') {
      const currentOk = Number(qty[item.qtyKey]) || 0;
      const prevOk = isUpdate ? (Number(prevQty[item.qtyKey]) || 0) : 0;
      const diff = currentOk - prevOk;
      
      if (diff !== 0) {
        if (!strokeUpdates[item.moldId]) strokeUpdates[item.moldId] = 0;
        strokeUpdates[item.moldId] += diff;
      }
    }
  }

  // Find and update molds in Firestore
  if (Object.keys(strokeUpdates).length > 0) {
    for (const [moldCode, strokesToAdd] of Object.entries(strokeUpdates)) {
      if (strokesToAdd === 0) continue;
      
      try {
        const q = query(collection(db, 'molds'), where('code', '==', moldCode), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const moldDoc = snapshot.docs[0];
          const currentStrokes = moldDoc.data().currentStrokes || 0;
          await updateDoc(doc(db, 'molds', moldDoc.id), {
            currentStrokes: currentStrokes + strokesToAdd
          });
        }
      } catch (err) {
        console.error('Failed to update strokes for mold:', moldCode, err);
      }
    }
  }
}
`;

// Insert the new function before export async function addReport
code = code.replace('export async function addReport', moldStrokesLogic + '\nexport async function addReport');

fs.writeFileSync('src/services/firestore.js', code);
console.log('Added moldStrokesLogic');
