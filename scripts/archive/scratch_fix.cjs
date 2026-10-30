const fs = require('fs');
const files = [
  'src/components/DynamicForms/SupportFormRenderer.js'
];
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/\\`/g, '`').replace(/\\\$\{/g, '${');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed ' + file);
});
