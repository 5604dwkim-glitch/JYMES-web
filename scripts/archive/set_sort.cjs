const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/ChangePointManagement.jsx');
let content = fs.readFileSync(file, 'utf8');

// Change setData(res); to sort by date asc
content = content.replace(
  /const res = await fetchChangePoints\(\);\s*setData\(res\);/,
  `const res = await fetchChangePoints();
      // 작성일자(date) 오름차순 정렬 (기본값)
      res.sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateA === dateB) {
          // 작성일자가 같으면 생성일시(createdAt) 오름차순이나 기타 조건 사용 (현재는 그대로 유지)
          return 0;
        }
        return dateA.localeCompare(dateB);
      });
      setData(res);`
);

fs.writeFileSync(file, content, 'utf8');
console.log('Updated sorting logic in ChangePointManagement.jsx');
