import React, { useState, useEffect } from 'react';
import { generate50Workers, DEFAULT_PROCESSES, DEFAULT_ITEMS } from '../constants/masterData';
import { fetchWorkers, addWorker as firestoreAddWorker, updateWorker as firestoreUpdateWorker, deleteWorker as firestoreDeleteWorker } from '../services/firestore';
import WorkerRegistrationModal from './MasterData/WorkerRegistrationModal';
import { printWorkerCard } from '../utils/printWorker';

export default function MasterData() {
  const [activeTab, setActiveTab] = useState('workers');
  const [workers, setWorkers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkers();
  }, []);


  // === 일회성 입사일자 동기화 로직 ===
  useEffect(() => {
    async function syncHireDates() {
      if (workers.length === 0) return;
      const syncedFlag = localStorage.getItem('hireDatesSynced_v2');
      if (syncedFlag) return;
      
      let updatedCount = 0;
      const initial = generate50Workers();
      
      for (const w of workers) {
        const matchingInit = initial.find(init => init.name === w.name);
        if (matchingInit && matchingInit.hireDate !== w.hireDate) {
          try {
            await firestoreUpdateWorker(w.id, { hireDate: matchingInit.hireDate });
            updatedCount++;
          } catch (e) {
            console.error(e);
          }
        }
      }
      
      if (updatedCount > 0) {
        alert(`${updatedCount}명의 입사일자가 사진 정보에 맞게 동기화되었습니다. 새로고침합니다.`);
        localStorage.setItem('hireDatesSynced_v2', 'true');
        window.location.reload();
      } else {
        localStorage.setItem('hireDatesSynced_v2', 'true');
      }
    }
    syncHireDates();
  }, [workers]);
  // ==================================


  const loadWorkers = async () => {
    setLoading(true);
    try {
      const dbWorkers = await fetchWorkers();
      if (dbWorkers && dbWorkers.length > 0) {
        setWorkers(dbWorkers);
      } else {
        // If Firebase is completely empty, initialize with 50 mock workers
        const initial = generate50Workers();
        for (const w of initial) {
          await firestoreAddWorker(w);
        }
        setWorkers(initial.sort((a, b) => a.id.localeCompare(b.id)));
      }
    } catch (error) {
      console.error("Failed to load workers:", error);
      alert("작업자 목록을 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);

  const handleAddWorker = () => {
    setEditingWorker(null);
    setIsModalOpen(true);
  };

  const handleEditWorker = (worker) => {
    setEditingWorker(worker);
    setIsModalOpen(true);
  };

  const handleSaveWorker = async (workerData) => {
    try {
      if (editingWorker) {
        if (editingWorker.id !== workerData.id) {
          // Check if new ID already exists
          const existing = workers.find(w => w.id === workerData.id);
          if (existing) {
            alert(`이미 존재하는 사번(${workerData.id})입니다. 다른 사번을 입력해주세요.`);
            return;
          }
          await firestoreDeleteWorker(editingWorker.id);
          await firestoreAddWorker(workerData);
          setWorkers(workers.map(w => w.id === editingWorker.id ? workerData : w).sort((a, b) => a.id.localeCompare(b.id)));
        } else {
          await firestoreUpdateWorker(workerData.id, workerData);
          setWorkers(workers.map(w => w.id === workerData.id ? { ...w, ...workerData } : w));
        }
        alert(`작업자 '${workerData.name}' 정보가 수정되었습니다.`);
      } else {
        // Check if new ID already exists
        const existing = workers.find(w => w.id === workerData.id);
        if (existing) {
          alert(`이미 존재하는 사번(${workerData.id})입니다. 다른 사번을 입력해주세요.`);
          return;
        }
        await firestoreAddWorker(workerData);
        setWorkers([...workers, workerData].sort((a, b) => a.id.localeCompare(b.id)));
        alert('신규 작업자가 등록되었습니다.');
      }
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
      alert('저장 실패');
    }
  };

  const handleDeleteWorker = async (id) => {
    if (window.confirm(`작업자(${id})를 삭제하시겠습니까?`)) {
      try {
        await firestoreDeleteWorker(id);
        setWorkers(workers.filter(w => w.id !== id));
        alert('작업자가 삭제되었습니다.');
      } catch (_e) {
        alert("삭제 실패");
      }
    }
  };

  const filteredWorkers = workers.filter(w => 
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    w.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    w.process.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 사원 리스트 엑셀 저장 (현재 화면에 표시된 목록 = 검색 결과 기준)
  const handleExportExcel = async () => {
    if (filteredWorkers.length === 0) {
      alert('저장할 사원 데이터가 없습니다.');
      return;
    }
    try {
      const ExcelJS = (await import('exceljs')).default;
      const fileSaver = await import('file-saver');
      const saveAs = fileSaver.saveAs || fileSaver.default;
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('사원 리스트');
      ws.columns = [
        { header: '사번', key: 'id', width: 14 },
        { header: '성함', key: 'name', width: 14 },
        { header: '직급', key: 'role', width: 12 },
        { header: '소속 부서', key: 'dept', width: 16 },
        { header: '공정', key: 'process', width: 18 },
        { header: '상태', key: 'status', width: 10 },
        { header: '연락처', key: 'phone', width: 18 },
        { header: '입사일', key: 'hireDate', width: 14 }
      ];
      filteredWorkers.forEach(w => ws.addRow({
        id: w.id, name: w.name, role: w.role || '', dept: w.dept || '',
        process: w.process || '', status: w.status || '', phone: w.phone || '', hireDate: w.hireDate || ''
      }));
      const headerRow = ws.getRow(1);
      headerRow.font = { bold: true };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
      ws.views = [{ state: 'frozen', ySplit: 1 }];

      const now = new Date();
      const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const buffer = await wb.xlsx.writeBuffer();
      saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `사원리스트_${ymd}.xlsx`);
    } catch (e) {
      console.error(e);
      alert('엑셀 저장 중 오류가 발생했습니다: ' + e.message);
    }
  };

  return (
    <div className="master-data-view" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${activeTab === 'workers' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('workers')}
          >
            👷 사원 리스트 ({workers.length}명)
          </button>
          <button
            className="btn btn-success"
            onClick={handleExportExcel}
            disabled={loading}
          >
            📥 엑셀로 저장
          </button>
        </div>
      </div>

      {activeTab === 'workers' && (
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div className="card-title">
              <span>👥</span>
              <span>웨더스트립 생산/품질 현장 작업자 명부 (Firebase 연동됨)</span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                className="form-control" 
                style={{ width: '200px', padding: '6px 12px', fontSize: '12px' }} 
                placeholder="이름 또는 사번 검색" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-primary btn-sm" onClick={handleAddWorker} disabled={loading}>
                <span>➕</span> 신규 등록
              </button>
            </div>
          </div>

          <div className="table-container" style={{ maxHeight: '520px', overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>데이터를 불러오는 중입니다...</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>사번 ▲</th>
                    <th>성함</th>
                    <th>직급</th>
                    <th>소속 부서</th>
                    <th>공정</th>
                    <th>상태</th>
                    <th>연락처</th>
                    <th>입사일</th>
                    <th style={{ textAlign: 'center', width: '150px' }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkers.map(w => (
                    <tr key={w.id}>
                      <td style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)', fontWeight: 600 }}>{w.id}</td>
                      <td style={{ fontWeight: 600 }}>{w.name}</td>
                      <td>{w.role}</td>
                      <td>{w.dept}</td>
                      <td><span className="proc-badge running">{w.process}</span></td>
                      <td>
                        <span className={`status-badge ${w.status === '근무중' ? 'approved' : w.status === '휴가' ? 'pending' : 'rejected'}`}>
                          {w.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{w.phone}</td>
                      <td style={{ fontSize: '12px', color: 'var(--text-main)', fontWeight: 500 }}>{w.hireDate}</td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleEditWorker(w)}>수정</button>
                          <button className="btn btn-primary btn-sm" onClick={() => printWorkerCard(w)}>출력</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteWorker(w.id)}>삭제</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === 'processes' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span>🏭</span>
              <span>웨더스트립 7대 연속 압출/가황/몰딩 공정 마스터</span>
            </div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>공정 코드</th>
                  <th>공정명</th>
                  <th>가동 라인</th>
                  <th>표준 Lead Time</th>
                  <th>공정 책임자</th>
                </tr>
              </thead>
              <tbody>
                {DEFAULT_PROCESSES.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>{p.id}</td>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td>{p.lines.join(', ')}</td>
                    <td>{p.leadTimeMinutes} 분</td>
                    <td>{p.manager}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'items' && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <span>🚗</span>
              <span>완성차 납품용 웨더스트립 품목 마스터</span>
            </div>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>품목 코드</th>
                  <th>품목명</th>
                  <th>단위</th>
                  <th>목표 TACT Time (초)</th>
                </tr>
              </thead>
              <tbody>
                {DEFAULT_ITEMS.map(it => (
                  <tr key={it.code}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--accent-cyan)' }}>{it.code}</td>
                    <td style={{ fontWeight: 600 }}>{it.name}</td>
                    <td>{it.unit}</td>
                    <td>{it.targetCycleTimeSec} 초</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {isModalOpen && (
        <WorkerRegistrationModal 
          onClose={() => setIsModalOpen(false)} 
          onSave={handleSaveWorker} 
          existingWorker={editingWorker} 
        />
      )}
    </div>
  );
}
