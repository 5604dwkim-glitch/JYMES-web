/**
 * Deep audit of ALL form section 5 dimension inputs.
 * Cross-references:
 * 1. data-wheel-parsed-spec attribute values in the HTML templates
 * 2. bindNumberWheelPicker calls in the JS
 * 3. Hardcoded defVal overrides in LegacyFormWrapper
 * 4. Actual spec values in the surrounding table HTML
 */
const fs = require('fs');

const sec5 = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');
const wrapper = fs.readFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', 'utf8');

const lines = sec5.split('\n');

// Track form code context
let currentForm = 'unknown';
let currentCarNote = '';

// For each section / form code block, collect:
// - html spec values from the table (±-style specs)
// - data-wheel-parsed-spec attributes
// - bindNumberWheelPicker calls
// - inline HTML spec text like "326 ± 2mm"

const issues = [];
const allForms = {};

lines.forEach((l, i) => {
  const formMatch = l.match(/formCode === (\d+)/);
  if (formMatch) {
    currentForm = formMatch[1];
    if (!allForms[currentForm]) allForms[currentForm] = { inputs: [] };
  }
  
  // Detect spec in surrounding HTML (e.g. 326 ± 2mm, 36 ± 1, 779 ± 5)
  const specTextMatch = l.match(/(\d+(?:\.\d+)?)\s*±\s*(\d+(?:\.\d+)?)\s*(mm|inch)?/);
  
  // data-wheel-parsed-spec
  const attrMatch = l.match(/data-wheel-parsed-spec="(\d+(?:\.\d+)?)"/);
  if (attrMatch) {
    const attrSpec = parseFloat(attrMatch[1]);
    
    // Look backward for the spec text in surrounding rows
    let specFromTable = null;
    for (let back = Math.max(0, i-30); back < i; back++) {
      const bLine = lines[back];
      const sm = bLine.match(/(\d+(?:\.\d+)?)\s*±\s*(\d+(?:\.\d+)?)/);
      if (sm) {
        specFromTable = parseFloat(sm[1]);
      }
    }
    
    // Get input id
    const idMatch = l.match(/id="([^"]+)"/);
    const inputId = idMatch ? idMatch[1] : '?';
    
    if (!allForms[currentForm]) allForms[currentForm] = { inputs: [] };
    allForms[currentForm].inputs.push({
      line: i+1,
      inputId,
      attrSpec,
      specFromTable,
      matches: specFromTable === null || attrSpec === specFromTable
    });
    
    if (specFromTable !== null && attrSpec !== specFromTable) {
      issues.push({
        form: currentForm,
        line: i+1,
        inputId,
        attrSpec,
        specFromTable,
        msg: `MISMATCH: data-wheel-parsed-spec=${attrSpec} but table shows ${specFromTable}`
      });
    }
  }
  
  // bindNumberWheelPicker calls
  const bindMatch = l.match(/bindNumberWheelPicker\([^,]+,\s*'([^']+)',\s*(\d+(?:\.\d+)?)/);
  if (bindMatch) {
    const label = bindMatch[1];
    const bindSpec = parseFloat(bindMatch[2]);
    
    // Also look at data-wheel-parsed-spec on the corresponding input
    if (!allForms[currentForm]) allForms[currentForm] = { inputs: [] };
    allForms[currentForm].inputs.push({
      line: i+1,
      inputId: label,
      bindSpec,
      type: 'bind'
    });
  }
});

// Also look at LegacyFormWrapper hardcoded patterns
const wLines = wrapper.split('\n');
const wIssues = [];
wLines.forEach((l, i) => {
  if (l.includes('inputId.startsWith(') && l.includes('defVal =')) {
    // inline defVal assignment
    const idMatch = l.match(/startsWith\('([^']+)'\)/);
    const valMatch = l.match(/defVal = (\d+)/);
    if (idMatch && valMatch) {
      wIssues.push({
        line: i+2, // defVal is on next line usually
        inputPattern: idMatch[1],
        hardcodedVal: parseFloat(valMatch[1])
      });
    }
  }
  // Catch the pattern on next line
  if (l.match(/defVal = (\d+)/) && i > 0) {
    const prevLine = wLines[i-1];
    if (prevLine.includes('startsWith(')) {
      const idMatch = prevLine.match(/startsWith\('([^']+)'\)/);
      const valMatch = l.match(/defVal = (\d+)/);
      if (idMatch && valMatch) {
        wIssues.push({
          line: i+1,
          inputPattern: idMatch[1],
          hardcodedVal: parseFloat(valMatch[1])
        });
      }
    }
  }
});

console.log('\n========== SPEC MISMATCH ISSUES ==========');
if (issues.length === 0) {
  console.log('No data-attr vs table spec mismatches found!');
} else {
  issues.forEach(issue => {
    console.log(`FORM ${issue.form} | Line ${issue.line} | ${issue.inputId}`);
    console.log(`  ${issue.msg}`);
  });
}

console.log('\n========== ALL FORMS SUMMARY ==========');
Object.entries(allForms).forEach(([form, data]) => {
  const inputsBySpec = {};
  data.inputs.forEach(inp => {
    const key = inp.attrSpec || inp.bindSpec;
    if (!inputsBySpec[key]) inputsBySpec[key] = [];
    inputsBySpec[key].push(inp.inputId);
  });
  console.log(`\nFORM ${form}:`);
  Object.entries(inputsBySpec).forEach(([spec, ids]) => {
    console.log(`  spec=${spec}: ${ids.slice(0,5).join(', ')}${ids.length > 5 ? '...' : ''}`);
  });
});

console.log('\n========== LEGACYFORMWRAPPER HARDCODED PATTERNS ==========');
const seen = new Set();
wIssues.forEach(w => {
  const key = w.inputPattern + w.hardcodedVal;
  if (!seen.has(key)) {
    seen.add(key);
    console.log(`Pattern: '${w.inputPattern}*' -> defVal = ${w.hardcodedVal} (Line ${w.line})`);
  }
});
