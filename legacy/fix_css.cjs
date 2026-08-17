const fs = require('fs');
let css = fs.readFileSync('styles.css', 'utf8');

// Remove CSS counters for section numbers
css = css.replace(/#reportFormContainer\s*\{\s*counter-reset:\s*section_counter;\s*\}/g, '');
css = css.replace(/\.sec-num\s*\{\s*counter-increment:\s*section_counter;\s*\}/g, '');
css = css.replace(/\.sec-num::after\s*\{\s*content:\s*counter\(section_counter\)\s*"\.\s*";\s*\}/g, '');

fs.writeFileSync('styles.css', css);
console.log('Removed CSS counters.');
