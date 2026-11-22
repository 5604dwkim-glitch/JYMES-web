import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart2,
  TrendingUp,
  Activity,
  Settings,
  Box,
  Users,
  CheckSquare,
  FolderPen,
  ChevronRight,
  ArrowLeftRight,
  Smartphone,
  Monitor
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { isFluidPage } from '../constants/layoutPages';
import { EQUIPMENT_CATEGORIES, getCategoryMeta } from '../constants/equipmentCategories';
import { prefetchAnalyticsData } from '../services/firestore';
import './Sidebar.css';

function LiveClock() {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedClock = `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}:${String(time.getSeconds()).padStart(2, '0')}`;

  return <span className="live-clock">{formattedClock}</span>;
}

export default function Layout() {
  const { userRole, logout } = useAuth();
  const { t, td, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const location = useLocation();
  const [isReportMenuOpen, setIsReportMenuOpen] = useState(true);
  const [isEquipmentMenuOpen, setIsEquipmentMenuOpen] = useState(
    () => location.pathname === '/equipment' || location.pathname.startsWith('/equipment/')
  );
  const analyticsPrefetchedAtRef = useRef(0);

  const handlePrefetchAnalytics = useCallback(() => {
    const now = Date.now();
    if (now - analyticsPrefetchedAtRef.current < 60000) return;
    analyticsPrefetchedAtRef.current = now;
    import('./Analytics').catch(() => {});
    prefetchAnalyticsData();
  }, []);

  useEffect(() => {
    if (isMobilePreview) {
      document.body.classList.add('mobile-preview-mode');
    } else {
      document.body.classList.remove('mobile-preview-mode');
    }
    // Cleanup on unmount
    return () => document.body.classList.remove('mobile-preview-mode');
  }, [isMobilePreview]);

  // 라우트 이동 시 양식 작성 화면의 하단 고정 버튼 바 3종을 일괄 숨김
  // (신규작성/이어작성 → 다른 메뉴로 이동해도 버튼이 남는 문제 근본 해결)
  useEffect(() => {
    const BAR_IDS = ['standardFixedActionBar', 'leaderFixedActionBar', 'forkliftFixedActionBar'];
    BAR_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }, [location.pathname]);

  const getPageTitle = () => {
    if (location.pathname === '/equipment' || location.pathname.startsWith('/equipment/')) {
      const slug = location.pathname.split('/')[2] || 'joint';
      const meta = getCategoryMeta(slug);
      return {
        title: `${t('nav_equipment')} · ${td(meta.label)}`,
        sub: td(meta.subtitle)
      };
    }
    if (location.pathname.startsWith('/tpm-check')) {
      return {
        title: td('가동 전 설비 셋트 TPM 일지 작성'),
        sub: ''
      };
    }
    if (location.pathname.startsWith('/equipment-history')) {
      return {
        title: td('설비 이력카드'),
        sub: td('QR 스캔 설비 이력 상세 조회')
      };
    }
    switch (location.pathname) {
      case '/': return { title: t('title_dashboard'), sub: t('subtitle_dashboard') };
      case '/form': return { title: t('title_form'), sub: t('subtitle_form') };
      case '/drafts': return { title: t('title_drafts') || td('작성중인 작업일보'), sub: t('subtitle_drafts') };
      case '/mold': return { title: td('금형 리스트'), sub: '' };
      case '/incoming-inspection': return { title: td('수입검사'), sub: td('입고 원자재 및 외주품 수입검사 관리') };
      case '/change-point': return { title: td('변동점 관리'), sub: td('4M 변동점 등록 및 이력 관리') };
      case '/reports': return { title: t('title_reports'), sub: t('subtitle_reports') };
      case '/analytics': return { title: t('title_analytics'), sub: t('subtitle_analytics') };
      case '/master': return { title: t('title_master'), sub: t('subtitle_master') };
      default: return { title: t('title_dashboard'), sub: '' };
    }
  };

  const { title, sub } = getPageTitle();
  const isWorker = userRole?.role === 'worker';
  const roleBadgeLabel = userRole?.role === 'admin'
    ? td('관리자')
    : `${td('작업자')}${userRole?.workerName ? ` ${td(userRole.workerName)}` : ''}`;
  const isEquipmentActive = location.pathname === '/equipment' || location.pathname.startsWith('/equipment/');
  const isReportActive = ['/form', '/drafts', '/reports'].includes(location.pathname);

  return (
    <div id="app">
      <aside className="sidebar sidebar-dark" id="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-brand-mark" aria-hidden="true">JY</span>
          <div className="sidebar-title">
            <h1>{t('system_title')}</h1>
            <span>{t('system_subtitle')}</span>
          </div>
        </div>

        <div className="sidebar-account-panel">
          <div className="sidebar-status-card">
            <span className="sidebar-role-pill" title={roleBadgeLabel}>
              <span className="sidebar-status-dot" aria-hidden="true" />
              <span className="sidebar-role-text">{roleBadgeLabel}</span>
            </span>
            <LiveClock />
          </div>
          <div className="sidebar-action-row">
            <button
              type="button"
              className="sidebar-action-btn"
              onClick={logout}
            >
              <ArrowLeftRight size={13} strokeWidth={2} aria-hidden="true" />
              <span>{td('접속 전환')}</span>
            </button>
            {userRole?.role === 'admin' && (
              <button
                type="button"
                className={`sidebar-action-btn ${isMobilePreview ? 'is-active' : ''}`}
                aria-pressed={isMobilePreview}
                onClick={() => setIsMobilePreview(!isMobilePreview)}
                title={td('PC 화면에서도 모바일 크기로 미리 봅니다')}
              >
                {isMobilePreview ? (
                  <Monitor size={13} strokeWidth={2} aria-hidden="true" />
                ) : (
                  <Smartphone size={13} strokeWidth={2} aria-hidden="true" />
                )}
                <span>{isMobilePreview ? td('PC 모드') : td('모바일 모드')}</span>
              </button>
            )}
          </div>
        </div>

        <nav className="sidebar-nav" aria-label={td('모니터링')}>
          <div className="sidebar-section-label">{td('모니터링')}</div>

          {/* 1. 메인 대시보드 */}
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
            <BarChart2 size={18} strokeWidth={1.85} className="sidebar-nav-icon" aria-hidden="true" />
            <span className="sidebar-nav-label">{t('nav_dashboard')}</span>
          </NavLink>

          {!isWorker && (
            <>
              {/* 2. 공정 및 불량 분석 */}
              <NavLink
                to="/analytics"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onMouseEnter={handlePrefetchAnalytics}
                onFocus={handlePrefetchAnalytics}
              >
                <TrendingUp size={18} strokeWidth={1.85} className="sidebar-nav-icon" aria-hidden="true" />
                <span className="sidebar-nav-label">{t('nav_analytics')}</span>
              </NavLink>

              {/* 3. 변동점 관리 */}
              <NavLink to="/change-point" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Activity size={18} strokeWidth={1.85} className="sidebar-nav-icon" aria-hidden="true" />
                <span className="sidebar-nav-label">{td('변동점 관리')}</span>
              </NavLink>

              <div className="sidebar-section-label">{td('생산 · 기준정보')}</div>

              {/* 4. 설비 관리 */}
              <div className="nav-group">
                <button
                  type="button"
                  className={`nav-item nav-group-header ${isEquipmentActive && !isEquipmentMenuOpen ? 'has-active-child' : ''}`}
                  aria-expanded={isEquipmentMenuOpen}
                  aria-controls="sidebar-equipment-menu"
                  onClick={() => setIsEquipmentMenuOpen(!isEquipmentMenuOpen)}
                >
                  <Settings size={18} strokeWidth={1.85} className="sidebar-nav-icon" aria-hidden="true" />
                  <span className="sidebar-nav-label">{t('nav_equipment') || td('설비 관리')}</span>
                  <ChevronRight
                    size={15}
                    strokeWidth={2}
                    className={`sidebar-chevron ${isEquipmentMenuOpen ? 'is-open' : ''}`}
                    aria-hidden="true"
                  />
                </button>

                {isEquipmentMenuOpen && (
                  <div className="nav-group-children" id="sidebar-equipment-menu">
                    {EQUIPMENT_CATEGORIES.map((cat) => (
                      <NavLink
                        key={cat.id}
                        to={`/equipment/${cat.id}`}
                        className={({ isActive }) => `nav-item nav-subitem ${isActive ? 'active' : ''}`}
                      >
                        <span className="sidebar-nav-label">{td(cat.label)}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. 금형 관리 */}
              <NavLink to="/mold" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Box size={18} strokeWidth={1.85} className="sidebar-nav-icon" aria-hidden="true" />
                <span className="sidebar-nav-label">{t('nav_mold') || td('금형 관리')}</span>
              </NavLink>

              {/* 6. 작업자 관리 */}
              <NavLink to="/master" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Users size={18} strokeWidth={1.85} className="sidebar-nav-icon" aria-hidden="true" />
                <span className="sidebar-nav-label">{t('nav_master')}</span>
              </NavLink>

              {/* 7. 수입검사 */}
              <NavLink to="/incoming-inspection" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <CheckSquare size={18} strokeWidth={1.85} className="sidebar-nav-icon" aria-hidden="true" />
                <span className="sidebar-nav-label">{td('수입검사')}</span>
              </NavLink>
            </>
          )}

          <div className="sidebar-section-label">{td('현장 기록')}</div>

          {/* 8. 작업일보 */}
          <div className="nav-group">
            <button
              type="button"
              className={`nav-item nav-group-header ${isReportActive && !isReportMenuOpen ? 'has-active-child' : ''}`}
              aria-expanded={isReportMenuOpen}
              aria-controls="sidebar-report-menu"
              onClick={() => setIsReportMenuOpen(!isReportMenuOpen)}
            >
              <FolderPen size={18} strokeWidth={1.85} className="sidebar-nav-icon" aria-hidden="true" />
              <span className="sidebar-nav-label">{td('작업일보')}</span>
              <ChevronRight
                size={15}
                strokeWidth={2}
                className={`sidebar-chevron ${isReportMenuOpen ? 'is-open' : ''}`}
                aria-hidden="true"
              />
            </button>

            {isReportMenuOpen && (
              <div className="nav-group-children" id="sidebar-report-menu">
                <NavLink to="/form" className={({ isActive }) => `nav-item nav-subitem ${isActive ? 'active' : ''}`}>
                  <span className="sidebar-nav-label">{td('신규작성')}</span>
                </NavLink>
                <NavLink to="/drafts" className={({ isActive }) => `nav-item nav-subitem ${isActive ? 'active' : ''}`}>
                  <span className="sidebar-nav-label">{td('이어작성')}</span>
                </NavLink>
                {!isWorker && (
                  <NavLink to="/reports" className={({ isActive }) => `nav-item nav-subitem ${isActive ? 'active' : ''}`}>
                    <span className="sidebar-nav-label">{td('조회 및 승인')}</span>
                  </NavLink>
                )}
              </div>
            )}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="company-badge">
            <div className="badge-info">
              <span className="badge-name">{t('company_name')}</span>
              <span className="badge-sub">{t('dept_name')}</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="main-wrapper">
        <header className="top-header">
          <div>
            <span className="page-title">{title}</span>
            <span className="page-subtitle">{sub}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="lang-select-container" translate="no">
              <select 
                className="lang-select" 
                translate="no"
                value={lang} 
                onChange={(e) => setLang(e.target.value)}
              >
                <option value="ko">🇰🇷 한국어</option>
                <option value="en">🇺🇸 English</option>
                <option value="th">🇹🇭 ภาษาไทย</option>
                <option value="vi">🇻🇳 Tiếng Việt</option>
              </select>
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/form')}>
              <span>➕</span> <span>{t('quick_report')}</span>
            </button>
          </div>
        </header>

        {/* data-wide-page="1": 작업일보 외 화면은 최소 가로폭 유지 + 가로 스크롤 (index.css 참고) */}
        <main className="content-body" id="contentBody" data-wide-page={isFluidPage(location.pathname) ? undefined : '1'}>
          <div className="tab-view active" style={{ display: 'block' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}