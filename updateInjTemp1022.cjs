const fs = require('fs');

// 1. Update LegacyFormWrapper.jsx
let formWrapper = fs.readFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', 'utf8');
const vulcInjectionStr = `
        set_nozzle: container.querySelector('#vulc_set_nozzle')?.value || '',
        set_h1: container.querySelector('#vulc_set_h1')?.value || '',
        set_h2: container.querySelector('#vulc_set_h2')?.value || '',
        set_h3: container.querySelector('#vulc_set_h3')?.value || '',
        act_nozzle: container.querySelector('#vulc_act_nozzle')?.value || '',
        act_h1: container.querySelector('#vulc_act_h1')?.value || '',
        act_h2: container.querySelector('#vulc_act_h2')?.value || '',
        act_h3: container.querySelector('#vulc_act_h3')?.value || '',
`;
if (!formWrapper.includes('set_nozzle:')) {
  formWrapper = formWrapper.replace('const vulcData = {', 'const vulcData = {\n' + vulcInjectionStr);
  fs.writeFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', formWrapper);
  console.log('Injected new fields into LegacyFormWrapper.jsx');
}

// 2. Update Section5Renderer.js
let renderer = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');

const targetRenderStr = `if (curProc === '조인트' || curProc === '조인트(D)') {`;
const injectionRenderCode = `
      if (formCode === 1022 || formCode === 1042) {
        const jointLotVal = existingData?.jointRubberLotNo || '';
        const v = existingData?.vulcData || {};
        section5.innerHTML = \`
          <div class="card" style="padding: 16px; margin-bottom: 16px;">
            <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
              🔢 <span class="sec-num"></span> 조인트 고무 LOT 번호 입력
            </label>
            <input type="text" id="jointRubberLotNo" class="form-control" style="width: 100%; border: 1px solid var(--border-color); text-align: center; font-size: 12px; padding: 10px; border-radius: 6px; box-sizing: border-box;" placeholder="조인트 고무 LOT 입력" value="\${jointLotVal}" />
          </div>

          <div class="card" style="padding: 16px; margin-bottom: 16px;">
            <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
              🌡️ <span class="sec-num"></span> 사출온도 입력
            </label>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #cfd8dc; font-weight: 700; color: #000;">
                    <th style="border: 1px solid #000; padding: 8px;">구분</th>
                    <th style="border: 1px solid #000; padding: 8px;">노즐<br>(Nozzle)</th>
                    <th style="border: 1px solid #000; padding: 8px;">실린더 1<br>(H1)</th>
                    <th style="border: 1px solid #000; padding: 8px;">실린더 2<br>(H2)</th>
                    <th style="border: 1px solid #000; padding: 8px;">실린더 3<br>(H1)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="border: 1px solid #000; padding: 8px; background: #cfd8dc; font-weight: 700; border-bottom: 1px dotted #000;">설정값(set)</td>
                    <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="number" id="vulc_set_nozzle" class="form-control" style="width:100%; border:none; text-align:center; background:transparent;" value="\${v.set_nozzle || ''}" /></td>
                    <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="number" id="vulc_set_h1" class="form-control" style="width:100%; border:none; text-align:center; background:transparent;" value="\${v.set_h1 || ''}" /></td>
                    <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="number" id="vulc_set_h2" class="form-control" style="width:100%; border:none; text-align:center; background:transparent;" value="\${v.set_h2 || ''}" /></td>
                    <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px solid #000; border-bottom: 1px dotted #000; padding: 2px;"><input type="number" id="vulc_set_h3" class="form-control" style="width:100%; border:none; text-align:center; background:transparent;" value="\${v.set_h3 || ''}" /></td>
                  </tr>
                  <tr>
                    <td style="border: 1px solid #000; padding: 8px; background: #cfd8dc; font-weight: 700; border-top: 1px dotted #000;">실측치(act)</td>
                    <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px dotted #000; border-bottom: 1px solid #000; padding: 2px;"><input type="number" id="vulc_act_nozzle" class="form-control" style="width:100%; border:none; text-align:center; background:transparent;" value="\${v.act_nozzle || ''}" /></td>
                    <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px dotted #000; border-bottom: 1px solid #000; padding: 2px;"><input type="number" id="vulc_act_h1" class="form-control" style="width:100%; border:none; text-align:center; background:transparent;" value="\${v.act_h1 || ''}" /></td>
                    <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px dotted #000; border-bottom: 1px solid #000; padding: 2px;"><input type="number" id="vulc_act_h2" class="form-control" style="width:100%; border:none; text-align:center; background:transparent;" value="\${v.act_h2 || ''}" /></td>
                    <td style="border-left: 1px solid #000; border-right: 1px solid #000; border-top: 1px dotted #000; border-bottom: 1px solid #000; padding: 2px;"><input type="number" id="vulc_act_h3" class="form-control" style="width:100%; border:none; text-align:center; background:transparent;" value="\${v.act_h3 || ''}" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        \`;
        return;
      }
`;

if (!renderer.includes('id="vulc_set_nozzle"')) {
  renderer = renderer.replace(targetRenderStr, targetRenderStr + '\n' + injectionRenderCode);
  fs.writeFileSync('src/components/DynamicForms/sections/Section5Renderer.js', renderer);
  console.log('Injected Section 5 renderer for form 1022 and 1042');
}
