const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/ChangePointManagement.jsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add state filterWeek
content = content.replace(
  /const \[filterMonth, setFilterMonth\] = useState\('전체'\);/,
  `const [filterMonth, setFilterMonth] = useState('전체');\n  const [filterWeek, setFilterWeek] = useState('전체');`
);

// 2. Add week calc logic and filter in dashboardData
const weekLogic = `
    if (filterMonth !== '전체') {
      filtered = filtered.filter(d => {
        if (!d.date) return false;
        const parts = d.date.split('-');
        if (parts.length < 2) return false;
        const monthNum = parseInt(parts[1], 10);
        return (monthNum + '월') === filterMonth;
      });
    }

    if (filterWeek !== '전체') {
      filtered = filtered.filter(d => {
        if (!d.date) return false;
        const dateObj = new Date(d.date);
        if (isNaN(dateObj.getTime())) return false;
        
        const startOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
        let startDay = startOfMonth.getDay();
        startDay = startDay === 0 ? 7 : startDay; // Mon=1 ... Sun=7
        
        const dateDay = dateObj.getDate();
        const weekNumber = Math.ceil((dateDay + startDay - 1) / 7);
        return (weekNumber + '주차') === filterWeek;
      });
    }
`;
content = content.replace(
  /if \(filterMonth !== '전체'\) \{\s*filtered = filtered\.filter\(d => \{\s*if \(\!d\.date\) return false;\s*const parts = d\.date\.split\('-'\);\s*if \(parts\.length < 2\) return false;\s*const monthNum = parseInt\(parts\[1\], 10\);\s*return \(monthNum \+ '월'\) === filterMonth;\s*\}\);\s*\}/,
  weekLogic
);

// We need to add filterWeek to the dependency array of useMemo!
content = content.replace(
  /return \{ total, ceoO, ceoX, qualityO, qualityX, qPointO, qPointX, issueCounts \};\s*\}, \[data, filterMonth\]\);/,
  `return { total, ceoO, ceoX, qualityO, qualityX, qPointO, qPointX, issueCounts };
  }, [data, filterMonth, filterWeek]);`
);

// 3. Add UI for the dropdown
const dropdownUI = `
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>월별</label>
              <select 
                value={filterMonth} 
                onChange={e => { setFilterMonth(e.target.value); setFilterWeek('전체'); }}
                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
              >
                <option value="전체">전체 보기</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i+1} value={\`\${i+1}월\`}>{i+1}월</option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>주차별 (월~일 기준)</label>
              <select 
                value={filterWeek} 
                onChange={e => setFilterWeek(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                disabled={filterMonth === '전체'}
              >
                <option value="전체">전체 보기</option>
                {[1, 2, 3, 4, 5, 6].map((w) => (
                  <option key={w} value={\`\${w}주차\`}>{w}주차</option>
                ))}
              </select>
            </div>
`;
content = content.replace(
  /<div style=\{\{ marginBottom: '16px' \}\}>\s*<label style=\{\{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' \}\}>월별<\/label>[\s\S]*?<\/select>\s*<\/div>/,
  dropdownUI
);

fs.writeFileSync(file, content, 'utf8');
console.log('Added week filter');
