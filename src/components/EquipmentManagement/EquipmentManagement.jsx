import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import TpmManagement from './TpmManagement';
import EquipmentHistoryCardModal from './EquipmentHistoryCardModal';
import EquipmentRepairRequestModal from './EquipmentRepairRequestModal';

export default function EquipmentManagement() {
  const { userRole } = useAuth();
  const [activeTab, setActiveTab] = useState('list');
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [formData, setFormData] = useState({ id: '', code: '', name: '', type: '유압', location: '', status: '정상', installDate: '', spec: '', manufacturer: '극동기계', ownership: '대여', assetNo: '' });

  useEffect(() => {
    fetchEquipments();
  }, []);

  const fetchEquipments = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'equipments'), orderBy('code'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEquipments(data);
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
        await updateDoc(doc(db, 'equipments', formData.id), { ...formData });
      } else {
        const { id, ...dataToSave } = formData;
        await addDoc(collection(db, 'equipments'), dataToSave);
      }
      setShowModal(false);
      fetchEquipments();
    } catch (err) {
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'equipments', id));
        fetchEquipments();
      } catch (err) {
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const openModal = (equip = null) => {
    if (equip) {
      setFormData(equip);
    } else {
      setFormData({ id: '', code: '', name: '', type: '유압', location: '', status: '정상', installDate: '', spec: '', manufacturer: '극동기계', ownership: '대여', assetNo: '' });
    }
    setShowModal(true);
  };

  // Protect route
  if (userRole?.role === 'worker') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header" style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: '0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '-1px' }}>
          <button style={tabStyle(activeTab === 'list')} onClick={() => setActiveTab('list')}>설비 리스트</button>
          <button style={tabStyle(activeTab === 'config')} onClick={() => setActiveTab('config')}>설비 셋트 구성</button>
          <button style={tabStyle(activeTab === 'tpm')} onClick={() => setActiveTab('tpm')}>TPM 일지</button>
        </div>
      </div>
      
      <div className="card-body" style={{ flex: 1, overflow: 'auto', padding: '20px', position: 'relative' }}>
        {activeTab === 'list' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0 }}>설비 관리 리스트</h3>
              <button className="btn btn-primary" onClick={() => openModal()}>+ 신규 설비 등록</button>
            </div>
            
            {loading ? <p>로딩 중...</p> : (
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <th>관리번호</th>
                    <th>설비명</th>
                    <th>분류</th>
                    <th>사양</th>
                    <th>제작처</th>
                    <th>소유</th>
                    <th>위치</th>
                    <th>상태</th>
                    <th>도입일자</th>
                    <th>설비이력카드</th>
                  </tr>
                </thead>
                <tbody>
                  {equipments.map(eq => (
                    <tr key={eq.id} style={{ borderBottom: '1px solid #cbd5e1' }}>
                      <td>{eq.code}</td>
                      <td style={{ fontWeight: 'bold' }}>{eq.name}</td>
                      <td>{eq.type}</td>
                      <td>{eq.spec || '-'}</td>
                      <td>{eq.manufacturer || '-'}</td>
                      <td>{eq.ownership || '-'}</td>
                      <td>{eq.location}</td>
                      <td>
                        <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', background: eq.status === '정상' ? '#dcfce3' : '#fee2e2', color: eq.status === '정상' ? '#166534' : '#991b1b' }}>
                          {eq.status}
                        </span>
                      </td>
                      <td>{eq.installDate}</td>
                      <td>
                        <button className="btn btn-sm" style={{ background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', marginRight: '4px', marginBottom: '4px' }} onClick={(e) => { e.stopPropagation(); setSelectedEquipment(eq); setShowHistoryModal(true); }}>이력카드(상세/수정)</button>
                        <button className="btn btn-sm" style={{ background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', marginRight: '4px', marginBottom: '4px' }} onClick={(e) => { e.stopPropagation(); setSelectedEquipment(eq); setShowRepairModal(true); }}>수리의뢰서 작성</button>
                        <button className="btn btn-secondary btn-sm" style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px' }} onClick={(e) => { e.stopPropagation(); handleDelete(eq.id); }}>삭제</button>
                      </td>
                    </tr>
                  ))}
                  {equipments.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>등록된 설비가 없습니다.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
        

        {activeTab === 'config' && <div><p>준비 중입니다...</p></div>}
        {activeTab === 'tpm' && <TpmManagement />}
      </div>


      {showHistoryModal && selectedEquipment && (
        <EquipmentHistoryCardModal
          equipment={selectedEquipment}
          onClose={() => { setShowHistoryModal(false); setSelectedEquipment(null); }}
          onUpdate={() => { fetchEquipments(); }}
        />
      )}
      {showRepairModal && selectedEquipment && (
        <EquipmentRepairRequestModal
          equipment={selectedEquipment}
          onClose={() => { setShowRepairModal(false); setSelectedEquipment(null); }}
          onSave={(data) => handleSaveRepairRequest(selectedEquipment, data)}
        />
      )}
      {showModal && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', width: '400px' }}>
            <h3 style={{ marginTop: 0 }}>{formData.id ? '설비 수정' : '신규 설비 등록'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>관리번호 (Code)</label>
                <input type="text" className="form-control" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} required />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>설비명 (Name)</label>
                <input type="text" className="form-control" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>분류</label>
                <select className="form-control" value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                  <option value="사출기">사출기</option>
                  <option value="프레스">프레스</option>
                  <option value="가류기">가류기</option>
                  <option value="컨베이어">컨베이어</option>
                  <option value="기타">기타</option>
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>사양</label>
                <input type="text" className="form-control" value={formData.spec || ''} onChange={(e) => setFormData({...formData, spec: e.target.value})} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>제작처</label>
                <input type="text" className="form-control" value={formData.manufacturer || ''} onChange={(e) => setFormData({...formData, manufacturer: e.target.value})} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>소유</label>
                <select className="form-control" value={formData.ownership || ''} onChange={(e) => setFormData({...formData, ownership: e.target.value})}>
                  <option value="대여">대여</option>
                  <option value="자가">자가</option>
                </select>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>자산 No.</label>
                <input type="text" className="form-control" value={formData.assetNo || ''} onChange={(e) => setFormData({...formData, assetNo: e.target.value})} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>위치</label>
                <input type="text" className="form-control" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>상태</label>
                <select className="form-control" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>
                  <option value="정상">정상</option>
                  <option value="수리중">수리중</option>
                  <option value="고장">고장</option>
                  <option value="폐기">폐기</option>
                </select>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>도입일자</label>
                <input type="date" max="9999-12-31" className="form-control" value={formData.installDate} onChange={(e) => setFormData({...formData, installDate: e.target.value})} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
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

function tabStyle(isActive) {
  return {
    padding: '12px 16px', 
    background: 'none', 
    border: 'none', 
    borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
    color: isActive ? '#2563eb' : '#64748b',
    fontWeight: isActive ? 'bold' : 'normal',
    cursor: 'pointer'
  };
}
