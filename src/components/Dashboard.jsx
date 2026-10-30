import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
      try {
        // forceRefresh=true 이면 캐시 무효화 후 재조회
        if (forceRefresh) {
          const { invalidateMoldsCache, invalidateEquipmentsCache } = await import('../services/firestore');
          invalidateMoldsCache();
          invalidateEquipmentsCache();
        }
        const [statsData, equipmentsData, moldsData, cpData] = await Promise.all([
          fetchDailyStats(null),
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
  const [chartPeriod, setChartPeriod] = useState('daily');
  const [activeTab, setActiveTab] = useState('chart');      // 'chart' | 'defects'
  const [defectPeriod, setDefectPeriod] = useState('month'); // 'week' | 'month' | 'all'
  const [selectedChartYear, setSelectedChartYear] = useState('DEFAULT');
  const [selectedChartMonth, setSelectedChartMonth] = useState('DEFAULT');

  // 필터 상태
  const [filterMfg, setFilterMfg] = useState('ALL');
  const [filterCar, setFilterCar] = useState('ALL');
  const [filterPart, setFilterPart] = useState('ALL');
  const [filterProc, setFilterProc] = useState('ALL');
  const [chartGeom, setChartGeom] = useState({ left: 170, rightGap: 60 });
  const chartRef = useRef(null);

  // 필터 옵션
  const mfgOptions = useMemo(() => MANUFACTURERS.map(m => m.name), []);
  const carOptions = // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => {
    if (filterMfg === 'ALL') return MANUFACTURERS.flatMap(m => m.models).map(m => m.code);
    const mfg = MANUFACTURERS.find(m => m.name === filterMfg);
    return mfg ? mfg.models.map(m => m.code) : [];
  }, [filterMfg]);
  const procOptions = ['클립머신', '소재준비', '조인트', '검사포장', '후가공'];
  // 세부 공정명(소재준비(A)/(C)/(D), 조인트 V부 등)도 기본 공정 필터에 포함되도록 기준 공정명으로 비교
  const baseProc = (p) => String(p || '').replace(/-.+$/, '').replace(/\(.*\)$/, '').replace(/\s*V부$/, '').trim();
  const procMatches = (proc, filter) => proc === filter || baseProc(proc) === filter;
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
  const defectStatus = (totalActual === 0 && totalDefect > 0) ? 'danger' : defectRate === 0 ? 'safe' : defectRate <= 1 ? 'good' : defectRate <= 3 ? 'warn' : 'danger';
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
    
    // Determine effective mode
    let effectiveMode = chartPeriod; // 'daily' or 'monthly'
    if (selectedChartYear !== 'DEFAULT') {
      if (selectedChartMonth !== 'DEFAULT') {
        effectiveMode = 'daily';
      } else {
        effectiveMode = 'monthly';
      }
    }

    sorted.forEach(r => {
      if (!r.date) return;
      const key = effectiveMode === 'daily' ? (r.date || '').substring(0,10) : (r.date || '').substring(0, 7);
      if (!groups[key]) groups[key] = { actual: 0, defect: 0 };
      
      if (filterMfg === 'ALL' && filterCar === 'ALL' && filterPart === 'ALL' && filterProc === 'ALL') {
        groups[key].actual += Number(r.totalActualQty||0);
        groups[key].defect += Number(r.totalDefectQty||0);
      } else if (r.items) {
        Object.entries(r.items).forEach(([comboKey, comboData]) => {
          const [car, part, proc] = comboKey.split('::');
          let match = true;
          if (filterProc !== 'ALL' && !procMatches(proc, filterProc)) match = false;
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
    
    if (selectedChartYear === 'DEFAULT') {
      if (effectiveMode === 'daily' && labels.length > 0) {
        // 가장 최근 데이터가 속한 달의 1일부터 표시
        const lastDate = new Date(labels[labels.length - 1]);
        const monthStart = `${lastDate.getFullYear()}-${String(lastDate.getMonth()+1).padStart(2,'0')}-01`;
        labels = labels.filter(l => l >= monthStart);
      }
      if (effectiveMode === 'monthly' && labels.length > 0) {
        // 가장 최근 데이터가 속한 해의 1월부터 표시
        const lastYear = labels[labels.length - 1].substring(0, 4);
        labels = labels.filter(l => l >= `${lastYear}-01`);
      }
    } else {
      if (selectedChartMonth === 'DEFAULT') {
        labels = labels.filter(l => l.startsWith(selectedChartYear));
      } else {
        const prefix = `${selectedChartYear}-${selectedChartMonth}`;
        labels = labels.filter(l => l.startsWith(prefix));
      }
    }
    
    labels.sort();

    return {
      labels,
      effectiveMode,
      actuals: labels.map(l => groups[l].actual),
      defects: labels.map(l => groups[l].defect),
      datasets: [
        { type:'line', label:'불량률 (%)', data: labels.map(l => groups[l].actual>0 ? ((groups[l].defect/groups[l].actual)*100).toFixed(2) : 0),
          borderColor:'#ef4444', backgroundColor:'#ef4444', borderWidth:2, yAxisID:'y1', tension:0.3, pointRadius:4 },
        { type:'bar', label:'생산수량 (EA)', data: labels.map(l => groups[l].actual),
          backgroundColor:'rgba(59,130,246,0.75)', borderRadius:5, yAxisID:'y' },
      ]
    };
  }, [data.dailyStats, chartPeriod, filterMfg, filterCar, filterPart, filterProc, selectedChartYear, selectedChartMonth]);

  // ── 차트 하단: 불량 유형별 일자별 수량 표 ────────────────────
  const chartDefectTable = // eslint-disable-next-line react-hooks/exhaustive-deps
  useMemo(() => {
    const labels = chartDataObj.labels;
    const labelSet = new Set(labels);
    const byDefect = {}; // name -> { label -> qty }
    const addQty = (rawName, label, qty) => {
      if (!qty) return;
      const name = String(rawName).replace(/스카치/g, '스코치').replace('[공통] 기타 (상세 미지정)', '[공통] 기타');
      if (!byDefect[name]) byDefect[name] = {};
      byDefect[name][label] = (byDefect[name][label] || 0) + qty;
    };
    const noFilter = filterMfg === 'ALL' && filterCar === 'ALL' && filterPart === 'ALL' && filterProc === 'ALL';

    (data.dailyStats || []).forEach(r => {
      if (!r.date) return;
      const key = chartDataObj.effectiveMode === 'daily' ? (r.date || '').substring(0, 10) : (r.date || '').substring(0, 7);
      if (!labelSet.has(key)) return;

      if (noFilter) {
        let detailed = 0;
        if (r.defectBreakdowns) Object.entries(r.defectBreakdowns).forEach(([k, v]) => {
          addQty(k, key, Number(v)); detailed += Number(v);
        });
        addQty('[공통] 기타', key, Math.max(0, Number(r.totalDefectQty || 0) - detailed));
      } else if (r.items) {
        let total = 0, detailed = 0;
        Object.entries(r.items).forEach(([comboKey, comboData]) => {
          const [car, part, proc] = comboKey.split('::');
          let match = true;
          if (filterProc !== 'ALL' && !procMatches(proc, filterProc)) match = false;
          if (safeFilterCar !== 'ALL' && car !== safeFilterCar) match = false;
          if (match && filterMfg !== 'ALL' && safeFilterCar === 'ALL') {
            const mfg = MANUFACTURERS.find(m => m.name === filterMfg);
            if (!mfg || !mfg.models.some(m => m.code.replace(/[./[\]]/g, '_') === car)) match = false;
          }
          if (match && safeFilterPart !== 'ALL' && part !== safeFilterPart) match = false;
          if (!match) return;
          total += Number(comboData.defectQty || 0);
          if (comboData.defects) Object.entries(comboData.defects).forEach(([k, v]) => {
            addQty(k.replace(/_/g, '/'), key, Number(v)); detailed += Number(v);
          });
        });
        addQty('[공통] 기타', key, Math.max(0, total - detailed));
      }
    });

    const rows = Object.entries(byDefect)
      .map(([name, perLabel]) => ({ name, perLabel, total: Object.values(perLabel).reduce((a, b) => a + b, 0) }))
      .filter(r => r.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
    const grandTotal = rows.reduce((a, r) => a + r.total, 0);
    return { rows, grandTotal };
  }, [chartDataObj, data.dailyStats, filterMfg, filterCar, filterPart, filterProc]);

  // 차트 표시 기간 전체 합계 (생산/불량/불량률)
  const chartTotals = useMemo(() => {
    const actual = (chartDataObj.actuals || []).reduce((a, b) => a + b, 0);
    const defect = (chartDataObj.defects || []).reduce((a, b) => a + b, 0);
    return { actual, defect, rate: actual > 0 ? ((defect / actual) * 100).toFixed(2) : '0.00' };
  }, [chartDataObj]);


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
          const cleanK = k.replace(/스카치/g, '스코치').replace('[공통] 기타 (상세 미지정)', '[공통] 기타'); defectMap[cleanK] = (defectMap[cleanK]||0) + Number(v);
          detailedSum += Number(v);
        });
      } else if (r.items) {
        Object.entries(r.items).forEach(([comboKey, comboData]) => {
          const [car, part, proc] = comboKey.split('::');
          let match = true;
          if (filterProc !== 'ALL' && !procMatches(proc, filterProc)) match = false;
          if (safeFilterCar !== 'ALL' && car !== safeFilterCar) match = false;
          if (match && filterMfg !== 'ALL' && safeFilterCar === 'ALL') {
             const mfg = MANUFACTURERS.find(m => m.name === filterMfg);
             if (!mfg || !mfg.models.some(m => m.code.replace(/[\.\/\[\]]/g, '_') === car)) match = false;
          }
          if (match && safeFilterPart !== 'ALL' && part !== safeFilterPart) match = false;
          
          if (match) {
             totalQty += Number(comboData.defectQty || 0);
             if (comboData.defects) Object.entries(comboData.defects).forEach(([k, v]) => {
                const fixK = k.replace(/_/g, '/').replace(/스카치/g, '스코치').replace('[공통] 기타 (상세 미지정)', '[공통] 기타'); // restore some readability
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

  // ── 엑셀 다운로드 핸들러 (웹 UI 고밀도 복제형) ───────────────
  const handleExportExcel = async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const { saveAs } = await import('file-saver');

      const wb = new ExcelJS.Workbook();
      wb.creator = 'JYMES';
      wb.created = new Date();

      const ws = wb.addWorksheet('생산추이_불량분석', {
        views: [{ showGridLines: true }]
      });

      // ── 스타일 팔레트 (웹 UI 색상 테마 동기화) ──
      const titleFont = { name: '맑은 고딕', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
      const subTitleFont = { name: '맑은 고딕', size: 11, bold: true, color: { argb: 'FF0F172A' } };
      const headerFont = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FF334155' } };
      const sunHeaderFont = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FFEF4444' } };
      const regularFont = { name: '맑은 고딕', size: 10, color: { argb: 'FF334155' } };
      const boldFont = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FF0F172A' } };
      const blueFont = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FF1D4ED8' } };
      const redFont = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FFDC2626' } };
      const dimFont = { name: '맑은 고딕', size: 10, color: { argb: 'FF94A3B8' } };

      const navyFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
      const lightSlateFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
      const blueCardFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
      const redCardFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } };
      const orangeCardFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF7ED' } };

      const thinBorder = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };

      const labels = chartDataObj.labels || [];
      const periodLabel = selectedChartYear !== 'DEFAULT'
        ? (selectedChartMonth !== 'DEFAULT' ? `${selectedChartYear}년 ${selectedChartMonth}월 (일별)` : `${selectedChartYear}년 (월별)`)
        : (chartPeriod === 'daily' ? '최근 1달 (일별)' : '최근 1년 (월별)');

      // ── 1. 최상단 타이틀 배너 (웹 헤더 네이비 바 스타일) ──
      const titleRow = ws.addRow(['📊 JY MES 생산통합 모니터링 - 생산 추이 및 불량 분석 대시보드']);
      titleRow.height = 34;
      ws.mergeCells(1, 1, 1, Math.max(5, labels.length + 3));
      titleRow.getCell(1).font = titleFont;
      titleRow.getCell(1).fill = navyFill;
      titleRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

      // ── 2. 조회 필터 조건 배너 ──
      const filterText = `조회 조건:  제조사: [${filterMfg === 'ALL' ? '전체' : filterMfg}]  |  차종: [${filterCar === 'ALL' ? '전체' : filterCar}]  |  부품: [${filterPart === 'ALL' ? '전체' : filterPart}]  |  공정: [${filterProc === 'ALL' ? '전체' : filterProc}]  |  조회기간: [${periodLabel}]  |  다운로드: ${new Date().toLocaleString('ko-KR')}`;
      const filterRow = ws.addRow([filterText]);
      filterRow.height = 24;
      ws.mergeCells(2, 1, 2, Math.max(5, labels.length + 3));
      filterRow.getCell(1).font = { name: '맑은 고딕', size: 9.5, color: { argb: 'FF475569' } };
      filterRow.getCell(1).fill = lightSlateFill;
      filterRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
      filterRow.getCell(1).border = thinBorder;

      // ── 3. 주요 실적 요약 카드 (생산수량 / 불량수량 / 전체 불량률) ──
      ws.addRow([]);
      const kpiRow = ws.addRow([
        '총 생산수량 (EA)',
        Number(chartTotals.actual || 0),
        '총 불량수량 (EA)',
        Number(chartTotals.defect || 0),
        '전체 불량률 (%)',
        `${chartTotals.rate}%`
      ]);
      kpiRow.height = 26;
      kpiRow.getCell(1).font = headerFont;
      kpiRow.getCell(1).fill = blueCardFill;
      kpiRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      kpiRow.getCell(1).border = thinBorder;

      kpiRow.getCell(2).font = blueFont;
      kpiRow.getCell(2).numFmt = '#,##0';
      kpiRow.getCell(2).fill = blueCardFill;
      kpiRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
      kpiRow.getCell(2).border = thinBorder;

      kpiRow.getCell(3).font = headerFont;
      kpiRow.getCell(3).fill = redCardFill;
      kpiRow.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
      kpiRow.getCell(3).border = thinBorder;

      kpiRow.getCell(4).font = redFont;
      kpiRow.getCell(4).numFmt = '#,##0';
      kpiRow.getCell(4).fill = redCardFill;
      kpiRow.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
      kpiRow.getCell(4).border = thinBorder;

      kpiRow.getCell(5).font = headerFont;
      kpiRow.getCell(5).fill = redCardFill;
      kpiRow.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
      kpiRow.getCell(5).border = thinBorder;

      kpiRow.getCell(6).font = { name: '맑은 고딕', size: 11, bold: true, color: { argb: 'FFDC2626' } };
      kpiRow.getCell(6).fill = redCardFill;
      kpiRow.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
      kpiRow.getCell(6).border = thinBorder;

      ws.addRow([]);

      // ── 4. 생산 및 불량 실적 추이 타이틀 + 웹 차트 그래픽 이미지 (셀 날짜 열과 1:1 정렬) ──
      const s1HeaderRow = ws.addRow(['■ 생산 및 불량 실적 추이']);
      s1HeaderRow.height = 22;
      s1HeaderRow.getCell(1).font = subTitleFont;
      let hasChartImage = false;
      try {
        const nCols = Math.max(1, labels.length);
        const exportDpr = 3; // 3배수 고해상도(Retina/300DPI급) 렌더링
        const targetColLogicalPx = 100; // 엑셀 날짜 열(width=12) 100% 배율 픽셀 폭과 1:1 매칭
        const targetLeftLogicalPx = Math.round(targetColLogicalPx * 2.08); // B열(width=26)
        const targetRightLogicalPx = Math.round(targetColLogicalPx * 1.24); // 합계열(width=15)
        const renderLogicalW = targetLeftLogicalPx + (nCols * targetColLogicalPx) + targetRightLogicalPx;
        const renderLogicalH = 420; // 엑셀 16행(20pt * 16 = 320pt ≈ 426px) 높이와 종횡비 1:1 매칭

        const renderCanvas = document.createElement('canvas');
        renderCanvas.width = renderLogicalW;
        renderCanvas.height = renderLogicalH;

        let exportChart = null;
        try {
          exportChart = new ChartJS(renderCanvas, {
            type: 'bar',
            data: {
              labels: [...labels],
              datasets: (chartDataObj.datasets || []).map(ds => ({ ...ds, data: [...(ds.data || [])] }))
            },
            options: {
              responsive: false,
              maintainAspectRatio: false,
              animation: false,
              devicePixelRatio: exportDpr,
              layout: { padding: { left: 130, top: 16, right: 70, bottom: 4 } },
              scales: {
                x: {
                  grid: { display: false },
                  ticks: {
                    maxRotation: 0,
                    minRotation: 0,
                    autoSkip: false,
                    font: { size: 11 },
                    color: function(context) {
                      if (chartDataObj.effectiveMode === 'daily' && context.tick && typeof context.tick.value === 'number') {
                        const label = labels[context.tick.value];
                        if (label) {
                          const d = new Date(label);
                          if (!isNaN(d.getTime()) && d.getDay() === 0) return '#ef4444';
                        }
                      }
                      return '#64748b';
                    },
                    callback: function(val, index) {
                      const label = labels[val];
                      if (chartDataObj.effectiveMode !== 'daily' || !label) return label;
                      const d = new Date(label);
                      if (isNaN(d.getTime())) return label;
                      const dayNames = ['일','월','화','수','목','금','토'];
                      const dayStr = `${d.getDate()}일`;
                      const dowStr = `(${dayNames[d.getDay()]})`;
                      return index === 0 ? [`${d.getFullYear()}년 ${d.getMonth()+1}월 ${dayStr}`, dowStr] : [dayStr, dowStr];
                    }
                  }
                },
                y: { type: 'linear', position: 'left', title: { display: true, text: '수량 (EA)', font: { size: 12 } }, grid: { color: '#f1f5f9' } },
                y1: { type: 'linear', position: 'right', title: { display: true, text: '불량률 (%)', font: { size: 12 } }, grid: { drawOnChartArea: false }, min: 0, grace: '20%' }
              },
              plugins: {
                legend: { position: 'top', labels: { font: { size: 13 }, boxWidth: 12, padding: 16 } },
                tooltip: { enabled: false }
              }
            },
            plugins: [{
              id: 'defectRateLabels',
              afterDatasetsDraw(chart) {
                const ds = chart.data.datasets[0];
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
            }, {
              id: 'productionQtyLabels',
              afterDatasetsDraw(chart) {
                const ds = chart.data.datasets[1];
                if (!ds) return;
                const meta = chart.getDatasetMeta(1);
                const ctx2 = chart.ctx;
                ctx2.save();
                ctx2.font = 'bold 12px sans-serif';
                ctx2.fillStyle = '#1d4ed8';
                ctx2.textAlign = 'center';
                ctx2.textBaseline = 'bottom';
                const rateDs = chart.data.datasets[0];
                const rateMeta = chart.getDatasetMeta(0);
                meta.data.forEach((bar, i) => {
                  const val = Number(ds.data[i]);
                  if (!val) return;
                  let y = bar.y - 4;
                  const pt = rateMeta.data[i];
                  const rv = rateDs && rateDs.data[i];
                  if (pt && rv !== null && rv !== undefined && rv !== '') {
                    const rBottom = pt.y - 10;
                    const rTop = rBottom - 14;
                    const qTop = y - 13;
                    if (y > rTop - 2 && qTop < rBottom + 2) y = rTop - 4;
                  }
                  ctx2.fillText(val.toLocaleString(), bar.x, y);
                });
                ctx2.restore();
              }
            }]
          });
          exportChart.draw();

          const chartInst = exportChart;
          const canvas = renderCanvas;
          if (canvas && canvas.width > 0 && canvas.height > 0) {
            const offCanvas = document.createElement('canvas');
            const dpr = chartInst.width > 0 ? (canvas.width / chartInst.width) : exportDpr;
            const ca = chartInst.chartArea;
            const xScale = chartInst.scales?.x;
            let srcPlotLeft = ca ? ca.left * dpr : 170 * dpr;
            let srcPlotRight = ca ? ca.right * dpr : (canvas.width - 60 * dpr);
            if (xScale && nCols >= 2 && typeof xScale.getPixelForValue === 'function') {
              const firstCenter = xScale.getPixelForValue(0) * dpr;
              const lastCenter = xScale.getPixelForValue(nCols - 1) * dpr;
              const step = (lastCenter - firstCenter) / (nCols - 1);
              if (step > 0) {
                srcPlotLeft = firstCenter - step * 0.5;
                srcPlotRight = lastCenter + step * 0.5;
              }
            }
            const srcPlotWidth = Math.max(1, srcPlotRight - srcPlotLeft);
            const oneDateColPx = srcPlotWidth / nCols;
            const dstLeftWidth = Math.round(oneDateColPx * 2.08);
            const dstPlotWidth = Math.round(srcPlotWidth);
            const dstRightWidth = Math.round(oneDateColPx * 1.24);
            offCanvas.width = dstLeftWidth + dstPlotWidth + dstRightWidth;
            offCanvas.height = canvas.height;
            const ctx = offCanvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, offCanvas.width, offCanvas.height);
            const leftAxisNeed = Math.min(srcPlotLeft, 68 * dpr);
            const rightAxisNeed = Math.min(canvas.width - srcPlotRight, 44 * dpr);
            if (dstLeftWidth >= leftAxisNeed && dstRightWidth >= rightAxisNeed) {
              ctx.drawImage(canvas, Math.round(dstLeftWidth - srcPlotLeft), 0);
            } else {
              ctx.drawImage(canvas, srcPlotLeft, 0, srcPlotWidth, canvas.height, dstLeftWidth, 0, dstPlotWidth, canvas.height);
              const srcLeftX = Math.max(0, srcPlotLeft - leftAxisNeed);
              const srcLeftW = Math.max(1, srcPlotLeft - srcLeftX);
              const drawLeftW = Math.min(dstLeftWidth, srcLeftW);
              ctx.drawImage(canvas, srcLeftX, 0, srcLeftW, canvas.height, dstLeftWidth - drawLeftW, 0, drawLeftW, canvas.height);
              const srcRightW = Math.max(1, rightAxisNeed);
              const drawRightW = Math.min(dstRightWidth, srcRightW);
              ctx.drawImage(canvas, srcPlotRight, 0, srcRightW, canvas.height, dstLeftWidth + dstPlotWidth, 0, drawRightW, canvas.height);
            }
            const base64 = offCanvas.toDataURL('image/png').replace(/^data:image\/\w+;base64,/, '');
            const imageId = wb.addImage({
              base64,
              extension: 'png'
            });
            const chartStartNativeRow = ws.rowCount;
            for (let i = 0; i < 16; i++) {
              const r = ws.addRow([]);
              r.height = 20;
            }
            const chartEndNativeRow = ws.rowCount;
            ws.addImage(imageId, {
              tl: { nativeCol: 1, nativeColOff: 0, nativeRow: chartStartNativeRow, nativeRowOff: 0 },
              br: { nativeCol: 3 + nCols, nativeColOff: 0, nativeRow: chartEndNativeRow, nativeRowOff: 0 },
              editAs: 'twoCell'
            });
            hasChartImage = true;
          }
        } finally {
          if (exportChart) exportChart.destroy();
        }
      } catch (e) {
        console.warn('Chart capture skipped in excel export:', e);
      }
      // ── 날짜 헤더 생성 헬퍼 (일요일 빨간색 처리) ──
      const days = ['일','월','화','수','목','금','토'];
      const formattedHeaders = labels.map(l => {
        if (chartDataObj.effectiveMode === 'daily') {
          const d = new Date(l);
          if (!isNaN(d.getTime())) {
            return { text: `${d.getMonth()+1}/${d.getDate()}(${days[d.getDay()]})`, isSun: d.getDay() === 0 };
          }
        }
        return { text: l, isSun: false };
      });

      // ── 5. 생산 및 불량 실적 추이 테이블 (웹 차트 수치 동기화) ──



      const pHeaderCells = ['순위', '지표 구분', ...formattedHeaders.map(h => h.text), '합계 / 전체'];
      const pHeader = ws.addRow(pHeaderCells);
      pHeader.height = 24;
      pHeader.eachCell((cell, colNum) => {
        const isSun = colNum >= 3 && colNum < pHeaderCells.length && formattedHeaders[colNum - 3]?.isSun;
        cell.font = isSun ? sunHeaderFont : headerFont;
        cell.fill = headerFill;
        cell.border = thinBorder;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      // 행 1: 생산수량
      const actRowCells = ['-', '생산수량 (EA)', ...(chartDataObj.actuals || []), chartTotals.actual];
      const actRow = ws.addRow(actRowCells);
      actRow.height = 22;
      actRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      actRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
      actRow.getCell(2).font = boldFont;
      actRow.getCell(2).fill = lightSlateFill;
      for (let c = 3; c <= actRowCells.length; c++) {
        actRow.getCell(c).numFmt = '#,##0';
        actRow.getCell(c).font = blueFont;
        actRow.getCell(c).alignment = { horizontal: 'right', vertical: 'middle' };
      }
      actRow.getCell(actRowCells.length).fill = blueCardFill;
      actRow.eachCell(cell => { cell.border = thinBorder; });

      // 행 2: 불량수량
      const defRowCells = ['-', '불량수량 (EA)', ...(chartDataObj.defects || []), chartTotals.defect];
      const defRow = ws.addRow(defRowCells);
      defRow.height = 22;
      defRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      defRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
      defRow.getCell(2).font = boldFont;
      defRow.getCell(2).fill = lightSlateFill;
      for (let c = 3; c <= defRowCells.length; c++) {
        defRow.getCell(c).numFmt = '#,##0';
        defRow.getCell(c).font = redFont;
        defRow.getCell(c).alignment = { horizontal: 'right', vertical: 'middle' };
      }
      defRow.getCell(defRowCells.length).fill = redCardFill;
      defRow.eachCell(cell => { cell.border = thinBorder; });

      // 행 3: 불량률
      const rateRowCells = [
        '-',
        '불량률 (%)',
        ...labels.map((_, i) => {
          const a = chartDataObj.actuals?.[i] || 0;
          const d = chartDataObj.defects?.[i] || 0;
          return a > 0 ? `${((d / a) * 100).toFixed(2)}%` : '0.00%';
        }),
        `${chartTotals.rate}%`
      ];
      const rateRow = ws.addRow(rateRowCells);
      rateRow.height = 22;
      rateRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      rateRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };
      rateRow.getCell(2).font = boldFont;
      rateRow.getCell(2).fill = redCardFill;
      for (let c = 3; c <= rateRowCells.length; c++) {
        rateRow.getCell(c).font = redFont;
        rateRow.getCell(c).alignment = { horizontal: 'right', vertical: 'middle' };
      }
      rateRow.getCell(rateRowCells.length).fill = redCardFill;
      rateRow.eachCell(cell => { cell.border = thinBorder; });

      ws.addRow([]);

      // ── 6. 불량 유형별 일자별 발생 수량 테이블 (차트 하단 표와 100% 동일) ──
      const s2Title = `■ 불량 유형별 일자별 발생 수량 (총 불량 ${chartDefectTable.grandTotal.toLocaleString()}건, 상위 ${chartDefectTable.rows.length}개 유형)`;
      const s2TitleRow = ws.addRow([s2Title]);
      s2TitleRow.getCell(1).font = subTitleFont;

      const dHeaderCells = ['순위', '불량 유형', ...formattedHeaders.map(h => h.text), '유형별 합계'];
      const dHeader = ws.addRow(dHeaderCells);
      dHeader.height = 24;
      dHeader.eachCell((cell, colNum) => {
        const isSun = colNum >= 3 && colNum < dHeaderCells.length && formattedHeaders[colNum - 3]?.isSun;
        cell.font = isSun ? sunHeaderFont : headerFont;
        cell.fill = headerFill;
        cell.border = thinBorder;
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });

      chartDefectTable.rows.forEach((dt, rank) => {
        const rowCells = [
          rank + 1,
          dt.name,
          ...labels.map(l => dt.perLabel[l] || 0),
          dt.total
        ];
        const row = ws.addRow(rowCells);
        row.height = 22;

        // 순위 뱃지 (1위: 레드, 2~3위: 오렌지, 4위+: 슬레이트)
        const rankCell = row.getCell(1);
        rankCell.alignment = { horizontal: 'center', vertical: 'middle' };
        if (rank === 0) {
          rankCell.font = redFont;
          rankCell.fill = redCardFill;
        } else if (rank < 3) {
          rankCell.font = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FFEA580C' } };
          rankCell.fill = orangeCardFill;
        } else {
          rankCell.font = boldFont;
          rankCell.fill = lightSlateFill;
        }

        // 불량명
        row.getCell(2).font = boldFont;
        row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };

        // 날짜별 수량 (발생건은 빨간색 강조, 미발생은 '-' 회색)
        labels.forEach((_, i) => {
          const colIdx = i + 3;
          const val = rowCells[colIdx - 1];
          const c = row.getCell(colIdx);
          if (val > 0) {
            c.value = val;
            c.numFmt = '#,##0';
            c.font = redFont;
            c.alignment = { horizontal: 'center', vertical: 'middle' };
          } else {
            c.value = '-';
            c.font = dimFont;
            c.alignment = { horizontal: 'center', vertical: 'middle' };
          }
        });

        // 우측 끝 유형별 합계
        const lastCell = row.getCell(rowCells.length);
        lastCell.numFmt = '#,##0';
        lastCell.font = boldFont;
        lastCell.fill = lightSlateFill;
        lastCell.alignment = { horizontal: 'right', vertical: 'middle' };

        row.eachCell(cell => { cell.border = thinBorder; });
      });

      // 하단 일자별 합계 / 전체 불량률 행
      const dTotalCells = [
        '',
        '합계 / 전체 불량률',
        ...labels.map((_, i) => chartDataObj.defects?.[i] || 0),
        `${chartTotals.rate}%`
      ];
      const dTotalRow = ws.addRow(dTotalCells);
      dTotalRow.height = 25;
      dTotalRow.getCell(1).fill = lightSlateFill;
      dTotalRow.getCell(2).font = boldFont;
      dTotalRow.getCell(2).fill = lightSlateFill;
      dTotalRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };

      labels.forEach((_, i) => {
        const colIdx = i + 3;
        const val = chartDataObj.defects?.[i] || 0;
        const c = dTotalRow.getCell(colIdx);
        if (val > 0) {
          c.value = val;
          c.numFmt = '#,##0';
          c.font = boldFont;
          c.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          c.value = '-';
          c.font = dimFont;
          c.alignment = { horizontal: 'center', vertical: 'middle' };
        }
        c.fill = lightSlateFill;
      });

      const grandRateCell = dTotalRow.getCell(dTotalCells.length);
      grandRateCell.font = { name: '맑은 고딕', size: 11, bold: true, color: { argb: 'FFDC2626' } };
      grandRateCell.fill = redCardFill;
      grandRateCell.alignment = { horizontal: 'center', vertical: 'middle' };

      dTotalRow.eachCell(cell => { cell.border = thinBorder; });

      ws.addRow([]);

      // ── 7. 불량 유형 종합 점유율 순위표 (Top 15) ──
      if (defectBreakdown.list && defectBreakdown.list.length > 0) {
        const s3TitleRow = ws.addRow(['■ 불량 유형별 점유율 현황 (Top 15)']);
        s3TitleRow.getCell(1).font = subTitleFont;

        const bHeaderCells = ['순위', '불량 유형', '불량 수량 (EA)', '점유율 (%)'];
        const bHeader = ws.addRow(bHeaderCells);
        bHeader.height = 24;
        bHeader.eachCell(cell => {
          cell.font = headerFont;
          cell.fill = headerFill;
          cell.border = thinBorder;
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        defectBreakdown.list.forEach((dt, idx) => {
          const pct = defectBreakdown.total > 0 ? ((dt.qty / defectBreakdown.total) * 100).toFixed(1) : '0.0';
          const row = ws.addRow([idx + 1, dt.name, dt.qty, `${pct}%`]);
          row.height = 20;

          const rCell = row.getCell(1);
          rCell.alignment = { horizontal: 'center', vertical: 'middle' };
          if (idx === 0) {
            rCell.font = redFont;
            rCell.fill = redCardFill;
          } else if (idx < 3) {
            rCell.font = { name: '맑은 고딕', size: 10, bold: true, color: { argb: 'FFEA580C' } };
            rCell.fill = orangeCardFill;
          } else {
            rCell.font = regularFont;
            rCell.fill = lightSlateFill;
          }

          row.getCell(2).font = boldFont;
          row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle' };

          row.getCell(3).numFmt = '#,##0';
          row.getCell(3).font = boldFont;
          row.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };

          row.getCell(4).font = regularFont;
          row.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };

          row.eachCell(cell => { cell.border = thinBorder; });
        });

        const bTotalRow = ws.addRow(['', '총 불량 합계', defectBreakdown.total, '100.0%']);
        bTotalRow.height = 22;
        bTotalRow.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
        bTotalRow.getCell(2).font = boldFont;
        bTotalRow.getCell(3).numFmt = '#,##0';
        bTotalRow.getCell(3).font = boldFont;
        bTotalRow.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
        bTotalRow.getCell(4).font = boldFont;
        bTotalRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };
        bTotalRow.eachCell(cell => {
          cell.fill = redCardFill;
          cell.border = thinBorder;
        });
      }

      // ── 8. 열 너비 최적화 ──
      ws.columns.forEach((col, idx) => {
        if (idx === 0) col.width = 6;
        else if (idx === 1) col.width = 26;
        else if (idx < labels.length + 2) col.width = 12;
        else col.width = 15;
      });

      const buffer = await wb.xlsx.writeBuffer();
      const carName = (filterCar === 'ALL' ? '전체' : filterCar).replace(/[\\/:*?"<>|]/g, '_'), partName = (filterPart === 'ALL' ? '전체' : filterPart).replace(/[\\/:*?"<>|]/g, '_'), procName = (filterProc === 'ALL' ? '전체' : filterProc).replace(/[\\/:*?"<>|]/g, '_'), now = new Date(); let yy = String(now.getFullYear()).slice(-2), mm = String(now.getMonth() + 1).padStart(2, '0'); if (selectedChartYear !== 'DEFAULT' && selectedChartMonth !== 'DEFAULT') { yy = String(selectedChartYear).slice(-2); mm = String(selectedChartMonth).padStart(2, '0'); } else if (labels.length > 0 && /^\d{4}-\d{2}/.test(labels[labels.length - 1])) { yy = labels[labels.length - 1].slice(2, 4); mm = labels[labels.length - 1].slice(5, 7); }
      const fileName = `${carName}-${partName}-${procName}-${yy}년${mm}월.xlsx`;
      saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fileName);
    } catch (err) {
      console.error('Failed to export excel:', err);
      alert('엑셀 파일 생성 중 오류가 발생했습니다: ' + err.message);
    }
  };

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
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px', borderBottom:'1px solid #f1f5f9', paddingBottom:'12px', flexWrap:'wrap', gap:'10px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
            <div style={{ display:'flex', gap:'6px', background:'#f8fafc', borderRadius:'8px', padding:'3px' }}>
              <button style={tabBtn(activeTab==='chart')} onClick={() => setActiveTab('chart')}>📊 생산 추이 차트</button>
              <button style={tabBtn(activeTab==='defects')} onClick={() => setActiveTab('defects')}>🔍 불량 유형 분석</button>
            </div>
            <button
              onClick={handleExportExcel}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid #16a34a',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#15803d'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#16a34a'; }}
              title="현재 조회된 생산 추이 및 불량 분석 데이터를 엑셀(.xlsx) 파일로 다운로드합니다"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              엑셀 다운로드
            </button>
          </div>
          {/* 차트 기간 / 불량 기간 컨트롤 */}
          {activeTab === 'chart' && (
            <div style={{ display:'flex', alignItems:'center', gap:'8px', background:'#f1f5f9', borderRadius:'6px', padding:'4px 8px', flexWrap:'wrap' }}>
              <select
                value={selectedChartYear}
                onChange={(e) => {
                  setSelectedChartYear(e.target.value);
                  if (e.target.value === 'DEFAULT') setSelectedChartMonth('DEFAULT');
                }}
                style={{ padding:'4px 8px', borderRadius:'4px', border:'1px solid #cbd5e1', fontSize:'12px', outline:'none' }}
              >
                <option value="DEFAULT">선택 (기본값)</option>
                {Array.from(new Set((data.dailyStats||[]).map(r => r.date.substring(0,4)))).sort().reverse().map(y => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
              
              {selectedChartYear !== 'DEFAULT' && (
                <select
                  value={selectedChartMonth}
                  onChange={(e) => setSelectedChartMonth(e.target.value)}
                  style={{ padding:'4px 8px', borderRadius:'4px', border:'1px solid #cbd5e1', fontSize:'12px', outline:'none' }}
                >
                  <option value="DEFAULT">전체 (월별)</option>
                  {[...Array(12)].map((_, i) => {
                    const m = String(i + 1).padStart(2, '0');
                    return <option key={m} value={m}>{i + 1}월 (일별)</option>;
                  })}
                </select>
              )}

              <div style={{ width:'1px', height:'16px', background:'#cbd5e1', margin:'0 4px' }} />

              <button style={segBtn(chartPeriod==='daily' && selectedChartYear==='DEFAULT')} onClick={() => { setChartPeriod('daily'); setSelectedChartYear('DEFAULT'); setSelectedChartMonth('DEFAULT'); }}>최근 1달(일별)</button>
              <button style={segBtn(chartPeriod==='monthly' && selectedChartYear==='DEFAULT')} onClick={() => { setChartPeriod('monthly'); setSelectedChartYear('DEFAULT'); setSelectedChartMonth('DEFAULT'); }}>최근 1년(월별)</button>
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
          <>
          <div style={{ height:'340px' }}>
            <Bar ref={chartRef} data={chartDataObj} options={{
              responsive:true, maintainAspectRatio:false,
              layout:{ padding:{ left:110, top:12, right:24 } },
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
                        if (chartDataObj.effectiveMode === 'daily' && context.tick && typeof context.tick.value === 'number') {
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
                        if (chartDataObj.effectiveMode !== 'daily' || !label) return label;
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
                y1:{ type:'linear', position:'right', title:{ display:true, text:'불량률 (%)', font:{size:12} }, grid:{ drawOnChartArea:false }, min:0, grace:'20%' },
              },
              plugins:{
                legend:{ position:'top', labels:{ font:{size:13}, boxWidth:12, padding:16 } },
                tooltip:{ 
                  backgroundColor:'rgba(15,23,42,0.9)', titleFont:{size:13}, bodyFont:{size:12}, padding:12,
                  callbacks: {
                    title: function(context) {
                      const label = context[0].label;
                      if (chartDataObj.effectiveMode !== 'daily' || !label) return label;
                      const d = new Date(label);
                      if (isNaN(d.getTime())) return label;
                      const days = ['일','월','화','수','목','금','토'];
                      return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일(${days[d.getDay()]})`;
                    }
                  }
                }
              }
            }} plugins={[{
              id: 'chartGeomReporter',
              afterLayout(chart) {
                const left = Math.round(chart.chartArea.left);
                const rightGap = Math.round(chart.width - chart.chartArea.right);
                setChartGeom(prev => (prev.left === left && prev.rightGap === rightGap) ? prev : { left, rightGap });
              }
            }, {
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
            }, {
              id: 'productionQtyLabels',
              afterDatasetsDraw(chart) {
                // 생산수량(EA) 막대 = index 1, 막대 상단에 수량 표시 (0은 생략)
                const ds = chart.data.datasets[1];
                if (!ds) return;
                const meta = chart.getDatasetMeta(1);
                const ctx2 = chart.ctx;
                ctx2.save();
                ctx2.font = 'bold 12px sans-serif';
                ctx2.fillStyle = '#1d4ed8';
                ctx2.textAlign = 'center';
                ctx2.textBaseline = 'bottom';
                const rateDs = chart.data.datasets[0];
                const rateMeta = chart.getDatasetMeta(0);
                meta.data.forEach((bar, i) => {
                  const val = Number(ds.data[i]);
                  if (!val) return;
                  let y = bar.y - 4; // 수량 라벨 baseline (bottom)
                  // 불량률(%) 라벨(점 위 10px, 높이 약 14px)과 겹치면 그 위쪽으로 간격을 두고 올림
                  const pt = rateMeta.data[i];
                  const rv = rateDs && rateDs.data[i];
                  if (pt && rv !== null && rv !== undefined && rv !== '') {
                    const rBottom = pt.y - 10;
                    const rTop = rBottom - 14;
                    const qTop = y - 13;
                    if (y > rTop - 2 && qTop < rBottom + 2) y = rTop - 4;
                  }
                  ctx2.fillText(val.toLocaleString(), bar.x, y);
                });
                ctx2.restore();
              }
            }]} />

          </div>

          {/* 불량 유형별 일자별 수량 표 (차트 컬럼과 정렬) */}
          <div data-chart-defect-table="true" style={{ marginTop:'4px', overflowX:'hidden' }}>
            {chartDefectTable.rows.length === 0 ? (
              <div style={{ textAlign:'center', padding:'16px 0', color:'#94a3b8', fontSize:'12px' }}>선택 기간에 불량 내역이 없습니다.</div>
            ) : (
              <>
                <div style={{ fontSize:'11px', color:'#94a3b8', margin:'6px 0 4px', paddingLeft:'4px' }}>
                  총 불량 <strong style={{ color:'#ef4444' }}>{chartDefectTable.grandTotal.toLocaleString()}</strong>건 (상위 {chartDefectTable.rows.length}개 유형)
                </div>
                <div style={{ display:'flex', alignItems:'stretch' }}>
                  {/* 좌측: 불량 리스트 */}
                  <div style={{ width: chartGeom.left, flexShrink:0, boxSizing:'border-box', paddingRight:'6px' }}>
                    {chartDefectTable.rows.map((dt, i) => (
                      <div key={dt.name} title={`${dt.name} (합계 ${dt.total.toLocaleString()}건)`} style={{ height:'24px', display:'flex', alignItems:'center', gap:'6px', borderBottom:'1px solid #f1f5f9', overflow:'hidden' }}>
                        <span style={{ flexShrink:0, width:'16px', height:'16px', borderRadius:'50%', background:'#fef2f2', color:'#ef4444', fontSize:'9px', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center' }}>{i+1}</span>
                        <span style={{ fontSize:'11px', fontWeight:600, color:'#334155', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', flex:1 }}>{dt.name}</span>
                        <span style={{ flexShrink:0, fontSize:'11px', fontWeight:800, color: i===0?'#ef4444':i<3?'#f97316':'#64748b' }}>{dt.total.toLocaleString()}</span>
                      </div>
                    ))}
                    <div style={{ height:'26px', display:'flex', alignItems:'center', justifyContent:'space-between', background:'#f8fafc', paddingLeft:'4px', paddingRight:'2px', fontSize:'11px', fontWeight:800, color:'#0f172a' }}>
                      <span>합계 / 전체 불량률</span>
                      <span style={{ color:'#ef4444' }}>{chartTotals.defect.toLocaleString()}</span>
                    </div>
                  </div>
                  {/* 우측: 일자별 수량 (차트 카테고리 컬럼과 동일 폭) */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <table style={{ width:'100%', tableLayout:'fixed', borderCollapse:'collapse' }}>
                      <tbody>
                        {chartDefectTable.rows.map(dt => (
                          <tr key={dt.name} style={{ height:'24px' }}>
                            {chartDataObj.labels.map(l => {
                              const q = dt.perLabel[l] || 0;
                              return (
                                <td key={l} style={{ border:'1px solid #e2e8f0', textAlign:'center', fontSize:'10px', padding:0, color: q>0 ? '#ef4444' : '#cbd5e1', fontWeight: q>0 ? 700 : 400 }}>
                                  {q > 0 ? q.toLocaleString() : '-'}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                         <tr style={{ height:'26px', background:'#f8fafc' }}>
                           {chartDataObj.labels.map((l, i) => {
                             const dq = chartDataObj.defects[i] || 0;
                             return (
                               <td key={l} style={{ border:'1px solid #cbd5e1', textAlign:'center', fontSize:'10px', padding:0, color:'#0f172a', fontWeight:800 }}>
                                 {dq > 0 ? dq.toLocaleString() : '-'}
                               </td>
                             );
                           })}
                         </tr>
                       </tbody>
                    </table>
                   </div>
                   {/* 우측 끝: 불량유형별 합계 + 전체 불량률 */}
                   <div style={{ width: chartGeom.rightGap, flexShrink:0, boxSizing:'border-box', paddingLeft:'4px' }}>
                     {chartDefectTable.rows.map(dt => (
                       <div key={dt.name} style={{ height:'24px', display:'flex', alignItems:'center', justifyContent:'center', borderBottom:'1px solid #f1f5f9', fontSize:'11px', fontWeight:800, color:'#334155' }}>
                         {dt.total.toLocaleString()}
                       </div>
                     ))}
                     <div style={{ height:'26px', display:'flex', alignItems:'center', justifyContent:'center', background:'#fef2f2', borderRadius:'4px' }}>
                       <span style={{ fontSize:'11px', fontWeight:800, color:'#ef4444' }}>{chartTotals.rate}%</span>
                     </div>
                   </div>
                 </div>
              </>
            )}
          </div>
          </>
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
