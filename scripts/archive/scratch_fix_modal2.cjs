const fs = require('fs');
let content = fs.readFileSync('src/components/DynamicForms/LegacyDetailModal.jsx', 'utf8');
content = content.replace(/return \\`/, "return `");
content = content.replace(/\\`\s*;/g, "`;");
fs.writeFileSync('src/components/DynamicForms/LegacyDetailModal.jsx', content, 'utf8');
console.log('Fixed LegacyDetailModal.jsx');
