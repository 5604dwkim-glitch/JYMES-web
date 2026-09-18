const fs = require('fs');
let file = 'src/components/Dashboard.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add state
code = code.replace(
  /const \[filterPart, setFilterPart\] = useState\('ALL'\);/,
  "const [filterPart, setFilterPart] = useState('ALL');\n  const [filterProc, setFilterProc] = useState('ALL');"
);

// 2. Add procOptions
code = code.replace(
  /const partOptions = useMemo\(\(\) => \{/,
  "const procOptions = ['소재준비', '조인트', '검사포장', '후가공', '출하지원', '지게차작업', '반장 작업일보'];\n  const partOptions = useMemo(() => {"
);

// 3. Update chartDataObj
code = code.replace(
  /if \(filterMfg === 'ALL' && filterCar === 'ALL' && filterPart === 'ALL'\) \{/g,
  "if (filterMfg === 'ALL' && filterCar === 'ALL' && filterPart === 'ALL' && filterProc === 'ALL') {"
);

code = code.replace(
  /const \[car, part\] = comboKey\.split\('::'\);/g,
  "const [car, part, proc] = comboKey.split('::');"
);

code = code.replace(
  /let match = true;\n\s*if \(safeFilterCar !== 'ALL' && car !== safeFilterCar\) match = false;/g,
  "let match = true;\n            if (filterProc !== 'ALL' && proc !== filterProc) match = false;\n            if (match && safeFilterCar !== 'ALL' && car !== safeFilterCar) match = false;"
);

// dependencies
code = code.replace(
  /}, \[data\.dailyStats, chartPeriod, filterMfg, filterCar, filterPart\]\);/,
  "}, [data.dailyStats, chartPeriod, filterMfg, filterCar, filterPart, filterProc]);"
);

// dependencies defect breakdown
code = code.replace(
  /}, \[data\.dailyStats, defectPeriod, filterMfg, filterCar, filterPart\]\);/,
  "}, [data.dailyStats, defectPeriod, filterMfg, filterCar, filterPart, filterProc]);"
);

// reset cascades
code = code.replace(
  /useEffect\(\(\) => \{ setFilterPart\('ALL'\); \}, \[filterCar\]\);/,
  "useEffect(() => { setFilterPart('ALL'); }, [filterCar]);\n  useEffect(() => { setFilterProc('ALL'); }, [filterPart]);"
);

// 5. Add to UI
code = code.replace(
  /<div style=\{\{ display: 'flex', alignItems: 'center', gap: '8px' \}\}>\s*<label style=\{\{ fontSize: '12px', fontWeight: 600, color: '#64748b' \}\}>세부부품<\/label>\s*<select value=\{filterPart\} onChange=\{e => setFilterPart\(e\.target\.value\)\} style=\{.*?\}\>\s*<option value="ALL">전체<\/option>\s*\{partOptions\.map\(o => <option key=\{o\} value=\{o\}>\{o\}<\/option>\)\}\s*<\/select>\s*<\/div>/,
  `$&
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>생산공정</label>
            <select value={filterProc} onChange={e => setFilterProc(e.target.value)} style={{ padding: '6px 28px 6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff', color: '#0f172a', outline: 'none', appearance: 'auto' }}>
              <option value="ALL">전체</option>
              {procOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>`
);

fs.writeFileSync(file, code);
console.log("Dashboard UI patched for processName");
