const fs = require('fs');
const path = require('path');

const trPath = path.join(__dirname, 'src/constants/translations.js');
let trContent = fs.readFileSync(trPath, 'utf8');

trContent = trContent.replace(/th_spec:\s*["']규격["']/g, 'th_spec: "스펙(mm)"');

fs.writeFileSync(trPath, trContent, 'utf8');
console.log('Updated translations.js');
