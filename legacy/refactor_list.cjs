const fs = require('fs');

let code = fs.readFileSync('js/components/reportList.js', 'utf8');

// 1. Add import renderReportForm
if (!code.includes('import { renderReportForm }')) {
  code = code.replace(/import\s*\{[^}]*\}\s*from\s*'\.\.\/store\.js';/, "$&\nimport { renderReportForm } from './reportForm.js';");
}

// 2. We need to replace the definition of the 4 legacy card functions and their calls.
// First, find where openDetailModal starts.
const openModalStart = code.indexOf('function openDetailModal(id) {');

// The legacy rendering functions start around:
// const renderDimensionsCard = (num) => { ... }
// and go all the way down to:
// const cardNotes = `

const legacyStartRegex = /\s*\/\/\s*▶ Step 4\. 치수확인 카드 생성[\s\S]*?(?=\s*const cardNotes =)/;

// Let's check if the regex matches.
const match = code.match(legacyStartRegex);
if (!match) {
  console.log("Could not find the legacy rendering block");
  process.exit(1);
}

const replacementCode = `
      // --- 새로 추가된 로직: renderReportForm을 활용한 100% 동일한 양식 렌더링 ---
      const tempContainer = document.createElement('div');
      // 기존 폼 화면을 완전히 렌더링 (DOM 이벤트 및 값 채우기 포함)
      renderReportForm(tempContainer, id);

      // 필요한 동적 영역만 추출
      const dynamicSection = tempContainer.querySelector('#section5DynamicContainer');
      const qtySection = tempContainer.querySelector('#qtySection');
      const downtimeSection = tempContainer.querySelector('#downtimeSection');

      const makeReadOnly = (el) => {
        if (!el) return '';
        const clone = el.cloneNode(true);
        
        const inputs = clone.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
          if (input.type === 'hidden') return;
          const span = document.createElement('span');
          span.style.fontWeight = 'bold';
          span.style.color = '#0369a1';
          span.style.fontSize = '12px';
          
          if (input.tagName === 'SELECT') {
             span.textContent = input.options[input.selectedIndex]?.text || '';
          } else if (input.type === 'checkbox' || input.type === 'radio') {
             span.textContent = input.checked ? '[O]' : '[X]';
          } else {
             span.textContent = input.value || '';
          }
          input.parentNode.replaceChild(span, input);
        });

        // 불필요한 버튼이나 아이콘 제거
        const buttons = clone.querySelectorAll('button, .remove-btn, .add-btn');
        buttons.forEach(btn => btn.style.display = 'none');
        
        // 추가 입력 힌트용 p 태그 등 숨김
        const hints = clone.querySelectorAll('p[style*="var(--text-muted)"]');
        hints.forEach(hint => hint.style.display = 'none');

        clone.style.pointerEvents = 'none';
        return clone.innerHTML;
      };

      const cardDimensionsAndVulc = makeReadOnly(dynamicSection);
      const cardProductionAndDefects = makeReadOnly(qtySection);
      const cardDowntime = makeReadOnly(downtimeSection);

      // cardDimensions, cardVulcanization, cardMaterialLots 는 이미 secIndex를 소모했을 수 있음.
      // tempContainer 내부에서 자체적으로 updateSectionNumbers()가 실행되어 
      // .sec-num 이 할당되었으므로, 우리는 그냥 그대로 가져다 붙이면 됨!
      
`;

code = code.replace(legacyStartRegex, replacementCode);

// We need to replace the placeholders in the modal HTML string
// Previous:
//           <!-- 3. 소재 LOT 번호 입력 카드 (있을 때만 번호 부여) -->
//           \${cardMaterialLots}
//
//           <!-- 4. 치수확인 카드 (있을 때만 번호 부여) -->
//           \${cardDimensions}
//
//           <!-- 5. 설비 가류조건 카드 (있을 때만 번호 부여) -->
//           \${cardVulcanization}
//
//           <!-- 6. 생산실적 및 불량 현황 카드 (있을 때만 번호 부여) -->
//           \${cardProductionAndDefects}
//
//           <!-- 7. 비가동 시간 & 사유 카드 (있을 때만 번호 부여) -->
//           \${cardDowntime}

const oldHtmlPlacement = /\s*<!-- 4\. 치수확인 카드 \(있을 때만 번호 부여\) -->[\s\S]*?\$\{cardDowntime\}/;

const newHtmlPlacement = `
          <!-- 4. 치수확인 및 가류조건 (Dynamic Section) -->
          \${cardDimensionsAndVulc}

          <!-- 5. 생산실적 및 불량 현황 -->
          \${cardProductionAndDefects}

          <!-- 6. 비가동 시간 & 사유 -->
          \${cardDowntime}
`;

code = code.replace(oldHtmlPlacement, newHtmlPlacement);

// In tempContainer, updateSectionNumbers() runs and sets '1.', '2.', '3.' etc on ALL cards.
// But cardSummary and cardDateTime don't have .sec-num. Wait! 
// If reportForm.js numbers its own cards, and we just append them, they will have their original numbers from the form!
// The modal also prepends cardDateTime and cardSummary which don't have numbers in the modal currently, OR do they?
// Let's check cardDateTime in reportList.js:
// <label style="...">📅 \${r.date} (\${r.shift})</label>
// cardSummary: 
// <label style="...">📊 생산 실적 종합 요약</label>
// These don't have numbers.
// cardMaterialLots:
// 🧪 \${num}. 소재 LOT 번호 입력 현황
// Wait! cardMaterialLots is STILL rendered by reportList.js!
// If cardMaterialLots is rendered by reportList.js, it uses secIndex++.
// And tempContainer also rendered materialLots!
// So if we just append tempContainer's materialLots, we wouldn't need reportList's materialLots either!
// BUT reportList's materialLots renders a nice condensed table. reportForm.js renders it as a big input grid.
// Let's just remove reportList's material lots and use tempContainer's material lots as well!
// Let's do that!

fs.writeFileSync('js/components/reportList.js', code, 'utf8');
console.log('Done refactoring reportList.js');

