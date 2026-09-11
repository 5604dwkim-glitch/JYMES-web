const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/ChangePointManagement.jsx');

let content = fs.readFileSync(file, 'utf8');

// Update COLUMNS
content = content.replace(
  /{ key: 'qPointInstall', label: 'Q.POINT 설치여부', width: '120px' }/,
  "{ key: 'qPointInstall', label: 'Q.POINT 설치여부', type: 'checkbox', width: '120px' }"
);
content = content.replace(
  /{ key: 'qPointFile', label: 'Q.POINT 첨부파일', width: '120px' }/,
  "{ key: 'qPointFile', label: 'Q.POINT 첨부파일', type: 'file', width: '160px' }"
);

// Update NEW Row JSX
const newRowCheckboxFile = `
                    if (c.type === 'checkbox') {
                      return (
                        <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center', verticalAlign: 'middle' }}>
                          <input 
                            type="checkbox"
                            checked={!!formData[c.key]}
                            onChange={(e) => setFormData({...formData, [c.key]: e.target.checked})}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                        </td>
                      );
                    }
                    if (c.type === 'file') {
                      return (
                        <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                          {formData.qPointInstall ? (
                            <input 
                              type="file"
                              onChange={(e) => {
                                if(e.target.files.length > 0) {
                                  setFormData({...formData, [c.key]: e.target.files[0].name});
                                }
                              }}
                              style={{ width: '100%', fontSize: '10px' }}
                            />
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '11px' }}>설치 시 등록 가능</span>
                          )}
                        </td>
                      );
                    }
                    return (
`;
content = content.replace(/return \(\s*<td key=\{c.key\} style=\{\{ padding: '4px', border: '1px solid #e2e8f0' \}\}>\s*<input/, newRowCheckboxFile + `                      <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>\n                        <input`);


// Update Data Row JSX
const dataRowCheckboxFile = `
                          if (c.type === 'checkbox') {
                            return (
                              <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center', verticalAlign: 'middle' }}>
                                <input 
                                  type="checkbox"
                                  checked={!!row[c.key]}
                                  onChange={(e) => handleInputChange({ target: { name: c.key, value: e.target.checked } }, true, c.key)}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                              </td>
                            );
                          }
                          if (c.type === 'file') {
                            return (
                              <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                {row.qPointInstall ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                                    <input 
                                      type="file"
                                      onChange={(e) => {
                                        if(e.target.files.length > 0) {
                                          handleInputChange({ target: { name: c.key, value: e.target.files[0].name } }, true, c.key);
                                        }
                                      }}
                                      style={{ width: '100%', fontSize: '10px' }}
                                    />
                                    {row[c.key] && <span style={{ fontSize: '10px', color: '#3b82f6' }}>{row[c.key]}</span>}
                                  </div>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontSize: '11px' }}>-</span>
                                )}
                              </td>
                            );
                          }
                          return (
`;

content = content.replace(/return \(\s*<td key=\{c.key\} style=\{\{ padding: '4px', border: '1px solid #e2e8f0' \}\}>\s*<input/g, (match, offset, str) => {
    if (offset > content.indexOf("data.map")) { // Only replace inside data row mapping
        return dataRowCheckboxFile + `                            <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>\n                              <input`;
    }
    return match;
});

// Update non-editing (read-only) Data Row JSX
const dataRowReadOnlyCheckboxFile = `
                        } else {
                          if (c.type === 'checkbox') {
                            return (
                              <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center', verticalAlign: 'middle' }}>
                                <input type="checkbox" checked={!!row[c.key]} readOnly style={{ width: '16px', height: '16px' }} />
                              </td>
                            );
                          }
                          if (c.type === 'file') {
                            return (
                              <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                {row[c.key] ? <span style={{ fontSize: '11px', color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer' }}>{row[c.key]}</span> : <span style={{ color: '#94a3b8', fontSize: '11px' }}>-</span>}
                              </td>
                            );
                          }
                          return (
`;
content = content.replace(/\} else \{\s*return \(\s*<td key=\{c.key\} style=\{\{ padding: '4px', border: '1px solid #e2e8f0' \}\}>\s*<span/, dataRowReadOnlyCheckboxFile + `                            <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>\n                              <span`);


fs.writeFileSync(file, content);
console.log('ChangePointManagement.jsx updated with checkbox and file upload conditionally logic!');
