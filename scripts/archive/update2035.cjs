const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src/components/DynamicForms/sections/Section5Renderer.js');
let content = fs.readFileSync(targetFile, 'utf8');

const targetBlock = `      } else if ([2005, 2015, 2035].includes(formCode)) {
        const d2005 = existingData?.dim2005Data || {};
        const aSpec = (formCode === 2015 || curCarCode === 'DT QUAD')
          ? '509 ± 5'
          : (formCode === 2035 || curCarCode === 'DS STD')
            ? '1018 ± 5'
            : (curCarCode === 'DS CREW' ? '707 ± 5' : '779 ± 5');
        const bClipSpec = (formCode === 2035 || curCarCode === 'DS STD') ? '29 ± 1' : '28 ± 1';
        const cSpec = (formCode === 2035 || curCarCode === 'DS STD')
          ? '391 ± 5'
          : (curCarCode === 'DS CREW'
            ? '379 ± 5'
            : ((formCode === 2015 || curCarCode === 'DT QUAD') ? '216 ± 4' : '246 ± 4'));
        
        const rowsDef = [
          { group: 'A 전장', spec: aSpec, items: [
            { pos: '초물', k: 'cho_A' },
            { pos: '중물', k: 'jung_A' },
            { pos: '종물', k: 'jong_A' }
          ]},
          { group: 'B 좌측 클립', spec: bClipSpec, items: [
            { pos: '초물', k: 'cho_B_left' },
            { pos: '중물', k: 'jung_B_left' },
            { pos: '종물', k: 'jong_B_left' }
          ]},
          { group: 'B 우측 클립', spec: bClipSpec, items: [
            { pos: '초물', k: 'cho_B_right' },
            { pos: '중물', k: 'jung_B_right' },
            { pos: '종물', k: 'jong_B_right' }
          ]},
          { group: 'C 전장', spec: cSpec, items: [
            { pos: '초물', k: 'cho_C' },
            { pos: '중물', k: 'jung_C' },
            { pos: '종물', k: 'jong_C' }
          ]}
        ];

        section5.innerHTML = \`
          <div class="card" style="padding: 16px; margin-bottom: 16px;">
            <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 12px; display: block;">
              📐 <span class="sec-num"></span> 치수확인
            </label>

            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 12px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #ffffff; font-weight: 700; color: #000;">
                    <th style="border: 1px solid #000; padding: 6px; width: 26%;">항목</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 20%;">스펙(mm)</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 18%;">구분</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 18%;">LH</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 18%;">RH</th>
                  </tr>
                </thead>
                <tbody>
                  \${rowsDef.map(g => g.items.map((it, idx) => \`
                    <tr>
                      \${idx === 0 ? \`<td rowspan="\${g.items.length}" style="border: 1px solid #000; padding: 6px; font-weight: 700; background: #ffffff; vertical-align: middle;">\${g.group}</td>\` : ''}
                      \${idx === 0 ? \`<td rowspan="\${g.items.length}" style="border: 1px solid #000; padding: 6px; font-weight: 700; background: #ffffff; vertical-align: middle;">\${g.spec}</td>\` : ''}
                      <td style="border: 1px solid #000; padding: 6px; font-weight: 700; background: #ffffff;">\${it.pos}</td>
                      <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                        <input type="text" id="dim2005_\${it.k}_lh" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" value="\${d2005[it.k + '_lh'] || ''}" />
                      </td>
                      <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                        <input type="text" id="dim2005_\${it.k}_rh" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" value="\${d2005[it.k + '_rh'] || ''}" />
                      </td>
                    </tr>
                  \`).join('')).join('')}
                </tbody>
              </table>
            </div>
          </div>
        \`;`;

const replacement = `      } else if ([2005, 2015].includes(formCode)) {
        const d2005 = existingData?.dim2005Data || {};
        const aSpec = (formCode === 2015 || curCarCode === 'DT QUAD')
          ? '509 ± 5'
          : (curCarCode === 'DS STD'
            ? '1018 ± 5'
            : (curCarCode === 'DS CREW' ? '707 ± 5' : '779 ± 5'));
        const bClipSpec = (curCarCode === 'DS STD') ? '29 ± 1' : '28 ± 1';
        const cSpec = (curCarCode === 'DS STD')
          ? '391 ± 5'
          : (curCarCode === 'DS CREW'
            ? '379 ± 5'
            : ((formCode === 2015 || curCarCode === 'DT QUAD') ? '216 ± 4' : '246 ± 4'));
        
        const rowsDef = [
          { group: 'A 전장', spec: aSpec, items: [
            { pos: '초물', k: 'cho_A' },
            { pos: '중물', k: 'jung_A' },
            { pos: '종물', k: 'jong_A' }
          ]},
          { group: 'B 좌측 클립', spec: bClipSpec, items: [
            { pos: '초물', k: 'cho_B_left' },
            { pos: '중물', k: 'jung_B_left' },
            { pos: '종물', k: 'jong_B_left' }
          ]},
          { group: 'B 우측 클립', spec: bClipSpec, items: [
            { pos: '초물', k: 'cho_B_right' },
            { pos: '중물', k: 'jung_B_right' },
            { pos: '종물', k: 'jong_B_right' }
          ]},
          { group: 'C 전장', spec: cSpec, items: [
            { pos: '초물', k: 'cho_C' },
            { pos: '중물', k: 'jung_C' },
            { pos: '종물', k: 'jong_C' }
          ]}
        ];

        section5.innerHTML = \`
          <div class="card" style="padding: 16px; margin-bottom: 16px;">
            <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 12px; display: block;">
              📐 <span class="sec-num"></span> 치수확인
            </label>

            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 12px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #ffffff; font-weight: 700; color: #000;">
                    <th style="border: 1px solid #000; padding: 6px; width: 26%;">항목</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 20%;">스펙(mm)</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 18%;">구분</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 18%;">LH</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 18%;">RH</th>
                  </tr>
                </thead>
                <tbody>
                  \${rowsDef.map(g => g.items.map((it, idx) => \`
                    <tr>
                      \${idx === 0 ? \`<td rowspan="\${g.items.length}" style="border: 1px solid #000; padding: 6px; font-weight: 700; background: #ffffff; vertical-align: middle;">\${g.group}</td>\` : ''}
                      \${idx === 0 ? \`<td rowspan="\${g.items.length}" style="border: 1px solid #000; padding: 6px; font-weight: 700; background: #ffffff; vertical-align: middle;">\${g.spec}</td>\` : ''}
                      <td style="border: 1px solid #000; padding: 6px; font-weight: 700; background: #ffffff;">\${it.pos}</td>
                      <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                        <input type="text" id="dim2005_\${it.k}_lh" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" value="\${d2005[it.k + '_lh'] || ''}" />
                      </td>
                      <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                        <input type="text" id="dim2005_\${it.k}_rh" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" value="\${d2005[it.k + '_rh'] || ''}" />
                      </td>
                    </tr>
                  \`).join('')).join('')}
                </tbody>
              </table>
            </div>
          </div>
        \`;
      } else if (formCode === 2035) {
        const d2035 = existingData?.dim2005Data || {};
        const stages = [
          { pos: '초물', items: [
            { group: 'A 전장', spec: '1018 ± 5', k: 'cho_A' },
            { group: 'B 좌측 클립', spec: '29 ± 1', k: 'cho_B_left' },
            { group: 'B 우측 클립', spec: '29 ± 1', k: 'cho_B_right' },
            { group: 'C 전장', spec: '391 ± 5', k: 'cho_C' }
          ]},
          { pos: '중물', items: [
            { group: 'A 전장', spec: '1018 ± 5', k: 'jung_A' },
            { group: 'B 좌측 클립', spec: '29 ± 1', k: 'jung_B_left' },
            { group: 'B 우측 클립', spec: '29 ± 1', k: 'jung_B_right' },
            { group: 'C 전장', spec: '391 ± 5', k: 'jung_C' }
          ]},
          { pos: '종물', items: [
            { group: 'A 전장', spec: '1018 ± 5', k: 'jong_A' },
            { group: 'B 좌측 클립', spec: '29 ± 1', k: 'jong_B_left' },
            { group: 'B 우측 클립', spec: '29 ± 1', k: 'jong_B_right' },
            { group: 'C 전장', spec: '391 ± 5', k: 'jong_C' }
          ]}
        ];

        section5.innerHTML = \`
          <div class="card" style="padding: 16px; margin-bottom: 16px;">
            <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 12px; display: block;">
              📐 <span class="sec-num"></span> 치수확인
            </label>

            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 12px; background: #fff; font-family: 'Noto Sans KR', sans-serif;" data-wheel-parsed-spec="2035_isolated">
                <thead>
                  <tr style="background: #ffffff; font-weight: 700; color: #000;">
                    <th style="border: 1px solid #000; padding: 6px; width: 18%;">구분</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 26%;">항목</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 20%;">스펙(mm)</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 18%;">LH</th>
                    <th style="border: 1px solid #000; padding: 6px; width: 18%;">RH</th>
                  </tr>
                </thead>
                <tbody>
                  \${stages.map(stage => stage.items.map((it, idx) => \`
                    <tr>
                      \${idx === 0 ? \`<td rowspan="\${stage.items.length}" style="border: 1px solid #000; padding: 6px; font-weight: 700; background: #ffffff; vertical-align: middle;">\${stage.pos}</td>\` : ''}
                      <td style="border: 1px solid #000; padding: 6px; font-weight: 700; background: #ffffff;">\${it.group}</td>
                      <td style="border: 1px solid #000; padding: 6px; font-weight: 700; background: #ffffff;">\${it.spec}</td>
                      <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                        <input type="text" id="dim2005_\${it.k}_lh" data-isolated="true" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" value="\${d2035[it.k + '_lh'] || ''}" />
                      </td>
                      <td style="border: 1px solid #000; padding: 2px; background: #ffffff;">
                        <input type="text" id="dim2005_\${it.k}_rh" data-isolated="true" class="form-control" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 6px 2px; border-radius: 0; outline: none; background: transparent;" value="\${d2035[it.k + '_rh'] || ''}" />
                      </td>
                    </tr>
                  \`).join('')).join('')}
                </tbody>
              </table>
            </div>
          </div>
        \`;`;

const startIndex = content.indexOf('} else if ([2005, 2015, 2035].includes(formCode)) {');
if (startIndex !== -1) {
  // Find the next } else if (formCode === 2027) {
  const endIndex = content.indexOf('} else if (formCode === 2027) {', startIndex);
  if (endIndex !== -1) {
    const before = content.substring(0, startIndex);
    const after = content.substring(endIndex);
    fs.writeFileSync(targetFile, before + replacement + '\n' + after, 'utf8');
    console.log('Success');
  } else {
    console.log('End index not found');
  }
} else {
  console.log('Start index not found');
}
