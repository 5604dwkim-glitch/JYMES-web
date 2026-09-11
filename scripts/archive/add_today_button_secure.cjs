const fs = require('fs');
let code = fs.readFileSync('src/components/ReportList.jsx', 'utf8');

const lines = code.split('\n');
const insertIndex = lines.findIndex(l => l.includes('onChange={e => setEndDate(e.target.value)} />')) + 2;

const buttonHtml = `          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px', marginLeft: '-4px', marginRight: '4px' }}>
            <button 
              className="btn btn-outline-secondary btn-sm" 
              style={{ height: '34px', fontSize: '11px', padding: '0 8px' }}
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                setStartDate(today);
                setEndDate(today);
              }}
            >
              당일작성 조회
            </button>
          </div>`;

lines.splice(insertIndex, 0, buttonHtml);

fs.writeFileSync('src/components/ReportList.jsx', lines.join('\n'));
console.log('Button inserted at index', insertIndex);
