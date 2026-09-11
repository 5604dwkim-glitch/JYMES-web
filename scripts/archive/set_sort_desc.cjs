const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/ChangePointManagement.jsx');
let content = fs.readFileSync(file, 'utf8');

// Change from ascending to descending
content = content.replace(
  /return dateA\.localeCompare\(dateB\);/,
  `// 작성일자(date) 내림차순 정렬 (최신 날짜가 위로)
        return dateB.localeCompare(dateA);`
);

content = content.replace(
  /\/\/ 작성일자\(date\) 오름차순 정렬 \(기본값\)/,
  '// 작성일자(date) 내림차순 정렬 (기본값)'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Updated sorting logic to descending in ChangePointManagement.jsx');
