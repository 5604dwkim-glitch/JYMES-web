const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'src', 'components', 'DynamicForms', 'sections', 'Section5Renderer.js');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

let start1 = lines.findIndex(l => l.includes('} else if (formCode === 4002) {'));
let end1 = lines.findIndex((l, i) => i > start1 && l.includes('} else if (formCode === 1011) {'));
if (start1 !== -1 && end1 !== -1) {
  lines.splice(start1, end1 - start1);
  console.log('Spliced HTML block', start1, end1);
} else {
  console.log('Failed HTML block', start1, end1);
}

// After splicing, the indices change!
let start2 = lines.findIndex(l => l.includes('else if (formCode === 4002) {'));
let end2 = lines.findIndex((l, i) => i > start2 && l.includes('} else if (formCode === 3012 || formCode === 4002) {'));
if (start2 !== -1 && end2 !== -1) {
  lines.splice(start2, end2 - start2);
  console.log('Spliced Event block', start2, end2);
} else {
  console.log('Failed Event block', start2, end2);
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
