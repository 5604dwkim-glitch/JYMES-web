const fs = require('fs');
const path = 'src/components/DynamicForms/sections/QtySectionRenderer.js';
let code = fs.readFileSync(path, 'utf8');

// 1. Change getInspQtyHTML(..., false) to true
code = code.replace(
  /Templates\.getInspQtyHTML\(existingData, 4, false, container\)/g,
  'Templates.getInspQtyHTML(existingData, 4, true, container)'
);

// 2. Change the condition to include 2005, 2015, 2027, 2035, 2044
code = code.replace(
  /if\s*\(\s*formCode\s*===\s*2035\s*\|\|\s*formCode\s*===\s*2044(?:\s*\|\|\s*formCode\s*===\s*2027)?\s*\)\s*\{/g,
  'if ([2005, 2015, 2027, 2035, 2044].includes(formCode)) {'
);

fs.writeFileSync(path, code);
console.log('Fixed all inspection forms!');
