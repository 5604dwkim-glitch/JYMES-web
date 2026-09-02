const fs = require('fs');
let content = fs.readFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', 'utf8');

// Find by line numbers - look for the exact block
const lines = content.split('\n');
let startLine = -1;
let endLine = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('4자리 양식 고유번호') && lines[i+1] && lines[i+1].includes('function renderFormCodeBadge')) {
    startLine = i;
  }
  if (startLine >= 0 && i > startLine && lines[i].trim() === '}' && endLine === -1) {
    // check if this closes the function (look for innerHTML in between)
    const slice = lines.slice(startLine, i+1).join('\n');
    if (slice.includes('badgeContainer.innerHTML')) {
      endLine = i;
      break;
    }
  }
}

console.log('Found at lines:', startLine, '-', endLine);

if (startLine >= 0 && endLine >= 0) {
  const newFn = `  // 4자리 양식 고유번호 계산 및 렌더링 함수 (React 하이브리드 파이프라인 연동)
  function renderFormCodeBadge() {
    const curCarCode = carModelValue ? carModelValue.value : currentCarCode;
    const curPart = partValueInput ? partValueInput.value : '';
    const curProc = processValue ? processValue.value : '';

    // React 상태로 선택 값 전달 → FormCodeBadge JSX 컴포넌트가 렌더링 처리
    if (_ctx.onFormSelectionChange) {
      _ctx.onFormSelectionChange({
        carModel: curCarCode,
        part: curPart,
        process: curProc
      });
    }
  }`;
  
  lines.splice(startLine, endLine - startLine + 1, ...newFn.split('\n'));
  fs.writeFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', lines.join('\n'));
  console.log('Done. onFormSelectionChange present:', lines.join('\n').includes('onFormSelectionChange'));
}
