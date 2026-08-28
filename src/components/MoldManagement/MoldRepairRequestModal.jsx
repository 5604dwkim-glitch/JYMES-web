import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

export default function MoldRepairRequestModal({ mold, onClose }) {
  const [formData, setFormData] = useState({
    department: '오록 신천',
    requestDate: new Date().toISOString().split('T')[0],
    requestType: '수리', // 수리, 설변, 파손, 습합
    pic: '',
    completionDate: '',
    remarks: '',
    requestContent: '',
    actionContent: '',
    verificationResult: '',
    qualityPic: ''
  });

  const handleSave = async () => {
    try {
      // For now, we just close. You can add a subcollection for repair requests later.
      alert('저장 기능은 아직 백엔드와 연결되지 않았습니다. (프론트 UI 구현 완료)');
      onClose();
    } catch (e) {
      console.error('Failed to save repair request:', e);
      alert('저장 실패!');
    }
  };

  const thStyle = { background: '#dbeafe', border: '1px solid #94a3b8', padding: '8px 4px', fontWeight: 'bold', textAlign: 'center', fontSize: '13px', color: '#1e293b' };
  const tdStyle = { background: '#eff6ff', border: '1px solid #94a3b8', padding: '4px', textAlign: 'center', fontSize: '13px' };
  const inputStyle = { width: '100%', border: 'none', background: 'transparent', textAlign: 'center', outline: 'none' };

  return (
    <div className="modal-backdrop active" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ maxWidth: '1000px', maxHeight: '95vh', display: 'flex', flexDirection: 'column', padding: '0', borderRadius: '12px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header" style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="modal-title" style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🛠️</span> 금형 수리 의뢰서
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '24px', color: '#64748b', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '32px', background: '#ffffff' }}>
          
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 20px 0', color: '#000', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>▣</span> 양산 금형 수리 의뢰서
          </h2>

          <div style={{ border: '1px solid #94a3b8', width: '100%' }}>
            {/* Top Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{...thStyle, width: '5%', borderTop: 'none', borderLeft: 'none'}}>차 종</th>
                  <th style={{...thStyle, width: '12%', borderTop: 'none'}}>품 명</th>
                  <th style={{...thStyle, width: '5%', borderTop: 'none'}}>호 기</th>
                  <th style={{...thStyle, width: '8%', borderTop: 'none'}}>부 위</th>
                  <th style={{...thStyle, width: '13%', borderTop: 'none'}}>의뢰부서 및 협력업체</th>
                  <th style={{...thStyle, width: '11%', borderTop: 'none'}}>의뢰일자</th>
                  <th style={{...thStyle, width: '11%', borderTop: 'none'}}>의뢰구분</th>
                  <th style={{...thStyle, width: '7%', borderTop: 'none'}}>수리담당</th>
                  <th style={{...thStyle, width: '11%', borderTop: 'none'}}>완료일</th>
                  <th style={{...thStyle, width: '17%', borderTop: 'none', borderRight: 'none'}}>비 고</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{...tdStyle, borderLeft: 'none'}}>{mold?.carModel || ''}</td>
                  <td style={tdStyle}>{mold?.partName || ''}</td>
                  <td style={tdStyle}>{mold?.moldNumber || ''}</td>
                  <td style={tdStyle}>{mold?.moldType || ''}</td>
                  <td style={tdStyle}>
                    <input type="text" style={inputStyle} value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} />
                  </td>
                  <td style={tdStyle}>
                    <input type="date" style={inputStyle} value={formData.requestDate} onChange={e => setFormData({...formData, requestDate: e.target.value})} />
                  </td>
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {['수리', '설변'].map(type => (
                          <label key={type} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}>
                            <input type="radio" name="requestType" checked={formData.requestType === type} onChange={() => setFormData({...formData, requestType: type})} style={{ margin: 0 }} />
                            {type}
                          </label>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {['파손', '습합'].map(type => (
                          <label key={type} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', whiteSpace: 'nowrap' }}>
                            <input type="radio" name="requestType" checked={formData.requestType === type} onChange={() => setFormData({...formData, requestType: type})} style={{ margin: 0 }} />
                            {type}
                          </label>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <input type="text" style={inputStyle} value={formData.pic} onChange={e => setFormData({...formData, pic: e.target.value})} />
                  </td>
                  <td style={tdStyle}>
                    <input type="date" style={inputStyle} value={formData.completionDate} onChange={e => setFormData({...formData, completionDate: e.target.value})} />
                  </td>
                  <td style={{...tdStyle, borderRight: 'none'}}>
                    <input type="text" style={inputStyle} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} />
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Middle Sections (Exactly 50/50 split) */}
            <div style={{ display: 'flex', borderTop: '1px solid #94a3b8' }}>
              <div style={{ flex: 1, padding: '8px', borderRight: '1px solid #94a3b8', minHeight: '100px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '13px' }}>(의뢰 내용)</div>
                <textarea style={{ width: '100%', height: '70px', border: 'none', outline: 'none', resize: 'none', fontSize: '13px' }} placeholder="수지노출 등 상세 의뢰 내용 입력..." value={formData.requestContent} onChange={e => setFormData({...formData, requestContent: e.target.value})}></textarea>
              </div>
              <div style={{ flex: 1, padding: '8px', minHeight: '100px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '13px' }}>(조치 내용)</div>
                <textarea style={{ width: '100%', height: '70px', border: 'none', outline: 'none', resize: 'none', fontSize: '13px' }} placeholder="조치 내용 입력..." value={formData.actionContent} onChange={e => setFormData({...formData, actionContent: e.target.value})}></textarea>
              </div>
            </div>

            <div style={{ display: 'flex', borderTop: '1px solid #94a3b8' }}>
              <div style={{ flex: 1, padding: '8px', borderRight: '1px solid #94a3b8', minHeight: '300px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '13px' }}>수리전 사진</div>
                <div style={{ width: '100%', height: '280px', background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px dashed #cbd5e1' }}>
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>사진 업로드 (준비중)</span>
                </div>
              </div>
              <div style={{ flex: 1, padding: '8px', minHeight: '300px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px', fontSize: '13px' }}>수리후 사진</div>
                <div style={{ width: '100%', height: '280px', background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px dashed #cbd5e1' }}>
                  <span style={{ color: '#94a3b8', fontSize: '13px' }}>사진 업로드 (준비중)</span>
                </div>
              </div>
            </div>

            {/* Footer Section */}
            <div style={{ display: 'flex', borderTop: '1px solid #94a3b8', background: '#fce7f3' }}>
              <div style={{ flex: 1, padding: '16px 8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                <span>■ 검증 결과 :</span>
                <input type="text" style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', borderBottom: '1px solid #fbcfe8' }} value={formData.verificationResult} onChange={e => setFormData({...formData, verificationResult: e.target.value})} />
              </div>
              <div style={{ width: '120px', borderLeft: '1px solid #94a3b8', padding: '8px', fontWeight: 'bold', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>
                협력업체<br/>품질 담당
              </div>
              <div style={{ width: '150px', borderLeft: '1px solid #94a3b8', padding: '8px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <input type="text" style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', outline: 'none', fontWeight: 'bold' }} placeholder="담당자명" value={formData.qualityPic} onChange={e => setFormData({...formData, qualityPic: e.target.value})} />
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '8px 24px', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>닫기</button>
          <button className="btn" onClick={() => { onSave({ ...formData, repairStatus: '요청' }) }} style={{ padding: '8px 24px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>수리요청</button>
          <button className="btn btn-primary" onClick={() => { onSave({ ...formData, repairStatus: '완료' }) }} style={{ padding: '8px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>수리완료</button>
        </div>
        
      </div>
    </div>
  );
}
