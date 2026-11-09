import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import MoldRepairRequestModal from './MoldRepairRequestModal';
import { invalidateMoldsCache } from '../../services/firestore';
import { syncMoldRepairToChangePoint } from '../../services/changePointAutoSync';

const addThreeMonths = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  d.setMonth(d.getMonth() + 3);
  return d.toLocaleDateString('sv-SE');
};

export default function MoldHistoryCardModal({ mold, onClose, onUpdate }) {
  const [formData, setFormData] = useState({
    receiptDate: mold.receiptDate || mold.manufactureDate || '',
    productionStartDate:
      mold.productionStartDate || addThreeMonths(mold.receiptDate || mold.manufactureDate) || '',
    manufacturer: mold.manufacturer || '',
    history: mold.history || [],
    moldPhoto: mold.moldPhoto || ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingRepairIndex, setEditingRepairIndex] = useState(null);
  const [selectedIndices, setSelectedIndices] = useState([]);

  const handlePhotoUpload = (e) => {
    if (!isEditing) return;
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, moldPhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClearPhoto = (e) => {
    e.stopPropagation();
    if (!isEditing) return;
    setFormData((prev) => ({ ...prev, moldPhoto: '' }));
  };

  const toggleSelection = (index) => {
    if (!isEditing) return;
    if (selectedIndices.includes(index)) {
      setSelectedIndices(selectedIndices.filter((i) => i !== index));
    } else {
      setSelectedIndices([...selectedIndices, index]);
    }
  };

  const handleDeleteSelected = () => {
    if (!isEditing) return;
    if (selectedIndices.length === 0) {
      alert('삭제할 항목을 선택해주세요.');
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
        return { ...row, syncId: `moldhist_${nowStamp}_${idx}` };
      });

      const moldRef = doc(db, 'molds', mold.id);
      await updateDoc(moldRef, {
        receiptDate: formData.receiptDate,
        productionStartDate: formData.productionStartDate,
        manufacturer: formData.manufacturer,
        history: normalizedHistory,
        moldPhoto: formData.moldPhoto
      });
      invalidateMoldsCache();

      try {
        await Promise.all(
          normalizedHistory.map((row, idx) => syncMoldRepairToChangePoint(mold, row, idx))
        );
      } catch (syncErr) {
        console.error('Failed to auto-sync mold history rows to changePoint:', syncErr);
      }

      const nextFormData = { ...formData, history: normalizedHistory };
      setFormData(nextFormData);
      onUpdate({ ...mold, ...nextFormData });
      setIsEditing(false);
      setSelectedIndices([]);
      alert('수정 내용이 저장되었습니다.');
    } catch (e) {
      console.error('Failed to update mold history:', e);
      alert('저장 실패!');
    }
  };

  const addHistoryRow = () => {
    if (!isEditing) return;
    setFormData({
      ...formData,
      history: [
        ...formData.history,
        { date: '', issue: '', action: '', attachment: '', confirmed: false }
      ]
    });
  };

  const updateHistory = (index, field, value) => {
    if (!isEditing) return;
    const newHistory = [...formData.history];
    newHistory[index] = { ...newHistory[index], [field]: value };
    setFormData({ ...formData, history: newHistory });
  };

  const labelStyle = {
    background: '#f1f5f9',
    fontWeight: 'bold',
    color: '#334155',
    borderBottom: '1px solid #cbd5e1',
    borderRight: '1px solid #cbd5e1',
    padding: '10px 16px',
    textAlign: 'center',
    width: '25%'
  };
  const valStyle = {
    borderBottom: '1px solid #cbd5e1',
    padding: '10px 16px',
    textAlign: 'center',
    color: '#0f172a'
  };
  const inputStyle = {
    width: '100%',
    border: '1px solid #bfdbfe',
    background: '#f8fafc',
    padding: '6px',
    textAlign: 'center',
    borderRadius: '4px',
    outline: 'none',
    color: '#0f172a'
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
      <div
        className="modal-content"
        style={{
          width: '95%',
          maxWidth: '900px',
          maxHeight: '95vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          borderRadius: '12px',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            padding: '16px 24px',
            background: '#f8fafc',
            borderBottom: '1px solid #cbd5e1',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div
            className="modal-title"
            style={{
              fontSize: '18px',
              fontWeight: 'bold',
              color: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap'
            }}
          >
            <span>📄 금형 이력 카드 상세 정보</span>
            <span
              style={{
                fontSize: '12px',
                padding: '3px 10px',
                borderRadius: '999px',
                background: isEditing ? '#dbeafe' : '#e2e8f0',
                color: isEditing ? '#1d4ed8' : '#475569',
                fontWeight: 600
              }}
            >
              {isEditing
                ? "✏️ 수정 모드 — 변경 후 하단 '수정 저장'을 눌러주세요"
                : "🔒 조회 전용 — 하단 '카드수정' 클릭 시 편집 가능"}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              color: '#64748b',
              cursor: 'pointer',
              lineHeight: 1
            }}
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <div
          className="modal-body"
          style={{ overflowY: 'auto', flex: 1, padding: '24px', background: '#ffffff' }}
        >
          <h2
            style={{
              textAlign: 'center',
              fontSize: '28px',
              fontWeight: '900',
              margin: '0 0 24px 0',
              letterSpacing: '8px',
              color: '#0f172a'
            }}
          >
            금 형 이 력 카 드
          </h2>

          {/* Section 1 */}
          <div style={{ marginBottom: '24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                color: '#2563eb',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              <span>📌</span> 1. 금형 기본 정보
            </div>

            <div
              style={{
                display: 'flex',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  width: '350px',
                  minWidth: '350px',
                  borderRight: '1px solid #cbd5e1',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <div
                  style={{
                    background: '#f1f5f9',
                    padding: '10px 16px',
                    fontWeight: 'bold',
                    color: '#334155',
                    textAlign: 'center',
                    borderBottom: '1px solid #cbd5e1',
                    fontSize: '13px'
                  }}
                >
                  사진
                </div>
                <div
                  style={{
                    width: '350px',
                    height: '350px',
                    background: '#f8fafc',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    outline: isEditing ? '2px dashed #60a5fa' : 'none',
                    outlineOffset: '-4px'
                  }}
                >
                  {formData.moldPhoto ? (
                    <img
                      src={formData.moldPhoto}
                      alt="금형 사진"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : isEditing ? (
                    <span style={{ color: '#64748b', fontSize: '13px' }}>
                      클릭하여 350x350 사진 업로드
                    </span>
                  ) : (
                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>등록된 사진 없음</span>
                  )}
                  {isEditing && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          opacity: 0,
                          cursor: 'pointer',
                          zIndex: 1
                        }}
                        title="금형 사진 변경/업로드 (클릭)"
                      />
                      {formData.moldPhoto && (
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
                            onClick={handleClearPhoto}
                            title="금형 사진 삭제"
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
              </div>
              <div style={{ flex: 1 }}>
                <table
                  style={{ width: '100%', height: '100%', borderCollapse: 'collapse', fontSize: '13px' }}
                >
                  <tbody>
                    <tr>
                      <td style={{ ...labelStyle, height: '20%' }}>금형입고</td>
                      <td style={{ ...valStyle, height: '20%' }}>
                        {isEditing ? (
                          <input
                            type="date"
                            max="9999-12-31"
                            style={inputStyle}
                            value={formData.receiptDate || mold.manufactureDate || ''}
                            onChange={(e) => {
                              if (!isEditing) return;
                              const newDate = e.target.value;
                              setFormData({
                                ...formData,
                                receiptDate: newDate,
                                productionStartDate: addThreeMonths(newDate)
                              });
                            }}
                          />
                        ) : (
                          <span style={{ display: 'inline-block', padding: '4px 0', color: '#0f172a' }}>
                            {formData.receiptDate || mold.manufactureDate || '-'}
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ ...labelStyle, height: '20%' }}>품 명</td>
                      <td style={{ ...valStyle, height: '20%' }}>{mold.name || '-'}</td>
                    </tr>
                    <tr>
                      <td style={{ ...labelStyle, height: '20%' }}>품 번</td>
                      <td style={{ ...valStyle, height: '20%' }}>{mold.itemNo || '-'}</td>
                    </tr>
                    <tr>
                      <td style={{ ...labelStyle, height: '20%' }}>생산시점</td>
                      <td style={{ ...valStyle, height: '20%' }}>
                        {isEditing ? (
                          <input
                            type="date"
                            max="9999-12-31"
                            style={inputStyle}
                            value={formData.productionStartDate}
                            onChange={(e) => {
                              if (!isEditing) return;
                              setFormData({ ...formData, productionStartDate: e.target.value });
                            }}
                          />
                        ) : (
                          <span style={{ display: 'inline-block', padding: '4px 0', color: '#0f172a' }}>
                            {formData.productionStartDate || '-'}
                          </span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ ...labelStyle, borderBottom: 'none', height: '20%' }}>금형제작처</td>
                      <td style={{ ...valStyle, borderBottom: 'none', height: '20%' }}>
                        {isEditing ? (
                          <input
                            type="text"
                            style={inputStyle}
                            placeholder="㈜화승R&A"
                            value={formData.manufacturer}
                            onChange={(e) => {
                              if (!isEditing) return;
                              setFormData({ ...formData, manufacturer: e.target.value });
                            }}
                          />
                        ) : (
                          <span style={{ display: 'inline-block', padding: '4px 0', color: '#0f172a' }}>
                            {formData.manufacturer || '-'}
                          </span>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px',
                color: '#2563eb',
                fontWeight: 'bold',
                fontSize: '14px'
              }}
            >
              <span>📝</span> 2. 수리 및 점검 이력
            </div>

            <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden' }}>
              <table
                style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px' }}
              >
                <thead>
                  <tr style={{ background: '#f1f5f9', color: '#334155' }}>
                    <th
                      rowSpan="2"
                      style={{
                        borderBottom: '1px solid #cbd5e1',
                        borderRight: '1px solid #cbd5e1',
                        padding: '12px 4px',
                        width: '4%'
                      }}
                    >
                      <input
                        type="checkbox"
                        disabled={!isEditing}
                        style={{ cursor: isEditing ? 'pointer' : 'not-allowed' }}
                        onChange={(e) => {
                          if (!isEditing) return;
                          if (e.target.checked) {
                            setSelectedIndices(formData.history.map((_, i) => i));
                          } else {
                            setSelectedIndices([]);
                          }
                        }}
                        checked={
                          formData.history.length > 0 &&
                          selectedIndices.length === formData.history.length
                        }
                      />
                    </th>
                    <th
                      rowSpan="2"
                      style={{
                        borderBottom: '1px solid #cbd5e1',
                        borderRight: '1px solid #cbd5e1',
                        padding: '12px 8px',
                        width: '13%',
                        fontWeight: 'bold'
                      }}
                    >
                      일 자
                    </th>
                    <th
                      colSpan="3"
                      style={{
                        borderBottom: '1px solid #cbd5e1',
                        borderRight: '1px solid #cbd5e1',
                        padding: '8px',
                        letterSpacing: '4px',
                        fontWeight: 'bold'
                      }}
                    >
                      금 형 이 력
                    </th>
                    <th
                      rowSpan="2"
                      style={{
                        borderBottom: '1px solid #cbd5e1',
                        padding: '12px 8px',
                        width: '8%',
                        fontWeight: 'bold'
                      }}
                    >
                      확인
                    </th>
                  </tr>
                  <tr style={{ background: '#f8fafc', color: '#334155' }}>
                    <th
                      style={{
                        borderBottom: '1px solid #cbd5e1',
                        borderRight: '1px solid #cbd5e1',
                        padding: '8px',
                        width: '30%',
                        fontWeight: '600'
                      }}
                    >
                      문제점 및 내용
                    </th>
                    <th
                      style={{
                        borderBottom: '1px solid #cbd5e1',
                        borderRight: '1px solid #cbd5e1',
                        padding: '8px',
                        width: '30%',
                        fontWeight: '600'
                      }}
                    >
                      대책 및 조치사항
                    </th>
                    <th
                      style={{
                        borderBottom: '1px solid #cbd5e1',
                        borderRight: '1px solid #cbd5e1',
                        padding: '8px',
                        width: '15%',
                        fontWeight: '600'
                      }}
                    >
                      수리의뢰서
                      <br />
                      첨부파일
                    </th>
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
                            onChange={(e) => updateHistory(i, 'date', e.target.value)}
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
                          onChange={(e) => updateHistory(i, 'issue', e.target.value)}
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
                          onChange={(e) => updateHistory(i, 'action', e.target.value)}
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
                              background:
                                row.repairDetails.repairStatus === '완료' ? '#2563eb' : '#f59e0b',
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
                        {row.issue || row.repairDetails ? '승인' : ''}
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
        <div
          className="modal-footer"
          style={{
            padding: '16px 24px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            style={{
              padding: '8px 24px',
              background: '#e2e8f0',
              color: '#1e293b',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
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

      {editingRepairIndex !== null &&
        (() => {
          const targetRow = formData.history[editingRepairIndex] || {};
          const mergedInitialData = targetRow.repairDetails
            ? targetRow.repairDetails
            : targetRow.date || targetRow.issue || targetRow.action
              ? {
                  department: '오록 신천',
                  requestDate: targetRow.date || new Date().toLocaleDateString('sv-SE'),
                  requestType: '수리',
                  pic: '',
                  completionDate: '',
                  remarks: '',
                  requestContent: targetRow.issue || '',
                  actionContent: targetRow.action || '',
                  verificationResult: '',
                  qualityPic: ''
                }
              : undefined;
          return (
            <MoldRepairRequestModal
              mold={mold}
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
