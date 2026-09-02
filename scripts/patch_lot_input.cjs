const fs = require('fs');

const path = 'src/components/DynamicForms/LegacyFormWrapper.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /export function bindLotDateWheelPicker[\s\S]*?function openLotDateWheelPicker/m;

const replacement = `export function bindLotDateWheelPicker(inputElem, titleText = '소재 LOT 날짜 선택') {
  if (!inputElem) return;
  
  // Remove readonly and click listener if they were set
  inputElem.readOnly = false;
  inputElem.style.cursor = 'text';
  inputElem.placeholder = '숫자 10자리 입력';
  
  // Create a clean clone to remove the old click event listener
  const newElem = inputElem.cloneNode(true);
  inputElem.parentNode.replaceChild(newElem, inputElem);
  
  // Re-format initial value if it already exists
  let initial = newElem.value.replace(/\\D/g, '');
  if (initial.length === 10) {
    const yy = initial.substring(0, 2);
    const mm = initial.substring(2, 4);
    const dd = initial.substring(4, 6);
    const hh = initial.substring(6, 8);
    const min = initial.substring(8, 10);
    newElem.value = \`\${yy}년 \${mm}월 \${dd}일 \${hh}시 \${min}분\`;
  } else if (initial.length === 8) {
    // Handling legacy 8 digit data (YYMMDDHH)
    const yy = initial.substring(0, 2);
    const mm = initial.substring(2, 4);
    const dd = initial.substring(4, 6);
    const hh = initial.substring(6, 8);
    newElem.value = \`\${yy}년 \${mm}월 \${dd}일 \${hh}시 00분\`;
  } else {
    newElem.value = initial;
  }

  newElem.addEventListener('input', (e) => {
    let digits = e.target.value.replace(/\\D/g, '');
    if (digits.length > 10) {
      digits = digits.substring(0, 10);
    }
    
    if (digits.length === 10) {
      const yy = digits.substring(0, 2);
      const mm = digits.substring(2, 4);
      const dd = digits.substring(4, 6);
      const hh = digits.substring(6, 8);
      const min = digits.substring(8, 10);
      e.target.value = \`\${yy}년 \${mm}월 \${dd}일 \${hh}시 \${min}분\`;
      newElem.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      e.target.value = digits;
    }
  });
}

function openLotDateWheelPicker`;

content = content.replace(regex, replacement);

fs.writeFileSync(path, content, 'utf8');
console.log('Patched bindLotDateWheelPicker.');
