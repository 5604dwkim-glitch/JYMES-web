/**
 * 50인 제조업체 공정별 작업일보 관리 시스템 - Draft Reports Component
 * (작성중/임시저장 상태의 작업일보 목록 및 이어서 작성/제출 관리)
 */

import { store } from '../store.js';
import { i18n } from '../i18n.js';

let isDraftMinimized = true;

export function renderDraftReports(container) {
  const userRoleInfo = store.getUserRole();
  const loggedInWorkerName = userRoleInfo ? userRoleInfo.workerName : '';
  const isWorkerMode = userRoleInfo?.role === 'worker';

  const allReports = store.getReports();
  let draftReports = allReports.filter(r => r.status === '임시저장' || r.status === '작성중');

  if (isWorkerMode && loggedInWorkerName) {
    draftReports = draftReports.filter(r => r.workerName === loggedInWorkerName);
  }

  container.innerHTML = `
    <div class="draft-reports-view" style="display: flex; flex-direction: column; gap: 16px;">
      <!-- 상단 컨트롤 및 안내 요약 바 -->
      <div class="card" style="padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; background: #ffffff;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 42px; height: 42px; border-radius: 10px; background: rgba(2, 132, 199, 0.1); color: var(--accent-cyan); display: flex; align-items: center; justify-content: center; font-size: 22px;">
            📝
          </div>
          <div>
            <h3 style="font-size: 16px; font-weight: 800; margin: 0; color: var(--text-main);">
              작성중인 작업일보 목록 ${isWorkerMode && loggedInWorkerName ? `<span style="font-size: 13px; font-weight: 700; color: var(--accent-cyan);">(${loggedInWorkerName} 작업자)</span>` : ''}
            </h3>
            <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
              ${isWorkerMode && loggedInWorkerName ? `<strong>${loggedInWorkerName}</strong> 작업자님이 ` : ''}임시 저장한 작업일보를 이어서 작성하거나 최종 제출할 수 있습니다. (총 <strong id="draftCountText" style="color: var(--accent-cyan);">${draftReports.length}</strong>건)
            </p>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 6px; align-items: flex-end;">
          <button class="btn btn-primary btn-sm" id="btnDraftNewReport" style="padding: 8px 14px; font-size: 13px;">
            <span>✍️</span> 신규 일보 작성
          </button>
          <button class="btn ${isDraftMinimized ? 'btn-secondary' : 'btn-outline'} btn-sm" id="btnToggleDraftMinimize" style="padding: 4px 10px; font-size: 12px; font-weight: 700;">
            ${isDraftMinimized ? '👁️ 상세보기 (전체 항목)' : '📐 최소화 (간소화 보기)'}
          </button>
        </div>
      </div>

      <!-- 작성중인 일보 목록 영역 -->
      <div id="draftListArea">
        ${renderDraftItems(draftReports, isDraftMinimized)}
      </div>
    </div>
  `;

  // 이벤트 바인딩
  const btnDraftNewReport = container.querySelector('#btnDraftNewReport');
  if (btnDraftNewReport) {
    btnDraftNewReport.addEventListener('click', () => {
      if (window.appInstance) {
        window.appInstance.switchTab('form');
      }
    });
  }

  const btnToggleDraftMinimize = container.querySelector('#btnToggleDraftMinimize');
  if (btnToggleDraftMinimize) {
    btnToggleDraftMinimize.addEventListener('click', () => {
      isDraftMinimized = !isDraftMinimized;
      renderDraftReports(container);
    });
  }

  bindDraftItemEvents(container);
}

function renderDraftItems(drafts, isMinimized = true) {
  if (!drafts || drafts.length === 0) {
    return `
      <div class="card" style="padding: 48px 24px; text-align: center; background: #ffffff;">
        <div style="font-size: 48px; margin-bottom: 12px; opacity: 0.7;">📝</div>
        <h4 style="font-size: 16px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">
          현재 작성 중인 작업일보가 없습니다.
        </h4>
        <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">
          작업일보 신규작성 메뉴에서 중간 저장을 실행하면 이곳에 목록이 보관됩니다.
        </p>
        <button class="btn btn-primary" id="btnEmptyCreate" style="padding: 10px 20px; font-weight: 700;">
          ✍️ 작업일보 신규 작성하기
        </button>
      </div>
    `;
  }

  return `
    <div class="table-container" style="background: #ffffff; border-radius: var(--radius-md); border: 1px solid var(--border-color); overflow: hidden;">
      <table class="data-table">
        <thead>
          <tr>
            <th style="${isMinimized ? 'display: none;' : ''}">일보 ID</th>
            <th style="${isMinimized ? 'display: none;' : ''}">양식 구분</th>
            <th>작업일자 & 시간</th>
            <th>차종</th>
            <th>공정명</th>
            <th style="${isMinimized ? 'display: none;' : ''}">작업자</th>
            <th>생산 품목</th>
            <th style="text-align: right; ${isMinimized ? 'display: none;' : ''}">생산량 / 목표</th>
            <th style="${isMinimized ? 'display: none;' : ''}">상태</th>
            <th style="text-align: center; width: 220px;">작업 관리</th>
          </tr>
        </thead>
        <tbody>
          ${drafts.map(r => `
            <tr>
              <td style="${isMinimized ? 'display: none;' : ''}"><strong style="color: var(--accent-cyan); font-family: monospace;">${r.id}</strong></td>
              <td style="${isMinimized ? 'display: none;' : ''}">
                <span class="badge ${r.isLeaderForm ? 'badge-purple' : 'badge-cyan'}" style="font-size: 11px; padding: 2px 6px;">
                  ${r.isLeaderForm ? '작업일보(반장)' : '일반 공정'}
                </span>
              </td>
              <td>
                <div style="font-weight: 700;">${r.date}</div>
                <div style="font-size: 11px; color: var(--text-muted);">${r.workHours || '08:00 ~ 17:00'}</div>
              </td>
              <td><span class="badge badge-emerald">${r.carModel}</span></td>
              <td><strong style="color: var(--text-main);">${r.processName}</strong></td>
              <td style="${isMinimized ? 'display: none;' : ''}"><strong>${r.workerName}</strong></td>
              <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${r.itemName || '-'}
              </td>
              <td style="text-align: right; ${isMinimized ? 'display: none;' : ''}">
                <div><strong>${(r.actualQty || 0).toLocaleString()}</strong> / ${r.targetQty ? r.targetQty.toLocaleString() : 0} EA</div>
                <div style="font-size: 11px; color: var(--text-muted);">불량 ${r.defectQty || 0} EA</div>
              </td>
              <td style="${isMinimized ? 'display: none;' : ''}">
                <span class="badge badge-amber" style="font-weight: 700;">
                  📁 ${r.status || '임시저장'}
                </span>
              </td>
              <td style="text-align: center;">
                <div style="display: flex; gap: 6px; justify-content: center;">
                  <button class="btn btn-secondary btn-sm btn-continue-draft" data-id="${r.id}" title="이어서 작성하기" style="font-size: 12px; padding: 4px 8px;">
                    ✏️ 이어서 작성
                  </button>
                  <button class="btn btn-success btn-sm btn-submit-draft" data-id="${r.id}" title="최종 제출하기" style="font-size: 12px; padding: 4px 8px;">
                    ✅ 제출
                  </button>
                  <button class="btn btn-danger btn-sm btn-delete-draft" data-id="${r.id}" title="삭제" style="font-size: 12px; padding: 4px 6px;">
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function bindDraftItemEvents(container) {
  // Empty state button
  const btnEmptyCreate = container.querySelector('#btnEmptyCreate');
  if (btnEmptyCreate) {
    btnEmptyCreate.addEventListener('click', () => {
      if (window.appInstance) {
        window.appInstance.switchTab('form');
      }
    });
  }

  // 1. 이어서 작성하기
  container.querySelectorAll('.btn-continue-draft').forEach(btn => {
    btn.addEventListener('click', () => {
      const reportId = btn.dataset.id;
      window.editReportId = reportId;
      if (window.appInstance) {
        window.appInstance.switchTab('form');
        window.showToast(`📝 '${reportId}' 작업일보 이어서 작성을 시작합니다.`, 'info');
      }
    });
  });

  // 2. 바로 최종 제출하기
  container.querySelectorAll('.btn-submit-draft').forEach(btn => {
    btn.addEventListener('click', () => {
      const reportId = btn.dataset.id;
      if (confirm(`일보 [${reportId}] 건을 '승인 대기' 상태로 최종 제출하시겠습니까?`)) {
        store.updateReport(reportId, { status: '승인 대기' });
        window.showToast(`✅ '${reportId}' 작업일보가 승인 대기 상태로 제출되었습니다.`, 'success');
        renderDraftReports(container);
      }
    });
  });

  // 3. 임시저장 삭제
  container.querySelectorAll('.btn-delete-draft').forEach(btn => {
    btn.addEventListener('click', () => {
      const reportId = btn.dataset.id;
      if (confirm(`작성 중인 일보 [${reportId}] 건을 정말 삭제하시겠습니까?`)) {
        store.deleteReport(reportId);
        window.showToast(`🗑️ '${reportId}' 임시 저장 일보가 삭제되었습니다.`, 'info');
        renderDraftReports(container);
      }
    });
  });

  i18n.applyTranslations(container);
}
