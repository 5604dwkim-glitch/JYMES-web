const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/DynamicForms/LegacyFormWrapper.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Update bindNumberWheelPicker signature and call
content = content.replace(
  /function bindNumberWheelPicker\(inputElem, titleText = '수치 입력', defaultCenter = 100, range = 30, unit = ''\) \{/g,
  "function bindNumberWheelPicker(inputElem, titleText = '수치 입력', defaultCenter = 100, range = 30, unit = '', tolerance = null) {"
);

content = content.replace(
  /openNumberWheelPicker\(initialVal, titleText, defaultCenter, range, unit, \(selectedVal\) => \{/g,
  "openNumberWheelPicker(initialVal, titleText, defaultCenter, range, unit, tolerance, (selectedVal) => {"
);

// 2. Update openNumberWheelPicker signature and confirm button
content = content.replace(
  /function openNumberWheelPicker\(initialValue = 100, title = '수치 선택', defaultCenter = 100, range = 30, unit = '', callback\) \{/g,
  "function openNumberWheelPicker(initialValue = 100, title = '수치 선택', defaultCenter = 100, range = 30, unit = '', tolerance = null, callback) {"
);

const confirmBtnSearch = `modal.querySelector('#wnpConfirmBtn').addEventListener('click', () => {
    if (callback) callback(String(selectedNumber));
    closeModal();
  });`;

const confirmBtnReplace = `modal.querySelector('#wnpConfirmBtn').addEventListener('click', () => {
    if (tolerance !== null && (selectedNumber < defaultCenter - tolerance || selectedNumber > defaultCenter + tolerance)) {
      if (!window.confirm("스펙을 벗어납니다. 그래도 입력하시겠습니까?")) {
        return;
      }
    }
    if (callback) callback(String(selectedNumber));
    closeModal();
  });`;

content = content.replace(confirmBtnSearch, confirmBtnReplace);

// 3. Update autoBindAllDimensionInputs
// Find let defVal = 0; let foundSpec = false;
content = content.replace(
  /let defVal = 0;\s*let foundSpec = false;/g,
  "let defVal = 0;\n    let foundSpec = false;\n    let toleranceVal = null;"
);

// Update all the match blocks
// We can use a regex to replace the match extraction logic
const matchRegex = /const (\w+) = ([\w\.]+)\.match\(\/\(\[\\d\.\]\+\)\\s\*±\/\);\s*if \(\1 && !isNaN\(parseFloat\(\1\[1\]\)\)\) \{\s*defVal = parseFloat\(\1\[1\]\);\s*foundSpec = true;/g;

content = content.replace(matchRegex, (full, varName, sourceVar) => {
  return `const ${varName} = ${sourceVar}.match(/([\\d.]+)\\s*±\\s*([\\d.]+)?/);
            if (${varName} && !isNaN(parseFloat(${varName}[1]))) {
              defVal = parseFloat(${varName}[1]);
              if (${varName}[2] && !isNaN(parseFloat(${varName}[2]))) {
                toleranceVal = parseFloat(${varName}[2]);
              }
              foundSpec = true;`;
});

// Update the final call
content = content.replace(
  /bindNumberWheelPicker\(input, titleText, defVal, range, unit\);/g,
  "bindNumberWheelPicker(input, titleText, defVal, range, unit, toleranceVal);"
);

// Wait, I should also check if formCode === 2027 etc. hardcodes the specs in autoBindAllDimensionInputs?
// No, autoBindAllDimensionInputs reads from the DOM or placeholder. 
// But what about data-wheel-parsed-spec ? 
// If it has `data-wheel-parsed-spec`, it sets defVal. What if we add tolerance to it?
// Let's add tolerance parsing if data-wheel-parsed-tol exists, or we just rely on DOM parsing.
// Actually, earlier for 2027 we didn't add data-wheel-parsed-spec to inputs, we added it to the TABLE!
// So it will parse the DOM (the thead or the td cells) and find the spec. It WILL find the `± 5` because it's in the row!

fs.writeFileSync(filePath, content, 'utf8');
console.log("Success");
