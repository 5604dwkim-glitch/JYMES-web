import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../firebase';
import TpmManagement from './TpmManagement';
import EquipmentHistoryCardModal, {
  createDefaultAncillaryEquipments,
  createEmptyAncillaryEquipments,
  DEFAULT_EQUIPMENT_PHOTO_1,
  DEFAULT_EQUIPMENT_PHOTO_2
} from './EquipmentHistoryCardModal';
import EquipmentRepairRequestModal from './EquipmentRepairRequestModal';
import EquipmentTpmLogModal from './EquipmentTpmLogModal';
import EquipmentSetConfig from './EquipmentSetConfig';
import { invalidateEquipmentsCache } from '../../services/firestore';
import { syncEquipmentRepairToChangePoint } from '../../services/changePointAutoSync';
import { hasEquipmentTpmLog } from '../../constants/tpmLogTemplate';
import {
  EQUIPMENT_CATEGORIES,
  getEquipmentCategory,
  getCalibrationGroup,
  getCategoryMeta,
  createInitialEquipmentForm
} from '../../constants/equipmentCategories';
import CalibrationInstrumentListView, {
  CALIBRATION_INSTRUMENT_FILTER_COLUMNS,
  CALIBRATION_EQUIPMENT_FILTER_COLUMNS,
  getCalibrationInstrumentColValue,
  getCalibrationEquipmentColValue,
  normalizeCalIsoDate,
  computeNextCalibrationIsoDate
} from './CalibrationInstrumentListView';
import CalibrationInstrumentCardModal from './CalibrationInstrumentCardModal';

const FILTER_COLUMNS = [
  { key: 'location', label: '위치' },
  { key: 'code', label: '관리번호' },
  { key: 'name', label: '설비명' },
  { key: 'type', label: '분류' },
  { key: 'spec', label: '사양' },
  { key: 'manufacturer', label: '제작처' },
  { key: 'ownership', label: '소유' },
  { key: 'status', label: '상태' },
  { key: 'installDate', label: '도입일자' }
];

function getEquipColValue(eq, key) {
  const raw = eq?.[key];
  const trimmed = raw !== undefined && raw !== null ? String(raw).trim() : '';
  return trimmed || '-';
}

const VALID_CATEGORY_IDS = new Set(EQUIPMENT_CATEGORIES.map((c) => c.id));

export default function EquipmentManagement() {
  const { userRole } = useAuth();
  const { category: categoryParam } = useParams();
  const routeLocation = useLocation();
  const routeNavigate = useNavigate();

  const activeCategory = VALID_CATEGORY_IDS.has(categoryParam) ? categoryParam : 'joint';
  const [activeTab, setActiveTab] = useState('list');
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Column Filter State
  const [colFilters, setColFilters] = useState({});
  const [openFilterCol, setOpenFilterCol] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0, maxHeight: 340 });
  const [filterSearch, setFilterSearch] = useState('');
  const popoverRef = useRef(null);
  const migratedLegacyCategoryRef = useRef(false);

  // Form & Modal State
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyAutoSyncKey, setHistoryAutoSyncKey] = useState('');
  const [showTpmLogModal, setShowTpmLogModal] = useState(false);
  const [tpmModalPeriod, setTpmModalPeriod] = useState(null);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [repairInitialContext, setRepairInitialContext] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [formData, setFormData] = useState(() => createInitialEquipmentForm('joint'));

  const currentCategoryMeta = useMemo(
    () => getCategoryMeta(activeCategory),
    [activeCategory]
  );
  const hasSetConfig =
    currentCategoryMeta.hasSetConfig !== false && Boolean(currentCategoryMeta.tabLabels?.config);
  const hasTpmTab =
    currentCategoryMeta.hasTpmTab !== false && Boolean(currentCategoryMeta.tabLabels?.tpm);
  const hasEquipCalibrationTab = Boolean(currentCategoryMeta.tabLabels?.equipCalibration);
  const effectiveTab =
    (!hasSetConfig && activeTab === 'config') ||
    (!hasTpmTab && activeTab === 'tpm') ||
    (!hasEquipCalibrationTab && activeTab === 'equipCalibration')
      ? 'list'
      : activeTab;
  const isEquipCalibrationView =
    activeCategory === 'measuring' && effectiveTab === 'equipCalibration';
  const isCalibrationSheetView =
    activeCategory === 'measuring' &&
    (effectiveTab === 'list' || effectiveTab === 'equipCalibration');
  const isListViewTab =
    effectiveTab === 'list' || (hasEquipCalibrationTab && effectiveTab === 'equipCalibration');
  const activeFilterColumns =
    activeCategory === 'measuring'
      ? isEquipCalibrationView
        ? CALIBRATION_EQUIPMENT_FILTER_COLUMNS
        : CALIBRATION_INSTRUMENT_FILTER_COLUMNS
      : FILTER_COLUMNS;
  const getActiveColValue =
    activeCategory === 'measuring'
      ? isEquipCalibrationView
        ? getCalibrationEquipmentColValue
        : getCalibrationInstrumentColValue
      : getEquipColValue;

  // 사이드바 하위 메뉴 또는 리스트 탭 전환 시 컬럼 필터 초기화 (미지원 탭은 리스트 탭으로 복귀)
  useEffect(() => {
    setColFilters({});
    setOpenFilterCol(null);
    setFilterSearch('');
    setActiveTab((prev) => {
      if (!hasSetConfig && prev === 'config') return 'list';
      if (!hasTpmTab && prev === 'tpm') return 'list';
      if (!hasEquipCalibrationTab && prev === 'equipCalibration') return 'list';
      return prev;
    });
  }, [activeCategory, hasSetConfig, hasTpmTab, hasEquipCalibrationTab]);

  useEffect(() => {
    setColFilters({});
    setOpenFilterCol(null);
    setFilterSearch('');
  }, [effectiveTab]);

  useEffect(() => {
    fetchEquipments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 대시보드 "비가동 → 수리 → 변동점 연계 현황" 등에서 이동해 온 경우 해당 카테고리 경로로 이동 후 설비 이력카드 오픈
  const historyDeepLinkDoneRef = useRef(false);
  useEffect(() => {
    const target = routeLocation.state?.openHistory;
    if (!target?.equipmentId || historyDeepLinkDoneRef.current || equipments.length === 0) return;
    historyDeepLinkDoneRef.current = true;
    const eq = equipments.find((e) => e.id === target.equipmentId);
    if (eq) {
      const targetCat = getEquipmentCategory(eq);
      setActiveTab('list');
      setSelectedEquipment(eq);
      setHistoryAutoSyncKey(target.autoSyncKey || '');
      setShowHistoryModal(true);
      routeNavigate(`/equipment/${targetCat}`, { replace: true, state: null });
      return;
    }
    routeNavigate('/equipment/joint', { replace: true, state: null });
  }, [routeLocation, routeNavigate, equipments]);

  const fetchEquipments = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'equipments'));
      const legacyDocsToStamp = [];
      const data = snapshot.docs.map((d) => {
        const raw = d.data();
        if (!raw.category) {
          legacyDocsToStamp.push(d.id);
        }
        return {
          id: d.id,
          ...raw,
          category: getEquipmentCategory(raw)
        };
      });

      // 기존 등록되어 있던 설비 문서들에 category: 'joint' 를 1회 백그라운드 태깅하여 조인트 설비 카테고리로 영구 이관
      if (
        userRole?.role === 'admin' &&
        !migratedLegacyCategoryRef.current &&
        legacyDocsToStamp.length > 0
      ) {
        migratedLegacyCategoryRef.current = true;
        (async () => {
          try {
            const chunkSize = 400;
            for (let i = 0; i < legacyDocsToStamp.length; i += chunkSize) {
              const slice = legacyDocsToStamp.slice(i, i + chunkSize);
              const batch = writeBatch(db);
              slice.forEach((docId) => {
                batch.update(doc(db, 'equipments', docId), { category: 'joint' });
              });
              await batch.commit();
            }
            invalidateEquipmentsCache();
          } catch (migErr) {
            console.warn('Legacy equipment category stamp skipped:', migErr);
          }
        })();
      }

      data.sort((a, b) => {
        const locA = a.location || '';
        const locB = b.location || '';
        if (locA < locB) return -1;
        if (locA > locB) return 1;

        const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) return orderA - orderB;

        const codeA = a.code || '';
        const codeB = b.code || '';
        if (codeA < codeB) return -1;
        if (codeA > codeB) return 1;
        return 0;
      });

      setEquipments(data);
    } catch (err) {
      console.error(err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // 현재 선택된 사이드바 하위 카테고리의 설비 목록
  const categoryEquipments = useMemo(
    () => equipments.filter((eq) => getEquipmentCategory(eq) === activeCategory),
    [equipments, activeCategory]
  );

  // 검교정(measuring) 카테고리는 상단 탭(계측기 / 설비)에 따라 목록 분리 + 순번/관리번호 순 정렬
  const displayedEquipments = useMemo(() => {
    if (activeCategory !== 'measuring') return categoryEquipments;
    const targetGroup = effectiveTab === 'equipCalibration' ? 'equipment' : 'instrument';
    return categoryEquipments
      .filter((eq) => getCalibrationGroup(eq) === targetGroup)
      .slice()
      .sort((a, b) => {
        const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
        const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
        if (orderA !== orderB) return orderA - orderB;
        return String(a.code || '').localeCompare(String(b.code || ''), 'ko', { numeric: true });
      });
  }, [activeCategory, effectiveTab, categoryEquipments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const targetCategory = getEquipmentCategory(formData);
    const targetMeta = getCategoryMeta(targetCategory);
    const targetCalibrationGroup =
      targetCategory === 'measuring' ? getCalibrationGroup(formData) : undefined;
    const isEquipCal =
      targetCategory === 'measuring' && targetCalibrationGroup === 'equipment';
    const fallbackType =
      isEquipCal
        ? targetMeta.equipDefaultType || targetMeta.defaultType
        : targetMeta.defaultType;
    const serialVal = String(formData.serialNo || '').trim();
    const editablePayload = {
      category: targetCategory,
      ...(targetCategory === 'measuring'
        ? {
            calibrationGroup: targetCalibrationGroup,
            serialNo: serialVal,
            calibrationCycle: String(formData.calibrationCycle || '').trim(),
            calibrationDate: normalizeCalIsoDate(formData.calibrationDate) || String(formData.calibrationDate || '').trim(),
            nextCalibrationDate:
              normalizeCalIsoDate(formData.nextCalibrationDate) || String(formData.nextCalibrationDate || '').trim(),
            manager: String(formData.manager || '').trim(),
            calibrationAgency: String(formData.calibrationAgency || '').trim(),
            ...(isEquipCal ? { storageLocation: String(formData.storageLocation || '').trim() } : {})
          }
        : {}),
      code: String(formData.code || '').trim(),
      name: String(formData.name || '').trim(),
      type: formData.type || fallbackType,
      spec: formData.spec || '',
      manufacturer: formData.manufacturer || '',
      ownership: formData.ownership || targetMeta.defaultOwnership,
      assetNo: targetCategory === 'measuring' ? serialVal : formData.assetNo || '',
      location: formData.location || '',
      status: formData.status || '정상',
      installDate: normalizeCalIsoDate(formData.installDate) || String(formData.installDate || '').trim()
    };

    try {
      if (formData.id) {
        await updateDoc(doc(db, 'equipments', formData.id), editablePayload);
      } else {
        await addDoc(collection(db, 'equipments'), {
          ...editablePayload,
          ...(targetCategory === 'measuring' ? { sortOrder: displayedEquipments.length + 1 } : {}),
          ancillaryEquipments: targetMeta.useJointDefaults
            ? createDefaultAncillaryEquipments()
            : createEmptyAncillaryEquipments(),
          equipmentPhoto: targetMeta.useJointDefaults ? DEFAULT_EQUIPMENT_PHOTO_1 : '',
          equipmentPhoto2: targetMeta.useJointDefaults ? DEFAULT_EQUIPMENT_PHOTO_2 : ''
        });
      }
      invalidateEquipmentsCache();
      setShowModal(false);
      if (targetCategory !== activeCategory) {
        routeNavigate(`/equipment/${targetCategory}`);
      } else if (targetCategory === 'measuring') {
        setActiveTab(targetCalibrationGroup === 'equipment' ? 'equipCalibration' : 'list');
      }
      fetchEquipments();
    } catch {
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(db, 'equipments', id));
        deleteDoc(doc(db, 'equipment_photos', id)).catch(() => {});
        invalidateEquipmentsCache();
        fetchEquipments();
      } catch {
        alert('삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleSaveRepairRequest = async (equipment, repairData) => {
    try {
      const prevHistory = Array.isArray(equipment.history) ? [...equipment.history] : [];
      const existingIdx =
        typeof repairInitialContext?.existingIndex === 'number' &&
        repairInitialContext.existingIndex >= 0 &&
        repairInitialContext.existingIndex < prevHistory.length
          ? repairInitialContext.existingIndex
          : -1;

      const syncKey = repairInitialContext?.autoSyncKey || '';
      let savedRow;
      let targetIdx;
      let updatedHistory;

      if (existingIdx >= 0) {
        const prevRow = prevHistory[existingIdx];
        savedRow = {
          ...prevRow,
          syncId: prevRow.syncId || syncKey || `eqrep_${Date.now()}`,
          autoSyncKey: prevRow.autoSyncKey || syncKey || '',
          date: repairData.requestDate || prevRow.date || new Date().toLocaleDateString('sv-SE'),
          issue: repairData.requestContent || prevRow.issue || '',
          action: repairData.actionContent || prevRow.action || '',
          attachment: '수리의뢰서',
          confirmed: Boolean(prevRow.confirmed || repairData.qualityPic || repairData.verificationResult),
          repairDetails: repairData
        };
        updatedHistory = [...prevHistory];
        updatedHistory[existingIdx] = savedRow;
        targetIdx = existingIdx;
      } else {
        const generatedSyncId = syncKey || `eqrep_${Date.now()}`;
        savedRow = {
          syncId: generatedSyncId,
          ...(syncKey ? { autoSyncKey: syncKey } : {}),
          date: repairData.requestDate || new Date().toLocaleDateString('sv-SE'),
          issue: repairData.requestContent || '',
          action: repairData.actionContent || '',
          attachment: '수리의뢰서',
          confirmed: Boolean(repairData.qualityPic || repairData.verificationResult),
          repairDetails: repairData
        };
        updatedHistory = [...prevHistory, savedRow];
        targetIdx = updatedHistory.length - 1;
      }

      const equipRef = doc(db, 'equipments', equipment.id);
      await updateDoc(equipRef, { history: updatedHistory });
      invalidateEquipmentsCache();

      try {
        await syncEquipmentRepairToChangePoint(equipment, savedRow, targetIdx);
      } catch (syncErr) {
        console.error('Failed to auto-sync equipment repair to changePoint:', syncErr);
      }

      setEquipments(equipments.map((eq) => (eq.id === equipment.id ? { ...eq, history: updatedHistory } : eq)));
      setShowRepairModal(false);
      setRepairInitialContext(null);
      setSelectedEquipment(null);
      alert('수리 요청이 저장되었으며 변동점 관리에 자동 반영되었습니다.');
    } catch (e) {
      console.error(e);
      alert('수리 요청 저장 중 오류가 발생했습니다.');
    }
  };

  const openModal = (equip = null) => {
    if (equip) {
      setFormData({
        id: equip.id,
        category: getEquipmentCategory(equip),
        calibrationGroup: getCalibrationGroup(equip),
        code: equip.code || '',
        name: equip.name || '',
        serialNo: equip.serialNo || equip.assetNo || '',
        type: equip.type || getCategoryMeta(getEquipmentCategory(equip)).defaultType,
        location: equip.location || '',
        storageLocation: equip.storageLocation || '',
        status: equip.status || '정상',
        installDate: normalizeCalIsoDate(equip.installDate) || equip.installDate || '',
        spec: equip.spec || '',
        manufacturer: equip.manufacturer || '',
        ownership: equip.ownership || '자가',
        assetNo: equip.assetNo || '',
        calibrationCycle: equip.calibrationCycle || '1년',
        calibrationDate: normalizeCalIsoDate(equip.calibrationDate) || equip.calibrationDate || '',
        nextCalibrationDate:
          normalizeCalIsoDate(equip.nextCalibrationDate) || equip.nextCalibrationDate || '',
        manager: equip.manager || '',
        calibrationAgency: equip.calibrationAgency || ''
      });
    } else {
      const initialCalGroup =
        activeCategory === 'measuring' && effectiveTab === 'equipCalibration'
          ? 'equipment'
          : 'instrument';
      setFormData(createInitialEquipmentForm(activeCategory, initialCalGroup));
    }
    setShowModal(true);
  };

  const handleModalCategoryChange = (nextCategory) => {
    const nextMeta = getCategoryMeta(nextCategory);
    setFormData((prev) => {
      // 신규 등록 시에는 해당 카테고리의 기본 분류/소유/제작처로 자연스럽게 전환
      if (!prev.id) {
        const calGroup = getCalibrationGroup(prev);
        const nextType =
          nextCategory === 'measuring' && calGroup === 'equipment'
            ? nextMeta.equipDefaultType || nextMeta.defaultType
            : nextMeta.defaultType;
        return {
          ...prev,
          category: nextCategory,
          type: nextType,
          manufacturer: prev.manufacturer ? prev.manufacturer : nextMeta.defaultManufacturer,
          ownership: nextMeta.defaultOwnership
        };
      }
      return {
        ...prev,
        category: nextCategory
      };
    });
  };

  const handleModalCalibrationGroupChange = (nextGroup) => {
    const measuringMeta = getCategoryMeta('measuring');
    setFormData((prev) => {
      const nextDefaultType =
        nextGroup === 'equipment'
          ? measuringMeta.equipDefaultType || measuringMeta.defaultType
          : measuringMeta.defaultType;
      return {
        ...prev,
        calibrationGroup: nextGroup,
        type: prev.id ? prev.type : nextDefaultType
      };
    });
  };

  useEffect(() => {
    if (!openFilterCol) return undefined;

    const handleMouseDown = (e) => {
      if (popoverRef.current && popoverRef.current.contains(e.target)) return;
      if (e.target.closest && e.target.closest('[data-eq-filter-btn]')) return;
      setOpenFilterCol(null);
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpenFilterCol(null);
    };
    const handleScroll = (e) => {
      if (popoverRef.current && popoverRef.current.contains(e.target)) return;
      setOpenFilterCol(null);
    };
    const handleResize = () => setOpenFilterCol(null);

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [openFilterCol]);

  const activeFilterEntries = useMemo(
    () => activeFilterColumns.filter((c) => (colFilters[c.key] || []).length > 0),
    [activeFilterColumns, colFilters]
  );

  const filteredEquipments = useMemo(() => {
    if (activeFilterEntries.length === 0) return displayedEquipments;
    return displayedEquipments.filter((eq) =>
      activeFilterEntries.every((c) => colFilters[c.key].includes(getActiveColValue(eq, c.key)))
    );
  }, [displayedEquipments, colFilters, activeFilterEntries, getActiveColValue]);

  const popoverData = useMemo(() => {
    if (!openFilterCol) return { baseCount: 0, options: [] };
    const otherActive = activeFilterColumns.filter(
      (c) => c.key !== openFilterCol && (colFilters[c.key] || []).length > 0
    );
    const baseRows =
      otherActive.length === 0
        ? displayedEquipments
        : displayedEquipments.filter((eq) =>
            otherActive.every((c) => colFilters[c.key].includes(getActiveColValue(eq, c.key)))
          );

    const countMap = new Map();
    for (const eq of baseRows) {
      const val = getActiveColValue(eq, openFilterCol);
      countMap.set(val, (countMap.get(val) || 0) + 1);
    }
    for (const selectedVal of colFilters[openFilterCol] || []) {
      if (!countMap.has(selectedVal)) countMap.set(selectedVal, 0);
    }

    const q = filterSearch.trim().toLowerCase();
    const sorted = Array.from(countMap.entries())
      .filter(([val]) => !q || val.toLowerCase().includes(q))
      .sort(([a], [b]) => {
        if (a === '-' && b !== '-') return 1;
        if (b === '-' && a !== '-') return -1;
        return a.localeCompare(b, 'ko', { numeric: true });
      });

    return { baseCount: baseRows.length, options: sorted };
  }, [openFilterCol, displayedEquipments, colFilters, filterSearch, activeFilterColumns, getActiveColValue]);

  const handleToggleFilterPopover = (colKey, btnEl) => {
    if (openFilterCol === colKey) {
      setOpenFilterCol(null);
      return;
    }
    const rect = btnEl.getBoundingClientRect();
    const menuWidth = 220;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - menuWidth - 12));
    const top = rect.bottom + 4;
    const maxHeight = Math.max(180, Math.min(340, window.innerHeight - top - 16));
    setPopoverPos({ top, left, maxHeight });
    setFilterSearch('');
    setOpenFilterCol(colKey);
  };

  const clearColumnFilter = (colKey) => {
    setColFilters((prev) => {
      const next = { ...prev };
      delete next[colKey];
      return next;
    });
  };

  const toggleMultiOption = (colKey, val) => {
    setColFilters((prev) => {
      const curr = prev[colKey] || [];
      const nextArr = curr.includes(val) ? curr.filter((v) => v !== val) : [...curr, val];
      const next = { ...prev };
      if (nextArr.length === 0) delete next[colKey];
      else next[colKey] = nextArr;
      return next;
    });
  };

  const selectSingleOrToggleOption = (colKey, val) => {
    const curr = colFilters[colKey] || [];
    if (curr.length > 1) {
      toggleMultiOption(colKey, val);
      return;
    }
    if (curr.length === 1 && curr[0] === val) {
      clearColumnFilter(colKey);
    } else {
      setColFilters((prev) => ({ ...prev, [colKey]: [val] }));
    }
    setOpenFilterCol(null);
  };

  // Protect route
  if (userRole?.role === 'worker') {
    return <Navigate to="/" replace />;
  }

  // /equipment 단독 진입(딥링크 state 없음) 또는 알 수 없는 하위 슬러그 진입 시 /equipment/joint 로 정규화
  if ((!categoryParam || !VALID_CATEGORY_IDS.has(categoryParam)) && !routeLocation.state?.openHistory) {
    return <Navigate to="/equipment/joint" replace />;
  }

  const modalCategoryMeta = getCategoryMeta(formData.category);
  const isModalEquipCalibration =
    formData.category === 'measuring' && getCalibrationGroup(formData) === 'equipment';
  const modalBaseTypeOptions = isModalEquipCalibration
    ? modalCategoryMeta.equipTypeOptions || modalCategoryMeta.typeOptions
    : modalCategoryMeta.typeOptions;
  const modalTypeOptions = modalBaseTypeOptions.includes(formData.type)
    ? modalBaseTypeOptions
    : [formData.type, ...modalBaseTypeOptions].filter(Boolean);
  const modalPlaceholders = isModalEquipCalibration
    ? modalCategoryMeta.equipPlaceholders || modalCategoryMeta.placeholders
    : modalCategoryMeta.placeholders;
  const activeListTitle = isEquipCalibrationView
    ? currentCategoryMeta.equipListTitle || currentCategoryMeta.listTitle
    : currentCategoryMeta.listTitle;
  const activeAddBtnLabel = isEquipCalibrationView
    ? currentCategoryMeta.equipAddBtnLabel || currentCategoryMeta.addBtnLabel
    : currentCategoryMeta.addBtnLabel;

  return (
    <div className="card" style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="card-header" style={{ borderBottom: '1px solid #cbd5e1', paddingBottom: '0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '-1px' }}>
          <button style={tabStyle(effectiveTab === 'list')} onClick={() => setActiveTab('list')}>
            {currentCategoryMeta.tabLabels.list}
          </button>
          {hasEquipCalibrationTab && (
            <button style={tabStyle(effectiveTab === 'equipCalibration')} onClick={() => setActiveTab('equipCalibration')}>
              {currentCategoryMeta.tabLabels.equipCalibration}
            </button>
          )}
          {hasSetConfig && (
            <button style={tabStyle(effectiveTab === 'config')} onClick={() => setActiveTab('config')}>
              {currentCategoryMeta.tabLabels.config}
            </button>
          )}
          {hasTpmTab && (
            <button style={tabStyle(effectiveTab === 'tpm')} onClick={() => setActiveTab('tpm')}>
              {currentCategoryMeta.tabLabels.tpm}
            </button>
          )}
        </div>
      </div>

      <div className="card-body" style={{ flex: 1, overflow: 'auto', padding: '20px', position: 'relative' }}>
        {isListViewTab && (
          <div>
            {loading ? (
              <p>로딩 중...</p>
            ) : isCalibrationSheetView ? (
              <CalibrationInstrumentListView
                variant={isEquipCalibrationView ? 'equipment' : 'instrument'}
                totalCount={displayedEquipments.length}
                filteredEquipments={filteredEquipments}
                colFilters={colFilters}
                openFilterCol={openFilterCol}
                activeFilterEntries={activeFilterEntries}
                onToggleFilterPopover={handleToggleFilterPopover}
                onClearColumnFilter={clearColumnFilter}
                onClearAllFilters={() => setColFilters({})}
                onOpenCreate={() => openModal()}
                onOpenEdit={(eq) => openModal(eq)}
                onOpenHistory={(eq) => {
                  setSelectedEquipment(eq);
                  setShowHistoryModal(true);
                }}
                onDelete={(id) => handleDelete(id)}
              />
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0 }}>
                      {currentCategoryMeta.icon} {activeListTitle}
                    </h3>
                    <span style={{ fontSize: '12px', color: '#475569', background: '#f1f5f9', padding: '3px 8px', borderRadius: '999px', fontWeight: 600 }}>
                      {activeFilterEntries.length > 0
                        ? `필터 결과 ${filteredEquipments.length} / ${displayedEquipments.length}대`
                        : `전체 ${displayedEquipments.length}대`}
                    </span>
                    {activeFilterEntries.length === 0 && (
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        항목 제목(▾)을 클릭하여 조건별 필터를 선택할 수 있습니다.
                      </span>
                    )}
                  </div>
                  <button className="btn btn-primary" onClick={() => openModal()}>
                    {activeAddBtnLabel}
                  </button>
                </div>

                {activeFilterEntries.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '12px', padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginRight: '4px' }}>적용 필터:</span>
                    {activeFilterEntries.map((col) => {
                      const vals = colFilters[col.key] || [];
                      const summary = vals.length === 1 ? vals[0] : `${vals[0]} 외 ${vals.length - 1}건`;
                      return (
                        <span
                          key={col.key}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' }}
                        >
                          {col.label}: {summary}
                          <button
                            type="button"
                            onClick={() => clearColumnFilter(col.key)}
                            style={{ background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', lineHeight: 1, padding: '0 2px' }}
                            title={`${col.label} 필터 해제`}
                          >
                            &times;
                          </button>
                        </span>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setColFilters({})}
                      style={{ marginLeft: '4px', padding: '3px 8px', fontSize: '12px', fontWeight: 600, background: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      전체 필터 초기화
                    </button>
                  </div>
                )}

                <style>{`
                  [data-equipment-list="1"] th,
                  [data-equipment-list="1"] td { padding-left: 16px; padding-right: 16px; white-space: nowrap; }
                  [data-equipment-list="1"] th:nth-child(5),
                  [data-equipment-list="1"] td:nth-child(5) { padding-right: 28px; }
                  [data-equipment-list="1"] th:nth-child(6),
                  [data-equipment-list="1"] td:nth-child(6) { padding-left: 28px; }
                  [data-equipment-list="1"] button[data-eq-filter-btn]:hover { background: #f1f5f9 !important; }
                  [data-equipment-list="1"] button[data-eq-filter-btn][data-active="1"]:hover { background: #dbeafe !important; }
                  [data-eq-filter-popover="1"] button[data-eq-opt-row]:hover { background: #f1f5f9 !important; }
                `}</style>
                <table className="table" data-equipment-list="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ width: '52px', textAlign: 'center', paddingTop: '4px', paddingBottom: '6px' }}>순번</th>
                      {FILTER_COLUMNS.map((col) => {
                        const selectedVals = colFilters[col.key] || [];
                        const isFiltered = selectedVals.length > 0;
                        const isOpen = openFilterCol === col.key;
                        return (
                          <th key={col.key} style={{ paddingTop: '4px', paddingBottom: '6px' }}>
                            <button
                              type="button"
                              data-eq-filter-btn={col.key}
                              data-active={isFiltered ? '1' : '0'}
                              onClick={(e) => handleToggleFilterPopover(col.key, e.currentTarget)}
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
                              title={`${col.label} 필터 선택`}
                            >
                              <span>{col.label}</span>
                              <span style={{ fontSize: '10px', color: isFiltered ? '#2563eb' : '#64748b' }}>
                                {isFiltered ? `▼(${selectedVals.length})` : '▾'}
                              </span>
                            </button>
                          </th>
                        );
                      })}
                      <th>설비이력카드 / 관리</th>
                      {hasTpmTab && <th>{currentCategoryMeta.tabLabels.tpm}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEquipments.map((eq, idx) => (
                      <tr key={eq.id} style={{ borderBottom: '1px solid #cbd5e1' }}>
                        <td style={{ textAlign: 'center', color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                        <td>{eq.location}</td>
                        <td>{eq.code}</td>
                        <td style={{ fontWeight: 'bold' }}>{eq.name}</td>
                        <td>{eq.type}</td>
                        <td>{eq.spec || '-'}</td>
                        <td>{eq.manufacturer || '-'}</td>
                        <td>{eq.ownership || '-'}</td>
                        <td>
                          <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', background: eq.status === '정상' ? '#dcfce3' : '#fee2e2', color: eq.status === '정상' ? '#166534' : '#991b1b' }}>
                            {eq.status}
                          </span>
                        </td>
                        <td>{eq.installDate}</td>
                        <td>
                          <button
                            className="btn btn-sm"
                            style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', marginRight: '4px', marginBottom: '4px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              openModal(eq);
                            }}
                          >
                            수정
                          </button>
                          <button
                            className="btn btn-sm"
                            style={{ background: '#e2e8f0', color: '#1e293b', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', marginRight: '4px', marginBottom: '4px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedEquipment(eq);
                              setShowHistoryModal(true);
                            }}
                          >
                            이력카드(상세/수정)
                          </button>
                          <button
                            className="btn btn-sm"
                            style={{ background: '#e0e7ff', color: '#3730a3', border: '1px solid #c7d2fe', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', marginRight: '4px', marginBottom: '4px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setRepairInitialContext(null);
                              setSelectedEquipment(eq);
                              setShowRepairModal(true);
                            }}
                          >
                            수리의뢰서 작성
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(eq.id);
                            }}
                          >
                            삭제
                          </button>
                        </td>
                        {hasTpmTab && (
                          <td>
                            {hasEquipmentTpmLog(eq) ? (
                              <button
                                className="btn btn-sm"
                                style={{ background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', marginBottom: '4px' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedEquipment(eq);
                                  setShowTpmLogModal(true);
                                }}
                              >
                                TPM 일지
                              </button>
                            ) : (
                              <span
                                title="전용 TPM 일지 추가 작성 예정 (해당 없음)"
                                style={{
                                  display: 'inline-block',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontSize: '11.5px',
                                  fontWeight: 600,
                                  background: '#f1f5f9',
                                  color: '#64748b',
                                  border: '1px solid #e2e8f0',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                TPM 미등록
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                    {displayedEquipments.length === 0 && (
                      <tr>
                        <td colSpan={hasTpmTab ? 12 : 11} style={{ textAlign: 'center', padding: '32px 20px', color: '#64748b' }}>
                          <div style={{ fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                            등록된 {isEquipCalibrationView ? '검교정 대상 설비' : currentCategoryMeta.label === '검교정' ? '검교정 대상 계측기' : currentCategoryMeta.label} 항목이 없습니다.
                          </div>
                          <div style={{ fontSize: '12px', marginBottom: '12px' }}>
                            우측 상단의 <strong>{activeAddBtnLabel}</strong> 버튼을 눌러 등록을 시작하세요.
                          </div>
                          <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => openModal()}
                            style={{ fontSize: '13px', padding: '6px 14px' }}
                          >
                            {activeAddBtnLabel}
                          </button>
                        </td>
                      </tr>
                    )}
                    {displayedEquipments.length > 0 && filteredEquipments.length === 0 && (
                      <tr>
                        <td colSpan={hasTpmTab ? 12 : 11} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                          선택한 필터 조건에 일치하는 {isEquipCalibrationView ? '검교정 설비' : currentCategoryMeta.label} 항목이 없습니다.{' '}
                          <button
                            type="button"
                            onClick={() => setColFilters({})}
                            style={{ marginLeft: '8px', padding: '4px 10px', fontSize: '12px', fontWeight: 600, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #93c5fd', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            필터 초기화
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </>
            )}

            {openFilterCol && (() => {
              const colMeta = activeFilterColumns.find((c) => c.key === openFilterCol);
                  const selectedVals = colFilters[openFilterCol] || [];
                  const isAllSelected = selectedVals.length === 0;
                  return (
                    <div
                      ref={popoverRef}
                      data-eq-filter-popover="1"
                      style={{
                        position: 'fixed',
                        top: `${popoverPos.top}px`,
                        left: `${popoverPos.left}px`,
                        width: '220px',
                        maxHeight: `${popoverPos.maxHeight}px`,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)',
                        zIndex: 3000,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                      }}
                    >
                      <div style={{ padding: '8px 10px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e293b' }}>
                          {colMeta?.label} 필터
                        </span>
                        {selectedVals.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              clearColumnFilter(openFilterCol);
                              setOpenFilterCol(null);
                            }}
                            style={{ background: 'none', border: 'none', fontSize: '11px', fontWeight: 600, color: '#2563eb', cursor: 'pointer', padding: 0 }}
                          >
                            초기화
                          </button>
                        )}
                      </div>

                      <div style={{ padding: '6px 8px', borderBottom: '1px solid #f1f5f9' }}>
                        <input
                          type="text"
                          value={filterSearch}
                          onChange={(e) => setFilterSearch(e.target.value)}
                          placeholder={`${colMeta?.label} 검색...`}
                          autoFocus
                          style={{ width: '100%', padding: '5px 8px', fontSize: '12px', border: '1px solid #cbd5e1', borderRadius: '4px', outline: 'none' }}
                        />
                        {filterSearch.trim() && popoverData.options.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setColFilters((prev) => ({
                                ...prev,
                                [openFilterCol]: popoverData.options.map(([v]) => v)
                              }));
                              setOpenFilterCol(null);
                            }}
                            style={{ marginTop: '4px', width: '100%', padding: '4px 6px', fontSize: '11px', fontWeight: 600, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '4px', cursor: 'pointer', textAlign: 'center' }}
                          >
                            검색 결과 전체 선택 ({popoverData.options.length}개 항목)
                          </button>
                        )}
                      </div>

                      <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
                        {!filterSearch.trim() && (
                          <button
                            type="button"
                            data-eq-opt-row="all"
                            onClick={() => {
                              clearColumnFilter(openFilterCol);
                              setOpenFilterCol(null);
                            }}
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              border: 'none',
                              background: isAllSelected ? '#eff6ff' : 'transparent',
                              color: isAllSelected ? '#1d4ed8' : '#0f172a',
                              fontWeight: isAllSelected ? 700 : 500,
                              fontSize: '12px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            <span>{isAllSelected ? '✓ 전체' : '전체'}</span>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>({popoverData.baseCount})</span>
                          </button>
                        )}

                        {popoverData.options.map(([val, count]) => {
                          const isChecked = selectedVals.includes(val);
                          return (
                            <div
                              key={val}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                background: isChecked ? '#eff6ff' : 'transparent',
                                paddingLeft: '10px'
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleMultiOption(openFilterCol, val)}
                                title="체크박스로 다중 선택 가능"
                                style={{ width: '14px', height: '14px', cursor: 'pointer', flexShrink: 0, accentColor: '#2563eb' }}
                              />
                              <button
                                type="button"
                                data-eq-opt-row={val}
                                onClick={() => selectSingleOrToggleOption(openFilterCol, val)}
                                style={{
                                  flex: 1,
                                  padding: '6px 10px 6px 8px',
                                  border: 'none',
                                  background: 'transparent',
                                  color: isChecked ? '#1d4ed8' : '#0f172a',
                                  fontWeight: isChecked ? 700 : 400,
                                  fontSize: '12px',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  minWidth: 0
                                }}
                              >
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
                                <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px', flexShrink: 0 }}>({count})</span>
                              </button>
                            </div>
                          );
                        })}

                        {popoverData.options.length === 0 && (
                          <div style={{ padding: '12px 10px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
                            일치하는 항목이 없습니다.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
          </div>
        )}

        {hasSetConfig && effectiveTab === 'config' && <EquipmentSetConfig category={activeCategory} />}
        {hasTpmTab && effectiveTab === 'tpm' && (
          <TpmManagement
            category={activeCategory}
            equipments={categoryEquipments}
            loadingEquipments={loading}
            onRefreshEquipments={fetchEquipments}
            onOpenTpmLog={(eq, year, month) => {
              setSelectedEquipment(eq);
              setTpmModalPeriod(year && month ? { year, month } : null);
              setShowTpmLogModal(true);
            }}
            onOpenRepairRequest={(eq, tpmContext = null) => {
              if (tpmContext?.date) {
                const compactDate = String(tpmContext.date).replace(/-/g, '');
                const autoSyncKey = `tpm_${eq.id}_${compactDate}`;
                const hist = Array.isArray(eq.history) ? eq.history : [];
                const existingIndex = hist.findIndex(
                  (r) =>
                    r?.autoSyncKey === autoSyncKey ||
                    (r?.date === tpmContext.date && String(r?.issue || '').startsWith('[TPM'))
                );

                if (existingIndex >= 0) {
                  setRepairInitialContext({
                    existingIndex,
                    autoSyncKey,
                    initialData: hist[existingIndex].repairDetails || {
                      equipmentName: eq.name || '',
                      equipmentCode: eq.code || '',
                      requestDate: tpmContext.date,
                      requestContent: hist[existingIndex].issue || '',
                      actionContent: hist[existingIndex].action || ''
                    }
                  });
                } else {
                  const issueLabels = Array.isArray(tpmContext.issues)
                    ? tpmContext.issues.map((it) => it.label).join(', ')
                    : '';
                  const joined = issueLabels;
                  const inferredType =
                    joined.includes('온조기') || joined.includes('온도')
                      ? '온조기'
                      : joined.includes('오일') || joined.includes('누유')
                        ? '상단누유'
                        : '작동이상';
                  setRepairInitialContext({
                    existingIndex: -1,
                    autoSyncKey,
                    initialData: {
                      equipmentName: eq.name || '',
                      equipmentCode: eq.code || '',
                      department: '㈜조영산업',
                      requestDate: tpmContext.date,
                      requestType: inferredType,
                      pic: tpmContext.workerName || '',
                      remarks: `TPM 일지 자동연동${tpmContext.setName ? ` (${tpmContext.setName})` : ''}`,
                      requestContent: issueLabels ? `[TPM 일지 이상] ${issueLabels}` : ''
                    }
                  });
                }
              } else {
                setRepairInitialContext(null);
              }
              setSelectedEquipment(eq);
              setShowRepairModal(true);
            }}
          />
        )}
      </div>

      {showHistoryModal &&
        selectedEquipment &&
        (getEquipmentCategory(selectedEquipment) === 'measuring' ? (
          <CalibrationInstrumentCardModal
            equipment={selectedEquipment}
            onClose={() => {
              setShowHistoryModal(false);
              setSelectedEquipment(null);
            }}
            onUpdate={(updatedEq) => {
              if (updatedEq) {
                setSelectedEquipment(updatedEq);
                setEquipments((prev) =>
                  prev.map((item) => (item.id === updatedEq.id ? { ...item, ...updatedEq } : item))
                );
              }
              fetchEquipments(true);
            }}
          />
        ) : (
          <EquipmentHistoryCardModal
            equipment={selectedEquipment}
            initialAutoSyncKey={historyAutoSyncKey}
            onClose={() => {
              setShowHistoryModal(false);
              setSelectedEquipment(null);
              setHistoryAutoSyncKey('');
            }}
            onUpdate={(updatedEq) => {
              if (updatedEq) setSelectedEquipment(updatedEq);
              fetchEquipments();
            }}
          />
        ))}
      {showTpmLogModal && selectedEquipment && (
        <EquipmentTpmLogModal
          equipment={selectedEquipment}
          initialYear={tpmModalPeriod?.year}
          initialMonth={tpmModalPeriod?.month}
          onClose={() => {
            setShowTpmLogModal(false);
            setSelectedEquipment(null);
            setTpmModalPeriod(null);
          }}
          onUpdate={(updatedEq) => {
            if (updatedEq) setSelectedEquipment(updatedEq);
            fetchEquipments(true);
          }}
        />
      )}
      {showRepairModal && selectedEquipment && (
        <EquipmentRepairRequestModal
          equipment={selectedEquipment}
          initialData={repairInitialContext?.initialData || undefined}
          onClose={() => {
            setShowRepairModal(false);
            setRepairInitialContext(null);
            setSelectedEquipment(null);
          }}
          onSave={(data) => handleSaveRepairRequest(selectedEquipment, data)}
        />
      )}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '16px' }}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '10px', width: formData.category === 'measuring' ? '560px' : '440px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px' }}>
              {formData.category === 'measuring'
                ? `검교정 (${isModalEquipCalibration ? '설비' : '계측기'}) ${formData.id ? '정보 수정' : '신규 등록'}`
                : formData.id
                  ? `${modalCategoryMeta.label} 정보 수정`
                  : `신규 ${modalCategoryMeta.label} 등록`}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>카테고리 구분</label>
                <select
                  className="form-control"
                  value={formData.category}
                  onChange={(e) => handleModalCategoryChange(e.target.value)}
                >
                  {EQUIPMENT_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.order}. {cat.label} ({cat.subtitle})
                    </option>
                  ))}
                </select>
              </div>
              {formData.category === 'measuring' && (
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>검교정 구분</label>
                  <select
                    className="form-control"
                    value={getCalibrationGroup(formData)}
                    onChange={(e) => handleModalCalibrationGroupChange(e.target.value)}
                  >
                    <option value="instrument">계측기 (검교정 리스트(계측기))</option>
                    <option value="equipment">설비 (검교정 리스트(설비))</option>
                  </select>
                </div>
              )}

              {formData.category === 'measuring' ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>관리번호</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={modalPlaceholders.code}
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                        {isModalEquipCalibration ? '설비명' : '계측기명'}
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={modalPlaceholders.name}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>기기번호</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={modalPlaceholders.serialNo || '기기번호 또는 -'}
                        value={formData.serialNo || ''}
                        onChange={(e) => setFormData({ ...formData, serialNo: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>계량분야</label>
                      <input
                        type="text"
                        list="measuring-type-datalist"
                        className="form-control"
                        placeholder="예: 온도측정, 질량/부피, 길이측정"
                        value={formData.type || ''}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      />
                      <datalist id="measuring-type-datalist">
                        {modalTypeOptions.map((opt) => (
                          <option key={opt} value={opt} />
                        ))}
                      </datalist>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>측정범위</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={modalPlaceholders.spec}
                        value={formData.spec || ''}
                        onChange={(e) => setFormData({ ...formData, spec: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>검교정 주기</label>
                      <input
                        type="text"
                        list="measuring-cycle-datalist"
                        className="form-control"
                        placeholder="예: 1년, 2년"
                        value={formData.calibrationCycle || ''}
                        onChange={(e) => {
                          const nextCycle = e.target.value;
                          const autoNext = computeNextCalibrationIsoDate(formData.calibrationDate, nextCycle);
                          setFormData({
                            ...formData,
                            calibrationCycle: nextCycle,
                            ...(autoNext ? { nextCalibrationDate: autoNext } : {})
                          });
                        }}
                      />
                      <datalist id="measuring-cycle-datalist">
                        <option value="6개월" />
                        <option value="1년" />
                        <option value="2년" />
                        <option value="3년" />
                      </datalist>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>교정 주관</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={modalPlaceholders.calibrationAgency || '예: 한국측정기술원'}
                        value={formData.calibrationAgency || ''}
                        onChange={(e) => setFormData({ ...formData, calibrationAgency: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>검교정일</label>
                      <input
                        type="date"
                        max="9999-12-31"
                        className="form-control"
                        value={formData.calibrationDate || ''}
                        onChange={(e) => {
                          const nextCalDate = e.target.value;
                          const autoNext = computeNextCalibrationIsoDate(nextCalDate, formData.calibrationCycle);
                          setFormData({
                            ...formData,
                            calibrationDate: nextCalDate,
                            ...(autoNext ? { nextCalibrationDate: autoNext } : {})
                          });
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>차기교정일</label>
                      <input
                        type="date"
                        max="9999-12-31"
                        className="form-control"
                        value={formData.nextCalibrationDate || ''}
                        onChange={(e) => setFormData({ ...formData, nextCalibrationDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>제조 회사</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={modalPlaceholders.manufacturer}
                        value={formData.manufacturer || ''}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>구입년도</label>
                      <input
                        type="date"
                        max="9999-12-31"
                        className="form-control"
                        value={formData.installDate || ''}
                        onChange={(e) => setFormData({ ...formData, installDate: e.target.value })}
                      />
                    </div>
                    {isModalEquipCalibration && (
                      <div>
                        <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>위치</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder={modalPlaceholders.location}
                          value={formData.location || ''}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        />
                      </div>
                    )}
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>보관처</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={
                          isModalEquipCalibration
                            ? modalPlaceholders.storageLocation || '예: 현장'
                            : modalPlaceholders.location
                        }
                        value={isModalEquipCalibration ? formData.storageLocation || '' : formData.location || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ...(isModalEquipCalibration
                              ? { storageLocation: e.target.value }
                              : { location: e.target.value })
                          })
                        }
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>관리자</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={modalPlaceholders.manager || '예: 김동욱'}
                        value={formData.manager || ''}
                        onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                      />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>상태</label>
                      <select
                        className="form-control"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="정상">정상</option>
                        <option value="검교정중">검교정중</option>
                        <option value="수리중">수리중</option>
                        <option value="고장">고장</option>
                        <option value="폐기">폐기</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                      취소
                    </button>
                    <button type="submit" className="btn btn-primary">
                      저장
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>관리번호 (Code)</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={modalPlaceholders.code}
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                      설비명 (Name)
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={modalPlaceholders.name}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>분류</label>
                    <select
                      className="form-control"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      {modalTypeOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>사양</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={modalPlaceholders.spec}
                      value={formData.spec || ''}
                      onChange={(e) => setFormData({ ...formData, spec: e.target.value })}
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>제작처</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={modalPlaceholders.manufacturer}
                      value={formData.manufacturer || ''}
                      onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>소유</label>
                    <select
                      className="form-control"
                      value={formData.ownership || ''}
                      onChange={(e) => setFormData({ ...formData, ownership: e.target.value })}
                    >
                      <option value="대여">대여</option>
                      <option value="자가">자가</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>자산 No.</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.assetNo || ''}
                      onChange={(e) => setFormData({ ...formData, assetNo: e.target.value })}
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>위치</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder={modalPlaceholders.location}
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>상태</label>
                    <select
                      className="form-control"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="정상">정상</option>
                      <option value="수리중">수리중</option>
                      <option value="고장">고장</option>
                      {formData.category === 'measuring' && <option value="검교정중">검교정중</option>}
                      <option value="폐기">폐기</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', fontWeight: 'bold' }}>도입일자</label>
                    <input
                      type="date"
                      max="9999-12-31"
                      className="form-control"
                      value={formData.installDate}
                      onChange={(e) => setFormData({ ...formData, installDate: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                      취소
                    </button>
                    <button type="submit" className="btn btn-primary">
                      저장
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function tabStyle(isActive) {
  return {
    padding: '12px 16px',
    background: 'none',
    border: 'none',
    borderBottom: isActive ? '2px solid #2563eb' : '2px solid transparent',
    color: isActive ? '#2563eb' : '#64748b',
    fontWeight: isActive ? 'bold' : 'normal',
    cursor: 'pointer'
  };
}
