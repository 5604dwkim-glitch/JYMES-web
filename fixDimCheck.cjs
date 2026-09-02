const fs = require('fs');

let fw = fs.readFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', 'utf8');

fw = fw.replace(/act_초: container\.querySelector\('#dim_act_초'\)\?\.value \|\| '',/g, "ptg_act_초: container.querySelector('#dim_ptg_act_초')?.value || '',");
fw = fw.replace(/act_중: container\.querySelector\('#dim_act_중'\)\?\.value \|\| '',/g, "ptg_act_중: container.querySelector('#dim_ptg_act_중')?.value || '',");
fw = fw.replace(/act_종: container\.querySelector\('#dim_act_종'\)\?\.value \|\| '',/g, "ptg_act_종: container.querySelector('#dim_ptg_act_종')?.value || '',");

fs.writeFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', fw);

let s5 = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');
s5 = s5.replace(/const d = existingData\?\.dimensionCheck \|\| \{\};/g, 'const d = existingData?.dimData || {};');

fs.writeFileSync('src/components/DynamicForms/sections/Section5Renderer.js', s5);

console.log('Fixed IDs and dimData logic');
