const fs = require('fs');
let code = fs.readFileSync('src/services/firestore.js', 'utf8');

// In addReport:
// Find: return newReport;
// And inject mold logic right before it
const addTarget = `return newReport;`;
const addRepl = `// Mark as processed if submitted
    if (newReport.status === '제출완료') {
      await updateDoc(doc(db, REPORTS_COLLECTION, newId), { moldStrokesProcessed: true });
      newReport.moldStrokesProcessed = true;
    }
    
    await processMoldStrokes(newReport);
    
    return newReport;`;
code = code.replace(addTarget, addRepl);

// In updateReport:
// Find: await updateDoc(reportRef, updatedObj);
// Replace with logic that also passes the old report to calculate diffs
const updateRegex = /export async function updateReport\(id, updateData\) \{[\s\S]*?await updateDoc\(reportRef, updatedObj\);/;
const updateMatch = code.match(updateRegex);

if (updateMatch) {
  const updateRepl = updateMatch[0] + `
    
    // Fetch old report for diff
    const oldReport = (await getDoc(reportRef)).data();
    
    // Mark as processed if submitted
    if (updatedObj.status === '제출완료' && (!oldReport.moldStrokesProcessed || oldReport.status !== '제출완료')) {
      await updateDoc(reportRef, { moldStrokesProcessed: true });
      updatedObj.moldStrokesProcessed = true;
    }
    
    await processMoldStrokes({ ...oldReport, ...updatedObj }, oldReport);`;
    
  // Actually wait, if we fetch oldReport AFTER updateDoc, it's not old anymore!
  // Let me use regex properly...
}
fs.writeFileSync('src/services/firestore.js', code);
