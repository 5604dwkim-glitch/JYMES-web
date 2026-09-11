const fs = require('fs');
let lines = fs.readFileSync('src/components/DynamicForms/FormTemplates.jsx', 'utf8').split('\n');

// Find the first and second occurrences of 'export function getJointQty3002HTML'
let firstIdx = -1;
let secondIdx = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('export function getJointQty3002HTML')) {
        if (firstIdx === -1) {
            firstIdx = i;
        } else {
            secondIdx = i;
            break;
        }
    }
}

if (secondIdx !== -1) {
    // Find the end of the second function
    let endIdx = -1;
    for (let i = secondIdx + 1; i < lines.length; i++) {
        if (lines[i].trim() === '}') {
            endIdx = i;
            break;
        }
    }
    
    if (endIdx !== -1) {
        // Remove the duplicate lines
        lines.splice(secondIdx - 1, endIdx - secondIdx + 2); // remove the empty line before it too
        fs.writeFileSync('src/components/DynamicForms/FormTemplates.jsx', lines.join('\n'));
        console.log('Removed duplicate function starting at line ' + (secondIdx + 1));
    } else {
        console.log('Could not find end of second function');
    }
} else {
    console.log('Could not find second occurrence');
}
