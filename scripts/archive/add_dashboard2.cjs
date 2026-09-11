const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src/components/ChangePointManagement.jsx');
let content = fs.readFileSync(file, 'utf8');

const tabHtml = `
        <button 
          onClick={() => setActiveTab('dashboard')}
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: activeTab === 'dashboard' ? '#2563eb' : '#e2e8f0', color: activeTab === 'dashboard' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer' }}
        >
          📊 기본 대시보드
        </button>
        <button 
          onClick={() => setActiveTab('dashboard2')}
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: activeTab === 'dashboard2' ? '#10b981' : '#e2e8f0', color: activeTab === 'dashboard2' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer' }}
        >
          📈 심층 대시보드 (트렌드&매트릭스)
        </button>
        <button 
          onClick={() => setActiveTab('data')}
`;

content = content.replace(
  /<button\s*onClick=\{\(\) => setActiveTab\('dashboard'\)\}[\s\S]*?<\/button>\s*<button\s*onClick=\{\(\) => setActiveTab\('data'\)\}/,
  tabHtml
);

// We need to inject the Dashboard 2 computations and render.
// Look for where we render tabs:
// } else if (activeTab === 'dashboard') {
//   /* DASHBOARD TAB */
// ...
// } else {
//   /* DATA TAB */

const dashboard2Calc = `
  const dash2Data = useMemo(() => {
    let filtered = data;
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
        startDay = startDay === 0 ? 7 : startDay;
        
        const dateDay = dateObj.getDate();
        const weekNumber = Math.ceil((dateDay + startDay - 1) / 7);
        return (weekNumber + '주차') === filterWeek;
      });
    }

    const total = filtered.length;
    const ceoO = filtered.filter(d => d.ceoCheck === 'O' || d.ceoCheck === '●').length;
    const qualityO = filtered.filter(d => d.qualityCheck === 'O' || d.qualityCheck === '●').length;
    const qPointO = filtered.filter(d => !!d.qPointInstall).length;

    // Trend: count by Date (sorted)
    const trendMap = {};
    filtered.forEach(d => {
      const dateKey = d.date || 'Unknown';
      trendMap[dateKey] = (trendMap[dateKey] || 0) + 1;
    });
    const trendDates = Object.keys(trendMap).sort();
    const trendCounts = trendDates.map(k => trendMap[k]);

    // Matrix: Car Model vs Issue Type
    const matrixMap = {};
    filtered.forEach(d => {
      const car = d.carModel || '미분류';
      const type = d.type || '미상';
      if (!matrixMap[car]) matrixMap[car] = {};
      matrixMap[car][type] = (matrixMap[car][type] || 0) + 1;
    });
    const cars = Object.keys(matrixMap);
    const typesSet = new Set();
    cars.forEach(c => Object.keys(matrixMap[c]).forEach(t => typesSet.add(t)));
    const allTypes = Array.from(typesSet);
    
    // Datasets for Matrix Stacked Bar
    const colors = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];
    const matrixDatasets = allTypes.map((t, i) => {
      return {
        label: t,
        data: cars.map(c => matrixMap[c][t] || 0),
        backgroundColor: colors[i % colors.length]
      };
    });

    return {
      total,
      ceoRate: total ? Math.round((ceoO/total)*100) : 0,
      qualityRate: total ? Math.round((qualityO/total)*100) : 0,
      qPointRate: total ? Math.round((qPointO/total)*100) : 0,
      trendDates,
      trendCounts,
      matrixCars: cars,
      matrixDatasets,
      ceoO, qualityO, qPointO
    };
  }, [data, filterMonth, filterWeek]);
`;

// Insert calculation
content = content.replace(
  /  const pieOptions = \{ responsive: true/,
  dashboard2Calc + '\n  const pieOptions = { responsive: true'
);

const dashboard2UI = `
      ) : activeTab === 'dashboard2' ? (
        /* DASHBOARD 2 TAB (Concept 1+3) */
        <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
          {/* Filters Sidebar (Reused) */}
          <div style={{ width: '200px', background: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowY: 'auto' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '12px' }}>필터</h3>
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
                {weekOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
            {/* KPI Cards (Concept 1) */}
            <div style={{ display: 'flex', gap: '20px', height: '120px' }}>
              <div style={{ flex: 1, background: '#fff', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', padding: '20px', borderLeft: '5px solid #3b82f6', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '14px', color: '#64748b' }}>총 발생 건수</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0f172a' }}>{dash2Data.total}<span style={{fontSize:'16px', color:'#94a3b8', marginLeft:'5px'}}>건</span></div>
              </div>
              <div style={{ flex: 1, background: '#fff', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', padding: '20px', borderLeft: '5px solid #10b981', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '14px', color: '#64748b' }}>공장장 승인 완료율</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0f172a' }}>{dash2Data.ceoRate}<span style={{fontSize:'16px', color:'#94a3b8', marginLeft:'5px'}}>%</span></div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop:'4px' }}>({dash2Data.ceoO} / {dash2Data.total})</div>
              </div>
              <div style={{ flex: 1, background: '#fff', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', padding: '20px', borderLeft: '5px solid #8b5cf6', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '14px', color: '#64748b' }}>품질 검증 완료율</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0f172a' }}>{dash2Data.qualityRate}<span style={{fontSize:'16px', color:'#94a3b8', marginLeft:'5px'}}>%</span></div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop:'4px' }}>({dash2Data.qualityO} / {dash2Data.total})</div>
              </div>
              <div style={{ flex: 1, background: '#fff', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', padding: '20px', borderLeft: '5px solid #f59e0b', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '14px', color: '#64748b' }}>Q-Point 설치율</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0f172a' }}>{dash2Data.qPointRate}<span style={{fontSize:'16px', color:'#94a3b8', marginLeft:'5px'}}>%</span></div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop:'4px' }}>({dash2Data.qPointO} / {dash2Data.total})</div>
              </div>
            </div>

            {/* Middle Row (Line Chart + Stacked Bar) */}
            <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: '300px' }}>
              <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '16px', color: '#64748b', marginBottom: '20px' }}>발생 추이 (일자별 트렌드)</h3>
                <div style={{ height: 'calc(100% - 40px)' }}>
                  <Line 
                    data={{
                      labels: dash2Data.trendDates,
                      datasets: [{
                        label: '발생 건수',
                        data: dash2Data.trendCounts,
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        tension: 0.3,
                        fill: true
                      }]
                    }}
                    options={{ responsive: true, maintainAspectRatio: false }}
                  />
                </div>
              </div>
              
              <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '16px', color: '#64748b', marginBottom: '20px' }}>차종별 변동점 발생 분석 (Matrix View)</h3>
                <div style={{ height: 'calc(100% - 40px)' }}>
                  <Bar 
                    data={{
                      labels: dash2Data.matrixCars,
                      datasets: dash2Data.matrixDatasets
                    }}
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false, 
                      scales: { x: { stacked: true }, y: { stacked: true } }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
`;

// Insert UI
content = content.replace(
  /      \) : \((\s*\/\* DATA TAB \*\/)/,
  dashboard2UI + '$1'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Dashboard 2 (Concept 1+3) added!');
