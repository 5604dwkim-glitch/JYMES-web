const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/ChangePointManagement.jsx');

let content = fs.readFileSync(file, 'utf8');

if (!content.includes("DEFAULT_ITEMS")) {
  content = content.replace(
    "import { CAR_MODELS } from '../constants/masterData';",
    "import { CAR_MODELS, DEFAULT_ITEMS } from '../constants/masterData';"
  );
}

// Update COLUMNS to make partName a select
content = content.replace(
  /{ key: 'partName', label: '품명', width: '120px' },/,
  "{ key: 'partName', label: '품명', type: 'select', width: '120px' },"
);

// Update handleInputChange to clear partName when carModel changes
content = content.replace(
  /if \(key === 'type'\) newData\.issueItem = '';/,
  "if (key === 'type') newData.issueItem = '';\n          if (key === 'carModel') newData.partName = '';"
);
content = content.replace(
  /if \(e\.target\.name === 'type'\) newData\.issueItem = '';/,
  "if (e.target.name === 'type') newData.issueItem = '';\n        if (e.target.name === 'carModel') newData.partName = '';"
);

// Update JSX for NEW Row
content = content.replace(
  /onChange=\{\(e\) => setFormData\(\{\.\.\.formData, \[c\.key\]: e\.target\.value\}\)\}/g,
  (match, offset, str) => {
    // We only want to replace the one inside the carModel block
    return match;
  }
);
// Actually, let's just replace the carModel block in NEW Row to also clear partName
const oldNewRowCarModel = `if (c.key === 'carModel') {
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
const newNewRowCarModel = `if (c.key === 'carModel') {
                      return (
                        <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                          <select 
                            value={formData[c.key] || ''} 
                            onChange={(e) => setFormData({...formData, [c.key]: e.target.value, partName: ''})}
                            style={{ width: '100%', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                          >
                            <option value="">선택</option>
                            {CAR_MODELS.map(car => <option key={car.code} value={car.code}>{car.name}</option>)}
                          </select>
                        </td>
                      );
                    }
                    if (c.key === 'partName') {
                      const options = formData.carModel ? DEFAULT_ITEMS.filter(it => it.carModel === formData.carModel) : [];
                      return (
                        <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                          <select 
                            value={formData[c.key] || ''} 
                            onChange={(e) => {
                               const selectedItem = options.find(it => it.name === e.target.value);
                               setFormData({...formData, [c.key]: e.target.value, itemCode: selectedItem ? selectedItem.code : formData.itemCode});
                            }}
                            style={{ width: '100%', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                          >
                            <option value="">선택</option>
                            {options.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
                          </select>
                        </td>
                      );
                    }`;
content = content.replace(oldNewRowCarModel, newNewRowCarModel);

// Update JSX for Data Row
const oldDataRowCarModel = `if (c.key === 'carModel') {
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
const newDataRowCarModel = `if (c.key === 'carModel') {
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
                          }
                          if (c.key === 'partName') {
                            const currentCarModel = data.find(d => d.id === editingId)?.carModel || '';
                            const options = currentCarModel ? DEFAULT_ITEMS.filter(it => it.carModel === currentCarModel) : [];
                            return (
                              <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                <select 
                                  value={row[c.key] || ''} 
                                  onChange={(e) => {
                                      handleInputChange(e, true, c.key);
                                      const selectedItem = options.find(it => it.name === e.target.value);
                                      if (selectedItem) {
                                          handleInputChange({ target: { name: 'itemCode', value: selectedItem.code } }, true, 'itemCode');
                                      }
                                  }}
                                  style={{ width: '100%', padding: '4px', border: '1px solid #94a3b8', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                                >
                                  <option value="">선택</option>
                                  {options.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
                                </select>
                              </td>
                            );
                          }`;
content = content.replace(oldDataRowCarModel, newDataRowCarModel);

fs.writeFileSync(file, content);
console.log('ChangePointManagement.jsx updated with partName dropdown dependent on carModel (with auto itemCode)!');
