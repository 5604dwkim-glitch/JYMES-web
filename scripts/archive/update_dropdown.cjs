const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/ChangePointManagement.jsx');

let content = fs.readFileSync(file, 'utf8');

// 1. Add ISSUE_CATEGORY_MAP
const mapCode = `
const ISSUE_CATEGORY_MAP = {
  '4M': [
    '특별특성 공정 작업자 변경',
    '실명제 제외 인원 공정 투입',
    '금형, 지그 신작',
    '장기 유휴 설비,금형,지그 사용',
    '설비 용량 변경',
    'SUB품 재질 변경',
    'ALT 재질 적용',
    '특수강/철분말 공급처 변경',
    '원자재 사급 변경',
    '고객 포장 사양 변경',
    '공급사 변경',
    '근무형태 조건 변경',
    '작업방법 변경',
    '생산라인 위치 변경',
    '공장 생산 위치 변경',
    '공정조건 변경',
    '미승인된 협력사 자체도면',
    '관리계획서 상이한 기준',
    '검사협정서 상이한 기준'
  ],
  '변동점': [
    '작업자 임시 대체',
    '작업자 근무 교대시간 변경',
    '작업자 역할 분담 변경',
    '툴(공구) 변경',
    '동일 조건의 설비/라인 변경',
    '도장/토출 조건 변경',
    '작업 속도/주기 변경',
    '설비 온도/압력 변경',
    '작업 각도/방식 변경',
    '그리스/윤활유 정기보충(교체)',
    '냉각수/워터호스 정기보충(교체)',
    '설비 부자재 정기교체',
    '단전/단수 발생',
    '파업 발생',
    '물류/파레트 변경',
    '2/3차사 입고품 변경',
    '상기 16항목 외'
  ]
};
`;

if (!content.includes('ISSUE_CATEGORY_MAP')) {
  content = content.replace(/const COLUMNS = \[/, mapCode + '\nconst COLUMNS = [');
}

// 2. Change COLUMNS
content = content.replace(/{ key: 'type', label: '구분', width: '80px' },/, "{ key: 'type', label: '구분', type: 'select', width: '80px' },");
content = content.replace(/{ key: 'issueItem', label: '발생항목', width: '120px' },/, "{ key: 'issueItem', label: '발생항목', type: 'select', width: '120px' },");

// 3. handleInputChange modification to clear issueItem when type changes
const oldHandleInput = `const handleInputChange = (e, isEdit = false, key = '') => {
    if (isEdit) {
      setData(prev => prev.map(item => item.id === editingId ? { ...item, [key]: e.target.value } : item));
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };`;
const newHandleInput = `const handleInputChange = (e, isEdit = false, key = '') => {
    if (isEdit) {
      setData(prev => prev.map(item => {
        if (item.id === editingId) {
          const newData = { ...item, [key]: e.target.value };
          if (key === 'type') newData.issueItem = '';
          return newData;
        }
        return item;
      }));
    } else {
      setFormData(prev => {
        const newData = { ...prev, [e.target.name]: e.target.value };
        if (e.target.name === 'type') newData.issueItem = '';
        return newData;
      });
    }
  };`;
content = content.replace(oldHandleInput, newHandleInput);

// 4. Update JSX renderer in NEW row
const oldNewRowMap = `{COLUMNS.map(c => (
                    <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                      <input 
                        type={c.type || 'text'}
                        value={formData[c.key] || ''}
                        onChange={(e) => setFormData({...formData, [c.key]: e.target.value})}
                        style={{ width: '100%', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                      />
                    </td>
                  ))}`;

const newNewRowMap = `{COLUMNS.map(c => {
                    if (c.key === 'type') {
                      return (
                        <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                          <select 
                            value={formData[c.key] || ''} 
                            onChange={(e) => setFormData({...formData, [c.key]: e.target.value, issueItem: ''})}
                            style={{ width: '100%', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                          >
                            <option value="">선택</option>
                            <option value="4M">4M</option>
                            <option value="변동점">변동점</option>
                          </select>
                        </td>
                      );
                    }
                    if (c.key === 'issueItem') {
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
                    return (
                      <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                        <input 
                          type={c.type || 'text'}
                          value={formData[c.key] || ''}
                          onChange={(e) => setFormData({...formData, [c.key]: e.target.value})}
                          style={{ width: '100%', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                        />
                      </td>
                    );
                  })}`;

content = content.replace(oldNewRowMap, newNewRowMap);


// 5. Update JSX renderer in Data rows
const oldDataRowMap = `{COLUMNS.map(c => (
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
                      ))}`;

const newDataRowMap = `{COLUMNS.map(c => {
                        if (isEditing) {
                          if (c.key === 'type') {
                            return (
                              <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                <select 
                                  value={row[c.key] || ''} 
                                  onChange={(e) => handleInputChange(e, true, c.key)}
                                  style={{ width: '100%', padding: '4px', border: '1px solid #94a3b8', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                                >
                                  <option value="">선택</option>
                                  <option value="4M">4M</option>
                                  <option value="변동점">변동점</option>
                                </select>
                              </td>
                            );
                          }
                          if (c.key === 'issueItem') {
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
                          return (
                            <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                              <input 
                                type={c.type || 'text'}
                                value={row[c.key] || ''}
                                onChange={(e) => handleInputChange(e, true, c.key)}
                                style={{ width: '100%', padding: '4px', border: '1px solid #94a3b8', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                              />
                            </td>
                          );
                        } else {
                          return (
                            <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                              <span style={{ wordBreak: 'break-all' }}>{row[c.key]}</span>
                            </td>
                          );
                        }
                      })}`;

content = content.replace(oldDataRowMap, newDataRowMap);

fs.writeFileSync(file, content);
console.log('ChangePointManagement.jsx updated with dependent dropdowns!');
