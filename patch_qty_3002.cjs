const fs = require('fs');

// 1. Update FormTemplates.jsx
let tplCode = fs.readFileSync('src/components/DynamicForms/FormTemplates.jsx', 'utf8');

const tplInjection = `
  export function getJointQty3002HTML(ed, container) {
    const q = ed && ed.jointQtyTable ? ed.jointQtyTable : {};
    const cols = [
      { id: 'frt_lh', label: 'FRT LH' },
      { id: 'frt_rh', label: 'FRT RH' },
      { id: 'rr_lh', label: 'RR LH' },
      { id: 'rr_rh', label: 'RR RH' }
    ];

    return \\\`
      <div class="card" style="padding: 16px; margin-bottom: 16px;">
        <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 8px; display: block;">
          📊 <span class="sec-num"></span> 생산실적 (Production Results)
        </label>

        <input type="hidden" id="targetQty" value="\\\${ed ? ed.targetQty : '0'}" />
        <input type="hidden" id="actualQty" value="\\\${ed ? ed.actualQty : '0'}" />
        <input type="hidden" id="defectQty" value="\\\${ed ? ed.defectQty : '0'}" />

        <div style="overflow-x: auto;">
          <table id="jointQtyTable" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700; color: #000;">
                <th colspan="2" style="border: 1px solid #000; padding: 6px;">구 분(Division)</th>
                \\\${cols.map(c => \\\`<th style="border: 1px solid #000; padding: 6px; width: 20%;">\\\${c.label}</th>\\\`).join('')}
              </tr>
            </thead>
            <tbody>
              <!-- 1. 생산량 (Q,TY) -->
              <tr>
                <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  생산량(Q,TY)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">계획(P)</td>
                \\\${cols.map(c => \\\`
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="number" id="jqty_plan_\\\${c.id}" class="form-control jqty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700;" value="\\\${q['plan_' + c.id] ?? ''}" placeholder="0" />
                  </td>
                \\\`).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">실적(O)</td>
                \\\${cols.map(c => \\\`
                  <td style="border: 1px solid #000; padding: 2px;">
                    <input type="number" id="jqty_act_\\\${c.id}" class="form-control jqty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px; font-weight: 700; color: var(--accent-blue);" value="\\\${q['act_' + c.id] ?? ''}" placeholder="0" />
                  </td>
                \\\`).join('')}
              </tr>

              <!-- 2. 공정간불량 (Process Badness) -->
              <tr>
                <td rowspan="8" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">
                  공정간불량<br>(Process<br>Badness)
                </td>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">떨어짐(Split)</td>
                \\\${cols.map(c => \\\`<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="jdef_split_\\\${c.id}" class="form-control jqty-calc-input" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px;" value="\\\${q['split_' + c.id] ?? ''}" placeholder="0" /></td>\\\`).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">밀림(Push)</td>
                \\\${cols.map(c => \\\`<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="jdef_push_\\\${c.id}" class="form-control jqty-calc-input" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px;" value="\\\${q['push_' + c.id] ?? ''}" placeholder="0" /></td>\\\`).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">양부족(lack)</td>
                \\\${cols.map(c => \\\`<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="jdef_lack_\\\${c.id}" class="form-control jqty-calc-input" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px;" value="\\\${q['lack_' + c.id] ?? ''}" placeholder="0" /></td>\\\`).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">넘침(overflowing)</td>
                \\\${cols.map(c => \\\`<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="jdef_over_\\\${c.id}" class="form-control jqty-calc-input" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px;" value="\\\${q['over_' + c.id] ?? ''}" placeholder="0" /></td>\\\`).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">기포 (Air bubbles)</td>
                \\\${cols.map(c => \\\`<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="jdef_bubble_\\\${c.id}" class="form-control jqty-calc-input" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px;" value="\\\${q['bubble_' + c.id] ?? ''}" placeholder="0" /></td>\\\`).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">찌꺼기(scrap)</td>
                \\\${cols.map(c => \\\`<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="jdef_scrap_\\\${c.id}" class="form-control jqty-calc-input" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px;" value="\\\${q['scrap_' + c.id] ?? ''}" placeholder="0" /></td>\\\`).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">삽입불량(insert)</td>
                \\\${cols.map(c => \\\`<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="jdef_insert_\\\${c.id}" class="form-control jqty-calc-input" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px;" value="\\\${q['insert_' + c.id] ?? ''}" placeholder="0" /></td>\\\`).join('')}
              </tr>
              <tr>
                <td style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">기타(oth)</td>
                \\\${cols.map(c => \\\`<td style="border: 1px solid #000; padding: 2px;"><input type="number" id="jdef_oth_\\\${c.id}" class="form-control jqty-calc-input" style="width:100%; border:none; text-align:center; font-size:11px; padding:4px;" value="\\\${q['oth_' + c.id] ?? ''}" placeholder="0" /></td>\\\`).join('')}
              </tr>

              <!-- 3. 불량합계 (Total) -->
              <tr style="background: #fffde7; font-weight: 700;">
                <td colspan="2" style="border: 1px solid #000; padding: 8px; color: var(--accent-rose);">불량합계(Total)</td>
                \\\${cols.map(c => \\\`<td id="jdef_sum_\\\${c.id}" style="border: 1px solid #000; padding: 8px; color: var(--accent-rose);">0</td>\\\`).join('')}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    \\\`;
  }
`;
tplCode = tplCode.replace("export function getJointQtyHTML(ed, container) {", tplInjection + "\n  export function getJointQtyHTML(ed, container) {");
fs.writeFileSync('src/components/DynamicForms/FormTemplates.jsx', tplCode);

// 2. Update QtySectionRenderer.js
let qtyCode = fs.readFileSync('src/components/DynamicForms/sections/QtySectionRenderer.js', 'utf8');

// Modify calcJointQtySummary to check formCode
qtyCode = qtyCode.replace("const cols = ['frt_p', 'frt_q', 'rr_r', 'rr_s_lh', 'rr_s_rh'];", "const cols = formCode === 3002 ? ['frt_lh', 'frt_rh', 'rr_lh', 'rr_rh'] : ['frt_p', 'frt_q', 'rr_r', 'rr_s_lh', 'rr_s_rh'];");

// Route formCode 3002 to Templates.getJointQty3002HTML
qtyCode = qtyCode.replace("if (formCode === 1032) {", "if (formCode === 3002) {\n            qtySection.innerHTML = Templates.getJointQty3002HTML(existingData, container);\n          } else if (formCode === 1032) {");

fs.writeFileSync('src/components/DynamicForms/sections/QtySectionRenderer.js', qtyCode);

console.log('Successfully patched 3002 production results!');
