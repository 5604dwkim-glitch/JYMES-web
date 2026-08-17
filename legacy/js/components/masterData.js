/**
 * 50인 제조업체 공정별 작업일보 관리 시스템 - Master Data Component (웨더스트립 사업부)
 */

import { store } from '../store.js';
import { i18n } from '../i18n.js';

export function renderMasterData(container) {
  const workers = store.getWorkers();
  const processes = store.getProcesses();
  const items = store.getItems();

  container.innerHTML = `
    <div class="master-data-view">
      <!-- Top Actions & Sub-Tabs -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-primary sub-tab-btn active" data-subtab="workers">👷 현장 작업자 명부 (${workers.length}명)</button>
          <button class="btn btn-secondary sub-tab-btn" data-subtab="processes">🏭 7대 제조 공정 마스터 (${processes.length}개)</button>
          <button class="btn btn-secondary sub-tab-btn" data-subtab="items">🚗 납품 품목 마스터 (${items.length}개)</button>
        </div>

        <button class="btn btn-danger btn-sm" id="btnResetDataSystem">
          <span>🔄</span> 시스템 초기 데이터 리셋
        </button>
      </div>

      <!-- Sub Tab 1: Dynamic Workers Roster -->
      <div id="subtab-workers" class="subtab-content active">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>👥</span>
              <span>웨더스트립 생산/품질 현장 작업자 명부 (실시간 추가)</span>
            </div>
            <div style="display: flex; gap: 10px;">
              <input type="text" id="workerSearchInput" class="form-control" style="width: 200px; padding: 6px 12px; font-size: 12px;" placeholder="이름 또는 사번 검색" />
              <button class="btn btn-primary btn-sm" id="btnAddWorkerModal"><span>➕</span> 신규 작업자 등록</button>
            </div>
          </div>

          <div class="table-container" style="max-height: 520px; overflow-y: auto;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>사번 ▲</th>
                  <th>성함</th>
                  <th>직급</th>
                  <th>소속 부서</th>
                  <th>공정</th>
                  <th>근무 형태</th>
                  <th>상태</th>
                  <th>연락처</th>
                  <th style="text-align: center;">관리</th>
                </tr>
              </thead>
              <tbody id="workerTableBody">
                ${workers.map(w => `
                  <tr>
                    <td style="font-family: monospace; color: var(--accent-cyan); font-weight: 600;">${w.id}</td>
                    <td style="font-weight: 600;">${w.name}</td>
                    <td>${w.role}</td>
                    <td>${w.dept}</td>
                    <td><span class="proc-badge running">${w.process}</span></td>
                    <td>${w.shift}</td>
                    <td>
                      <span class="status-badge ${w.status === '근무중' ? 'approved' : w.status === '휴가' ? 'pending' : 'rejected'}">
                        ${w.status}
                      </span>
                    </td>
                    <td style="font-size: 12px; color: var(--text-muted);">${w.phone}</td>
                    <td style="text-align: center;">
                      <div style="display: flex; gap: 4px; justify-content: center;">
                        <button class="btn btn-secondary btn-sm btn-edit-worker" data-id="${w.id}">수정</button>
                        <button class="btn btn-danger btn-sm btn-delete-worker" data-id="${w.id}">삭제</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Sub Tab 2: Process Master -->
      <div id="subtab-processes" class="subtab-content" style="display: none;">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>🏭</span>
              <span>웨더스트립 7대 연속 압출/가황/몰딩 공정 마스터</span>
            </div>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>공정 코드</th>
                  <th>공정명</th>
                  <th>가동 라인</th>
                  <th>표준 Lead Time</th>
                  <th>공정 책임자</th>
                </tr>
              </thead>
              <tbody>
                ${processes.map(p => `
                  <tr>
                    <td style="font-family: monospace; color: var(--accent-cyan);">${p.id}</td>
                    <td style="font-weight: 600;">${p.name}</td>
                    <td>${p.lines.join(', ')}</td>
                    <td>${p.leadTimeMinutes} 분</td>
                    <td>${p.manager}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Sub Tab 3: Item Master -->
      <div id="subtab-items" class="subtab-content" style="display: none;">
        <div class="card">
          <div class="card-header">
            <div class="card-title">
              <span>🚗</span>
              <span>완성차 납품용 웨더스트립 품목 마스터</span>
            </div>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>품목 코드</th>
                  <th>품목명</th>
                  <th>단위</th>
                  <th>목표 TACT Time (초)</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(it => `
                  <tr>
                    <td style="font-family: monospace; color: var(--accent-cyan);">${it.code}</td>
                    <td style="font-weight: 600;">${it.name}</td>
                    <td>${it.unit}</td>
                    <td>${it.targetCycleTimeSec} 초</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  setupMasterEvents(container);
  i18n.applyTranslations(container);
}

function setupMasterEvents(container) {
  const subTabBtns = container.querySelectorAll('.sub-tab-btn');
  const subTabContents = container.querySelectorAll('.subtab-content');

  subTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      subTabBtns.forEach(b => {
        b.classList.remove('active', 'btn-primary');
        b.classList.add('btn-secondary');
      });
      btn.classList.add('active', 'btn-primary');
      btn.classList.remove('btn-secondary');

      const targetId = `subtab-${btn.dataset.subtab}`;
      subTabContents.forEach(content => {
        content.style.display = content.id === targetId ? 'block' : 'none';
      });
    });
  });

  const workerSearchInput = container.querySelector('#workerSearchInput');
  const workerTableBody = container.querySelector('#workerTableBody');

  if (workerSearchInput && workerTableBody) {
    workerSearchInput.addEventListener('input', () => {
      const q = workerSearchInput.value.toLowerCase();
      const workers = store.getWorkers().filter(w => 
        w.name.toLowerCase().includes(q) || w.id.toLowerCase().includes(q) || w.process.toLowerCase().includes(q)
      );

      workerTableBody.innerHTML = workers.map(w => `
        <tr>
          <td style="font-family: monospace; color: var(--accent-cyan); font-weight: 600;">${w.id}</td>
          <td style="font-weight: 600;">${w.name}</td>
          <td>${w.role}</td>
          <td>${w.dept}</td>
          <td><span class="proc-badge running">${w.process}</span></td>
          <td>${w.shift}</td>
          <td>
            <span class="status-badge ${w.status === '근무중' ? 'approved' : w.status === '휴가' ? 'pending' : 'rejected'}">
              ${w.status}
            </span>
          </td>
          <td style="font-size: 12px; color: var(--text-muted);">${w.phone}</td>
          <td style="text-align: center;">
            <div style="display: flex; gap: 4px; justify-content: center;">
              <button class="btn btn-secondary btn-sm btn-edit-worker" data-id="${w.id}">수정</button>
              <button class="btn btn-danger btn-sm btn-delete-worker" data-id="${w.id}">삭제</button>
            </div>
          </td>
        </tr>
      `).join('');
    });
  }

  container.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-edit-worker')) {
      const id = e.target.dataset.id;
      const worker = store.getWorkerById(id);
      if (!worker) return;

      const newIdInput = prompt(`[현재 사번: ${id}] 수정할 사번을 입력하세요 (예: EMP001, EMP051 등):`, worker.id);
      if (newIdInput === null) return;
      const newId = newIdInput.trim().toUpperCase();

      if (!newId) {
        alert('사번을 입력해주세요.');
        return;
      }

      if (newId !== worker.id && store.getWorkers().some(w => w.id === newId)) {
        alert(`이미 존재하는 사번(${newId})입니다. 다른 사번을 입력해주세요.`);
        return;
      }

      const newName = prompt(`[사번: ${newId}] 작업자 성함 수정:`, worker.name);
      if (newName === null) return;

      const newProcess = prompt(`[사번: ${newId}] 공정 수정:`, worker.process);
      if (newProcess === null) return;

      const newRole = prompt(`[사번: ${newId}] 직급 수정 (예: 작업자, 생산 반장, 직장):`, worker.role || '작업자');
      if (newRole === null) return;

      const newPhone = prompt(`[사번: ${newId}] 연락처 수정:`, worker.phone || '010-0000-0000');
      if (newPhone === null) return;

      store.updateWorker(id, {
        id: newId,
        name: newName.trim() || worker.name,
        process: newProcess.trim() || worker.process,
        role: newRole.trim() || worker.role,
        phone: newPhone.trim() || worker.phone
      });

      window.showToast(`작업자 '${newName.trim() || worker.name}'(사번: ${newId}) 정보가 수정되었습니다.`, 'success');
      renderMasterData(container);
    }

    if (e.target.classList.contains('btn-delete-worker')) {
      const id = e.target.dataset.id;
      if (confirm(`작업자(${id})를 삭제하시겠습니까?`)) {
        store.deleteWorker(id);
        window.showToast('작업자가 삭제되었습니다.', 'info');
        renderMasterData(container);
      }
    }
  });

  const btnAddWorkerModal = container.querySelector('#btnAddWorkerModal');
  if (btnAddWorkerModal) {
    btnAddWorkerModal.addEventListener('click', () => {
      const name = prompt('신규 작업자 성함을 입력하세요:');
      if (name) {
        const process = prompt('공정 (예: 연속 압출 및 열가황, 코너 사출 몰딩 등):', '연속 압출 및 열가황(Vulcanizing)');
        store.addWorker({
          name: name,
          role: '작업자',
          dept: '웨더스트립 사업부',
          process: process || '연속 압출 및 열가황(Vulcanizing)',
          shift: '주간',
          status: '근무중',
          phone: '010-0000-0000'
        });
        window.showToast('신규 작업자가 등록되었습니다.', 'success');
        renderMasterData(container);
      }
    });
  }

  const btnResetDataSystem = container.querySelector('#btnResetDataSystem');
  if (btnResetDataSystem) {
    btnResetDataSystem.addEventListener('click', () => {
      if (confirm('시스템 데이터를 리셋하고 작업자 명부 및 30일치 웨더스트립 공정 시뮬레이션 데이터를 재생성하시겠습니까?')) {
        store.resetAllData();
        window.showToast('웨더스트립 시스템 데이터가 리셋되었습니다.', 'success');
        renderMasterData(container);
      }
    });
  }
}
