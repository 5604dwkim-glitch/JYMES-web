const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/DynamicForms/sections/LotTableRenderer.js');
let content = fs.readFileSync(filePath, 'utf8');

const insertion = `
      // ────────────────────────────────────────────────────────
      // #4032 : MV1a PTG 조인트 전용 양식
      // ────────────────────────────────────────────────────────
      case 4032: {
        lotContainer.innerHTML = \`
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #ffffff; font-weight: 700;">
                <th style="border: 1px solid #000; padding: 6px 2px; width: 30%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">구분</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 70%; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">MV1a STG</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">초물</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_MV1a_STG_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="\\\${curLots['lotNo_MV1a_STG_초물'] || materialLots['MV1a_STG_초물'] || ''}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">중물</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_MV1a_STG_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="\\\${curLots['lotNo_MV1a_STG_중물'] || materialLots['MV1a_STG_중물'] || ''}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px 4px; background: #ffffff; font-weight: 700; color: #000; font-size: 12px;">종물</td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_MV1a_STG_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="\\\${curLots['lotNo_MV1a_STG_종물'] || materialLots['MV1a_STG_종물'] || ''}" />
                </td>
              </tr>
            </tbody>
          </table>
        \`;
        break;
      }
`;

if (!content.includes('case 4032:')) {
  content = content.replace(/(\s*case 4011:)/, insertion + '$1');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Patched case 4032');
} else {
  console.log('case 4032 already exists');
}
