const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/ChangePointManagement.jsx');
let content = fs.readFileSync(file, 'utf8');

// Fix qPoint filter
content = content.replace(
  /const qPointO = filtered\.filter\(d => d\.qPoint === 'O' \|\| d\.qPoint === '●'\)\.length;/,
  `const qPointO = filtered.filter(d => !!d.qPointInstall).length;`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed qPoint filter');
