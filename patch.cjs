const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', 'utf8');

const originalFunc = `  function getCurrentFormCode() {
    const curCarCode = carModelValue ? carModelValue.value : currentCarCode;
    const curPart = partValueInput ? partValueInput.value : '';
    const curProc = processValue ? processValue.value : '';
    if (!curProc) return 0;
    const lookupKey = \`\${curCarCode}_\${curPart}_\${curProc}\`;
    return FORM_CODE_MAP[lookupKey] || 9999;
  }`;

const newFunc = `  function getCurrentFormCode() {
    const curCarCode = carModelValue ? carModelValue.value : currentCarCode;
    let curPart = partValueInput ? partValueInput.value : '';
    const curProc = processValue ? processValue.value : '';
    if (!curProc) return 0;
    
    // Normalize part name: if part string contains the carCode (e.g. 'NE1a D/SIDE'), strip it
    if (curPart && curCarCode && curPart.startsWith(curCarCode + ' ')) {
      curPart = curPart.replace(curCarCode + ' ', '').trim();
    }
    
    const lookupKey = \`\${curCarCode}_\${curPart}_\${curProc}\`;
    return FORM_CODE_MAP[lookupKey] || 9999;
  }`;

if (code.includes(originalFunc)) {
  fs.writeFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', code.replace(originalFunc, newFunc));
  console.log('Replaced successfully.');
} else {
  console.log('originalFunc not found.');
}
