const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicForms/sections/LotTableRenderer.js', 'utf8');

const injection = `      // ────────────────────────────────────────────────────────
      // #3001 : NE1a D/SIDE 소재준비 전용 양식 (LH / RH 2개 표, FRT A / RR A / RR C / RR D)
      // ────────────────────────────────────────────────────────
      case 3001: {
        const rows = [
          { key: 'FRT_A', label: 'FRT A' },
          { key: 'RR_A', label: 'RR A' },
          { key: 'RR_C', label: 'RR C' },
          { key: 'RR_D', label: 'RR D' }
        ];
        lotContainer.innerHTML = \`
          <!-- LH 테이블 -->
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif; margin-bottom: 16px;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700;">
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #fffde7; font-weight: 700; color: #000; font-size: 12px;">LH</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 11px;">초</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 11px;">중</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 11px;">종</th>
              </tr>
            </thead>
            <tbody>
              \${rows.map(r => \`
                <tr>
                  <td style="border: 1px solid #000; padding: 6px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">\${r.label}</td>
                  <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                    <input type="text" id="lotNo_LH_\${r.key}_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="\${curLots[\`lotNo_LH_\${r.key}_초물\`] || materialLots[\`LH_\${r.key}_초물\`] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                    <input type="text" id="lotNo_LH_\${r.key}_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="\${curLots[\`lotNo_LH_\${r.key}_중물\`] || materialLots[\`LH_\${r.key}_중물\`] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                    <input type="text" id="lotNo_LH_\${r.key}_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="\${curLots[\`lotNo_LH_\${r.key}_종물\`] || materialLots[\`LH_\${r.key}_종물\`] || ''}" />
                  </td>
                </tr>
              \`).join('')}
            </tbody>
          </table>

          <!-- RH 테이블 -->
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700;">
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #fffde7; font-weight: 700; color: #000; font-size: 12px;">RH</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 11px;">초</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 11px;">중</th>
                <th style="border: 1px solid #000; padding: 6px 2px; width: 25%; background: #ffffff; font-weight: 700; color: #000; font-size: 11px;">종</th>
              </tr>
            </thead>
            <tbody>
              \${rows.map(r => \`
                <tr>
                  <td style="border: 1px solid #000; padding: 6px 4px; background: #fffde7; font-weight: 700; color: #000; font-size: 11px; vertical-align: middle;">\${r.label}</td>
                  <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                    <input type="text" id="lotNo_RH_\${r.key}_초물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="\${curLots[\`lotNo_RH_\${r.key}_초물\`] || materialLots[\`RH_\${r.key}_초물\`] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                    <input type="text" id="lotNo_RH_\${r.key}_중물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="\${curLots[\`lotNo_RH_\${r.key}_중물\`] || materialLots[\`RH_\${r.key}_중물\`] || ''}" />
                  </td>
                  <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                    <input type="text" id="lotNo_RH_\${r.key}_종물" class="form-control lot-datetime-input" style="width: 100%; border: none; text-align: center; font-family: monospace; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" placeholder="년월일시" value="\${curLots[\`lotNo_RH_\${r.key}_종물\`] || materialLots[\`RH_\${r.key}_종물\`] || ''}" />
                  </td>
                </tr>
              \`).join('')}
            </tbody>
          </table>
        \`;
        break;
      }
`;

const regex = /(case 1021:\s*case 1041: {)/;
if (regex.test(code)) {
  code = code.replace(regex, injection + '\n      $1');
  fs.writeFileSync('src/components/DynamicForms/sections/LotTableRenderer.js', code);
  console.log('case 3001 restored!');
} else {
  console.log('regex not matched');
}
