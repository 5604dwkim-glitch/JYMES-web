const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'src', 'components', 'DynamicForms', 'sections', 'Section5Renderer.js');
let content = fs.readFileSync(filePath, 'utf8');

const insertCode = `      } else if (formCode === 3012) {
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
        \`;`;

const eventBindingCode = `      } else if (formCode === 3012) {
        const phases = [{k:'start', n:'초물'}, {k:'harf', n:'중물'}, {k:'finish', n:'종물'}];
        const cols = [{k:'frt_p', n:'LH X부'}, {k:'frt_q', n:'LH Y부'}, {k:'rr_r', n:'RH X부'}, {k:'rr_s_lh', n:'RH Y부'}];
        phases.forEach(p => {
          cols.forEach(c => {
            ['상', '하'].forEach(pos => {
              const el = section5.querySelector('#vulc_temp_' + p.k + '_' + c.k + '_' + pos);
              if (el) bindNumberWheelPicker(el, p.n + ' 가류온도 ' + c.n + ' (' + pos + ')', 200, 30, '도');
            });
            const timeEl = section5.querySelector('#vulc_time_' + p.k + '_' + c.k);
            if (timeEl) bindNumberWheelPicker(timeEl, p.n + ' 가류시간 ' + c.n, 90, 30, '초');
          });
        });`;

// reload from file in case it was half patched
let lines = fs.readFileSync(filePath, 'utf8').split('\\n');

let targetIdxHTML = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('} else {') && lines[i + 1] && lines[i + 1].includes('vulcTableHTML = `')) {
    targetIdxHTML = i;
    break;
  }
}

if (targetIdxHTML !== -1 && !content.includes('formCode === 3012')) {
  lines.splice(targetIdxHTML, 0, insertCode);
}

let targetIdxEvent = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('} else if (formCode === 4032) {') && lines[i+1] && lines[i+1].includes('const v = existingData')) {
    targetIdxEvent = i;
    break;
  }
}

if (targetIdxEvent !== -1 && !lines.join('\\n').includes('const phases = [{k:\\'start\\', n:\\'초물\\'}, {k:\\'harf\\', n:\\'중물\\'}')) {
  lines.splice(targetIdxEvent, 0, eventBindingCode);
}

fs.writeFileSync(filePath, lines.join('\\n'), 'utf8');
console.log('Successfully injected 3012');
