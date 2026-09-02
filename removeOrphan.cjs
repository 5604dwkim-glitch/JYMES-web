const fs = require('fs');
let content = fs.readFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', 'utf8');
const lines = content.split('\n');

// Find and remove orphaned lines 499-512 (0-indexed: 498-511)
// Look for "const codeNum = getCurrentFormCode();" which is the orphaned code after the new function
let orphanStart = -1;
let orphanEnd = -1;
for (let i = 490; i < 530; i++) {
  const trimmed = (lines[i] || '').trim();
  if (trimmed === 'const codeNum = getCurrentFormCode();' && orphanStart === -1) {
    orphanStart = i;
  }
  if (orphanStart >= 0 && trimmed === '}' && orphanEnd === -1) {
    orphanEnd = i;
    break;
  }
}

console.log('Orphan range:', orphanStart, '-', orphanEnd);

if (orphanStart >= 0 && orphanEnd >= 0) {
  lines.splice(orphanStart - 1, orphanEnd - orphanStart + 2); // remove blank line before + block + closing }
  fs.writeFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', lines.join('\n'));
  console.log('Removed orphaned lines. Total lines now:', lines.length);
} else {
  console.log('Orphan not found. Checking lines 498-515:');
  for (let i = 497; i < 516; i++) {
    console.log(i+1, ':', JSON.stringify(lines[i]));
  }
}
