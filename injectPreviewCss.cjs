const fs = require('fs');

const cssPath = 'src/index.css';
let css = fs.readFileSync(cssPath, 'utf8');

const start = css.indexOf('@media (max-width: 768px)');
let end = start;
let brackets = 0;
for(let i=start; i<css.length; i++){
  if(css[i]==='{') brackets++;
  if(css[i]==='}') {
    brackets--;
    if(brackets===0){
      end=i;
      break;
    }
  }
}

const mediaContent = css.substring(start + css.substring(start).indexOf('{') + 1, end);

// Generate .mobile-preview-mode CSS by prefixing selectors
const previewCss = `\n/* --- Auto-generated Mobile Preview Mode --- */\n` + mediaContent.replace(/([^\r\n,{}]+)(,(?=[^}]*\{)|\s*\{)/g, (match, selector, suffix) => {
  if (selector.trim().startsWith('@') || selector.trim() === '') return match;
  
  // Split by comma in case of multiple selectors (already handled by regex capturing groups but just in case)
  const selectors = selector.split(',').map(s => s.trim());
  
  const prefixed = selectors.map(s => {
    if (s === 'html' || s === 'body') return `body.mobile-preview-mode`;
    if (s === 'html, body, #app, .main-wrapper, .content-body') return `body.mobile-preview-mode #app, body.mobile-preview-mode .main-wrapper, body.mobile-preview-mode .content-body`;
    return `body.mobile-preview-mode ${s}`;
  }).join(', ');

  return prefixed + suffix;
}) + `
body.mobile-preview-mode {
  background-color: #333 !important;
  display: flex;
  justify-content: center;
  align-items: center;
}
body.mobile-preview-mode #app {
  width: 414px !important; /* iPhone Pro Max width */
  height: 100vh !important;
  max-height: 100vh;
  margin: 0 auto;
  box-shadow: 0 0 40px rgba(0,0,0,0.8);
  background: var(--bg-main);
  overflow: hidden;
}
body.mobile-preview-mode .main-wrapper {
  overflow-y: auto;
}
`;

if (!css.includes('Auto-generated Mobile Preview Mode')) {
  fs.writeFileSync(cssPath, css + previewCss);
  console.log('Injected mobile preview CSS into index.css');
} else {
  console.log('Mobile preview CSS already exists.');
}
