import React, { useState, useEffect, useMemo } from 'react';
import {
  collection,
  getDocs,
  doc,
  writeBatch,
  updateDoc,
  deleteField
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import {
  evaluateEquipmentDayTpm,
  collectUnapprovedEquipmentTpmLogs,
  getSavedManagerStamp,
  saveManagerStamp
} from '../../constants/tpmLogTemplate';
import {
  getEquipmentCategory,
  getEquipmentSetCategory
} from '../../constants/equipmentCategories';

function getTodayLocalYmd() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function shiftDateYmd(ymd, deltaDays) {
  const [y, m, d] = String(ymd || '').split('-').map(Number);
  const dt = y && m && d ? new Date(y, m - 1, d) : new Date();
  dt.setDate(dt.getDate() + deltaDays);
  const ny = dt.getFullYear();
  const nm = String(dt.getMonth() + 1).padStart(2, '0');
  const nd = String(dt.getDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

function calcElapsedDays(recordYmd, baseYmd) {
  const [ry, rm, rd] = String(recordYmd || '').split('-').map(Number);
  const [by, bm, bd] = String(baseYmd || '').split('-').map(Number);
  if (!ry || !rm || !rd || !by || !bm || !bd) return 0;
  const t1 = new Date(ry, rm - 1, rd).getTime();
  const t2 = new Date(by, bm - 1, bd).getTime();
  return Math.round((t2 - t1) / (1000 * 60 * 60 * 24));
}

function compareNaturalText(a, b) {
  return String(a || '').localeCompare(String(b || ''), 'ko', {
    numeric: true,
    sensitivity: 'base'
  });
}

const STATUS_PRIORITY = {
  issue_pending: 0,
  pending: 1,
  issue_confirmed: 2,
  confirmed: 3,
  unchecked: 4
};

export default function TpmManagement({
  category = 'joint',
  equipments: externalEquipments,
  loadingEquipments = false,
  onRefreshEquipments,
  onOpenTpmLog,
  onOpenRepairRequest
}) {
  const { userRole } = useAuth();
  const isAdmin = userRole?.role === 'admin';

  const [localEquipments, setLocalEquipments] = useState([]);
  const [allEquipmentSets, setAllEquipmentSets] = useState([]);
  const [setsLoading, setSetsLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState(getTodayLocalYmd);
  const [selectedSetFilter, setSelectedSetFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // 상단 고정 미승인 리스트 전용 상태
  const [unapprovedSubFilter, setUnapprovedSubFilter] = useState('ALL');
  const [isUnapprovedCollapsed, setIsUnapprovedCollapsed] = useState(false);
  const [selectedUnapprovedKeys, setSelectedUnapprovedKeys] = useState([]);

  const [selectedEqIds, setSelectedEqIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [managerStampInput, setManagerStampInput] = useState(() =>
    getSavedManagerStamp(userRole?.workerName)
  );

  const equipments = useMemo(() => {
    const base = externalEquipments ?? localEquipments;
    return base.filter((eq) => getEquipmentCategory(eq) === category);
  }, [externalEquipments, localEquipments, category]);

  const equipmentSets = useMemo(
    () => allEquipmentSets.filter((s) => getEquipmentSetCategory(s) === category),
    [allEquipmentSets, category]
  );

  const todayYmd = getTodayLocalYmd();

  useEffect(() => {
    setSelectedSetFilter('ALL');
    setStatusFilter('ALL');
    setSearchQuery('');
    setUnapprovedSubFilter('ALL');
    setSelectedEqIds([]);
    setSelectedUnapprovedKeys([]);
  }, [category]);

  useEffect(() => {
    let cancelled = false;
    async function loadInitial() {
      setSetsLoading(true);
      try {
        const setSnap = await getDocs(collection(db, 'equipment_sets'));
        if (!cancelled) {
          const sets = setSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          sets.sort((a, b) => compareNaturalText(a.name, b.name));
          setAllEquipmentSets(sets);
        }

        if (!externalEquipments) {
          const eqSnap = await getDocs(collection(db, 'equipments'));
          if (!cancelled) {
            setLocalEquipments(eqSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
          }
        }
      } catch (err) {
        console.error('Failed to load TPM management data:', err);
      } finally {
        if (!cancelled) setSetsLoading(false);
      }
    }
    loadInitial();
    return () => {
      cancelled = true;
    };
  }, [externalEquipments]);

  // 날짜/필터가 바뀌면 일자별 체크박스 선택 초기화
  useEffect(() => {
    setSelectedEqIds([]);
  }, [selectedDate, selectedSetFilter, statusFilter]);

  // 셋트/검색어/미승인 서브필터가 바뀌면 미승인 체크박스 선택 초기화
  useEffect(() => {
    setSelectedUnapprovedKeys([]);
  }, [selectedSetFilter, searchQuery, unapprovedSubFilter]);

  const parsedDate = useMemo(() => {
    const [y, m, d] = String(selectedDate || '').split('-').map(Number);
    if (!y || !m || !d) {
      const now = new Date();
      return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
    }
    return { year: y, month: m, day: d };
  }, [selectedDate]);

  // 설비별 소속 셋트 매핑
  const eqToSetMap = useMemo(() => {
    const byId = new Map();
    const byCode = new Map();
    equipmentSets.forEach((s) => {
      if (Array.isArray(s.equipmentIds)) {
        s.equipmentIds.forEach((id) => {
          if (id && !byId.has(id)) byId.set(id, s);
        });
      }
      if (Array.isArray(s.equipments)) {
        s.equipments.forEach((item) => {
          if (item?.id && !byId.has(item.id)) byId.set(item.id, s);
          const code = item?.code ? String(item.code).trim() : '';
          if (code && !byCode.has(code)) byCode.set(code, s);
        });
      }
    });
    return { byId, byCode };
  }, [equipmentSets]);

  // 전체 설비에서 관리자 확인이 안 된 모든 미승인(과거 이월 + 금일) TPM 일지 수집
  const allUnapprovedRows = useMemo(() => {
    const rows = [];
    equipments.forEach((eq) => {
      const codeStr = eq.code ? String(eq.code).trim() : '';
      const matchedSet =
        eqToSetMap.byId.get(eq.id) || (codeStr ? eqToSetMap.byCode.get(codeStr) : null) || null;
      const setId = matchedSet?.id || 'UNASSIGNED';
      const setName = matchedSet?.name || '';

      const entries = collectUnapprovedEquipmentTpmLogs(eq);
      entries.forEach((entry) => {
        rows.push({
          rowKey: `${eq.id}__${entry.date}`,
          eq,
          setId,
          setName,
          year: entry.year,
          month: entry.month,
          day: entry.day,
          date: entry.date,
          logKey: entry.logKey,
          evalResult: entry.evalResult,
          elapsedDays: calcElapsedDays(entry.date, todayYmd)
        });
      });
    });
    return rows;
  }, [equipments, eqToSetMap, todayYmd]);

  const unapprovedRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = allUnapprovedRows.filter((row) => {
      if (selectedSetFilter !== 'ALL' && row.setId !== selectedSetFilter) {
        return false;
      }
      if (q) {
        const hay = `${row.eq.code || ''} ${row.eq.name || ''} ${row.setName || ''} ${row.eq.location || ''} ${row.date}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    filtered.sort((a, b) => {
      // 1순위: 이상(X/△/기준이탈) 미확인 건 최우선
      const pa = STATUS_PRIORITY[a.evalResult.status] ?? 99;
      const pb = STATUS_PRIORITY[b.evalResult.status] ?? 99;
      if (pa !== pb) return pa - pb;
      // 2순위: 오래된 미승인(과거 이월 일자) 우선 노출
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      // 3순위: 설비 셋트 및 관리번호 순
      if (a.setName !== b.setName) {
        if (!a.setName) return 1;
        if (!b.setName) return -1;
        const setCmp = compareNaturalText(a.setName, b.setName);
        if (setCmp !== 0) return setCmp;
      }
      return compareNaturalText(a.eq.code || a.eq.name, b.eq.code || b.eq.name);
    });

    return filtered;
  }, [allUnapprovedRows, selectedSetFilter, searchQuery]);

  const unapprovedCounts = useMemo(() => {
    let carryOver = 0;
    let today = 0;
    let issue = 0;
    let healthy = 0;

    unapprovedRows.forEach((row) => {
      if (row.date < todayYmd) carryOver += 1;
      else if (row.date === todayYmd) today += 1;

      if (row.evalResult.status === 'issue_pending') issue += 1;
      else if (row.evalResult.status === 'pending') healthy += 1;
    });

    return {
      total: unapprovedRows.length,
      carryOver,
      today,
      issue,
      healthy,
      globalTotal: allUnapprovedRows.length
    };
  }, [unapprovedRows, allUnapprovedRows.length, todayYmd]);

  const visibleUnapprovedRows = useMemo(() => {
    if (unapprovedSubFilter === 'CARRYOVER') {
      return unapprovedRows.filter((r) => r.date < todayYmd);
    }
    if (unapprovedSubFilter === 'ISSUE') {
      return unapprovedRows.filter((r) => r.evalResult.status === 'issue_pending');
    }
    return unapprovedRows;
  }, [unapprovedRows, unapprovedSubFilter, todayYmd]);

  const visibleUnapprovedKeys = useMemo(
    () => visibleUnapprovedRows.map((r) => r.rowKey),
    [visibleUnapprovedRows]
  );

  const isAllUnapprovedChecked =
    visibleUnapprovedKeys.length > 0 &&
    visibleUnapprovedKeys.every((key) => selectedUnapprovedKeys.includes(key));

  const toggleSelectAllUnapproved = () => {
    if (isAllUnapprovedChecked) {
      setSelectedUnapprovedKeys((prev) =>
        prev.filter((key) => !visibleUnapprovedKeys.includes(key))
      );
    } else {
      setSelectedUnapprovedKeys((prev) =>
        Array.from(new Set([...prev, ...visibleUnapprovedKeys]))
      );
    }
  };

  const toggleSelectOneUnapproved = (rowKey) => {
    setSelectedUnapprovedKeys((prev) =>
      prev.includes(rowKey) ? prev.filter((k) => k !== rowKey) : [...prev, rowKey]
    );
  };

  // 전체 설비의 선택 일자(기본: 오늘) 평가 데이터
  const evaluatedRows = useMemo(() => {
    const { year, month, day } = parsedDate;
    const q = searchQuery.trim().toLowerCase();

    const list = equipments
      .map((eq) => {
        const codeStr = eq.code ? String(eq.code).trim() : '';
        const matchedSet =
          eqToSetMap.byId.get(eq.id) || (codeStr ? eqToSetMap.byCode.get(codeStr) : null) || null;
        const evalResult = evaluateEquipmentDayTpm(eq, year, month, day);
        return {
          eq,
          setId: matchedSet?.id || 'UNASSIGNED',
          setName: matchedSet?.name || '',
          year,
          month,
          day,
          date: selectedDate,
          logKey: evalResult.logKey,
          evalResult
        };
      })
      .filter((row) => {
        if (selectedSetFilter !== 'ALL' && row.setId !== selectedSetFilter) {
          return false;
        }
        if (q) {
          const hay = `${row.eq.code || ''} ${row.eq.name || ''} ${row.setName || ''} ${row.eq.location || ''}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });

    list.sort((a, b) => {
      const pa = STATUS_PRIORITY[a.evalResult.status] ?? 99;
      const pb = STATUS_PRIORITY[b.evalResult.status] ?? 99;
      if (pa !== pb) return pa - pb;
      if (a.setName !== b.setName) {
        if (!a.setName) return 1;
        if (!b.setName) return -1;
        const setCmp = compareNaturalText(a.setName, b.setName);
        if (setCmp !== 0) return setCmp;
      }
      return compareNaturalText(a.eq.code || a.eq.name, b.eq.code || b.eq.name);
    });

    return list;
  }, [equipments, eqToSetMap, parsedDate, selectedDate, selectedSetFilter, searchQuery]);

  const counts = useMemo(() => {
    let issuePending = 0;
    let pending = 0;
    let done = 0;
    let unchecked = 0;

    evaluatedRows.forEach(({ evalResult }) => {
      if (evalResult.status === 'issue_pending') issuePending += 1;
      else if (evalResult.status === 'pending') pending += 1;
      else if (evalResult.status === 'confirmed' || evalResult.status === 'issue_confirmed') done += 1;
      else unchecked += 1;
    });

    return {
      total: evaluatedRows.length,
      issuePending,
      pending,
      done,
      unchecked
    };
  }, [evaluatedRows]);

  const visibleRows = useMemo(() => {
    if (statusFilter === 'ALL') return evaluatedRows;
    if (statusFilter === 'ISSUE') {
      return evaluatedRows.filter(
        (r) => r.evalResult.status === 'issue_pending' || r.evalResult.status === 'issue_confirmed'
      );
    }
    if (statusFilter === 'PENDING') {
      return evaluatedRows.filter((r) => r.evalResult.status === 'pending');
    }
    if (statusFilter === 'DONE') {
      return evaluatedRows.filter(
        (r) => r.evalResult.status === 'confirmed' || r.evalResult.status === 'issue_confirmed'
      );
    }
    if (statusFilter === 'UNCHECKED') {
      return evaluatedRows.filter((r) => r.evalResult.status === 'unchecked');
    }
    return evaluatedRows;
  }, [evaluatedRows, statusFilter]);

  const selectableVisibleIds = useMemo(
    () =>
      visibleRows
        .filter((r) => r.evalResult.hasWorkerRecord && !r.evalResult.managerStamp)
        .map((r) => r.eq.id),
    [visibleRows]
  );

  const isAllSelectableChecked =
    selectableVisibleIds.length > 0 &&
    selectableVisibleIds.every((id) => selectedEqIds.includes(id));

  const toggleSelectAllVisible = () => {
    if (isAllSelectableChecked) {
      setSelectedEqIds((prev) => prev.filter((id) => !selectableVisibleIds.includes(id)));
    } else {
      setSelectedEqIds((prev) => Array.from(new Set([...prev, ...selectableVisibleIds])));
    }
  };

  const toggleSelectOne = (eqId) => {
    setSelectedEqIds((prev) =>
      prev.includes(eqId) ? prev.filter((id) => id !== eqId) : [...prev, eqId]
    );
  };

  const refreshDataAfterStamp = async () => {
    if (onRefreshEquipments) {
      await onRefreshEquipments(true);
    } else {
      const eqSnap = await getDocs(collection(db, 'equipments'));
      setLocalEquipments(eqSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }
  };

  // 다중 일자/다중 설비 미승인 건도 안전하게 원자적 반영되도록 설비(eq.id) 및 월(logKey) 단위로 병합 업데이트
  const applyBatchManagerStamp = async (targetRows) => {
    if (!isAdmin || submitting || targetRows.length === 0) return;

    const stampVal = saveManagerStamp(managerStampInput);
    setManagerStampInput(stampVal);

    const groupedByEq = new Map();
    targetRows.forEach((row) => {
      const eq = row.eq;
      if (!eq?.id) return;
      const targetDay = row.day ?? parsedDate.day;
      const targetLogKey = row.logKey || row.evalResult?.logKey;
      if (!targetDay || !targetLogKey) return;

      if (!groupedByEq.has(eq.id)) {
        groupedByEq.set(eq.id, { eq, byLogKey: new Map() });
      }
      const entry = groupedByEq.get(eq.id);
      if (!entry.byLogKey.has(targetLogKey)) {
        entry.byLogKey.set(targetLogKey, new Set());
      }
      entry.byLogKey.get(targetLogKey).add(targetDay);
    });

    const eqEntries = Array.from(groupedByEq.values());
    if (eqEntries.length === 0) return;

    setSubmitting(true);
    try {
      const chunkSize = 400;
      for (let i = 0; i < eqEntries.length; i += chunkSize) {
        const slice = eqEntries.slice(i, i + chunkSize);
        const batch = writeBatch(db);

        slice.forEach(({ eq, byLogKey }) => {
          const ref = doc(db, 'equipments', eq.id);
          const payload = {};

          byLogKey.forEach((daySet, logKey) => {
            const existingLog = eq.tpmLogs?.[logKey];
            if (existingLog?.manager && typeof existingLog.manager === 'object') {
              daySet.forEach((d) => {
                payload[`tpmLogs.${logKey}.manager.${d}`] = stampVal;
              });
            } else {
              const mergedManager = { ...(existingLog?.manager || {}) };
              daySet.forEach((d) => {
                mergedManager[d] = stampVal;
              });
              payload[`tpmLogs.${logKey}.manager`] = mergedManager;
            }
          });

          if (Object.keys(payload).length > 0) {
            batch.update(ref, payload);
          }
        });

        await batch.commit();
      }

      setSelectedEqIds([]);
      setSelectedUnapprovedKeys([]);
      await refreshDataAfterStamp();
    } catch (err) {
      console.error('Failed to batch update manager stamps:', err);
      alert('관리자 확인 처리 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  // 상단 미승인 리스트 일괄 확인 핸들러
  const handleBulkConfirmUnapprovedHealthy = () => {
    const healthyUnapproved = unapprovedRows.filter((r) => r.evalResult.status === 'pending');
    if (healthyUnapproved.length === 0) return;
    applyBatchManagerStamp(healthyUnapproved);
  };

  const handleBulkConfirmUnapprovedSelected = () => {
    const keySet = new Set(selectedUnapprovedKeys);
    const targetRows = unapprovedRows.filter((r) => keySet.has(r.rowKey));
    if (targetRows.length === 0) return;
    applyBatchManagerStamp(targetRows);
  };

  // 선택 일자(기본: 오늘) 테이블 일괄 확인 핸들러
  const handleBulkConfirmHealthy = () => {
    const healthyPendingRows = evaluatedRows.filter((r) => r.evalResult.status === 'pending');
    if (healthyPendingRows.length === 0) return;
    applyBatchManagerStamp(healthyPendingRows);
  };

  const handleBulkConfirmSelected = () => {
    const selectedSet = new Set(selectedEqIds);
    const targetRows = evaluatedRows.filter(
      (r) => selectedSet.has(r.eq.id) && r.evalResult.hasWorkerRecord && !r.evalResult.managerStamp
    );
    if (targetRows.length === 0) return;
    applyBatchManagerStamp(targetRows);
  };

  const handleSingleClearManagerStamp = async (row) => {
    if (!isAdmin || submitting) return;
    const targetDay = row.day ?? parsedDate.day;
    const targetLogKey = row.logKey || row.evalResult.logKey;

    setSubmitting(true);
    try {
      await updateDoc(doc(db, 'equipments', row.eq.id), {
        [`tpmLogs.${targetLogKey}.manager.${targetDay}`]: deleteField()
      });
      await refreshDataAfterStamp();
    } catch (err) {
      console.error('Failed to clear manager stamp:', err);
      alert('관리자 확인 취소 중 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'issue_pending':
        return (
          <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, background: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', whiteSpace: 'nowrap' }}>
            🔴 이상 (미확인)
          </span>
        );
      case 'pending':
        return (
          <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', whiteSpace: 'nowrap' }}>
            🟢 점검완료 (미확인)
          </span>
        );
      case 'issue_confirmed':
        return (
          <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, background: '#ffedd5', color: '#c2410c', border: '1px solid #fdba74', whiteSpace: 'nowrap' }}>
            🟠 이상 확인됨
          </span>
        );
      case 'confirmed':
        return (
          <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: 700, background: '#dbeafe', color: '#1d4ed8', border: '1px solid #93c5fd', whiteSpace: 'nowrap' }}>
            🔵 확인 완료
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, background: '#f1f5f9', color: '#64748b', border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}>
            ⚪ 미점검
          </span>
        );
    }
  };

  const renderRecordSummary = (evalResult) => {
    if (!evalResult.hasWorkerRecord) {
      return <span style={{ color: '#94a3b8' }}>당일 점검 기록 없음</span>;
    }
    const isIssue = evalResult.issues.length > 0;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
        <span style={{ fontWeight: 700, color: '#334155' }}>
          {evalResult.checkedCount}/{evalResult.totalRows}항목 기록
        </span>
        {evalResult.issues.map((iss, idx) => (
          <span
            key={idx}
            style={{
              padding: '2px 7px',
              borderRadius: '4px',
              background: '#fee2e2',
              color: '#b91c1c',
              fontWeight: 700,
              border: '1px solid #fca5a5'
            }}
          >
            ⚠️ {iss.label}
          </span>
        ))}
        {!isIssue &&
          evalResult.numericHighlights.map((txt, idx) => (
            <span
              key={idx}
              style={{
                padding: '2px 7px',
                borderRadius: '4px',
                background: '#f1f5f9',
                color: '#334155',
                border: '1px solid #e2e8f0'
              }}
            >
              {txt}
            </span>
          ))}
      </div>
    );
  };

  if (loadingEquipments || setsLoading) {
    return <p style={{ color: '#64748b' }}>TPM 일지 현황을 불러오는 중...</p>;
  }

  return (
    <div data-tpm-management="1" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* 상단 제어 바: 날짜 선택(기본 오늘) + 셋트 필터 + 검색 + 관리자 서명 설정 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>점검 일자:</span>
          <button
            type="button"
            onClick={() => setSelectedDate((d) => shiftDateYmd(d, -1))}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
          >
            ◀ 전일
          </button>
          <input
            type="date"
            max="9999-12-31"
            value={selectedDate}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700, color: '#0f172a', background: '#fff' }}
          />
          <button
            type="button"
            onClick={() => setSelectedDate((d) => shiftDateYmd(d, 1))}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
          >
            익일 ▶
          </button>
          <button
            type="button"
            onClick={() => setSelectedDate(getTodayLocalYmd())}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #93c5fd', background: '#eff6ff', color: '#1d4ed8', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
          >
            오늘
          </button>

          <select
            value={selectedSetFilter}
            onChange={(e) => setSelectedSetFilter(e.target.value)}
            style={{ marginLeft: '6px', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600, background: '#fff', color: '#1e293b' }}
          >
            <option value="ALL">전체 설비 셋트 ({equipments.length}대)</option>
            {equipmentSets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({(s.equipments || s.equipmentIds || []).length}대)
              </option>
            ))}
            <option value="UNASSIGNED">셋트 미지정 설비</option>
          </select>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="관리번호 / 설비명 검색"
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', width: '170px', background: '#fff' }}
          />
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#334155', margin: 0 }}>
              <span>관리자 확인 표기:</span>
              <input
                type="text"
                maxLength={6}
                value={managerStampInput}
                onChange={(e) => setManagerStampInput(e.target.value)}
                onBlur={() => setManagerStampInput(saveManagerStamp(managerStampInput))}
                placeholder="예: 김OO / 확인"
                style={{
                  width: '88px',
                  padding: '6px 8px',
                  fontSize: '12px',
                  fontWeight: 800,
                  textAlign: 'center',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  background: '#fff',
                  color: '#0f172a'
                }}
              />
            </label>
          </div>
        )}
      </div>

      {/* 상단 고정 미승인(관리자 미확인) 리스트 영역 */}
      <div
        data-tpm-unapproved-section="1"
        style={{
          border:
            unapprovedCounts.total === 0
              ? '1px solid #bbf7d0'
              : unapprovedCounts.issue > 0
                ? '2px solid #fca5a5'
                : '2px solid #fcd34d',
          borderRadius: '10px',
          background: '#ffffff',
          overflow: 'hidden'
        }}
      >
        {unapprovedCounts.total === 0 ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              padding: '10px 16px',
              background: '#f0fdf4'
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534' }}>
              ✅ 미승인 리스트 — 관리자 확인이 안 된 TPM 점검 일지가 없습니다.
              {unapprovedCounts.globalTotal > 0 && (
                <span style={{ marginLeft: '8px', color: '#b45309', fontWeight: 800 }}>
                  (현재 필터 외 전체 설비 기준 미승인 {unapprovedCounts.globalTotal}건 있음)
                </span>
              )}
            </div>
            {unapprovedCounts.globalTotal > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSetFilter('ALL');
                  setSearchQuery('');
                }}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: '1px solid #fcd34d',
                  background: '#fffbeb',
                  color: '#92400e',
                  cursor: 'pointer'
                }}
              >
                필터 해제하고 보기
              </button>
            )}
          </div>
        ) : (
          <>
            {/* 미승인 섹션 헤더 및 일괄 승인 제어 바 */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                padding: '12px 16px',
                background: unapprovedCounts.issue > 0 ? '#fef2f2' : '#fffbeb',
                borderBottom: isUnapprovedCollapsed ? 'none' : '1px solid #fde68a'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '14px', fontWeight: 900, color: unapprovedCounts.issue > 0 ? '#991b1b' : '#92400e' }}>
                  📌 미승인 TPM 일지 리스트 (관리자 미확인)
                </span>
                <span
                  style={{
                    padding: '3px 9px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 800,
                    background: unapprovedCounts.issue > 0 ? '#dc2626' : '#d97706',
                    color: '#ffffff'
                  }}
                >
                  총 {unapprovedCounts.total}건 대기
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                  (이전 일자 이월 {unapprovedCounts.carryOver}건 · 금일 {unapprovedCounts.today}건)
                </span>

                {/* 미승인 내부 빠른 필터 탭 */}
                <div style={{ display: 'inline-flex', gap: '4px', marginLeft: '4px', flexWrap: 'wrap' }}>
                  {[
                    { key: 'ALL', label: `전체 (${unapprovedCounts.total})` },
                    { key: 'CARRYOVER', label: `이월 미승인 (${unapprovedCounts.carryOver})` },
                    { key: 'ISSUE', label: `🔴 이상 (${unapprovedCounts.issue})` }
                  ].map((tab) => {
                    const active = unapprovedSubFilter === tab.key;
                    return (
                      <button
                        key={tab.key}
                        type="button"
                        onClick={() => {
                          setUnapprovedSubFilter(tab.key);
                          if (isUnapprovedCollapsed) setIsUnapprovedCollapsed(false);
                        }}
                        style={{
                          padding: '4px 9px',
                          fontSize: '11px',
                          fontWeight: 800,
                          borderRadius: '999px',
                          border: active ? '1px solid #0f172a' : '1px solid #cbd5e1',
                          background: active ? '#0f172a' : '#ffffff',
                          color: active ? '#ffffff' : '#334155',
                          cursor: 'pointer'
                        }}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      disabled={submitting || selectedUnapprovedKeys.length === 0}
                      onClick={handleBulkConfirmUnapprovedSelected}
                      style={{
                        padding: '7px 12px',
                        borderRadius: '6px',
                        border: '1px solid #93c5fd',
                        background: selectedUnapprovedKeys.length > 0 ? '#ffffff' : '#e2e8f0',
                        color: selectedUnapprovedKeys.length > 0 ? '#1d4ed8' : '#94a3b8',
                        fontWeight: 700,
                        fontSize: '12px',
                        cursor: submitting || selectedUnapprovedKeys.length === 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      선택 미승인 확인 ({selectedUnapprovedKeys.length}건)
                    </button>
                    <button
                      type="button"
                      disabled={submitting || unapprovedCounts.healthy === 0}
                      onClick={handleBulkConfirmUnapprovedHealthy}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '6px',
                        border: 'none',
                        background: unapprovedCounts.healthy > 0 ? '#16a34a' : '#cbd5e1',
                        color: unapprovedCounts.healthy > 0 ? '#ffffff' : '#64748b',
                        fontWeight: 800,
                        fontSize: '12px',
                        cursor: submitting || unapprovedCounts.healthy === 0 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {submitting ? '처리 중...' : `✓ 양호 미승인 일괄 확인 (${unapprovedCounts.healthy}건)`}
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setIsUnapprovedCollapsed((v) => !v)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#334155',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {isUnapprovedCollapsed ? '펼치기 ▼' : '접기 ▲'}
                </button>
              </div>
            </div>

            {!isUnapprovedCollapsed && (
              <div style={{ overflowX: 'auto' }}>
                <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                      {isAdmin && (
                        <th style={{ width: '40px', textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isAllUnapprovedChecked}
                            disabled={visibleUnapprovedKeys.length === 0}
                            onChange={toggleSelectAllUnapproved}
                            title="미승인 항목 전체 선택"
                            style={{
                              width: '15px',
                              height: '15px',
                              cursor: visibleUnapprovedKeys.length > 0 ? 'pointer' : 'not-allowed'
                            }}
                          />
                        </th>
                      )}
                      <th style={{ width: '155px' }}>점검 일자</th>
                      <th style={{ width: '140px' }}>점검 상태</th>
                      <th style={{ width: '145px' }}>설비 셋트</th>
                      <th style={{ width: '110px' }}>관리번호</th>
                      <th style={{ width: '145px' }}>설비명</th>
                      <th>점검 요약</th>
                      <th style={{ width: '95px', textAlign: 'center' }}>작업자 확인</th>
                      <th style={{ width: '145px', textAlign: 'center' }}>관리자 확인</th>
                      <th style={{ width: '165px', textAlign: 'center' }}>상세 / 조치</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleUnapprovedRows.map((row) => {
                      const { rowKey, eq, setName, evalResult, date, elapsedDays } = row;
                      const isChecked = selectedUnapprovedKeys.includes(rowKey);
                      const isIssue = evalResult.issues.length > 0;
                      const isCarryOver = date < todayYmd;

                      return (
                        <tr
                          key={rowKey}
                          style={{
                            borderBottom: '1px solid #e2e8f0',
                            background: isIssue
                              ? '#fef2f2'
                              : isChecked
                                ? '#eff6ff'
                                : isCarryOver
                                  ? '#fffdf5'
                                  : '#ffffff'
                          }}
                        >
                          {isAdmin && (
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSelectOneUnapproved(rowKey)}
                                title="일괄 관리자 확인 선택"
                                style={{ width: '15px', height: '15px', cursor: 'pointer' }}
                              />
                            </td>
                          )}
                          <td>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => setSelectedDate(date)}
                                title="클릭 시 하단 일자별 현황을 해당 날짜로 전환"
                                style={{
                                  padding: 0,
                                  border: 'none',
                                  background: 'transparent',
                                  fontWeight: 800,
                                  fontSize: '13px',
                                  color: '#0f172a',
                                  cursor: 'pointer',
                                  textDecoration: selectedDate === date ? 'none' : 'underline'
                                }}
                              >
                                {date}
                              </button>
                              {isCarryOver ? (
                                <span
                                  style={{
                                    padding: '2px 6px',
                                    borderRadius: '999px',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    background: elapsedDays >= 3 ? '#fee2e2' : '#fef3c7',
                                    color: elapsedDays >= 3 ? '#b91c1c' : '#b45309',
                                    border: elapsedDays >= 3 ? '1px solid #fca5a5' : '1px solid #fcd34d',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  이월 D+{elapsedDays}
                                </span>
                              ) : date === todayYmd ? (
                                <span
                                  style={{
                                    padding: '2px 6px',
                                    borderRadius: '999px',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    background: '#dbeafe',
                                    color: '#1d4ed8',
                                    border: '1px solid #93c5fd',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  오늘
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td>{renderStatusBadge(evalResult.status)}</td>
                          <td style={{ fontSize: '13px', fontWeight: 700, color: setName ? '#1e293b' : '#94a3b8' }}>
                            {setName || '-'}
                          </td>
                          <td style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>{eq.code}</td>
                          <td style={{ fontWeight: 600, fontSize: '13px' }}>{eq.name}</td>
                          <td style={{ fontSize: '12px' }}>{renderRecordSummary(evalResult)}</td>
                          <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '12px', color: evalResult.workerStamp ? '#0f172a' : '#475569' }}>
                            {evalResult.workerStamp || '점검입력됨'}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {isAdmin ? (
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => applyBatchManagerStamp([row])}
                                style={{
                                  padding: '4px 12px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  borderRadius: '6px',
                                  border: isIssue ? '1px solid #f87171' : '1px solid #86efac',
                                  background: isIssue ? '#fef2f2' : '#dcfce7',
                                  color: isIssue ? '#b91c1c' : '#166534',
                                  cursor: submitting ? 'not-allowed' : 'pointer',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {isIssue ? '이상내용 확인승인' : '관리자 확인'}
                              </button>
                            ) : (
                              <span style={{ fontSize: '12px', color: '#b45309', fontWeight: 700 }}>미승인</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                              {onOpenTpmLog && (
                                <button
                                  type="button"
                                  onClick={() => onOpenTpmLog(eq, row.year, row.month)}
                                  style={{
                                    padding: '4px 10px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    borderRadius: '4px',
                                    border: '1px solid #cbd5e1',
                                    background: '#f8fafc',
                                    color: '#1e293b',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  일지 열기
                                </button>
                              )}
                              {isIssue && onOpenRepairRequest && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onOpenRepairRequest(eq, {
                                      date: row.date,
                                      issues: evalResult.issues,
                                      setName,
                                      workerName: evalResult.workerStamp || ''
                                    })
                                  }
                                  style={{
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    borderRadius: '4px',
                                    border: '1px solid #c7d2fe',
                                    background: '#e0e7ff',
                                    color: '#3730a3',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  수리의뢰서
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {visibleUnapprovedRows.length === 0 && (
                      <tr>
                        <td colSpan={isAdmin ? 10 : 9} style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                          선택한 미승인 세부 조건에 해당하는 항목이 없습니다.{' '}
                          <button
                            type="button"
                            onClick={() => setUnapprovedSubFilter('ALL')}
                            style={{
                              marginLeft: '6px',
                              padding: '3px 8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                              background: '#fff',
                              color: '#1d4ed8',
                              cursor: 'pointer'
                            }}
                          >
                            전체 미승인 보기 ({unapprovedCounts.total}건)
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* 하단 섹션 구분 헤더: 선택 일자(기본: 오늘) 전체 설비 현황 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>
            📅 일자별 전체 설비 TPM 점검 현황
          </span>
          <span
            style={{
              padding: '3px 9px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 800,
              background: selectedDate === todayYmd ? '#dbeafe' : '#f1f5f9',
              color: selectedDate === todayYmd ? '#1d4ed8' : '#334155',
              border: selectedDate === todayYmd ? '1px solid #93c5fd' : '1px solid #cbd5e1'
            }}
          >
            기준일: {selectedDate} {selectedDate === todayYmd ? '(오늘)' : ''}
          </span>
          {selectedDate !== todayYmd && (
            <button
              type="button"
              onClick={() => setSelectedDate(todayYmd)}
              style={{
                padding: '3px 9px',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '6px',
                border: '1px solid #93c5fd',
                background: '#eff6ff',
                color: '#1d4ed8',
                cursor: 'pointer'
              }}
            >
              오늘({todayYmd}) 기준으로 복귀
            </button>
          )}
        </div>
      </div>

      {/* 상태 요약 카드 (클릭 시 상태별 필터링) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(130px, 1fr))', gap: '10px' }}>
        {[
          { key: 'ALL', label: '전체 대상 설비', count: counts.total, bg: '#ffffff', activeBg: '#f1f5f9', border: '#cbd5e1', activeBorder: '#475569', color: '#0f172a' },
          { key: 'ISSUE', label: '🔴 이상 발생 (X/△)', count: counts.issuePending, bg: counts.issuePending > 0 ? '#fef2f2' : '#ffffff', activeBg: '#fee2e2', border: counts.issuePending > 0 ? '#fca5a5' : '#cbd5e1', activeBorder: '#dc2626', color: '#b91c1c' },
          { key: 'PENDING', label: '🟢 점검완료 (미확인)', count: counts.pending, bg: counts.pending > 0 ? '#f0fdf4' : '#ffffff', activeBg: '#dcfce7', border: counts.pending > 0 ? '#86efac' : '#cbd5e1', activeBorder: '#16a34a', color: '#15803d' },
          { key: 'DONE', label: '🔵 관리자 확인 완료', count: counts.done, bg: '#ffffff', activeBg: '#dbeafe', border: '#cbd5e1', activeBorder: '#2563eb', color: '#1d4ed8' },
          { key: 'UNCHECKED', label: '⚪ 미점검 (미작성)', count: counts.unchecked, bg: '#ffffff', activeBg: '#f1f5f9', border: '#cbd5e1', activeBorder: '#64748b', color: '#475569' }
        ].map((card) => {
          const active = statusFilter === card.key;
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => setStatusFilter(card.key)}
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                border: active ? `2px solid ${card.activeBorder}` : `1px solid ${card.border}`,
                background: active ? card.activeBg : card.bg,
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px'
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>{card.label}</span>
              <span style={{ fontSize: '22px', fontWeight: 900, color: card.color }}>{card.count}대</span>
            </button>
          );
        })}
      </div>

      {/* 선택 일자 일괄 확인 액션 바 */}
      {isAdmin && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', padding: '10px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px' }}>
          <div style={{ fontSize: '13px', color: '#1e3a8a', fontWeight: 600 }}>
            💡 기준일({selectedDate}) 작업자 점검 완료 설비 중 <strong>이상(X/△)</strong> 발생 설비는 상단에 우선 표시됩니다.
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              disabled={submitting || selectedEqIds.length === 0}
              onClick={handleBulkConfirmSelected}
              style={{
                padding: '8px 14px',
                borderRadius: '6px',
                border: '1px solid #93c5fd',
                background: selectedEqIds.length > 0 ? '#ffffff' : '#e2e8f0',
                color: selectedEqIds.length > 0 ? '#1d4ed8' : '#94a3b8',
                fontWeight: 700,
                fontSize: '13px',
                cursor: submitting || selectedEqIds.length === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              선택 설비 관리자 확인 ({selectedEqIds.length}대)
            </button>
            <button
              type="button"
              disabled={submitting || counts.pending === 0}
              onClick={handleBulkConfirmHealthy}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: counts.pending > 0 ? '#16a34a' : '#cbd5e1',
                color: counts.pending > 0 ? '#ffffff' : '#64748b',
                fontWeight: 800,
                fontSize: '13px',
                cursor: submitting || counts.pending === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? '처리 중...' : `✓ 당일 양호 미확인 일괄 관리자 확인 (${counts.pending}대)`}
            </button>
          </div>
        </div>
      )}

      {/* 설비별 당일 TPM 점검 목록 테이블 */}
      <div style={{ overflowX: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #cbd5e1', background: '#f8fafc' }}>
              {isAdmin && (
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelectableChecked}
                    disabled={selectableVisibleIds.length === 0}
                    onChange={toggleSelectAllVisible}
                    title="미확인 점검완료 설비 전체 선택"
                    style={{ width: '15px', height: '15px', cursor: selectableVisibleIds.length > 0 ? 'pointer' : 'not-allowed' }}
                  />
                </th>
              )}
              <th style={{ width: '140px' }}>점검 상태</th>
              <th style={{ width: '150px' }}>설비 셋트</th>
              <th style={{ width: '115px' }}>관리번호</th>
              <th style={{ width: '150px' }}>설비명</th>
              <th>당일 점검 요약</th>
              <th style={{ width: '95px', textAlign: 'center' }}>작업자 확인</th>
              <th style={{ width: '150px', textAlign: 'center' }}>관리자 확인</th>
              <th style={{ width: '165px', textAlign: 'center' }}>상세 / 조치</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const { eq, setName, evalResult } = row;
              const canSelect = evalResult.hasWorkerRecord && !evalResult.managerStamp;
              const isChecked = selectedEqIds.includes(eq.id);
              const isIssue = evalResult.issues.length > 0;

              return (
                <tr
                  key={eq.id}
                  style={{
                    borderBottom: '1px solid #e2e8f0',
                    background:
                      evalResult.status === 'issue_pending'
                        ? '#fef2f2'
                        : isChecked
                          ? '#eff6ff'
                          : '#ffffff'
                  }}
                >
                  {isAdmin && (
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={!canSelect}
                        onChange={() => toggleSelectOne(eq.id)}
                        title={canSelect ? '일괄 관리자 확인 선택' : '작업자 미점검 또는 이미 확인 완료됨'}
                        style={{ width: '15px', height: '15px', cursor: canSelect ? 'pointer' : 'not-allowed' }}
                      />
                    </td>
                  )}
                  <td>{renderStatusBadge(evalResult.status)}</td>
                  <td style={{ fontSize: '13px', fontWeight: 700, color: setName ? '#1e293b' : '#94a3b8' }}>
                    {setName || '-'}
                  </td>
                  <td style={{ fontWeight: 800, color: '#0f172a', fontSize: '13px' }}>{eq.code}</td>
                  <td style={{ fontWeight: 600, fontSize: '13px' }}>{eq.name}</td>
                  <td style={{ fontSize: '12px' }}>{renderRecordSummary(evalResult)}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700, fontSize: '12px', color: evalResult.workerStamp ? '#0f172a' : '#94a3b8' }}>
                    {evalResult.workerStamp || (evalResult.hasWorkerRecord ? '점검입력됨' : '-')}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {evalResult.managerStamp ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 800, fontSize: '13px', color: '#1d4ed8' }}>
                          ✓ {evalResult.managerStamp}
                        </span>
                        {isAdmin && (
                          <button
                            type="button"
                            disabled={submitting}
                            onClick={() => handleSingleClearManagerStamp(row)}
                            style={{
                              padding: '2px 6px',
                              fontSize: '11px',
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                              background: '#f8fafc',
                              color: '#64748b',
                              cursor: 'pointer'
                            }}
                          >
                            취소
                          </button>
                        )}
                      </div>
                    ) : evalResult.hasWorkerRecord && isAdmin ? (
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => applyBatchManagerStamp([row])}
                        style={{
                          padding: '4px 12px',
                          fontSize: '12px',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: isIssue ? '1px solid #f87171' : '1px solid #86efac',
                          background: isIssue ? '#fef2f2' : '#dcfce7',
                          color: isIssue ? '#b91c1c' : '#166534',
                          cursor: submitting ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {isIssue ? '이상내용 확인승인' : '관리자 확인'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>-</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {onOpenTpmLog && (
                        <button
                          type="button"
                          onClick={() => onOpenTpmLog(eq, parsedDate.year, parsedDate.month)}
                          style={{
                            padding: '4px 10px',
                            fontSize: '12px',
                            fontWeight: 700,
                            borderRadius: '4px',
                            border: '1px solid #cbd5e1',
                            background: '#f8fafc',
                            color: '#1e293b',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          일지 열기
                        </button>
                      )}
                      {isIssue && onOpenRepairRequest && (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenRepairRequest(eq, {
                              date: selectedDate,
                              issues: evalResult.issues,
                              setName,
                              workerName: evalResult.workerStamp || ''
                            })
                          }
                          style={{
                            padding: '4px 8px',
                            fontSize: '12px',
                            fontWeight: 700,
                            borderRadius: '4px',
                            border: '1px solid #c7d2fe',
                            background: '#e0e7ff',
                            color: '#3730a3',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          수리의뢰서
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 9 : 8} style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                  해당 조건에 일치하는 설비가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
