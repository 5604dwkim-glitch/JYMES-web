const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/ChangePointManagement.jsx');

let content = fs.readFileSync(file, 'utf8');

// Replace COLUMNS
const oldColumnsMatch = content.match(/const COLUMNS = \[[\s\S]*?\];/);
const newColumns = `const COLUMNS = [
  { key: 'date', label: '작성일자', type: 'date', width: '120px' },
  { key: 'type', label: '구분', width: '80px' },
  { key: 'issueItem', label: '발생항목', width: '120px' },
  { key: 'carModel', label: '차종', width: '100px' },
  { key: 'itemCode', label: '아이템코드', width: '120px' },
  { key: 'partName', label: '품명', width: '120px' },
  { key: 'details', label: '상세내용', width: '200px' },
  { key: 'actionTime', label: '조치시점', type: 'date', width: '120px' },
  { key: 'actionPlan', label: '조치방안', width: '150px' },
  { key: 'actionResult', label: '조치결과', width: '150px' },
  { key: 'qualityCheck', label: '품질 검증', width: '100px' },
  { key: 'ceoCheck', label: '대표이사 검증', width: '100px' },
  { key: 'qPointInstall', label: 'Q.POINT 설치여부', width: '120px' },
  { key: 'qPointFile', label: 'Q.POINT 첨부파일', width: '120px' },
  { key: 'note', label: '비고', width: '150px' }
];`;
content = content.replace(oldColumnsMatch[0], newColumns);

// Replace colSpan and slice logic in table
content = content.replace(/<th colSpan=\{13\}/g, '<th colSpan={7}');
content = content.replace(/COLUMNS\.slice\(0, 13\)/g, 'COLUMNS.slice(0, 7)');
content = content.replace(/COLUMNS\.slice\(13, 18\)/g, 'COLUMNS.slice(7, 12)');
content = content.replace(/COLUMNS\.slice\(18, 20\)/g, 'COLUMNS.slice(12, 14)');

// Optional: Change minWidth from 2400px to 1800px since we removed 6 columns (~620px)
content = content.replace(/minWidth: '2400px'/g, "minWidth: '1700px'");

fs.writeFileSync(file, content);
console.log('ChangePointManagement.jsx columns removed successfully.');
