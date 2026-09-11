const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/ChangePointManagement.jsx');

let content = fs.readFileSync(file, 'utf8');

// 1. Replace COLUMNS
const oldColumnsMatch = content.match(/const COLUMNS = \[[\s\S]*?\];/);
const newColumns = `const COLUMNS = [
  { key: 'date', label: '작성일자', type: 'date', width: '120px' },
  { key: 'type', label: '구분', width: '80px' },
  { key: 'issueItem', label: '발생항목', width: '120px' },
  { key: 'division', label: '사업부', width: '100px' },
  { key: 'plant', label: '사업장', width: '100px' },
  { key: 'clientCode', label: '고객사코드', width: '100px' },
  { key: 'vendor', label: '발생업체', width: '120px' },
  { key: 'specNumber', label: '사양번호', width: '100px' },
  { key: 'qualityManager', label: '품질 담당자', width: '100px' },
  { key: 'carModel', label: '차종', width: '100px' },
  { key: 'itemCode', label: '아이템코드', width: '120px' },
  { key: 'partName', label: '품명', width: '120px' },
  { key: 'details', label: '상세내용', width: '200px' },
  { key: 'actionTime', label: '조치시점', type: 'date', width: '120px' },
  { key: 'actionPlan', label: '조치방안', width: '150px' },
  { key: 'actionResult', label: '조치결과', width: '150px' },
  { key: 'qualityCheck', label: '품질 검증', width: '100px' },
  { key: 'ceoCheck', label: '대표이사 검증', width: '100px' },
  { key: 'qPointInstall', label: 'Q.POINT 설치여부', width: '120px' },
  { key: 'qPointFile', label: 'Q.POINT 첨부파일', width: '120px' },
  { key: 'note', label: '비고', width: '150px' }
];`;
content = content.replace(oldColumnsMatch[0], newColumns);

// 2. Replace Table
const oldTableMatch = content.match(/<table[\s\S]*?<\/table>/);

const newTable = `<table style={{ width: '100%', minWidth: '2400px', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'center' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                {/* Super Header Row */}
                <tr style={{ background: '#eef2ff', borderBottom: '1px solid #cbd5e1' }}>
                  <th rowSpan={2} style={{ padding: '6px', border: '1px solid #cbd5e1', width: '60px' }}>상태</th>
                  <th rowSpan={2} style={{ padding: '6px', border: '1px solid #cbd5e1', width: '60px' }}>삭제</th>
                  <th rowSpan={2} style={{ padding: '6px', border: '1px solid #cbd5e1', width: '50px' }}>No.</th>
                  <th colSpan={13} style={{ padding: '6px', border: '1px solid #cbd5e1' }}>발생내역</th>
                  <th colSpan={5} style={{ padding: '6px', border: '1px solid #cbd5e1' }}>조치결과</th>
                  <th colSpan={2} style={{ padding: '6px', border: '1px solid #cbd5e1' }}>Q POINT</th>
                  <th rowSpan={2} style={{ padding: '6px', border: '1px solid #cbd5e1', width: '150px' }}>비고</th>
                </tr>
                {/* Sub Header Row */}
                <tr style={{ background: '#eef2ff', borderBottom: '2px solid #cbd5e1' }}>
                  {COLUMNS.slice(0, 13).map(c => (
                    <th key={c.key} style={{ padding: '6px', border: '1px solid #cbd5e1', width: c.width }}>{c.label}</th>
                  ))}
                  {COLUMNS.slice(13, 18).map(c => (
                    <th key={c.key} style={{ padding: '6px', border: '1px solid #cbd5e1', width: c.width }}>{c.label}</th>
                  ))}
                  {COLUMNS.slice(18, 20).map(c => (
                    <th key={c.key} style={{ padding: '6px', border: '1px solid #cbd5e1', width: c.width }}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Add New Row */}
                <tr style={{ background: '#fffbeb' }}>
                  <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                    <button onClick={handleAdd} style={{ padding: '4px 8px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>저장</button>
                  </td>
                  <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}></td>
                  <td style={{ padding: '4px', border: '1px solid #e2e8f0', fontWeight: 'bold' }}>NEW</td>
                  {COLUMNS.map(c => (
                    <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                      <input 
                        type={c.type || 'text'}
                        value={formData[c.key] || ''}
                        onChange={(e) => setFormData({...formData, [c.key]: e.target.value})}
                        style={{ width: '100%', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                      />
                    </td>
                  ))}
                </tr>

                {/* Data Rows */}
                {data.map((row, index) => {
                  const isEditing = editingId === row.id;
                  return (
                    <tr key={row.id} style={{ '&:hover': { background: '#f8fafc' } }}>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '2px', justifyContent: 'center' }}>
                            <button onClick={() => handleUpdate(row)} style={{ padding: '2px 6px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '10px' }}>확인</button>
                            <button onClick={() => setEditingId(null)} style={{ padding: '2px 6px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '2px', cursor: 'pointer', fontSize: '10px' }}>취소</button>
                          </div>
                        ) : (
                          <button onClick={() => setEditingId(row.id)} style={{ padding: '4px 8px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>수정</button>
                        )}
                      </td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                        {isEditing ? null : (
                          <button onClick={() => handleDelete(row.id)} style={{ padding: '4px 8px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>삭제</button>
                        )}
                      </td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>{index + 1}</td>
                      {COLUMNS.map(c => (
                        <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                          {isEditing ? (
                            <input 
                              type={c.type || 'text'}
                              value={row[c.key] || ''}
                              onChange={(e) => handleInputChange(e, true, c.key)}
                              style={{ width: '100%', padding: '4px', border: '1px solid #94a3b8', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                            />
                          ) : (
                            <span style={{ wordBreak: 'break-all' }}>{row[c.key]}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length + 3} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>등록된 데이터가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>`;

content = content.replace(oldTableMatch[0], newTable);
fs.writeFileSync(file, content);
console.log('ChangePointManagement.jsx updated.');
