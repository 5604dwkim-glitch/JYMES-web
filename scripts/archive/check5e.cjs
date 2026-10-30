const fs = require('fs');
const content = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');
const lines = content.split('\n');

// find block around line 440-458 (condition before line 498)
for (let i = 435; i < 458; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
console.log('---block2---');
// find block around line 2060-2090
for (let i = 2060; i < 2090; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
console.log('---block3---');
// find block around line 2200-2245
for (let i = 2200; i < 2244; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
