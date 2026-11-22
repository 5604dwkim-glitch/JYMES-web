import React from 'react';

export const CALIBRATION_INSTRUMENT_FILTER_COLUMNS = [
  { key: 'code', label: '관리번호' },
  { key: 'name', label: '계측기명' },
  { key: 'serialNo', label: '기기번호' },
  { key: 'type', label: '계량분야' },
  { key: 'spec', label: '측정범위' },
  { key: 'calibrationCycle', label: '주기' },
  { key: 'calibrationDate', label: '검교정일' },
  { key: 'nextCalibrationDate', label: '차기교정일' },
  { key: 'manufacturer', label: '제조 회사' },
  { key: 'installDate', label: '구입년도' },
  { key: 'location', label: '보관처' },
  { key: 'manager', label: '관리자' },
  { key: 'calibrationAgency', label: '교정 주관' }
];

export const CALIBRATION_EQUIPMENT_FILTER_COLUMNS = [
  { key: 'location', label: '위치' },
  { key: 'code', label: '관리번호' },
  { key: 'name', label: '설비명' },
  { key: 'serialNo', label: '기기번호' },
  { key: 'type', label: '계량분야' },
  { key: 'spec', label: '측정범위' },
  { key: 'calibrationCycle', label: '주기' },
  { key: 'calibrationDate', label: '검교정일' },
  { key: 'nextCalibrationDate', label: '차기교정일' },
  { key: 'manufacturer', label: '제조 회사' },
  { key: 'installDate', label: '구입년도' },
  { key: 'storageLocation', label: '보관처' },
  { key: 'manager', label: '관리자' },
  { key: 'calibrationAgency', label: '교정 주관' }
];

export function formatCalDotDate(raw) {
  const s = String(raw || '').trim();
  if (!s || s === '-') return '-';
  const m = s.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (!m) return s;
  return `${m[1]}.${m[2].padStart(2, '0')}.${m[3].padStart(2, '0')}`;
}

export function normalizeCalIsoDate(raw) {
  const s = String(raw || '').trim();
  if (!s || s === '-') return '';
  const m = s.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/);
  if (!m) return '';
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
}

export function computeNextCalibrationIsoDate(calDateRaw, cycleRaw) {
  const iso = normalizeCalIsoDate(calDateRaw);
  if (!iso) return '';
  const cycle = String(cycleRaw || '').trim();
  const yearMatch = cycle.match(/(\d+)\s*년/);
  const monthMatch = cycle.match(/(\d+)\s*개?월/);
  if (!yearMatch && !monthMatch) return '';
  const [yStr, mStr, dStr] = iso.split('-');
  const d = new Date(Number(yStr), Number(mStr) - 1, Number(dStr));
  if (Number.isNaN(d.getTime())) return '';
  if (yearMatch) d.setFullYear(d.getFullYear() + Number(yearMatch[1]));
  if (monthMatch) d.setMonth(d.getMonth() + Number(monthMatch[1]));
  const yy = String(d.getFullYear()).padStart(4, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function shiftIsoMonths(iso, deltaMonths) {
  if (!iso) return '';
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return '';
  const [y, m, d] = parts;
  const targetFirst = new Date(y, m - 1 + deltaMonths, 1);
  const lastDayOfTargetMonth = new Date(
    targetFirst.getFullYear(),
    targetFirst.getMonth() + 1,
    0
  ).getDate();
  const clampedDay = Math.min(d, lastDayOfTargetMonth);
  const yy = String(targetFirst.getFullYear()).padStart(4, '0');
  const mm = String(targetFirst.getMonth() + 1).padStart(2, '0');
  const dd = String(clampedDay).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function getCalibrationAlertStatus(eq, todayIso = new Date().toLocaleDateString('sv-SE')) {
  const nextIso =
    normalizeCalIsoDate(eq?.nextCalibrationDate) ||
    computeNextCalibrationIsoDate(eq?.calibrationDate, eq?.calibrationCycle);
  if (!nextIso) {
    return { nextIso: '', isOverdue: false, isDueSoon: false, isAlert: false };
  }
  const warnFromIso = shiftIsoMonths(nextIso, -1);
  const isOverdue = nextIso < todayIso;
  const isDueSoon = !isOverdue && Boolean(warnFromIso && todayIso >= warnFromIso);
  return {
    nextIso,
    isOverdue,
    isDueSoon,
    isAlert: isOverdue || isDueSoon
  };
}

export function getCalibrationInstrumentColValue(eq, key) {
  if (!eq) return '-';
  if (key === 'serialNo') {
    const v = String(eq.serialNo || eq.assetNo || '').trim();
    return v || '-';
  }
  if (key === 'calibrationDate' || key === 'nextCalibrationDate' || key === 'installDate') {
    return formatCalDotDate(eq[key]);
  }
  const raw = eq[key];
  const trimmed = raw !== undefined && raw !== null ? String(raw).trim() : '';
  return trimmed || '-';
}

export function getCalibrationEquipmentColValue(eq, key) {
  if (!eq) return '-';
  if (key === 'storageLocation') {
    const v = String(eq.storageLocation || '').trim();
    return v || '-';
  }
  return getCalibrationInstrumentColValue(eq, key);
}

function escapeHtml(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function openCalibrationSheetPrint(rows, variant = 'instrument') {
  const isEquip = variant === 'equipment';
  const sheetTitle = isEquip ? '설비 검교정 LIST' : '계측기 검교정 LIST';
  const todayIso = new Date().toLocaleDateString('sv-SE');
  const win = window.open('', '_blank', 'width=1200,height=800');
  if (!win) {
    alert('팝업이 차단되어 인쇄 창을 열 수 없습니다. 팝업 허용 후 다시 시도해 주세요.');
    return;
  }
  const bodyRowsHtml = rows
    .map((eq, idx) => {
      const { isAlert } = getCalibrationAlertStatus(eq, todayIso);
      return `
      <tr class="${isAlert ? 'cal-alert-row' : ''}">
        <td>${idx + 1}</td>
        ${isEquip ? `<td>${escapeHtml(eq.location || '-')}</td>` : ''}
        <td>${escapeHtml(eq.code || '-')}</td>
        <td>${escapeHtml(eq.name || '-')}</td>
        <td>${escapeHtml(eq.serialNo || eq.assetNo || '-')}</td>
        <td>${escapeHtml(eq.type || '-')}</td>
        <td>${escapeHtml(eq.spec || '-')}</td>
        <td>${escapeHtml(eq.calibrationCycle || '-')}</td>
        <td>${escapeHtml(formatCalDotDate(eq.calibrationDate))}</td>
        <td>${escapeHtml(formatCalDotDate(eq.nextCalibrationDate))}</td>
        <td>${escapeHtml(eq.manufacturer || '-')}</td>
        <td>${escapeHtml(formatCalDotDate(eq.installDate))}</td>
        <td>${escapeHtml(isEquip ? eq.storageLocation || '-' : eq.location || '-')}</td>
        <td>${escapeHtml(eq.manager || '-')}</td>
        <td>${escapeHtml(eq.calibrationAgency || '-')}</td>
      </tr>`;
    })
    .join('');

  win.document.write(`<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>${sheetTitle}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; margin: 0; color: #0f172a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .banner {
      display: flex; align-items: center; justify-content: center;
      background: #f1f5f9; border: 1px solid #cbd5e1; border-bottom: none;
      padding: 12px 16px;
    }
    .title { font-size: 22px; font-weight: 800; letter-spacing: 0.04em; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; table-layout: auto; }
    th, td { border: 1px solid #cbd5e1; padding: 6px 6px; text-align: center; font-size: 11px; }
    th { background: #f8fafc; font-weight: 700; color: #1e293b; }
    td { background: #fff; }
    tr.cal-alert-row td { background: #fef2f2; }
  </style>
</head>
<body>
  <div class="banner">
    <span class="title">${sheetTitle}</span>
  </div>
  <table>
    <thead>
      <tr>
        <th rowspan="2">${isEquip ? '순번' : 'NO'}</th>
        ${isEquip ? '<th rowspan="2">위치</th>' : ''}
        <th rowspan="2">관리번호</th>
        <th rowspan="2">${isEquip ? '설비명' : '계측기명'}</th>
        <th rowspan="2">기기번호</th>
        <th colspan="2">규 격</th>
        <th colspan="3">검교정</th>
        <th colspan="2">구매관련</th>
        <th colspan="2">관리현황</th>
        <th rowspan="2">교정 주관</th>
      </tr>
      <tr>
        <th>계량분야</th>
        <th>측정범위</th>
        <th>주기</th>
        <th>검교정일</th>
        <th>차기교정일</th>
        <th>제조 회사</th>
        <th>구입년도</th>
        <th>보관처</th>
        <th>관리자</th>
      </tr>
    </thead>
    <tbody>${bodyRowsHtml}</tbody>
  </table>
</body>
</html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 200);
}

export default function CalibrationInstrumentListView({
  variant = 'instrument',
  totalCount,
  filteredEquipments,
  colFilters,
  openFilterCol,
  activeFilterEntries,
  onToggleFilterPopover,
  onClearColumnFilter,
  onClearAllFilters,
  onOpenCreate,
  onOpenEdit,
  onOpenHistory,
  onDelete
}) {
  const isEquip = variant === 'equipment';
  const sheetTitle = isEquip ? '⚙️ 설비 검교정 LIST' : '📏 계측기 검교정 LIST';
  const addBtnText = isEquip ? '+ 신규 검교정 설비 등록' : '+ 신규 계측기 등록';
  const totalColCount = isEquip ? 16 : 15;
  const todayIso = new Date().toLocaleDateString('sv-SE');

  const renderFilterHeaderButton = (colKey, label) => {
    const selectedVals = colFilters[colKey] || [];
    const isFiltered = selectedVals.length > 0;
    const isOpen = openFilterCol === colKey;
    return (
      <button
        type="button"
        data-eq-filter-btn={colKey}
        data-active={isFiltered ? '1' : '0'}
        onClick={(e) => onToggleFilterPopover(colKey, e.currentTarget)}
        title={`${label} 필터 선택`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          padding: '2px 4px',
          borderRadius: '4px',
          border: isFiltered || isOpen ? '1px solid #2563eb' : '1px solid transparent',
          background: isFiltered ? '#eff6ff' : isOpen ? 'rgba(255,255,255,0.65)' : 'transparent',
          color: isFiltered ? '#1d4ed8' : '#0f172a',
          fontWeight: 800,
          fontSize: 'inherit',
          fontFamily: 'inherit',
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }}
      >
        <span>{label}</span>
        <span style={{ fontSize: '9.5px', color: isFiltered ? '#2563eb' : '#475569' }}>
          {isFiltered ? `▼(${selectedVals.length})` : '▾'}
        </span>
      </button>
    );
  };

  return (
    <div data-cal-instrument-list="1">
      <style>{`
        [data-cal-instrument-list="1"] .cal-sheet-table th,
        [data-cal-instrument-list="1"] .cal-sheet-table td {
          border: 1px solid #cbd5e1;
          text-align: center;
          vertical-align: middle;
        }
        [data-cal-instrument-list="1"] .cal-sheet-table thead tr:first-child th {
          background: #f1f5f9;
        }
        [data-cal-instrument-list="1"] .cal-sheet-table thead tr:nth-child(2) th {
          background: #f8fafc;
        }
        [data-cal-instrument-list="1"] .cal-sheet-table th {
          color: #1e293b;
          font-weight: 700;
          font-size: 12px;
          padding: 7px 8px;
          white-space: nowrap;
        }
        [data-cal-instrument-list="1"] .cal-sheet-table td {
          background: #ffffff;
          color: #0f172a;
          font-size: 12.5px;
          padding: 8px 8px;
          white-space: nowrap;
        }
        [data-cal-instrument-list="1"] .cal-sheet-table tbody tr:hover td {
          background: #f8fafc;
        }
        [data-cal-instrument-list="1"] .cal-sheet-table tbody tr[data-cal-alert="1"] td {
          background: #fef2f2;
        }
        [data-cal-instrument-list="1"] .cal-sheet-table tbody tr[data-cal-alert="1"]:hover td {
          background: #fee2e2;
        }
        [data-cal-instrument-list="1"] button[data-eq-filter-btn]:hover {
          background: #e2e8f0 !important;
        }
        [data-cal-instrument-list="1"] button[data-eq-filter-btn][data-active="1"]:hover {
          background: #dbeafe !important;
        }
      `}</style>

      {/* 상단 제목 바 (조인트 설비 리스트와 동일한 깔끔한 톤) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          flexWrap: 'wrap',
          marginBottom: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0 }}>
            {sheetTitle}
          </h3>
          <span
            style={{
              fontSize: '12px',
              color: '#475569',
              background: '#f1f5f9',
              padding: '3px 8px',
              borderRadius: '999px',
              fontWeight: 600
            }}
          >
            {activeFilterEntries.length > 0
              ? `필터 결과 ${filteredEquipments.length} / ${totalCount}대`
              : `전체 ${totalCount}대`}
          </span>
          {activeFilterEntries.length === 0 && (
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              항목 제목(▾)을 클릭하여 조건별 필터를 선택할 수 있습니다.
            </span>
          )}
          <span
            style={{
              fontSize: '11.5px',
              color: '#b91c1c',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              padding: '2px 8px',
              borderRadius: '999px',
              fontWeight: 600
            }}
          >
            차기교정일 1개월 전~초과
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => openCalibrationSheetPrint(filteredEquipments, variant)}
            style={{
              background: '#f8fafc',
              color: '#334155',
              border: '1px solid #cbd5e1',
              fontWeight: 600,
              padding: '7px 12px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            🖨️ 양식 인쇄
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenCreate}
          >
            {addBtnText}
          </button>
        </div>
      </div>

      {/* 활성 필터 칩 바 */}
      {activeFilterEntries.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
            marginBottom: '12px',
            padding: '8px 12px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px'
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginRight: '4px' }}>
            적용 필터:
          </span>
          {activeFilterEntries.map((col) => {
            const vals = colFilters[col.key] || [];
            const summary = vals.length === 1 ? vals[0] : `${vals[0]} 외 ${vals.length - 1}건`;
            return (
              <span
                key={col.key}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: '#dbeafe',
                  color: '#1e40af',
                  border: '1px solid #93c5fd'
                }}
              >
                {col.label}: {summary}
                <button
                  type="button"
                  onClick={() => onClearColumnFilter(col.key)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#1e40af',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '13px',
                    lineHeight: 1,
                    padding: '0 2px'
                  }}
                  title={`${col.label} 필터 해제`}
                >
                  &times;
                </button>
              </span>
            );
          })}
          <button
            type="button"
            onClick={onClearAllFilters}
            style={{
              marginLeft: '4px',
              padding: '3px 8px',
              fontSize: '12px',
              fontWeight: 600,
              background: '#fff',
              color: '#475569',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            전체 필터 초기화
          </button>
        </div>
      )}

      {/* 2단 그룹 헤더 계측기 검교정 테이블 */}
      <div style={{ overflowX: 'auto' }}>
        <table
          className="cal-sheet-table"
          style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1180px' }}
        >
          <thead>
            <tr>
              <th rowSpan={2} style={{ width: '48px' }}>
                {isEquip ? '순번' : 'NO'}
              </th>
              {isEquip && <th rowSpan={2}>{renderFilterHeaderButton('location', '위치')}</th>}
              <th rowSpan={2}>{renderFilterHeaderButton('code', '관리번호')}</th>
              <th rowSpan={2}>{renderFilterHeaderButton('name', isEquip ? '설비명' : '계측기명')}</th>
              <th rowSpan={2}>{renderFilterHeaderButton('serialNo', '기기번호')}</th>
              <th colSpan={2} style={{ letterSpacing: '0.25em' }}>
                규 격
              </th>
              <th colSpan={3}>검교정</th>
              <th colSpan={2}>구매관련</th>
              <th colSpan={2}>관리현황</th>
              <th rowSpan={2}>{renderFilterHeaderButton('calibrationAgency', '교정 주관')}</th>
              <th rowSpan={2} style={{ width: '150px' }}>
                관리
              </th>
            </tr>
            <tr>
              <th>{renderFilterHeaderButton('type', '계량분야')}</th>
              <th>{renderFilterHeaderButton('spec', '측정범위')}</th>
              <th>{renderFilterHeaderButton('calibrationCycle', '주기')}</th>
              <th>{renderFilterHeaderButton('calibrationDate', '검교정일')}</th>
              <th>{renderFilterHeaderButton('nextCalibrationDate', '차기교정일')}</th>
              <th>{renderFilterHeaderButton('manufacturer', '제조 회사')}</th>
              <th>{renderFilterHeaderButton('installDate', '구입년도')}</th>
              <th>{renderFilterHeaderButton(isEquip ? 'storageLocation' : 'location', '보관처')}</th>
              <th>{renderFilterHeaderButton('manager', '관리자')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredEquipments.map((eq, idx) => {
              const { isOverdue, isDueSoon, isAlert } = getCalibrationAlertStatus(eq, todayIso);
              return (
                <tr key={eq.id} data-cal-alert={isAlert ? '1' : undefined}>
                  <td style={{ fontWeight: 700, color: '#334155' }}>{idx + 1}</td>
                  {isEquip && <td style={{ fontWeight: 600 }}>{eq.location || '-'}</td>}
                  <td style={{ fontWeight: 700 }}>{eq.code || '-'}</td>
                  <td style={{ fontWeight: 800 }}>{eq.name || '-'}</td>
                  <td>{eq.serialNo || eq.assetNo || '-'}</td>
                  <td>{eq.type || '-'}</td>
                  <td>{eq.spec || '-'}</td>
                  <td>{eq.calibrationCycle || '-'}</td>
                  <td>{formatCalDotDate(eq.calibrationDate)}</td>
                  <td
                    style={{
                      fontWeight: isAlert ? 800 : 500,
                      color: isOverdue ? '#b91c1c' : isDueSoon ? '#dc2626' : '#0f172a'
                    }}
                    title={
                      isOverdue
                        ? '차기교정일 경과'
                        : isDueSoon
                          ? '차기교정일 1개월 이내 도래'
                          : undefined
                    }
                  >
                    {formatCalDotDate(eq.nextCalibrationDate)}
                  </td>
                  <td>{eq.manufacturer || '-'}</td>
                  <td>{formatCalDotDate(eq.installDate)}</td>
                  <td>{isEquip ? eq.storageLocation || '-' : eq.location || '-'}</td>
                  <td>{eq.manager || '-'}</td>
                  <td>{eq.calibrationAgency || '-'}</td>
                  <td>
                    <div style={{ display: 'inline-flex', gap: '4px', justifyContent: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          border: '1px solid #bfdbfe',
                          borderRadius: '4px',
                          padding: '3px 7px',
                          fontSize: '11.5px',
                          cursor: 'pointer'
                        }}
                        onClick={() => onOpenEdit(eq)}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm"
                        style={{
                          background: '#e2e8f0',
                          color: '#1e293b',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '3px 7px',
                          fontSize: '11.5px',
                          cursor: 'pointer'
                        }}
                        onClick={() => onOpenHistory(eq)}
                      >
                        이력카드
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{
                          background: '#fee2e2',
                          color: '#991b1b',
                          border: '1px solid #fecaca',
                          borderRadius: '4px',
                          padding: '3px 7px',
                          fontSize: '11.5px',
                          cursor: 'pointer'
                        }}
                        onClick={() => onDelete(eq.id)}
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {totalCount === 0 && (
              <tr>
                <td colSpan={totalColCount} style={{ padding: '32px 20px', color: '#64748b' }}>
                  <div style={{ fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    {isEquip ? '등록된 검교정 설비가 없습니다.' : '등록된 검교정 계측기가 없습니다.'}
                  </div>
                  <div style={{ fontSize: '12px', marginBottom: '12px' }}>
                    우측 상단의 <strong>{addBtnText}</strong> 버튼을 눌러 등록을 시작하세요.
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onOpenCreate}
                    style={{ fontSize: '13px', padding: '6px 14px' }}
                  >
                    {addBtnText}
                  </button>
                </td>
              </tr>
            )}

            {totalCount > 0 && filteredEquipments.length === 0 && (
              <tr>
                <td colSpan={totalColCount} style={{ padding: '24px', color: '#64748b' }}>
                  {isEquip
                    ? '선택한 필터 조건에 일치하는 검교정 설비가 없습니다. '
                    : '선택한 필터 조건에 일치하는 계측기가 없습니다. '}
                  <button
                    type="button"
                    onClick={onClearAllFilters}
                    style={{
                      marginLeft: '8px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #93c5fd',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    필터 초기화
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
