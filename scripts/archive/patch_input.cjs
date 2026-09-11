const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');

const stages = ['초', '중', '종'];
stages.forEach(stage => {
  const target = `<td colspan="2" style="border: 1px solid #000; background: #ffffff;"></td>`;
  const repl = `<td colspan="2" style="border: 1px solid #000; background: #ffffff; padding: 2px;"><input type="text" id="dim_3001_step1_FRT_A_Q_${stage}" class="form-control dim-input-dynamic" style="width: 100%; height: 26px; padding: 2px; text-align: center; font-size: 11px; border: none; background: transparent; outline: none;" value="\${d['3001_step1_FRT_A_Q_${stage}'] || ''}" /></td>`;
  code = code.replace(target, repl);
});

fs.writeFileSync('src/components/DynamicForms/sections/Section5Renderer.js', code);
console.log('Added input back to merged Q parts!');
