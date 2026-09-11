const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'components', 'DynamicForms', 'sections', 'Section5Renderer.js');
let content = fs.readFileSync(file, 'utf8');

let changed = false;

// 1) form 2005 / 2015 block
// Currently: <input type="text" id="dim2005_${it.k}_lh" class="form-control" ...
const t1Lh = '<input type="text" id="dim2005_${it.k}_lh" class="form-control"';
const r1Lh = '<input type="text" id="dim2005_${it.k}_lh" data-wheel-parsed-spec="${parseFloat(g.spec)}" data-isolated="true" class="form-control"';
const t1Rh = '<input type="text" id="dim2005_${it.k}_rh" class="form-control"';
const r1Rh = '<input type="text" id="dim2005_${it.k}_rh" data-wheel-parsed-spec="${parseFloat(g.spec)}" data-isolated="true" class="form-control"';

if (content.includes(t1Lh)) {
    content = content.replaceAll(t1Lh, r1Lh);
    content = content.replaceAll(t1Rh, r1Rh);
    changed = true;
}

// 2) form 2035 / 2027 block
// Currently: <input type="text" id="dim2005_${it.k}_lh" data-isolated="true" class="form-control" ...
const t2Lh = '<input type="text" id="dim2005_${it.k}_lh" data-isolated="true" class="form-control"';
const r2Lh = '<input type="text" id="dim2005_${it.k}_lh" data-wheel-parsed-spec="${parseFloat(it.spec)}" data-isolated="true" class="form-control"';
const t2Rh = '<input type="text" id="dim2005_${it.k}_rh" data-isolated="true" class="form-control"';
const r2Rh = '<input type="text" id="dim2005_${it.k}_rh" data-wheel-parsed-spec="${parseFloat(it.spec)}" data-isolated="true" class="form-control"';

if (content.includes(t2Lh)) {
    content = content.replaceAll(t2Lh, r2Lh);
    content = content.replaceAll(t2Rh, r2Rh);
    changed = true;
}

if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log("Updated Section5Renderer.js successfully");
} else {
    console.log("No targets found for replacement");
}
