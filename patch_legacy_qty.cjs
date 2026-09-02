const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', 'utf8');

const injection = `
      // 동적 추가된 수량 데이터 자동 바인딩
      container.querySelectorAll('.qty-input-dynamic').forEach(inp => {
        if (inp.id && inp.id.startsWith('qtyd_')) {
          qtyTable[inp.id.replace('qtyd_', '')] = inp.value;
        }
      });
`;

code = code.replace(/jnt_pnt_hole_RR: container\.querySelector\('#def_jnt_pnt_hole_RR'\)\?\.value \|\| ''\r?\n\s*\};\r?\n/, match => match + injection);
fs.writeFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', code);
console.log('LegacyFormWrapper.jsx patched with dynamic qtyTable extraction');
