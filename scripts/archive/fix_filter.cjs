const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/ChangePointManagement.jsx');
let content = fs.readFileSync(file, 'utf8');

// Replace d.month === filterMonth
content = content.replace(
  /filtered = filtered\.filter\(d => d\.month === filterMonth\);/,
  `filtered = filtered.filter(d => {
        if (!d.date) return false;
        const parts = d.date.split('-');
        if (parts.length < 2) return false;
        const monthNum = parseInt(parts[1], 10);
        return (monthNum + '월') === filterMonth;
      });`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed month filter in dashboard');
