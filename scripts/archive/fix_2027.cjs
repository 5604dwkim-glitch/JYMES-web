const fs = require('fs');
const path = 'src/components/DynamicForms/sections/QtySectionRenderer.js';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'case 2005:\n      case 2015:\n      case 2027:\n        qtySection.innerHTML = Templates.getInspQtyHTML(existingData, 4, false, container);',
  'case 2005:\n      case 2015:\n        qtySection.innerHTML = Templates.getInspQtyHTML(existingData, 4, false, container);\n        qtySection.addEventListener(\'input\', calcInspQtySummary);\n        calcInspQtySummary();\n        break;\n\n      case 2027:\n        qtySection.innerHTML = Templates.getInspQtyHTML(existingData, 4, true, container);'
);

code = code.replace(
  'if (formCode === 2035 || formCode === 2044) {',
  'if (formCode === 2035 || formCode === 2044 || formCode === 2027) {'
);

fs.writeFileSync(path, code);
console.log('Fixed QtySectionRenderer');
