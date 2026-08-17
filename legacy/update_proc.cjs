const fs = require('fs');
let c = fs.readFileSync('js/i18n.js', 'utf8');

const mapAdd = 
  '클립머신': 'proc_clip',
  '소재준비': 'proc_prep',
  '소재준비(A)': 'proc_prep_a',
  '소재준비(C)': 'proc_prep_c',
  '소재준비(D)': 'proc_prep_d',
  '조인트': 'proc_join',
  '후가공': 'proc_post',
  '검사포장': 'proc_insp',
;
c = c.replace(/export const STRING_TO_KEY_MAP = \{/, 'export const STRING_TO_KEY_MAP = {' + mapAdd);

// Regex matching the end of each block
c = c.replace(/(select_language:\s*['"][^'"]+['"])(?=\n\s*\})/, '\,\n    proc_clip: "클립머신",\n    proc_prep: "소재준비",\n    proc_prep_a: "소재준비(A)",\n    proc_prep_c: "소재준비(C)",\n    proc_prep_d: "소재준비(D)",\n    proc_join: "조인트",\n    proc_post: "후가공",\n    proc_insp: "검사포장"');

fs.writeFileSync('js/i18n.js', c);
console.log('Update Complete');
