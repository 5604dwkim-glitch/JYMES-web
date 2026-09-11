const fs = require('fs');
const parts = ['초물', '중물', '종물'];
const types = [
  { key: 'press', name: '압력' },
  { key: 'speed', name: '속도' },
  { key: 'time', name: '시간' },
  { key: 'pos', name: '위치' }
];

let rowsHTML = '';
parts.forEach(part => {
  types.forEach((type, idx) => {
    rowsHTML += '                  <tr>\n';
    if (idx === 0) {
      rowsHTML += `                    <td rowspan="4" style="border: 1px solid #000; padding: 8px; background: #cfd8dc; font-weight: 700; width: 40px; vertical-align: middle;">${part}</td>\n`;
    }
    const borderStyle = (idx === 3) ? 'border-bottom: 1px solid #000;' : 'border-bottom: 1px dotted #000;';
    rowsHTML += `                    <td style="border: 1px solid #000; border-top: ${idx === 0 ? '1px solid #000' : '1px dotted #000'}; ${borderStyle} padding: 8px; background: #cfd8dc; font-weight: 700;">${type.name}</td>\n`;
    
    for (let i = 1; i <= 3; i++) {
      const inputId = `inj_${type.key}_${part}_${i}`;
      rowsHTML += `                    <td style="border: 1px solid #000; border-top: ${idx === 0 ? '1px solid #000' : '1px dotted #000'}; ${borderStyle} padding: 2px;"><input type="text" id="${inputId}" class="form-control" style="width:100%; border:none; text-align:center; background:transparent;" value="\${${inputId}_val}" /></td>\n`;
    }
    rowsHTML += '                  </tr>\n';
  });
});

let varsObjStr = '';
parts.forEach(p => {
  types.forEach(t => {
    for (let i = 1; i <= 3; i++) {
      varsObjStr += `        const inj_${t.key}_${p}_${i}_val = inj['inj_${t.key}_${p}_${i}'] || '';\n`;
    }
  });
});

const scriptTemplate = `      if (formCode === 1022 || formCode === 1042) {
        const jointLotVal = existingData?.jointRubberLotNo || '';
        const v = existingData?.vulcData || {};
        const inj = existingData?.injSetData || {};
        
${varsObjStr}

        section5.innerHTML = \`
          <div class="card" style="padding: 16px; margin-bottom: 16px;">
            <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
              🔢 <span class="sec-num"></span> 조인트 고무 LOT 번호 입력
            </label>
            <input type="text" id="jointRubberLotNo" class="form-control" style="width: 100%; border: 1px solid var(--border-color); text-align: center; font-size: 12px; padding: 10px; border-radius: 6px; box-sizing: border-box;" placeholder="조인트 고무 LOT 입력" value="\${jointLotVal}" />
          </div>

          <div class="card" style="padding: 16px; margin-bottom: 16px;">
            <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
              🌡️ <span class="sec-num"></span> 사출온도
            </label>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #cfd8dc; font-weight: 700; color: #000;">
                    <th colspan="2" style="border: 1px solid #000; padding: 8px;">구분</th>
                    <th style="border: 1px solid #000; padding: 8px;">노즐<br>(Nozzle)</th>
                    <th style="border: 1px solid #000; padding: 8px;">실린더 1<br>(H1)</th>
                    <th style="border: 1px solid #000; padding: 8px;">실린더 2<br>(H2)</th>
                    <th style="border: 1px solid #000; padding: 8px;">실린더 3<br>(H1)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td rowspan="2" style="border: 1px solid #000; padding: 8px; background: #cfd8dc; font-weight: 700; width: 40px; vertical-align: middle;">사출<br>온도<br>(Temp)</td>
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

          <div class="card" style="padding: 16px; margin-bottom: 16px;">
            <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
              ⚙️ <span class="sec-num"></span> 사출설정값
            </label>
            <div style="overflow-x: auto;">
              <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
                <thead>
                  <tr style="background: #cfd8dc; font-weight: 700; color: #000;">
                    <th colspan="2" style="border: 1px solid #000; padding: 8px;">구분</th>
                    <th style="border: 1px solid #000; padding: 8px;">사출(Injection) 1</th>
                    <th style="border: 1px solid #000; padding: 8px;">사출(Injection) 2</th>
                    <th style="border: 1px solid #000; padding: 8px;">사출(Injection) 3</th>
                  </tr>
                </thead>
                <tbody>
${rowsHTML}                </tbody>
              </table>
            </div>
          </div>
        \`;
        return;
      }`;

let t = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');
const startMatch = '      if (formCode === 1022 || formCode === 1042) {';
const endMatch = '        return;\n      }';
const startIndex = t.indexOf(startMatch);
if (startIndex !== -1) {
  let endIndex = t.indexOf(endMatch, startIndex);
  if (endIndex !== -1) {
    endIndex += endMatch.length;
    t = t.substring(0, startIndex) + scriptTemplate + t.substring(endIndex);
    fs.writeFileSync('src/components/DynamicForms/sections/Section5Renderer.js', t);
    console.log('Successfully updated Section5Renderer.js');
  } else {
    console.log('End match not found');
  }
} else {
  console.log('Start match not found');
}
