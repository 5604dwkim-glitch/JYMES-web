import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { addDoc, collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import {
  ILLUMINANCE_COLLECTION,
  ILLUMINANCE_JUDGEMENT,
  ILLUMINANCE_LOCATION_SUGGESTIONS,
  ILLUMINANCE_META,
  createInitialIlluminanceForm,
  judgeIlluminance,
  toLuxNumber
} from '../../constants/illuminanceMeasurement';

const FILTER_COLUMNS = [
  { key: 'date', label: '측정일' },
  { key: 'location', label: '측정장소' },
  { key: 'standardLux', label: '기준조도(lux)' },
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

const labelStyle = { display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' };

export default function IlluminanceMeasurement() {
  const { userRole } = useAuth();
  const { td } = useI18n();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filters, setFilters] = useState({});
  const [openFilterCol, setOpenFilterCol] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(createInitialIlluminanceForm);

  const loadRows = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const snap = await getDocs(collection(db, ILLUMINANCE_COLLECTION));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
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

  const optionsByCol = useMemo(() => {
    const map = {};
    FILTER_COLUMNS.forEach((col) => {
      map[col.key] = [...new Set(rows.map((r) => getColValue(r, col.key)))].sort();
    });
    return map;
  }, [rows]);

  const filteredRows = useMemo(
    () =>
      rows.filter((r) =>
        FILTER_COLUMNS.every((col) => {
          const sel = filters[col.key];
          return !sel || sel.length === 0 || sel.includes(getColValue(r, col.key));
        })
      ),
    [rows, filters]
  );

  const activeFilterEntries = FILTER_COLUMNS.filter((c) => (filters[c.key] || []).length > 0);

  if (userRole?.role === 'worker') {
    return <Navigate to="/" replace />;
  }

  const toggleFilterValue = (key, value) => {
    setFilters((prev) => {
      const cur = prev[key] || [];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      return { ...prev, [key]: next };
    });
  };

  const openModal = (row = null) => {
    if (row) {
      setFormData({
        id: row.id,
        date: row.date || '',
        location: row.location || '',
        standardLux: String(row.standardLux ?? ''),
        measuredLux: String(row.measuredLux ?? ''),
        instrument: row.instrument || '',
        measurer: row.measurer || '',
        remark: row.remark || ''
      });
    } else {
      setFormData(createInitialIlluminanceForm());
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const measured = toLuxNumber(formData.measuredLux);
    const standard = toLuxNumber(formData.standardLux);
    if (!formData.date || !formData.location.trim()) {
      alert('측정일과 측정장소를 입력해 주세요.');
      return;
    }
    if (measured === null || measured < 0 || standard === null || standard < 0) {
      alert('기준조도와 측정값은 0 이상의 숫자로 입력해 주세요.');
      return;
    }
    const payload = {
      date: formData.date,
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
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', borderRadius: '4px' }}
              >
                <input type="checkbox" checked={selected.includes(val)} onChange={() => toggleFilterValue(col.key, val)} />
                <span>{val}</span>
              </label>
            ))}
          </div>
        )}
      </th>
    );
  };

  return (
    <div className="card" data-illuminance-page="1" style={{ minHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        [data-illuminance-page="1"] th,
        [data-illuminance-page="1"] td { padding-left: 16px; padding-right: 16px; white-space: nowrap; text-align: center; }
        [data-illuminance-page="1"] td { padding-top: 10px; padding-bottom: 10px; }
        [data-illuminance-page="1"] button[data-illum-filter-btn]:hover { background: #f1f5f9 !important; }
        [data-illuminance-page="1"] button[data-illum-filter-btn][data-active="1"]:hover { background: #dbeafe !important; }
        [data-illuminance-page="1"] tbody tr:hover td { background: #f8fafc; }
        [data-illuminance-page="1"] .illum-field { width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 14px; font-family: inherit; }
        [data-illuminance-page="1"] .illum-field:focus-visible { outline: 2px solid #2563eb; outline-offset: 1px; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <h3 style={{ margin: 0 }}>💡 {td(ILLUMINANCE_META.listTitle)}</h3>
          <span style={{ fontSize: '12px', color: '#475569', background: '#f1f5f9', padding: '3px 8px', borderRadius: '999px', fontWeight: 600 }}>
            {activeFilterEntries.length > 0 ? `필터 결과 ${filteredRows.length} / ${rows.length}건` : `전체 ${rows.length}건`}
          </span>
          {activeFilterEntries.length === 0 && (
            <span style={{ fontSize: '12px', color: '#64748b' }}>항목 제목(▾)을 클릭하여 조건별 필터를 선택할 수 있습니다.</span>
          )}
        </div>
        <button type="button" className="btn btn-primary" onClick={() => openModal()}>
          {ILLUMINANCE_META.addBtnLabel}
        </button>
      </div>

      {activeFilterEntries.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '12px', padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#475569', marginRight: '4px' }}>적용 필터:</span>
          {activeFilterEntries.map((col) => {
            const vals = filters[col.key];
            const summary = vals.length === 1 ? vals[0] : `${vals[0]} 외 ${vals.length - 1}건`;
            return (
              <span key={col.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '999px', fontSize: '12px', fontWeight: 600, background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' }}>
                {td(col.label)}: {summary}
                <button
                  type="button"
                  onClick={() => setFilters((p) => ({ ...p, [col.key]: [] }))}
                  title={`${td(col.label)} 필터 해제`}
                  style={{ background: 'none', border: 'none', color: '#1e40af', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', lineHeight: 1, padding: '0 2px' }}
                >
                  &times;
                </button>
              </span>
            );
          })}
          <button
            type="button"
            onClick={() => setFilters({})}
            style={{ marginLeft: '4px', padding: '3px 8px', fontSize: '12px', fontWeight: 600, background: '#fff', color: '#475569', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer' }}
          >
            전체 필터 초기화
          </button>
        </div>
      )}

      <div style={{ overflowX: 'auto', flex: 1 }}>
        {loading ? (
          <p>로딩 중...</p>
        ) : loadError ? (
          <p style={{ color: '#b91c1c' }}>{loadError}</p>
        ) : (
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
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid #cbd5e1' }}>
                    <td style={{ color: '#64748b', fontWeight: 600 }}>{idx + 1}</td>
                    <td>{r.date || '-'}</td>
                    <td style={{ fontWeight: 'bold' }}>{r.location || '-'}</td>
                    <td>{r.standardLux ?? '-'}</td>
                    <td style={{ fontWeight: 'bold', color: isFail ? '#b91c1c' : 'inherit' }}>{r.measuredLux ?? '-'}</td>
                    <td>
                      <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 600, background: isFail ? '#fee2e2' : judgement === ILLUMINANCE_JUDGEMENT.PASS ? '#dcfce3' : '#f1f5f9', color: isFail ? '#991b1b' : judgement === ILLUMINANCE_JUDGEMENT.PASS ? '#166534' : '#64748b' }}>
                        {judgement}
                      </span>
                    </td>
                    <td>{r.instrument || '-'}</td>
                    <td>{r.measurer || '-'}</td>
                    <td style={{ maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={r.remark || ''}>{r.remark || '-'}</td>
                    <td>
                      <button type="button" className="btn btn-sm" onClick={() => openModal(r)} style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: '4px', padding: '4px 8px', fontSize: '12px', marginRight: '4px' }}>
                        수정
                      </button>
                      <button type="button" className="btn btn-secondary btn-sm" onClick={() => handleDelete(r)} style={{ background: '#fee2e2', color: '#991b1b', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '12px' }}>
                        삭제
                      </button>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={FILTER_COLUMNS.length + 3} style={{ padding: '32px 20px', color: '#64748b' }}>
                    <div style={{ fontWeight: 700, color: '#334155', marginBottom: '6px' }}>등록된 조도 측정 기록이 없습니다.</div>
                    <div style={{ fontSize: '12px' }}>
                      우측 상단의 <strong>{ILLUMINANCE_META.addBtnLabel}</strong> 버튼을 눌러 등록을 시작하세요.
                    </div>
                  </td>
                </tr>
              )}
              {rows.length > 0 && filteredRows.length === 0 && (
                <tr>
                  <td colSpan={FILTER_COLUMNS.length + 3} style={{ padding: '24px', color: '#64748b' }}>
                    선택한 필터 조건에 일치하는 기록이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="조도 측정 기록"
          style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <form onSubmit={handleSave} style={{ background: '#fff', padding: '24px', borderRadius: '10px', width: '480px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>{formData.id ? '조도 측정 수정' : '신규 조도 측정 등록'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={labelStyle} htmlFor="illum_date">측정일 *</label>
                <input id="illum_date" className="illum-field" type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle} htmlFor="illum_location">측정장소 *</label>
                <input id="illum_location" className="illum-field" list="illum_location_list" required value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="예: 조인트 1라인" />
                <datalist id="illum_location_list">
                  {ILLUMINANCE_LOCATION_SUGGESTIONS.map((s) => (
                    <option key={s} value={s} />
                  ))}
                </datalist>
              </div>
              <div>
                <label style={labelStyle} htmlFor="illum_standard">기준조도(lux) *</label>
                <input id="illum_standard" className="illum-field" type="number" inputMode="decimal" min="0" step="any" required value={formData.standardLux} onChange={(e) => setFormData({ ...formData, standardLux: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle} htmlFor="illum_measured">측정값(lux) *</label>
                <input id="illum_measured" className="illum-field" type="number" inputMode="decimal" min="0" step="any" required value={formData.measuredLux} onChange={(e) => setFormData({ ...formData, measuredLux: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle} htmlFor="illum_instrument">측정기(관리번호)</label>
                <input id="illum_instrument" className="illum-field" value={formData.instrument} onChange={(e) => setFormData({ ...formData, instrument: e.target.value })} placeholder="예: 조도계 005" />
              </div>
              <div>
                <label style={labelStyle} htmlFor="illum_measurer">측정자</label>
                <input id="illum_measurer" className="illum-field" value={formData.measurer} onChange={(e) => setFormData({ ...formData, measurer: e.target.value })} />
              </div>
            </div>
            <div style={{ marginTop: '12px' }}>
              <label style={labelStyle} htmlFor="illum_remark">비고</label>
              <textarea id="illum_remark" className="illum-field" rows={2} value={formData.remark} onChange={(e) => setFormData({ ...formData, remark: e.target.value })} />
            </div>
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#475569' }}>
              판정: <strong>{judgeIlluminance(formData.measuredLux, formData.standardLux)}</strong>
              <span style={{ color: '#94a3b8' }}> (측정값이 기준조도 이상이면 적합)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '18px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>취소</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? '저장 중...' : '저장'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
