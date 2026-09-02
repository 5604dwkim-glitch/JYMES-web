const fs = require('fs');

const tpl = `
export function getForm3001QtyHTML(ed, container) {
    const q = ed && ed.qtyTable ? ed.qtyTable : {};
    
    // 헬퍼: input 태그 생성
    const inp = (prefix, pos) => \`<input type="number" id="qtyd_\${prefix}_\${pos}" class="form-control qty-calc-input qty-input-dynamic" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="\${q[\`\${prefix}_\${pos}\`] ?? ''}" placeholder="0" />\`;
    const sum = (pos) => \`<span id="qtyd_def_sum_\${pos}">0</span>\`;

    const getTable = (title, cols) => \`
          <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif; margin-bottom: 16px;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700;">
                <th colspan="2" style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 30%;">
                  구 분(Division)
                </th>
                <th style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 17.5%;">\${cols[0].label}</th>
                <th style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 17.5%;">\${cols[1].label}</th>
                <th style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 17.5%;">\${cols[2].label}</th>
                <th style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 17.5%;">\${cols[3].label}</th>
              </tr>
            </thead>
            <tbody>
              <!-- 1. 생산량(Q,TY) -->
              <tr>
                <td rowspan="2" style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; vertical-align: middle; width: 16%;">
                  생산량(Q,TY)
                </td>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; width: 14%;">계획</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('plan', cols[0].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('plan', cols[1].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('plan', cols[2].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('plan', cols[3].key)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">실적</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('act', cols[0].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('act', cols[1].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('act', cols[2].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('act', cols[3].key)}</td>
              </tr>
              <!-- 2. 압출소재불량(Extrusion Badness) -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; vertical-align: middle;">
                  압출소재불량<br>(Extrusion Badness)
                </td>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">스코치(Scortch)</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('ext_scorch', cols[0].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('ext_scorch', cols[1].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('ext_scorch', cols[2].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('ext_scorch', cols[3].key)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">외면흠 (Scratch)</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('ext_scratch', cols[0].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('ext_scratch', cols[1].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('ext_scratch', cols[2].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('ext_scratch', cols[3].key)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">플로킹 (Flock)</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('ext_flock', cols[0].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('ext_flock', cols[1].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('ext_flock', cols[2].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('ext_flock', cols[3].key)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">오염/이물 (Contam)</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('ext_contam', cols[0].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('ext_contam', cols[1].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('ext_contam', cols[2].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('ext_contam', cols[3].key)}</td>
              </tr>
              <!-- 3. 공정불량(Process Badness) -->
              <tr>
                <td rowspan="3" style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; vertical-align: middle;">
                  공정불량<br>(Process Badness)
                </td>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">길이불량(Len)</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('proc_len', cols[0].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('proc_len', cols[1].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('proc_len', cols[2].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('proc_len', cols[3].key)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">단면컷팅(Cut)</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('proc_cut', cols[0].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('proc_cut', cols[1].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('proc_cut', cols[2].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('proc_cut', cols[3].key)}</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">기타(Oth)</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('proc_oth', cols[0].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('proc_oth', cols[1].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('proc_oth', cols[2].key)}</td>
                <td style="border: 1px solid #000; padding: 2px;">\${inp('proc_oth', cols[3].key)}</td>
              </tr>
              <!-- 4. 불량합계 -->
              <tr>
                <td colspan="2" style="border: 1px solid #000; padding: 8px 4px; background: #fee2e2; font-weight: 700; color: #991b1b;">
                  불량 합계 (Defect Total)
                </td>
                <td style="border: 1px solid #000; padding: 8px 4px; background: #fee2e2; font-weight: 700; color: #991b1b;">\${sum(cols[0].key)}</td>
                <td style="border: 1px solid #000; padding: 8px 4px; background: #fee2e2; font-weight: 700; color: #991b1b;">\${sum(cols[1].key)}</td>
                <td style="border: 1px solid #000; padding: 8px 4px; background: #fee2e2; font-weight: 700; color: #991b1b;">\${sum(cols[2].key)}</td>
                <td style="border: 1px solid #000; padding: 8px 4px; background: #fee2e2; font-weight: 700; color: #991b1b;">\${sum(cols[3].key)}</td>
              </tr>
            </tbody>
          </table>
    \`;

    return \`
      <div class="card" style="padding: 16px; margin-bottom: 16px;">
        <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 8px; display: block;">
          📊 <span class="sec-num"></span> 생산실적 (Production Results)
        </label>

        <input type="hidden" id="targetQty" value="\${ed ? ed.targetQty : '0'}" />
        <input type="hidden" id="actualQty" value="\${ed ? ed.actualQty : '0'}" />
        <input type="hidden" id="defectQty" value="\${ed ? ed.defectQty : '0'}" />

        <div id="form3001QtyTable" style="overflow-x: auto;">
          \${getTable('1', [
            {label: 'FRT LH A', key: 'FL_A'},
            {label: 'FRT RH A', key: 'FR_A'},
            {label: 'RR LH A', key: 'RL_A'},
            {label: 'RR RH A', key: 'RR_A'}
          ])}
          
          \${getTable('2', [
            {label: 'RR LH C', key: 'RL_C'},
            {label: 'RR RH C', key: 'RR_C'},
            {label: 'RR LH D', key: 'RL_D'},
            {label: 'RR RH D', key: 'RR_D'}
          ])}
        </div>
      </div>
    \`;
}
`;

let code = fs.readFileSync('src/components/DynamicForms/FormTemplates.jsx', 'utf8');
code = code + "\n" + tpl;
fs.writeFileSync('src/components/DynamicForms/FormTemplates.jsx', code);
console.log('FormTemplates.jsx patched for 3001 Qty');
