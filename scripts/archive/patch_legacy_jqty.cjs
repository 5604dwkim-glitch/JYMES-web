const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', 'utf8');

const injection = `
      // 동적 추가된 조인트 실적 데이터 바인딩
      container.querySelectorAll('.jqty-calc-input').forEach(inp => {
        if (inp.id) {
          if (inp.id.startsWith('jqty_')) {
            jointQtyTable[inp.id.replace('jqty_', '')] = inp.value;
          } else if (inp.id.startsWith('jdef_')) {
            jointQtyTable[inp.id.replace('jdef_', '')] = inp.value;
          }
        }
      });
`;

code = code.replace(/oth_rr_s_rh: container\.querySelector\('#jdef_oth_rr_s_rh'\)\?\.value \|\| ''\r?\n\s*\};\r?\n/, match => match + injection);
fs.writeFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', code);
console.log('LegacyFormWrapper.jsx patched with dynamic jointQtyTable extraction');
