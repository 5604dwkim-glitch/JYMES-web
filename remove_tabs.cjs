const fs = require('fs');
let code = fs.readFileSync('src/components/MasterData.jsx', 'utf8');

// Remove buttons
code = code.replace(
  /<button\s+className={`btn \${activeTab === 'processes' \? 'btn-primary' : 'btn-secondary'}`}[\s\S]*?<\/button>/,
  ''
);
code = code.replace(
  /<button\s+className={`btn \${activeTab === 'items' \? 'btn-primary' : 'btn-secondary'}`}[\s\S]*?<\/button>/,
  ''
);

// Remove renders
code = code.replace(
  /{activeTab === 'processes' && \([\s\S]*?}\)/g,
  ''
);
code = code.replace(
  /{activeTab === 'items' && \([\s\S]*?}\)/g,
  ''
);

fs.writeFileSync('src/components/MasterData.jsx', code);
console.log('Removed items');
