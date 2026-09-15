const fs = require('fs');
let content = fs.readFileSync('src/components/DynamicForms/ForkliftFormRenderer.js', 'utf8');
content = content.replace(/\\`/g, '`').replace(/\\\$\{/g, '${');
fs.writeFileSync('src/components/DynamicForms/ForkliftFormRenderer.js', content, 'utf8');
console.log('Fixed ForkliftFormRenderer.js');
