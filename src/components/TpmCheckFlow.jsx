import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

// 컴포넌트 밖으로 이동 — 렌더링마다 재생성되지 않도록 상수로 선언
const TPM_ITEMS = [
  '청소상태(Cleaning)',
  '오일누유(Oil leak)',
  '소음/진동(Noise/Vibration)',
  '온도(Temperature)',
  '압력(Pressure)',
  '안전장치(Safety device)'
];

export default function TpmCheckFlow() {
  const { setId } = useParams();
  const navigate = useNavigate();
  
  const [equipmentSet, setEquipmentSet] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Array of { eqId: string, results: { [itemName]: 'O' | 'X' } }
  const [checkResults, setCheckResults] = useState({});
  

  useEffect(() => {
    async function fetchSet() {
      try {
        const docRef = doc(db, 'equipment_sets', setId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setEquipmentSet({ id: docSnap.id, ...data });
          
          // Initialize empty results
          const initialResults = {};
          data.equipments.forEach(eq => {
            initialResults[eq.id] = {};
            TPM_ITEMS.forEach(item => {
              initialResults[eq.id][item] = ''; // '' means not checked, 'O' means OK, 'X' means NG
            });
          });
          setCheckResults(initialResults);
        } else {
          alert('존재하지 않는 셋트입니다.');
          navigate('/');
        }
      } catch (err) {
        console.error(err);
        alert('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }
    fetchSet();
  }, [setId, navigate]);

  const handleCheck = (eqId, itemName, value) => {
    setCheckResults(prev => ({
      ...prev,
      [eqId]: {
        ...prev[eqId],
        [itemName]: value
      }
    }));
  };

  const handleSubmit = async () => {
    // Check if everything is filled
    let allFilled = true;
    for (const eqId in checkResults) {
      for (const item in checkResults[eqId]) {
        if (!checkResults[eqId][item]) {
          allFilled = false;
        }
      }
    }
    
    if (!allFilled) {
      if (!window.confirm('아직 체크하지 않은 항목이 있습니다. 이대로 저장하시겠습니까?')) {
        return;
      }
    }

    try {
      await addDoc(collection(db, 'tpm_logs'), {
        setId: equipmentSet.id,
        setName: equipmentSet.name,
        results: checkResults,
        createdAt: serverTimestamp()
      });
      
      alert('TPM 일지가 저장되었습니다. 작업일보 작성 화면으로 이동합니다.');
      navigate('/form');
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center' }}>로딩 중...</div>;
  if (!equipmentSet) return null;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', paddingBottom: '100px' }}>
      <h2 style={{ borderBottom: '2px solid #2563eb', paddingBottom: '10px', marginBottom: '20px' }}>
        TPM 일일점검 (셋트: {equipmentSet.name})
      </h2>
      
      {equipmentSet.equipments.map((eq, index) => (
        <div key={eq.id} className="card" style={{ marginBottom: '24px', padding: '16px', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' }}>
            <span style={{ background: '#2563eb', color: 'white', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px' }}>{index + 1}</span>
            {eq.name} ({eq.code})
          </h3>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 8px', textAlign: 'left', width: '60%' }}>점검 항목</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', width: '20%' }}>양호 (O)</th>
                <th style={{ padding: '12px 8px', textAlign: 'center', width: '20%' }}>불량 (X)</th>
              </tr>
            </thead>
            <tbody>
              {TPM_ITEMS.map((item, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 8px', fontWeight: '500' }}>{item}</td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <input 
                      type="radio" 
                      name={`${eq.id}-${item}`} 
                      checked={checkResults[eq.id]?.[item] === 'O'}
                      onChange={() => handleCheck(eq.id, item, 'O')}
                      style={{ transform: 'scale(1.5)', cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <input 
                      type="radio" 
                      name={`${eq.id}-${item}`} 
                      checked={checkResults[eq.id]?.[item] === 'X'}
                      onChange={() => handleCheck(eq.id, item, 'X')}
                      style={{ transform: 'scale(1.5)', cursor: 'pointer' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e2e8f0', padding: '16px', display: 'flex', justifyContent: 'center', boxShadow: '0 -2px 10px rgba(0,0,0,0.05)' }}>
        <button 
          className="btn btn-primary" 
          style={{ width: '100%', maxWidth: '800px', fontSize: '16px', padding: '16px' }}
          onClick={handleSubmit}
        >
          완료 및 다음 (작업일보 작성)
        </button>
      </div>
    </div>
  );
}
