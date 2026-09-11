const fs = require('fs');
let code = fs.readFileSync('src/components/ReportList.jsx', 'utf8');

const buttonToRemove = `          <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px', marginLeft: '-4px', marginRight: '4px' }}>
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
          </div>\n`;

// 1. Remove the button from its current location
if (code.includes(buttonToRemove)) {
    code = code.replace(buttonToRemove, '');
} else {
    console.error("Could not find button to remove");
}

// 2. Insert it before the toggleViewMode button
const insertionPoint = `{userRole?.role !== 'worker' && (`;
const buttonToInsert = `          <button 
            className="btn btn-outline-secondary btn-sm" 
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setStartDate(today);
              setEndDate(today);
            }}
          >
            당일작성 조회
          </button>\n          `;

if (code.includes(insertionPoint)) {
    code = code.replace(insertionPoint, buttonToInsert + insertionPoint);
} else {
    console.error("Could not find insertion point");
}

fs.writeFileSync('src/components/ReportList.jsx', code);
console.log("Successfully moved the button.");
