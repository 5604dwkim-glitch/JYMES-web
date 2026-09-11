const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/ChangePointManagement.jsx');

let content = fs.readFileSync(file, 'utf8');

// 1. Add Import
if (!content.includes("import { CAR_MODELS }")) {
  content = content.replace(
    "import { fetchChangePoints, addChangePoint, updateChangePoint, deleteChangePoint } from '../services/firestore';",
    "import { fetchChangePoints, addChangePoint, updateChangePoint, deleteChangePoint } from '../services/firestore';\nimport { CAR_MODELS } from '../constants/masterData';"
  );
}

// 2. Change COLUMNS
content = content.replace(
  /{ key: 'carModel', label: '차종', width: '100px' },/,
  "{ key: 'carModel', label: '차종', type: 'select', width: '100px' },"
);

// 3. Update JSX for NEW Row
const oldNewRowIssue = `if (c.key === 'issueItem') {
                      const options = formData.type ? ISSUE_CATEGORY_MAP[formData.type] || [] : [];
                      return (
                        <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                          <select 
                            value={formData[c.key] || ''} 
                            onChange={(e) => setFormData({...formData, [c.key]: e.target.value})}
                            style={{ width: '100%', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                          >
                            <option value="">선택</option>
                            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </td>
                      );
                    }`;

const newNewRowIssue = `if (c.key === 'issueItem') {
                      const options = formData.type ? ISSUE_CATEGORY_MAP[formData.type] || [] : [];
                      return (
                        <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                          <select 
                            value={formData[c.key] || ''} 
                            onChange={(e) => setFormData({...formData, [c.key]: e.target.value})}
                            style={{ width: '100%', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                          >
                            <option value="">선택</option>
                            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </td>
                      );
                    }
                    if (c.key === 'carModel') {
                      return (
                        <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                          <select 
                            value={formData[c.key] || ''} 
                            onChange={(e) => setFormData({...formData, [c.key]: e.target.value})}
                            style={{ width: '100%', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                          >
                            <option value="">선택</option>
                            {CAR_MODELS.map(car => <option key={car.code} value={car.code}>{car.name}</option>)}
                          </select>
                        </td>
                      );
                    }`;

content = content.replace(oldNewRowIssue, newNewRowIssue);

// 4. Update JSX for Data Row
const oldDataRowIssue = `if (c.key === 'issueItem') {
                            const currentType = data.find(d => d.id === editingId)?.type || '';
                            const options = currentType ? ISSUE_CATEGORY_MAP[currentType] || [] : [];
                            return (
                              <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                <select 
                                  value={row[c.key] || ''} 
                                  onChange={(e) => handleInputChange(e, true, c.key)}
                                  style={{ width: '100%', padding: '4px', border: '1px solid #94a3b8', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                                >
                                  <option value="">선택</option>
                                  {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              </td>
                            );
                          }`;

const newDataRowIssue = `if (c.key === 'issueItem') {
                            const currentType = data.find(d => d.id === editingId)?.type || '';
                            const options = currentType ? ISSUE_CATEGORY_MAP[currentType] || [] : [];
                            return (
                              <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                <select 
                                  value={row[c.key] || ''} 
                                  onChange={(e) => handleInputChange(e, true, c.key)}
                                  style={{ width: '100%', padding: '4px', border: '1px solid #94a3b8', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                                >
                                  <option value="">선택</option>
                                  {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              </td>
                            );
                          }
                          if (c.key === 'carModel') {
                            return (
                              <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                <select 
                                  value={row[c.key] || ''} 
                                  onChange={(e) => handleInputChange(e, true, c.key)}
                                  style={{ width: '100%', padding: '4px', border: '1px solid #94a3b8', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                                >
                                  <option value="">선택</option>
                                  {CAR_MODELS.map(car => <option key={car.code} value={car.code}>{car.name}</option>)}
                                </select>
                              </td>
                            );
                          }`;

content = content.replace(oldDataRowIssue, newDataRowIssue);

fs.writeFileSync(file, content);
console.log('ChangePointManagement.jsx updated with carModel dropdown!');
