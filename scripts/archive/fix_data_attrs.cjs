const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, 'src/components/DynamicForms/FormTemplates.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// For Section A "전장길이", the spec is 779
// For Section A "끝단 클립", LH1 is 121, LH2 is 28, RH1 is 28, RH2 is 121

content = content.replace(/id="dtc_len_(LH|RH)_(초|중|종)"/g, 'id="dtc_len_$1_$2" data-wheel-parsed-spec="779"');
content = content.replace(/id="dtc_clip_LH1_(초|중|종)"/g, 'id="dtc_clip_LH1_$1" data-wheel-parsed-spec="121"');
content = content.replace(/id="dtc_clip_LH2_(초|중|종)"/g, 'id="dtc_clip_LH2_$1" data-wheel-parsed-spec="28"');
content = content.replace(/id="dtc_clip_RH1_(초|중|종)"/g, 'id="dtc_clip_RH1_$1" data-wheel-parsed-spec="28"');
content = content.replace(/id="dtc_clip_RH2_(초|중|종)"/g, 'id="dtc_clip_RH2_$1" data-wheel-parsed-spec="121"');

// For Section B "전장길이", the spec is 2699
content = content.replace(/id="dtcb_len_(LH3|LH4|RH2|RH4)_(초|중|종)"/g, 'id="dtcb_len_$1_$2" data-wheel-parsed-spec="2699"');

// For Section B "끝단 클립", the spec is 28 for ALL (좌측 28, 우측 28)
content = content.replace(/id="dtcb_clip_(LH3|LH4|RH2|RH4)_(초좌|초우|중좌|중우|종좌|종우)"/g, 'id="dtcb_clip_$1_$2" data-wheel-parsed-spec="28"');

fs.writeFileSync(filePath, content);
console.log('Added data-wheel-parsed-spec!');
