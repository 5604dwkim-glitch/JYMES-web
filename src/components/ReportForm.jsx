import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { addReport } from '../services/firestore';
import { MANUFACTURERS, DEFAULT_PROCESSES, CAR_MODEL_PARTS, DOWNTIME_REASONS } from '../constants/masterData';
import { useNavigate } from 'react-router-dom';

export default function ReportForm() {
  const { userRole } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const isLeaderRole = userRole?.role === 'admin' || userRole?.workerName === '장수미' || userRole?.workerName === '양은주';
  const [formType, setFormType] = useState('standard');

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');

  const [maker, setMaker] = useState(MANUFACTURERS[0].name);
  const [carModel, setCarModel] = useState(MANUFACTURERS[0].models[0].code);
  const [processName, setProcessName] = useState(DEFAULT_PROCESSES[0].name);
  const [partName, setPartName] = useState('');
  
  const [lotFrt, setLotFrt] = useState('');
  const [lotRr, setLotRr] = useState('');
  
  const [targetQty, setTargetQty] = useState('');
  const [actualQty, setActualQty] = useState('');
  const [defectQty, setDefectQty] = useState('');
  
  const [downtimeMinutes, setDowntimeMinutes] = useState('');
  const [downtimeReason, setDowntimeReason] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const parts = CAR_MODEL_PARTS[carModel] || [];
    if (parts.length > 0) {
      setPartName(parts[0].name);
    } else {
      setPartName('기본 부품');
    }
  }, [carModel]);

  const formatLot = (val) => {
    const digits = val.replace(/\D/g, '');
    if (digits.length >= 10) {
      return `${digits.substring(0, 2)}년 ${digits.substring(2, 4)}월 ${digits.substring(4, 6)}일 ${digits.substring(6, 8)}시 ${digits.substring(8, 10)}분`;
    }
    return val;
  };

  const handleLotChange = (e, setter) => {
    setter(e.target.value);
  };

  const handleSubmit = async (e, status) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const reportData = {
        date,
        workHours: `${startTime} ~ ${endTime}`,
        carModel,
        processName,
        workerName: userRole?.workerName || '미상',
        workerId: 'EMP000',
        itemName: partName,
        itemCode: partName,
        targetQty: Number(targetQty) || 0,
        actualQty: Number(actualQty) || 0,
        defectQty: Number(defectQty) || 0,
        materialLots: { frt: formatLot(lotFrt), rr: formatLot(lotRr) },
        isLeaderForm: formType === 'leader',
        downtimeMinutes: Number(downtimeMinutes) || 0,
        downtimeReason,
        notes,
        status,
      };

      await addReport(reportData);
      
      alert(`작업일보가 ${status} 되었습니다.`);
      navigate(status === '임시저장' ? '/drafts' : '/reports');
    } catch (err) {
      alert('오류가 발생했습니다: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '80px' }}>
      <div className="card" style={{ marginBottom: '16px', padding: '12px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>{t('form_select_label')}</span>
            <span style={{ fontSize: '11px', background: isLeaderRole ? 'rgba(124, 58, 237, 0.15)' : 'rgba(5, 150, 105, 0.15)', color: isLeaderRole ? 'var(--accent-purple)' : 'var(--accent-emerald)', padding: '3px 8px', borderRadius: '4px', fontWeight: 700 }}>
              {isLeaderRole ? `👑 반장 권한 (${userRole?.workerName || '관리자'})` : `👤 일반 작업자 (${userRole?.workerName || '작업자'})`}
            </span>
          </div>

          <div className="touch-chip-group" style={{ gap: '6px' }}>
            <div 
              className={`touch-chip ${formType === 'standard' ? 'active' : ''}`} 
              style={{ minWidth: '130px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer' }}
              onClick={() => setFormType('standard')}
            >
              📱 모바일 원터치 양식
            </div>
            <div 
              className={`touch-chip ${formType === 'leader' ? 'active' : ''}`} 
              style={{ minWidth: '140px', padding: '6px 12px', fontSize: '12px', opacity: isLeaderRole ? 1 : 0.5, cursor: isLeaderRole ? 'pointer' : 'not-allowed' }}
              onClick={() => isLeaderRole && setFormType('leader')}
            >
              {!isLeaderRole && '🔒 '}📋 작업일보(반장)
            </div>
          </div>
        </div>
      </div>

      {formType === 'standard' ? (
        <form style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card">
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '10px', display: 'block' }}>
              📅 1. 작업 일자 & 시간
            </label>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t('form_work_date')}</label>
                <input type="date" className="form-control" value={date} onChange={e => setDate(e.target.value)} required />
              </div>
              <div style={{ flex: 1, minWidth: '100px' }}>
                <label style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: 700 }}>{t('start_time')}</label>
                <input type="time" className="form-control" value={startTime} onChange={e => setStartTime(e.target.value)} required />
              </div>
              <div style={{ flex: 1, minWidth: '100px' }}>
                <label style={{ fontSize: '11px', color: 'var(--accent-blue)', fontWeight: 700 }}>{t('end_time')}</label>
                <input type="time" className="form-control" value={endTime} onChange={e => setEndTime(e.target.value)} required />
              </div>
            </div>
          </div>

          <div className="card">
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '10px', display: 'block' }}>
              🚘 2. 차종 및 제조사 선택
            </label>
            <div style={{ marginBottom: '14px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>제조사</span>
              <div className="touch-chip-group">
                {MANUFACTURERS.map(m => (
                  <div key={m.name} className={`touch-chip ${maker === m.name ? 'active' : ''}`} style={{ cursor: 'pointer', padding: '8px 12px', fontWeight: 700 }} onClick={() => { setMaker(m.name); setCarModel(m.models[0].code); }}>
                    {m.name}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent-blue)', display: 'block', marginBottom: '6px' }}>세부 차종</span>
              <div className="touch-chip-group">
                {MANUFACTURERS.find(m => m.name === maker)?.models.map(c => (
                  <div key={c.code} className={`touch-chip ${carModel === c.code ? 'active' : ''}`} style={{ cursor: 'pointer', padding: '6px 12px' }} onClick={() => setCarModel(c.code)}>
                    {c.code}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '10px', display: 'block' }}>
              🏭 3. 생산공정 선택
            </label>
            <div className="touch-chip-group">
              {DEFAULT_PROCESSES.map(p => (
                <div key={p.name} className={`touch-chip ${processName === p.name ? 'active' : ''}`} style={{ cursor: 'pointer', padding: '6px 12px' }} onClick={() => setProcessName(p.name)}>
                  {p.name}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '10px', display: 'block' }}>
              🧪 4. 세부 부품 및 소재 LOT
            </label>
            <div style={{ marginBottom: '12px' }}>
              <select className="form-control" value={partName} onChange={e => setPartName(e.target.value)}>
                {(CAR_MODEL_PARTS[carModel] || [{name: '기본 부품'}]).map(p => (
                  <option key={p.name} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>FRT 소재 LOT (숫자 10자리)</label>
                <input type="text" className="form-control" placeholder="예: 2607251330" value={lotFrt} onChange={e => handleLotChange(e, setLotFrt)} onBlur={() => setLotFrt(formatLot(lotFrt))} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>RR 소재 LOT (숫자 10자리)</label>
                <input type="text" className="form-control" placeholder="예: 2607251430" value={lotRr} onChange={e => handleLotChange(e, setLotRr)} onBlur={() => setLotRr(formatLot(lotRr))} />
              </div>
            </div>
          </div>

          <div className="card">
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '10px', display: 'block' }}>
              🔢 5. 생산실적
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>목표 수량</label>
                <input type="number" className="form-control" min="0" value={targetQty} onChange={e => setTargetQty(e.target.value)} placeholder="0" />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--accent-emerald)', fontWeight: 700 }}>완료 수량</label>
                <input type="number" className="form-control" min="0" value={actualQty} onChange={e => setActualQty(e.target.value)} placeholder="0" />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--accent-rose)', fontWeight: 700 }}>불량 수량</label>
                <input type="number" className="form-control" min="0" value={defectQty} onChange={e => setDefectQty(e.target.value)} placeholder="0" />
              </div>
            </div>
          </div>

          <div className="card">
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-blue)', marginBottom: '10px', display: 'block' }}>
              📝 6. 비가동 및 특이사항
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>비가동 시간(분)</label>
                <input type="number" className="form-control" min="0" value={downtimeMinutes} onChange={e => setDowntimeMinutes(e.target.value)} placeholder="0분" />
              </div>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>비가동 사유</label>
                <select className="form-control" value={downtimeReason} onChange={e => setDowntimeReason(e.target.value)}>
                  <option value="">사유 없음 (정상가동)</option>
                  {DOWNTIME_REASONS.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                </select>
              </div>
            </div>
            <textarea className="form-control" rows="3" placeholder="작업 특이사항 입력" value={notes} onChange={e => setNotes(e.target.value)}></textarea>
          </div>

          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px 16px', background: 'rgba(255,255,255,0.95)', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '10px', zIndex: 100 }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={(e) => handleSubmit(e, '임시저장')} disabled={isSubmitting}>
              📁 임시 저장
            </button>
            <button type="button" className="btn btn-primary" style={{ flex: 1 }} onClick={(e) => handleSubmit(e, '승인 대기')} disabled={isSubmitting}>
              🚀 작업일보 제출
            </button>
          </div>
        </form>
      ) : (
        <div className="card" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          반장 전용 작업일보 폼 영역 (표 형식의 복합 폼) - 리액트 전환 중
        </div>
      )}
    </div>
  );
}