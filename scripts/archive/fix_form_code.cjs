const fs = require('fs');
const path = require('path');
const file1 = path.join(__dirname, 'src/components/DynamicForms/FormTemplates.jsx');

let content1 = fs.readFileSync(file1, 'utf8');
content1 = content1.replace(
  /export function getDtCrewPrepQtyHTML\(ed, container\) \{\s*const q = ed\?\.dtCrewPrepQty \|\| ed\?\.qtyData \|\| \{\};\s*const formCode = getCurrentFormCode\(\);/g,
  `export function getDtCrewPrepQtyHTML(ed, container, formCode) {\n    const q = ed?.dtCrewPrepQty || ed?.qtyData || {};`
);
fs.writeFileSync(file1, content1);

const file2 = path.join(__dirname, 'src/components/DynamicForms/sections/QtySectionRenderer.js');
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace(
  /qtySection\.innerHTML = Templates\.getDtCrewPrepQtyHTML\(existingData, container\);/g,
  `qtySection.innerHTML = Templates.getDtCrewPrepQtyHTML(existingData, container, formCode);`
);
fs.writeFileSync(file2, content2);

console.log('Fixed getCurrentFormCode issue!');
