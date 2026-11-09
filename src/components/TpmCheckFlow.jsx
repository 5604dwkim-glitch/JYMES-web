import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import JointTpmCheckModal from './DynamicForms/JointTpmCheckModal';

const COMPLETE_MSG = {
  ko: '설비 셋트 TPM 일지가 저장되었습니다. 작업일보 작성 화면으로 이동합니다.',
  en: 'Equipment Set TPM check saved. Proceeding to Work Report screen.',
  th: 'บันทึกการตรวจ TPM ชุดเครื่องจักรแล้ว กำลังไปยังหน้ากรอกรายงาน',
  vi: 'Đã lưu nhật ký TPM bộ thiết bị. Đang chuyển sang màn hình báo cáo.'
};

export default function TpmCheckFlow() {
  const { setId } = useParams();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const { lang } = useI18n();

  return (
    <JointTpmCheckModal
      initialSetId={setId || ''}
      workerName={userRole?.workerName || ''}
      onClose={() => navigate('/form')}
      onComplete={(summary) => {
        alert(COMPLETE_MSG[lang] || COMPLETE_MSG.ko);
        navigate('/form', { state: { tpmCheckSummary: summary } });
      }}
    />
  );
}
