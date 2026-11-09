import React, { useState, useEffect, useMemo } from 'react';
import { generate50Workers, DEFAULT_PROCESSES, DEFAULT_ITEMS } from '../constants/masterData';
import { fetchWorkers, addWorker as firestoreAddWorker, updateWorker as firestoreUpdateWorker, deleteWorker as firestoreDeleteWorker } from '../services/firestore';
import WorkerRegistrationModal from './MasterData/WorkerRegistrationModal';
import { printWorkerCard } from '../utils/printWorker';

const WORKER_ID_PREFIXES = ['JY', 'HW', 'BL'];

const getWorkerPrefix = (id) => String(id || '').trim().slice(0, 2).toUpperCase();

const PREFIX_BADGE_STYLE = {
  JY: { color: '#0369a1', bg: '#e0f2fe', border: '#bae6fd' },
  HW: { color: '#4338ca', bg: '#e0e7ff', border: '#c7d2fe' },
  BL: { color: '#047857', bg: '#d1fae5', border: '#a7f3d0' }
};

export default function MasterData() {
  const [activeTab, setActiveTab] = useState('workers');
  const [selectedPrefix, setSelectedPrefix] = useState('ALL'); // 'ALL' | 'JY' | 'HW' | 'BL' | 'OTHER'
  const [sortConfig, setSortConfig] = useState({ key: 'id', dir: 'asc' });
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
        const matchingInit = initial.find(init => init.id === w.id) || initial.find(init => init.name === w.name);
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

  const prefixCounts = useMemo(() => {
    const counts = { ALL: workers.length, JY: 0, HW: 0, BL: 0, OTHER: 0 };
    workers.forEach((w) => {
      const pfx = getWorkerPrefix(w.id);
      if (WORKER_ID_PREFIXES.includes(pfx)) {
        counts[pfx] += 1;
      } else {
        counts.OTHER += 1;
      }
    });
    return counts;
  }, [workers]);

  const handleSelectPrefix = (pfx) => {
    setActiveTab('workers');
    setSelectedPrefix(pfx);
    setSortConfig({ key: 'id', dir: 'asc' });
  };

  const handleToggleSort = (key) => {
    setSortConfig((prev) => (
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' }
    ));
  };

  const filteredWorkers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = workers.filter((w) => {
      const pfx = getWorkerPrefix(w.id);
      if (selectedPrefix === 'OTHER') {
        if (WORKER_ID_PREFIXES.includes(pfx)) return false;
      } else if (selectedPrefix !== 'ALL') {
        if (pfx !== selectedPrefix) return false;
      }
      if (!q) return true;
      return (
        String(w.name || '').toLowerCase().includes(q) ||
        String(w.id || '').toLowerCase().includes(q) ||
        String(w.process || '').toLowerCase().includes(q)
      );
    });

    const dirMult = sortConfig.dir === 'asc' ? 1 : -1;
    return [...list].sort((a, b) => {
      const va = String(a[sortConfig.key] || '');
      const vb = String(b[sortConfig.key] || '');
      const cmp = va.localeCompare(vb, 'ko', { numeric: true, sensitivity: 'base' });
      if (cmp !== 0) return cmp * dirMult;
      return String(a.id || '').localeCompare(String(b.id || ''), 'en', { numeric: true, sensitivity: 'base' });
    });
  }, [workers, selectedPrefix, searchQuery, sortConfig]);

  const activeScopeLabel = selectedPrefix === 'ALL'
    ? '전체'
    : selectedPrefix === 'OTHER'
      ? '기타'
      : selectedPrefix;

  // 사원 리스트 엑셀 저장 (현재 선택한 사번 구분 JY/HW/BL/전체 + 검색·정렬 결과 기준)
  const handleExportExcel = async () => {
    if (filteredWorkers.length === 0) {
      alert(`현재 선택된 구분(${activeScopeLabel})에 저장할 사원 데이터가 없습니다.`);
      return;
    }
    try {
      const ExcelJS = (await import('exceljs')).default;
      const fileSaver = await import('file-saver');
      const saveAs = fileSaver.saveAs || fileSaver.default;
      const wb = new ExcelJS.Workbook();
      const sheetTitle = `사원리스트_${activeScopeLabel}`;
      const ws = wb.addWorksheet(sheetTitle);
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
      saveAs(
        new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `사원리스트_${activeScopeLabel}_${ymd}.xlsx`
      );
    } catch (e) {
      console.error(e);
      alert('엑셀 저장 중 오류가 발생했습니다: ' + e.message);
    }
  };

  const sortArrow = (key) => (sortConfig.key === key ? (sortConfig.dir === 'asc' ? ' ▲' : ' ▼') : '');

  return (
    <div
      className="master-data-view"
      style={{
        width: '100%',
        height: 'calc(100vh - 96px)',
        minHeight: '520px',
        display: 'flex',
        flexDirection: 'column'
      }}
      data-master-worker-view="1"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '10px', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* 1. 전체 사원 리스트 */}
          <button 
            className={`btn ${activeTab === 'workers' && selectedPrefix === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handleSelectPrefix('ALL')}
          >
            👷 사원 리스트 ({workers.length}명)
          </button>

          {/* 2. 사번 앞 2글자(JY / HW / BL) 구분별 사원 리스트 선택 메뉴 */}
          <div
            data-worker-prefix-menu="1"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 6px',
              background: '#ffffff',
              border: '1.5px solid #cbd5e1',
              borderRadius: '8px',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)'
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#475569', padding: '0 6px', whiteSpace: 'nowrap' }}>
              🏷️ 사번별 리스트
            </span>
            {WORKER_ID_PREFIXES.map((pfx) => {
              const isSelected = activeTab === 'workers' && selectedPrefix === pfx;
              return (
                <button
                  key={pfx}
                  type="button"
                  onClick={() => handleSelectPrefix(pfx)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: isSelected ? '1px solid #1d4ed8' : '1px solid transparent',
                    background: isSelected ? '#2563eb' : '#f1f5f9',
                    color: isSelected ? '#ffffff' : '#334155',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {pfx} ({prefixCounts[pfx]}명)
                </button>
              );
            })}
            {prefixCounts.OTHER > 0 && (
              <button
                type="button"
                onClick={() => handleSelectPrefix('OTHER')}
                style={{
                  padding: '6px 10px',
                  borderRadius: '6px',
                  border: activeTab === 'workers' && selectedPrefix === 'OTHER' ? '1px solid #1d4ed8' : '1px solid transparent',
                  background: activeTab === 'workers' && selectedPrefix === 'OTHER' ? '#2563eb' : '#f1f5f9',
                  color: activeTab === 'workers' && selectedPrefix === 'OTHER' ? '#ffffff' : '#64748b',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                기타 ({prefixCounts.OTHER}명)
              </button>
            )}
          </div>

          {/* 3. 현재 선택된 리스트(전체 / JY / HW / BL) 기준 엑셀 저장 */}
          <button
            className="btn btn-success"
            onClick={handleExportExcel}
            disabled={loading}
            title={`현재 선택된 [${activeScopeLabel}] 사원 리스트를 엑셀 파일로 저장합니다`}
          >
            📥 엑셀로 저장 ({activeScopeLabel} {filteredWorkers.length}명)
          </button>
        </div>
      </div>

      {activeTab === 'workers' && (
        <div className="card" style={{ flex: 1, minHeight: 0, margin: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', alignItems: 'center', flexShrink: 0 }}>
            <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>👥</span>
              <span>웨더스트립 생산/품질 현장 작업자 명부 (Firebase 연동됨)</span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  background: selectedPrefix === 'ALL' ? '#eff6ff' : (PREFIX_BADGE_STYLE[selectedPrefix]?.bg || '#f1f5f9'),
                  color: selectedPrefix === 'ALL' ? '#1d4ed8' : (PREFIX_BADGE_STYLE[selectedPrefix]?.color || '#334155'),
                  border: `1px solid ${selectedPrefix === 'ALL' ? '#bfdbfe' : (PREFIX_BADGE_STYLE[selectedPrefix]?.border || '#cbd5e1')}`
                }}
              >
                {selectedPrefix === 'ALL' ? `전체 사원 (${filteredWorkers.length}명)` : `${activeScopeLabel} 사원 리스트 (${filteredWorkers.length}명)`}
              </span>
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
                <span>➕</span> {WORKER_ID_PREFIXES.includes(selectedPrefix) ? `${selectedPrefix} 신규 등록` : '신규 등록'}
              </button>
            </div>
          </div>

          <div className="table-container" style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'auto' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>데이터를 불러오는 중입니다...</div>
            ) : (
              <table className="data-table">
                <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                  <tr>
                    <th onClick={() => handleToggleSort('id')} style={{ cursor: 'pointer', userSelect: 'none' }} title="클릭하여 사번순 정렬 전환">
                      사번{sortArrow('id') || ' ↕'}
                    </th>
                    <th onClick={() => handleToggleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }} title="클릭하여 성함순 정렬 전환">
                      성함{sortArrow('name')}
                    </th>
                    <th>직급</th>
                    <th>소속 부서</th>
                    <th>공정</th>
                    <th>상태</th>
                    <th>연락처</th>
                    <th onClick={() => handleToggleSort('hireDate')} style={{ cursor: 'pointer', userSelect: 'none' }} title="클릭하여 입사일순 정렬 전환">
                      입사일{sortArrow('hireDate')}
                    </th>
                    <th style={{ textAlign: 'center', width: '180px' }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkers.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ padding: '42px 16px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                        {searchQuery.trim()
                          ? `'${searchQuery}' 검색 조건에 해당하는 ${activeScopeLabel} 작업자가 없습니다.`
                          : `현재 등록된 ${activeScopeLabel} 사번 작업자가 없습니다. 우측 상단 [➕ ${WORKER_ID_PREFIXES.includes(selectedPrefix) ? `${selectedPrefix} ` : ''}신규 등록] 버튼으로 추가해 주세요.`}
                      </td>
                    </tr>
                  ) : filteredWorkers.map(w => {
                    const photoSrc = w.photoData || w.photoUrl || w.photo || '';
                    const pfx = getWorkerPrefix(w.id);
                    const pfxStyle = PREFIX_BADGE_STYLE[pfx];
                    return (
                      <tr key={w.id}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700, color: pfxStyle ? pfxStyle.color : 'var(--accent-cyan)' }}>{w.id}</td>
                        <td style={{ fontWeight: 600, paddingTop: '6px', paddingBottom: '6px' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
                            {photoSrc ? (
                              <img
                                src={photoSrc}
                                alt={`${w.name} 사진`}
                                title={`${w.name} (${w.id})`}
                                width={30}
                                height={40}
                                loading="lazy"
                                decoding="async"
                                onClick={() => handleEditWorker(w)}
                                style={{
                                  width: '30px',
                                  height: '40px',
                                  minWidth: '30px',
                                  objectFit: 'cover',
                                  objectPosition: 'center 20%',
                                  borderRadius: '4px',
                                  border: '1px solid #cbd5e1',
                                  backgroundColor: '#f8fafc',
                                  display: 'block',
                                  cursor: 'pointer'
                                }}
                              />
                            ) : (
                              <div
                                onClick={() => handleEditWorker(w)}
                                title="사진 미등록 (클릭하여 사진 등록)"
                                style={{
                                  width: '30px',
                                  height: '40px',
                                  minWidth: '30px',
                                  borderRadius: '4px',
                                  border: '1px dashed #cbd5e1',
                                  backgroundColor: '#f1f5f9',
                                  color: '#94a3b8',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '14px',
                                  cursor: 'pointer'
                                }}
                              >
                                👤
                              </div>
                            )}
                            <span>{w.name}</span>
                          </div>
                        </td>
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
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', flexWrap: 'nowrap' }}>
                            <button className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={() => handleEditWorker(w)}>수정</button>
                            <button className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={() => printWorkerCard(w)}>출력</button>
                            <button className="btn btn-danger btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={() => handleDeleteWorker(w.id)}>삭제</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
          defaultPrefix={!editingWorker && WORKER_ID_PREFIXES.includes(selectedPrefix) ? selectedPrefix : ''}
        />
      )}
    </div>
  );
}
