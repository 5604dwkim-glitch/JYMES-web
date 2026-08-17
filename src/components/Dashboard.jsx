import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { fetchReports } from '../services/firestore';
import { MANUFACTURERS, CAR_MODELS, CAR_MODEL_PARTS } from '../constants/masterData';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const { userRole } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedMaker, setSelectedMaker] = useState('ALL');
  const [selectedCar, setSelectedCar] = useState('ALL');
  const [selectedPart, setSelectedPart] = useState('ALL');
  const [gridMaker, setGridMaker] = useState('ALL');

  useEffect(() => {
    async function loadData() {
      const data = await fetchReports();
      setReports(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const isWorker = userRole?.role !== 'admin';

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Dashboard...</div>;
  }

  if (isWorker) {
    return <WorkerDashboard reports={reports} workerName={userRole?.workerName} navigate={navigate} t={t} />;
  }

  return (
    <AdminDashboard 
      reports={reports} 
      t={t}
      selectedMaker={selectedMaker} setSelectedMaker={setSelectedMaker}
      selectedCar={selectedCar} setSelectedCar={setSelectedCar}
      selectedPart={selectedPart} setSelectedPart={setSelectedPart}
      gridMaker={gridMaker} setGridMaker={setGridMaker}
    />
  );
}

function WorkerDashboard({ reports, workerName, navigate, t }) {
  const myReports = reports.filter(r => r.workerName === workerName).slice(0, 3);

  return (
    <div className="dashboard-view">
      <div id="workerModeView" style={{ display: 'block' }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', color: '#ffffff', padding: '20px', border: 'none', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>👋 안녕하세요, {workerName || '작업자'} 님!</h2>
              <p style={{ fontSize: '13px', opacity: 0.9 }}>오늘도 안전하고 정확한 작업일보를 작성해 주세요.</p>
            </div>
            <button className="btn btn-success" onClick={() => navigate('/form')} style={{ padding: '10px 20px', fontSize: '14px' }}>
              ✍️ {t('quick_report')}
            </button>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: '16px' }}>
          <div className="card" style={{ margin: 0 }}>
            <div className="card-header">
              <div className="card-title">📋 나의 최근 작성 일보</div>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/reports')}>전체보기</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {myReports.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
                  최근 작성된 일보가 없습니다.
                </div>
              ) : myReports.map(r => (
                <div key={r.id} style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px' }}>{r.date} | {r.carModel} - {r.processName}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.itemName} | {r.actualQty?.toLocaleString()} EA</div>
                  </div>
                  <span className={`status-badge ${r.status === '승인 완료' ? 'approved' : r.status === '반려' ? 'rejected' : 'pending'}`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ margin: 0 }}>
            <div className="card-header">
              <div className="card-title">📢 현장 공지 및 가동 현황</div>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', borderLeft: '4px solid var(--accent-cyan)' }}>
                <strong>💡 안전 작업 수칙:</strong> 작업 전 보호구(안전화, 장갑) 착용을 필히 확인하시기 바랍니다.
              </div>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', borderLeft: '4px solid var(--accent-emerald)' }}>
                <strong>🧪 소재 LOT 번호:</strong> FRT & RR 소재 초물/중물/종물 LOT 번호 입력을 철저히 이행 바랍니다.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ reports, t, selectedMaker, setSelectedMaker, selectedCar, setSelectedCar, selectedPart, setSelectedPart, gridMaker, setGridMaker }) {
  // Compute summary stats
  const todayStr = new Date().toISOString().split('T')[0];
  let targetReports = reports.filter(r => r.date === todayStr);
  let targetDateLabel = `오늘 (${todayStr})`;

  if (targetReports.length === 0 && reports.length > 0) {
    const latestDate = reports[0].date;
    targetReports = reports.filter(r => r.date === latestDate);
    targetDateLabel = `최근 가동일 (${latestDate})`;
  }

  const totalTarget = targetReports.reduce((acc, r) => acc + (r.targetQty || 0), 0);
  const totalActual = targetReports.reduce((acc, r) => acc + (r.actualQty || 0), 0);
  const totalDefect = targetReports.reduce((acc, r) => acc + (r.defectQty || 0), 0);
  const pendingCount = targetReports.filter(r => r.status === '승인 대기').length;
  const avgAttainment = totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) : 0;
  const avgDefectRate = totalActual > 0 ? ((totalDefect / totalActual) * 100).toFixed(2) : 0;
  const activeProcessesCount = new Set(targetReports.map(r => r.processName)).size;
  const activeCarModelsCount = new Set(targetReports.map(r => r.carModel)).size;

  return (
    <div className="dashboard-view">
      <div className="kpi-grid" style={{ marginBottom: '16px' }}>
        <div className="kpi-card cyan">
          <div className="kpi-header">
            <span>{t('kpi_total_prod')}</span>
            <span>📦 {t('unit_pcs')}</span>
          </div>
          <div className="kpi-value">{totalActual.toLocaleString()}</div>
          <div className="kpi-sub">{t('kpi_target_rate')}: {totalTarget.toLocaleString()} {t('unit_pcs')} ({avgAttainment}%)</div>
        </div>

        <div className="kpi-card rose">
          <div className="kpi-header">
            <span>오늘 불량 수량</span>
            <span>⚠️ {t('unit_pcs')}</span>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-rose)' }}>{totalDefect.toLocaleString()}</div>
          <div className="kpi-sub">{t('kpi_defect_rate')} {avgDefectRate}%</div>
        </div>

        <div className="kpi-card amber">
          <div className="kpi-header">
            <span>{t('status_pending')}</span>
            <span>⏳ 건</span>
          </div>
          <div className="kpi-value" style={{ color: 'var(--accent-amber)' }}>{pendingCount}</div>
          <div className="kpi-sub">결재 필요</div>
        </div>

        <div className="kpi-card emerald">
          <div className="kpi-header">
            <span>{t('form_line')}</span>
            <span>🏭 종</span>
          </div>
          <div className="kpi-value">{activeCarModelsCount} / {activeProcessesCount}</div>
          <div className="kpi-sub">{targetDateLabel}</div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '16px', border: '1px solid var(--border-color)', background: '#ffffff' }}>
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
          <div>
            <div className="card-title" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-main)' }}>
              <span>📊 세부 차종 및 하위 세부 부품별 월간 불량 추이 분석</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              자동차 제조사 및 세부 차종 선택 후 하위 세부 부품의 생산량 및 불량률 추이를 분석합니다.
            </p>
          </div>
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          (차트 상세 분석 영역 - React Chart.js 연동 준비됨)
        </div>
      </div>
    </div>
  );
}