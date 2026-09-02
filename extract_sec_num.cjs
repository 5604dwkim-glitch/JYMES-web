const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('src/components/DynamicForms');
const items = new Set();
files.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split('\n');
    lines.forEach((l, i) => {
        if (l.includes('class="sec-num"')) {
            let clean = l.trim()
                .replace(/<[^>]+>/g, '') // remove HTML tags
                .replace(/-->/g, '')     // remove HTML comment ends
                .replace(/&nbsp;/g, ' ') // replace nbsp
                .replace(/^\s*\/\/\s*/, '') // remove leading JS comments
                .trim();
            if (clean && !clean.includes('${carName}')) {
                items.add(clean);
            }
        }
    });
});

console.log("Found unique items:");
Array.from(items).sort().forEach(item => console.log(item));
