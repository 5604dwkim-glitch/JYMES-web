/**
 * 50인 제조업체 공정별 작업일보 관리 시스템 - Report Form Component (Refactored)
 * (store.js 공통 마스터 상수를 참조하도록 로직 경량화)
 */

import * as Templates from './FormTemplates.jsx';
import * as _Sections from './sections/index.js';
import { MANUFACTURERS, CAR_MODELS, CAR_MODEL_PARTS, DEFAULT_LEADER_ITEMS, DEFAULT_ATTENDANCE, DOWNTIME_REASONS } from '../../constants/masterData.js';

const i18n = { applyTranslations: () => {} };
const STRING_TO_KEY_MAP = {};

let _ctx = {};
export function setLegacyFormContext(ctx) {
  _ctx = ctx;
}

export const store = {
  getUserRole: () => _ctx.userRoleInfo,
  getReportById: (id) => _ctx.existingData,
  getWorkers: () => _ctx.workers || [],
  getProcesses: () => _ctx.processes || [],
  getItems: (code) => _ctx.getItems(code),
  updateReport: (id, data) => _ctx.onSave(id, data),
  addReport: (data) => _ctx.onSave(null, data)
};

const windowMock = {
  showToast: (msg, type) => _ctx.showToast && _ctx.showToast(msg, type),
  appInstance: {
    switchTab: (tab) => _ctx.onNavigate && _ctx.onNavigate(tab)
  }
};



export function renderReportForm(container, editingReportId = null) {
  const userRoleInfo = store.getUserRole();
  const loggedInWorkerName = userRoleInfo ? userRoleInfo.workerName : '';
  
  let existingData = null;
  if (editingReportId) {
    existingData = store.getReportById(editingReportId);
  }

  const workers = store.getWorkers();
  const currentWorker = workers.find(w => w.name === loggedInWorkerName);
  const userPosition = currentWorker ? currentWorker.role : (userRoleInfo?.role === 'admin' ? '관리자(반장)' : '작업자');
  const isLeaderRole = (currentWorker && currentWorker.role && currentWorker.role.includes('반장')) ||
                       userRoleInfo?.role === 'admin' ||
                       loggedInWorkerName === '장수미' ||
                       loggedInWorkerName === '양은주';

  let activeFormType = existingData ? (existingData.isLeaderForm ? 'leader' : 'standard') : 'standard';
  if (!isLeaderRole && activeFormType === 'leader') {
    activeFormType = 'standard';
  }

  container.innerHTML = `
    <div class="mobile-form-container" style="max-width: 800px;">
      <!-- 양식 선택 토글 탭 -->
      <div class="card" style="margin-bottom: 16px; padding: 12px 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 16px; font-weight: 700; color: var(--text-main);" data-i18n="form_select_label">📋 입력 양식 선택:</span>
            <span style="font-size: 11px; background: ${isLeaderRole ? 'rgba(124, 58, 237, 0.15)' : 'rgba(5, 150, 105, 0.15)'}; color: ${isLeaderRole ? 'var(--accent-purple)' : 'var(--accent-emerald)'}; padding: 3px 8px; border-radius: 4px; font-weight: 700;">
              ${isLeaderRole ? `👑 반장 권한 (${loggedInWorkerName || '반장'})` : `👤 일반 작업자 (${loggedInWorkerName || '작업자'})`}
            </span>
          </div>

          <div class="touch-chip-group" style="gap: 6px;">
            <div class="touch-chip ${activeFormType === 'standard' ? 'active' : ''}" id="btnSelectStandardForm" style="min-width: 130px; padding: 6px 12px; font-size: 12px;" data-i18n="form_standard_title">
              📱 공정 모바일 원터치 양식
            </div>
            <div class="touch-chip ${activeFormType === 'leader' ? 'active' : ''}" id="btnSelectLeaderForm" style="min-width: 140px; padding: 6px 12px; font-size: 12px; ${!isLeaderRole ? 'opacity: 0.5; cursor: not-allowed;' : ''}" ${!isLeaderRole ? 'title="직급이 반장인 사용자만 선택할 수 있습니다."' : ''} data-i18n="form_leader_title">
              ${!isLeaderRole ? '🔒 ' : ''}📋 작업일보(반장)
            </div>
          </div>
        </div>
      </div>

      <!-- 폼 컨테이너 동적 렌더링 -->
      <div id="formContentArea"></div>
    </div>
  `;

  const formArea = container.querySelector('#formContentArea');
  const btnSelectLeaderForm = container.querySelector('#btnSelectLeaderForm');
  const btnSelectStandardForm = container.querySelector('#btnSelectStandardForm');

  if (activeFormType === 'leader' && isLeaderRole) {
    renderLeaderPaperForm(formArea, existingData, loggedInWorkerName);
  } else {
    renderStandardMobileForm(formArea, existingData, loggedInWorkerName);
  }

  btnSelectLeaderForm.addEventListener('click', () => {
    if (!isLeaderRole) {
      windowMock.showToast(`⚠️ '작업일보(반장)' 양식은 직급이 [반장]인 사용자만 선택할 수 있습니다. (현재 직급: ${userPosition})`, 'warning');
      return;
    }
    btnSelectLeaderForm.classList.add('active');
    btnSelectStandardForm.classList.remove('active');
    renderLeaderPaperForm(formArea, existingData, loggedInWorkerName);
  });

  btnSelectStandardForm.addEventListener('click', () => {
    btnSelectStandardForm.classList.add('active');
    btnSelectLeaderForm.classList.remove('active');
    renderStandardMobileForm(formArea, existingData, loggedInWorkerName);
  });
}

function renderLeaderPaperForm(container, existingData, loggedInWorkerName) {
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

function renderStandardMobileForm(container, existingData, loggedInWorkerName) {
  const processes = store.getProcesses();

  const initialCarCode = existingData ? existingData.carModel : 'JG1';
  let initialMaker = MANUFACTURERS.find(m => m.models.some(md => md.code === initialCarCode)) || MANUFACTURERS[0];

  const selectedProcessName = existingData ? existingData.processName : '';
  const todayStr = new Date().toISOString().split('T')[0];

  let defaultStartTime = '08:00';
  let defaultEndTime = '17:00';
  if (existingData && existingData.workHours) {
    const times = existingData.workHours.split('~').map(t => t.trim());
    if (times[0]) defaultStartTime = times[0];
    if (times[1]) defaultEndTime = times[1];
  }

  const itemsForCarModel = store.getItems(initialCarCode);
  const materialLots = existingData && existingData.materialLots ? existingData.materialLots : {};
  const existingDim = existingData && existingData.dimData ? existingData.dimData : {};
  const defaultWorkerName = existingData ? existingData.workerName : (loggedInWorkerName !== '생산총괄' ? loggedInWorkerName : '김철수');

  container.innerHTML = `
    <form id="mobileWorkReportForm" style="display: flex; flex-direction: column; gap: 16px;">
      <!-- 1. 작업 일자 및 시작시간/종료시간 입력 -->
      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <label style="font-size: 13px; font-weight: 700; color: var(--accent-blue); margin: 0;" data-i18n="step1_date_time">
            📅 <span class="sec-num"></span> 작업 일자 & 작업 시간 (시작시간 ~ 종료시간)
          </label>
          <span style="background: rgba(99,102,241,0.15); color: var(--accent-purple); padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; border: 1px solid rgba(99,102,241,0.3); white-space: nowrap;">👷 ${loggedInWorkerName || '미인증'}</span>
        </div>
        
        <div style="display: flex; gap: 12px; margin-bottom: 12px; flex-wrap: wrap;">
          <div style="flex: 2; min-width: 140px;">
            <label style="font-size: 11px; color: var(--text-muted);" data-i18n="form_work_date">작업 일자</label>
            <input type="date" id="reportDate" class="form-control" value="${existingData ? existingData.date : todayStr}" required />
          </div>
          <div style="flex: 1; min-width: 100px;">
            <label style="font-size: 11px; color: var(--accent-blue); font-weight: 700;" data-i18n="start_time">시작시간 (드래그 선택)</label>
            <input type="text" id="startTimeInput" class="form-control time-input-field time-picker-trigger" style="text-align: center; font-weight: 700; cursor: pointer; background: #ffffff;" value="${defaultStartTime}" placeholder="08:00" readonly required />
          </div>
          <div style="flex: 1; min-width: 100px;">
            <label style="font-size: 11px; color: var(--accent-blue); font-weight: 700;" data-i18n="end_time">종료시간 (드래그 선택)</label>
            <input type="text" id="endTimeInput" class="form-control time-input-field time-picker-trigger" style="text-align: center; font-weight: 700; cursor: pointer; background: #ffffff;" value="${defaultEndTime}" placeholder="17:00" readonly required />
          </div>
        </div>
      </div>

      <!-- 2. 차종 선택 (원터치 칩 버튼 선택 방식) -->
      <div class="card">
        <label style="font-size: 13px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;" data-i18n="step2_vehicle">
          🚘 <span class="sec-num"></span> 차종 선택 (원터치 버튼 방식)
        </label>
        
        <!-- [1단계] 완성차 제조사 선택 버튼 그룹 -->
        <div style="margin-bottom: 14px;">
          <span style="font-size: 11px; font-weight: 700; color: var(--text-muted); display: block; margin-bottom: 6px;" data-i18n="step2_maker">
            [1단계] 완성차 제조사 선택
          </span>
          <div class="touch-chip-group" id="makerChipGroup">
            ${MANUFACTURERS.map(m => `
              <div class="touch-chip maker-chip ${initialMaker.name === m.name ? 'active' : ''}" data-maker="${m.name}" style="padding: 8px 12px; font-weight: 700;">
                ${m.name}
              </div>
            `).join('')}
          </div>
        </div>

        <!-- [2단계] 세부 차종 선택 버튼 그룹 -->
        <div style="margin-bottom: 0;">
          <span style="font-size: 11px; font-weight: 700; color: var(--accent-blue); display: block; margin-bottom: 6px;" data-i18n="step2_subcar">
            [2단계] 세부 차종 선택
          </span>
          <div class="touch-chip-group" id="subCarChipGroup">
            <!-- Dynamic Render -->
          </div>
        </div>

        <!-- [3단계] 세부 차종별 부품 선택 (해당 차종에 부품 목록이 있을 때만 표시) -->
        <div id="partSelectSection" style="margin-top: 14px; display: ${CAR_MODEL_PARTS[initialCarCode] ? 'block' : 'none'};">
          <span style="font-size: 11px; font-weight: 700; color: var(--accent-blue); display: block; margin-bottom: 6px;">
            [3단계] 세부 부품 선택
          </span>
          <div class="touch-chip-group" id="partChipGroup">
            <!-- Dynamic Render -->
          </div>
          <input type="hidden" id="partValue" value="" />
        </div>

        <input type="hidden" id="carModelValue" value="${initialCarCode}" />
      </div>

      <!-- 3. 생산공정 선택 -->
      <div class="card">
        <label style="font-size: 13px; font-weight: 700; color: var(--accent-blue); margin-bottom: 10px; display: block;" data-i18n="step3_process">
          🏭 <span class="sec-num"></span> 생산공정 선택
        </label>
        <div class="touch-chip-group" id="processChipGroup">
          <!-- Dynamic Render -->
        </div>
        <input type="hidden" id="processValue" value="${selectedProcessName}" />
      </div>

      <!-- 🏷️ 양식 고유번호 표시 바 (Form Variant Code) -->
      <div id="formCodeBadgeContainer"></div>

      <!-- 5. 소재 LOT 번호 입력 (차종/부품/공정에 따른 동적 양식) -->
      <div id="section4Card" class="card" style="padding: 16px; margin-bottom: 16px;">
        <label style="font-size: 14px; font-weight: 700; color: var(--accent-blue); margin-bottom: 6px; display: block;" data-i18n="step4_1_lot">
          🧪 <span class="sec-num"></span> 소재 LOT 번호 입력
        </label>
        <p style="font-size: 11px; color: var(--text-muted); margin-bottom: 12px;" data-i18n="lot_help">숫자를 입력하면 (예: 2607251330) 자동으로 '26년 07월 25일 13시 30분' 형태로 변환됩니다.</p>

        <div id="section4LotTableContainer" style="overflow-x: auto;">
          <!-- Dynamic Render -->
        </div>
      </div>

      <!-- 6. Dynamic Section 6 Container (조인트: 조인트 고무 LOT 입력, 소재준비: 치수확인) -->
      <div id="section5DynamicContainer"></div>



      <!-- 5. 수량 실적 입력 (동적 렌더링) -->
      <div id="qtySection"></div>

      <!-- 8/9. 비가동 시간 및 특이사항 (3개 라인 지원) -->
      <div id="downtimeCard" class="card">
        <label id="downtimeTitleLabel" style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 12px; display: block;" data-i18n="step6_downtime">
          📝 <span class="sec-num"></span> 비가동 시간 & 원터치 특이사항 작성 (최대 3건 입력 가능)
        </label>

        <!-- 1차 비가동 -->
        <div style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center; flex-wrap: wrap;">
          <span style="font-size: 11px; font-weight: 700; color: var(--accent-blue); width: 68px; flex-shrink: 0;">1차 비가동</span>
          <div style="flex: 1; min-width: 80px;">
            <input type="number" id="downtimeMinutes" class="form-control" min="0" placeholder="0분" value="${existingData ? (existingData.downtimeMinutes1 ?? existingData.downtimeMinutes) : '0'}" />
          </div>
          <div style="flex: 1; min-width: 90px;">
            <select id="downtimeEquip1" class="form-control">
              <option value="">호기 선택</option>
              <option value="단컷팅" ${existingData?.downtimeEquip1 === '단컷팅' ? 'selected' : ''}>단컷팅</option>
              <option value="펀칭기1호" ${existingData?.downtimeEquip1 === '펀칭기1호' ? 'selected' : ''}>펀칭기1호</option>
              <option value="펀칭기2호" ${existingData?.downtimeEquip1 === '펀칭기2호' ? 'selected' : ''}>펀칭기2호</option>
            </select>
          </div>
          <div style="flex: 2; min-width: 140px;">
            <select id="downtimeReason" class="form-control">
              <option value="" data-i18n="downtime_none">사유 없음 (정상가동)</option>
              ${DOWNTIME_REASONS.map(dr => `
                <option value="${dr.name}" ${(existingData ? (existingData.downtimeReason1 ?? existingData.downtimeReason) : '') === dr.name ? 'selected' : ''}>${dr.name}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- 2차 비가동 (추가 1) -->
        <div style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center; flex-wrap: wrap;">
          <span style="font-size: 11px; font-weight: 700; color: var(--accent-purple); width: 68px; flex-shrink: 0;">2차 비가동</span>
          <div style="flex: 1; min-width: 80px;">
            <input type="number" id="downtimeMinutes2" class="form-control" min="0" placeholder="0분" value="${existingData ? (existingData.downtimeMinutes2 ?? '') : ''}" />
          </div>
          <div style="flex: 1; min-width: 90px;">
            <select id="downtimeEquip2" class="form-control">
              <option value="">호기 선택</option>
              <option value="단컷팅" ${existingData?.downtimeEquip2 === '단컷팅' ? 'selected' : ''}>단컷팅</option>
              <option value="펀칭기1호" ${existingData?.downtimeEquip2 === '펀칭기1호' ? 'selected' : ''}>펀칭기1호</option>
              <option value="펀칭기2호" ${existingData?.downtimeEquip2 === '펀칭기2호' ? 'selected' : ''}>펀칭기2호</option>
            </select>
          </div>
          <div style="flex: 2; min-width: 140px;">
            <select id="downtimeReason2" class="form-control">
              <option value="">추가 사유 선택</option>
              ${DOWNTIME_REASONS.map(dr => `
                <option value="${dr.name}" ${(existingData ? existingData.downtimeReason2 : '') === dr.name ? 'selected' : ''}>${dr.name}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- 3차 비가동 (추가 2) -->
        <div style="display: flex; gap: 8px; margin-bottom: 12px; align-items: center; flex-wrap: wrap;">
          <span style="font-size: 11px; font-weight: 700; color: var(--accent-blue); width: 68px; flex-shrink: 0;">3차 비가동</span>
          <div style="flex: 1; min-width: 80px;">
            <input type="number" id="downtimeMinutes3" class="form-control" min="0" placeholder="0분" value="${existingData ? (existingData.downtimeMinutes3 ?? '') : ''}" />
          </div>
          <div style="flex: 1; min-width: 90px;">
            <select id="downtimeEquip3" class="form-control">
              <option value="">호기 선택</option>
              <option value="단컷팅" ${existingData?.downtimeEquip3 === '단컷팅' ? 'selected' : ''}>단컷팅</option>
              <option value="펀칭기1호" ${existingData?.downtimeEquip3 === '펀칭기1호' ? 'selected' : ''}>펀칭기1호</option>
              <option value="펀칭기2호" ${existingData?.downtimeEquip3 === '펀칭기2호' ? 'selected' : ''}>펀칭기2호</option>
            </select>
          </div>
          <div style="flex: 2; min-width: 140px;">
            <select id="downtimeReason3" class="form-control">
              <option value="">추가 사유 선택</option>
              ${DOWNTIME_REASONS.map(dr => `
                <option value="${dr.name}" ${(existingData ? existingData.downtimeReason3 : '') === dr.name ? 'selected' : ''}>${dr.name}</option>
              `).join('')}
            </select>
          </div>
        </div>

        <textarea id="notesInput" class="form-control" style="margin-top: 8px;" placeholder="작업 특이사항 입력" data-i18n-placeholder="notes_placeholder">${existingData ? existingData.notes : ''}</textarea>
      </div>

      <!-- 화면 하단 고정 여백 (고정 버튼 바에 가려지지 않도록) -->
      <div style="height: 80px;"></div>
    </form>
  `;

  setupStandardMobileEvents(container, existingData, initialMaker.name, initialCarCode, loggedInWorkerName, materialLots);
}

function autoFormatDateTimeString(inputStr) {
  if (!inputStr) return '';
  const digits = inputStr.replace(/\D/g, '');
  if (!digits) return inputStr;

  let formatted = '';
  if (digits.length >= 2) formatted += digits.substring(0, 2) + '년 ';
  if (digits.length >= 4) formatted += digits.substring(2, 4) + '월 ';
  if (digits.length >= 6) formatted += digits.substring(4, 6) + '일 ';
  if (digits.length >= 8) formatted += digits.substring(6, 8) + '시 ';
  if (digits.length >= 10) formatted += digits.substring(8, 10) + '분';
  if (digits.length < 2) formatted = digits;

  return formatted.trim();
}

function setupStandardMobileEvents(container, existingData, defaultMakerName, defaultCarCode, loggedInWorkerName = '', materialLots = {}) {
  const form = container.querySelector('#mobileWorkReportForm');
  if (!form) return;

  const carModelValue = container.querySelector('#carModelValue');
  const processValue = container.querySelector('#processValue');
  const itemSelect = container.querySelector('#itemSelect');
  const notesInput = container.querySelector('#notesInput');
  const partSelectSection = container.querySelector('#partSelectSection');
  const partChipGroup = container.querySelector('#partChipGroup');
  const partValueInput = container.querySelector('#partValue');
  const qtySection = container.querySelector('#qtySection');

  bindTimeWheelPicker(container.querySelector('#startTimeInput'), '시작시간 선택');
  bindTimeWheelPicker(container.querySelector('#endTimeInput'), '종료시간 선택');

  // ============================================================
  // 전체 조합 고유번호 테이블 (차종-부품-공정 → 고유 4자리 번호)
  // 제조사별 구간: 제네시스 1001~1099 / 스텔란티스 2001~2099
  //               현대 3001~3099 / 기아 4001~4099
  //               GM 5001~5099 / 르노 6001~6099
  // ============================================================
  const FORM_CODE_MAP = {
    // ── 제네시스(Genesis) ──────────────────────────────────
    // JG1(스윙도어)
    'JG1_인벨트_소재준비'     : 1001,
    'JG1_인벨트_조인트'       : 1002,
    'JG1_인벨트_후가공'       : 1003,
    'JG1_인벨트_검사포장'     : 1004,
    "JG1_RR C PART'G_조인트"  : 1011,
    "JG1_RR C PART'G_후가공"  : 1012,
    "JG1_RR C PART'G_검사포장": 1013,
    "JG1_G/RUN 'E'_소재준비"  : 1021,
    "JG1_G/RUN 'E'_조인트"    : 1022,
    "JG1_G/RUN 'E'_후가공"    : 1023,
    "JG1_G/RUN 'E'_검사포장"  : 1024,
    // JG1S(코치도어)
    'JG1S_인벨트_소재준비'    : 1031,
    'JG1S_인벨트_조인트'      : 1032,
    'JG1S_인벨트_후가공'      : 1033,
    'JG1S_인벨트_검사포장'    : 1034,
    "JG1S_G/RUN 'E'_소재준비" : 1041,
    "JG1S_G/RUN 'E'_조인트"   : 1042,
    "JG1S_G/RUN 'E'_후가공"   : 1043,
    "JG1S_G/RUN 'E'_검사포장" : 1044,

    // ── 스텔란티스(Stellantis) ────────────────────────────
    // DT CREW
    'DT CREW_D/SIDE_클립머신' : 2001,
    'DT CREW_D/SIDE_소재준비' : 2002,
    'DT CREW_D/SIDE_조인트'   : 2003,
    'DT CREW_D/SIDE_후가공'   : 2004,
    'DT CREW_D/SIDE_검사포장' : 2005,
    // DT QUAD
    'DT QUAD_D/SIDE_클립머신' : 2011,
    'DT QUAD_D/SIDE_소재준비' : 2012,
    'DT QUAD_D/SIDE_조인트'   : 2013,
    'DT QUAD_D/SIDE_후가공'   : 2014,
    'DT QUAD_D/SIDE_검사포장' : 2015,
    // DS CREW
    'DS CREW_D/SIDE_소재준비(A)' : 2021,
    'DS CREW_D/SIDE_소재준비(C)' : 2022,
    'DS CREW_D/SIDE_소재준비(D)' : 2023,
    'DS CREW_D/SIDE_조인트'      : 2024,
    'DS CREW_D/SIDE_조인트(D)'   : 2025,
    'DS CREW_D/SIDE_후가공'      : 2026,
    'DS CREW_D/SIDE_검사포장'    : 2027,
    // DS STD
    'DS STD_D/SIDE_소재준비(A)'  : 2031,
    'DS STD_D/SIDE_소재준비(C)'  : 2032,
    'DS STD_D/SIDE_조인트'       : 2033,
    'DS STD_D/SIDE_후가공'       : 2034,
    'DS STD_D/SIDE_검사포장'     : 2035,
    // KM/KX
    'KM/KX_HOOD SURROUND_클립머신' : 2041,
    'KM/KX_HOOD SURROUND_조인트'   : 2042,
    'KM/KX_HOOD SURROUND_후가공'   : 2043,
    'KM/KX_HOOD SURROUND_검사포장' : 2044,

    // ── 현대(HMC) ─────────────────────────────────────────
    // NE1a
    'NE1a_D/SIDE_소재준비'    : 3001,
    'NE1a_D/SIDE_조인트'      : 3002,
    'NE1a_D/SIDE_후가공'      : 3003,
    'NE1a_D/SIDE_검사포장'    : 3004,
    // ME1a
    "ME1a_PART'G_소재준비"    : 3011,
    "ME1a_PART'G_조인트"      : 3012,
    "ME1a_PART'G_후가공"      : 3013,
    "ME1a_PART'G_검사포장"    : 3014,

    // ── 기아(KMC) ─────────────────────────────────────────
    // OV1K
    'OV1K_PTG_소재준비'       : 4001,
    'OV1K_PTG_조인트'         : 4002,
    'OV1K_PTG_후가공'         : 4003,
    'OV1K_PTG_검사포장'       : 4004,
    'OV1K_FRUNK_소재준비'     : 4011,
    'OV1K_FRUNK_조인트'       : 4012,
    'OV1K_FRUNK_후가공'       : 4013,
    'OV1K_FRUNK_검사포장'     : 4014,
    // LQ2a
    'LQ2a_HOOD SIDE_소재준비' : 4021,
    'LQ2a_HOOD SIDE_조인트'   : 4022,
    'LQ2a_HOOD SIDE_후가공'   : 4023,
    'LQ2a_HOOD SIDE_검사포장' : 4024,
    // MV1a
    'MV1a_PTG_소재준비'       : 4031,
    'MV1a_PTG_조인트'         : 4032,
    'MV1a_PTG_후가공'         : 4033,
    'MV1a_PTG_검사포장'       : 4034,

    // ── GM(지엠) ──────────────────────────────────────────
    '9BQC_G/RUN_소재준비'     : 5001,
    '9BQC_G/RUN_조인트'       : 5002,
    '9BQC_G/RUN_후가공'       : 5003,
    '9BQC_G/RUN_검사포장'     : 5004,

    // ── 르노(Renault) ─────────────────────────────────────
    'P417_UPR_소재준비'        : 6001,
    'P417_UPR_조인트'          : 6002,
    'P417_UPR_후가공'          : 6003,
    'P417_UPR_검사포장'        : 6004,
  };

  // 현재 선택된 양식의 고유 4자리 코드 반환 함수
  function getCurrentFormCode() {
    const curCarCode = carModelValue ? carModelValue.value : currentCarCode;
    const curPart = partValueInput ? partValueInput.value : '';
    const curProc = processValue ? processValue.value : '';
    if (!curProc) return 0;
    const lookupKey = `${curCarCode}_${curPart}_${curProc}`;
    return FORM_CODE_MAP[lookupKey] || 9999;
  }

  // 4자리 양식 고유번호 계산 및 렌더링 함수
  function renderFormCodeBadge() {
    const badgeContainer = container.querySelector('#formCodeBadgeContainer');
    if (!badgeContainer) return;

    const curCarCode = carModelValue ? carModelValue.value : currentCarCode;
    const curPart = partValueInput ? partValueInput.value : '';
    const curProc = processValue ? processValue.value : '';

    if (!curProc) {
      badgeContainer.innerHTML = '';
      return;
    }

    const codeNum = getCurrentFormCode();

    badgeContainer.innerHTML = `
      <div class="card" style="padding: 10px 14px; background: linear-gradient(135deg, rgba(2, 132, 199, 0.08), rgba(99, 102, 241, 0.08)); border: 1.5px solid rgba(2, 132, 199, 0.3); border-radius: 8px; display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 12px; font-weight: 800; color: var(--accent-blue);">🏷️ 양식 고유번호:</span>
          <span style="font-size: 14px; font-weight: 900; color: #0284c7; background: #ffffff; padding: 2px 10px; border-radius: 6px; border: 1px solid #0284c7; font-family: monospace; letter-spacing: 0.5px;">#${codeNum}</span>
        </div>
        <span style="font-size: 11px; color: var(--text-muted); font-weight: 600;">
          (${curCarCode}${curPart ? ' - ' + curPart : ''}${curProc ? ' - ' + curProc : ''})
        </span>
      </div>
    `;
  }

  // 화면에 표시되는 모든 카드에 1부터 N까지 연속된 순번 부여
    function updateSectionNumbers() {
    let step = 1;
    const allSecNums = container.querySelectorAll('#mobileWorkReportForm .sec-num');
    allSecNums.forEach(span => {
      let isVisible = true;
      let curr = span;
      while (curr && curr !== container) {
        if (curr.style && curr.style.display === 'none') {
          isVisible = false;
          break;
        }
        curr = curr.parentElement;
      }
      
      if (isVisible) {
        span.textContent = step + '.';
        step++;
      } else {
        span.textContent = '';
      }
    });
  }

  // DT CREW / DT QUAD D/SIDE 클립머신 전용 여부 확인 (#2001, #2011)
  function isDtCrewClip() {
    const _car = container.querySelector('#carModelValue');
    const _part = container.querySelector('#partValue');
    const _proc = container.querySelector('#processValue');
    const carVal = _car?.value;
    return (carVal === 'DT CREW' || carVal === 'DT QUAD') &&
           (_part?.value === 'D/SIDE' || !_part?.value || _part?.value === '') &&
           _proc?.value === '클립머신';
  }

  // DT CREW / DT QUAD D/SIDE 클립머신 전용 품질검사 테이블 HTML (6. 치수확인 + 8. 생산실적 카드 분리)

  // DT CREW (A & B) 불량 합계 및 실적 자동 집계 계산 함수

  // KM/KX HOOD SURROUND 클립머신 (#2041) 전용 HTML (치수확인 2개 표 + 생산실적)

  // KM/KX 클립머신 (#2041) 실적 및 불량 집계

  // DT CREW D/SIDE 후가공(#2004) 생산실적 및 불량 현황 테이블 HTML (첨부 사진 양식 100% 동일 구현)

  // DT CREW D/SIDE 후가공(#2004) 수량 및 불량 자동 집계 계산 함수

  // KM/KX HOOD SURROUND 후가공(#2043) 생산실적 및 불량 현황 테이블 HTML (LH -> HOOD 단일 열)

  // KM/KX HOOD SURROUND 후가공(#2043) 수량 및 불량 자동 집계 계산 함수

  // DT CREW D/SIDE 조인트(#2003) 생산실적 및 폐기 불량현황 테이블 HTML

  // KM/KX HOOD SURROUND 조인트(#2042) 생산실적 및 폐기 불량현황 테이블 HTML (구분: 1호기 / 2호기)

  // DT CREW D/SIDE 조인트(#2003) 수량 및 불량 자동 집계 계산 함수

  // DS CREW D/SIDE 조인트(D)(#2025) 생산실적 및 폐기 불량현황 테이블 HTML (1호~4호 단일 표, 구분 LH/RH 삭제, 1~4호 개별 입력)

  // DS CREW D/SIDE 조인트(D)(#2025) 수량 및 불량 자동 집계 계산 함수

  // DT CREW D/SIDE 소재준비(#2002) 전용 생산실적 HTML (첨부 사진 양식 100% 동일 구현)

  // DT CREW D/SIDE 소재준비(#2002) 불량 및 수량 자동 집계 계산 함수


  // 표준 수량 및 실적/불량 세부 테이블 HTML (제공 사진 양식 100% 동일 구현)

  // JG1 수량실적 자동 집계 함수

  // 5. Section 5 동적 렌더링 함수 (공정에 따라 조인트/소재준비 섹션 전환)

  function _getCtx() {
    return { container, processValue, carModelValue, currentCarCode, partValueInput, existingData,
             getCurrentFormCode, bindNumberWheelPicker, updateDowntimeSection, qtySection, isDtCrewClip, currentMakerName };
  }
  function renderSection5() {
    _Sections.renderSection5(_getCtx());
  }


  // 조인트 전용 생산실적 및 공정간불량 테이블 HTML

  // 조인트 수량실적 자동 계산

  // 후가공 전용 생산실적 및 공정간불량 테이블 HTML

  // 후가공 수량실적 및 불량 자동 계산

  // KM/KX HOOD SURROUND 검사포장(#2044) 검사실적 테이블 HTML (2열, LH/RH -> HOOD 고정)

  // DT CREW 검사포장(#2005) 전용 7. 검사실적 테이블 HTML

  // DT CREW 검사포장(#2005) 검사실적 자동 계산 함수

  // 비가동 섹션 타이틀 및 호기 목록 동적 업데이트
  function updateDowntimeSection() {
    _Sections.updateDowntimeSection(_getCtx());
  }


  // 6. 수량 실적 섹션 렌더링 (고유번호 formCode 기반 분기)
  function renderQtySection() {
    _Sections.renderQtySection(_getCtx());
  }


  // [3단계] 부품 칩 렌더링 함수
  function renderPartChips(carCode) {
    if (!partSelectSection || !partChipGroup) return;
    const parts = CAR_MODEL_PARTS[carCode];
    if (!parts || parts.length === 0) {
      partSelectSection.style.display = 'none';
      if (partValueInput) partValueInput.value = '';
      return;
    }
    partSelectSection.style.display = 'block';
    partChipGroup.innerHTML = parts.map((p, idx) => `
      <div class="touch-chip part-chip ${idx === 0 ? 'active' : ''}" data-code="${p.code}" data-name="${p.name}" style="padding: 8px 14px; font-weight: 700; background: ${idx === 0 ? '' : ''}">
        ${p.name}
      </div>
    `).join('');
    if (partValueInput) partValueInput.value = parts[0].code;
    partChipGroup.querySelectorAll('.part-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        partChipGroup.querySelectorAll('.part-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        if (partValueInput) partValueInput.value = chip.dataset.code;
        if (processValue) processValue.value = '';
        try { renderProcessChips(carCode, ''); } catch(e) { console.warn('renderProcessChips error:', e); }
        try { renderSection5(); } catch(e) { console.warn('renderSection5 error:', e); }
        try { renderQtySection(); } catch(e) { console.warn('renderQtySection error:', e); }
        try { renderSection4LotTable(); } catch(e) { console.warn('renderSection4LotTable error:', e); }
        try { updateDowntimeSection(); } catch(e) { console.warn('updateDowntimeSection error:', e); }
        renderFormCodeBadge();
        updateSectionNumbers();
      });
    });
  }

  const makerChipGroup = container.querySelector('#makerChipGroup');
  const subCarChipGroup = container.querySelector('#subCarChipGroup');
  const processChipGroup = container.querySelector('#processChipGroup');

  let currentMakerName = defaultMakerName;
  let currentCarCode = defaultCarCode;

  // [4단계] 소재 LOT 번호 입력 테이블 동적 렌더링 함수
  function renderSection4LotTable(materialLots = {}) {
    _Sections.renderSection4LotTable(materialLots, _getCtx());
  }


  // [2단계] 세부 차종 칩 동적 렌더링 함수
  function renderSubCarChips(makerName, targetCarCode = null) {
    let makerObj = MANUFACTURERS.find(m => m.name === makerName);
    if (!makerObj && makerName) {
      makerObj = MANUFACTURERS.find(m => m.name.includes(makerName) || makerName.includes(m.name.split('(')[0]));
    }
    if (!makerObj) makerObj = MANUFACTURERS[0];

    currentMakerName = makerObj.name;
    const models = makerObj.models;

    let activeCode = targetCarCode;
    if (!activeCode || !models.some(c => c.code === activeCode)) {
      activeCode = models[0].code;
    }

    if (subCarChipGroup) {
      subCarChipGroup.innerHTML = models.map(c => `
        <div class="touch-chip subcar-chip ${activeCode === c.code ? 'active' : ''}" data-code="${c.code}" style="padding: 8px 14px; font-weight: 800;">
          ${c.name}
        </div>
      `).join('');

      subCarChipGroup.querySelectorAll('.subcar-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          subCarChipGroup.querySelectorAll('.subcar-chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          const code = chip.dataset.code;
          if (carModelValue) carModelValue.value = code;
          currentCarCode = code;
          if (processValue) processValue.value = '';

          const items = store.getItems(code);
          if (itemSelect) {
            itemSelect.innerHTML = items.map(it => `
              <option value="${it.code}" data-name="${it.name}">[${it.code}] ${it.name}</option>
            `).join('');
          }

          try { renderPartChips(code); } catch(e) { console.warn('renderPartChips error:', e); }
          try { renderProcessChips(code, ''); } catch(e) { console.warn('renderProcessChips error:', e); }
          try { renderQtySection(); } catch(e) { console.warn('renderQtySection error:', e); }
          try { renderSection4LotTable(); } catch(e) { console.warn('renderSection4LotTable error:', e); }
          try { renderSection5(); } catch(e) { console.warn('renderSection5 error:', e); }
          try { updateDowntimeSection(); } catch(e) { console.warn('updateDowntimeSection error:', e); }
          renderFormCodeBadge();
          updateSectionNumbers();
        });
      });
    }

    if (carModelValue) carModelValue.value = activeCode;
    currentCarCode = activeCode;

    const items = store.getItems(activeCode);
    if (itemSelect) {
      itemSelect.innerHTML = items.map(it => `
        <option value="${it.code}" data-name="${it.name}">[${it.code}] ${it.name}</option>
      `).join('');
    }

    renderPartChips(activeCode);
    renderProcessChips(activeCode);
    renderQtySection();
    renderSection4LotTable();
    renderSection5();
    updateDowntimeSection();
    renderFormCodeBadge();
    updateSectionNumbers();
    i18n.applyTranslations(container);
  }

  // [3단계] 생산 공정 칩 동적 렌더링 함수
  function renderProcessChips(carCode, initialProcess = null) {
    if (!processChipGroup) return;

    const isStellantis = (currentMakerName && currentMakerName.includes('스텔란티스')) || 
                         ['DT CREW', 'DT QUAD', 'DS CREW', 'DS STD', 'KM/KX'].includes(carCode);

    const allProcesses = store.getProcesses().map(p => p.name);
    let processList = [...allProcesses];

    if (isStellantis) {
      if (!processList.includes('클립머신')) {
        processList.unshift('클립머신');
      } else {
        processList = ['클립머신', ...processList.filter(p => p !== '클립머신')];
      }
    } else {
      processList = processList.filter(p => p !== '클립머신');
    }

    // RR C PART'G 선택 시 소재준비 공정 제외
    const curPart = partValueInput ? partValueInput.value : '';
    if (curPart === "RR C PART'G" || curPart.includes("RR C PART'G")) {
      processList = processList.filter(p => p !== '소재준비');
    }

    // KM/KX 선택 시 소재준비 공정 제외
    if (carCode === 'KM/KX') {
      processList = processList.filter(p => p !== '소재준비');
    }

    // DS CREW, DS STD 선택 시 클립머신 공정 제외
    if (carCode === 'DS CREW' || carCode === 'DS STD') {
      processList = processList.filter(p => p !== '클립머신');
    }

    // DS CREW 선택 시 소재준비(A/C/D) 세분화 및 조인트와 후가공 사이에 조인트(D) 추가
    if (carCode === 'DS CREW') {
      const idx = processList.indexOf('소재준비');
      if (idx !== -1) {
        processList.splice(idx, 1, '소재준비(A)', '소재준비(C)', '소재준비(D)');
      }
      const jIdx = processList.indexOf('조인트');
      if (jIdx !== -1) {
        processList.splice(jIdx + 1, 0, '조인트(D)');
      }
    }

    // DS STD 선택 시 소재준비 공정을 소재준비(A), 소재준비(C) 2개 항목으로 세분화
    if (carCode === 'DS STD') {
      const idx = processList.indexOf('소재준비');
      if (idx !== -1) {
        processList.splice(idx, 1, '소재준비(A)', '소재준비(C)');
      }
    }

    let activeProcess = initialProcess;
    if (activeProcess === null) {
      activeProcess = processValue ? processValue.value : '';
    }
    if (activeProcess && !processList.includes(activeProcess)) {
      activeProcess = '';
    }

    if (processValue) processValue.value = activeProcess;

    processChipGroup.innerHTML = processList.map(pName => {
      const i18nKey = STRING_TO_KEY_MAP[pName] ? ` data-i18n="${STRING_TO_KEY_MAP[pName]}"` : '';
      return `
      <div class="touch-chip ${activeProcess === pName ? 'active' : ''}" data-type="process" data-name="${pName}" style="padding: 8px 14px; font-weight: 700;">
        <span${i18nKey}>${pName}</span>
      </div>
    `}).join('');

    processChipGroup.querySelectorAll('.touch-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        processChipGroup.querySelectorAll('.touch-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        if (processValue) processValue.value = chip.dataset.name;
        try { renderSection5(); } catch(e) { console.warn('renderSection5 error:', e); }
        try { renderQtySection(); } catch(e) { console.warn('renderQtySection error:', e); }
        try { renderSection4LotTable(); } catch(e) { console.warn('renderSection4LotTable error:', e); }
        try { updateDowntimeSection(); } catch(e) { console.warn('updateDowntimeSection error:', e); }
        renderFormCodeBadge();
        updateSectionNumbers();
      });
    });
    renderFormCodeBadge();
    updateSectionNumbers();
    i18n.applyTranslations(container);
  }

  // 1단계 제조사 칩 클릭 이벤트 바인딩
  if (makerChipGroup) {
    makerChipGroup.querySelectorAll('.maker-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        makerChipGroup.querySelectorAll('.maker-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const selectedMaker = chip.dataset.maker;
        renderSubCarChips(selectedMaker);
        updateSectionNumbers();
      });
    });
  }

  // 초기 렌더링
  renderSubCarChips(currentMakerName, currentCarCode);
  renderProcessChips(currentCarCode, existingData ? existingData.processName : '');
  renderSection5();
  renderQtySection();
  renderSection4LotTable();
  updateDowntimeSection();
  renderFormCodeBadge();
  updateSectionNumbers();

  container.querySelectorAll('.btn-step-change').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const delta = Number(btn.dataset.delta) || 0;
      const inputElem = container.querySelector(`#${targetId}`);
      if (inputElem) {
        let currentVal = Number(inputElem.value) || 0;
        inputElem.value = Math.max(0, currentVal + delta);
      }
    });
  });

  const processStandardSave = (targetStatus) => {
    try {
      const formCode = getCurrentFormCode();
      const curCarModelValue = container.querySelector('#carModelValue');
      const curProcessValue = container.querySelector('#processValue');

      if (!curProcessValue || !curProcessValue.value) {
        windowMock.showToast('⚠️ 생산공정을 선택해 주세요.', 'warning');
        return;
      }
      const curItemSelect = container.querySelector('#itemSelect');
      const curPartValueInput = container.querySelector('#partValue');
      const curNotesInput = container.querySelector('#notesInput');
      const selectedItemOption = (curItemSelect && curItemSelect.options && curItemSelect.selectedIndex >= 0) ? curItemSelect.options[curItemSelect.selectedIndex] : null;

      const startTime = container.querySelector('#startTimeInput')?.value || '08:00';
      const endTime = container.querySelector('#endTimeInput')?.value || '17:00';
      const workHours = `${startTime} ~ ${endTime}`;

      const materialLots = {
        'FRT_초물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_FRT_초물')?.value || container.querySelector('#lotNo_FRT_초물')?.value || ''),
        'FRT_중물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_FRT_중물')?.value || container.querySelector('#lotNo_FRT_중물')?.value || ''),
        'FRT_종물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_FRT_종물')?.value || container.querySelector('#lotNo_FRT_종물')?.value || ''),
        'RR_초물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_RR_초물')?.value || container.querySelector('#lotNo_RR_초물')?.value || ''),
        'RR_중물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_RR_중물')?.value || container.querySelector('#lotNo_RR_중물')?.value || ''),
        'RR_종물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_RR_종물')?.value || container.querySelector('#lotNo_RR_종물')?.value || ''),

        'LH_FRT_초물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_FRT_초물')?.value || ''),
        'LH_FRT_중물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_FRT_중물')?.value || ''),
        'LH_FRT_종물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_FRT_종물')?.value || ''),
        'LH_RR_초물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_RR_초물')?.value || ''),
        'LH_RR_중물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_RR_중물')?.value || ''),
        'LH_RR_종물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_RR_종물')?.value || ''),

        'RH_FRT_초물': autoFormatDateTimeString(container.querySelector('#lotNo_RH_FRT_초물')?.value || ''),
        'RH_FRT_중물': autoFormatDateTimeString(container.querySelector('#lotNo_RH_FRT_중물')?.value || ''),
        'RH_FRT_종물': autoFormatDateTimeString(container.querySelector('#lotNo_RH_FRT_종물')?.value || ''),
        'RH_RR_초물': autoFormatDateTimeString(container.querySelector('#lotNo_RH_RR_초물')?.value || ''),
        'RH_RR_중물': autoFormatDateTimeString(container.querySelector('#lotNo_RH_RR_중물')?.value || ''),
        'RH_RR_종물': autoFormatDateTimeString(container.querySelector('#lotNo_RH_RR_종물')?.value || ''),

        'A_초물': autoFormatDateTimeString(container.querySelector('#lotNo_A_초물')?.value || ''),
        'A1_초물': autoFormatDateTimeString(container.querySelector('#lotNo_A1_초물')?.value || container.querySelector('#lotNo_A_초물')?.value || ''),
        'A1_중물': autoFormatDateTimeString(container.querySelector('#lotNo_A1_중물')?.value || container.querySelector('#lotNo_A_중물')?.value || ''),
        'A1_종물': autoFormatDateTimeString(container.querySelector('#lotNo_A1_종물')?.value || container.querySelector('#lotNo_A_종물')?.value || ''),
        'B1_초물': autoFormatDateTimeString(container.querySelector('#lotNo_B1_초물')?.value || container.querySelector('#lotNo_B_초물')?.value || ''),
        'B1_중물': autoFormatDateTimeString(container.querySelector('#lotNo_B1_중물')?.value || container.querySelector('#lotNo_B_중물')?.value || ''),
        'B1_종물': autoFormatDateTimeString(container.querySelector('#lotNo_B1_종물')?.value || container.querySelector('#lotNo_B_종물')?.value || ''),
        'C1_초물': autoFormatDateTimeString(container.querySelector('#lotNo_C1_초물')?.value || container.querySelector('#lotNo_C_초물')?.value || ''),
        'C1_중물': autoFormatDateTimeString(container.querySelector('#lotNo_C1_중물')?.value || container.querySelector('#lotNo_C_중물')?.value || ''),
        'C1_종물': autoFormatDateTimeString(container.querySelector('#lotNo_C1_종물')?.value || container.querySelector('#lotNo_C_종물')?.value || ''),
        'D1_초물': autoFormatDateTimeString(container.querySelector('#lotNo_D1_초물')?.value || container.querySelector('#lotNo_D_초물')?.value || ''),
        'D1_중물': autoFormatDateTimeString(container.querySelector('#lotNo_D1_중물')?.value || container.querySelector('#lotNo_D_중물')?.value || ''),
        'D1_종물': autoFormatDateTimeString(container.querySelector('#lotNo_D1_종물')?.value || container.querySelector('#lotNo_D_종물')?.value || ''),
        '2004_lh_1': container.querySelector('#lotNo_2004_lh_1')?.checked || container.querySelector('#lotNo_2004_lh')?.checked || false,
        '2004_rh_1': container.querySelector('#lotNo_2004_rh_1')?.checked || container.querySelector('#lotNo_2004_rh')?.checked || false,
        'LH_A_초물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_A_초물')?.value || ''),
        'LH_A_중물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_A_중물')?.value || ''),
        'LH_A_종물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_A_종물')?.value || ''),
        'LH_B_초물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_B_초물')?.value || ''),
        'LH_B_중물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_B_중물')?.value || ''),
        'LH_B_종물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_B_종물')?.value || ''),
        'LH_C_초물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_C_초물')?.value || ''),
        'LH_C_중물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_C_중물')?.value || ''),
        'LH_C_종물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_C_종물')?.value || ''),
        'LH_D_초물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_D_초물')?.value || ''),
        'LH_D_중물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_D_중물')?.value || ''),
        'LH_D_종물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_D_종물')?.value || ''),
        'RH_A_초물': autoFormatDateTimeString(container.querySelector('#lotNo_RH_A_초물')?.value || ''),
        'RH_A_중물': autoFormatDateTimeString(container.querySelector('#lotNo_RH_A_중물')?.value || ''),
        'RH_A_종물': autoFormatDateTimeString(container.querySelector('#lotNo_RH_A_종물')?.value || ''),
        'RH_B_초물': autoFormatDateTimeString(container.querySelector('#lotNo_RH_B_초물')?.value || ''),
        'RH_B_중물': autoFormatDateTimeString(container.querySelector('#lotNo_RH_B_중물')?.value || ''),
        'RH_B_종물': autoFormatDateTimeString(container.querySelector('#lotNo_RH_B_종물')?.value || ''),
        'RH_C_초물': autoFormatDateTimeString(container.querySelector('#lotNo_RH_C_초물')?.value || ''),
        'RH_C_중물': autoFormatDateTimeString(container.querySelector('#lotNo_RH_C_중물')?.value || ''),
        'RH_C_종물': autoFormatDateTimeString(container.querySelector('#lotNo_RH_C_종물')?.value || ''),
        'RH_D_초물': autoFormatDateTimeString(container.querySelector('#lotNo_RH_D_초물')?.value || ''),
        'RH_D_중물': autoFormatDateTimeString(container.querySelector('#lotNo_RH_D_중물')?.value || ''),
        'RH_D_종물': autoFormatDateTimeString(container.querySelector('#lotNo_RH_D_종물')?.value || ''),

        'A2_초물': autoFormatDateTimeString(container.querySelector('#lotNo_A2_초물')?.value || ''),
        'A2_중물': autoFormatDateTimeString(container.querySelector('#lotNo_A2_중물')?.value || ''),
        'A2_종물': autoFormatDateTimeString(container.querySelector('#lotNo_A2_종물')?.value || ''),
        'B2_초물': autoFormatDateTimeString(container.querySelector('#lotNo_B2_초물')?.value || ''),
        'B2_중물': autoFormatDateTimeString(container.querySelector('#lotNo_B2_중물')?.value || ''),
        'B2_종물': autoFormatDateTimeString(container.querySelector('#lotNo_B2_종물')?.value || ''),
        'C2_초물': autoFormatDateTimeString(container.querySelector('#lotNo_C2_초물')?.value || ''),
        'C2_중물': autoFormatDateTimeString(container.querySelector('#lotNo_C2_중물')?.value || ''),
        'C2_종물': autoFormatDateTimeString(container.querySelector('#lotNo_C2_종물')?.value || ''),
        'D2_초물': autoFormatDateTimeString(container.querySelector('#lotNo_D2_초물')?.value || ''),
        'D2_중물': autoFormatDateTimeString(container.querySelector('#lotNo_D2_중물')?.value || ''),
        'D2_종물': autoFormatDateTimeString(container.querySelector('#lotNo_D2_종물')?.value || ''),
        'DTA_Roll_초물': autoFormatDateTimeString(container.querySelector('#lotNo_DTA_Roll_초물')?.value || ''),
        'DTA_Roll_중물': autoFormatDateTimeString(container.querySelector('#lotNo_DTA_Roll_중물')?.value || ''),
        'DTA_Roll_종물': autoFormatDateTimeString(container.querySelector('#lotNo_DTA_Roll_종물')?.value || ''),
        'Hood_초물': autoFormatDateTimeString(container.querySelector('#lotNo_Hood_초물')?.value || ''),
        'Hood_중물': autoFormatDateTimeString(container.querySelector('#lotNo_Hood_중물')?.value || ''),
        'Hood_종물': autoFormatDateTimeString(container.querySelector('#lotNo_Hood_종물')?.value || ''),
        'DTB_Roll_초물': autoFormatDateTimeString(container.querySelector('#lotNo_DTB_Roll_초물')?.value || ''),
        'DTB_Roll_중물': autoFormatDateTimeString(container.querySelector('#lotNo_DTB_Roll_중물')?.value || ''),
        'DTB_Roll_종물': autoFormatDateTimeString(container.querySelector('#lotNo_DTB_Roll_종물')?.value || ''),
        'LHA_초물': autoFormatDateTimeString(container.querySelector('#lotNo_LHA_초물')?.value || ''),
        'LHA_중물': autoFormatDateTimeString(container.querySelector('#lotNo_LHA_중물')?.value || ''),
        'LHA_종물': autoFormatDateTimeString(container.querySelector('#lotNo_LHA_종물')?.value || ''),
        'D_초물': autoFormatDateTimeString(container.querySelector('#lotNo_D_초물')?.value || ''),
        'D_중물': autoFormatDateTimeString(container.querySelector('#lotNo_D_중물')?.value || ''),
        'D_종물': autoFormatDateTimeString(container.querySelector('#lotNo_D_종물')?.value || ''),
        'RHA_초물': autoFormatDateTimeString(container.querySelector('#lotNo_RHA_초물')?.value || ''),
        'RHA_중물': autoFormatDateTimeString(container.querySelector('#lotNo_RHA_중물')?.value || ''),
        'RHA_종물': autoFormatDateTimeString(container.querySelector('#lotNo_RHA_종물')?.value || ''),
        'LH_초물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_초물')?.value || ''),
        'LH_중물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_중물')?.value || ''),
        'LH_종물': autoFormatDateTimeString(container.querySelector('#lotNo_LH_종물')?.value || ''),
        'MIDDLE_초물': autoFormatDateTimeString(container.querySelector('#lotNo_MIDDLE_초물')?.value || ''),
        'MIDDLE_중물': autoFormatDateTimeString(container.querySelector('#lotNo_MIDDLE_중물')?.value || ''),
        'MIDDLE_종물': autoFormatDateTimeString(container.querySelector('#lotNo_MIDDLE_종물')?.value || ''),
        'RH_초물': autoFormatDateTimeString(container.querySelector('#lotNo_RH_초물')?.value || ''),
        'RH_중물': autoFormatDateTimeString(container.querySelector('#lotNo_RH_중물')?.value || ''),
        'RH_종물': autoFormatDateTimeString(container.querySelector('#lotNo_RH_종물')?.value || ''),
        '2004_lh_2': container.querySelector('#lotNo_2004_lh_2')?.checked || false,
        '2004_rh_2': container.querySelector('#lotNo_2004_rh_2')?.checked || false
      };

      const itemCodeVal = curPartValueInput?.value || curItemSelect?.value || '인벨트';
      const itemNameVal = curPartValueInput?.value || selectedItemOption?.dataset?.name || curItemSelect?.value || itemCodeVal;

      // isDtCrewClip 조건 - 저장 시점 최신 DOM으로 직접 판단 (#2001, #2011)
      const isCurDtCrewClip = (curCarModelValue?.value === 'DT CREW' || curCarModelValue?.value === 'DT QUAD') &&
                               (curPartValueInput?.value === 'D/SIDE' || !curPartValueInput?.value || curPartValueInput?.value === '') &&
                               curProcessValue?.value === '클립머신';

      const currentUserRole = store.getUserRole();
      const currentWorkerName = currentUserRole?.workerName || loggedInWorkerName || '작업자';

      const dt1Min = Number(container.querySelector('#downtimeMinutes')?.value) || 0;
      const dt1Equip = container.querySelector('#downtimeEquip1')?.value || '';
      const dt1Reason = container.querySelector('#downtimeReason')?.value || '';

      const dt2Min = Number(container.querySelector('#downtimeMinutes2')?.value) || 0;
      const dt2Equip = container.querySelector('#downtimeEquip2')?.value || '';
      const dt2Reason = container.querySelector('#downtimeReason2')?.value || '';

      const dt3Min = Number(container.querySelector('#downtimeMinutes3')?.value) || 0;
      const dt3Equip = container.querySelector('#downtimeEquip3')?.value || '';
      const dt3Reason = container.querySelector('#downtimeReason3')?.value || '';

      const totalDowntimeMinutes = dt1Min + dt2Min + dt3Min;

      const reasonsArr = [];
      if (dt1Min > 0 && dt1Reason) reasonsArr.push(`1차: ${dt1Equip ? dt1Equip + ' ' : ''}${dt1Reason}(${dt1Min}분)`);
      if (dt2Min > 0 && dt2Reason) reasonsArr.push(`2차: ${dt2Equip ? dt2Equip + ' ' : ''}${dt2Reason}(${dt2Min}분)`);
      if (dt3Min > 0 && dt3Reason) reasonsArr.push(`3차: ${dt3Equip ? dt3Equip + ' ' : ''}${dt3Reason}(${dt3Min}분)`);

      const combinedDowntimeReason = reasonsArr.length > 0 ? reasonsArr.join(', ') : (dt1Reason || '');

      const dimData = {
        dt_초_1_LH: container.querySelector('#dim_dt_초_1_LH')?.value || '',
        dt_초_1_RH: container.querySelector('#dim_dt_초_1_RH')?.value || '',
        dt_초_2_LH: container.querySelector('#dim_dt_초_2_LH')?.value || '',
        dt_초_2_RH: container.querySelector('#dim_dt_초_2_RH')?.value || '',
        dt_초_3_LH: container.querySelector('#dim_dt_초_3_LH')?.value || '',
        dt_초_3_RH: container.querySelector('#dim_dt_초_3_RH')?.value || '',
        dt_초_4_LH: container.querySelector('#dim_dt_초_4_LH')?.value || '',
        dt_초_4_RH: container.querySelector('#dim_dt_초_4_RH')?.value || '',

        dt_중_1_LH: container.querySelector('#dim_dt_중_1_LH')?.value || '',
        dt_중_1_RH: container.querySelector('#dim_dt_중_1_RH')?.value || '',
        dt_중_2_LH: container.querySelector('#dim_dt_중_2_LH')?.value || '',
        dt_중_2_RH: container.querySelector('#dim_dt_중_2_RH')?.value || '',
        dt_중_3_LH: container.querySelector('#dim_dt_중_3_LH')?.value || '',
        dt_중_3_RH: container.querySelector('#dim_dt_중_3_RH')?.value || '',
        dt_중_4_LH: container.querySelector('#dim_dt_중_4_LH')?.value || '',
        dt_중_4_RH: container.querySelector('#dim_dt_중_4_RH')?.value || '',

        dt_종_1_LH: container.querySelector('#dim_dt_종_1_LH')?.value || '',
        dt_종_1_RH: container.querySelector('#dim_dt_종_1_RH')?.value || '',
        dt_종_2_LH: container.querySelector('#dim_dt_종_2_LH')?.value || '',
        dt_종_2_RH: container.querySelector('#dim_dt_종_2_RH')?.value || '',
        dt_종_3_LH: container.querySelector('#dim_dt_종_3_LH')?.value || '',
        dt_종_3_RH: container.querySelector('#dim_dt_종_3_RH')?.value || '',
        dt_종_4_LH: container.querySelector('#dim_dt_종_4_LH')?.value || '',
        dt_종_4_RH: container.querySelector('#dim_dt_종_4_RH')?.value || '',

        cut_FRT_초: container.querySelector('#dim_cut_FRT_초')?.value || '',
        cut_FRT_중: container.querySelector('#dim_cut_FRT_중')?.value || '',
        cut_FRT_종: container.querySelector('#dim_cut_FRT_종')?.value || '',
        cut_RR_초: container.querySelector('#dim_cut_RR_초')?.value || '',
        cut_RR_중: container.querySelector('#dim_cut_RR_중')?.value || '',
        cut_RR_종: container.querySelector('#dim_cut_RR_종')?.value || '',

        step_f_초_FL: container.querySelector('#dim_step_f_초_FL')?.value || '',
        step_f_초_FR: container.querySelector('#dim_step_f_초_FR')?.value || '',
        step_f_초_RL: container.querySelector('#dim_step_f_초_RL')?.value || '',
        step_f_초_RR: container.querySelector('#dim_step_f_초_RR')?.value || '',
        step_f_중_FL: container.querySelector('#dim_step_f_중_FL')?.value || '',
        step_f_중_FR: container.querySelector('#dim_step_f_중_FR')?.value || '',
        step_f_중_RL: container.querySelector('#dim_step_f_중_RL')?.value || '',
        step_f_중_RR: container.querySelector('#dim_step_f_중_RR')?.value || '',
        step_f_종_FL: container.querySelector('#dim_step_f_종_FL')?.value || '',
        step_f_종_FR: container.querySelector('#dim_step_f_종_FR')?.value || '',
        step_f_종_RL: container.querySelector('#dim_step_f_종_RL')?.value || '',
        step_f_종_RR: container.querySelector('#dim_step_f_종_RR')?.value || '',

        step_r_초_FL: container.querySelector('#dim_step_r_초_FL')?.value || '',
        step_r_초_FR: container.querySelector('#dim_step_r_초_FR')?.value || '',
        step_r_초_RL: container.querySelector('#dim_step_r_초_RL')?.value || '',
        step_r_초_RR: container.querySelector('#dim_step_r_초_RR')?.value || '',
        step_r_중_FL: container.querySelector('#dim_step_r_중_FL')?.value || '',
        step_r_중_FR: container.querySelector('#dim_step_r_중_FR')?.value || '',
        step_r_중_RL: container.querySelector('#dim_step_r_중_RL')?.value || '',
        step_r_중_RR: container.querySelector('#dim_step_r_중_RR')?.value || '',
        step_r_종_FL: container.querySelector('#dim_step_r_종_FL')?.value || '',
        step_r_종_FR: container.querySelector('#dim_step_r_종_FR')?.value || '',
        step_r_종_RL: container.querySelector('#dim_step_r_종_RL')?.value || '',
        step_r_종_RR: container.querySelector('#dim_step_r_종_RR')?.value || '',

        // 검사포장 (전장 길이 측정)
        ctc_frt_lh_초: container.querySelector('#dim_ctc_frt_lh_초')?.value || '',
        ctc_frt_lh_중: container.querySelector('#dim_ctc_frt_lh_중')?.value || '',
        ctc_frt_lh_종: container.querySelector('#dim_ctc_frt_lh_종')?.value || '',
        ctc_frt_rh_초: container.querySelector('#dim_ctc_frt_rh_초')?.value || '',
        ctc_frt_rh_중: container.querySelector('#dim_ctc_frt_rh_중')?.value || '',
        ctc_frt_rh_종: container.querySelector('#dim_ctc_frt_rh_종')?.value || '',
        ctc_rr_lh_초: container.querySelector('#dim_ctc_rr_lh_초')?.value || '',
        ctc_rr_lh_중: container.querySelector('#dim_ctc_rr_lh_중')?.value || '',
        ctc_rr_lh_종: container.querySelector('#dim_ctc_rr_lh_종')?.value || '',
        ctc_rr_rh_초: container.querySelector('#dim_ctc_rr_rh_초')?.value || '',
        ctc_rr_rh_중: container.querySelector('#dim_ctc_rr_rh_중')?.value || '',
        ctc_rr_rh_종: container.querySelector('#dim_ctc_rr_rh_종')?.value || '',

        ltl_frt_lh_초: container.querySelector('#dim_ltl_frt_lh_초')?.value || '',
        ltl_frt_lh_중: container.querySelector('#dim_ltl_frt_lh_중')?.value || '',
        ltl_frt_lh_종: container.querySelector('#dim_ltl_frt_lh_종')?.value || '',
        ltl_frt_rh_초: container.querySelector('#dim_ltl_frt_rh_초')?.value || '',
        ltl_frt_rh_중: container.querySelector('#dim_ltl_frt_rh_중')?.value || '',
        ltl_frt_rh_종: container.querySelector('#dim_ltl_frt_rh_종')?.value || '',
        ltl_rr_lh_초: container.querySelector('#dim_ltl_rr_lh_초')?.value || '',
        ltl_rr_lh_중: container.querySelector('#dim_ltl_rr_lh_중')?.value || '',
        ltl_rr_lh_종: container.querySelector('#dim_ltl_rr_lh_종')?.value || '',
        ltl_rr_rh_초: container.querySelector('#dim_ltl_rr_rh_초')?.value || '',
        ltl_rr_rh_중: container.querySelector('#dim_ltl_rr_rh_중')?.value || '',
        ltl_rr_rh_종: container.querySelector('#dim_ltl_rr_rh_종')?.value || ''
      };

      const dim2005Data = {
        cho_A_lh: container.querySelector('#dim2005_cho_A_lh')?.value || '',
        cho_A_rh: container.querySelector('#dim2005_cho_A_rh')?.value || '',
        cho_B_left_lh: container.querySelector('#dim2005_cho_B_left_lh')?.value || '',
        cho_B_left_rh: container.querySelector('#dim2005_cho_B_left_rh')?.value || '',
        cho_B_right_lh: container.querySelector('#dim2005_cho_B_right_lh')?.value || '',
        cho_B_right_rh: container.querySelector('#dim2005_cho_B_right_rh')?.value || '',
        cho_C_lh: container.querySelector('#dim2005_cho_C_lh')?.value || '',
        cho_C_rh: container.querySelector('#dim2005_cho_C_rh')?.value || '',
        cho_D_lh: container.querySelector('#dim2005_cho_D_lh')?.value || '',
        cho_D_rh: container.querySelector('#dim2005_cho_D_rh')?.value || '',

        jung_A_lh: container.querySelector('#dim2005_jung_A_lh')?.value || '',
        jung_A_rh: container.querySelector('#dim2005_jung_A_rh')?.value || '',
        jung_B_left_lh: container.querySelector('#dim2005_jung_B_left_lh')?.value || '',
        jung_B_left_rh: container.querySelector('#dim2005_jung_B_left_rh')?.value || '',
        jung_B_right_lh: container.querySelector('#dim2005_jung_B_right_lh')?.value || '',
        jung_B_right_rh: container.querySelector('#dim2005_jung_B_right_rh')?.value || '',
        jung_C_lh: container.querySelector('#dim2005_jung_C_lh')?.value || '',
        jung_C_rh: container.querySelector('#dim2005_jung_C_rh')?.value || '',
        jung_D_lh: container.querySelector('#dim2005_jung_D_lh')?.value || '',
        jung_D_rh: container.querySelector('#dim2005_jung_D_rh')?.value || '',

        jong_A_lh: container.querySelector('#dim2005_jong_A_lh')?.value || '',
        jong_A_rh: container.querySelector('#dim2005_jong_A_rh')?.value || '',
        jong_B_left_lh: container.querySelector('#dim2005_jong_B_left_lh')?.value || '',
        jong_B_left_rh: container.querySelector('#dim2005_jong_B_left_rh')?.value || '',
        jong_B_right_lh: container.querySelector('#dim2005_jong_B_right_lh')?.value || '',
        jong_B_right_rh: container.querySelector('#dim2005_jong_B_right_rh')?.value || '',
        jong_C_lh: container.querySelector('#dim2005_jong_C_lh')?.value || '',
        jong_C_rh: container.querySelector('#dim2005_jong_C_rh')?.value || '',
        jong_D_lh: container.querySelector('#dim2005_jong_D_lh')?.value || '',
        jong_D_rh: container.querySelector('#dim2005_jong_D_rh')?.value || ''
      };

      const qtyTable = {
        plan_FL: container.querySelector('#qty_plan_FL')?.value || '',
        plan_FR: container.querySelector('#qty_plan_FR')?.value || '',
        plan_RL: container.querySelector('#qty_plan_RL')?.value || '',
        plan_RR: container.querySelector('#qty_plan_RR')?.value || '',
        act_FL: container.querySelector('#qty_act_FL')?.value || '',
        act_FR: container.querySelector('#qty_act_FR')?.value || '',
        act_RL: container.querySelector('#qty_act_RL')?.value || '',
        act_RR: container.querySelector('#qty_act_RR')?.value || '',

        ext_scorch_FL: container.querySelector('#def_ext_scorch_FL')?.value || '',
        ext_scorch_FR: container.querySelector('#def_ext_scorch_FR')?.value || '',
        ext_scorch_RL: container.querySelector('#def_ext_scorch_RL')?.value || '',
        ext_scorch_RR: container.querySelector('#def_ext_scorch_RR')?.value || '',
        ext_scratch_FL: container.querySelector('#def_ext_scratch_FL')?.value || '',
        ext_scratch_FR: container.querySelector('#def_ext_scratch_FR')?.value || '',
        ext_scratch_RL: container.querySelector('#def_ext_scratch_RL')?.value || '',
        ext_scratch_RR: container.querySelector('#def_ext_scratch_RR')?.value || '',
        ext_flock_FL: container.querySelector('#def_ext_flock_FL')?.value || '',
        ext_flock_FR: container.querySelector('#def_ext_flock_FR')?.value || '',
        ext_flock_RL: container.querySelector('#def_ext_flock_RL')?.value || '',
        ext_flock_RR: container.querySelector('#def_ext_flock_RR')?.value || '',
        ext_contam_FL: container.querySelector('#def_ext_contam_FL')?.value || '',
        ext_contam_FR: container.querySelector('#def_ext_contam_FR')?.value || '',
        ext_contam_RL: container.querySelector('#def_ext_contam_RL')?.value || '',
        ext_contam_RR: container.querySelector('#def_ext_contam_RR')?.value || '',

        proc_len_FL: container.querySelector('#def_proc_len_FL')?.value || '',
        proc_len_FR: container.querySelector('#def_proc_len_FR')?.value || '',
        proc_len_RL: container.querySelector('#def_proc_len_RL')?.value || '',
        proc_len_RR: container.querySelector('#def_proc_len_RR')?.value || '',
        proc_cut_FL: container.querySelector('#def_proc_cut_FL')?.value || '',
        proc_cut_FR: container.querySelector('#def_proc_cut_FR')?.value || '',
        proc_cut_RL: container.querySelector('#def_proc_cut_RL')?.value || '',
        proc_cut_RR: container.querySelector('#def_proc_cut_RR')?.value || '',
        proc_oth_FL: container.querySelector('#def_proc_oth_FL')?.value || '',
        proc_oth_FR: container.querySelector('#def_proc_oth_FR')?.value || '',
        proc_oth_RL: container.querySelector('#def_proc_oth_RL')?.value || '',
        proc_oth_RR: container.querySelector('#def_proc_oth_RR')?.value || ''
      };

      const vulcData = {
        temp_start_1_lh_상: container.querySelector('#vulc_temp_start_1_lh_상')?.value || '',
        temp_start_1_lh_하: container.querySelector('#vulc_temp_start_1_lh_하')?.value || '',
        temp_start_1_rh_상: container.querySelector('#vulc_temp_start_1_rh_상')?.value || '',
        temp_start_1_rh_하: container.querySelector('#vulc_temp_start_1_rh_하')?.value || '',
        temp_start_2_lh_상: container.querySelector('#vulc_temp_start_2_lh_상')?.value || '',
        temp_start_2_lh_하: container.querySelector('#vulc_temp_start_2_lh_하')?.value || '',
        temp_start_2_rh_상: container.querySelector('#vulc_temp_start_2_rh_상')?.value || '',
        temp_start_2_rh_하: container.querySelector('#vulc_temp_start_2_rh_하')?.value || '',

        temp_harf_1_lh_상: container.querySelector('#vulc_temp_harf_1_lh_상')?.value || '',
        temp_harf_1_lh_하: container.querySelector('#vulc_temp_harf_1_lh_하')?.value || '',
        temp_harf_1_rh_상: container.querySelector('#vulc_temp_harf_1_rh_상')?.value || '',
        temp_harf_1_rh_하: container.querySelector('#vulc_temp_harf_1_rh_하')?.value || '',
        temp_harf_2_lh_상: container.querySelector('#vulc_temp_harf_2_lh_상')?.value || '',
        temp_harf_2_lh_하: container.querySelector('#vulc_temp_harf_2_lh_하')?.value || '',
        temp_harf_2_rh_상: container.querySelector('#vulc_temp_harf_2_rh_상')?.value || '',
        temp_harf_2_rh_하: container.querySelector('#vulc_temp_harf_2_rh_하')?.value || '',

        temp_finish_1_lh_상: container.querySelector('#vulc_temp_finish_1_lh_상')?.value || '',
        temp_finish_1_lh_하: container.querySelector('#vulc_temp_finish_1_lh_하')?.value || '',
        temp_finish_1_rh_상: container.querySelector('#vulc_temp_finish_1_rh_상')?.value || '',
        temp_finish_1_rh_하: container.querySelector('#vulc_temp_finish_1_rh_하')?.value || '',
        temp_finish_2_lh_상: container.querySelector('#vulc_temp_finish_2_lh_상')?.value || '',
        temp_finish_2_lh_하: container.querySelector('#vulc_temp_finish_2_lh_하')?.value || '',
        temp_finish_2_rh_상: container.querySelector('#vulc_temp_finish_2_rh_상')?.value || '',
        temp_finish_2_rh_하: container.querySelector('#vulc_temp_finish_2_rh_하')?.value || '',

        temp_start_1_lh: container.querySelector('#vulc_temp_start_1_lh')?.value || '',
        temp_start_1_rh: container.querySelector('#vulc_temp_start_1_rh')?.value || '',
        temp_start_2_lh: container.querySelector('#vulc_temp_start_2_lh')?.value || '',
        temp_start_2_rh: container.querySelector('#vulc_temp_start_2_rh')?.value || '',
        temp_harf_1_lh: container.querySelector('#vulc_temp_harf_1_lh')?.value || '',
        temp_harf_1_rh: container.querySelector('#vulc_temp_harf_1_rh')?.value || '',
        temp_harf_2_lh: container.querySelector('#vulc_temp_harf_2_lh')?.value || '',
        temp_harf_2_rh: container.querySelector('#vulc_temp_harf_2_rh')?.value || '',
        temp_finish_1_lh: container.querySelector('#vulc_temp_finish_1_lh')?.value || '',
        temp_finish_1_rh: container.querySelector('#vulc_temp_finish_1_rh')?.value || '',
        temp_finish_2_lh: container.querySelector('#vulc_temp_finish_2_lh')?.value || '',
        temp_finish_2_rh: container.querySelector('#vulc_temp_finish_2_rh')?.value || '',

        time_start_1_lh: container.querySelector('#vulc_time_start_1_lh')?.value || '',
        time_start_1_rh: container.querySelector('#vulc_time_start_1_rh')?.value || '',
        time_start_2_lh: container.querySelector('#vulc_time_start_2_lh')?.value || '',
        time_start_2_rh: container.querySelector('#vulc_time_start_2_rh')?.value || '',
        time_harf_1_lh: container.querySelector('#vulc_time_harf_1_lh')?.value || '',
        time_harf_1_rh: container.querySelector('#vulc_time_harf_1_rh')?.value || '',
        time_harf_2_lh: container.querySelector('#vulc_time_harf_2_lh')?.value || '',
        time_harf_2_rh: container.querySelector('#vulc_time_harf_2_rh')?.value || '',
        time_finish_1_lh: container.querySelector('#vulc_time_finish_1_lh')?.value || '',
        time_finish_1_rh: container.querySelector('#vulc_time_finish_1_rh')?.value || '',
        time_finish_2_lh: container.querySelector('#vulc_time_finish_2_lh')?.value || '',
        time_finish_2_rh: container.querySelector('#vulc_time_finish_2_rh')?.value || '',

        temp_start_frt_p: container.querySelector('#vulc_temp_start_frt_p')?.value || '',
        temp_start_frt_p_상: container.querySelector('#vulc_temp_start_frt_p_상')?.value || '',
        temp_start_frt_p_하: container.querySelector('#vulc_temp_start_frt_p_하')?.value || '',
        temp_start_frt_q: container.querySelector('#vulc_temp_start_frt_q')?.value || '',
        temp_start_rr_r: container.querySelector('#vulc_temp_start_rr_r')?.value || '',
        temp_start_rr_s_lh: container.querySelector('#vulc_temp_start_rr_s_lh')?.value || '',
        temp_start_rr_s_rh: container.querySelector('#vulc_temp_start_rr_s_rh')?.value || '',

        temp_harf_frt_p: container.querySelector('#vulc_temp_harf_frt_p')?.value || '',
        temp_harf_frt_p_상: container.querySelector('#vulc_temp_harf_frt_p_상')?.value || '',
        temp_harf_frt_p_하: container.querySelector('#vulc_temp_harf_frt_p_하')?.value || '',
        temp_harf_frt_q: container.querySelector('#vulc_temp_harf_frt_q')?.value || '',
        temp_harf_rr_r: container.querySelector('#vulc_temp_harf_rr_r')?.value || '',
        temp_harf_rr_s_lh: container.querySelector('#vulc_temp_harf_rr_s_lh')?.value || '',
        temp_harf_rr_s_rh: container.querySelector('#vulc_temp_harf_rr_s_rh')?.value || '',

        temp_finish_frt_p: container.querySelector('#vulc_temp_finish_frt_p')?.value || '',
        temp_finish_frt_p_상: container.querySelector('#vulc_temp_finish_frt_p_상')?.value || '',
        temp_finish_frt_p_하: container.querySelector('#vulc_temp_finish_frt_p_하')?.value || '',
        temp_finish_frt_q: container.querySelector('#vulc_temp_finish_frt_q')?.value || '',
        temp_finish_rr_r: container.querySelector('#vulc_temp_finish_rr_r')?.value || '',
        temp_finish_rr_s_lh: container.querySelector('#vulc_temp_finish_rr_s_lh')?.value || '',
        temp_finish_rr_s_rh: container.querySelector('#vulc_temp_finish_rr_s_rh')?.value || '',

        time_start_frt_p: container.querySelector('#vulc_time_start_frt_p')?.value || '',
        time_start_frt_q: container.querySelector('#vulc_time_start_frt_q')?.value || '',
        time_start_rr_r: container.querySelector('#vulc_time_start_rr_r')?.value || '',
        time_start_rr_s_lh: container.querySelector('#vulc_time_start_rr_s_lh')?.value || '',
        time_start_rr_s_rh: container.querySelector('#vulc_time_start_rr_s_rh')?.value || '',

        time_harf_frt_p: container.querySelector('#vulc_time_harf_frt_p')?.value || '',
        time_harf_frt_q: container.querySelector('#vulc_time_harf_frt_q')?.value || '',
        time_harf_rr_r: container.querySelector('#vulc_time_harf_rr_r')?.value || '',
        time_harf_rr_s_lh: container.querySelector('#vulc_time_harf_rr_s_lh')?.value || '',
        time_harf_rr_s_rh: container.querySelector('#vulc_time_harf_rr_s_rh')?.value || '',

        time_finish_frt_p: container.querySelector('#vulc_time_finish_frt_p')?.value || '',
        time_finish_frt_q: container.querySelector('#vulc_time_finish_frt_q')?.value || '',
        time_finish_rr_r: container.querySelector('#vulc_time_finish_rr_r')?.value || '',
        time_finish_rr_s_lh: container.querySelector('#vulc_time_finish_rr_s_lh')?.value || '',
        time_finish_rr_s_rh: container.querySelector('#vulc_time_finish_rr_s_rh')?.value || '',

        // #2003 / #2025 DT/DS CREW 조인트 전용 가류 데이터
        lh_check: (formCode === 2013) ? true : (container.querySelector('#vulc_lh_check')?.checked || false),
        rh_check: (formCode === 2013) ? false : (container.querySelector('#vulc_rh_check')?.checked || false),
        mold_R: container.querySelector('#vulc_mold_R')?.value || '',
        mold_S: container.querySelector('#vulc_mold_S')?.value || '',
        mold_T: container.querySelector('#vulc_mold_T')?.value || '',
        mold_1: container.querySelector('#vulc_mold_1')?.value || '',
        mold_2: container.querySelector('#vulc_mold_2')?.value || '',
        mold_3: container.querySelector('#vulc_mold_3')?.value || '',
        mold_4: container.querySelector('#vulc_mold_4')?.value || '',
        temp_r_초_상: container.querySelector('#vulc_temp_r_초_상')?.value || '',
        temp_r_초_하: container.querySelector('#vulc_temp_r_초_하')?.value || '',
        temp_s_초_상: container.querySelector('#vulc_temp_s_초_상')?.value || '',
        temp_s_초_하: container.querySelector('#vulc_temp_s_초_하')?.value || '',
        temp_t_초_상: container.querySelector('#vulc_temp_t_초_상')?.value || '',
        temp_t_초_하: container.querySelector('#vulc_temp_t_초_하')?.value || '',
        temp_1_초_상: container.querySelector('#vulc_temp_1_초_상')?.value || '',
        temp_1_초_하: container.querySelector('#vulc_temp_1_초_하')?.value || '',
        temp_2_초_상: container.querySelector('#vulc_temp_2_초_상')?.value || '',
        temp_2_초_하: container.querySelector('#vulc_temp_2_초_하')?.value || '',
        temp_3_초_상: container.querySelector('#vulc_temp_3_초_상')?.value || '',
        temp_3_초_하: container.querySelector('#vulc_temp_3_초_하')?.value || '',
        temp_4_초_상: container.querySelector('#vulc_temp_4_초_상')?.value || '',
        temp_4_초_하: container.querySelector('#vulc_temp_4_초_하')?.value || '',
        temp_r_중_상: container.querySelector('#vulc_temp_r_중_상')?.value || '',
        temp_r_중_하: container.querySelector('#vulc_temp_r_중_하')?.value || '',
        temp_s_중_상: container.querySelector('#vulc_temp_s_중_상')?.value || '',
        temp_s_중_하: container.querySelector('#vulc_temp_s_중_하')?.value || '',
        temp_t_중_상: container.querySelector('#vulc_temp_t_중_상')?.value || '',
        temp_t_중_하: container.querySelector('#vulc_temp_t_중_하')?.value || '',
        temp_1_중_상: container.querySelector('#vulc_temp_1_중_상')?.value || '',
        temp_1_중_하: container.querySelector('#vulc_temp_1_중_하')?.value || '',
        temp_2_중_상: container.querySelector('#vulc_temp_2_중_상')?.value || '',
        temp_2_중_하: container.querySelector('#vulc_temp_2_중_하')?.value || '',
        temp_3_중_상: container.querySelector('#vulc_temp_3_중_상')?.value || '',
        temp_3_중_하: container.querySelector('#vulc_temp_3_중_하')?.value || '',
        temp_4_중_상: container.querySelector('#vulc_temp_4_중_상')?.value || '',
        temp_4_중_하: container.querySelector('#vulc_temp_4_중_하')?.value || '',
        temp_r_종_상: container.querySelector('#vulc_temp_r_종_상')?.value || '',
        temp_r_종_하: container.querySelector('#vulc_temp_r_종_하')?.value || '',
        temp_s_종_상: container.querySelector('#vulc_temp_s_종_상')?.value || '',
        temp_s_종_하: container.querySelector('#vulc_temp_s_종_하')?.value || '',
        temp_t_종_상: container.querySelector('#vulc_temp_t_종_상')?.value || '',
        temp_t_종_하: container.querySelector('#vulc_temp_t_종_하')?.value || '',
        temp_1_종_상: container.querySelector('#vulc_temp_1_종_상')?.value || '',
        temp_1_종_하: container.querySelector('#vulc_temp_1_종_하')?.value || '',
        temp_2_종_상: container.querySelector('#vulc_temp_2_종_상')?.value || '',
        temp_2_종_하: container.querySelector('#vulc_temp_2_종_하')?.value || '',
        temp_3_종_상: container.querySelector('#vulc_temp_3_종_상')?.value || '',
        temp_3_종_하: container.querySelector('#vulc_temp_3_종_하')?.value || '',
        temp_4_종_상: container.querySelector('#vulc_temp_4_종_상')?.value || '',
        temp_4_종_하: container.querySelector('#vulc_temp_4_종_하')?.value || '',
        time_r_초: container.querySelector('#vulc_time_r_초')?.value || '',
        time_s_초: container.querySelector('#vulc_time_s_초')?.value || '',
        time_t_초: container.querySelector('#vulc_time_t_초')?.value || '',
        time_1_초: container.querySelector('#vulc_time_1_초')?.value || '',
        time_2_초: container.querySelector('#vulc_time_2_초')?.value || '',
        time_3_초: container.querySelector('#vulc_time_3_초')?.value || '',
        time_4_초: container.querySelector('#vulc_time_4_초')?.value || '',
        time_r_중: container.querySelector('#vulc_time_r_중')?.value || '',
        time_s_중: container.querySelector('#vulc_time_s_중')?.value || '',
        time_t_중: container.querySelector('#vulc_time_t_중')?.value || '',
        time_1_중: container.querySelector('#vulc_time_1_중')?.value || '',
        time_2_중: container.querySelector('#vulc_time_2_중')?.value || '',
        time_3_중: container.querySelector('#vulc_time_3_중')?.value || '',
        time_4_중: container.querySelector('#vulc_time_4_중')?.value || '',
        time_r_종: container.querySelector('#vulc_time_r_종')?.value || '',
        time_s_종: container.querySelector('#vulc_time_s_종')?.value || '',
        time_t_종: container.querySelector('#vulc_time_t_종')?.value || '',
        time_1_종: container.querySelector('#vulc_time_1_종')?.value || '',
        time_2_종: container.querySelector('#vulc_time_2_종')?.value || '',
        time_3_종: container.querySelector('#vulc_time_3_종')?.value || '',
        time_4_종: container.querySelector('#vulc_time_4_종')?.value || ''
      };

      const vulcData2 = {
        lh_check: (formCode === 2013) ? false : (container.querySelector('#vulc2_lh_check')?.checked || false),
        rh_check: (formCode === 2013) ? true : (container.querySelector('#vulc2_rh_check')?.checked || false),
        mold_R: container.querySelector('#vulc2_mold_R')?.value || '',
        mold_S: container.querySelector('#vulc2_mold_S')?.value || '',
        mold_T: container.querySelector('#vulc2_mold_T')?.value || '',
        mold_1: container.querySelector('#vulc2_mold_1')?.value || '',
        mold_2: container.querySelector('#vulc2_mold_2')?.value || '',
        mold_3: container.querySelector('#vulc2_mold_3')?.value || '',
        mold_4: container.querySelector('#vulc2_mold_4')?.value || '',
        temp_r_초_상: container.querySelector('#vulc2_temp_r_초_상')?.value || '',
        temp_r_초_하: container.querySelector('#vulc2_temp_r_초_하')?.value || '',
        temp_s_초_상: container.querySelector('#vulc2_temp_s_초_상')?.value || '',
        temp_s_초_하: container.querySelector('#vulc2_temp_s_초_하')?.value || '',
        temp_t_초_상: container.querySelector('#vulc2_temp_t_초_상')?.value || '',
        temp_t_초_하: container.querySelector('#vulc2_temp_t_초_하')?.value || '',
        temp_1_초_상: container.querySelector('#vulc2_temp_1_초_상')?.value || '',
        temp_1_초_하: container.querySelector('#vulc2_temp_1_초_하')?.value || '',
        temp_2_초_상: container.querySelector('#vulc2_temp_2_초_상')?.value || '',
        temp_2_초_하: container.querySelector('#vulc2_temp_2_초_하')?.value || '',
        temp_3_초_상: container.querySelector('#vulc2_temp_3_초_상')?.value || '',
        temp_3_초_하: container.querySelector('#vulc2_temp_3_초_하')?.value || '',
        temp_4_초_상: container.querySelector('#vulc2_temp_4_초_상')?.value || '',
        temp_4_초_하: container.querySelector('#vulc2_temp_4_초_하')?.value || '',
        temp_r_중_상: container.querySelector('#vulc2_temp_r_중_상')?.value || '',
        temp_r_중_하: container.querySelector('#vulc2_temp_r_중_하')?.value || '',
        temp_s_중_상: container.querySelector('#vulc2_temp_s_중_상')?.value || '',
        temp_s_중_하: container.querySelector('#vulc2_temp_s_중_하')?.value || '',
        temp_t_중_상: container.querySelector('#vulc2_temp_t_중_상')?.value || '',
        temp_t_중_하: container.querySelector('#vulc2_temp_t_중_하')?.value || '',
        temp_1_중_상: container.querySelector('#vulc2_temp_1_중_상')?.value || '',
        temp_1_중_하: container.querySelector('#vulc2_temp_1_중_하')?.value || '',
        temp_2_중_상: container.querySelector('#vulc2_temp_2_중_상')?.value || '',
        temp_2_중_하: container.querySelector('#vulc2_temp_2_중_하')?.value || '',
        temp_3_중_상: container.querySelector('#vulc2_temp_3_중_상')?.value || '',
        temp_3_중_하: container.querySelector('#vulc2_temp_3_중_하')?.value || '',
        temp_4_중_상: container.querySelector('#vulc2_temp_4_중_상')?.value || '',
        temp_4_중_하: container.querySelector('#vulc2_temp_4_중_하')?.value || '',
        temp_r_종_상: container.querySelector('#vulc2_temp_r_종_상')?.value || '',
        temp_r_종_하: container.querySelector('#vulc2_temp_r_종_하')?.value || '',
        temp_s_종_상: container.querySelector('#vulc2_temp_s_종_상')?.value || '',
        temp_s_종_하: container.querySelector('#vulc2_temp_s_종_하')?.value || '',
        temp_t_종_상: container.querySelector('#vulc2_temp_t_종_상')?.value || '',
        temp_t_종_하: container.querySelector('#vulc2_temp_t_종_하')?.value || '',
        temp_1_종_상: container.querySelector('#vulc2_temp_1_종_상')?.value || '',
        temp_1_종_하: container.querySelector('#vulc2_temp_1_종_하')?.value || '',
        temp_2_종_상: container.querySelector('#vulc2_temp_2_종_상')?.value || '',
        temp_2_종_하: container.querySelector('#vulc2_temp_2_종_하')?.value || '',
        temp_3_종_상: container.querySelector('#vulc2_temp_3_종_상')?.value || '',
        temp_3_종_하: container.querySelector('#vulc2_temp_3_종_하')?.value || '',
        temp_4_종_상: container.querySelector('#vulc2_temp_4_종_상')?.value || '',
        temp_4_종_하: container.querySelector('#vulc2_temp_4_종_하')?.value || '',
        time_r_초: container.querySelector('#vulc2_time_r_초')?.value || '',
        time_s_초: container.querySelector('#vulc2_time_s_초')?.value || '',
        time_t_초: container.querySelector('#vulc2_time_t_초')?.value || '',
        time_1_초: container.querySelector('#vulc2_time_1_초')?.value || '',
        time_2_초: container.querySelector('#vulc2_time_2_초')?.value || '',
        time_3_초: container.querySelector('#vulc2_time_3_초')?.value || '',
        time_4_초: container.querySelector('#vulc2_time_4_초')?.value || '',
        time_r_중: container.querySelector('#vulc2_time_r_중')?.value || '',
        time_s_중: container.querySelector('#vulc2_time_s_중')?.value || '',
        time_t_중: container.querySelector('#vulc2_time_t_중')?.value || '',
        time_1_중: container.querySelector('#vulc2_time_1_중')?.value || '',
        time_2_중: container.querySelector('#vulc2_time_2_중')?.value || '',
        time_3_중: container.querySelector('#vulc2_time_3_중')?.value || '',
        time_4_중: container.querySelector('#vulc2_time_4_중')?.value || '',
        time_r_종: container.querySelector('#vulc2_time_r_종')?.value || '',
        time_s_종: container.querySelector('#vulc2_time_s_종')?.value || '',
        time_t_종: container.querySelector('#vulc2_time_t_종')?.value || '',
        time_1_종: container.querySelector('#vulc2_time_1_종')?.value || '',
        time_2_종: container.querySelector('#vulc2_time_2_종')?.value || '',
        time_3_종: container.querySelector('#vulc2_time_3_종')?.value || '',
        time_4_종: container.querySelector('#vulc2_time_4_종')?.value || ''
      };

      const jointQtyTable = {
        plan_frt_p: container.querySelector('#jqty_plan_frt_p')?.value || '',
        plan_frt_q: container.querySelector('#jqty_plan_frt_q')?.value || '',
        plan_rr_r: container.querySelector('#jqty_plan_rr_r')?.value || '',
        plan_rr_s_lh: container.querySelector('#jqty_plan_rr_s_lh')?.value || '',
        plan_rr_s_rh: container.querySelector('#jqty_plan_rr_s_rh')?.value || '',

        act_frt_p: container.querySelector('#jqty_act_frt_p')?.value || '',
        act_frt_q: container.querySelector('#jqty_act_frt_q')?.value || '',
        act_rr_r: container.querySelector('#jqty_act_rr_r')?.value || '',
        act_rr_s_lh: container.querySelector('#jqty_act_rr_s_lh')?.value || '',
        act_rr_s_rh: container.querySelector('#jqty_act_rr_s_rh')?.value || '',

        split_frt_p: container.querySelector('#jdef_split_frt_p')?.value || '',
        split_frt_q: container.querySelector('#jdef_split_frt_q')?.value || '',
        split_rr_r: container.querySelector('#jdef_split_rr_r')?.value || '',
        split_rr_s_lh: container.querySelector('#jdef_split_rr_s_lh')?.value || '',
        split_rr_s_rh: container.querySelector('#jdef_split_rr_s_rh')?.value || '',

        push_frt_p: container.querySelector('#jdef_push_frt_p')?.value || '',
        push_frt_q: container.querySelector('#jdef_push_frt_q')?.value || '',
        push_rr_r: container.querySelector('#jdef_push_rr_r')?.value || '',
        push_rr_s_lh: container.querySelector('#jdef_push_rr_s_lh')?.value || '',
        push_rr_s_rh: container.querySelector('#jdef_push_rr_s_rh')?.value || '',

        lack_frt_p: container.querySelector('#jdef_lack_frt_p')?.value || '',
        lack_frt_q: container.querySelector('#jdef_lack_frt_q')?.value || '',
        lack_rr_r: container.querySelector('#jdef_lack_rr_r')?.value || '',
        lack_rr_s_lh: container.querySelector('#jdef_lack_rr_s_lh')?.value || '',
        lack_rr_s_rh: container.querySelector('#jdef_lack_rr_s_rh')?.value || '',

        over_frt_p: container.querySelector('#jdef_over_frt_p')?.value || '',
        over_frt_q: container.querySelector('#jdef_over_frt_q')?.value || '',
        over_rr_r: container.querySelector('#jdef_over_rr_r')?.value || '',
        over_rr_s_lh: container.querySelector('#jdef_over_rr_s_lh')?.value || '',
        over_rr_s_rh: container.querySelector('#jdef_over_rr_s_rh')?.value || '',

        bubble_frt_p: container.querySelector('#jdef_bubble_frt_p')?.value || '',
        bubble_frt_q: container.querySelector('#jdef_bubble_frt_q')?.value || '',
        bubble_rr_r: container.querySelector('#jdef_bubble_rr_r')?.value || '',
        bubble_rr_s_lh: container.querySelector('#jdef_bubble_rr_s_lh')?.value || '',
        bubble_rr_s_rh: container.querySelector('#jdef_bubble_rr_s_rh')?.value || '',

        scrap_frt_p: container.querySelector('#jdef_scrap_frt_p')?.value || '',
        scrap_frt_q: container.querySelector('#jdef_scrap_frt_q')?.value || '',
        scrap_rr_r: container.querySelector('#jdef_scrap_rr_r')?.value || '',
        scrap_rr_s_lh: container.querySelector('#jdef_scrap_rr_s_lh')?.value || '',
        scrap_rr_s_rh: container.querySelector('#jdef_scrap_rr_s_rh')?.value || '',

        insert_frt_p: container.querySelector('#jdef_insert_frt_p')?.value || '',
        insert_frt_q: container.querySelector('#jdef_insert_frt_q')?.value || '',
        insert_rr_r: container.querySelector('#jdef_insert_rr_r')?.value || '',
        insert_rr_s_lh: container.querySelector('#jdef_insert_rr_s_lh')?.value || '',
        insert_rr_s_rh: container.querySelector('#jdef_insert_rr_s_rh')?.value || '',

        oth_frt_p: container.querySelector('#jdef_oth_frt_p')?.value || '',
        oth_frt_q: container.querySelector('#jdef_oth_frt_q')?.value || '',
        oth_rr_r: container.querySelector('#jdef_oth_rr_r')?.value || '',
        oth_rr_s_lh: container.querySelector('#jdef_oth_rr_s_lh')?.value || '',
        oth_rr_s_rh: container.querySelector('#jdef_oth_rr_s_rh')?.value || ''
      };

      const postQtyTable = {
        plan_fl: container.querySelector('#pqty_plan_fl')?.value || '',
        plan_fr: container.querySelector('#pqty_plan_fr')?.value || '',
        plan_rl: container.querySelector('#pqty_plan_rl')?.value || '',
        plan_rr: container.querySelector('#pqty_plan_rr')?.value || '',

        act_fl: container.querySelector('#pqty_act_fl')?.value || '',
        act_fr: container.querySelector('#pqty_act_fr')?.value || '',
        act_rl: container.querySelector('#pqty_act_rl')?.value || '',
        act_rr: container.querySelector('#pqty_act_rr')?.value || '',

        j_drop_fl: container.querySelector('#pdef_j_drop_fl')?.value || '',
        j_drop_fr: container.querySelector('#pdef_j_drop_fr')?.value || '',
        j_drop_rl: container.querySelector('#pdef_j_drop_rl')?.value || '',
        j_drop_rr: container.querySelector('#pdef_j_drop_rr')?.value || '',

        j_lack_fl: container.querySelector('#pdef_j_lack_fl')?.value || '',
        j_lack_fr: container.querySelector('#pdef_j_lack_fr')?.value || '',
        j_lack_rl: container.querySelector('#pdef_j_lack_rl')?.value || '',
        j_lack_rr: container.querySelector('#pdef_j_lack_rr')?.value || '',

        j_step_fl: container.querySelector('#pdef_j_step_fl')?.value || '',
        j_step_fr: container.querySelector('#pdef_j_step_fr')?.value || '',
        j_step_rl: container.querySelector('#pdef_j_step_rl')?.value || '',
        j_step_rr: container.querySelector('#pdef_j_step_rr')?.value || '',

        j_bubble_fl: container.querySelector('#pdef_j_bubble_fl')?.value || '',
        j_bubble_fr: container.querySelector('#pdef_j_bubble_fr')?.value || '',
        j_bubble_rl: container.querySelector('#pdef_j_bubble_rl')?.value || '',
        j_bubble_rr: container.querySelector('#pdef_j_bubble_rr')?.value || '',

        j_chew_fl: container.querySelector('#pdef_j_chew_fl')?.value || '',
        j_chew_fr: container.querySelector('#pdef_j_chew_fr')?.value || '',
        j_chew_rl: container.querySelector('#pdef_j_chew_rl')?.value || '',
        j_chew_rr: container.querySelector('#pdef_j_chew_rr')?.value || '',

        j_scrap_fl: container.querySelector('#pdef_j_scrap_fl')?.value || '',
        j_scrap_fr: container.querySelector('#pdef_j_scrap_fr')?.value || '',
        j_scrap_rl: container.querySelector('#pdef_j_scrap_rl')?.value || '',
        j_scrap_rr: container.querySelector('#pdef_j_scrap_rr')?.value || '',

        j_oth_fl: container.querySelector('#pdef_j_oth_fl')?.value || '',
        j_oth_fr: container.querySelector('#pdef_j_oth_fr')?.value || '',
        j_oth_rl: container.querySelector('#pdef_j_oth_rl')?.value || '',
        j_oth_rr: container.querySelector('#pdef_j_oth_rr')?.value || '',

        p_trim_fl: container.querySelector('#pdef_p_trim_fl')?.value || '',
        p_trim_fr: container.querySelector('#pdef_p_trim_fr')?.value || '',
        p_trim_rl: container.querySelector('#pdef_p_trim_rl')?.value || '',
        p_trim_rr: container.querySelector('#pdef_p_trim_rr')?.value || '',

        p_poll_fl: container.querySelector('#pdef_p_poll_fl')?.value || '',
        p_poll_fr: container.querySelector('#pdef_p_poll_fr')?.value || '',
        p_poll_rl: container.querySelector('#pdef_p_poll_rl')?.value || '',
        p_poll_rr: container.querySelector('#pdef_p_poll_rr')?.value || '',

        p_oth_fl: container.querySelector('#pdef_p_oth_fl')?.value || '',
        p_oth_fr: container.querySelector('#pdef_p_oth_fr')?.value || '',
        p_oth_rl: container.querySelector('#pdef_p_oth_rl')?.value || '',
        p_oth_rr: container.querySelector('#pdef_p_oth_rr')?.value || ''
      };

      const inspQtyTable = {};
      [1, 2, 3, 4].forEach(c => {
        inspQtyTable[`lh_${c}`] = container.querySelector(`#insp_lh_${c}`)?.checked || false;
        inspQtyTable[`rh_${c}`] = container.querySelector(`#insp_rh_${c}`)?.checked || false;
        inspQtyTable[`worker_${c}`] = container.querySelector(`#insp_worker_${c}`)?.value || '';
        inspQtyTable[`inspect_qty_${c}`] = container.querySelector(`#insp_inspect_qty_${c}`)?.value || '';
        inspQtyTable[`good_qty_${c}`] = container.querySelector(`#insp_good_qty_${c}`)?.value || '';
        inspQtyTable[`total_defect_${c}`] = container.querySelector(`#insp_total_defect_${c}`)?.value || '';

        ['scorch', 'scratch', 'contam', 'len', 'clip', 'oth', 'subtotal'].forEach(k => {
          inspQtyTable[`ext_${k}_${c}`] = container.querySelector(`#insp_ext_${k}_${c}`)?.value || '';
        });
        ['drop', 'lack', 'push', 'bubble', 'chew', 'overflow', 'deform', 'foreign', 'twist', 'oth', 'subtotal'].forEach(k => {
          inspQtyTable[`j_${k}_${c}`] = container.querySelector(`#insp_j_${k}_${c}`)?.value || '';
        });
        ['trim_over', 'trim_under', 'bond_contam', 'ext_contam', 'clip_miss', 'clip_hole', 'drain_hole', 'wrong_clip', 'cut_miss', 'bond_miss', 'len_excess', 'clip_pitch', 'oth', 'subtotal'].forEach(k => {
          inspQtyTable[`p_${k}_${c}`] = container.querySelector(`#insp_p_${k}_${c}`)?.value || '';
        });
      });

      const reportData = {
        date: container.querySelector('#reportDate')?.value || new Date().toISOString().split('T')[0],
        workHours: workHours,
        shift: '주간',
        carModel: curCarModelValue?.value || 'JG1',
        processName: curProcessValue?.value || '검사포장',
        line: '1라인',
        workerName: currentWorkerName,
        workerId: 'EMP001',
        itemCode: itemCodeVal,
        itemName: itemNameVal,
        targetQty: Number(container.querySelector('#targetQty')?.value) || 0,
        actualQty: Number(container.querySelector('#actualQty')?.value) || 0,
        defectQty: Number(container.querySelector('#defectQty')?.value) || 0,
        materialLots: materialLots,
        jointRubberLotNo: container.querySelector('#jointRubberLotNo')?.value || '',
        dimData: dimData,
        dim2005Data: dim2005Data,
        vulcData: vulcData,
        vulcData2: vulcData2,
        qtyTable: qtyTable,
        jointQtyTable: jointQtyTable,
        postQtyTable: postQtyTable,
        inspQtyTable: inspQtyTable,
        downtimeMinutes: totalDowntimeMinutes,
        downtimeReason: combinedDowntimeReason,
        downtimeMinutes1: dt1Min,
        downtimeEquip1: dt1Equip,
        downtimeReason1: dt1Reason,
        downtimeMinutes2: dt2Min,
        downtimeEquip2: dt2Equip,
        downtimeReason2: dt2Reason,
        downtimeMinutes3: dt3Min,
        downtimeEquip3: dt3Equip,
        downtimeReason3: dt3Reason,
        notes: curNotesInput?.value || '',
        isLeaderForm: false,
        status: targetStatus,
        ...(isCurDtCrewClip && { dtCrewQty: {
          len_LH_초: container.querySelector('#dtc_len_LH_초')?.value||'',
          len_LH_중: container.querySelector('#dtc_len_LH_중')?.value||'',
          len_LH_종: container.querySelector('#dtc_len_LH_종')?.value||'',
          len_RH_초: container.querySelector('#dtc_len_RH_초')?.value||'',
          len_RH_중: container.querySelector('#dtc_len_RH_중')?.value||'',
          len_RH_종: container.querySelector('#dtc_len_RH_종')?.value||'',
          clip_LH1_초: container.querySelector('#dtc_clip_LH1_초')?.value||'',
          clip_LH2_초: container.querySelector('#dtc_clip_LH2_초')?.value||'',
          clip_RH1_초: container.querySelector('#dtc_clip_RH1_초')?.value||'',
          clip_RH2_초: container.querySelector('#dtc_clip_RH2_초')?.value||'',
          clip_LH1_중: container.querySelector('#dtc_clip_LH1_중')?.value||'',
          clip_LH2_중: container.querySelector('#dtc_clip_LH2_중')?.value||'',
          clip_RH1_중: container.querySelector('#dtc_clip_RH1_중')?.value||'',
          clip_RH2_중: container.querySelector('#dtc_clip_RH2_중')?.value||'',
          clip_LH1_종: container.querySelector('#dtc_clip_LH1_종')?.value||'',
          clip_LH2_종: container.querySelector('#dtc_clip_LH2_종')?.value||'',
          clip_RH1_종: container.querySelector('#dtc_clip_RH1_종')?.value||'',
          clip_RH2_종: container.querySelector('#dtc_clip_RH2_종')?.value||'',
          정품수량_LH: container.querySelector('#dtc_정품수량_LH')?.value||'',
          정품수량_RH: container.querySelector('#dtc_정품수량_RH')?.value||'',
          불량합계_LH: container.querySelector('#dtc_불량합계_LH')?.value||'',
          불량합계_RH: container.querySelector('#dtc_불량합계_RH')?.value||'',
          길이미달_LH: container.querySelector('#dtc_길이미달_LH')?.value||'',
          길이미달_RH: container.querySelector('#dtc_길이미달_RH')?.value||'',
          길이초과_LH: container.querySelector('#dtc_길이초과_LH')?.value||'',
          길이초과_RH: container.querySelector('#dtc_길이초과_RH')?.value||'',
          끝단부불량_LH: container.querySelector('#dtc_끝단부불량_LH')?.value||'',
          끝단부불량_RH: container.querySelector('#dtc_끝단부불량_RH')?.value||'',
          클립홀찢어짐_LH: container.querySelector('#dtc_클립홀찢어짐_LH')?.value||'',
          클립홀찢어짐_RH: container.querySelector('#dtc_클립홀찢어짐_RH')?.value||'',
          클립간격불량_LH: container.querySelector('#dtc_클립간격불량_LH')?.value||'',
          클립간격불량_RH: container.querySelector('#dtc_클립간격불량_RH')?.value||'',
          드레인홀불량_LH: container.querySelector('#dtc_드레인홀불량_LH')?.value||'',
          드레인홀불량_RH: container.querySelector('#dtc_드레인홀불량_RH')?.value||'',
          스코치_LH: container.querySelector('#dtc_스코치_LH')?.value||'',
          스코치_RH: container.querySelector('#dtc_스코치_RH')?.value||'',
          기타_LH: container.querySelector('#dtc_기타_LH')?.value||'',
          기타_RH: container.querySelector('#dtc_기타_RH')?.value||'',
        },
        dtCrewQtyB: {
          len_LH3_초: container.querySelector('#dtcb_len_LH3_초')?.value||'',
          len_LH4_초: container.querySelector('#dtcb_len_LH4_초')?.value||'',
          len_RH2_초: container.querySelector('#dtcb_len_RH2_초')?.value||'',
          len_RH4_초: container.querySelector('#dtcb_len_RH4_초')?.value||'',
          len_LH3_중: container.querySelector('#dtcb_len_LH3_중')?.value||'',
          len_LH4_중: container.querySelector('#dtcb_len_LH4_중')?.value||'',
          len_RH2_중: container.querySelector('#dtcb_len_RH2_중')?.value||'',
          len_RH4_중: container.querySelector('#dtcb_len_RH4_중')?.value||'',
          len_LH3_종: container.querySelector('#dtcb_len_LH3_종')?.value||'',
          len_LH4_종: container.querySelector('#dtcb_len_LH4_종')?.value||'',
          len_RH2_종: container.querySelector('#dtcb_len_RH2_종')?.value||'',
          len_RH4_종: container.querySelector('#dtcb_len_RH4_종')?.value||'',
          clip_LH3_초좌: container.querySelector('#dtcb_clip_LH3_초좌')?.value||'',
          clip_LH4_초좌: container.querySelector('#dtcb_clip_LH4_초좌')?.value||'',
          clip_RH2_초좌: container.querySelector('#dtcb_clip_RH2_초좌')?.value||'',
          clip_RH4_초좌: container.querySelector('#dtcb_clip_RH4_초좌')?.value||'',
          clip_LH3_초우: container.querySelector('#dtcb_clip_LH3_초우')?.value||'',
          clip_LH4_초우: container.querySelector('#dtcb_clip_LH4_초우')?.value||'',
          clip_RH2_초우: container.querySelector('#dtcb_clip_RH2_초우')?.value||'',
          clip_RH4_초우: container.querySelector('#dtcb_clip_RH4_초우')?.value||'',
          clip_LH3_중좌: container.querySelector('#dtcb_clip_LH3_중좌')?.value||'',
          clip_LH4_중좌: container.querySelector('#dtcb_clip_LH4_중좌')?.value||'',
          clip_RH2_중좌: container.querySelector('#dtcb_clip_RH2_중좌')?.value||'',
          clip_RH4_중좌: container.querySelector('#dtcb_clip_RH4_중좌')?.value||'',
          clip_LH3_중우: container.querySelector('#dtcb_clip_LH3_중우')?.value||'',
          clip_LH4_중우: container.querySelector('#dtcb_clip_LH4_중우')?.value||'',
          clip_RH2_중우: container.querySelector('#dtcb_clip_RH2_중우')?.value||'',
          clip_RH4_중우: container.querySelector('#dtcb_clip_RH4_중우')?.value||'',
          clip_LH3_종좌: container.querySelector('#dtcb_clip_LH3_종좌')?.value||'',
          clip_LH4_종좌: container.querySelector('#dtcb_clip_LH4_종좌')?.value||'',
          clip_RH2_종좌: container.querySelector('#dtcb_clip_RH2_종좌')?.value||'',
          clip_RH4_종좌: container.querySelector('#dtcb_clip_RH4_종좌')?.value||'',
          clip_LH3_종우: container.querySelector('#dtcb_clip_LH3_종우')?.value||'',
          clip_LH4_종우: container.querySelector('#dtcb_clip_LH4_종우')?.value||'',
          clip_RH2_종우: container.querySelector('#dtcb_clip_RH2_종우')?.value||'',
          clip_RH4_종우: container.querySelector('#dtcb_clip_RH4_종우')?.value||'',
          // 6-2 생산실적 Table B (LH 3호, LH 4호, RH 2호, RH 4호)
          정품수량_LH3: container.querySelector('#dtcb_정품수량_LH3')?.value||'',
          정품수량_LH4: container.querySelector('#dtcb_정품수량_LH4')?.value||'',
          정품수량_RH2: container.querySelector('#dtcb_정품수량_RH2')?.value||'',
          정품수량_RH4: container.querySelector('#dtcb_정품수량_RH4')?.value||'',
          불량합계_LH3: container.querySelector('#dtcb_불량합계_LH3')?.value||'',
          불량합계_LH4: container.querySelector('#dtcb_불량합계_LH4')?.value||'',
          불량합계_RH2: container.querySelector('#dtcb_불량합계_RH2')?.value||'',
          불량합계_RH4: container.querySelector('#dtcb_불량합계_RH4')?.value||'',
          길이미달_LH3: container.querySelector('#dtcb_길이미달_LH3')?.value||'',
          길이미달_LH4: container.querySelector('#dtcb_길이미달_LH4')?.value||'',
          길이미달_RH2: container.querySelector('#dtcb_길이미달_RH2')?.value||'',
          길이미달_RH4: container.querySelector('#dtcb_길이미달_RH4')?.value||'',
          길이초과_LH3: container.querySelector('#dtcb_길이초과_LH3')?.value||'',
          길이초과_LH4: container.querySelector('#dtcb_길이초과_LH4')?.value||'',
          길이초과_RH2: container.querySelector('#dtcb_길이초과_RH2')?.value||'',
          길이초과_RH4: container.querySelector('#dtcb_길이초과_RH4')?.value||'',
          끝단부불량_LH3: container.querySelector('#dtcb_끝단부불량_LH3')?.value||'',
          끝단부불량_LH4: container.querySelector('#dtcb_끝단부불량_LH4')?.value||'',
          끝단부불량_RH2: container.querySelector('#dtcb_끝단부불량_RH2')?.value||'',
          끝단부불량_RH4: container.querySelector('#dtcb_끝단부불량_RH4')?.value||'',
          클립홀찢어짐_LH3: container.querySelector('#dtcb_클립홀찢어짐_LH3')?.value||'',
          클립홀찢어짐_LH4: container.querySelector('#dtcb_클립홀찢어짐_LH4')?.value||'',
          클립홀찢어짐_RH2: container.querySelector('#dtcb_클립홀찢어짐_RH2')?.value||'',
          클립홀찢어짐_RH4: container.querySelector('#dtcb_클립홀찢어짐_RH4')?.value||'',
          클립간격불량_LH3: container.querySelector('#dtcb_클립간격불량_LH3')?.value||'',
          클립간격불량_LH4: container.querySelector('#dtcb_클립간격불량_LH4')?.value||'',
          클립간격불량_RH2: container.querySelector('#dtcb_클립간격불량_RH2')?.value||'',
          클립간격불량_RH4: container.querySelector('#dtcb_클립간격불량_RH4')?.value||'',
          드레인홀불량_LH3: container.querySelector('#dtcb_드레인홀불량_LH3')?.value||'',
          드레인홀불량_LH4: container.querySelector('#dtcb_드레인홀불량_LH4')?.value||'',
          드레인홀불량_RH2: container.querySelector('#dtcb_드레인홀불량_RH2')?.value||'',
          드레인홀불량_RH4: container.querySelector('#dtcb_드레인홀불량_RH4')?.value||'',
          스코치_LH3: container.querySelector('#dtcb_스코치_LH3')?.value||'',
          스코치_LH4: container.querySelector('#dtcb_스코치_LH4')?.value||'',
          스코치_RH2: container.querySelector('#dtcb_스코치_RH2')?.value||'',
          스코치_RH4: container.querySelector('#dtcb_스코치_RH4')?.value||'',
          기타_LH3: container.querySelector('#dtcb_기타_LH3')?.value||'',
          기타_LH4: container.querySelector('#dtcb_기타_LH4')?.value||'',
          기타_RH2: container.querySelector('#dtcb_기타_RH2')?.value||'',
          기타_RH4: container.querySelector('#dtcb_기타_RH4')?.value||'',
        }}),
        ...((formCode === 2041 || formCode === 2044) && { kmkxClipQty: {
          cut_len_LH_초: container.querySelector('#kmkx_cut_len_LH_초')?.value || '',
          cut_len_MID_초: container.querySelector('#kmkx_cut_len_MID_초')?.value || '',
          cut_len_RH_초: container.querySelector('#kmkx_cut_len_RH_초')?.value || '',
          cut_len_LH_중: container.querySelector('#kmkx_cut_len_LH_중')?.value || '',
          cut_len_MID_중: container.querySelector('#kmkx_cut_len_MID_중')?.value || '',
          cut_len_RH_중: container.querySelector('#kmkx_cut_len_RH_중')?.value || '',
          cut_len_LH_종: container.querySelector('#kmkx_cut_len_LH_종')?.value || '',
          cut_len_MID_종: container.querySelector('#kmkx_cut_len_MID_종')?.value || '',
          cut_len_RH_종: container.querySelector('#kmkx_cut_len_RH_종')?.value || '',
          hole_gap_LH_초_좌: container.querySelector('#kmkx_hole_gap_LH_초_좌')?.value || '',
          hole_gap_MID_초_좌: container.querySelector('#kmkx_hole_gap_MID_초_좌')?.value || '',
          hole_gap_RH_초_좌: container.querySelector('#kmkx_hole_gap_RH_초_좌')?.value || '',
          hole_gap_LH_초_우: container.querySelector('#kmkx_hole_gap_LH_초_우')?.value || '',
          hole_gap_MID_초_우: container.querySelector('#kmkx_hole_gap_MID_초_우')?.value || '',
          hole_gap_RH_초_우: container.querySelector('#kmkx_hole_gap_RH_초_우')?.value || '',
          hole_gap_LH_중_좌: container.querySelector('#kmkx_hole_gap_LH_중_좌')?.value || '',
          hole_gap_MID_중_좌: container.querySelector('#kmkx_hole_gap_MID_중_좌')?.value || '',
          hole_gap_RH_중_좌: container.querySelector('#kmkx_hole_gap_RH_중_좌')?.value || '',
          hole_gap_LH_중_우: container.querySelector('#kmkx_hole_gap_LH_중_우')?.value || '',
          hole_gap_MID_중_우: container.querySelector('#kmkx_hole_gap_MID_중_우')?.value || '',
          hole_gap_RH_중_우: container.querySelector('#kmkx_hole_gap_RH_중_우')?.value || '',
          hole_gap_LH_종_좌: container.querySelector('#kmkx_hole_gap_LH_종_좌')?.value || '',
          hole_gap_MID_종_좌: container.querySelector('#kmkx_hole_gap_MID_종_좌')?.value || '',
          hole_gap_RH_종_좌: container.querySelector('#kmkx_hole_gap_RH_종_좌')?.value || '',
          hole_gap_LH_종_우: container.querySelector('#kmkx_hole_gap_LH_종_우')?.value || '',
          hole_gap_MID_종_우: container.querySelector('#kmkx_hole_gap_MID_종_우')?.value || '',
          hole_gap_RH_종_우: container.querySelector('#kmkx_hole_gap_RH_종_우')?.value || '',
          정품수량_LH: container.querySelector('#dtc_정품수량_LH')?.value || '',
          정품수량_MID: container.querySelector('#dtc_정품수량_MID')?.value || '',
          정품수량_RH: container.querySelector('#dtc_정품수량_RH')?.value || '',
          불량합계_LH: container.querySelector('#dtc_불량합계_LH')?.value || '',
          불량합계_MID: container.querySelector('#dtc_불량합계_MID')?.value || '',
          불량합계_RH: container.querySelector('#dtc_불량합계_RH')?.value || '',
          길이미달_LH: container.querySelector('#dtc_길이미달_LH')?.value || '',
          길이미달_MID: container.querySelector('#dtc_길이미달_MID')?.value || '',
          길이미달_RH: container.querySelector('#dtc_길이미달_RH')?.value || '',
          길이초과_LH: container.querySelector('#dtc_길이초과_LH')?.value || '',
          길이초과_MID: container.querySelector('#dtc_길이초과_MID')?.value || '',
          길이초과_RH: container.querySelector('#dtc_길이초과_RH')?.value || '',
          끝단부불량_LH: container.querySelector('#dtc_끝단부불량_LH')?.value || '',
          끝단부불량_MID: container.querySelector('#dtc_끝단부불량_MID')?.value || '',
          끝단부불량_RH: container.querySelector('#dtc_끝단부불량_RH')?.value || '',
          클립홀찢어짐_LH: container.querySelector('#dtc_클립홀찢어짐_LH')?.value || '',
          클립홀찢어짐_MID: container.querySelector('#dtc_클립홀찢어짐_MID')?.value || '',
          클립홀찢어짐_RH: container.querySelector('#dtc_클립홀찢어짐_RH')?.value || '',
          클립간격불량_LH: container.querySelector('#dtc_클립간격불량_LH')?.value || '',
          클립간격불량_MID: container.querySelector('#dtc_클립간격불량_MID')?.value || '',
          클립간격불량_RH: container.querySelector('#dtc_클립간격불량_RH')?.value || '',
          드레인홀불량_LH: container.querySelector('#dtc_드레인홀불량_LH')?.value || '',
          드레인홀불량_MID: container.querySelector('#dtc_드레인홀불량_MID')?.value || '',
          드레인홀불량_RH: container.querySelector('#dtc_드레인홀불량_RH')?.value || '',
          스코치_LH: container.querySelector('#dtc_스코치_LH')?.value || '',
          스코치_MID: container.querySelector('#dtc_스코치_MID')?.value || '',
          스코치_RH: container.querySelector('#dtc_스코치_RH')?.value || '',
          기타_LH: container.querySelector('#dtc_기타_LH')?.value || '',
          기타_MID: container.querySelector('#dtc_기타_MID')?.value || '',
          기타_RH: container.querySelector('#dtc_기타_RH')?.value || '',
        }}),
        dtCrewPrepQty: {
          plan_LH_A: container.querySelector('#qty_plan_LH_A')?.value||'',
          plan_RH_A: container.querySelector('#qty_plan_RH_A')?.value||'',
          act_LH_A: container.querySelector('#qty_act_LH_A')?.value||'',
          act_RH_A: container.querySelector('#qty_act_RH_A')?.value||'',
          ext_scorch_LH_A: container.querySelector('#def_ext_scorch_LH_A')?.value||'',
          ext_scorch_RH_A: container.querySelector('#def_ext_scorch_RH_A')?.value||'',
          ext_contam_LH_A: container.querySelector('#def_ext_contam_LH_A')?.value||'',
          ext_contam_RH_A: container.querySelector('#def_ext_contam_RH_A')?.value||'',
          ext_other_LH_A: container.querySelector('#def_ext_other_LH_A')?.value||'',
          ext_other_RH_A: container.querySelector('#def_ext_other_RH_A')?.value||'',
          proc_len_LH_A: container.querySelector('#def_proc_len_LH_A')?.value||'',
          proc_len_RH_A: container.querySelector('#def_proc_len_RH_A')?.value||'',
          proc_sec_LH_A: container.querySelector('#def_proc_sec_LH_A')?.value||'',
          proc_sec_RH_A: container.querySelector('#def_proc_sec_RH_A')?.value||'',
          proc_other_LH_A: container.querySelector('#def_proc_other_LH_A')?.value||'',
          proc_other_RH_A: container.querySelector('#def_proc_other_RH_A')?.value||'',
        },
        dtCrewJointQty: {
          tbl1: {
            lh: (formCode === 2013 || formCode === 2042) ? true : (container.querySelector('#dtc_jqty1_lh')?.checked || false),
            rh: (formCode === 2013 || formCode === 2042) ? false : (container.querySelector('#dtc_jqty1_rh')?.checked || false),
            plan: container.querySelector('#dtc_jqty_plan_1')?.value || '',
            plan_1: container.querySelector('#dtc_jqty_plan_1_1')?.value || '',
            plan_2: container.querySelector('#dtc_jqty_plan_1_2')?.value || '',
            plan_3: container.querySelector('#dtc_jqty_plan_1_3')?.value || '',
            plan_4: container.querySelector('#dtc_jqty_plan_1_4')?.value || '',
            act: container.querySelector('#dtc_jqty_act_1')?.value || '',
            act_1: container.querySelector('#dtc_jqty_act_1_1')?.value || '',
            act_2: container.querySelector('#dtc_jqty_act_1_2')?.value || '',
            act_3: container.querySelector('#dtc_jqty_act_1_3')?.value || '',
            act_4: container.querySelector('#dtc_jqty_act_1_4')?.value || '',
            defects: {
              tear: { a: container.querySelector('#dtc_jdef_tear_1_A')?.value || '', b: container.querySelector('#dtc_jdef_tear_1_B')?.value || '', c: container.querySelector('#dtc_jdef_tear_1_C')?.value || '', h1: container.querySelector('#dtc_jdef_tear_1_1')?.value || '', h2: container.querySelector('#dtc_jdef_tear_1_2')?.value || '', h3: container.querySelector('#dtc_jdef_tear_1_3')?.value || '', h4: container.querySelector('#dtc_jdef_tear_1_4')?.value || '' },
              lack: { a: container.querySelector('#dtc_jdef_lack_1_A')?.value || '', b: container.querySelector('#dtc_jdef_lack_1_B')?.value || '', c: container.querySelector('#dtc_jdef_lack_1_C')?.value || '', h1: container.querySelector('#dtc_jdef_lack_1_1')?.value || '', h2: container.querySelector('#dtc_jdef_lack_1_2')?.value || '', h3: container.querySelector('#dtc_jdef_lack_1_3')?.value || '', h4: container.querySelector('#dtc_jdef_lack_1_4')?.value || '' },
              push: { a: container.querySelector('#dtc_jdef_push_1_A')?.value || '', b: container.querySelector('#dtc_jdef_push_1_B')?.value || '', c: container.querySelector('#dtc_jdef_push_1_C')?.value || '', h1: container.querySelector('#dtc_jdef_push_1_1')?.value || '', h2: container.querySelector('#dtc_jdef_push_1_2')?.value || '', h3: container.querySelector('#dtc_jdef_push_1_3')?.value || '', h4: container.querySelector('#dtc_jdef_push_1_4')?.value || '' },
              bubble: { a: container.querySelector('#dtc_jdef_bubble_1_A')?.value || '', b: container.querySelector('#dtc_jdef_bubble_1_B')?.value || '', c: container.querySelector('#dtc_jdef_bubble_1_C')?.value || '', h1: container.querySelector('#dtc_jdef_bubble_1_1')?.value || '', h2: container.querySelector('#dtc_jdef_bubble_1_2')?.value || '', h3: container.querySelector('#dtc_jdef_bubble_1_3')?.value || '', h4: container.querySelector('#dtc_jdef_bubble_1_4')?.value || '' },
              chew: { a: container.querySelector('#dtc_jdef_chew_1_A')?.value || '', b: container.querySelector('#dtc_jdef_chew_1_B')?.value || '', c: container.querySelector('#dtc_jdef_chew_1_C')?.value || '', h1: container.querySelector('#dtc_jdef_chew_1_1')?.value || '', h2: container.querySelector('#dtc_jdef_chew_1_2')?.value || '', h3: container.querySelector('#dtc_jdef_chew_1_3')?.value || '', h4: container.querySelector('#dtc_jdef_chew_1_4')?.value || '' },
              overflow: { a: container.querySelector('#dtc_jdef_overflow_1_A')?.value || '', b: container.querySelector('#dtc_jdef_overflow_1_B')?.value || '', c: container.querySelector('#dtc_jdef_overflow_1_C')?.value || '', h1: container.querySelector('#dtc_jdef_overflow_1_1')?.value || '', h2: container.querySelector('#dtc_jdef_overflow_1_2')?.value || '', h3: container.querySelector('#dtc_jdef_overflow_1_3')?.value || '', h4: container.querySelector('#dtc_jdef_overflow_1_4')?.value || '' },
              deform: { a: container.querySelector('#dtc_jdef_deform_1_A')?.value || '', b: container.querySelector('#dtc_jdef_deform_1_B')?.value || '', c: container.querySelector('#dtc_jdef_deform_1_C')?.value || '', h1: container.querySelector('#dtc_jdef_deform_1_1')?.value || '', h2: container.querySelector('#dtc_jdef_deform_1_2')?.value || '', h3: container.querySelector('#dtc_jdef_deform_1_3')?.value || '', h4: container.querySelector('#dtc_jdef_deform_1_4')?.value || '' },
              foreign: { a: container.querySelector('#dtc_jdef_foreign_1_A')?.value || '', b: container.querySelector('#dtc_jdef_foreign_1_B')?.value || '', c: container.querySelector('#dtc_jdef_foreign_1_C')?.value || '', h1: container.querySelector('#dtc_jdef_foreign_1_1')?.value || '', h2: container.querySelector('#dtc_jdef_foreign_1_2')?.value || '', h3: container.querySelector('#dtc_jdef_foreign_1_3')?.value || '', h4: container.querySelector('#dtc_jdef_foreign_1_4')?.value || '' },
              twist: { a: container.querySelector('#dtc_jdef_twist_1_A')?.value || '', b: container.querySelector('#dtc_jdef_twist_1_B')?.value || '', c: container.querySelector('#dtc_jdef_twist_1_C')?.value || '', h1: container.querySelector('#dtc_jdef_twist_1_1')?.value || '', h2: container.querySelector('#dtc_jdef_twist_1_2')?.value || '', h3: container.querySelector('#dtc_jdef_twist_1_3')?.value || '', h4: container.querySelector('#dtc_jdef_twist_1_4')?.value || '' },
              oth: { a: container.querySelector('#dtc_jdef_oth_1_A')?.value || '', b: container.querySelector('#dtc_jdef_oth_1_B')?.value || '', c: container.querySelector('#dtc_jdef_oth_1_C')?.value || '', h1: container.querySelector('#dtc_jdef_oth_1_1')?.value || '', h2: container.querySelector('#dtc_jdef_oth_1_2')?.value || '', h3: container.querySelector('#dtc_jdef_oth_1_3')?.value || '', h4: container.querySelector('#dtc_jdef_oth_1_4')?.value || '' }
            }
          },
          tbl2: {
            lh: (formCode === 2013 || formCode === 2042) ? false : (container.querySelector('#dtc_jqty2_lh')?.checked || false),
            rh: (formCode === 2013 || formCode === 2042) ? true : (container.querySelector('#dtc_jqty2_rh')?.checked || false),
            plan: container.querySelector('#dtc_jqty_plan_2')?.value || '',
            act: container.querySelector('#dtc_jqty_act_2')?.value || '',
            defects: {
              tear: { a: container.querySelector('#dtc_jdef_tear_2_A')?.value || '', b: container.querySelector('#dtc_jdef_tear_2_B')?.value || '', c: container.querySelector('#dtc_jdef_tear_2_C')?.value || '' },
              lack: { a: container.querySelector('#dtc_jdef_lack_2_A')?.value || '', b: container.querySelector('#dtc_jdef_lack_2_B')?.value || '', c: container.querySelector('#dtc_jdef_lack_2_C')?.value || '' },
              push: { a: container.querySelector('#dtc_jdef_push_2_A')?.value || '', b: container.querySelector('#dtc_jdef_push_2_B')?.value || '', c: container.querySelector('#dtc_jdef_push_2_C')?.value || '' },
              bubble: { a: container.querySelector('#dtc_jdef_bubble_2_A')?.value || '', b: container.querySelector('#dtc_jdef_bubble_2_B')?.value || '', c: container.querySelector('#dtc_jdef_bubble_2_C')?.value || '' },
              chew: { a: container.querySelector('#dtc_jdef_chew_2_A')?.value || '', b: container.querySelector('#dtc_jdef_chew_2_B')?.value || '', c: container.querySelector('#dtc_jdef_chew_2_C')?.value || '' },
              overflow: { a: container.querySelector('#dtc_jdef_overflow_2_A')?.value || '', b: container.querySelector('#dtc_jdef_overflow_2_B')?.value || '', c: container.querySelector('#dtc_jdef_overflow_2_C')?.value || '' },
              deform: { a: container.querySelector('#dtc_jdef_deform_2_A')?.value || '', b: container.querySelector('#dtc_jdef_deform_2_B')?.value || '', c: container.querySelector('#dtc_jdef_deform_2_C')?.value || '' },
              foreign: { a: container.querySelector('#dtc_jdef_foreign_2_A')?.value || '', b: container.querySelector('#dtc_jdef_foreign_2_B')?.value || '', c: container.querySelector('#dtc_jdef_foreign_2_C')?.value || '' },
              twist: { a: container.querySelector('#dtc_jdef_twist_2_A')?.value || '', b: container.querySelector('#dtc_jdef_twist_2_B')?.value || '', c: container.querySelector('#dtc_jdef_twist_2_C')?.value || '' },
              oth: { a: container.querySelector('#dtc_jdef_oth_2_A')?.value || '', b: container.querySelector('#dtc_jdef_oth_2_B')?.value || '', c: container.querySelector('#dtc_jdef_oth_2_C')?.value || '' }
            }
          }
        },
        dtCrewPostQty: {
          prod: {
            work_LH: container.querySelector('#dtc_pqty_work_LH')?.value || '',
            work_RH: container.querySelector('#dtc_pqty_work_RH')?.value || '',
            good_LH: container.querySelector('#dtc_pqty_good_LH')?.value || '',
            good_RH: container.querySelector('#dtc_pqty_good_RH')?.value || ''
          },
          ho_lh: container.querySelector('#dtc_post_ho_lh')?.value || '',
          ho_rh: container.querySelector('#dtc_post_ho_rh')?.value || '',
          ext: {
            scorch: { lh: container.querySelector('#dtc_pdef_ext_scorch_LH')?.value || '', rh: container.querySelector('#dtc_pdef_ext_scorch_RH')?.value || '' },
            scratch: { lh: container.querySelector('#dtc_pdef_ext_scratch_LH')?.value || '', rh: container.querySelector('#dtc_pdef_ext_scratch_RH')?.value || '' },
            coat: { lh: container.querySelector('#dtc_pdef_ext_coat_LH')?.value || '', rh: container.querySelector('#dtc_pdef_ext_coat_RH')?.value || '' },
            len: { lh: container.querySelector('#dtc_pdef_ext_len_LH')?.value || '', rh: container.querySelector('#dtc_pdef_ext_len_RH')?.value || '' },
            clip_omit: { lh: container.querySelector('#dtc_pdef_ext_clip_omit_LH')?.value || '', rh: container.querySelector('#dtc_pdef_ext_clip_omit_RH')?.value || '' },
            oth: { lh: container.querySelector('#dtc_pdef_ext_oth_LH')?.value || '', rh: container.querySelector('#dtc_pdef_ext_oth_RH')?.value || '' }
          },
          joint: {
            drop: { lh: container.querySelector('#dtc_pdef_j_drop_LH')?.value || '', rh: container.querySelector('#dtc_pdef_j_drop_RH')?.value || '' },
            lack: { lh: container.querySelector('#dtc_pdef_j_lack_LH')?.value || '', rh: container.querySelector('#dtc_pdef_j_lack_RH')?.value || '' },
            push: { lh: container.querySelector('#dtc_pdef_j_push_LH')?.value || '', rh: container.querySelector('#dtc_pdef_j_push_RH')?.value || '' },
            bubble: { lh: container.querySelector('#dtc_pdef_j_bubble_LH')?.value || '', rh: container.querySelector('#dtc_pdef_j_bubble_RH')?.value || '' },
            chew: { lh: container.querySelector('#dtc_pdef_j_chew_LH')?.value || '', rh: container.querySelector('#dtc_pdef_j_chew_RH')?.value || '' },
            overflow: { lh: container.querySelector('#dtc_pdef_j_overflow_LH')?.value || '', rh: container.querySelector('#dtc_pdef_j_overflow_RH')?.value || '' },
            deform: { lh: container.querySelector('#dtc_pdef_j_deform_LH')?.value || '', rh: container.querySelector('#dtc_pdef_j_deform_RH')?.value || '' },
            foreign: { lh: container.querySelector('#dtc_pdef_j_foreign_LH')?.value || '', rh: container.querySelector('#dtc_pdef_j_foreign_RH')?.value || '' },
            twist: { lh: container.querySelector('#dtc_pdef_j_twist_LH')?.value || '', rh: container.querySelector('#dtc_pdef_j_twist_RH')?.value || '' },
            oth: { lh: container.querySelector('#dtc_pdef_j_oth_LH')?.value || '', rh: container.querySelector('#dtc_pdef_j_oth_RH')?.value || '' }
          },
          post: {
            oversand: { lh: container.querySelector('#dtc_pdef_post_oversand_LH')?.value || '', rh: container.querySelector('#dtc_pdef_post_oversand_RH')?.value || '' },
            undersand: { lh: container.querySelector('#dtc_pdef_post_undersand_LH')?.value || '', rh: container.querySelector('#dtc_pdef_post_undersand_RH')?.value || '' },
            bond_contam: { lh: container.querySelector('#dtc_pdef_post_bond_contam_LH')?.value || '', rh: container.querySelector('#dtc_pdef_post_bond_contam_RH')?.value || '' },
            ext_contam: { lh: container.querySelector('#dtc_pdef_post_ext_contam_LH')?.value || '', rh: container.querySelector('#dtc_pdef_post_ext_contam_RH')?.value || '' },
            clip_half: { lh: container.querySelector('#dtc_pdef_post_clip_half_LH')?.value || '', rh: container.querySelector('#dtc_pdef_post_clip_half_RH')?.value || '' },
            clip_hole_omit: { lh: container.querySelector('#dtc_pdef_post_clip_hole_omit_LH')?.value || '', rh: container.querySelector('#dtc_pdef_post_clip_hole_omit_RH')?.value || '' },
            drain_bad: { lh: container.querySelector('#dtc_pdef_post_drain_bad_LH')?.value || '', rh: container.querySelector('#dtc_pdef_post_drain_bad_RH')?.value || '' },
            clip_diff: { lh: container.querySelector('#dtc_pdef_post_clip_diff_LH')?.value || '', rh: container.querySelector('#dtc_pdef_post_clip_diff_RH')?.value || '' },
            cut_omit: { lh: container.querySelector('#dtc_pdef_post_cut_omit_LH')?.value || '', rh: container.querySelector('#dtc_pdef_post_cut_omit_RH')?.value || '' },
            bond_omit: { lh: container.querySelector('#dtc_pdef_post_bond_omit_LH')?.value || '', rh: container.querySelector('#dtc_pdef_post_bond_omit_RH')?.value || '' },
            len_over: { lh: container.querySelector('#dtc_pdef_post_len_over_LH')?.value || '', rh: container.querySelector('#dtc_pdef_post_len_over_RH')?.value || '' },
            clip_gap_bad: { lh: container.querySelector('#dtc_pdef_post_clip_gap_bad_LH')?.value || '', rh: container.querySelector('#dtc_pdef_post_clip_gap_bad_RH')?.value || '' },
            oth: { lh: container.querySelector('#dtc_pdef_post_oth_LH')?.value || '', rh: container.querySelector('#dtc_pdef_post_oth_RH')?.value || '' }
          }
        }
      };

      if (existingData) {
        store.updateReport(existingData.id, reportData);
        if (targetStatus === '임시저장') {
          windowMock.showToast('📁 작업일보가 중간 저장되었습니다.', 'info');
        } else {
          windowMock.showToast('✅ 작업일보가 성공적으로 등록 완료되었습니다.', 'success');
        }
      } else {
        store.addReport(reportData);
        if (targetStatus === '임시저장') {
          windowMock.showToast('📁 작업일보가 중간 저장되었습니다.', 'info');
        } else {
          windowMock.showToast('✅ 작업일보가 성공적으로 등록 완료되었습니다.', 'success');
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
      console.error('Error saving standard report:', err);
      windowMock.showToast(`⚠️ 저장 중 오류가 발생했습니다: ${err.message}`, 'error');
    }
  };

  // 화면 하단 고정 버튼 바 (standard form) - fixed 방식
  let standardFixedBar = document.getElementById('standardFixedActionBar');
  if (!standardFixedBar) {
    standardFixedBar = document.createElement('div');
    standardFixedBar.id = 'standardFixedActionBar';
    document.body.appendChild(standardFixedBar);
  }
  standardFixedBar.style.cssText = 'position:fixed; bottom:0; left:0; right:0; z-index:500; background:rgba(255,255,255,0.97); backdrop-filter:blur(10px); -webkit-backdrop-filter:blur(10px); padding:12px 16px; border-top:2px solid var(--border-color); box-shadow:0 -4px 20px rgba(0,0,0,0.12); display:flex; gap:10px; justify-content:center;';
  standardFixedBar.innerHTML = `
    <button type="button" id="btnDraftSave" class="btn btn-secondary" style="flex:1; max-width:240px; padding:13px 18px; font-size:14px; font-weight:700;" data-i18n="btn_draft_save">
      📁 작업일보 중간 저장
    </button>
    <button type="button" id="btnFinalSubmit" class="btn btn-primary" style="flex:1; max-width:240px; padding:13px 18px; font-size:14px; font-weight:700;" data-i18n="btn_final_submit">
      ✅ 작업일보 등록 완료
    </button>
  `;
  standardFixedBar.style.display = 'flex';

  const hideLeaderFixedBar = document.getElementById('leaderFixedActionBar');
  if (hideLeaderFixedBar) {
    hideLeaderFixedBar.style.display = 'none';
  }

  i18n.applyTranslations(container);
  i18n.applyTranslations(standardFixedBar);

  const btnDraftSave = standardFixedBar.querySelector('#btnDraftSave');
  const btnFinalSubmit = standardFixedBar.querySelector('#btnFinalSubmit');

  if (btnDraftSave) {
    btnDraftSave.addEventListener('click', () => {
      processStandardSave('임시저장');
    });
  }

  if (btnFinalSubmit) {
    btnFinalSubmit.addEventListener('click', () => {
      processStandardSave('승인 대기');
    });
  }
}

function bindTimeWheelPicker(inputElem, titleText = '시간 선택') {
  if (!inputElem) return;
  inputElem.addEventListener('click', () => {
    openTimeWheelPicker(inputElem.value || '08:00', titleText, (selectedTime) => {
      inputElem.value = selectedTime;
    });
  });
}

function bindNumberWheelPicker(inputElem, titleText = '수치 입력', defaultCenter = 100, range = 30, unit = '') {
  if (!inputElem) return;
  inputElem.style.cursor = 'pointer';
  inputElem.addEventListener('click', () => {
    const rawVal = parseFloat(inputElem.value);
    const initialVal = !isNaN(rawVal) ? rawVal : defaultCenter;
    openNumberWheelPicker(initialVal, titleText, defaultCenter, range, unit, (selectedVal) => {
      inputElem.value = selectedVal;
      inputElem.dispatchEvent(new Event('input', { bubbles: true }));
      inputElem.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
}

function openNumberWheelPicker(initialValue = 100, title = '수치 선택', defaultCenter = 100, range = 30, unit = '', callback) {
  let modal = document.getElementById('wheelNumberPickerModal');
  if (modal) modal.remove();

  const minVal = Math.round(defaultCenter - range);
  const maxVal = Math.round(defaultCenter + range);
  const numbersList = [];
  for (let val = minVal; val <= maxVal; val++) {
    numbersList.push(val);
  }

  let curNum = Math.round(initialValue);
  if (curNum < minVal) curNum = minVal;
  if (curNum > maxVal) curNum = maxVal;
  let selectedNumber = curNum;

  modal = document.createElement('div');
  modal.id = 'wheelNumberPickerModal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    z-index: 10000; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; padding: 16px;
  `;

  const presets = [
    defaultCenter - 10,
    defaultCenter - 5,
    defaultCenter,
    defaultCenter + 5,
    defaultCenter + 10
  ].filter(p => p >= minVal && p <= maxVal);

  modal.innerHTML = `
    <div style="background: #ffffff; width: 100%; max-width: 360px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.25); overflow: hidden; font-family: 'Noto Sans KR', sans-serif;">
      <div style="padding: 16px 20px; background: linear-gradient(135deg, #0284c7, #0369a1); color: #ffffff; display: flex; justify-content: space-between; align-items: center;">
        <h4 style="margin: 0; font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
          🔢 ${title}
        </h4>
        <button type="button" id="wnpCloseBtn" style="background: none; border: none; color: #ffffff; font-size: 24px; cursor: pointer; line-height: 1;">&times;</button>
      </div>

      <div style="padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; gap: 6px; overflow-x: auto; justify-content: center;">
        ${presets.map(p => `
          <button type="button" class="wnp-preset-btn ${p === defaultCenter ? 'preset-center' : ''}" data-val="${p}" style="padding: 5px 12px; font-size: 12px; font-weight: 700; border: 1px solid ${p === defaultCenter ? '#0284c7' : '#cbd5e1'}; background: ${p === defaultCenter ? '#e0f2fe' : '#ffffff'}; border-radius: 20px; color: ${p === defaultCenter ? '#0369a1' : '#334155'}; cursor: pointer; white-space: nowrap;">
            ${p === defaultCenter ? `기준 (${p}${unit})` : `${p}${unit}`}
          </button>
        `).join('')}
      </div>

      <div style="position: relative; height: 200px; background: #ffffff; display: flex; justify-content: center; align-items: center; overflow: hidden; user-select: none;">
        <div style="position: absolute; top: 80px; left: 16px; right: 16px; height: 40px; background: rgba(2, 132, 199, 0.1); border-top: 2px solid #0284c7; border-bottom: 2px solid #0284c7; border-radius: 8px; pointer-events: none; z-index: 1;"></div>
        ${unit ? `<div style="position: absolute; right: 80px; font-size: 18px; font-weight: 700; color: #0284c7; z-index: 2; pointer-events: none;">${unit}</div>` : ''}

        <div id="wnpNumberWheel" style="width: 100%; height: 200px; overflow-y: scroll; scroll-snap-type: y mandatory; text-align: center;">
          <div style="height: 80px;"></div>
          ${numbersList.map(n => `
            <div class="wnp-item wnp-num-item" data-val="${n}" style="height: 40px; line-height: 40px; font-size: 20px; font-weight: 700; color: #475569; scroll-snap-align: center; cursor: pointer;">
              ${n}
            </div>
          `).join('')}
          <div style="height: 80px;"></div>
        </div>
      </div>

      <div style="padding: 14px 16px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; justify-content: flex-end;">
        <button type="button" id="wnpCancelBtn" style="padding: 10px 18px; border: 1px solid #cbd5e1; background: #ffffff; color: #475569; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer;">
          취소
        </button>
        <button type="button" id="wnpConfirmBtn" style="padding: 10px 24px; border: none; background: #0284c7; color: #ffffff; border-radius: 8px; font-weight: 800; font-size: 13px; cursor: pointer; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);">
          확인
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const numWheel = modal.querySelector('#wnpNumberWheel');
  const ITEM_HEIGHT = 40;

  const scrollToVal = (val, smooth = true) => {
    const idx = numbersList.indexOf(val);
    if (idx !== -1) {
      numWheel.scrollTo({ top: idx * ITEM_HEIGHT, behavior: smooth ? 'smooth' : 'auto' });
    }
  };

  requestAnimationFrame(() => {
    scrollToVal(curNum, false);
  });

  const updateSelection = () => {
    const idx = Math.round(numWheel.scrollTop / ITEM_HEIGHT);
    const clampedIdx = Math.max(0, Math.min(numbersList.length - 1, idx));
    selectedNumber = numbersList[clampedIdx];
    numWheel.querySelectorAll('.wnp-num-item').forEach((item, i) => {
      if (i === clampedIdx) {
        item.style.color = '#0284c7';
        item.style.fontSize = '24px';
      } else {
        item.style.color = '#94a3b8';
        item.style.fontSize = '18px';
      }
    });
  };

  numWheel.addEventListener('scroll', updateSelection);
  updateSelection();

  numWheel.querySelectorAll('.wnp-num-item').forEach((item) => {
    item.addEventListener('click', () => {
      const val = parseInt(item.dataset.val, 10);
      scrollToVal(val);
    });
  });

  modal.querySelectorAll('.wnp-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = parseInt(btn.dataset.val, 10);
      scrollToVal(val);
    });
  });

  const enableMouseDrag = (wheelElem) => {
    let isDragging = false;
    let startY = 0;
    let startScrollTop = 0;

    wheelElem.addEventListener('mousedown', (e) => {
      isDragging = true;
      startY = e.pageY;
      startScrollTop = wheelElem.scrollTop;
      wheelElem.style.scrollSnapType = 'none';
    });
    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const walk = (e.pageY - startY) * 1.5;
      wheelElem.scrollTop = startScrollTop - walk;
    });
    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      wheelElem.style.scrollSnapType = 'y mandatory';
      const nearest = Math.round(wheelElem.scrollTop / ITEM_HEIGHT) * ITEM_HEIGHT;
      wheelElem.scrollTo({ top: nearest, behavior: 'smooth' });
    });
  };

  enableMouseDrag(numWheel);

  const closeModal = () => modal.remove();

  modal.querySelector('#wnpCloseBtn').addEventListener('click', closeModal);
  modal.querySelector('#wnpCancelBtn').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  modal.querySelector('#wnpConfirmBtn').addEventListener('click', () => {
    if (callback) callback(String(selectedNumber));
    closeModal();
  });
}

function openTimeWheelPicker(initialValue = '08:00', title = '시간 선택', callback) {
  let [initH, initM] = (initialValue || '08:00').split(':').map(v => parseInt(v, 10));
  if (isNaN(initH)) initH = 8;
  if (isNaN(initM)) initM = 0;

  let selectedHour = initH;
  let selectedMinute = initM;

  let modal = document.getElementById('wheelTimePickerModal');
  if (modal) modal.remove();

  modal = document.createElement('div');
  modal.id = 'wheelTimePickerModal';
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    z-index: 10000; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px);
    display: flex; align-items: center; justify-content: center; padding: 16px;
  `;

  const hoursList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutesList = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  modal.innerHTML = `
    <div style="background: #ffffff; width: 100%; max-width: 360px; border-radius: 16px; box-shadow: 0 20px 40px rgba(0,0,0,0.25); overflow: hidden; font-family: 'Noto Sans KR', sans-serif;">
      <div style="padding: 16px 20px; background: linear-gradient(135deg, #0284c7, #0369a1); color: #ffffff; display: flex; justify-content: space-between; align-items: center;">
        <h4 style="margin: 0; font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
          🕒 ${title}
        </h4>
        <button type="button" id="wtpCloseBtn" style="background: none; border: none; color: #ffffff; font-size: 24px; cursor: pointer; line-height: 1;">&times;</button>
      </div>

      <div style="padding: 12px 16px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; display: flex; gap: 6px; overflow-x: auto;">
        ${['06:30', '08:30', '15:10', '17:10', '19:10'].map(t => `
          <button type="button" class="wtp-preset-btn" data-time="${t}" style="padding: 4px 10px; font-size: 12px; font-weight: 700; border: 1px solid #cbd5e1; background: #ffffff; border-radius: 20px; color: #334155; cursor: pointer; white-space: nowrap;">
            ${t}
          </button>
        `).join('')}
      </div>

      <div style="position: relative; height: 200px; background: #ffffff; display: flex; justify-content: center; align-items: center; overflow: hidden; user-select: none;">
        <div style="position: absolute; top: 80px; left: 16px; right: 16px; height: 40px; background: rgba(2, 132, 199, 0.1); border-top: 2px solid #0284c7; border-bottom: 2px solid #0284c7; border-radius: 8px; pointer-events: none; z-index: 1;"></div>
        <div style="position: absolute; font-size: 24px; font-weight: 900; color: #0284c7; z-index: 2; pointer-events: none;">:</div>

        <div id="wtpHourWheel" style="flex: 1; height: 200px; overflow-y: scroll; scroll-snap-type: y mandatory; text-align: center;">
          <div style="height: 80px;"></div>
          ${hoursList.map(h => `
            <div class="wtp-item wtp-hour-item" data-val="${h}" style="height: 40px; line-height: 40px; font-size: 20px; font-weight: 700; color: #475569; scroll-snap-align: center; cursor: pointer;">
              ${h}시
            </div>
          `).join('')}
          <div style="height: 80px;"></div>
        </div>

        <div id="wtpMinWheel" style="flex: 1; height: 200px; overflow-y: scroll; scroll-snap-type: y mandatory; text-align: center;">
          <div style="height: 80px;"></div>
          ${minutesList.map(m => `
            <div class="wtp-item wtp-min-item" data-val="${m}" style="height: 40px; line-height: 40px; font-size: 20px; font-weight: 700; color: #475569; scroll-snap-align: center; cursor: pointer;">
              ${m}분
            </div>
          `).join('')}
          <div style="height: 80px;"></div>
        </div>
      </div>

      <div style="padding: 14px 16px; background: #f8fafc; border-top: 1px solid #e2e8f0; display: flex; gap: 10px; justify-content: flex-end;">
        <button type="button" id="wtpCancelBtn" style="padding: 10px 18px; border: 1px solid #cbd5e1; background: #ffffff; color: #475569; border-radius: 8px; font-weight: 700; font-size: 13px; cursor: pointer;">
          취소
        </button>
        <button type="button" id="wtpConfirmBtn" style="padding: 10px 24px; border: none; background: #0284c7; color: #ffffff; border-radius: 8px; font-weight: 800; font-size: 13px; cursor: pointer; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);">
          확인
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const hourWheel = modal.querySelector('#wtpHourWheel');
  const minWheel = modal.querySelector('#wtpMinWheel');
  const ITEM_HEIGHT = 40;

  const scrollToHour = (h, smooth = true) => {
    hourWheel.scrollTo({ top: h * ITEM_HEIGHT, behavior: smooth ? 'smooth' : 'auto' });
  };
  const scrollToMin = (m, smooth = true) => {
    minWheel.scrollTo({ top: m * ITEM_HEIGHT, behavior: smooth ? 'smooth' : 'auto' });
  };

  requestAnimationFrame(() => {
    scrollToHour(initH, false);
    scrollToMin(initM, false);
  });

  const updateHourSelection = () => {
    const idx = Math.round(hourWheel.scrollTop / ITEM_HEIGHT);
    const clampedIdx = Math.max(0, Math.min(23, idx));
    selectedHour = clampedIdx;
    hourWheel.querySelectorAll('.wtp-hour-item').forEach((item, i) => {
      if (i === clampedIdx) {
        item.style.color = '#0284c7';
        item.style.fontSize = '24px';
      } else {
        item.style.color = '#94a3b8';
        item.style.fontSize = '18px';
      }
    });
  };

  const updateMinSelection = () => {
    const idx = Math.round(minWheel.scrollTop / ITEM_HEIGHT);
    const clampedIdx = Math.max(0, Math.min(59, idx));
    selectedMinute = clampedIdx;
    minWheel.querySelectorAll('.wtp-min-item').forEach((item, i) => {
      if (i === clampedIdx) {
        item.style.color = '#0284c7';
        item.style.fontSize = '24px';
      } else {
        item.style.color = '#94a3b8';
        item.style.fontSize = '18px';
      }
    });
  };

  hourWheel.addEventListener('scroll', updateHourSelection);
  minWheel.addEventListener('scroll', updateMinSelection);
  updateHourSelection();
  updateMinSelection();

  hourWheel.querySelectorAll('.wtp-hour-item').forEach((item, idx) => {
    item.addEventListener('click', () => scrollToHour(idx));
  });
  minWheel.querySelectorAll('.wtp-min-item').forEach((item, idx) => {
    item.addEventListener('click', () => scrollToMin(idx));
  });

  modal.querySelectorAll('.wtp-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const [ph, pm] = btn.dataset.time.split(':').map(Number);
      scrollToHour(ph);
      scrollToMin(pm);
    });
  });

  const enableMouseDrag = (wheelElem) => {
    let isDragging = false;
    let startY = 0;
    let startScrollTop = 0;

    wheelElem.addEventListener('mousedown', (e) => {
      isDragging = true;
      startY = e.pageY;
      startScrollTop = wheelElem.scrollTop;
      wheelElem.style.scrollSnapType = 'none';
    });
    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const walk = (e.pageY - startY) * 1.5;
      wheelElem.scrollTop = startScrollTop - walk;
    });
    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      wheelElem.style.scrollSnapType = 'y mandatory';
      const nearest = Math.round(wheelElem.scrollTop / ITEM_HEIGHT) * ITEM_HEIGHT;
      wheelElem.scrollTo({ top: nearest, behavior: 'smooth' });
    });
  };

  enableMouseDrag(hourWheel);
  enableMouseDrag(minWheel);

  const closeModal = () => modal.remove();

  modal.querySelector('#wtpCloseBtn').addEventListener('click', closeModal);
  modal.querySelector('#wtpCancelBtn').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  modal.querySelector('#wtpConfirmBtn').addEventListener('click', () => {
    const formattedH = String(selectedHour).padStart(2, '0');
    const formattedM = String(selectedMinute).padStart(2, '0');
    const timeStr = `${formattedH}:${formattedM}`;
    if (callback) callback(timeStr);
    closeModal();
  });
}
