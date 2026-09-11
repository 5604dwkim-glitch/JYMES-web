import React, { useState, useEffect } from 'react';

const processImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 350;
        canvas.height = 350;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 350, 350);
        
        // Scale to fill maintaining aspect ratio
        const scale = Math.max(350 / img.width, 350 / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (350 - w) / 2;
        const y = (350 - h) / 2;
        
        ctx.drawImage(img, x, y, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
};

export default function QPointFormModal({ isOpen, onClose, onSave, initialData, rowData }) {
  const [formData, setFormData] = useState({
    reportDate: new Date().toLocaleDateString('sv-SE'),
    carModel: rowData?.carModel || '',
    partName: rowData?.partName || '',
    partnerName: '',
    devType: '양산',
    partNo: '',
    author: '',
    changeReason: rowData?.issueDetail || '',
    changeWorker: '',
    changeDocs: [],
    changeDocsOther: '',
    reviewNeeds: [],
    reviewNeedsOther: '',
    changeDate: '',
    applyDate: '',
    identifyMethod: '無',
    changeContentText: '',
    beforeImage: '',
    afterImage: '',
    qcPartner: '',
    qcQuantity: '',
    qcContent: '',
    qcResult: '',
    qcApprover1: '',
    qcApprover2: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      // Checkbox array handling
      setFormData(prev => {
        const arr = prev[name];
        if (checked) return { ...prev, [name]: [...arr, value] };
        else return { ...prev, [name]: arr.filter(v => v !== value) };
      });
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (e, field) => {
    if (e.target.files && e.target.files[0]) {
      const dataUrl = await processImage(e.target.files[0]);
      setFormData(prev => ({ ...prev, [field]: dataUrl }));
    }
  };

  const removeImage = (field) => {
    setFormData(prev => ({ ...prev, [field]: '' }));
  };

  const inputStyle = { padding: '6px', border: '1px solid #cbd5e1', borderRadius: '4px', width: '100%', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' };
  const rowStyle = { display: 'flex', gap: '15px', marginBottom: '15px' };
  const colStyle = { flex: 1 };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: '#fff', width: '900px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', position: 'sticky', top: 0, zIndex: 10 }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>변경 내용 이력표 작성</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '20px' }}>
          
          <div style={rowStyle}>
            <div style={colStyle}><label style={labelStyle}>작성일자</label><input type="date" name="reportDate" value={formData.reportDate} onChange={handleChange} style={inputStyle} /></div>
            <div style={colStyle}><label style={labelStyle}>작성자</label><input type="text" name="author" value={formData.author} onChange={handleChange} style={inputStyle} /></div>
            <div style={colStyle}><label style={labelStyle}>협력사명</label><input type="text" name="partnerName" value={formData.partnerName} onChange={handleChange} style={inputStyle} /></div>
          </div>

          <div style={rowStyle}>
            <div style={colStyle}><label style={labelStyle}>차종(연식)</label><input type="text" name="carModel" value={formData.carModel} onChange={handleChange} style={inputStyle} /></div>
            <div style={colStyle}><label style={labelStyle}>품명</label><input type="text" name="partName" value={formData.partName} onChange={handleChange} style={inputStyle} /></div>
            <div style={colStyle}><label style={labelStyle}>품번</label><input type="text" name="partNo" value={formData.partNo} onChange={handleChange} style={inputStyle} /></div>
            <div style={colStyle}><label style={labelStyle}>개발유형</label><input type="text" name="devType" value={formData.devType} onChange={handleChange} style={inputStyle} /></div>
          </div>

          <div style={rowStyle}>
            <div style={colStyle}><label style={labelStyle}>변경 사유</label><input type="text" name="changeReason" value={formData.changeReason} onChange={handleChange} style={inputStyle} /></div>
            <div style={{ width: '200px' }}><label style={labelStyle}>변경 작업자</label><input type="text" name="changeWorker" value={formData.changeWorker} onChange={handleChange} style={inputStyle} /></div>
          </div>

          <div style={rowStyle}>
            <div style={colStyle}>
              <label style={labelStyle}>변경 서류</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12px' }}>
                <label><input type="checkbox" name="changeDocs" value="변경 내용 이력표" checked={formData.changeDocs.includes('변경 내용 이력표')} onChange={handleChange} /> 변경 내용 이력표</label>
                <label><input type="checkbox" name="changeDocs" value="검사성적서" checked={formData.changeDocs.includes('검사성적서')} onChange={handleChange} /> 검사성적서</label>
                <label><input type="checkbox" name="changeDocs" value="기타" checked={formData.changeDocs.includes('기타')} onChange={handleChange} /> 기타</label>
                <input type="text" name="changeDocsOther" value={formData.changeDocsOther} onChange={handleChange} placeholder="기타 내용" style={{ ...inputStyle, width: '150px' }} />
              </div>
            </div>
          </div>

          <div style={rowStyle}>
            <div style={colStyle}>
              <label style={labelStyle}>수요자 검토</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontSize: '12px' }}>
                <label><input type="checkbox" name="reviewNeeds" value="공정점검 필요" checked={formData.reviewNeeds.includes('공정점검 필요')} onChange={handleChange} /> 공정점검 필요</label>
                <label><input type="checkbox" name="reviewNeeds" value="조립적합성 필요" checked={formData.reviewNeeds.includes('조립적합성 필요')} onChange={handleChange} /> 조립적합성 필요</label>
                <label><input type="checkbox" name="reviewNeeds" value="완성차 품질확인 필요" checked={formData.reviewNeeds.includes('완성차 품질확인 필요')} onChange={handleChange} /> 완성차 품질확인 필요</label>
                <label><input type="checkbox" name="reviewNeeds" value="기타" checked={formData.reviewNeeds.includes('기타')} onChange={handleChange} /> 기타</label>
                <input type="text" name="reviewNeedsOther" value={formData.reviewNeedsOther} onChange={handleChange} placeholder="기타 내용" style={{ ...inputStyle, width: '150px' }} />
              </div>
            </div>
          </div>

          <div style={rowStyle}>
            <div style={colStyle}><label style={labelStyle}>변경 일시</label><input type="date" name="changeDate" value={formData.changeDate} onChange={handleChange} style={inputStyle} /></div>
            <div style={colStyle}><label style={labelStyle}>적용 예정일</label><input type="date" name="applyDate" value={formData.applyDate} onChange={handleChange} style={inputStyle} /></div>
            <div style={colStyle}><label style={labelStyle}>변경품 식별표시 방법</label><input type="text" name="identifyMethod" value={formData.identifyMethod} onChange={handleChange} style={inputStyle} /></div>
          </div>

          <hr style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />
          
          <div style={{ marginBottom: '15px' }}>
            <label style={labelStyle}>변경 내용 텍스트 요약</label>
            <textarea name="changeContentText" value={formData.changeContentText} onChange={handleChange} style={{ ...inputStyle, height: '60px', resize: 'vertical' }} />
          </div>

          <div style={rowStyle}>
            <div style={{ ...colStyle, border: '1px dashed #cbd5e1', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
              <label style={labelStyle}>변경 전 사진</label>
              {formData.beforeImage ? (
                <div>
                  <img src={formData.beforeImage} alt="Before" style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }} />
                  <div><button onClick={() => removeImage('beforeImage')} style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}>삭제</button></div>
                </div>
              ) : (
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'beforeImage')} style={{ fontSize: '12px' }} />
              )}
            </div>
            <div style={{ ...colStyle, border: '1px dashed #cbd5e1', padding: '10px', borderRadius: '4px', textAlign: 'center' }}>
              <label style={labelStyle}>변경 후 사진</label>
              {formData.afterImage ? (
                <div>
                  <img src={formData.afterImage} alt="After" style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }} />
                  <div><button onClick={() => removeImage('afterImage')} style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}>삭제</button></div>
                </div>
              ) : (
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'afterImage')} style={{ fontSize: '12px' }} />
              )}
            </div>
          </div>

          <hr style={{ margin: '20px 0', borderColor: '#e2e8f0' }} />
          
          <h3 style={{ fontSize: '14px', marginBottom: '15px' }}>변경 후 품질 점검 결과</h3>
          <div style={rowStyle}>
            <div style={colStyle}><label style={labelStyle}>협력사 명 (품질점검)</label><input type="text" name="qcPartner" value={formData.qcPartner} onChange={handleChange} style={inputStyle} /></div>
            <div style={colStyle}><label style={labelStyle}>확인 수량</label><input type="text" name="qcQuantity" value={formData.qcQuantity} onChange={handleChange} style={inputStyle} /></div>
          </div>
          <div style={rowStyle}>
            <div style={colStyle}><label style={labelStyle}>확인 내용</label><input type="text" name="qcContent" value={formData.qcContent} onChange={handleChange} style={inputStyle} /></div>
            <div style={colStyle}><label style={labelStyle}>확인 결과</label><input type="text" name="qcResult" value={formData.qcResult} onChange={handleChange} style={inputStyle} /></div>
          </div>
          <div style={rowStyle}>
            <div style={colStyle}><label style={labelStyle}>화승알앤에이 서명(담당자 성명)</label><input type="text" name="qcApprover1" value={formData.qcApprover1} onChange={handleChange} style={inputStyle} /></div>
            <div style={colStyle}><label style={labelStyle}>협력사 서명(담당자 성명)</label><input type="text" name="qcApprover2" value={formData.qcApprover2} onChange={handleChange} style={inputStyle} /></div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', background: '#f8fafc', position: 'sticky', bottom: 0 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>취소</button>
          <button onClick={() => onSave(formData)} style={{ padding: '8px 16px', border: 'none', background: '#2563eb', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>저장하기</button>
        </div>

      </div>
    </div>
  );
}
