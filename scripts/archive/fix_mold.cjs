const fs = require('fs');
let content = fs.readFileSync('src/components/MoldManagement/MoldManagement.jsx', 'utf8');

const earlyReturn = `  // Protect route
  if (userRole?.role === 'worker') {
    return <Navigate to="/" replace />;
  }`;

content = content.replace(earlyReturn, '');

const newContent = content.replace('const sortedMolds = React.useMemo(() => {', earlyReturn + '\n\n  const sortedMolds = React.useMemo(() => {');
fs.writeFileSync('src/components/MoldManagement/MoldManagement.jsx', newContent, 'utf8');
console.log('MoldManagement fixed');
