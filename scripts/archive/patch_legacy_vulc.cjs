const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', 'utf8');

const injection = `
      // 동적 추가된 가류온도/시간 데이터 자동 바인딩
      container.querySelectorAll('.vulc-input-dynamic').forEach(inp => {
        if (inp.id && inp.id.startsWith('vulc_')) {
          vulcTable[inp.id.replace('vulc_', '')] = inp.value;
        }
      });
`;

code = code.replace(/time_finish_rr_s_rh: container\.querySelector\('#vulc_time_finish_rr_s_rh'\)\?\.value \|\| ''\r?\n\s*\};\r?\n/, match => match + injection);
fs.writeFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', code);
console.log('LegacyFormWrapper.jsx patched with dynamic vulcTable extraction');
