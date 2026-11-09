import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { collection, doc, getDoc, getDocs, updateDoc, addDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import jsQR from 'jsqr';
import { db } from '../../firebase';
import {
  TPM_CIRCLED_NUMBERS,
  DEFAULT_TPM_GUIDE_PHOTO,
  normalizeTpmTemplate,
  normalizeTpmLog,
  getTpmLogKey,
  buildGroupedTpmQuestions,
  parseWheelSpecFromCriterion
} from '../../constants/tpmLogTemplate';
import TpmWheelNumberPickerModal from '../EquipmentManagement/TpmWheelNumberPickerModal';
import { syncTpmAbnormalToRepairAndChangePoint } from '../../services/changePointAutoSync';
import { getEquipmentSetCategory } from '../../constants/equipmentCategories';
import { useI18n } from '../../contexts/I18nContext';

export function extractSetIdFromQr(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  const trimmed = rawText.trim();
  const match = trimmed.match(/\/tpm-check\/([^/?#\s]+)/i);
  if (match && match[1]) return decodeURIComponent(match[1]);
  if (/^[A-Za-z0-9_-]{6,64}$/.test(trimmed)) return trimmed;
  return '';
}

const CHOICE_OPTIONS = [
  { mark: 'O', label: 'O 양호', activeBg: '#16a34a', activeBorder: '#15803d', idleBg: '#f0fdf4', idleColor: '#166534' },
  { mark: 'X', label: 'X 이상', activeBg: '#dc2626', activeBorder: '#b91c1c', idleBg: '#fef2f2', idleColor: '#991b1b' },
  { mark: '△', label: '△ 수리', activeBg: '#d97706', activeBorder: '#b45309', idleBg: '#fffbeb', idleColor: '#92400e' }
];

export default function JointTpmCheckModal({
  initialSetId = '',
  reportDate = '',
  workerName = '',
  onClose,
  onSkip,
  onComplete
}) {
  const { lang, td } = useI18n();
  const effectiveDateStr = reportDate && /^\d{4}-\d{2}-\d{2}$/.test(reportDate)
    ? reportDate
    : new Date().toLocaleDateString('sv-SE');
  const [yearNum, monthNum, dayNum] = effectiveDateStr.split('-').map(Number);
  const weekIndex = Math.min(4, Math.floor(((dayNum || 1) - 1) / 7));
  const ymKey = getTpmLogKey(yearNum, monthNum);

  const [phase, setPhase] = useState(initialSetId ? 'loading_set' : 'scan');
  const [setsList, setSetsList] = useState([]);
  const [setsLoading, setSetsLoading] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scanHint, setScanHint] = useState('카메라를 설비 셋트 QR 코드에 맞춰주세요.');

  const [equipmentSet, setEquipmentSet] = useState(null);
  const [setEquipments, setSetEquipments] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  // answers: { [questionKey]: { [eqId]: 'O' | 'X' | '△' } }
  const [answers, setAnswers] = useState({});
  const [highlightMissing, setHighlightMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [wheelTarget, setWheelTarget] = useState(null); // { qKey, eqId, eqLabel, currentVal, spec }

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanTimerRef = useRef(null);
  const bodyScrollRef = useRef(null);
  const loadSetRef = useRef(null);

  const stopCamera = () => {
    if (scanTimerRef.current) {
      clearInterval(scanTimerRef.current);
      scanTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const loadEquipmentSetById = async (targetSetId) => {
    if (!targetSetId) return;
    stopCamera();
    setPhase('loading_set');
    try {
      const setSnap = await getDoc(doc(db, 'equipment_sets', targetSetId));
      if (!setSnap.exists()) {
        alert('인식된 QR 코드에 해당하는 설비 셋트를 찾을 수 없습니다.');
        setPhase('scan');
        return;
      }
      const setData = { id: setSnap.id, ...setSnap.data() };
      const orderedStubs = Array.isArray(setData.equipments) && setData.equipments.length > 0
        ? setData.equipments
        : (setData.equipmentIds || []).map(id => ({ id, code: '', name: '' }));

      if (orderedStubs.length === 0) {
        alert('이 설비 셋트에 등록된 설비가 없습니다.');
        setPhase('scan');
        return;
      }

      const eqDocs = await Promise.all(
        orderedStubs.map(async (stub) => {
          try {
            const snap = await getDoc(doc(db, 'equipments', stub.id));
            if (snap.exists()) {
              return { id: snap.id, ...snap.data() };
            }
          } catch (err) {
            console.warn('Equipment doc fetch fallback:', err);
          }
          return { id: stub.id, code: stub.code || '-', name: stub.name || '설비' };
        })
      );

      const grouped = buildGroupedTpmQuestions(eqDocs, weekIndex);
      const initialAnswers = {};
      grouped.forEach((q) => {
        initialAnswers[q.key] = {};
        q.targets.forEach((t) => {
          const eqObj = eqDocs.find(e => e.id === t.eqId);
          const log = normalizeTpmLog(eqObj?.tpmLogs?.[ymKey]);
          if (q.kind === 'daily') {
            const savedVal = log.daily?.[t.rowId]?.[dayNum] || '';
            // 수치 입력 항목(온조기 스크롤 / 형체·메인압력)은 기존 O/△ 값을 초기값에서 제외
            if ((q.inputMode === 'value_or_x' || q.inputMode === 'wheel_number') && (savedVal === 'O' || savedVal === '△')) {
              initialAnswers[q.key][t.eqId] = '';
            } else {
              initialAnswers[q.key][t.eqId] = savedVal;
            }
          } else {
            initialAnswers[q.key][t.eqId] = log.weekly?.[q.weekIndex]?.result || '';
          }
        });
      });

      setEquipmentSet(setData);
      setSetEquipments(eqDocs);
      setQuestions(grouped);
      setAnswers(initialAnswers);
      setStepIndex(0);
      setHighlightMissing(false);
      setPhase('questions');
    } catch (err) {
      console.error('Failed to load equipment set:', err);
      alert('설비 셋트 정보를 불러오는 중 오류가 발생했습니다.');
      setPhase('scan');
    }
  };

  loadSetRef.current = loadEquipmentSetById;

  // 초기 setId 가 주어진 경우 즉시 로드
  useEffect(() => {
    if (initialSetId) {
      loadSetRef.current(initialSetId);
    }
    return () => stopCamera();
  }, [initialSetId]);

  // 스캔 단계에서 설비 셋트 목록 조회 + 카메라 시작
  useEffect(() => {
    if (phase !== 'scan') {
      stopCamera();
      return undefined;
    }

    let cancelled = false;
    setSetsLoading(true);
    getDocs(query(collection(db, 'equipment_sets'), orderBy('createdAt', 'desc')))
      .then((snap) => {
        if (!cancelled) {
          const items = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(s => getEquipmentSetCategory(s) === 'joint');
          items.sort((a, b) =>
            String(a.name || '').localeCompare(String(b.name || ''), 'ko', {
              numeric: true,
              sensitivity: 'base'
            })
          );
          setSetsList(items);
        }
      })
      .catch((err) => console.warn('Failed to fetch equipment_sets list:', err))
      .finally(() => {
        if (!cancelled) setSetsLoading(false);
      });

    async function startCamera() {
      setCameraError('');
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('현재 브라우저에서 실시간 카메라를 사용할 수 없습니다. 아래 사진 스캔 또는 셋트 목록 선택을 이용해주세요.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }

        const nativeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window
          ? new window.BarcodeDetector({ formats: ['qr_code'] })
          : null;

        scanTimerRef.current = setInterval(async () => {
          const video = videoRef.current;
          if (!video || video.readyState < 2) return;

          // 1차: 브라우저 내장 BarcodeDetector
          if (nativeDetector) {
            try {
              const codes = await nativeDetector.detect(video);
              if (codes && codes.length > 0 && codes[0].rawValue) {
                const parsedId = extractSetIdFromQr(codes[0].rawValue);
                if (parsedId) {
                  setScanHint('QR 코드가 인식되었습니다!');
                  loadSetRef.current(parsedId);
                  return;
                }
              }
            } catch {
              // jsQR 폴백으로 진행
            }
          }

          // 2차: jsQR 캔버스 프레임 디코딩 (iOS Safari 등 모든 브라우저 호환)
          const canvas = canvasRef.current;
          if (!canvas) return;
          const vw = video.videoWidth;
          const vh = video.videoHeight;
          if (!vw || !vh) return;
          const scale = Math.min(1, 640 / Math.max(vw, vh));
          const cw = Math.max(1, Math.round(vw * scale));
          const ch = Math.max(1, Math.round(vh * scale));
          canvas.width = cw;
          canvas.height = ch;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) return;
          ctx.drawImage(video, 0, 0, cw, ch);
          const imageData = ctx.getImageData(0, 0, cw, ch);
          const qr = jsQR(imageData.data, cw, ch, { inversionAttempts: 'dontInvert' });
          if (qr && qr.data) {
            const parsedId = extractSetIdFromQr(qr.data);
            if (parsedId) {
              setScanHint('QR 코드가 인식되었습니다!');
              loadSetRef.current(parsedId);
            }
          }
        }, 200);
      } catch (err) {
        console.warn('Camera access error:', err);
        if (!cancelled) {
          setCameraError('카메라 권한이 없거나 연결된 카메라가 없습니다. 사진 촬영 인식 또는 아래 셋트 선택을 이용해주세요.');
        }
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [phase]);

  const handleQrImageFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 1200 / Math.max(img.width, img.height));
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const qr = jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: 'attemptBoth' });
        const parsedId = qr?.data ? extractSetIdFromQr(qr.data) : '';
        if (parsedId) {
          loadEquipmentSetById(parsedId);
        } else {
          alert('이미지에서 설비 셋트 QR 코드를 찾지 못했습니다. 다시 촬영하거나 아래 목록에서 선택해주세요.');
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const currentQuestion = questions[stepIndex] || null;

  const isQuestionTargetValid = (q, rawVal) => {
    const val = rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : '';
    if (!val) return false;
    if (q?.inputMode === 'value_or_x' || q?.inputMode === 'wheel_number') {
      return val !== 'O' && val !== '△';
    }
    return true;
  };

  const handleSelectAnswer = (qKey, eqId, mark) => {
    setAnswers(prev => ({
      ...prev,
      [qKey]: {
        ...(prev[qKey] || {}),
        [eqId]: mark
      }
    }));
  };

  const handleSelectAllGoodForCurrent = () => {
    if (!currentQuestion || currentQuestion.inputMode === 'value_or_x' || currentQuestion.inputMode === 'wheel_number') return;
    setAnswers(prev => {
      const nextStep = { ...(prev[currentQuestion.key] || {}) };
      currentQuestion.targets.forEach(t => {
        nextStep[t.eqId] = 'O';
      });
      return { ...prev, [currentQuestion.key]: nextStep };
    });
    setHighlightMissing(false);
  };

  const isCurrentStepComplete = currentQuestion
    ? currentQuestion.targets.every(t => isQuestionTargetValid(currentQuestion, answers[currentQuestion.key]?.[t.eqId]))
    : false;

  const handleNextStep = () => {
    if (!currentQuestion) return;
    if (!isCurrentStepComplete) {
      setHighlightMissing(true);
      if (currentQuestion.inputMode === 'wheel_number') {
        alert('모든 설비의 점검 수치를 스크롤로 선택하거나 X(이상)를 선택해주세요.');
      } else if (currentQuestion.inputMode === 'value_or_x') {
        alert('모든 설비의 압력값을 입력하거나 X(이상)를 선택해주세요.');
      } else {
        alert('모든 설비의 점검 결과(O / X / △)를 선택해주세요.');
      }
      return;
    }
    setHighlightMissing(false);
    if (stepIndex < questions.length - 1) {
      setStepIndex(prev => prev + 1);
      if (bodyScrollRef.current) bodyScrollRef.current.scrollTop = 0;
    }
  };

  const handlePrevStep = () => {
    setHighlightMissing(false);
    if (stepIndex > 0) {
      setStepIndex(prev => prev - 1);
      if (bodyScrollRef.current) bodyScrollRef.current.scrollTop = 0;
    } else if (!initialSetId) {
      setPhase('scan');
    }
  };

  const handleCompleteAll = async () => {
    if (!currentQuestion || saving) return;
    // 전체 문항 검증
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const missing = q.targets.some(t => !isQuestionTargetValid(q, answers[q.key]?.[t.eqId]));
      if (missing) {
        setStepIndex(i);
        setHighlightMissing(true);
        alert(`${i + 1}번 질문에서 아직 입력/체크하지 않은 설비가 있습니다.`);
        return;
      }
    }

    setSaving(true);
    try {
      const stampWorker = (workerName || '').trim() || '작업자';
      let hasIssue = false;
      const flatSummaryResults = {};

      // 각 설비 문서의 tpmLogs.{YYYYMM} 에 일별 점검 + 작업자 확인 + 주간 점검 동시 반영
      await Promise.all(
        setEquipments.map(async (eq) => {
          const currentLog = normalizeTpmLog(eq.tpmLogs?.[ymKey]);
          const nextDaily = { ...currentLog.daily };
          const nextWeekly = currentLog.weekly.map(w => ({ ...w }));
          const nextWorker = { ...currentLog.worker, [dayNum]: stampWorker };

          flatSummaryResults[eq.id] = { code: eq.code, name: eq.name, marks: {} };

          const abnormalItems = [];

          questions.forEach((q) => {
            const target = q.targets.find(t => t.eqId === eq.id);
            if (!target) return;
            const mark = String(answers[q.key]?.[eq.id] ?? '').trim();
            const outOfSpec =
              q.wheelSpec &&
              mark &&
              mark !== 'O' &&
              mark !== 'X' &&
              mark !== '△' &&
              Number.isFinite(Number(mark)) &&
              (Number(mark) < q.wheelSpec.minSpec || Number(mark) > q.wheelSpec.maxSpec);

            if (mark === 'X' || mark === '△' || outOfSpec) {
              hasIssue = true;
              abnormalItems.push({
                label: q.partName,
                criterion: outOfSpec
                  ? `${q.criterion} / 입력:${mark}${q.wheelSpec.unit}`
                  : q.criterion,
                mark: mark === '△' ? '△' : 'X'
              });
            }
            flatSummaryResults[eq.id].marks[`${q.partName} (${q.criterion})`] = mark;

            if (q.kind === 'daily') {
              nextDaily[target.rowId] = {
                ...(nextDaily[target.rowId] || {}),
                [dayNum]: mark
              };
            } else if (q.kind === 'weekly') {
              nextWeekly[q.weekIndex] = {
                ...nextWeekly[q.weekIndex],
                result: mark,
                confirm: stampWorker
              };
            }
          });

          const updatedMonthLog = {
            ...currentLog,
            daily: nextDaily,
            weekly: nextWeekly,
            worker: nextWorker
          };

          await updateDoc(doc(db, 'equipments', eq.id), {
            [`tpmLogs.${ymKey}`]: updatedMonthLog
          });

          if (abnormalItems.length > 0) {
            try {
              await syncTpmAbnormalToRepairAndChangePoint({
                equipment: eq,
                dateYmd: effectiveDateStr,
                abnormalItems,
                workerName: stampWorker,
                setName: equipmentSet?.name || ''
              });
            } catch (syncErr) {
              console.error('Failed to auto-sync Joint TPM abnormal to repair/changePoint:', syncErr);
            }
          }
        })
      );

      // 셋트 단위 점검 로그 컬렉션에도 이력 저장
      await addDoc(collection(db, 'tpm_logs'), {
        setId: equipmentSet.id,
        setName: equipmentSet.name,
        reportDate: effectiveDateStr,
        workerName: stampWorker,
        equipmentIds: setEquipments.map(e => e.id),
        equipmentCodes: setEquipments.map(e => e.code),
        results: flatSummaryResults,
        hasIssue,
        createdAt: serverTimestamp()
      });

      const summary = {
        setId: equipmentSet.id,
        setName: equipmentSet.name,
        equipmentCount: setEquipments.length,
        equipmentCodes: setEquipments.map(e => e.code),
        reportDate: effectiveDateStr,
        workerName: stampWorker,
        hasIssue,
        completedAt: new Date().toISOString()
      };

      if (onComplete) onComplete(summary);
    } catch (err) {
      console.error('Failed to save set TPM logs:', err);
      alert('TPM 일지 저장 중 오류가 발생했습니다: ' + (err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  // 가이드 이미지 및 번호별 부위명칭 (첫 설비 템플릿 기준)
  const guideTemplate = normalizeTpmTemplate(setEquipments[0]?.tpmTemplate);
  const guidePhotoSrc = setEquipments.find(e => e.tpmPhoto)?.tpmPhoto || DEFAULT_TPM_GUIDE_PHOTO;
  const activeGuideIdx = currentQuestion?.guideIndex ?? -1;

  const modalUI = (
    <div
      data-joint-tpm-modal="1"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10050,
        background: 'rgba(15, 23, 42, 0.72)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '12px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '760px',
          maxHeight: '94vh',
          background: '#ffffff',
          borderRadius: '14px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 45px rgba(0,0,0,0.32)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '14px 18px', background: '#0f172a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🛠️ {td('가동 전 설비 셋트 TPM 일지 작성')}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              {equipmentSet
                ? td(`점검일자: ${effectiveDateStr} · 셋트: ${equipmentSet.name} (${setEquipments.length}대)`)
                : td(`점검일자: ${effectiveDateStr} · QR 코드 스캔 단계`)}
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              style={{ background: 'rgba(255,255,255,0.12)', border: 'none', color: '#fff', width: '32px', height: '32px', borderRadius: '8px', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}
              title={td('닫기')}
            >
              &times;
            </button>
          )}
        </div>

        {/* Body */}
        <div ref={bodyScrollRef} style={{ flex: 1, overflowY: 'auto', padding: '16px', background: '#f8fafc' }}>
          {phase === 'loading_set' && (
            <div style={{ padding: '48px 16px', textAlign: 'center', color: '#334155', fontWeight: 600 }}>
              {td('설비 셋트 및 TPM 점검 항목을 불러오는 중입니다...')}
            </div>
          )}

          {phase === 'scan' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Live QR Camera Box */}
              <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '10px' }}>
                  {td('📷 설비 셋트 QR 코드를 스캔해주세요')}
                </div>

                {!cameraError ? (
                  <div style={{ position: 'relative', width: '100%', maxWidth: '380px', height: '260px', margin: '0 auto', borderRadius: '10px', overflow: 'hidden', background: '#000', border: '2px solid #2563eb' }}>
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                    <div style={{ position: 'absolute', inset: '32px', border: '2px dashed rgba(96, 165, 250, 0.9)', borderRadius: '12px', pointerEvents: 'none' }} />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                  </div>
                ) : (
                  <div style={{ padding: '18px 14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px', color: '#9a3412', fontSize: '13px', lineHeight: 1.5 }}>
                    {td(cameraError)}
                  </div>
                )}

                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '10px' }}>
                  {td(scanHint)}
                </div>

                {/* 카메라 사진 촬영/이미지 파일로 QR 인식 */}
                <div style={{ marginTop: '12px' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 16px',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #93c5fd',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    <span>{td('📸 QR 사진 촬영 / 이미지로 스캔')}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleQrImageFile}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              {/* 카메라 미지원 PC/비상시 셋트 직접 선택 */}
              <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>
                  {td('📋 구성된 설비 셋트 목록 (카메라 미사용 시 직접 선택 가능)')}
                </div>
                {setsLoading ? (
                  <div style={{ fontSize: '13px', color: '#64748b', padding: '12px 0' }}>{td('셋트 목록 로딩 중...')}</div>
                ) : setsList.length === 0 ? (
                  <div style={{ fontSize: '13px', color: '#94a3b8', padding: '12px 0' }}>
                    {td('설비 관리 > 설비 셋트 구성에서 등록된 셋트가 없습니다.')}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {setsList.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => loadEquipmentSetById(s.id)}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '12px 14px',
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{s.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                            {lang === 'en'
                              ? `Equipments (${(s.equipments || []).length}): `
                              : lang === 'th'
                                ? `เครื่องจักรที่รวม (${(s.equipments || []).length} เครื่อง): `
                                : lang === 'vi'
                                  ? `Thiết bị gồm (${(s.equipments || []).length} máy): `
                                  : `포함 설비 ${(s.equipments || []).length}대: `}
                            {(s.equipments || []).map(e => `${td(e.name)}(${e.code})`).join(', ')}
                          </div>
                        </div>
                        <span style={{ padding: '6px 12px', background: '#2563eb', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {td('선택 →')}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {phase === 'questions' && currentQuestion && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* 진행률 표시 */}
              <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#1d4ed8' }}>
                    {td(`점검 진행 단계: ${stepIndex + 1} / ${questions.length}`)}
                  </span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                    {currentQuestion.inputMode === 'wheel_number'
                      ? td('기준값 스크롤 선택  |  X : 이상')
                      : currentQuestion.inputMode === 'value_or_x'
                        ? td('압력값 직접 입력  |  X : 이상')
                        : td('O : 양호  |  X : 이상  |  △ : 수리')}
                  </span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.round(((stepIndex + 1) / questions.length) * 100)}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #2563eb, #0ea5e9)',
                      transition: 'width 0.2s ease'
                    }}
                  />
                </div>
              </div>

              {/* 상단: TPM 일지 설명 이미지 + 번호별 부위 안내 + 현재 질문 배너 */}
              <div style={{ background: '#fff', border: '2px solid #2563eb', borderRadius: '12px', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'stretch', flexWrap: 'wrap' }}>
                  {/* TPM 설명 이미지 */}
                  <div style={{ width: '190px', flexShrink: 0, margin: '0 auto', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                      src={guidePhotoSrc}
                      alt="TPM 점검 부위 설명 이미지"
                      style={{ width: '100%', maxHeight: '240px', objectFit: 'contain', display: 'block' }}
                    />
                  </div>

                  {/* 우측: 부위 번호표 + 현재 점검 질문 강조 */}
                  <div style={{ flex: '1 1 260px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>
                        {td('📌 설비 점검 부위 안내 (현재 점검 위치 강조)')}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))', gap: '4px' }}>
                        {guideTemplate.legend.filter(Boolean).map((legName, idx) => {
                          const isCurrentPart = idx === activeGuideIdx;
                          return (
                            <div
                              key={idx}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                fontSize: '12px',
                                fontWeight: isCurrentPart ? 800 : 500,
                                background: isCurrentPart ? '#dbeafe' : '#f1f5f9',
                                color: isCurrentPart ? '#1d4ed8' : '#475569',
                                border: isCurrentPart ? '1.5px solid #2563eb' : '1px solid #e2e8f0'
                              }}
                            >
                              {TPM_CIRCLED_NUMBERS[idx]} {td(legName)}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 현재 질문 박스 */}
                    <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '10px', padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{ background: '#2563eb', color: '#fff', fontSize: '13px', fontWeight: 800, padding: '2px 9px', borderRadius: '999px' }}>
                          {td(currentQuestion.badgeNumber)}
                        </span>
                        <span style={{ fontSize: '17px', fontWeight: 900, color: '#0f172a' }}>
                          {td(currentQuestion.partName)}
                        </span>
                        {currentQuestion.partNameEn && (
                          <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                            {td(currentQuestion.partNameEn)}
                          </span>
                        )}
                        {currentQuestion.subStepLabel && (
                          <span style={{ fontSize: '11px', background: '#dbeafe', color: '#1e40af', fontWeight: 700, padding: '2px 7px', borderRadius: '4px' }}>
                            {td('기준')} {currentQuestion.subStepLabel}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#1d4ed8', marginTop: '4px' }}>
                        {td(`점검기준: “${currentQuestion.criterion}”`)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 하단: 구성된 모든 설비(1~N대)에 대해 현재 질문의 답 체크 */}
              <div style={{ background: '#fff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                    {td(`구성 설비별 점검 체크 (${currentQuestion.targets.filter(t => isQuestionTargetValid(currentQuestion, answers[currentQuestion.key]?.[t.eqId])).length} / ${currentQuestion.targets.length}대 완료)`)}
                  </div>
                  {currentQuestion.inputMode === 'wheel_number' ? (() => {
                    const headerSpec = currentQuestion.wheelSpec || parseWheelSpecFromCriterion(currentQuestion.criterion);
                    return (
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1', background: '#e0f2fe', border: '1px solid #7dd3fc', padding: '5px 10px', borderRadius: '6px' }}>
                        {td(`클릭하여 스크롤로 수치 선택 (${headerSpec.centerLabel || '기준'} ${headerSpec.defaultCenter}${headerSpec.unit})`)}
                      </span>
                    );
                  })() : currentQuestion.inputMode === 'value_or_x' ? (
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '5px 10px', borderRadius: '6px' }}>
                      {td('해당 압력값 입력 또는 X(이상) 선택')}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSelectAllGoodForCurrent}
                      style={{
                        padding: '6px 12px',
                        background: '#dcfce7',
                        color: '#166534',
                        border: '1px solid #86efac',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {td('✓ 현재 질문 전체 양호(O) 체크')}
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {currentQuestion.targets.map((target, idx) => {
                    const selectedMark = answers[currentQuestion.key]?.[target.eqId] ?? '';
                    const isValid = isQuestionTargetValid(currentQuestion, selectedMark);
                    const isUncheckedError = highlightMissing && !isValid;
                    const isXSelected = selectedMark === 'X';
                    const pressureInputVal = isXSelected || selectedMark === 'O' || selectedMark === '△'
                      ? ''
                      : selectedMark;
                    const curWheelSpec = currentQuestion.inputMode === 'wheel_number'
                      ? (currentQuestion.wheelSpec || parseWheelSpecFromCriterion(currentQuestion.criterion))
                      : null;
                    return (
                      <div
                        key={target.eqId}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '10px',
                          background: isUncheckedError ? '#fef2f2' : '#f8fafc',
                          border: isUncheckedError ? '2px solid #ef4444' : '1px solid #e2e8f0'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '180px' }}>
                          <span
                            style={{
                              width: '26px',
                              height: '26px',
                              borderRadius: '50%',
                              background: isValid ? (isXSelected ? '#dc2626' : '#2563eb') : '#64748b',
                              color: '#fff',
                              fontSize: '13px',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                              {target.eqCode ? `${target.eqCode}` : `${td('설비')} ${idx + 1}`}
                              <span style={{ fontWeight: 600, color: '#475569', marginLeft: '6px', fontSize: '13px' }}>
                                ({td(target.eqName)})
                              </span>
                            </div>
                          </div>
                        </div>

                        {currentQuestion.inputMode === 'wheel_number' ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: '1 1 255px', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              data-tpm-wheel-trigger={idx}
                              onClick={() => {
                                const shortTitle = (currentQuestion.criterion || '').includes(':')
                                  ? currentQuestion.criterion.split(':')[0].trim()
                                  : currentQuestion.partName;
                                setWheelTarget({
                                  qKey: currentQuestion.key,
                                  eqId: target.eqId,
                                  itemTitle: td(shortTitle),
                                  eqLabel: target.eqCode ? `${target.eqCode} (${td(target.eqName)})` : `${td('설비')} ${idx + 1}`,
                                  currentVal: pressureInputVal,
                                  spec: curWheelSpec
                                });
                              }}
                              style={{
                                flex: '1 1 180px',
                                maxWidth: '250px',
                                padding: '9px 12px',
                                borderRadius: '8px',
                                fontSize: '13.5px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '6px',
                                background: pressureInputVal.trim()
                                  ? '#f0fdf4'
                                  : (isXSelected ? '#f1f5f9' : '#eff6ff'),
                                color: pressureInputVal.trim()
                                  ? '#0f172a'
                                  : (isXSelected ? '#64748b' : '#0369a1'),
                                border: pressureInputVal.trim()
                                  ? '2px solid #16a34a'
                                  : (isXSelected ? '1px solid #cbd5e1' : '1.5px solid #38bdf8')
                              }}
                            >
                              <span style={{ flex: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>
                                {pressureInputVal.trim()
                                  ? `${pressureInputVal} ${curWheelSpec.unit}`
                                  : isXSelected
                                    ? td('X 선택됨 (스크롤 변경)')
                                    : td(`${curWheelSpec.centerLabel || '기준'} ${curWheelSpec.defaultCenter}${curWheelSpec.unit} · 스크롤 선택`)}
                              </span>
                              <span style={{ fontSize: '12px', opacity: 0.75 }}>↕</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSelectAnswer(currentQuestion.key, target.eqId, isXSelected ? '' : 'X')}
                              style={{
                                minWidth: '82px',
                                padding: '9px 12px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                background: isXSelected ? '#dc2626' : '#fef2f2',
                                color: isXSelected ? '#ffffff' : '#991b1b',
                                border: isXSelected ? '2px solid #b91c1c' : '1px solid #fecaca',
                                boxShadow: isXSelected ? '0 2px 6px rgba(220,38,38,0.2)' : 'none',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {td('X 이상')}
                            </button>
                          </div>
                        ) : currentQuestion.inputMode === 'value_or_x' ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: '1 1 240px', justifyContent: 'flex-end' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: '1 1 155px', maxWidth: '215px' }}>
                              <input
                                type="text"
                                inputMode="decimal"
                                data-tpm-pressure-input={idx}
                                placeholder={isXSelected ? td('X 선택됨 (값 입력 가능)') : td('압력값 입력 (예: 120)')}
                                value={pressureInputVal}
                                onChange={(e) => {
                                  const raw = e.target.value;
                                  const upper = raw.trim().toUpperCase();
                                  if (upper === 'X') {
                                    handleSelectAnswer(currentQuestion.key, target.eqId, 'X');
                                    return;
                                  }
                                  if (upper === 'O' || raw.trim() === '△') return;
                                  handleSelectAnswer(currentQuestion.key, target.eqId, raw);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const nextEl = e.currentTarget
                                      .closest('[data-joint-tpm-modal="1"]')
                                      ?.querySelector(`[data-tpm-pressure-input="${idx + 1}"]`);
                                    if (nextEl) nextEl.focus();
                                  }
                                }}
                                style={{
                                  width: '100%',
                                  padding: '9px 10px',
                                  borderRadius: '8px',
                                  fontSize: '14px',
                                  fontWeight: 800,
                                  textAlign: 'center',
                                  outline: 'none',
                                  background: pressureInputVal.trim() ? '#f0fdf4' : (isXSelected ? '#f1f5f9' : '#ffffff'),
                                  color: '#0f172a',
                                  border: pressureInputVal.trim() ? '2px solid #16a34a' : '1px solid #cbd5e1',
                                  boxSizing: 'border-box'
                                }}
                              />
                              <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', whiteSpace: 'nowrap' }}>
                                kg/cm²
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleSelectAnswer(currentQuestion.key, target.eqId, isXSelected ? '' : 'X')}
                              style={{
                                minWidth: '82px',
                                padding: '9px 12px',
                                borderRadius: '8px',
                                fontSize: '13px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                background: isXSelected ? '#dc2626' : '#fef2f2',
                                color: isXSelected ? '#ffffff' : '#991b1b',
                                border: isXSelected ? '2px solid #b91c1c' : '1px solid #fecaca',
                                boxShadow: isXSelected ? '0 2px 6px rgba(220,38,38,0.2)' : 'none',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {td('X 이상')}
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px', flex: '1 1 220px', justifyContent: 'flex-end' }}>
                            {CHOICE_OPTIONS.map((opt) => {
                              const isSelected = selectedMark === opt.mark;
                              return (
                                <button
                                  key={opt.mark}
                                  type="button"
                                  onClick={() => handleSelectAnswer(currentQuestion.key, target.eqId, opt.mark)}
                                  style={{
                                    flex: 1,
                                    minWidth: '72px',
                                    maxWidth: '105px',
                                    padding: '9px 8px',
                                    borderRadius: '8px',
                                    fontSize: '13px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    background: isSelected ? opt.activeBg : opt.idleBg,
                                    color: isSelected ? '#ffffff' : opt.idleColor,
                                    border: isSelected ? `2px solid ${opt.activeBorder}` : '1px solid #cbd5e1',
                                    boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.15)' : 'none'
                                  }}
                                >
                                  {td(opt.label)}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 18px', background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
          {phase === 'questions' ? (
            <>
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={saving || (stepIndex === 0 && Boolean(initialSetId))}
                style={{
                  padding: '10px 18px',
                  background: '#e2e8f0',
                  color: '#1e293b',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: saving || (stepIndex === 0 && Boolean(initialSetId)) ? 'not-allowed' : 'pointer',
                  opacity: saving || (stepIndex === 0 && Boolean(initialSetId)) ? 0.5 : 1
                }}
              >
                {stepIndex === 0 ? td('← QR 다시 스캔') : td('← 이전 질문')}
              </button>

              {stepIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  style={{
                    flex: 1,
                    maxWidth: '360px',
                    padding: '12px 20px',
                    background: isCurrentStepComplete ? '#2563eb' : '#94a3b8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {td(`다음 질문 (${stepIndex + 2} / ${questions.length}) →`)}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleCompleteAll}
                  style={{
                    flex: 1,
                    maxWidth: '400px',
                    padding: '12px 20px',
                    background: isCurrentStepComplete ? '#16a34a' : '#94a3b8',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: 800,
                    cursor: saving ? 'wait' : 'pointer'
                  }}
                >
                  {saving ? td('TPM 일지 저장 중...') : td('✅ 점검 완료 · 다음 단계(일보 입력) 이동')}
                </button>
              )}
            </>
          ) : (
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              {onSkip && (
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    onSkip();
                  }}
                  style={{ padding: '10px 20px', background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {td('⏭️ 스킵')}
                </button>
              )}
              {onClose && (
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    onClose();
                  }}
                  style={{ padding: '10px 22px', background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {td('닫기')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {wheelTarget && (
        <TpmWheelNumberPickerModal
          isOpen={Boolean(wheelTarget)}
          title={`${wheelTarget.itemTitle || '수치 선택'} — ${wheelTarget.eqLabel}`}
          initialValue={wheelTarget.currentVal}
          defaultCenter={wheelTarget.spec.defaultCenter}
          tolerance={wheelTarget.spec.tolerance}
          minSpec={wheelTarget.spec.minSpec}
          maxSpec={wheelTarget.spec.maxSpec}
          range={wheelTarget.spec.range}
          unit={wheelTarget.spec.unit}
          centerLabel={wheelTarget.spec.centerLabel || '기준'}
          allowX={true}
          onConfirm={(nextVal) => {
            handleSelectAnswer(wheelTarget.qKey, wheelTarget.eqId, nextVal);
            setWheelTarget(null);
          }}
          onClose={() => setWheelTarget(null)}
        />
      )}
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalUI, document.body) : modalUI;
}
