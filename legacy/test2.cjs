const fs = require('fs');
const code = fs.readFileSync('js/components/reportForm.js', 'utf8');

const regex = /<label style="[^"]*font-size:\s*1[34]px[^"]*">\s*(?:[\u2700-\u27bf]|[\ud83c-\ud83e][\udc00-\udfff]|[\u2600-\u26ff])?\s*(\d+)\.\s*([^<]+)/g;

let match;
console.log('--- FOUND SECTION HEADERS ---');
while ((match = regex.exec(code)) !== null) {
  console.log(`Number: ${match[1]}, Text: ${match[2].trim()}`);
}
