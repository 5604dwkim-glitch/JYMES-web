// 설비 일상 점검(TPM) 일지 기본 양식 (종이 일지 "설비 일상 점검 일지" 기준)
// - 설비별로 수정한 양식은 equipments/{id}.tpmTemplate 에 저장되며, 없으면 이 기본값을 사용합니다.

export const TPM_MARKS = ['', 'O', 'X', '△'];

export const TPM_CIRCLED_NUMBERS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

// 종이 TPM 일지 좌측 상단의 번호(1~7) 표시 설비 가이드 이미지
export const DEFAULT_TPM_GUIDE_PHOTO = '/images/tpm_guide_photo.jpg';

export const createDefaultTpmTemplate = () => ({
  // 사진 옆 "번호 / 부위명칭" 표 (10행)
  legend: ['콘트롤판넬', '온조기', '압력게이지', '비상스위치', '오일게이지', '안전센스', '비상벨', '', '', ''],
  // 주간 점검 기록 (제1~5주)
  weekly: Array.from({ length: 5 }, () => ({
    part: '오일게이지',
    criterion: '관리선(Max, Min)내에 있는가?'
  })),
  // 일상 점검 항목 (rows 는 점검기준 행, id 는 일별 기록 저장 키)
  items: [
    { id: 'i1', name: '콘드롤 판넬', nameEn: '(Control panel)', rows: [{ id: 'i1a', criterion: '정상적으로 작동하는가' }] },
    { id: 'i2', name: '온조기', nameEn: '(Water Temprature)', rows: [{ id: 'i2a', criterion: '60℃±10' }] },
    {
      id: 'i3',
      name: '압력 게이지',
      nameEn: '(Pressure gauge)',
      rows: [
        { id: 'i3a', criterion: '형체압력:100~150kg/cm²' },
        { id: 'i3b', criterion: '메인압력:100~150kg/cm²' }
      ]
    },
    { id: 'i4', name: '비상 스위치', nameEn: '(Emergency switch)', rows: [{ id: 'i4a', criterion: '정상적으로 작동하는가' }] },
    { id: 'i5', name: '금형온도 F/Proof', nameEn: '(Mold Temp F/proof)', rows: [{ id: 'i5a', criterion: '정상적으로 작동하는가' }] },
    { id: 'i6', name: '안전센서', nameEn: '(Safety Sensor)', rows: [{ id: 'i6a', criterion: '정상적으로 작동하는가' }] },
    { id: 'i7', name: '비상벨', nameEn: '(Emergency bell)', rows: [{ id: 'i7a', criterion: '정상적으로 작동하는가' }] }
  ]
});

export const createEmptyTpmLog = () => ({
  weekly: Array.from({ length: 5 }, () => ({ result: '', action: '', confirm: '' })),
  daily: {}, // { [rowId]: { [day]: 'O' | 'X' | '△' } }
  worker: {}, // { [day]: 작업자 확인(이름) }
  manager: {} // { [day]: 관리자 확인(이름) }
});

export const getTpmLogKey = (year, month) => `${year}${String(month).padStart(2, '0')}`;

export const normalizeTpmTemplate = (tpl) => {
  const base = createDefaultTpmTemplate();
  if (!tpl || !Array.isArray(tpl.items) || tpl.items.length === 0) return base;
  return {
    legend: Array.from({ length: 10 }, (_, i) => (tpl.legend && tpl.legend[i]) || ''),
    weekly: Array.from({ length: 5 }, (_, i) => ({
      part: tpl.weekly?.[i]?.part ?? base.weekly[i].part,
      criterion: tpl.weekly?.[i]?.criterion ?? base.weekly[i].criterion
    })),
    items: tpl.items.map(it => ({
      id: it.id,
      name: it.name || '',
      nameEn: it.nameEn || '',
      rows: (it.rows || []).map(r => ({ id: r.id, criterion: r.criterion || '' }))
    }))
  };
};

export const normalizeTpmLog = (log) => {
  const empty = createEmptyTpmLog();
  if (!log) return empty;
  return {
    weekly: empty.weekly.map((w, i) => ({ ...w, ...(log.weekly?.[i] || {}) })),
    daily: log.daily ? { ...log.daily } : {},
    worker: log.worker ? { ...log.worker } : {},
    manager: log.manager ? { ...log.manager } : {}
  };
};

/**
 * 온조기(Water Temperature) 항목 여부 판별
 * - 직접 타이핑이 아닌 기준값(예: 60℃±10 -> 기준 60℃) 셋팅 스크롤 휠 방식으로 수치를 선택합니다.
 */
export const isWaterTempWheelRow = (row, item) => {
  if (row?.id === 'i2a' || item?.id === 'i2') return true;
  const partName = String(item?.name || '');
  const crit = String(row?.criterion || '');
  if (/온조기|water\s*temp/i.test(partName)) return true;
  if (/(?:℃|°C)/.test(crit) && !/형체\s*압력|메인\s*압력/.test(crit)) return true;
  return false;
};

/**
 * 형체압력 / 메인압력 항목 여부 판별
 * - 범위 중간값(예: 100~150kg/cm² -> 기본 125kg/cm²) 셋팅 스크롤 휠 방식 또는 X(이상) 선택을 사용합니다.
 */
export const isPressureValueRow = (row) => {
  if (!row) return false;
  if (row.id === 'i3a' || row.id === 'i3b') return true;
  const crit = String(row.criterion || '');
  return /형체\s*압력|메인\s*압력/.test(crit);
};

/**
 * 점검기준 문자열(예: "60℃±10", "형체압력:100~150kg/cm²")에서 스크롤 휠 기본값(기준/중간값)·범위·단위를 추출합니다.
 */
export const parseWheelSpecFromCriterion = (
  criterion,
  fallback = { defaultCenter: 60, tolerance: 10, minSpec: 50, maxSpec: 70, range: 30, unit: '℃', centerLabel: '기준' }
) => {
  const crit = String(criterion || '');
  const detectedUnit = /kg\/cm/i.test(crit)
    ? 'kg/cm²'
    : (/(?:℃|°C)/.test(crit) ? '℃' : fallback.unit);

  // 1) 범위 형태 (예: "형체압력:100~150kg/cm²", "100 ~ 150") -> 중간값 셋팅
  const rangeMatch = crit.match(/(\d+(?:\.\d+)?)\s*[~∼]\s*(\d+(?:\.\d+)?)/);
  if (rangeMatch) {
    const rawA = Number(rangeMatch[1]);
    const rawB = Number(rangeMatch[2]);
    if (Number.isFinite(rawA) && Number.isFinite(rawB)) {
      const minSpec = Math.round(Math.min(rawA, rawB));
      const maxSpec = Math.round(Math.max(rawA, rawB));
      const midpoint = Math.round((minSpec + maxSpec) / 2);
      const halfSpan = Math.max(5, Math.round((maxSpec - minSpec) / 2));
      return {
        defaultCenter: midpoint,
        tolerance: halfSpan,
        minSpec,
        maxSpec,
        range: Math.max(40, maxSpec - minSpec),
        unit: detectedUnit,
        centerLabel: '기본'
      };
    }
  }

  // 2) 기준 ± 공차 형태 (예: "60℃±10", "60°C+10") -> 기준값 셋팅
  const tolMatch = crit.match(/(-?\d+(?:\.\d+)?)\s*(?:℃|°C|도)?\s*(?:[±+-]\s*(\d+(?:\.\d+)?))?/i);
  if (tolMatch) {
    const center = Math.round(Number(tolMatch[1]));
    const tol = tolMatch[2] !== undefined ? Math.round(Number(tolMatch[2])) : fallback.tolerance;
    if (Number.isFinite(center)) {
      const safeTol = Number.isFinite(tol) ? tol : fallback.tolerance;
      return {
        defaultCenter: center,
        tolerance: safeTol,
        minSpec: center - safeTol,
        maxSpec: center + safeTol,
        range: Math.max(30, safeTol * 3),
        unit: detectedUnit,
        centerLabel: '기준'
      };
    }
  }

  return { ...fallback, unit: detectedUnit };
};

/**
 * 행(row, item)에 해당하는 스크롤 휠 스펙을 반환합니다.
 */
export const getRowWheelSpec = (row, item) => {
  if (isPressureValueRow(row)) {
    return parseWheelSpecFromCriterion(row?.criterion, {
      defaultCenter: 125,
      tolerance: 25,
      minSpec: 100,
      maxSpec: 150,
      range: 50,
      unit: 'kg/cm²',
      centerLabel: '기본'
    });
  }
  if (isWaterTempWheelRow(row, item)) {
    return parseWheelSpecFromCriterion(row?.criterion, {
      defaultCenter: 60,
      tolerance: 10,
      minSpec: 50,
      maxSpec: 70,
      range: 30,
      unit: '℃',
      centerLabel: '기준'
    });
  }
  return null;
};

/**
 * 셋트 내 여러 설비의 TPM 템플릿을 항목별 질문 단위로 묶어 반환합니다.
 * - 동일한 부위·점검기준 질문은 하나의 단계로 통합되어 설비 1..N 을 한 화면에서 체크합니다.
 */
export const buildGroupedTpmQuestions = (equipments = [], weekIndex = 0) => {
  const questionMap = new Map();
  const orderedQuestions = [];

  equipments.forEach((eq) => {
    const tpl = normalizeTpmTemplate(eq.tpmTemplate);
    tpl.items.forEach((item, itemIdx) => {
      const totalRows = item.rows.length;
      item.rows.forEach((row, rowIdx) => {
        const groupKey = `daily::${item.name.trim()}::${row.criterion.trim()}`;
        const rowWheelSpec = getRowWheelSpec(row, item);
        const nextMode = rowWheelSpec ? 'wheel_number' : 'mark';
        let q = questionMap.get(groupKey);
        if (!q) {
          q = {
            key: groupKey,
            kind: 'daily',
            inputMode: nextMode,
            wheelSpec: rowWheelSpec,
            badgeNumber: TPM_CIRCLED_NUMBERS[itemIdx] || `${itemIdx + 1}`,
            guideIndex: itemIdx, // 0-based -> 1..7 on photo
            partName: item.name,
            partNameEn: item.nameEn || '',
            subStepLabel: totalRows > 1 ? `${rowIdx + 1}/${totalRows}` : '',
            criterion: row.criterion,
            targets: []
          };
          questionMap.set(groupKey, q);
          orderedQuestions.push(q);
        } else if (nextMode !== 'mark' && q.inputMode === 'mark') {
          q.inputMode = nextMode;
          if (rowWheelSpec && !q.wheelSpec) {
            q.wheelSpec = rowWheelSpec;
          }
        }
        q.targets.push({
          eqId: eq.id,
          eqCode: eq.code,
          eqName: eq.name,
          rowId: row.id
        });
      });
    });
  });

  // 주간 점검 기록 (해당 주차: 제1주~제5주) 질문 추가
  const safeWeekIdx = Math.max(0, Math.min(4, weekIndex));
  const weeklyMap = new Map();
  equipments.forEach((eq) => {
    const tpl = normalizeTpmTemplate(eq.tpmTemplate);
    const w = tpl.weekly[safeWeekIdx] || { part: '오일게이지', criterion: '관리선(Max, Min)내에 있는가?' };
    const groupKey = `weekly::${safeWeekIdx}::${w.part.trim()}::${w.criterion.trim()}`;
    let q = weeklyMap.get(groupKey);
    if (!q) {
      // 사진 가이드의 ⑤ 오일게이지 (index 4) 매칭
      const legendIdx = tpl.legend.findIndex(l => l && w.part && l.replace(/\s+/g, '') === w.part.replace(/\s+/g, ''));
      q = {
        key: groupKey,
        kind: 'weekly',
        weekIndex: safeWeekIdx,
        badgeNumber: `제${safeWeekIdx + 1}주`,
        guideIndex: legendIdx >= 0 ? legendIdx : 4,
        partName: `${w.part} (주간점검)`,
        partNameEn: `제(${safeWeekIdx + 1})주 주간 점검 기록`,
        subStepLabel: '',
        criterion: w.criterion,
        targets: []
      };
      weeklyMap.set(groupKey, q);
      orderedQuestions.push(q);
    }
    q.targets.push({
      eqId: eq.id,
      eqCode: eq.code,
      eqName: eq.name,
      weekIndex: safeWeekIdx
    });
  });

  return orderedQuestions;
};

export const TPM_MANAGER_STAMP_STORAGE_KEY = 'jymes_tpm_manager_stamp';

export const getSavedManagerStamp = (fallbackName = '') => {
  try {
    const saved = window.localStorage.getItem(TPM_MANAGER_STAMP_STORAGE_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {
    // ignore storage errors
  }
  const cleanFallback = String(fallbackName || '').trim();
  if (cleanFallback && cleanFallback !== '관리자') return cleanFallback;
  return '확인';
};

export const saveManagerStamp = (stampValue) => {
  const trimmed = String(stampValue || '').trim();
  try {
    if (trimmed) {
      window.localStorage.setItem(TPM_MANAGER_STAMP_STORAGE_KEY, trimmed);
    }
  } catch {
    // ignore storage errors
  }
  return trimmed || '확인';
};

/**
 * 특정 설비의 지정 일자(year, month, day) TPM 점검 상태 및 이상 유무를 평가합니다.
 * - status:
 *   'unchecked'       : 작업자 점검 기록 없음 (미가동/미작성)
 *   'issue_pending'   : 이상(X/△/기준이탈) 있음 & 관리자 미확인
 *   'issue_confirmed' : 이상(X/△/기준이탈) 있음 & 관리자 확인 완료
 *   'pending'         : 정상 점검 완료 & 관리자 미확인
 *   'confirmed'       : 정상 점검 완료 & 관리자 확인 완료
 */
export const evaluateEquipmentDayTpm = (equipment, year, month, day, overrideLogKey = null) => {
  const tpl = normalizeTpmTemplate(equipment?.tpmTemplate);
  const logKey = overrideLogKey || getTpmLogKey(year, month);
  const monthLog = equipment?.tpmLogs?.[logKey] || null;

  const allRows = [];
  (tpl.items || []).forEach((item) => {
    (item.rows || []).forEach((row) => {
      allRows.push({
        item,
        row,
        wheelSpec: getRowWheelSpec(row, item)
      });
    });
  });

  let checkedCount = 0;
  const issues = [];
  const numericHighlights = [];

  allRows.forEach(({ item, row, wheelSpec }) => {
    const rawVal = monthLog?.daily?.[row.id]?.[day];
    const val = rawVal !== undefined && rawVal !== null ? String(rawVal).trim() : '';
    if (!val) return;

    checkedCount += 1;
    const shortPart = (row.criterion || '').includes(':')
      ? row.criterion.split(':')[0].trim()
      : (item.name || '점검항목');

    if (val === 'X') {
      issues.push({ type: 'X', label: `${shortPart}: X(이상)` });
    } else if (val === '△') {
      issues.push({ type: '△', label: `${shortPart}: △(수리)` });
    } else if (wheelSpec && val !== 'O') {
      const num = Number(val);
      if (Number.isFinite(num)) {
        if (num < wheelSpec.minSpec || num > wheelSpec.maxSpec) {
          issues.push({
            type: 'OUT_OF_SPEC',
            label: `${shortPart}: ${val}${wheelSpec.unit}(기준이탈)`
          });
        } else {
          numericHighlights.push(`${shortPart} ${val}${wheelSpec.unit}`);
        }
      }
    }
  });

  const workerStamp = String(monthLog?.worker?.[day] ?? '').trim();
  const managerStamp = String(monthLog?.manager?.[day] ?? '').trim();
  const hasWorkerRecord = Boolean(workerStamp) || checkedCount > 0;

  let status = 'unchecked';
  if (!hasWorkerRecord) {
    status = 'unchecked';
  } else if (issues.length > 0) {
    status = managerStamp ? 'issue_confirmed' : 'issue_pending';
  } else {
    status = managerStamp ? 'confirmed' : 'pending';
  }

  return {
    logKey,
    totalRows: allRows.length,
    checkedCount,
    workerStamp,
    managerStamp,
    hasWorkerRecord,
    issues,
    numericHighlights,
    status
  };
};

/**
 * 단일 설비의 tpmLogs 전체 월 데이터를 스캔하여
 * 작업자 점검 기록은 있으나 관리자 확인(managerStamp)이 완료되지 않은
 * 모든 미승인(미확인) 일지 항목을 수집합니다.
 */
export const collectUnapprovedEquipmentTpmLogs = (equipment) => {
  const logsMap = equipment?.tpmLogs;
  if (!logsMap || typeof logsMap !== 'object') return [];

  const entries = [];

  Object.entries(logsMap).forEach(([rawKey, monthLog]) => {
    if (!monthLog || typeof monthLog !== 'object') return;
    const keyMatch = String(rawKey).trim().match(/^(\d{4})-?(\d{1,2})$/);
    if (!keyMatch) return;

    const year = Number(keyMatch[1]);
    const month = Number(keyMatch[2]);
    if (!year || month < 1 || month > 12) return;

    const candidateDays = new Set();

    if (monthLog.worker && typeof monthLog.worker === 'object') {
      Object.entries(monthLog.worker).forEach(([dKey, val]) => {
        if (String(val ?? '').trim() !== '') {
          const d = Number(dKey);
          if (Number.isInteger(d) && d >= 1 && d <= 31) candidateDays.add(d);
        }
      });
    }

    if (monthLog.daily && typeof monthLog.daily === 'object') {
      Object.values(monthLog.daily).forEach((rowMap) => {
        if (!rowMap || typeof rowMap !== 'object') return;
        Object.entries(rowMap).forEach(([dKey, val]) => {
          if (String(val ?? '').trim() !== '') {
            const d = Number(dKey);
            if (Number.isInteger(d) && d >= 1 && d <= 31) candidateDays.add(d);
          }
        });
      });
    }

    candidateDays.forEach((day) => {
      const mgrStamp = String(monthLog?.manager?.[day] ?? '').trim();
      if (mgrStamp) return;

      const evalResult = evaluateEquipmentDayTpm(equipment, year, month, day, rawKey);
      if (evalResult.hasWorkerRecord && !evalResult.managerStamp) {
        const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        entries.push({
          year,
          month,
          day,
          date,
          logKey: rawKey,
          evalResult
        });
      }
    });
  });

  entries.sort((a, b) => a.date.localeCompare(b.date));
  return entries;
};
