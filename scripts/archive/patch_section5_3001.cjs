const fs = require('fs');

function makeTable(stageLabel, stageKey) {
  const tHeader = `
    <div style="margin-top: 16px; margin-bottom: 4px; font-weight: bold; font-size: 13px; color: #1e3a8a;">${stageLabel}</div>
    <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
  `;
  
  // Helper for input fields
  const inp = (idSuffix) => {
    const id = `dim_3001_${idSuffix}_${stageKey}`;
    return `<input type="text" id="${id}" class="form-control dim-input-dynamic" style="width: 100%; height: 26px; padding: 2px; text-align: center; font-size: 11px; border: none; background: transparent; outline: none;" value="\${d['${id.replace('dim_', '')}'] || ''}" />`;
  };

  const topHalf = `
      <thead>
        <tr style="background: #f8fafc; font-weight: 700; color: #000;">
          <th colspan="2" style="border: 1px solid #000; padding: 6px; width: 16%;">구 분</th>
          <th style="border: 1px solid #000; padding: 6px; width: 21%;">FRT A LH</th>
          <th style="border: 1px solid #000; padding: 6px; width: 21%;">FRT A RH</th>
          <th style="border: 1px solid #000; padding: 6px; width: 21%;">RR A LH</th>
          <th style="border: 1px solid #000; padding: 6px; width: 21%;">RR A RH</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td rowspan="2" style="border: 1px solid #000; background: #f8fafc; font-weight: 700;">정치<br>절단</td>
          <td style="border: 1px solid #000; background: #f8fafc;">규 격</td>
          <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">1189 ± 5</td>
          <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">1189 ± 5</td>
          <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">668 ± 5</td>
          <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">668 ± 5</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; background: #f8fafc;">실 측</td>
          <td style="border: 1px solid #000; padding: 2px;">${inp('cut_FRT_A_LH')}</td>
          <td style="border: 1px solid #000; padding: 2px;">${inp('cut_FRT_A_RH')}</td>
          <td style="border: 1px solid #000; padding: 2px;">${inp('cut_RR_A_LH')}</td>
          <td style="border: 1px solid #000; padding: 2px;">${inp('cut_RR_A_RH')}</td>
        </tr>
        <tr>
          <td rowspan="4" style="border: 1px solid #000; background: #f8fafc; font-weight: 700;">단컷팅</td>
          <td style="border: 1px solid #000; background: #f8fafc;">규 격</td>
          <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">(Q부)<br>73 ± 1</td>
          <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">(Q부)<br>73 ± 1</td>
          <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">(S부 A)<br>57 ± 1</td>
          <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">(S부 A)<br>57 ± 1</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; background: #f8fafc;">실 측</td>
          <td style="border: 1px solid #000; padding: 2px;">${inp('step1_FRT_A_LH')}</td>
          <td style="border: 1px solid #000; padding: 2px;">${inp('step1_FRT_A_RH')}</td>
          <td style="border: 1px solid #000; padding: 2px;">${inp('step1_RR_A_LH')}</td>
          <td style="border: 1px solid #000; padding: 2px;">${inp('step1_RR_A_RH')}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; background: #f8fafc;">규 격</td>
          <td style="border: 1px solid #000; background: #e2e8f0;"></td>
          <td style="border: 1px solid #000; background: #e2e8f0;"></td>
          <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">(R부 A)<br>75 ± 1</td>
          <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">(R부 A)<br>75 ± 1</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; background: #f8fafc;">실 측</td>
          <td style="border: 1px solid #000; background: #e2e8f0;"></td>
          <td style="border: 1px solid #000; background: #e2e8f0;"></td>
          <td style="border: 1px solid #000; padding: 2px;">${inp('step2_RR_A_LH')}</td>
          <td style="border: 1px solid #000; padding: 2px;">${inp('step2_RR_A_RH')}</td>
        </tr>
  `;

  const bottomHalf = `
        <tr style="background: #f8fafc; font-weight: 700; color: #000;">
          <th colspan="2" style="border: 1px solid #000; padding: 6px;">구 분</th>
          <th style="border: 1px solid #000; padding: 6px;">RR C LH</th>
          <th style="border: 1px solid #000; padding: 6px;">RR C RH</th>
          <th style="border: 1px solid #000; padding: 6px;">RR D LH</th>
          <th style="border: 1px solid #000; padding: 6px;">RR D RH</th>
        </tr>
        <tr>
          <td rowspan="2" style="border: 1px solid #000; background: #f8fafc; font-weight: 700;">정치<br>절단</td>
          <td style="border: 1px solid #000; background: #f8fafc;">규 격</td>
          <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">397 ± 3</td>
          <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">397 ± 3</td>
          <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">499 ± 3</td>
          <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">499 ± 3</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; background: #f8fafc;">실 측</td>
          <td style="border: 1px solid #000; padding: 2px;">${inp('cut_RR_C_LH')}</td>
          <td style="border: 1px solid #000; padding: 2px;">${inp('cut_RR_C_RH')}</td>
          <td style="border: 1px solid #000; padding: 2px;">${inp('cut_RR_D_LH')}</td>
          <td style="border: 1px solid #000; padding: 2px;">${inp('cut_RR_D_RH')}</td>
        </tr>
        <tr>
          <td rowspan="4" style="border: 1px solid #000; background: #f8fafc; font-weight: 700;">단컷팅</td>
          <td style="border: 1px solid #000; background: #f8fafc;">규 격</td>
          <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">(R부 C)<br>41 ± 1</td>
          <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">(R부 C)<br>41 ± 1</td>
          <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">(S부 D)<br>30 ± 1</td>
          <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">(S부 D)<br>30 ± 1</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; background: #f8fafc;">실 측</td>
          <td style="border: 1px solid #000; padding: 2px;">${inp('step1_RR_C_LH')}</td>
          <td style="border: 1px solid #000; padding: 2px;">${inp('step1_RR_C_RH')}</td>
          <td style="border: 1px solid #000; padding: 2px;">${inp('step1_RR_D_LH')}</td>
          <td style="border: 1px solid #000; padding: 2px;">${inp('step1_RR_D_RH')}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; background: #f8fafc;">규 격</td>
          <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">(R부 C사선)<br>10 ± 1</td>
          <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">(R부 C사선)<br>10 ± 1</td>
          <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">(D끝단사선)<br>19 ± 1</td>
          <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">(D끝단사선)<br>19 ± 1</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; background: #f8fafc;">실 측</td>
          <td style="border: 1px solid #000; padding: 2px;">${inp('step2_RR_C_LH')}</td>
          <td style="border: 1px solid #000; padding: 2px;">${inp('step2_RR_C_RH')}</td>
          <td style="border: 1px solid #000; padding: 2px;">${inp('step2_RR_D_LH')}</td>
          <td style="border: 1px solid #000; padding: 2px;">${inp('step2_RR_D_RH')}</td>
        </tr>
      </tbody>
  `;
  return tHeader + topHalf + bottomHalf + '</table>';
}

const html3001 = `
    if (formCode === 3001) {
      section5.innerHTML = \`
        <div class="card" style="padding: 16px; margin-bottom: 16px;">
          <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;">
            📐 <span class="sec-num"></span> 치수확인
          </label>
          <div style="overflow-x: auto; margin-bottom: 24px;">
            ${makeTable('1. 초물', '초')}
            ${makeTable('2. 중물', '중')}
            ${makeTable('3. 종물', '종')}
          </div>
        </div>
      \`;

      // 휠 피커 이벤트 바인딩
      // 모든 dim-input-dynamic 인풋에 대해 기본 휠 피커를 바인딩 (소수점 1자리 휠로 처리)
      setTimeout(() => {
        section5.querySelectorAll('.dim-input-dynamic').forEach(input => {
          let defVal = 0;
          let range = 20;
          
          if (input.id.includes('_cut_FRT_A_')) { defVal = 1189; range = 30; }
          else if (input.id.includes('_cut_RR_A_')) { defVal = 668; range = 30; }
          else if (input.id.includes('_cut_RR_C_')) { defVal = 397; range = 20; }
          else if (input.id.includes('_cut_RR_D_')) { defVal = 499; range = 20; }
          else if (input.id.includes('_step1_FRT_A_')) { defVal = 73; range = 10; }
          else if (input.id.includes('_step1_RR_A_')) { defVal = 57; range = 10; }
          else if (input.id.includes('_step2_RR_A_')) { defVal = 75; range = 10; }
          else if (input.id.includes('_step1_RR_C_')) { defVal = 41; range = 10; }
          else if (input.id.includes('_step1_RR_D_')) { defVal = 30; range = 10; }
          else if (input.id.includes('_step2_RR_C_')) { defVal = 10; range = 10; }
          else if (input.id.includes('_step2_RR_D_')) { defVal = 19; range = 10; }
          
          if (bindNumberWheelPicker) {
            bindNumberWheelPicker(input, '치수 실측(Act)', defVal, range, 'mm');
          }
        });
      }, 0);

      return;
    }
`;

let code = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');
code = code.replace("if (formCode === 4001) {", html3001 + "\n    if (formCode === 4001) {");
fs.writeFileSync('src/components/DynamicForms/sections/Section5Renderer.js', code);
console.log("Section5Renderer.js patched for 3001!");
