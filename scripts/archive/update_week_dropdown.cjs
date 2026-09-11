const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/ChangePointManagement.jsx');
let content = fs.readFileSync(file, 'utf8');

const weekRangesLogic = `
  const weekOptions = useMemo(() => {
    if (filterMonth === '전체') return [];
    const month = parseInt(filterMonth, 10);
    // Find a year from the data if possible, default to 2026
    let year = 2026;
    if (data.length > 0 && data[0].date) {
      year = new Date(data[0].date).getFullYear();
    }
    
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0); // Last day of month
    
    const weeks = [];
    let currentWeekStart = new Date(startOfMonth);
    
    let startDayOfWeek = startOfMonth.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 7 : startDayOfWeek;
    
    let currentWeekEnd = new Date(startOfMonth);
    currentWeekEnd.setDate(currentWeekStart.getDate() + (7 - startDayOfWeek));
    if (currentWeekEnd > endOfMonth) currentWeekEnd = new Date(endOfMonth);
    
    let weekNumber = 1;
    while (currentWeekStart <= endOfMonth) {
      const startStr = \`\${(currentWeekStart.getMonth()+1).toString().padStart(2, '0')}/\${currentWeekStart.getDate().toString().padStart(2, '0')}\`;
      const endStr = \`\${(currentWeekEnd.getMonth()+1).toString().padStart(2, '0')}/\${currentWeekEnd.getDate().toString().padStart(2, '0')}\`;
      
      weeks.push({
        value: \`\${weekNumber}주차\`,
        label: \`\${weekNumber}주차 (\${startStr}~\${endStr})\`
      });
      
      weekNumber++;
      currentWeekStart = new Date(currentWeekEnd);
      currentWeekStart.setDate(currentWeekStart.getDate() + 1);
      
      currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
      if (currentWeekEnd > endOfMonth) currentWeekEnd = new Date(endOfMonth);
    }
    return weeks;
  }, [filterMonth, data]);
`;

// Insert the logic before dashboardData useMemo
content = content.replace(
  /  \/\/ Dashboard Calculations/,
  weekRangesLogic + '\n  // Dashboard Calculations'
);

// Update the dropdown UI
const oldDropdown = `{[1, 2, 3, 4, 5, 6].map((w) => (
                  <option key={w} value={\`\${w}주차\`}>{w}주차</option>
                ))}`;
const newDropdown = `{weekOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}`;

content = content.replace(
  /\{\[1, 2, 3, 4, 5, 6\]\.map\(\(w\) => \([\s\S]*?<\/option>\s*\)\)\}/,
  newDropdown
);

fs.writeFileSync(file, content, 'utf8');
console.log('Added dynamic week ranges to dropdown');
