const fs = require('fs');
let code = fs.readFileSync('src/constants/formCodes.js', 'utf8');

const regex = /export const getCurrentFormCode = \([^)]+\) => \{[\s\S]*?return FORM_CODE_MAP\[lookupKey\] \|\| 9999;\s*\};/;

const newFunc = `export const getCurrentFormCode = (carModel, part, process) => {
  if (!carModel || !process) return 0;
  let p = part || '';
  if (p && p.startsWith(carModel + ' ')) {
    p = p.replace(carModel + ' ', '').trim();
  }
  const lookupKey = \`\${carModel}_\${p}_\${process}\`.replace('__', '_');
  return FORM_CODE_MAP[lookupKey] || 9999;
};`;

if (regex.test(code)) {
  fs.writeFileSync('src/constants/formCodes.js', code.replace(regex, newFunc));
  console.log('formCodes.js replaced successfully.');
} else {
  console.log('regex not matched in formCodes.js.');
}
