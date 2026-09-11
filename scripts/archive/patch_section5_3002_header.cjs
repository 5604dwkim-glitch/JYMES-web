const fs = require('fs');

let code = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');

// I will replace the 3002 if-block completely.

const newBlock = `
    if (formCode === 3002) {
      const v = existingData && existingData.vulcTable ? existingData.vulcTable : {};

      const val = v['side'] || '';

      const inp = (prefix) => {
        const id = \`vulc_\${prefix}\`;
        const vval = v[prefix] || '';
        return \`<input type="text" id="\${id}" class="form-control vulc-input-dynamic" style="width: 70%; height: 24px; text-align: center; font-size: 11px; padding: 2px;" value="\${vval}" />\`;
      };

      const tempCell = (stage, part) => \`
        <div style="display: flex; align-items: center; justify-content: center; gap: 2px;">
          <span style="font-size: 10px; color: #555; font-weight: 700;">(상)</span>
          \${inp(\`temp_\${stage}_\${part}_상\`)}
        </div>
        <div style="display: flex; align-items: center; justify-content: center; gap: 2px; margin-top: 2px;">
          <span style="font-size: 10px; color: #555; font-weight: 700;">(하)</span>
          \${inp(\`temp_\${stage}_\${part}_하\`)}
        </div>
      \`;

      const timeCell = (stage, part) => \`
        \${inp(\`time_\${stage}_\${part}\`)}
      \`;

      const jointLotVal = (existingData && existingData.materialLots && existingData.materialLots['jointRubber'])
        ? existingData.materialLots['jointRubber'] : '';

      section5.innerHTML = \\\`
        <div class="card" style="padding: 16px; margin-bottom: 16px;">
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 6px; display: block;">
            🔗 <span class="sec-num"></span> 조인트 고무 LOT 번호 입력
          </label>
          <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 10px;">조인트 고무 소재의 LOT 번호를 입력하세요.</p>
          <input type="text" id="lotNo_jointRubber" class="form-control lot-datetime-input"
            style="max-width: 280px; font-family: monospace;"
            placeholder="년월일시분 (예: 2607251330)"
            value="\${jointLotVal}" />
        </div>

        <div class="card" style="padding: 16px; margin-bottom: 16px;">
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
            ♨️ <span class="sec-num"></span> 설비 가류온도 & 가류시간 입력
          </label>
          <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
              <thead>
                <tr style="background: #fffde7; font-weight: 700; color: #000;">
                  <th colspan="2" rowspan="2" style="border: 1px solid #000; padding: 6px; vertical-align: middle;">구 분(Division)</th>
                  <th colspan="4" style="border: 1px solid #000; padding: 6px; font-size: 13px;">
                    <label style="margin-right: 20px; cursor: pointer;">
                      <input type="radio" name="sideRadio" value="LH" onchange="document.getElementById('vulc_side').value=this.value" \${val==='LH'?'checked':''} style="margin-right: 4px;"> LH
                    </label>
                    <label style="cursor: pointer;">
                      <input type="radio" name="sideRadio" value="RH" onchange="document.getElementById('vulc_side').value=this.value" \${val==='RH'?'checked':''} style="margin-right: 4px;"> RH
                    </label>
                    <input type="hidden" id="vulc_side" class="vulc-input-dynamic" value="\${val}" />
                  </th>
                </tr>
                <tr style="background: #fffde7; font-weight: 700; color: #000;">
                  <th style="border: 1px solid #000; padding: 6px; width: 20%;">FRT(P)</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 20%;">FRT(Q)</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 20%;">RR(R)</th>
                  <th style="border: 1px solid #000; padding: 6px; width: 20%;">RR(S)</th>
                </tr>
              </thead>
              <tbody>
                <!-- 가류온도 -->
                <tr>
                  <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    가류온도<br>(Temperature) 상<br>(Upper/하(DOWN)
                  </td>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">규격 (Spec)</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">200 ± 10</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 2px;">초물(Start)</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('start', 'frt_p')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('start', 'frt_q')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('start', 'rr_r')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('start', 'rr_s')}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 2px;">중물(Harf)</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('harf', 'frt_p')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('harf', 'frt_q')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('harf', 'rr_r')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('harf', 'rr_s')}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 2px;">종물(Finish)</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('finish', 'frt_p')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('finish', 'frt_q')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('finish', 'rr_r')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${tempCell('finish', 'rr_s')}</td>
                </tr>

                <!-- 가류시간 -->
                <tr>
                  <td rowspan="4" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                    가류시간(Time)- 초<br>(Sec)
                  </td>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">규격 (Spec)</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                  <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">90 ± 10</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 2px;">초물(Start)</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('start', 'frt_p')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('start', 'frt_q')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('start', 'rr_r')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('start', 'rr_s')}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 2px;">중물(Harf)</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('harf', 'frt_p')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('harf', 'frt_q')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('harf', 'rr_r')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('harf', 'rr_s')}</td>
                </tr>
                <tr>
                  <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 2px;">종물(Finish)</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('finish', 'frt_p')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('finish', 'frt_q')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('finish', 'rr_r')}</td>
                  <td style="border: 1px solid #000; padding: 2px;">\${timeCell('finish', 'rr_s')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      \\\`;

      // 휠 피커 이벤트 바인딩
      setTimeout(() => {
        section5.querySelectorAll('.vulc-input-dynamic').forEach(input => {
          if (input.type === 'hidden') return;
          const isTime = input.id.includes('time_');
          const isUpper = input.id.includes('_상');
          const defVal = isTime ? 90 : 200;
          const labelSuffix = isTime ? '가류시간' : \`가류온도 \${isUpper ? '(상)' : '(하)'}\`;
          
          let stageLabel = '';
          if (input.id.includes('start_')) stageLabel = '초물';
          else if (input.id.includes('harf_')) stageLabel = '중물';
          else if (input.id.includes('finish_')) stageLabel = '종물';

          if (bindNumberWheelPicker) {
            bindNumberWheelPicker(input, \`\${stageLabel} \${labelSuffix}\`, defVal, 30, isTime ? '초' : '℃');
          }
        });
      }, 0);

      return;
    }
`;

const startIndex = code.indexOf('if (formCode === 3002) {');
const endIndex = code.indexOf('if (formCode === 4001) {');

const before = code.substring(0, startIndex);
const after = code.substring(endIndex);

fs.writeFileSync('src/components/DynamicForms/sections/Section5Renderer.js', before + newBlock.trim() + '\n\n    ' + after);
console.log('Successfully updated 3002 block!');
