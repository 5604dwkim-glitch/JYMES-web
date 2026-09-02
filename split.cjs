const fs = require('fs');
const lines = fs.readFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', 'utf8').split('\n');

// renderLeaderPaperForm is from line 114 to 476 (0-indexed 113 to 475)
const extractedFunc = lines.slice(113, 476).join('\n');

const newLeaderFile = `import { DEFAULT_LEADER_ITEMS } from "../../constants/masterData.js";
import { store, bindTimeWheelPicker, windowMock } from "./LegacyFormWrapper.jsx";

export ` + extractedFunc;

fs.writeFileSync('src/components/DynamicForms/LeaderFormRenderer.js', newLeaderFile);

// Replace lines in original file
const newLines = [
  'import { renderLeaderPaperForm } from "./LeaderFormRenderer.js";',
  ...lines.slice(0, 113),
  ...lines.slice(476)
];

fs.writeFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', newLines.join('\n'));
