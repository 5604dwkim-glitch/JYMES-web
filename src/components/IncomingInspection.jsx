import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';

export default function IncomingInspection() {
  const { userRole } = useAuth();
  const { td } = useI18n();

  if (userRole?.role === 'worker') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="card" style={{ padding: '28px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <span style={{ fontSize: '22px' }}>📦</span>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
          {td('수입검사')}
        </h3>
      </div>
      <p style={{ margin: 0, fontSize: '14px', color: '#64748b', lineHeight: 1.6 }}>
        {td('수입검사 관리 메뉴입니다. 세부 검사 양식 및 항목을 구성하면 이곳에 표시됩니다.')}
      </p>
    </div>
  );
}
