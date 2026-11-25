import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { renderReportForm, setLegacyFormContext } from './LegacyFormWrapper';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { addReport, updateReport, fetchWorkersSlim, fetchMoldsSlim, fetchEquipmentsSlim, fetchEquipmentSets, fetchTodayTpmLogsByDate } from '../../services/firestore';
import { fetchJointMoldDefaults, fetchLatestJointMoldEntryForForm } from '../../services/jointMoldDefaults';
import { readLocalJointMoldDefaults } from '../../utils/jointMoldDefaultsHelper';
import { generate50Workers, DEFAULT_PROCESSES, DEFAULT_ITEMS } from '../../constants/masterData';
import { useI18n } from '../../contexts/I18nContext';
import { i18n } from '../../constants/translations';
import FormCodeBadge from './FormCodeBadge';
import JointTpmGateCard from './JointTpmGateCard';
import JointTpmCheckModal from './JointTpmCheckModal';

function tpmLogMatchesCarPart(log, carModel, partCode) {
  if (!log || !carModel) return false;
  if (log.carModel) {
    if (log.carModel !== carModel) return false;
    if (log.partName && partCode && log.partName !== partCode) return false;
    return true;
  }
  const setText = String(log.setName || '').toUpperCase();
  const codes = Array.isArray(log.equipmentCodes) ? log.equipmentCodes.map((c) => String(c || '').toUpperCase()) : [];
  const check = (setMatch, codePrefix) =>
    (setText && setMatch(setText)) || codes.some((c) => c.startsWith(codePrefix));
  switch (carModel) {
    case 'JG1S': return check((s) => s.includes('JG1S') || s.includes('코치'), 'JG-');
    case 'JG1': return check((s) => (s.includes('JG1') && !s.includes('JG1S') && !s.includes('코치')), 'JG-');
    case 'DT CREW': return check((s) => s.includes('DT CREW') || s.includes('DTCREW'), 'DT-C-');
    case 'DT QUAD': return check((s) => s.includes('DT QUAD') || s.includes('DTQUAD'), 'DT-Q-');
    case 'DS CREW': return check((s) => s.includes('DS CREW') || s.includes('DSCREW'), 'DS-C-');
    case 'DS STD': return check((s) => s.includes('DS STD') || s.includes('DSSTD'), 'DS-');
    case 'KM/KX': return check((s) => s.includes('KM/KX') || s.includes('KMKX'), 'KM-');
    case 'NE1a': return check((s) => s.includes('NE1'), 'NE-');
    case 'ME1a': return check((s) => s.includes('ME1'), 'ME-');
    case 'OV1K': return check((s) => s.includes('OV1'), 'OV-');
    case 'LQ2a': return check((s) => s.includes('LQ2'), 'LQ-');
    case 'MV1a': return check((s) => s.includes('MV1'), 'MV-');
    case '9BQC': return check((s) => s.includes('9BQC'), '9B-');
    case 'P417': return check((s) => s.includes('P417'), 'P4-');
    default: return false;
  }
}

export default function LegacyFormReactWrapper({ existingData, initialTpmSummary = null }) {
  const containerRef = useRef(null);
  const { userRole } = useAuth();
  const { lang, td } = useI18n();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const [isReady, setIsReady] = useState(false);

  // Step 1: Hybrid State to bridge Vanilla JS and React JSX
  const [formSelections, setFormSelections] = useState({ carModel: '', part: '', process: '' });
  const prevSelectionsRef = useRef({ carModel: '', part: '', process: '' });
  const [badgeContainerElement, setBadgeContainerElement] = useState(null);
  const [tpmGateContainerElement, setTpmGateContainerElement] = useState(null);

  // 조인트 공정 가동 전 설비 셋트 TPM 점검 상태
  const [tpmSummary, setTpmSummary] = useState(() => existingData?.tpmCheckSummary || initialTpmSummary || null);
  const [tpmSkipped, setTpmSkipped] = useState(false);
  const tpmSummaryRef = useRef(tpmSummary);
  tpmSummaryRef.current = tpmSummary;
  const initialTpmSummaryRef = useRef(initialTpmSummary);
  initialTpmSummaryRef.current = initialTpmSummary;
  const todayTpmLogsCacheRef = useRef({});
  const isSavingRef = useRef(false);
  const handleOpenTpmModalRef = useRef(null);
  const tpmOpenOriginRef = useRef('gate');

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
        const equipmentsPromise = fetchEquipmentsSlim();
        const equipmentSetsPromise = fetchEquipmentSets();
        const moldDefaultsPromise = fetchJointMoldDefaults();
        const [workersRaw, moldsFirst, equipmentsFirst, equipmentSetsFirst, jointMoldDefaults] = await Promise.all([
          withTimeout(fetchWorkersSlim(), 10000, []),
          withTimeout(moldsPromise, 8000, null),
          withTimeout(equipmentsPromise, 8000, null),
          withTimeout(equipmentSetsPromise, 6000, null),
          withTimeout(moldDefaultsPromise, 2500, readLocalJointMoldDefaults())
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
          jointMoldDefaults: jointMoldDefaults || {},
          loadFormJointMoldDefaults: async (keyInfo) => {
            const entry = await fetchLatestJointMoldEntryForForm(keyInfo);
            if (entry) {
              const updated = await fetchJointMoldDefaults();
              formCtx.jointMoldDefaults = updated;
            }
            return entry;
          },
          equipments: equipmentsFirst || [],
          equipmentSets: equipmentSetsFirst || [],
          getTpmSummary: () => tpmSummaryRef.current,
          onOpenTpmModal: () => handleOpenTpmModalRef.current?.('downtime'),
          processes: DEFAULT_PROCESSES,
          getItems: (code) => {
            return DEFAULT_ITEMS.filter(item => item.carModel === code);
          },
          onSave: async (id, data) => {
            if (isSavingRef.current) return;
            isSavingRef.current = true;
            try {
              const isSavingJoint = typeof data?.processName === 'string' && data.processName.startsWith('조인트');
              const payload = (isSavingJoint && tpmSummaryRef.current)
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
            if (type === 'error' || type === 'warning') alert(msg);
            else console.log(`Toast (${type}):`, msg);
          },
          // Triggered by vanilla JS when dropdowns/chips change
          onFormSelectionChange: (selections) => {
            const prev = prevSelectionsRef.current;
            const next = { ...prev, ...selections };
            if (
              prev.process &&
              next.process &&
              (prev.process !== next.process || prev.carModel !== next.carModel || prev.part !== next.part)
            ) {
              setTpmSkipped(false);
              if (!existingData && !initialTpmSummaryRef.current) {
                tpmSummaryRef.current = null;
                setTpmSummary(null);
              }
            }
            prevSelectionsRef.current = next;
            setFormSelections(next);
          }
        };
        setLegacyFormContext(formCtx);

        // 금형/설비 목록이 늦게 도착한 경우: 양식은 먼저 열고, 도착하면 컨텍스트에 반영 및 섹션 갱신
        if (moldsFirst === null) {
          moldsPromise.then((late) => {
            formCtx.molds = late || [];
            if (containerRef.current) {
              containerRef.current.dispatchEvent(new CustomEvent('jymes:molds-loaded'));
            }
          });
        }
        if (equipmentsFirst === null) {
          equipmentsPromise.then((late) => {
            formCtx.equipments = late || [];
            if (containerRef.current) {
              containerRef.current.dispatchEvent(new CustomEvent('jymes:equipments-loaded'));
            }
          });
        }
        if (equipmentSetsFirst === null) {
          equipmentSetsPromise.then((late) => {
            formCtx.equipmentSets = late || [];
            if (containerRef.current) {
              containerRef.current.dispatchEvent(new CustomEvent('jymes:equipments-loaded'));
            }
          });
        }
        moldDefaultsPromise.then((lateDefaults) => {
          if (lateDefaults && typeof lateDefaults === 'object') {
            formCtx.jointMoldDefaults = { ...(formCtx.jointMoldDefaults || {}), ...lateDefaults };
          }
        }).catch(() => {});

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
  const isSummaryScoped =
    tpmSummary &&
    (!tpmSummary.carModel || !formSelections.carModel || tpmSummary.carModel === formSelections.carModel) &&
    (!tpmSummary.partName || !formSelections.part || tpmSummary.partName === formSelections.part);
  const effectiveTpmSummary = isSummaryScoped ? tpmSummary : null;
  const isJointTpmLocked = isJointProcess && !existingData && !effectiveTpmSummary && !tpmSkipped;

  // 당일 동일 차종/부품 설비 셋트 TPM 점검 이력이 이미 존재하면 자동 연동하여 중복 작성 잠금 해제
  useEffect(() => {
    if (!isReady || existingData || !isJointProcess || !formSelections.carModel || effectiveTpmSummary || tpmSkipped) return undefined;
    let cancelled = false;
    const reportDateStr = containerRef.current?.querySelector('#reportDate')?.value || new Date().toLocaleDateString('sv-SE');
    const loadExistingTodayTpm = async () => {
      try {
        let logs = todayTpmLogsCacheRef.current[reportDateStr];
        if (!logs) {
          logs = await fetchTodayTpmLogsByDate(reportDateStr);
          todayTpmLogsCacheRef.current[reportDateStr] = logs || [];
        }
        if (cancelled) return;
        const matched = (logs || []).find((log) => tpmLogMatchesCarPart(log, formSelections.carModel, formSelections.part));
        if (!matched) return;
        const hydratedSummary = {
          setId: matched.setId || '',
          setName: matched.setName || '',
          carModel: matched.carModel || formSelections.carModel,
          partName: matched.partName || formSelections.part || '',
          equipmentCount: Array.isArray(matched.equipmentIds) ? matched.equipmentIds.length : (matched.equipmentCodes?.length || 0),
          equipmentIds: matched.equipmentIds || [],
          equipmentCodes: matched.equipmentCodes || [],
          equipments: (matched.equipmentIds || []).map((id, i) => ({
            id,
            code: matched.equipmentCodes?.[i] || '',
            name: matched.setName || ''
          })),
          hasIssue: Boolean(matched.hasIssue),
          reportDate: matched.reportDate || reportDateStr,
          workerName: matched.workerName || ''
        };
        tpmSummaryRef.current = hydratedSummary;
        setTpmSummary(hydratedSummary);
        if (containerRef.current) {
          containerRef.current.dispatchEvent(new CustomEvent('jymes:tpm-updated', { detail: hydratedSummary }));
        }
      } catch (err) {
        console.warn('Failed to hydrate today tpm_logs:', err);
      }
    };
    loadExistingTodayTpm();
    return () => {
      cancelled = true;
    };
  }, [isReady, existingData, isJointProcess, formSelections.carModel, formSelections.part, effectiveTpmSummary, tpmSkipped]);

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

  const handleOpenTpmModal = (origin = 'gate') => {
    tpmOpenOriginRef.current = origin === 'downtime' ? 'downtime' : 'gate';
    const curDate = containerRef.current?.querySelector('#reportDate')?.value || new Date().toLocaleDateString('sv-SE');
    const curWorker =
      containerRef.current?.querySelector('#workerSearchInput')?.value ||
      containerRef.current?.querySelector('#workerSelect')?.value ||
      userRole?.workerName ||
      '';
    setModalMeta({ reportDate: curDate, workerName: curWorker });
    setShowTpmModal(true);
  };
  handleOpenTpmModalRef.current = handleOpenTpmModal;

  const handleSkipTpm = () => {
    setTpmSkipped(true);
    setShowTpmModal(false);
    scrollToNextReportStep();
  };

  const handleTpmComplete = (summary) => {
    const openedFromDowntime = tpmOpenOriginRef.current === 'downtime';
    tpmOpenOriginRef.current = 'gate';
    const reportDateStr = summary?.reportDate || modalMeta.reportDate || '';
    if (reportDateStr) delete todayTpmLogsCacheRef.current[reportDateStr];
    tpmSummaryRef.current = summary;
    setTpmSummary(summary);
    setTpmSkipped(false);
    setShowTpmModal(false);
    if (containerRef.current) {
      containerRef.current.dispatchEvent(new CustomEvent('jymes:tpm-updated', { detail: summary }));
    }
    if (!openedFromDowntime) {
      scrollToNextReportStep();
    }
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
          tpmSummary={effectiveTpmSummary}
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
          carModel={formSelections.carModel}
          partName={formSelections.part}
          onClose={() => setShowTpmModal(false)}
          onSkip={handleSkipTpm}
          onComplete={handleTpmComplete}
        />
      )}
    </div>
  );
}
