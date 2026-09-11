const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'src', 'components', 'DynamicForms', 'sections', 'Section5Renderer.js');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('} else if (curProc ===') && lines[i].includes('소재준비')) {
    // Check if the previous lines are missing braces
    if (lines[i-1].trim() === '' && lines[i-2].trim() === '});') {
      // Insert two closing braces before this line
      lines.splice(i, 0, '        }');
      lines.splice(i+1, 0, '      }');
      fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
      console.log('Fixed brace structure properly!');
      process.exit(0);
    }
  }
}
console.log('Not found or already fixed');
