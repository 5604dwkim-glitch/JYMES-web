import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { printEquipmentSetCard } from '../../utils/printEquipmentSet';
import {
  getEquipmentCategory,
  getEquipmentSetCategory,
  getCategoryMeta
} from '../../constants/equipmentCategories';

const SET_SORT_STORAGE_KEY = 'jymes_eq_set_sort_order';

function compareNaturalText(a, b) {
  return String(a || '').localeCompare(String(b || ''), 'ko', {
    numeric: true,
    sensitivity: 'base'
  });
}

function getInitialSetSortOrder() {
  try {
    const saved = window.localStorage.getItem(SET_SORT_STORAGE_KEY);
    if (saved === 'asc' || saved === 'desc') return saved;
  } catch {
    // ignore storage errors
  }
  return 'asc';
}

export default function EquipmentSetConfig({ category = 'joint' }) {
  const categoryMeta = getCategoryMeta(category);
  const [equipments, setEquipments] = useState([]);
  const [equipmentSets, setEquipmentSets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [setName, setSetName] = useState('');
  const [selectedEqIds, setSelectedEqIds] = useState([]);

  // 셋트 이름 인라인 수정 상태
  const [editingSetId, setEditingSetId] = useState(null);
  const [editingSetName, setEditingSetName] = useState('');
  const [savingSetId, setSavingSetId] = useState(null);

  // 정렬 상태 (오름차순 / 내림차순)
  const [setSortOrder, setSetSortOrder] = useState(getInitialSetSortOrder);
  const [eqSortOrder, setEqSortOrder] = useState('asc');

  useEffect(() => {
    setSetName('');
    setSelectedEqIds([]);
    setEditingSetId(null);
    setEditingSetName('');
  }, [category]);

  const categoryEquipments = useMemo(
    () => equipments.filter((eq) => getEquipmentCategory(eq) === category),
    [equipments, category]
  );

  const categorySets = useMemo(
    () => equipmentSets.filter((s) => getEquipmentSetCategory(s) === category),
    [equipmentSets, category]
  );

  const equipmentById = useMemo(() => {
    const map = new Map();
    categoryEquipments.forEach((eq) => {
      if (eq?.id) map.set(eq.id, eq);
    });
    return map;
  }, [categoryEquipments]);

  const equipmentByCode = useMemo(() => {
    const map = new Map();
    categoryEquipments.forEach((eq) => {
      const code = eq?.code ? String(eq.code).trim() : '';
      if (code) map.set(code, eq);
    });
    return map;
  }, [categoryEquipments]);

  // 이미 셋트에 구성된 설비는 중복 셋팅 방지를 위해 구성할 리스트에서 제외
  const availableEquipments = useMemo(() => {
    const assignedIds = new Set();
    const assignedCodes = new Set();

    categorySets.forEach((set) => {
      if (Array.isArray(set.equipmentIds)) {
        set.equipmentIds.forEach((id) => {
          if (id) assignedIds.add(id);
        });
      }
      if (Array.isArray(set.equipments)) {
        set.equipments.forEach((item) => {
          if (item?.id) assignedIds.add(item.id);
          const code = item?.code ? String(item.code).trim() : '';
          if (code) assignedCodes.add(code);
        });
      }
    });

    const filtered = categoryEquipments.filter((eq) => {
      if (assignedIds.has(eq.id)) return false;
      const eqCode = eq.code ? String(eq.code).trim() : '';
      if (eqCode && assignedCodes.has(eqCode)) return false;
      return true;
    });

    filtered.sort((a, b) => {
      const cmp = compareNaturalText(a.code || a.name, b.code || b.name);
      if (cmp !== 0) return eqSortOrder === 'asc' ? cmp : -cmp;
      return compareNaturalText(a.name, b.name);
    });

    return filtered;
  }, [categoryEquipments, categorySets, eqSortOrder]);

  // 구성된 셋트 리스트 오름차순 / 내림차순 정렬
  const sortedEquipmentSets = useMemo(() => {
    const list = [...categorySets];
    list.sort((a, b) => {
      const cmp = compareNaturalText(a.name, b.name);
      if (cmp !== 0) return setSortOrder === 'asc' ? cmp : -cmp;
      return compareNaturalText(a.id, b.id);
    });
    return list;
  }, [categorySets, setSortOrder]);

  const handleChangeSetSortOrder = (nextOrder) => {
    setSetSortOrder(nextOrder);
    try {
      window.localStorage.setItem(SET_SORT_STORAGE_KEY, nextOrder);
    } catch {
      // ignore storage errors
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const eqQ = query(collection(db, 'equipments'), orderBy('code'));
      const eqSnapshot = await getDocs(eqQ);
      const eqData = eqSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setEquipments(eqData);

      const setQ = query(collection(db, 'equipment_sets'), orderBy('createdAt', 'desc'));
      const setSnapshot = await getDocs(setQ);
      const setData = setSnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setEquipmentSets(setData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (eqId) => {
    setSelectedEqIds(prev => {
      if (prev.includes(eqId)) {
        return prev.filter(id => id !== eqId);
      } else {
        return [...prev, eqId];
      }
    });
  };

  const handleCreateSet = async (e) => {
    e.preventDefault();
    if (!setName.trim()) {
      alert('셋트 이름을 입력해주세요.');
      return;
    }

    const availableIdSet = new Set(availableEquipments.map(eq => eq.id));
    const validSelectedIds = selectedEqIds.filter(id => availableIdSet.has(id));
    if (validSelectedIds.length === 0) {
      alert('설비를 1개 이상 선택해주세요.');
      return;
    }

    try {
      const selectedEquips = availableEquipments.filter(eq => validSelectedIds.includes(eq.id)).map(eq => ({
        id: eq.id,
        code: eq.code,
        name: eq.name,
        type: eq.type || '',
        spec: eq.spec || '',
        manufacturer: eq.manufacturer || ''
      }));

      await addDoc(collection(db, 'equipment_sets'), {
        name: setName.trim(),
        category,
        equipmentIds: validSelectedIds,
        equipments: selectedEquips,
        createdAt: serverTimestamp()
      });
      
      setSetName('');
      setSelectedEqIds([]);
      fetchData();
      alert('설비 셋트가 구성되었습니다.');
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const startEditingSet = (set) => {
    setEditingSetId(set.id);
    setEditingSetName(set.name || '');
  };

  const cancelEditingSet = () => {
    setEditingSetId(null);
    setEditingSetName('');
  };

  const handleSaveSetName = async (set) => {
    const trimmed = editingSetName.trim();
    if (!trimmed) {
      alert('셋트 이름을 입력해주세요.');
      return;
    }

    if (trimmed === (set.name || '').trim()) {
      cancelEditingSet();
      return;
    }

    setSavingSetId(set.id);
    try {
      await updateDoc(doc(db, 'equipment_sets', set.id), { name: trimmed });
      setEquipmentSets((prev) =>
        prev.map((item) => (item.id === set.id ? { ...item, name: trimmed } : item))
      );
      cancelEditingSet();
    } catch (err) {
      console.error(err);
      alert('셋트 이름 수정 중 오류가 발생했습니다.');
    } finally {
      setSavingSetId(null);
    }
  };

  const handleDeleteSet = async (setId) => {
    if (window.confirm('이 설비 셋트를 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'equipment_sets', setId));
        if (editingSetId === setId) {
          cancelEditingSet();
        }
        fetchData();
      } catch (err) {
        console.error(err);
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handlePrintSetQr = (set) => {
    let resolvedEquips = [];
    if (Array.isArray(set?.equipments) && set.equipments.length > 0) {
      resolvedEquips = set.equipments.map((item) => {
        const codeKey = item?.code ? String(item.code).trim() : '';
        const live =
          (item?.id && equipmentById.get(item.id)) ||
          (codeKey && equipmentByCode.get(codeKey)) ||
          null;
        return {
          id: live?.id || item?.id || '',
          code: live?.code || item?.code || '',
          name: live?.name || item?.name || '',
          type: live?.type || item?.type || '',
          spec: live?.spec || item?.spec || '',
          manufacturer: live?.manufacturer || item?.manufacturer || '',
          location: live?.location || item?.location || ''
        };
      });
    } else if (Array.isArray(set?.equipmentIds) && set.equipmentIds.length > 0) {
      resolvedEquips = set.equipmentIds
        .map((id) => equipmentById.get(id))
        .filter(Boolean);
    }

    printEquipmentSetCard(set, resolvedEquips);
  };

  if (loading) return <p>로딩 중...</p>;

  return (
    <div data-equipment-set-config="1" style={{ display: 'flex', gap: '24px', height: '100%' }}>
      {/* Set Creation Form */}
      <div style={{ flex: '1', minWidth: '300px', borderRight: '1px solid #cbd5e1', paddingRight: '24px' }}>
        <h3 style={{ marginTop: 0 }}>새 {categoryMeta.label} 셋트 구성하기</h3>
        <form onSubmit={handleCreateSet}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>셋트 이름</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="예: 1호기~3호기 셋트" 
              value={setName} 
              onChange={e => setSetName(e.target.value)} 
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <label style={{ fontWeight: 'bold', margin: 0 }}>필요 {categoryMeta.itemLabel} 체크</label>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  구성 가능 {availableEquipments.length}대 (제외 {categoryEquipments.length - availableEquipments.length}대)
                </span>
              </div>
              <div style={{ display: 'inline-flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setEqSortOrder('asc')}
                  style={{
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: eqSortOrder === 'asc' ? 700 : 500,
                    borderRadius: '4px',
                    border: eqSortOrder === 'asc' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                    background: eqSortOrder === 'asc' ? '#eff6ff' : '#ffffff',
                    color: eqSortOrder === 'asc' ? '#1d4ed8' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  오름차순 ▲
                </button>
                <button
                  type="button"
                  onClick={() => setEqSortOrder('desc')}
                  style={{
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: eqSortOrder === 'desc' ? 700 : 500,
                    borderRadius: '4px',
                    border: eqSortOrder === 'desc' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                    background: eqSortOrder === 'desc' ? '#eff6ff' : '#ffffff',
                    color: eqSortOrder === 'desc' ? '#1d4ed8' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  내림차순 ▼
                </button>
              </div>
            </div>
            <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '8px' }}>
              {availableEquipments.map(eq => (
                <div key={eq.id} style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type="checkbox" 
                    id={`chk-${eq.id}`}
                    checked={selectedEqIds.includes(eq.id)}
                    onChange={() => handleCheckboxChange(eq.id)}
                    style={{ marginRight: '12px', width: '16px', height: '16px' }}
                  />
                  <label htmlFor={`chk-${eq.id}`} style={{ cursor: 'pointer', flex: 1, margin: 0 }}>
                    <span style={{ fontWeight: 'bold' }}>{eq.name}</span> ({eq.code}) - {eq.type}
                  </label>
                </div>
              ))}
              {categoryEquipments.length === 0 && <p style={{ color: '#64748b', fontSize: '14px' }}>등록된 {categoryMeta.label}가 없습니다.</p>}
              {categoryEquipments.length > 0 && availableEquipments.length === 0 && (
                <p style={{ color: '#64748b', fontSize: '14px', margin: '8px' }}>
                  구성 가능한 남은 {categoryMeta.label}가 없습니다. (모든 항목이 셋트에 포함됨)
                </p>
              )}
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>셋트 구성 저장</button>
        </form>
      </div>

      {/* Set List */}
      <div style={{ flex: '2', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
          <h3 style={{ margin: 0 }}>
            구성된 {categoryMeta.label} 셋트 리스트{' '}
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
              ({sortedEquipmentSets.length}개)
            </span>
          </h3>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>이름 정렬:</span>
            <button
              type="button"
              onClick={() => handleChangeSetSortOrder('asc')}
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: setSortOrder === 'asc' ? 700 : 500,
                borderRadius: '6px',
                border: setSortOrder === 'asc' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                background: setSortOrder === 'asc' ? '#eff6ff' : '#ffffff',
                color: setSortOrder === 'asc' ? '#1d4ed8' : '#475569',
                cursor: 'pointer'
              }}
            >
              오름차순 ▲
            </button>
            <button
              type="button"
              onClick={() => handleChangeSetSortOrder('desc')}
              style={{
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: setSortOrder === 'desc' ? 700 : 500,
                borderRadius: '6px',
                border: setSortOrder === 'desc' ? '1px solid #2563eb' : '1px solid #cbd5e1',
                background: setSortOrder === 'desc' ? '#eff6ff' : '#ffffff',
                color: setSortOrder === 'desc' ? '#1d4ed8' : '#475569',
                cursor: 'pointer'
              }}
            >
              내림차순 ▼
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                <th
                  style={{ width: '24%', cursor: 'pointer', userSelect: 'none' }}
                  title="클릭하여 오름차순/내림차순 전환"
                  onClick={() => handleChangeSetSortOrder(setSortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    셋트 이름
                    <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: 700 }}>
                      {setSortOrder === 'asc' ? '▲' : '▼'}
                    </span>
                  </span>
                </th>
                <th style={{ width: '46%' }}>포함된 설비</th>
                <th style={{ width: '30%' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {sortedEquipmentSets.map((set, setIdx) => {
                const isEditing = editingSetId === set.id;
                const isSaving = savingSetId === set.id;

                return (
                  <React.Fragment key={set.id}>
                    {setIdx > 0 && (
                      // 셋트와 셋트 사이 구분용 여백 (설비 칩 한 줄 높이의 약 1/2)
                      <tr aria-hidden="true" data-eqset-spacer="1">
                        <td colSpan="3" style={{ height: '14px', padding: 0, border: 'none', background: 'transparent' }} />
                      </tr>
                    )}
                    <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                      <td style={{ fontWeight: 'bold', verticalAlign: 'middle' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input
                              type="text"
                              data-eqset-name-input={set.id}
                              className="form-control"
                              autoFocus
                              disabled={isSaving}
                              value={editingSetName}
                              onChange={(e) => setEditingSetName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleSaveSetName(set);
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  cancelEditingSet();
                                }
                              }}
                              style={{ padding: '6px 8px', fontSize: '13px', fontWeight: 700 }}
                            />
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                type="button"
                                className="btn btn-sm"
                                disabled={isSaving}
                                onClick={() => handleSaveSetName(set)}
                                style={{
                                  background: '#2563eb',
                                  color: '#ffffff',
                                  border: 'none',
                                  padding: '4px 10px',
                                  fontSize: '12px',
                                  fontWeight: 700
                                }}
                              >
                                {isSaving ? '저장 중...' : '저장'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm"
                                disabled={isSaving}
                                onClick={cancelEditingSet}
                                style={{
                                  background: '#f1f5f9',
                                  color: '#475569',
                                  border: '1px solid #cbd5e1',
                                  padding: '4px 10px',
                                  fontSize: '12px'
                                }}
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onDoubleClick={() => startEditingSet(set)}
                            title="더블클릭하거나 '이름 수정' 버튼을 눌러 수정할 수 있습니다"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                          >
                            <span>{set.name}</span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                          {set.equipments?.map(eq => {
                            const liveEq = eq?.id ? equipmentById.get(eq.id) : null;
                            const displayName = liveEq?.name || eq.name;
                            const displayCode = liveEq?.code || eq.code;
                            return (
                              <span key={eq.id || eq.code} style={{ background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', border: '1px solid #e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {displayName} ({displayCode})
                              </span>
                            );
                          })}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                className="btn btn-sm"
                                disabled={isSaving}
                                style={{ background: '#2563eb', color: '#ffffff', border: 'none', whiteSpace: 'nowrap' }}
                                onClick={() => handleSaveSetName(set)}
                              >
                                {isSaving ? '저장 중...' : '저장'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm"
                                disabled={isSaving}
                                style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', whiteSpace: 'nowrap' }}
                                onClick={cancelEditingSet}
                              >
                                취소
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-sm"
                              style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', whiteSpace: 'nowrap' }}
                              onClick={() => startEditingSet(set)}
                            >
                              이름 수정
                            </button>
                          )}
                          <button 
                            type="button"
                            className="btn btn-sm" 
                            style={{ background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', whiteSpace: 'nowrap' }}
                            onClick={() => handlePrintSetQr(set)}
                          >
                            QR 코드 출력
                          </button>
                          <button 
                            type="button"
                            className="btn btn-sm btn-secondary" 
                            style={{ background: '#fee2e2', color: '#991b1b', border: 'none', whiteSpace: 'nowrap' }}
                            onClick={() => handleDeleteSet(set.id)}
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
              {sortedEquipmentSets.length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>구성된 설비 셋트가 없습니다.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
