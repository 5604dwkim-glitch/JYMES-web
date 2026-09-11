const fs = require('fs');
const path = require('path');

// 1. Update LegacyFormWrapper.jsx
const wrapperPath = path.join(__dirname, 'src/components/DynamicForms/LegacyFormWrapper.jsx');
let wrapperContent = fs.readFileSync(wrapperPath, 'utf8');

wrapperContent = wrapperContent.replace(
  /const isSpecRow = tr\.textContent\.includes\('규격'\) \|\| tr\.textContent\.includes\('Spec'\);/g,
  "const isSpecRow = tr.textContent.includes('규격') || tr.textContent.includes('Spec') || tr.textContent.includes('스펙');"
);

wrapperContent = wrapperContent.replace(
  /const isSpecRow = rowText\.includes\('규격'\) \|\| rowText\.includes\('Spec'\);/g,
  "const isSpecRow = rowText.includes('규격') || rowText.includes('Spec') || rowText.includes('스펙');"
);

wrapperContent = wrapperContent.replace(
  /if \(cText\.includes\('규격'\) \|\| cText\.includes\('Spec'\)/g,
  "if (cText.includes('규격') || cText.includes('Spec') || cText.includes('스펙')"
);

fs.writeFileSync(wrapperPath, wrapperContent, 'utf8');
console.log('Updated LegacyFormWrapper.jsx');

// 2. Update Section5Renderer.js
const sec5Path = path.join(__dirname, 'src/components/DynamicForms/sections/Section5Renderer.js');
let sec5Content = fs.readFileSync(sec5Path, 'utf8');

sec5Content = sec5Content.replace(/규격\s?\(Spec\)/g, '스펙(mm)');
sec5Content = sec5Content.replace(/규격\(mm\)/g, '스펙(mm)');

fs.writeFileSync(sec5Path, sec5Content, 'utf8');
console.log('Updated Section5Renderer.js');
