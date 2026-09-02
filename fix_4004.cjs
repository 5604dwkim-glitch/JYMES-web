const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');

// For 4004
const blockStart = 'if (formCode === 4004) {';
const blockEnd = 'return;';

let startIdx = code.indexOf(blockStart);
let endIdx = code.indexOf(blockEnd, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    let block = code.substring(startIdx, endIdx);
    
    // FRT
    block = block.replace(`value="\${d['cut_FRT_초'] || ''}" />`, `value="\${d['cut_FRT_초'] || '326'}" />`);
    block = block.replace(`value="\${d['cut_FRT_중'] || ''}" />`, `value="\${d['cut_FRT_중'] || '326'}" />`);
    block = block.replace(`value="\${d['cut_FRT_종'] || ''}" />`, `value="\${d['cut_FRT_종'] || '326'}" />`);
    
    // RR
    block = block.replace(`value="\${d['cut_RR_초']  || ''}"  readonly />`, `value="\${d['cut_RR_초']  || '326'}"  readonly />`);
    block = block.replace(`value="\${d['cut_RR_중']  || ''}"  readonly />`, `value="\${d['cut_RR_중']  || '326'}"  readonly />`);
    block = block.replace(`value="\${d['cut_RR_종']  || ''}"  readonly />`, `value="\${d['cut_RR_종']  || '326'}"  readonly />`);
    
    code = code.substring(0, startIdx) + block + code.substring(endIdx);
    fs.writeFileSync('src/components/DynamicForms/sections/Section5Renderer.js', code);
    console.log('Fixed 4004 successfully!');
} else {
    console.log('Could not find 4004 block');
}
