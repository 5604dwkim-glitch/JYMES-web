const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'src', 'components', 'DynamicForms', 'sections', 'Section5Renderer.js');
let lines = fs.readFileSync(filePath, 'utf8').split('\\n');

// We are going to splice from the end backwards to avoid index shifting problems!
lines.splice(2003, 13); // Deletes lines 2003 through 2015
lines.splice(1068, 495); // Deletes lines 1068 through 1562 (1562 - 1068 + 1 = 495)

fs.writeFileSync(filePath, lines.join('\\n'), 'utf8');
console.log('Successfully deleted blocks!');
