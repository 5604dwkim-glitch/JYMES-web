import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import EquipmentRepairRequestModal from './EquipmentRepairRequestModal';
import { invalidateEquipmentsCache } from '../../services/firestore';
import { syncEquipmentRepairToChangePoint } from '../../services/changePointAutoSync';
import { getEquipmentCategory } from '../../constants/equipmentCategories';

const readAndOptimizePhoto = (file, maxWidth = 600, maxHeight = 800) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('파일 읽기 오류'));
    reader.onload = () => {
      const rawDataUrl = reader.result;
      const img = new Image();
      img.onerror = () => resolve(rawDataUrl);
      img.onload = () => {
        const { width, height } = img;
        if (width <= maxWidth && height <= maxHeight && file.size <= 350 * 1024) {
          resolve(rawDataUrl);
          return;
        }
        const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
        const targetW = Math.max(1, Math.round(width * ratio));
        const targetH = Math.max(1, Math.round(height * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });

export const createDefaultAncillaryEquipments = () => [
  { name: '디지털 온도계', spec: 'NX4', qty: '2', manufacturer: '오토닉스', note: '' },
  { name: '디지털 타이머', spec: 'FX4S', qty: '1', manufacturer: '오토닉스', note: '' },
  { name: '히타봉', spec: '100*300*220V*1200W', qty: '4', manufacturer: '삼성히타', note: '' },
  { name: '작동 릴레이', spec: 'Φ 80', qty: '3', manufacturer: 'Honeywell', note: '' }
];

export const createEmptyAncillaryEquipments = () =>
  Array.from({ length: 4 }, () => ({ name: '', spec: '', qty: '', manufacturer: '', note: '' }));

const getInitialAncillaryEquipments = (anc, useJointDefaults = true) => {
  if (Array.isArray(anc) && anc.some(row => row && (row.name || row.spec || row.qty || row.manufacturer || row.note))) {
    return anc.map(row => ({
      name: row?.name || '',
      spec: row?.spec || '',
      qty: row?.qty || '',
      manufacturer: row?.manufacturer || '',
      note: row?.note || ''
    }));
  }
  return useJointDefaults ? createDefaultAncillaryEquipments() : createEmptyAncillaryEquipments();
};

export const DEFAULT_EQUIPMENT_PHOTO_1 = '/images/equipment_photo_1.jpg';
export const DEFAULT_EQUIPMENT_PHOTO_2 = '/images/equipment_photo_2.jpg';

export default function EquipmentHistoryCardModal({ equipment, onClose, onUpdate }) {
  const eqCategory = getEquipmentCategory(equipment);
  const useJointDefaults = eqCategory === 'joint';

  const initialPhoto1 =
    equipment.equipmentPhoto !== undefined
      ? equipment.equipmentPhoto
      : (Array.isArray(equipment.equipmentPhotos) ? equipment.equipmentPhotos[0] : '') ||
        (useJointDefaults ? DEFAULT_EQUIPMENT_PHOTO_1 : '');
  const initialPhoto2 =
    equipment.equipmentPhoto2 !== undefined
      ? equipment.equipmentPhoto2
      : (Array.isArray(equipment.equipmentPhotos) ? equipment.equipmentPhotos[1] : '') ||
        (useJointDefaults ? DEFAULT_EQUIPMENT_PHOTO_2 : '');

  const [formData, setFormData] = useState({
    manufacturingDate: equipment.manufacturingDate || '',
    manufacturer: equipment.manufacturer || '',
    ancillaryEquipments: getInitialAncillaryEquipments(equipment.ancillaryEquipments, useJointDefaults),
    history: equipment.history || [],
    equipmentPhoto: initialPhoto1,
    equipmentPhoto2: initialPhoto2
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingRepairIndex, setEditingRepairIndex] = useState(null);
  const [selectedIndices, setSelectedIndices] = useState([]);

  const handlePhotoSlotUpload = async (slotIndex, e) => {
    if (!isEditing) return;
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    try {
      if (slotIndex === 0 && files.length >= 2) {
        const [img1, img2] = await Promise.all([
          readAndOptimizePhoto(files[0]),
          readAndOptimizePhoto(files[1])
        ]);
        setFormData(prev => ({ ...prev, equipmentPhoto: img1, equipmentPhoto2: img2 }));
      } else {
        const imgData = await readAndOptimizePhoto(files[0]);
        const fieldKey = slotIndex === 0 ? 'equipmentPhoto' : 'equipmentPhoto2';
        setFormData(prev => ({ ...prev, [fieldKey]: imgData }));
      }
    } catch (err) {
      console.error(err);
      alert('이미지 처리 중 오류가 발생했습니다.');
    }
  };

  const handleClearPhotoSlot = (slotIndex, e) => {
    e.stopPropagation();
    if (!isEditing) return;
    const fieldKey = slotIndex === 0 ? 'equipmentPhoto' : 'equipmentPhoto2';
    setFormData(prev => ({ ...prev, [fieldKey]: '' }));
  };

  const toggleSelection = (index) => {
    if (!isEditing) return;
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter(i => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const handleDeleteSelected = () => {
    if (!isEditing) return;
    if (selectedIndices.length === 0) {
      alert("삭제할 항목을 선택해주세요.");
      return;
    }
    if (!window.confirm("선택한 이력을 삭제하시겠습니까? ('수정 저장'을 누르면 최종 반영됩니다.)")) return;
    const newHistory = formData.history.filter((_, i) => !selectedIndices.includes(i));
    setFormData({ ...formData, history: newHistory });
    setSelectedIndices([]);
  };

  const handleSaveRepairFromHistory = (index, repairData) => {
    if (!isEditing) return;
    const newHistory = [...formData.history];
    newHistory[index] = {
      ...newHistory[index],
      date: newHistory[index].date || repairData.requestDate || '',
      issue: repairData.requestContent,
      action: repairData.actionContent,
      repairDetails: repairData
    };
    setFormData({ ...formData, history: newHistory });
    setEditingRepairIndex(null);
  };

  const handleSave = async () => {
    if (!isEditing) return;
    try {
      const nowStamp = Date.now();
      const normalizedHistory = (formData.history || []).map((row, idx) => {
        const hasContent = Boolean(
          String(row?.issue || '').trim() ||
          String(row?.action || '').trim() ||
          row?.repairDetails
        );
        if (!hasContent || row?.syncId) return row;
        return { ...row, syncId: `eqhist_${nowStamp}_${idx}` };
      });

      const equipmentRef = doc(db, 'equipments', equipment.id);
      await updateDoc(equipmentRef, {
        manufacturingDate: formData.manufacturingDate,
        manufacturer: formData.manufacturer,
        ancillaryEquipments: formData.ancillaryEquipments,
        history: normalizedHistory,
        equipmentPhoto: formData.equipmentPhoto,
        equipmentPhoto2: formData.equipmentPhoto2
      });
      invalidateEquipmentsCache();

      try {
        await Promise.all(
          normalizedHistory.map((row, idx) =>
            syncEquipmentRepairToChangePoint(equipment, row, idx)
          )
        );
      } catch (syncErr) {
        console.error('Failed to auto-sync equipment history rows to changePoint:', syncErr);
      }

      const nextFormData = { ...formData, history: normalizedHistory };
      setFormData(nextFormData);
      onUpdate({ ...equipment, ...nextFormData });
      setIsEditing(false);
      setSelectedIndices([]);
      alert('수정 내용이 저장되었습니다.');
    } catch (e) {
      console.error('Failed to update equipment history:', e);
      alert('저장 실패!');
    }
  };

  const addHistoryRow = () => {
    if (!isEditing) return;
    setFormData({
      ...formData,
      history: [...formData.history, { date: '', issue: '', action: '', attachment: '', confirmed: false }]
    });
  };

  const updateHistory = (index, field, value) => {
    if (!isEditing) return;
    const newHistory = [...formData.history];
    newHistory[index] = { ...newHistory[index], [field]: value };
    setFormData({ ...formData, history: newHistory });
  };

  const tableInputStyle = {
    width: '100%',
    border: isEditing ? '1px solid #bfdbfe' : '1px solid transparent',
    borderRadius: '3px',
    padding: '6px',
    outline: 'none',
    background: isEditing ? '#f8fafc' : 'transparent',
    color: '#0f172a',
    cursor: isEditing ? 'text' : 'default'
  };

  return (
    <div className="modal-backdrop active" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="modal-content" style={{ width: '95%', maxWidth: '920px', maxHeight: '95vh', display: 'flex', flexDirection: 'column', padding: '0', borderRadius: '12px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header" style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="modal-title" style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span>📄 설비 이력 카드 상세 정보</span>
            <span style={{
              fontSize: '12px',
              padding: '3px 10px',
              borderRadius: '999px',
              background: isEditing ? '#dbeafe' : '#e2e8f0',
              color: isEditing ? '#1d4ed8' : '#475569',
              fontWeight: 600
            }}>
              {isEditing ? "✏️ 수정 모드 — 변경 후 하단 '수정 저장'을 눌러주세요" : "🔒 조회 전용 — 하단 '카드수정' 클릭 시 편집 가능"}
            </span>
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
                  <td style={{ border: '1px solid #000', padding: '4px 8px' }}>
                    {isEditing ? (
                      <input
                        type="date"
                        max="9999-12-31"
                        style={{ ...tableInputStyle, textAlign: 'center' }}
                        value={formData.manufacturingDate}
                        onChange={e => {
                          if (!isEditing) return;
                          setFormData({ ...formData, manufacturingDate: e.target.value });
                        }}
                      />
                    ) : (
                      <span style={{ display: 'inline-block', padding: '4px 0', color: '#0f172a' }}>
                        {formData.manufacturingDate}
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <th style={{ border: '1px solid #000', padding: '8px', background: '#fff' }}>제 작 처</th>
                  <td colSpan="3" style={{ border: '1px solid #000', padding: '4px 8px 4px 16px', textAlign: 'left' }}>
                    <input
                      type="text"
                      readOnly={!isEditing}
                      tabIndex={isEditing ? 0 : -1}
                      style={{ ...tableInputStyle, textAlign: 'left' }}
                      value={formData.manufacturer}
                      onChange={e => {
                        if (!isEditing) return;
                        setFormData({ ...formData, manufacturer: e.target.value });
                      }}
                    />
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
                      <input type="text" readOnly={!isEditing} tabIndex={isEditing ? 0 : -1} style={{ ...tableInputStyle, textAlign: 'center' }} value={eq.name} onChange={e => {
                        if (!isEditing) return;
                        const newAnc = [...formData.ancillaryEquipments];
                        newAnc[i] = { ...newAnc[i], name: e.target.value };
                        setFormData({...formData, ancillaryEquipments: newAnc});
                      }} />
                    </td>
                    <td style={{ border: '1px solid #000', padding: '4px' }}>
                      <input type="text" readOnly={!isEditing} tabIndex={isEditing ? 0 : -1} style={{ ...tableInputStyle, textAlign: 'center' }} value={eq.spec} onChange={e => {
                        if (!isEditing) return;
                        const newAnc = [...formData.ancillaryEquipments];
                        newAnc[i] = { ...newAnc[i], spec: e.target.value };
                        setFormData({...formData, ancillaryEquipments: newAnc});
                      }} />
                    </td>
                    <td style={{ border: '1px solid #000', padding: '4px' }}>
                      <input type="text" readOnly={!isEditing} tabIndex={isEditing ? 0 : -1} style={{ ...tableInputStyle, textAlign: 'center' }} value={eq.qty} onChange={e => {
                        if (!isEditing) return;
                        const newAnc = [...formData.ancillaryEquipments];
                        newAnc[i] = { ...newAnc[i], qty: e.target.value };
                        setFormData({...formData, ancillaryEquipments: newAnc});
                      }} />
                    </td>
                    <td style={{ border: '1px solid #000', padding: '4px' }}>
                      <input type="text" readOnly={!isEditing} tabIndex={isEditing ? 0 : -1} style={{ ...tableInputStyle, textAlign: 'center' }} value={eq.manufacturer} onChange={e => {
                        if (!isEditing) return;
                        const newAnc = [...formData.ancillaryEquipments];
                        newAnc[i] = { ...newAnc[i], manufacturer: e.target.value };
                        setFormData({...formData, ancillaryEquipments: newAnc});
                      }} />
                    </td>
                    <td style={{ border: '1px solid #000', padding: '4px' }}>
                      <input type="text" readOnly={!isEditing} tabIndex={isEditing ? 0 : -1} style={{ ...tableInputStyle, textAlign: 'center' }} value={eq.note} onChange={e => {
                        if (!isEditing) return;
                        const newAnc = [...formData.ancillaryEquipments];
                        newAnc[i] = { ...newAnc[i], note: e.target.value };
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
                  <th colSpan="2" style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', background: '#fff' }}>설비사진</th>
                </tr>
                <tr>
                  {[
                    { slot: 0, src: formData.equipmentPhoto, label: '설비 사진 1' },
                    { slot: 1, src: formData.equipmentPhoto2, label: '설비 사진 2' }
                  ].map(({ slot, src, label }) => (
                    <td key={slot} style={{ border: '1px solid #000', padding: '12px', width: '50%', verticalAlign: 'middle' }}>
                      <div
                        data-eq-photo-slot={slot + 1}
                        style={{
                          width: '300px',
                          maxWidth: '100%',
                          height: '400px',
                          margin: '0 auto',
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          background: '#f8fafc',
                          border: isEditing
                            ? '2px dashed #60a5fa'
                            : (src ? 'none' : '1px dashed #cbd5e1'),
                          borderRadius: '4px',
                          position: 'relative',
                          overflow: 'hidden',
                          boxSizing: 'border-box'
                        }}
                      >
                        {src ? (
                          <img
                            src={src}
                            alt={label}
                            style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }}
                          />
                        ) : isEditing ? (
                          <span style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.5 }}>
                            클릭하여 {label} 업로드<br />
                            <span style={{ fontSize: '11px', color: '#94a3b8' }}>(가로 300 × 세로 400)</span>
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '13px' }}>등록된 사진 없음</span>
                        )}
                        {isEditing && (
                          <>
                            <input
                              type="file"
                              accept="image/*"
                              multiple={slot === 0}
                              onChange={(e) => handlePhotoSlotUpload(slot, e)}
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer', zIndex: 1 }}
                              title={`${label} 변경/업로드 (클릭)`}
                            />
                            {src && (
                              <>
                                <div
                                  style={{
                                    position: 'absolute',
                                    bottom: '8px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    zIndex: 2,
                                    pointerEvents: 'none',
                                    background: 'rgba(15, 23, 42, 0.72)',
                                    color: '#fff',
                                    fontSize: '11px',
                                    fontWeight: 600,
                                    padding: '4px 10px',
                                    borderRadius: '999px',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  📷 클릭하여 사진 변경
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => handleClearPhotoSlot(slot, e)}
                                  title={`${label} 삭제`}
                                  style={{
                                    position: 'absolute',
                                    top: '6px',
                                    right: '6px',
                                    zIndex: 2,
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '999px',
                                    border: 'none',
                                    background: 'rgba(15, 23, 42, 0.65)',
                                    color: '#fff',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    lineHeight: 1,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                >
                                  &times;
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td colSpan="2" style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>
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
                      <input
                        type="checkbox"
                        disabled={!isEditing}
                        style={{ cursor: isEditing ? 'pointer' : 'not-allowed' }}
                        onChange={(e) => {
                          if (!isEditing) return;
                          if (e.target.checked) setSelectedIndices(formData.history.map((_, i) => i));
                          else setSelectedIndices([]);
                        }}
                        checked={formData.history.length > 0 && selectedIndices.length === formData.history.length}
                      />
                    </th>
                    <th rowSpan="2" style={{ borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '12px 8px', width: '13%', fontWeight: 'bold' }}>일 자</th>
                    <th colSpan="3" style={{ borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1', padding: '8px', letterSpacing: '4px', fontWeight: 'bold' }}>설 비 이 력</th>
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
                        <input
                          type="checkbox"
                          disabled={!isEditing}
                          style={{ cursor: isEditing ? 'pointer' : 'not-allowed' }}
                          checked={selectedIndices.includes(i)}
                          onChange={() => toggleSelection(i)}
                        />
                      </td>
                      <td style={{ borderRight: '1px solid #cbd5e1', padding: '4px' }}>
                        {isEditing ? (
                          <input
                            type="date"
                            max="9999-12-31"
                            style={{ ...tableInputStyle, textAlign: 'center' }}
                            value={row.date}
                            onChange={e => updateHistory(i, 'date', e.target.value)}
                          />
                        ) : (
                          <span style={{ display: 'inline-block', padding: '6px 0', color: '#0f172a' }}>
                            {row.date}
                          </span>
                        )}
                      </td>
                      <td style={{ borderRight: '1px solid #cbd5e1', padding: '4px' }}>
                        <input
                          type="text"
                          readOnly={!isEditing}
                          tabIndex={isEditing ? 0 : -1}
                          style={tableInputStyle}
                          value={row.issue}
                          onChange={e => updateHistory(i, 'issue', e.target.value)}
                          placeholder={isEditing ? '내용 입력...' : ''}
                        />
                      </td>
                      <td style={{ borderRight: '1px solid #cbd5e1', padding: '4px' }}>
                        <input
                          type="text"
                          readOnly={!isEditing}
                          tabIndex={isEditing ? 0 : -1}
                          style={tableInputStyle}
                          value={row.action}
                          onChange={e => updateHistory(i, 'action', e.target.value)}
                          placeholder={isEditing ? '조치 내용...' : ''}
                        />
                      </td>
                      <td style={{ borderRight: '1px solid #cbd5e1', padding: '4px' }}>
                        {row.repairDetails ? (
                          <button 
                            type="button"
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
                            type="button"
                            disabled={!isEditing}
                            onClick={() => {
                              if (!isEditing) return;
                              setEditingRepairIndex(i);
                            }}
                            style={{
                              width: '100%',
                              padding: '6px',
                              background: '#e2e8f0',
                              color: '#1e293b',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: isEditing ? 'pointer' : 'not-allowed',
                              opacity: isEditing ? 1 : 0.45,
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
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
              <button
                type="button"
                disabled={!isEditing}
                className="btn btn-sm"
                style={{
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  fontWeight: 'bold',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: isEditing ? 'pointer' : 'not-allowed',
                  opacity: isEditing ? 1 : 0.45
                }}
                onClick={addHistoryRow}
              >
                + 이력 행 추가
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '8px 24px', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            닫기
          </button>
          <button
            type="button"
            className="btn"
            disabled={!isEditing}
            onClick={handleDeleteSelected}
            title={isEditing ? '선택한 이력 삭제' : "'카드수정'을 클릭한 후 삭제할 수 있습니다"}
            style={{
              padding: '8px 24px',
              background: '#fee2e2',
              color: '#991b1b',
              border: 'none',
              borderRadius: '6px',
              cursor: isEditing ? 'pointer' : 'not-allowed',
              opacity: isEditing ? 1 : 0.45,
              fontWeight: 'bold'
            }}
          >
            삭제
          </button>
          <button
            type="button"
            className="btn"
            disabled={isEditing}
            onClick={() => setIsEditing(true)}
            style={{
              padding: '8px 24px',
              background: isEditing ? '#e2e8f0' : '#dbeafe',
              color: isEditing ? '#94a3b8' : '#1d4ed8',
              border: isEditing ? 'none' : '1px solid #93c5fd',
              borderRadius: '6px',
              cursor: isEditing ? 'default' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            카드수정
          </button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!isEditing}
            onClick={handleSave}
            style={{
              padding: '8px 24px',
              background: isEditing ? '#2563eb' : '#cbd5e1',
              color: isEditing ? '#fff' : '#64748b',
              border: 'none',
              borderRadius: '6px',
              cursor: isEditing ? 'pointer' : 'not-allowed',
              fontWeight: 'bold'
            }}
          >
            수정 저장
          </button>
        </div>
        
      </div>
      {editingRepairIndex !== null && (() => {
        const targetRow = formData.history[editingRepairIndex] || {};
        const mergedInitialData = targetRow.repairDetails
          ? targetRow.repairDetails
          : (targetRow.date || targetRow.issue || targetRow.action)
            ? {
                requestDate: targetRow.date || undefined,
                requestContent: targetRow.issue || '',
                actionContent: targetRow.action || ''
              }
            : undefined;
        return (
          <EquipmentRepairRequestModal
            equipment={equipment}
            initialData={mergedInitialData}
            readOnly={!isEditing}
            onClose={() => setEditingRepairIndex(null)}
            onSave={(data) => handleSaveRepairFromHistory(editingRepairIndex, data)}
          />
        );
      })()}
    </div>
  );
}
