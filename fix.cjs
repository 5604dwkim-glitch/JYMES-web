const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicForms/FormTemplates.jsx', 'utf8');

let start = code.indexOf('export function getJointQty3002HTML');
let end = code.indexOf('export function getJointQtyHTML');
let block = code.substring(start, end);

block = block.replace(/\\\`/g, '`').replace(/\\\$/g, '$');

code = code.substring(0, start) + block + code.substring(end);
fs.writeFileSync('src/components/DynamicForms/FormTemplates.jsx', code);
console.log('Fixed FormTemplates.jsx');
