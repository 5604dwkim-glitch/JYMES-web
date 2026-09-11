const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/ChangePointManagement.jsx');
let content = fs.readFileSync(file, 'utf8');

// Move the arrow in front of the label
content = content.replace(
  /\{c\.label\}\s*\{\[([^\]]+)\]\.includes\(c\.key\) && \(\s*<span style=\{\{ marginLeft: '4px', fontSize: '10px' \}\}>\s*\{sortConfig && sortConfig\.key === c\.key \? \(sortConfig\.direction === 'asc' \? '▲' : '▼'\) : '↕'\}\s*<\/span>\s*\)\}/g,
  `{['date', 'type', 'issueItem', 'carModel', 'partName'].includes(c.key) && (
                        <span style={{ marginRight: '4px', fontSize: '10px' }}>
                          {sortConfig && sortConfig.key === c.key ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      )}
                      {c.label}`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Moved sort arrows to the front in ChangePointManagement.jsx');
