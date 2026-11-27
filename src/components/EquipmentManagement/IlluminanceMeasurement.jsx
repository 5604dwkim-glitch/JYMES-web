import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import {
  ILLUMINANCE_BUILDING_MAPS,
  ILLUMINANCE_COLLECTION,
  ILLUMINANCE_JUDGEMENT,
  ILLUMINANCE_LOCATION_SUGGESTIONS,
  ILLUMINANCE_META,
  ILLUMINANCE_MONTHS,
  ILLUMINANCE_PAPER_SPEC,
  ILLUMINANCE_POINTS,
  ILLUMINANCE_TARGET_COMPANY,
  createInitialIlluminanceForm,
  findIlluminancePoint,
  getFirstWeekSchedule,
  judgeIlluminance,
  toLuxNumber
} from '../../constants/illuminanceMeasurement';
import { exportIlluminanceLedgerToExcel } from '../../utils/illuminanceExcelExport';

const FILTER_COLUMNS = [
  { key: 'date', label: '측정일' },
  { key: 'measureTime', label: '측정시간' },
  { key: 'location', label: '측정공정' },
  { key: 'standardLux', label: '표준 lux' },
  { key: 'measuredLux', label: '측정값(lux)' },
  { key: 'judgement', label: '판정' },
  { key: 'instrument', label: '측정기' },
  { key: 'measurer', label: '측정자' }
];

function getColValue(row, key) {
  if (key === 'judgement') return judgeIlluminance(row.measuredLux, row.standardLux);
  const raw = row?.[key];
  const v = raw !== undefined && raw !== null ? String(raw).trim() : '';
  return v || '-';
}

function parseYearMonthFromRow(row) {
  if (row?.year && row?.month) {
    return { year: Number(row.year), month: Number(row.month) };
  }
  const d = String(row?.date || '').trim();
  const m = d.match(/^(\d{4})[-./](\d{1,2})/);
  if (m) {
    return { year: Number(m[1]), month: Number(m[2]) };
  }
  return null;
}

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 700,
  color: '#334155',
  marginBottom: '4px'
};

export default function IlluminanceMeasurement() {
  const { userRole } = useAuth();
  const { td } = useI18n();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [selectedYear, setSelectedYear] = useState(currentYear >= 2026 ? currentYear : 2026);
  const [activeViewTab, setActiveViewTab] = useState('ledger'); // 'ledger' | 'maps' | 'history'
  const [showMapPanelInLedger, setShowMapPanelInLedger] = useState(true);
  const [activeMapId, setActiveMapId] = useState('overview');
  const [selectedPointNo, setSelectedPointNo] = useState(1);
  const [zoomImageModal, setZoomImageModal] = useState(null);
  const [includeMapsOnPrint, setIncludeMapsOnPrint] = useState(false);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // 대장 인라인 편집 드래프트: { cells: { [pointNo]: { [month]: string } }, meta: { [month]: { date, measureTime } } }
  const [ledgerDraft, setLedgerDraft] = useState({ cells: {}, meta: {} });
  const [isLedgerDirty, setIsLedgerDirty] = useState(false);
  const [savingLedger, setSavingLedger] = useState(false);

  // 매월 첫째주 일괄 기록 모달 상태
  const [showMonthlyModal, setShowMonthlyModal] = useState(false);
  const [monthlyForm, setMonthlyForm] = useState(() => {
    const sched = getFirstWeekSchedule(2026, currentMonth);
    const values = {};
    ILLUMINANCE_POINTS.forEach((pt) => {
      values[pt.no] = '';
    });
    return {
      year: 2026,
      month: currentMonth,
      date: sched.defaultDate,
      measureTime: sched.defaultTime,
      instrument: '',
      measurer: '',
      remark: '',
      values
    };
  });
  const [savingMonthly, setSavingMonthly] = useState(false);

  // 개별 기록 리스트용 필터 & 모달
  const [filters, setFilters] = useState({});
  const [openFilterCol, setOpenFilterCol] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(() => createInitialIlluminanceForm(1));

  const loadRows = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const snap = await getDocs(collection(db, ILLUMINANCE_COLLECTION));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const cmpDate = String(b.date || '').localeCompare(String(a.date || ''));
        if (cmpDate !== 0) return cmpDate;
        return (Number(a.pointNo) || 99) - (Number(b.pointNo) || 99);
      });
      setRows(list);
    } catch (err) {
      console.error('조도 측정 기록 조회 실패:', err);
      setLoadError('조도 측정 기록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRows();
  }, []);

  // 실제 측정 이력 행 (월 메타 전용 문서 제외)
  const historyRows = useMemo(
    () => rows.filter((r) => r.recordType !== 'month_meta'),
    [rows]
  );

  // 선택 연도의 대장 매트릭스 및 월별 측정일·측정시간 집계
  const { ledgerMatrix, monthMeta } = useMemo(() => {
    const matrix = {};
    ILLUMINANCE_POINTS.forEach((pt) => {
      matrix[pt.no] = {};
    });
    const meta = {};
    ILLUMINANCE_MONTHS.forEach((m) => {
      meta[m] = { date: '', measureTime: '', instrument: '', measurer: '', metaDocId: '' };
    });

    // 오래된 순 -> 최신 순으로 덮어써서 가장 최근 측정값이 대장에 반영되도록 처리
    const chronological = [...rows].sort((a, b) =>
      String(a.updatedAt || a.date || '').localeCompare(String(b.updatedAt || b.date || ''))
    );

    chronological.forEach((r) => {
      const ym = parseYearMonthFromRow(r);
      if (!ym || ym.year !== Number(selectedYear) || ym.month < 1 || ym.month > 12) return;
      const m = ym.month;

      if (r.recordType === 'month_meta') {
        meta[m] = {
          ...meta[m],
          date: r.date || meta[m].date,
          measureTime: r.measureTime || meta[m].measureTime,
          instrument: r.instrument || meta[m].instrument,
          measurer: r.measurer || meta[m].measurer,
          metaDocId: r.id
        };
        return;
      }

      const pt = findIlluminancePoint(r.pointNo || r.location);
      if (!pt) return;

      matrix[pt.no][m] = {
        id: r.id,
        pointNo: pt.no,
        location: pt.name,
        standardLux: pt.standardLux,
        measuredLux: r.measuredLux ?? '',
        date: r.date || '',
        measureTime: r.measureTime || '',
        instrument: r.instrument || '',
        measurer: r.measurer || '',
        remark: r.remark || ''
      };

      if (r.date) meta[m].date = r.date;
      if (r.measureTime) meta[m].measureTime = r.measureTime;
      if (r.instrument) meta[m].instrument = r.instrument;
      if (r.measurer) meta[m].measurer = r.measurer;
    });

    return { ledgerMatrix: matrix, monthMeta: meta };
  }, [rows, selectedYear]);

  // 연도 또는 서버 데이터 변경 시 대장 드래프트 동기화
  useEffect(() => {
    const nextCells = {};
    ILLUMINANCE_POINTS.forEach((pt) => {
      nextCells[pt.no] = {};
      ILLUMINANCE_MONTHS.forEach((m) => {
        const val = ledgerMatrix?.[pt.no]?.[m]?.measuredLux;
        nextCells[pt.no][m] = val !== undefined && val !== null && val !== '' ? String(val) : '';
      });
    });
    const nextMeta = {};
    ILLUMINANCE_MONTHS.forEach((m) => {
      nextMeta[m] = {
        date: monthMeta?.[m]?.date || '',
        measureTime: monthMeta?.[m]?.measureTime || ''
      };
    });
    setLedgerDraft({ cells: nextCells, meta: nextMeta });
    setIsLedgerDirty(false);
  }, [ledgerMatrix, monthMeta, selectedYear]);

  const selectedPoint = useMemo(
    () => findIlluminancePoint(selectedPointNo) || ILLUMINANCE_POINTS[0],
    [selectedPointNo]
  );

  const activeMap = useMemo(
    () => ILLUMINANCE_BUILDING_MAPS.find((m) => m.id === activeMapId) || ILLUMINANCE_BUILDING_MAPS[0],
    [activeMapId]
  );

  const optionsByCol = useMemo(() => {
    const map = {};
    FILTER_COLUMNS.forEach((col) => {
      map[col.key] = [...new Set(historyRows.map((r) => getColValue(r, col.key)))].sort();
    });
    return map;
  }, [historyRows]);

  const filteredRows = useMemo(
    () =>
      historyRows.filter((r) =>
        FILTER_COLUMNS.every((col) => {
          const sel = filters[col.key];
          return !sel || sel.length === 0 || sel.includes(getColValue(r, col.key));
        })
      ),
    [historyRows, filters]
  );

  const activeFilterEntries = FILTER_COLUMNS.filter((c) => (filters[c.key] || []).length > 0);

  // 선택 연도 요약 통계
  const annualStats = useMemo(() => {
    let recordedMonths = 0;
    let totalCells = 0;
    let passCells = 0;
    let failCells = 0;

    ILLUMINANCE_MONTHS.forEach((m) => {
      let monthHasRecord = false;
      ILLUMINANCE_POINTS.forEach((pt) => {
        const raw = ledgerDraft.cells?.[pt.no]?.[m];
        const num = toLuxNumber(raw);
        if (num !== null) {
          monthHasRecord = true;
          totalCells += 1;
          if (num >= pt.standardLux) passCells += 1;
          else failCells += 1;
        }
      });
      if (monthHasRecord) recordedMonths += 1;
    });

    return { recordedMonths, totalCells, passCells, failCells };
  }, [ledgerDraft]);

  if (userRole?.role === 'worker') {
    return <Navigate to="/" replace />;
  }

  // 측정공정 선택 시 해당 동의 상세 도면도 함께 연동
  const handleSelectPoint = (pointNo, switchMap = false) => {
    const pt = findIlluminancePoint(pointNo);
    if (!pt) return;
    setSelectedPointNo(pt.no);
    if (switchMap && pt.mapId) {
      setActiveMapId(pt.mapId);
    }
  };

  // 대장 셀 값 변경
  const handleLedgerCellChange = (pointNo, month, value) => {
    setLedgerDraft((prev) => ({
      ...prev,
      cells: {
        ...prev.cells,
        [pointNo]: {
          ...(prev.cells?.[pointNo] || {}),
          [month]: value
        }
      }
    }));
    setIsLedgerDirty(true);
  };

  // 대장 하단 측정일/측정시간 변경
  const handleLedgerMetaChange = (month, field, value) => {
    setLedgerDraft((prev) => ({
      ...prev,
      meta: {
        ...prev.meta,
        [month]: {
          ...(prev.meta?.[month] || { date: '', measureTime: '' }),
          [field]: value
        }
      }
    }));
    setIsLedgerDirty(true);
  };

  // 해당 월 또는 전체 월의 첫째주 측정일/측정시간 자동 채움
  const handleAutoFillFirstWeekDates = (targetMonth = null) => {
    setLedgerDraft((prev) => {
      const nextMeta = { ...prev.meta };
      const monthsToFill = targetMonth ? [targetMonth] : ILLUMINANCE_MONTHS;
      monthsToFill.forEach((m) => {
        const sched = getFirstWeekSchedule(selectedYear, m);
        const cur = nextMeta[m] || { date: '', measureTime: '' };
        nextMeta[m] = {
          date: cur.date || sched.defaultDate,
          measureTime: cur.measureTime || sched.defaultTime
        };
      });
      return { ...prev, meta: nextMeta };
    });
    setIsLedgerDirty(true);
  };

  // 대장 전체 변경사항 일괄 저장
  const handleSaveLedgerAll = async () => {
    setSavingLedger(true);
    try {
      const batch = writeBatch(db);
      const nowIso = new Date().toISOString();

      ILLUMINANCE_MONTHS.forEach((m) => {
        const mm = String(m).padStart(2, '0');
        const sched = getFirstWeekSchedule(selectedYear, m);
        const mDate = (ledgerDraft.meta?.[m]?.date || '').trim();
        const mTime = (ledgerDraft.meta?.[m]?.measureTime || '').trim();

        let monthHasAnyValue = false;
        ILLUMINANCE_POINTS.forEach((pt) => {
          const rawVal = ledgerDraft.cells?.[pt.no]?.[m];
          const luxNum = toLuxNumber(rawVal);
          const existingCell = ledgerMatrix?.[pt.no]?.[m];
          const deterministicId = `ledger_${selectedYear}_${mm}_p${pt.no}`;
          const targetDocId = existingCell?.id || deterministicId;

          if (luxNum !== null && luxNum >= 0) {
            monthHasAnyValue = true;
            const effectiveDate = mDate || existingCell?.date || sched.defaultDate;
            const effectiveTime = mTime || existingCell?.measureTime || sched.defaultTime;
            batch.set(
              doc(db, ILLUMINANCE_COLLECTION, targetDocId),
              {
                year: Number(selectedYear),
                month: m,
                weekType: '매월 첫째주',
                pointNo: pt.no,
                location: pt.name,
                standardLux: pt.standardLux,
                measuredLux: luxNum,
                judgement: judgeIlluminance(luxNum, pt.standardLux),
                date: effectiveDate,
                measureTime: effectiveTime,
                instrument: existingCell?.instrument || monthMeta?.[m]?.instrument || '',
                measurer: existingCell?.measurer || monthMeta?.[m]?.measurer || '',
                remark: existingCell?.remark || '',
                updatedAt: nowIso
              },
              { merge: true }
            );
          } else if (existingCell?.id) {
            // 기존에 값이 있었으나 비운 경우 삭제
            batch.delete(doc(db, ILLUMINANCE_COLLECTION, existingCell.id));
          }
        });

        // 측정일이나 측정시간이 입력된 경우 월 메타 문서도 동기화
        const metaDocId = monthMeta?.[m]?.metaDocId || `ledger_${selectedYear}_${mm}_meta`;
        if (mDate || mTime || monthHasAnyValue) {
          batch.set(
            doc(db, ILLUMINANCE_COLLECTION, metaDocId),
            {
              recordType: 'month_meta',
              year: Number(selectedYear),
              month: m,
              date: mDate || (monthHasAnyValue ? sched.defaultDate : ''),
              measureTime: mTime || (monthHasAnyValue ? sched.defaultTime : ''),
              updatedAt: nowIso
            },
            { merge: true }
          );
        } else if (monthMeta?.[m]?.metaDocId) {
          batch.delete(doc(db, ILLUMINANCE_COLLECTION, monthMeta[m].metaDocId));
        }
      });

      await batch.commit();
      await loadRows();
      setIsLedgerDirty(false);
    } catch (err) {
      console.error('조도측정 관리 대장 저장 실패:', err);
      alert('조도측정 관리 대장 저장 중 오류가 발생했습니다.');
    } finally {
      setSavingLedger(false);
    }
  };

  // 매월 첫째주 일괄 기록 모달 열기
  const openMonthlyBatchModal = (month = currentMonth) => {
    const targetM = Number(month) || 1;
    const sched = getFirstWeekSchedule(selectedYear, targetM);
    const values = {};
    ILLUMINANCE_POINTS.forEach((pt) => {
      const draftVal = ledgerDraft.cells?.[pt.no]?.[targetM];
      const existingVal = ledgerMatrix?.[pt.no]?.[targetM]?.measuredLux;
      values[pt.no] =
        draftVal !== undefined && draftVal !== ''
          ? String(draftVal)
          : existingVal !== undefined && existingVal !== null && existingVal !== ''
            ? String(existingVal)
            : '';
    });

    const existingDate =
      ledgerDraft.meta?.[targetM]?.date ||
      monthMeta?.[targetM]?.date ||
      sched.defaultDate;
    const existingTime =
      ledgerDraft.meta?.[targetM]?.measureTime ||
      monthMeta?.[targetM]?.measureTime ||
      sched.defaultTime;

    setMonthlyForm({
      year: Number(selectedYear),
      month: targetM,
      date: existingDate,
      measureTime: existingTime,
      instrument: monthMeta?.[targetM]?.instrument || '',
      measurer: monthMeta?.[targetM]?.measurer || '',
      remark: '',
      values
    });
    setShowMonthlyModal(true);
  };

  // 매월 첫째주 모달에서 월 변경 시 해당 월 데이터로 로드
  const handleMonthlyModalMonthChange = (nextMonth) => {
    const m = Number(nextMonth) || 1;
    const sched = getFirstWeekSchedule(monthlyForm.year, m);
    const values = {};
    ILLUMINANCE_POINTS.forEach((pt) => {
      const existingVal =
        monthlyForm.year === Number(selectedYear)
          ? ledgerDraft.cells?.[pt.no]?.[m] ?? ledgerMatrix?.[pt.no]?.[m]?.measuredLux
          : ledgerMatrix?.[pt.no]?.[m]?.measuredLux;
      values[pt.no] =
        existingVal !== undefined && existingVal !== null && existingVal !== ''
          ? String(existingVal)
          : '';
    });
    setMonthlyForm((prev) => ({
      ...prev,
      month: m,
      date:
        (prev.year === Number(selectedYear) && (ledgerDraft.meta?.[m]?.date || monthMeta?.[m]?.date)) ||
        sched.defaultDate,
      measureTime:
        (prev.year === Number(selectedYear) &&
          (ledgerDraft.meta?.[m]?.measureTime || monthMeta?.[m]?.measureTime)) ||
        sched.defaultTime,
      values
    }));
  };

  // 매월 첫째주 모달 저장
  const handleSaveMonthlyBatch = async (e) => {
    e.preventDefault();
    const y = Number(monthlyForm.year) || selectedYear;
    const m = Number(monthlyForm.month) || 1;
    const mm = String(m).padStart(2, '0');
    const sched = getFirstWeekSchedule(y, m);
    const mDate = (monthlyForm.date || sched.defaultDate).trim();
    const mTime = (monthlyForm.measureTime || sched.defaultTime).trim();

    setSavingMonthly(true);
    try {
      const batch = writeBatch(db);
      const nowIso = new Date().toISOString();

      ILLUMINANCE_POINTS.forEach((pt) => {
        const rawVal = monthlyForm.values?.[pt.no];
        const luxNum = toLuxNumber(rawVal);
        const existingCell = y === Number(selectedYear) ? ledgerMatrix?.[pt.no]?.[m] : null;
        const targetDocId = existingCell?.id || `ledger_${y}_${mm}_p${pt.no}`;

        if (luxNum !== null && luxNum >= 0) {
          batch.set(
            doc(db, ILLUMINANCE_COLLECTION, targetDocId),
            {
              year: y,
              month: m,
              weekType: '매월 첫째주',
              pointNo: pt.no,
              location: pt.name,
              standardLux: pt.standardLux,
              measuredLux: luxNum,
              judgement: judgeIlluminance(luxNum, pt.standardLux),
              date: mDate,
              measureTime: mTime,
              instrument: monthlyForm.instrument.trim(),
              measurer: monthlyForm.measurer.trim(),
              remark: monthlyForm.remark.trim(),
              updatedAt: nowIso
            },
            { merge: true }
          );
        } else if (existingCell?.id) {
          batch.delete(doc(db, ILLUMINANCE_COLLECTION, existingCell.id));
        }
      });

      const metaDocId =
        (y === Number(selectedYear) && monthMeta?.[m]?.metaDocId) || `ledger_${y}_${mm}_meta`;
      batch.set(
        doc(db, ILLUMINANCE_COLLECTION, metaDocId),
        {
          recordType: 'month_meta',
          year: y,
          month: m,
          date: mDate,
          measureTime: mTime,
          instrument: monthlyForm.instrument.trim(),
          measurer: monthlyForm.measurer.trim(),
          updatedAt: nowIso
        },
        { merge: true }
      );

      await batch.commit();
      setShowMonthlyModal(false);
      if (y !== Number(selectedYear)) {
        setSelectedYear(y);
      }
      await loadRows();
    } catch (err) {
      console.error('월별 첫째주 조도 기록 저장 실패:', err);
      alert('저장 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setSavingMonthly(false);
    }
  };

  // A4 조도측정 관리 대장 인쇄
  const handlePrintLedger = () => {
    const win = window.open('', '_blank', 'width=1200,height=850');
    if (!win) {
      alert('팝업 차단을 해제한 뒤 다시 인쇄해 주세요.');
      return;
    }

    const monthHeadersHtml = ILLUMINANCE_MONTHS.map((m) => `<th>${m}월</th>`).join('');
    const pointRowsHtml = ILLUMINANCE_POINTS.map((pt) => {
      const cellsHtml = ILLUMINANCE_MONTHS.map((m) => {
        const raw = ledgerDraft.cells?.[pt.no]?.[m];
        const num = toLuxNumber(raw);
        if (num === null) return '<td></td>';
        const isFail = num < pt.standardLux;
        return `<td class="${isFail ? 'cell-fail' : 'cell-pass'}">${num} LUX</td>`;
      }).join('');
      return `
        <tr>
          <td>${pt.no}</td>
          <td class="col-name">${pt.name}</td>
          <td>${pt.standardLabel}</td>
          ${cellsHtml}
        </tr>
      `;
    }).join('');

    const dateCellsHtml = ILLUMINANCE_MONTHS.map(
      (m) => `<td class="meta-cell">${ledgerDraft.meta?.[m]?.date || ''}</td>`
    ).join('');
    const timeCellsHtml = ILLUMINANCE_MONTHS.map(
      (m) => `<td class="meta-cell">${ledgerDraft.meta?.[m]?.measureTime || ''}</td>`
    ).join('');

    const mapsPageHtml = includeMapsOnPrint
      ? `
        <div class="page-break"></div>
        <div class="sheet-title">■ (${selectedYear}년) 공장 조도 측정 위치도 및 동별 상세 도면</div>
        <div class="sheet-sub">▷대상업체 : ${ILLUMINANCE_TARGET_COMPANY} (① FMB 보관장 ~ ⑩ D동-검사)</div>
        <div class="maps-grid">
          ${ILLUMINANCE_BUILDING_MAPS.map(
            (mp) => `
              <div class="map-box">
                <div class="map-box-title">${mp.label}</div>
                <img src="${mp.image}" alt="${mp.label}" />
                <div class="map-box-desc">${mp.description}</div>
              </div>
            `
          ).join('')}
        </div>
      `
      : '';

    win.document.write(`
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8" />
        <title>(${selectedYear}년) 조도측정 관리 대장 - ${ILLUMINANCE_TARGET_COMPANY}</title>
        <style>
          @page { size: A4 landscape; margin: 10mm; }
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          body { font-family: "Malgun Gothic", "맑은 고딕", sans-serif; color: #0f172a; margin: 0; padding: 8px; }
          .sheet-title { font-size: 22px; font-weight: 800; margin-bottom: 8px; padding-bottom: 6px; border-bottom: 3px solid #1e3a8a; }
          .sheet-sub { font-size: 14px; font-weight: 700; margin-bottom: 8px; }
          table.ledger { width: 100%; border-collapse: collapse; table-layout: fixed; }
          table.ledger th, table.ledger td {
            border: 1px solid #475569;
            text-align: center;
            vertical-align: middle;
            font-size: 12px;
            height: 36px;
            padding: 4px;
          }
          table.ledger thead th { background: #f1f5f9; font-weight: 700; height: 28px; }
          table.ledger td.col-name { font-weight: 700; }
          table.ledger td.cell-fail { color: #b91c1c; background: #fee2e2; font-weight: 700; }
          table.ledger td.cell-pass { font-weight: 600; }
          table.ledger tr.meta-row td { background: #d9e1f2; font-weight: 600; height: 36px; }
          .sheet-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 12px; color: #334155; }
          .sheet-footer-center { flex: 1; text-align: center; font-weight: 600; }
          .page-break { page-break-before: always; margin-top: 20px; }
          .maps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .map-box { border: 1px solid #94a3b8; border-radius: 4px; padding: 6px; text-align: center; }
          .map-box-title { font-size: 12px; font-weight: 700; margin-bottom: 4px; }
          .map-box img { width: 100%; height: 185px; object-fit: contain; }
          .map-box-desc { font-size: 10px; color: #475569; margin-top: 3px; }
        </style>
      </head>
      <body>
        <div class="sheet-title">■ (${selectedYear}년) 조도측정 관리 대장</div>
        <div class="sheet-sub">▷대상업체 : ${ILLUMINANCE_TARGET_COMPANY}</div>
        <table class="ledger">
          <colgroup>
            <col style="width: 44px;" />
            <col style="width: 115px;" />
            <col style="width: 88px;" />
            ${ILLUMINANCE_MONTHS.map(() => '<col />').join('')}
          </colgroup>
          <thead>
            <tr>
              <th rowspan="2">순</th>
              <th rowspan="2">측정공정</th>
              <th rowspan="2">표준 lux</th>
              <th colspan="12">${selectedYear}년</th>
            </tr>
            <tr>
              ${monthHeadersHtml}
            </tr>
          </thead>
          <tbody>
            ${pointRowsHtml}
            <tr class="meta-row">
              <td colspan="3">측정일</td>
              ${dateCellsHtml}
            </tr>
            <tr class="meta-row">
              <td colspan="3">측정시간</td>
              ${timeCellsHtml}
            </tr>
          </tbody>
        </table>
        <div class="sheet-footer">
          <span style="width: 100px;"></span>
          <span class="sheet-footer-center">${ILLUMINANCE_TARGET_COMPANY}</span>
          <span style="width: 100px; text-align: right;">${ILLUMINANCE_PAPER_SPEC}</span>
        </div>
        ${mapsPageHtml}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 250);
          };
        </script>
      </body>
      </html>
    `);
    win.document.close();
  };

  // 엑셀 다운로드 실행
  const handleExportExcel = async () => {
    try {
      // 현재 화면의 드래프트 상태 기준으로 엑셀 내보내기
      const exportMatrix = {};
      ILLUMINANCE_POINTS.forEach((pt) => {
        exportMatrix[pt.no] = {};
        ILLUMINANCE_MONTHS.forEach((m) => {
          exportMatrix[pt.no][m] = {
            measuredLux: ledgerDraft.cells?.[pt.no]?.[m] ?? ''
          };
        });
      });
      await exportIlluminanceLedgerToExcel({
        year: selectedYear,
        ledgerMatrix: exportMatrix,
        monthMeta: ledgerDraft.meta
      });
    } catch (err) {
      console.error('엑셀 다운로드 오류:', err);
      alert('엑셀 파일 생성 중 오류가 발생했습니다.');
    }
  };

  const toggleFilterValue = (key, value) => {
    setFilters((prev) => {
      const cur = prev[key] || [];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      return { ...prev, [key]: next };
    });
  };

  const openModal = (row = null) => {
    if (row) {
      const pt = findIlluminancePoint(row.pointNo || row.location);
      setFormData({
        id: row.id,
        pointNo: pt?.no || '',
        date: row.date || '',
        measureTime: row.measureTime || '10:00',
        location: row.location || pt?.name || '',
        standardLux: String(row.standardLux ?? pt?.standardLux ?? ''),
        measuredLux: String(row.measuredLux ?? ''),
        instrument: row.instrument || '',
        measurer: row.measurer || '',
        remark: row.remark || ''
      });
    } else {
      setFormData(createInitialIlluminanceForm(selectedPointNo));
    }
    setShowModal(true);
  };

  const handleSaveIndividual = async (e) => {
    e.preventDefault();
    const measured = toLuxNumber(formData.measuredLux);
    const standard = toLuxNumber(formData.standardLux);
    if (!formData.date || !formData.location.trim()) {
      alert('측정일과 측정공정을 입력해 주세요.');
      return;
    }
    if (measured === null || measured < 0 || standard === null || standard < 0) {
      alert('표준 조도와 측정값은 0 이상의 숫자로 입력해 주세요.');
      return;
    }
    const pt = findIlluminancePoint(formData.pointNo || formData.location);
    const ym = parseYearMonthFromRow({ date: formData.date });
    const payload = {
      year: ym?.year || selectedYear,
      month: ym?.month || currentMonth,
      pointNo: pt?.no || null,
      date: formData.date,
      measureTime: (formData.measureTime || '').trim(),
      location: formData.location.trim(),
      standardLux: standard,
      measuredLux: measured,
      judgement: judgeIlluminance(measured, standard),
      instrument: formData.instrument.trim(),
      measurer: formData.measurer.trim(),
      remark: formData.remark.trim(),
      updatedAt: new Date().toISOString()
    };
    setSaving(true);
    try {
      if (formData.id) {
        await updateDoc(doc(db, ILLUMINANCE_COLLECTION, formData.id), payload);
      } else if (pt && ym) {
        const mm = String(ym.month).padStart(2, '0');
        const detId = `ledger_${ym.year}_${mm}_p${pt.no}`;
        await setDoc(
          doc(db, ILLUMINANCE_COLLECTION, detId),
          {
            ...payload,
            createdAt: new Date().toISOString()
          },
          { merge: true }
        );
      } else {
        await addDoc(collection(db, ILLUMINANCE_COLLECTION), {
          ...payload,
          createdAt: new Date().toISOString()
        });
      }
      setShowModal(false);
      await loadRows();
    } catch (err) {
      console.error('조도 측정 기록 저장 실패:', err);
      alert('저장 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`${row.date} ${row.location} 측정 기록을 삭제하시겠습니까?`)) return;
    try {
      await deleteDoc(doc(db, ILLUMINANCE_COLLECTION, row.id));
      await loadRows();
    } catch (err) {
      console.error('조도 측정 기록 삭제 실패:', err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const renderFilterHeader = (col) => {
    const selected = filters[col.key] || [];
    const isFiltered = selected.length > 0;
    const isOpen = openFilterCol === col.key;
    return (
      <th key={col.key} style={{ paddingTop: '4px', paddingBottom: '6px', position: 'relative' }}>
        <button
          type="button"
          data-illum-filter-btn={col.key}
          data-active={isFiltered ? '1' : '0'}
          aria-expanded={isOpen}
          onClick={() => setOpenFilterCol(isOpen ? null : col.key)}
          title={`${td(col.label)} 필터 선택`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 6px',
            borderRadius: '4px',
            border: isFiltered || isOpen ? '1px solid #93c5fd' : '1px solid transparent',
            background: isFiltered ? '#eff6ff' : isOpen ? '#f8fafc' : 'transparent',
            color: isFiltered ? '#1d4ed8' : 'inherit',
            fontWeight: 'bold',
            fontSize: 'inherit',
            fontFamily: 'inherit',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          <span>{td(col.label)}</span>
          <span style={{ fontSize: '10px', color: isFiltered ? '#2563eb' : '#64748b' }}>
            {isFiltered ? `▼(${selected.length})` : '▾'}
          </span>
        </button>
        {isOpen && (
          <div
            data-illum-filter-popover="1"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              zIndex: 20,
              minWidth: '170px',
              maxHeight: '260px',
              overflowY: 'auto',
              textAlign: 'left',
              background: '#fff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              boxShadow: '0 6px 18px rgba(15, 23, 42, 0.14)',
              padding: '6px'
            }}
          >
            {(optionsByCol[col.key] || []).map((val) => (
              <label
                key={val}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '5px 8px',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(val)}
                  onChange={() => toggleFilterValue(col.key, val)}
                />
                <span>{val}</span>
              </label>
            ))}
          </div>
        )}
      </th>
    );
  };

  // 공장 전체 지도 + 동별 상세 도면 뷰어 섹션 렌더링
  const renderMapAndLayoutGuide = () => (
    <div
      data-illum-map-panel="1"
      style={{
        background: '#f8fafc',
        border: '1px solid #cbd5e1',
        borderRadius: '10px',
        padding: '14px',
        marginBottom: '16px'
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
            🗺️ 공장 전체 조도 측정 위치도 & 동별 상세 LAY OUT (①~⑩)
          </span>
          <span
            style={{
              fontSize: '12px',
              color: '#1e40af',
              background: '#dbeafe',
              padding: '2px 8px',
              borderRadius: '999px',
              fontWeight: 700
            }}
          >
            선택 위치: {selectedPoint.circledNo} {selectedPoint.name} (표준 {selectedPoint.standardLabel})
          </span>
        </div>

        {/* 도면 탭 선택 버튼 */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {ILLUMINANCE_BUILDING_MAPS.map((mp) => {
            const isActive = activeMapId === mp.id;
            return (
              <button
                key={mp.id}
                type="button"
                onClick={() => {
                  setActiveMapId(mp.id);
                  if (mp.pointNos.length > 0 && !mp.pointNos.includes(selectedPointNo)) {
                    setSelectedPointNo(mp.pointNos[0]);
                  }
                }}
                style={{
                  padding: '5px 10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: isActive ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
                  background: isActive ? '#1d4ed8' : '#fff',
                  color: isActive ? '#fff' : '#334155',
                  cursor: 'pointer'
                }}
              >
                {mp.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* 좌측: 공장 전체 지도 (클릭 가능한 ①~⑩ 핀) + 우측: 선택된 동 상세 CAD 도면 및 ①~⑩ 측정공정 선택 카드 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '14px',
          alignItems: 'stretch'
        }}
      >
        {/* 1) 공장 전체 배치도 (1~10 위치 핫스팟 오버레이) */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
              📍 1. 공장 전체 지도 (번호 클릭 시 해당 동 상세도면 연동)
            </span>
            <button
              type="button"
              onClick={() =>
                setZoomImageModal({
                  title: '조영산업 공장 전체 조도 측정 위치도 (①~⑩)',
                  image: '/images/illuminance/factory_overview_map.jpg',
                  description: '번호(1~10)별로 매월 첫째주 정기 조도 측정을 실시합니다.'
                })
              }
              style={{
                padding: '3px 8px',
                fontSize: '11px',
                fontWeight: 700,
                background: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              🔍 크게 보기
            </button>
          </div>

          <div
            style={{
              position: 'relative',
              width: '100%',
              borderRadius: '6px',
              overflow: 'hidden',
              border: '1px solid #e2e8f0',
              background: '#0f172a'
            }}
          >
            <img
              src="/images/illuminance/factory_overview_map.jpg"
              alt="공장 전체 조도 측정 위치도"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
            {ILLUMINANCE_POINTS.map((pt) => {
              const isSelected = pt.no === selectedPointNo;
              return (
                <button
                  key={pt.no}
                  type="button"
                  onClick={() => handleSelectPoint(pt.no, true)}
                  title={`${pt.circledNo} ${pt.name} (표준 ${pt.standardLabel})`}
                  style={{
                    position: 'absolute',
                    left: `${pt.overviewPos.left}%`,
                    top: `${pt.overviewPos.top}%`,
                    transform: 'translate(-50%, -50%)',
                    width: isSelected ? '34px' : '28px',
                    height: isSelected ? '34px' : '28px',
                    borderRadius: '50%',
                    border: isSelected ? '3px solid #dc2626' : '2px solid rgba(29, 78, 216, 0.85)',
                    background: isSelected ? 'rgba(254, 240, 138, 0.95)' : 'rgba(250, 204, 21, 0.25)',
                    color: '#0f172a',
                    fontWeight: 900,
                    fontSize: isSelected ? '13px' : '11px',
                    cursor: 'pointer',
                    boxShadow: isSelected
                      ? '0 0 0 4px rgba(220, 38, 38, 0.35), 0 4px 10px rgba(0,0,0,0.4)'
                      : '0 2px 6px rgba(0,0,0,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    transition: 'all 0.15s ease'
                  }}
                >
                  {isSelected ? pt.no : ''}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '6px' }}>
            💡 지도 위의 노란 원 번호(1~10) 또는 우측 공정 버튼을 클릭하면 해당 동의 상세 LAY OUT 도면과 측정 기준을 확인할 수 있습니다.
          </div>
        </div>

        {/* 2) 선택된 동 상세 CAD LAY OUT 도면 + ①~⑩ 번호별 바로가기 */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                📐 2. {activeMap.label}
              </span>
              <button
                type="button"
                onClick={() =>
                  setZoomImageModal({
                    title: activeMap.label,
                    image: activeMap.image,
                    description: activeMap.description
                  })
                }
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  background: '#f1f5f9',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                🔍 도면 확대
              </button>
            </div>

            <div
              onClick={() =>
                setZoomImageModal({
                  title: activeMap.label,
                  image: activeMap.image,
                  description: activeMap.description
                })
              }
              title="클릭하면 도면을 크게 확대합니다"
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                background: '#fff',
                padding: '6px',
                textAlign: 'center',
                cursor: 'zoom-in',
                minHeight: '220px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <img
                src={activeMap.image}
                alt={activeMap.label}
                style={{ maxWidth: '100%', maxHeight: '250px', objectFit: 'contain' }}
              />
            </div>
            <div
              style={{
                marginTop: '6px',
                padding: '6px 10px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#1e3a8a',
                fontWeight: 600
              }}
            >
              <div>
                <strong>
                  {selectedPoint.circledNo} {selectedPoint.name}
                </strong>{' '}
                — 표준 조도: <strong style={{ color: '#1d4ed8' }}>{selectedPoint.standardLabel}</strong>
              </div>
              <div style={{ fontSize: '11.5px', color: '#334155', marginTop: '2px' }}>
                세부 위치: {selectedPoint.detailLocation}
              </div>
            </div>
          </div>

          {/* ① ~ ⑩ 측정공정 퀵 선택 칩 */}
          <div style={{ marginTop: '10px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              번호별 측정공정 및 표준 조도 (클릭 시 위치/도면 전환):
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                gap: '5px'
              }}
            >
              {ILLUMINANCE_POINTS.map((pt) => {
                const isSelected = pt.no === selectedPointNo;
                return (
                  <button
                    key={pt.no}
                    type="button"
                    onClick={() => handleSelectPoint(pt.no, true)}
                    style={{
                      padding: '5px 6px',
                      borderRadius: '6px',
                      border: isSelected ? '2px solid #1d4ed8' : '1px solid #cbd5e1',
                      background: isSelected ? '#eff6ff' : '#f8fafc',
                      color: '#0f172a',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: '11.5px',
                      lineHeight: 1.25
                    }}
                  >
                    <div style={{ fontWeight: 800, color: isSelected ? '#1d4ed8' : '#0f172a' }}>
                      {pt.circledNo} {pt.name}
                    </div>
                    <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 600 }}>
                      {pt.standardLabel}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 모든 도면 한눈에 보기 탭 ('maps')
  const renderFullMapsGallery = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {renderMapAndLayoutGuide()}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '14px'
        }}
      >
        {ILLUMINANCE_BUILDING_MAPS.map((mp) => (
          <div
            key={mp.id}
            style={{
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              background: '#fff',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}
              >
                <span style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>
                  {mp.label}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setZoomImageModal({
                      title: mp.label,
                      image: mp.image,
                      description: mp.description
                    })
                  }
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: '#f1f5f9',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  🔍 확대 보기
                </button>
              </div>
              <div
                onClick={() =>
                  setZoomImageModal({
                    title: mp.label,
                    image: mp.image,
                    description: mp.description
                  })
                }
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '6px',
                  textAlign: 'center',
                  cursor: 'zoom-in',
                  height: '220px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#f8fafc'
                }}
              >
                <img
                  src={mp.image}
                  alt={mp.label}
                  style={{ maxWidth: '100%', maxHeight: '205px', objectFit: 'contain' }}
                />
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#475569', marginTop: '8px', fontWeight: 600 }}>
              {mp.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // 메인: ■ (2026년) 조도측정 관리 대장 렌더링 (이미지 8 양식 100% 반영 + 첫째주 입력 연동)
  const renderAnnualLedgerSheet = () => (
    <div>
      {showMapPanelInLedger && renderMapAndLayoutGuide()}

      {/* 공식 관리 대장 시트 박스 */}
      <div
        data-illum-ledger-sheet="1"
        style={{
          background: '#fff',
          border: '1px solid #cbd5e1',
          borderRadius: '10px',
          padding: '18px 20px',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)'
        }}
      >
        {/* 대장 타이틀 & 액션 바 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
            gap: '10px',
            paddingBottom: '10px',
            borderBottom: '3px solid #1e3a8a',
            marginBottom: '10px'
          }}
        >
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flexWrap: 'wrap'
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: '21px',
                  fontWeight: 900,
                  color: '#0f172a',
                  letterSpacing: '-0.02em'
                }}
              >
                ■ ({selectedYear}년) 조도측정 관리 대장
              </h2>
              <select
                aria-label="조도측정 관리 대장 연도 선택"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                style={{
                  padding: '4px 10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: '1px solid #94a3b8',
                  background: '#f8fafc',
                  color: '#0f172a',
                  cursor: 'pointer'
                }}
              >
                {[2025, 2026, 2027, 2028].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}년 대장
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => handleAutoFillFirstWeekDates(null)}
              title="비어 있는 1~12월 측정일에 각 월 첫째주 평일 날짜와 기본 시간(10:00)을 자동으로 채웁니다"
              style={{
                padding: '6px 11px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '6px',
                border: '1px solid #93c5fd',
                background: '#eff6ff',
                color: '#1d4ed8',
                cursor: 'pointer'
              }}
            >
              📅 1~12월 첫째주 측정일 자동채움
            </button>

            <button
              type="button"
              onClick={() => openMonthlyBatchModal(currentMonth)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 800,
                borderRadius: '6px',
                border: '1px solid #1d4ed8',
                background: '#1d4ed8',
                color: '#fff',
                cursor: 'pointer'
              }}
            >
              📝 매월 첫째주 월별 일괄 입력
            </button>

            <button
              type="button"
              onClick={handleSaveLedgerAll}
              disabled={savingLedger}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 800,
                borderRadius: '6px',
                border: '1px solid #047857',
                background: isLedgerDirty ? '#059669' : '#10b981',
                color: '#fff',
                cursor: 'pointer',
                boxShadow: isLedgerDirty ? '0 0 0 3px rgba(16, 185, 129, 0.25)' : 'none'
              }}
            >
              {savingLedger ? '저장 중...' : isLedgerDirty ? '💾 대장 변경사항 저장 *' : '💾 대장 저장'}
            </button>
          </div>
        </div>

        {/* 대상업체 및 상태 안내 줄 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
              ▷대상업체 : {ILLUMINANCE_TARGET_COMPANY}
            </span>
            <span
              style={{
                fontSize: '12px',
                color: '#475569',
                background: '#f1f5f9',
                padding: '2px 8px',
                borderRadius: '999px',
                fontWeight: 600
              }}
            >
              기록 월: {annualStats.recordedMonths} / 12개월 · 측정 지점: {annualStats.totalCells}건 (적합{' '}
              <strong style={{ color: '#15803d' }}>{annualStats.passCells}</strong> / 부적합{' '}
              <strong style={{ color: '#b91c1c' }}>{annualStats.failCells}</strong>)
            </span>
          </div>

          <div style={{ fontSize: '12px', color: '#475569' }}>
            💡 표의 각 월 칸에 측정값(LUX)을 직접 입력 후 <strong>[대장 저장]</strong>을 누르거나, 상단{' '}
            <strong>[1월~12월]</strong> 헤더를 클릭해 월별 첫째주 시트로 입력할 수 있습니다.
          </div>
        </div>

        {/* 조도측정 관리 대장 메인 테이블 */}
        <div style={{ overflowX: 'auto' }}>
          <table className="illum-ledger-table">
            <colgroup>
              <col style={{ width: '48px' }} />
              <col style={{ width: '126px' }} />
              <col style={{ width: '92px' }} />
              {ILLUMINANCE_MONTHS.map((m) => (
                <col key={m} style={{ minWidth: '78px' }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <th rowSpan={2}>순</th>
                <th rowSpan={2}>측정공정</th>
                <th rowSpan={2}>표준 lux</th>
                <th colSpan={12} style={{ fontSize: '13px', fontWeight: 800, background: '#f1f5f9' }}>
                  {selectedYear}년
                </th>
              </tr>
              <tr>
                {ILLUMINANCE_MONTHS.map((m) => {
                  const hasDate = Boolean(ledgerDraft.meta?.[m]?.date);
                  return (
                    <th key={m} style={{ padding: '4px' }}>
                      <button
                        type="button"
                        onClick={() => openMonthlyBatchModal(m)}
                        title={`${selectedYear}년 ${m}월 첫째주 조도 일괄 입력 창 열기`}
                        style={{
                          width: '100%',
                          padding: '3px 4px',
                          borderRadius: '4px',
                          border: '1px solid transparent',
                          background: hasDate ? '#e0f2fe' : 'transparent',
                          color: hasDate ? '#0369a1' : '#0f172a',
                          fontWeight: 800,
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {m}월 ✎
                      </button>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {ILLUMINANCE_POINTS.map((pt) => {
                const isSelectedRow = pt.no === selectedPointNo;
                return (
                  <tr
                    key={pt.no}
                    onClick={() => handleSelectPoint(pt.no, false)}
                    style={{
                      background: isSelectedRow ? '#f8fafc' : '#fff'
                    }}
                  >
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>{pt.no}</td>
                    <td style={{ fontWeight: 800, color: '#0f172a' }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectPoint(pt.no, true);
                          setShowMapPanelInLedger(true);
                        }}
                        title={`${pt.circledNo} ${pt.name} 상세 위치 도면 보기`}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '2px 4px',
                          fontWeight: 800,
                          fontSize: '12.5px',
                          color: isSelectedRow ? '#1d4ed8' : '#0f172a',
                          cursor: 'pointer',
                          textDecoration: isSelectedRow ? 'underline' : 'none'
                        }}
                      >
                        {pt.name}
                      </button>
                    </td>
                    <td style={{ fontWeight: 700, color: '#1e293b' }}>{pt.standardLabel}</td>
                    {ILLUMINANCE_MONTHS.map((m) => {
                      const rawVal = ledgerDraft.cells?.[pt.no]?.[m] ?? '';
                      const numVal = toLuxNumber(rawVal);
                      const judgement = judgeIlluminance(numVal, pt.standardLux);
                      const isFail = judgement === ILLUMINANCE_JUDGEMENT.FAIL;
                      const isPass = judgement === ILLUMINANCE_JUDGEMENT.PASS;
                      return (
                        <td
                          key={m}
                          style={{
                            padding: '3px 4px',
                            background: isFail ? '#fef2f2' : isPass ? '#ffffff' : 'transparent'
                          }}
                        >
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                              type="number"
                              inputMode="decimal"
                              min="0"
                              step="any"
                              aria-label={`${pt.name} ${m}월 측정 조도(LUX)`}
                              placeholder="-"
                              value={rawVal}
                              onChange={(e) => handleLedgerCellChange(pt.no, m, e.target.value)}
                              style={{
                                width: '100%',
                                textAlign: 'center',
                                padding: '5px 4px',
                                border: isFail
                                  ? '1px solid #f87171'
                                  : rawVal !== ''
                                    ? '1px solid #cbd5e1'
                                    : '1px solid transparent',
                                borderRadius: '4px',
                                fontSize: '12.5px',
                                fontWeight: rawVal !== '' ? 700 : 400,
                                color: isFail ? '#b91c1c' : '#0f172a',
                                background: isFail ? '#fee2e2' : 'transparent'
                              }}
                            />
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* 하단 요약 행 1: 측정일 */}
              <tr className="illum-ledger-meta-row">
                <td colSpan={3} style={{ fontWeight: 800, color: '#0f172a' }}>
                  측정일
                </td>
                {ILLUMINANCE_MONTHS.map((m) => {
                  const dateVal = ledgerDraft.meta?.[m]?.date || '';
                  const sched = getFirstWeekSchedule(selectedYear, m);
                  return (
                    <td key={m} style={{ padding: '4px' }}>
                      <input
                        type="date"
                        aria-label={`${m}월 측정일`}
                        value={dateVal}
                        onChange={(e) => handleLedgerMetaChange(m, 'date', e.target.value)}
                        title={`${m}월 첫째주 추천 측정일: ${sched.defaultDate}`}
                        style={{
                          width: '100%',
                          padding: '4px 2px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textAlign: 'center',
                          border: '1px solid #94a3b8',
                          borderRadius: '4px',
                          background: '#fff',
                          color: '#0f172a'
                        }}
                      />
                    </td>
                  );
                })}
              </tr>

              {/* 하단 요약 행 2: 측정시간 */}
              <tr className="illum-ledger-meta-row">
                <td colSpan={3} style={{ fontWeight: 800, color: '#0f172a' }}>
                  측정시간
                </td>
                {ILLUMINANCE_MONTHS.map((m) => {
                  const timeVal = ledgerDraft.meta?.[m]?.measureTime || '';
                  return (
                    <td key={m} style={{ padding: '4px' }}>
                      <input
                        type="text"
                        aria-label={`${m}월 측정시간`}
                        placeholder="예: 10:00"
                        value={timeVal}
                        onChange={(e) => handleLedgerMetaChange(m, 'measureTime', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '4px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          textAlign: 'center',
                          border: '1px solid #94a3b8',
                          borderRadius: '4px',
                          background: '#fff',
                          color: '#0f172a'
                        }}
                      />
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* 시트 하단 푸터 (조영산업 / A4(210×297)) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '10px',
            paddingTop: '6px',
            fontSize: '12px',
            color: '#334155',
            fontWeight: 600
          }}
        >
          <span style={{ width: '120px', color: '#64748b', fontSize: '11px' }}>
            기준 미만 시 붉은색 표시
          </span>
          <span style={{ fontWeight: 800, color: '#0f172a' }}>{ILLUMINANCE_TARGET_COMPANY}</span>
          <span style={{ width: '120px', textAlign: 'right', color: '#475569' }}>
            {ILLUMINANCE_PAPER_SPEC}
          </span>
        </div>
      </div>
    </div>
  );

  // 상세 측정 이력 리스트 탭 ('history')
  const renderHistoryListView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
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
              ? `필터 결과 ${filteredRows.length} / ${historyRows.length}건`
              : `전체 ${historyRows.length}건`}
          </span>
          {activeFilterEntries.length === 0 && (
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              항목 제목(▾)을 클릭하여 조건별 필터를 선택할 수 있습니다.
            </span>
          )}
        </div>
        <button type="button" className="btn btn-primary" onClick={() => openModal()}>
          {ILLUMINANCE_META.addBtnLabel}
        </button>
      </div>

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
            const vals = filters[col.key];
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
                {td(col.label)}: {summary}
                <button
                  type="button"
                  onClick={() => setFilters((p) => ({ ...p, [col.key]: [] }))}
                  title={`${td(col.label)} 필터 해제`}
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
                >
                  &times;
                </button>
              </span>
            );
          })}
          <button
            type="button"
            onClick={() => setFilters({})}
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

      <div style={{ overflowX: 'auto', flex: 1 }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
              <th style={{ width: '52px', paddingTop: '4px', paddingBottom: '6px' }}>순번</th>
              {FILTER_COLUMNS.map(renderFilterHeader)}
              <th>비고</th>
              <th>관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r, idx) => {
              const judgement = judgeIlluminance(r.measuredLux, r.standardLux);
              const isFail = judgement === ILLUMINANCE_JUDGEMENT.FAIL;
              const pt = findIlluminancePoint(r.pointNo || r.location);
              return (
                <tr key={r.id} style={{ borderBottom: '1px solid #cbd5e1' }}>
                  <td style={{ color: '#64748b', fontWeight: 600 }}>{pt ? pt.circledNo : idx + 1}</td>
                  <td>{r.date || '-'}</td>
                  <td>{r.measureTime || '-'}</td>
                  <td style={{ fontWeight: 'bold' }}>{r.location || '-'}</td>
                  <td>{r.standardLux !== undefined && r.standardLux !== null ? `${r.standardLux} LUX` : '-'}</td>
                  <td style={{ fontWeight: 'bold', color: isFail ? '#b91c1c' : 'inherit' }}>
                    {r.measuredLux !== undefined && r.measuredLux !== null ? `${r.measuredLux} LUX` : '-'}
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 600,
                        background: isFail
                          ? '#fee2e2'
                          : judgement === ILLUMINANCE_JUDGEMENT.PASS
                            ? '#dcfce3'
                            : '#f1f5f9',
                        color: isFail
                          ? '#991b1b'
                          : judgement === ILLUMINANCE_JUDGEMENT.PASS
                            ? '#166534'
                            : '#64748b'
                      }}
                    >
                      {judgement}
                    </span>
                  </td>
                  <td>{r.instrument || '-'}</td>
                  <td>{r.measurer || '-'}</td>
                  <td
                    style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    title={r.remark || ''}
                  >
                    {r.remark || '-'}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => openModal(r)}
                      style={{
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '12px',
                        marginRight: '4px'
                      }}
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleDelete(r)}
                      style={{
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '12px'
                      }}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              );
            })}
            {historyRows.length === 0 && (
              <tr>
                <td colSpan={FILTER_COLUMNS.length + 3} style={{ padding: '32px 20px', color: '#64748b' }}>
                  <div style={{ fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    등록된 조도 측정 기록이 없습니다.
                  </div>
                  <div style={{ fontSize: '12px' }}>
                    <strong>[매월 첫째주 월별 일괄 입력]</strong> 또는 <strong>[조도측정 관리 대장]</strong> 탭에서 기록을 시작하세요.
                  </div>
                </td>
              </tr>
            )}
            {historyRows.length > 0 && filteredRows.length === 0 && (
              <tr>
                <td colSpan={FILTER_COLUMNS.length + 3} style={{ padding: '24px', color: '#64748b' }}>
                  선택한 필터 조건에 일치하는 기록이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const monthlyModalSchedule = getFirstWeekSchedule(monthlyForm.year, monthlyForm.month);

  return (
    <div
      className="card"
      data-illuminance-page="1"
      style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}
    >
      <style>{`
        [data-illuminance-page="1"] .table th,
        [data-illuminance-page="1"] .table td { padding-left: 12px; padding-right: 12px; white-space: nowrap; text-align: center; }
        [data-illuminance-page="1"] .table td { padding-top: 10px; padding-bottom: 10px; }
        [data-illuminance-page="1"] button[data-illum-filter-btn]:hover { background: #f1f5f9 !important; }
        [data-illuminance-page="1"] button[data-illum-filter-btn][data-active="1"]:hover { background: #dbeafe !important; }
        [data-illuminance-page="1"] .table tbody tr:hover td { background: #f8fafc; }
        [data-illuminance-page="1"] .illum-field { width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; font-family: inherit; }
        [data-illuminance-page="1"] .illum-field:focus-visible { outline: 2px solid #2563eb; outline-offset: 1px; }
        [data-illuminance-page="1"] .illum-ledger-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        [data-illuminance-page="1"] .illum-ledger-table th,
        [data-illuminance-page="1"] .illum-ledger-table td {
          border: 1px solid #64748b;
          text-align: center;
          vertical-align: middle;
          font-size: 12.5px;
          height: 36px;
        }
        [data-illuminance-page="1"] .illum-ledger-table thead th {
          background: #f1f5f9;
          color: #0f172a;
          font-weight: 800;
          height: 30px;
        }
        [data-illuminance-page="1"] .illum-ledger-table tr.illum-ledger-meta-row td {
          background: #d9e1f2;
          height: 38px;
        }
        [data-illuminance-page="1"] .illum-ledger-table input::-webkit-outer-spin-button,
        [data-illuminance-page="1"] .illum-ledger-table input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>

      {/* 상단 뷰 탭 & 공통 도구 막대 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          marginBottom: '14px',
          paddingBottom: '12px',
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveViewTab('ledger')}
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 800,
              borderRadius: '8px',
              border: activeViewTab === 'ledger' ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
              background: activeViewTab === 'ledger' ? '#1d4ed8' : '#fff',
              color: activeViewTab === 'ledger' ? '#fff' : '#334155',
              cursor: 'pointer'
            }}
          >
            📋 조도측정 관리 대장 (매월 첫째주 시트)
          </button>
          <button
            type="button"
            onClick={() => setActiveViewTab('maps')}
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 800,
              borderRadius: '8px',
              border: activeViewTab === 'maps' ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
              background: activeViewTab === 'maps' ? '#1d4ed8' : '#fff',
              color: activeViewTab === 'maps' ? '#fff' : '#334155',
              cursor: 'pointer'
            }}
          >
            🗺️ 공장 전체 지도 & 동별 상세 도면 (①~⑩)
          </button>
          <button
            type="button"
            onClick={() => setActiveViewTab('history')}
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 800,
              borderRadius: '8px',
              border: activeViewTab === 'history' ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
              background: activeViewTab === 'history' ? '#1d4ed8' : '#fff',
              color: activeViewTab === 'history' ? '#fff' : '#334155',
              cursor: 'pointer'
            }}
          >
            📑 상세 측정 이력 리스트 ({historyRows.length})
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {activeViewTab === 'ledger' && (
            <button
              type="button"
              onClick={() => setShowMapPanelInLedger((v) => !v)}
              style={{
                padding: '7px 12px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: showMapPanelInLedger ? '#f1f5f9' : '#fff',
                color: '#334155',
                cursor: 'pointer'
              }}
            >
              {showMapPanelInLedger ? '🗺️ 상단 도면 접기' : '🗺️ 상단 도면 펼치기'}
            </button>
          )}

          <button
            type="button"
            onClick={handleExportExcel}
            style={{
              padding: '7px 12px',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: '6px',
              border: '1px solid #15803d',
              background: '#f0fdf4',
              color: '#166534',
              cursor: 'pointer'
            }}
          >
            📥 엑셀(.xlsx) 다운로드
          </button>

          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer'
            }}
            title="인쇄 시 2페이지에 공장 전체 지도 및 동별 상세 도면을 함께 출력합니다"
          >
            <input
              type="checkbox"
              checked={includeMapsOnPrint}
              onChange={(e) => setIncludeMapsOnPrint(e.target.checked)}
            />
            <span>도면 포함</span>
          </label>

          <button
            type="button"
            onClick={handlePrintLedger}
            style={{
              padding: '7px 12px',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: '6px',
              border: '1px solid #334155',
              background: '#1e293b',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            🖨️ 관리 대장 인쇄 (A4)
          </button>
        </div>
      </div>

      {/* 본문 영역 */}
      {loading ? (
        <p>로딩 중...</p>
      ) : loadError ? (
        <p style={{ color: '#b91c1c' }}>{loadError}</p>
      ) : activeViewTab === 'ledger' ? (
        renderAnnualLedgerSheet()
      ) : activeViewTab === 'maps' ? (
        renderFullMapsGallery()
      ) : (
        renderHistoryListView()
      )}

      {/* 모달 1: 매월 첫째주 조도 기록 시트 (1~10번 공정 일괄 입력) */}
      {showMonthlyModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="매월 첫째주 조도 일괄 기록 시트"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowMonthlyModal(false);
          }}
        >
          <form
            onSubmit={handleSaveMonthlyBatch}
            style={{
              background: '#fff',
              padding: '22px 24px',
              borderRadius: '12px',
              width: '860px',
              maxWidth: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 20px 45px rgba(15, 23, 42, 0.25)'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                paddingBottom: '12px',
                borderBottom: '2px solid #1e3a8a',
                marginBottom: '14px'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
                  📝 ({monthlyForm.year}년 {monthlyForm.month}월) 첫째주 조도 기록 시트
                </h3>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                  ▷대상업체 : {ILLUMINANCE_TARGET_COMPANY} · 10개 표준 측정공정(①~⑩) 일괄 기록
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMonthlyModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '22px',
                  fontWeight: 700,
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                &times;
              </button>
            </div>

            {/* 상단 측정월 / 첫째주 측정일 / 측정시간 / 측정기 / 측정자 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '10px',
                background: '#f8fafc',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                marginBottom: '12px'
              }}
            >
              <div>
                <label style={labelStyle} htmlFor="illum_batch_month">
                  측정 월 (매월 첫째주) *
                </label>
                <select
                  id="illum_batch_month"
                  className="illum-field"
                  value={monthlyForm.month}
                  onChange={(e) => handleMonthlyModalMonthChange(e.target.value)}
                >
                  {ILLUMINANCE_MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {monthlyForm.year}년 {m}월 (첫째주)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle} htmlFor="illum_batch_date">
                  측정일 *
                </label>
                <input
                  id="illum_batch_date"
                  type="date"
                  required
                  className="illum-field"
                  value={monthlyForm.date}
                  onChange={(e) => setMonthlyForm({ ...monthlyForm, date: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="illum_batch_time">
                  측정시간 *
                </label>
                <input
                  id="illum_batch_time"
                  type="text"
                  required
                  placeholder="예: 10:00"
                  className="illum-field"
                  value={monthlyForm.measureTime}
                  onChange={(e) => setMonthlyForm({ ...monthlyForm, measureTime: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="illum_batch_instrument">
                  측정기(관리번호)
                </label>
                <input
                  id="illum_batch_instrument"
                  className="illum-field"
                  placeholder="예: 조도계"
                  value={monthlyForm.instrument}
                  onChange={(e) => setMonthlyForm({ ...monthlyForm, instrument: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="illum_batch_measurer">
                  측정자
                </label>
                <input
                  id="illum_batch_measurer"
                  className="illum-field"
                  placeholder="측정 담당자"
                  value={monthlyForm.measurer}
                  onChange={(e) => setMonthlyForm({ ...monthlyForm, measurer: e.target.value })}
                />
              </div>
            </div>

            {/* 해당 월 첫째주 평일 빠른 선택 칩 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexWrap: 'wrap',
                marginBottom: '12px',
                fontSize: '12px'
              }}
            >
              <span style={{ fontWeight: 700, color: '#334155' }}>
                📅 {monthlyForm.month}월 첫째주 평일 빠른 선택:
              </span>
              {monthlyModalSchedule.weekdays.map((w) => {
                const isSelectedDate = monthlyForm.date === w.iso;
                return (
                  <button
                    key={w.iso}
                    type="button"
                    onClick={() => setMonthlyForm({ ...monthlyForm, date: w.iso })}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: isSelectedDate ? '1px solid #1d4ed8' : '1px solid #cbd5e1',
                      background: isSelectedDate ? '#dbeafe' : '#fff',
                      color: isSelectedDate ? '#1e40af' : '#334155',
                      cursor: 'pointer'
                    }}
                  >
                    {w.label}
                  </button>
                );
              })}
            </div>

            {/* 1~10번 측정공정 입력 테이블 */}
            <div style={{ overflowX: 'auto' }}>
              <table className="illum-ledger-table">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>순</th>
                    <th style={{ width: '135px' }}>측정공정</th>
                    <th style={{ width: '90px' }}>소속 동</th>
                    <th style={{ width: '95px' }}>표준 lux</th>
                    <th style={{ width: '150px' }}>{monthlyForm.month}월 측정값 (LUX)</th>
                    <th style={{ width: '85px' }}>판정</th>
                    <th>도면 상 위치 및 확인</th>
                  </tr>
                </thead>
                <tbody>
                  {ILLUMINANCE_POINTS.map((pt) => {
                    const rawVal = monthlyForm.values?.[pt.no] ?? '';
                    const judgement = judgeIlluminance(rawVal, pt.standardLux);
                    const isFail = judgement === ILLUMINANCE_JUDGEMENT.FAIL;
                    const isPass = judgement === ILLUMINANCE_JUDGEMENT.PASS;
                    return (
                      <tr key={pt.no}>
                        <td style={{ fontWeight: 800 }}>{pt.circledNo}</td>
                        <td style={{ fontWeight: 800 }}>{pt.name}</td>
                        <td style={{ color: '#475569', fontWeight: 600 }}>{pt.building}</td>
                        <td style={{ fontWeight: 700 }}>{pt.standardLabel}</td>
                        <td style={{ padding: '4px 8px' }}>
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            step="any"
                            placeholder={`기준 ${pt.standardLux} 이상`}
                            value={rawVal}
                            onChange={(e) =>
                              setMonthlyForm((prev) => ({
                                ...prev,
                                values: { ...prev.values, [pt.no]: e.target.value }
                              }))
                            }
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              border: isFail ? '2px solid #dc2626' : '1px solid #94a3b8',
                              borderRadius: '6px',
                              fontSize: '13.5px',
                              fontWeight: 700,
                              textAlign: 'center',
                              background: isFail ? '#fef2f2' : '#fff',
                              color: isFail ? '#b91c1c' : '#0f172a'
                            }}
                          />
                        </td>
                        <td>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 700,
                              background: isFail ? '#fee2e2' : isPass ? '#dcfce3' : '#f1f5f9',
                              color: isFail ? '#991b1b' : isPass ? '#166534' : '#64748b'
                            }}
                          >
                            {judgement}
                          </span>
                        </td>
                        <td
                          style={{
                            textAlign: 'left',
                            padding: '4px 10px',
                            fontSize: '11.5px',
                            color: '#475569'
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <span>{pt.detailLocation}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setZoomImageModal({
                                  title: `${pt.circledNo} ${pt.name} (${pt.standardLabel}) 위치 도면`,
                                  image: pt.layoutImage,
                                  description: pt.detailLocation
                                })
                              }
                              style={{
                                flexShrink: 0,
                                padding: '2px 7px',
                                fontSize: '11px',
                                fontWeight: 700,
                                borderRadius: '4px',
                                border: '1px solid #cbd5e1',
                                background: '#f8fafc',
                                color: '#1e40af',
                                cursor: 'pointer'
                              }}
                            >
                              🗺️ 도면
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                marginTop: '16px'
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowMonthlyModal(false)}
              >
                취소
              </button>
              <button type="submit" className="btn btn-primary" disabled={savingMonthly}>
                {savingMonthly ? '저장 중...' : `${monthlyForm.month}월 첫째주 조도 기록 저장`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 모달 2: 개별 조도 측정 등록/수정 모달 */}
      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="조도 측정 기록"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px'
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <form
            onSubmit={handleSaveIndividual}
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '10px',
              width: '500px',
              maxWidth: '100%',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <h3 style={{ marginTop: 0 }}>{formData.id ? '조도 측정 수정' : '개별 조도 측정 등록'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle} htmlFor="illum_date">
                  측정일 *
                </label>
                <input
                  id="illum_date"
                  className="illum-field"
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="illum_time">
                  측정시간
                </label>
                <input
                  id="illum_time"
                  className="illum-field"
                  type="text"
                  placeholder="예: 10:00"
                  value={formData.measureTime || ''}
                  onChange={(e) => setFormData({ ...formData, measureTime: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="illum_location">
                  측정공정 (①~⑩) *
                </label>
                <input
                  id="illum_location"
                  className="illum-field"
                  list="illum_location_list"
                  required
                  value={formData.location}
                  onChange={(e) => {
                    const nextLoc = e.target.value;
                    const matchedPt = findIlluminancePoint(nextLoc);
                    setFormData((prev) => ({
                      ...prev,
                      pointNo: matchedPt ? matchedPt.no : prev.pointNo,
                      location: nextLoc,
                      standardLux: matchedPt ? String(matchedPt.standardLux) : prev.standardLux
                    }));
                  }}
                  placeholder="예: FMB 보관장"
                />
                <datalist id="illum_location_list">
                  {ILLUMINANCE_LOCATION_SUGGESTIONS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <div>
                <label style={labelStyle} htmlFor="illum_standard">
                  표준 lux *
                </label>
                <input
                  id="illum_standard"
                  className="illum-field"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  required
                  value={formData.standardLux}
                  onChange={(e) => setFormData({ ...formData, standardLux: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="illum_measured">
                  측정값(lux) *
                </label>
                <input
                  id="illum_measured"
                  className="illum-field"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  required
                  value={formData.measuredLux}
                  onChange={(e) => setFormData({ ...formData, measuredLux: e.target.value })}
                />
              </div>
              <div>
                <label style={labelStyle} htmlFor="illum_instrument">
                  측정기(관리번호)
                </label>
                <input
                  id="illum_instrument"
                  className="illum-field"
                  value={formData.instrument}
                  onChange={(e) => setFormData({ ...formData, instrument: e.target.value })}
                  placeholder="예: 조도계 005"
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={labelStyle} htmlFor="illum_measurer">
                  측정자
                </label>
                <input
                  id="illum_measurer"
                  className="illum-field"
                  value={formData.measurer}
                  onChange={(e) => setFormData({ ...formData, measurer: e.target.value })}
                />
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <label style={labelStyle} htmlFor="illum_remark">
                비고
              </label>
              <textarea
                id="illum_remark"
                className="illum-field"
                rows={2}
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
              />
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#475569' }}>
              판정: <strong>{judgeIlluminance(formData.measuredLux, formData.standardLux)}</strong>
              <span style={{ color: '#94a3b8' }}> (측정값이 표준 lux 이상이면 적합)</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                marginTop: '18px'
              }}
            >
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                취소
              </button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 모달 3: 도면 확대 보기 라이트박스 */}
      {zoomImageModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={zoomImageModal.title}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.78)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px'
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setZoomImageModal(null);
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '16px 20px',
              maxWidth: '1100px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                {zoomImageModal.title}
              </h3>
              <button
                type="button"
                onClick={() => setZoomImageModal(null)}
                style={{
                  padding: '4px 10px',
                  fontSize: '13px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  cursor: 'pointer'
                }}
              >
                닫기 ✕
              </button>
            </div>
            <div
              style={{
                overflow: 'auto',
                textAlign: 'center',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px'
              }}
            >
              <img
                src={zoomImageModal.image}
                alt={zoomImageModal.title}
                style={{ maxWidth: '100%', maxHeight: '74vh', objectFit: 'contain' }}
              />
            </div>
            {zoomImageModal.description && (
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                {zoomImageModal.description}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
