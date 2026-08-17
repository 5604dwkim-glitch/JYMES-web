/**
 * 50인 제조업체 공정별 작업일보 관리 시스템 - Report List Component (Refactored)
 * (store.js 공통 상수를 참조하도록 중복 배열 단일화 및 상세보기 렌더링 정돈)
 */

import { store, CAR_MODELS, DEFAULT_LEADER_ITEMS, DEFAULT_ATTENDANCE } from '../store.js';
import { i18n } from '../i18n.js';
import { renderReportForm } from './reportForm.js';

export function renderReportList(container) {
  const processes = store.getProcesses();
  const today = new Date().toISOString().split('T')[0];

  container.innerHTML = `
    <div class="report-list-view">
      <!-- 1. 다중 필터 바 -->
      <div class="filter-bar">
        <div class="filter-group">
          <div class="form-group" style="min-width: 120px;">
            <label style="font-size: 11px;">시작일</label>
            <input type="date" id="filterStartDate" class="form-control" style="padding: 6px 10px; font-size: 12px;" />
          </div>
          <div class="form-group" style="min-width: 120px;">
            <label style="font-size: 11px;">종료일</label>
            <input type="date" id="filterEndDate" class="form-control" style="padding: 6px 10px; font-size: 12px;" value="${today}" />
          </div>

          <div class="form-group" style="min-width: 110px;">
            <label style="font-size: 11px; color: var(--accent-emerald);">1차 차종</label>
            <select id="filterCarModel" class="form-control" style="padding: 6px 10px; font-size: 12px; border-color: var(--accent-emerald);">
              <option value="ALL">전체 차종</option>
              ${CAR_MODELS.map(c => `<option value="${c.code}">${c.code}</option>`).join('')}
            </select>
          </div>

          <div class="form-group" style="min-width: 120px;">
            <label style="font-size: 11px; color: var(--accent-cyan);">2차 공정</label>
            <select id="filterProcess" class="form-control" style="padding: 6px 10px; font-size: 12px; border-color: var(--accent-cyan);">
              <option value="ALL">전체 공정</option>
              ${processes.map(p => `<option value="${p.name}">${p.name}</option>`).join('')}
            </select>
          </div>

          <div class="form-group" style="min-width: 110px;">
            <label style="font-size: 11px;">승인 상태</label>
            <select id="filterStatus" class="form-control" style="padding: 6px 10px; font-size: 12px;">
              <option value="ALL">전체 상태</option>
              <option value="임시저장">임시저장만</option>
              <option value="승인 대기">승인 대기만</option>
              <option value="승인 완료">승인 완료만</option>
              <option value="반려">반려 건만</option>
            </select>
          </div>

          <div class="form-group" style="min-width: 160px;">
            <label style="font-size: 11px;">통합 검색</label>
            <input type="text" id="filterSearch" class="form-control" style="padding: 6px 10px; font-size: 12px;" placeholder="작업자(장수미 등), 품목, 일보ID" />
          </div>
        </div>

        <div style="display: flex; gap: 8px; align-self: flex-end; width: 100%; justify-content: flex-end; margin-top: 8px;">
          <button class="btn btn-secondary btn-sm" id="btnResetFilters">초기화</button>
          <button class="btn btn-primary btn-sm" id="btnAddNewReport">
            <span>➕</span> 신규 일보 작성
          </button>
        </div>
      </div>

      <!-- 2. 상단 일괄 승인/삭제 바 -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 13px; color: var(--text-muted);">
        <div>
          <span>조회 결과: </span>
          <strong id="filteredCountText" style="color: var(--accent-cyan);">0</strong>건
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-success btn-sm" id="btnBulkApprove">선택 항목 일괄 승인</button>
          <button class="btn btn-danger btn-sm" id="btnBulkDelete">선택 항목 일괄 삭제</button>
        </div>
      </div>

      <!-- 3. 데이터 테이블 -->
      <div class="table-container">
        <table class="data-table" id="reportTable">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;"><input type="checkbox" id="selectAllCheckbox" /></th>
              <th>일보 ID</th>
              <th>양식 구분</th>
              <th>작업일자 & 근무시간</th>
              <th>차종</th>
              <th>공정명</th>
              <th>작업자</th>
              <th>생산 품목</th>
              <th style="text-align: right;">생산완료</th>
              <th style="text-align: right;">불량</th>
              <th style="text-align: right;">달성률</th>
              <th>상태</th>
              <th style="text-align: center;">관리</th>
            </tr>
          </thead>
          <tbody id="reportTableBody">
            <!-- Dynamic Render -->
          </tbody>
        </table>
      </div>
    </div>

    <!-- 4. 상세 보기 및 인쇄 모달 -->
    <div class="modal-backdrop" id="reportDetailModal">
      <div class="modal-content" style="max-width: 820px;">
        <div class="modal-header">
          <div class="modal-title">📄 공정 작업일보 상세 정보</div>
          <button class="modal-close" id="btnCloseModal">&times;</button>
        </div>
        <div class="modal-body" id="modalReportBody">
          <!-- Dynamic Content -->
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btnPrintReport"><span>🖨️</span> 인쇄 / PDF 출력</button>
          <button class="btn btn-danger" id="btnRejectReportModal">반려</button>
          <button class="btn btn-success" id="btnApproveReportModal">관리자 승인</button>
        </div>
      </div>
    </div>
  `;

  setupTableEvents(container);
}

function setupTableEvents(container) {
  const tableBody = container.querySelector('#reportTableBody');
  const countText = container.querySelector('#filteredCountText');

  const filterStartDate = container.querySelector('#filterStartDate');
  const filterEndDate = container.querySelector('#filterEndDate');
  const filterCarModel = container.querySelector('#filterCarModel');
  const filterProcess = container.querySelector('#filterProcess');
  const filterStatus = container.querySelector('#filterStatus');
  const filterSearch = container.querySelector('#filterSearch');
  const selectAllCheckbox = container.querySelector('#selectAllCheckbox');

  let currentSelectedReportId = null;

  function renderTable() {
    const filters = {
      startDate: filterStartDate.value,
      endDate: filterEndDate.value,
      carModel: filterCarModel.value,
      processName: filterProcess.value,
      status: filterStatus.value,
      searchQuery: filterSearch.value
    };

    const filtered = store.getReports(filters);
    countText.textContent = filtered.length;

    if (filtered.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="13" style="text-align: center; padding: 40px; color: var(--text-dim);">
            조건에 일치하는 작업일보 데이터가 없습니다.
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = filtered.map(r => `
      <tr>
        <td style="text-align: center;">
          <input type="checkbox" class="row-checkbox" data-id="${r.id}" />
        </td>
        <td style="font-family: monospace; font-weight: 700; color: var(--accent-cyan);">${r.id}</td>
        <td>
          ${r.isLeaderForm ? `
            <span style="font-weight: 700; color: var(--accent-purple); background: rgba(124, 58, 237, 0.12); padding: 2px 6px; border-radius: 4px; font-size: 11px;">
              📋 작업일보(반장)
            </span>
          ` : `
            <span style="font-size: 11px; color: var(--text-muted);">📱 모바일</span>
          `}
        </td>
        <td>
          <div>${r.date}</div>
          <div style="font-size: 10px; color: var(--text-muted); font-family: monospace;">(${r.workHours || '08:00 ~ 17:00'})</div>
        </td>
        <td>
          <span style="font-weight: 700; color: var(--accent-emerald); background: rgba(5,150,105,0.12); padding: 2px 6px; border-radius: 4px; font-size: 11px;">
            ${r.carModel}
          </span>
        </td>
        <td>
          <span style="font-weight: 700;">${r.processName}</span>
        </td>
        <td style="font-weight: 700; color: ${r.workerName === '장수미' ? 'var(--accent-purple)' : 'var(--text-main)'};">
          ${r.workerName}
        </td>
        <td>
          <div style="font-weight: 600;">${r.itemName || '인벨트 외 9종'}</div>
        </td>
        <td style="text-align: right; font-weight: 700; color: var(--accent-emerald);">${r.actualQty.toLocaleString()} EA</td>
        <td style="text-align: right; color: ${r.defectQty > 0 ? 'var(--accent-rose)' : 'var(--text-muted)'};">${r.defectQty.toLocaleString()} EA</td>
        <td style="text-align: right; font-weight: 700;">${r.attainmentRate}%</td>
        <td>
          <span class="status-badge ${r.status === '승인 완료' ? 'approved' : r.status === '반려' ? 'rejected' : r.status === '임시저장' ? 'draft' : 'pending'}">
            ${r.status}
          </span>
        </td>
        <td style="text-align: center;">
          <div style="display: flex; gap: 4px; justify-content: center;">
            <button class="btn btn-secondary btn-sm btn-view-detail" data-id="${r.id}" title="상세보기">👁️</button>
            <button class="btn btn-secondary btn-sm btn-edit-report" data-id="${r.id}" title="수정">✏️</button>
            <button class="btn btn-danger btn-sm btn-delete-report" data-id="${r.id}" title="삭제">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');

    tableBody.querySelectorAll('.btn-view-detail').forEach(btn => {
      btn.addEventListener('click', () => openDetailModal(btn.dataset.id));
    });

    tableBody.querySelectorAll('.btn-edit-report').forEach(btn => {
      btn.addEventListener('click', () => {
        window.editReportId = btn.dataset.id;
        if (window.appInstance) {
          window.appInstance.switchTab('form');
        }
      });
    });

    tableBody.querySelectorAll('.btn-delete-report').forEach(btn => {
      btn.addEventListener('click', () => {
        if (confirm(`작업일보(${btn.dataset.id})를 삭제하시겠습니까?`)) {
          store.deleteReport(btn.dataset.id);
          window.showToast('작업일보가 삭제되었습니다.', 'info');
          renderTable();
        }
      });
    });

    i18n.applyTranslations(container);
  }

  [filterStartDate, filterEndDate, filterCarModel, filterProcess, filterStatus, filterSearch].forEach(elem => {
    if (elem) elem.addEventListener('change', renderTable);
  });
  filterSearch.addEventListener('input', renderTable);

  renderTable();

  container.querySelector('#btnResetFilters').addEventListener('click', () => {
    filterStartDate.value = '';
    filterEndDate.value = new Date().toISOString().split('T')[0];
    filterCarModel.value = 'ALL';
    filterProcess.value = 'ALL';
    filterStatus.value = 'ALL';
    filterSearch.value = '';
    renderTable();
  });

  container.querySelector('#btnAddNewReport').addEventListener('click', () => {
    window.editReportId = null;
    if (window.appInstance) {
      window.appInstance.switchTab('form');
    }
  });

  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', () => {
      const checkboxes = tableBody.querySelectorAll('.row-checkbox');
      checkboxes.forEach(cb => cb.checked = selectAllCheckbox.checked);
    });
  }

  container.querySelector('#btnBulkApprove').addEventListener('click', () => {
    const selectedIds = Array.from(tableBody.querySelectorAll('.row-checkbox:checked')).map(cb => cb.dataset.id);
    if (selectedIds.length === 0) {
      alert('일괄 승인할 작업일보를 선택해주세요.');
      return;
    }

    if (confirm(`선택한 ${selectedIds.length}건의 작업일보를 일괄 승인하시겠습니까?`)) {
      const approvedCount = store.bulkApproveReports(selectedIds, '생산총괄 부장');
      window.showToast(`${approvedCount}건의 작업일보가 승인 완료되었습니다.`, 'success');
      if (selectAllCheckbox) selectAllCheckbox.checked = false;
      renderTable();
    }
  });

  container.querySelector('#btnBulkDelete').addEventListener('click', () => {
    const selectedIds = Array.from(tableBody.querySelectorAll('.row-checkbox:checked')).map(cb => cb.dataset.id);
    if (selectedIds.length === 0) {
      alert('일괄 삭제할 작업일보를 선택해주세요.');
      return;
    }

    if (confirm(`선택한 ${selectedIds.length}건의 작업일보를 정말로 일괄 삭제하시겠습니까?`)) {
      const deletedCount = store.bulkDeleteReports(selectedIds);
      window.showToast(`${deletedCount}건의 작업일보가 일괄 삭제되었습니다.`, 'info');
      if (selectAllCheckbox) selectAllCheckbox.checked = false;
      renderTable();
    }
  });

  const modal = container.querySelector('#reportDetailModal');
  const modalBody = container.querySelector('#modalReportBody');
  const btnCloseModal = container.querySelector('#btnCloseModal');
  const btnPrintReport = container.querySelector('#btnPrintReport');
  const btnApproveReportModal = container.querySelector('#btnApproveReportModal');
  const btnRejectReportModal = container.querySelector('#btnRejectReportModal');

  function openDetailModal(id) {
    try {
      currentSelectedReportId = id;
      const r = store.getReportById(id);
      if (!r) return;

    if (r.isLeaderForm || r.workerName === '장수미') {
      const leaderItems = r.leaderFormItems && r.leaderFormItems.length > 0 ? r.leaderFormItems : DEFAULT_LEADER_ITEMS;
      const att = r.attendanceData || DEFAULT_ATTENDANCE;
      let attTotal = 50;
      let attPresent = 48;
      let attAbsent = 2;
      let attAnnualLeave = 1;
      let attSickLeave = 0;
      let attHalfLeave = 1;
      let attReason = '연차 1명, 반차 1명';

      if (att) {
        if (att.total !== undefined) {
          attTotal = att.total;
          attPresent = att.present;
          attAbsent = att.absent;
          attAnnualLeave = att.annualLeave !== undefined ? att.annualLeave : (att.absent || 0);
          attSickLeave = att.sickLeave || 0;
          attHalfLeave = att.halfLeave || 0;
          attReason = att.reason || '전원 정상출근';
        } else if (att.buildingB) {
          attTotal = (att.buildingB.total || 0) + (att.buildingC?.total || 0) + (att.buildingD?.total || 0);
          attPresent = (att.buildingB.present || 0) + (att.buildingC?.present || 0) + (att.buildingD?.present || 0);
          attAbsent = (att.buildingB.absent || 0) + (att.buildingC?.absent || 0) + (att.buildingD?.absent || 0);
          attAnnualLeave = attAbsent;
          attSickLeave = 0;
          attHalfLeave = 0;
          attReason = att.buildingB.reason || '연차';
        }
      }

      modalBody.innerHTML = `
        <div class="print-report-sheet" style="font-family: 'Noto Sans KR', sans-serif; color: #000; padding: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px;">
            <div>
              <h2 style="font-size: 24px; font-weight: 800; color: #000; letter-spacing: 2px;">작 업 일 보 (반장)</h2>
              <div style="font-size: 11px; color: #475569; margin-top: 2px;">일보ID: ${r.id} | 작성자: ${r.workerName}</div>
            </div>

            <table style="border-collapse: collapse; border: 1px solid #000; font-size: 11px; text-align: center;">
              <tr>
                <td style="border: 1px solid #000; width: 45px; background: #f1f5f9; font-weight: 700;">작성</td>
                <td style="border: 1px solid #000; width: 45px; background: #f1f5f9; font-weight: 700;">승인</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; height: 35px; vertical-align: middle; font-weight: 700;">${r.workerName}</td>
                <td style="border: 1px solid #000; height: 35px; vertical-align: middle;">${r.approver || '생산부장'}</td>
              </tr>
            </table>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; margin-bottom: 10px;">
            <div>작성일 : ${r.date}</div>
            <div>근무시간 : ${r.workHours || '08:00 ~ 17:00'}</div>
          </div>

          <div style="margin-bottom: 14px;">
            <div style="font-size: 13px; font-weight: 800; margin-bottom: 4px;">1. 생산현황</div>
            <table class="data-table print-table" style="border: 1px solid #000; font-size: 11px; width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f1f5f9; color: #000;">
                  <th style="border: 1px solid #000; text-align: center; padding: 4px; width: 45px;">순번</th>
                  <th style="border: 1px solid #000; text-align: center; padding: 4px; width: 150px;">아이템</th>
                  <th style="border: 1px solid #000; text-align: center; padding: 4px; width: 120px;">포장완료 수량</th>
                  <th style="border: 1px solid #000; text-align: center; padding: 4px; width: 90px;">수정이동</th>
                  <th style="border: 1px solid #000; text-align: center; padding: 4px;" colspan="4">스크랩 (불량 구분)</th>
                </tr>
              </thead>
              <tbody>
                ${leaderItems.map((it, idx) => `
                  <tr>
                    <td style="border: 1px solid #000; text-align: center; padding: 4px;">${idx + 1}</td>
                    <td style="border: 1px solid #000; padding: 4px; font-weight: 700;">${it.name}</td>
                    <td style="border: 1px solid #000; text-align: right; padding: 4px; font-weight: 700;">${it.packedQty ? it.packedQty.toLocaleString() : 0}</td>
                    <td style="border: 1px solid #000; text-align: right; padding: 4px;">${it.reworkQty ? it.reworkQty.toLocaleString() : 0}</td>
                    ${it.name === 'KM/KX Hood' ? `
                      <td style="border: 1px solid #000; text-align: center; padding: 4px;" colspan="2">센터: ${it.scrapCenter || 0}</td>
                      <td style="border: 1px solid #000; text-align: center; padding: 4px;" colspan="2">사이드: ${it.scrapSide || 0}</td>
                    ` : `
                      <td style="border: 1px solid #000; text-align: right; padding: 4px;">A: ${it.scrapA || 0}</td>
                      <td style="border: 1px solid #000; text-align: right; padding: 4px;">B: ${it.scrapB || 0}</td>
                      <td style="border: 1px solid #000; text-align: right; padding: 4px;">C: ${it.scrapC || 0}</td>
                      <td style="border: 1px solid #000; text-align: right; padding: 4px;">D: ${it.scrapD || 0}</td>
                    `}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="margin-bottom: 14px;">
            <div style="font-size: 13px; font-weight: 800; margin-bottom: 4px;">2. 근태현황</div>
            <table class="data-table print-table" style="border: 1px solid #000; font-size: 11px; width: 100%; border-collapse: collapse; margin-bottom: 6px;">
              <thead>
                <tr style="background: #f1f5f9; color: #000;">
                  <th style="border: 1px solid #000; text-align: center; padding: 6px;">총원</th>
                  <th style="border: 1px solid #000; text-align: center; padding: 6px;">출근</th>
                  <th style="border: 1px solid #000; text-align: center; padding: 6px;">결근</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="border: 1px solid #000; text-align: center; font-weight: 700; padding: 6px;">${attTotal} 명</td>
                  <td style="border: 1px solid #000; text-align: center; font-weight: 700; color: #059669; padding: 6px;">${attPresent} 명</td>
                  <td style="border: 1px solid #000; text-align: center; font-weight: 700; color: ${attAbsent > 0 ? '#dc2626' : '#000'}; padding: 6px;">${attAbsent} 명</td>
                </tr>
              </tbody>
            </table>

            <div style="border: 1px solid #000; padding: 6px 12px; font-size: 11px; background: #fafafa; display: flex; gap: 16px; align-items: center;">
              <span><strong>📋 근태 사유 상세:</strong></span>
              <span>연차: <strong>${attAnnualLeave}</strong>명</span>
              <span>병가: <strong>${attSickLeave}</strong>명</span>
              <span>반차: <strong>${attHalfLeave}</strong>명</span>
              <span style="color: var(--text-muted); margin-left: auto;">(${attReason})</span>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; font-size: 10px; color: #64748b; font-family: monospace; border-top: 1px solid #000; padding-top: 8px;">
            <span>HSC-DT-005</span>
            <span>A4 (210×297 mm)</span>
          </div>
        </div>
      `;
    } else {
      // ── 입력창 고유번호(FORM_CODE) 맵 ──────────────────────
      const FORM_CODE_MAP = {
        'JG1_인벨트_소재준비': 1001, 'JG1_인벨트_조인트': 1002, 'JG1_인벨트_후가공': 1003, 'JG1_인벨트_검사포장': 1004,
        "JG1_RR C PART'G_조인트": 1011, "JG1_RR C PART'G_후가공": 1012, "JG1_RR C PART'G_검사포장": 1013,
        "JG1_G/RUN 'E'_소재준비": 1021, "JG1_G/RUN 'E'_조인트": 1022, "JG1_G/RUN 'E'_후가공": 1023, "JG1_G/RUN 'E'_검사포장": 1024,
        'JG1S_인벨트_소재준비': 1031, 'JG1S_인벨트_조인트': 1032, 'JG1S_인벨트_후가공': 1033, 'JG1S_인벨트_검사포장': 1034,
        "JG1S_G/RUN 'E'_소재준비": 1041, "JG1S_G/RUN 'E'_조인트": 1042, "JG1S_G/RUN 'E'_후가공": 1043, "JG1S_G/RUN 'E'_검사포장": 1044,
        'DT CREW_D/SIDE_클립머신': 2001, 'DT CREW_D/SIDE_소재준비': 2002, 'DT CREW_D/SIDE_조인트': 2003, 'DT CREW_D/SIDE_후가공': 2004, 'DT CREW_D/SIDE_검사포장': 2005,
        'DT QUAD_D/SIDE_클립머신': 2011, 'DT QUAD_D/SIDE_소재준비': 2012, 'DT QUAD_D/SIDE_조인트': 2013, 'DT QUAD_D/SIDE_후가공': 2014, 'DT QUAD_D/SIDE_검사포장': 2015,
        'DS CREW_D/SIDE_소재준비(A)': 2021, 'DS CREW_D/SIDE_소재준비(C)': 2022, 'DS CREW_D/SIDE_소재준비(D)': 2023, 'DS CREW_D/SIDE_조인트': 2024, 'DS CREW_D/SIDE_조인트(D)': 2025, 'DS CREW_D/SIDE_후가공': 2026, 'DS CREW_D/SIDE_검사포장': 2027,
        'DS STD_D/SIDE_소재준비(A)': 2031, 'DS STD_D/SIDE_소재준비(C)': 2032, 'DS STD_D/SIDE_조인트': 2033, 'DS STD_D/SIDE_후가공': 2034, 'DS STD_D/SIDE_검사포장': 2035,
        'KM/KX_HOOD SURROUND_클립머신': 2041, 'KM/KX_HOOD SURROUND_조인트': 2042, 'KM/KX_HOOD SURROUND_후가공': 2043, 'KM/KX_HOOD SURROUND_검사포장': 2044,
        'JL_D/SIDE_조인트': 2051, 'JL_D/SIDE_후가공': 2052, 'JL_D/SIDE_검사포장': 2053,
        'JT_D/SIDE_조인트': 2061, 'JT_D/SIDE_후가공': 2062, 'JT_D/SIDE_검사포장': 2063,
        'WS_D/SIDE_조인트': 2071, 'WS_D/SIDE_후가공': 2072, 'WS_D/SIDE_검사포장': 2073,
        'NQ5_G/RUN_소재준비': 3001, 'NQ5_G/RUN_조인트': 3002, 'NQ5_G/RUN_후가공': 3003, 'NQ5_G/RUN_검사포장': 3004,
        'MQ4_인벨트_소재준비': 3011, 'MQ4_인벨트_조인트': 3012, 'MQ4_인벨트_후가공': 3013, 'MQ4_인벨트_검사포장': 3014,
        'KA4_G/RUN_소재준비': 3021
      };
      
      // ── 동적 섹션 순번 계산 및 렌더링 ────────────────────────
      let secIndex = 1;
      const thStyle = 'border: 1px solid #000; padding: 4px; text-align: center;';
      const tdStyle = 'border: 1px solid #000; padding: 4px; text-align: center;';
      const td = (val) => `<td style="${tdStyle}">${val !== undefined && val !== null ? val : ''}</td>`;
      const tdBold = (val, color) => `<td style="${tdStyle} font-weight: 800; color: ${color || '#000'};">${val !== undefined && val !== null ? val : ''}</td>`;

      // ── 1. 기본 정보 카드 (Step 1) ────────────────────────
      const cardDateTime = `
        <div class="card" style="padding: 10px 14px; margin-bottom: 10px; border: 1px solid var(--border-color); background: var(--bg-card);">
          <label style="font-size: 12px; font-weight: 700; color: var(--accent-cyan); margin-bottom: 6px; display: block;">
            📅 1. 작업 기본 정보
          </label>
          <table class="data-table" style="width: 100%; border-collapse: collapse; border: 1px solid var(--border-color); font-size: 11px;">
            <tbody>
              <tr>
                <th style="width: 18%; background: #f8fafc; font-weight: 700; padding: 4px 6px;">작업 일자</th>
                <td style="width: 32%; font-weight: 600; padding: 4px 6px;">${r.date}</td>
                <th style="width: 18%; background: #f8fafc; font-weight: 700; padding: 4px 6px;">근무 시간</th>
                <td style="width: 32%; font-weight: 600; padding: 4px 6px;">${r.workHours || '08:00 ~ 17:00'}</td>
              </tr>
              <tr>
                <th style="background: #f8fafc; font-weight: 700; padding: 4px 6px;">작업자</th>
                <td style="font-weight: 700; color: var(--accent-cyan); padding: 4px 6px;">${r.workerName}</td>
                <th style="background: #f8fafc; font-weight: 700; padding: 4px 6px;">생산 품목</th>
                <td style="font-weight: 700; padding: 4px 6px;">[${r.itemCode}] ${r.itemName}</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;

      // ── 2. 생산 실적 종합 요약 카드 (Step 2) ────────────────
      const cardSummary = `
        <div class="card" style="padding: 10px 14px; margin-bottom: 10px; border: 1px solid var(--border-color); background: var(--bg-card);">
          <label style="font-size: 12px; font-weight: 700; color: var(--accent-emerald); margin-bottom: 6px; display: block;">
            📊 2. 생산 실적 종합 요약
          </label>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; text-align: center;">
            <div style="background: #f8fafc; padding: 6px; border-radius: 6px; border: 1px solid var(--border-color);">
              <div style="font-size: 10px; color: var(--text-muted); font-weight: 600;">목표 수량</div>
              <div style="font-size: 14px; font-weight: 800; color: var(--text-main); margin-top: 2px;">${(r.targetQty || 0).toLocaleString()} EA</div>
            </div>
            <div style="background: rgba(16,185,129,0.08); padding: 6px; border-radius: 6px; border: 1px solid rgba(16,185,129,0.2);">
              <div style="font-size: 10px; color: #047857; font-weight: 600;">생산 완료량</div>
              <div style="font-size: 14px; font-weight: 800; color: #047857; margin-top: 2px;">${(r.actualQty || 0).toLocaleString()} EA</div>
            </div>
            <div style="background: rgba(244,63,94,0.08); padding: 6px; border-radius: 6px; border: 1px solid rgba(244,63,94,0.2);">
              <div style="font-size: 10px; color: #be123c; font-weight: 600;">불량 수량</div>
              <div style="font-size: 14px; font-weight: 800; color: #be123c; margin-top: 2px;">${(r.defectQty || 0).toLocaleString()} EA</div>
            </div>
            <div style="background: rgba(99,102,241,0.08); padding: 6px; border-radius: 6px; border: 1px solid rgba(99,102,241,0.2);">
              <div style="font-size: 10px; color: var(--accent-purple); font-weight: 600;">목표 달성률</div>
              <div style="font-size: 14px; font-weight: 800; color: var(--accent-purple); margin-top: 2px;">${r.attainmentRate || 0}%</div>
            </div>
          </div>
        </div>
      `;

      // --- 새로 추가된 로직: renderReportForm을 활용한 100% 동일한 양식 렌더링 ---
      const tempContainer = document.createElement('div');
      // 기존 폼 화면을 완전히 렌더링 (DOM 이벤트 및 값 채우기 포함)
      renderReportForm(tempContainer, id);

      // 필요한 동적 영역만 추출
      const materialLotsSection = tempContainer.querySelector('#section4Card');
      const dynamicSection = tempContainer.querySelector('#section5DynamicContainer');
      const qtySection = tempContainer.querySelector('#qtySection');
      const downtimeSection = tempContainer.querySelector('#downtimeCard');

      const makeReadOnly = (el) => {
        if (!el) return '';
        const clone = el.cloneNode(true);
        
        const inputs = clone.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
          if (input.type === 'hidden') return;
          const span = document.createElement('span');
          span.style.fontWeight = 'bold';
          span.style.color = '#0369a1'; // 강조색
          span.style.fontSize = '12px';
          span.style.padding = '0 4px';
          
          if (input.tagName === 'SELECT') {
             span.textContent = input.options[input.selectedIndex]?.text || '';
          } else if (input.type === 'checkbox' || input.type === 'radio') {
             span.textContent = input.checked ? '[O]' : '[X]';
          } else {
             span.textContent = input.value || '';
          }
          input.parentNode.replaceChild(span, input);
        });

        // 불필요한 버튼이나 아이콘 제거
        const buttons = clone.querySelectorAll('button, .remove-btn, .add-btn');
        buttons.forEach(btn => btn.style.display = 'none');
        
        // 추가 입력 힌트용 p 태그 등 숨김
        const hints = clone.querySelectorAll('p[style*="var(--text-muted)"]');
        hints.forEach(hint => hint.style.display = 'none');

        clone.style.pointerEvents = 'none';
        return clone.outerHTML;
      };

      const cardDynamicContent = 
        makeReadOnly(materialLotsSection) + 
        makeReadOnly(dynamicSection) + 
        makeReadOnly(qtySection) + 
        makeReadOnly(downtimeSection);


      const cardNotes = `
        <div class="card" style="padding: 10px 14px; margin-bottom: 10px; border: 1px solid var(--border-color); background: var(--bg-card);">
          <label style="font-size: 12px; font-weight: 700; color: var(--text-main); margin-bottom: 6px; display: block;">
            📝 <span class="sec-num"></span> 작업 특이사항
          </label>
          <div style="background: #ffffff; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 11px; min-height: 32px; line-height: 1.5;">
            ${r.notes || '특이사항 없음.'}
          </div>
        </div>
      `;

      modalBody.innerHTML = `
        <div class="print-report-sheet" style="font-size: 12px; max-width: 800px; margin: 0 auto;">
          <!-- 상단 인쇄 및 결재용 헤더 -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 6px; margin-bottom: 10px;">
            <div>
              <h2 style="font-size: 18px; font-weight: 800; color: #000; margin: 0;">공 정 작 업 일 보</h2>
              <div style="font-size: 10px; color: var(--text-muted); margin-top: 2px;">일보 번호: ${r.id} | 작성일시: ${r.createdAt || r.date}</div>
            </div>

            <table style="border-collapse: collapse; border: 1px solid #000; font-size: 10px; text-align: center;">
              <tr>
                <td style="border: 1px solid #000; width: 44px; background: #f1f5f9; font-weight: 700; padding: 2px 4px;">작성</td>
                <td style="border: 1px solid #000; width: 44px; background: #f1f5f9; font-weight: 700; padding: 2px 4px;">승인</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; height: 26px; vertical-align: middle; font-weight: 700; color: var(--accent-cyan); padding: 2px 4px;">${r.workerName}</td>
                <td style="border: 1px solid #000; height: 26px; vertical-align: middle; font-weight: 600; padding: 2px 4px;">${r.approver || '승인 대기'}</td>
              </tr>
            </table>
          </div>

          <!-- 🏷️ 양식 고유번호 뱃지 바 (입력창과 동일) -->
          <div style="background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.12)); border: 1.5px solid var(--accent-purple); border-radius: 6px; padding: 6px 10px; margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 15px;">🏷️</span>
              <div>
                <div style="font-size: 12px; font-weight: 800; color: var(--accent-purple);">
                  양식 고유번호: #${r.formCode}
                </div>
                <div style="font-size: 10.5px; color: var(--text-main); font-weight: 600;">
                  [${r.carModel}] ${r.itemName || 'D/SIDE'} - ${r.processName} 공정 전용 양식
                </div>
              </div>
            </div>
            <span class="status-badge ${r.status === '승인 완료' ? 'approved' : r.status === '반려' ? 'rejected' : 'pending'}" style="font-size: 10px; font-weight: 700;">
              ${r.status}
            </span>
          </div>

          <!-- 1. 기본 정보 카드 -->
          ${cardDateTime}

          <!-- 2. 생산 실적 요약 카드 -->
          ${cardSummary}

          <!-- 동적 렌더링된 폼 내용 삽입 (소재 LOT, 치수, 가류조건, 생산실적, 비가동 등) -->
          ${cardDynamicContent}

          <!-- 작업 특이사항 카드 -->
          ${cardNotes}

          <!-- 최종 승인 상태 바 -->
          <div style="display: flex; justify-content: space-between; align-items: center; background: #f8fafc; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border-color);">
            <div>
              <span style="color: var(--text-muted); font-size: 11px;">최종 승인 상태:</span>
              <span class="status-badge ${r.status === '승인 완료' ? 'approved' : r.status === '반려' ? 'rejected' : 'pending'}" style="margin-left: 6px;">
                ${r.status}
              </span>
            </div>
            <div style="font-size: 11px; color: var(--text-muted);">
              ${r.approver ? `승인자: <strong>${r.approver}</strong> (${r.approvedAt || ''})` : '승인 대기중'}
            </div>
          </div>
        </div>
      `;
    }

    // 동적 렌더링된 폼 요소들의 번호를 3번(소재 LOT 번호)부터 순차적으로 부여 (1. 기본정보, 2. 요약에 이어 3부터 시작)
    let currentSecIdx = 3;
    modalBody.querySelectorAll('.sec-num').forEach(el => {
      el.textContent = currentSecIdx + '.';
      currentSecIdx++;
    });

    modal.classList.add('active');
    } catch(err) {
      alert("상세보기 오류: " + err.message);
      console.error(err);
    }
  }

  btnCloseModal.addEventListener('click', () => modal.classList.remove('active'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });

  // 인쇄 전용 완전 격리 iframe 인쇄 실행 (메인 페이지 DOM/CSS 간섭 100% 차단 -> 52페이지 버그 완전 해결)
  btnPrintReport.addEventListener('click', () => {
    const printSheet = modalBody.querySelector('.print-report-sheet');
    if (!printSheet) {
      window.print();
      return;
    }
    printIsolatedReport(printSheet, '공정작업일보');
  });

  btnApproveReportModal.addEventListener('click', () => {
    if (currentSelectedReportId) {
      store.approveReport(currentSelectedReportId, '생산총괄 부장');
      window.showToast('작업일보 승인이 완료되었습니다.', 'success');
      modal.classList.remove('active');
      renderTable();
    }
  });

  btnRejectReportModal.addEventListener('click', () => {
    if (currentSelectedReportId) {
      const reason = prompt('반려 사유를 입력하세요:');
      if (reason) {
        store.rejectReport(currentSelectedReportId, '품질관리 팀장', reason);
        window.showToast('작업일보가 반려 처리되었습니다.', 'info');
        modal.classList.remove('active');
        renderTable();
      }
    }
  });
}

/**
 * 인쇄 전용 숨김 iframe 생성 및 격리 인쇄 (A4 1~2페이지 이내 보장 레이아웃)
 */
export function printIsolatedReport(element, title = '공정작업일보') {
  if (!element) return;
  
  const oldIframe = document.getElementById('printIsolatedIframe');
  if (oldIframe) oldIframe.remove();
  
  const iframe = document.createElement('iframe');
  iframe.id = 'printIsolatedIframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <link rel="stylesheet" as="style" crossorigin href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700;800;900&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4 portrait;
          margin: 6mm 6mm 6mm 6mm;
        }
        * {
          box-sizing: border-box;
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        body {
          margin: 0;
          padding: 0;
          font-family: 'Pretendard', 'Noto Sans KR', sans-serif;
          color: #000;
          background: #fff;
          font-size: 9.5px;
          line-height: 1.25;
        }
        .print-report-sheet {
          width: 100%;
          max-width: 100%;
          margin: 0 auto;
          padding: 0;
        }
        h2 {
          font-size: 16px !important;
          margin: 0 0 2px 0 !important;
          letter-spacing: 1px !important;
        }
        .card {
          border: 1px solid #94a3b8 !important;
          border-radius: 4px !important;
          padding: 5px 8px !important;
          margin-bottom: 5px !important;
          page-break-inside: avoid !important;
          background: #fff !important;
          box-shadow: none !important;
        }
        label {
          font-size: 10.5px !important;
          font-weight: 700 !important;
          margin-bottom: 3px !important;
          display: block !important;
        }
        table, .data-table {
          width: 100% !important;
          border-collapse: collapse !important;
          page-break-inside: avoid !important;
          margin-bottom: 2px !important;
        }
        th, td {
          border: 1px solid #475569 !important;
          padding: 2px 4px !important;
          font-size: 9px !important;
          line-height: 1.2 !important;
        }
        th {
          background-color: #f1f5f9 !important;
          font-weight: 700 !important;
        }
        img {
          max-height: 85px !important;
          max-width: 90% !important;
          width: auto !important;
          height: auto !important;
          object-fit: contain !important;
          display: block !important;
          margin: 2px auto !important;
        }
        .status-badge {
          display: inline-block;
          padding: 1px 6px;
          border-radius: 3px;
          font-weight: 700;
          font-size: 9.5px;
          border: 1px solid #ccc;
        }
        .status-badge.approved { background: #dcfce7 !important; color: #166534 !important; border-color: #86efac; }
        .status-badge.rejected { background: #fee2e2 !important; color: #991b1b !important; border-color: #fca5a5; }
        .status-badge.pending { background: #fef9c3 !important; color: #854d0e !important; border-color: #fde047; }
        
        button, input, select, textarea, .modal-header, .modal-footer, .modal-close {
          display: none !important;
        }
        div[style*="margin-bottom"] {
          margin-bottom: 4px !important;
        }
        div[style*="padding: 16px"], div[style*="padding: 12px"] {
          padding: 4px 6px !important;
        }
        div[style*="min-height: 50px"] {
          min-height: 22px !important;
          padding: 3px 6px !important;
        }
        div[style*="font-size: 16px"] {
          font-size: 13px !important;
        }
      </style>
    </head>
    <body>
      ${element.outerHTML}
    </body>
    </html>
  `);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => {
      iframe.remove();
    }, 1500);
  }, 250);
}
