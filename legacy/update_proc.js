const fs = require('fs');
let c = fs.readFileSync('js/i18n.js', 'utf8');

// Add to ko
c = c.replace(/    select_language: "?? 언어 선택"/, '    select_language: "?? 언어 선택",\n    proc_clip: "클립머신",\n    proc_prep: "소재준비",\n    proc_prep_a: "소재준비(A)",\n    proc_prep_c: "소재준비(C)",\n    proc_prep_d: "소재준비(D)",\n    proc_join: "조인트",\n    proc_post: "후가공",\n    proc_insp: "검사포장"');

// Add to en
c = c.replace(/    select_language: "?? Select Language"/, '    select_language: "?? Select Language",\n    proc_clip: "Clip Machine",\n    proc_prep: "Material Prep",\n    proc_prep_a: "Material Prep (A)",\n    proc_prep_c: "Material Prep (C)",\n    proc_prep_d: "Material Prep (D)",\n    proc_join: "Joint",\n    proc_post: "Post-Processing",\n    proc_insp: "Inspection/Packing"');

// Add to vi
c = c.replace(/    select_language: '?? Ch?n ngon ng?',/, '    select_language: "?? Ch?n ngon ng?",\n    proc_clip: "May k?p",\n    proc_prep: "Chu?n b? v?t li?u",\n    proc_prep_a: "Chu?n b? v?t li?u (A)",\n    proc_prep_c: "Chu?n b? v?t li?u (C)",\n    proc_prep_d: "Chu?n b? v?t li?u (D)",\n    proc_join: "N?i",\n    proc_post: "Gia cong sau",\n    proc_insp: "Ki?m tra/đong goi",');

// Add to th
c = c.replace(/    select_language: "?? ?????????"/, '    select_language: "?? ?????????",\n    proc_clip: "???????????",\n    proc_prep: "???????????",\n    proc_prep_a: "??????????? (A)",\n    proc_prep_c: "??????????? (C)",\n    proc_prep_d: "??????????? (D)",\n    proc_join: "??????",\n    proc_post: "????????????????",\n    proc_insp: "???????/??????????"');

// Add to tl
c = c.replace(/    select_language: "?? Pumili ng Wika"/, '    select_language: "?? Pumili ng Wika",\n    proc_clip: "Clip Machine",\n    proc_prep: "Paghanda ng Materyal",\n    proc_prep_a: "Paghanda ng Materyal (A)",\n    proc_prep_c: "Paghanda ng Materyal (C)",\n    proc_prep_d: "Paghanda ng Materyal (D)",\n    proc_join: "Joint",\n    proc_post: "Post-Processing",\n    proc_insp: "Inspeksyon/Pag-iimpake"');

// Add to STRING_TO_KEY_MAP
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

fs.writeFileSync('js/i18n.js', c);
console.log('Update Complete');
