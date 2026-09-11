const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'src', 'components', 'DynamicForms', 'sections', 'Section5Renderer.js');
let content = fs.readFileSync(filePath, 'utf8');
let lines = content.split('\\n');

// 1. Rename 'formCode === 3012' to 'formCode === 3012 || formCode === 4002' for the HTML block
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('} else if (formCode === 3012 || formCode === 4002) {')) {
    break; // Already renamed
  }
  if (lines[i].includes('} else if (formCode === 3012) {') && lines[i+1] && lines[i+1].includes('existingData.vulcTable')) {
    lines[i] = lines[i].replace('formCode === 3012', 'formCode === 3012 || formCode === 4002');
    console.log('Renamed 3012 to 3012 || 4002 for HTML block at line', i + 1);
    break;
  }
}

// 2. Find and delete the huge 'formCode === 4002' HTML block
let startIdx = -1;
let endIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('} else if (formCode === 4002) {') && lines[i+1] && lines[i+1].includes('vulcTableHTML = ')) {
    startIdx = i;
    break;
  }
}

if (startIdx !== -1) {
  for (let i = startIdx + 1; i < lines.length; i++) {
    if (lines[i].includes('} else if (formCode === 1011) {')) {
      endIdx = i;
      break;
    }
  }
}

if (startIdx !== -1 && endIdx !== -1) {
  lines.splice(startIdx, endIdx - startIdx);
  console.log(`Deleted HTML block for 4002 from line ${startIdx + 1} to ${endIdx}`);
} else {
  console.log('Could not find HTML block for 4002 to delete.');
}

// 3. Rename event binding for 3012 and delete 4002's binding
// First find 3012 binding
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('} else if (formCode === 3012 || formCode === 4002) {')) {
    break; // Already renamed
  }
  if (lines[i].includes('} else if (formCode === 3012) {') && lines[i+1] && lines[i+1].includes('const phases =')) {
    lines[i] = lines[i].replace('formCode === 3012', 'formCode === 3012 || formCode === 4002');
    console.log('Renamed 3012 to 3012 || 4002 for Event Binding at line', i + 1);
    break;
  }
}

// Now find and delete 4002 binding
let eventStartIdx = -1;
let eventEndIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('else if (formCode === 4002) {') && lines[i+1] && lines[i+1].includes('const phases =')) {
    eventStartIdx = i;
    break;
  }
}

if (eventStartIdx !== -1) {
  for (let i = eventStartIdx + 1; i < lines.length; i++) {
    if (lines[i].includes('} else if (formCode === 3012 || formCode === 4002) {')) {
      eventEndIdx = i;
      break;
    }
  }
}

if (eventStartIdx !== -1 && eventEndIdx !== -1) {
  lines.splice(eventStartIdx, eventEndIdx - eventStartIdx);
  console.log(`Deleted event binding for 4002 from line ${eventStartIdx + 1} to ${eventEndIdx}`);
} else {
  console.log('Could not find Event binding for 4002 to delete.');
}

fs.writeFileSync(filePath, lines.join('\\n'), 'utf8');
console.log('Done!');
