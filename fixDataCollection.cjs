const fs = require('fs');

let t = fs.readFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', 'utf8');

const matInjection = `
        '초물': autoFormatDateTimeString(container.querySelector('#lotNo_초물')?.value || ''),
        '중물': autoFormatDateTimeString(container.querySelector('#lotNo_중물')?.value || ''),
        '종물': autoFormatDateTimeString(container.querySelector('#lotNo_종물')?.value || ''),
        'LH_초물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_초물')?.value || ''),
        'LH_중물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_중물')?.value || ''),
        'LH_종물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_종물')?.value || ''),
        'RH_초물': autoFormatDateTimeString(container.querySelector('#lotNo_RH_초물')?.value || ''),
        'RH_중물': autoFormatDateTimeString(container.querySelector('#lotNo_RH_중물')?.value || ''),
        'RH_종물': autoFormatDateTimeString(container.querySelector('#lotNo_RH_종물')?.value || ''),
`;

if (!t.includes(`'초물': autoFormatDateTimeString(container.querySelector('#lotNo_초물')`)) {
  t = t.replace('const materialLots = {', 'const materialLots = {\n' + matInjection);
}

const dimInjection = `
        act_초: container.querySelector('#dim_act_초')?.value || '',
        act_중: container.querySelector('#dim_act_중')?.value || '',
        act_종: container.querySelector('#dim_act_종')?.value || '',
`;

if (!t.includes(`act_초: container.querySelector('#dim_act_초')`)) {
  t = t.replace('const dimData = {', 'const dimData = {\n' + dimInjection);
}

fs.writeFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', t);
console.log('Fixed LegacyFormWrapper.jsx');


let s5 = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');
if (s5.includes('const d = existingData?.dimensionCheck || {};')) {
  s5 = s5.replace('const d = existingData?.dimensionCheck || {};', 'const d = existingData?.dimData || {};');
  fs.writeFileSync('src/components/DynamicForms/sections/Section5Renderer.js', s5);
  console.log('Fixed Section5Renderer.js');
}

