import React, { useEffect, useRef, useState } from 'react';
import { doc, getDoc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../../firebase';
import EquipmentRepairRequestModal from './EquipmentRepairRequestModal';
import { invalidateEquipmentsCache, fetchEquipmentPhotos, saveEquipmentPhotos, fetchReportDowntimePhotos } from '../../services/firestore';
import { syncEquipmentRepairToChangePoint } from '../../services/changePointAutoSync';
import { getEquipmentCategory } from '../../constants/equipmentCategories';

const ANCILLARY_FIELD_KEYS = ['name', 'spec', 'qty', 'manufacturer', 'note'];

const buildEqHistoryMobileCss = (prefix) => `
  ${prefix} > .modal-content {
    width: 96% !important;
    max-width: 96vw !important;
    max-height: 94vh !important;
    padding: 0 !important;
    border-radius: 10px !important;
  }
  ${prefix} .eq-modal-header {
    padding: 12px 14px !important;
    gap: 8px !important;
  }
  ${prefix} .eq-modal-header .modal-title {
    font-size: 15px !important;
    gap: 6px !important;
  }
  ${prefix} .eq-status-badge {
    font-size: 11px !important;
    padding: 3px 8px !important;
    line-height: 1.35 !important;
  }
  ${prefix} .eq-modal-body {
    padding: 12px !important;
  }
  ${prefix} .eq-doc-top {
    flex-direction: column !important;
    align-items: stretch !important;
    gap: 8px !important;
    margin-bottom: 12px !important;
  }
  ${prefix} .eq-doc-title {
    margin: 0 !important;
    font-size: 19px !important;
    letter-spacing: 1px !important;
    text-align: center !important;
  }
  ${prefix} .eq-approval-table {
    width: 180px !important;
    margin-left: auto !important;
    font-size: 11.5px !important;
  }
  ${prefix} .eq-approval-sign-cell {
    height: 28px !important;
  }
  ${prefix} .eq-paper-box {
    margin-bottom: 16px !important;
    overflow: hidden !important;
  }
  ${prefix} .eq-basic-table {
    table-layout: fixed !important;
    width: 100% !important;
    font-size: 11.5px !important;
  }
  ${prefix} .eq-basic-table th {
    width: 21% !important;
    padding: 6px 3px !important;
    font-size: 11px !important;
    white-space: nowrap !important;
  }
  ${prefix} .eq-basic-table td {
    width: 29% !important;
    padding: 6px 4px !important;
    word-break: break-word !important;
    overflow-wrap: anywhere !important;
  }
  ${prefix} .eq-basic-table td[colspan="3"] {
    width: auto !important;
    padding: 6px 8px !important;
  }
  ${prefix} .eq-basic-table th.eq-anc-banner {
    width: auto !important;
    letter-spacing: 4px !important;
    padding: 8px !important;
    font-size: 12.5px !important;
  }
  ${prefix} .eq-ancillary-table {
    table-layout: fixed !important;
    width: 100% !important;
    font-size: 11px !important;
  }
  ${prefix} .eq-ancillary-table th:nth-child(1),
  ${prefix} .eq-ancillary-table td:nth-child(1) { width: 24% !important; }
  ${prefix} .eq-ancillary-table th:nth-child(2),
  ${prefix} .eq-ancillary-table td:nth-child(2) { width: 28% !important; }
  ${prefix} .eq-ancillary-table th:nth-child(3),
  ${prefix} .eq-ancillary-table td:nth-child(3) { width: 11% !important; }
  ${prefix} .eq-ancillary-table th:nth-child(4),
  ${prefix} .eq-ancillary-table td:nth-child(4) { width: 21% !important; }
  ${prefix} .eq-ancillary-table th:nth-child(5),
  ${prefix} .eq-ancillary-table td:nth-child(5) { width: 16% !important; }
  ${prefix} .eq-ancillary-table th {
    padding: 6px 2px !important;
    font-size: 10.5px !important;
    white-space: nowrap !important;
    letter-spacing: -0.3px !important;
  }
  ${prefix} .eq-ancillary-table td {
    padding: 5px 3px !important;
    word-break: break-word !important;
    overflow-wrap: anywhere !important;
    vertical-align: middle !important;
  }
  ${prefix} .eq-ancillary-table input,
  ${prefix} .eq-basic-table input {
    min-width: 0 !important;
    width: 100% !important;
    padding: 4px 2px !important;
    font-size: 11px !important;
  }
  ${prefix} .eq-photo-table,
  ${prefix} .eq-photo-table tbody,
  ${prefix} .eq-photo-table tr,
  ${prefix} .eq-photo-table th,
  ${prefix} .eq-photo-table td {
    display: block !important;
    width: 100% !important;
    box-sizing: border-box !important;
  }
  ${prefix} .eq-photo-table th,
  ${prefix} .eq-photo-table td {
    border-left: none !important;
    border-right: none !important;
  }
  ${prefix} .eq-photo-table td.eq-photo-cell {
    padding: 10px !important;
  }
  ${prefix} [data-eq-photo-slot] {
    width: 100% !important;
    max-width: 100% !important;
    height: auto !important;
    aspect-ratio: 3 / 4;
  }
  ${prefix} [data-eq-photo-slot][data-has-photo="1"][data-editing="0"] {
    aspect-ratio: auto !important;
    background: #f8fafc !important;
  }
  ${prefix} [data-eq-photo-slot][data-has-photo="1"][data-editing="0"] img {
    width: 100% !important;
    height: auto !important;
    max-height: 360px !important;
    object-fit: contain !important;
  }
  ${prefix} [data-eq-photo-slot][data-has-photo="0"][data-editing="0"] {
    aspect-ratio: auto !important;
    min-height: 68px !important;
    padding: 12px !important;
  }
  ${prefix} [data-eq-photo-slot][data-editing="1"] {
    max-width: 240px !important;
  }
  ${prefix} [data-eq-photo-slot][data-editing="1"] img {
    object-fit: contain !important;
  }
  ${prefix} .eq-history-table thead {
    display: none !important;
  }
  ${prefix} .eq-history-table,
  ${prefix} .eq-history-table tbody {
    display: block !important;
    width: 100% !important;
  }
  ${prefix} .eq-history-table tr[data-eq-empty-row="1"] {
    display: none !important;
  }
  ${prefix} .eq-history-table tr.eq-history-mobile-empty {
    display: block !important;
    padding: 0 !important;
  }
  ${prefix} .eq-history-table tr.eq-history-mobile-empty td {
    display: block !important;
    width: 100% !important;
    border: none !important;
    padding: 18px 12px !important;
    text-align: center !important;
    color: #64748b !important;
    font-size: 12.5px !important;
  }
  ${prefix} .eq-history-table tr[data-eq-history-row="1"] {
    display: block !important;
    padding: 10px 12px !important;
    border-bottom: 1px solid #cbd5e1 !important;
    background: #ffffff !important;
  }
  ${prefix} .eq-history-table tr[data-eq-history-row="1"]:last-child {
    border-bottom: none !important;
  }
  ${prefix} .eq-history-table tr[data-eq-history-row="1"] td {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: 10px !important;
    width: 100% !important;
    border: none !important;
    padding: 4px 0 !important;
    text-align: left !important;
    font-size: 12px !important;
  }
  ${prefix} .eq-history-table tr[data-eq-history-row="1"] td[data-label]::before {
    content: attr(data-label);
    flex: 0 0 84px;
    font-weight: 700;
    font-size: 11.5px;
    color: #475569;
    white-space: nowrap;
  }
  ${prefix} .eq-history-table tr[data-eq-history-row="1"] td.eq-hist-check[data-editing="0"] {
    display: none !important;
  }
  ${prefix} .eq-history-table tr[data-eq-history-row="1"] td:not(.eq-hist-check) > * {
    flex: 1 1 auto !important;
    min-width: 0 !important;
    text-align: left !important;
  }
  ${prefix} .eq-history-table tr[data-eq-history-row="1"] td > button {
    text-align: center !important;
  }
  ${prefix} .eq-history-table tr[data-eq-history-row="1"] td.eq-hist-check input[type="checkbox"] {
    flex: 0 0 auto !important;
    width: auto !important;
  }
  ${prefix} .eq-modal-footer {
    padding: 10px 12px !important;
    display: flex !important;
    flex-wrap: wrap !important;
    gap: 8px !important;
    justify-content: stretch !important;
  }
  ${prefix} .eq-modal-footer button {
    flex: 1 1 calc(50% - 4px) !important;
    min-width: 0 !important;
    padding: 10px 8px !important;
    font-size: 13px !important;
    white-space: nowrap !important;
    text-align: center !important;
  }
`;

const EQ_HISTORY_SCOPED_CSS = `
  [data-eq-history-modal="1"] .eq-history-mobile-empty {
    display: none;
  }
  @media (max-width: 768px) {
    ${buildEqHistoryMobileCss('[data-eq-history-modal="1"]')}
  }
  ${buildEqHistoryMobileCss('body.mobile-preview-mode [data-eq-history-modal="1"]')}
`;

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

export default function EquipmentHistoryCardModal({
  equipment,
  onClose,
  onUpdate,
  readOnly = false,
  disableBackdropClose = false,
  initialAutoSyncKey = '',
  initialOpenRepair = false
}) {
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
  // 대표사진은 별도 컬렉션(equipment_photos)에 분리 저장 — 사용자가 바꾼 슬롯만 저장 대상으로 추적
  const [dirtyPhotos, setDirtyPhotos] = useState({ equipmentPhoto: false, equipmentPhoto2: false });

  const initialHistoryRef = useRef(equipment.history);

  useEffect(() => {
    let alive = true;
    fetchEquipmentPhotos(equipment.id).then((photos) => {
      if (!alive) return;
      setFormData((prev) => ({
        ...prev,
        equipmentPhoto: photos.equipmentPhoto || prev.equipmentPhoto,
        equipmentPhoto2: photos.equipmentPhoto2 || prev.equipmentPhoto2
      }));
    });

    const hist = Array.isArray(initialHistoryRef.current) ? initialHistoryRef.current : [];
    const needHydrate = hist.some((row) => row?.repairDetails && !row.repairDetails.beforeImage && (row.repairDetails.beforePhotoId || row.autoSyncKey));
    if (needHydrate) {
      Promise.all([
        getDoc(doc(db, 'equipments', equipment.id)).catch(() => null),
        fetchReportDowntimePhotos(hist.map((r) => r?.repairDetails?.beforePhotoId).filter(Boolean)).catch(() => ({}))
      ]).then(([fullSnap, dtPhotos]) => {
        if (!alive) return;
        const fullHist = fullSnap?.exists?.() && Array.isArray(fullSnap.data()?.history) ? fullSnap.data().history : hist;
        const mergedHist = fullHist.map((row) => {
          const rd = row?.repairDetails;
          if (!rd) return row;
          if (!rd.beforeImage && rd.beforePhotoId && dtPhotos[rd.beforePhotoId]) {
            return { ...row, repairDetails: { ...rd, beforeImage: dtPhotos[rd.beforePhotoId] } };
          }
          return row;
        });
        setFormData((prev) => ({ ...prev, history: mergedHist }));
      });
    }

    return () => {
      alive = false;
    };
  }, [equipment.id]);

  const [editingState, setEditingState] = useState(false);
  const isEditing = !readOnly && editingState;
  const setIsEditing = (next) => {
    if (readOnly) return;
    setEditingState(next);
  };
  const [editingRepairIndex, setEditingRepairIndex] = useState(null);
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [directRepairActive, setDirectRepairActive] = useState(false);
  const focusedRowRef = useRef(null);
  const autoOpenHandledRef = useRef(false);

  const focusRowIdx = initialAutoSyncKey
    ? (formData.history || []).findIndex(
        (r) => r?.autoSyncKey === initialAutoSyncKey || r?.syncId === initialAutoSyncKey
      )
    : -1;

  useEffect(() => {
    if (focusRowIdx < 0) return;
    const t = setTimeout(() => {
      focusedRowRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    }, 120);
    return () => clearTimeout(t);
  }, [focusRowIdx]);

  useEffect(() => {
    if (!initialOpenRepair || readOnly || autoOpenHandledRef.current || focusRowIdx < 0) return;
    autoOpenHandledRef.current = true;
    setEditingState(true);
    setDirectRepairActive(true);
    setEditingRepairIndex(focusRowIdx);
  }, [initialOpenRepair, readOnly, focusRowIdx]);

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
        setDirtyPhotos({ equipmentPhoto: true, equipmentPhoto2: true });
      } else {
        const imgData = await readAndOptimizePhoto(files[0]);
        const fieldKey = slotIndex === 0 ? 'equipmentPhoto' : 'equipmentPhoto2';
        setFormData(prev => ({ ...prev, [fieldKey]: imgData }));
        setDirtyPhotos(prev => ({ ...prev, [fieldKey]: true }));
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
    setDirtyPhotos(prev => ({ ...prev, [fieldKey]: true }));
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

  const handleSaveRepairFromHistory = async (index, repairData) => {
    if (!isEditing) return;
    const newHistory = [...formData.history];
    const prevRow = newHistory[index] || {};
    const isCompletedStatus = repairData?.repairStatus === '완료';
    const nextRow = {
      ...prevRow,
      syncId: prevRow.syncId || `eqhist_${Date.now()}_${index}`,
      date: prevRow.date || repairData.requestDate || '',
      issue: repairData.requestContent,
      action: repairData.actionContent || (isCompletedStatus ? '수리완료' : prevRow.action || ''),
      attachment: '수리의뢰서',
      confirmed: Boolean(prevRow.confirmed || repairData.qualityPic || repairData.verificationResult),
      repairDetails: repairData
    };
    newHistory[index] = nextRow;
    setFormData({ ...formData, history: newHistory });
    setEditingRepairIndex(null);

    if (directRepairActive && equipment?.id) {
      try {
        const equipmentRef = doc(db, 'equipments', equipment.id);
        const snap = await getDoc(equipmentRef).catch(() => null);
        const freshHistory = snap?.exists?.() && Array.isArray(snap.data()?.history)
          ? [...snap.data().history]
          : [...newHistory];
        const matchIdx = nextRow.autoSyncKey
          ? freshHistory.findIndex((h) => h?.autoSyncKey === nextRow.autoSyncKey)
          : index;
        if (matchIdx >= 0 && matchIdx < freshHistory.length) {
          freshHistory[matchIdx] = nextRow;
        } else {
          freshHistory.push(nextRow);
        }
        await updateDoc(equipmentRef, { history: freshHistory });
        invalidateEquipmentsCache();
        try {
          await syncEquipmentRepairToChangePoint(equipment, nextRow, matchIdx >= 0 ? matchIdx : index);
        } catch (syncErr) {
          console.error('Failed to auto-sync direct equipment repair to changePoint:', syncErr);
        }
        const stripPhoto = (obj) => {
          const out = { ...obj };
          ['equipmentPhoto', 'equipmentPhoto2'].forEach((key) => {
            if (typeof out[key] === 'string' && out[key].startsWith('data:image')) delete out[key];
          });
          return out;
        };
        if (onUpdate) onUpdate({ ...stripPhoto(equipment), ...stripPhoto({ ...formData, history: freshHistory }) });
        setDirectRepairActive(false);
        setEditingState(false);
        alert(isCompletedStatus ? '설비 수리 완료 처리되었으며 변동점에 반영되었습니다.' : '설비 수리 의뢰 내용이 저장되었으며 변동점에 반영되었습니다.');
        onClose?.();
      } catch (err) {
        console.error('Failed direct save equipment repair:', err);
        alert('수리의뢰 저장 중 오류가 발생했습니다.');
      }
    }
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

      // 대표사진: 변경한 슬롯(또는 본 문서에 옛 base64 사진이 남아 있는 슬롯)만 equipment_photos 에 먼저 저장하고,
      // 본 문서에서는 해당 필드를 제거(새 사진) 또는 일반 값으로 갱신(삭제/기본 경로)한다.
      const isDataUrl = (v) => typeof v === 'string' && v.startsWith('data:image');
      const photoPatch = {};
      const mainPhotoUpdate = {};
      ['equipmentPhoto', 'equipmentPhoto2'].forEach((key) => {
        const legacyInMain = isDataUrl(equipment[key]);
        if (!dirtyPhotos[key] && !legacyInMain) return;
        const value = formData[key] || '';
        photoPatch[key] = value;
        mainPhotoUpdate[key] = isDataUrl(value) ? deleteField() : value;
      });
      if (Object.keys(photoPatch).length > 0) {
        await saveEquipmentPhotos(equipment.id, photoPatch);
      }

      const equipmentRef = doc(db, 'equipments', equipment.id);
      await updateDoc(equipmentRef, {
        manufacturingDate: formData.manufacturingDate,
        manufacturer: formData.manufacturer,
        ancillaryEquipments: formData.ancillaryEquipments,
        history: normalizedHistory,
        ...mainPhotoUpdate
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
      setDirtyPhotos({ equipmentPhoto: false, equipmentPhoto2: false });
      // 부모 목록 상태에는 사진(base64)을 싣지 않는다 (이후 본 문서로 되돌아가는 것을 방지)
      const stripPhoto = (obj) => {
        const out = { ...obj };
        ['equipmentPhoto', 'equipmentPhoto2'].forEach((key) => {
          if (isDataUrl(out[key])) delete out[key];
        });
        return out;
      };
      onUpdate({ ...stripPhoto(equipment), ...stripPhoto(nextFormData) });
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
    <div
      className="modal-backdrop active"
      data-eq-history-modal="1"
      onClick={disableBackdropClose ? undefined : onClose}
      style={{ zIndex: 9999 }}
    >
      <style>{EQ_HISTORY_SCOPED_CSS}</style>
      <div className="modal-content" style={{ width: '95%', maxWidth: '920px', maxHeight: '95vh', display: 'flex', flexDirection: 'column', padding: '0', borderRadius: '12px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="modal-header eq-modal-header" style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="modal-title" style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span>📄 설비 이력 카드 상세 정보</span>
            <span className="eq-status-badge" style={{
              fontSize: '12px',
              padding: '3px 10px',
              borderRadius: '999px',
              background: isEditing ? '#dbeafe' : '#e2e8f0',
              color: isEditing ? '#1d4ed8' : '#475569',
              fontWeight: 600
            }}>
              {readOnly
                ? '👁️ 열람 전용 — QR 스캔 조회 모드 (수정은 관리자만 가능)'
                : isEditing
                  ? "✏️ 수정 모드 — 변경 후 하단 '수정 저장'을 눌러주세요"
                  : "🔒 조회 전용 — 하단 '카드수정' 클릭 시 편집 가능"}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '24px', color: '#64748b', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
        </div>

        {/* Body */}
        <div className="modal-body eq-modal-body" style={{ overflowY: 'auto', flex: 1, padding: '24px', background: '#ffffff' }}>
          
          <div className="eq-doc-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <h2 className="eq-doc-title" style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 0 40px', letterSpacing: '4px', color: '#000' }}>(제조) 설비이력카드</h2>
            <table className="eq-approval-table" style={{ borderCollapse: 'collapse', border: '1px solid #000', fontSize: '14px', width: '200px', textAlign: 'center' }}>
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>작성</td>
                  <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>검토</td>
                  <td style={{ border: '1px solid #000', padding: '4px', fontWeight: 'bold' }}>승인</td>
                </tr>
                <tr>
                  <td className="eq-approval-sign-cell" style={{ border: '1px solid #000', height: '40px' }}></td>
                  <td className="eq-approval-sign-cell" style={{ border: '1px solid #000', height: '40px' }}></td>
                  <td className="eq-approval-sign-cell" style={{ border: '1px solid #000', height: '40px' }}></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="eq-paper-box" style={{ border: '2px solid #000', marginBottom: '24px' }}>
            <table className="eq-basic-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '14px' }}>
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
                    {isEditing ? (
                      <input
                        type="text"
                        style={{ ...tableInputStyle, textAlign: 'left' }}
                        value={formData.manufacturer}
                        onChange={e => {
                          setFormData({ ...formData, manufacturer: e.target.value });
                        }}
                      />
                    ) : (
                      <div style={{ ...tableInputStyle, textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-word', minHeight: '24px' }}>
                        {formData.manufacturer}
                      </div>
                    )}
                  </td>
                </tr>
                <tr>
                  <th colSpan="4" className="eq-anc-banner" style={{ border: '1px solid #000', padding: '12px', background: '#fff', letterSpacing: '16px' }}>부 대 설 비</th>
                </tr>
              </tbody>
            </table>
            <table className="eq-ancillary-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px', marginTop: '-1px' }}>
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
                    {ANCILLARY_FIELD_KEYS.map((fieldKey) => (
                      <td key={fieldKey} style={{ border: '1px solid #000', padding: '4px' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            style={{ ...tableInputStyle, textAlign: 'center' }}
                            value={eq[fieldKey]}
                            onChange={e => {
                              const newAnc = [...formData.ancillaryEquipments];
                              newAnc[i] = { ...newAnc[i], [fieldKey]: e.target.value };
                              setFormData({ ...formData, ancillaryEquipments: newAnc });
                            }}
                          />
                        ) : (
                          <div style={{ ...tableInputStyle, textAlign: 'center', whiteSpace: 'pre-wrap', wordBreak: 'break-word', minHeight: '24px' }}>
                            {eq[fieldKey]}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            
            <table className="eq-photo-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px', marginTop: '-1px' }}>
              <tbody>
                <tr>
                  <th colSpan="2" style={{ border: '1px solid #000', padding: '8px', textAlign: 'left', background: '#fff' }}>설비사진</th>
                </tr>
                <tr>
                  {[
                    { slot: 0, src: formData.equipmentPhoto, label: '설비 사진 1' },
                    { slot: 1, src: formData.equipmentPhoto2, label: '설비 사진 2' }
                  ].map(({ slot, src, label }) => (
                    <td key={slot} className="eq-photo-cell" style={{ border: '1px solid #000', padding: '12px', width: '50%', verticalAlign: 'middle' }}>
                      <div
                        data-eq-photo-slot={slot + 1}
                        data-has-photo={src ? '1' : '0'}
                        data-editing={isEditing ? '1' : '0'}
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
              <table className="eq-history-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px' }}>
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
                    <tr
                      key={i}
                      ref={i === focusRowIdx ? focusedRowRef : undefined}
                      data-eq-history-row="1"
                      data-focused-row={i === focusRowIdx ? '1' : undefined}
                      style={{
                        borderBottom: '1px solid #cbd5e1',
                        ...(i === focusRowIdx ? { background: '#eff6ff', boxShadow: 'inset 4px 0 0 #2563eb' } : {})
                      }}
                    >
                      <td className="eq-hist-check" data-label="선택" data-editing={isEditing ? '1' : '0'} style={{ borderRight: '1px solid #cbd5e1', padding: '4px' }}>
                        <input
                          type="checkbox"
                          disabled={!isEditing}
                          style={{ cursor: isEditing ? 'pointer' : 'not-allowed' }}
                          checked={selectedIndices.includes(i)}
                          onChange={() => toggleSelection(i)}
                        />
                      </td>
                      <td data-label="일자" style={{ borderRight: '1px solid #cbd5e1', padding: '4px' }}>
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
                      <td data-label="문제점/내용" style={{ borderRight: '1px solid #cbd5e1', padding: '4px' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            style={tableInputStyle}
                            value={row.issue}
                            onChange={e => updateHistory(i, 'issue', e.target.value)}
                            placeholder="내용 입력..."
                          />
                        ) : (
                          <div style={{ ...tableInputStyle, whiteSpace: 'pre-wrap', wordBreak: 'break-word', minHeight: '24px' }}>
                            {row.issue}
                          </div>
                        )}
                      </td>
                      <td data-label="대책/조치" style={{ borderRight: '1px solid #cbd5e1', padding: '4px' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            style={tableInputStyle}
                            value={row.action}
                            onChange={e => updateHistory(i, 'action', e.target.value)}
                            placeholder="조치 내용..."
                          />
                        ) : (
                          <div style={{ ...tableInputStyle, whiteSpace: 'pre-wrap', wordBreak: 'break-word', minHeight: '24px' }}>
                            {row.action}
                          </div>
                        )}
                      </td>
                      <td data-label="수리의뢰서" style={{ borderRight: '1px solid #cbd5e1', padding: '4px' }}>
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
                            {row.repairDetails.repairStatus === '완료' ? '수리완료' : '수리의뢰요청'}{(row.repairDetails.beforeImage || row.repairDetails.beforePhotoId) ? ' 📷' : ''}
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
                      <td data-label="확인" style={{ padding: '4px', fontWeight: 'bold', color: '#2563eb' }}>
                        {(row.issue || row.repairDetails) ? '승인' : ''}
                      </td>
                    </tr>
                  ))}
                  {formData.history.length === 0 && (
                    <tr className="eq-history-mobile-empty">
                      <td colSpan="6">등록된 수리 및 점검 이력이 없습니다.</td>
                    </tr>
                  )}
                  {Array.from({ length: Math.max(1, 10 - formData.history.length) }).map((_, i) => (
                    <tr key={`empty-${i}`} data-eq-empty-row="1" style={{ borderBottom: '1px solid #cbd5e1' }}>
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
            
            {!readOnly && (
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
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="modal-footer eq-modal-footer" style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{ padding: '8px 24px', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            닫기
          </button>
          {!readOnly && (
            <>
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
            </>
          )}
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
