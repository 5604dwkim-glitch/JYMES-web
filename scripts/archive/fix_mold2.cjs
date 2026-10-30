const fs = require('fs');
let content = fs.readFileSync('src/components/MoldManagement/MoldManagement.jsx', 'utf8');

const earlyReturn = `  // Protect route
  if (userRole?.role === 'worker') {
    return <Navigate to="/" replace />;
  }`;

content = content.replace(earlyReturn, '');
content = content.replace('  return (\n    <div className="card"', earlyReturn + '\n\n  return (\n    <div className="card"');

fs.writeFileSync('src/components/MoldManagement/MoldManagement.jsx', content, 'utf8');
console.log('MoldManagement fixed again');
