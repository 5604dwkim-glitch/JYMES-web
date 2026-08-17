const fs = require('fs');
let code = fs.readFileSync('js/components/reportForm.js', 'utf8');

code = code.replace(/🔹\s*<span class="sec-num"><\/span>\s*\$\{carName\}\s*'A'\s*클립머신/g, '🔹 A. ${carName} \\\'A\\\' 클립머신');
code = code.replace(/🔹\s*<span class="sec-num"><\/span>\s*\$\{carName\}\s*'B'\s*클립머신/g, '🔹 B. ${carName} \\\'B\\\' 클립머신');
code = code.replace(/🔹\s*<span class="sec-num"><\/span>\s*\$\{carName\}\s*'A'\s*클립머신\s*생산실적\s*\(1호기\)/g, '🔹 A. ${carName} \\\'A\\\' 클립머신 생산실적 (1호기)');
code = code.replace(/🔹\s*<span class="sec-num"><\/span>\s*\$\{carName\}\s*'B'\s*클립머신\s*생산실적/g, '🔹 B. ${carName} \\\'B\\\' 클립머신 생산실적');

fs.writeFileSync('js/components/reportForm.js', code);
console.log('Fixed A and B machines');
