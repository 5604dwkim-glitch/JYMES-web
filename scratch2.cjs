const fs = require('fs');
let content = fs.readFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', 'utf8');
content = content.replace("import { renderLeaderPaperForm } from './LeaderFormRenderer.js';", "");
content = `import { renderLeaderPaperForm } from "./LeaderFormRenderer.js";\n` + content;
fs.writeFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', content);
