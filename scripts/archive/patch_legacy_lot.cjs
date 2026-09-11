const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', 'utf8');

const injection = `
      // 동적 추가된 LOT 데이터 자동 바인딩
      container.querySelectorAll('.lot-datetime-input').forEach(inp => {
        if (inp.id && inp.id.startsWith('lotNo_')) {
          const key = inp.id.replace('lotNo_', '');
          if (!materialLots[key]) {
            materialLots[key] = autoFormatDateTimeString(inp.value);
          }
        }
      });
`;

code = code.replace(/        '2004_rh_2': container.querySelector\('#lotNo_2004_rh_2'\)\?\.checked \|\| false\r?\n\s*\};\r?\n/, match => match + injection);

fs.writeFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', code);
console.log('LegacyFormWrapper patched with dynamic LOT extraction!');
