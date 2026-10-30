const fs = require('fs');

// Check Section5Renderer for missing early clear
const s5 = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');
const qtyS = fs.readFileSync('src/components/DynamicForms/sections/QtySectionRenderer.js', 'utf8');

// In QtySectionRenderer check if qtySection.innerHTML is always cleared before assigning
const qtyLines = qtyS.split('\n');
const qtySectionAssigns = [];
for (let i = 0; i < qtyLines.length; i++) {
  const l = qtyLines[i];
  if (l.includes('qtySection.innerHTML') && !l.trim().startsWith('//')) {
    qtySectionAssigns.push({ line: i+1, text: l.trim() });
  }
}
console.log('== QtySectionRenderer.js - qtySection.innerHTML assignments ==');
qtySectionAssigns.forEach(x => console.log(`  line ${x.line}: ${x.text}`));

// Check LotTableRenderer
const lotS = fs.readFileSync('src/components/DynamicForms/sections/LotTableRenderer.js', 'utf8');
const lotLines = lotS.split('\n');
const lotAssigns = [];
for (let i = 0; i < lotLines.length; i++) {
  const l = lotLines[i];
  if (l.includes('.innerHTML') && !l.trim().startsWith('//')) {
    lotAssigns.push({ line: i+1, text: l.trim().substring(0, 80) });
  }
}
console.log('\n== LotTableRenderer.js - .innerHTML assignments ==');
lotAssigns.forEach(x => console.log(`  line ${x.line}: ${x.text}`));
