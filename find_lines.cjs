const fs = require('fs');
const lines = fs.readFileSync('src/components/MasterData.jsx', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes("activeTab === 'processes'") || l.includes("activeTab === 'items'")) {
    console.log(i, l);
  }
});
