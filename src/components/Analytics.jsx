import React, { useState, useEffect, useCallback, useRef, Suspense, lazy } from 'react';
import { useLocation } from 'react-router-dom';
import LegacyAnalyticsWrapper from './DynamicForms/LegacyAnalyticsWrapper';
import ProcessDefectAnalysis from './AnalyticsParts/ProcessDefectAnalysis';
import {
  fetchDailyStats,
  fetchRecentDailyStats,
  fetchStellantisAnalyticsReports,
  fetchEquipmentsSlim,
  fetchMoldsSlim,
  fetchChangePoints,
  fetchDowntimeReports
} from '../services/firestore';

const Gm9bqcGrunDashboard = lazy(() => import('./AnalyticsParts/Gm9bqcGrunDashboard'));

export default function Analytics() {
  const location = useLocation();
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [hasFullHistory, setHasFullHistory] = useState(false);
  const [analysisPayload, setAnalysisPayload] = useState({
    dailyStats: [],
    equipments: [],
    molds: [],
    changePoints: [],
    downtimeReports: []
  });
  const [loading, setLoading] = useState(true);

  const mountedRef = useRef(true);
  const loadedFlagsRef = useRef({
    stellantis: false,
    downtime: false,
    equipAssets: false,
    fullHistory: false
  });
  const fullHistoryTaskRef = useRef(null);

  const patchPayload = useCallback((key, promise) => {
    return promise
      .then((val) => {
        if (mountedRef.current) {
          setAnalysisPayload((prev) => ({ ...prev, [key]: val || [] }));
        }
        return val || [];
      })
      .catch((e) => {
        console.error(`Failed to load analytics ${key}:`, e);
        return [];
      });
  }, []);

  // 주간 스텔란티스 실적 탭 진입(또는 마우스 호버) 시에만 반장·클립머신 경량 일보 로드
  const ensureStellantisReportsLoaded = useCallback(() => {
    if (loadedFlagsRef.current.stellantis) return;
    loadedFlagsRef.current.stellantis = true;
    setReportsLoading(true);
    fetchStellantisAnalyticsReports(false)
      .then((repData) => {
        if (mountedRef.current) setReports(repData || []);
      })
      .catch((e) => console.error('Failed to load Stellantis analytics reports:', e))
      .finally(() => {
        if (mountedRef.current) setReportsLoading(false);
      });
  }, []);

  // 하위 분석 탭(불량 파레토 / 설비·금형 영향) 선택·호버 시에만 보조 컬렉션 온디맨드 로드
  const ensureSubTabDataLoaded = useCallback((targetSubTab) => {
    if (targetSubTab === 'pareto' || targetSubTab === 'equip') {
      if (!loadedFlagsRef.current.downtime) {
        loadedFlagsRef.current.downtime = true;
        patchPayload('downtimeReports', fetchDowntimeReports('', false));
      }
    }
    if (targetSubTab === 'equip') {
      if (!loadedFlagsRef.current.equipAssets) {
        loadedFlagsRef.current.equipAssets = true;
        patchPayload('equipments', fetchEquipmentsSlim());
        patchPayload('molds', fetchMoldsSlim());
        patchPayload('changePoints', fetchChangePoints(false));
      }
    }
  }, [patchPayload]);

  // '전체' 기간 버튼 클릭 또는 최근 90일 이전 날짜 선택 시 전체 기간 daily_stats 확장 로드
  const ensureFullHistoryLoaded = useCallback(() => {
    if (loadedFlagsRef.current.fullHistory && fullHistoryTaskRef.current) {
      return fullHistoryTaskRef.current;
    }
    loadedFlagsRef.current.fullHistory = true;
    const task = patchPayload('dailyStats', fetchDailyStats(null, false)).then((allStats) => {
      if (mountedRef.current) setHasFullHistory(true);
      return allStats;
    });
    fullHistoryTaskRef.current = task;
    return task;
  }, [patchPayload]);

  const handleTabChange = useCallback((tabId) => {
    if (tabId === 'tab-weekly') {
      ensureStellantisReportsLoaded();
    }
  }, [ensureStellantisReportsLoaded]);

  const handleTabHover = useCallback((tabId) => {
    if (tabId === 'tab-weekly') {
      ensureStellantisReportsLoaded();
    } else if (tabId === 'tab-9bqc-grun') {
      import('./AnalyticsParts/Gm9bqcGrunDashboard').catch(() => {});
    }
  }, [ensureStellantisReportsLoaded]);

  useEffect(() => {
    mountedRef.current = true;
    const rawTab = location.state?.activeTab || 'tab-charts';
    const initialTab = (rawTab === 'tab-leader' || rawTab === 'tab-dtclip') ? 'tab-weekly' : rawTab;
    const initialSubTab = location.state?.subTab || 'trend';

    async function loadInitial() {
      // 스텔란티스 탭이나 9BQC 현황판으로 직접 진입한 경우 화면을 즉시 열고 필요한 데이터만 병렬 로드
      if (initialTab === 'tab-weekly') {
        ensureStellantisReportsLoaded();
        setLoading(false);
        patchPayload('dailyStats', fetchRecentDailyStats(90, false));
        return;
      }
      if (initialTab === 'tab-9bqc-grun') {
        setLoading(false);
        patchPayload('dailyStats', fetchRecentDailyStats(90, false));
        return;
      }

      // 기본 진입(📈 공정 및 불량 분석): 최근 90일 daily_stats 단일 쿼리만 우선 수행해 네트워크 경합 차단
      const statsTask = patchPayload('dailyStats', fetchRecentDailyStats(90, false));
      if (initialSubTab === 'pareto' || initialSubTab === 'equip') {
        ensureSubTabDataLoaded(initialSubTab);
      }

      await Promise.race([
        statsTask,
        new Promise((resolve) => setTimeout(resolve, 3000))
      ]);
      if (mountedRef.current) {
        setLoading(false);
      }
    }

    loadInitial();
    return () => {
      mountedRef.current = false;
    };
  }, [location.state?.activeTab, location.state?.subTab, patchPayload, ensureStellantisReportsLoaded, ensureSubTabDataLoaded]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', color: '#64748b', fontSize: '14px' }}>
        분석 데이터를 불러오는 중...
      </div>
    );
  }

  return (
    <LegacyAnalyticsWrapper
      reports={reports}
      reportsLoading={reportsLoading}
      initialActiveTab={location.state?.activeTab}
      onTabChange={handleTabChange}
      onTabHover={handleTabHover}
      chartsContent={
        <ProcessDefectAnalysis
          dailyStats={analysisPayload.dailyStats}
          downtimeReports={analysisPayload.downtimeReports}
          equipments={analysisPayload.equipments}
          molds={analysisPayload.molds}
          changePoints={analysisPayload.changePoints}
          initialSubTab={location.state?.subTab || 'trend'}
          hasFullHistory={hasFullHistory}
          onNeedFullHistory={ensureFullHistoryLoaded}
          onSubTabDemand={ensureSubTabDataLoaded}
        />
      }
      grunContent={
        <Suspense
          fallback={
            <div style={{ padding: '48px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
              9BQC G/RUN 종합 현황판을 불러오는 중...
            </div>
          }
        >
          <Gm9bqcGrunDashboard
            reports={reports}
            reportsLoading={reportsLoading}
          />
        </Suspense>
      }
    />
  );
}
