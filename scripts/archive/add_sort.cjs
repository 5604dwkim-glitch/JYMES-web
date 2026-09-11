const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/ChangePointManagement.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add sortConfig state
content = content.replace(
  /const \[editingId, setEditingId\] = useState\(null\);/,
  `const [editingId, setEditingId] = useState(null);\n  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });`
);

// 2. Remove initial data sorting in fetch (to avoid duplicate sorting, but we can leave it since useMemo handles it)
// Let's modify the useMemo to sort data instead of using data directly in data.map
content = content.replace(
  /<tbody>\s*\{\/\* Add New Row \*\/\}/,
  `<tbody>
                {/* Add New Row */}`
);

// We need to inject sortedData
const useMemoInject = `  const sortedData = useMemo(() => {
    let sortableData = [...data];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        let valA = a[sortConfig.key] || '';
        let valB = b[sortConfig.key] || '';
        if (valA === valB) return 0;
        const compareResult = valA.localeCompare(valB);
        return sortConfig.direction === 'asc' ? compareResult : -compareResult;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
`;

content = content.replace(
  /  const handleAdd = async \(\) => \{/,
  useMemoInject + '\n  const handleAdd = async () => {'
);

// 3. Replace {data.map((row, index) => { with {sortedData.map((row, index) => {
content = content.replace(
  /\{data\.map\(\(row, index\) => \{/g,
  '{sortedData.map((row, index) => {'
);

// Replace {data.length === 0 with {sortedData.length === 0
content = content.replace(
  /\{data\.length === 0/g,
  '{sortedData.length === 0'
);

// 4. Update the table headers:
//   <th colSpan={7} style={{ padding: '6px', border: '1px solid #cbd5e1' }}>발생내역</th> -> colSpan={6}
content = content.replace(
  /<th colSpan=\{7\} style=\{\{ padding: '6px', border: '1px solid #cbd5e1' \}\}>발생내역<\/th>/,
  "<th colSpan={6} style={{ padding: '6px', border: '1px solid #cbd5e1' }}>발생내역</th>"
);
// {COLUMNS.slice(0, 7).map(c => ( -> slice(0, 6)
content = content.replace(
  /\{COLUMNS\.slice\(0, 7\)\.map\(c => \(/,
  "{COLUMNS.slice(0, 6).map(c => ("
);
// {COLUMNS.slice(7, 12).map(c => ( -> slice(6, 11)
content = content.replace(
  /\{COLUMNS\.slice\(7, 12\)\.map\(c => \(/,
  "{COLUMNS.slice(6, 11).map(c => ("
);
// {COLUMNS.slice(12, 14).map(c => ( -> slice(11, 13)
content = content.replace(
  /\{COLUMNS\.slice\(12, 14\)\.map\(c => \(/,
  "{COLUMNS.slice(11, 13).map(c => ("
);

// Replace the th rendering inside slice maps to include sorting arrows
const thReplaceStr = `                    <th key={c.key} style={{ padding: '6px', border: '1px solid #cbd5e1', width: c.width, cursor: ['date', 'type', 'issueItem', 'carModel', 'partName'].includes(c.key) ? 'pointer' : 'default' }} onClick={() => ['date', 'type', 'issueItem', 'carModel', 'partName'].includes(c.key) ? requestSort(c.key) : null}>
                      {c.label}
                      {['date', 'type', 'issueItem', 'carModel', 'partName'].includes(c.key) && (
                        <span style={{ marginLeft: '4px', fontSize: '10px' }}>
                          {sortConfig && sortConfig.key === c.key ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      )}
                    </th>`;

content = content.replace(
  /<th key=\{c\.key\} style=\{\{ padding: '6px', border: '1px solid #cbd5e1', width: c\.width \}\}>\{c\.label\}<\/th>/g,
  thReplaceStr
);

fs.writeFileSync(file, content, 'utf8');
console.log('Sorting logic added to ChangePointManagement.jsx');
