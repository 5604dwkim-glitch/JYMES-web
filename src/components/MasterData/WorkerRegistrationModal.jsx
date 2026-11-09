import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function WorkerRegistrationModal({ onClose, onSave, existingWorker, defaultPrefix = '' }) {
  const [formData, setFormData] = useState({
    name: '',
    dept: '생산팀',
    process: '소재준비',
    hireDate: new Date().toLocaleDateString('sv-SE'),
    role: '사원',
    id: defaultPrefix ? `${defaultPrefix}` : '',
    photoData: null,
    status: '근무중'
  });
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (existingWorker) {
      setFormData({
        name: existingWorker.name || '',
        dept: existingWorker.dept || '생산팀',
        process: existingWorker.process || '소재준비',
        hireDate: existingWorker.hireDate || existingWorker.joinDate || new Date().toLocaleDateString('sv-SE'),
        role: existingWorker.role || '사원',
        id: existingWorker.id || '',
        photoData: existingWorker.photoData || null,
        status: existingWorker.status || '근무중'
      });
    }
  }, [existingWorker]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextVal = name === 'id' ? value.toUpperCase() : value;
    setFormData(prev => ({ ...prev, [name]: nextVal }));
  };

  const applyIdPrefix = (prefix) => {
    setFormData(prev => {
      const rest = String(prev.id || '').trim().replace(/^[A-Z]{2}/i, '');
      return { ...prev, id: `${prefix}${rest}` };
    });
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        
        const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const x = (canvas.width / scale - img.width) / 2;
        const y = (canvas.height / scale - img.height) / 2;
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, x, y, img.width, img.height, 0, 0, img.width * scale, img.height * scale);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setFormData(prev => ({ ...prev, photoData: dataUrl }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const cleanName = String(formData.name || '').trim();
    const cleanId = String(formData.id || '').trim();
    if (!cleanName || !cleanId) {
      alert('작업자 이름과 사번은 필수 입력 항목입니다.');
      return;
    }
    if (/^(JY|HW|BL)$/i.test(cleanId)) {
      alert(`사번 앞자리(${cleanId.toUpperCase()}) 뒤에 일련번호까지 입력해주세요. (예: ${cleanId.toUpperCase()}26001)`);
      return;
    }
    onSave({ ...formData, name: cleanName, id: cleanId });
  };

  const loginUrl = `${window.location.origin}/login?id=${encodeURIComponent((formData.id || formData.name || '').trim())}&pw=0000&_t=${Date.now()}`; // cache buster

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div className="card" style={{ width: '800px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', backgroundColor: '#fff', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', margin: 0, fontWeight: 800 }}>📋 {existingWorker ? '작업자 정보 수정' : '신규 작업자 이력카드 등록'}</h2>
          <button className="btn btn-secondary" onClick={onClose}>✖ 닫기</button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', border: '2px solid #111', fontSize: '15px', textAlign: 'center' }}>
          <tbody>
            <tr>
              <td colSpan="5" style={{ padding: '16px', fontWeight: '900', fontSize: '24px', letterSpacing: '2px', color: '#111', border: '2px solid #111' }}>
                작업자 실명 이력카드
              </td>
            </tr>
            <tr>
              <td rowSpan="3" style={{ width: '220px', border: '1px solid #111', verticalAlign: 'middle', padding: '10px' }}>
                <div 
                  style={{ width: '160px', height: '213px', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
                  onClick={() => fileInputRef.current.click()}
                >
                  {formData.photoData ? (
                    <img src={formData.photoData} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ color: '#666' }}>
                      <div style={{ fontWeight: 800 }}>📷 사진 등록</div>
                      <div style={{ fontSize: '11px', marginTop: '4px' }}>(300*400)</div>
                    </div>
                  )}
                  <input type="file" accept="image/*" style={{ display: 'none' }} ref={fileInputRef} onChange={handlePhotoUpload} />
                </div>
              </td>
              <td style={{ border: '1px solid #111', padding: '12px', fontWeight: '800', width: '100px', color: '#111' }}>작업자</td>
              <td style={{ border: '1px solid #111', padding: '12px', width: '140px' }}>
                <input type="text" name="name" className="form-control" placeholder="이름 입력" value={formData.name} onChange={handleChange} style={{ width: '100%', textAlign: 'center', fontWeight: 'bold', fontSize: '16px' }} />
              </td>
              <td style={{ border: '1px solid #111', padding: '12px', fontWeight: '800', width: '100px', color: '#111' }}>상태</td>
              <td style={{ border: '1px solid #111', padding: '12px', width: '140px' }}>
                <select name="status" className="form-control" value={formData.status} onChange={handleChange} style={{ width: '100%', fontWeight: 'bold' }}>
                  <option value="근무중">근무중</option>
                  <option value="휴가">휴가</option>
                  <option value="퇴직">퇴직</option>
                </select>
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #111', padding: '12px', fontWeight: '800', color: '#111' }}>소속부서</td>
              <td style={{ border: '1px solid #111', padding: '12px', width: '140px' }}>
                <select name="dept" className="form-control" value={formData.dept} onChange={handleChange} style={{ width: '100%' }}>
                  <option value="생산팀">생산팀</option>
                  <option value="관리팀">관리팀</option>
                  <option value="품질팀">품질팀</option>
                </select>
              </td>
              <td style={{ border: '1px solid #111', padding: '12px', fontWeight: '800', width: '100px', color: '#111' }}>공정</td>
              <td style={{ border: '1px solid #111', padding: '12px', width: '140px' }}>
                <select name="process" className="form-control" value={formData.process} onChange={handleChange} style={{ width: '100%' }}>
                  <option value="소재준비">소재준비</option>
                  <option value="조인트">조인트</option>
                  <option value="후가공">후가공</option>
                  <option value="검사">검사</option>
                  <option value="관리">관리</option>
                  <option value="생산지원">생산지원</option>
                  <option value="연속 압출 및 열가황(Vulcanizing)">연속 압출 및 열가황</option>
                </select>
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #111', padding: '12px', fontWeight: '800', color: '#111' }}>입사일자</td>
              <td style={{ border: '1px solid #111', padding: '12px' }}>
                <input type="date" max="9999-12-31" name="hireDate" className="form-control" value={formData.hireDate} onChange={handleChange} style={{ width: '100%', textAlign: 'center' }} />
              </td>
              <td style={{ border: '1px solid #111', padding: '12px', fontWeight: '800', color: '#111' }}>직급</td>
              <td style={{ border: '1px solid #111', padding: '12px' }}>
                <select name="role" className="form-control" value={formData.role} onChange={handleChange} style={{ width: '100%' }}>
                  <option value="사원">사원</option>
                  <option value="반장">반장</option>
                  <option value="선임">선임</option>
                  <option value="책임">책임</option>
                </select>
              </td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #111', padding: '16px', verticalAlign: 'middle', height: '180px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  {formData.name && formData.id ? (
                    <QRCodeSVG value={loginUrl} size={120} level={"L"} style={{ display: 'block' }} />
                  ) : (
                    <div style={{ fontSize: '12px', color: '#666', fontWeight: 'bold' }}>이름/사번 기입시<br/>QR 생성됨</div>
                  )}
                </div>
              </td>
              <td style={{ border: '1px solid #111', padding: '12px', fontWeight: 800, color: '#111' }}>사번</td>
              <td colSpan="3" style={{ border: '1px solid #111', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '8px' }}>
                  {['JY', 'HW', 'BL'].map((pfx) => {
                    const active = String(formData.id || '').toUpperCase().startsWith(pfx);
                    return (
                      <button
                        key={pfx}
                        type="button"
                        onClick={() => applyIdPrefix(pfx)}
                        style={{
                          padding: '3px 10px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          border: active ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                          background: active ? '#eff6ff' : '#f8fafc',
                          color: active ? '#1d4ed8' : '#475569'
                        }}
                      >
                        {pfx} 선택
                      </button>
                    );
                  })}
                </div>
                <input type="text" name="id" className="form-control" placeholder="사번 입력 (예: JY26001 / HW26001 / BL26001)" value={formData.id} onChange={handleChange} style={{ width: '100%', textAlign: 'center', textTransform: 'uppercase', fontWeight: 900, fontSize: '18px', color: '#111', letterSpacing: '1px' }} />
              </td>
            </tr>
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
          <button className="btn btn-secondary" onClick={onClose} style={{ padding: '10px 20px', fontWeight: 'bold' }}>취소</button>
          <button className="btn btn-primary" onClick={handleSave} style={{ padding: '10px 20px', fontWeight: 'bold' }}>✅ 저장 및 완료</button>
        </div>
      </div>
    </div>
  );
}
