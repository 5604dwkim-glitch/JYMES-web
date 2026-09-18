const fs = require('fs');
let file = 'src/components/DynamicForms/LegacyFormWrapper.jsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /const reportData = \{\r?\n\s*date: /,
  "const reportData = {\n          formCode: formCode,\n          date: "
);

fs.writeFileSync(file, code);
console.log("LegacyFormWrapper patched for formCode");
