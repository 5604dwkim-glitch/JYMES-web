const fs = require('fs');
const code = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');
const lines = code.split('\n');

// For each form branch, find nearby bindNumberWheelPicker calls and data-wheel-parsed-spec attributes
const results = [];
let currentForm = 'default';

lines.forEach((l, i) => {
  const formMatch = l.match(/formCode === (\d+)/);
  if (formMatch) currentForm = formMatch[1];
  
  // Find data-wheel-parsed-spec
  const specMatch = l.match(/data-wheel-parsed-spec="(\d+)"/);
  if (specMatch) {
    results.push({ line: i+1, form: currentForm, type: 'data-attr', value: Number(specMatch[1]), content: l.trim().substring(0, 100) });
  }
  
  // Find bindNumberWheelPicker
  const bindMatch = l.match(/bindNumberWheelPicker\([^,]+,\s*'([^']+)',\s*(\d+(?:\.\d+)?)/);
  if (bindMatch) {
    results.push({ line: i+1, form: currentForm, type: 'bind', label: bindMatch[1], value: Number(bindMatch[2]), content: l.trim().substring(0, 100) });
  }
});

// Group by form
const byForm = {};
results.forEach(r => {
  if (!byForm[r.form]) byForm[r.form] = [];
  byForm[r.form].push(r);
});

Object.entries(byForm).forEach(([form, items]) => {
  console.log('\n=== FORM', form, '===');
  items.forEach(r => {
    console.log(`  L${r.line} [${r.type}] val=${r.value} ${r.label || ''} | ${r.content.substring(0, 80)}`);
  });
});
