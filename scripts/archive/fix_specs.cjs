const fs = require('fs');
let code = fs.readFileSync('src/components/DynamicForms/sections/Section5Renderer.js', 'utf8');

let fixes = 0;

// ============================================================
// FIX 1: Form 4011 (and 4014) - 정치절단길이 = 1870 ± 2.5mm
// Lines 376, 380, 384: data-wheel-parsed-spec="326" -> "1870"
// ============================================================
// The 4011 block has 3 inputs with spec=326 but table says 1870
// These inputs appear ONLY in the 4011 block (between formCode===4011 and next return)
// We need to be surgical: replace only in the block that also has bindNumberWheelPicker value 1870
// 
// We'll target the specific block: it has '1870 ± 2.5mm' and inputs with dim_cut_FRT_*
// The HTML template string for 4011 is between lines 343 and 393

const form4011StartMarker = '} else if (formCode === 4011 || formCode === 4014) {';
const form4011EndMarker = '      bindNumberWheelPicker(section5.querySelector(\'#dim_cut_FRT_초\'), \'정치절단길이 PTG 초\', 1870, 50);';

const startIdx = code.indexOf(form4011StartMarker);
const endIdx = code.indexOf(form4011EndMarker);

if (startIdx >= 0 && endIdx >= 0) {
  const blockBefore = code.substring(0, startIdx);
  const block = code.substring(startIdx, endIdx + form4011EndMarker.length);
  const blockAfter = code.substring(endIdx + form4011EndMarker.length);
  
  // Replace the 3 data-wheel-parsed-spec="326" -> "1870" ONLY within this block
  const fixedBlock = block.replace(/data-wheel-parsed-spec="326"/g, 'data-wheel-parsed-spec="1870"');
  const changed = (fixedBlock !== block);
  if (changed) {
    code = blockBefore + fixedBlock + blockAfter;
    fixes++;
    console.log('FIX 1 applied: Form 4011 dim_cut_FRT_* spec 326 -> 1870');
  } else {
    console.log('FIX 1: Nothing to change in 4011 block');
  }
} else {
  console.error('FIX 1: Could not find 4011 block markers');
}

// ============================================================
// FIX 2: Form 1001/1031 FRT table - 정치절단길이 = 745 ± 1mm
// Lines 2098, 2100, 2102: dim_cut_FRT_* spec="326" -> "745"
// This is in the block that ALSO has '745 ± 1mm' but NOT '687'
// i.e., the first section5 table for 1001/1031 (FRT only table)
// ============================================================

// Target: the FRT-only block which has '745 ± 1mm' as a colspan=2 (only one spec col)
// vs the combined FRT+RR block which has both '745 ± 1mm' and '687 ± 1mm'

// The FRT-only block is at: formCode === 1001 || formCode === 1031
// and its HTML has "FRT LH" and "FRT RH" but only ONE spec cell with 745

// We look for the unique string pattern: the combined 시작 of the 1001 FRT block
const frt1001Marker = '<!-- 1. 정치절단길이 -->\n                  <tr>\n                    <td rowspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px; vertical-align: middle;">\n                      정치절단길이<br>(Spec Cutt,g )\n                    </td>\n                    <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">\n                      규격 (Spec)\n                    </td>\n                    <td colspan="2" style="border: 1px solid #000; font-weight: 700; padding: 4px;">\n                      745 ± 1mm\n                    </td>\n                  </tr>\n                  <tr>\n                    <td colspan="2" style="border: 1px solid #000; background: #fffde7; font-weight: 700; padding: 4px;">\n                      실측(Act) <span style="font-size: 9px; font-weight: normal;">(초/중/종)</span>\n                    </td>\n                    <td colspan="2" style="border: 1px solid #000; padding: 3px 2px;">\n                      <div style="display: flex; align-items: center; justify-content: space-around; gap: 2px;">\n                        <span style="font-size: 10px; color: #333; font-weight: 700;">(초)</span>\n                        <input type="text" id="dim_cut_FRT_초" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" data-wheel-parsed-spec="326"';

const fix2Idx = code.indexOf(frt1001Marker);
if (fix2Idx >= 0) {
  // This is the block that needs spec 745 for dim_cut_FRT_*
  // Replace the 3 inputs within about 100 chars of where the block continues
  const afterMarker = code.substring(fix2Idx + frt1001Marker.length);
  // At this point, afterMarker starts right after data-wheel-parsed-spec="326" for the 초 input
  // We need to fix all 3 inputs: 초, 중, 종 in this block
  // The block ends at the next </tr> after these 3 inputs
  
  // Find the end of this small block
  const blockEnd = afterMarker.indexOf('<!-- 2. 단컷팅 (Step cutt,g) - 전방 & 후방 -->');
  if (blockEnd >= 0) {
    const smallBlock = afterMarker.substring(0, blockEnd);
    const fixedSmallBlock = smallBlock.replace(/data-wheel-parsed-spec="326"/g, 'data-wheel-parsed-spec="745"');
    if (fixedSmallBlock !== smallBlock) {
      code = code.substring(0, fix2Idx + frt1001Marker.length) + fixedSmallBlock + afterMarker.substring(blockEnd);
      fixes++;
      console.log('FIX 2 applied: Form 1001 FRT dim_cut_FRT_* spec 326 -> 745');
    } else {
      console.log('FIX 2: Nothing changed (may already be fixed)');
    }
  } else {
    console.error('FIX 2: Could not find end marker');
  }
} else {
  console.error('FIX 2: Could not find FRT 1001 marker');
}

// ============================================================
// FIX 3: Form 1001/1031 FRT+RR combined table
// dim_cut_FRT_* should be 745, dim_cut_RR_* should be 687
// Lines 2375-2379 (FRT col) and 2385-2389 (RR col - missing spec attr)
// ============================================================

// Find the second big section for 1001 that has BOTH '745 ± 1mm' and '687 ± 1mm'
const combinedMarker = '745 ± 1mm\n                  </td>\n                  <td colspan="2" style="border: 1px solid #000; font-weight: 700; padding: 4px;">\n                    687 ± 1mm';
const combined1001Idx = code.indexOf(combinedMarker);

if (combined1001Idx >= 0) {
  // Now find the input section after this
  const afterCombined = code.substring(combined1001Idx);
  const inputBlockStart = afterCombined.indexOf('실측(Act) <span style="font-size: 9px; font-weight: normal;">(초/중/종)</span>');
  
  if (inputBlockStart >= 0) {
    const fromInputs = afterCombined.substring(inputBlockStart);
    const inputBlockEnd = fromInputs.indexOf('<!-- 2. 단컷팅 (Step cutt,g) - 전방 & 후방 -->');
    
    if (inputBlockEnd >= 0) {
      let inputBlock = fromInputs.substring(0, inputBlockEnd);
      
      // Fix FRT inputs (dim_cut_FRT_*): change spec 326 -> 745
      inputBlock = inputBlock.replace(
        /id="dim_cut_FRT_초" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" data-wheel-parsed-spec="326"/g,
        'id="dim_cut_FRT_초" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" data-wheel-parsed-spec="745"'
      );
      inputBlock = inputBlock.replace(
        /id="dim_cut_FRT_중" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" data-wheel-parsed-spec="326"/g,
        'id="dim_cut_FRT_중" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" data-wheel-parsed-spec="745"'
      );
      inputBlock = inputBlock.replace(
        /id="dim_cut_FRT_종" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" data-wheel-parsed-spec="326"/g,
        'id="dim_cut_FRT_종" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" data-wheel-parsed-spec="745"'
      );
      
      // Add data-wheel-parsed-spec="687" to RR inputs that don't have it yet
      inputBlock = inputBlock.replace(
        /id="dim_cut_RR_초" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value=/g,
        'id="dim_cut_RR_초" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" data-wheel-parsed-spec="687" value='
      );
      inputBlock = inputBlock.replace(
        /id="dim_cut_RR_중" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value=/g,
        'id="dim_cut_RR_중" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" data-wheel-parsed-spec="687" value='
      );
      inputBlock = inputBlock.replace(
        /id="dim_cut_RR_종" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" value=/g,
        'id="dim_cut_RR_종" class="form-control" style="width: 27%; height: 26px; padding: 2px; text-align: center; font-size: 11px;" data-wheel-parsed-spec="687" value='
      );
      
      const newAfterCombined = afterCombined.substring(0, inputBlockStart) + inputBlock + fromInputs.substring(inputBlockEnd);
      code = code.substring(0, combined1001Idx) + newAfterCombined;
      fixes++;
      console.log('FIX 3 applied: Form 1001 combined FRT(745)/RR(687) specs corrected');
    } else {
      console.error('FIX 3: Could not find input block end');
    }
  } else {
    console.error('FIX 3: Could not find input block start');
  }
} else {
  console.error('FIX 3: Could not find combined 745+687 block');
}

// Save
fs.writeFileSync('src/components/DynamicForms/sections/Section5Renderer.js', code);
console.log('\nTotal fixes applied:', fixes);
