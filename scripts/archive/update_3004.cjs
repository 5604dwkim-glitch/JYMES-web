const fs = require('fs');
let content = fs.readFileSync('src/components/DynamicForms/FormTemplates.jsx', 'utf8');

// The worker logic needs to be updated to filter by '후가공'
const oldWorkerLogic = `  const workers = store.getWorkers() || [];
  
  const workerOptions = workers.map(w => \`<option value="\${w.name}">\${w.name}</option>\`).join('');`;

const newWorkerLogic = `  const workers = store.getWorkers() || [];
  
  // Filter workers to only show those whose process includes '후가공'
  const postWorkers = workers.filter(w => w.process && w.process.includes('후가공'));
  const workerOptions = postWorkers.map(w => \`<option value="\${w.name}">\${w.name}</option>\`).join('');`;

content = content.replace(oldWorkerLogic, newWorkerLogic);

// The thead needs to be updated to add FRT LH, FRT RH, RR LH, RR RH
const oldThead = `          <thead>
            <tr style="background: #fff; font-weight: 700;">
              <th colspan="2" style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000;">
                작업자
              </th>
              <th style="border: 1px solid #000; padding: 4px; font-size: 12px; color: #000;">\${workerSelect('w1')}</th>
              <th style="border: 1px solid #000; padding: 4px; font-size: 12px; color: #000;">\${workerSelect('w2')}</th>
              <th style="border: 1px solid #000; padding: 4px; font-size: 12px; color: #000;">\${workerSelect('w3')}</th>
              <th style="border: 1px solid #000; padding: 4px; font-size: 12px; color: #000;">\${workerSelect('w4')}</th>
            </tr>
          </thead>`;

const newThead = `          <thead>
            <tr style="background: #fff; font-weight: 700;">
              <th colspan="2" rowspan="2" style="border: 1px solid #000; padding: 8px 4px; font-size: 12px; color: #000; vertical-align: middle;">
                작업자
              </th>
              <th style="border: 1px solid #000; padding: 4px; font-size: 12px; color: #000; text-align: center; background: #f8fafc;">FRT LH</th>
              <th style="border: 1px solid #000; padding: 4px; font-size: 12px; color: #000; text-align: center; background: #f8fafc;">FRT RH</th>
              <th style="border: 1px solid #000; padding: 4px; font-size: 12px; color: #000; text-align: center; background: #f8fafc;">RR LH</th>
              <th style="border: 1px solid #000; padding: 4px; font-size: 12px; color: #000; text-align: center; background: #f8fafc;">RR RH</th>
            </tr>
            <tr style="background: #fff; font-weight: 700;">
              <th style="border: 1px solid #000; padding: 4px; font-size: 12px; color: #000;">\${workerSelect('w1')}</th>
              <th style="border: 1px solid #000; padding: 4px; font-size: 12px; color: #000;">\${workerSelect('w2')}</th>
              <th style="border: 1px solid #000; padding: 4px; font-size: 12px; color: #000;">\${workerSelect('w3')}</th>
              <th style="border: 1px solid #000; padding: 4px; font-size: 12px; color: #000;">\${workerSelect('w4')}</th>
            </tr>
          </thead>`;

content = content.replace(oldThead, newThead);

fs.writeFileSync('src/components/DynamicForms/FormTemplates.jsx', content, 'utf8');
console.log('FormTemplates.jsx updated for 3004');
