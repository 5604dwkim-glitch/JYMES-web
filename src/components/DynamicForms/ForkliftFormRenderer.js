import { store, bindTimeWheelPicker, windowMock } from "./LegacyFormWrapper.jsx";

export function renderForkliftPaperForm(container, existingData, loggedInWorkerName) {
  const todayStr = new Date().toLocaleDateString('sv-SE');
  const dateParts = (existingData ? existingData.date : todayStr).split('-');

  let defaultStartTime = '08:00';
  let defaultEndTime = '17:00';
  if (existingData && existingData.workHours) {
    const times = existingData.workHours.split('~').map(t => t.trim());
    if (times[0]) defaultStartTime = times[0];
    if (times[1]) defaultEndTime = times[1];
  }

  // 기본 안전 점검 항목
  const checklistItems = [
    { id: 'check1', text: '전후진, 조향 및 제동장치 정상 여부' },
    { id: 'check2', text: '하역장치 (리프트, 틸트) 정상 작동 여부' },
    { id: 'check3', text: '경보장치 (경적, 후진벨) 및 전조/후미등' },
    { id: 'check4', text: '배터리 충전 상태 및 배선 확인' },
    { id: 'check5', text: '타이어 마모 상태 및 외관 확인' }
  ];

  const chkData = existingData?.forkliftChecks || {};
  const workDetails = existingData?.workDetails || '';

  container.innerHTML = `
    <form id="forkliftPaperForm" class="card" style="padding: 24px; font-family: 'Noto Sans KR', sans-serif;">
      <!-- 헤더 -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px;">
        <div style="flex: 1;">
          <h2 style="font-size: 26px; font-weight: 800; color: #000; letter-spacing: 2px;">지게차 작업일보</h2>
        </div>
        <table style="border-collapse: collapse; border: 1px solid #000; font-size: 11px; text-align: center;">
          <tr>
            <td style="border: 1px solid #000; width: 50px; background: #f1f5f9; font-weight: 700;">작성</td>
            <td style="border: 1px solid #000; width: 50px; background: #f1f5f9; font-weight: 700;">승인</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; height: 40px; vertical-align: middle; font-weight: 700; color: var(--accent-blue);">${loggedInWorkerName || '작업자'}</td>
            <td style="border: 1px solid #000; height: 40px; vertical-align: middle; color: var(--text-dim);">생산반장</td>
          </tr>
        </table>
      </div>

      <div style="background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.12)); border: 1px solid #8b5cf6; border-radius: 6px; padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 24px;">🏷️</span>
          <div>
            <div style="font-size: 15px; font-weight: 800; color: #7c3aed; margin-bottom: 2px;">
              양식 고유번호: #9002
            </div>
            <div style="font-size: 14px; color: #1e293b; font-weight: 600;">
              [공통] 공통 - 지게차작업 공정 전용 양식
            </div>
          </div>
        </div>
      </div>

      <!-- 작성일 & 시작시간/종료시간 & 지게차 제원 -->
      <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; margin-bottom: 14px; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span>작성일 : 20</span>
          <input type="text" id="forkYear" style="width: 55px; text-align: center;" class="form-control" value="${dateParts[0]?.substring(2) || '26'}" /> <span>년</span>
          <input type="text" id="forkMonth" style="width: 55px; text-align: center;" class="form-control" value="${dateParts[1] || '07'}" /> <span>월</span>
          <input type="text" id="forkDay" style="width: 55px; text-align: center;" class="form-control" value="${dateParts[2] || '25'}" /> <span>일</span>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <span>시작시간 :</span>
          <input type="text" id="forkStartTime" class="form-control time-picker-trigger" style="width: 90px; text-align: center; font-weight: 700; cursor: pointer; background: #ffffff;" value="${defaultStartTime}" placeholder="08:00" readonly required />
          <span>~ 종료시간 :</span>
          <input type="text" id="forkEndTime" class="form-control time-picker-trigger" style="width: 90px; text-align: center; font-weight: 700; cursor: pointer; background: #ffffff;" value="${defaultEndTime}" placeholder="17:00" readonly required />
        </div>
      </div>
      
      <div style="margin-bottom: 20px; font-size: 13px;">
        <span style="font-weight: 800;">장비 제원:</span> <span style="background: #f1f5f9; padding: 4px 8px; border-radius: 4px; border: 1px solid #cbd5e1;">전기 지게차 (2톤)</span>
      </div>

      <!-- 1. 일일 안전 점검 체크 항목 -->
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; font-weight: 800; color: #000; margin-bottom: 8px;">1. 일일 안전 점검 체크리스트</h3>
        <table class="data-table" style="border: 1px solid #000; font-size: 13px; width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f1f5f9; color: #000;">
              <th style="border: 1px solid #000; text-align: center; padding: 6px; width: 60px;">번호</th>
              <th style="border: 1px solid #000; text-align: center; padding: 6px;">점검 항목</th>
              <th style="border: 1px solid #000; text-align: center; padding: 6px; width: 120px;">상태 (양호/불량)</th>
            </tr>
          </thead>
          <tbody>
            ${checklistItems.map((item, idx) => {
              const isGood = chkData[item.id] !== false; // 기본값 양호
              return \`
                <tr>
                  <td style="border: 1px solid #000; text-align: center; font-weight: 700; padding: 6px;">\${idx + 1}</td>
                  <td style="border: 1px solid #000; font-weight: 600; padding: 6px;">\${item.text}</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 6px;">
                    <div style="display: flex; justify-content: center; gap: 10px;">
                      <label style="cursor: pointer; display: flex; align-items: center; gap: 4px;">
                        <input type="radio" name="\${item.id}" value="true" \${isGood ? 'checked' : ''} />
                        양호
                      </label>
                      <label style="cursor: pointer; display: flex; align-items: center; gap: 4px; color: var(--accent-rose);">
                        <input type="radio" name="\${item.id}" value="false" \${!isGood ? 'checked' : ''} />
                        불량
                      </label>
                    </div>
                  </td>
                </tr>
              \`;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- 2. 작업 내용 -->
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; font-weight: 800; color: #000; margin-bottom: 8px;">2. 금일 주요 작업 내용</h3>
        <textarea id="forkWorkDetails" class="form-control" style="width: 100%; height: 120px; padding: 12px; resize: none; font-size: 13px;" placeholder="작업 장소, 주요 이동 품목 및 특이사항을 간단히 적어주세요.">${workDetails}</textarea>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #000; padding-top: 12px; margin-bottom: 12px;">
        <span style="font-size: 11px; color: #64748b; font-family: monospace;">HSC-DT-005 (A4 210×297 mm)</span>
      </div>

      <!-- 화면 하단 고정 여백 -->
      <div style="height: 80px;"></div>
    </form>
  `;

  // 화면 하단 고정 버튼 바 (fixed 방식)
  let forkliftFixedBar = document.getElementById('forkliftFixedActionBar');
  if (!forkliftFixedBar) {
    forkliftFixedBar = document.createElement('div');
    forkliftFixedBar.id = 'forkliftFixedActionBar';
    document.body.appendChild(forkliftFixedBar);
  }
  forkliftFixedBar.style.cssText = 'position:fixed; bottom:0; left:0; right:0; z-index:500; background:rgba(255,255,255,0.97); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); padding:12px 16px; border-top:2px solid var(--border-color); box-shadow:0 -4px 20px rgba(0,0,0,0.12); display:flex; gap:10px; justify-content:center;';
  forkliftFixedBar.innerHTML = `
    <button type="button" id="btnForkDraftSave" class="btn btn-secondary" style="flex:1; max-width:240px; padding:13px 18px; font-size:14px; font-weight:700;">
      📁 일보 중간 저장
    </button>
    <button type="button" id="btnForkFinalSubmit" class="btn btn-primary" style="flex:1; max-width:240px; padding:13px 18px; font-size:14px; font-weight:700;">
      ✅ 일보 등록 완료
    </button>
  `;
  forkliftFixedBar.style.display = 'flex';

  const hideStandardFixedBar = document.getElementById('standardFixedActionBar');
  if (hideStandardFixedBar) hideStandardFixedBar.style.display = 'none';
  const hideLeaderFixedBar = document.getElementById('leaderFixedActionBar');
  if (hideLeaderFixedBar) hideLeaderFixedBar.style.display = 'none';

  bindTimeWheelPicker(container.querySelector('#forkStartTime'), '시작시간 선택');
  bindTimeWheelPicker(container.querySelector('#forkEndTime'), '종료시간 선택');

  const btnForkDraftSave = forkliftFixedBar.querySelector('#btnForkDraftSave');
  const btnForkFinalSubmit = forkliftFixedBar.querySelector('#btnForkFinalSubmit');

  const processForkliftSave = (targetStatus) => {
    try {
      let yy = container.querySelector('#forkYear')?.value || '26';
      let mm = (container.querySelector('#forkMonth')?.value || '07').padStart(2, '0');
      let dd = (container.querySelector('#forkDay')?.value || '25').padStart(2, '0');
      let fullDate = \`20\${yy}-\${mm}-\${dd}\`;

      const reportDateInput = document.getElementById('reportDate')?.value;
      if (reportDateInput) fullDate = reportDateInput;

      const st = container.querySelector('#forkStartTime')?.value || '08:00';
      const et = container.querySelector('#forkEndTime')?.value || '17:00';
      const workHours = \`\${st} ~ \${et}\`;

      const checks = {};
      checklistItems.forEach(item => {
        const radio = container.querySelector(\`input[name="\${item.id}"]:checked\`);
        checks[item.id] = radio ? (radio.value === 'true') : true;
      });

      const workDetailsText = container.querySelector('#forkWorkDetails')?.value || '';

      const currentUserRole = store.getUserRole();
      const currentWorkerName = currentUserRole?.workerName || loggedInWorkerName || '작업자';

      const reportData = {
        date: fullDate,
        workHours: workHours,
        shift: '주간',
        carModel: '공통',
        processName: '지게차작업',
        line: '1라인',
        workerName: currentWorkerName,
        workerId: 'EMP001',
        itemCode: '공통',
        itemName: '공통',
        targetQty: 0,
        actualQty: 0,
        defectQty: 0,
        isForkliftForm: true,
        formCode: 9002,
        forkliftChecks: checks,
        workDetails: workDetailsText,
        status: targetStatus,
        notes: targetStatus === '임시저장' 
          ? \`[지게차작업] \${currentWorkerName} 중간 저장 (\${workHours}).\`
          : \`[지게차작업] \${currentWorkerName} 작성 완료 (\${workHours}).\`
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
          windowMock.showToast('📁 지게차 작업일보 중간 저장 성공!', 'info');
        } else {
          windowMock.showToast('✅ 지게차 작업일보 등록 완료 성공!', 'success');
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
      console.error('Error saving forklift report:', err);
      windowMock.showToast(\`⚠️ 저장 중 오류가 발생했습니다: \${err.message}\`, 'error');
    }
  };

  if (btnForkDraftSave) {
    btnForkDraftSave.addEventListener('click', () => {
      processForkliftSave('임시저장');
    });
  }

  if (btnForkFinalSubmit) {
    btnForkFinalSubmit.addEventListener('click', () => {
      processForkliftSave('승인 대기');
    });
  }
}
