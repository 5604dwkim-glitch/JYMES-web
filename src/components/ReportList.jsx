import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { fetchReports, deleteReport, bulkApproveReports, bulkDeleteReports } from '../services/firestore';
import { CAR_MODELS, DEFAULT_PROCESSES } from '../constants/masterData';
import { useNavigate } from 'react-router-dom';

export default function ReportList() {
  const { userRole } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [carModel, setCarModel] = useState('ALL');
  const [processName, setProcessName] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    loadReports();
  }, [startDate, endDate, carModel, processName, status, searchQuery]);

  async function loadReports() {
    setLoading(true);
    const filters = { startDate, endDate, carModel, processName, status, searchQuery };
    const data = await fetchReports(filters);
    setReports(data);
    setLoading(false);
  }

  const handleResetFilters = () => {
    setStartDate('');
    setEndDate(new Date().toISOString().split('T')[0]);
    setCarModel('ALL');
    setProcessName('ALL');
    setStatus('ALL');
    setSearchQuery('');
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(reports.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return alert('승인할 일보를 선택해주세요.');
    if (confirm(`선택한 ${selectedIds.length}건을 승인하시겠습니까?`)) {
      await bulkApproveReports(selectedIds, userRole?.workerName || '관리자');
      alert('승인 완료되었습니다.');
      setSelectedIds([]);
      loadReports();
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return alert('삭제할 일보를 선택해주세요.');
    if (confirm(`선택한 ${selectedIds.length}건을 삭제하시겠습니까?`)) {
      await bulkDeleteReports(selectedIds);
      alert('삭제 완료되었습니다.');
      setSelectedIds([]);
      loadReports();
    }
  };

  const handleDelete = async (id) => {
    if (confirm(`${id} 일보를 삭제하시겠습니까?`)) {
      await deleteReport(id);
      alert('삭제 완료');
      loadReports();
    }
  };

  return (
    <div className="report-list-view">
      <div className="filter-bar">
        <div className="filter-group">
          <div className="form-group" style={{ minWidth: '120px' }}>
            <label style={{ fontSize: '11px' }}>시작일</label>
            <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ minWidth: '120px' }}>
            <label style={{ fontSize: '11px' }}>종료일</label>
            <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ minWidth: '110px' }}>
            <label style={{ fontSize: '11px', color: 'var(--accent-emerald)' }}>차종</label>
            <select className="form-control" value={carModel} onChange={e => setCarModel(e.target.value)}>
              <option value="ALL">전체 차종</option>
              {CAR_MODELS.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: '120px' }}>
            <label style={{ fontSize: '11px', color: 'var(--accent-cyan)' }}>공정</label>
            <select className="form-control" value={processName} onChange={e => setProcessName(e.target.value)}>
              <option value="ALL">전체 공정</option>
              {DEFAULT_PROCESSES.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ minWidth: '110px' }}>
            <label style={{ fontSize: '11px' }}>상태</label>
            <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
              <option value="ALL">전체 상태</option>
              <option value="임시저장">임시저장만</option>
              <option value="승인 대기">승인 대기만</option>
              <option value="승인 완료">승인 완료만</option>
              <option value="반려">반려 건만</option>
            </select>
          </div>
          <div className="form-group" style={{ minWidth: '160px' }}>
            <label style={{ fontSize: '11px' }}>검색</label>
            <input type="text" className="form-control" placeholder="작업자, 품목, 일보ID" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignSelf: 'flex-end', width: '100%', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={handleResetFilters}>초기화</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/form')}>
            <span>➕</span> 신규 일보 작성
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
        <div>
          <span>조회 결과: </span>
          <strong style={{ color: 'var(--accent-cyan)' }}>{reports.length}</strong>건
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-success btn-sm" onClick={handleBulkApprove}>선택 항목 일괄 승인</button>
          <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>선택 항목 일괄 삭제</button>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input type="checkbox" onChange={handleSelectAll} checked={reports.length > 0 && selectedIds.length === reports.length} />
                </th>
                <th>일보 ID</th>
                <th>작업일자</th>
                <th>차종</th>
                <th>공정명</th>
                <th>작업자</th>
                <th>생산 품목</th>
                <th style={{ textAlign: 'right' }}>완료</th>
                <th style={{ textAlign: 'right' }}>불량</th>
                <th style={{ textAlign: 'right' }}>달성률</th>
                <th>상태</th>
                <th style={{ textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(r => (
                <tr key={r.id}>
                  <td style={{ textAlign: 'center' }}>
                    <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => handleSelect(r.id)} />
                  </td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-cyan)' }}>{r.id}</td>
                  <td>{r.date}</td>
                  <td><span style={{ fontWeight: 700, color: 'var(--accent-emerald)', background: 'rgba(5,150,105,0.12)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px' }}>{r.carModel}</span></td>
                  <td><span style={{ fontWeight: 700 }}>{r.processName}</span></td>
                  <td style={{ fontWeight: 700 }}>{r.workerName}</td>
                  <td><div style={{ fontWeight: 600 }}>{r.itemName || '기본 품목'}</div></td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-emerald)' }}>{r.actualQty?.toLocaleString()} EA</td>
                  <td style={{ textAlign: 'right', color: r.defectQty > 0 ? 'var(--accent-rose)' : 'var(--text-muted)' }}>{r.defectQty?.toLocaleString()} EA</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>{r.attainmentRate}%</td>
                  <td>
                    <span className={`status-badge ${r.status === '승인 완료' ? 'approved' : r.status === '반려' ? 'rejected' : r.status === '임시저장' ? 'draft' : 'pending'}`}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)} title="삭제">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td colSpan="12" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                    조건에 일치하는 작업일보가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}