const fs = require('fs');

let file1 = 'src/services/statsAggregator.js';
let code1 = fs.readFileSync(file1, 'utf8');
code1 = code1.replace(
  /const car = report\.carModel \|\| '기\?';\s*const item = report\.itemCode \|\| report\.itemName \|\| '기\?';\s*const key = `\$\{car\}::\$\{item\}`\.replace\(\/\[\.\\\/\[\]\]\/g, '_'\);/,
  "const car = report.carModel || '기타';\n      const item = report.itemCode || report.itemName || '기타';\n      const proc = report.processName || '기타';\n      const key = `${car}::${item}::${proc}`.replace(/[\\.\\/\\[\\]]/g, '_');"
);
// In case the encoding is bad or original is broken:
code1 = code1.replace(
  /const key = `\$\{car\}::\$\{item\}`\.replace\(\/\[\\.\\\/\\\[\\\]\]\/g, '_'\);/g,
  "const proc = report.processName || '기타';\n      const key = `${car}::${item}::${proc}`.replace(/[\\.\\/\\[\\]]/g, '_');"
);

fs.writeFileSync(file1, code1);

let file2 = 'scripts/archive/migrate_stats.js';
let code2 = fs.readFileSync(file2, 'utf8');
code2 = code2.replace(
  /const comboKey = `\$\{car\}::\$\{item\}`\.replace\(\/\[\\.\\\/\\\[\\\]\]\/g, '_'\);/g,
  "const proc = r.processName || '기타';\n    const comboKey = `${car}::${item}::${proc}`.replace(/[\\.\\/\\[\\]]/g, '_');"
);
code2 = code2.replace(/await setDoc\(statsRef, agg, \{ merge: true \}\);/g, "await setDoc(statsRef, agg);");
fs.writeFileSync(file2, code2);
console.log("Patched stats aggregator and migration script");
