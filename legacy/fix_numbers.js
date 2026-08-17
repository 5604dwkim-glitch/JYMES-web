const fs = require('fs');
let code = fs.readFileSync('js/components/reportForm.js', 'utf8');

// Replace sub-numbers like 5-1., 6-1., 8-2. with <span class="sec-num"></span>
code = code.replace(/\b[1-9]-[1-9]\.\s/g, '<span class="sec-num"></span> ');

fs.writeFileSync('js/components/reportForm.js', code);
console.log('Fixed sub-numbers in reportForm.js');
