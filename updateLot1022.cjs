const fs = require('fs');

const filePath = 'src/components/DynamicForms/sections/LotTableRenderer.js';
let t = fs.readFileSync(filePath, 'utf8');

const oldCaseStart = 'case 1022:';
const nextCaseStart = 'case 1042:'; // wait, it might be case 1022: \n case 1042:

// Let's find exactly the block to replace
const m = t.match(/case 1022:[\s\S]*?case 1042:[\s\S]*?break;/);

if (m) {
  const newCode = `case 1022:
      case 1042: {
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
                  G/RUN 'E' LH
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시분" value="\${curLots['lotNo_LH_초물'] || materialLots['LH_초물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시분" value="\${curLots['lotNo_LH_중물'] || materialLots['LH_중물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_LH_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시분" value="\${curLots['lotNo_LH_종물'] || materialLots['LH_종물'] || ''}" />
                </td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">
                  G/RUN 'E' RH
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시분" value="\${curLots['lotNo_RH_초물'] || materialLots['RH_초물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시분" value="\${curLots['lotNo_RH_중물'] || materialLots['RH_중물'] || ''}" />
                </td>
                <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                  <input type="text" id="lotNo_RH_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 8px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시분" value="\${curLots['lotNo_RH_종물'] || materialLots['RH_종물'] || ''}" />
                </td>
              </tr>
            </tbody>
          </table>
        \`;
        break;`;
  t = t.replace(m[0], newCode);
  fs.writeFileSync(filePath, t);
  console.log('Successfully updated case 1022 and 1042 in LotTableRenderer.js');
} else {
  console.log('Could not match case 1022 block.');
}
