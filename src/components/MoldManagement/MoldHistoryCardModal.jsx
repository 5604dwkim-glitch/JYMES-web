import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import MoldRepairRequestModal from './MoldRepairRequestModal';

export default function MoldHistoryCardModal({ mold, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    receiptDate: mold.receiptDate || '',
    productionStartDate: mold.productionStartDate || '',
    manufacturer: mold.manufacturer || '',
    history: mold.history || []
  });

  const [editingRepairIndex, setEditingRepairIndex] = useState(null);

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
      const moldRef = doc(db, 'molds', mold.id);
      await updateDoc(moldRef, {
        receiptDate: formData.receiptDate,
        productionStartDate: formData.productionStartDate,
        manufacturer: formData.manufacturer,
        history: formData.history
      });
      onUpdate({ ...mold, ...formData });
      onClose();
    } catch (e) {
      console.error('Failed to update mold history:', e);
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
  const inputStyle = { width: '100%', border: '1px solid #e2e8f0', padding: '6px', textAlign: 'center', borderRadius: '4px', outline: 'none', color: '#0f172a' };
  const tableInputStyle = { width: '100%', border: '1px solid transparent', padding: '6px', outline: 'none', background: 'transparent', color: '#0f172a' };

  return (
    <div className="modal-backdrop active" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ maxWidth: '900px', maxHeight: '95vh', display: 'flex', flexDirection: 'column', padding: '0', borderRadius: '12px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header" style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="modal-title" style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📄</span> 금형 이력 카드 상세 정보
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '24px', color: '#64748b', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '24px', background: '#ffffff' }}>
          
          <h2 style={{ textAlign: 'center', fontSize: '28px', fontWeight: '900', margin: '0 0 24px 0', letterSpacing: '8px', color: '#0f172a' }}>금 형 이 력 카 드</h2>

          {/* Section 1 */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#2563eb', fontWeight: 'bold', fontSize: '14px' }}>
              <span>📌</span> 1. 금형 기본 정보
            </div>
            
            <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
              <div style={{ width: '35%', borderRight: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: '#f1f5f9', padding: '10px 16px', fontWeight: 'bold', color: '#334155', textAlign: 'center', borderBottom: '1px solid #cbd5e1', fontSize: '13px' }}>사진</div>
                <div style={{ flex: 1, background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '220px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>사진 업로드 (준비중)</span>
                </div>
              </div>
              <div style={{ width: '65%' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <tbody>
                    <tr>
                      <td style={labelStyle}>제작일자</td>
                      <td style={valStyle}>{mold.manufactureDate || '-'}</td>
                    </tr>
                    <tr>
                      <td style={labelStyle}>품 명</td>
                      <td style={valStyle}>{mold.name || '-'}</td>
                    </tr>
                    <tr>
                      <td style={labelStyle}>품 번</td>
                      <td style={valStyle}>{mold.itemNo || '-'}</td>
                    </tr>
                    <tr>
                      <td style={labelStyle}>금형입고</td>
                      <td style={valStyle}>
                        <input type="date" style={inputStyle} value={formData.receiptDate} onChange={e => setFormData({...formData, receiptDate: e.target.value})} />
                      </td>
                    </tr>
                    <tr>
                      <td style={labelStyle}>생산시점</td>
                      <td style={valStyle}>
                        <input type="date" style={inputStyle} value={formData.productionStartDate} onChange={e => setFormData({...formData, productionStartDate: e.target.value})} />
                      </td>
                    </tr>
                    <tr>
                      <td style={{ ...labelStyle, borderBottom: 'none' }}>금형제작처</td>
                      <td style={{ ...valStyle, borderBottom: 'none' }}>
                        <input type="text" style={inputStyle} placeholder="㈜화승R&A" value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
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
                    <th rowSpan="2" style={{ borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '12px 8px', width: '15%', fontWeight: 'bold' }}>일 자</th>
                    <th colSpan="3" style={{ borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '8px', letterSpacing: '4px', fontWeight: 'bold' }}>금 형 이 력</th>
                    <th rowSpan="2" style={{ borderBottom: '1px solid #cbd5e1', padding: '12px 8px', width: '10%', fontWeight: 'bold' }}>확인</th>
                  </tr>
                  <tr style={{ background: '#f8fafc', color: '#334155' }}>
                    <th style={{ borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '8px', width: '30%', fontWeight: '600' }}>문제점 및 내용</th>
                    <th style={{ borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '8px', width: '30%', fontWeight: '600' }}>대책 및 조치사항</th>
                    <th style={{ borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '8px', width: '15%', fontWeight: '600' }}>수리의뢰서<br/>첨부파일</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.history.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ borderRight: '1px solid #e2e8f0', padding: '4px' }}>
                        <input type="date" style={{...tableInputStyle, textAlign: 'center'}} value={row.date} onChange={e => updateHistory(i, 'date', e.target.value)} />
                      </td>
                      <td style={{ borderRight: '1px solid #e2e8f0', padding: '4px' }}>
                        <input type="text" style={tableInputStyle} value={row.issue} onChange={e => updateHistory(i, 'issue', e.target.value)} placeholder="내용 입력..." />
                      </td>
                      <td style={{ borderRight: '1px solid #e2e8f0', padding: '4px' }}>
                        <input type="text" style={tableInputStyle} value={row.action} onChange={e => updateHistory(i, 'action', e.target.value)} placeholder="조치 내용..." />
                      </td>
                      <td style={{ borderRight: '1px solid #e2e8f0', padding: '4px' }}>
                        <button 
                          onClick={() => setEditingRepairIndex(i)}
                          style={{ width: '100%', padding: '4px', background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          📄 {row.repairDetails ? '의뢰서 상세' : '의뢰서 작성'}
                        </button>
                      </td>
                      <td style={{ padding: '4px' }}>
                        <input type="checkbox" style={{ width: '16px', height: '16px', cursor: 'pointer' }} checked={row.confirmed} onChange={e => updateHistory(i, 'confirmed', e.target.checked)} />
                      </td>
                    </tr>
                  ))}
                  {Array.from({ length: Math.max(1, 10 - formData.history.length) }).map((_, i) => (
                    <tr key={`empty-${i}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ borderRight: '1px solid #e2e8f0', padding: '16px' }}></td>
                      <td style={{ borderRight: '1px solid #e2e8f0', padding: '16px' }}></td>
                      <td style={{ borderRight: '1px solid #e2e8f0', padding: '16px' }}></td>
                      <td style={{ borderRight: '1px solid #e2e8f0', padding: '16px' }}></td>
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
          <button className="btn btn-primary" onClick={handleSave} style={{ padding: '8px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>저장</button>
        </div>
        
      </div>
      {editingRepairIndex !== null && (
        <MoldRepairRequestModal
          mold={mold}
          initialData={formData.history[editingRepairIndex].repairDetails}
          onClose={() => setEditingRepairIndex(null)}
          onSave={(data) => handleSaveRepairFromHistory(editingRepairIndex, data)}
        />
      )}
    </div>
  );
}
