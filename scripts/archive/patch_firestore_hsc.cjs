const fs = require('fs');
let file = 'src/services/firestore.js';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /formCode: reportData\.formCode \|\| 'HSC-DT-005',/g,
  "formCode: reportData.formCode || '',"
);

fs.writeFileSync(file, code);
console.log("firestore.js patched for HSC-DT-005");
