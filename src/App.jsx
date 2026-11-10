import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Login from './components/Login';

// Lazy loaded components for code splitting
// Helper to handle chunk load errors (white screen) after deployment updates
// 배포 직후 옛 화면의 파일 조각을 못 찾는 경우 1회만 자동 새로고침하고, 네트워크가 계속 불안정하면
// 무한 새로고침 대신 '다시 시도' 안내 화면을 보여준다.
const CHUNK_RELOAD_KEY = 'jymes_chunk_reload_at';
const ChunkErrorFallback = () => (
  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#334155' }}>
    <div style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px' }}>화면을 불러오지 못했습니다.</div>
    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>네트워크 상태를 확인한 뒤 다시 시도해 주세요.</div>
    <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>다시 시도</button>
  </div>
);
const lazyWithReload = (componentImport) => {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      const isChunkLoadError = error?.name === 'ChunkLoadError' || 
                               (error?.message && error.message.includes('dynamically imported module')) ||
                               (error?.message && error.message.includes('Failed to fetch')) ||
                               (error?.message && error.message.includes('Importing a module script failed'));
      if (isChunkLoadError) {
        let lastReloadAt = 0;
        try {
          lastReloadAt = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);
        } catch {
          lastReloadAt = 0;
        }
        if (Date.now() - lastReloadAt > 30000) {
          try {
            sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
          } catch {
            // 무시
          }
          window.location.reload();
          return new Promise(() => {}); // Prevent further execution while reloading
        }
        return { default: ChunkErrorFallback };
      }
      throw error;
    }
  });
};

const ReportForm = lazyWithReload(() => import('./components/ReportForm'));
const ReportList = lazyWithReload(() => import('./components/ReportList'));
const Analytics = lazyWithReload(() => import('./components/Analytics'));
const MasterData = lazyWithReload(() => import('./components/MasterData'));
const EquipmentManagement = lazyWithReload(() => import('./components/EquipmentManagement/EquipmentManagement'));
const MoldManagement = lazyWithReload(() => import('./components/MoldManagement/MoldManagement'));
const TpmCheckFlow = lazyWithReload(() => import('./components/TpmCheckFlow'));
const ChangePointManagement = lazyWithReload(() => import('./components/ChangePointManagement'));

// Loading fallback component
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px' }}>
    <div style={{ width: '40px', height: '40px', border: '4px solid #cbd5e1', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
    <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
  </div>
);

function PrivateRoute({ children }) {
  const { userRole } = useAuth();
  const location = useLocation();
  if (!userRole) {
    return <Navigate to={`/login${location.search}`} replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="form" element={
            <Suspense fallback={<PageLoader />}>
              <ReportForm />
            </Suspense>
          } />
          <Route path="drafts" element={
            <Suspense fallback={<PageLoader />}>
              <ReportList key="drafts" initialStatus="임시저장" />
            </Suspense>
          } />
          <Route path="reports" element={
            <Suspense fallback={<PageLoader />}>
              <ReportList key="reports" />
            </Suspense>
          } />
          <Route path="analytics" element={
            <Suspense fallback={<PageLoader />}>
              <Analytics />
            </Suspense>
          } />
          <Route path="master" element={
            <Suspense fallback={<PageLoader />}>
              <MasterData />
            </Suspense>
          } />
          <Route path="equipment" element={
            <Suspense fallback={<PageLoader />}>
              <EquipmentManagement />
            </Suspense>
          } />
          <Route path="equipment/:category" element={
            <Suspense fallback={<PageLoader />}>
              <EquipmentManagement />
            </Suspense>
          } />
          <Route path="change-point" element={
            <Suspense fallback={<PageLoader />}>
              <ChangePointManagement />
            </Suspense>
          } />
          <Route path="mold" element={
            <Suspense fallback={<PageLoader />}>
              <MoldManagement />
            </Suspense>
          } />
          <Route path="tpm-check/:setId" element={
            <Suspense fallback={<PageLoader />}>
              <TpmCheckFlow />
            </Suspense>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
