import { store, windowMock } from '../../LegacyFormWrapper.jsx';
import { CAR_MODELS } from '../../../../constants/masterData.js';
import { i18n } from '../../../../constants/translations.js';

export const F9004_CHECKLIST_ITEMS = [
  { id: 'f9004_chk1', text: '보관실 항온·항습기 가동 및 기준 온·습도 유지 상태' },
  { id: 'f9004_chk2', text: 'FMB(배합고무) 선입선출(FIFO) 준수 및 적재 구역 구분 상태' },
  { id: 'f9004_chk3', text: '원재료 LOT 식별표 부착 및 유효기간(사용기한) 경과품 유무 확인' },
  { id: 'f9004_chk4', text: '이물질·오염·직사광선 차단 및 비닐 커버 밀봉 보관 상태' },
  { id: 'f9004_chk5', text: '보관실 통로 정리정돈 및 안전·소방 시설 이상 유무' }
];

const F9004_IO_TYPES = ['입고', '불출(투입)', '반납', '재고점검', '보류·격리'];

const escapeHtml = (val) => String(val ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

function buildRowHTML(item, idx, carCodes) {
  const curType = item?.f9004_type || '';
  const curCar = item?.f9004_carModel || '';
  const typeOptions = F9004_IO_TYPES.map((tp) => (
    `<option value="${escapeHtml(tp)}" ${curType === tp ? 'selected' : ''}>${escapeHtml(tp)}</option>`
  )).join('');
  const carOptions = ['공통', ...carCodes].map((code) => (
    `<option value="${escapeHtml(code)}" ${curCar === code ? 'selected' : ''}>${escapeHtml(code)}</option>`
  )).join('');

  return `
    <tr data-f9004-row="${idx}">
      <td data-f9004-col="no" style="border: 1px solid #000; text-align: center; font-weight: 700; padding: 6px;">${idx + 1}</td>
      <td style="border: 1px solid #000; padding: 5px;">
        <select id="f9004_type_${idx}" name="f9004_type_${idx}" data-f9004-field="type" class="form-control" style="font-size: 12px; padding: 4px; height: auto;">
          <option value="">선택</option>
          ${typeOptions}
        </select>
      </td>
      <td style="border: 1px solid #000; padding: 5px;">
        <select id="f9004_car_${idx}" name="f9004_car_${idx}" data-f9004-field="carModel" class="form-control" style="font-size: 12px; padding: 4px; height: auto;">
          <option value="">선택</option>
          ${carOptions}
        </select>
      </td>
      <td style="border: 1px solid #000; padding: 5px;">
        <input type="text" id="f9004_compound_${idx}" name="f9004_compound_${idx}" data-f9004-field="compoundLot" class="form-control" value="${escapeHtml(item?.f9004_compoundLot || '')}" placeholder="컴파운드명 / LOT No." style="font-size: 12px; padding: 4px 6px; height: auto; width: 100%;" />
      </td>
      <td style="border: 1px solid #000; padding: 5px;">
        <input type="text" id="f9004_qty_${idx}" name="f9004_qty_${idx}" data-f9004-field="amount" class="form-control" value="${escapeHtml(item?.f9004_amount || '')}" placeholder="예: 200kg / 2PLT" style="font-size: 12px; padding: 4px 6px; height: auto; width: 100%; text-align: center;" />
      </td>
      <td style="border: 1px solid #000; padding: 5px;">
        <input type="text" id="f9004_note_${idx}" name="f9004_note_${idx}" data-f9004-field="note" class="form-control" value="${escapeHtml(item?.f9004_note || '')}" placeholder="투입라인 / 공급처 / 비고" style="font-size: 12px; padding: 4px 6px; height: auto; width: 100%;" />
      </td>
    </tr>
  `;
}

export function renderFmbPaperForm(container, existingData, loggedInWorkerName) {
  const todayStr = new Date().toLocaleDateString('sv-SE');
  const dateParts = (existingData?.date || todayStr).split('-');

  let defaultStartTime = '08:00';
  let defaultEndTime = '17:00';
  if (existingData?.workHours) {
    const times = existingData.workHours.split('~').map((t) => t.trim());
    if (times[0]) defaultStartTime = times[0];
    if (times[1]) defaultEndTime = times[1];
  }

  const envData = existingData?.f9004_env || {};
  const chkData = existingData?.f9004_checks || {};
  const savedItems = Array.isArray(existingData?.f9004_items) && existingData.f9004_items.length > 0
    ? existingData.f9004_items
    : [];
  const rowCount = Math.max(5, savedItems.length);
  const initialRows = Array.from({ length: rowCount }, (_, i) => savedItems[i] || {});
  const workDetails = existingData?.workDetails || '';

  const carCodes = CAR_MODELS.filter((c) => c.code !== '공통').map((c) => c.code);

  container.innerHTML = `
    <div data-form-code="9004" class="paper-form-container" style="font-family: 'Noto Sans KR', sans-serif; color: #000; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); max-width: 820px; margin: 0 auto;">
      <!-- 양식 상단 배지 -->
      <div style="background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(13,148,136,0.14)); border: 1px solid #10b981; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 24px;">🏷️</span>
          <div>
            <div style="font-size: 16px; font-weight: 800; color: #047857; margin-bottom: 4px;">
              양식 고유번호: #9004
            </div>
            <div style="font-size: 13px; color: #1e293b; font-weight: 600;">
              [공통] 공통 - FMB보관실 공정 전용 양식
            </div>
          </div>
        </div>
      </div>

      <!-- 종이양식 헤더 (상단 공통 카드와 병행 시 자동 숨김) -->
      <div data-f9004-paper-header="1" style="display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 14px;">
        <h2 style="font-size: 24px; font-weight: 800; color: #000; letter-spacing: 2px; margin: 0;">FMB보관실 작업일보</h2>
        <table style="border-collapse: collapse; border: 1px solid #000; font-size: 13px; text-align: center;">
          <tr>
            <td style="border: 1px solid #000; width: 60px; background: #f1f5f9; font-weight: 700;">작성</td>
            <td style="border: 1px solid #000; width: 60px; background: #f1f5f9; font-weight: 700;">승인</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; height: 40px; vertical-align: middle; font-weight: 700;">${escapeHtml(loggedInWorkerName || '작업자')}</td>
            <td style="border: 1px solid #000; height: 40px;"></td>
          </tr>
        </table>
      </div>

      <!-- 동기화용 숨김 날짜·시간 필드 -->
      <div data-f9004-paper-date="1" style="display: none; margin-bottom: 14px;">
        <input type="hidden" id="f9004_year" value="${escapeHtml(dateParts[0]?.substring(2) || '26')}" />
        <input type="hidden" id="f9004_month" value="${escapeHtml(dateParts[1] || '01')}" />
        <input type="hidden" id="f9004_day" value="${escapeHtml(dateParts[2] || '01')}" />
        <input type="hidden" id="f9004_startTime" value="${escapeHtml(defaultStartTime)}" />
        <input type="hidden" id="f9004_endTime" value="${escapeHtml(defaultEndTime)}" />
      </div>

      <!-- 1. 보관실 온·습도 및 일일 관리 점검표 -->
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; font-weight: 800; color: #000; margin-bottom: 8px;">1. 보관실 온·습도 및 선입선출 일일 점검표</h3>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; padding: 10px 12px; margin-bottom: 10px; background: #f8fafc; border: 1px solid #94a3b8; border-radius: 6px;">
          <div>
            <label for="f9004_temp" style="display: block; font-size: 11px; font-weight: 800; color: #334155; margin-bottom: 4px;">🌡️ 보관실 온도 (℃)</label>
            <input type="text" id="f9004_temp" name="f9004_temp" data-wheel-skip="1" class="form-control" value="${escapeHtml(envData.f9004_temp || '')}" placeholder="예: 21.5" style="font-size: 13px; padding: 6px 8px; height: auto; font-weight: 700;" />
          </div>
          <div>
            <label for="f9004_humidity" style="display: block; font-size: 11px; font-weight: 800; color: #334155; margin-bottom: 4px;">💧 보관실 습도 (%)</label>
            <input type="text" id="f9004_humidity" name="f9004_humidity" data-wheel-skip="1" class="form-control" value="${escapeHtml(envData.f9004_humidity || '')}" placeholder="예: 45" style="font-size: 13px; padding: 6px 8px; height: auto; font-weight: 700;" />
          </div>
          <div>
            <label for="f9004_envNote" style="display: block; font-size: 11px; font-weight: 800; color: #334155; margin-bottom: 4px;">🕒 점검 시각 / 환경 비고</label>
            <input type="text" id="f9004_envNote" name="f9004_envNote" data-wheel-skip="1" class="form-control" value="${escapeHtml(envData.f9004_envNote || '')}" placeholder="예: 오전/오후 정상 가동" style="font-size: 13px; padding: 6px 8px; height: auto;" />
          </div>
        </div>

        <table class="data-table" style="border: 1px solid #000; font-size: 13px; width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f1f5f9; color: #000;">
              <th style="border: 1px solid #000; text-align: center; padding: 6px; width: 50px;">No</th>
              <th style="border: 1px solid #000; text-align: center; padding: 6px;">점검 항목</th>
              <th style="border: 1px solid #000; text-align: center; padding: 6px; width: 130px;">상태 (양호/불량)</th>
            </tr>
          </thead>
          <tbody>
            ${F9004_CHECKLIST_ITEMS.map((item, idx) => {
              const isGood = chkData[item.id] !== false;
              return `
                <tr>
                  <td style="border: 1px solid #000; text-align: center; font-weight: 700; padding: 6px;">${idx + 1}</td>
                  <td style="border: 1px solid #000; font-weight: 600; padding: 6px;">${escapeHtml(item.text)}</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 6px;">
                    <div style="display: flex; justify-content: center; gap: 10px;">
                      <label style="cursor: pointer; display: flex; align-items: center; gap: 4px;">
                        <input type="radio" name="${item.id}" value="true" ${isGood ? 'checked' : ''} />
                        양호
                      </label>
                      <label style="cursor: pointer; display: flex; align-items: center; gap: 4px; color: #dc2626;">
                        <input type="radio" name="${item.id}" value="false" ${!isGood ? 'checked' : ''} />
                        불량
                      </label>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- 2. 금일 FMB 입고·불출 및 작업 내역 -->
      <div style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; gap: 8px; flex-wrap: wrap;">
          <h3 style="font-size: 14px; font-weight: 800; color: #000; margin: 0;">2. 금일 입고 · 불출 및 재고 관리 내역</h3>
          <button type="button" id="f9004_btnAddRow" class="btn btn-secondary btn-sm" style="font-size: 12px; font-weight: 700; padding: 4px 10px;">
            ➕ 내역 행 추가
          </button>
        </div>
        <div style="overflow-x: auto;">
          <table class="data-table" style="border: 1px solid #000; font-size: 13px; width: 100%; border-collapse: collapse; min-width: 640px;">
            <thead>
              <tr style="background: #f1f5f9; color: #000;">
                <th style="border: 1px solid #000; text-align: center; padding: 6px; width: 38px;">No</th>
                <th style="border: 1px solid #000; text-align: center; padding: 6px; width: 96px;">구분</th>
                <th style="border: 1px solid #000; text-align: center; padding: 6px; width: 105px;">차종</th>
                <th style="border: 1px solid #000; text-align: center; padding: 6px; width: 170px;">컴파운드 / LOT No.</th>
                <th style="border: 1px solid #000; text-align: center; padding: 6px; width: 110px;">수량</th>
                <th style="border: 1px solid #000; text-align: center; padding: 6px;">비고 (투입라인·전달사항)</th>
              </tr>
            </thead>
            <tbody id="f9004_tbody">
              ${initialRows.map((item, idx) => buildRowHTML(item, idx, carCodes)).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- 3. 특이사항 -->
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; font-weight: 800; color: #000; margin-bottom: 8px;">3. 금일 주요 작업 내용 및 특이사항</h3>
        <textarea id="f9004_workDetails" name="f9004_workDetails" class="form-control" rows="3" placeholder="유효기간 임박 원재료 현황, 항온항습 특이사항, 교대 전달사항 등을 입력하세요." style="font-size: 13px; resize: vertical; width: 100%; border: 1px solid #000; border-radius: 4px; padding: 8px;">${escapeHtml(workDetails)}</textarea>
      </div>

      <!-- 하단 저장·제출 버튼 -->
      <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; padding-top: 16px; border-top: 1px dashed #cbd5e1;">
        <button type="button" id="f9004_btnDraftSave" class="btn btn-secondary" style="font-weight: 700; min-width: 120px;">
          📁 중간 저장
        </button>
        <button type="button" id="f9004_btnFinalSubmit" class="btn btn-primary" style="font-weight: 700; min-width: 120px;">
          ✅ 제출 (승인 대기)
        </button>
      </div>
    </div>
  `;

  const root = container.querySelector('[data-form-code="9004"]');
  if (!root) return;

  const tbody = root.querySelector('#f9004_tbody');
  const btnAddRow = root.querySelector('#f9004_btnAddRow');
  const btnDraftSave = root.querySelector('#f9004_btnDraftSave');
  const btnFinalSubmit = root.querySelector('#f9004_btnFinalSubmit');

  if (btnAddRow && tbody) {
    btnAddRow.addEventListener('click', () => {
      const nextIdx = tbody.querySelectorAll('tr[data-f9004-row]').length;
      tbody.insertAdjacentHTML('beforeend', buildRowHTML({}, nextIdx, carCodes));
      i18n.applyTranslations(tbody);
    });
  }

  i18n.applyTranslations(root);

  const processFmbSave = (targetStatus) => {
    try {
      const yy = root.querySelector('#f9004_year')?.value || dateParts[0].substring(2);
      const mm = root.querySelector('#f9004_month')?.value || dateParts[1];
      const dd = root.querySelector('#f9004_day')?.value || dateParts[2];
      let fullDate = `20${yy}-${mm}-${dd}`;

      const formRoot = container.closest('form, [id="mobileWorkReportForm"]')?.parentElement || container.closest('[data-form-root]');
      const reportDateInput = formRoot?.querySelector('#reportDate')?.value;
      if (reportDateInput) fullDate = reportDateInput;

      const stFromOuter = formRoot?.querySelector('#startTimeInput')?.value;
      const etFromOuter = formRoot?.querySelector('#endTimeInput')?.value;
      const st = stFromOuter || root.querySelector('#f9004_startTime')?.value || '08:00';
      const et = etFromOuter || root.querySelector('#f9004_endTime')?.value || '17:00';
      const workHours = `${st} ~ ${et}`;

      const f9004_env = {
        f9004_temp: (root.querySelector('#f9004_temp')?.value || '').trim(),
        f9004_humidity: (root.querySelector('#f9004_humidity')?.value || '').trim(),
        f9004_envNote: (root.querySelector('#f9004_envNote')?.value || '').trim()
      };

      const f9004_checks = {};
      F9004_CHECKLIST_ITEMS.forEach((item) => {
        const checked = root.querySelector(`input[name="${item.id}"]:checked`);
        f9004_checks[item.id] = checked ? checked.value === 'true' : true;
      });

      const f9004_items = [];
      root.querySelectorAll('tr[data-f9004-row]').forEach((tr) => {
        const f9004_type = (tr.querySelector('[data-f9004-field="type"]')?.value || '').trim();
        const f9004_carModel = (tr.querySelector('[data-f9004-field="carModel"]')?.value || '').trim();
        const f9004_compoundLot = (tr.querySelector('[data-f9004-field="compoundLot"]')?.value || '').trim();
        const f9004_amount = (tr.querySelector('[data-f9004-field="amount"]')?.value || '').trim();
        const f9004_note = (tr.querySelector('[data-f9004-field="note"]')?.value || '').trim();
        if (f9004_type || f9004_carModel || f9004_compoundLot || f9004_amount || f9004_note) {
          f9004_items.push({
            f9004_type,
            f9004_carModel,
            f9004_compoundLot,
            f9004_amount,
            f9004_note
          });
        }
      });

      const workDetailsText = root.querySelector('#f9004_workDetails')?.value || '';
      const currentUserRole = store.getUserRole();
      const currentWorkerName = existingData?.workerName || currentUserRole?.workerName || loggedInWorkerName || '작업자';

      const reportData = {
        date: fullDate,
        workHours,
        shift: '주간',
        carModel: '공통',
        processName: 'FMB보관실',
        line: '1라인',
        workerName: currentWorkerName,
        workerId: existingData?.workerId || 'EMP001',
        itemCode: '공통',
        itemName: '공통',
        targetQty: 0,
        actualQty: 0,
        defectQty: 0,
        isFmbForm: true,
        formCode: 9004,
        f9004_env,
        f9004_checks,
        f9004_items,
        workDetails: workDetailsText,
        status: targetStatus,
        notes: targetStatus === '임시저장'
          ? `[FMB보관실] ${currentWorkerName} 중간 저장 (${workHours}).`
          : `[FMB보관실] ${currentWorkerName} 작성 완료 (${workHours}).`
      };

      if (existingData?.id) {
        store.updateReport(existingData.id, reportData);
        if (targetStatus === '임시저장') {
          windowMock.showToast('📁 작업일보가 중간 저장되었습니다.', 'info');
        } else {
          windowMock.showToast('✅ 작업일보가 등록 완료되었습니다.', 'success');
        }
      } else {
        store.addReport(reportData);
        if (targetStatus === '임시저장') {
          windowMock.showToast('📁 FMB보관실 작업일보 중간 저장 성공!', 'info');
        } else {
          windowMock.showToast('✅ FMB보관실 작업일보 등록 완료 성공!', 'success');
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
      console.error('Error saving FMB storage report:', err);
      windowMock.showToast(`⚠️ 저장 중 오류가 발생했습니다: ${err.message}`, 'error');
    }
  };

  if (btnDraftSave) {
    btnDraftSave.addEventListener('click', () => processFmbSave('임시저장'));
  }
  if (btnFinalSubmit) {
    btnFinalSubmit.addEventListener('click', () => processFmbSave('승인 대기'));
  }
}

export function mountF9004InReportForm(container, existingData, loggedInWorkerName) {
  ['#leaderFormContainer', '#forkliftFormContainer', '#supportFormContainer'].forEach((sel) => {
    const el = container.querySelector(sel);
    if (el) el.style.display = 'none';
  });

  const hideOtherFixedBars = () => {
    ['standardFixedActionBar', 'leaderFixedActionBar', 'forkliftFixedActionBar'].forEach((barId) => {
      const barEl = document.getElementById(barId);
      if (barEl) barEl.style.display = 'none';
    });
  };
  hideOtherFixedBars();
  setTimeout(hideOtherFixedBars, 50);

  let fmbContainer = container.querySelector('#f9004FormContainer');
  if (!fmbContainer) {
    fmbContainer = document.createElement('div');
    fmbContainer.id = 'f9004FormContainer';
    const formEl = container.querySelector('#mobileWorkReportForm') || container;
    formEl.appendChild(fmbContainer);
  }
  if (fmbContainer._syncAbort) {
    fmbContainer._syncAbort.abort();
    fmbContainer._syncAbort = null;
  }
  fmbContainer.style.display = 'block';

  renderFmbPaperForm(fmbContainer, existingData, loggedInWorkerName);

  const paperHeader = fmbContainer.querySelector('[data-f9004-paper-header="1"]');
  if (paperHeader) paperHeader.style.display = 'none';

  const syncAbort = new AbortController();
  const syncDate = (val) => {
    const parts = String(val || '').split('-');
    if (parts.length === 3) {
      const fy = fmbContainer.querySelector('#f9004_year');
      const fm = fmbContainer.querySelector('#f9004_month');
      const fd = fmbContainer.querySelector('#f9004_day');
      if (fy) fy.value = parts[0].substring(2);
      if (fm) fm.value = parts[1];
      if (fd) fd.value = parts[2];
    }
  };

  const reportDate = container.querySelector('#reportDate');
  if (reportDate) {
    syncDate(reportDate.value);
    reportDate.addEventListener('change', (e) => syncDate(e.target.value), { signal: syncAbort.signal });
  }
  const stInput = container.querySelector('#startTimeInput');
  if (stInput) {
    const fSt = fmbContainer.querySelector('#f9004_startTime');
    if (fSt) {
      fSt.value = stInput.value;
      stInput.addEventListener('change', (e) => { fSt.value = e.target.value; }, { signal: syncAbort.signal });
    }
  }
  const etInput = container.querySelector('#endTimeInput');
  if (etInput) {
    const fEt = fmbContainer.querySelector('#f9004_endTime');
    if (fEt) {
      fEt.value = etInput.value;
      etInput.addEventListener('change', (e) => { fEt.value = e.target.value; }, { signal: syncAbort.signal });
    }
  }
  fmbContainer._syncAbort = syncAbort;
}

export function buildFmbDetailHTML(r) {
  const env = r?.f9004_env || {};
  const chkData = r?.f9004_checks || {};
  const items = Array.isArray(r?.f9004_items) ? r.f9004_items : [];
  const rowCount = Math.max(5, items.length);
  const statusClass = r?.status === '승인 완료' ? 'approved' : r?.status === '반려' ? 'rejected' : 'pending';

  return `
    <div class="print-report-sheet" data-form-code="9004" style="font-family: 'Noto Sans KR', sans-serif; color: #000; padding: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px;">
        <div>
          <h2 style="font-size: 24px; font-weight: 800; color: #000; letter-spacing: 2px; margin: 0;">FMB보관실 작업일보</h2>
          <div style="font-size: 13px; color: #475569; margin-top: 2px;">일보ID: ${escapeHtml(r?.id || '')} | 작성자: ${escapeHtml(r?.workerName || '')}</div>
        </div>
        <table style="border-collapse: collapse; border: 1px solid #000; font-size: 13px; text-align: center;">
          <tr>
            <td style="border: 1px solid #000; width: 45px; background: #f1f5f9; font-weight: 700;">작성</td>
            <td style="border: 1px solid #000; width: 45px; background: #f1f5f9; font-weight: 700;">승인</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; height: 35px; vertical-align: middle; font-weight: 700;">${escapeHtml(r?.workerName || '')}</td>
            <td style="border: 1px solid #000; height: 35px; vertical-align: middle;">${escapeHtml(r?.approver || '생산부장')}</td>
          </tr>
        </table>
      </div>

      <div style="background: linear-gradient(135deg, rgba(16,185,129,0.12), rgba(13,148,136,0.14)); border: 1px solid #10b981; border-radius: 3px; padding: 4px 8px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 4px;">
        <div style="display: flex; align-items: center; gap: 6px;">
          <span style="font-size: 13px;">🏷️</span>
          <div>
            <div style="font-size: 13px; font-weight: 800; color: #047857;">
              양식 고유번호: #${escapeHtml(r?.formCode || 9004)}
            </div>
            <div style="font-size: 13px; color: #1e293b; font-weight: 600;">
              [공통] 공통 - FMB보관실 공정 전용 양식
            </div>
          </div>
        </div>
        <span class="status-badge ${statusClass}" style="font-size: 13px; font-weight: 700;">
          ${escapeHtml(r?.status || '')}
        </span>
      </div>

      <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
        <div>작성일 : ${escapeHtml(r?.date || '')}</div>
        <div>근무시간 : ${escapeHtml(r?.workHours || '08:00 ~ 17:00')}</div>
        <div>온도 : ${escapeHtml(env.f9004_temp ? `${env.f9004_temp} ℃` : '-')} | 습도 : ${escapeHtml(env.f9004_humidity ? `${env.f9004_humidity} %` : '-')} ${env.f9004_envNote ? `(${escapeHtml(env.f9004_envNote)})` : ''}</div>
      </div>

      <div style="margin-bottom: 14px;">
        <div style="font-size: 13px; font-weight: 800; margin-bottom: 4px;">1. 보관실 온·습도 및 선입선출 일일 점검표</div>
        <table class="data-table print-table" style="border: 1px solid #000; font-size: 13px; width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f1f5f9; color: #000;">
              <th style="border: 1px solid #000; text-align: center; padding: 4px; width: 45px;">No</th>
              <th style="border: 1px solid #000; text-align: center; padding: 4px;">점검 항목</th>
              <th style="border: 1px solid #000; text-align: center; padding: 4px; width: 100px;">상태</th>
            </tr>
          </thead>
          <tbody>
            ${F9004_CHECKLIST_ITEMS.map((item, idx) => {
              const isGood = chkData[item.id] !== false;
              return `
                <tr>
                  <td style="border: 1px solid #000; text-align: center; padding: 4px; font-weight: 700;">${idx + 1}</td>
                  <td style="border: 1px solid #000; padding: 4px; font-weight: 600;">${escapeHtml(item.text)}</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 4px; font-weight: 800; color: ${isGood ? '#059669' : '#dc2626'};">
                    ${isGood ? '양호 (O)' : '불량 (X)'}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div style="margin-bottom: 14px;">
        <div style="font-size: 13px; font-weight: 800; margin-bottom: 4px;">2. 금일 입고 · 불출 및 재고 관리 내역</div>
        <table class="data-table print-table" style="border: 1px solid #000; font-size: 13px; width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f1f5f9; color: #000;">
              <th style="border: 1px solid #000; text-align: center; padding: 4px; width: 38px;">No</th>
              <th style="border: 1px solid #000; text-align: center; padding: 4px; width: 90px;">구분</th>
              <th style="border: 1px solid #000; text-align: center; padding: 4px; width: 95px;">차종</th>
              <th style="border: 1px solid #000; text-align: center; padding: 4px; width: 160px;">컴파운드 / LOT No.</th>
              <th style="border: 1px solid #000; text-align: center; padding: 4px; width: 100px;">수량</th>
              <th style="border: 1px solid #000; text-align: center; padding: 4px;">비고</th>
            </tr>
          </thead>
          <tbody>
            ${Array.from({ length: rowCount }, (_, idx) => {
              const row = items[idx] || {};
              return `
                <tr>
                  <td style="border: 1px solid #000; text-align: center; padding: 4px; font-weight: 700;">${idx + 1}</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 4px;">${escapeHtml(row.f9004_type || '')}</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 4px;">${escapeHtml(row.f9004_carModel || '')}</td>
                  <td style="border: 1px solid #000; text-align: left; padding: 4px;">${escapeHtml(row.f9004_compoundLot || '')}</td>
                  <td style="border: 1px solid #000; text-align: center; padding: 4px;">${escapeHtml(row.f9004_amount || '')}</td>
                  <td style="border: 1px solid #000; text-align: left; padding: 4px;">${escapeHtml(row.f9004_note || '')}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <div style="margin-bottom: 14px;">
        <div style="font-size: 13px; font-weight: 800; margin-bottom: 4px;">3. 금일 주요 작업 내용 및 특이사항</div>
        <div style="border: 1px solid #000; padding: 10px; min-height: 90px; font-size: 12px; white-space: pre-wrap;">${escapeHtml(r?.workDetails || '입력된 내용 없음')}</div>
      </div>
    </div>
  `;
}
