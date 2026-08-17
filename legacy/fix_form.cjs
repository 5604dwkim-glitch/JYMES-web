const fs = require('fs');

let code = fs.readFileSync('js/components/reportForm.js', 'utf8');

// 1. Fix hardcoded '7. ' in vulcanization
code = code.replace(/♨️ 7\. 설비 가류온도 & 가류시간 입력/g, '♨️ <span class="sec-num"></span> 설비 가류온도 & 가류시간 입력');

// 2. Unify label colors for section titles
// We want to replace color: var(--accent-cyan), color: var(--accent-emerald), color: var(--accent-amber)
// inside the labels that are section headers.
code = code.replace(/color:\s*var\(--accent-(cyan|emerald|amber|blue)\)/g, 'color: var(--accent-blue)');

// 3. Update updateSectionNumbers to be more robust
const oldUpdateFunc = `  function updateSectionNumbers() {
    let step = 1;
    const allCards = container.querySelectorAll('#mobileWorkReportForm > .card, #mobileWorkReportForm #qtySection .card, #mobileWorkReportForm #section5DynamicContainer .card');
    allCards.forEach(card => {
      if (card.style.display !== 'none') {
        const secNumSpan = card.querySelector('.sec-num');
        if (secNumSpan) {
          secNumSpan.textContent = \`\${step}.\`;
          step++;
        }
      }
    });
  }`;

const newUpdateFunc = `  function updateSectionNumbers() {
    let step = 1;
    const allSecNums = container.querySelectorAll('#mobileWorkReportForm .sec-num');
    allSecNums.forEach(span => {
      // Check if the span is inside a card that is not hidden
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
        span.textContent = \`\${step}.\`;
        step++;
      }
    });
  }`;

code = code.replace(oldUpdateFunc, newUpdateFunc);

// Just in case offsetParent doesn't work well in all flex contexts in this specific DOM, walking up to check display === 'none' is bulletproof since the code hides things with element.style.display = 'none'.

// Let's also make sure we didn't miss any other hardcoded numbers.
// Looking at test3.cjs output, everything else already has <span class="sec-num"></span>.
// e.g. 🧪 <span class="sec-num"></span> 소재 LOT 번호 입력

fs.writeFileSync('js/components/reportForm.js', code, 'utf8');
console.log('Successfully updated reportForm.js');
