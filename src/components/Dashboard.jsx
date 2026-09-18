import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { fetchMyRecentReports, fetchReports, fetchChangePoints, fetchDailyStats, fetchMolds, fetchEquipments } from '../services/firestore';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { CAR_MODELS, DEFECT_TYPES, MANUFACTURERS, CAR_MODEL_PARTS } from '../constants/masterData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard() {
  const { userRole } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  
  const [reports, setReports] = useState([]);
  const [dashboardData, setDashboardData] = useState({
    dailyStats: [], reports: [], equipments: [], molds: [], changePoints: []
  });
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const loadData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    if (userRole?.role === 'worker') {
      const data = await fetchMyRecentReports(userRole.workerName);
      setReports(data);
    } else {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const startDate = oneMonthAgo.toLocaleDateString('sv-SE');
      try {
        // forceRefresh=true 이면 캐시 무효화 후 재조회
        if (forceRefresh) {
          const { invalidateMoldsCache, invalidateEquipmentsCache } = await import('../services/firestore');
          invalidateMoldsCache();
          invalidateEquipmentsCache();
        }
        const [statsData, equipmentsData, moldsData, cpData] = await Promise.all([
          fetchDailyStats(startDate),
          fetchEquipments(),
          fetchMolds(),
          fetchChangePoints(forceRefresh),
        ]);
        setDashboardData({
          dailyStats: statsData || [],
          reports: [],
          equipments: equipmentsData || [],
          molds: moldsData || [],
          changePoints: cpData || [],
        });
        setLastRefreshed(new Date());
      } catch (e) {
        console.error('Failed to load dashboard data', e);
      }
    }
    setLoading(false);
  }, [userRole]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(false); }, [userRole]);

  const isWorker = userRole?.role !== 'admin';

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px', color: '#64748b' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: '14px' }}>대시보드 데이터 로딩 중...</div>
      </div>
    );
  }

  if (isWorker) {
    return <WorkerDashboard reports={reports} workerName={userRole?.workerName} navigate={navigate} t={t} />;
  }

  return (
    <AdminDashboard
      data={dashboardData}
      t={t}
      navigate={navigate}
      onRefresh={() => loadData(true)}
      lastRefreshed={lastRefreshed}
      isRefreshing={loading}
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
              <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px' }}>안녕하세요, {workerName || '작업자'} 님!</h2>
              <p style={{ fontSize: '13px', opacity: 0.9, lineHeight: '1.4' }}>오늘도 안전하고 즐거운 하루 되세요!<br />작업 정보는 시간에 맞춰 담당 폼에 기입 부탁드리며 품질 관리에 최선을 다해 주세요.</p>
            </div>
            <button className="btn btn-success" onClick={() => navigate('/form')} style={{ padding: '10px 20px', fontSize: '14px' }}>
              📝 {t('quick_report')}
            </button>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: '16px' }}>
          <div className="card" style={{ margin: 0 }}>
            <div className="card-header">
              <div className="card-title">내 오늘의 최근 작성 정보</div>
              <button className="btn btn-secondary btn-sm" onClick={() => navigate('/reports')}>전체보기</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {myReports.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '12px' }}>
                  최근 작성한 정보가 없습니다.
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
              <div className="card-title">현 공장 공지 및 전달사항</div>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-main)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', borderLeft: '4px solid var(--accent-cyan)' }}>
                <strong>※ 안전 작업 수칙:</strong> 작업 전 보호구(안전모, 장갑) 착용을 필히 확인하시기 바랍니다.
              </div>
              <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '6px', borderLeft: '4px solid var(--accent-emerald)' }}>
                <strong>※ 자재 LOT 번호:</strong> FRT & RR 자재 초물/중물/종물 LOT 번호 입력을 철저히 이행 바랍니다.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 원형 게이지 SVG 컴포넌트 ───────────────────────────────
function CircleGauge({ pct, size = 64, color = '#3b82f6', trackColor = '#e2e8f0', children }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const filled = circ * Math.min(pct, 100) / 100;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="middle"
        fontSize={size < 56 ? 9 : 11} fontWeight={700} fill={color}>
        {children}
      </text>
    </svg>
  );
}

// ── 경과일 계산 ────────────────────────────────────────────
function daysAgo(dateStr) {
  if (!dateStr) return null;
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  return diff;
}

// ── 변동점 유형 배지 색상 ─────────────────────────────────
const CP_TYPE_COLORS = {
  '자재변경': { bg: '#eff6ff', color: '#1d4ed8' },
  '설비변경': { bg: '#f0fdf4', color: '#15803d' },
  '금형변경': { bg: '#fefce8', color: '#a16207' },
  '작업방법': { bg: '#fdf4ff', color: '#7e22ce' },
  '인원변경': { bg: '#fff7ed', color: '#c2410c' },
};

// ── AdminDashboard ─────────────────────────────────────────
function AdminDashboard({ data, t, navigate, onRefresh, lastRefreshed, isRefreshing }) {
  const [chartPeriod, setChartPeriod] = useState('weekly');
  const [activeTab, setActiveTab] = useState('chart');      // 'chart' | 'defects'
  const [defectPeriod, setDefectPeriod] = useState('month'); // 'week' | 'month' | 'all'

  // 필터 상태
  const [filterMfg, setFilterMfg] = useState('ALL');
  const [filterCar, setFilterCar] = useState('ALL');
  const [filterPart, setFilterPart] = useState('ALL');
  const [filterProc, setFilterProc] = useState('ALL');

  // 필터 옵션
  const mfgOptions = useMemo(() => MANUFACTURERS.map(m => m.name), []);
  const carOptions = // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => {
    if (filterMfg === 'ALL') return MANUFACTURERS.flatMap(m => m.models).map(m => m.code);
    const mfg = MANUFACTURERS.find(m => m.name === filterMfg);
    return mfg ? mfg.models.map(m => m.code) : [];
  }, [filterMfg]);
  const procOptions = ['소재준비', '조인트', '검사포장', '후가공'];
  const partOptions = // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => {
    let carsToConsider = [];
    if (filterCar !== 'ALL') {
      carsToConsider = [filterCar];
    } else if (filterMfg !== 'ALL') {
      const mfg = MANUFACTURERS.find(m => m.name === filterMfg);
      if (mfg) carsToConsider = mfg.models.map(m => m.code);
    } else {
      carsToConsider = Object.keys(CAR_MODEL_PARTS);
    }
    const parts = carsToConsider.flatMap(c => CAR_MODEL_PARTS[c] || []).map(p => p.code);
    return [...new Set(parts)];
  }, [filterMfg, filterCar]);

  useEffect(() => { setFilterCar('ALL'); }, [filterMfg]);
  useEffect(() => { setFilterPart('ALL'); }, [filterCar]);
  useEffect(() => { setFilterProc('ALL'); }, [filterPart]);

  // ── 날짜 범위 헬퍼 ──────────────────────────────────────
  const todayStr = new Date().toLocaleDateString('sv-SE');
  const getWeekStart = () => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1);
    return d.toLocaleDateString('sv-SE');
  };
  const getMonthStart = () => {
    const d = new Date(); d.setDate(1);
    return d.toLocaleDateString('sv-SE');
  };

  // ── 오늘 or 최근 가동일 KPI ─────────────────────────────
  let targetStats = data.dailyStats?.find(r => r.date === todayStr);
  let targetDateLabel = `오늘 (${todayStr})`;
  if (!targetStats && data.dailyStats?.length > 0) {
    const latestDate = [...data.dailyStats].sort((a,b) => b.date.localeCompare(a.date))[0].date;
    targetStats = data.dailyStats.find(r => r.date === latestDate);
    targetDateLabel = `최근 가동일 (${latestDate})`;
  }
  const totalTarget  = Number(targetStats?.totalTargetQty  || 0);
  const totalActual  = Number(targetStats?.totalActualQty  || 0);
  const totalDefect  = Number(targetStats?.totalDefectQty  || 0);
  const totalReports = Number(targetStats?.totalReports    || 0);
  const attainPct    = totalTarget > 0 ? +((totalActual  / totalTarget)  * 100).toFixed(1) : 0;
  const defectRate   = totalActual > 0 ? +((totalDefect  / totalActual)  * 100).toFixed(2) : 0;
  const defectStatus = defectRate === 0 ? 'safe' : defectRate <= 1 ? 'good' : defectRate <= 3 ? 'warn' : 'danger';
  const defectBadge  = { safe: ['🟢','#15803d','#f0fdf4'], good: ['🟢','#15803d','#f0fdf4'], warn: ['🟡','#a16207','#fefce8'], danger: ['🔴','#b91c1c','#fef2f2'] }[defectStatus];

  // ── 차트 데이터 ─────────────────────────────────────────
  const getWeekNo = d => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    const ys = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return `${d.getUTCFullYear()}년 ${Math.ceil(((d-ys)/86400000+1)/7)}주차`;
  };
  const getMonthStr = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;

  const safeFilterCar = filterCar === 'ALL' ? 'ALL' : filterCar.replace(/[\.\/\[\]]/g, '_');
  const safeFilterPart = filterPart === 'ALL' ? 'ALL' : filterPart.replace(/[\.\/\[\]]/g, '_');

  const chartDataObj = // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => {
    const sorted = [...(data.dailyStats||[])].sort((a,b) => a.date.localeCompare(b.date));
    const groups = {};
    sorted.forEach(r => {
      if (!r.date) return;
      const key = chartPeriod === 'daily' ? (r.date || '').substring(0,10) : getMonthStr(new Date(r.date));
      if (!groups[key]) groups[key] = { actual: 0, defect: 0 };
      
      if (filterMfg === 'ALL' && filterCar === 'ALL' && filterPart === 'ALL' && filterProc === 'ALL') {
        groups[key].actual += Number(r.totalActualQty||0);
        groups[key].defect += Number(r.totalDefectQty||0);
      } else if (r.items) {
        Object.entries(r.items).forEach(([comboKey, comboData]) => {
          const [car, part, proc] = comboKey.split('::');
          let match = true;
          if (filterProc !== 'ALL' && proc !== filterProc) match = false;
          if (safeFilterCar !== 'ALL' && car !== safeFilterCar) match = false;
          if (match && filterMfg !== 'ALL' && safeFilterCar === 'ALL') {
             const mfg = MANUFACTURERS.find(m => m.name === filterMfg);
             if (!mfg || !mfg.models.some(m => m.code.replace(/[\.\/\[\]]/g, '_') === car)) match = false;
          }
          if (match && safeFilterPart !== 'ALL' && part !== safeFilterPart) match = false;
          
          if (match) {
            groups[key].actual += Number(comboData.actualQty || 0);
            groups[key].defect += Number(comboData.defectQty || 0);
          }
        });
      }
    });
    let labels = Object.keys(groups);
    if (chartPeriod === 'daily' && labels.length > 0) {
      // 가장 최근 데이터가 속한 달의 1일부터 표시
      const lastDate = new Date(labels[labels.length - 1]);
      const monthStart = `${lastDate.getFullYear()}-${String(lastDate.getMonth()+1).padStart(2,'0')}-01`;
      labels = labels.filter(l => l >= monthStart);
    }
    if (chartPeriod === 'monthly' && labels.length > 0) {
      // 가장 최근 데이터가 속한 해의 1월부터 표시
      const lastYear = labels[labels.length - 1].substring(0, 4);
      labels = labels.filter(l => l >= `${lastYear}-01`);
    }
    return {
      labels,
      datasets: [
        { type:'line', label:'불량률 (%)', data: labels.map(l => groups[l].actual>0 ? ((groups[l].defect/groups[l].actual)*100).toFixed(2) : 0),
          borderColor:'#ef4444', backgroundColor:'#ef4444', borderWidth:2, yAxisID:'y1', tension:0.3, pointRadius:4 },
        { type:'bar', label:'생산수량 (EA)', data: labels.map(l => groups[l].actual),
          backgroundColor:'rgba(59,130,246,0.75)', borderRadius:5, yAxisID:'y' },
      ]
    };
  }, [data.dailyStats, chartPeriod, filterMfg, filterCar, filterPart, filterProc]);

  // ── 불량 유형 (기간 필터) ────────────────────────────────
  const defectBreakdown = // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => {
    const cutoff = defectPeriod === 'week' ? getWeekStart() : defectPeriod === 'month' ? getMonthStart() : null;
    const filtered = (data.dailyStats||[]).filter(r => !cutoff || r.date >= cutoff);
    let defectMap = {}, totalQty = 0, detailedSum = 0;
    filtered.forEach(r => {
      if (filterMfg === 'ALL' && filterCar === 'ALL' && filterPart === 'ALL' && filterProc === 'ALL') {
        totalQty += Number(r.totalDefectQty||0);
        if (r.defectBreakdowns) Object.entries(r.defectBreakdowns).forEach(([k,v]) => {
          defectMap[k] = (defectMap[k]||0) + Number(v);
          detailedSum += Number(v);
        });
      } else if (r.items) {
        Object.entries(r.items).forEach(([comboKey, comboData]) => {
          const [car, part, proc] = comboKey.split('::');
          let match = true;
          if (filterProc !== 'ALL' && proc !== filterProc) match = false;
          if (safeFilterCar !== 'ALL' && car !== safeFilterCar) match = false;
          if (match && filterMfg !== 'ALL' && safeFilterCar === 'ALL') {
             const mfg = MANUFACTURERS.find(m => m.name === filterMfg);
             if (!mfg || !mfg.models.some(m => m.code.replace(/[\.\/\[\]]/g, '_') === car)) match = false;
          }
          if (match && safeFilterPart !== 'ALL' && part !== safeFilterPart) match = false;
          
          if (match) {
             totalQty += Number(comboData.defectQty || 0);
             if (comboData.defects) Object.entries(comboData.defects).forEach(([k, v]) => {
                const fixK = k.replace(/_/g, '/'); // restore some readability
                defectMap[fixK] = (defectMap[fixK]||0) + Number(v);
                detailedSum += Number(v);
             });
          }
        });
      }
    });
    const unclassified = totalQty - detailedSum;
    if (unclassified > 0) defectMap['[공통] 기타'] = (defectMap['[공통] 기타']||0) + unclassified;
    const list = Object.entries(defectMap).map(([name,qty]) => ({name,qty})).sort((a,b)=>b.qty-a.qty).slice(0,15);
    const maxQty = list[0]?.qty || 1;
    return { list, total: totalQty, maxQty };
  }, [data.dailyStats, defectPeriod, filterMfg, filterCar, filterPart, filterProc]);

  // ── 설비/금형 수리 ───────────────────────────────────────
  const equipRepairs = // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => {
    const repairs = [];
    (data.equipments||[]).forEach(eq => (eq.history||[]).forEach(h => {
      if (h.attachment?.includes('수리의뢰')) repairs.push({...h, equipName:eq.name, equipId:eq.id});
    }));
    return repairs.sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,6);
  }, [data.equipments]);

  const moldRepairs = // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => {
    const repairs = [];
    (data.molds||[]).forEach(m => (m.history||[]).forEach(h => {
      if (h.attachment?.includes('수리의뢰')) repairs.push({...h, moldName:m.name||m.code, moldId:m.id});
    }));
    return repairs.sort((a,b)=>(b.date||'').localeCompare(a.date||'')).slice(0,6);
  }, [data.molds]);

  const topMolds = useMemo(() =>
    [...(data.molds||[])].sort((a,b)=>Number(b.currentStrokes||0)-Number(a.currentStrokes||0)).slice(0,6)
  , [data.molds]);

  const recentCPs = useMemo(() =>
    [...(data.changePoints||[])].sort((a,b)=>(b.occurrenceDate||'').localeCompare(a.occurrenceDate||'')).slice(0,6)
  , [data.changePoints]);

  // ── 스타일 상수 ─────────────────────────────────────────
  const tabBtn = (active) => ({
    padding: '8px 20px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
    borderRadius: '6px', transition: 'all .15s',
    background: active ? '#3b82f6' : 'transparent',
    color: active ? '#fff' : '#64748b',
  });
  const periodBtn = (active) => ({
    padding: '5px 14px', fontSize: '12px', fontWeight: 600, border: '1px solid', cursor: 'pointer',
    borderRadius: '20px', transition: 'all .15s',
    background: active ? '#0f172a' : 'transparent',
    borderColor: active ? '#0f172a' : '#cbd5e1',
    color: active ? '#fff' : '#64748b',
  });
  const segBtn = (active) => ({
    padding: '6px 16px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
    borderRadius: '4px', transition: 'all .12s',
    background: active ? '#fff' : 'transparent',
    color: active ? '#0f172a' : '#64748b',
    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
  });

  const lastRefStr = lastRefreshed
    ? lastRefreshed.toLocaleTimeString('ko-KR', { hour:'2-digit', minute:'2-digit' })
    : '—';

  return (
    <div style={{ padding: '20px 24px', maxWidth: '1600px', margin: '0 auto' }}>

      {/* ── 헤더 ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
        <div>
          <h1 style={{ fontSize:'22px', fontWeight:800, color:'#0f172a', margin:0 }}>생산 통합 모니터링 대시보드</h1>
          <div style={{ fontSize:'12px', color:'#94a3b8', marginTop:'4px' }}>기준일: {targetDateLabel} &nbsp;|&nbsp; 마지막 갱신: {lastRefStr}</div>
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          style={{ display:'flex', alignItems:'center', gap:'8px', padding:'9px 18px', borderRadius:'8px', border:'1.5px solid #3b82f6',
            background: isRefreshing ? '#eff6ff' : '#fff', color:'#3b82f6', fontWeight:700, fontSize:'13px', cursor: isRefreshing ? 'default' : 'pointer' }}
        >
          <span style={{ display:'inline-block', animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }}>🔄</span>
          {isRefreshing ? '갱신 중...' : '수동 새로고침'}
        </button>
      </div>

      {/* ── KPI 카드 4개 ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'22px' }}>

        {/* 목표 생산량 */}
        <div className="card" style={{ margin:0, padding:'18px 20px', borderLeft:'4px solid #3b82f6' }}>
          <div style={{ fontSize:'12px', color:'#64748b', fontWeight:600, marginBottom:'8px' }}>🎯 금일 목표 생산량</div>
          <div style={{ fontSize:'26px', fontWeight:800, color:'#1e293b' }}>{totalTarget.toLocaleString()} <span style={{fontSize:'12px',fontWeight:400}}>EA</span></div>
          {totalTarget > 0 && (
            <div style={{ marginTop:'10px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', color:'#94a3b8', marginBottom:'4px' }}>
                <span>실적 {totalActual.toLocaleString()}</span><span>{attainPct}%</span>
              </div>
              <div style={{ height:'5px', background:'#e2e8f0', borderRadius:'3px', overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${Math.min(attainPct,100)}%`, background: attainPct>=100?'#10b981':'#3b82f6', borderRadius:'3px', transition:'width .4s' }} />
              </div>
            </div>
          )}
        </div>

        {/* 실제 생산량 */}
        <div className="card" style={{ margin:0, padding:'18px 20px', borderLeft:'4px solid #10b981', display:'flex', alignItems:'center', gap:'16px' }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'12px', color:'#64748b', fontWeight:600, marginBottom:'8px' }}>✅ 금일 실제 생산량</div>
            <div style={{ fontSize:'26px', fontWeight:800, color:'#1e293b' }}>{totalActual.toLocaleString()} <span style={{fontSize:'12px',fontWeight:400}}>EA</span></div>
          </div>
          <CircleGauge pct={attainPct} size={60} color={attainPct>=100?'#10b981':attainPct>=80?'#3b82f6':'#f59e0b'}>
            {attainPct}%
          </CircleGauge>
        </div>

        {/* 달성률 */}
        <div className="card" style={{ margin:0, padding:'18px 20px', borderLeft:'4px solid #8b5cf6', display:'flex', alignItems:'center', gap:'16px' }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:'12px', color:'#64748b', fontWeight:600, marginBottom:'8px' }}>📈 금일 달성률</div>
            <div style={{ fontSize:'26px', fontWeight:800, color:'#1e293b' }}>{attainPct} <span style={{fontSize:'12px',fontWeight:400}}>%</span></div>
            <div style={{ fontSize:'11px', color: attainPct>=100?'#15803d':attainPct>=80?'#3b82f6':'#d97706', fontWeight:600, marginTop:'4px' }}>
              {attainPct >= 100 ? '✅ 목표 달성' : attainPct >= 80 ? '⚡ 순조 진행' : '⚠️ 목표 미달'}
            </div>
          </div>
        </div>

        {/* 불량률 */}
        <div className="card" style={{ margin:0, padding:'18px 20px', borderLeft:`4px solid ${defectBadge[1]}`, background: defectBadge[2] }}>
          <div style={{ fontSize:'12px', color:'#64748b', fontWeight:600, marginBottom:'8px' }}>⚠️ 금일 불량률</div>
          <div style={{ display:'flex', alignItems:'baseline', gap:'8px' }}>
            <div style={{ fontSize:'26px', fontWeight:800, color:'#1e293b' }}>{defectRate} <span style={{fontSize:'12px',fontWeight:400}}>%</span></div>
            <span style={{ fontSize:'11px', fontWeight:700, padding:'2px 8px', borderRadius:'12px', background:'#fff', color:defectBadge[1] }}>
              {defectBadge[0]} {defectStatus==='danger'?'위험':defectStatus==='warn'?'주의':'양호'}
            </span>
          </div>
          <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'6px' }}>불량 {totalDefect.toLocaleString()}개 / 일보 {totalReports}건</div>
        </div>

      </div>

      {/* ── 차트 / 불량유형 탭 ── */}
      <div className="card" style={{ padding:'20px', marginBottom:'22px' }}>
        
        {/* 다중 필터 행 */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', background: '#f8fafc', padding: '14px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '16px' }}>🎯</span> 분석 대상 필터
          </span>
          <div style={{ width: '1px', height: '20px', background: '#cbd5e1', margin: '0 4px' }} />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>제조사</label>
            <select value={filterMfg} onChange={e => setFilterMfg(e.target.value)} style={{ padding: '6px 28px 6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff', color: '#0f172a', outline: 'none', appearance: 'auto' }}>
              <option value="ALL">전체</option>
              {mfgOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>차량(차종)</label>
            <select value={filterCar} onChange={e => setFilterCar(e.target.value)} style={{ padding: '6px 28px 6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff', color: '#0f172a', outline: 'none', appearance: 'auto' }}>
              <option value="ALL">전체</option>
              {carOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>세부부품</label>
            <select value={filterPart} onChange={e => setFilterPart(e.target.value)} style={{ padding: '6px 28px 6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff', color: '#0f172a', outline: 'none', appearance: 'auto' }}>
              <option value="ALL">전체</option>
              {partOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>생산공정</label>
            <select value={filterProc} onChange={e => setFilterProc(e.target.value)} style={{ padding: '6px 28px 6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff', color: '#0f172a', outline: 'none', appearance: 'auto' }}>
              <option value="ALL">전체</option>
              {procOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* 탭 헤더 */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px', borderBottom:'1px solid #f1f5f9', paddingBottom:'12px' }}>
          <div style={{ display:'flex', gap:'6px', background:'#f8fafc', borderRadius:'8px', padding:'3px' }}>
            <button style={tabBtn(activeTab==='chart')} onClick={() => setActiveTab('chart')}>📊 생산 추이 차트</button>
            <button style={tabBtn(activeTab==='defects')} onClick={() => setActiveTab('defects')}>🔍 불량 유형 분석</button>
          </div>
          {/* 차트 기간 / 불량 기간 컨트롤 */}
          {activeTab === 'chart' && (
            <div style={{ display:'flex', background:'#f1f5f9', borderRadius:'6px', padding:'2px' }}>
              <button style={segBtn(chartPeriod==='daily')}  onClick={() => setChartPeriod('daily')}>최근 1달(일별)</button>
              <button style={segBtn(chartPeriod==='monthly')} onClick={() => setChartPeriod('monthly')}>최근 1년(월별)</button>
            </div>
          )}
          {activeTab === 'defects' && (
            <div style={{ display:'flex', gap:'6px' }}>
              {[['week','이번 주'],['month','이번 달'],['all','전체(1개월)']].map(([val,label]) => (
                <button key={val} style={periodBtn(defectPeriod===val)} onClick={() => setDefectPeriod(val)}>{label}</button>
              ))}
            </div>
          )}
        </div>

        {/* 차트 탭 */}
        {activeTab === 'chart' && (
          <div style={{ height:'340px' }}>
            <Bar data={chartDataObj} options={{
              responsive:true, maintainAspectRatio:false,
              interaction:{ mode:'index', intersect:false },
              scales:{
                x:{ 
                    grid:{ display:false }, 
                    ticks:{ 
                      maxRotation: 0,
                      minRotation: 0,
                      autoSkip: false,
                      font: { size: 10 },
                      color: function(context) {
                        if (chartPeriod === 'daily' && context.tick && typeof context.tick.value === 'number') {
                          const label = chartDataObj.labels[context.tick.value];
                          if (label) {
                            const d = new Date(label);
                            if (!isNaN(d.getTime()) && d.getDay() === 0) {
                              return '#ef4444'; // Red for Sunday
                            }
                          }
                        }
                        return '#64748b'; // Default text color
                      },
                      callback: function(val, index) {
                        const label = chartDataObj.labels[val];
                        if (chartPeriod !== 'daily' || !label) return label;
                        const d = new Date(label);
                        if (isNaN(d.getTime())) return label;
                        const days = ['일','월','화','수','목','금','토'];
                        const dayStr = `${d.getDate()}일`;
                        const dowStr = `(${days[d.getDay()]})`;
                        return index === 0 ? [`${d.getFullYear()}년 ${d.getMonth()+1}월 ${dayStr}`, dowStr] : [dayStr, dowStr];
                      }
                    } 
                  },
                y:{ type:'linear', position:'left', title:{ display:true, text:'수량 (EA)', font:{size:12} }, grid:{ color:'#f1f5f9' } },
                y1:{ type:'linear', position:'right', title:{ display:true, text:'불량률 (%)', font:{size:12} }, grid:{ drawOnChartArea:false }, min:0 },
              },
              plugins:{
                legend:{ position:'top', labels:{ font:{size:13}, boxWidth:12 } },
                tooltip:{ 
                  backgroundColor:'rgba(15,23,42,0.9)', titleFont:{size:13}, bodyFont:{size:12}, padding:12,
                  callbacks: {
                    title: function(context) {
                      const label = context[0].label;
                      if (chartPeriod !== 'daily' || !label) return label;
                      const d = new Date(label);
                      if (isNaN(d.getTime())) return label;
                      const days = ['일','월','화','수','목','금','토'];
                      return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일(${days[d.getDay()]})`;
                    }
                  }
                }
              }
            }} plugins={[{
              id: 'defectRateLabels',
              afterDatasetsDraw(chart) {
                const ds = chart.data.datasets[0]; // 불량률(%) 라인 = index 0
                if (!ds) return;
                const meta = chart.getDatasetMeta(0);
                const ctx2 = chart.ctx;
                ctx2.save();
                ctx2.font = 'bold 13px sans-serif';
                ctx2.fillStyle = '#ef4444';
                ctx2.textAlign = 'center';
                ctx2.textBaseline = 'bottom';
                meta.data.forEach((pt, i) => {
                  const val = ds.data[i];
                  if (val === null || val === undefined || val === '') return;
                  ctx2.fillText(`${val}%`, pt.x, pt.y - 10);
                });
                ctx2.restore();
              }
            }]} />

          </div>
        )}

        {/* 불량 유형 탭 */}
        {activeTab === 'defects' && (
          <div>
            {defectBreakdown.list.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:'#94a3b8', fontSize:'14px' }}>선택 기간에 불량 내역이 없습니다.</div>
            ) : (
              <>
                <div style={{ fontSize:'13px', color:'#94a3b8', marginBottom:'14px' }}>
                  총 불량 <strong style={{color:'#ef4444'}}>{defectBreakdown.total.toLocaleString()}</strong>건 (상위 {defectBreakdown.list.length}개 유형)
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                  {defectBreakdown.list.map((dt, i) => {
                    const barPct = Math.round((dt.qty / defectBreakdown.maxQty) * 100);
                    const totalPct = defectBreakdown.total > 0 ? ((dt.qty / defectBreakdown.total) * 100).toFixed(1) : 0;
                    return (
                      <div key={i} style={{ display:'grid', gridTemplateColumns:'28px 1fr 90px 70px', alignItems:'center', gap:'10px' }}>
                        <span style={{ width:'24px', height:'24px', borderRadius:'50%', background:'#fef2f2', color:'#ef4444', fontSize:'11px', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>{i+1}</span>
                        <div>
                          <div style={{ fontSize:'13px', fontWeight:600, color:'#334155', marginBottom:'4px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{dt.name}</div>
                          <div style={{ height:'7px', background:'#f1f5f9', borderRadius:'4px', overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${barPct}%`, background: i===0?'#ef4444':i<3?'#f97316':'#fbbf24', borderRadius:'4px' }} />
                          </div>
                        </div>
                        <div style={{ fontSize:'13px', fontWeight:800, color:'#1e293b', textAlign:'right' }}>{dt.qty.toLocaleString()} 건</div>
                        <div style={{ fontSize:'12px', color:'#94a3b8', textAlign:'right' }}>{totalPct}%</div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── 하단 4개 카드 ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'18px' }}>

        {/* 설비 수리 의뢰 */}
        <div className="card" style={{ margin:0 }}>
          <div className="card-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 className="card-title" style={{ margin:0, fontSize:'15px' }}>🔧 최근 설비 수리 의뢰</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/equipments')}>더보기</button>
          </div>
          <div style={{ padding:'12px 16px' }}>
            {equipRepairs.length === 0
              ? <div style={{textAlign:'center',color:'#94a3b8',padding:'20px 0',fontSize:'13px'}}>수리 의뢰 내역이 없습니다.</div>
              : equipRepairs.map((r,i) => {
                const days = daysAgo(r.date);
                const isOld = !r.confirmed && days > 7;
                return (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom: i<equipRepairs.length-1?'1px solid #f1f5f9':'none' }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:'13px', color: isOld?'#b91c1c':'#1e293b' }}>{r.equipName}</div>
                      <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'260px' }}>{r.date} | {r.issue}</div>
                    </div>
                    <div style={{ display:'flex', gap:'6px', alignItems:'center', flexShrink:0 }}>
                      {days !== null && <span style={{ fontSize:'11px', fontWeight:700, color: isOld?'#b91c1c':'#94a3b8' }}>D+{days}</span>}
                      <span style={{ fontSize:'11px', padding:'3px 9px', borderRadius:'12px', fontWeight:600, background: r.confirmed?'#ecfdf5':'#fef2f2', color: r.confirmed?'#047857':'#b91c1c' }}>
                        {r.confirmed ? '완료' : '진행중'}
                      </span>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>

        {/* 금형 수리 의뢰 */}
        <div className="card" style={{ margin:0 }}>
          <div className="card-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 className="card-title" style={{ margin:0, fontSize:'15px' }}>🛠️ 최근 금형 수리 의뢰</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/molds')}>더보기</button>
          </div>
          <div style={{ padding:'12px 16px' }}>
            {moldRepairs.length === 0
              ? <div style={{textAlign:'center',color:'#94a3b8',padding:'20px 0',fontSize:'13px'}}>수리 의뢰 내역이 없습니다.</div>
              : moldRepairs.map((r,i) => {
                const days = daysAgo(r.date);
                const isOld = !r.confirmed && days > 7;
                return (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom: i<moldRepairs.length-1?'1px solid #f1f5f9':'none' }}>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:'13px', color: isOld?'#b91c1c':'#1e293b' }}>{r.moldName}</div>
                      <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'260px' }}>{r.date} | {r.issue}</div>
                    </div>
                    <div style={{ display:'flex', gap:'6px', alignItems:'center', flexShrink:0 }}>
                      {days !== null && <span style={{ fontSize:'11px', fontWeight:700, color: isOld?'#b91c1c':'#94a3b8' }}>D+{days}</span>}
                      <span style={{ fontSize:'11px', padding:'3px 9px', borderRadius:'12px', fontWeight:600, background: r.confirmed?'#ecfdf5':'#fef2f2', color: r.confirmed?'#047857':'#b91c1c' }}>
                        {r.confirmed ? '완료' : '진행중'}
                      </span>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>

        {/* 최근 변동점 */}
        <div className="card" style={{ margin:0 }}>
          <div className="card-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 className="card-title" style={{ margin:0, fontSize:'15px' }}>📋 최근 변동점 내역</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/change-points')}>더보기</button>
          </div>
          <div style={{ padding:'12px 16px' }}>
            {recentCPs.length === 0
              ? <div style={{textAlign:'center',color:'#94a3b8',padding:'20px 0',fontSize:'13px'}}>변동점 내역이 없습니다.</div>
              : recentCPs.map((cp,i) => {
                const cpColor = CP_TYPE_COLORS[cp.changeType] || {bg:'#f8fafc',color:'#475569'};
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 0', borderBottom: i<recentCPs.length-1?'1px solid #f1f5f9':'none' }}>
                    <span style={{ fontSize:'11px', padding:'3px 9px', borderRadius:'12px', fontWeight:700, background:cpColor.bg, color:cpColor.color, flexShrink:0 }}>{cp.changeType||'기타'}</span>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:'13px', color:'#1e293b' }}>{cp.carModel}</div>
                      <div style={{ fontSize:'11px', color:'#94a3b8', marginTop:'2px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'260px' }}>{cp.occurrenceDate} | {cp.details}</div>
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>

        {/* 금형 누적 타수 */}
        <div className="card" style={{ margin:0 }}>
          <div className="card-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 className="card-title" style={{ margin:0, fontSize:'15px' }}>⚙️ 금형 누적타수 TOP 6</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/molds')}>더보기</button>
          </div>
          <div style={{ padding:'12px 16px' }}>
            {topMolds.length === 0
              ? <div style={{textAlign:'center',color:'#94a3b8',padding:'20px 0',fontSize:'13px'}}>등록된 금형이 없습니다.</div>
              : topMolds.map((m,i) => {
                const cur = Number(m.currentStrokes||0);
                const max = Number(m.maxStrokes||1);
                const pct = Math.min(100, Math.round((cur/max)*100));
                const [barColor, levelLabel, levelColor] =
                  pct >= 90 ? ['#ef4444','위험','#b91c1c'] :
                  pct >= 70 ? ['#f59e0b','주의','#d97706'] :
                              ['#3b82f6','정상','#1d4ed8'];
                return (
                  <div key={i} style={{ padding:'10px 0', borderBottom: i<topMolds.length-1?'1px solid #f1f5f9':'none' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'6px' }}>
                      <span style={{ fontWeight:600, fontSize:'13px', color:'#1e293b' }}>{m.name||m.code}</span>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                        <span style={{ fontSize:'11px', fontWeight:700, padding:'2px 8px', borderRadius:'12px', background: pct>=90?'#fef2f2':pct>=70?'#fefce8':'#eff6ff', color: levelColor }}>{levelLabel} {pct}%</span>
                        <span style={{ fontSize:'11px', color:'#94a3b8' }}>{cur.toLocaleString()} / {max.toLocaleString()}</span>
                      </div>
                    </div>
                    <div style={{ height:'6px', background:'#f1f5f9', borderRadius:'4px', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:barColor, borderRadius:'4px', transition:'width .4s' }} />
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>

      </div>
    </div>
  );
}
