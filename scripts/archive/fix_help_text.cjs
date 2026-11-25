const fs = require('fs');
let c = fs.readFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', 'utf8');
c = c.replace(/숫자를 입력하면 \(예: \d+\) 자동으로 '.*?' 형태로 변환됩니다\./g, "숫자를 입력하면 (예: 2609021833) 자동으로 '26년 09월 02일 18시 33분' 형태로 변환됩니다.");
fs.writeFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', c, 'utf8');
