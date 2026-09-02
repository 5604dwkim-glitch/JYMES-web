const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', 'utf8');

const injection = `
      // 동적 추가된 치수 데이터 자동 바인딩
      container.querySelectorAll('.dim-input-dynamic').forEach(inp => {
        if (inp.id && inp.id.startsWith('dim_')) {
          dimData[inp.id.replace('dim_', '')] = inp.value;
        }
      });
`;

code = code.replace(/ltl_rr_rh_종: container\.querySelector\('#dim_ltl_rr_rh_종'\)\?\.value \|\| ''\r?\n\s*\};\r?\n/, match => match + injection);
fs.writeFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', code);
console.log('LegacyFormWrapper.jsx patched with dynamic dimData extraction');
