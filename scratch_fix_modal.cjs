const fs = require('fs');
let content = fs.readFileSync('src/components/DynamicForms/LegacyDetailModal.jsx', 'utf8');
content = content.replace(/\\\$\{/g, '${');
content = content.replace(/<\/div>\s*<\/div>\s*`;\s*} else if \(r\.isSupportForm\)/, '</div>\n        `;\n      } else if (r.isSupportForm)');
fs.writeFileSync('src/components/DynamicForms/LegacyDetailModal.jsx', content, 'utf8');
console.log('Fixed LegacyDetailModal.jsx');
