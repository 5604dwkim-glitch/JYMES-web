const fs = require('fs');
const content = fs.readFileSync('src/components/DynamicForms/FormTemplates.jsx', 'utf8');
const lines = content.split('\n');
let start = lines.findIndex(l => l.includes('<!-- B 클립머신 치수 -->') || l.includes('B. ${carName} \\\'B\\\' 클립머신'));
if (start === -1) start = 97;
const end = start + 120;
console.log(lines.slice(start, end).join('\n'));
