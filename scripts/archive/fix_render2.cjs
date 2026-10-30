const fs = require('fs');

// Fix QtySectionRenderer.js properly
// The issue is that qtySection is a const destructured from ctx, so we can't reassign it directly
// We need to work differently - replace the node in place then use local variable

let qty = fs.readFileSync('src/components/DynamicForms/sections/QtySectionRenderer.js', 'utf8');

const oldLine = `export function renderQtySection(ctx) {
  const { container, qtySection, processValue, existingData, getCurrentFormCode, updateDowntimeSection, isDtCrewClip } = ctx;
    if (!qtySection) return;
    const curProc = processValue ? processValue.value : '';
    const formCode = getCurrentFormCode();`;

const newLine = `export function renderQtySection(ctx) {
  let { container, qtySection, processValue, existingData, getCurrentFormCode, updateDowntimeSection, isDtCrewClip } = ctx;
    if (!qtySection) return;

    // ★ 이벤트 핸들러 누적 방지: 매 렌더링마다 새 노드로 교체
    const _freshQty = qtySection.cloneNode(false);
    qtySection.parentNode.replaceChild(_freshQty, qtySection);
    qtySection = _freshQty;

    const curProc = processValue ? processValue.value : '';
    const formCode = getCurrentFormCode();`;

qty = qty.replace(oldLine, newLine);
fs.writeFileSync('src/components/DynamicForms/sections/QtySectionRenderer.js', qty, 'utf8');
console.log('Fixed with let destructuring');
