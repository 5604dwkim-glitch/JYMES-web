const fs = require('fs');
const content = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');
const lines = content.split('\n');

// Count total branches in the switch + if-elseif chain
const branchLines = [];
for (let i = 0; i < lines.length; i++) {
  const l = lines[i].trim();
  if (l.startsWith('if (curProc') || l.startsWith('} else if (curProc') || l.startsWith('if (formCode') || l.startsWith('} else if (formCode')) {
    branchLines.push({ line: i + 1, text: l.substring(0, 60) });
  }
}
console.log(`Total branches: ${branchLines.length}`);
branchLines.slice(0, 30).forEach(b => console.log(`  line ${b.line}: ${b.text}`));
