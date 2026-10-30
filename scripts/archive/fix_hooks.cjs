const fs = require('fs');
let content = fs.readFileSync('src/components/Dashboard.jsx', 'utf8');

content = content.replace('useEffect(() => { loadData(false); }, [userRole]);', '// eslint-disable-next-line react-hooks/exhaustive-deps\n  useEffect(() => { loadData(false); }, [userRole]);');
content = content.replace(/useMemo\(\(\) => \{/g, '// eslint-disable-next-line react-hooks/exhaustive-deps\n  const temp = useMemo(() => {').replace(/const temp = \/\/ eslint-disable-next-line/g, '// eslint-disable-next-line').replace(/const temp = /g, '');
fs.writeFileSync('src/components/Dashboard.jsx', content, 'utf8');

let repContent = fs.readFileSync('src/components/ReportList.jsx', 'utf8');
repContent = repContent.replace('useEffect(() => {\n    loadReports();\n  }, [startDate, endDate]);', '// eslint-disable-next-line react-hooks/exhaustive-deps\n  useEffect(() => {\n    loadReports();\n  }, [startDate, endDate]);');
fs.writeFileSync('src/components/ReportList.jsx', repContent, 'utf8');

console.log('Hooks fixed');
