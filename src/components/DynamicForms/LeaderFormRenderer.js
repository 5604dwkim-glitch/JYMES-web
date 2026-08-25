import { DEFAULT_LEADER_ITEMS } from "../../constants/masterData.js";
import { store, bindTimeWheelPicker, windowMock } from "./LegacyFormWrapper.jsx";

export function renderLeaderPaperForm(container, existingData, loggedInWorkerName) {
  const todayStr = new Date().toISOString().split('T')[0];
  const dateParts = (existingData ? existingData.date : todayStr).split('-');

  let defaultStartTime = '08:00';
  let defaultEndTime = '17:00';
  if (existingData && existingData.workHours) {
    const times = existingData.workHours.split('~').map(t => t.trim());
    if (times[0]) defaultStartTime = times[0];
    if (times[1]) defaultEndTime = times[1];
  }

  let attTotal = 50;
  let attPresent = 48;
  let attAbsent = 2;
  let attAnnualLeave = 1;
  let attSickLeave = 0;
  let attHalfLeave = 1;

  if (existingData && existingData.attendanceData) {
    const a = existingData.attendanceData;
    if (a.total !== undefined) {
      attTotal = a.total;
      attPresent = a.present;
      attAbsent = a.absent;
      attAnnualLeave = a.annualLeave !== undefined ? a.annualLeave : (a.absent || 0);
      attSickLeave = a.sickLeave || 0;
      attHalfLeave = a.halfLeave || 0;
    } else if (a.buildingB) {
      attTotal = (a.buildingB.total || 0) + (a.buildingC?.total || 0) + (a.buildingD?.total || 0);
      attPresent = (a.buildingB.present || 0) + (a.buildingC?.present || 0) + (a.buildingD?.present || 0);
      attAbsent = (a.buildingB.absent || 0) + (a.buildingC?.absent || 0) + (a.buildingD?.absent || 0);
      attAnnualLeave = attAbsent;
      attSickLeave = 0;
      attHalfLeave = 0;
    }
  }

  const items = existingData && existingData.leaderFormItems ? existingData.leaderFormItems : DEFAULT_LEADER_ITEMS;

  container.innerHTML = `
    <form id="leaderPaperForm" class="card" style="padding: 24px; font-family: 'Noto Sans KR', sans-serif;">
      <!-- 헤더 -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px;">
        <div style="flex: 1;">
          <h2 style="font-size: 26px; font-weight: 800; color: #000; letter-spacing: 2px;" data-i18n="leader_form_title">작 업 일 보 (반장)</h2>
        </div>

        <table style="border-collapse: collapse; border: 1px solid #000; font-size: 11px; text-align: center;">
          <tr>
            <td style="border: 1px solid #000; width: 50px; background: #f1f5f9; font-weight: 700;" data-i18n="leader_writer">작성</td>
            <td style="border: 1px solid #000; width: 50px; background: #f1f5f9; font-weight: 700;" data-i18n="leader_approver">승인</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; height: 40px; vertical-align: middle; font-weight: 700; color: var(--accent-blue);">장수미</td>
            <td style="border: 1px solid #000; height: 40px; vertical-align: middle; color: var(--text-dim);" data-i18n="leader_manager">생산부장</td>
          </tr>
        </table>
      </div>

      <!-- 작성일 & 시작시간/종료시간 -->
      <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; margin-bottom: 14px; flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span><span data-i18n="form_work_date">작성일</span> : 20</span>
          <input type="text" id="leaderYear" style="width: 55px; text-align: center;" class="form-control" value="${dateParts[0]?.substring(2) || '26'}" /> <span data-i18n="leader_year">년</span>
          <input type="text" id="leaderMonth" style="width: 55px; text-align: center;" class="form-control" value="${dateParts[1] || '07'}" /> <span data-i18n="leader_month">월</span>
          <input type="text" id="leaderDay" style="width: 55px; text-align: center;" class="form-control" value="${dateParts[2] || '25'}" /> <span data-i18n="leader_day">일</span>
        </div>

        <div style="display: flex; align-items: center; gap: 8px;">
          <span data-i18n="leader_start_time">시작시간 :</span>
          <input type="text" id="leaderStartTime" class="form-control time-input-field time-picker-trigger" style="width: 90px; text-align: center; font-weight: 700; cursor: pointer; background: #ffffff;" value="${defaultStartTime}" placeholder="08:00" readonly required />
          <span data-i18n="leader_end_time">~ 종료시간 :</span>
          <input type="text" id="leaderEndTime" class="form-control time-input-field time-picker-trigger" style="width: 90px; text-align: center; font-weight: 700; cursor: pointer; background: #ffffff;" value="${defaultEndTime}" placeholder="17:00" readonly required />
        </div>
      </div>

      <!-- 1. 생산현황 테이블 -->
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; font-weight: 800; color: #000; margin-bottom: 8px;" data-i18n="leader_section1"><span class="sec-num"></span> 생산현황</h3>
        <div class="table-container">
          <table class="data-table" style="border: 1px solid #000; font-size: 12px;">
            <thead>
              <tr style="background: #f1f5f9; color: #000;">
                <th style="border: 1px solid #000; text-align: center; width: 40px;" data-i18n="leader_seq">순번</th>
                <th style="border: 1px solid #000; text-align: center; width: 140px;" data-i18n="leader_item">아이템</th>
                <th style="border: 1px solid #000; text-align: center; width: 90px;" data-i18n="leader_packed_qty">포장완료 수량</th>
                <th style="border: 1px solid #000; text-align: center;" colspan="4" data-i18n="leader_scrap">스크랩 (불량 구분)</th>
              </tr>
            </thead>
            <tbody>
              ${items.map(it => {
                const isHood = it.name === 'KM/KX Hood';
                const hasD = (it.name === 'DS CREW LH' || it.name === 'DS CREW RH');
                return `
                  <tr>
                    <td style="border: 1px solid #000; text-align: center; font-weight: 700;">${it.seq}</td>
                    <td style="border: 1px solid #000; font-weight: 700; padding: 4px;">${it.name}</td>
                    <td style="border: 1px solid #000; padding: 2px;">
                      <input type="number" class="form-control leader-packed-qty" data-seq="${it.seq}" style="padding: 4px; text-align: right; font-weight: 700;" value="${it.packedQty || ''}" placeholder="0" />
                    </td>
                    ${isHood ? `
                      <td style="border: 1px solid #000; padding: 2px; text-align: center;" colspan="2">
                        <span style="font-size: 10px; color: var(--text-muted);" data-i18n="leader_center">센터:</span>
                        <input type="number" class="form-control leader-scrap-center" data-seq="${it.seq}" style="padding: 4px; text-align: right; width: 70px; display: inline-block;" value="${it.scrapCenter || ''}" placeholder="0" />
                      </td>
                      <td style="border: 1px solid #000; padding: 2px; text-align: center;" colspan="2">
                        <span style="font-size: 10px; color: var(--text-muted);" data-i18n="leader_side">사이드:</span>
                        <input type="number" class="form-control leader-scrap-side" data-seq="${it.seq}" style="padding: 4px; text-align: right; width: 70px; display: inline-block;" value="${it.scrapSide || ''}" placeholder="0" />
                      </td>
                    ` : hasD ? `
                      <td style="border: 1px solid #000; padding: 2px;"><input type="number" class="form-control leader-scrap-a" data-seq="${it.seq}" style="padding: 4px; text-align: right;" value="${it.scrapA || ''}" placeholder="A" /></td>
                      <td style="border: 1px solid #000; padding: 2px;"><input type="number" class="form-control leader-scrap-b" data-seq="${it.seq}" style="padding: 4px; text-align: right;" value="${it.scrapB || ''}" placeholder="B" /></td>
                      <td style="border: 1px solid #000; padding: 2px;"><input type="number" class="form-control leader-scrap-c" data-seq="${it.seq}" style="padding: 4px; text-align: right;" value="${it.scrapC || ''}" placeholder="C" /></td>
                      <td style="border: 1px solid #000; padding: 2px;"><input type="number" class="form-control leader-scrap-d" data-seq="${it.seq}" style="padding: 4px; text-align: right;" value="${it.scrapD || ''}" placeholder="D" /></td>
                    ` : `
                      <td style="border: 1px solid #000; padding: 2px;"><input type="number" class="form-control leader-scrap-a" data-seq="${it.seq}" style="padding: 4px; text-align: right;" value="${it.scrapA || ''}" placeholder="A" /></td>
                      <td style="border: 1px solid #000; padding: 2px;"><input type="number" class="form-control leader-scrap-b" data-seq="${it.seq}" style="padding: 4px; text-align: right;" value="${it.scrapB || ''}" placeholder="B" /></td>
                      <td style="border: 1px solid #000; padding: 2px;" colspan="2"><input type="number" class="form-control leader-scrap-c" data-seq="${it.seq}" style="padding: 4px; text-align: right;" value="${it.scrapC || ''}" placeholder="C" /></td>
                    `}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- 2. 근태현황 테이블 & 아래 근태 사유 (연차, 병가, 반차 수량 입력) -->
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; font-weight: 800; color: #000; margin-bottom: 8px;" data-i18n="leader_section2"><span class="sec-num"></span> 근태현황</h3>
        
        <div class="table-container" style="margin-bottom: 10px;">
          <table class="data-table" style="border: 1px solid #000; font-size: 12px; border-collapse: collapse; width: 100%;">
            <thead>
              <tr style="background: #f1f5f9; color: #000;">
                <th style="border: 1px solid #000; text-align: center; padding: 6px; width: 120px;" data-i18n="leader_total">총원</th>
                <th style="border: 1px solid #000; text-align: center; padding: 6px; width: 120px;" data-i18n="leader_present">출근</th>
                <th style="border: 1px solid #000; text-align: center; padding: 6px; width: 120px;" data-i18n="leader_absent">결근</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border: 1px solid #000; padding: 4px;">
                  <input type="number" id="att_total" class="form-control" style="padding: 6px; text-align: center; font-weight: 700;" value="${attTotal}" />
                </td>
                <td style="border: 1px solid #000; padding: 4px;">
                  <input type="number" id="att_present" class="form-control" style="padding: 6px; text-align: center; color: var(--accent-blue); font-weight: 700;" value="${attPresent}" />
                </td>
                <td style="border: 1px solid #000; padding: 4px;">
                  <input type="number" id="att_absent" class="form-control" style="padding: 6px; text-align: center; color: var(--accent-rose); font-weight: 700;" value="${attAbsent}" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 표 아래 근태 사유 (연차, 병가, 반차 수량 입력) -->
        <div style="border: 1px solid #000; padding: 10px 14px; background: #fafafa; border-radius: 4px; display: flex; align-items: center; gap: 20px; flex-wrap: wrap;">
          <span style="font-size: 12px; font-weight: 800; color: #000;" data-i18n="leader_att_reason">📋 근태 사유:</span>
          
          <div style="display: flex; align-items: center; gap: 6px; font-size: 12px;">
            <span style="font-weight: 700; color: var(--text-main);" data-i18n="leader_annual_leave">연차 :</span>
            <input type="number" id="att_annualLeave" class="form-control" style="width: 70px; padding: 5px; text-align: center; font-weight: 700; border-color: var(--accent-blue);" value="${attAnnualLeave}" placeholder="0" min="0" /> <span data-i18n="leader_persons">명</span>
          </div>

          <div style="display: flex; align-items: center; gap: 6px; font-size: 12px;">
            <span style="font-weight: 700; color: var(--text-main);" data-i18n="leader_sick_leave">병가 :</span>
            <input type="number" id="att_sickLeave" class="form-control" style="width: 70px; padding: 5px; text-align: center; font-weight: 700; border-color: var(--accent-blue);" value="${attSickLeave}" placeholder="0" min="0" /> <span data-i18n="leader_persons">명</span>
          </div>

          <div style="display: flex; align-items: center; gap: 6px; font-size: 12px;">
            <span style="font-weight: 700; color: var(--text-main);" data-i18n="leader_half_leave">반차 :</span>
            <input type="number" id="att_halfLeave" class="form-control" style="width: 70px; padding: 5px; text-align: center; font-weight: 700; border-color: var(--accent-purple);" value="${attHalfLeave}" placeholder="0" min="0" /> <span data-i18n="leader_persons">명</span>
          </div>
        </div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #000; padding-top: 12px; margin-bottom: 12px;">
        <span style="font-size: 11px; color: #64748b; font-family: monospace;">HSC-DT-005 (A4 210×297 mm)</span>
      </div>

      <!-- 화면 하단 고정 여백 (고정 버튼 바에 가려지지 않도록) -->
      <div style="height: 80px;"></div>
    </form>
  `;

  // 화면 하단 고정 버튼 바 (leader form) - fixed 방식
  let leaderFixedBar = document.getElementById('leaderFixedActionBar');
  if (!leaderFixedBar) {
    leaderFixedBar = document.createElement('div');
    leaderFixedBar.id = 'leaderFixedActionBar';
    document.body.appendChild(leaderFixedBar);
  }
  leaderFixedBar.style.cssText = 'position:fixed; bottom:0; left:0; right:0; z-index:500; background:rgba(255,255,255,0.97); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); padding:12px 16px; border-top:2px solid var(--border-color); box-shadow:0 -4px 20px rgba(0,0,0,0.12); display:flex; gap:10px; justify-content:center;';
  leaderFixedBar.innerHTML = `
    <button type="button" id="btnLeaderDraftSave" class="btn btn-secondary" style="flex:1; max-width:240px; padding:13px 18px; font-size:14px; font-weight:700;" data-i18n="btn_draft_save">
      📁 작업일보 중간 저장
    </button>
    <button type="button" id="btnLeaderFinalSubmit" class="btn btn-primary" style="flex:1; max-width:240px; padding:13px 18px; font-size:14px; font-weight:700;" data-i18n="btn_final_submit">
      ✅ 작업일보 등록 완료
    </button>
  `;
  leaderFixedBar.style.display = 'flex';

  const hideStandardFixedBar = document.getElementById('standardFixedActionBar');
  if (hideStandardFixedBar) {
    hideStandardFixedBar.style.display = 'none';
  }

  i18n.applyTranslations(container);
  i18n.applyTranslations(leaderFixedBar);

  // 리더 폼 섹션 순번 부여 (1. 생산현황, 2. 근태현황)
  let leaderStep = 1;
  container.querySelectorAll('#leaderPaperForm .sec-num').forEach(span => {
    span.textContent = leaderStep + '.';
    leaderStep++;
  });

  bindTimeWheelPicker(container.querySelector('#leaderStartTime'), '시작시간 선택');
  bindTimeWheelPicker(container.querySelector('#leaderEndTime'), '종료시간 선택');

  // leader form용 fixed 버튼 이벤트 바인딩
  const btnLeaderDraftSave = leaderFixedBar.querySelector('#btnLeaderDraftSave');
  const btnLeaderFinalSubmit = leaderFixedBar.querySelector('#btnLeaderFinalSubmit');

  const processLeaderSave = (targetStatus) => {
    try {
      const yy = container.querySelector('#leaderYear')?.value || '26';
      const mm = (container.querySelector('#leaderMonth')?.value || '07').padStart(2, '0');
      const dd = (container.querySelector('#leaderDay')?.value || '25').padStart(2, '0');
      const fullDate = `20${yy}-${mm}-${dd}`;

      const st = container.querySelector('#leaderStartTime')?.value || '08:00';
      const et = container.querySelector('#leaderEndTime')?.value || '17:00';
      const workHours = `${st} ~ ${et}`;

      let grandTotalPacked = 0;
      let grandTotalScrap = 0;

      const leaderFormItems = items.map(it => {
        const seq = it.seq;
        const packedQty = Number(container.querySelector(`.leader-packed-qty[data-seq="${seq}"]`)?.value) || 0;
        const reworkQty = Number(container.querySelector(`.leader-rework-qty[data-seq="${seq}"]`)?.value) || 0;

        let scrapA = 0, scrapB = 0, scrapC = 0, scrapD = 0, scrapCenter = 0, scrapSide = 0;

        if (it.name === 'KM/KX Hood') {
          scrapCenter = Number(container.querySelector(`.leader-scrap-center[data-seq="${seq}"]`)?.value) || 0;
          scrapSide = Number(container.querySelector(`.leader-scrap-side[data-seq="${seq}"]`)?.value) || 0;
          grandTotalScrap += (scrapCenter + scrapSide);
        } else {
          scrapA = Number(container.querySelector(`.leader-scrap-a[data-seq="${seq}"]`)?.value) || 0;
          scrapB = Number(container.querySelector(`.leader-scrap-b[data-seq="${seq}"]`)?.value) || 0;
          scrapC = Number(container.querySelector(`.leader-scrap-c[data-seq="${seq}"]`)?.value) || 0;
          scrapD = Number(container.querySelector(`.leader-scrap-d[data-seq="${seq}"]`)?.value) || 0;
          grandTotalScrap += (scrapA + scrapB + scrapC + scrapD);
        }

        grandTotalPacked += packedQty;

        return {
          seq,
          name: it.name,
          packedQty,
          reworkQty,
          scrapA, scrapB, scrapC, scrapD, scrapCenter, scrapSide
        };
      });

      const annualLeave = Number(container.querySelector('#att_annualLeave')?.value) || 0;
      const sickLeave = Number(container.querySelector('#att_sickLeave')?.value) || 0;
      const halfLeave = Number(container.querySelector('#att_halfLeave')?.value) || 0;

      const reasonParts = [];
      if (annualLeave > 0) reasonParts.push(`연차 ${annualLeave}명`);
      if (sickLeave > 0) reasonParts.push(`병가 ${sickLeave}명`);
      if (halfLeave > 0) reasonParts.push(`반차 ${halfLeave}명`);
      const reasonText = reasonParts.length > 0 ? reasonParts.join(', ') : '전원 정상출근';

      const attendanceData = {
        total: Number(container.querySelector('#att_total')?.value) || 50,
        present: Number(container.querySelector('#att_present')?.value) || 0,
        absent: Number(container.querySelector('#att_absent')?.value) || 0,
        annualLeave: annualLeave,
        sickLeave: sickLeave,
        halfLeave: halfLeave,
        reason: reasonText
      };

      const currentUserRole = store.getUserRole();
      const currentWorkerName = currentUserRole?.workerName || loggedInWorkerName || '장수미';

      const reportData = {
        date: fullDate,
        workHours: workHours,
        shift: '주간',
        carModel: 'JG1',
        processName: '검사포장',
        line: '1라인',
        workerName: currentWorkerName,
        workerId: 'EMP001',
        itemCode: '인벨트',
        itemName: '인벨트 외 9종',
        targetQty: grandTotalPacked + grandTotalScrap + 50,
        actualQty: grandTotalPacked,
        defectQty: grandTotalScrap,
        isLeaderForm: true,
        formCode: 'HSC-DT-005',
        leaderFormItems,
        attendanceData,
        status: targetStatus,
        notes: targetStatus === '임시저장' 
          ? `[작업일보(반장)] 장수미 반장 중간 저장 (${workHours}).`
          : `[작업일보(반장)] 장수미 반장 작성 완료 (${workHours}).`
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
          windowMock.showToast('📁 장수미 반장 작업일보 중간 저장 성공!', 'info');
        } else {
          windowMock.showToast('✅ 장수미 반장 작업일보 등록 완료 성공!', 'success');
        }
      }

      if (windowMock.appInstance) {
        if (targetStatus === '임시저장') {
          return;
        }
        const userRoleInfo = store.getUserRole();
        if (userRoleInfo && userRoleInfo.role === 'worker') {
          windowMock.appInstance.switchTab('drafts');
        } else {
          windowMock.appInstance.switchTab('reports');
        }
      }
    } catch (err) {
      console.error('Error saving leader report:', err);
      windowMock.showToast(`⚠️ 저장 중 오류가 발생했습니다: ${err.message}`, 'error');
    }
  };

  if (btnLeaderDraftSave) {
    btnLeaderDraftSave.addEventListener('click', () => {
      processLeaderSave('임시저장');
    });
  }

  if (btnLeaderFinalSubmit) {
    btnLeaderFinalSubmit.addEventListener('click', () => {
      processLeaderSave('승인 대기');
    });
  }
}