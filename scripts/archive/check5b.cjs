const fs = require('fs');
const content = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');
const lines = content.split('\n');

// Find formCode/curProc branches that call section5.innerHTML but are under "if" without a preceding clear
// Map each assignment to the nearest if-condition above it
const assignments = [];
let currentConditions = [];
let insideIf = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  if (line.includes('section5.innerHTML = `') && !line.trim().startsWith('//')) {
    // Look for the closest condition above (last 5 lines)
    let cond = '';
    for (let j = i - 1; j > Math.max(0, i - 10); j--) {
      if (lines[j].match(/if\s*\(|else\s*\{|case\s+\w+/)) {
        cond = lines[j].trim();
        break;
      }
    }
    assignments.push({ line: i + 1, cond });
  }
}

// Print
assignments.forEach(a => {
  console.log(`line ${a.line}: under condition: ${a.cond}`);
});
