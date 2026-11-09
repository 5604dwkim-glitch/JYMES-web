import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LegacyAnalyticsWrapper from './DynamicForms/LegacyAnalyticsWrapper';
import ProcessDefectAnalysis from './AnalyticsParts/ProcessDefectAnalysis';
import {
  fetchReports,
  fetchDailyStats,
  fetchEquipments,
  fetchMolds,
  fetchChangePoints,
  fetchDowntimeReports
} from '../services/firestore';

export default function Analytics() {
  const location = useLocation();
  const [reports, setReports] = useState([]);
  const [analysisPayload, setAnalysisPayload] = useState({
    dailyStats: [],
    equipments: [],
    molds: [],
    changePoints: [],
    downtimeReports: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      try {
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('sv-SE');
        const endDate = new Date().toLocaleDateString('sv-SE');
        // dailyStats / equipments / molds / changePoints / downtimeReports 는 모두 메모리 캐시를 재사용하여 중복 읽기가 발생하지 않는다
        const [repData, statsData, eqData, moldData, cpData, dtReports] = await Promise.all([
          fetchReports({ startDate, endDate }),
          fetchDailyStats(null),
          fetchEquipments(),
          fetchMolds(),
          fetchChangePoints(false),
          fetchDowntimeReports('', false)
        ]);
        if (!mounted) return;
        setReports(repData || []);
        setAnalysisPayload({
          dailyStats: statsData || [],
          equipments: eqData || [],
          molds: moldData || [],
          changePoints: cpData || [],
          downtimeReports: dtReports || []
        });
      } catch (e) {
        console.error('Failed to load analytics data:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

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
      initialActiveTab={location.state?.activeTab}
      chartsContent={
        <ProcessDefectAnalysis
          dailyStats={analysisPayload.dailyStats}
          downtimeReports={analysisPayload.downtimeReports}
          equipments={analysisPayload.equipments}
          molds={analysisPayload.molds}
          changePoints={analysisPayload.changePoints}
          initialSubTab={location.state?.subTab || 'trend'}
        />
      }
    />
  );
}
