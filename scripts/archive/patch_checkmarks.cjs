const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'ChangePointManagement.jsx');
let code = fs.readFileSync(filePath, 'utf8');

code = code.replace(
  "{ key: 'qualityCheck', label: '품질 검증', width: '100px' },",
  "{ key: 'qualityCheck', label: '품질 검증', type: 'checkbox', width: '100px' },"
);
code = code.replace(
  "{ key: 'ceoCheck', label: '대표이사 검증', width: '100px' },",
  "{ key: 'ceoCheck', label: '대표이사 검증', type: 'checkbox', width: '100px' },"
);

const readOnlySectionTarget = \
                          if (c.type === 'checkbox') {
                            return (
                              <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center', verticalAlign: 'middle' }}>
                                <input type="checkbox" checked={!!row[c.key]} readOnly style={{ width: '16px', height: '16px' }} />
                              </td>
                            );
                          }
\;
const readOnlySectionReplacement = \
                          if (c.key === 'qualityCheck' || c.key === 'ceoCheck') {
                            return (
                              <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center', verticalAlign: 'middle' }}>
                                {row[c.key] ? (
                                  <div style={{
                                    display: 'inline-block',
                                    border: '2px solid #ef4444',
                                    color: '#ef4444',
                                    padding: '2px 6px',
                                    fontWeight: '700',
                                    fontSize: '11px',
                                    borderRadius: '2px'
                                  }}>
                                    확인
                                  </div>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontSize: '11px' }}>-</span>
                                )}
                              </td>
                            );
                          }
                          if (c.type === 'checkbox') {
                            return (
                              <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center', verticalAlign: 'middle' }}>
                                <input type="checkbox" checked={!!row[c.key]} readOnly style={{ width: '16px', height: '16px' }} />
                              </td>
                            );
                          }
\;

if (code.includes(readOnlySectionTarget)) {
    code = code.replace(readOnlySectionTarget, readOnlySectionReplacement);
    fs.writeFileSync(filePath, code, 'utf8');
    console.log('Patched checkmarks successfully.');
} else {
    console.error("Could not find readOnlySectionTarget");
}
