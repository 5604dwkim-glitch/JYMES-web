const fs = require('fs');
const content = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');
const lines = content.split('\n');

// find block at line ~494-510 that has no condition above section5.innerHTML
for (let i = 490; i < 510; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
console.log('---');
// find block at line ~2080-2095 
for (let i = 2078; i < 2095; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
console.log('---');
// find block at line ~2235-2250
for (let i = 2233; i < 2250; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
