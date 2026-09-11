const fs = require('fs');
let t = fs.readFileSync('src/components/DynamicForms/sections/LotTableRenderer.js', 'utf8');

const newCase = `
      case 1021: {
        lotContainer.innerHTML = \`
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif; margin-bottom: 16px;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700;">
                <th style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 22%; vertical-align: middle; background: #fffde7;">
                  구 분
                </th>
                <th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 26%;">초물</th>
                <th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 26%;">중물</th>
                <th style="border: 1px solid #000; padding: 6px 2px; background: #ffffff; font-weight: 700; color: #000; font-size: 11px; width: 26%;">종물</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">
                  G/RUN 'E'
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_GRUNE_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시분" value="\${curLots['lotNo_GRUNE_초물'] || materialLots['GRUNE_초물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_GRUNE_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시분" value="\${curLots['lotNo_GRUNE_중물'] || materialLots['GRUNE_중물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_GRUNE_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시분" value="\${curLots['lotNo_GRUNE_종물'] || materialLots['GRUNE_종물'] || ''}" />
                </td>
              </tr>
            </tbody>
          </table>
        \`;
        break;
      }
`;

if (!t.includes('case 1021:')) {
  t = t.replace('default:', newCase + '      default:');
  fs.writeFileSync('src/components/DynamicForms/sections/LotTableRenderer.js', t);
  console.log('Added case 1021');
} else {
  console.log('case 1021 already exists');
}
