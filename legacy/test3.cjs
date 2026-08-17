const fs = require('fs');
const code = fs.readFileSync('js/components/reportForm.js', 'utf8');

const lines = code.split('\n');
console.log('--- FOUND SECTION HEADERS ---');
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('<label style="font-size: 14px') || lines[i].includes('<label style="font-size: 13px')) {
    console.log(`Line ${i+1}: ${lines[i].trim()}`);
    console.log(`Next line: ${lines[i+1].trim()}`);
  }
}
