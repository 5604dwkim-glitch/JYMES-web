import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ReportForm from './components/ReportForm';
import ReportList from './components/ReportList';
import Analytics from './components/Analytics';
import MasterData from './components/MasterData';
import Login from './components/Login';

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
          <Route path="form" element={<ReportForm />} />
          <Route path="drafts" element={<ReportList key="drafts" initialStatus="임시저장" />} />
          <Route path="reports" element={<ReportList key="reports" />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="master" element={<MasterData />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
