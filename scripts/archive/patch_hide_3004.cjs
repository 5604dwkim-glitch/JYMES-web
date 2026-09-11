const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');

// The regex matches:
// 1. <tr>
// 2. whitespace
// 3. <td rowspan="4"...>단컷팅</td>
// 4. followed by the rest of the 1st tr
// 5. followed by 3 more <tr>...</tr> blocks
const regex = /(<tr>\s*<td rowspan="4"[^>]*>단컷팅<\/td>[\s\S]*?<\/tr>\s*<tr>[\s\S]*?<\/tr>\s*<tr>[\s\S]*?<\/tr>\s*<tr>[\s\S]*?<\/tr>)/g;

let matches = code.match(regex);
console.log('Found ' + (matches ? matches.length : 0) + ' matches');

if (matches && matches.length === 6) {
  code = code.replace(regex, '\\${formCode === 3004 ? "" : `$1`}');
  fs.writeFileSync('src/components/DynamicForms/sections/Section5Renderer.js', code);
  console.log('Successfully wrapped all 6 단컷팅 blocks!');
} else {
  console.log('Unexpected number of matches. Aborting.');
}
