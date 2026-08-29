import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import MoldHistoryCardModal from './MoldHistoryCardModal';
import MoldRepairRequestModal from './MoldRepairRequestModal';
import { Navigate } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { CAR_MODELS, CAR_MODEL_PARTS } from '../../constants/masterData';
import { getCurrentFormCode } from '../../constants/formCodes';

const MOLD_TYPE_MAP = {
  1002: ["FRT(P)_L/R", "FRT(Q)_L/R", "RR(R)_L/R", "RR(S)_LH", "RR(S)_RH"],
  1032: ["FRT(P)_L/R", "FRT(Q)_L/R", "RR(R)_L/R", "RR(S)_LH", "RR(S)_RH"],
  1011: ["RR C PART'G", "LH", "RH"],
  1022: ["공통", "LH", "RH"],
  1042: ["공통", "LH", "RH"],
  2003: ["LH R[직각]", "LH S[둔각]", "LH T[직선]", "RH R[직각]", "RH S[둔각]", "RH T[직선]", "1", "2", "3", "4"],
  2013: ["LH R[직각]", "LH S[둔각]", "LH T[직선]", "RH R[직각]", "RH S[둔각]", "RH T[직선]", "1", "2", "3", "4"],
  2024: ["LH R[직각]", "LH S[둔각]", "LH T[직선]", "RH R[직각]", "RH S[둔각]", "RH T[직선]", "1", "2", "3", "4"],
  2025: ["LH R[직각]", "LH S[둔각]", "LH T[직선]", "RH R[직각]", "RH S[둔각]", "RH T[직선]", "D", "1", "2", "3", "4"],
  2033: ["LH R[직각]", "LH S[둔각]", "LH T[직선]", "RH R[직각]", "RH S[둔각]", "RH T[직선]", "1", "2", "3", "4"],
  2042: ["LH", "RH"],
  3002: ["FRT LH(P)", "FRT LH(Q)", "RR LH(R)", "RR LH(S)", "FRT RH(P)", "FRT RH(Q)", "RR RH(R)", "RR RH(S)"],
  4002: ["LH", "RH", "X부", "Y부"],
  4012: ["Frunk", "LH", "RH"],
  4022: ["LH", "RH"],
  4032: ["LH", "RH"],
  5002: ["LH", "RH"],
  6002: ["LH", "RH"]
};

const getMoldTypesForFormCode = (formCode) => {
  if (!formCode || formCode === 9999) return ['LH', 'RH', 'FRT P', 'FRT Q', 'RR R', 'RR S', '1', '2', '상', '하', '공통'];
  return MOLD_TYPE_MAP[formCode] || ['LH', 'RH', '공통'];
};

export default function MoldManagement() {
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [molds, setMolds] = useState([]);
  const [historyMold, setHistoryMold] = useState(null);
  const [repairMold, setRepairMold] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ id: '', code: '', receiptDate: '', name: '', itemNo: '', currentStrokes: 0, maxStrokes: 300000, status: '양산중', carModel: '', partName: '', moldType: '', moldNumber: '' });

  const generateAutoCode = (carModel, receiptDate, moldsList, currentId) => {
    if (!carModel || !receiptDate) return '';
    const prefix1 = carModel.substring(0, 2).toUpperCase();
    const dateStr = receiptDate.replace(/-/g, '');
    const prefix = `${prefix1}${dateStr}`;
    
    let maxSeq = 0;
    moldsList.forEach(m => {
      if (currentId && m.id === currentId) return;
      if (m.code && m.code.startsWith(prefix + '-')) {
        const parts = m.code.split('-');
        if (parts.length > 1) {
          const seq = parseInt(parts[1], 10);
          if (!isNaN(seq) && seq > maxSeq) {
            maxSeq = seq;
          }
        }
      }
    });
    
    const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
    return `${prefix}-${nextSeq}`;
  };

  useEffect(() => {
    fetchMolds();
  }, []);

  const fetchMolds = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'molds'), orderBy('code'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMolds(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.id) {
        await updateDoc(doc(db, 'molds', formData.id), { ...formData, currentStrokes: Number(formData.currentStrokes), maxStrokes: Number(formData.maxStrokes) });
      } else {
        const { id, ...dataToSave } = formData;
        await addDoc(collection(db, 'molds'), { ...dataToSave, currentStrokes: Number(dataToSave.currentStrokes), maxStrokes: Number(dataToSave.maxStrokes) });
      }
      setShowModal(false);
      fetchMolds();
    } catch (err) {
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  
  const handleSaveRepairRequest = async (repairData) => {
    try {
      const newHistoryRow = {
        date: repairData.requestDate || new Date().toISOString().split('T')[0],
        issue: repairData.requestContent || '',
        action: repairData.actionContent || '',
        attachment: '수리의뢰서',
        confirmed: false,
        repairDetails: repairData
      };
      
      const updatedHistory = [...(repairMold.history || []), newHistoryRow];
      
      const moldRef = doc(db, 'molds', repairMold.id);
      await updateDoc(moldRef, { history: updatedHistory });
      
      setMolds(molds.map(m => m.id === repairMold.id ? { ...m, history: updatedHistory } : m));
      setRepairMold(null);
    } catch (e) {
      console.error('Failed to save repair request:', e);
      alert('저장 실패!');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'molds', id));
        fetchMolds();
      } catch (err) {
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const openModal = (mold = null) => {
    if (mold) {
      setFormData({...mold, receiptDate: mold.receiptDate || mold.manufactureDate || ''});
    } else {
      setFormData({ id: '', code: '', receiptDate: '', name: '', itemNo: '', currentStrokes: 0, maxStrokes: 300000, status: '양산중', carModel: '', partName: '', moldType: '', moldNumber: '' });
    }
    setShowModal(true);
  };

  // Protect route
  if (userRole?.role === 'worker') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>

      
      <div className="card-body" style={{ flex: 1, overflow: 'auto', padding: '20px', position: 'relative' }}>
        <div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
              <button className="btn btn-primary" onClick={() => openModal()}>+ 신규 금형 등록</button>
            </div>
            
            {loading ? <p>로딩 중...</p> : (
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <th>관리번호</th>
                    <th>금형입고 일자</th>
                    <th>품명</th>
                    <th>품번</th>
                    <th>상태</th>
                    <th>누적타수</th>
                    <th>금형이력카드</th>
                  </tr>
                </thead>
                <tbody>
                  {molds.map(m => {
                    const strokePercent = Math.min(100, Math.round((m.currentStrokes / (m.maxStrokes || 1)) * 100));
                    return (
                      <tr key={m.id} style={{ borderBottom: '1px solid #cbd5e1' }}>
                        <td>{m.code}</td>
                        <td>{m.receiptDate || m.manufactureDate || '-'}</td>
                        <td style={{ fontWeight: 'bold' }}>{m.name}</td>
                        <td>{m.itemNo || '-'}</td>
                        <td>
                          <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', background: m.status === '양산중' ? '#dcfce3' : '#fee2e2', color: m.status === '양산중' ? '#166534' : '#991b1b' }}>
                            {m.status}
                          </span>
                        </td>
                        <td>{Number(m.currentStrokes).toLocaleString()} / {Number(m.maxStrokes).toLocaleString()}</td>
                        <td>
                          <button className="btn btn-sm" style={{ background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', marginRight: '4px', marginBottom: '4px' }} onClick={(e) => { e.stopPropagation(); setHistoryMold(m); }}>이력카드(상세/수정)</button>
                            <button className="btn btn-sm" style={{ background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', marginRight: '4px', marginBottom: '4px' }} onClick={(e) => { e.stopPropagation(); setRepairMold(m); }}>수리의뢰서 작성</button>
                          <button className="btn btn-secondary btn-sm" style={{ background: '#fee2e2', color: '#991b1b', border: 'none' }} onClick={() => handleDelete(m.id)}>삭제</button>
                        </td>
                      </tr>
                    );
                  })}
                  {molds.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>등록된 금형이 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
      </div>

      {repairMold && (
        <MoldRepairRequestModal 
          mold={repairMold} 
          onClose={() => setRepairMold(null)}
          onSave={handleSaveRepairRequest}
        />
      )}
      
      {historyMold && (
        <MoldHistoryCardModal 
          mold={historyMold} 
          onClose={() => setHistoryMold(null)}
          onUpdate={(updatedMold) => {
            setMolds(molds.map(m => m.id === updatedMold.id ? updatedMold : m));
          }}
        />
      )}

      {showModal && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '450px' }}>
            <h3 style={{ marginTop: 0 }}>{formData.id ? '금형 수정' : '신규 금형 등록'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>관리번호 (Code)</label>
                <input type="text" className="form-control" value={formData.code || ''} onChange={(e) => setFormData({...formData, code: e.target.value})} required />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>금형입고 일자</label>
                <input type="date" max="9999-12-31" className="form-control" value={formData.receiptDate || ''} onChange={(e) => {
                  const newDate = e.target.value;
                  const newCode = (!formData.id && formData.carModel && newDate) ? generateAutoCode(formData.carModel, newDate, molds, formData.id) : formData.code;
                  setFormData({...formData, receiptDate: newDate, code: newCode});
                }} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>품명 설정 (단계별 선택)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <select 
                    className="form-control" 
                    value={formData.carModel || ''} 
                    onChange={(e) => {
                      const newCarModel = e.target.value;
                      const newName = `${newCarModel} ${formData.partName || ''} ${formData.moldType || ''} ${formData.moldNumber ? `#${formData.moldNumber}` : ''}`.replace(/\s+/g, ' ').trim();
                      const newCode = (!formData.id && newCarModel && formData.receiptDate) ? generateAutoCode(newCarModel, formData.receiptDate, molds, formData.id) : formData.code;
                      setFormData({...formData, carModel: newCarModel, partName: '', name: newName, code: newCode});
                    }}
                  >
                    <option value="">1. 차종 선택</option>
                    {CAR_MODELS.map(m => (
                      <option key={m.code} value={m.code}>{m.name}</option>
                    ))}
                  </select>

                  <select 
                    className="form-control" 
                    value={formData.partName || ''} 
                    onChange={(e) => {
                      const newPart = e.target.value;
                      const newName = `${formData.carModel || ''} ${newPart} ${formData.moldType || ''} ${formData.moldNumber ? `#${formData.moldNumber}` : ''}`.replace(/\s+/g, ' ').trim();
                      setFormData({...formData, partName: newPart, name: newName});
                    }}
                    disabled={!formData.carModel}
                  >
                    <option value="">2. 세부부품 선택</option>
                    {(CAR_MODEL_PARTS[formData.carModel] || []).map(p => (
                      <option key={p.code} value={p.name}>{p.name}</option>
                    ))}
                  </select>

                  <select 
                    className="form-control" 
                    value={formData.moldType || ''} 
                    onChange={(e) => {
                      const newType = e.target.value;
                      const newName = `${formData.carModel || ''} ${formData.partName || ''} ${newType} ${formData.moldNumber ? `#${formData.moldNumber}` : ''}`.replace(/\s+/g, ' ').trim();
                      setFormData({...formData, moldType: newType, name: newName});
                    }}
                    disabled={!formData.carModel || !formData.partName}
                  >
                    <option value="">3. 구분명 (가류/위치)</option>
                    {getMoldTypesForFormCode(getCurrentFormCode(formData.carModel, formData.partName, '조인트')).map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>

                  <input 
                    type="number" 
                    className="form-control" 
                    placeholder="4. 금형 번호 (예: 1)"
                    value={formData.moldNumber || ''} 
                    onChange={(e) => {
                      const newNum = e.target.value;
                      const newName = `${formData.carModel || ''} ${formData.partName || ''} ${formData.moldType || ''} ${newNum ? `#${newNum}` : ''}`.replace(/\s+/g, ' ').trim();
                      setFormData({...formData, moldNumber: newNum, name: newName});
                    }}
                  />
                </div>
                <label style={labelStyle}>최종 품명 (자동조합 및 직접수정 가능)</label>
                <input type="text" className="form-control" value={formData.name || ''} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>품번 (Item No)</label>
                <input type="text" className="form-control" value={formData.itemNo || ''} onChange={(e) => setFormData({...formData, itemNo: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>현재 누적 타수</label>
                <input type="number" className="form-control" value={formData.currentStrokes || 0} onChange={(e) => setFormData({...formData, currentStrokes: e.target.value})} />
              </div>
              <div>
                <label style={labelStyle}>최대 보증 타수</label>
                <input type="number" className="form-control" value={formData.maxStrokes || 0} onChange={(e) => setFormData({...formData, maxStrokes: e.target.value})} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>상태</label>
                <select className="form-control" value={formData.status || '양산중'} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                  <option value="양산중">양산중</option>
                  <option value="수리중">수리중</option>
                  <option value="수정중">수정중</option>
                  <option value="폐기">폐기</option>
                </select>
              </div>
              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
                <button type="submit" className="btn btn-primary">저장</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle = { display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' };
