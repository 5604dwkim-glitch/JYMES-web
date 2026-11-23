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
  Monitor,
  Ruler,
  Sun
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { isFluidPage } from '../constants/layoutPages';
import { EQUIPMENT_CATEGORIES, getCategoryMeta } from '../constants/equipmentCategories';
import { prefetchAnalyticsData } from '../services/firestore';
import { ILLUMINANCE_META, ILLUMINANCE_ROUTE_PATH, ILLUMINANCE_ROUTE_SLUG } from '../constants/illuminanceMeasurement';
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

const REPORT_ROUTES = ['/form', '/drafts', '/reports'];

function isEquipmentGroupRoutePath(pathname) {
  if (pathname === '/equipment') return true;
  if (!pathname.startsWith('/equipment/')) return false;
  const slug = pathname.split('/')[2] || 'joint';
  return slug !== 'measuring' && slug !== ILLUMINANCE_ROUTE_SLUG;
}

export default function Layout() {
  const { userRole, logout } = useAuth();
  const { t, td, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const location = useLocation();
  const isWorker = userRole?.role === 'worker';
  const [isReportMenuOpen, setIsReportMenuOpen] = useState(
    () => isWorker || REPORT_ROUTES.includes(location.pathname)
  );
  const [isEquipmentMenuOpen, setIsEquipmentMenuOpen] = useState(
    () => !isWorker && isEquipmentGroupRoutePath(location.pathname)
  );
  const analyticsPrefetchedAtRef = useRef(0);

  // 라우트 이동 시 활성 그룹만 자동으로 펼치고 비활성 그룹은 자동 접힘 처리
  useEffect(() => {
    if (isWorker) {
      setIsReportMenuOpen(true);
      setIsEquipmentMenuOpen(false);
      return;
    }
    if (REPORT_ROUTES.includes(location.pathname)) {
      setIsReportMenuOpen(true);
      setIsEquipmentMenuOpen(false);
    } else if (isEquipmentGroupRoutePath(location.pathname)) {
      setIsEquipmentMenuOpen(true);
      setIsReportMenuOpen(false);
    } else {
      setIsReportMenuOpen(false);
      setIsEquipmentMenuOpen(false);
    }
  }, [location.pathname, isWorker]);

  const handleToggleReportMenu = () => {
    setIsReportMenuOpen((prev) => {
      const next = !prev;
      if (next && !isWorker) setIsEquipmentMenuOpen(false);
      return next;
    });
  };

  const handleToggleEquipmentMenu = () => {
    setIsEquipmentMenuOpen((prev) => {
      const next = !prev;
      if (next) setIsReportMenuOpen(false);
      return next;
    });
  };

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
      if (slug === ILLUMINANCE_ROUTE_SLUG) {
        return {
          title: td('조도 점검'),
          sub: td(ILLUMINANCE_META.subtitle)
        };
      }
      const meta = getCategoryMeta(slug);
      if (slug === 'measuring') {
        return {
          title: td('계측 · 검교정'),
          sub: td(meta.subtitle)
        };
      }
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
      case '/mold': return { title: t('nav_mold') || td('금형 관리'), sub: td('금형 마스터, 이력카드 및 누적 타수 관리') };
      case '/incoming-inspection': return { title: td('수입검사'), sub: td('입고 원자재 및 외주품 수입검사 관리') };
      case '/change-point': return { title: td('변동점(4M) 관리'), sub: td('4M 변동점 등록 및 이력 관리') };
      case '/reports': return { title: t('title_reports'), sub: t('subtitle_reports') };
      case '/analytics': return { title: t('title_analytics'), sub: t('subtitle_analytics') };
      case '/master': return { title: t('title_master'), sub: t('subtitle_master') };
      default: return { title: t('title_dashboard'), sub: '' };
    }
  };

  const { title, sub } = getPageTitle();
  const roleBadgeLabel = userRole?.role === 'admin'
    ? td('관리자')
    : `${td('작업자')}${userRole?.workerName ? ` ${td(userRole.workerName)}` : ''}`;
  const isEquipmentActive = isEquipmentGroupRoutePath(location.pathname);
  const isReportActive = REPORT_ROUTES.includes(location.pathname);
  const equipmentSubCategories = EQUIPMENT_CATEGORIES.filter((cat) => cat.id !== 'measuring');

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

        <nav className="sidebar-nav" aria-label={td('현황 · 분석')}>
          {/* 1. 현황 · 분석 */}
          <div className="sidebar-section-label">{td('현황 · 분석')}</div>

          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
            <BarChart2 size={18} strokeWidth={1.85} className="sidebar-nav-icon" aria-hidden="true" />
            <span className="sidebar-nav-label">{t('nav_dashboard')}</span>
          </NavLink>

          {!isWorker && (
            <NavLink
              to="/analytics"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              onMouseEnter={handlePrefetchAnalytics}
              onFocus={handlePrefetchAnalytics}
            >
              <TrendingUp size={18} strokeWidth={1.85} className="sidebar-nav-icon" aria-hidden="true" />
              <span className="sidebar-nav-label">{t('nav_analytics')}</span>
            </NavLink>
          )}

          {/* 2. 생산 · 작업일보 */}
          <div className="sidebar-section-label">{td('생산 · 작업일보')}</div>

          <div className="nav-group">
            <button
              type="button"
              className={`nav-item nav-group-header ${isReportActive && !isReportMenuOpen ? 'has-active-child' : ''}`}
              aria-expanded={isReportMenuOpen}
              aria-controls="sidebar-report-menu"
              onClick={handleToggleReportMenu}
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

          {!isWorker && (
            <>
              {/* 3. 품질 · 변동점 관리 */}
              <div className="sidebar-section-label">{td('품질 · 변동점 관리')}</div>

              <NavLink to="/incoming-inspection" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <CheckSquare size={18} strokeWidth={1.85} className="sidebar-nav-icon" aria-hidden="true" />
                <span className="sidebar-nav-label">{td('수입검사')}</span>
              </NavLink>

              <NavLink to="/change-point" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Activity size={18} strokeWidth={1.85} className="sidebar-nav-icon" aria-hidden="true" />
                <span className="sidebar-nav-label">{td('변동점(4M) 관리')}</span>
              </NavLink>

              <NavLink to="/equipment/measuring" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Ruler size={18} strokeWidth={1.85} className="sidebar-nav-icon" aria-hidden="true" />
                <span className="sidebar-nav-label">{td('계측 · 검교정')}</span>
              </NavLink>

              <NavLink to={ILLUMINANCE_ROUTE_PATH} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Sun size={18} strokeWidth={1.85} className="sidebar-nav-icon" aria-hidden="true" />
                <span className="sidebar-nav-label">{td('조도 점검')}</span>
              </NavLink>

              {/* 4. 설비 · 기준정보 */}
              <div className="sidebar-section-label">{td('설비 · 기준정보')}</div>

              <div className="nav-group">
                <button
                  type="button"
                  className={`nav-item nav-group-header ${isEquipmentActive && !isEquipmentMenuOpen ? 'has-active-child' : ''}`}
                  aria-expanded={isEquipmentMenuOpen}
                  aria-controls="sidebar-equipment-menu"
                  onClick={handleToggleEquipmentMenu}
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
                    {equipmentSubCategories.map((cat) => (
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

              <NavLink to="/mold" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Box size={18} strokeWidth={1.85} className="sidebar-nav-icon" aria-hidden="true" />
                <span className="sidebar-nav-label">{t('nav_mold') || td('금형 관리')}</span>
              </NavLink>

              <NavLink to="/master" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <Users size={18} strokeWidth={1.85} className="sidebar-nav-icon" aria-hidden="true" />
                <span className="sidebar-nav-label">{t('nav_master')}</span>
              </NavLink>
            </>
          )}
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