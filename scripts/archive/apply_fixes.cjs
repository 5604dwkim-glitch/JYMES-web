const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/components/DynamicForms/LeaderFormRenderer.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1 & 2. Fix double numbering
content = content.replace('<span class="sec-num"></span> 생산현황', '생산현황');
content = content.replace('<span class="sec-num"></span> 근태현황', '근태현황');
content = content.replace(/\/\/ 리더 폼 섹션 순번 부여[\s\S]*?leaderStep\+\+;\s*\}\);/, '');

// 3. Fix attendance default values and auto-calculation
const varBlockOld = `  let attTotal = 50;
  let attPresent = 48;
  let attAbsent = 2;
  let attAnnualLeave = 1;
  let attSickLeave = 0;
  let attHalfLeave = 1;`;

const varBlockNew = `  const workersList = store.getWorkers();
  let attTotal = (workersList && workersList.length > 0) ? workersList.length : 50;
  let attAnnualLeave = 0;
  let attSickLeave = 0;
  let attHalfLeave = 0;`;

content = content.replace(varBlockOld, varBlockNew);

const parseBlockOld = `    if (a.total !== undefined) {
      attTotal = a.total;
      attPresent = a.present;
      attAbsent = a.absent;
      attAnnualLeave = a.annualLeave !== undefined ? a.annualLeave : (a.absent || 0);
      attSickLeave = a.sickLeave || 0;
      attHalfLeave = a.halfLeave || 0;
    } else if (a.buildingB) {
      attTotal = (a.buildingB.total || 0) + (a.buildingC?.total || 0) + (a.buildingD?.total || 0);
      attPresent = (a.buildingB.present || 0) + (a.buildingC?.present || 0) + (a.buildingD?.present || 0);
      attAbsent = (a.buildingB.absent || 0) + (a.buildingC?.absent || 0) + (a.buildingD?.absent || 0);
      attAnnualLeave = attAbsent;
      attSickLeave = 0;
      attHalfLeave = 0;
    }`;

const parseBlockNew = `    if (a.total !== undefined) {
      attTotal = a.total;
      attAnnualLeave = a.annualLeave !== undefined ? a.annualLeave : 0;
      attSickLeave = a.sickLeave || 0;
      attHalfLeave = a.halfLeave || 0;
    } else if (a.buildingB) {
      attTotal = (a.buildingB.total || 0) + (a.buildingC?.total || 0) + (a.buildingD?.total || 0);
      attAnnualLeave = (a.buildingB.absent || 0) + (a.buildingC?.absent || 0) + (a.buildingD?.absent || 0);
      attSickLeave = 0;
      attHalfLeave = 0;
    }`;

content = content.replace(parseBlockOld, parseBlockNew);

const itemBlockOld = `  }

  const items =`;
const itemBlockNew = `  }

  let attAbsent = attAnnualLeave + attSickLeave + attHalfLeave;
  let attPresent = Math.max(0, attTotal - attAbsent);

  const items =`;
content = content.replace(itemBlockOld, itemBlockNew);


// 4. Add event listeners for dynamic calculation
const eventBlockOld = `  // leader form용 fixed 버튼 이벤트 바인딩`;
const eventBlockNew = `  const updateAttendance = () => {
    const totalEl = container.querySelector('#att_total');
    const presentEl = container.querySelector('#att_present');
    const absentEl = container.querySelector('#att_absent');
    const annualEl = container.querySelector('#att_annualLeave');
    const sickEl = container.querySelector('#att_sickLeave');
    const halfEl = container.querySelector('#att_halfLeave');
    
    if (totalEl && presentEl && absentEl && annualEl && sickEl && halfEl) {
      const t = Number(totalEl.value) || 0;
      const a = Number(annualEl.value) || 0;
      const s = Number(sickEl.value) || 0;
      const h = Number(halfEl.value) || 0;
      const abs = a + s + h;
      const pres = Math.max(0, t - abs);
      absentEl.value = abs;
      presentEl.value = pres;
    }
  };

  container.querySelector('#att_total')?.addEventListener('input', updateAttendance);
  container.querySelector('#att_annualLeave')?.addEventListener('input', updateAttendance);
  container.querySelector('#att_sickLeave')?.addEventListener('input', updateAttendance);
  container.querySelector('#att_halfLeave')?.addEventListener('input', updateAttendance);

  // leader form용 fixed 버튼 이벤트 바인딩`;

content = content.replace(eventBlockOld, eventBlockNew);

fs.writeFileSync(filePath, content);
console.log('Successfully applied all fixes safely!');
