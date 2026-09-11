const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'src', 'components', 'DynamicForms', 'sections', 'Section5Renderer.js');
let lines = fs.readFileSync(filePath, 'utf8').split('\\n');

let start = 1902;
let end = 1915; // Up to 1915

const newEvent = `      } else if (formCode === 4002 || formCode === 3012) {
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
      }`;

lines.splice(start, end - start + 1, newEvent);

fs.writeFileSync(filePath, lines.join('\\n'), 'utf8');
console.log('Event replace done');
