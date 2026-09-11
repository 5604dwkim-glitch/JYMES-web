const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'src', 'components', 'DynamicForms', 'sections', 'Section5Renderer.js');
let content = fs.readFileSync(filePath, 'utf8');

// The HTML block
const htmlRegex = /\\s*\\}\\s*else\\s*if\\s*\\(formCode === 4002\\)\\s*\\{\\s*vulcTableHTML[\\s\\S]*?(?=\\s*\\}\\s*else\\s*if\\s*\\(formCode === 1011\\)\\s*\\{)/;
content = content.replace(htmlRegex, '');

// The Event block
const eventRegex = /\\s*else\\s*if\\s*\\(formCode === 4002\\)\\s*\\{\\s*const phases = [\\s\\S]*?(?=\\s*\\}\\s*else\\s*if\\s*\\(formCode === 3012 \\|\\| formCode === 4002\\)\\s*\\{)/;
content = content.replace(eventRegex, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Regex replace done');
