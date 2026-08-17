/**
 * 50인 제조업체 공정별 작업일보 관리 시스템 - Main Entry & Router App (Refactored)
 * (접속 모달 폼 즉시 노출 및 권한 선택 복원)
 */

import { store } from './store.js';
import { i18n } from './i18n.js';
import { renderDashboard } from './components/dashboard.js';
import { renderReportForm } from './components/reportForm.js';
import { renderDraftReports } from './components/draftReports.js';
import { renderReportList } from './components/reportList.js';
import { renderAnalytics } from './components/analytics.js';
import { renderMasterData } from './components/masterData.js';

class App {
  constructor() {
    this.currentTab = 'dashboard';
    this.selectedAuthRole = 'worker'; // 'worker' or 'admin'
    this.init();
  }

  init() {
    this.setupI18n();
    this.setupNavigation();
    this.setupClock();
    this.setupGlobalToast();
    this.setupRoleModal();

    const currentRole = store.getUserRole();
    if (!currentRole) {
      this.openRoleModal();
    } else {
      this.applyRolePermissions(currentRole);
    }

    const btnQuickReport = document.getElementById('btnQuickReport');
    if (btnQuickReport) {
      btnQuickReport.addEventListener('click', () => this.switchTab('form'));
    }
  }

  /**
   * 🌐 i18n 언어 선택 이벤트 바인딩 및 동기화
   */
  setupI18n() {
    const headerLangSelect = document.getElementById('headerLangSelect');
    const modalLangSelect = document.getElementById('modalLangSelect');
    const currentLang = i18n.getLang();

    if (headerLangSelect) headerLangSelect.value = currentLang;
    if (modalLangSelect) modalLangSelect.value = currentLang;

    const handleLangChange = (e) => {
      const newLang = e.target.value;
      i18n.setLang(newLang);
      if (headerLangSelect) headerLangSelect.value = newLang;
      if (modalLangSelect) modalLangSelect.value = newLang;

      // Re-apply role badges & header subtitles
      const currentRole = store.getUserRole();
      if (currentRole) {
        this.updateRoleBadge(currentRole);
      }

      // Re-render active view tab in new language
      this.switchTab(this.currentTab);
    };

    if (headerLangSelect) headerLangSelect.addEventListener('change', handleLangChange);
    if (modalLangSelect) modalLangSelect.addEventListener('change', handleLangChange);

    i18n.applyTranslations();
  }

  /**
   * 🔑 접속 모달 및 권한 선택 이벤트 핸들러 (입력란 즉시 노출 복원)
   */
  setupRoleModal() {
    const roleModalBackdrop = document.getElementById('roleModalBackdrop');
    const cardSelectWorker = document.getElementById('cardSelectWorker');
    const cardSelectAdmin = document.getElementById('cardSelectAdmin');
    const authFormArea = document.getElementById('authFormArea');
    const workerAuthFields = document.getElementById('workerAuthFields');
    const authWorkerName = document.getElementById('authWorkerName');
    const authPassword = document.getElementById('authPassword');
    const authPasswordLabel = document.getElementById('authPasswordLabel');
    const btnSubmitAuth = document.getElementById('btnSubmitAuth');
    const btnSwitchRoleHeader = document.getElementById('btnSwitchRoleHeader');

    // 1. 작업자 모드 카드 클릭
    if (cardSelectWorker) {
      cardSelectWorker.addEventListener('click', () => {
        this.selectedAuthRole = 'worker';
        if (cardSelectWorker) {
          cardSelectWorker.style.borderColor = 'var(--accent-cyan)';
          cardSelectWorker.style.background = '#f0f9ff';
        }
        if (cardSelectAdmin) {
          cardSelectAdmin.style.borderColor = 'var(--border-color)';
          cardSelectAdmin.style.background = '#ffffff';
        }
        if (authFormArea) authFormArea.style.display = 'block';
        if (workerAuthFields) workerAuthFields.style.display = 'block';
        if (authPasswordLabel) authPasswordLabel.textContent = '비밀번호';
      });
    }

    // 2. 관리자 모드 카드 클릭
    if (cardSelectAdmin) {
      cardSelectAdmin.addEventListener('click', () => {
        this.selectedAuthRole = 'admin';
        if (cardSelectAdmin) {
          cardSelectAdmin.style.borderColor = 'var(--accent-purple)';
          cardSelectAdmin.style.background = '#f3e8ff';
        }
        if (cardSelectWorker) {
          cardSelectWorker.style.borderColor = 'var(--border-color)';
          cardSelectWorker.style.background = '#ffffff';
        }
        if (authFormArea) authFormArea.style.display = 'block';
        if (workerAuthFields) workerAuthFields.style.display = 'none';
        if (authPasswordLabel) authPasswordLabel.textContent = '비밀번호';
      });
    }

    // 3. 인증 제출 실행
    const submitAuth = () => {
      const pwd = authPassword ? authPassword.value.trim() : '';

      if (pwd !== '1111') {
        window.showToast('⚠️ 비밀번호가 올바르지 않습니다. (기본 비밀번호: 1111)', 'error');
        return;
      }

      if (this.selectedAuthRole === 'worker') {
        const workerName = authWorkerName ? authWorkerName.value.trim() : '';
        if (!workerName) {
          window.showToast('⚠️ 작업자 성함을 입력해주세요. (예: 장수미, 김민준)', 'error');
          return;
        }

        const workers = store.getWorkers();
        const matched = workers.find(w => w.name === workerName || w.id.toUpperCase() === workerName.toUpperCase());
        if (!matched) {
          const sample = workers.slice(0, 3).map(w => w.name).join(', ');
          window.showToast(`⚠️ '${workerName}' 성함이 작업자 명부에 없습니다. (예: ${sample})`, 'error');
          return;
        }

        store.setUserRole('worker', matched.name);
        if (roleModalBackdrop) roleModalBackdrop.classList.remove('active');
        this.applyRolePermissions({ role: 'worker', workerName: matched.name });
        window.showToast(`'${matched.name}' 작업자님 인증 완료!`, 'success');
      } else {
        store.setUserRole('admin', '생산총괄');
        if (roleModalBackdrop) roleModalBackdrop.classList.remove('active');
        this.applyRolePermissions({ role: 'admin', workerName: '생산총괄' });
        window.showToast('관리자(생산총괄) 모드로 접속하였습니다.', 'success');
      }
    };

    if (btnSubmitAuth) {
      btnSubmitAuth.addEventListener('click', submitAuth);
    }

    [authWorkerName, authPassword].forEach(elem => {
      if (elem) {
        elem.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            submitAuth();
          }
        });
      }
    });

    if (btnSwitchRoleHeader) {
      btnSwitchRoleHeader.addEventListener('click', () => {
        this.openRoleModal();
      });
    }
  }

  openRoleModal() {
    const roleModalBackdrop = document.getElementById('roleModalBackdrop');
    const authWorkerName = document.getElementById('authWorkerName');
    const authPassword = document.getElementById('authPassword');
    if (authWorkerName) authWorkerName.value = '';
    if (authPassword) authPassword.value = '';
    if (roleModalBackdrop) {
      roleModalBackdrop.classList.add('active');
    }
  }

  /**
   * 👤 사용자 권한 적용 및 헤더 배지 업데이트
   */
  updateRoleBadge(userRole) {
    const { role, workerName } = userRole || {};
    const currentRoleBadge = document.getElementById('currentRoleBadge');

    if (currentRoleBadge) {
      if (role === 'admin') {
        currentRoleBadge.className = 'user-role-badge';
        currentRoleBadge.style.background = 'rgba(124, 58, 237, 0.2)';
        currentRoleBadge.style.color = '#c084fc';
        currentRoleBadge.style.borderColor = 'rgba(192, 132, 252, 0.3)';
        const adminLabel = i18n.t('badge_admin');
        currentRoleBadge.textContent = `${adminLabel} (${workerName || '생산총괄'})`;
      } else {
        currentRoleBadge.className = 'user-role-badge';
        currentRoleBadge.style.background = 'rgba(2, 132, 199, 0.2)';
        currentRoleBadge.style.color = '#38bdf8';
        currentRoleBadge.style.borderColor = 'rgba(56, 189, 248, 0.3)';
        const workerLabel = i18n.t('badge_worker');
        currentRoleBadge.textContent = `${workerLabel} (${workerName || '작업자'})`;
      }
    }
  }

  applyRolePermissions(userRole) {
    const { role } = userRole;
    this.updateRoleBadge(userRole);

    const roleModalBackdrop = document.getElementById('roleModalBackdrop');
    if (roleModalBackdrop) {
      roleModalBackdrop.classList.remove('active');
    }

    // 🎯 메뉴 숨김/노출 제어 (작업자 모드 선택 시 '메인 대시보드', '작업일보 신규작성', '작성중인 작업일보' 메뉴 표출)
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      const tab = item.dataset.tab;
      if (role === 'worker') {
        if (tab === 'dashboard' || tab === 'form' || tab === 'drafts') {
          item.style.display = 'flex';
        } else {
          item.style.display = 'none';
        }
      } else {
        item.style.display = 'flex';
      }
    });

    this.switchTab('dashboard');
  }

  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const tab = item.dataset.tab;
        this.switchTab(tab);
      });
    });
  }

  /**
   * 🔀 중앙 라우팅 탭 전환
   */
  switchTab(tabName) {
    const userRoleInfo = store.getUserRole();
    if (userRoleInfo && userRoleInfo.role === 'worker') {
      if (tabName !== 'dashboard' && tabName !== 'form' && tabName !== 'drafts' && tabName !== 'reports') {
        tabName = 'dashboard';
      }
    }

    this.currentTab = tabName;

    // 탭 전환 시 작업일보 폼 전용 fixed 버튼 바 숨기기
    const leaderBar = document.getElementById('leaderFixedActionBar');
    const standardBar = document.getElementById('standardFixedActionBar');
    if (leaderBar) leaderBar.style.display = 'none';
    if (standardBar) standardBar.style.display = 'none';

    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.tab === tabName);
    });

    document.querySelectorAll('.tab-view').forEach(view => {
      view.classList.remove('active');
    });

    const targetView = document.getElementById(`view-${tabName}`);
    if (targetView) {
      targetView.classList.add('active');

      const pageTitle = document.getElementById('pageTitle');
      const pageSubtitle = document.getElementById('pageSubtitle');
      if (pageTitle) pageTitle.textContent = i18n.t(`title_${tabName}`);
      if (pageSubtitle) pageSubtitle.textContent = i18n.t(`subtitle_${tabName}`);

      switch (tabName) {
        case 'dashboard':
          renderDashboard(targetView);
          break;
        case 'form':
          renderReportForm(targetView, window.editReportId);
          window.editReportId = null;
          break;
        case 'drafts':
          renderDraftReports(targetView);
          break;
        case 'reports':
          renderReportList(targetView);
          break;
        case 'analytics':
          renderAnalytics(targetView);
          break;
        case 'master':
          renderMasterData(targetView);
          break;
      }
    }

    i18n.applyTranslations();
  }

  setupClock() {
    const clockElem = document.getElementById('liveClockDisplay');
    const update = () => {
      const now = new Date();
      if (clockElem) {
        clockElem.textContent = now.toLocaleTimeString('ko-KR', { hour12: false });
      }
    };
    update();
    setInterval(update, 1000);
  }

  setupGlobalToast() {
    window.showToast = (message, type = 'info') => {
      const container = document.getElementById('toastContainer');
      if (!container) return;

      const toast = document.createElement('div');
      toast.className = `toast ${type}`;
      
      const icon = type === 'success' ? '✅' : type === 'error' ? '🚨' : 'ℹ️';
      toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;

      container.appendChild(toast);

      setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        toast.style.transition = 'all 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
      }, 3500);
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.appInstance = new App();
});
