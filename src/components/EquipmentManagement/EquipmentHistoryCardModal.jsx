import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import EquipmentRepairRequestModal from './EquipmentRepairRequestModal';

const addThreeMonths = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  d.setMonth(d.getMonth() + 3);
  return d.toISOString().split("T")[0];
};

export default function EquipmentHistoryCardModal({ equipment, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    manufacturingDate: equipment.manufacturingDate || '',
    manufacturer: equipment.manufacturer || '',
    ancillaryEquipments: equipment.ancillaryEquipments || [
      { name: '', spec: '', qty: '', manufacturer: '', note: '' },
      { name: '', spec: '', qty: '', manufacturer: '', note: '' },
      { name: '', spec: '', qty: '', manufacturer: '', note: '' },
      { name: '', spec: '', qty: '', manufacturer: '', note: '' }
    ],
    history: equipment.history || [],
    equipmentPhoto: equipment.equipmentPhoto || ''
  });

      const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, equipmentPhoto: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };
  const [editingRepairIndex, setEditingRepairIndex] = useState(null);
  const [selectedIndices, setSelectedIndices] = useState([]);

  const toggleSelection = (index) => {
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter(i => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIndices.length === 0) {
      alert("삭제할 항목을 선택해주세요.");
      return;
    }
    if (!window.confirm("선택한 이력을 삭제하시겠습니까?")) return;
    const newHistory = formData.history.filter((_, i) => !selectedIndices.includes(i));
    
    try {
      const equipmentRef = doc(db, 'equipments', equipment.id);
      await updateDoc(equipmentRef, { history: newHistory });
      setFormData({ ...formData, history: newHistory });
      setSelectedIndices([]);
      onUpdate({ ...equipment, history: newHistory });
    } catch (e) {
      console.error(e);
      alert("삭제 실패!");
    }
  };

  const handleSaveRepairFromHistory = (index, repairData) => {
    const newHistory = [...formData.history];
    newHistory[index] = {
      ...newHistory[index],
      issue: repairData.requestContent,
      action: repairData.actionContent,
      repairDetails: repairData
    };
    setFormData({ ...formData, history: newHistory });
    setEditingRepairIndex(null);
  };

  const handleSave = async () => {
    try {
      const equipmentRef = doc(db, 'equipments', equipment.id);
      await updateDoc(equipmentRef, {
        manufacturingDate: formData.manufacturingDate,
        manufacturer: formData.manufacturer,
        ancillaryEquipments: formData.ancillaryEquipments,
        history: formData.history, 
        equipmentPhoto: formData.equipmentPhoto
      });
      onUpdate({ ...equipment, ...formData });
      onClose();
    } catch (e) {
      console.error('Failed to update equipment history:', e);
      alert('저장 실패!');
    }
  };

  const addHistoryRow = () => {
    setFormData({
      ...formData,
      history: [...formData.history, { date: '', issue: '', action: '', attachment: '', confirmed: false }]
    });
  };

  const updateHistory = (index, field, value) => {
    const newHistory = [...formData.history];
    newHistory[index][field] = value;
    setFormData({ ...formData, history: newHistory });
  };

  const labelStyle = { background: '#f1f5f9', fontWeight: 'bold', color: '#334155', borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '10px 16px', textAlign: 'center', width: '25%' };
  const valStyle = { borderBottom: '1px solid #cbd5e1', padding: '10px 16px', textAlign: 'center', color: '#0f172a' };
  const inputStyle = { width: '100%', border: '1px solid #cbd5e1', padding: '6px', textAlign: 'center', borderRadius: '4px', outline: 'none', color: '#0f172a' };
  const tableInputStyle = { width: '100%', border: '1px solid transparent', padding: '6px', outline: 'none', background: 'transparent', color: '#0f172a' };

  return (
    <div className="modal-backdrop active" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ maxWidth: '900px', maxHeight: '95vh', display: 'flex', flexDirection: 'column', padding: '0', borderRadius: '12px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header" style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="modal-title" style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📄</span> 설비 이력 카드 상세 정보
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '24px', color: '#64748b', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '24px', background: '#ffffff' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 0 40px', letterSpacing: '4px', color: '#000' }}>(제조) 설비이력카드</h2>
            <table style={{ borderCollapse: 'collapse', border: '1px solid #000', fontSize: '14px', width: '200px', textAlign: 'center' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>작성</td>
                  <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>검토</td>
                  <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>승인</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', height: '40px' }}></td>
                  <td style={{ border: '1px solid #000', height: '40px' }}></td>
                  <td style={{ border: '1px solid #000', height: '40px' }}></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ border: '2px solid #000', marginBottom: '24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '14px' }}>
              <tbody>
                <tr>
                  <th style={{ border: '1px solid #000', padding: '8px', width: '15%', background: '#fff' }}>설 비 명</th>
                  <td style={{ border: '1px solid #000', padding: '8px', width: '35%' }}>{equipment.name}</td>
                  <th style={{ border: '1px solid #000', padding: '8px', width: '15%', background: '#fff' }}>설 비 번 호</th>
                  <td style={{ border: '1px solid #000', padding: '8px', width: '35%' }}>{equipment.code}</td>
                </tr>
                <tr>
                  <th style={{ border: '1px solid #000', padding: '8px', background: '#fff' }}>형 식</th>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{equipment.type}</td>
                  <th style={{ border: '1px solid #000', padding: '8px', background: '#fff' }}>능 력</th>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{equipment.spec}</td>
                </tr>
                <tr>
                  <th style={{ border: '1px solid #000', padding: '8px', background: '#fff' }}>설 치 일</th>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{equipment.installDate}</td>
                  <th style={{ border: '1px solid #000', padding: '8px', background: '#fff' }}>제 작 일</th>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>
                    <input type="date" style={{ width: '100%', border: 'none', textAlign: 'center', outline: 'none', background: 'transparent' }} value={formData.manufacturingDate} onChange={e => setFormData({...formData, manufacturingDate: e.target.value})} />
                  </td>
                </tr>
                <tr>
                  <th style={{ border: '1px solid #000', padding: '8px', background: '#fff' }}>제 작 처</th>
                  <td colSpan="3" style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', paddingLeft: '16px' }}>
                    <input type="text" style={{ width: '100%', border: 'none', textAlign: 'left', outline: 'none', background: 'transparent' }} value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} />
                  </td>
                </tr>
                <tr>
                  <th colSpan="4" style={{ border: '1px solid #000', padding: '12px', background: '#fff', letterSpacing: '16px' }}>부 대 설 비</th>
                </tr>
              </tbody>
            </table>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px', marginTop: '-1px' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #000', padding: '8px', width: '20%', background: '#fff' }}>설 비 명</th>
                  <th style={{ border: '1px solid #000', padding: '8px', width: '30%', background: '#fff' }}>형식 및 규격</th>
                  <th style={{ border: '1px solid #000', padding: '8px', width: '10%', background: '#fff' }}>수 량</th>
                  <th style={{ border: '1px solid #000', padding: '8px', width: '20%', background: '#fff' }}>제 작 처</th>
                  <th style={{ border: '1px solid #000', padding: '8px', width: '20%', background: '#fff' }}>비 고</th>
                </tr>
              </thead>
              <tbody>
                {formData.ancillaryEquipments.map((eq, i) => (
                  <tr key={i}>
                    <td style={{ border: '1px solid #000', padding: '4px' }}>
                      <input type="text" style={tableInputStyle} value={eq.name} onChange={e => {
                        const newAnc = [...formData.ancillaryEquipments];
                        newAnc[i].name = e.target.value;
                        setFormData({...formData, ancillaryEquipments: newAnc});
                      }} />
                    </td>
                    <td style={{ border: '1px solid #000', padding: '4px' }}>
                      <input type="text" style={tableInputStyle} value={eq.spec} onChange={e => {
                        const newAnc = [...formData.ancillaryEquipments];
                        newAnc[i].spec = e.target.value;
                        setFormData({...formData, ancillaryEquipments: newAnc});
                      }} />
                    </td>
                    <td style={{ border: '1px solid #000', padding: '4px' }}>
                      <input type="text" style={tableInputStyle} value={eq.qty} onChange={e => {
                        const newAnc = [...formData.ancillaryEquipments];
                        newAnc[i].qty = e.target.value;
                        setFormData({...formData, ancillaryEquipments: newAnc});
                      }} />
                    </td>
                    <td style={{ border: '1px solid #000', padding: '4px' }}>
                      <input type="text" style={tableInputStyle} value={eq.manufacturer} onChange={e => {
                        const newAnc = [...formData.ancillaryEquipments];
                        newAnc[i].manufacturer = e.target.value;
                        setFormData({...formData, ancillaryEquipments: newAnc});
                      }} />
                    </td>
                    <td style={{ border: '1px solid #000', padding: '4px' }}>
                      <input type="text" style={tableInputStyle} value={eq.note} onChange={e => {
                        const newAnc = [...formData.ancillaryEquipments];
                        newAnc[i].note = e.target.value;
                        setFormData({...formData, ancillaryEquipments: newAnc});
                      }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px', marginTop: '-1px' }}>
              <tbody>
                <tr>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', background: '#fff' }}>설비사진</th>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '16px', position: 'relative' }}>
                    <div style={{ width: '100%', minHeight: '300px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8fafc', position: 'relative' }}>
                      {formData.equipmentPhoto ? (
                        <img src={formData.equipmentPhoto} alt="설비 사진" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                      ) : (
                        <span style={{ color: '#94a3b8' }}>클릭하여 사진 업로드</span>
                      )}
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>
                    ※ 특 기 사 항
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 2 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#2563eb', fontWeight: 'bold', fontSize: '14px' }}>
              <span>📝</span> 2. 수리 및 점검 이력
            </div>

            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#334155' }}>
                    <th rowSpan="2" style={{ borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '12px 4px', width: '4%' }}>
                      <input type="checkbox" onChange={(e) => {
                        if (e.target.checked) setSelectedIndices(formData.history.map((_, i) => i));
                        else setSelectedIndices([]);
                      }} checked={formData.history.length > 0 && selectedIndices.length === formData.history.length} />
                    </th>
                    <th rowSpan="2" style={{ borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '12px 8px', width: '13%', fontWeight: 'bold' }}>일 자</th>
                    <th colSpan="3" style={{ borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '8px', letterSpacing: '4px', fontWeight: 'bold' }}>금 형 이 력</th>
                    <th rowSpan="2" style={{ borderBottom: '1px solid #cbd5e1', padding: '12px 8px', width: '8%', fontWeight: 'bold' }}>확인</th>
                  </tr>
                  <tr style={{ background: '#f8fafc', color: '#334155' }}>
                    <th style={{ borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '8px', width: '30%', fontWeight: '600' }}>문제점 및 내용</th>
                    <th style={{ borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '8px', width: '30%', fontWeight: '600' }}>대책 및 조치사항</th>
                    <th style={{ borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '8px', width: '15%', fontWeight: '600' }}>수리의뢰서<br/>첨부파일</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.history.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #cbd5e1' }}>
                      <td style={{ borderRight: '1px solid #cbd5e1', padding: '4px' }}>
                        <input type="checkbox" checked={selectedIndices.includes(i)} onChange={() => toggleSelection(i)} />
                      </td>
                      <td style={{ borderRight: '1px solid #cbd5e1', padding: '4px' }}>
                        <input type="date" max="9999-12-31" style={{...tableInputStyle, textAlign: 'center'}} value={row.date} onChange={e => updateHistory(i, 'date', e.target.value)} />
                      </td>
                      <td style={{ borderRight: '1px solid #cbd5e1', padding: '4px' }}>
                        <input type="text" style={tableInputStyle} value={row.issue} onChange={e => updateHistory(i, 'issue', e.target.value)} placeholder="내용 입력..." />
                      </td>
                      <td style={{ borderRight: '1px solid #cbd5e1', padding: '4px' }}>
                        <input type="text" style={tableInputStyle} value={row.action} onChange={e => updateHistory(i, 'action', e.target.value)} placeholder="조치 내용..." />
                      </td>
                      <td style={{ borderRight: '1px solid #cbd5e1', padding: '4px' }}>
                        {row.repairDetails ? (
                          <button 
                            onClick={() => setEditingRepairIndex(i)}
                            style={{ 
                              width: '100%', 
                              padding: '6px', 
                              background: row.repairDetails.repairStatus === '완료' ? '#2563eb' : '#f59e0b', 
                              color: '#fff', 
                              border: 'none', 
                              borderRadius: '4px', 
                              cursor: 'pointer', 
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                          >
                            {row.repairDetails.repairStatus === '완료' ? '수리완료' : '수리의뢰요청'}
                          </button>
                        ) : (
                          <button 
                            onClick={() => setEditingRepairIndex(i)}
                            style={{ width: '100%', padding: '6px', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                          >
                            수리의뢰 작성
                          </button>
                        )}
                      </td>
                      <td style={{ padding: '4px', fontWeight: 'bold', color: '#2563eb' }}>
                        {(row.issue || row.repairDetails) ? '승인' : ''}
                      </td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(1, 10 - formData.history.length) }).map((_, i) => (
                    <tr key={`empty-${i}`} style={{ borderBottom: '1px solid #cbd5e1' }}>
                      <td style={{ borderRight: '1px solid #cbd5e1', padding: '16px' }}></td>
                      <td style={{ borderRight: '1px solid #cbd5e1', padding: '16px' }}></td>
                      <td style={{ borderRight: '1px solid #cbd5e1', padding: '16px' }}></td>
                      <td style={{ borderRight: '1px solid #cbd5e1', padding: '16px' }}></td>
                      <td style={{ borderRight: '1px solid #cbd5e1', padding: '16px' }}></td>
                      <td style={{ padding: '16px' }}></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ marginTop: '12px', textAlign: 'left' }}>
              <button className="btn btn-sm" style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', fontWeight: 'bold', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }} onClick={addHistoryRow}>
                + 이력 행 추가
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '8px 24px', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>닫기</button>
          <button className="btn" onClick={handleDeleteSelected} style={{ padding: '8px 24px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>삭제</button>
          <button className="btn btn-primary" onClick={handleSave} style={{ padding: '8px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>저장</button>
        </div>
        
      </div>
      {editingRepairIndex !== null && (
        <EquipmentRepairRequestModal
          equipment={equipment}
          initialData={formData.history[editingRepairIndex].repairDetails}
          onClose={() => setEditingRepairIndex(null)}
          onSave={(data) => handleSaveRepairFromHistory(editingRepairIndex, data)}
        />
      )}
    </div>
  );
}
