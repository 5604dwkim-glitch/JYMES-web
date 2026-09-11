const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'src', 'components', 'DynamicForms', 'sections', 'Section5Renderer.js');
let content = fs.readFileSync(filePath, 'utf8');

const regex = /        \}\n        \} else if \(formCode === 4032\) \{/;

if (regex.test(content)) {
  content = content.replace(regex, `      } else if (formCode === 4032) {`);
  // And we need to add the closing brace back for `curProc === '조인트'` before `else if (curProc === '소재준비'...)`
  
  const endRegex = /          \}\n      \} else if \(curProc === '소재준비'/;
  if (endRegex.test(content)) {
    content = content.replace(endRegex, `          }\n        }\n      } else if (curProc === '소재준비'`);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed brace structure.');
  } else {
    // If endRegex fails, let's just do a manual replace of `} else if (curProc === '소재준비'`
    const backupEndRegex = /        \}\n      \} else if \(curProc === '소재준비'/;
    if (backupEndRegex.test(content)) {
      content = content.replace(backupEndRegex, `        }\n        }\n      } else if (curProc === '소재준비'`);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed brace structure using backup regex.');
    } else {
      console.log('Could not find the end brace to fix.');
      // print surrounding lines of '소재준비'
      let lines = content.split('\n');
      for(let i=0; i<lines.length; i++) {
        if(lines[i].includes('curProc.startsWith(\\'소재준비\\')')) {
          console.log('Context:');
          console.log(lines.slice(i-3, i+2).join('\\n'));
        }
      }
    }
  }
} else {
  console.log('Could not find the starting brace pattern.');
}
