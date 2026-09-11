const fs = require('fs');
let code = fs.readFileSync('src/components/ReportList.jsx', 'utf8');

// 1. Bulk action buttons hide for workers
code = code.replace(
  /<div style={{ display: 'flex', gap: '8px' }}>\s*<button className="btn btn-info btn-sm"/,
  '<div style={{ display: \'flex\', gap: \'8px\' }}>\n          {userRole?.role !== \'worker\' && (\n            <>\n              <button className="btn btn-info btn-sm"'
);
code = code.replace(
  /<button className="btn btn-danger btn-sm" onClick=\{handleBulkDelete\}>선택 항목 일괄 삭제<\/button>\s*<\/div>/,
  '<button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>선택 항목 일괄 삭제</button>\n            </>\n          )}\n        </div>'
);

// 2. Import fetchWorkers
code = code.replace(
  /fetchReports, deleteReport, bulkApproveReports, bulkDeleteReports } from '\.\.\/services\/firestore';/,
  'fetchReports, deleteReport, bulkApproveReports, bulkDeleteReports, fetchWorkers } from \'../services/firestore\';'
);

// 3. Add states and toggle function
code = code.replace(
  /const \[selectedReportForModal, setSelectedReportForModal\] = useState\(null\);/,
  `const [selectedReportForModal, setSelectedReportForModal] = useState(null);

  const [viewMode, setViewMode] = useState('list');
  const [allWorkers, setAllWorkers] = useState([]);
  const [workersFetched, setWorkersFetched] = useState(false);

  const toggleViewMode = async () => {
    if (viewMode === 'list') {
      if (!workersFetched) {
        const w = await fetchWorkers();
        setAllWorkers(w);
        setWorkersFetched(true);
      }
      setViewMode('board');
    } else {
      setViewMode('list');
    }
  };`
);

// 4. Add toggle button
code = code.replace(
  /<button className="btn btn-secondary btn-sm" onClick=\{handleResetFilters\}>초기화<\/button>/,
  `{userRole?.role !== 'worker' && (
            <button className="btn btn-outline-primary btn-sm" onClick={toggleViewMode}>
              {viewMode === 'list' ? '🪧 제출 현황 보드' : '📋 리스트 보기'}
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={handleResetFilters}>초기화</button>`
);

// 5. Add Board View rendering
const boardHtml = `
      {viewMode === 'board' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px', padding: '16px', backgroundColor: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          {allWorkers.map(w => {
            const hasSubmitted = filteredReports.some(r => r.workerName === w.name);
            return (
              <div 
                key={w.id} 
                onClick={() => { setSearchQuery(w.name); setViewMode('list'); }}
                style={{ 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '12px', 
                  padding: '24px 16px', 
                  textAlign: 'center', 
                  backgroundColor: hasSubmitted ? '#f0fdf4' : '#fef2f2', 
                  cursor: 'pointer', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '32px' }}>{hasSubmitted ? '✅' : '❌'}</div>
                <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#334155' }}>{w.name}</div>
                <div style={{ fontSize: '12px', color: hasSubmitted ? '#166534' : '#991b1b', fontWeight: '700' }}>
                  {hasSubmitted ? '제출 완료' : '미제출'}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
      <div className="table-container">`;

code = code.replace(
  /<div className="table-container">/,
  boardHtml
);

// 6. Close the condition
code = code.replace(
  /<\/div>\n\n      <LegacyDetailModal/,
  `</div>\n      )}\n\n      <LegacyDetailModal`
);

fs.writeFileSync('src/components/ReportList.jsx', code);
