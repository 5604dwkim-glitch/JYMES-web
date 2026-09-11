const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/ChangePointManagement.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Remove itemCode from COLUMNS
content = content.replace(/\s*\{\s*key:\s*'itemCode',\s*label:\s*'아이템코드',\s*width:\s*'120px'\s*\},/g, '');

// 2. Remove itemCode logic from NEW row
content = content.replace(
  /setFormData\(\{\.\.\.formData, \[c\.key\]: e\.target\.value, itemCode: selectedItem \? selectedItem\.code : formData\.itemCode\}\);/g,
  'setFormData({...formData, [c.key]: e.target.value});'
);

// 3. Remove itemCode logic from EDIT row
content = content.replace(
  /if \(selectedItem\) \{\s*handleInputChange\(\{ target: \{ name: 'itemCode', value: selectedItem\.code \} \}, true, 'itemCode'\);\s*\}/g,
  ''
);

fs.writeFileSync(file, content, 'utf8');
console.log('Removed itemCode from ChangePointManagement.jsx');
