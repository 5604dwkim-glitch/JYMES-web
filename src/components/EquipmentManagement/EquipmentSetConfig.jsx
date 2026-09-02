import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { QRCodeSVG } from 'qrcode.react';

export default function EquipmentSetConfig() {
  const [equipments, setEquipments] = useState([]);
  const [equipmentSets, setEquipmentSets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [setName, setSetName] = useState('');
  const [selectedEqIds, setSelectedEqIds] = useState([]);
  
  const [qrModalSet, setQrModalSet] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const eqQ = query(collection(db, 'equipments'), orderBy('code'));
      const eqSnapshot = await getDocs(eqQ);
      const eqData = eqSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setEquipments(eqData);

      const setQ = query(collection(db, 'equipment_sets'), orderBy('createdAt', 'desc'));
      const setSnapshot = await getDocs(setQ);
      const setData = setSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setEquipmentSets(setData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (eqId) => {
    setSelectedEqIds(prev => {
      if (prev.includes(eqId)) {
        return prev.filter(id => id !== eqId);
      } else {
        return [...prev, eqId];
      }
    });
  };

  const handleCreateSet = async (e) => {
    e.preventDefault();
    if (!setName.trim()) {
      alert('셋트 이름을 입력해주세요.');
      return;
    }
    if (selectedEqIds.length === 0) {
      alert('설비를 1개 이상 선택해주세요.');
      return;
    }

    try {
      const selectedEquips = equipments.filter(eq => selectedEqIds.includes(eq.id)).map(eq => ({
        id: eq.id,
        code: eq.code,
        name: eq.name
      }));

      await addDoc(collection(db, 'equipment_sets'), {
        name: setName,
        equipmentIds: selectedEqIds,
        equipments: selectedEquips,
        createdAt: serverTimestamp()
      });
      
      setSetName('');
      setSelectedEqIds([]);
      fetchData();
      alert('설비 셋트가 구성되었습니다.');
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteSet = async (setId) => {
    if (window.confirm('이 설비 셋트를 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'equipment_sets', setId));
        fetchData();
      } catch (err) {
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const getQrUrl = (setId) => {
    return `${window.location.origin}/tpm-check/${setId}`;
  };

  if (loading) return <p>로딩 중...</p>;

  return (
    <div style={{ display: 'flex', gap: '24px', height: '100%' }}>
      {/* Set Creation Form */}
      <div style={{ flex: '1', minWidth: '300px', borderRight: '1px solid #cbd5e1', paddingRight: '24px' }}>
        <h3 style={{ marginTop: 0 }}>새 셋트 구성하기</h3>
        <form onSubmit={handleCreateSet}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>셋트 이름</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="예: 1호기~3호기 셋트" 
              value={setName} 
              onChange={e => setSetName(e.target.value)} 
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>필요 설비 체크</label>
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '8px' }}>
              {equipments.map(eq => (
                <div key={eq.id} style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="checkbox" 
                    id={`chk-${eq.id}`}
                    checked={selectedEqIds.includes(eq.id)}
                    onChange={() => handleCheckboxChange(eq.id)}
                    style={{ marginRight: '12px', width: '16px', height: '16px' }}
                  />
                  <label htmlFor={`chk-${eq.id}`} style={{ cursor: 'pointer', flex: 1, margin: 0 }}>
                    <span style={{ fontWeight: 'bold' }}>{eq.name}</span> ({eq.code}) - {eq.type}
                  </label>
                </div>
              ))}
              {equipments.length === 0 && <p style={{ color: '#64748b', fontSize: '14px' }}>등록된 설비가 없습니다.</p>}
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>셋트 구성 저장</button>
        </form>
      </div>

      {/* Set List */}
      <div style={{ flex: '2', display: 'flex', flexDirection: 'column' }}>
        <h3 style={{ marginTop: 0 }}>구성된 셋트 리스트</h3>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <th style={{ width: '20%' }}>셋트 이름</th>
                <th style={{ width: '50%' }}>포함된 설비</th>
                <th style={{ width: '30%' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {equipmentSets.map(set => (
                <tr key={set.id} style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ fontWeight: 'bold' }}>{set.name}</td>
                  <td>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                      {set.equipments?.map(eq => (
                        <span key={eq.id} style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', border: '1px solid #e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {eq.name} ({eq.code})
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <button 
                      className="btn btn-sm" 
                      style={{ background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', marginRight: '8px' }}
                      onClick={() => setQrModalSet(set)}
                    >
                      QR 코드 보기
                    </button>
                    <button 
                      className="btn btn-sm btn-secondary" 
                      style={{ background: '#fee2e2', color: '#991b1b', border: 'none' }}
                      onClick={() => handleDeleteSet(set.id)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
              {equipmentSets.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>구성된 설비 셋트가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Code Modal */}
      {qrModalSet && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '32px', borderRadius: '12px', width: '400px', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '24px' }}>{qrModalSet.name}</h3>
            
            <div style={{ background: '#fff', padding: '16px', display: 'inline-block', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
              <QRCodeSVG value={getQrUrl(qrModalSet.id)} size={200} />
            </div>
            
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px', lineHeight: '1.5' }}>
              작업자가 이 QR 코드를 스캔하면<br/>해당 셋트의 TPM 점검 일지를 작성할 수 있습니다.
            </p>

            <div style={{ marginBottom: '24px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', wordBreak: 'break-all', fontSize: '12px', color: '#334155' }}>
              {getQrUrl(qrModalSet.id)}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <a href={getQrUrl(qrModalSet.id)} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ textDecoration: 'none' }}>
                직접 접속하기
              </a>
              <button className="btn btn-secondary" onClick={() => setQrModalSet(null)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
