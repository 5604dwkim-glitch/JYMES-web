import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function MoldHistoryCardModal({ mold, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    receiptDate: mold.receiptDate || '',
    productionStartDate: mold.productionStartDate || '',
    manufacturer: mold.manufacturer || '',
    history: mold.history || []
  });

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

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, overflowY: 'auto', padding: '20px' }}>
      <div style={{ background: '#fff', width: '900px', maxWidth: '100%', borderRadius: '0', padding: '0', border: '1px solid #000', fontFamily: 'sans-serif', maxHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ textAlign: 'center', fontSize: '32px', fontWeight: 'bold', margin: '20px 0', letterSpacing: '8px' }}>금 형 이 력 카 드</h2>
        
        <div style={{ display: 'flex', borderTop: '2px solid #000', borderBottom: '2px solid #000' }}>
          <div style={{ width: '40%', borderRight: '1px solid #000', padding: '2px' }}>
            <div style={{ fontSize: '12px', fontWeight: 'bold', borderBottom: '1px solid #000', marginBottom: '4px' }}>사진</div>
            <div style={{ width: '100%', height: '240px', background: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
              <span style={{ color: '#94a3b8' }}>사진 업로드 (준비중)</span>
            </div>
          </div>
          <div style={{ width: '60%' }}>
            <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '14px' }}>
              <tbody>
                <tr>
                  <td style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000', width: '30%', fontWeight: 'bold', padding: '8px' }}>제작일자</td>
                  <td style={{ borderBottom: '1px solid #000', padding: '8px' }}>{mold.manufactureDate || ''}</td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000', fontWeight: 'bold', padding: '8px' }}>품 명</td>
                  <td style={{ borderBottom: '1px solid #000', padding: '8px' }}>{mold.name || ''}</td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000', fontWeight: 'bold', padding: '8px' }}>품 번</td>
                  <td style={{ borderBottom: '1px solid #000', padding: '8px' }}>{mold.itemNo || ''}</td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000', fontWeight: 'bold', padding: '8px' }}>금형입고</td>
                  <td style={{ borderBottom: '1px solid #000', padding: '4px' }}>
                    <input type="date" style={{ width: '90%', border: '1px solid #ccc', padding: '4px', textAlign: 'center' }} value={formData.receiptDate} onChange={e => setFormData({...formData, receiptDate: e.target.value})} />
                  </td>
                </tr>
                <tr>
                  <td style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000', fontWeight: 'bold', padding: '8px' }}>생산시점</td>
                  <td style={{ borderBottom: '1px solid #000', padding: '4px' }}>
                    <input type="date" style={{ width: '90%', border: '1px solid #ccc', padding: '4px', textAlign: 'center' }} value={formData.productionStartDate} onChange={e => setFormData({...formData, productionStartDate: e.target.value})} />
                  </td>
                </tr>
                <tr>
                  <td style={{ borderRight: '1px solid #000', fontWeight: 'bold', padding: '8px' }}>금형제작처</td>
                  <td style={{ padding: '4px' }}>
                    <input type="text" style={{ width: '90%', border: '1px solid #ccc', padding: '4px', textAlign: 'center' }} placeholder="㈜화승R&A" value={formData.manufacturer} onChange={e => setFormData({...formData, manufacturer: e.target.value})} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ width: '100%', overflowY: 'auto', flex: 1, minHeight: '300px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#fff', position: 'sticky', top: 0, zIndex: 10 }}>
                <th rowSpan="2" style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000', padding: '8px', width: '15%' }}>일 자</th>
                <th colSpan="3" style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000', padding: '8px', letterSpacing: '4px' }}>금 형 이 력</th>
                <th rowSpan="2" style={{ borderBottom: '1px solid #000', padding: '8px', width: '10%' }}>확인</th>
              </tr>
              <tr style={{ background: '#fff', position: 'sticky', top: '35px', zIndex: 10 }}>
                <th style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000', padding: '8px', width: '30%' }}>문제점 및 내용</th>
                <th style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000', padding: '8px', width: '30%' }}>대책 및 조치사항</th>
                <th style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000', padding: '8px', width: '15%' }}>수리의뢰서<br/>첨부파일</th>
              </tr>
            </thead>
            <tbody>
              {formData.history.map((row, i) => (
                <tr key={i}>
                  <td style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000', padding: '2px' }}>
                    <input type="date" style={{ width: '100%', border: 'none', textAlign: 'center', outline: 'none' }} value={row.date} onChange={e => updateHistory(i, 'date', e.target.value)} />
                  </td>
                  <td style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000', padding: '2px' }}>
                    <input type="text" style={{ width: '100%', border: 'none', padding: '4px', outline: 'none' }} value={row.issue} onChange={e => updateHistory(i, 'issue', e.target.value)} />
                  </td>
                  <td style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000', padding: '2px' }}>
                    <input type="text" style={{ width: '100%', border: 'none', padding: '4px', outline: 'none' }} value={row.action} onChange={e => updateHistory(i, 'action', e.target.value)} />
                  </td>
                  <td style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000', padding: '2px' }}>
                    <input type="text" style={{ width: '100%', border: 'none', padding: '4px', textAlign: 'center', outline: 'none' }} placeholder="파일명" value={row.attachment} onChange={e => updateHistory(i, 'attachment', e.target.value)} />
                  </td>
                  <td style={{ borderBottom: '1px solid #000', padding: '2px' }}>
                    <input type="checkbox" checked={row.confirmed} onChange={e => updateHistory(i, 'confirmed', e.target.checked)} />
                  </td>
                </tr>
              ))}
              {Array.from({ length: Math.max(1, 10 - formData.history.length) }).map((_, i) => (
                <tr key={`empty-${i}`}>
                  <td style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000', padding: '14px' }}></td>
                  <td style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000', padding: '14px' }}></td>
                  <td style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000', padding: '14px' }}></td>
                  <td style={{ borderBottom: '1px solid #000', borderRight: '1px solid #000', padding: '14px' }}></td>
                  <td style={{ borderBottom: '1px solid #000', padding: '14px' }}></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', background: '#f8fafc', borderTop: '1px solid #000' }}>
          <button className="btn btn-secondary" onClick={addHistoryRow}>+ 이력 추가</button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary" onClick={onClose}>닫기</button>
            <button className="btn btn-primary" onClick={handleSave}>저장</button>
          </div>
        </div>
      </div>
    </div>
  );
}
