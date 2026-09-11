const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'src', 'components', 'DynamicForms', 'sections', 'Section5Renderer.js');
let lines = fs.readFileSync(filePath, 'utf8').split('\\n');

// 1. Injects 4022 HTML before 3012||4002
const idxHtml = lines.findIndex(l => l.includes('} else if (formCode === 3012 || formCode === 4002) {'));
if (idxHtml !== -1 && !lines.some(l => l.includes('} else if (formCode === 4022) {'))) {
  const html4022 = `      } else if (formCode === 4022) {
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
                  <th style="border: 1px solid #000; padding: 6px; width: 22%;">X부(L/R)</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 22%;">LH Y부</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 22%;">RH Y부</th>
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
                </tr>
                <tr>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 2px;">초물(Start)</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('start', 'frt_p', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('start', 'rr_s_lh', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('start', 'rr_s_rh', '')}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 2px;">중물(Harf)</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('harf', 'frt_p', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('harf', 'rr_s_lh', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('harf', 'rr_s_rh', '')}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 2px;">종물(Finish)</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('finish', 'frt_p', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('finish', 'rr_s_lh', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('finish', 'rr_s_rh', '')}</td>
                </tr>
                <tr>
                  <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    가류시간(Time) - 초<br>(Sec)
                  </td>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">스펙(mm)</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 2px;">초물(Start)</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('start', 'frt_p', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('start', 'rr_s_lh', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('start', 'rr_s_rh', '')}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 2px;">중물(Harf)</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('harf', 'frt_p', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('harf', 'rr_s_lh', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('harf', 'rr_s_rh', '')}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 2px;">종물(Finish)</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('finish', 'frt_p', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('finish', 'rr_s_lh', '')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('finish', 'rr_s_rh', '')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        \`;`;
  lines.splice(idxHtml, 0, html4022);
}

// 2. Injects 4022 and 3012|4002 Event Binding before 4032
let idxEvent = lines.findIndex(l => l.includes('} else if (formCode === 4032) {'));
if (idxEvent !== -1 && !lines.some(l => l.includes('} else if (formCode === 4022) {') && l.includes('const phases ='))) {
  const events = `      } else if (formCode === 3012 || formCode === 4002) {
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
        });
      } else if (formCode === 4022) {
        const phases = [{k:'start', n:'초물'}, {k:'harf', n:'중물'}, {k:'finish', n:'종물'}];
        const cols = [{k:'frt_p', n:'X부(L/R)'}, {k:'rr_s_lh', n:'LH Y부'}, {k:'rr_s_rh', n:'RH Y부'}];
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
  lines.splice(idxEvent, 0, events);
}

fs.writeFileSync(filePath, lines.join('\\n'), 'utf8');
console.log('Successfully injected 4022 and fixed 3012|4002 events');
