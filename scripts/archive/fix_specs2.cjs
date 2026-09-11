const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');

let fixes = 0;

// ============================================================
// FIX 2: Form 1001/1031 - First table (FRT only, 745 ± 1mm)
// dim_cut_FRT_* inputs have data-wheel-parsed-spec="326" -> should be "745"
// Line range: ~2095-2105
// ============================================================
// Strategy: find the unique anchor - 745 ± 1mm followed by inputs for dim_cut_FRT_초

// The file uses \r\n line endings - need to use CRLF in search strings
const frtOnlyRegex = /(745 ± 1mm[\s\S]{0,300}?dim_cut_FRT_초[^>]+data-wheel-parsed-spec=)"326"/;
let match = code.match(frtOnlyRegex);

if (match) {
  // Replace only this first occurrence
  code = code.replace(frtOnlyRegex, '$1"745"');
  fixes++;
  console.log('FIX 2a: First dim_cut_FRT_초 in FRT-only table 326 -> 745');
}

// Repeat for 중 and 종 in the same vicinity
// We need to find and fix all 3 in the first 1001 block only
// Use a position-aware approach: find the first occurrence of the FRT-only table
const frtBlockAnchor = code.indexOf('745 ± 1mm');
if (frtBlockAnchor >= 0) {
  // Look within next 1000 chars for the 3 inputs and fix them
  const vicinity = code.substring(frtBlockAnchor, frtBlockAnchor + 1500);
  const fixedVicinity = vicinity.replace(/data-wheel-parsed-spec="326"/g, 'data-wheel-parsed-spec="745"');
  if (fixedVicinity !== vicinity) {
    code = code.substring(0, frtBlockAnchor) + fixedVicinity + code.substring(frtBlockAnchor + 1500);
    const count = (vicinity.match(/data-wheel-parsed-spec="326"/g) || []).length;
    fixes += count;
    console.log(`FIX 2b: Fixed ${count} inputs in first 745 block (FRT-only table 1001)`);
  }
}

// ============================================================
// FIX 3: Form 1001/1031 - Second combined table (FRT=745, RR=687)
// dim_cut_FRT_* -> 745, dim_cut_RR_* -> add "687"
// ============================================================

// Second occurrence of '745 ± 1mm' is in the combined table
const firstOccurrence = code.indexOf('745 ± 1mm');
const secondOccurrence = code.indexOf('745 ± 1mm', firstOccurrence + 1);

if (secondOccurrence >= 0) {
  // The RR column has 687 ± 1mm just after the second 745
  const combinedBlock = code.substring(secondOccurrence, secondOccurrence + 3000);
  
  let fixedBlock = combinedBlock;
  
  // Fix FRT inputs: 326 -> 745
  fixedBlock = fixedBlock.replace(/data-wheel-parsed-spec="326"/g, 'data-wheel-parsed-spec="745"');
  
  // Add spec to RR inputs that don't have data-wheel-parsed-spec yet
  // dim_cut_RR_초, _중, _종 - these have no data-wheel-parsed-spec attr
  fixedBlock = fixedBlock.replace(
    /id="dim_cut_RR_초" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value=/g,
    'id="dim_cut_RR_초" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" data-wheel-parsed-spec="687" value='
  );
  fixedBlock = fixedBlock.replace(
    /id="dim_cut_RR_중" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value=/g,
    'id="dim_cut_RR_중" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" data-wheel-parsed-spec="687" value='
  );
  fixedBlock = fixedBlock.replace(
    /id="dim_cut_RR_종" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value=/g,
    'id="dim_cut_RR_종" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" data-wheel-parsed-spec="687" value='
  );
  
  if (fixedBlock !== combinedBlock) {
    code = code.substring(0, secondOccurrence) + fixedBlock + code.substring(secondOccurrence + 3000);
    fixes++;
    console.log('FIX 3 applied: Form 1001 combined table FRT(745)/RR(687) specs fixed');
  } else {
    console.log('FIX 3: Nothing to change');
  }
} else {
  console.log('FIX 3: No second occurrence of 745 found');
}

fs.writeFileSync('src/components/DynamicForms/sections/Section5Renderer.js', code);
console.log('\nTotal fixes applied:', fixes);
