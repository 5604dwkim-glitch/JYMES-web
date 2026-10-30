const fs = require('fs');
const content = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');

// Find all switch(formCode), switch(curProc) blocks and check if innerHTML = '' is set at beginning
const lines = content.split('\n');
const results = [];

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('section5.innerHTML') && !lines[i].includes('//')) {
    results.push({ line: i+1, text: lines[i].trim() });
  }
}
console.log('section5.innerHTML assignments:', JSON.stringify(results, null, 2));
