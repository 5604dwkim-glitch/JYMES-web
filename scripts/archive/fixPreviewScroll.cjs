const fs = require('fs');
const cssPath = 'src/index.css';
let css = fs.readFileSync(cssPath, 'utf8');

// We will replace the injected block with a better one.
const marker = '/* --- Auto-generated Mobile Preview Mode --- */';
if (css.includes(marker)) {
  const cssBefore = css.substring(0, css.indexOf(marker));
  
  // Re-generate the prefixed css
  const start = cssBefore.indexOf('@media (max-width: 768px)');
  let end = start;
  let brackets = 0;
  for(let i=start; i<cssBefore.length; i++){
    if(cssBefore[i]==='{') brackets++;
    if(cssBefore[i]==='}') {
      brackets--;
      if(brackets===0){
        end=i;
        break;
      }
    }
  }

  const mediaContent = cssBefore.substring(start + cssBefore.substring(start).indexOf('{') + 1, end);

  const previewCss = `\n${marker}\n` + mediaContent.replace(/([^\r\n,{}]+)(,(?=[^}]*\{)|\s*\{)/g, (match, selector, suffix) => {
    if (selector.trim().startsWith('@') || selector.trim() === '') return match;
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
  align-items: flex-start;
  padding: 20px 0;
  min-height: 100vh;
}
body.mobile-preview-mode #app {
  width: 414px !important; /* iPhone Pro Max width */
  min-height: 800px;
  height: auto !important;
  margin: 0 auto;
  box-shadow: 0 0 40px rgba(0,0,0,0.8);
  background: var(--bg-main);
  overflow-y: visible !important;
  border-radius: 12px;
}
body.mobile-preview-mode .main-wrapper {
  overflow-y: visible !important;
}
`;

  fs.writeFileSync(cssPath, cssBefore + previewCss);
  console.log('Updated mobile preview CSS for scrolling');
}
