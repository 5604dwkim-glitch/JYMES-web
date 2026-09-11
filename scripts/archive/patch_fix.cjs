const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');

// Replace the incorrect escaped \${ with proper ${
code = code.replace(/\\\$\{formCode === 3004 \? "" : `/g, '${formCode === 3004 ? "" : `');

fs.writeFileSync('src/components/DynamicForms/sections/Section5Renderer.js', code);
console.log('Fixed syntax error!');
