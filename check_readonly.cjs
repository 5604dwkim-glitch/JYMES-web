const fs = require('fs');
const code = fs.readFileSync('src/components/DynamicForms/FormTemplates.jsx', 'utf8');

const matches = code.match(/<input[^>]*readonly[^>]*>/gi);
console.log('Total readonly inputs found:', matches ? matches.length : 0);

if (matches) {
  matches.forEach(m => {
    if (m.includes('qty')) {
      console.log(m);
    }
  });
}
