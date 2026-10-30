const fs = require('fs');

// Fix 1: QtySectionRenderer.js
// Replace qtySection to a fresh clone before every re-render to nuke stale event listeners
let qty = fs.readFileSync('src/components/DynamicForms/sections/QtySectionRenderer.js', 'utf8');

// Add a "fresh clone" helper at the top of the render function, after finding qtySection
const oldInit = `    if (!qtySection) return;
    const curProc = processValue ? processValue.value : '';
    const formCode = getCurrentFormCode();`;

const newInit = `    if (!qtySection) return;

    // ★ 이벤트 핸들러 누적 방지: 매 렌더링마다 새 노드로 교체
    const freshQty = qtySection.cloneNode(false);
    qtySection.parentNode.replaceChild(freshQty, qtySection);
    // eslint-disable-next-line no-param-reassign
    qtySection = freshQty;

    const curProc = processValue ? processValue.value : '';
    const formCode = getCurrentFormCode();`;

qty = qty.replace(oldInit, newInit);
fs.writeFileSync('src/components/DynamicForms/sections/QtySectionRenderer.js', qty, 'utf8');
console.log('QtySectionRenderer patched');

// Fix 2: Section5Renderer.js
// Add section5.innerHTML = '' right at the start, before all branch logic
let s5 = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');

const oldS5Init = `    const molds = ctx.molds || [];
    const d = existingData?.dimData || {};

    if (!curProc || curProc === '클립머신') {
      section5.innerHTML = '';
      return;
    }`;

const newS5Init = `    const molds = ctx.molds || [];
    const d = existingData?.dimData || {};

    // ★ 차종/공정 변경 시 이전 내용 잔류 방지: 항상 초기화 후 재렌더링
    section5.innerHTML = '';

    if (!curProc || curProc === '클립머신') {
      return;
    }`;

s5 = s5.replace(oldS5Init, newS5Init);
fs.writeFileSync('src/components/DynamicForms/sections/Section5Renderer.js', s5, 'utf8');
console.log('Section5Renderer patched');
