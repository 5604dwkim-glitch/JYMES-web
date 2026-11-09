import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import {
  TPM_MARKS,
  TPM_CIRCLED_NUMBERS,
  DEFAULT_TPM_GUIDE_PHOTO,
  createDefaultTpmTemplate,
  createEmptyTpmLog,
  getTpmLogKey,
  getRowWheelSpec,
  getSavedManagerStamp,
  saveManagerStamp
} from '../../constants/tpmLogTemplate';
import TpmWheelNumberPickerModal from './TpmWheelNumberPickerModal';
import { printTpmLogSheet } from '../../utils/printTpmLog';
import { syncTpmAbnormalToRepairAndChangePoint } from '../../services/changePointAutoSync';

const BORDER = '1px solid #000';
const MARK_COLORS = { O: '#15803d', X: '#dc2626', '△': '#d97706' };

const readAndResizePhoto = (file, maxWidth = 600, maxHeight = 800) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('파일 읽기 오류'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(reader.result);
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * ratio));
        canvas.height = Math.max(1, Math.round(img.height * ratio));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

const cloneTemplate = (tpl) => {
  const base = createDefaultTpmTemplate();
  if (!tpl || !Array.isArray(tpl.items) || tpl.items.length === 0) return base;
  return {
    legend: Array.from({ length: 10 }, (_, i) => (tpl.legend && tpl.legend[i]) || ''),
    weekly: Array.from({ length: 5 }, (_, i) => ({
      part: tpl.weekly?.[i]?.part ?? base.weekly[i].part,
      criterion: tpl.weekly?.[i]?.criterion ?? base.weekly[i].criterion
    })),
    items: tpl.items.map(it => ({
      id: it.id,
      name: it.name || '',
      nameEn: it.nameEn || '',
      rows: (it.rows || []).map(r => ({ id: r.id, criterion: r.criterion || '' }))
    }))
  };
};

const normalizeLog = (log) => {
  const empty = createEmptyTpmLog();
  if (!log) return empty;
  return {
    weekly: empty.weekly.map((w, i) => ({ ...w, ...(log.weekly?.[i] || {}) })),
    daily: log.daily || {},
    worker: log.worker || {},
    manager: log.manager || {}
  };
};

export default function EquipmentTpmLogModal({ equipment, onClose, onUpdate, initialYear, initialMonth }) {
  const { userRole } = useAuth();
  const now = new Date();
  const isAdmin = userRole?.role === 'admin';

  const startYear = initialYear || now.getFullYear();
  const startMonth = initialMonth || (now.getMonth() + 1);

  const [eqData, setEqData] = useState(equipment);
  const [year, setYear] = useState(startYear);
  const [month, setMonth] = useState(startMonth);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState(() => cloneTemplate(equipment.tpmTemplate));
  const [photo, setPhoto] = useState(equipment.tpmPhoto || '');
  const [log, setLog] = useState(() =>
    normalizeLog(equipment.tpmLogs?.[getTpmLogKey(startYear, startMonth)])
  );
  const [activeWheelCell, setActiveWheelCell] = useState(null); // { rowId, day, label, currentVal, spec }
  const [managerStampInput, setManagerStampInput] = useState(() =>
    getSavedManagerStamp(userRole?.workerName)
  );

  const daysInMonth = new Date(year, month, 0).getDate();
  const displayPhoto = photo || DEFAULT_TPM_GUIDE_PHOTO;
  const workerStampName =
    userRole?.workerName && userRole.workerName !== '관리자' ? userRole.workerName : '확인';

  const hasDayWorkerInspection = (targetDay, targetLog = log, targetTemplate = template) => {
    if (String(targetLog?.worker?.[targetDay] ?? '').trim()) return true;
    return (targetTemplate?.items || []).some((item) =>
      (item.rows || []).some((row) => String(targetLog?.daily?.[row.id]?.[targetDay] ?? '').trim() !== '')
    );
  };

  const changePeriod = (nextYear, nextMonth) => {
    if (isEditing) return;
    setActiveWheelCell(null);
    setYear(nextYear);
    setMonth(nextMonth);
    setLog(normalizeLog(eqData.tpmLogs?.[getTpmLogKey(nextYear, nextMonth)]));
  };

  const handleSave = async () => {
    if (!isEditing || saving) return;
    setActiveWheelCell(null);
    setSaving(true);
    try {
      const key = getTpmLogKey(year, month);
      await updateDoc(doc(db, 'equipments', equipment.id), {
        tpmTemplate: template,
        tpmPhoto: photo,
        [`tpmLogs.${key}`]: log
      });
      let latestHistory = eqData.history || [];
      try {
        for (let d = 1; d <= daysInMonth; d += 1) {
          const dayIssues = [];
          (template.items || []).forEach((item) => {
            (item.rows || []).forEach((row) => {
              const val = String(log.daily?.[row.id]?.[d] ?? '').trim();
              if (!val) return;
              const wheelSpec = getRowWheelSpec(row, item);
              const outOfSpec =
                wheelSpec &&
                val !== 'O' &&
                val !== 'X' &&
                val !== '△' &&
                Number.isFinite(Number(val)) &&
                (Number(val) < wheelSpec.minSpec || Number(val) > wheelSpec.maxSpec);

              if (val === 'X' || val === '△' || outOfSpec) {
                dayIssues.push({
                  label: item.name || '점검항목',
                  criterion: outOfSpec
                    ? `${row.criterion || ''} / 입력:${val}${wheelSpec.unit}`
                    : (row.criterion || ''),
                  mark: val === '△' ? '△' : 'X'
                });
              }
            });
          });

          if (dayIssues.length > 0) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayWorker = String(log.worker?.[d] ?? '').trim() || workerStampName;
            const syncRes = await syncTpmAbnormalToRepairAndChangePoint({
              equipment: { ...eqData, history: latestHistory },
              dateYmd: dateStr,
              abnormalItems: dayIssues,
              workerName: dayWorker
            });
            if (syncRes?.updatedHistory) {
              latestHistory = syncRes.updatedHistory;
            }
          }
        }
      } catch (syncErr) {
        console.error('Failed to auto-sync monthly TPM log abnormal items:', syncErr);
      }

      const updated = {
        ...eqData,
        history: latestHistory,
        tpmTemplate: template,
        tpmPhoto: photo,
        tpmLogs: { ...(eqData.tpmLogs || {}), [key]: log }
      };
      setEqData(updated);
      if (onUpdate) onUpdate(updated);
      setIsEditing(false);
      alert('TPM 일지가 저장되었습니다.');
    } catch (e) {
      console.error('Failed to save TPM log:', e);
      alert('저장 실패!');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkManagerConfirm = async () => {
    if (!isAdmin || saving) return;
    const stampVal = saveManagerStamp(managerStampInput);
    setManagerStampInput(stampVal);

    const targetDays = [];
    for (let d = 1; d <= daysInMonth; d += 1) {
      if (!hasDayWorkerInspection(d)) continue;
      if (String(log.manager?.[d] ?? '').trim()) continue;
      targetDays.push(d);
    }

    const targetWeeks = [];
    (log.weekly || []).forEach((w, idx) => {
      if (String(w?.result ?? '').trim() && !String(w?.confirm ?? '').trim()) {
        targetWeeks.push(idx);
      }
    });

    if (targetDays.length === 0 && targetWeeks.length === 0) {
      return;
    }

    const nextManager = { ...(log.manager || {}) };
    targetDays.forEach((d) => {
      nextManager[d] = stampVal;
    });

    const nextWeekly = (log.weekly || []).map((w, idx) =>
      targetWeeks.includes(idx) ? { ...w, confirm: stampVal } : w
    );

    const nextLog = {
      ...log,
      manager: nextManager,
      weekly: nextWeekly
    };

    if (isEditing) {
      setLog(nextLog);
      return;
    }

    setSaving(true);
    try {
      const key = getTpmLogKey(year, month);
      await updateDoc(doc(db, 'equipments', equipment.id), {
        [`tpmLogs.${key}`]: nextLog
      });
      const updated = {
        ...eqData,
        tpmLogs: { ...(eqData.tpmLogs || {}), [key]: nextLog }
      };
      setLog(nextLog);
      setEqData(updated);
      if (onUpdate) onUpdate(updated);
    } catch (err) {
      console.error('Failed to bulk confirm manager stamp:', err);
      alert('관리자 확인 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (!window.confirm('수정 중인 내용을 취소하고 마지막 저장 상태로 되돌리시겠습니까?')) return;
    setActiveWheelCell(null);
    setTemplate(cloneTemplate(eqData.tpmTemplate));
    setPhoto(eqData.tpmPhoto || '');
    setLog(normalizeLog(eqData.tpmLogs?.[getTpmLogKey(year, month)]));
    setIsEditing(false);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!isEditing || !file) return;
    try {
      setPhoto(await readAndResizePhoto(file));
    } catch (err) {
      console.error(err);
      alert('이미지 처리 중 오류가 발생했습니다.');
    }
  };

  const cycleDailyMark = (rowId, day) => {
    if (!isEditing || day > daysInMonth) return;
    setLog(prev => {
      const current = prev.daily[rowId]?.[day] || '';
      const next = TPM_MARKS[(TPM_MARKS.indexOf(current) + 1) % TPM_MARKS.length];
      const rowMarks = { ...(prev.daily[rowId] || {}) };
      if (next) rowMarks[day] = next;
      else delete rowMarks[day];
      return { ...prev, daily: { ...prev.daily, [rowId]: rowMarks } };
    });
  };

  const setDailyCellValue = (rowId, day, nextVal) => {
    if (!isEditing || day > daysInMonth) return;
    const trimmed = nextVal !== undefined && nextVal !== null ? String(nextVal).trim() : '';
    setLog(prev => {
      const rowMarks = { ...(prev.daily[rowId] || {}) };
      if (trimmed) rowMarks[day] = trimmed;
      else delete rowMarks[day];
      return { ...prev, daily: { ...prev.daily, [rowId]: rowMarks } };
    });
  };

  const toggleStamp = (field, day) => {
    if (!isEditing || day > daysInMonth) return;
    if (field === 'manager') {
      if (!isAdmin) {
        alert('관리자 확인은 관리자 계정에서만 가능합니다.');
        return;
      }
      const existing = String(log.manager?.[day] ?? '').trim();
      if (!existing && !hasDayWorkerInspection(day)) {
        alert(`${month}월 ${day}일에는 작업자 점검 기록이 없어 관리자 확인을 입력할 수 없습니다.`);
        return;
      }
      const savedMgrStamp = saveManagerStamp(managerStampInput);
      setManagerStampInput(savedMgrStamp);
      setLog(prev => {
        const next = { ...prev.manager };
        if (next[day]) delete next[day];
        else next[day] = savedMgrStamp;
        return { ...prev, manager: next };
      });
      return;
    }

    setLog(prev => {
      const next = { ...prev[field] };
      if (next[day]) delete next[day];
      else next[day] = workerStampName;
      return { ...prev, [field]: next };
    });
  };

  const cycleWeeklyResult = (index) => {
    if (!isEditing) return;
    setLog(prev => {
      const current = prev.weekly[index].result || '';
      const next = TPM_MARKS[(TPM_MARKS.indexOf(current) + 1) % TPM_MARKS.length];
      const weekly = prev.weekly.map((w, i) => (i === index ? { ...w, result: next } : w));
      return { ...prev, weekly };
    });
  };

  const updateWeekly = (index, field, value) => {
    if (!isEditing) return;
    if (field === 'confirm' && !isAdmin) return;
    setLog(prev => ({
      ...prev,
      weekly: prev.weekly.map((w, i) => (i === index ? { ...w, [field]: value } : w))
    }));
  };

  const updateTemplateWeekly = (index, field, value) => {
    if (!isEditing) return;
    setTemplate(prev => ({
      ...prev,
      weekly: prev.weekly.map((w, i) => (i === index ? { ...w, [field]: value } : w))
    }));
  };

  const updateLegend = (index, value) => {
    if (!isEditing) return;
    setTemplate(prev => ({ ...prev, legend: prev.legend.map((l, i) => (i === index ? value : l)) }));
  };

  const updateItem = (itemIndex, field, value) => {
    if (!isEditing) return;
    setTemplate(prev => ({
      ...prev,
      items: prev.items.map((it, i) => (i === itemIndex ? { ...it, [field]: value } : it))
    }));
  };

  const updateItemCriterion = (itemIndex, rowIndex, value) => {
    if (!isEditing) return;
    setTemplate(prev => ({
      ...prev,
      items: prev.items.map((it, i) =>
        i === itemIndex
          ? { ...it, rows: it.rows.map((r, j) => (j === rowIndex ? { ...r, criterion: value } : r)) }
          : it
      )
    }));
  };

  const cellInputStyle = {
    width: '100%',
    border: isEditing ? '1px solid #bfdbfe' : '1px solid transparent',
    background: isEditing ? '#f8fafc' : 'transparent',
    padding: '3px 4px',
    fontSize: '12px',
    textAlign: 'center',
    outline: 'none',
    color: '#0f172a',
    boxSizing: 'border-box'
  };

  const tdBase = { border: BORDER, padding: 0, textAlign: 'center', fontSize: '12px', background: '#fff' };
  const thBase = { border: BORDER, padding: '4px', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', background: '#f1f5f9' };

  const renderMarkButton = (value, onClick, disabledCell) => (
    <div
      role={isEditing && !disabledCell ? 'button' : undefined}
      onClick={onClick}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '26px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '13px',
        color: MARK_COLORS[value] || '#0f172a',
        cursor: isEditing && !disabledCell ? 'pointer' : 'default',
        userSelect: 'none'
      }}
    >
      {value}
    </div>
  );

  const renderWheelNumericCell = (row, item, wheelSpec, day, value, disabledCell) => {
    const isSelectedCell = activeWheelCell?.rowId === row.id && activeWheelCell?.day === day;
    const isX = value === 'X';
    const isLegacyMark = value === 'O' || value === '△';
    const textLen = String(value || '').length;
    return (
      <div
        role={isEditing && !disabledCell ? 'button' : undefined}
        onClick={(e) => {
          if (!isEditing || day > daysInMonth) return;
          e.stopPropagation();
          const initialVal = isX || isLegacyMark ? '' : value;
          const shortLabel = (row.criterion || '').includes(':')
            ? row.criterion.split(':')[0].trim()
            : (item?.name || '수치 선택');
          setActiveWheelCell({
            rowId: row.id,
            day,
            label: shortLabel,
            currentVal: initialVal,
            spec: wheelSpec
          });
        }}
        title={value ? `${day}일: ${value}${!isX && !isLegacyMark ? ` ${wheelSpec.unit}` : ''}` : undefined}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '26px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: isX || isLegacyMark ? '13px' : (textLen >= 4 ? '9px' : '10.5px'),
          letterSpacing: isX || isLegacyMark ? '0' : '-0.3px',
          lineHeight: 1.05,
          wordBreak: 'break-all',
          color: isX ? '#dc2626' : (isLegacyMark ? MARK_COLORS[value] : '#0f172a'),
          background: isSelectedCell ? '#e0f2fe' : (isEditing && !disabledCell ? '#f8fafc' : 'transparent'),
          boxShadow: isSelectedCell ? 'inset 0 0 0 2px #0284c7' : 'none',
          cursor: isEditing && !disabledCell ? 'pointer' : 'default',
          userSelect: 'none',
          padding: '0 1px',
          boxSizing: 'border-box'
        }}
      >
        {value}
      </div>
    );
  };

  const renderStampRow = (label, field) => (
    <tr>
      <td colSpan={3} style={{ ...tdBase, height: '28px', fontWeight: 'bold' }}>{label}</td>
      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
        const outOfMonth = day > daysInMonth;
        const value = log[field][day] || '';
        return (
          <td
            key={day}
            onClick={() => toggleStamp(field, day)}
            title={value}
            style={{
              ...tdBase,
              background: outOfMonth ? '#e5e7eb' : '#fff',
              cursor: isEditing && !outOfMonth ? 'pointer' : 'default',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              fontSize: '9px',
              color: '#1d4ed8',
              fontWeight: 'bold'
            }}
          >
            {value}
          </td>
        );
      })}
    </tr>
  );

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const yearOptions = [now.getFullYear() - 2, now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];
  if (!yearOptions.includes(year)) yearOptions.push(year);
  yearOptions.sort((a, b) => a - b);

  return (
    <div className="modal-backdrop active" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-content"
        data-tpm-log-modal="1"
        style={{ width: '96%', maxWidth: '1100px', maxHeight: '95vh', display: 'flex', flexDirection: 'column', padding: 0, borderRadius: '12px', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="modal-title" style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <span>📋 TPM 일지 (설비 일상 점검 일지)</span>
            <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '999px', fontWeight: 600, background: isEditing ? '#dbeafe' : '#e2e8f0', color: isEditing ? '#1d4ed8' : '#475569' }}>
              {isEditing
                ? "✏️ 수정 모드 — 일반 칸은 O/X/△ 전환, 온조기·압력(형체/메인)은 스크롤 수치 또는 X 선택 후 '수정 저장'"
                : "🔒 조회 전용 — 하단 '일지수정' 클릭 시 기록 가능"}
            </span>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: '24px', color: '#64748b', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
        </div>

        {/* Body */}
        <div className="modal-body" style={{ overflow: 'auto', flex: 1, padding: '20px', background: '#fff' }}>
          <div data-tpm-log-sheet="1" style={{ minWidth: '980px' }}>
            {/* 상단: 설비명/번호 + 제목 + 회사 */}
            <div style={{ display: 'flex', alignItems: 'stretch', border: BORDER, borderBottom: 'none' }}>
              <div style={{ width: '250px', borderRight: BORDER, fontSize: '13px' }}>
                <div style={{ padding: '4px 8px', borderBottom: BORDER }}>설비명칭 : {eqData.name}</div>
                <div style={{ padding: '4px 8px' }}>설비번호 : {eqData.code}</div>
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px 12px', gap: '6px' }}>
                <div style={{ border: BORDER, padding: '6px 18px', fontSize: '20px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '6px', background: '#fff' }}>
                  <select
                    value={year}
                    disabled={isEditing}
                    onChange={e => changePeriod(Number(e.target.value), month)}
                    style={{ fontSize: '18px', fontWeight: 900, border: 'none', background: 'transparent', cursor: isEditing ? 'not-allowed' : 'pointer' }}
                  >
                    {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <span>年 (</span>
                  <select
                    value={month}
                    disabled={isEditing}
                    onChange={e => changePeriod(year, Number(e.target.value))}
                    style={{ fontSize: '18px', fontWeight: 900, border: 'none', background: 'transparent', cursor: isEditing ? 'not-allowed' : 'pointer' }}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <span>)月 설비 일상 점검 일지</span>
                </div>
              </div>
              <div style={{ width: '170px', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: '6px 10px', fontSize: '14px' }}>
                ㈜ 조영산업
              </div>
            </div>

            {/* 사진 / 번호-부위명칭 / 주간 점검 기록 */}
            <div style={{ display: 'flex', border: BORDER, borderBottom: 'none' }}>
              {/* 사진 */}
              <div style={{ width: '250px', padding: '6px', borderRight: BORDER, boxSizing: 'border-box' }}>
                <div style={{ position: 'relative', width: '100%', height: '280px', background: '#f8fafc', border: isEditing ? '2px dashed #60a5fa' : '1px solid #e2e8f0', boxSizing: 'border-box', overflow: 'hidden' }}>
                  <img src={displayPhoto} alt="설비 사진" style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }} />
                  {isEditing && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        title="TPM 일지 사진 변경 (클릭)"
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                      />
                      <div style={{ position: 'absolute', bottom: '6px', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none', background: 'rgba(15,23,42,0.72)', color: '#fff', fontSize: '11px', fontWeight: 600, padding: '3px 10px', borderRadius: '999px', whiteSpace: 'nowrap' }}>
                        📷 클릭하여 사진 변경
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 번호 / 부위명칭 */}
              <div style={{ width: '200px', padding: '60px 8px 8px', boxSizing: 'border-box' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ ...thBase, width: '36px', background: '#fff' }}>번호</th>
                      <th style={{ ...thBase, background: '#fff' }}>부위명칭</th>
                    </tr>
                  </thead>
                  <tbody>
                    {template.legend.map((name, i) => (
                      <tr key={i}>
                        <td style={{ ...tdBase, height: '20px', fontSize: '11px' }}>{name ? TPM_CIRCLED_NUMBERS[i] : ''}</td>
                        <td style={{ ...tdBase, textAlign: 'left' }}>
                          <input
                            type="text"
                            readOnly={!isEditing}
                            tabIndex={isEditing ? 0 : -1}
                            value={name}
                            onChange={e => updateLegend(i, e.target.value)}
                            style={{ ...cellInputStyle, textAlign: 'left', fontSize: '11px', padding: '1px 3px' }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 주간 점검 기록 */}
              <div style={{ flex: 1, borderLeft: BORDER, display: 'flex', flexDirection: 'column' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', height: '100%' }}>
                  <thead>
                    <tr>
                      <th colSpan={6} style={{ ...thBase, border: 'none', borderBottom: BORDER, background: '#e5e7eb' }}>주간 점검 기록</th>
                    </tr>
                    <tr>
                      <th style={{ ...thBase, border: 'none', borderBottom: BORDER, width: '60px', background: '#fff' }}>구분</th>
                      <th style={{ ...thBase, border: 'none', borderBottom: BORDER, borderLeft: BORDER, width: '90px', background: '#fff' }}>점검부위</th>
                      <th style={{ ...thBase, border: 'none', borderBottom: BORDER, borderLeft: BORDER, background: '#fff' }}>점검기준</th>
                      <th style={{ ...thBase, border: 'none', borderBottom: BORDER, borderLeft: BORDER, width: '50px', background: '#fff' }}>결과</th>
                      <th style={{ ...thBase, border: 'none', borderBottom: BORDER, borderLeft: BORDER, width: '100px', background: '#fff' }}>조치</th>
                      <th style={{ ...thBase, border: 'none', borderBottom: BORDER, borderLeft: BORDER, width: '60px', background: '#fff' }}>확인</th>
                    </tr>
                  </thead>
                  <tbody>
                    {template.weekly.map((w, i) => (
                      <tr key={i}>
                        <td style={{ ...tdBase, border: 'none', borderBottom: i < 4 ? BORDER : 'none', fontSize: '12px' }}>제( {i + 1} )주</td>
                        <td style={{ ...tdBase, border: 'none', borderLeft: BORDER, borderBottom: i < 4 ? BORDER : 'none' }}>
                          <input type="text" readOnly={!isEditing} tabIndex={isEditing ? 0 : -1} value={w.part} onChange={e => updateTemplateWeekly(i, 'part', e.target.value)} style={cellInputStyle} />
                        </td>
                        <td style={{ ...tdBase, border: 'none', borderLeft: BORDER, borderBottom: i < 4 ? BORDER : 'none' }}>
                          <input type="text" readOnly={!isEditing} tabIndex={isEditing ? 0 : -1} value={w.criterion} onChange={e => updateTemplateWeekly(i, 'criterion', e.target.value)} style={cellInputStyle} />
                        </td>
                        <td style={{ ...tdBase, border: 'none', borderLeft: BORDER, borderBottom: i < 4 ? BORDER : 'none' }}>
                          {renderMarkButton(log.weekly[i].result, () => cycleWeeklyResult(i))}
                        </td>
                        <td style={{ ...tdBase, border: 'none', borderLeft: BORDER, borderBottom: i < 4 ? BORDER : 'none' }}>
                          <input type="text" readOnly={!isEditing} tabIndex={isEditing ? 0 : -1} value={log.weekly[i].action} onChange={e => updateWeekly(i, 'action', e.target.value)} style={cellInputStyle} />
                        </td>
                        <td style={{ ...tdBase, border: 'none', borderLeft: BORDER, borderBottom: i < 4 ? BORDER : 'none' }}>
                          <input type="text" readOnly={!isEditing || !isAdmin} tabIndex={isEditing && isAdmin ? 0 : -1} value={log.weekly[i].confirm} onChange={e => updateWeekly(i, 'confirm', e.target.value)} style={cellInputStyle} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 판정 기호 안내 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', border: BORDER, borderBottom: 'none', padding: '8px 10px' }}>
              <div style={{ border: BORDER, padding: '4px 14px', fontSize: '13px', fontWeight: 'bold' }}>
                O : 양호,&nbsp; X : 이상,&nbsp; △ : 수리
              </div>
            </div>

            {/* 설비 일상 점검 (일 단위) */}
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '28px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '130px' }} />
                {days.map(d => <col key={d} />)}
              </colgroup>
              <thead>
                <tr>
                  <th colSpan={2} rowSpan={2} style={{ ...thBase, background: '#fff' }}>부위</th>
                  <th rowSpan={2} style={{ ...thBase, background: '#fff' }}>점검기준</th>
                  <th colSpan={31} style={{ ...thBase, background: '#fff' }}>설비 일상 점검</th>
                </tr>
                <tr>
                  {days.map(d => (
                    <th key={d} style={{ ...thBase, padding: '3px 0', fontSize: '11px', background: d > daysInMonth ? '#e5e7eb' : '#fff' }}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {template.items.map((item, itemIndex) =>
                  item.rows.map((row, rowIndex) => (
                    <tr key={row.id}>
                      {rowIndex === 0 && (
                        <>
                          <td rowSpan={item.rows.length} style={{ ...tdBase, fontSize: '14px' }}>{TPM_CIRCLED_NUMBERS[itemIndex] || itemIndex + 1}</td>
                          <td rowSpan={item.rows.length} style={{ ...tdBase, padding: '2px' }}>
                            <input type="text" readOnly={!isEditing} tabIndex={isEditing ? 0 : -1} value={item.name} onChange={e => updateItem(itemIndex, 'name', e.target.value)} style={{ ...cellInputStyle, fontSize: '12px' }} />
                            <input type="text" readOnly={!isEditing} tabIndex={isEditing ? 0 : -1} value={item.nameEn} onChange={e => updateItem(itemIndex, 'nameEn', e.target.value)} style={{ ...cellInputStyle, fontSize: '10px' }} />
                          </td>
                        </>
                      )}
                      <td style={{ ...tdBase, padding: '2px' }}>
                        <input type="text" readOnly={!isEditing} tabIndex={isEditing ? 0 : -1} value={row.criterion} onChange={e => updateItemCriterion(itemIndex, rowIndex, e.target.value)} style={{ ...cellInputStyle, fontSize: '11px' }} />
                      </td>
                      {days.map(day => {
                        const outOfMonth = day > daysInMonth;
                        const value = log.daily[row.id]?.[day] || '';
                        const rowWheelSpec = getRowWheelSpec(row, item);
                        return (
                          <td key={day} style={{ ...tdBase, height: '30px', background: outOfMonth ? '#e5e7eb' : '#fff', borderStyle: 'dotted solid dotted solid' }}>
                            {rowWheelSpec
                              ? renderWheelNumericCell(row, item, rowWheelSpec, day, value, outOfMonth)
                              : renderMarkButton(value, () => cycleDailyMark(row.id, day), outOfMonth)}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
                {renderStampRow('작업자 확인', 'worker')}
                {renderStampRow('관리자 확인', 'manager')}
              </tbody>
            </table>

            {/* 이상발생 보고 순서 */}
            <div style={{ border: BORDER, borderTop: 'none', padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', fontWeight: 'bold' }}>
              <span>이상발생시처리보고순서 :</span>
              <span style={{ border: BORDER, padding: '2px 8px' }}>작업자</span>
              <span>→</span>
              <span style={{ border: BORDER, padding: '2px 8px' }}>관리자</span>
              <span>→</span>
              <span style={{ border: BORDER, padding: '2px 8px' }}>대표</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {isAdmin && (
              <>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  <span>관리자 확인 표기:</span>
                  <input
                    type="text"
                    maxLength={6}
                    value={managerStampInput}
                    onChange={(e) => setManagerStampInput(e.target.value)}
                    onBlur={() => setManagerStampInput(saveManagerStamp(managerStampInput))}
                    placeholder="예: 김OO / 확인"
                    style={{
                      width: '88px',
                      padding: '6px 8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      textAlign: 'center',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      background: '#ffffff',
                      color: '#1e293b'
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="btn"
                  disabled={saving}
                  onClick={handleBulkManagerConfirm}
                  title="이번 달 작업자 점검 기록이 있는 미확인 날짜들에 관리자 확인을 일괄 입력합니다"
                  style={{
                    padding: '8px 16px',
                    background: '#ede9fe',
                    color: '#5b21b6',
                    border: '1px solid #c4b5fd',
                    borderRadius: '6px',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: '13px'
                  }}
                >
                  ✓ 작성일 관리자 일괄 확인
                </button>
              </>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginLeft: 'auto' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} style={{ padding: '8px 24px', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              닫기
            </button>
            <button
              type="button"
              className="btn"
              onClick={() =>
                printTpmLogSheet({
                  equipment: eqData,
                  year,
                  month,
                  template,
                  log,
                  photo: displayPhoto
                })
              }
              style={{
                padding: '8px 24px',
                background: '#dcfce7',
                color: '#166534',
                border: '1px solid #86efac',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              🖨️ 출력
            </button>
            {isEditing && (
              <button type="button" className="btn" onClick={handleCancelEdit} style={{ padding: '8px 24px', background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                수정 취소
              </button>
            )}
            <button
              type="button"
              className="btn"
              disabled={isEditing}
              onClick={() => setIsEditing(true)}
              style={{ padding: '8px 24px', background: isEditing ? '#e2e8f0' : '#dbeafe', color: isEditing ? '#94a3b8' : '#1d4ed8', border: isEditing ? 'none' : '1px solid #93c5fd', borderRadius: '6px', cursor: isEditing ? 'default' : 'pointer', fontWeight: 'bold' }}
            >
              일지수정
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={!isEditing || saving}
              onClick={handleSave}
              style={{ padding: '8px 24px', background: isEditing ? '#2563eb' : '#cbd5e1', color: isEditing ? '#fff' : '#64748b', border: 'none', borderRadius: '6px', cursor: isEditing ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
            >
              {saving ? '저장 중...' : '수정 저장'}
            </button>
          </div>
        </div>
        {isEditing && activeWheelCell && (
          <TpmWheelNumberPickerModal
            isOpen={Boolean(activeWheelCell)}
            title={`${month}월 ${activeWheelCell.day}일 · ${activeWheelCell.label} 선택`}
            initialValue={activeWheelCell.currentVal}
            defaultCenter={activeWheelCell.spec.defaultCenter}
            tolerance={activeWheelCell.spec.tolerance}
            minSpec={activeWheelCell.spec.minSpec}
            maxSpec={activeWheelCell.spec.maxSpec}
            range={activeWheelCell.spec.range}
            unit={activeWheelCell.spec.unit}
            centerLabel={activeWheelCell.spec.centerLabel || '기준'}
            allowX={true}
            onConfirm={(nextVal) => {
              setDailyCellValue(activeWheelCell.rowId, activeWheelCell.day, nextVal);
              setActiveWheelCell(null);
            }}
            onClose={() => setActiveWheelCell(null)}
          />
        )}
      </div>
    </div>
  );
}
