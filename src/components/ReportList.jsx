import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { fetchReports, deleteReport, bulkApproveReports, bulkDeleteReports, fetchWorkers } from '../services/firestore';
import { CAR_MODELS, DEFAULT_PROCESSES } from '../constants/masterData';
import { useNavigate } from 'react-router-dom';
import LegacyDetailModal from './DynamicForms/LegacyDetailModal';

export default function ReportList({ initialStatus = 'ALL' }) {
  const { userRole } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]); // 클라이언트 searchQuery 적용 결과
  const [loading, setLoading] = useState(true);

  const initialStartDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [carModel, setCarModel] = useState('ALL');
  const [processName, setProcessName] = useState('ALL');
  const [status, setStatus] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedIds, setSelectedIds] = useState([]);
  const [selectedReportForModal, setSelectedReportForModal] = useState(null);

  const [viewMode, setViewMode] = useState('list');
  const [allWorkers, setAllWorkers] = useState([]);
  const [workersFetched, setWorkersFetched] = useState(false);

  const toggleViewMode = async () => {
    if (viewMode === 'list') {
      if (!workersFetched) {
        const w = await fetchWorkers();
        setAllWorkers(w);
        setWorkersFetched(true);
      }
      setViewMode('board');
    } else {
      setViewMode('list');
    }
  };

  // Firestore 호출: 날짜/차종/공정/상태 변경 시에만 실행 (searchQuery 제외)
  useEffect(() => {
    loadReports();
  }, [startDate, endDate, carModel, processName, status]);

  // searchQuery 변경은 클라이언트 필터만 재적용 (Firestore 호출 없음)
  useEffect(() => {
    if (!searchQuery) {
      setFilteredReports(reports);
      return;
    }
    const kw = searchQuery.toLowerCase();
    setFilteredReports(reports.filter(r =>
      r.id.toLowerCase().includes(kw) ||
      (r.carModel && r.carModel.toLowerCase().includes(kw)) ||
      (r.itemName && r.itemName.toLowerCase().includes(kw)) ||
      r.workerName.toLowerCase().includes(kw) ||
      (r.notes && r.notes.toLowerCase().includes(kw))
    ));
  }, [searchQuery, reports]);

  async function loadReports() {
    setLoading(true);
    const filters = { startDate, endDate, carModel, processName, status };
    // 작업자 계정인 경우 자신의 일보만 표시
    if (userRole && userRole.role === 'worker') {
      filters.workerName = userRole.workerName;
    }
    const data = await fetchReports(filters);
    setReports(data);
    setFilteredReports(searchQuery
      ? data.filter(r => {
          const kw = searchQuery.toLowerCase();
          return r.id.toLowerCase().includes(kw) ||
            (r.carModel && r.carModel.toLowerCase().includes(kw)) ||
            (r.itemName && r.itemName.toLowerCase().includes(kw)) ||
            r.workerName.toLowerCase().includes(kw) ||
            (r.notes && r.notes.toLowerCase().includes(kw));
        })
      : data
    );
    setLoading(false);
  }

  const handleResetFilters = () => {
    setStartDate(initialStartDate);
    setEndDate(new Date().toISOString().split('T')[0]);
    setCarModel('ALL');
    setProcessName('ALL');
    setStatus('ALL');
    setSearchQuery('');
  };


  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(filteredReports.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };


  const handleBulkDownloadZIP = async () => {
    if (selectedIds.length === 0) {
      alert("다운로드할 항목을 선택하세요.");
      return;
    }
    
    try {
      const JSZip = (await import('jszip')).default;
      const ExcelJS = (await import('exceljs')).default;
      const { saveAs } = (await import('file-saver')).default ? await import('file-saver') : await import('file-saver');

      const zip = new JSZip();
      
      for (const id of selectedIds) {
        const report = reports.find(r => r.id === id);
        if (!report) continue;
        
        const fileName = `${report.date || '날짜없음'}-${report.itemName || '품목없음'}-${report.workerName || '이름없음'}.xlsx`.replace(/[\\/:*?"<>|]/g, '');
        
        const wb = new ExcelJS.Workbook();
        const ws = wb.addWorksheet("작업일보");
        
        // Define common borders
        const thinBorder = {
          top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'}
        };
        const thickBorderTop = { top: {style:'thick'} };
        const thickBorderBottom = { bottom: {style:'thick'} };
        
        // Setup columns (A to H)
        ws.columns = [
          { width: 6 },   // A: 순번
          { width: 22 },  // B: 아이템 / 기타
          { width: 14 },  // C: 포장완료
          { width: 12 },  // D: 수정이동
          { width: 11 },  // E: 스크랩 A
          { width: 11 },  // F: 스크랩 B
          { width: 11 },  // G: 스크랩 C
          { width: 11 }   // H: 스크랩 D
        ];

        if (report.isLeaderForm) {
          // Row 1 & 2: Header (Title & Signature)
          ws.mergeCells('A1:F2');
          const titleCell = ws.getCell('A1');
          titleCell.value = "작 업 일 보 (반장)";
          titleCell.font = { bold: true, size: 20 };
          titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
          
          ws.getCell('G1').value = "작성";
          ws.getCell('H1').value = "승인";
          ws.getCell('G2').value = report.workerName || "";
          ws.getCell('H2').value = report.approver || "관리자";
          
          ['G1', 'H1', 'G2', 'H2'].forEach(c => {
            const cell = ws.getCell(c);
            cell.border = thinBorder;
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            if(c==='G1' || c==='H1') cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
            cell.font = { size: 10, bold: true };
          });

          // Row 3: Sub info
          ws.mergeCells('A3:H3');
          const subInfoCell = ws.getCell('A3');
          subInfoCell.value = `일보ID: ${report.id} | 작성자: ${report.workerName}`;
          subInfoCell.font = { size: 10, color: { argb: 'FF64748B' } };
          subInfoCell.border = thickBorderBottom; // Line separator

          // Row 4: Date & Time
          ws.mergeCells('A4:D4');
          ws.mergeCells('E4:H4');
          const dateCell = ws.getCell('A4');
          dateCell.value = `작성일 : ${report.date}`;
          dateCell.font = { bold: true, size: 11 };
          dateCell.alignment = { vertical: 'middle', horizontal: 'left' };
          
          const timeCell = ws.getCell('E4');
          timeCell.value = `근무시간 : ${report.workHours || '06:30 ~ 15:00'}`;
          timeCell.font = { bold: true, size: 11 };
          timeCell.alignment = { vertical: 'middle', horizontal: 'right' };

          // Row 5: Section 1 Title
          ws.mergeCells('A5:H5');
          const sec1Cell = ws.getCell('A5');
          sec1Cell.value = "1. 생산현황";
          sec1Cell.font = { bold: true, size: 12 };
          sec1Cell.alignment = { vertical: 'bottom', horizontal: 'left' };

          // Row 6: Table Headers
          const headers = ["순번", "아이템", "포장완료 수량", "수정이동", "스크랩 (불량 구분)"];
          ws.getCell('A6').value = headers[0];
          ws.getCell('B6').value = headers[1];
          ws.getCell('C6').value = headers[2];
          ws.getCell('D6').value = headers[3];
          ws.mergeCells('E6:H6');
          ws.getCell('E6').value = headers[4];

          ['A6', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6', 'H6'].forEach(c => {
            const cell = ws.getCell(c);
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
            cell.font = { bold: true, size: 10, color: { argb: 'FF334155' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            cell.border = thinBorder;
          });

          // Table Body
          const items = report.leaderFormItems || [];
          let currentRow = 7;
          items.forEach((it, idx) => {
            ws.getCell(`A${currentRow}`).value = idx + 1;
            ws.getCell(`B${currentRow}`).value = it.name;
            ws.getCell(`C${currentRow}`).value = Number(it.packedQty) || 0;
            ws.getCell(`D${currentRow}`).value = Number(it.reworkQty) || 0;
            
            if (it.name === 'KM/KX Hood') {
              ws.mergeCells(`E${currentRow}:F${currentRow}`);
              ws.mergeCells(`G${currentRow}:H${currentRow}`);
              ws.getCell(`E${currentRow}`).value = `센터: ${it.scrapCenter || 0}`;
              ws.getCell(`G${currentRow}`).value = `사이드: ${it.scrapSide || 0}`;
            } else {
              ws.getCell(`E${currentRow}`).value = `A: ${it.scrapA || 0}`;
              ws.getCell(`F${currentRow}`).value = `B: ${it.scrapB || 0}`;
              ws.getCell(`G${currentRow}`).value = `C: ${it.scrapC || 0}`;
              ws.getCell(`H${currentRow}`).value = `D: ${it.scrapD || 0}`;
            }

            ['A','B','C','D','E','F','G','H'].forEach(col => {
              const cell = ws.getCell(`${col}${currentRow}`);
              cell.border = thinBorder;
              cell.font = { size: 10 };
              if (col === 'B') cell.font.bold = true;
              if (col === 'C') {
                cell.font.bold = true;
                cell.numFmt = '#,##0';
              }
              if (['A','D','E','F','G','H'].includes(col)) {
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
              }
            });
            currentRow++;
          });

          // Row: Section 2 Title
          currentRow++;
          ws.mergeCells(`A${currentRow}:H${currentRow}`);
          const sec2Cell = ws.getCell(`A${currentRow}`);
          sec2Cell.value = "2. 근태현황";
          sec2Cell.font = { bold: true, size: 12 };
          sec2Cell.alignment = { vertical: 'bottom', horizontal: 'left' };

          // Att Header
          currentRow++;
          ws.mergeCells(`A${currentRow}:C${currentRow}`);
          ws.mergeCells(`D${currentRow}:F${currentRow}`);
          ws.mergeCells(`G${currentRow}:H${currentRow}`);
          ws.getCell(`A${currentRow}`).value = "총원";
          ws.getCell(`D${currentRow}`).value = "출근";
          ws.getCell(`G${currentRow}`).value = "결근";
          
          ['A','B','C','D','E','F','G','H'].forEach(col => {
            const cell = ws.getCell(`${col}${currentRow}`);
            cell.border = thinBorder;
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
            cell.font = { bold: true, size: 10, color: { argb: 'FF334155' } };
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          });

          // Att Values
          currentRow++;
          ws.mergeCells(`A${currentRow}:C${currentRow}`);
          ws.mergeCells(`D${currentRow}:F${currentRow}`);
          ws.mergeCells(`G${currentRow}:H${currentRow}`);
          const att = report.attendanceData || {};
          const tCell = ws.getCell(`A${currentRow}`);
          const pCell = ws.getCell(`D${currentRow}`);
          const aCell = ws.getCell(`G${currentRow}`);
          
          tCell.value = `${att.total || 0} 명`;
          pCell.value = `${att.present || 0} 명`;
          aCell.value = `${att.absent || 0} 명`;
          
          tCell.font = { bold: true, size: 11 };
          pCell.font = { bold: true, size: 11, color: { argb: 'FF059669' } };
          aCell.font = { bold: true, size: 11, color: { argb: 'FFDC2626' } };

          ['A','B','C','D','E','F','G','H'].forEach(col => {
            const cell = ws.getCell(`${col}${currentRow}`);
            cell.border = thinBorder;
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          });
          
          // Att Details
          currentRow++;
          ws.mergeCells(`A${currentRow}:H${currentRow}`);
          const detCell = ws.getCell(`A${currentRow}`);
          detCell.value = `📋 근태 사유 상세:   연차: ${att.annualLeave || 0}명    병가: ${att.sickLeave || 0}명    반차: ${att.halfLeave || 0}명                     (${att.reason || ''})`;
          detCell.font = { size: 10 };
          detCell.border = thinBorder;
          detCell.alignment = { vertical: 'middle', horizontal: 'left' };

        } else {
          // For Standard Forms, create a similar clean layout
          ws.mergeCells('A1:F2');
          const titleCell = ws.getCell('A1');
          titleCell.value = `작 업 일 보 (${report.processName || ''})`;
          titleCell.font = { bold: true, size: 20 };
          titleCell.alignment = { vertical: 'middle', horizontal: 'left' };
          
          ws.getCell('G1').value = "작성";
          ws.getCell('H1').value = "승인";
          ws.getCell('G2').value = report.workerName || "";
          ws.getCell('H2').value = report.approver || "관리자";
          
          ['G1', 'H1', 'G2', 'H2'].forEach(c => {
            const cell = ws.getCell(c);
            cell.border = thinBorder;
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
            if(c==='G1' || c==='H1') cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
          });

          ws.mergeCells('A3:H3');
          const subInfoCell = ws.getCell('A3');
          subInfoCell.value = `일보ID: ${report.id} | 작성자: ${report.workerName}`;
          subInfoCell.font = { size: 10, color: { argb: 'FF64748B' } };
          subInfoCell.border = thickBorderBottom;

          ws.mergeCells('A5:H5');
          ws.getCell('A5').value = "1. 작업 기본 정보";
          ws.getCell('A5').font = { bold: true, size: 12 };

          ws.getCell('A6').value = "작업 일자";
          ws.getCell('B6').value = report.date;
          ws.getCell('D6').value = "근무 시간";
          ws.getCell('E6').value = report.workHours || '08:00 ~ 17:00';

          ws.getCell('A7').value = "작업자";
          ws.getCell('B7').value = report.workerName;
          ws.getCell('D7').value = "생산 품목";
          ws.mergeCells('E7:H7');
          ws.getCell('E7').value = `[${report.itemCode || ''}] ${report.itemName || ''}`;

          ['A6','B6','D6','E6','A7','B7','D7','E7','F7','G7','H7'].forEach(c => {
            ws.getCell(c).border = thinBorder;
            if(c.startsWith('A') || c.startsWith('D')) {
              ws.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
              ws.getCell(c).font = { bold: true };
            }
          });

          ws.mergeCells('A9:H9');
          ws.getCell('A9').value = "2. 생산 실적 종합";
          ws.getCell('A9').font = { bold: true, size: 12 };

          ['A10','B10','C10','D10'].forEach((c, idx) => {
            const h = ["목표 수량", "생산 완료량", "불량 수량", "달성률"][idx];
            ws.getCell(c).value = h;
            ws.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
            ws.getCell(c).border = thinBorder;
            ws.getCell(c).font = { bold: true };
            ws.getCell(c).alignment = { horizontal: 'center' };
          });

          ['A11','B11','C11','D11'].forEach((c, idx) => {
            const v = [report.targetQty||0, report.actualQty||0, report.defectQty||0, (report.attainmentRate||0)+'%'][idx];
            ws.getCell(c).value = v;
            ws.getCell(c).border = thinBorder;
            ws.getCell(c).alignment = { horizontal: 'center' };
          });
        }
        
        // Add padding to rows
        ws.eachRow((row) => {
          row.height = 18;
        });
        
        const buffer = await wb.xlsx.writeBuffer();
        zip.file(fileName, buffer);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `작업일보_일괄다운로드_${new Date().toISOString().split('T')[0]}.zip`);
    } catch (error) {
      console.error("ZIP 다운로드 오류:", error);
      alert("다운로드 중 오류가 발생했습니다.");
    }
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
            <input type="date" max="9999-12-31" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="form-group" style={{ minWidth: '120px' }}>
            <label style={{ fontSize: '11px' }}>종료일</label>
            <input type="date" max="9999-12-31" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
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
                    <button 
            className="btn btn-outline-secondary btn-sm" 
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setStartDate(today);
              setEndDate(today);
            }}
          >
            당일작성 조회
          </button>
          {userRole?.role !== 'worker' && (
            <button className="btn btn-outline-primary btn-sm" onClick={toggleViewMode}>
              {viewMode === 'list' ? '🪧 제출 현황 보드' : '📋 리스트 보기'}
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={handleResetFilters}>초기화</button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/form')}>
            <span>➕</span> 신규 일보 작성
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
        <div>
          <span>조회 결과: </span>
          <strong style={{ color: 'var(--accent-cyan)' }}>{filteredReports.length}</strong>건
          {searchQuery && reports.length !== filteredReports.length && (
            <span style={{ marginLeft: '6px', color: 'var(--text-muted)' }}>(전체 {reports.length}건 중 검색)</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {userRole?.role !== 'worker' && (
            <>
              <button className="btn btn-info btn-sm" onClick={handleBulkDownloadZIP} style={{ backgroundColor: '#0284c7', color: 'white', border: 'none' }}>
            선택항목 다운로드 (ZIP)
          </button>
          <button className="btn btn-success btn-sm" onClick={handleBulkApprove}>선택 항목 일괄 승인</button>
          <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>선택 항목 일괄 삭제</button>
            </>
          )}
        </div>
      </div>

      
      
      {viewMode === 'board' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px', padding: '16px', backgroundColor: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          {allWorkers.map(w => {
            const userReports = filteredReports.filter(r => r.workerName === w.name);
            const hasSubmitted = userReports.some(r => r.status !== '임시저장');
            const hasDraft = userReports.some(r => r.status === '임시저장');
            const draft = hasDraft ? userReports.find(r => r.status === '임시저장') : null;
            
            let hasLotCho = false, hasDimCho = false;
            let hasLotJung = false, hasDimJung = false;
            let hasLotJong = false, hasDimJong = false;

            if (draft) {
              hasLotCho = draft.materialLots && Object.entries(draft.materialLots).some(([k, v]) => k.includes('초물') && v && String(v).trim() !== '');
              hasDimCho = draft.dimData && Object.entries(draft.dimData).some(([k, v]) => k.includes('초') && v && String(v).trim() !== '');
              hasLotJung = draft.materialLots && Object.entries(draft.materialLots).some(([k, v]) => k.includes('중물') && v && String(v).trim() !== '');
              hasDimJung = draft.dimData && Object.entries(draft.dimData).some(([k, v]) => k.includes('중') && v && String(v).trim() !== '');
              hasLotJong = draft.materialLots && Object.entries(draft.materialLots).some(([k, v]) => k.includes('종물') && v && String(v).trim() !== '');
              hasDimJong = draft.dimData && Object.entries(draft.dimData).some(([k, v]) => k.includes('종') && v && String(v).trim() !== '');
            }

            return (
              <div 
                key={w.id} 
                onClick={() => { setSearchQuery(w.name); setViewMode('list'); }}
                style={{ 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '12px', 
                  padding: '16px', 
                  textAlign: 'center', 
                  backgroundColor: hasSubmitted ? '#f0fdf4' : (hasDraft ? '#f8fafc' : '#fef2f2'), 
                  cursor: 'pointer', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '28px' }}>{hasSubmitted ? '✅' : (hasDraft ? '📝' : '❌')}</div>
                <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#334155' }}>{w.name}</div>
                <div style={{ fontSize: '12px', color: hasSubmitted ? '#166534' : (hasDraft ? '#0369a1' : '#991b1b'), fontWeight: '700' }}>
                  {hasSubmitted ? '제출 완료' : (hasDraft ? '작성 중 (임시저장)' : '미제출')}
                </div>

                {!hasSubmitted && hasDraft && (
                  <div style={{ fontSize: '11px', textAlign: 'left', background: '#fff', padding: '8px', borderRadius: '6px', width: '100%', marginTop: '4px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ color: hasLotCho ? '#15803d' : '#94a3b8', fontWeight: hasLotCho ? 'bold' : 'normal' }}>
                      {hasLotCho ? '✅' : '⏳'} 소재 LOT (초물)
                    </div>
                    <div style={{ color: hasDimCho ? '#15803d' : '#94a3b8', fontWeight: hasDimCho ? 'bold' : 'normal' }}>
                      {hasDimCho ? '✅' : '⏳'} 치수검사 (초물)
                    </div>
                    
                    {(hasLotJung || hasDimJung) && (
                      <>
                        <div style={{ borderTop: '1px dashed #e2e8f0', margin: '2px 0' }}></div>
                        <div style={{ color: hasLotJung ? '#15803d' : '#94a3b8', fontWeight: hasLotJung ? 'bold' : 'normal' }}>
                          {hasLotJung ? '✅' : '⏳'} 소재 LOT (중물)
                        </div>
                        <div style={{ color: hasDimJung ? '#15803d' : '#94a3b8', fontWeight: hasDimJung ? 'bold' : 'normal' }}>
                          {hasDimJung ? '✅' : '⏳'} 치수검사 (중물)
                        </div>
                      </>
                    )}

                    {(hasLotJong || hasDimJong) && (
                      <>
                        <div style={{ borderTop: '1px dashed #e2e8f0', margin: '2px 0' }}></div>
                        <div style={{ color: hasLotJong ? '#15803d' : '#94a3b8', fontWeight: hasLotJong ? 'bold' : 'normal' }}>
                          {hasLotJong ? '✅' : '⏳'} 소재 LOT (종물)
                        </div>
                        <div style={{ color: hasDimJong ? '#15803d' : '#94a3b8', fontWeight: hasDimJong ? 'bold' : 'normal' }}>
                          {hasDimJong ? '✅' : '⏳'} 치수검사 (종물)
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
      <div className="table-container">
        {loading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>Loading...</div>
        ) : (
          <table className="data-table responsive-data-table">
            <thead>
              {/* 데스크탑 헤더 */}
              <tr className="desktop-row">
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input type="checkbox" onChange={handleSelectAll} checked={filteredReports.length > 0 && selectedIds.length === filteredReports.length} />
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

              {/* 모바일 헤더 */}
              <tr className="mobile-row mobile-row-top">
                <th rowSpan="2" style={{ textAlign: 'center', borderRight: 'none', width: '80px', verticalAlign: 'middle' }}>관리</th>
                <th style={{ borderBottom: 'none' }}>작업일자</th>
                <th style={{ borderBottom: 'none' }}>공정명</th>
                <th style={{ borderBottom: 'none' }}>생산품목</th>
                <th style={{ textAlign: 'right', borderBottom: 'none' }}>완료</th>
                <th rowSpan="2" style={{ textAlign: 'center', borderLeft: 'none', verticalAlign: 'middle' }}>일보 아이디</th>
              </tr>
              <tr className="mobile-row mobile-row-bottom">
                <th style={{ borderTop: 'none' }}>차 종</th>
                <th style={{ borderTop: 'none' }}>작업자</th>
                <th style={{ borderTop: 'none' }}>상 태</th>
                <th style={{ borderTop: 'none', textAlign: 'right' }}>불량</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map(r => (
                <React.Fragment key={r.id}>
                  {/* 데스크탑 데이터 행 */}
                  <tr className="desktop-row">
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
                        <button className="btn btn-secondary btn-sm" onClick={() => setSelectedReportForModal(r)} title="상세보기(인쇄)">👁️</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/form', { state: { existingData: r } })} title="수정">✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(r.id)} title="삭제">🗑️</button>
                      </div>
                    </td>
                  </tr>

                  {/* 모바일 데이터 행 1 */}
                  <tr className="mobile-row mobile-row-top">
                    <td rowSpan="2" style={{ borderRight: 'none', verticalAlign: 'middle', padding: '6px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                        <button className="btn btn-sm" onClick={() => setSelectedReportForModal(r)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0', fontSize: '12px', background: 'transparent', border: 'none', color: 'var(--text-main)', boxShadow: 'none' }}>
                          <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#164e63', border: '1px solid #083344', flexShrink: 0 }}></div>
                          <span style={{ width: '45px', textAlign: 'center' }}>상세보기</span>
                        </button>
                        <button className="btn btn-sm" onClick={() => navigate('/form', { state: { existingData: r } })} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0', fontSize: '12px', background: 'transparent', border: 'none', color: 'var(--text-main)', boxShadow: 'none' }}>
                          <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#164e63', border: '1px solid #083344', flexShrink: 0 }}></div>
                          <span style={{ width: '45px', textAlign: 'center' }}>이어작성</span>
                        </button>
                        <button className="btn btn-sm" onClick={() => handleDelete(r.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0', fontSize: '12px', background: 'transparent', border: 'none', color: 'var(--text-main)', boxShadow: 'none' }}>
                          <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#164e63', border: '1px solid #083344', flexShrink: 0 }}></div>
                          <span style={{ width: '45px', display: 'flex', justifyContent: 'space-between' }}><span>삭</span><span>제</span></span>
                        </button>
                      </div>
                    </td>
                    <td style={{ borderBottom: 'none', padding: '6px', fontSize: '11px' }}>{r.date}</td>
                    <td style={{ borderBottom: 'none', padding: '6px', fontSize: '11px' }}><span style={{ fontWeight: 700 }}>{r.processName}</span></td>
                    <td style={{ borderBottom: 'none', padding: '6px', fontSize: '11px' }}><div style={{ fontWeight: 600 }}>{r.itemName || '기본 품목'}</div></td>
                    <td style={{ borderBottom: 'none', padding: '6px', fontSize: '11px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-emerald)' }}>{r.actualQty?.toLocaleString()} EA</td>
                    <td rowSpan="2" style={{ borderLeft: 'none', padding: '6px', verticalAlign: 'middle', textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-cyan)', fontSize: '11px' }}>
                      <div style={{ wordBreak: 'break-all' }}>{r.id}</div>
                    </td>
                  </tr>
                  
                  {/* 모바일 데이터 행 2 */}
                  <tr className="mobile-row mobile-row-bottom">
                    <td style={{ borderTop: 'none', padding: '6px', fontSize: '11px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--accent-emerald)', background: 'rgba(5,150,105,0.12)', padding: '2px 4px', borderRadius: '4px' }}>{r.carModel}</span>
                    </td>
                    <td style={{ borderTop: 'none', padding: '6px', fontSize: '11px', fontWeight: 700 }}>{r.workerName}</td>
                    <td style={{ borderTop: 'none', padding: '6px', fontSize: '11px' }}>
                      <span className={`status-badge ${r.status === '승인 완료' ? 'approved' : r.status === '반려' ? 'rejected' : r.status === '임시저장' ? 'draft' : 'pending'}`} style={{ padding: '2px 4px', fontSize: '10px' }}>
                        {r.status}
                      </span>
                    </td>
                    <td style={{ borderTop: 'none', padding: '6px', fontSize: '11px', textAlign: 'right', color: r.defectQty > 0 ? 'var(--accent-rose)' : 'var(--text-muted)' }}>
                      {r.defectQty?.toLocaleString()} EA
                    </td>
                  </tr>
                </React.Fragment>
              ))}
              {filteredReports.length === 0 && (
                <tr className="desktop-row">
                  <td colSpan="12" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                    조건에 일치하는 작업일보가 없습니다.
                  </td>
                </tr>
              )}
              {filteredReports.length === 0 && (
                <tr className="mobile-row">
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                    조건에 일치하는 작업일보가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      )}

      <LegacyDetailModal 
        report={selectedReportForModal} 
        onClose={() => setSelectedReportForModal(null)} 
      />
    </div>
  );
}