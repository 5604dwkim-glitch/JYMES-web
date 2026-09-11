const fs = require('fs');
let content = fs.readFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', 'utf8');

const oldFn = `  // 4자리 양식 고유번호 계산 및 렌더링 함수
  function renderFormCodeBadge() {
    const badgeContainer = container.querySelector('#formCodeBadgeContainer');
    if (!badgeContainer) return;

    const curCarCode = carModelValue ? carModelValue.value : currentCarCode;
    const curPart = partValueInput ? partValueInput.value : '';
    const curProc = processValue ? processValue.value : '';

    if (!curProc) {
      badgeContainer.innerHTML = '';
      return;
    }

    const codeNum = getCurrentFormCode();

    badgeContainer.innerHTML = \`
      <div class="card" style="padding: 10px 14px; background: linear-gradient(135deg, rgba(2, 132, 199, 0.08), rgba(99, 102, 241, 0.08)); border: 1.5px solid rgba(2, 132, 199, 0.3); border-radius: 8px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 12px; font-weight: 800; color: var(--accent-blue);">🏷️ 양식 고유번호:</span>
          <span style="font-size: 14px; font-weight: 900; color: #0284c7; background: #ffffff; padding: 2px 10px; border-radius: 6px; border: 1px solid #0284c7; font-family: monospace; letter-spacing: 0.5px;">#\${codeNum}</span>
        </div>
        <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">
          (\${curCarCode}\${curPart ? ' - ' + curPart : ''}\${curProc ? ' - ' + curProc : ''})
        </span>
      </div>
    \`;
  }`;

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

if (content.includes('badgeContainer.innerHTML')) {
  content = content.replace(oldFn, newFn);
  if (!content.includes('onFormSelectionChange')) {
    // Try simpler replacement just looking for the function block
    content = content.replace(
      /\/\/ 4자리 양식 고유번호 계산 및 렌더링 함수\s*function renderFormCodeBadge\(\)[^}]*badgeContainer\.innerHTML[^}]*\};?\s*\}/s,
      newFn
    );
  }
  fs.writeFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', content);
  console.log('Replacement applied:', content.includes('onFormSelectionChange') ? 'SUCCESS' : 'FAIL - trying manual');
} else {
  console.log('already updated');
}
