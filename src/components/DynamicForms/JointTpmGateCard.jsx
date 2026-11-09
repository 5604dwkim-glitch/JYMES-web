import React from 'react';
import { useI18n } from '../../contexts/I18nContext';

const GATE_DESC_BY_LANG = {
  ko: '조인트 작업일보 작성(소재 LOT 입력) 전에 아래 TPM 일지 작성 버튼을 눌러 설비 셋트 QR 코드를 스캔하고, 구성된 모든 설비의 항목별 점검을 완료해주세요.',
  en: 'Before entering the Joint Work Report (Material LOT), tap the TPM Check button below to scan the Equipment Set QR code and complete all equipment checks.',
  th: 'ก่อนกรอกรายงานข้อต่อ (LOT วัสดุ) กรุณากดปุ่มบันทึกตรวจเช็ค TPM ด้านล่างเพื่อสแกน QR Code ของชุดเครื่องจักรและตรวจเช็คให้ครบทุกเครื่อง',
  vi: 'Trước khi nhập báo cáo công đoạn Nối (số LOT), vui lòng nhấn nút Kiểm tra TPM bên dưới để quét mã QR bộ thiết bị và hoàn thành kiểm tra tất cả máy.'
};

export default function JointTpmGateCard({
  isJointProcess,
  tpmSummary,
  tpmSkipped,
  isLocked,
  onOpenTpmModal,
  onSkipTpm
}) {
  const { lang, td } = useI18n();
  if (!isJointProcess) return null;

  if (tpmSummary) {
    const unitSuffix = lang === 'en' ? ' units' : lang === 'th' ? ' เครื่อง' : lang === 'vi' ? ' máy' : '대';
    const setPrefix = lang === 'en' ? 'Set:' : lang === 'th' ? 'ชุด:' : lang === 'vi' ? 'Bộ:' : '셋트:';
    return (
      <div
        data-joint-tpm-card="done"
        style={{
          padding: '14px 16px',
          marginBottom: '16px',
          borderRadius: '10px',
          background: tpmSummary.hasIssue ? '#fffbeb' : '#f0fdf4',
          border: tpmSummary.hasIssue ? '1.5px solid #f59e0b' : '1.5px solid #22c55e',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: tpmSummary.hasIssue ? '#92400e' : '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{td('✅ 가동 전 설비 셋트 TPM 일지 작성 완료')}</span>
          </div>
          <div style={{ fontSize: '12px', color: '#475569' }}>
            {setPrefix} <strong>{tpmSummary.setName}</strong> ({tpmSummary.equipmentCount}{unitSuffix}
            {Array.isArray(tpmSummary.equipmentCodes) && tpmSummary.equipmentCodes.length > 0
              ? ` · ${tpmSummary.equipmentCodes.join(', ')}`
              : ''}
            )
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenTpmModal}
          style={{
            padding: '7px 12px',
            background: '#ffffff',
            color: '#1e293b',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          {td('TPM 일지 다시 작성')}
        </button>
      </div>
    );
  }

  if (tpmSkipped) {
    return (
      <div
        data-joint-tpm-card="skipped"
        style={{
          padding: '12px 16px',
          marginBottom: '16px',
          borderRadius: '10px',
          background: '#f8fafc',
          border: '1.5px solid #cbd5e1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{td('⏭️ 가동 전 TPM 일지 작성 스킵됨 (일보 작성 진행 중)')}</span>
        </div>
        <button
          type="button"
          onClick={onOpenTpmModal}
          style={{
            padding: '7px 12px',
            background: '#eff6ff',
            color: '#1d4ed8',
            border: '1px solid #93c5fd',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          {td('TPM 일지 작성하기')}
        </button>
      </div>
    );
  }

  return (
    <div
      data-joint-tpm-card="pending"
      style={{
        padding: '18px 16px',
        marginBottom: '16px',
        borderRadius: '12px',
        background: 'linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)',
        border: '2px solid #2563eb',
        boxShadow: '0 4px 14px rgba(37, 99, 235, 0.12)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '18px' }}>🛠️</span>
        <span style={{ fontSize: '15px', fontWeight: 900, color: '#1e3a8a' }}>
          {td('가동 전 설비 셋트 TPM 일지 작성')}
        </span>
        {isLocked && (
          <span style={{ fontSize: '11px', fontWeight: 800, background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: '999px' }}>
            {td('소재 LOT 입력 전 단계')}
          </span>
        )}
      </div>

      <p style={{ fontSize: '13px', color: '#334155', lineHeight: 1.55, margin: '0 0 14px 0' }}>
        {GATE_DESC_BY_LANG[lang] || GATE_DESC_BY_LANG.ko}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button
          type="button"
          onClick={onOpenTpmModal}
          style={{
            width: '100%',
            padding: '14px 18px',
            background: '#2563eb',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 10px rgba(37, 99, 235, 0.25)'
          }}
        >
          <span>📷</span>
          <span>{td('TPM 일지 작성 (QR 코드 스캔)')}</span>
        </button>

        {onSkipTpm && (
          <button
            type="button"
            onClick={onSkipTpm}
            style={{
              width: '100%',
              padding: '11px 16px',
              background: '#f1f5f9',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <span>⏭️</span>
            <span>{td('스킵 (작성 안하고 일보 입력 진행)')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
