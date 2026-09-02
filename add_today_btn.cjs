const fs = require('fs');
let code = fs.readFileSync('src/components/ReportList.jsx', 'utf8');

const targetStr = `<div className="form-group" style={{ minWidth: '120px' }}>
            <label style={{ fontSize: '11px' }}>종료일</label>
            <input type="date" max="9999-12-31" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ minWidth: '110px' }}>
            <label style={{ fontSize: '11px', color: 'var(--accent-emerald)' }}>차종</label>`;

const replaceStr = `<div className="form-group" style={{ minWidth: '120px' }}>
            <label style={{ fontSize: '11px' }}>종료일</label>
            <input type="date" max="9999-12-31" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
            <button 
              className="btn btn-outline-secondary btn-sm" 
              style={{ height: '28px', fontSize: '11px', padding: '0 8px' }}
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setStartDate(today);
                setEndDate(today);
              }}
            >
              당일작성 조회
            </button>
          </div>
          <div className="form-group" style={{ minWidth: '110px' }}>
            <label style={{ fontSize: '11px', color: 'var(--accent-emerald)' }}>차종</label>`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, replaceStr);
    fs.writeFileSync('src/components/ReportList.jsx', code);
    console.log("Success");
} else {
    console.log("Target string not found!");
}
