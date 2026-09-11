const fs = require('fs');

// 1. Modify FormTemplates.jsx
let templates = fs.readFileSync('src/components/DynamicForms/FormTemplates.jsx', 'utf8');

const newTemplate = `
  export function getQty1021HTML(ed, container) {
    const q = ed && ed.qtyTable ? ed.qtyTable : {};
    const processValue = container ? container.querySelector('#processValue') : null;
    const curProc = processValue ? processValue.value : '';
    const sectionTitleLabel = '📊 <span class="sec-num"></span> 생산실적 (Production Results)';

    return \`
      <div class="card" style="padding: 16px; margin-bottom: 16px;">
        <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 8px; display: block;">
          \${sectionTitleLabel}
        </label>

        <input type="hidden" id="targetQty" value="\${ed ? ed.targetQty : '0'}" />
        <input type="hidden" id="actualQty" value="\${ed ? ed.actualQty : '0'}" />
        <input type="hidden" id="defectQty" value="\${ed ? ed.defectQty : '0'}" />

        <div style="overflow-x: auto;">
          <table id="jg1QtyTable" style="width: 100%; border-collapse: collapse; border: 2px solid #000; text-align: center; font-size: 11px; background: #fff; font-family: 'Noto Sans KR', sans-serif;">
            <thead>
              <tr style="background: #fffde7; font-weight: 700;">
                <th colspan="2" style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 30%;">
                  구 분(Division)
                </th>
                <th style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 35%;">LH</th>
                <th style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; width: 35%;">RH</th>
              </tr>
            </thead>
            <tbody>
              <!-- 1. 생산량(Q,TY) -->
              <tr>
                <td rowspan="2" style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; vertical-align: middle; width: 16%;">
                  생산량(Q,TY)
                </td>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; width: 14%;">
                  계획
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="qty_plan_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="\${q.plan_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="qty_plan_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="\${q.plan_FR ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">
                  실적
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="qty_act_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="\${q.act_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="qty_act_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="\${q.act_FR ?? ''}" placeholder="0" /></td>
              </tr>

              <!-- 2. 압출소재불량(Extrusion Badness) -->
              <tr>
                <td rowspan="4" style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; vertical-align: middle;">
                  압출소재불량<br>(Extrusion Badness)
                </td>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">
                  스코치(Scortch)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_scorch_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="\${q.ext_scorch_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_scorch_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="\${q.ext_scorch_FR ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">
                  외면흠 (Scratch)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_scratch_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="\${q.ext_scratch_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_scratch_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="\${q.ext_scratch_FR ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">
                  후로킹 (Flock,g)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_flock_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="\${q.ext_flock_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_flock_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="\${q.ext_flock_FR ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">
                  오염 (Contamination)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_contam_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="\${q.ext_contam_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_ext_contam_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="\${q.ext_contam_FR ?? ''}" placeholder="0" /></td>
              </tr>

              <!-- 3. 공정간불량(Process Badness) -->
              <tr>
                <td rowspan="3" style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000; vertical-align: middle;">
                  공정간불량<br>(Process Badness)
                </td>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">
                  길이 (Length)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_len_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="\${q.proc_len_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_len_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="\${q.proc_len_FR ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">
                  컷팅 (Cutting)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_cut_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="\${q.proc_cut_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_cut_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="\${q.proc_cut_FR ?? ''}" placeholder="0" /></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; background: #fffde7; font-weight: 700; color: #000;">
                  기타 (The others)
                </td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_oth_FL" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="\${q.proc_oth_FL ?? ''}" placeholder="0" /></td>
                <td style="border: 1px solid #000; padding: 2px;"><input type="number" id="def_proc_oth_FR" class="form-control qty-calc-input" style="width: 100%; border: none; text-align: center; font-size: 11px; padding: 4px;" value="\${q.proc_oth_FR ?? ''}" placeholder="0" /></td>
              </tr>

              <!-- 4. 불량합계(Total) -->
              <tr style="background: #fffde7; font-weight: 700;">
                <td colspan="2" style="border: 1px solid #000; padding: 8px; color: var(--accent-rose);">
                  불량합계(Total)
                </td>
                <td id="def_sum_FL" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>
                <td id="def_sum_FR" style="border: 1px solid #000; padding: 6px; color: var(--accent-rose);">0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    \`;
  }
`;

if (!templates.includes('getQty1021HTML')) {
  templates = templates.replace('export function getStandardQtyHTML', newTemplate + '\nexport function getStandardQtyHTML');
  fs.writeFileSync('src/components/DynamicForms/FormTemplates.jsx', templates);
  console.log('Injected getQty1021HTML');
}


// 2. Modify QtySectionRenderer.js
let renderer = fs.readFileSync('src/components/DynamicForms/sections/QtySectionRenderer.js', 'utf8');

if (!renderer.includes('case 1021:')) {
  const newSwitchCase = `
      case 1021:
        qtySection.innerHTML = Templates.getQty1021HTML(existingData, container);
        qtySection.addEventListener('input', calcJg1QtySummary);
        calcJg1QtySummary();
        break;
`;
  renderer = renderer.replace('default:', newSwitchCase + '      default:');
  fs.writeFileSync('src/components/DynamicForms/sections/QtySectionRenderer.js', renderer);
  console.log('Injected case 1021 into QtySectionRenderer');
}
