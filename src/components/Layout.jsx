import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';

export default function Layout() {
  const { userRole, logout } = useAuth();
  const { t, lang, setLang } = useI18n();
  const [time, setTime] = useState(new Date());
  const [isMobilePreview, setIsMobilePreview] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (isMobilePreview) {
      document.body.classList.add('mobile-preview-mode');
    } else {
      document.body.classList.remove('mobile-preview-mode');
    }
    // Cleanup on unmount
    return () => document.body.classList.remove('mobile-preview-mode');
  }, [isMobilePreview]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return { title: t('title_dashboard'), sub: t('subtitle_dashboard') };
      case '/form': return { title: t('title_form'), sub: t('subtitle_form') };
      case '/drafts': return { title: t('title_drafts') || '작성중인 작업일보', sub: '' };
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
              {userRole?.role === 'admin' ? t('badge_admin') : `${t('badge_worker')} ${userRole?.workerName || ''}`}
            </span>
            <span className="live-clock">
              {time.toLocaleTimeString('ko-KR', { hour12: false })}
            </span>
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
                title="PC 화면에서도 모바일 크기로 미리 봅니다"
              >
                {isMobilePreview ? '🖥️ PC 모드' : '📱 모바일 모드'}
              </button>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} end>
            <span>📊</span>
            <span>{t('nav_dashboard')}</span>
          </NavLink>
          <NavLink to="/form" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span>✍️</span>
            <span>{t('nav_form')}</span>
          </NavLink>
          <NavLink to="/drafts" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span>📝</span>
            <span>{t('nav_drafts') || '작성중인 작업일보'}</span>
          </NavLink>
          {userRole?.role !== 'worker' && (
            <>
              <NavLink to="/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span>📋</span>
                <span>{t('nav_reports')}</span>
              </NavLink>
              <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span>📈</span>
                <span>{t('nav_analytics')}</span>
              </NavLink>
              <NavLink to="/master" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span>👥</span>
                <span>{t('nav_master')}</span>
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
            <div className="lang-select-container">
              <select 
                className="lang-select" 
                value={lang} 
                onChange={(e) => setLang(e.target.value)}
              >
                <option value="ko">🇰🇷 {t('lang_ko') || '한국어'}</option>
                <option value="en">🇺🇸 {t('lang_en') || 'English'}</option>
                <option value="th">🇹🇭 {t('lang_th') || 'ภาษาไทย'}</option>
                <option value="tl">🇵🇭 {t('lang_tl') || 'Tagalog'}</option>
                <option value="vi">🇻🇳 {t('lang_vi') || 'Tiếng Việt'}</option>
              </select>
            </div>
            <button className="btn btn-primary btn-sm">
              <span>➕</span> <span>{t('quick_report')}</span>
            </button>
          </div>
        </header>

        <main className="content-body" id="contentBody">
          <div className="tab-view active" style={{ display: 'block' }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}