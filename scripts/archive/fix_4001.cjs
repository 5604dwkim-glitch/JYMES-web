const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');

// For 4001
const bad1 = `value="\${d['cut_FRT_초']  || ''}"  readonly />`;
const bad2 = `value="\${d['cut_FRT_중']  || ''}"  readonly />`;
const bad3 = `value="\${d['cut_FRT_종']  || ''}"  readonly />`;

const good1 = `value="\${d['cut_FRT_초']  || '326'}"  readonly />`;
const good2 = `value="\${d['cut_FRT_중']  || '326'}"  readonly />`;
const good3 = `value="\${d['cut_FRT_종']  || '326'}"  readonly />`;

// Because these exact strings might appear in 4004 as well, we only replace the ones in the 4001 block.
// 4001 block starts at 'if (formCode === 4001) {' and ends at 'return;'
const blockStart = 'if (formCode === 4001) {';
const blockEnd = '} else if (formCode === 4004) {';

let startIdx = code.indexOf(blockStart);
let endIdx = code.indexOf(blockEnd, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    let block = code.substring(startIdx, endIdx);
    
    block = block.replace(bad1, good1);
    block = block.replace(bad2, good2);
    block = block.replace(bad3, good3);
    
    code = code.substring(0, startIdx) + block + code.substring(endIdx);
    fs.writeFileSync('src/components/DynamicForms/sections/Section5Renderer.js', code);
    console.log('Fixed 4001 successfully!');
} else {
    console.log('Could not find 4001 block');
}
