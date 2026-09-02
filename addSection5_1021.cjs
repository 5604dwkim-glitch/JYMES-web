const fs = require('fs');
const filePath = 'src/components/DynamicForms/sections/Section5Renderer.js';
let t = fs.readFileSync(filePath, 'utf8');

const targetStr = `} else if (curProc === '소재준비' || curProc.startsWith('소재준비')) {`;

const newCode = `} else if (formCode === 1021) {
      const d = existingData?.dimensionCheck || {};
      section5.innerHTML = \`
        <div class="card" style="padding: 16px; margin-bottom: 16px;">
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
            📐 <span class="sec-num"></span> 치수확인
          </label>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <thead>
                <tr style="background: #fffde7; font-weight: 700; color: #000;">
                  <th colspan="2" style="border: 1px solid #000; padding: 6px;">구 분(Division)</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 60%;">PTG</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    정치절단길이<br>(Spec Cutt,g )
                  </td>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">규격 (Spec)</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px; background: #ffffff;">326 ± 2mm</td>
                </tr>
                <tr>
                  <td rowspan="3" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    실측(Act) (초/중/종)
                  </td>
                  <td style="border: 1px solid #000; padding: 4px; text-align: left; background: #ffffff;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                      <span style="font-weight: 700; width: 24px; text-align: center;">(초)</span>
                      <input type="text" id="dim_ptg_act_초" class="form-control" style="flex: 1; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center; padding: 4px;" placeholder="326" value="\${d['ptg_act_초'] || ''}" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 4px; text-align: left; background: #ffffff;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                      <span style="font-weight: 700; width: 24px; text-align: center;">(중)</span>
                      <input type="text" id="dim_ptg_act_중" class="form-control" style="flex: 1; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center; padding: 4px;" placeholder="326" value="\${d['ptg_act_중'] || ''}" />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; padding: 4px; text-align: left; background: #ffffff;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 4px;">
                      <span style="font-weight: 700; width: 24px; text-align: center;">(종)</span>
                      <input type="text" id="dim_ptg_act_종" class="form-control" style="flex: 1; border: 1px solid #cbd5e1; border-radius: 4px; text-align: center; padding: 4px;" placeholder="326" value="\${d['ptg_act_종'] || ''}" />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      \`;
    } else if (curProc === '소재준비' || curProc.startsWith('소재준비')) {`;

if (!t.includes('formCode === 1021')) {
  t = t.replace(targetStr, newCode);
  fs.writeFileSync(filePath, t);
  console.log('Successfully injected formCode === 1021 into Section5Renderer.js');
} else {
  console.log('formCode === 1021 is already present.');
}
