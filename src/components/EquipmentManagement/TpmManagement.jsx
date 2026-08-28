import React from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { useAuth } from '../../contexts/AuthContext';

export default function TpmManagement() {
  const { t } = useI18n();
  const { userRole } = useAuth();

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">작업 전 TPM 일지 (TPM Log)</h2>
      </div>
      <div className="card-body">
        <p>환영합니다, {userRole?.workerName || '관리자'}님.</p>
        <p>여기에 설비를 선택하고 일일 점검을 수행하는 양식이 추가될 예정입니다.</p>
        {/* TODO: Implement TPM checklist form */}
      </div>
    </div>
  );
}
