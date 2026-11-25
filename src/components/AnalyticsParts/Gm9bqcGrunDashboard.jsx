import React, { useState, useEffect, useMemo, useRef, Suspense, lazy } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import {
  resolveGm9bqcProcessCode,
  buildGm9bqcGrunDashboardModel,
  MATERIAL_TRACE_OPTIONS,
  buildMaterialWeeklyLotTimeline
} from '../../services/gm9bqcGrunEngine';
import {
  fetch9bqcGrunHistoryWindow,
  get9bqcGrunHistoryCacheSync,
  has9bqcGrunHistoryCoverageSync,
  get9bqcTodaySnapshotCache,
  set9bqcTodaySnapshotCache
} from '../../services/firestore';

const LegacyDetailModal = lazy(() => import('../DynamicForms/LegacyDetailModal'));

function formatTodayYmd() {
  return new Date().toLocaleDateString('sv-SE');
}

function shiftDateYmd(ymd, offsetDays) {
  if (!ymd) return ymd;
  const d = new Date(`${ymd}T00:00:00`);
  if (Number.isNaN(d.getTime())) return ymd;
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * 우하단 부자재 LOT 현황 카드 좌측 미니 바코드 아이콘
 */
function MiniBarcode({ seedText, isEmpty }) {
  const bars = useMemo(() => {
    const seed = seedText || 'JYMES-9BQC';
    const widths = [2, 1, 3, 1, 2, 1, 2, 3, 1, 2, 1];
    const out = [];
    for (let i = 0; i < widths.length; i += 1) {
      const code = seed.charCodeAt(i % seed.length) || 1;
      out.push(((widths[i] + code) % 3) + 1);
    }
    return out;
  }, [seedText]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: '1.5px',
        height: '28px',
        padding: '0 4px',
        opacity: isEmpty ? 0.3 : 0.9,
        flexShrink: 0
      }}
      aria-hidden="true"
    >
      {bars.map((w, idx) => (
        <span
          key={idx}
          style={{
            display: 'inline-block',
            width: `${w * 1.3}px`,
            background: '#0f172a',
            borderRadius: '0.5px'
          }}
        />
      ))}
    </div>
  );
}

export default function Gm9bqcGrunDashboard({ reports = [], reportsLoading = false, isActive = true }) {
  const today = useMemo(() => formatTodayYmd(), []);
  const yesterday = useMemo(() => shiftDateYmd(today, -1), [today]);

  // localStorage 영구 캐시 + 메모리 캐시에서 첫 프레임(0ms)에 동기 초기화
  const initialSyncRef = useRef(null);
  if (!initialSyncRef.current) {
    const initHistoryStart = shiftDateYmd(today, -21);
    const cachedHist = get9bqcGrunHistoryCacheSync(initHistoryStart, yesterday);
    const histCovered = has9bqcGrunHistoryCoverageSync(initHistoryStart, yesterday);
    const cachedToday = get9bqcTodaySnapshotCache(today);
    const allCached = [...(cachedHist || []), ...(cachedToday || [])];
    const hasTodayCachedReport =
      Array.isArray(cachedToday) && cachedToday.some((r) => Boolean(resolveGm9bqcProcessCode(r)));
    let latestCachedDate = null;
    allCached.forEach((r) => {
      if (r?.date && resolveGm9bqcProcessCode(r) && (!latestCachedDate || r.date > latestCachedDate)) {
        latestCachedDate = r.date;
      }
    });
    const defaultDate =
      !hasTodayCachedReport && histCovered && latestCachedDate ? latestCachedDate : today;
    initialSyncRef.current = {
      cachedHist,
      histCovered,
      cachedToday: cachedToday || [],
      hasTodayCache: Boolean(cachedToday),
      defaultDate,
      autoAppliedFromCache: Boolean(!hasTodayCachedReport && histCovered && latestCachedDate)
    };
  }
  const initSnap = initialSyncRef.current;

  const [viewMode, setViewMode] = useState('single'); // 'single' | 'range'
  const [selectedDate, setSelectedDate] = useState(initSnap.defaultDate);
  const [rangeStart, setRangeStart] = useState(initSnap.defaultDate);
  const [rangeEnd, setRangeEnd] = useState(initSnap.defaultDate);
  const userChangedDateRef = useRef(false);
  const autoAppliedLatestRef = useRef(initSnap.autoAppliedFromCache);
  const hasInitializedHistoryRef = useRef(initSnap.histCovered);
  const forceHistoryRefreshRef = useRef(false);

  const [selectedMaterialKey, setSelectedMaterialKey] = useState('FRT_A');
  const [lotWeekOffset, setLotWeekOffset] = useState(0);
  const [lotSearch, setLotSearch] = useState('');
  const [exporting, setExporting] = useState(false);

  // 과거(-14일 추적 풀) 누적 캐시 상태 + 오늘 날짜 전용 실시간 onSnapshot 상태
  const [historyReports, setHistoryReports] = useState(() => initSnap.cachedHist);
  const [historyResolved, setHistoryResolved] = useState(() => initSnap.histCovered);
  const [historyRefreshTick, setHistoryRefreshTick] = useState(0);
  const [liveTodayReports, setLiveTodayReports] = useState(() => initSnap.cachedToday);
  const [todayResolved, setTodayResolved] = useState(() => initSnap.hasTodayCache);
  const [liveStatus, setLiveStatus] = useState(() => {
    if (initSnap.histCovered && initSnap.defaultDate < today) return 'history';
    if (initSnap.hasTodayCache) return 'live';
    return 'connecting';
  }); // 'connecting' | 'live' | 'history' | 'fallback'
  const [lastSyncedAt, setLastSyncedAt] = useState(() =>
    initSnap.histCovered || initSnap.hasTodayCache
      ? new Date().toLocaleTimeString('ko-KR', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      : ''
  );

  // 상세 드릴다운 모달 상태
  const [inspectorModal, setInspectorModal] = useState(null); // { type: 'process' | 'sublot' | 'lot_track', data }
  const [detailReport, setDetailReport] = useState(null);

  const effectiveStart =
    viewMode === 'single' ? selectedDate : rangeStart <= rangeEnd ? rangeStart : rangeEnd;
  const effectiveEnd =
    viewMode === 'single' ? selectedDate : rangeStart <= rangeEnd ? rangeEnd : rangeStart;

  useEffect(() => {
    setLotWeekOffset(0);
  }, [effectiveEnd]);

  const lotWeekEnd = useMemo(
    () => shiftDateYmd(effectiveEnd, lotWeekOffset * 7),
    [effectiveEnd, lotWeekOffset]
  );
  const lotWeekStart = useMemo(() => shiftDateYmd(lotWeekEnd, -6), [lotWeekEnd]);

  const trackingQueryStart = useMemo(() => shiftDateYmd(effectiveStart, -14), [effectiveStart]);
  const lotTrackingStart = useMemo(() => shiftDateYmd(lotWeekStart, -14), [lotWeekStart]);
  const minTrackingStart = useMemo(
    () => (lotTrackingStart && lotTrackingStart < trackingQueryStart ? lotTrackingStart : trackingQueryStart),
    [lotTrackingStart, trackingQueryStart]
  );
  const maxQueryEnd = useMemo(
    () => (lotWeekEnd && lotWeekEnd > effectiveEnd ? lotWeekEnd : effectiveEnd),
    [lotWeekEnd, effectiveEnd]
  );
  const includesToday = maxQueryEnd >= today;
  const historyEndNeeded = maxQueryEnd < today ? maxQueryEnd : yesterday;
  // 초기 진입 시에는 21일 전까지 1회만 선조회하여, 오늘 일보 0건 -> 최근 가동일 자동 전환 시 추가 읽기 0회 보장
  const historyStartNeeded = useMemo(() => {
    if (!minTrackingStart) return '';
    if (!hasInitializedHistoryRef.current && effectiveStart === today && lotWeekOffset === 0) {
      return shiftDateYmd(today, -21);
    }
    return minTrackingStart;
  }, [minTrackingStart, effectiveStart, lotWeekOffset, today]);

  // 1) 과거 날짜 구간(-14일 추적 풀): localStorage+RAM 영구 캐시로 0ms 즉시 표시 후, 변동분(updatedAtMs) 및 누락 구간만 증분 동기화
  useEffect(() => {
    if (!historyStartNeeded || !historyEndNeeded || historyStartNeeded > historyEndNeeded) {
      setHistoryReports([]);
      setHistoryResolved(true);
      return undefined;
    }

    let cancelled = false;
    const forceRefresh = forceHistoryRefreshRef.current;
    forceHistoryRefreshRef.current = false;
    const alreadyCovered = !forceRefresh && has9bqcGrunHistoryCoverageSync(historyStartNeeded, historyEndNeeded);
    if (!includesToday && !alreadyCovered) setLiveStatus('connecting');

    fetch9bqcGrunHistoryWindow({
      startDate: historyStartNeeded,
      endDate: historyEndNeeded,
      forceRefresh,
      onDeltaSynced: (updatedDocs) => {
        if (cancelled) return;
        setHistoryReports(Array.isArray(updatedDocs) ? updatedDocs : []);
        setLastSyncedAt(
          new Date().toLocaleTimeString('ko-KR', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        );
      }
    })
      .then((docs) => {
        if (cancelled) return;
        hasInitializedHistoryRef.current = true;
        setHistoryReports(Array.isArray(docs) ? docs : []);
        setHistoryResolved(true);
        if (!includesToday) {
          setLiveStatus('history');
          setLastSyncedAt(
            new Date().toLocaleTimeString('ko-KR', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })
          );
        }
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('9BQC G/RUN 과거 이력 조회 오류:', err);
        setHistoryResolved(true);
        if (!includesToday) setLiveStatus('fallback');
      });

    return () => {
      cancelled = true;
    };
  }, [historyStartNeeded, historyEndNeeded, historyRefreshTick, includesToday]);

  // 2) 실시간 onSnapshot 구독은 해당 탭이 활성이고 오늘(today)이 조회 범위에 포함된 경우에만 한정
  useEffect(() => {
    if (!includesToday) {
      setLiveStatus((prev) => (prev === 'fallback' ? prev : 'history'));
      return undefined;
    }
    if (!isActive) {
      return undefined;
    }

    if (!get9bqcTodaySnapshotCache(today)) {
      setLiveStatus('connecting');
    }

    let cancelled = false;
    let activeUnsub = () => {};

    const attachListener = (scopedCar) => {
      const q = scopedCar
        ? query(collection(db, 'reports'), where('date', '==', today), where('carModel', '==', '9BQC'))
        : query(collection(db, 'reports'), where('date', '==', today));

      activeUnsub = onSnapshot(
        q,
        (snapshot) => {
          if (cancelled) return;
          const docs = [];
          snapshot.forEach((docSnap) => {
            const r = { id: docSnap.id, ...docSnap.data() };
            if (resolveGm9bqcProcessCode(r)) {
              docs.push(r);
            }
          });
          set9bqcTodaySnapshotCache(today, docs);
          setLiveTodayReports(docs);
          setTodayResolved(true);
          setLiveStatus('live');
          setLastSyncedAt(
            new Date().toLocaleTimeString('ko-KR', {
              hour12: false,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })
          );
        },
        (err) => {
          if (cancelled) return;
          if (scopedCar && (err?.code === 'failed-precondition' || String(err?.message || '').toLowerCase().includes('index'))) {
            try { activeUnsub(); } catch { /* ignore */ }
            attachListener(false);
            return;
          }
          console.error('9BQC G/RUN 오늘 실시간 구독 오류 (캐시 폴백):', err);
          setTodayResolved(true);
          setLiveStatus('fallback');
        }
      );
    };

    attachListener(true);

    return () => {
      cancelled = true;
      try { activeUnsub(); } catch { /* ignore */ }
    };
  }, [includesToday, today, isActive]);

  // 최근 9BQC 가동일 탐색 (부모 reports + 캐시 이력 + 오늘 실시간 풀 합산)
  const latestActiveGrunDate = useMemo(() => {
    const dates = [];
    const collect = (list) => {
      if (!Array.isArray(list)) return;
      list.forEach((r) => {
        if (r?.date && resolveGm9bqcProcessCode(r)) {
          dates.push(r.date);
        }
      });
    };
    collect(reports);
    collect(historyReports);
    collect(liveTodayReports);
    if (dates.length === 0) return null;
    dates.sort();
    return dates[dates.length - 1];
  }, [reports, historyReports, liveTodayReports]);

  // 초기 진입 시 오늘 일보가 0건이고 최근 가동일 일보가 있으면 최초 1회만 최근 가동일로 자동 맞춤
  useEffect(() => {
    if (userChangedDateRef.current || autoAppliedLatestRef.current) return;
    if (reportsLoading || !historyResolved || (includesToday && !todayResolved)) return;

    const allKnown = [...reports, ...historyReports, ...liveTodayReports];
    const hasTodayReport = allKnown.some(
      (r) => r?.date === today && Boolean(resolveGm9bqcProcessCode(r))
    );
    autoAppliedLatestRef.current = true;
    if (!hasTodayReport && latestActiveGrunDate && latestActiveGrunDate !== today) {
      setSelectedDate(latestActiveGrunDate);
      setRangeStart(latestActiveGrunDate);
      setRangeEnd(latestActiveGrunDate);
    }
  }, [
    reportsLoading,
    historyResolved,
    todayResolved,
    includesToday,
    reports,
    historyReports,
    liveTodayReports,
    latestActiveGrunDate,
    today
  ]);

  // 전체 추적 풀 (부모 reports + 과거 캐시 + 오늘 실시간 풀 병합, 최신 실시간 우선)
  const mergedReportsById = useMemo(() => {
    const byId = new Map();
    reports.forEach((r) => {
      if (r?.id && r.date && r.date <= maxQueryEnd) byId.set(r.id, r);
    });
    historyReports.forEach((r) => {
      if (r?.id && r.date && r.date <= maxQueryEnd) byId.set(r.id, r);
    });
    if (includesToday) {
      liveTodayReports.forEach((r) => {
        if (r?.id && r.date && r.date <= maxQueryEnd) byId.set(r.id, r);
      });
    }
    return [...byId.values()];
  }, [reports, historyReports, liveTodayReports, includesToday, maxQueryEnd]);

  const trackingReports = useMemo(
    () => mergedReportsById.filter((r) => r?.date && r.date <= effectiveEnd),
    [mergedReportsById, effectiveEnd]
  );

  // 선택된 기간 [effectiveStart, effectiveEnd] 일보
  const sourceReports = useMemo(() => {
    return mergedReportsById.filter(
      (r) => r?.date && r.date >= effectiveStart && r.date <= effectiveEnd
    );
  }, [mergedReportsById, effectiveStart, effectiveEnd]);

  const model = useMemo(
    () =>
      buildGm9bqcGrunDashboardModel(sourceReports, {
        shiftFilter: 'ALL',
        trackingReports
      }),
    [sourceReports, trackingReports]
  );

  // 좌하단: 선택 소재(FRT A/B/C, RR A/B) 기준 주간(7일) 분기형 LOT 추이도
  const materialTimeline = useMemo(
    () =>
      buildMaterialWeeklyLotTimeline(mergedReportsById, {
        materialKey: selectedMaterialKey,
        weekEndDate: lotWeekEnd,
        shiftFilter: 'ALL'
      }),
    [mergedReportsById, selectedMaterialKey, lotWeekEnd]
  );

  // 공정별 최대 생산량 및 최대 불량율(%) (5등분 눈금 맞춤 차트 스케일용)
  const { maxProcActual, procActualStep } = useMemo(() => {
    let rawMax = 0;
    model.processRows.forEach((p) => {
      if (p.actual > rawMax) rawMax = p.actual;
    });
    if (rawMax <= 0) return { maxProcActual: 100, procActualStep: 20 };
    const roughStep = rawMax / 5;
    const mag = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const norm = roughStep / mag;
    let niceNorm = 1;
    if (norm <= 1) niceNorm = 1;
    else if (norm <= 2) niceNorm = 2;
    else if (norm <= 2.5) niceNorm = 2.5;
    else if (norm <= 5) niceNorm = 5;
    else niceNorm = 10;
    const step = Math.max(1, Math.round(niceNorm * mag));
    return { maxProcActual: step * 5, procActualStep: step };
  }, [model.processRows]);

  const { maxProcDefectRate, defectRateStep } = useMemo(() => {
    let rawMax = 0;
    model.processRows.forEach((p) => {
      if (p.defectRate > rawMax) rawMax = p.defectRate;
    });
    if (rawMax <= 0) return { maxProcDefectRate: 1.0, defectRateStep: 0.2 };
    const padded = rawMax * 1.25;
    const candidates = [0.2, 0.5, 1, 2, 3, 5, 10, 20];
    const step = candidates.find((s) => s * 5 >= padded) || Math.ceil(padded / 5);
    return {
      maxProcDefectRate: Number((step * 5).toFixed(1)),
      defectRateStep: step
    };
  }, [model.processRows]);

  const maxParetoCount = useMemo(() => {
    if (model.top5Defects.length === 0) return 10;
    return Math.max(1, model.top5Defects[0].count);
  }, [model.top5Defects]);

  // 좌하단 LOT 추이도 검색 필터링
  const filteredMaterialLots = useMemo(() => {
    const lots = materialTimeline.lots || [];
    const kw = lotSearch.trim().toLowerCase();
    if (!kw) return lots;
    return lots.filter(
      (l) =>
        (l.lotKey && l.lotKey.toLowerCase().includes(kw)) ||
        (l.materialLabel && l.materialLabel.toLowerCase().includes(kw))
    );
  }, [materialTimeline, lotSearch]);

  const periodLabel =
    viewMode === 'single'
      ? selectedDate
      : effectiveStart === effectiveEnd
        ? effectiveStart
        : `${effectiveStart} ~ ${effectiveEnd}`;

  const handleExportExcel = async () => {
    if (exporting) return;
    try {
      setExporting(true);
      const { exportGm9bqcGrunToExcel } = await import('../../utils/gm9bqcGrunExcelExport');
      await exportGm9bqcGrunToExcel({
        model,
        periodLabel,
        shiftLabel: '전체'
      });
    } catch (e) {
      console.error('Excel export failed:', e);
      alert('엑셀 다운로드 중 오류가 발생했습니다: ' + e.message);
    } finally {
      setExporting(false);
    }
  };

  // 좌상단 12공정 불량율(%) SVG 폴리라인 좌표 (viewBox 0 0 1200 172, 상단 여백 22px + 플롯 150px)
  const defectLinePoints = useMemo(() => {
    return model.processRows.map((p, idx) => {
      const hasData = p.reportCount > 0 || p.actual > 0 || p.defect > 0;
      const x = ((idx + 0.5) / 12) * 1200;
      const ratio = maxProcDefectRate > 0 ? Math.min(1, p.defectRate / maxProcDefectRate) : 0;
      const y = 170 - ratio * 148;
      return {
        x,
        y,
        ratio,
        hasData,
        defect: p.defect,
        defectRate: p.defectRate,
        code: p.code
      };
    });
  }, [model.processRows, maxProcDefectRate]);

  const defectPolylineStr = useMemo(
    () => defectLinePoints.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(' '),
    [defectLinePoints]
  );

  const worstDefectIssue = model.top5Defects[0] || null;
  const worstDefectShare =
    worstDefectIssue && model.totalDefect > 0
      ? ((worstDefectIssue.count / model.totalDefect) * 100).toFixed(1)
      : '0.0';

  const weekDateColumns = materialTimeline.dateColumns || [];

  const renderTimelineCells = (cells, lineColor, emptyHint = '') => {
    const activeColIndices = [];
    cells.forEach((cell, cIdx) => {
      if (cell.items && cell.items.length > 0) activeColIndices.push(cIdx);
    });
    const firstActiveIdx = activeColIndices.length > 0 ? activeColIndices[0] : -1;
    const lastActiveIdx =
      activeColIndices.length > 0 ? activeColIndices[activeColIndices.length - 1] : -1;

    return cells.map((cell, cIdx) => {
      const inChain =
        firstActiveIdx !== -1 &&
        lastActiveIdx !== -1 &&
        firstActiveIdx !== lastActiveIdx &&
        cIdx >= firstActiveIdx &&
        cIdx <= lastActiveIdx;
      const isChainStart = cIdx === firstActiveIdx && firstActiveIdx !== lastActiveIdx;
      const isChainEnd = cIdx === lastActiveIdx && firstActiveIdx !== lastActiveIdx;

      return (
        <div
          key={cell.ymd}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            flexWrap: 'wrap',
            minHeight: '26px',
            padding: '2px 3px',
            borderLeft: '1px solid #f1f5f9'
          }}
        >
          {inChain && (
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: isChainStart ? '50%' : 0,
                right: isChainEnd ? '50%' : 0,
                height: '2px',
                background: lineColor,
                transform: 'translateY(-50%)',
                zIndex: 1,
                opacity: 0.75
              }}
            />
          )}

          {emptyHint && cIdx === 0 && activeColIndices.length === 0 && (
            <span
              style={{
                fontSize: '10px',
                color: '#94a3b8',
                fontWeight: 600,
                zIndex: 2
              }}
            >
              {emptyHint}
            </span>
          )}

          {cell.items.map((item, iIdx) => {
            if (item.type === 'missing') {
              return (
                <span
                  key={`${cell.ymd}-miss-${iIdx}`}
                  title={item.detail || '중간 공정 데이터 미확인'}
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px 7px',
                    borderRadius: '999px',
                    fontSize: '10px',
                    fontWeight: 800,
                    background: '#fef2f2',
                    color: '#e11d48',
                    border: '1px solid #fda4af',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.label}
                </span>
              );
            }

            return (
              <span
                key={`${cell.ymd}-item-${iIdx}`}
                title={`${item.label} (${cell.ymd})`}
                style={{
                  position: 'relative',
                  zIndex: 2,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontSize: '10px',
                  fontWeight: 800,
                  background: lineColor,
                  color: '#ffffff',
                  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.14)',
                  whiteSpace: 'nowrap'
                }}
              >
                {item.label}
              </span>
            );
          })}
        </div>
      );
    });
  };

  const renderLotBranchBlock = (lot) => {
    const colCount = Math.max(1, weekDateColumns.length);
    const gridTemplate = `144px repeat(${colCount}, minmax(74px, 1fr))`;

    return (
      <div
        key={lot.lotKey}
        className="grun-lot-branch-card"
        onClick={() => {
          if (lot.reports?.length > 0) {
            setInspectorModal({ type: 'lot_track', data: lot });
          }
        }}
        title={`${lot.materialLabel} | 출발 LOT ${lot.lotKey} (클릭 시 공정별 추적 및 원본 일보 보기)`}
        style={{
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          background: '#ffffff',
          marginBottom: '8px',
          overflow: 'hidden',
          cursor: lot.reports?.length > 0 ? 'pointer' : 'default',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
        }}
      >
        {/* 1) 출발 LOT 행 (L/R 구별 없음 · 단일 출발) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: gridTemplate,
            alignItems: 'center',
            background: '#f8fafc',
            borderBottom: '1px dashed #cbd5e1',
            minHeight: '32px'
          }}
        >
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 6px 4px 10px',
              height: '100%'
            }}
          >
            {/* 아래 LH/RH 분기선 시작점 */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '14px',
                bottom: 0,
                height: '6px',
                width: '2px',
                background: '#94a3b8'
              }}
            />
            <span
              style={{
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: lot.originColor,
                flexShrink: 0,
                position: 'relative',
                zIndex: 2
              }}
            />
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 900,
                color: '#0f172a',
                whiteSpace: 'nowrap'
              }}
            >
              {lot.lotKey}
            </span>
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 800,
                padding: '1px 5px',
                borderRadius: '4px',
                background: '#e2e8f0',
                color: '#334155',
                whiteSpace: 'nowrap'
              }}
            >
              {!lot.origin.hasWeekActivity && lot.origin.preWeekLastDate
                ? `전주 ${lot.origin.preWeekLastDate}`
                : '공용 출발'}
            </span>
          </div>

          {renderTimelineCells(lot.origin.cells, lot.originColor)}
        </div>

        {/* 2) LH 갈래 행 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: gridTemplate,
            alignItems: 'center',
            borderBottom: '1px solid #f1f5f9',
            minHeight: '30px'
          }}
        >
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 6px 3px 26px',
              height: '100%'
            }}
          >
            {/* ├─ 분기 커넥터 */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '14px',
                top: 0,
                bottom: 0,
                width: '2px',
                background: '#94a3b8'
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                width: '10px',
                height: '2px',
                background: '#94a3b8',
                transform: 'translateY(-50%)'
              }}
            />
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '30px',
                height: '19px',
                padding: '0 6px',
                borderRadius: '4px',
                fontSize: '10.5px',
                fontWeight: 900,
                background: '#dbeafe',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe'
              }}
            >
              LH
            </span>
            {!lot.lh.hasWeekActivity && lot.lh.preWeekLastDate && (
              <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 700, whiteSpace: 'nowrap' }}>
                전주 {lot.lh.preWeekLastDate}
              </span>
            )}
          </div>

          {renderTimelineCells(
            lot.lh.cells,
            '#2563eb',
            !lot.lh.hasWeekActivity && !lot.lh.preWeekLastDate ? '미투입' : ''
          )}
        </div>

        {/* 3) RH 갈래 행 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: gridTemplate,
            alignItems: 'center',
            minHeight: '30px'
          }}
        >
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 6px 3px 26px',
              height: '100%'
            }}
          >
            {/* └─ 분기 커넥터 */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '14px',
                top: 0,
                height: '50%',
                width: '2px',
                background: '#94a3b8'
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                width: '10px',
                height: '2px',
                background: '#94a3b8',
                transform: 'translateY(-50%)'
              }}
            />
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '30px',
                height: '19px',
                padding: '0 6px',
                borderRadius: '4px',
                fontSize: '10.5px',
                fontWeight: 900,
                background: '#ccfbf1',
                color: '#0f766e',
                border: '1px solid #99f6e4'
              }}
            >
              RH
            </span>
            {!lot.rh.hasWeekActivity && lot.rh.preWeekLastDate && (
              <span style={{ fontSize: '9.5px', color: '#64748b', fontWeight: 700, whiteSpace: 'nowrap' }}>
                전주 {lot.rh.preWeekLastDate}
              </span>
            )}
          </div>

          {renderTimelineCells(
            lot.rh.cells,
            '#0d9488',
            !lot.rh.hasWeekActivity && !lot.rh.preWeekLastDate ? '미투입' : ''
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className="gm-9bqc-grun-board"
      data-analytics-board="9bqc-grun"
      style={{
        background: '#f1f5f9',
        borderRadius: '14px',
        padding: '14px',
        color: '#0f172a',
        fontFamily: "'Pretendard', 'Malgun Gothic', 'Noto Sans KR', sans-serif"
      }}
    >
      <style>{`
        [data-analytics-board="9bqc-grun"] {
          box-sizing: border-box;
        }
        [data-analytics-board="9bqc-grun"] * {
          box-sizing: border-box;
        }
        @keyframes gm9bqcPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(0.88); }
        }
        [data-analytics-board="9bqc-grun"] .grun-4quad-grid {
          display: grid;
          grid-template-columns: minmax(0, 2.2fr) minmax(320px, 1fr);
          gap: 14px;
          align-items: stretch;
        }
        [data-analytics-board="9bqc-grun"] .grun-panel-card {
          background: #ffffff;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.05);
          display: flex;
          flex-direction: column;
        }
        [data-analytics-board="9bqc-grun"] .grun-panel-header {
          background: #162b4c;
          color: #ffffff;
          padding: 9px 15px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          flex-wrap: wrap;
        }
        [data-analytics-board="9bqc-grun"] .grun-proc-col:hover {
          background: rgba(79, 70, 229, 0.06);
          border-radius: 6px;
        }
        [data-analytics-board="9bqc-grun"] .grun-lot-branch-card:hover {
          border-color: #6366f1 !important;
          box-shadow: 0 2px 8px rgba(79, 70, 229, 0.12);
        }
        [data-analytics-board="9bqc-grun"] .grun-mat-btn:hover {
          background: #e2e8f0 !important;
        }
        [data-analytics-board="9bqc-grun"] .grun-sublot-row:hover {
          border-color: #4f46e5 !important;
          background: #f1f5f9 !important;
          transform: translateY(-1px);
        }
        @media (max-width: 1180px) {
          [data-analytics-board="9bqc-grun"] .grun-4quad-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* ── 상단 통합 헤더 바 (예시 1-B안 스타일) ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '12px',
          padding: '2px 4px'
        }}
      >
        {/* 좌측: 타이틀 + 날짜/기간 + 주·야간 + 실시간 상태 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 900,
              letterSpacing: '-0.4px',
              color: '#0f172a',
              marginRight: '4px'
            }}
          >
            9BQC G/RUN 종합 현황판
          </div>

          {/* 일별 / 기간 토글 */}
          <div
            style={{
              display: 'inline-flex',
              background: '#e2e8f0',
              borderRadius: '8px',
              padding: '2px'
            }}
          >
            {[
              { id: 'single', label: '일별' },
              { id: 'range', label: '기간' }
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setViewMode(m.id)}
                style={{
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: viewMode === m.id ? '#162b4c' : 'transparent',
                  color: viewMode === m.id ? '#ffffff' : '#475569'
                }}
              >
                {m.label}
              </button>
            ))}
          </div>

          {viewMode === 'single' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="date"
                value={selectedDate}
                max="9999-12-31"
                onChange={(e) => {
                  userChangedDateRef.current = true;
                  setSelectedDate(e.target.value);
                }}
                style={{
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  height: '32px'
                }}
              />
              {selectedDate !== today && (
                <button
                  type="button"
                  onClick={() => {
                    userChangedDateRef.current = true;
                    setSelectedDate(today);
                  }}
                  style={{
                    background: '#ffffff',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '7px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    height: '32px'
                  }}
                >
                  오늘
                </button>
              )}
              {latestActiveGrunDate && selectedDate !== latestActiveGrunDate && (
                <button
                  type="button"
                  onClick={() => {
                    userChangedDateRef.current = true;
                    setSelectedDate(latestActiveGrunDate);
                  }}
                  style={{
                    background: '#eef2ff',
                    color: '#4338ca',
                    border: '1px solid #c7d2fe',
                    borderRadius: '7px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    height: '32px'
                  }}
                >
                  최근가동일
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="date"
                value={rangeStart}
                max="9999-12-31"
                onChange={(e) => {
                  userChangedDateRef.current = true;
                  setRangeStart(e.target.value);
                }}
                style={{
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '5px 8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  height: '32px'
                }}
              />
              <span style={{ color: '#64748b', fontSize: '12px' }}>~</span>
              <input
                type="date"
                value={rangeEnd}
                max="9999-12-31"
                onChange={(e) => {
                  userChangedDateRef.current = true;
                  setRangeEnd(e.target.value);
                }}
                style={{
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  padding: '5px 8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  height: '32px'
                }}
              />
            </div>
          )}

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 11px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 800,
              background:
                liveStatus === 'live'
                  ? '#dce4f2'
                  : liveStatus === 'history'
                    ? '#eef2f6'
                    : '#fef3c7',
              color:
                liveStatus === 'live'
                  ? '#1e293b'
                  : liveStatus === 'history'
                    ? '#334155'
                    : '#b45309',
              border: '1px solid #cbd5e1'
            }}
            title={lastSyncedAt ? `최근 동기화: ${lastSyncedAt}` : ''}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background:
                  liveStatus === 'live'
                    ? '#10b981'
                    : liveStatus === 'history'
                      ? '#64748b'
                      : '#f59e0b',
                animation: liveStatus === 'live' || liveStatus === 'connecting' ? 'gm9bqcPulse 1.8s infinite' : 'none'
              }}
            />
            {liveStatus === 'live'
              ? '실시간 ON'
              : liveStatus === 'history'
                ? '과거 이력 (캐시)'
                : liveStatus === 'fallback'
                  ? '캐시 모드'
                  : '조회중...'}
          </span>
          <button
            type="button"
            onClick={() => {
              forceHistoryRefreshRef.current = true;
              setHistoryRefreshTick((t) => t + 1);
            }}
            style={{
              background: '#ffffff',
              color: '#334155',
              border: '1px solid #cbd5e1',
              borderRadius: '7px',
              padding: '4px 9px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              height: '30px'
            }}
            title="로컬 캐시를 비우고 Firestore에서 전체 이력을 다시 동기화합니다"
          >
            새로고침
          </button>
        </div>

        {/* 우측: 3대 핵심 요약 배지 (종합 수율 / 총 생산 / 불량률) + 엑셀 다운로드 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span
            style={{
              background: '#dce4f2',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '999px',
              padding: '5px 13px',
              fontSize: '12.5px',
              fontWeight: 800
            }}
          >
            종합 수율 {model.yieldRate.toFixed(1)}%
          </span>
          <span
            style={{
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '999px',
              padding: '5px 13px',
              fontSize: '12.5px',
              fontWeight: 800
            }}
          >
            총 생산 {model.totalActual.toLocaleString()}
          </span>
          <span
            style={{
              background: '#ffffff',
              color: model.totalDefect > 0 ? '#be123c' : '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '999px',
              padding: '5px 13px',
              fontSize: '12.5px',
              fontWeight: 800
            }}
          >
            불량률 {model.defectRateTotal.toFixed(1)}%
          </span>

          <button
            type="button"
            onClick={handleExportExcel}
            disabled={exporting}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: '#162b4c',
              color: '#ffffff',
              border: '1px solid #0f172a',
              borderRadius: '8px',
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: 700,
              height: '32px',
              cursor: exporting ? 'wait' : 'pointer'
            }}
          >
            <span>📥</span> {exporting ? '생성중...' : 'Excel'}
          </button>
        </div>
      </div>

      {/* ── 메인 4분할 그리드 (예시 1-B안) ── */}
      <div className="grun-4quad-grid">
        {/* ==================== 1. 좌상단: 공정별 품질 지수 ==================== */}
        <div className="grun-panel-card">
          <div className="grun-panel-header">
            <span style={{ fontSize: '14.5px', fontWeight: 800 }}>공정별 품질 지수</span>
            <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>
              막대 클릭 시 공정별 작업일보 상세 조회
            </span>
          </div>

          <div style={{ padding: '12px 16px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* 상단 범례 (생산수량 · 불량율 % 2종) */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: '16px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#334155',
                marginBottom: '6px'
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '2px',
                    background: '#10b981'
                  }}
                />
                생산수량 (EA)
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '16px',
                    height: '2.5px',
                    background: '#be123c',
                    display: 'inline-block'
                  }}
                />
                불량율 (%)
              </span>
            </div>

            {/* 복합 차트 본체: 좌측 Y축(생산수량) + 중앙 12개 공정 막대 & 꺾은선 + 우측 Y축(불량율 %) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '48px 1fr 40px',
                alignItems: 'stretch',
                gap: '6px',
                height: '174px'
              }}
            >
              {/* 좌측 Y축 (생산수량) */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#475569',
                  textAlign: 'right',
                  lineHeight: 1,
                  paddingTop: '17px',
                  paddingBottom: '0px'
                }}
              >
                {[5, 4, 3, 2, 1, 0].map((stepIdx) => (
                  <span key={stepIdx}>{(procActualStep * stepIdx).toLocaleString()}</span>
                ))}
              </div>

              {/* 중앙 12개 공정 막대(생산수량) + 꺾은선(불량율 %) */}
              <div
                style={{
                  position: 'relative',
                  borderBottom: '1.5px solid #cbd5e1',
                  paddingTop: '22px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
                  alignItems: 'end'
                }}
              >
                {/* 배경 수평 그리드 선 */}
                {[0, 0.2, 0.4, 0.6, 0.8, 1].map((step) => (
                  <div
                    key={step}
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: `${22 + step * 150}px`,
                      borderTop: '1px solid #e2e8f0',
                      pointerEvents: 'none'
                    }}
                  />
                ))}

                {model.processRows.map((proc) => {
                  const hasData = proc.reportCount > 0 || proc.actual > 0 || proc.defect > 0;
                  const actPct =
                    proc.actual > 0
                      ? Math.max(4, Math.min(100, (proc.actual / maxProcActual) * 100))
                      : 0;
                  const barHeightPx = hasData ? (actPct / 100) * 150 : 4;
                  const barLabelBottom = Math.min(154, Math.max(6, Math.round(barHeightPx) + 3));
                  const shortDisplay = proc.shortName.replace(/^(조인트|후가공|검사포장)-/, '');

                  return (
                    <div
                      key={proc.code}
                      className="grun-proc-col"
                      onClick={() => setInspectorModal({ type: 'process', data: proc })}
                      title={`#${proc.code} ${proc.processName} | 생산수량 ${proc.actual.toLocaleString()} EA (LH ${proc.lh.toLocaleString()} / RH ${proc.rh.toLocaleString()}) | 불량 ${proc.defect}건 (${proc.defectRate.toFixed(1)}%)`}
                      style={{
                        position: 'relative',
                        height: '150px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        cursor: 'pointer',
                        zIndex: 2,
                        padding: '0 2px'
                      }}
                    >
                      {/* 막대 위 생산수량 숫자 표시 */}
                      {hasData && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: `${barLabelBottom}px`,
                            fontSize: '10px',
                            fontWeight: 800,
                            color: '#065f46',
                            background: 'rgba(255, 255, 255, 0.88)',
                            padding: '0 3px',
                            borderRadius: '3px',
                            lineHeight: 1.15,
                            whiteSpace: 'nowrap',
                            letterSpacing: '-0.3px',
                            zIndex: 4,
                            pointerEvents: 'none'
                          }}
                        >
                          {proc.actual.toLocaleString()}
                        </span>
                      )}

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-end',
                          justifyContent: 'center',
                          width: '100%',
                          height: '150px'
                        }}
                      >
                        {/* 단일 막대: 생산수량 */}
                        <div
                          style={{
                            width: '54%',
                            maxWidth: '28px',
                            height: hasData ? `${actPct}%` : '4px',
                            background: hasData ? '#10b981' : '#e2e8f0',
                            borderRadius: '4px 4px 0 0',
                            transition: 'height 0.2s ease'
                          }}
                        />
                      </div>

                      <span
                        style={{
                          position: 'absolute',
                          bottom: '-22px',
                          fontSize: '10.5px',
                          fontWeight: 800,
                          color: '#0f172a',
                          whiteSpace: 'nowrap',
                          letterSpacing: '-0.3px'
                        }}
                      >
                        {shortDisplay}
                      </span>
                    </div>
                  );
                })}

                {/* 불량율 (%) 꺾은선 + 점별 수치 라벨 오버레이 */}
                <svg
                  viewBox="0 0 1200 172"
                  preserveAspectRatio="none"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '172px',
                    pointerEvents: 'none',
                    zIndex: 5
                  }}
                >
                  <polyline
                    fill="none"
                    stroke="#be123c"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={defectPolylineStr}
                  />
                  {defectLinePoints.map((pt) => (
                    <circle
                      key={pt.code}
                      cx={pt.x}
                      cy={pt.y}
                      r={pt.defect > 0 ? '6' : '4.5'}
                      fill={pt.defect > 0 ? '#be123c' : '#9f1239'}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  ))}
                </svg>

                {/* 불량율 (%) 수치 라벨 (HTML 오버레이: 글자 찌그러짐 없이 선명 표시 + 막대 수치와 겹침 회피) */}
                {defectLinePoints.map((pt, idx) => {
                  if (!pt.hasData) return null;
                  const proc = model.processRows[idx];
                  const actPct =
                    proc?.actual > 0
                      ? Math.max(4, Math.min(100, (proc.actual / maxProcActual) * 100))
                      : 0;
                  const barHeightPx = (actPct / 100) * 150;
                  const barLabelBottom = Math.min(154, Math.max(6, Math.round(barHeightPx) + 3));
                  const dotBottomPx = 2 + pt.ratio * 148;
                  let labelBottomPx = dotBottomPx + 9;
                  if (labelBottomPx < barLabelBottom + 14 && labelBottomPx + 14 > barLabelBottom) {
                    labelBottomPx =
                      dotBottomPx < barLabelBottom && dotBottomPx >= 24
                        ? dotBottomPx - 20
                        : Math.min(160, barLabelBottom + 15);
                  }
                  return (
                    <span
                      key={`rate-${pt.code}`}
                      style={{
                        position: 'absolute',
                        left: `${((idx + 0.5) / 12) * 100}%`,
                        bottom: `${Math.min(160, labelBottomPx)}px`,
                        transform: 'translateX(-50%)',
                        fontSize: '9.5px',
                        fontWeight: 800,
                        color: pt.defect > 0 ? '#be123c' : '#64748b',
                        background: pt.defect > 0 ? 'rgba(255, 241, 242, 0.94)' : 'rgba(255, 255, 255, 0.9)',
                        border: pt.defect > 0 ? '1px solid #fecdd3' : '1px solid #e2e8f0',
                        padding: '0 3px',
                        borderRadius: '4px',
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        zIndex: 6,
                        pointerEvents: 'none'
                      }}
                    >
                      {pt.defectRate.toFixed(1)}%
                    </span>
                  );
                })}
              </div>

              {/* 우측 Y축 (불량율 %) */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: '#be123c',
                  textAlign: 'left',
                  lineHeight: 1,
                  paddingTop: '17px',
                  paddingBottom: '0px'
                }}
              >
                {[5, 4, 3, 2, 1, 0].map((stepIdx) => {
                  const v = Number((defectRateStep * stepIdx).toFixed(1));
                  return <span key={stepIdx}>{v === 0 ? '0%' : `${v}%`}</span>;
                })}
              </div>
            </div>

            {/* 하단 4대 공정 단계 그룹 브라켓 (소재준비 3 / 조인트 3 / 후가공 2 / 검사포장 4) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '48px 1fr 40px',
                gap: '6px',
                marginTop: '26px'
              }}
            >
              <div />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '3fr 3fr 2fr 4fr',
                  gap: '8px',
                  textAlign: 'center',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  color: '#1e293b'
                }}
              >
                {['소재준비', '조인트', '후가공', '검사포장'].map((grpName) => (
                  <div key={grpName}>
                    <div
                      style={{
                        height: '5px',
                        borderLeft: '1.5px solid #94a3b8',
                        borderRight: '1.5px solid #94a3b8',
                        borderBottom: '1.5px solid #94a3b8',
                        marginBottom: '4px'
                      }}
                    />
                    {grpName}
                  </div>
                ))}
              </div>
              <div />
            </div>
          </div>
        </div>

        {/* ==================== 2. 우상단: 주요 불량 이슈 ==================== */}
        <div className="grun-panel-card">
          <div className="grun-panel-header">
            <span style={{ fontSize: '14.5px', fontWeight: 800 }}>주요 불량 이슈</span>
            <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>
              총 {model.totalDefect.toLocaleString()}건
            </span>
          </div>

          <div
            style={{
              padding: '12px 14px',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '10px'
            }}
          >
            {/* 상단 Worst Issue 배너 */}
            {worstDefectIssue ? (
              <div
                style={{
                  background: '#ffe4e6',
                  border: '1px solid #fecdd3',
                  borderRadius: '9px',
                  padding: '9px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '15px' }}>⚠️</span>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#9f1239' }}>
                  Worst Issue: {worstDefectIssue.name} {worstDefectIssue.count}건 / {worstDefectShare}%
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: '9px',
                  padding: '9px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span style={{ fontSize: '15px' }}>✅</span>
                <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#065f46' }}>
                  발생 불량 없음 (전 공정 무결점)
                </div>
              </div>
            )}

            {/* Top 5 파레토 수평 바 리스트 */}
            {model.top5Defects.length > 0 ? (
              <div
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '9px',
                  padding: '4px 0'
                }}
              >
                {model.top5Defects.map((d, idx) => {
                  const pct = Math.max(12, Math.round((d.count / maxParetoCount) * 100));
                  const axisLabels = ['100%', '75%', '50%', '25%', '0%'];
                  return (
                    <div
                      key={d.name}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '84px 1fr 42px 36px',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '12px',
                        fontWeight: 800,
                        color: '#0f172a'
                      }}
                    >
                      <div
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={d.name}
                      >
                        {idx + 1}. {d.name}
                      </div>

                      <div
                        style={{
                          height: '11px',
                          background: '#f1f5f9',
                          borderRadius: '999px',
                          overflow: 'hidden',
                          display: 'flex'
                        }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #4338ca 0%, #4338ca 48%, #be123c 48%, #e11d48 100%)',
                            borderRadius: '999px'
                          }}
                        />
                      </div>

                      <div style={{ textAlign: 'right', fontSize: '11.5px', color: '#0f172a' }}>
                        {d.count}건
                      </div>

                      <div style={{ textAlign: 'right', fontSize: '11px', color: '#475569' }}>
                        {axisLabels[idx] || ''}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b',
                  fontSize: '12px',
                  fontWeight: 600,
                  minHeight: '130px'
                }}
              >
                선택된 조건 내 집계된 불량 내역이 없습니다.
              </div>
            )}

            {/* 최다 불량 공정 보조 안내 */}
            <div
              style={{
                borderTop: '1px solid #f1f5f9',
                paddingTop: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '11px',
                color: '#64748b',
                fontWeight: 700
              }}
            >
              <span>최다 발생 공정</span>
              <span style={{ color: model.worstProcess ? '#be123c' : '#059669', fontWeight: 800 }}>
                {model.worstProcess
                  ? `#${model.worstProcess.code} ${model.worstProcess.shortName} (${model.worstProcess.defect}건)`
                  : '이슈 공정 없음'}
              </span>
            </div>
          </div>
        </div>

        {/* ==================== 3. 좌하단: LOT 추이도 (좌측 5개 소재 선택 + 일주일 단위 분기 타임라인) ==================== */}
        <div className="grun-panel-card">
          <div className="grun-panel-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14.5px', fontWeight: 800 }}>LOT 추이도</span>
              <span
                style={{
                  background: '#dce4f2',
                  color: '#0f172a',
                  borderRadius: '999px',
                  padding: '2px 10px',
                  fontSize: '11px',
                  fontWeight: 800
                }}
              >
                {materialTimeline.material?.label || 'FRT A'} · 공용 출발 → LH/RH 분기 (7일)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {/* 일주일 단위 기간 이동 컨트롤 */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(255,255,255,0.12)',
                  padding: '2px 6px',
                  borderRadius: '7px'
                }}
              >
                <button
                  type="button"
                  onClick={() => setLotWeekOffset((w) => w - 1)}
                  title="이전 1주일 보기"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 5px'
                  }}
                >
                  ◀ 이전 주
                </button>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#f8fafc',
                    padding: '0 4px',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {weekDateColumns[0]?.label || ''} ~ {weekDateColumns[weekDateColumns.length - 1]?.label || ''}
                </span>
                <button
                  type="button"
                  disabled={lotWeekEnd >= today}
                  onClick={() => setLotWeekOffset((w) => w + 1)}
                  title="다음 1주일 보기"
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: lotWeekEnd >= today ? '#64748b' : '#ffffff',
                    cursor: lotWeekEnd >= today ? 'not-allowed' : 'pointer',
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 5px'
                  }}
                >
                  다음 주 ▶
                </button>
                {lotWeekOffset !== 0 && (
                  <button
                    type="button"
                    onClick={() => setLotWeekOffset(0)}
                    style={{
                      border: '1px solid rgba(255,255,255,0.3)',
                      background: 'rgba(255,255,255,0.15)',
                      color: '#ffffff',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '1px 6px'
                    }}
                  >
                    기준주
                  </button>
                )}
              </div>

              <span style={{ fontSize: '10.5px', color: '#e2e8f0', fontWeight: 700 }}>
                — 정상연계 &nbsp; ✕ 끊김
              </span>
              <input
                type="text"
                value={lotSearch}
                onChange={(e) => setLotSearch(e.target.value)}
                placeholder="🔍 LOT 검색"
                style={{
                  background: '#ffffff',
                  color: '#0f172a',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '11px',
                  width: '106px',
                  height: '24px'
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flex: 1,
              minHeight: '240px',
              alignItems: 'stretch'
            }}
          >
            {/* 좌측 5개 소재 선택 사이드 레일 (FRT A/B/C, RR A/B) */}
            <div
              style={{
                width: '116px',
                flexShrink: 0,
                background: '#f8fafc',
                borderRight: '1px solid #cbd5e1',
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
              }}
            >
              <div
                style={{
                  fontSize: '10.5px',
                  fontWeight: 800,
                  color: '#64748b',
                  padding: '2px 4px',
                  marginBottom: '2px'
                }}
              >
                소재 선택 (5종)
              </div>
              {MATERIAL_TRACE_OPTIONS.map((opt, idx) => {
                const isSelected = selectedMaterialKey === opt.key;
                const cnt = materialTimeline.materialCounts?.[opt.key] || 0;
                const isFrt = opt.group === 'FRT';
                return (
                  <React.Fragment key={opt.key}>
                    {idx === 3 && (
                      <div style={{ borderTop: '1px solid #cbd5e1', margin: '3px 0' }} />
                    )}
                    <button
                      type="button"
                      className={isSelected ? undefined : 'grun-mat-btn'}
                      onClick={() => setSelectedMaterialKey(opt.key)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '4px',
                        width: '100%',
                        padding: '8px 8px',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid #2563eb' : '1px solid #cbd5e1',
                        background: isSelected ? '#162b4c' : '#ffffff',
                        color: isSelected ? '#ffffff' : '#0f172a',
                        cursor: 'pointer',
                        transition: 'all 0.12s ease',
                        textAlign: 'left'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: isSelected
                              ? isFrt
                                ? '#3b82f6'
                                : '#14b8a6'
                              : isFrt
                                ? '#e0e7ff'
                                : '#ccfbf1',
                            color: isSelected
                              ? '#ffffff'
                              : isFrt
                                ? '#3730a3'
                                : '#115e59'
                          }}
                        >
                          {opt.group}
                        </span>
                        <span style={{ fontSize: '12.5px', fontWeight: 900 }}>
                          {opt.section}
                        </span>
                      </div>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          color: isSelected
                            ? '#cbd5e1'
                            : cnt > 0
                              ? '#2563eb'
                              : '#94a3b8'
                        }}
                      >
                        {cnt}
                      </span>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            {/* 우측 선택 소재 주간(7일) 분기 타임라인 영역 */}
            <div style={{ flex: 1, minWidth: 0, padding: '8px 10px 10px', overflowX: 'auto' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `144px repeat(${Math.max(1, weekDateColumns.length)}, minmax(74px, 1fr))`,
                  alignItems: 'center',
                  background: '#f1f5f9',
                  borderRadius: '6px',
                  padding: '6px 0',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#1e293b',
                  marginBottom: '8px'
                }}
              >
                <div style={{ paddingLeft: '10px' }}>출발 LOT / 갈래</div>
                {weekDateColumns.map((col) => {
                  const isTodayCol = col.ymd === today;
                  const isRefEndCol = col.ymd === effectiveEnd;
                  return (
                    <div
                      key={col.ymd}
                      style={{
                        textAlign: 'center',
                        color: isTodayCol || isRefEndCol ? '#1d4ed8' : '#1e293b'
                      }}
                    >
                      {col.label}
                      <span style={{ fontSize: '10px', fontWeight: 700, marginLeft: '2px', opacity: 0.8 }}>
                        ({col.weekday})
                      </span>
                    </div>
                  );
                })}
              </div>

              {filteredMaterialLots.length > 0 ? (
                <div>{filteredMaterialLots.map((lot) => renderLotBranchBlock(lot))}</div>
              ) : (
                <div
                  style={{
                    padding: '32px 16px',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px dashed #cbd5e1'
                  }}
                >
                  선택한 소재(<strong>{materialTimeline.material?.label}</strong>)의 해당 주간(
                  {materialTimeline.weekStart} ~ {materialTimeline.weekEnd}) 투입 LOT 이력이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ==================== 4. 우하단: 부자재 LOT 현황 (5종 카드: 패드/브라켓/조인트재료/Glass/D/V) ==================== */}
        <div className="grun-panel-card" style={{ alignSelf: 'start' }}>
          <div className="grun-panel-header">
            <span style={{ fontSize: '14.5px', fontWeight: 800 }}>부자재 LOT 현황</span>
            <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 600 }}>
              클릭 시 상세 이력
            </span>
          </div>

          <div
            style={{
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              gap: '10px'
            }}
          >
            {(model.subMaterial5Cards || []).map((card) => {
              const isEmpty = !card.primaryLot;
              return (
                <div
                  key={card.id}
                  className="grun-sublot-row"
                  onClick={() => setInspectorModal({ type: 'sublot', data: card })}
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #dbe2ec',
                    borderRadius: '9px',
                    padding: '8px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {/* 좌측 바코드 + 품목명/LOT 번호 */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      minWidth: 0,
                      flex: 1
                    }}
                  >
                    <MiniBarcode seedText={card.primaryLot || card.id} isEmpty={isEmpty} />

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 800,
                            color: '#0f172a',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {card.title}
                        </span>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '1px 7px',
                            borderRadius: '999px',
                            fontSize: '10px',
                            fontWeight: 800,
                            background: '#e0f2fe',
                            color: '#0369a1',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {card.shortBadge || card.processBadge}
                        </span>
                      </div>

                      <div
                        style={{
                          marginTop: '3px',
                          fontSize: '11px',
                          fontWeight: 700,
                          fontFamily: "'JetBrains Mono', 'Consolas', monospace",
                          color: isEmpty ? '#94a3b8' : '#475569',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                        title={card.primaryLot || '투입 LOT 미입력'}
                      >
                        {card.primaryLot ? `LOT ${card.primaryLot}` : '투입 LOT 대기중'}
                      </div>
                    </div>
                  </div>

                  {/* 우측 초 · 중 · 종 상태 배지 */}
                  <div style={{ display: 'inline-flex', gap: '4px', flexShrink: 0 }}>
                    {card.stages.map((st, sIdx) => {
                      const activeColors = [
                        { bg: '#10b981', fg: '#ffffff' },
                        { bg: '#d97706', fg: '#ffffff' },
                        { bg: '#475569', fg: '#ffffff' }
                      ];
                      const c = activeColors[sIdx % activeColors.length];
                      return (
                        <span
                          key={st.label}
                          title={st.value ? `${st.label}: ${st.value}` : `${st.label}: 미입력`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '23px',
                            height: '21px',
                            borderRadius: '6px',
                            fontSize: '10.5px',
                            fontWeight: 800,
                            background: st.filled ? c.bg : '#e2e8f0',
                            color: st.filled ? c.fg : '#94a3b8'
                          }}
                        >
                          {st.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── 공정 / 부자재 / LOT 추적 상세 드릴다운 팝업 ── */}
      {inspectorModal && (
        <div
          onClick={() => setInspectorModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            zIndex: 2500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '84vh',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(15, 23, 42, 0.22)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 18px',
                background: '#162b4c',
                color: '#ffffff',
                borderRadius: '12px 12px 0 0'
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 800 }}>
                {inspectorModal.type === 'process'
                  ? `🏭 #${inspectorModal.data.code} ${inspectorModal.data.processName} — 상세 현황 (${periodLabel})`
                  : inspectorModal.type === 'lot_track'
                    ? `🧵 [${inspectorModal.data.materialLabel}] 출발 LOT ${inspectorModal.data.lotKey} 분기 추적 내역`
                    : `🧪 부자재 [${inspectorModal.data.title}] 실시간 LOT 투입 내역 (${periodLabel})`}
              </div>
              <button
                type="button"
                onClick={() => setInspectorModal(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#cbd5e1',
                  fontSize: '22px',
                  cursor: 'pointer',
                  lineHeight: 1
                }}
              >
                &times;
              </button>
            </div>

            <div style={{ padding: '16px 18px', overflowY: 'auto', flex: 1 }}>
              {inspectorModal.type === 'process' ? (
                <>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '8px',
                      marginBottom: '14px'
                    }}
                  >
                    {[
                      {
                        label: '총 실적',
                        val: `${inspectorModal.data.actual.toLocaleString()} EA`,
                        color: '#0f172a'
                      },
                      {
                        label: inspectorModal.data.sideLabelPair ? 'FRT / RR' : 'LH / RH',
                        val: `${inspectorModal.data.lh.toLocaleString()} / ${inspectorModal.data.rh.toLocaleString()}`,
                        color: '#2563eb'
                      },
                      {
                        label: '불량 (불량률)',
                        val: `${inspectorModal.data.defect} EA (${inspectorModal.data.defectRate.toFixed(2)}%)`,
                        color: inspectorModal.data.defect > 0 ? '#e11d48' : '#059669'
                      },
                      {
                        label: '비가동 시간',
                        val: `${inspectorModal.data.downtimeMin} 분`,
                        color: '#334155'
                      }
                    ].map((box) => (
                      <div
                        key={box.label}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '8px 10px'
                        }}
                      >
                        <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 700 }}>
                          {box.label}
                        </div>
                        <div
                          style={{
                            fontSize: '13.5px',
                            fontWeight: 800,
                            color: box.color,
                            marginTop: '3px'
                          }}
                        >
                          {box.val}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 800,
                      marginBottom: '6px',
                      color: '#334155'
                    }}
                  >
                    ▪ 투입 압출소재 LOT 세부 목록 ({inspectorModal.data.lotSummary.details.length}건)
                  </div>
                  {inspectorModal.data.lotSummary.details.length > 0 ? (
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '11.5px',
                        marginBottom: '16px',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <thead>
                        <tr style={{ background: '#f8fafc', color: '#475569' }}>
                          <th style={{ padding: '6px', border: '1px solid #e2e8f0' }}>구분</th>
                          <th style={{ padding: '6px', border: '1px solid #e2e8f0' }}>시기</th>
                          <th style={{ padding: '6px', border: '1px solid #e2e8f0' }}>투입 LOT 번호</th>
                          <th style={{ padding: '6px', border: '1px solid #e2e8f0' }}>작업자 / 일자</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspectorModal.data.lotSummary.details.map((d, idx) => (
                          <tr key={`${d.reportId}-${idx}`}>
                            <td
                              style={{
                                padding: '6px',
                                border: '1px solid #e2e8f0',
                                textAlign: 'center',
                                fontWeight: 700
                              }}
                            >
                              {d.partLabel}
                            </td>
                            <td
                              style={{
                                padding: '6px',
                                border: '1px solid #e2e8f0',
                                textAlign: 'center',
                                color: '#2563eb',
                                fontWeight: 700
                              }}
                            >
                              {d.stage}
                            </td>
                            <td
                              style={{
                                padding: '6px',
                                border: '1px solid #e2e8f0',
                                textAlign: 'center',
                                fontFamily: 'monospace',
                                fontWeight: 700
                              }}
                            >
                              {d.value}
                            </td>
                            <td
                              style={{
                                padding: '6px',
                                border: '1px solid #e2e8f0',
                                textAlign: 'center',
                                color: '#64748b'
                              }}
                            >
                              {d.workerName || '-'} ({d.date})
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div
                      style={{
                        padding: '12px',
                        color: '#64748b',
                        fontSize: '12px',
                        marginBottom: '12px'
                      }}
                    >
                      입력된 압출소재 LOT 내역이 없습니다.
                    </div>
                  )}

                  <div
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 800,
                      marginBottom: '6px',
                      color: '#334155'
                    }}
                  >
                    ▪ 연결된 작업일보 ({inspectorModal.data.reports.length}건)
                  </div>
                  {inspectorModal.data.reports.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {inspectorModal.data.reports.map((rep) => (
                        <div
                          key={rep.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '8px 12px'
                          }}
                        >
                          <div style={{ fontSize: '12px', color: '#0f172a' }}>
                            <strong>{rep.date}</strong> · 👷 {rep.workerName || '-'}{' '}
                            <span style={{ color: '#64748b' }}>
                              ({rep.workHours || '-'} | 실적{' '}
                              {Number(rep.actualQty || 0).toLocaleString()} EA / 불량{' '}
                              {Number(rep.defectQty || 0)} EA)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDetailReport(rep)}
                            style={{
                              background: '#4f46e5',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '5px 10px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            원본 일보 열기
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: '12px', color: '#64748b', fontSize: '12px' }}>
                      해당 일자에 작성된 작업일보가 없습니다.
                    </div>
                  )}
                </>
              ) : inspectorModal.type === 'lot_track' ? (
                <>
                  {/* 공용 출발 LOT (#5002 정치절단) */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      marginBottom: '10px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                      ● 공용 출발 (정치절단 #5002 · L/R 구분 없음)
                    </span>
                    <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#1e293b' }}>
                      {inspectorModal.data.origin?.datesAll?.length > 0
                        ? inspectorModal.data.origin.datesAll.join(', ')
                        : '조회 구간 이전 절단 / 기록 없음'}
                    </span>
                  </div>

                  {/* LH / RH 갈래별 공정 요약 */}
                  {[
                    { key: 'lh', label: 'LH 갈래', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
                    { key: 'rh', label: 'RH 갈래', color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4' }
                  ].map((brMeta) => {
                    const br = inspectorModal.data[brMeta.key];
                    const stages =
                      inspectorModal.data.materialKey === 'FRT_C'
                        ? ['조인트', '출하']
                        : inspectorModal.data.group === 'FRT'
                          ? ['단컷팅', '조인트', '출하']
                          : ['단컷팅', '조인트', '후가공', '출하'];
                    return (
                      <div key={brMeta.key} style={{ marginBottom: '12px' }}>
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 800,
                            color: brMeta.color,
                            marginBottom: '6px'
                          }}
                        >
                          ↳ {brMeta.label} 이동 공정
                        </div>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${stages.length}, 1fr)`,
                            gap: '8px'
                          }}
                        >
                          {stages.map((st) => {
                            const dates = br?.stageSummary?.[st] || [];
                            const isMissing = (br?.missingStages || []).includes(st);
                            return (
                              <div
                                key={st}
                                style={{
                                  background: isMissing ? '#fef2f2' : brMeta.bg,
                                  border: isMissing ? '1px solid #fda4af' : `1px solid ${brMeta.border}`,
                                  borderRadius: '8px',
                                  padding: '8px 10px'
                                }}
                              >
                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
                                  {st}
                                </div>
                                <div
                                  style={{
                                    fontSize: '12.5px',
                                    fontWeight: 800,
                                    color:
                                      dates.length > 0
                                        ? '#0f172a'
                                        : isMissing
                                          ? '#e11d48'
                                          : '#94a3b8',
                                    marginTop: '3px'
                                  }}
                                >
                                  {dates.length > 0
                                    ? dates.join(', ')
                                    : isMissing
                                      ? '✕ 끊김 (미확인)'
                                      : '-'}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  <div
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 800,
                      marginBottom: '6px',
                      color: '#334155'
                    }}
                  >
                    ▪ 해당 소재 LOT가 기록된 작업일보 ({inspectorModal.data.reports?.length || 0}건)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(inspectorModal.data.reports || []).map((rep) => (
                      <div
                        key={rep.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          padding: '8px 12px'
                        }}
                      >
                        <div style={{ fontSize: '12px', color: '#0f172a' }}>
                          <strong>{rep.date}</strong> · #{rep.formCode} {rep.processName} · 👷{' '}
                          {rep.workerName || '-'}
                        </div>
                        <button
                          type="button"
                          onClick={() => setDetailReport(rep)}
                          style={{
                            background: '#4f46e5',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '5px 10px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          원본 일보 열기
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '12px', fontSize: '12px', color: '#64748b' }}>
                    적용 공정:{' '}
                    <strong style={{ color: '#0f172a' }}>{inspectorModal.data.processBadge}</strong> ·{' '}
                    {inspectorModal.data.specLabel}
                  </div>
                  {inspectorModal.data.records.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {inspectorModal.data.records.map((rec, i) => (
                        <div
                          key={`${rec.report?.id || i}-${i}`}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '10px',
                            flexWrap: 'wrap'
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#0f172a' }}>
                              #{rec.formCode} {rec.processName}{' '}
                              <span style={{ color: '#4f46e5', fontWeight: 700 }}>
                                {rec.extra ? `(${rec.extra})` : ''}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: '11.5px',
                                color: '#334155',
                                marginTop: '4px',
                                fontFamily: 'monospace'
                              }}
                            >
                              초: <strong>{rec.초 || '-'}</strong> | 중:{' '}
                              <strong>{rec.중 || '-'}</strong> | 종: <strong>{rec.종 || '-'}</strong>
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px' }}>
                              {rec.date} · 👷 {rec.workerName} ({rec.workHours || '-'})
                            </div>
                          </div>
                          {rec.report && (
                            <button
                              type="button"
                              onClick={() => setDetailReport(rec.report)}
                              style={{
                                background: '#4f46e5',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '5px 10px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              원본 일보 열기
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '20px',
                        textAlign: 'center',
                        color: '#64748b',
                        fontSize: '12.5px'
                      }}
                    >
                      선택된 기간 내 입력된 [{inspectorModal.data.title}] LOT 이력이 없습니다.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 원본 작업일보 상세 모달 연동 */}
      {detailReport && (
        <Suspense fallback={null}>
          <LegacyDetailModal report={detailReport} onClose={() => setDetailReport(null)} />
        </Suspense>
      )}
    </div>
  );
}
