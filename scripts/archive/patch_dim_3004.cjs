const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');

const stages = ['초', '중', '종'];

stages.forEach(stage => {
  const target1 = `          <td style="border: 1px solid #000; background: #f8fafc;">실 측</td>
          <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_3001_step1_FRT_A_LH_${stage}" class="form-control dim-input-dynamic" style="width: 100%; height: 26px; padding: 2px; text-align: center; font-size: 11px; border: none; background: transparent; outline: none;" value="\${d['3001_step1_FRT_A_LH_${stage}'] || ''}" /></td>
          <td style="border: 1px solid #000; padding: 2px;"><input type="text" id="dim_3001_step1_FRT_A_RH_${stage}" class="form-control dim-input-dynamic" style="width: 100%; height: 26px; padding: 2px; text-align: center; font-size: 11px; border: none; background: transparent; outline: none;" value="\${d['3001_step1_FRT_A_RH_${stage}'] || ''}" /></td>`;

  const repl1 = `          <td style="border: 1px solid #000; background: #f8fafc;">실 측</td>
          <td colspan="2" style="border: 1px solid #000; background: #ffffff;"></td>`;

  const target2 = `          <td style="border: 1px solid #000; background: #f8fafc;">규 격</td>
          <td style="border: 1px solid #000; background: #e2e8f0;"></td>
          <td style="border: 1px solid #000; background: #e2e8f0;"></td>`;

  const repl2 = `          <td style="border: 1px solid #000; background: #f8fafc;">규 격</td>
          <td colspan="2" style="border: 1px solid #000; background: #e2e8f0;"></td>`;

  const target3 = `          <td style="border: 1px solid #000; background: #f8fafc;">실 측</td>
          <td style="border: 1px solid #000; background: #e2e8f0;"></td>
          <td style="border: 1px solid #000; background: #e2e8f0;"></td>`;

  const repl3 = `          <td style="border: 1px solid #000; background: #f8fafc;">실 측</td>
          <td colspan="2" style="border: 1px solid #000; background: #e2e8f0;"></td>`;

  code = code.replace(target1, repl1);
  code = code.replace(target2, repl2);
  code = code.replace(target3, repl3);
});

fs.writeFileSync('src/components/DynamicForms/sections/Section5Renderer.js', code);
console.log('Successfully patched dim check tables for 3004!');
