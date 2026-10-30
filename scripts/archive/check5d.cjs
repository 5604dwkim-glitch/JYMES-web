const fs = require('fs');
const content = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');
const lines = content.split('\n');

// find block at line ~460-500 
for (let i = 455; i < 500; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
