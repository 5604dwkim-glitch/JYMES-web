const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'src', 'components', 'DynamicForms', 'sections', 'Section5Renderer.js');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

const insertion = `        } else if (formCode === 4032) {
          const v = existingData && existingData.vulcTable ? existingData.vulcTable : {};
          const inp = (prefix, suffix, placeholder = '') => {
            const id = \`vulc_\${prefix}\${suffix}\`;
            const vval = v[\`\${prefix}\${suffix}\`] || '';
            return \`<input type="text" id="\${id}" class="form-control" style="width: 80%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="\${vval}" placeholder="\${placeholder}" readonly />\`;
          };
          const tempCell = (stage, part, suffix) => \`
            <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
              \${inp(\`temp_\${stage}_\${part}_상\`, suffix, '(상)')}
            </div>
            <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
              \${inp(\`temp_\${stage}_\${part}_하\`, suffix, '(하)')}
            </div>
          \`;
          const timeCell = (stage, part, suffix) => \`
            \${inp(\`time_\${stage}_\${part}\`, suffix)}
          \`;

          section5.innerHTML = \`
            <div class="card" style="padding: 16px; margin-bottom: 16px;">
              <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
                ♨️ <span class="sec-num"></span> 설비 가류온도 & 가류시간 입력
              </label>
              <div style="overflow-x: auto; margin-bottom: 16px;">
                <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                  <thead>
                    <tr style="background: #fffde7; font-weight: 700; color: #000;">
                      <th colspan="2" style="border: 1px solid #000; padding: 6px; vertical-align: middle;">부 위(Part)</th>
                      <th style="border: 1px solid #000; padding: 6px; width: 35%;">X부(L/R)</th>
                      <th style="border: 1px solid #000; padding: 6px; width: 35%;">Y부(L/R)</th>
                    </tr>
                    <tr style="background: #ffffff; font-weight: 700; color: #000;">
                      <td colspan="2" style="border: 1px solid #000; padding: 4px;">금형선택</td>
                      <td style="border: 1px solid #000; padding: 4px;">\${renderMoldSelect('vulc_mold_x_lr', 'X부', v['mold_x_lr'] || '')}</td>
                      <td style="border: 1px solid #000; padding: 4px;">\${renderMoldSelect('vulc_mold_y_lr', 'Y부', v['mold_y_lr'] || '')}</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                        가류온도<br>(Temperature) 상<br>(Upper/하DOWN)
                      </td>
                      <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">스펙(mm)</td>
                      <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
                      <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 2px;">초물(Start)</td>
                      <td style="border: 1px solid #000; padding: 2px;">\${tempCell('start', 'x_lr', '')}</td>
                      <td style="border: 1px solid #000; padding: 2px;">\${tempCell('start', 'y_lr', '')}</td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 2px;">중물(Harf)</td>
                      <td style="border: 1px solid #000; padding: 2px;">\${tempCell('harf', 'x_lr', '')}</td>
                      <td style="border: 1px solid #000; padding: 2px;">\${tempCell('harf', 'y_lr', '')}</td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 2px;">종물(Finish)</td>
                      <td style="border: 1px solid #000; padding: 2px;">\${tempCell('finish', 'x_lr', '')}</td>
                      <td style="border: 1px solid #000; padding: 2px;">\${tempCell('finish', 'y_lr', '')}</td>
                    </tr>
                    <tr>
                      <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                        가류시간(Time) - 초<br>(Sec)
                      </td>
                      <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">스펙(mm)</td>
                      <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                      <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 2px;">초물(Start)</td>
                      <td style="border: 1px solid #000; padding: 2px;">\${timeCell('start', 'x_lr', '')}</td>
                      <td style="border: 1px solid #000; padding: 2px;">\${timeCell('start', 'y_lr', '')}</td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 2px;">중물(Harf)</td>
                      <td style="border: 1px solid #000; padding: 2px;">\${timeCell('harf', 'x_lr', '')}</td>
                      <td style="border: 1px solid #000; padding: 2px;">\${timeCell('harf', 'y_lr', '')}</td>
                    </tr>
                    <tr>
                      <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 2px;">종물(Finish)</td>
                      <td style="border: 1px solid #000; padding: 2px;">\${timeCell('finish', 'x_lr', '')}</td>
                      <td style="border: 1px solid #000; padding: 2px;">\${timeCell('finish', 'y_lr', '')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          \`;

          const phases = [{k:'start', n:'초물'}, {k:'harf', n:'중물'}, {k:'finish', n:'종물'}];
          const cols = [{k:'x_lr', n:'X부(L/R)'}, {k:'y_lr', n:'Y부(L/R)'}];
          phases.forEach(p => {
            cols.forEach(c => {
              ['상', '하'].forEach(pos => {
                const el = section5.querySelector('#vulc_temp_' + p.k + '_' + c.k + '_' + pos);
                if (el) bindNumberWheelPicker(el, p.n + ' 가류온도 ' + c.n + ' (' + pos + ')', 200, 30, '도');
              });
              const timeEl = section5.querySelector('#vulc_time_' + p.k + '_' + c.k);
              if (timeEl) bindNumberWheelPicker(timeEl, p.n + ' 가류시간 ' + c.n, 90, 30, '초');
            });
          });
`;

let targetIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('curProc.startsWith') && lines[i].includes('} else if')) {
    targetIdx = i;
    break;
  }
}

if (targetIdx !== -1) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('formCode === 4032')) {
    console.log('Already patched');
  } else {
    lines.splice(targetIdx, 0, insertion);
    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log('Patched correctly');
  }
} else {
  console.log('Target not found');
}
