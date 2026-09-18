const fs = require('fs');

let file = 'src/components/Dashboard.jsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/const \[chartPeriod, setChartPeriod\] = useState\('weekly'\);/g, "const [chartPeriod, setChartPeriod] = useState('daily');");

code = code.replace(
  /const key = chartPeriod === 'weekly' \? getWeekNo\(new Date\(r\.date\)\) : getMonthStr\(new Date\(r\.date\)\);/g,
  "const key = chartPeriod === 'daily' ? (r.date || '').substring(0,10) : getMonthStr(new Date(r.date));"
);

code = code.replace(
  /if \(labels\.length > 6\) labels = labels\.slice\(-6\);/g,
  "if (chartPeriod === 'daily' && labels.length > 31) labels = labels.slice(-31);\n      if (chartPeriod === 'monthly' && labels.length > 12) labels = labels.slice(-12);"
);

code = code.replace(
  /<button style=\{segBtn\(chartPeriod==='weekly'\)\}  onClick=\{\(\) => setChartPeriod\('weekly'\)\}>최근 6주<\/button>/g,
  "<button style={segBtn(chartPeriod==='daily')}  onClick={() => setChartPeriod('daily')}>최근 1달(일별)</button>"
);

code = code.replace(
  /<button style=\{segBtn\(chartPeriod==='monthly'\)\} onClick=\{\(\) => setChartPeriod\('monthly'\)\}>최근 6개월<\/button>/g,
  "<button style={segBtn(chartPeriod==='monthly')} onClick={() => setChartPeriod('monthly')}>최근 1년(월별)</button>"
);

fs.writeFileSync(file, code);
console.log("Dashboard patched successfully!");
