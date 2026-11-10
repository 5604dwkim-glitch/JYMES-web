import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { renderReportForm, setLegacyFormContext } from './LegacyFormWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { addReport, updateReport, fetchWorkersSlim, fetchMoldsSlim } from '../../services/firestore';
import { generate50Workers, DEFAULT_PROCESSES, DEFAULT_ITEMS } from '../../constants/masterData';
import { useI18n } from '../../contexts/I18nContext';
import { i18n } from '../../constants/translations';
import FormCodeBadge from './FormCodeBadge';
import JointTpmGateCard from './JointTpmGateCard';
import JointTpmCheckModal from './JointTpmCheckModal';

export default function LegacyFormReactWrapper({ existingData, initialTpmSummary = null }) {
  const containerRef = useRef(null);
  const { userRole } = useAuth();
  const { lang, td } = useI18n();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const [isReady, setIsReady] = useState(false);

  // Step 1: Hybrid State to bridge Vanilla JS and React JSX
  const [formSelections, setFormSelections] = useState({ carModel: '', part: '', process: '' });
  const [badgeContainerElement, setBadgeContainerElement] = useState(null);
  const [tpmGateContainerElement, setTpmGateContainerElement] = useState(null);

  // 조인트 공정 가동 전 설비 셋트 TPM 점검 상태
  const [tpmSummary, setTpmSummary] = useState(() => existingData?.tpmCheckSummary || initialTpmSummary || null);
  const [tpmSkipped, setTpmSkipped] = useState(false);
  const tpmSummaryRef = useRef(tpmSummary);
  tpmSummaryRef.current = tpmSummary;
  const isSavingRef = useRef(false);

  const [showTpmModal, setShowTpmModal] = useState(false);
  const [modalMeta, setModalMeta] = useState({ reportDate: '', workerName: '' });

  useEffect(() => {
    setIsReady(false);
    async function initForm() {
      try {
        // 일보 작성 화면에는 작업자 이름/금형 번호만 필요하므로 사진(base64)이 빠진 경량 캐시를 사용하고,
        // 두 조회를 동시에 시작한다. (설비 목록은 양식에서 사용하지 않아 조회하지 않음)
        const withTimeout = (promise, ms, fallback) => Promise.race([
          promise,
          new Promise((resolve) => setTimeout(() => resolve(fallback), ms))
        ]);
        const moldsPromise = fetchMoldsSlim();
        const [workersRaw, moldsFirst] = await Promise.all([
          withTimeout(fetchWorkersSlim(), 10000, []),
          withTimeout(moldsPromise, 8000, null)
        ]);

        let workers = workersRaw;
        if (!workers || workers.length === 0) {
          workers = generate50Workers();
        }

        const formCtx = {
          userRoleInfo: userRole,
          existingData: existingData,
          workers: workers,
          molds: moldsFirst || [],
          equipments: [],
          processes: DEFAULT_PROCESSES,
          getItems: (code) => {
            return DEFAULT_ITEMS.filter(item => item.carModel === code);
          },
          onSave: async (id, data) => {
            if (isSavingRef.current) return;
            isSavingRef.current = true;
            try {
              const payload = tpmSummaryRef.current
                ? { ...data, tpmCheckSummary: tpmSummaryRef.current }
                : data;
              if (id) {
                await updateReport(id, payload);
              } else {
                await addReport(payload);
              }
              alert(payload.status === '임시저장' ? i18n.t('toast_saved_draft') : i18n.t('toast_submitted'));
              if (payload.status === '임시저장') {
                navigate('/drafts');
              } else {
                navigate('/reports');
              }
            } catch (error) {
              alert(i18n.translateDisplay('저장 중 오류 발생:') + ' ' + error.message);
            } finally {
              isSavingRef.current = false;
            }
          },
          onNavigate: (tab) => {
            // 저장(onSave) 비동기 처리가 진행 중일 때는 레거시 switchTab의 조기 화면 이탈을 차단하고
            // onSave 완료 후 정확한 화면(/drafts 또는 /reports)으로 이동하도록 보장한다.
            if (isSavingRef.current) return;
            navigate(`/${tab}`);
          },
          showToast: (msg, type) => {
            if (type === 'error') alert(msg);
            else console.log(`Toast (${type}):`, msg);
          },
          // Triggered by vanilla JS when dropdowns/chips change
          onFormSelectionChange: (selections) => {
            setFormSelections(prev => ({ ...prev, ...selections }));
          }
        };
        setLegacyFormContext(formCtx);

        // 금형 목록이 늦게 도착한 경우: 양식은 먼저 열고, 도착하면 컨텍스트에 반영 (공정 선택 시점에 읽음)
        if (moldsFirst === null) {
          moldsPromise.then((late) => {
            formCtx.molds = late || [];
          });
        }

        setIsReady(true);
      } catch (e) {
        console.error('Legacy Form Init Error:', e);
        setErrorMsg(e.toString() + '\n' + e.stack);
      }
    }
    initForm();
  }, [existingData, userRole, navigate]);

  useEffect(() => {
    if (isReady && containerRef.current) {
      containerRef.current.innerHTML = '';
      try {
        renderReportForm(containerRef.current, existingData?.id || null);

        // Find the placeholder containers for React portals
        setTimeout(() => {
          if (!containerRef.current) return;
          const badgeEl = containerRef.current.querySelector('#formCodeBadgeContainer');
          if (badgeEl) setBadgeContainerElement(badgeEl);
          const tpmGateEl = containerRef.current.querySelector('#jointTpmGateContainer');
          if (tpmGateEl) setTpmGateContainerElement(tpmGateEl);
        }, 50);
      } catch (e) {
        console.error('Legacy Form Render Error:', e);
        setErrorMsg(e.toString() + '\n' + e.stack);
      }
    }

    return () => {
      const BAR_IDS = ['standardFixedActionBar', 'leaderFixedActionBar', 'forkliftFixedActionBar'];
      BAR_IDS.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });

      // Clean up any stray vanilla modals
      ['wheelNumberPickerModal', 'wheelListPickerModal', 'wheelTimePickerModal', 'wheelLotDatePickerModal'].forEach(id => {
        const modal = document.getElementById(id);
        if (modal) modal.remove();
      });
    };
  }, [isReady, existingData]);

  // Apply reversible in-place DOM translations on language switch without wiping unsaved form state
  useEffect(() => {
    if (isReady && containerRef.current) {
      i18n.setLang(lang, false);
      i18n.applyTranslations(containerRef.current);
      ['standardFixedActionBar', 'leaderFixedActionBar', 'forkliftFixedActionBar'].forEach(id => {
        const el = document.getElementById(id);
        if (el) i18n.applyTranslations(el);
      });
    }
  }, [isReady, lang]);

  const isJointProcess = typeof formSelections.process === 'string' && formSelections.process.startsWith('조인트');
  const isJointTpmLocked = isJointProcess && !existingData && !tpmSummary && !tpmSkipped;

  const scrollToNextReportStep = () => {
    setTimeout(() => {
      const sec4 = containerRef.current?.querySelector('#section4Card');
      const sec5 = containerRef.current?.querySelector('#section5DynamicContainer');
      const targetEl = sec4 && sec4.style.display !== 'none' ? sec4 : sec5;
      if (targetEl && typeof targetEl.scrollIntoView === 'function') {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
  };

  const handleOpenTpmModal = () => {
    const curDate = containerRef.current?.querySelector('#reportDate')?.value || new Date().toLocaleDateString('sv-SE');
    const curWorker = containerRef.current?.querySelector('#workerSelect')?.value || userRole?.workerName || '';
    setModalMeta({ reportDate: curDate, workerName: curWorker });
    setShowTpmModal(true);
  };

  const handleSkipTpm = () => {
    setTpmSkipped(true);
    setShowTpmModal(false);
    scrollToNextReportStep();
  };

  const handleTpmComplete = (summary) => {
    setTpmSummary(summary);
    setTpmSkipped(false);
    setShowTpmModal(false);
    scrollToNextReportStep();
  };

  return (
    <div>
      {isJointTpmLocked && (
        <style>{`
          .legacy-form-container[data-joint-tpm-locked="1"] #section4Card,
          .legacy-form-container[data-joint-tpm-locked="1"] #section5DynamicContainer,
          .legacy-form-container[data-joint-tpm-locked="1"] #qtySection,
          .legacy-form-container[data-joint-tpm-locked="1"] #downtimeCard {
            display: none !important;
          }
          #standardFixedActionBar {
            display: none !important;
          }
        `}</style>
      )}

      {errorMsg && (
        <div style={{ padding: '20px', color: 'red', border: '1px solid red', background: '#ffe6e6', whiteSpace: 'pre-wrap' }}>
          <h3>렌더링 에러가 발생했습니다:</h3>
          {errorMsg}
        </div>
      )}
      {!isReady && !errorMsg && <div style={{ padding: '40px', textAlign: 'center' }}>{td('로딩 중...')}</div>}

      <div
        ref={containerRef}
        className="legacy-form-container"
        data-joint-tpm-locked={isJointTpmLocked ? '1' : undefined}
        style={{ display: isReady ? 'block' : 'none' }}
      ></div>

      {/* Step 2: Render React components into Vanilla JS DOM via Portal */}
      {badgeContainerElement && createPortal(
        <FormCodeBadge
          carModel={formSelections.carModel}
          part={formSelections.part}
          process={formSelections.process}
        />,
        badgeContainerElement
      )}

      {tpmGateContainerElement && createPortal(
        <JointTpmGateCard
          isJointProcess={isJointProcess}
          tpmSummary={tpmSummary}
          tpmSkipped={tpmSkipped}
          isLocked={isJointTpmLocked}
          onOpenTpmModal={handleOpenTpmModal}
          onSkipTpm={handleSkipTpm}
        />,
        tpmGateContainerElement
      )}

      {showTpmModal && (
        <JointTpmCheckModal
          reportDate={modalMeta.reportDate}
          workerName={modalMeta.workerName}
          onClose={() => setShowTpmModal(false)}
          onSkip={handleSkipTpm}
          onComplete={handleTpmComplete}
        />
      )}
    </div>
  );
}
