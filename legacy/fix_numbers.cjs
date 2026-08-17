const fs = require('fs');

let code = fs.readFileSync('js/components/reportForm.js', 'utf8');

// The pattern looks for an emoji followed by optional spaces, digits, dot, and a space
// Emojis: \u2000-\u3300 or surrogate pairs
const emojiPattern = /([\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])\s*\d+\.\s/g;

code = code.replace(emojiPattern, '$1 <span class="sec-num"></span> ');

// There is one edge case without emoji:
// "📝 9. 비가동"
// "📝 8. 비가동"
// The regex handles it because 📝 is \ud83d\udcdd

fs.writeFileSync('js/components/reportForm.js', code, 'utf8');
console.log('Replaced');
