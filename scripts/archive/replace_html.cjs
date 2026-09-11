const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'src', 'components', 'DynamicForms', 'sections', 'Section5Renderer.js');
let lines = fs.readFileSync(filePath, 'utf8').split('\\n');

let htmlStart = 1065;
let htmlEnd = 1560; // Up to 1559

const newHTML = `      } else if (formCode === 4002 || formCode === 3012) {
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

        vulcTableHTML = \`
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <thead>
                <tr style="background: #fffde7; font-weight: 700; color: #000;">
                  <th colspan="2" style="border: 1px solid #000; padding: 6px;">부 위(Part)</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 16%;">LH X부</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 16%;">LH Y부</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 16%;">RH X부</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 16%;">RH Y부</th>
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
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 2px;">초물(Start)</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('start', 'frt_p', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('start', 'frt_q', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('start', 'rr_r', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('start', 'rr_s_lh', '')}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 2px;">중물(Harf)</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('harf', 'frt_p', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('harf', 'frt_q', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('harf', 'rr_r', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('harf', 'rr_s_lh', '')}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 2px;">종물(Finish)</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('finish', 'frt_p', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('finish', 'frt_q', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('finish', 'rr_r', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('finish', 'rr_s_lh', '')}</td>
                </tr>
                <tr>
                  <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    가류시간(Time) - 초<br>(Sec)
                  </td>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">스펙(mm)</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 2px;">초물(Start)</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('start', 'frt_p', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('start', 'frt_q', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('start', 'rr_r', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('start', 'rr_s_lh', '')}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 2px;">중물(Harf)</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('harf', 'frt_p', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('harf', 'frt_q', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('harf', 'rr_r', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('harf', 'rr_s_lh', '')}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 2px;">종물(Finish)</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('finish', 'frt_p', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('finish', 'frt_q', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('finish', 'rr_r', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('finish', 'rr_s_lh', '')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        \``;

lines.splice(htmlStart, htmlEnd - htmlStart, newHTML);

fs.writeFileSync(filePath, lines.join('\\n'), 'utf8');
console.log('HTML replace done');
