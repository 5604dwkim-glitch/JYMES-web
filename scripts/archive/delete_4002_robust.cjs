const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'src', 'components', 'DynamicForms', 'sections', 'Section5Renderer.js');
let lines = fs.readFileSync(filePath, 'utf8').split('\\n');

let start1 = -1, end1 = -1;
for(let i=0; i<lines.length; i++) {
  if (lines[i].includes('} else if (formCode === 4002) {') && lines[i+1].includes('vulcTableHTML = ')) {
    start1 = i;
  }
  if (start1 !== -1 && i > start1 && lines[i].includes('} else if (formCode === 1011) {')) {
    end1 = i;
    break;
  }
}
if (start1 !== -1 && end1 !== -1) {
  lines.splice(start1, end1 - start1);
  console.log('Deleted 4002 HTML block', start1, end1);
}

let start2 = -1, end2 = -1;
for(let i=0; i<lines.length; i++) {
  if (lines[i].includes('else if (formCode === 4002) {') && lines[i+1].includes('const phases =')) {
    start2 = i;
  }
  if (start2 !== -1 && i > start2 && lines[i].includes('} else if (formCode === 3012 || formCode === 4002) {')) {
    end2 = i;
    break;
  }
}
if (start2 !== -1 && end2 !== -1) {
  lines.splice(start2, end2 - start2);
  console.log('Deleted 4002 Event block', start2, end2);
}

fs.writeFileSync(filePath, lines.join('\\n'), 'utf8');
