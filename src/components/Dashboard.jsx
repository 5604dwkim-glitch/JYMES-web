import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { fetchMyRecentReports, fetchReports, fetchChangePoints } from '../services/firestore';
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
import { CAR_MODELS, DEFECT_TYPES } from '../constants/masterData';

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
    reports: [],
    equipments: [],
    molds: [],
    changePoints: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      if (userRole?.role === 'worker') {
        const data = await fetchMyRecentReports(userRole.workerName);
        setReports(data);
      } else {
        // Fetch 6 months of data for Admin Dashboard
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const startDate = sixMonthsAgo.toLocaleDateString('sv-SE');

        try {
          const [reportsData, eqSnap, moldSnap, cpData] = await Promise.all([
            fetchReports({ startDate }),
            getDocs(collection(db, 'equipments')),
            getDocs(collection(db, 'molds')),
            fetchChangePoints()
          ]);

          setDashboardData({
            reports: reportsData || [],
            equipments: eqSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            molds: moldSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            changePoints: cpData || []
          });
        } catch (e) {
          console.error("Failed to load dashboard data", e);
        }
      }
      setLoading(false);
    }
    loadData();
  }, [userRole]);

  const isWorker = userRole?.role !== 'admin';

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading Dashboard...</div>;
  }

  if (isWorker) {
    return <WorkerDashboard reports={reports} workerName={userRole?.workerName} navigate={navigate} t={t} />;
  }

  return (
    <AdminDashboard 
      data={dashboardData} 
      t={t}
      navigate={navigate}
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

function AdminDashboard({ data, t, navigate }) {
  const [chartPeriod, setChartPeriod] = useState('weekly'); // 'weekly' | 'monthly'
  const [chartItemFilter, setChartItemFilter] = useState('ALL');

  // 1. Calculate Today's Summary
  const todayStr = new Date().toLocaleDateString('sv-SE');
  let targetReports = data.reports.filter(r => r.date === todayStr);
  let targetDateLabel = `오늘 (${todayStr})`;

  if (targetReports.length === 0 && data.reports.length > 0) {
    const latestDate = [...data.reports].sort((a,b)=>(b.date || '').localeCompare(a.date || ''))[0].date;
    targetReports = data.reports.filter(r => r.date === latestDate);
    targetDateLabel = `최근 가동일 (${latestDate})`;
  }

  const totalTarget = targetReports.reduce((acc, r) => acc + Number(r.targetQty || 0), 0);
  const totalActual = targetReports.reduce((acc, r) => acc + Number(r.actualQty || 0), 0);
  const totalDefect = targetReports.reduce((acc, r) => acc + Number(r.defectQty || 0), 0);
  const avgAttainment = totalTarget > 0 ? ((totalActual / totalTarget) * 100).toFixed(1) : 0;
  const avgDefectRate = totalActual > 0 ? ((totalDefect / totalActual) * 100).toFixed(2) : 0;

  // 2. Chart Data Processing
  const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    return `${d.getUTCFullYear()}년 ${weekNo}주차`;
  };

  const getMonthStr = (d) => {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
  };

  const chartDataObj = useMemo(() => {
    let filtered = [...data.reports];
    if (chartItemFilter !== 'ALL') {
      filtered = filtered.filter(r => r.carModel === chartItemFilter);
    }
    
    // Sort chronologically
    filtered.sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    
    const groups = {};
    filtered.forEach(r => {
      if (!r.date) return;
      const dt = new Date(r.date);
      const key = chartPeriod === 'weekly' ? getWeekNumber(dt) : getMonthStr(dt);
      if (!groups[key]) groups[key] = { actual: 0, defect: 0 };
      groups[key].actual += Number(r.actualQty || 0);
      groups[key].defect += Number(r.defectQty || 0);
    });

    const labels = Object.keys(groups);
    // keep only last 6
    if (labels.length > 6) labels.splice(0, labels.length - 6);
    
    const actualData = labels.map(l => groups[l].actual);
    const defectData = labels.map(l => groups[l].defect);
    const defectRateData = labels.map(l => groups[l].actual > 0 ? ((groups[l].defect / groups[l].actual) * 100).toFixed(2) : 0);

    return {
      labels,
      datasets: [
        {
          type: 'line',
          label: '불량률 (%)',
          data: defectRateData,
          borderColor: '#ef4444',
          backgroundColor: '#ef4444',
          borderWidth: 2,
          yAxisID: 'y1',
          tension: 0.3
        },
        {
          type: 'bar',
          label: '생산수량 (EA)',
          data: actualData,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderRadius: 4,
          yAxisID: 'y'
        }
      ]
    };
  }, [data.reports, chartPeriod, chartItemFilter]);
  
  const defectBreakdown = useMemo(() => {
    let filtered = [...data.reports];
    if (chartItemFilter !== 'ALL') {
      filtered = filtered.filter(r => r.carModel === chartItemFilter);
    }
    
    let defectMap = {};
    let totalDetailedDefects = 0;
    let totalGeneralDefects = 0;

    const addDefect = (name, qty) => {
      const q = Number(qty);
      if (!isNaN(q) && q > 0) {
        defectMap[name] = (defectMap[name] || 0) + q;
        totalDetailedDefects += q;
      }
    };

    filtered.forEach(r => {
      if (!r.date) return;
      
      totalGeneralDefects += Number(r.defectQty || 0);
      
      // 1. Leader Form Items (반장 일보 스크랩)
      if (r.leaderFormItems && Array.isArray(r.leaderFormItems)) {
        r.leaderFormItems.forEach(item => {
           addDefect('[반장] 스크랩A', item.scrapA);
           addDefect('[반장] 스크랩B', item.scrapB);
           addDefect('[반장] 스크랩C', item.scrapC);
           addDefect('[반장] 스크랩D', item.scrapD);
           addDefect('[반장] 센터 불량', item.scrapCenter);
           addDefect('[반장] 사이드 불량', item.scrapSide);
        });
      }

      // 2. inspQtyTable (검사포장 공정)
      if (r.inspQtyTable) {
        [1, 2, 3, 4].forEach(c => {
          addDefect('[검사/압출] 스카치', r.inspQtyTable[`ext_scorch_${c}`]);
          addDefect('[검사/압출] 기스', r.inspQtyTable[`ext_scratch_${c}`]);
          addDefect('[검사/압출] 오염', r.inspQtyTable[`ext_contam_${c}`]);
          addDefect('[검사/압출] 기장', r.inspQtyTable[`ext_len_${c}`]);
          addDefect('[검사/압출] 클립', r.inspQtyTable[`ext_clip_${c}`]);
          addDefect('[검사/압출] 기타', r.inspQtyTable[`ext_oth_${c}`]);
          
          addDefect('[검사/조인트] 빠짐', r.inspQtyTable[`j_drop_${c}`]);
          addDefect('[검사/조인트] 미성형', r.inspQtyTable[`j_lack_${c}`]);
          addDefect('[검사/조인트] 밀림', r.inspQtyTable[`j_push_${c}`]);
          addDefect('[검사/조인트] 기포', r.inspQtyTable[`j_bubble_${c}`]);
          addDefect('[검사/조인트] 씹힘', r.inspQtyTable[`j_chew_${c}`]);
          addDefect('[검사/조인트] 오버', r.inspQtyTable[`j_overflow_${c}`]);
          addDefect('[검사/조인트] 변형', r.inspQtyTable[`j_deform_${c}`]);
          addDefect('[검사/조인트] 이물', r.inspQtyTable[`j_foreign_${c}`]);
          addDefect('[검사/조인트] 틀어짐', r.inspQtyTable[`j_twist_${c}`]);
          addDefect('[검사/조인트] 기타', r.inspQtyTable[`j_oth_${c}`]);

          addDefect('[검사/후가공] 사상과다', r.inspQtyTable[`p_trim_over_${c}`]);
          addDefect('[검사/후가공] 사상미달', r.inspQtyTable[`p_trim_under_${c}`]);
          addDefect('[검사/후가공] 본드오염', r.inspQtyTable[`p_bond_contam_${c}`]);
          addDefect('[검사/후가공] 표면오염', r.inspQtyTable[`p_ext_contam_${c}`]);
          addDefect('[검사/후가공] 클립누락', r.inspQtyTable[`p_clip_miss_${c}`]);
          addDefect('[검사/후가공] 클립홀', r.inspQtyTable[`p_clip_hole_${c}`]);
          addDefect('[검사/후가공] 물구멍', r.inspQtyTable[`p_drain_hole_${c}`]);
          addDefect('[검사/후가공] 이종클립', r.inspQtyTable[`p_wrong_clip_${c}`]);
          addDefect('[검사/후가공] 커팅불량', r.inspQtyTable[`p_cut_miss_${c}`]);
          addDefect('[검사/후가공] 본드불량', r.inspQtyTable[`p_bond_miss_${c}`]);
          addDefect('[검사/후가공] 기장과다', r.inspQtyTable[`p_len_excess_${c}`]);
          addDefect('[검사/후가공] 피치불량', r.inspQtyTable[`p_clip_pitch_${c}`]);
          addDefect('[검사/후가공] 기타', r.inspQtyTable[`p_oth_${c}`]);
        });
      }

      // 3. jointQtyTable (조인트 공정)
      if (r.jointQtyTable) {
        ['frt_p', 'frt_q', 'rr_r', 'rr_s_lh', 'rr_s_rh'].forEach(pos => {
          addDefect('[조인트] 쪼개짐', r.jointQtyTable[`split_${pos}`]);
          addDefect('[조인트] 밀림', r.jointQtyTable[`push_${pos}`]);
          addDefect('[조인트] 미성형', r.jointQtyTable[`lack_${pos}`]);
          addDefect('[조인트] 오버', r.jointQtyTable[`over_${pos}`]);
          addDefect('[조인트] 기포', r.jointQtyTable[`bubble_${pos}`]);
          addDefect('[조인트] 스크랩', r.jointQtyTable[`scrap_${pos}`]);
          addDefect('[조인트] 인서트 불량', r.jointQtyTable[`insert_${pos}`]);
          addDefect('[조인트] 기타', r.jointQtyTable[`oth_${pos}`]);
        });
      }

      // 4. postQtyTable (후가공 공정)
      if (r.postQtyTable) {
        ['fl', 'fr', 'rl', 'rr'].forEach(pos => {
          addDefect('[후가공] 조인트 빠짐', r.postQtyTable[`j_drop_${pos}`]);
          addDefect('[후가공] 미성형', r.postQtyTable[`j_lack_${pos}`]);
          addDefect('[후가공] 단차', r.postQtyTable[`j_step_${pos}`]);
          addDefect('[후가공] 기포', r.postQtyTable[`j_bubble_${pos}`]);
          addDefect('[후가공] 씹힘', r.postQtyTable[`j_chew_${pos}`]);
          addDefect('[후가공] 스크랩', r.postQtyTable[`j_scrap_${pos}`]);
          addDefect('[후가공] 사상 불량', r.postQtyTable[`p_trim_${pos}`]);
          addDefect('[후가공] 오염', r.postQtyTable[`p_poll_${pos}`]);
          addDefect('[후가공] 기타', r.postQtyTable[`p_oth_${pos}`]);
        });
      }
      
      // 5. dtCrewQty (클립머신 등)
      if (r.dtCrewQty) {
        ['LH', 'RH'].forEach(id => {
          addDefect('[클립머신] 종합 불량', r.dtCrewQty[`불량합계_${id}`]);
        });
      }
      if (r.dtCrewQtyB) {
        ['LH2', 'RH2', 'LH3', 'RH3', 'LH4', 'RH4'].forEach(id => {
          addDefect('[클립머신] 종합 불량', r.dtCrewQtyB[`불량합계_${id}`]);
        });
      }
    });

    let unclassified = totalGeneralDefects - totalDetailedDefects;
    if (unclassified > 0) {
      defectMap['[공통] 기타 (상세 미지정)'] = unclassified;
    }

    const breakdown = Object.entries(defectMap)
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty);

    return breakdown;
  }, [data.reports, chartItemFilter]);

  // 3. Grid Widgets Data
  
  // 3.1 Equip Repairs
  const equipRepairs = useMemo(() => {
    let repairs = [];
    data.equipments.forEach(eq => {
      if (eq.history) {
        eq.history.forEach(h => {
          if (h.attachment && h.attachment.includes('수리의뢰')) {
            repairs.push({ ...h, equipName: eq.name, equipId: eq.id });
          }
        });
      }
    });
    return repairs.sort((a,b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5);
  }, [data.equipments]);

  // 3.2 Mold Repairs
  const moldRepairs = useMemo(() => {
    let repairs = [];
    data.molds.forEach(m => {
      if (m.history) {
        m.history.forEach(h => {
          if (h.attachment && h.attachment.includes('수리의뢰')) {
            repairs.push({ ...h, moldName: m.name || m.code, moldId: m.id });
          }
        });
      }
    });
    return repairs.sort((a,b) => (b.date || '').localeCompare(a.date || '')).slice(0, 5);
  }, [data.molds]);

  // 3.3 Mold Strokes
  const topMolds = useMemo(() => {
    return [...data.molds]
      .sort((a, b) => Number(b.currentStrokes || 0) - Number(a.currentStrokes || 0))
      .slice(0, 5);
  }, [data.molds]);

  // 3.4 Change Points
  const recentCPs = useMemo(() => {
    return [...data.changePoints]
      .sort((a, b) => (b.occurrenceDate || '').localeCompare(a.occurrenceDate || ''))
      .slice(0, 5);
  }, [data.changePoints]);

  return (
    <div style={{ padding: '20px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>생산 통합 모니터링 대시보드</h1>
        <div style={{ fontSize: '14px', color: '#64748b' }}>기준: {targetDateLabel}</div>
      </div>

      {/* Top Summary Widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ margin: 0, borderLeft: '4px solid #3b82f6', display: 'flex', alignItems: 'center', padding: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>금일 목표 생산량</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b' }}>{totalTarget.toLocaleString()} <span style={{fontSize: '14px', fontWeight: 400}}>EA</span></div>
          </div>
          <div style={{ width: '48px', height: '48px', background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🎯</div>
        </div>
        <div className="card" style={{ margin: 0, borderLeft: '4px solid #10b981', display: 'flex', alignItems: 'center', padding: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>금일 실제 생산량</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b' }}>{totalActual.toLocaleString()} <span style={{fontSize: '14px', fontWeight: 400}}>EA</span></div>
          </div>
          <div style={{ width: '48px', height: '48px', background: '#ecfdf5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>✅</div>
        </div>
        <div className="card" style={{ margin: 0, borderLeft: '4px solid #8b5cf6', display: 'flex', alignItems: 'center', padding: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>금일 달성률</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b' }}>{avgAttainment} <span style={{fontSize: '14px', fontWeight: 400}}>%</span></div>
          </div>
          <div style={{ width: '48px', height: '48px', background: '#f5f3ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>📈</div>
        </div>
        <div className="card" style={{ margin: 0, borderLeft: '4px solid #ef4444', display: 'flex', alignItems: 'center', padding: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>금일 불량률</div>
            <div style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b' }}>{avgDefectRate} <span style={{fontSize: '14px', fontWeight: 400}}>%</span></div>
          </div>
          <div style={{ width: '48px', height: '48px', background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>⚠️</div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0 }}>생산수량 대비 품질 (불량률) 추이</h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            <select className="form-select" style={{ width: '150px' }} value={chartItemFilter} onChange={e => setChartItemFilter(e.target.value)}>
              <option value="ALL">전체 아이템</option>
              {CAR_MODELS.map(car => (
                <option key={car.code} value={car.code}>{car.name}</option>
              ))}
            </select>
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '6px', padding: '2px' }}>
              <button 
                onClick={() => setChartPeriod('weekly')}
                style={{ padding: '6px 16px', fontSize: '13px', fontWeight: 600, border: 'none', background: chartPeriod === 'weekly' ? '#fff' : 'transparent', borderRadius: '4px', boxShadow: chartPeriod === 'weekly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', color: chartPeriod === 'weekly' ? '#0f172a' : '#64748b' }}
              >
                최근 6주
              </button>
              <button 
                onClick={() => setChartPeriod('monthly')}
                style={{ padding: '6px 16px', fontSize: '13px', fontWeight: 600, border: 'none', background: chartPeriod === 'monthly' ? '#fff' : 'transparent', borderRadius: '4px', boxShadow: chartPeriod === 'monthly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer', color: chartPeriod === 'monthly' ? '#0f172a' : '#64748b' }}
              >
                최근 6개월
              </button>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: 3, minWidth: '400px', height: '350px' }}>
            <Bar 
              data={chartDataObj} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                  x: { grid: { display: false } },
                  y: { type: 'linear', display: true, position: 'left', title: { display: true, text: '수량 (EA)' } },
                  y1: { type: 'linear', display: true, position: 'right', title: { display: true, text: '불량률 (%)' }, grid: { drawOnChartArea: false }, min: 0 }
                },
                plugins: {
                  legend: { position: 'top' },
                  tooltip: { backgroundColor: 'rgba(15, 23, 42, 0.9)', titleFont: { size: 14 }, bodyFont: { size: 13 }, padding: 12 }
                }
              }} 
            />
          </div>
          <div style={{ flex: 1, minWidth: '250px', height: '350px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 16px 0', color: '#1e293b' }}>주요 불량 유형 리스트</h4>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {defectBreakdown.map((dt, i) => (
                <div key={i} style={{ background: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ display: 'inline-block', width: '20px', height: '20px', borderRadius: '50%', background: '#fef2f2', color: '#ef4444', fontSize: '11px', fontWeight: 800, textAlign: 'center', lineHeight: '20px' }}>{i + 1}</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{dt.name}</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#ef4444' }}>{dt.qty.toLocaleString()} <span style={{ fontSize: '11px', fontWeight: 400 }}>건</span></span>
                </div>
              ))}
              {(defectBreakdown.length === 0 || defectBreakdown.every(d => d.qty === 0)) && (
                <div style={{ textAlign: 'center', padding: '20px 0', color: '#94a3b8', fontSize: '13px' }}>불량 내역이 없습니다.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Grid Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        
        {/* 1. Equipment Repairs */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title" style={{ margin: 0, fontSize: '16px' }}>최근 설비 수리 의뢰</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/equipments')}>더보기</button>
          </div>
          <div style={{ padding: '16px' }}>
            {equipRepairs.length === 0 ? <div style={{textAlign:'center', color:'#94a3b8', padding: '20px 0'}}>내역이 없습니다.</div> : 
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {equipRepairs.map((r, i) => (
                  <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: i < equipRepairs.length -1 ? '1px solid #f1f5f9' : 'none' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>{r.equipName}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{r.date} | {r.issue}</div>
                    </div>
                    <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '12px', fontWeight: 600, background: r.confirmed ? '#ecfdf5' : '#fef2f2', color: r.confirmed ? '#047857' : '#b91c1c' }}>
                      {r.confirmed ? '완료' : '진행중'}
                    </span>
                  </li>
                ))}
              </ul>
            }
          </div>
        </div>

        {/* 2. Mold Repairs */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title" style={{ margin: 0, fontSize: '16px' }}>최근 금형 수리 의뢰</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/molds')}>더보기</button>
          </div>
          <div style={{ padding: '16px' }}>
            {moldRepairs.length === 0 ? <div style={{textAlign:'center', color:'#94a3b8', padding: '20px 0'}}>내역이 없습니다.</div> : 
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {moldRepairs.map((r, i) => (
                  <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: i < moldRepairs.length -1 ? '1px solid #f1f5f9' : 'none' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>{r.moldName}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{r.date} | {r.issue}</div>
                    </div>
                    <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '12px', fontWeight: 600, background: r.confirmed ? '#ecfdf5' : '#fef2f2', color: r.confirmed ? '#047857' : '#b91c1c' }}>
                      {r.confirmed ? '완료' : '진행중'}
                    </span>
                  </li>
                ))}
              </ul>
            }
          </div>
        </div>

        {/* 3. Change Points */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title" style={{ margin: 0, fontSize: '16px' }}>최근 변동점 내역</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/change-points')}>더보기</button>
          </div>
          <div style={{ padding: '16px' }}>
            {recentCPs.length === 0 ? <div style={{textAlign:'center', color:'#94a3b8', padding: '20px 0'}}>내역이 없습니다.</div> : 
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentCPs.map((cp, i) => (
                  <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: i < recentCPs.length -1 ? '1px solid #f1f5f9' : 'none' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>{cp.changeType} - {cp.carModel}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '280px' }}>{cp.occurrenceDate} | {cp.details}</div>
                    </div>
                  </li>
                ))}
              </ul>
            }
          </div>
        </div>

        {/* 4. Mold Strokes */}
        <div className="card" style={{ margin: 0 }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="card-title" style={{ margin: 0, fontSize: '16px' }}>금형 누적타수 TOP 5</h3>
            <button className="btn btn-sm btn-secondary" onClick={() => navigate('/molds')}>더보기</button>
          </div>
          <div style={{ padding: '16px' }}>
            {topMolds.length === 0 ? <div style={{textAlign:'center', color:'#94a3b8', padding: '20px 0'}}>등록된 금형이 없습니다.</div> : 
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {topMolds.map((m, i) => {
                  const current = Number(m.currentStrokes || 0);
                  const max = Number(m.maxStrokes || 1);
                  const pct = Math.min(100, Math.round((current / max) * 100));
                  const isDanger = pct > 90;
                  
                  return (
                  <li key={i} style={{ paddingBottom: '12px', borderBottom: i < topMolds.length -1 ? '1px solid #f1f5f9' : 'none' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b' }}>{m.name || m.code}</div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: isDanger ? '#dc2626' : '#0f172a' }}>{current.toLocaleString()} / {max.toLocaleString()}</div>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: isDanger ? '#ef4444' : '#3b82f6', borderRadius: '3px' }}></div>
                    </div>
                  </li>
                )})}
              </ul>
            }
          </div>
        </div>

      </div>
    </div>
  );
}