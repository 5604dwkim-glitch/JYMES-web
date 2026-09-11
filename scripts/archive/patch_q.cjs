const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');

const targetQ = `<td style="border: 1px solid #000; font-weight: 700; padding: 4px;">(Q부)<br>73 ± 1</td>
          <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">(Q부)<br>73 ± 1</td>`;

const replQ = `<td colspan="2" style="border: 1px solid #000; font-weight: 700; padding: 4px;">(Q부)<br>73 ± 1</td>`;

// Replace globally (there should be 3 occurrences)
code = code.split(targetQ).join(replQ);

fs.writeFileSync('src/components/DynamicForms/sections/Section5Renderer.js', code);
console.log('Successfully merged Q parts in dim check tables!');
