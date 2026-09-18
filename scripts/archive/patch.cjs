const fs = require('fs');

let file1 = 'src/components/DynamicForms/sections/LotTableRenderer.js';
let code1 = fs.readFileSync(file1, 'utf8');
code1 = code1.replace(/if \(e.key === 'Enter'\) \{\s*input.value = autoFormatDateTimeString\(input.value\);\s*\}/g, "if (e.key === 'Enter') { e.preventDefault(); input.value = autoFormatDateTimeString(input.value); }");
fs.writeFileSync(file1, code1);

let file2 = 'src/components/DynamicForms/sections/Section5Renderer.js';
let code2 = fs.readFileSync(file2, 'utf8');
code2 = code2.replace(/if \(e.key === 'Enter'\) jointInput.value = autoFormatDateTimeString\(jointInput.value\);/g, "if (e.key === 'Enter') { e.preventDefault(); jointInput.value = autoFormatDateTimeString(jointInput.value); }");
fs.writeFileSync(file2, code2);

console.log("Patched successfully!");
