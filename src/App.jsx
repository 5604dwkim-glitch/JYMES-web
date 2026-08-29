import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Login from './components/Login';

// Lazy loaded components for code splitting
const ReportForm = lazy(() => import('./components/ReportForm'));
const ReportList = lazy(() => import('./components/ReportList'));
const Analytics = lazy(() => import('./components/Analytics'));
const MasterData = lazy(() => import('./components/MasterData'));
const EquipmentManagement = lazy(() => import('./components/EquipmentManagement/EquipmentManagement'));
const MoldManagement = lazy(() => import('./components/MoldManagement/MoldManagement'));

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
          <Route path="mold" element={
            <Suspense fallback={<PageLoader />}>
              <MoldManagement />
            </Suspense>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
