const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', '..', 'src', 'components', 'DynamicForms', 'sections', 'Section5Renderer.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the bad transition from 4002 to 4032
content = content.replace("        });\n      }\n        } else if (formCode === 4032) {", 
                          "        });\n      } else if (formCode === 4032) {");

// And add the closing brace for the whole 조인트 block before 소재준비
content = content.replace("          });\n\n    } else if (curProc === '소재준비'", 
                          "          });\n        }\n    } else if (curProc === '소재준비'");

content = content.replace("          });\n    } else if (curProc === '소재준비'", 
                          "          });\n        }\n    } else if (curProc === '소재준비'");

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed exactly!');
