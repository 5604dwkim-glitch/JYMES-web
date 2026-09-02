const fs = require('fs');

const injection = `
  function calc3001QtySummary() {
    const table = container.querySelector('#form3001QtyTable');
    if (!table) return;

    const positions = ['FL_A', 'FR_A', 'RL_A', 'RR_A', 'RL_C', 'RR_C', 'RL_D', 'RR_D'];
    let totalPlan = 0;
    let totalAct = 0;
    let overallDefect = 0;

    positions.forEach(pos => {
      const plan = Number(table.querySelector(\`#qtyd_plan_\${pos}\`)?.value) || 0;
      const act = Number(table.querySelector(\`#qtyd_act_\${pos}\`)?.value) || 0;
      totalPlan += plan;
      totalAct += act;

      const defs = [
        Number(table.querySelector(\`#qtyd_ext_scorch_\${pos}\`)?.value) || 0,
        Number(table.querySelector(\`#qtyd_ext_scratch_\${pos}\`)?.value) || 0,
        Number(table.querySelector(\`#qtyd_ext_flock_\${pos}\`)?.value) || 0,
        Number(table.querySelector(\`#qtyd_ext_contam_\${pos}\`)?.value) || 0,
        Number(table.querySelector(\`#qtyd_proc_len_\${pos}\`)?.value) || 0,
        Number(table.querySelector(\`#qtyd_proc_cut_\${pos}\`)?.value) || 0,
        Number(table.querySelector(\`#qtyd_proc_oth_\${pos}\`)?.value) || 0
      ];

      const posDefectSum = defs.reduce((a, b) => a + b, 0);
      overallDefect += posDefectSum;

      const sumElem = table.querySelector(\`#qtyd_def_sum_\${pos}\`);
      if (sumElem) sumElem.textContent = posDefectSum;
    });

    const targetQtyInput = container.querySelector('#targetQty');
    const actualQtyInput = container.querySelector('#actualQty');
    const defectQtyInput = container.querySelector('#defectQty');

    if (targetQtyInput) targetQtyInput.value = totalPlan;
    if (actualQtyInput) actualQtyInput.value = totalAct;
    if (defectQtyInput) defectQtyInput.value = overallDefect;
  }
`;

let code = fs.readFileSync('src/components/DynamicForms/sections/QtySectionRenderer.js', 'utf8');
code = code.replace("function calcJoint1002QtySummary() {", injection + "\n  function calcJoint1002QtySummary() {");

const switchInjection = `
      case 3001:
        qtySection.innerHTML = Templates.getForm3001QtyHTML(existingData, container);
        qtySection.addEventListener('input', calc3001QtySummary);
        calc3001QtySummary();
        break;
`;

code = code.replace("      case 4011:", switchInjection + "\n      case 4011:");

fs.writeFileSync('src/components/DynamicForms/sections/QtySectionRenderer.js', code);
console.log('QtySectionRenderer.js patched for 3001 Qty');
