import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import {
  INITIAL_INCOMING_MATERIALS,
  INCOMING_MATERIAL_CATEGORIES,
  INCOMING_UNIT_OPTIONS
} from '../constants/incomingMaterials';

const INCOMING_MASTER_DOC = doc(db, 'incoming_inspection', 'materials_master');

function createEmptyMaterial() {
  return {
    id: `inc_${Date.now()}`,
    materialCode: '',
    materialName: '',
    unit: 'EA',
    carModel: '',
    packQty: '',
    category: '클립류',
    supplier: '',
    needsReview: false,
    reviewNote: ''
  };
}

function normalizeUnit(raw) {
  const s = String(raw || '').trim().toUpperCase();
  if (s === 'KG') return 'KG';
  return 'EA';
}

export default function IncomingInspection() {
  const { userRole } = useAuth();
  const { td } = useI18n();

  const [materials, setMaterials] = useState(INITIAL_INCOMING_MATERIALS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // 필터 상태
  const [searchKeyword, setSearchKeyword] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [unitFilter, setUnitFilter] = useState('ALL');
  const [carModelFilter, setCarModelFilter] = useState('ALL');
  const [onlyNeedsReview, setOnlyNeedsReview] = useState(false);

  // 추가/수정 폼 모달 상태
  const [editingItem, setEditingItem] = useState(null);
  const [isNewItem, setIsNewItem] = useState(false);

  useEffect(() => {
    let active = true;
    const loadMaster = async () => {
      try {
        const snap = await getDoc(INCOMING_MASTER_DOC);
        if (active && snap.exists()) {
          const docItems = snap.data()?.items;
          if (Array.isArray(docItems) && docItems.length > 0) {
            setMaterials(docItems);
          }
        }
      } catch (err) {
        console.warn('Failed to load incoming materials from Firestore, using local master:', err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadMaster();
    return () => {
      active = false;
    };
  }, []);

  const persistMaterials = async (nextList, toastText = '저장되었습니다.') => {
    setMaterials(nextList);
    setSaving(true);
    setSaveMessage('');
    try {
      await setDoc(
        INCOMING_MASTER_DOC,
        {
          items: nextList,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
      setSaveMessage(toastText);
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      console.error('Failed to save incoming materials:', err);
      alert('서버 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  const summary = useMemo(() => {
    let eaCount = 0;
    let kgCount = 0;
    let reviewCount = 0;
    const carSet = new Set();

    materials.forEach((m) => {
      if (normalizeUnit(m.unit) === 'KG') kgCount += 1;
      else eaCount += 1;
      if (m.needsReview || !String(m.materialCode || '').trim() || !String(m.carModel || '').trim()) {
        reviewCount += 1;
      }
      if (String(m.carModel || '').trim()) {
        carSet.add(String(m.carModel).trim());
      }
    });

    return {
      total: materials.length,
      eaCount,
      kgCount,
      reviewCount,
      carModels: Array.from(carSet).sort((a, b) => a.localeCompare(b))
    };
  }, [materials]);

  const filteredMaterials = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    return materials.filter((item) => {
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
      if (unitFilter !== 'ALL' && normalizeUnit(item.unit) !== unitFilter) return false;
      if (carModelFilter !== 'ALL') {
        if (carModelFilter === '__EMPTY__') {
          if (String(item.carModel || '').trim() !== '') return false;
        } else if (String(item.carModel || '').trim() !== carModelFilter) {
          return false;
        }
      }
      const isMissingOrFlagged =
        Boolean(item.needsReview) ||
        !String(item.materialCode || '').trim() ||
        !String(item.carModel || '').trim();
      if (onlyNeedsReview && !isMissingOrFlagged) return false;

      if (kw) {
        const haystack = [
          item.materialCode,
          item.materialName,
          item.unit,
          item.carModel,
          item.category,
          item.supplier,
          item.reviewNote
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(kw)) return false;
      }
      return true;
    });
  }, [materials, searchKeyword, categoryFilter, unitFilter, carModelFilter, onlyNeedsReview]);

  const handleOpenNew = () => {
    setIsNewItem(true);
    setEditingItem(createEmptyMaterial());
  };

  const handleOpenEdit = (item) => {
    setIsNewItem(false);
    setEditingItem({
      ...item,
      packQty: item.packQty === null || item.packQty === undefined ? '' : String(item.packQty)
    });
  };

  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!editingItem) return;
    const trimmedName = String(editingItem.materialName || '').trim();
    if (!trimmedName) {
      alert('자재명을 입력해 주세요.');
      return;
    }

    const parsedPack =
      String(editingItem.packQty || '').trim() === ''
        ? null
        : Number(String(editingItem.packQty).replace(/,/g, ''));

    const normalized = {
      ...editingItem,
      materialCode: String(editingItem.materialCode || '').trim(),
      materialName: trimmedName,
      unit: normalizeUnit(editingItem.unit),
      carModel: String(editingItem.carModel || '').trim(),
      packQty: Number.isFinite(parsedPack) && parsedPack > 0 ? parsedPack : null,
      category: editingItem.category || '클립류',
      supplier: String(editingItem.supplier || '').trim(),
      reviewNote: String(editingItem.reviewNote || '').trim(),
      needsReview: Boolean(editingItem.needsReview)
    };

    const nextList = isNewItem
      ? [normalized, ...materials]
      : materials.map((m) => (m.id === normalized.id ? normalized : m));

    setEditingItem(null);
    await persistMaterials(
      nextList,
      isNewItem ? '신규 입고 자재가 등록되었습니다.' : '자재 정보가 수정되었습니다.'
    );
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`[${item.materialCode || '코드없음'}] ${item.materialName}\n이 항목을 삭제하시겠습니까?`)) {
      return;
    }
    const nextList = materials.filter((m) => m.id !== item.id);
    await persistMaterials(nextList, '항목이 삭제되었습니다.');
  };

  const handleResetToCapturedMaster = async () => {
    if (
      !window.confirm(
        '현재 목록을 초기 정리된 63종 표준 마스터로 초기화하시겠습니까?\n(직접 수정하거나 추가한 항목은 초기값으로 덮어씌워집니다)'
      )
    ) {
      return;
    }
    await persistMaterials(INITIAL_INCOMING_MATERIALS, '초기 표준 마스터(63종)로 복원했습니다.');
  };

  const handleExportExcel = async () => {
    const ExcelJS = (await import('exceljs')).default;
    const { saveAs } = await import('file-saver');

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('수입검사_입고자재');

    ws.columns = [
      { header: 'No', key: 'no', width: 6 },
      { header: '자재코드', key: 'materialCode', width: 16 },
      { header: '자재명', key: 'materialName', width: 34 },
      { header: '단위', key: 'unit', width: 8 },
      { header: '차종', key: 'carModel', width: 22 },
      { header: '1봉지 포장수량', key: 'packQty', width: 15 },
      { header: '분류', key: 'category', width: 14 },
      { header: '업체', key: 'supplier', width: 10 },
      { header: '확인/비고', key: 'reviewNote', width: 42 }
    ];

    const headerRow = ws.getRow(1);
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
      };
    });

    filteredMaterials.forEach((m, idx) => {
      const row = ws.addRow({
        no: idx + 1,
        materialCode: m.materialCode || '',
        materialName: m.materialName || '',
        unit: normalizeUnit(m.unit),
        carModel: m.carModel || '',
        packQty: m.packQty ? Number(m.packQty) : '',
        category: m.category || '',
        supplier: m.supplier || '',
        reviewNote: m.reviewNote || ''
      });
      row.height = 20;
      row.eachCell((cell, colNumber) => {
        cell.font = { size: 10 };
        cell.alignment = {
          vertical: 'middle',
          horizontal: colNumber === 1 || colNumber === 4 ? 'center' : colNumber === 6 ? 'right' : 'left'
        };
        if (colNumber === 6 && m.packQty) {
          cell.numFmt = '#,##0';
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      });
    });

    const buf = await wb.xlsx.writeBuffer();
    const today = new Date().toLocaleDateString('sv-SE');
    saveAs(
      new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      `JYMES_수입검사_입고자재목록_${today}.xlsx`
    );
  };

  if (userRole?.role === 'worker') {
    return <Navigate to="/" replace />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 상단 요약 및 액션 바 */}
      <div className="card" style={{ padding: '20px 22px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '16px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '22px' }}>📦</span>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                {td('수입검사')} — 입고 자재 통합 기준표
              </h3>
              {saving && (
                <span style={{ fontSize: '12px', color: '#2563eb', fontWeight: 700 }}>
                  저장 중...
                </span>
              )}
              {saveMessage && (
                <span
                  style={{
                    padding: '2px 10px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 800,
                    background: '#dcfce7',
                    color: '#15803d'
                  }}
                >
                  ✓ {saveMessage}
                </span>
              )}
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b' }}>
              입고 자재를 <strong>자재코드 · 자재명 · 단위(EA/KG) · 차종</strong> 통일 양식으로 통합 관리합니다.
              (1봉지 포장 수량은 단위 하단 참고값으로 함께 표시)
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleOpenNew}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: 'none',
                background: '#2563eb',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              + 자재 추가
            </button>
            <button
              type="button"
              onClick={handleExportExcel}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #16a34a',
                background: '#f0fdf4',
                color: '#15803d',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              📥 엑셀 다운로드
            </button>
            <button
              type="button"
              onClick={handleResetToCapturedMaster}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#475569',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              초기 63종 복원
            </button>
          </div>
        </div>

        {/* 요약 KPI 배지 */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <div
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '12px',
              color: '#334155',
              fontWeight: 700
            }}
          >
            전체 품목 <strong style={{ color: '#0f172a', fontSize: '14px', marginLeft: '4px' }}>{summary.total}종</strong>
          </div>
          <div
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              fontSize: '12px',
              color: '#1e40af',
              fontWeight: 700
            }}
          >
            EA <strong style={{ fontSize: '14px', marginLeft: '4px' }}>{summary.eaCount}</strong>
            <span style={{ margin: '0 6px', color: '#93c5fd' }}>|</span>
            KG <strong style={{ fontSize: '14px' }}>{summary.kgCount}</strong>
          </div>
          <div
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '12px',
              color: '#334155',
              fontWeight: 700
            }}
          >
            적용 차종 <strong style={{ color: '#0f172a', fontSize: '14px', marginLeft: '4px' }}>{summary.carModels.length}종</strong>
          </div>
          <button
            type="button"
            onClick={() => setOnlyNeedsReview((prev) => !prev)}
            style={{
              padding: '8px 14px',
              borderRadius: '10px',
              background: onlyNeedsReview ? '#fef2f2' : '#fffbeb',
              border: onlyNeedsReview ? '1.5px solid #ef4444' : '1px solid #fde68a',
              fontSize: '12px',
              color: onlyNeedsReview ? '#b91c1c' : '#b45309',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            ⚠️ 확인·보완 필요 {summary.reviewCount}건 {onlyNeedsReview ? '(필터 ON)' : '만 보기'}
          </button>
        </div>

        {/* 분류 칩 + 검색/드롭다운 필터 */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              style={{
                padding: '6px 12px',
                borderRadius: '999px',
                border: categoryFilter === 'ALL' ? '1px solid #0f172a' : '1px solid #cbd5e1',
                background: categoryFilter === 'ALL' ? '#0f172a' : '#ffffff',
                color: categoryFilter === 'ALL' ? '#ffffff' : '#334155',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              전체 분류
            </button>
            {INCOMING_MATERIAL_CATEGORIES.map((cat) => {
              const active = categoryFilter === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '999px',
                    border: active ? '1px solid #2563eb' : '1px solid #cbd5e1',
                    background: active ? '#eff6ff' : '#ffffff',
                    color: active ? '#1d4ed8' : '#475569',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <select
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                fontWeight: 600,
                background: '#ffffff'
              }}
            >
              <option value="ALL">단위 전체</option>
              {INCOMING_UNIT_OPTIONS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>

            <select
              value={carModelFilter}
              onChange={(e) => setCarModelFilter(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                fontWeight: 600,
                background: '#ffffff'
              }}
            >
              <option value="ALL">차종 전체</option>
              {summary.carModels.map((car) => (
                <option key={car} value={car}>
                  {car}
                </option>
              ))}
              <option value="__EMPTY__">(차종 미지정)</option>
            </select>

            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="자재코드, 자재명, 차종 검색..."
              style={{
                padding: '7px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                minWidth: '210px'
              }}
            />
          </div>
        </div>
      </div>

      {/* 통일 양식 데이터 테이블 */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>
            통일 양식 목록 ({filteredMaterials.length}건)
          </span>
          {loading && (
            <span style={{ fontSize: '12px', color: '#64748b' }}>서버 목록 동기화 중...</span>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
              minWidth: '860px'
            }}
          >
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#1e293b' }}>
                <th style={{ padding: '10px 8px', textAlign: 'center', width: '52px', fontWeight: 800 }}>No</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', width: '140px', fontWeight: 800 }}>자재코드</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', minWidth: '220px', fontWeight: 800 }}>자재명</th>
                <th style={{ padding: '10px 10px', textAlign: 'center', width: '90px', fontWeight: 800 }}>단위</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', width: '170px', fontWeight: 800 }}>차종</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', width: '110px', fontWeight: 800 }}>분류</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', minWidth: '180px', fontWeight: 800 }}>확인 · 비고</th>
                <th style={{ padding: '10px 10px', textAlign: 'center', width: '110px', fontWeight: 800 }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map((item, idx) => {
                const codeMissing = !String(item.materialCode || '').trim();
                const carMissing = !String(item.carModel || '').trim();
                const isFlagged = Boolean(item.needsReview || codeMissing || carMissing);
                const unitNorm = normalizeUnit(item.unit);

                return (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid #e2e8f0',
                      background: isFlagged ? '#fffdf5' : idx % 2 === 1 ? '#f8fafc' : '#ffffff'
                    }}
                  >
                    <td style={{ padding: '9px 8px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>
                      {idx + 1}
                    </td>

                    <td style={{ padding: '9px 12px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontWeight: 700 }}>
                      {codeMissing ? (
                        <span
                          style={{
                            padding: '2px 7px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            background: '#fef2f2',
                            color: '#b91c1c',
                            border: '1px solid #fecaca',
                            fontFamily: 'inherit'
                          }}
                        >
                          미입력{item.supplier ? ` (${item.supplier})` : ''}
                        </span>
                      ) : (
                        <span style={{ color: '#0f172a' }}>{item.materialCode}</span>
                      )}
                    </td>

                    <td style={{ padding: '9px 12px', fontWeight: 700, color: '#0f172a' }}>
                      <div>{item.materialName}</div>
                      {item.supplier && (
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                          업체: {item.supplier}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 9px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 800,
                          background: unitNorm === 'KG' ? '#fef3c7' : '#e0f2fe',
                          color: unitNorm === 'KG' ? '#b45309' : '#0369a1'
                        }}
                      >
                        {unitNorm}
                      </span>
                      {item.packQty && (
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
                          1봉지 {Number(item.packQty).toLocaleString()}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '9px 12px' }}>
                      {carMissing ? (
                        <span
                          style={{
                            padding: '2px 7px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: '#fef2f2',
                            color: '#b91c1c',
                            border: '1px solid #fecaca'
                          }}
                        >
                          차종 미지정
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 700,
                            background: '#f1f5f9',
                            color: '#1e293b'
                          }}
                        >
                          {item.carModel}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '9px 12px', fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                      {item.category || '-'}
                    </td>

                    <td style={{ padding: '9px 12px', fontSize: '11px', color: item.needsReview ? '#b45309' : '#64748b' }}>
                      {item.reviewNote || '-'}
                    </td>

                    <td style={{ padding: '9px 10px', textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(item)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#334155',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: '1px solid #fecaca',
                            background: '#fef2f2',
                            color: '#b91c1c',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredMaterials.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '36px 16px', textAlign: 'center', color: '#94a3b8' }}>
                    조건에 일치하는 입고 자재가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 추가 / 수정 모달 */}
      {editingItem && (
        <div
          onClick={() => setEditingItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
        >
          <form
            onSubmit={handleSaveForm}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '22px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                {isNewItem ? '신규 입고 자재 추가' : '입고 자재 정보 수정'}
              </h4>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                닫기
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                자재코드
                <input
                  type="text"
                  value={editingItem.materialCode}
                  onChange={(e) => setEditingItem({ ...editingItem, materialCode: e.target.value })}
                  placeholder="예: 3107-0054"
                  style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                단위 *
                <select
                  value={editingItem.unit}
                  onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                  style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  {INCOMING_UNIT_OPTIONS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
              자재명 *
              <input
                type="text"
                required
                value={editingItem.materialName}
                onChange={(e) => setEditingItem({ ...editingItem, materialName: e.target.value })}
                placeholder="품명 및 규격 입력"
                style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                차종
                <input
                  type="text"
                  value={editingItem.carModel}
                  onChange={(e) => setEditingItem({ ...editingItem, carModel: e.target.value })}
                  placeholder="예: 9BQC, NE1A D/S"
                  style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                1봉지 포장수량 (선택)
                <input
                  type="number"
                  min="1"
                  value={editingItem.packQty}
                  onChange={(e) => setEditingItem({ ...editingItem, packQty: e.target.value })}
                  placeholder="예: 500, 10000"
                  style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                분류
                <select
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                >
                  {INCOMING_MATERIAL_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                업체 (선택)
                <input
                  type="text"
                  value={editingItem.supplier}
                  onChange={(e) => setEditingItem({ ...editingItem, supplier: e.target.value })}
                  placeholder="예: 신천"
                  style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </label>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#334155' }}>
              확인 · 비고
              <input
                type="text"
                value={editingItem.reviewNote}
                onChange={(e) => setEditingItem({ ...editingItem, reviewNote: e.target.value })}
                placeholder="특이사항 또는 보완 필요 내용"
                style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: '#b45309' }}>
              <input
                type="checkbox"
                checked={Boolean(editingItem.needsReview)}
                onChange={(e) => setEditingItem({ ...editingItem, needsReview: e.target.checked })}
              />
              확인·보완 필요 항목으로 표시 해제/유지
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              <button
                type="submit"
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                저장
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
