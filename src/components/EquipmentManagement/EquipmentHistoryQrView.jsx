import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { invalidateEquipmentsCache } from '../../services/firestore';
import { getEquipmentCategory } from '../../constants/equipmentCategories';
import EquipmentHistoryCardModal from './EquipmentHistoryCardModal';

export default function EquipmentHistoryQrView() {
  const { equipmentId } = useParams();
  const navigate = useNavigate();
  const { userRole } = useAuth();

  const isWorker = userRole?.role === 'worker';
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let alive = true;
    const loadEquipment = async () => {
      if (!equipmentId) {
        if (alive) {
          setErrorMsg('잘못된 설비 QR 경로입니다.');
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      setErrorMsg('');
      try {
        const snap = await getDoc(doc(db, 'equipments', equipmentId));
        if (!alive) return;
        if (!snap.exists()) {
          setErrorMsg('해당 설비 정보를 찾을 수 없습니다. 삭제되었거나 변경된 설비일 수 있습니다.');
        } else {
          setEquipment({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error('Failed to load equipment for QR history view:', err);
        if (alive) {
          setErrorMsg('설비 이력카드를 불러오는 중 오류가 발생했습니다.');
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    loadEquipment();
    return () => {
      alive = false;
    };
  }, [equipmentId]);

  const handleClose = () => {
    if (isWorker || !equipment) {
      navigate('/');
      return;
    }
    navigate(`/equipment/${getEquipmentCategory(equipment)}`);
  };

  const handleUpdate = (updatedEquipment) => {
    setEquipment(updatedEquipment);
    invalidateEquipmentsCache();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '320px', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', border: '4px solid #cbd5e1', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>설비 이력카드를 불러오는 중입니다...</div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (errorMsg || !equipment) {
    return (
      <div className="card" style={{ maxWidth: '480px', margin: '40px auto', padding: '24px', textAlign: 'center' }}>
        <h3 style={{ marginTop: 0, color: '#991b1b' }}>설비 이력카드를 열 수 없습니다</h3>
        <p style={{ color: '#475569', fontSize: '14px', lineHeight: 1.5 }}>{errorMsg || '설비 정보가 없습니다.'}</p>
        <button type="button" className="btn btn-primary" onClick={handleClose}>
          {isWorker ? '홈으로 이동' : '설비관리로 이동'}
        </button>
      </div>
    );
  }

  return (
    <EquipmentHistoryCardModal
      equipment={equipment}
      readOnly={isWorker}
      disableBackdropClose
      onClose={handleClose}
      onUpdate={handleUpdate}
    />
  );
}
