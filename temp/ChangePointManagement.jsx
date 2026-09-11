import React, { useState, useEffect, useMemo } from 'react';
import { fetchChangePoints, addChangePoint, updateChangePoint, deleteChangePoint } from '../services/firestore';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// 엑셀에서 확인한 컬럼 목록
const COLUMNS = [
  { key: 'no', label: 'NO', width: '50px' },
  { key: 'date', label: '발생일', width: '120px', type: 'date' },
  { key: 'month', label: '월', width: '60px' },
  { key: 'week', label: '주차', width: '60px' },
  { key: 'type', label: '구분', width: '100px' },
  { key: 'issueItem', label: '발생항목', width: '150px' },
  { key: 'division', label: '사업부', width: '100px' },
  { key: 'divisionName', label: '사업부명', width: '100px' },
  { key: 'department', label: '발생부서(협력사)', width: '120px' },
  { key: 'manager', label: '담당자', width: '100px' },
  { key: 'carModel', label: '차종', width: '100px' },
  { key: 'partName', label: '품명', width: '100px' },
  { key: 'details', label: '상세내용', width: '200px' },
  { key: 'actionDate', label: '조치일자', width: '120px', type: 'date' },
  { key: 'actionPlan', label: '조치방안', width: '150px' },
  { key: 'actionResult', label: '조치결과', width: '150px' },
  { key: 'qualityCheck', label: '품질검증', width: '100px' },
  { key: 'ceoCheck', label: '대표이사검증', width: '100px' },
  { key: 'qPoint', label: 'Q-POINT 설치여부', width: '120px' },
  { key: 'note', label: '비고', width: '150px' },
];

const INIT_FORM = Object.fromEntries(COLUMNS.map(c => [c.key, '']));

export default function ChangePointManagement() {
  const [activeTab, setActiveTab] = useState('data'); // 'dashboard' or 'data'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Data Grid States
  const [formData, setFormData] = useState({ ...INIT_FORM });
  const [editingId, setEditingId] = useState(null);

  // Dashboard Filters
  const [filterMonth, setFilterMonth] = useState('전체');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchChangePoints();
      setData(res);
    } catch (e) {
      alert('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e, isEdit = false, key = '') => {
    if (isEdit) {
      setData(prev => prev.map(item => item.id === editingId ? { ...item, [key]: e.target.value } : item));
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleAdd = async () => {
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
      setFormData({ ...INIT_FORM });
      loadData();
    } catch (e) {
      alert('저장 실패');
    }
  };

  const handleUpdate = async (item) => {
    try {
      const { id, createdAt, ...updateData } = item;
      await updateChangePoint(id, updateData);
      setEditingId(null);
      loadData();
    } catch (e) {
      alert('수정 실패');
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

  // Dashboard Calculations
  const dashboardData = useMemo(() => {
    let filtered = data;
    if (filterMonth !== '전체') {
      filtered = filtered.filter(d => d.month === filterMonth);
    }

    const total = filtered.length;
    const ceoO = filtered.filter(d => d.ceoCheck === 'O' || d.ceoCheck === '●').length;
    const ceoX = total - ceoO;
    const qualityO = filtered.filter(d => d.qualityCheck === 'O' || d.qualityCheck === '●').length;
    const qualityX = total - qualityO;
    const qPointO = filtered.filter(d => d.qPoint === 'O' || d.qPoint === '●').length;
    const qPointX = total - qPointO;

    const issueCounts = {};
    filtered.forEach(d => {
      const key = d.issueItem || '미상';
      issueCounts[key] = (issueCounts[key] || 0) + 1;
    });

    return { total, ceoO, ceoX, qualityO, qualityX, qPointO, qPointX, issueCounts };
  }, [data, filterMonth]);

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
          📊 대시보드
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
                onChange={e => setFilterMonth(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
              >
                <option value="전체">전체 보기</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i+1} value={`${i+1}월`}>{i+1}월</option>
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
      ) : (
        /* DATA MANAGEMENT TAB */
        <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
            <table style={{ width: '100%', minWidth: '2000px', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
                  {COLUMNS.map(c => (
                    <th key={c.key} style={{ padding: '8px', border: '1px solid #e2e8f0', width: c.width, textAlign: 'center', fontWeight: 'bold' }}>
                      {c.label}
                    </th>
                  ))}
                  <th style={{ padding: '8px', border: '1px solid #e2e8f0', width: '100px', textAlign: 'center', fontWeight: 'bold' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {/* Add New Row */}
                <tr style={{ background: '#fffbeb' }}>
                  <td style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center' }}>NEW</td>
                  {COLUMNS.slice(1).map(c => (
                    <td key={c.key} style={{ padding: '4px', border: '1px solid #e2e8f0' }}>
                      <input 
                        type={c.type || 'text'}
                        name={c.key}
                        value={formData[c.key]}
                        onChange={handleInputChange}
                        style={{ width: '100%', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '11px' }}
                      />
                    </td>
                  ))}
                  <td style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                    <button onClick={handleAdd} style={{ padding: '4px 12px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>추가</button>
                  </td>
                </tr>

                {/* Data Rows */}
                {data.map((row, index) => {
                  const isEditing = editingId === row.id;
                  return (
                    <tr key={row.id} style={{ '&:hover': { background: '#f1f5f9' } }}>
                      <td style={{ padding: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>{index + 1}</td>
                      {COLUMNS.slice(1).map(c => (
                        <td key={c.key} style={{ padding: '4px 8px', border: '1px solid #e2e8f0' }}>
                          {isEditing ? (
                            <input 
                              type={c.type || 'text'}
                              value={row[c.key] || ''}
                              onChange={(e) => handleInputChange(e, true, c.key)}
                              style={{ width: '100%', padding: '4px', border: '1px solid #94a3b8', borderRadius: '4px', fontSize: '11px' }}
                            />
                          ) : (
                            <span>{row[c.key]}</span>
                          )}
                        </td>
                      ))}
                      <td style={{ padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <button onClick={() => handleUpdate(row)} style={{ padding: '4px 8px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>저장</button>
                            <button onClick={() => setEditingId(null)} style={{ padding: '4px 8px', background: '#64748b', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>취소</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <button onClick={() => setEditingId(row.id)} style={{ padding: '4px 8px', background: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✏️</button>
                            <button onClick={() => handleDelete(row.id)} style={{ padding: '4px 8px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={COLUMNS.length + 1} style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>등록된 데이터가 없습니다.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
