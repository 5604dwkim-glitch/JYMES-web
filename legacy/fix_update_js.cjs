const fs = require('fs');
let code = fs.readFileSync('js/components/reportForm.js', 'utf8');

const newFunc = `  function updateSectionNumbers() {
    let step = 1;
    const allSecNums = container.querySelectorAll('#mobileWorkReportForm .sec-num');
    allSecNums.forEach(span => {
      let isVisible = true;
      let curr = span;
      while (curr && curr !== container) {
        if (curr.style && curr.style.display === 'none') {
          isVisible = false;
          break;
        }
        curr = curr.parentElement;
      }
      
      if (isVisible) {
        span.textContent = step + '.';
        step++;
      } else {
        span.textContent = '';
      }
    });
  }`;

code = code.replace(/function updateSectionNumbers\(\) \{[\s\S]*?step\+\+;\s*\}\s*\}\);\s*\}/, newFunc);
fs.writeFileSync('js/components/reportForm.js', code);
console.log('Fixed updateSectionNumbers in reportForm.js');
