import React, { useState, useEffect, useMemo } from 'react';
import { fetchChangePoints, addChangePoint, updateChangePoint, deleteChangePoint } from '../services/firestore';
import { CAR_MODELS, DEFAULT_ITEMS } from '../constants/masterData';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import QPointFormModal from './QPointFormModal';
import { exportQPointToExcel } from '../utils/qPointExcelExport';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title, LineElement, PointElement);

// 엑셀에서 확인한 컬럼 목록

const ISSUE_CATEGORY_MAP = {
  '4M': [
    '특별특성 공정 작업자 변경',
    '실명제 제외 인원 공정 투입',
    '금형, 지그 신작',
    '장기 유휴 설비,금형,지그 사용',
    '설비 용량 변경',
    'SUB품 재질 변경',
    'ALT 재질 적용',
    '특수강/철분말 공급처 변경',
    '원자재 사급 변경',
    '고객 포장 사양 변경',
    '공급사 변경',
    '근무형태 조건 변경',
    '작업방법 변경',
    '생산라인 위치 변경',
    '공장 생산 위치 변경',
    '공정조건 변경',
    '미승인된 협력사 자체도면',
    '관리계획서 상이한 기준',
    '검사협정서 상이한 기준'
  ],
  '변동점': [
    '작업자 임시 대체',
    '작업자 근무 교대시간 변경',
    '작업자 역할 분담 변경',
    '툴(공구) 변경',
    '동일 조건의 설비/라인 변경',
    '도장/토출 조건 변경',
    '작업 속도/주기 변경',
    '설비 온도/압력 변경',
    '작업 각도/방식 변경',
    '그리스/윤활유 정기보충(교체)',
    '냉각수/워터호스 정기보충(교체)',
    '설비 부자재 정기교체',
    '단전/단수 발생',
    '파업 발생',
    '물류/파레트 변경',
    '2/3차사 입고품 변경',
    '상기 16항목 외'
  ]
};

const COLUMNS = [
  { key: 'date', label: '작성일자', type: 'date', width: '120px' },
  { key: 'type', label: '구분', type: 'select', width: '80px' },
  { key: 'issueItem', label: '발생항목', type: 'select', width: '120px' },
  { key: 'carModel', label: '차종', type: 'select', width: '100px' },
  { key: 'partName', label: '품명', type: 'select', width: '120px' },
  { key: 'details', label: '상세내용', width: '200px' },
  { key: 'actionTime', label: '조치시점', type: 'date', width: '120px' },
  { key: 'actionPlan', label: '조치방안', width: '150px' },
  { key: 'actionResult', label: '조치결과', width: '150px' },
  { key: 'qualityCheck', label: '품질 검증', type: 'checkbox', width: '100px' },
  { key: 'ceoCheck', label: '대표이사 검증', type: 'checkbox', width: '100px' },
  { key: 'qPointInstall', label: 'Q.POINT 설치여부', type: 'checkbox', width: '120px' },
  { key: 'qPointFile', label: 'Q.POINT 첨부파일', type: 'file', width: '160px' },
  { key: 'note', label: '비고', width: '150px' }
];

const INIT_FORM = Object.fromEntries(COLUMNS.map(c => [c.key, '']));

const isLegacyChecked = (val) => {
  if (val === true) return true;
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  if (s === '' || s === 'x' || s === '-' || s === '미완료' || s === 'no' || s === 'false') return false;
  return true;
};

export default function ChangePointManagement() {
  const [activeTab, setActiveTab] = useState('data'); // 'dashboard' or 'data'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Data Grid States
  const [formData, setFormData] = useState({ ...INIT_FORM });
  const [editingId, setEditingId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [isQPointModalOpen, setIsQPointModalOpen] = useState(false);
  const [currentQPointRow, setCurrentQPointRow] = useState(null);

  // Dashboard Filters
  const [filterMonth, setFilterMonth] = useState('전체');
  const [filterWeek, setFilterWeek] = useState('전체');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchChangePoints();
      // 작성일자(date) 내림차순 정렬 (기본값)
      res.sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateA === dateB) {
          // 작성일자가 같으면 생성일시(createdAt) 오름차순이나 기타 조건 사용 (현재는 그대로 유지)
          return 0;
        }
        // 작성일자(date) 내림차순 정렬 (최신 날짜가 위로)
        return dateB.localeCompare(dateA);
      });
      setData(res);
    } catch (e) {
      alert('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, isEdit = false, key = '') => {
    if (isEdit) {
      setData(prev => prev.map(item => {
        if (item.id === editingId) {
          const newData = { ...item, [key]: e.target.value };
          if (key === 'type') newData.issueItem = '';
          if (key === 'carModel') newData.partName = '';
          return newData;
        }
        return item;
      }));
    } else {
      setFormData(prev => {
        const newData = { ...prev, [e.target.name]: e.target.value };
        if (e.target.name === 'type') newData.issueItem = '';
        if (e.target.name === 'carModel') newData.partName = '';
        return newData;
      });
    }
  };

  const sortedData = useMemo(() => {
    let sortableData = [...data];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        let valA = a[sortConfig.key] || '';
        let valB = b[sortConfig.key] || '';
        if (valA === valB) return 0;
        const compareResult = valA.localeCompare(valB);
        return sortConfig.direction === 'asc' ? compareResult : -compareResult;
      });
    }
    return sortableData;
  }, [data, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleAdd = async (keepEditing = false) => {
    if (!formData.date || !formData.issueItem) {
      alert('발생일과 발생항목은 필수입니다.');
      return;
    }
    
    // Auto fill month/week if possible
    let saveObj = { ...formData };
    if (saveObj.date && !saveObj.month) {
      saveObj.month = new Date(saveObj.date).getMonth() + 1 + '월';
    }

    try {
      await addChangePoint(saveObj);
      if (!keepEditing) {
        setFormData({ ...INIT_FORM });
      } else {
        alert('중간저장 되었습니다. (새 항목 추가됨)');
        setFormData({ ...INIT_FORM }); // Still clear to avoid duplicate additions
      }
      loadData();
    } catch (e) {
      alert('등록 실패');
    }
  };

  const handleUpdate = async (item, keepEditing = false) => {
    try {
      const { id, createdAt, ...updateData } = item;
      await updateChangePoint(id, updateData);
      if (!keepEditing) {
        setEditingId(null);
      } else {
        alert('중간저장 되었습니다.');
      }
      loadData();
    } catch (e) {
      alert('수정 실패');
    }
  };

  const handleSaveQPoint = async (qPointData) => {
    if (currentQPointRow.isNew) {
      // Just update the formData
      setFormData(prev => ({ ...prev, qPointData }));
      setIsQPointModalOpen(false);
    } else {
      // Update existing row
      try {
        const { id, createdAt, ...updateData } = currentQPointRow;
        await updateChangePoint(id, { ...updateData, qPointData });
        setIsQPointModalOpen(false);
        loadData();
      } catch (e) {
        alert('Q.POINT 저장 실패');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    try {
      await deleteChangePoint(id);
      loadData();
    } catch (e) {
      alert('삭제 실패');
    }
  };


  const weekOptions = useMemo(() => {
    if (filterMonth === '전체') return [];
    const month = parseInt(filterMonth, 10);
    // Find a year from the data if possible, default to 2026
    let year = 2026;
    if (data.length > 0 && data[0].date) {
      year = new Date(data[0].date).getFullYear();
    }
    
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0); // Last day of month
    
    const weeks = [];
    let currentWeekStart = new Date(startOfMonth);
    
    let startDayOfWeek = startOfMonth.getDay();
    startDayOfWeek = startDayOfWeek === 0 ? 7 : startDayOfWeek;
    
    let currentWeekEnd = new Date(startOfMonth);
    currentWeekEnd.setDate(currentWeekStart.getDate() + (7 - startDayOfWeek));
    if (currentWeekEnd > endOfMonth) currentWeekEnd = new Date(endOfMonth);
    
    let weekNumber = 1;
    while (currentWeekStart <= endOfMonth) {
      const startStr = `${(currentWeekStart.getMonth()+1).toString().padStart(2, '0')}/${currentWeekStart.getDate().toString().padStart(2, '0')}`;
      const endStr = `${(currentWeekEnd.getMonth()+1).toString().padStart(2, '0')}/${currentWeekEnd.getDate().toString().padStart(2, '0')}`;
      
      weeks.push({
        value: `${weekNumber}주차`,
        label: `${weekNumber}주차 (${startStr}~${endStr})`
      });
      
      weekNumber++;
      currentWeekStart = new Date(currentWeekEnd);
      currentWeekStart.setDate(currentWeekStart.getDate() + 1);
      
      currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekEnd.getDate() + 6);
      if (currentWeekEnd > endOfMonth) currentWeekEnd = new Date(endOfMonth);
    }
    return weeks;
  }, [filterMonth, data]);

  // Dashboard Calculations
  const dashboardData = useMemo(() => {
    let filtered = data;
    
    if (filterMonth !== '전체') {
      filtered = filtered.filter(d => {
        if (!d.date) return false;
        const parts = d.date.split('-');
        if (parts.length < 2) return false;
        const monthNum = parseInt(parts[1], 10);
        return (monthNum + '월') === filterMonth;
      });
    }

    if (filterWeek !== '전체') {
      filtered = filtered.filter(d => {
        if (!d.date) return false;
        const dateObj = new Date(d.date);
        if (isNaN(dateObj.getTime())) return false;
        
        const startOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
        let startDay = startOfMonth.getDay();
        startDay = startDay === 0 ? 7 : startDay; // Mon=1 ... Sun=7
        
        const dateDay = dateObj.getDate();
        const weekNumber = Math.ceil((dateDay + startDay - 1) / 7);
        return (weekNumber + '주차') === filterWeek;
      });
    }


    const total = filtered.length;
    const ceoO = filtered.filter(d => isLegacyChecked(d.ceoCheck)).length;
    const ceoX = total - ceoO;
    const qualityO = filtered.filter(d => isLegacyChecked(d.qualityCheck)).length;
    const qualityX = total - qualityO;
    const qPointO = filtered.filter(d => !!d.qPointInstall).length;
    const qPointX = total - qPointO;

    const issueCounts = {};
    filtered.forEach(d => {
      const key = d.issueItem || '미상';
      issueCounts[key] = (issueCounts[key] || 0) + 1;
    });

    return { total, ceoO, ceoX, qualityO, qualityX, qPointO, qPointX, issueCounts };
  }, [data, filterMonth, filterWeek]);


  const dash2Data = useMemo(() => {
    let filtered = data;
    if (filterMonth !== '전체') {
      filtered = filtered.filter(d => {
        if (!d.date) return false;
        const parts = d.date.split('-');
        if (parts.length < 2) return false;
        const monthNum = parseInt(parts[1], 10);
        return (monthNum + '월') === filterMonth;
      });
    }

    if (filterWeek !== '전체') {
      filtered = filtered.filter(d => {
        if (!d.date) return false;
        const dateObj = new Date(d.date);
        if (isNaN(dateObj.getTime())) return false;
        
        const startOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
        let startDay = startOfMonth.getDay();
        startDay = startDay === 0 ? 7 : startDay;
        
        const dateDay = dateObj.getDate();
        const weekNumber = Math.ceil((dateDay + startDay - 1) / 7);
        return (weekNumber + '주차') === filterWeek;
      });
    }

    const total = filtered.length;
    const ceoO = filtered.filter(d => isLegacyChecked(d.ceoCheck)).length;
    const qualityO = filtered.filter(d => isLegacyChecked(d.qualityCheck)).length;
    const qPointO = filtered.filter(d => !!d.qPointInstall).length;

    // Trend: count by Month (sorted)
    const trendMap = {};
    const trendDetailsMap = {};
    filtered.forEach(d => {
      const fullDate = d.date || 'Unknown';
      const monthKey = fullDate !== 'Unknown' ? fullDate.substring(0, 7) : 'Unknown';
      trendMap[monthKey] = (trendMap[monthKey] || 0) + 1;
      
      if (!trendDetailsMap[monthKey]) trendDetailsMap[monthKey] = {};
      trendDetailsMap[monthKey][fullDate] = (trendDetailsMap[monthKey][fullDate] || 0) + 1;
    });
    const trendDatesRaw = Object.keys(trendMap).sort();
    const trendCounts = trendDatesRaw.map(k => trendMap[k]);
    const trendTooltips = trendDatesRaw.map(k => {
      const details = trendDetailsMap[k];
      return Object.keys(details).sort().map(date => `${date}: ${details[date]}건`);
    });
    
    let lastYear = null;
    const trendDates = trendDatesRaw.map((k, idx) => {
      if (k === 'Unknown') return k;
      const [year, month] = k.split('-');
      const monthNum = parseInt(month, 10);
      if (idx === 0 || year !== lastYear) {
        lastYear = year;
        return `${year}년 ${monthNum}월`;
      }
      return `${monthNum}월`;
    });

    // Matrix: Car Model vs Issue Type
    const matrixMap = {};
    filtered.forEach(d => {
      const car = d.carModel || '미분류';
      const type = d.type || '미상';
      if (!matrixMap[car]) matrixMap[car] = {};
      matrixMap[car][type] = (matrixMap[car][type] || 0) + 1;
    });
    const cars = Object.keys(matrixMap);
    const typesSet = new Set();
    cars.forEach(c => Object.keys(matrixMap[c]).forEach(t => typesSet.add(t)));
    const allTypes = Array.from(typesSet);
    
    // Datasets for Matrix Stacked Bar
    const colors = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];
    const matrixDatasets = allTypes.map((t, i) => {
      return {
        label: t,
        data: cars.map(c => matrixMap[c][t] || 0),
        backgroundColor: colors[i % colors.length]
      };
    });

    return {
      total,
      ceoRate: total ? Math.round((ceoO/total)*100) : 0,
      qualityRate: total ? Math.round((qualityO/total)*100) : 0,
      qPointRate: total ? Math.round((qPointO/total)*100) : 0,
      trendDates,
      trendCounts,
      trendTooltips,
      matrixCars: cars,
      matrixDatasets,
      ceoO, qualityO, qPointO
    };
  }, [data, filterMonth, filterWeek]);

  const pieOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'left' } } };

  return (
    <div style={{ padding: '4px', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#1e293b' }}>변동점(4M) 대시보드 및 데이터 관리</h2>
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        
        <button 
          onClick={() => setActiveTab('dashboard')}
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: activeTab === 'dashboard' ? '#2563eb' : '#e2e8f0', color: activeTab === 'dashboard' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer' }}
        >
          📊 기본 대시보드
        </button>
        <button 
          onClick={() => setActiveTab('dashboard2')}
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: activeTab === 'dashboard2' ? '#10b981' : '#e2e8f0', color: activeTab === 'dashboard2' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer' }}
        >
          📈 심층 대시보드 (트렌드&매트릭스)
        </button>
        <button 
          onClick={() => setActiveTab('data')}

          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: activeTab === 'data' ? '#2563eb' : '#e2e8f0', color: activeTab === 'data' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer' }}
        >
          📝 대시보드 데이터 관리
        </button>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : activeTab === 'dashboard' ? (
        /* DASHBOARD TAB */
        <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
          {/* Filters Sidebar */}
          <div style={{ width: '200px', background: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowY: 'auto' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '12px' }}>필터</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>월별</label>
              <select 
                value={filterMonth} 
                onChange={e => { setFilterMonth(e.target.value); setFilterWeek('전체'); }}
                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
              >
                <option value="전체">전체 보기</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i+1} value={`${i+1}월`}>{i+1}월</option>
                ))}
              </select>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>주차별 (월~일 기준)</label>
              <select 
                value={filterWeek} 
                onChange={e => setFilterWeek(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                disabled={filterMonth === '전체'}
              >
                <option value="전체">전체 보기</option>
                {weekOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Dashboard Content */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
            {/* Top Cards */}
            <div style={{ display: 'flex', gap: '20px', height: '200px' }}>
              <div style={{ flex: 1, background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <h3 style={{ fontSize: '16px', color: '#64748b', marginBottom: '20px' }}>전체 변동 개수</h3>
                <div style={{ fontSize: '64px', fontWeight: 'bold', color: '#0f172a' }}>{dashboardData.total}</div>
              </div>
              <div style={{ flex: 1.5, background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '14px', color: '#64748b', marginBottom: '10px' }}>대표이사 검증</h3>
                <div style={{ height: '130px' }}>
                  <Pie data={{ labels: ['O', 'X'], datasets: [{ data: [dashboardData.ceoO, dashboardData.ceoX], backgroundColor: ['#94a3b8', '#f87171'] }] }} options={pieOptions} />
                </div>
              </div>
              <div style={{ flex: 1.5, background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '14px', color: '#64748b', marginBottom: '10px' }}>품질 검증</h3>
                <div style={{ height: '130px' }}>
                  <Pie data={{ labels: ['O', 'X'], datasets: [{ data: [dashboardData.qualityO, dashboardData.qualityX], backgroundColor: ['#94a3b8', '#f87171'] }] }} options={pieOptions} />
                </div>
              </div>
              <div style={{ flex: 1.5, background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '14px', color: '#64748b', marginBottom: '10px' }}>Q-POINT 설치</h3>
                <div style={{ height: '130px' }}>
                  <Pie data={{ labels: ['O', 'X'], datasets: [{ data: [dashboardData.qPointO, dashboardData.qPointX], backgroundColor: ['#94a3b8', '#f87171'] }] }} options={pieOptions} />
                </div>
              </div>
            </div>

            {/* Bar Chart */}
            <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', flex: 1, minHeight: '300px' }}>
              <h3 style={{ fontSize: '14px', color: '#64748b', marginBottom: '20px' }}>발생항목별 현황</h3>
              <div style={{ height: 'calc(100% - 40px)' }}>
                <Bar 
                  data={{ 
                    labels: Object.keys(dashboardData.issueCounts), 
                    datasets: [{ 
                      label: '발생 건수',
                      data: Object.values(dashboardData.issueCounts), 
                      backgroundColor: '#cbd5e1',
                      barPercentage: 0.5
                    }] 
                  }} 
                  options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} 
                />
              </div>
            </div>
          </div>
        </div>

      ) : activeTab === 'dashboard2' ? (
        /* DASHBOARD 2 TAB (Concept 1+3) */
        <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
          {/* Filters Sidebar (Reused) */}
          <div style={{ width: '200px', background: '#fff', padding: '16px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflowY: 'auto' }}>
            <h3 style={{ fontWeight: 'bold', marginBottom: '12px' }}>필터</h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>월별</label>
              <select 
                value={filterMonth} 
                onChange={e => { setFilterMonth(e.target.value); setFilterWeek('전체'); }}
                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
              >
                <option value="전체">전체 보기</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i+1} value={`${i+1}월`}>{i+1}월</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>주차별 (월~일 기준)</label>
              <select 
                value={filterWeek} 
                onChange={e => setFilterWeek(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                disabled={filterMonth === '전체'}
              >
                <option value="전체">전체 보기</option>
                {weekOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
            {/* KPI Cards (Concept 1) */}
            <div style={{ display: 'flex', gap: '20px', height: '120px' }}>
              <div style={{ flex: 1, background: '#fff', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', padding: '20px', borderLeft: '5px solid #3b82f6', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '14px', color: '#64748b' }}>총 발생 건수</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0f172a' }}>{dash2Data.total}<span style={{fontSize:'16px', color:'#94a3b8', marginLeft:'5px'}}>건</span></div>
              </div>
              <div style={{ flex: 1, background: '#fff', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', padding: '20px', borderLeft: '5px solid #10b981', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '14px', color: '#64748b' }}>공장장 승인 완료율</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0f172a' }}>{dash2Data.ceoRate}<span style={{fontSize:'16px', color:'#94a3b8', marginLeft:'5px'}}>%</span></div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop:'4px' }}>({dash2Data.ceoO} / {dash2Data.total})</div>
              </div>
              <div style={{ flex: 1, background: '#fff', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', padding: '20px', borderLeft: '5px solid #8b5cf6', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '14px', color: '#64748b' }}>품질 검증 완료율</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0f172a' }}>{dash2Data.qualityRate}<span style={{fontSize:'16px', color:'#94a3b8', marginLeft:'5px'}}>%</span></div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop:'4px' }}>({dash2Data.qualityO} / {dash2Data.total})</div>
              </div>
              <div style={{ flex: 1, background: '#fff', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', padding: '20px', borderLeft: '5px solid #f59e0b', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ fontSize: '14px', color: '#64748b' }}>Q-Point 설치율</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0f172a' }}>{dash2Data.qPointRate}<span style={{fontSize:'16px', color:'#94a3b8', marginLeft:'5px'}}>%</span></div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop:'4px' }}>({dash2Data.qPointO} / {dash2Data.total})</div>
              </div>
            </div>

            {/* Middle Row (Line Chart + Stacked Bar) */}
            <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: '300px' }}>
              <div style={{ flex: 2, background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '16px', color: '#64748b', marginBottom: '20px' }}>발생 추이 (월별 트렌드)</h3>
                <div style={{ height: 'calc(100% - 40px)' }}>
                  <Line 
                    data={{
                      labels: dash2Data.trendDates,
                      datasets: [{
                        label: '발생 건수',
                        data: dash2Data.trendCounts,
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        tension: 0.3,
                        fill: true
                      }]
                    }}
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false,
                      plugins: {
                        tooltip: {
                          callbacks: {
                            afterBody: (context) => {
                              if (context.length > 0) {
                                const index = context[0].dataIndex;
                                const details = dash2Data.trendTooltips[index];
                                return details && details.length > 0 ? ['\n[일자별 상세]', ...details] : [];
                              }
                              return [];
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
              
              <div style={{ flex: 3, background: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '16px', color: '#64748b', marginBottom: '20px' }}>차종별 변동점 발생 분석 (Matrix View)</h3>
                <div style={{ height: 'calc(100% - 40px)' }}>
                  <Bar 
                    data={{
                      labels: dash2Data.matrixCars,
                      datasets: dash2Data.matrixDatasets
                    }}
                    options={{ 
                      responsive: true, 
                      maintainAspectRatio: false, 
                      scales: { 
                        x: { 
                          stacked: true,
                          ticks: {
                            maxRotation: 0,
                            minRotation: 0,
                            autoSkip: false
                          }
                        }, 
                        y: { stacked: true } 
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (

        /* DATA MANAGEMENT TAB */
        <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
            <table style={{ width: '100%', minWidth: '1700px', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'center' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                {/* Super Header Row */}
                <tr style={{ background: '#eef2ff', borderBottom: '1px solid #cbd5e1' }}>
                  <th rowSpan={2} style={{ padding: '6px', border: '1px solid #cbd5e1', width: '140px' }}>상태</th>
                  <th rowSpan={2} style={{ padding: '6px', border: '1px solid #cbd5e1', width: '50px' }}>No.</th>
                  <th colSpan={6} style={{ padding: '6px', border: '1px solid #cbd5e1' }}>발생내역</th>
                  <th colSpan={5} style={{ padding: '6px', border: '1px solid #cbd5e1' }}>조치결과</th>
                  <th colSpan={2} style={{ padding: '6px', border: '1px solid #cbd5e1' }}>Q POINT</th>
                  <th rowSpan={2} style={{ padding: '6px', border: '1px solid #cbd5e1', width: '150px' }}>비고</th>
                </tr>
                {/* Sub Header Row */}
                <tr style={{ background: '#eef2ff', borderBottom: '2px solid #cbd5e1' }}>
                  {COLUMNS.slice(0, 6).map(c => (
                                        <th key={c.key} style={{ padding: '6px', border: '1px solid #cbd5e1', width: c.width, cursor: ['date', 'type', 'issueItem', 'carModel', 'partName'].includes(c.key) ? 'pointer' : 'default' }} onClick={() => ['date', 'type', 'issueItem', 'carModel', 'partName'].includes(c.key) ? requestSort(c.key) : null}>
                      {['date', 'type', 'issueItem', 'carModel', 'partName'].includes(c.key) && (
                        <span style={{ marginRight: '4px', fontSize: '10px' }}>
                          {sortConfig && sortConfig.key === c.key ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      )}
                      {c.label}
                    </th>
                  ))}
                  {COLUMNS.slice(6, 11).map(c => (
                                        <th key={c.key} style={{ padding: '6px', border: '1px solid #cbd5e1', width: c.width, cursor: ['date', 'type', 'issueItem', 'carModel', 'partName'].includes(c.key) ? 'pointer' : 'default' }} onClick={() => ['date', 'type', 'issueItem', 'carModel', 'partName'].includes(c.key) ? requestSort(c.key) : null}>
                      {['date', 'type', 'issueItem', 'carModel', 'partName'].includes(c.key) && (
                        <span style={{ marginRight: '4px', fontSize: '10px' }}>
                          {sortConfig && sortConfig.key === c.key ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      )}
                      {c.label}
                    </th>
                  ))}
                  {COLUMNS.slice(11, 13).map(c => (
                                        <th key={c.key} style={{ padding: '6px', border: '1px solid #cbd5e1', width: c.width, cursor: ['date', 'type', 'issueItem', 'carModel', 'partName'].includes(c.key) ? 'pointer' : 'default' }} onClick={() => ['date', 'type', 'issueItem', 'carModel', 'partName'].includes(c.key) ? requestSort(c.key) : null}>
                      {['date', 'type', 'issueItem', 'carModel', 'partName'].includes(c.key) && (
                        <span style={{ marginRight: '4px', fontSize: '10px' }}>
                          {sortConfig && sortConfig.key === c.key ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      )}
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Add New Row */}
                <tr style={{ background: '#fffbeb' }}>
                  <td style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button onClick={() => handleAdd(true)} style={{ padding: '4px 6px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>중간저장</button>
                      <button onClick={() => handleAdd(false)} style={{ padding: '4px 6px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>등록완료</button>
                      <button onClick={() => setFormData({ ...INIT_FORM })} style={{ padding: '4px 6px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>삭제</button>
                    </div>
                  </td>
                  <td style={{ padding: '4px', border: '1px solid #e2e8f0', fontWeight: 'bold' }}>NEW</td>
                  {COLUMNS.map(c => {
                    if (c.key === 'type') {
                      return (
                        <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                          <select 
                            value={formData[c.key] || ''} 
                            onChange={(e) => setFormData({...formData, [c.key]: e.target.value, issueItem: ''})}
                            style={{ width: '100%', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                          >
                            <option value="">선택</option>
                            <option value="4M">4M</option>
                            <option value="변동점">변동점</option>
                          </select>
                        </td>
                      );
                    }
                    if (c.key === 'issueItem') {
                      const options = formData.type ? ISSUE_CATEGORY_MAP[formData.type] || [] : [];
                      return (
                        <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                          <select 
                            value={formData[c.key] || ''} 
                            onChange={(e) => setFormData({...formData, [c.key]: e.target.value})}
                            style={{ width: '100%', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                          >
                            <option value="">선택</option>
                            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                        </td>
                      );
                    }
                    if (c.key === 'carModel') {
                      return (
                        <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                          <select 
                            value={formData[c.key] || ''} 
                            onChange={(e) => setFormData({...formData, [c.key]: e.target.value, partName: ''})}
                            style={{ width: '100%', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                          >
                            <option value="">선택</option>
                            {CAR_MODELS.map(car => <option key={car.code} value={car.code}>{car.name}</option>)}
                          </select>
                        </td>
                      );
                    }
                    if (c.key === 'partName') {
                      const options = formData.carModel ? DEFAULT_ITEMS.filter(it => it.carModel === formData.carModel) : [];
                      return (
                        <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                          <select 
                            value={formData[c.key] || ''} 
                            onChange={(e) => {
                               const selectedItem = options.find(it => it.name === e.target.value);
                               setFormData({...formData, [c.key]: e.target.value});
                            }}
                            style={{ width: '100%', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                          >
                            <option value="">선택</option>
                            {options.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
                          </select>
                        </td>
                      );
                    }
                    
                    if (c.type === 'checkbox') {
                      return (
                        <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center', verticalAlign: 'middle' }}>
                          <input 
                            type="checkbox"
                            checked={isLegacyChecked(formData[c.key])}
                            onChange={(e) => setFormData({...formData, [c.key]: e.target.checked})}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                        </td>
                      );
                    }
                    if (c.type === 'file') {
                      return (
                        <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                          {formData.qPointInstall ? (
                            <button 
                              onClick={() => {
                                setCurrentQPointRow({ isNew: true, ...formData });
                                setIsQPointModalOpen(true);
                              }}
                              style={{ padding: '4px 8px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                            >
                              📝 양식 작성
                            </button>
                          ) : (
                            <span style={{ color: '#94a3b8', fontSize: '11px' }}>설치 시 등록 가능</span>
                          )}
                        </td>
                      );
                    }
                    return (
                      <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                        <input 
                          type={c.type || 'text'}
                          value={formData[c.key] || ''}
                          onChange={(e) => setFormData({...formData, [c.key]: e.target.value})}
                          style={{ width: '100%', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                        />
                      </td>
                    );
                  })}
                </tr>

                {/* Data Rows */}
                {sortedData.map((row, index) => {
                  const isEditing = editingId === row.id;
                  return (
                    <tr key={row.id} style={{ '&:hover': { background: '#f8fafc' } }}>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <button onClick={() => handleUpdate(row, true)} style={{ padding: '4px 6px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>중간저장</button>
                            <button onClick={() => handleUpdate(row, false)} style={{ padding: '4px 6px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>등록완료</button>
                            <button onClick={() => setEditingId(null)} style={{ padding: '4px 6px', background: '#94a3b8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>취소</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <button onClick={() => setEditingId(row.id)} style={{ padding: '4px 6px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>수정</button>
                            <button onClick={() => handleDelete(row.id)} style={{ padding: '4px 6px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>삭제</button>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0' }}>{index + 1}</td>
                      {COLUMNS.map(c => {
                        if (isEditing) {
                          if (c.key === 'type') {
                            return (
                              <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                <select 
                                  value={row[c.key] || ''} 
                                  onChange={(e) => handleInputChange(e, true, c.key)}
                                  style={{ width: '100%', padding: '4px', border: '1px solid #94a3b8', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                                >
                                  <option value="">선택</option>
                                  <option value="4M">4M</option>
                                  <option value="변동점">변동점</option>
                                </select>
                              </td>
                            );
                          }
                          if (c.key === 'issueItem') {
                            const currentType = data.find(d => d.id === editingId)?.type || '';
                            const options = currentType ? ISSUE_CATEGORY_MAP[currentType] || [] : [];
                            return (
                              <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                <select 
                                  value={row[c.key] || ''} 
                                  onChange={(e) => handleInputChange(e, true, c.key)}
                                  style={{ width: '100%', padding: '4px', border: '1px solid #94a3b8', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                                >
                                  <option value="">선택</option>
                                  {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              </td>
                            );
                          }
                          if (c.key === 'carModel') {
                            return (
                              <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                <select 
                                  value={row[c.key] || ''} 
                                  onChange={(e) => handleInputChange(e, true, c.key)}
                                  style={{ width: '100%', padding: '4px', border: '1px solid #94a3b8', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                                >
                                  <option value="">선택</option>
                                  {CAR_MODELS.map(car => <option key={car.code} value={car.code}>{car.name}</option>)}
                                </select>
                              </td>
                            );
                          }
                          if (c.key === 'partName') {
                            const currentCarModel = data.find(d => d.id === editingId)?.carModel || '';
                            const options = currentCarModel ? DEFAULT_ITEMS.filter(it => it.carModel === currentCarModel) : [];
                            return (
                              <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                <select 
                                  value={row[c.key] || ''} 
                                  onChange={(e) => {
                                      handleInputChange(e, true, c.key);
                                      const selectedItem = options.find(it => it.name === e.target.value);
                                      
                                  }}
                                  style={{ width: '100%', padding: '4px', border: '1px solid #94a3b8', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                                >
                                  <option value="">선택</option>
                                  {options.map(opt => <option key={opt.name} value={opt.name}>{opt.name}</option>)}
                                </select>
                              </td>
                            );
                          }
                          
                          if (c.type === 'checkbox') {
                            return (
                              <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center', verticalAlign: 'middle' }}>
                                <input 
                                  type="checkbox"
                                  checked={isLegacyChecked(row[c.key])}
                                  onChange={(e) => handleInputChange({ target: { name: c.key, value: e.target.checked } }, true, c.key)}
                                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                />
                              </td>
                            );
                          }
                          if (c.type === 'file') {
                            return (
                              <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                {row.qPointInstall ? (
                                  <button 
                                    onClick={() => {
                                      setCurrentQPointRow(row);
                                      setIsQPointModalOpen(true);
                                    }}
                                    style={{ padding: '4px 8px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}
                                  >
                                    📝 양식 작성
                                  </button>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontSize: '11px' }}>-</span>
                                )}
                              </td>
                            );
                          }
                          return (
                            <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                              <input 
                                type={c.type || 'text'}
                                value={row[c.key] || ''}
                                onChange={(e) => handleInputChange(e, true, c.key)}
                                style={{ width: '100%', padding: '4px', border: '1px solid #94a3b8', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                              />
                            </td>
                          );
                        
                        } else {
                          if (c.key === 'qualityCheck' || c.key === 'ceoCheck') {
                            return (
                              <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center', verticalAlign: 'middle' }}>
                                {isLegacyChecked(row[c.key]) ? (
                                  <div style={{
                                    display: 'inline-block',
                                    border: '1.5px solid #ef4444',
                                    color: '#ef4444',
                                    padding: '2px 6px',
                                    fontWeight: '700',
                                    fontSize: '11px',
                                    borderRadius: '2px'
                                  }}>
                                    확인
                                  </div>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontSize: '11px' }}>-</span>
                                )}
                              </td>
                            );
                          }
                          if (c.type === 'checkbox') {
                            const isChecked = isLegacyChecked(row[c.key]);
                            const hasFile = !!row.qPointFile;
                            return (
                              <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center', verticalAlign: 'middle' }}>
                                {isChecked ? (
                                  <span style={{ fontWeight: 'bold', fontSize: '13px', color: '#10b981' }}>V</span>
                                ) : (
                                  (!isChecked && !hasFile) ? null : <span style={{ color: '#94a3b8', fontSize: '11px' }}>-</span>
                                )}
                              </td>
                            );
                          }
                          if (c.type === 'file') {
                            return (
                              <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                {row.qPointData ? (
                                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                    <button 
                                      onClick={() => {
                                        setCurrentQPointRow(row);
                                        setIsQPointModalOpen(true);
                                      }}
                                      style={{ padding: '2px 6px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                                    >
                                      🔍 조회
                                    </button>
                                    <button 
                                      onClick={() => exportQPointToExcel(row.qPointData, row)}
                                      style={{ padding: '2px 6px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                                    >
                                      ⬇️ 다운로드
                                    </button>
                                  </div>
                                ) : row[c.key] ? (
                                  <span style={{ fontSize: '11px', color: '#3b82f6', textDecoration: 'underline', cursor: 'pointer' }}>{row[c.key]}</span>
                                ) : null}
                              </td>
                            );
                          }
                          return (
                            <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                              <span style={{ wordBreak: 'break-all' }}>{row[c.key]}</span>
                            </td>
                          );
                        }
                      })}
                    </tr>
                  );
                })}
                {sortedData.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length + 3} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>등록된 데이터가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Q.POINT Modal */}
      <QPointFormModal 
        isOpen={isQPointModalOpen} 
        onClose={() => {
          setIsQPointModalOpen(false);
          setCurrentQPointRow(null);
        }}
        onSave={handleSaveQPoint}
        initialData={currentQPointRow?.qPointData || null}
        rowData={currentQPointRow}
      />
    </div>
  );
}
