const fs = require('fs');
let code = fs.readFileSync('src/services/firestore.js', 'utf8');

const updateRegex = /export async function updateReport\(id, updateData\) \{\s*try \{\s*const reportRef = doc\(db, REPORTS_COLLECTION, id\);/;

const updateRepl = `export async function updateReport(id, updateData) {
  try {
    const reportRef = doc(db, REPORTS_COLLECTION, id);
    const oldReportSnap = await getDoc(reportRef);
    const oldReport = oldReportSnap.exists() ? oldReportSnap.data() : null;`;

code = code.replace(updateRegex, updateRepl);

const updateDocRegex = /await updateDoc\(reportRef, updatedObj\);/;
const updateDocRepl = `await updateDoc(reportRef, updatedObj);
    
    if (updatedObj.status === '제출완료' && (!oldReport || !oldReport.moldStrokesProcessed || oldReport.status !== '제출완료')) {
      await updateDoc(reportRef, { moldStrokesProcessed: true });
      updatedObj.moldStrokesProcessed = true;
    }
    
    await processMoldStrokes({ ...oldReport, ...updatedObj }, oldReport);`;

code = code.replace(updateDocRegex, updateDocRepl);

fs.writeFileSync('src/services/firestore.js', code);
console.log('Patched updateReport');
