const fs = require('fs');
const content = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');

const lines = content.split('\n');

// Find what happens early in the function for section5 init
// Look for where section5 is assigned but NOT cleared first
const issues = [];

let section5ClearedFirst = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('section5.innerHTML = \'\';')) {
    section5ClearedFirst = true;
    issues.push({ type: 'CLEAR', line: i+1, text: lines[i].trim() });
  }
  if (lines[i].includes('section5.innerHTML = `') || lines[i].includes("section5.innerHTML = '")) {
    issues.push({ type: 'ASSIGN', line: i+1, text: lines[i].trim() });
  }
}

console.log('All section5 HTML operations:');
issues.forEach(x => console.log(`  [${x.type}] line ${x.line}: ${x.text}`));
