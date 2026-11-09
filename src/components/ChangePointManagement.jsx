import React, { useState, useEffect, useMemo, useRef, Suspense, lazy } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  fetchChangePoints,
  addChangePoint,
  updateChangePoint,
  deleteChangePoint,
  fetchEquipments,
  fetchMolds,
  fetchDowntimeReports,
  invalidateEquipmentsCache,
  invalidateMoldsCache
} from '../services/firestore';
import { CAR_MODELS, DEFAULT_ITEMS } from '../constants/masterData';
import { Chart as ChartJS, ArcElement, PieController, Tooltip, Legend, CategoryScale, LinearScale, BarElement, BarController, Title, LineElement, LineController, PointElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import QPointFormModal from './QPointFormModal';
import DeepChangePointDashboard from './ChangePointParts/DeepChangePointDashboard';
import LinkedIssueTrackerTab from './ChangePointParts/LinkedIssueTrackerTab';
import {
  buildFullLinkedIssueBoard,
  buildChangePointLinkLookup,
  REPAIR_STATE_LABEL
} from '../services/downtimeChain';
import { exportQPointToExcel } from '../utils/qPointExcelExport';
import { HYUNDAI_ISSUE_CATEGORY_MAP } from '../services/changePointAutoSync';

const LegacyDetailModal = lazy(() => import('./DynamicForms/LegacyDetailModal'));
const EquipmentHistoryCardModal = lazy(() => import('./EquipmentManagement/EquipmentHistoryCardModal'));
const MoldHistoryCardModal = lazy(() => import('./MoldManagement/MoldHistoryCardModal'));

ChartJS.register(ArcElement, PieController, Tooltip, Legend, CategoryScale, LinearScale, BarElement, BarController, Title, LineElement, LineController, PointElement);

// 현대자동차 4M / 변동점 표준 카테고리 (설비·TPM·금형·비가동 자동연동 항목 통합)
const ISSUE_CATEGORY_MAP = HYUNDAI_ISSUE_CATEGORY_MAP;

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
  const routeLocation = useLocation();
  const routeNavigate = useNavigate();

  const [activeTab, setActiveTab] = useState(() => {
    const reqTab = routeLocation.state?.initialTab;
    if (reqTab === 'linked' || reqTab === 'data' || reqTab === 'dashboard' || reqTab === 'dashboard2') {
      return reqTab;
    }
    return 'dashboard2';
  });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // 설비·금형·비가동 작업일보 연계 자산 상태
  const [linkedAssets, setLinkedAssets] = useState({
    reports: [],
    equipments: [],
    molds: []
  });
  const [linkedLoading, setLinkedLoading] = useState(false);
  const [includeManualEquipMold, setIncludeManualEquipMold] = useState(false);
  const [savingCpIds, setSavingCpIds] = useState({});

  // 페이지 이탈 없는 원스톱 상세 확인 모달 상태
  const [openReportModal, setOpenReportModal] = useState(null);
  const [openEquipmentModal, setOpenEquipmentModal] = useState(null);
  const [openMoldModal, setOpenMoldModal] = useState(null);

  // Data Grid States
  const [formData, setFormData] = useState({ ...INIT_FORM });
  const [editingId, setEditingId] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [dataQuickFilter, setDataQuickFilter] = useState('ALL'); // 'ALL' | 'AUTO' | 'UNCOMPLETED' | 'COMPLETED'
  const [dataSearchKeyword, setDataSearchKeyword] = useState('');
  const [isQPointModalOpen, setIsQPointModalOpen] = useState(false);
  const [currentQPointRow, setCurrentQPointRow] = useState(null);

  // Dashboard Filters (기본 대시보드 전용)
  const [filterMonth, setFilterMonth] = useState('전체');
  const [filterWeek, setFilterWeek] = useState('전체');

  const loadLinkedAssets = async (forceRefresh = false) => {
    setLinkedLoading(true);
    try {
      if (forceRefresh) {
        invalidateEquipmentsCache();
        invalidateMoldsCache();
      }
      const [reportsRes, eqRes, moldsRes] = await Promise.all([
        fetchDowntimeReports('', forceRefresh),
        fetchEquipments(),
        fetchMolds()
      ]);
      setLinkedAssets({
        reports: reportsRes || [],
        equipments: eqRes || [],
        molds: moldsRes || []
      });
    } catch (err) {
      console.error('Failed to load linked assets for ChangePointManagement:', err);
    } finally {
      setLinkedLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    loadLinkedAssets(false);
  }, []);

  // 외부에서 initialTab 으로 재진입한 경우 탭 동기화
  useEffect(() => {
    const reqTab = routeLocation.state?.initialTab;
    if (!reqTab || routeLocation.state?.focusChangePointId) return;
    if (reqTab === 'linked' || reqTab === 'data' || reqTab === 'dashboard' || reqTab === 'dashboard2') {
      setActiveTab(reqTab);
      routeNavigate(routeLocation.pathname, { replace: true, state: null });
    }
  }, [routeLocation, routeNavigate]);

  // 대시보드 "비가동 → 수리 → 변동점 연계 현황" 등에서 이동해 온 경우 해당 변동점 행으로 이동·강조
  const [focusedCpId, setFocusedCpId] = useState(null);
  const focusHandledRef = useRef(false);
  useEffect(() => {
    const targetId = routeLocation.state?.focusChangePointId;
    if (!targetId || focusHandledRef.current || loading || data.length === 0) return undefined;
    focusHandledRef.current = true;
    routeNavigate(routeLocation.pathname, { replace: true, state: null });
    if (!data.some((r) => r.id === targetId)) return undefined;
    setDataQuickFilter('ALL');
    setDataSearchKeyword('');
    setActiveTab('data');
    setFocusedCpId(targetId);
    // 주의: 위의 routeNavigate(state: null) 로 이 effect 가 다시 실행되므로, 타이머를 cleanup 에서 취소하면 안 된다
    setTimeout(() => {
      document.getElementById('cp-row-' + targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
    setTimeout(() => setFocusedCpId(null), 6000);
    return undefined;
  }, [routeLocation, routeNavigate, loading, data]);

  const handleJumpToDataRow = (targetId) => {
    setDataQuickFilter('ALL');
    setDataSearchKeyword('');
    setActiveTab('data');
    setFocusedCpId(targetId);
    setTimeout(() => {
      document.getElementById('cp-row-' + targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
    setTimeout(() => setFocusedCpId(null), 6000);
  };

  const loadData = async (forceRefresh = false, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetchChangePoints(forceRefresh);
      // 작성일자(date) 내림차순 정렬 (기본값)
      res.sort((a, b) => {
        const dateA = a.date || '';
        const dateB = b.date || '';
        if (dateA === dateB) {
          return 0;
        }
        return dateB.localeCompare(dateA);
      });
      setData(res);
    } catch {
      if (!silent) alert('데이터를 불러오는데 실패했습니다.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleQuickToggleCheck = async (cpRow, fieldKey, nextBool) => {
    if (!cpRow?.id) return;
    setSavingCpIds((prev) => ({ ...prev, [cpRow.id]: true }));
    setData((prev) =>
      prev.map((item) => (item.id === cpRow.id ? { ...item, [fieldKey]: nextBool } : item))
    );
    try {
      const { id, createdAt: _createdAt, ...rest } = cpRow;
      await updateChangePoint(id, { ...rest, [fieldKey]: nextBool });
      await loadData(true, true);
    } catch {
      alert('상태 저장에 실패했습니다.');
      await loadData(true, true);
    } finally {
      setSavingCpIds((prev) => {
        const next = { ...prev };
        delete next[cpRow.id];
        return next;
      });
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
      loadData(true, true);
    } catch {
      alert('등록 실패');
    }
  };

  const handleUpdate = async (item, keepEditing = false) => {
    try {
      const { id, createdAt: _createdAt, ...updateData } = item;
      await updateChangePoint(id, updateData);
      if (!keepEditing) {
        setEditingId(null);
      } else {
        alert('중간저장 되었습니다.');
      }
      loadData(true, true);
    } catch {
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
        const { id, createdAt: _createdAt, ...updateData } = currentQPointRow;
        await updateChangePoint(id, { ...updateData, qPointData });
        setIsQPointModalOpen(false);
        loadData(true, true);
      } catch {
        alert('Q.POINT 저장 실패');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('삭제하시겠습니까?')) return;
    try {
      await deleteChangePoint(id);
      loadData(true, true);
    } catch {
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

  const linkedBoard = useMemo(() => {
    return buildFullLinkedIssueBoard({
      reports: linkedAssets.reports,
      equipments: linkedAssets.equipments,
      molds: linkedAssets.molds,
      changePoints: data,
      includeManualEquipMold
    });
  }, [linkedAssets, data, includeManualEquipMold]);

  const cpLinkLookup = useMemo(
    () => buildChangePointLinkLookup(linkedBoard.items),
    [linkedBoard.items]
  );

  const linkedInProgressCount = useMemo(
    () =>
      linkedBoard.items.filter(
        (it) => it.stageStatus === 'awaiting_repair' || it.stageStatus === 'awaiting_approval'
      ).length,
    [linkedBoard.items]
  );

  const dataTabCounts = useMemo(() => {
    let autoCount = 0;
    let uncompletedCount = 0;
    let completedCount = 0;
    data.forEach((r) => {
      const isAuto = Boolean(r.autoSourceKey || r.autoSourceType || String(r.id || '').startsWith('cp_auto_'));
      if (isAuto) autoCount += 1;
      const done = isLegacyChecked(r.qualityCheck) && isLegacyChecked(r.ceoCheck);
      if (done) completedCount += 1;
      else uncompletedCount += 1;
    });
    return { total: data.length, autoCount, uncompletedCount, completedCount };
  }, [data]);

  const filteredSortedData = useMemo(() => {
    const kw = dataSearchKeyword.trim().toLowerCase();
    return sortedData.filter((r) => {
      const isAuto = Boolean(r.autoSourceKey || r.autoSourceType || String(r.id || '').startsWith('cp_auto_'));
      const done = isLegacyChecked(r.qualityCheck) && isLegacyChecked(r.ceoCheck);
      if (dataQuickFilter === 'AUTO' && !isAuto) return false;
      if (dataQuickFilter === 'UNCOMPLETED' && done) return false;
      if (dataQuickFilter === 'COMPLETED' && !done) return false;
      if (kw) {
        const hay = `${r.date || ''} ${r.type || ''} ${r.issueItem || ''} ${r.carModel || ''} ${r.partName || ''} ${r.details || ''} ${r.actionResult || ''} ${r.note || ''}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });
  }, [sortedData, dataQuickFilter, dataSearchKeyword]);

  const pieOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'left' } } };

  return (
    <div style={{ padding: '4px', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#f8fafc' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#1e293b' }}>변동점(4M) 대시보드 및 데이터 관리</h2>
      
      {/* Tabs: 1. 심층 대시보드 -> 2. 기본 대시보드 -> 3. 설비·금형 연계 현황 -> 4. 대시보드 데이터 관리 */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('dashboard2')}
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: activeTab === 'dashboard2' ? '#10b981' : '#e2e8f0', color: activeTab === 'dashboard2' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer' }}
        >
          📈 심층 대시보드 (트렌드&매트릭스)
        </button>
        <button 
          onClick={() => setActiveTab('dashboard')}
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: activeTab === 'dashboard' ? '#2563eb' : '#e2e8f0', color: activeTab === 'dashboard' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer' }}
        >
          📊 기본 대시보드
        </button>
        <button 
          onClick={() => setActiveTab('linked')}
          style={{ padding: '10px 18px', borderRadius: '8px', border: 'none', background: activeTab === 'linked' ? '#0f172a' : '#e2e8f0', color: activeTab === 'linked' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <span>🔗 설비·금형 연계 현황</span>
          {linkedInProgressCount > 0 ? (
            <span style={{ padding: '1px 7px', borderRadius: '999px', fontSize: '11px', fontWeight: 800, background: '#ef4444', color: '#ffffff' }}>
              조치필요 {linkedInProgressCount}
            </span>
          ) : (
            <span style={{ padding: '1px 7px', borderRadius: '999px', fontSize: '11px', fontWeight: 800, background: activeTab === 'linked' ? '#334155' : '#cbd5e1', color: activeTab === 'linked' ? '#ffffff' : '#334155' }}>
              {linkedBoard.items.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('data')}
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: activeTab === 'data' ? '#2563eb' : '#e2e8f0', color: activeTab === 'data' ? '#fff' : '#475569', fontWeight: 'bold', cursor: 'pointer' }}
        >
          📝 대시보드 데이터 관리
        </button>
        <button
          onClick={() => {
            loadData(true);
            loadLinkedAssets(true);
          }}
          style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', fontWeight: '600', fontSize: '12px', cursor: 'pointer' }}
        >
          🔄 새로고침
        </button>
        <span style={{ fontSize: '12px', color: '#1d4ed8', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '6px 12px', borderRadius: '999px', fontWeight: 600 }}>
          ⚡ 현대차 4M·변동점 자동연동 적용중 (TPM 이상·수리 / 설비·금형 수리 / 작업일보 설비·금형 비가동)
        </span>
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
        /* 심층 대시보드 (트렌드 & 매트릭스 & 클릭 드릴다운) */
        <DeepChangePointDashboard
          data={data}
          isLegacyChecked={isLegacyChecked}
          onJumpToDataRow={handleJumpToDataRow}
          onOpenQPointModal={(row) => {
            setCurrentQPointRow(row);
            setIsQPointModalOpen(true);
          }}
        />
      ) : activeTab === 'linked' ? (
        /* 🔗 설비·금형 연계 현황 (진행중 + 완료 원스톱 통합 추적 보드) */
        <LinkedIssueTrackerTab
          boardItems={linkedBoard.items}
          manualAvailableCount={linkedBoard.manualAvailableCount}
          includeManualEquipMold={includeManualEquipMold}
          onToggleIncludeManual={() => setIncludeManualEquipMold((prev) => !prev)}
          linkedLoading={linkedLoading}
          savingCpIds={savingCpIds}
          onOpenReportModal={(rep) => setOpenReportModal(rep)}
          onOpenEquipmentModal={(eq) => setOpenEquipmentModal(eq)}
          onOpenMoldModal={(mold) => setOpenMoldModal(mold)}
          onQuickToggleCheck={handleQuickToggleCheck}
          onOpenQPointModal={(row) => {
            setCurrentQPointRow(row);
            setIsQPointModalOpen(true);
          }}
          onJumpToDataRow={handleJumpToDataRow}
        />
      ) : (

        /* DATA MANAGEMENT TAB */
        <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* 데이터 관리 상단 빠른 필터 & 검색 바 */}
          <div style={{ padding: '8px 12px', background: '#f8fafc', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155' }}>빠른 보기:</span>
              {[
                { id: 'ALL', label: `전체 (${dataTabCounts.total})` },
                { id: 'AUTO', label: `⚡ 설비·금형 자동연동 (${dataTabCounts.autoCount})` },
                { id: 'UNCOMPLETED', label: `🚨 미검증·미승인 (${dataTabCounts.uncompletedCount})` },
                { id: 'COMPLETED', label: `✅ 완료 (${dataTabCounts.completedCount})` }
              ].map((btn) => {
                const active = dataQuickFilter === btn.id;
                return (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => setDataQuickFilter(btn.id)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: active ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
                      background: active ? '#1d4ed8' : '#ffffff',
                      color: active ? '#ffffff' : '#475569',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {btn.label}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <input
                type="text"
                value={dataSearchKeyword}
                onChange={(e) => setDataSearchKeyword(e.target.value)}
                placeholder="차종·품명·항목·내용 검색..."
                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', width: '200px' }}
              />
              {(dataQuickFilter !== 'ALL' || dataSearchKeyword.trim() !== '') && (
                <button
                  type="button"
                  onClick={() => {
                    setDataQuickFilter('ALL');
                    setDataSearchKeyword('');
                  }}
                  style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#334155', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                >
                  ✕ 초기화
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('linked')}
                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #93c5fd', background: '#eff6ff', color: '#1d4ed8', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
              >
                🔗 3단계 연계 보드로 보기 →
              </button>
            </div>
          </div>

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
                {filteredSortedData.map((row, index) => {
                  const isEditing = editingId === row.id;
                  return (
                    <tr key={row.id} id={'cp-row-' + row.id} style={{ '&:hover': { background: '#f8fafc' }, ...(focusedCpId === row.id ? { background: '#fef9c3', outline: '2px solid #f59e0b' } : {}) }}>
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
                            const baseOptions = currentType ? ISSUE_CATEGORY_MAP[currentType] || [] : [];
                            const curIssueVal = row[c.key] || '';
                            const options = curIssueVal && !baseOptions.includes(curIssueVal)
                              ? [curIssueVal, ...baseOptions]
                              : baseOptions;
                            return (
                              <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                <select 
                                  value={curIssueVal} 
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
                            const curCarVal = row[c.key] || '';
                            const hasCarOption = CAR_MODELS.some(car => car.code === curCarVal);
                            return (
                              <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                <select 
                                  value={curCarVal} 
                                  onChange={(e) => handleInputChange(e, true, c.key)}
                                  style={{ width: '100%', padding: '4px', border: '1px solid #94a3b8', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                                >
                                  <option value="">선택</option>
                                  {curCarVal && !hasCarOption && <option value={curCarVal}>{curCarVal}</option>}
                                  {CAR_MODELS.map(car => <option key={car.code} value={car.code}>{car.name}</option>)}
                                </select>
                              </td>
                            );
                          }
                          if (c.key === 'partName') {
                            const currentCarModel = data.find(d => d.id === editingId)?.carModel || '';
                            const options = currentCarModel ? DEFAULT_ITEMS.filter(it => it.carModel === currentCarModel) : [];
                            const curPartVal = row[c.key] || '';
                            const hasPartOption = options.some(opt => opt.name === curPartVal);
                            return (
                              <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                <select 
                                  value={curPartVal} 
                                  onChange={(e) => {
                                    handleInputChange(e, true, c.key);
                                  }}
                                  style={{ width: '100%', padding: '4px', border: '1px solid #94a3b8', borderRadius: '2px', fontSize: '11px', boxSizing: 'border-box' }}
                                >
                                  <option value="">선택</option>
                                  {curPartVal && !hasPartOption && <option value={curPartVal}>{curPartVal}</option>}
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
                          if (c.key === 'note') {
                            const linkInfo = cpLinkLookup.get(row.id);
                            return (
                              <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                                <span style={{ wordBreak: 'break-all' }}>{row[c.key]}</span>
                                {linkInfo && (linkInfo.report || linkInfo.repair?.owner) && (
                                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'wrap', marginTop: row[c.key] ? '4px' : '0' }}>
                                    {linkInfo.report && (
                                      <button
                                        type="button"
                                        onClick={() => setOpenReportModal(linkInfo.report)}
                                        style={{ padding: '2px 6px', borderRadius: '4px', border: '1px solid #93c5fd', background: '#eff6ff', color: '#1d4ed8', fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                                      >
                                        📄 일보
                                      </button>
                                    )}
                                    {linkInfo.repair?.owner && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (linkInfo.kind === 'mold') setOpenMoldModal(linkInfo.repair.owner);
                                          else setOpenEquipmentModal(linkInfo.repair.owner);
                                        }}
                                        style={{
                                          padding: '2px 6px',
                                          borderRadius: '4px',
                                          border: linkInfo.hasRepairRow && linkInfo.repairState !== 'done' ? '1px solid #fca5a5' : '1px solid #cbd5e1',
                                          background: linkInfo.hasRepairRow && linkInfo.repairState !== 'done' ? '#fef2f2' : '#f8fafc',
                                          color: linkInfo.hasRepairRow && linkInfo.repairState !== 'done' ? '#b91c1c' : '#334155',
                                          fontSize: '10px',
                                          fontWeight: 700,
                                          cursor: 'pointer'
                                        }}
                                      >
                                        {linkInfo.kind === 'mold' ? '🗜️ 금형이력' : '🔧 설비이력'}
                                        {linkInfo.hasRepairRow ? `(${REPAIR_STATE_LABEL[linkInfo.repairState]})` : ''}
                                      </button>
                                    )}
                                  </div>
                                )}
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
                {filteredSortedData.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length + 3} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>조회 조건에 일치하는 데이터가 없습니다.</td>
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

      {/* 원스톱 연계 팝업: 작업일보 상세 / 설비 이력카드 / 금형 이력카드 */}
      {openReportModal && (
        <Suspense fallback={null}>
          <LegacyDetailModal
            report={openReportModal}
            onClose={() => setOpenReportModal(null)}
          />
        </Suspense>
      )}

      {openEquipmentModal && (
        <Suspense fallback={null}>
          <EquipmentHistoryCardModal
            equipment={openEquipmentModal}
            onClose={() => setOpenEquipmentModal(null)}
            onUpdate={(updatedEq) => {
              setOpenEquipmentModal(updatedEq);
              setLinkedAssets((prev) => ({
                ...prev,
                equipments: prev.equipments.map((item) =>
                  item.id === updatedEq.id ? updatedEq : item
                )
              }));
              loadData(true, true);
            }}
          />
        </Suspense>
      )}

      {openMoldModal && (
        <Suspense fallback={null}>
          <MoldHistoryCardModal
            mold={openMoldModal}
            onClose={() => setOpenMoldModal(null)}
            onUpdate={(updatedMold) => {
              if (updatedMold) setOpenMoldModal(updatedMold);
              setLinkedAssets((prev) => ({
                ...prev,
                molds: prev.molds.map((item) =>
                  item.id === updatedMold.id ? updatedMold : item
                )
              }));
              loadData(true, true);
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
