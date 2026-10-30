const fs = require('fs');
let content = fs.readFileSync('src/components/MoldManagement/MoldManagement.jsx', 'utf8');

// Find and remove the protect route block regardless of exact spaces
content = content.replace(/\s*\/\/\s*Protect route\s*if\s*\([^)]*\)\s*\{\s*return\s*<Navigate[^>]*>\s*;\s*\}/g, '');

const navi = `
  if (userRole?.role === 'worker') {
    return <Navigate to="/" replace />;
  }
`;

content = content.replace('return (\n    <div className="card"', navi + '\n  return (\n    <div className="card"');

fs.writeFileSync('src/components/MoldManagement/MoldManagement.jsx', content, 'utf8');
console.log('Fixed early return');
