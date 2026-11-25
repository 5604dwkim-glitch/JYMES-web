const fs = require('fs');
const filePath = 'src/components/DynamicForms/sections/DowntimeSectionRenderer.js';
let c = fs.readFileSync(filePath, 'utf8');
c = c.replace(/titleLabel\.innerHTML = '📝 <span class="sec-num"><\/span> 비가동 시간 & 원터치 특이사항 작성 \(최대 3건 입력 가능\)';/g, "titleLabel.innerHTML = '📝 <span class=\"sec-num\"></span> 작업 특이사항';");
fs.writeFileSync(filePath, c, 'utf8');
