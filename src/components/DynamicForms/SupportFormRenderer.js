import { store, windowMock } from "./LegacyFormWrapper.jsx";
import { CAR_MODELS, CAR_MODEL_PARTS } from "../../constants/masterData.js";

export function renderSupportPaperForm(container, existingData, loggedInWorkerName) {
  const todayStr = new Date().toLocaleDateString('sv-SE');
  const dateParts = (existingData ? existingData.date : todayStr).split('-');

  let defaultStartTime = '08:00';
  let defaultEndTime = '17:00';
  if (existingData && existingData.workHours) {
    const times = existingData.workHours.split('~').map(t => t.trim());
    if (times[0]) defaultStartTime = times[0];
    if (times[1]) defaultEndTime = times[1];
  }

  const supportItems = existingData?.supportItems || [
    { carModel: '', part: '', type: '', note: '' },
    { carModel: '', part: '', type: '', note: '' },
    { carModel: '', part: '', type: '', note: '' },
    { carModel: '', part: '', type: '', note: '' },
    { carModel: '', part: '', type: '', note: '' }
  ];

  const workDetails = existingData?.workDetails || '';

  const carOptions = CAR_MODELS.filter(c => c.code !== '공통').map(c => `<option value="${c.code}">${c.code}</option>`).join('');

  container.innerHTML = `
    <div class="paper-form-container" style="font-family: 'Noto Sans KR', sans-serif; color: #000; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 800px; margin: 0 auto;">
      
      <!-- 폼 상단 배지 -->
      <div style="background: linear-gradient(135deg, rgba(56,189,248,0.12), rgba(59,130,246,0.12)); border: 1px solid #3b82f6; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 24px;">🏷️</span>
          <div>
            <div style="font-size: 16px; font-weight: 800; color: #2563eb; margin-bottom: 4px;">
              양식 고유번호: #9003
            </div>
            <div style="font-size: 13px; color: #1e293b; font-weight: 600;">
              [공통] 공통 - 출하지원 공정 전용 양식
            </div>
          </div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 12px; color: #64748b; font-weight: 700;">HSC-DT-005 호환</div>
          <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">Revision: 1.0</div>
        </div>
      </div>

      <!-- 공통 상단 (종이양식 흉내) -->
      <div style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 14px;">
        <h2 style="font-size: 24px; font-weight: 800; color: #000; letter-spacing: 2px;">출하지원 작업일보</h2>
        <table style="border-collapse: collapse; border: 1px solid #000; font-size: 13px; text-align: center;">
          <tr>
            <td style="border: 1px solid #000; width: 60px; background: #f1f5f9; font-weight: 700;">작성</td>
            <td style="border: 1px solid #000; width: 60px; background: #f1f5f9; font-weight: 700;">승인</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; height: 40px; vertical-align: middle;">${loggedInWorkerName || '작업자'}</td>
            <td style="border: 1px solid #000; height: 40px;"></td>
          </tr>
        </table>
      </div>

      <div style="margin-bottom: 14px; font-size: 13px; display: flex; gap: 16px; align-items: center;">
        <div>
          <span style="font-weight: 700;">작성일: </span>
          <input type="text" id="suppYear" value="${dateParts[0].substring(2)}" style="width: 30px; text-align: right; border: none; border-bottom: 1px solid #000; font-family: monospace; font-size: 14px;" />년 
          <input type="text" id="suppMonth" value="${dateParts[1]}" style="width: 24px; text-align: right; border: none; border-bottom: 1px solid #000; font-family: monospace; font-size: 14px;" />월 
          <input type="text" id="suppDay" value="${dateParts[2]}" style="width: 24px; text-align: right; border: none; border-bottom: 1px solid #000; font-family: monospace; font-size: 14px;" />일
        </div>
        <div>
          <span style="font-weight: 700;">근무시간: </span>
          <input type="time" id="suppStartTime" value="${defaultStartTime}" style="border: none; border-bottom: 1px solid #000; font-family: monospace; font-size: 14px; padding: 0 4px;" /> ~ 
          <input type="time" id="suppEndTime" value="${defaultEndTime}" style="border: none; border-bottom: 1px solid #000; font-family: monospace; font-size: 14px; padding: 0 4px;" />
        </div>
      </div>

      <!-- 1. 지원 내역 입력 항목 -->
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; font-weight: 800; color: #000; margin-bottom: 8px;">1. 금일 지원 내역 (조립지원/포장지원/출하지원)</h3>
        <table class="data-table" style="border: 1px solid #000; font-size: 13px; width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f1f5f9; color: #000;">
              <th style="border: 1px solid #000; text-align: center; padding: 6px; width: 40px;">No</th>
              <th style="border: 1px solid #000; text-align: center; padding: 6px; width: 120px;">차종</th>
              <th style="border: 1px solid #000; text-align: center; padding: 6px; width: 150px;">세부차종(부품)</th>
              <th style="border: 1px solid #000; text-align: center; padding: 6px; width: 100px;">지원내용</th>
              <th style="border: 1px solid #000; text-align: center; padding: 6px;">작업자 기록란 (비고)</th>
            </tr>
          </thead>
          <tbody id="suppTbody">
            ${supportItems.map((item, idx) => {
              return `
                <tr>
                  <td style="border: 1px solid #000; text-align: center; font-weight: 700; padding: 6px;">${idx + 1}</td>
                  <td style="border: 1px solid #000; padding: 6px;">
                    <select class="form-control supp-car" data-idx="${idx}" style="font-size: 12px; padding: 4px; height: auto;">
                      <option value="">선택</option>
                      ${carOptions}
                    </select>
                  </td>
                  <td style="border: 1px solid #000; padding: 6px;">
                    <select class="form-control supp-part" data-idx="${idx}" style="font-size: 12px; padding: 4px; height: auto;">
                      <option value="">차종을 선택하세요</option>
                    </select>
                  </td>
                  <td style="border: 1px solid #000; padding: 6px;">
                    <select class="form-control supp-type" data-idx="${idx}" style="font-size: 12px; padding: 4px; height: auto;">
                      <option value="">선택</option>
                      <option value="조립지원" ${item.type === '조립지원' ? 'selected' : ''}>조립지원</option>
                      <option value="포장지원" ${item.type === '포장지원' ? 'selected' : ''}>포장지원</option>
                      <option value="출하지원" ${item.type === '출하지원' ? 'selected' : ''}>출하지원</option>
                    </select>
                  </td>
                  <td style="border: 1px solid #000; padding: 6px;">
                    <input type="text" class="form-control supp-note" data-idx="${idx}" value="${item.note || ''}" placeholder="작업자 기입란" style="font-size: 12px; padding: 4px; height: auto; width: 100%;" />
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      
      <!-- 2. 특이사항 -->
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; font-weight: 800; color: #000; margin-bottom: 8px;">2. 금일 주요 특이사항</h3>
        <textarea id="suppWorkDetails" class="form-control" rows="3" placeholder="기타 특이사항이나 전달사항을 입력하세요." style="font-size: 13px; resize: none; width: 100%; border: 1px solid #000; border-radius: 4px; padding: 8px;">${workDetails}</textarea>
      </div>

      <!-- 하단 버튼 영역 -->
      <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px dashed #cbd5e1;">
        <button id="btnSuppDraftSave" class="btn btn-secondary" style="font-weight: 700; min-width: 120px;">
          📁 중간 저장
        </button>
        <button id="btnSuppFinalSubmit" class="btn btn-primary" style="font-weight: 700; min-width: 120px;">
          ✅ 제출 (승인 대기)
        </button>
      </div>
    </div>
  `;

  // Init parts dropdowns
  const tbody = container.querySelector('#suppTbody');
  const carSelects = tbody.querySelectorAll('.supp-car');
  const partSelects = tbody.querySelectorAll('.supp-part');

  // Load master data mapping to window for client use
  const modelPartsMap = CAR_MODEL_PARTS;

  carSelects.forEach((sel, i) => {
    // Initial value if edit
    if (supportItems[i].carModel) {
      sel.value = supportItems[i].carModel;
    }
    
    const updateParts = () => {
      const pSel = partSelects[i];
      const carCode = sel.value;
      if (!carCode) {
        pSel.innerHTML = '<option value="">차종을 선택하세요</option>';
        return;
      }
      const parts = modelPartsMap[carCode] || [];
      pSel.innerHTML = '<option value="">선택</option>' + parts.map(p => `<option value="${p.code}">${p.name}</option>`).join('');
      if (supportItems[i].part && supportItems[i].carModel === carCode) {
        pSel.value = supportItems[i].part;
      }
    };
    
    sel.addEventListener('change', updateParts);
    updateParts();
  });

  const btnSuppDraftSave = container.querySelector('#btnSuppDraftSave');
  const btnSuppFinalSubmit = container.querySelector('#btnSuppFinalSubmit');

  const processSuppSave = (targetStatus) => {
    try {
      const yy = container.querySelector('#suppYear')?.value || dateParts[0].substring(2);
      const mm = container.querySelector('#suppMonth')?.value || dateParts[1];
      const dd = container.querySelector('#suppDay')?.value || dateParts[2];
      let fullDate = `20${yy}-${mm}-${dd}`;
      const reportDateInput = document.getElementById('reportDate')?.value;
      if (reportDateInput) fullDate = reportDateInput;

      const st = container.querySelector('#suppStartTime')?.value || '08:00';
      const et = container.querySelector('#suppEndTime')?.value || '17:00';
      const workHours = `${st} ~ ${et}`;

      const finalSupportItems = [];
      for (let i = 0; i < 5; i++) {
        const carModel = carSelects[i].value;
        const part = partSelects[i].value;
        const type = tbody.querySelector(`.supp-type[data-idx="${i}"]`).value;
        const note = tbody.querySelector(`.supp-note[data-idx="${i}"]`).value;
        
        if (carModel || part || type || note) {
          finalSupportItems.push({ carModel, part, type, note });
        }
      }

      const workDetailsText = container.querySelector('#suppWorkDetails')?.value || '';

      const currentUserRole = store.getUserRole();
      const currentWorkerName = currentUserRole?.workerName || loggedInWorkerName || '작업자';

      const reportData = {
        date: fullDate,
        workHours: workHours,
        shift: '주간',
        carModel: '공통',
        processName: '출하지원',
        line: '1라인',
        workerName: currentWorkerName,
        workerId: 'EMP001',
        itemCode: '공통',
        itemName: '공통',
        targetQty: 0,
        actualQty: 0,
        defectQty: 0,
        isSupportForm: true,
        formCode: 9003,
        supportItems: finalSupportItems,
        workDetails: workDetailsText,
        status: targetStatus,
        notes: targetStatus === '임시저장' 
          ? `[출하지원] ${currentWorkerName} 중간 저장 (${workHours}).`
          : `[출하지원] ${currentWorkerName} 작성 완료 (${workHours}).`
      };

      if (existingData) {
        store.updateReport(existingData.id, reportData);
        if (targetStatus === '임시저장') {
          windowMock.showToast('📁 작업일보가 중간 저장되었습니다.', 'info');
        } else {
          windowMock.showToast('✅ 작업일보가 등록 완료되었습니다.', 'success');
        }
      } else {
        store.addReport(reportData);
        if (targetStatus === '임시저장') {
          windowMock.showToast('📁 출하지원 작업일보 중간 저장 성공!', 'info');
        } else {
          windowMock.showToast('✅ 출하지원 작업일보 등록 완료 성공!', 'success');
        }
      }

      if (windowMock.appInstance) {
        if (targetStatus === '임시저장') return;
        const userRoleInfo = store.getUserRole();
        if (userRoleInfo && userRoleInfo.role === 'worker') {
          windowMock.appInstance.switchTab('drafts');
        } else {
          windowMock.appInstance.switchTab('reports');
        }
      }
    } catch (err) {
      console.error('Error saving support report:', err);
      windowMock.showToast(`⚠️ 저장 중 오류가 발생했습니다: ${err.message}`, 'error');
    }
  };

  if (btnSuppDraftSave) {
    btnSuppDraftSave.addEventListener('click', () => {
      processSuppSave('임시저장');
    });
  }

  if (btnSuppFinalSubmit) {
    btnSuppFinalSubmit.addEventListener('click', () => {
      processSuppSave('승인 대기');
    });
  }
}
