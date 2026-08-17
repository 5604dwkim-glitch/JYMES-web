const fs = require('fs');
let code = fs.readFileSync('js/components/reportForm.js', 'utf8');

// Replace all sub-numbers
code = code.replace(/\b[1-9]-[1-9]\.\s/g, '<span class="sec-num"></span> ');

fs.writeFileSync('js/components/reportForm.js', code);
console.log('Successfully fixed sub-numbers in reportForm.js');
