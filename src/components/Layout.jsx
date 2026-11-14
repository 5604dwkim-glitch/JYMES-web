import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { isFluidPage } from '../constants/layoutPages';
import { EQUIPMENT_CATEGORIES, getCategoryMeta } from '../constants/equipmentCategories';
import { prefetchAnalyticsData } from '../services/firestore';

function LiveClock({ lang }) {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedClock = lang === 'ko'
    ? time.toLocaleTimeString('ko-KR', { hour12: false })
    : `${String(time.getHours()).padStart(2, '0')}:${String(time.getMinutes()).padStart(2, '0')}:${String(time.getSeconds()).padStart(2, '0')}`;

  return <span className="live-clock">{formattedClock}</span>;
}

export default function Layout() {
  const { userRole, logout } = useAuth();
  const { t, td, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const location = useLocation();
  const [isReportMenuOpen, setIsReportMenuOpen] = useState(true);
  const [isEquipmentMenuOpen, setIsEquipmentMenuOpen] = useState(false);
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
    switch (location.pathname) {
      case '/': return { title: t('title_dashboard'), sub: t('subtitle_dashboard') };
      case '/form': return { title: t('title_form'), sub: t('subtitle_form') };
      case '/drafts': return { title: t('title_drafts') || td('작성중인 작업일보'), sub: t('subtitle_drafts') };
      case '/mold': return { title: td('금형 리스트'), sub: '' };
      case '/change-point': return { title: td('변동점 관리'), sub: td('4M 변동점 등록 및 이력 관리') };
      case '/reports': return { title: t('title_reports'), sub: t('subtitle_reports') };
      case '/analytics': return { title: t('title_analytics'), sub: t('subtitle_analytics') };
      case '/master': return { title: t('title_master'), sub: t('subtitle_master') };
      default: return { title: t('title_dashboard'), sub: '' };
    }
  };

  const { title, sub } = getPageTitle();

  return (
    <div id="app">
      <aside className="sidebar" id="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-title">
            <h1>{t('system_title')}</h1>
            <span>{t('system_subtitle')}</span>
          </div>
        </div>

        <div style={{ padding: '10px 16px', borderBottom: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="user-role-badge">
              {userRole?.role === 'admin' ? t('badge_admin') : `${t('badge_worker')} ${userRole?.workerName ? td(userRole.workerName) : ''}`}
            </span>
            <LiveClock lang={lang} />
          </div>
          <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
            <button 
              className="btn btn-secondary btn-sm" 
              style={{ flex: 1, fontSize: '11px', padding: '4px 8px' }}
              onClick={logout}
            >
              {t('role_switch')}
            </button>
            {userRole?.role === 'admin' && (
              <button
                className="btn btn-primary btn-sm"
                style={{ flex: 1, fontSize: '11px', padding: '4px 8px', background: isMobilePreview ? 'var(--accent-emerald)' : 'var(--accent-blue)', color: 'white' }}
                onClick={() => setIsMobilePreview(!isMobilePreview)}
                title={td('PC 화면에서도 모바일 크기로 미리 봅니다')}
              >
                {isMobilePreview ? td('🖥️ PC 모드') : td('📱 모바일 모드')}
              </button>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          {/* 1. 메인 대시보드 */}
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
            <span>📊</span>
            <span>{t('nav_dashboard')}</span>
          </NavLink>

          {userRole?.role !== 'worker' && (
            <>
              {/* 2. 공정 및 불량 분석 */}
              <NavLink
                to="/analytics"
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                onMouseEnter={handlePrefetchAnalytics}
                onFocus={handlePrefetchAnalytics}
              >
                <span>📈</span>
                <span>{t('nav_analytics')}</span>
              </NavLink>

              {/* 3. 변동점 관리 */}
              <NavLink to="/change-point" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span>🔍</span>
                <span>{td('변동점 관리')}</span>
              </NavLink>

              {/* 4. 설비 관리 */}
              <div className="nav-group" style={{ margin: '4px 0' }}>
                <div
                  className="nav-item nav-group-header"
                  onClick={() => setIsEquipmentMenuOpen(!isEquipmentMenuOpen)}
                  style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', paddingRight: '16px', background: 'rgba(255,255,255,0.03)', fontWeight: 'bold' }}
                >
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <span>⚙️</span>
                    <span>{t('nav_equipment') || td('설비 관리')}</span>
                  </div>
                  <span style={{ fontSize: '10px', transform: isEquipmentMenuOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', marginTop: '4px' }}>▶</span>
                </div>

                {isEquipmentMenuOpen && (
                  <div className="nav-group-children" style={{ display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.15)', borderLeft: '2px solid rgba(255,255,255,0.1)', marginLeft: '12px' }}>
                    {EQUIPMENT_CATEGORIES.map((cat) => (
                      <NavLink
                        key={cat.id}
                        to={`/equipment/${cat.id}`}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        style={{ paddingLeft: '24px' }}
                      >
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>└</span>
                        <span>{td(cat.label)}</span>
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>

              {/* 5. 금형 관리 */}
              <NavLink to="/mold" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span>🗜️</span>
                <span>{t('nav_mold') || td('금형 관리')}</span>
              </NavLink>

              {/* 6. 작업자 관리 */}
              <NavLink to="/master" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span>👥</span>
                <span>{t('nav_master')}</span>
              </NavLink>
            </>
          )}

          {/* 7. 작업일보 */}
          <div className="nav-group" style={{ margin: '4px 0' }}>
            <div 
              className="nav-item nav-group-header" 
              onClick={() => setIsReportMenuOpen(!isReportMenuOpen)}
              style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', paddingRight: '16px', background: 'rgba(255,255,255,0.03)', fontWeight: 'bold' }}
            >
              <div style={{ display: 'flex', gap: '12px' }}>
                <span>📁</span>
                <span>{td('작업일보')}</span>
              </div>
              <span style={{ fontSize: '10px', transform: isReportMenuOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', marginTop: '4px' }}>▶</span>
            </div>
            
            {isReportMenuOpen && (
              <div className="nav-group-children" style={{ display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.15)', borderLeft: '2px solid rgba(255,255,255,0.1)', marginLeft: '12px' }}>
                <NavLink to="/form" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '24px' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>└</span>
                  <span>{td('신규작성')}</span>
                </NavLink>
                <NavLink to="/drafts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '24px' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>└</span>
                  <span>{td('이어작성')}</span>
                </NavLink>
                {userRole?.role !== 'worker' && (
                  <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ paddingLeft: '24px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>└</span>
                    <span>{td('조회 및 승인')}</span>
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