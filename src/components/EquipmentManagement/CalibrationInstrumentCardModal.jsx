import React, { useEffect, useRef, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import {
  invalidateEquipmentsCache,
  fetchEquipmentPhotos,
  saveEquipmentPhotos,
  fetchCalibrationCertificate,
  saveCalibrationCertificate,
  deleteCalibrationCertificate
} from '../../services/firestore';
import {
  formatCalDotDate,
  normalizeCalIsoDate,
  computeNextCalibrationIsoDate
} from './CalibrationInstrumentListView';

const MAX_CERT_PDF_BYTES = 680 * 1024; // Firestore 단일 문서 1MB 제한 내 안전한 Base64 저장 한도

function readAndOptimizeImage(file, maxWidth = 900, maxHeight = 1100, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('이미지 읽기 실패'));
    reader.onload = () => {
      const rawDataUrl = String(reader.result || '');
      const img = new Image();
      img.onerror = () => resolve(rawDataUrl);
      img.onload = () => {
        const { width, height } = img;
        if (width <= maxWidth && height <= maxHeight && file.size <= 350 * 1024) {
          resolve(rawDataUrl);
          return;
        }
        const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
        const targetW = Math.max(1, Math.round(width * ratio));
        const targetH = Math.max(1, Math.round(height * ratio));
        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }
        ctx.drawImage(img, 0, 0, targetW, targetH);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}

function dataUrlToBlobUrl(dataUrl) {
  try {
    const [header, b64] = String(dataUrl || '').split(',');
    const mimeMatch = header.match(/data:([^;]+)/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const binary = atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  } catch {
    return '';
  }
}

function formatKoreanYearMonthDay(raw) {
  const iso = normalizeCalIsoDate(raw);
  if (!iso) return raw ? String(raw) : '';
  const [y, m, d] = iso.split('-');
  return `${y}년 ${m}월 ${d}일`;
}

function escapeHtml(val) {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function makeRowId() {
  return `row_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function createEmptyCalibrationRow() {
  return {
    rowId: makeRowId(),
    installDate: '',
    installLocation: '',
    calibrationDate: '',
    nextCalibrationDate: '',
    note: '',
    certId: '',
    certName: '',
    certMimeType: ''
  };
}

function buildInitialRows(equipment) {
  const existing = Array.isArray(equipment?.calibrationHistory)
    ? equipment.calibrationHistory
    : [];

  let rows = existing.map((r) => ({
    rowId: r?.rowId || makeRowId(),
    installDate: r?.installDate || '',
    installLocation: r?.installLocation || '',
    calibrationDate: normalizeCalIsoDate(r?.calibrationDate) || r?.calibrationDate || '',
    nextCalibrationDate:
      normalizeCalIsoDate(r?.nextCalibrationDate) || r?.nextCalibrationDate || '',
    note: r?.note || '',
    certId: r?.certId || '',
    certName: r?.certName || '',
    certMimeType: r?.certMimeType || ''
  }));

  if (rows.length === 0) {
    const initCal = normalizeCalIsoDate(equipment?.calibrationDate);
    const initNext = normalizeCalIsoDate(equipment?.nextCalibrationDate);
    const initInstall = normalizeCalIsoDate(equipment?.installDate);
    if (initCal || initNext || equipment?.storageLocation || equipment?.location || equipment?.calibrationAgency) {
      rows.push({
        rowId: makeRowId(),
        installDate: initInstall ? formatCalDotDate(initInstall) : '',
        installLocation: equipment?.storageLocation || equipment?.location || '',
        calibrationDate: initCal,
        nextCalibrationDate: initNext,
        note: equipment?.calibrationAgency || '',
        certId: '',
        certName: '',
        certMimeType: ''
      });
    }
  } else {
    // 리스트 수정 모달에서 교정일자가 직접 바뀐 경우 최신 행과 동기화 확인
    const listCal = normalizeCalIsoDate(equipment?.calibrationDate);
    if (listCal && !rows.some((r) => normalizeCalIsoDate(r.calibrationDate) === listCal)) {
      rows.push({
        rowId: makeRowId(),
        installDate: '',
        installLocation: equipment?.storageLocation || equipment?.location || '',
        calibrationDate: listCal,
        nextCalibrationDate: normalizeCalIsoDate(equipment?.nextCalibrationDate),
        note: equipment?.calibrationAgency || '',
        certId: '',
        certName: '',
        certMimeType: ''
      });
    }
  }

  while (rows.length < 4) {
    rows.push(createEmptyCalibrationRow());
  }
  return rows;
}

export default function CalibrationInstrumentCardModal({
  equipment,
  onClose,
  onUpdate,
  readOnly = false
}) {
  const [info, setInfo] = useState({
    name: equipment?.name || '',
    code: equipment?.code || '',
    usagePurpose: equipment?.usagePurpose || '',
    manufacturer: equipment?.manufacturer || '',
    modelType: equipment?.modelType || '',
    serialNo: equipment?.serialNo || equipment?.assetNo || '',
    modelSpec: equipment?.modelSpec || '',
    precision: equipment?.precision || '',
    spec: equipment?.spec || '',
    installDate: normalizeCalIsoDate(equipment?.installDate) || equipment?.installDate || ''
  });

  const [photoDataUrl, setPhotoDataUrl] = useState(equipment?.equipmentPhoto || '');
  const [dirtyPhoto, setDirtyPhoto] = useState(false);

  const [rows, setRows] = useState(() => buildInitialRows(equipment));
  // { [rowId]: { dataUrl, fileName, mimeType, fileSize, action: 'upsert' | 'delete' | 'cached' } }
  const [certCache, setCertCache] = useState({});
  const [deletedCertIds, setDeletedCertIds] = useState([]);

  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const [previewCert, setPreviewCert] = useState(null); // { fileName, mimeType, dataUrl, blobUrl }
  const [loadingCertId, setLoadingCertId] = useState('');

  const photoInputRef = useRef(null);
  const certInputRefs = useRef({});

  useEffect(() => {
    let alive = true;
    fetchEquipmentPhotos(equipment.id).then((photos) => {
      if (!alive) return;
      if (photos.equipmentPhoto) {
        setPhotoDataUrl((prev) => prev || photos.equipmentPhoto);
      }
    });
    return () => {
      alive = false;
    };
  }, [equipment.id]);

  useEffect(() => {
    return () => {
      if (previewCert?.blobUrl) {
        URL.revokeObjectURL(previewCert.blobUrl);
      }
    };
  }, [previewCert]);

  const handleInfoChange = (key, value) => {
    if (readOnly) return;
    setInfo((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handlePhotoUpload = async (e) => {
    if (readOnly) return;
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const optimized = await readAndOptimizeImage(file, 900, 1100, 0.85);
      setPhotoDataUrl(optimized);
      setDirtyPhoto(true);
      setIsDirty(true);
    } catch (err) {
      console.error(err);
      alert('사진 처리 중 오류가 발생했습니다.');
    }
  };

  const handleClearPhoto = () => {
    if (readOnly) return;
    setPhotoDataUrl('');
    setDirtyPhoto(true);
    setIsDirty(true);
  };

  const handleRowChange = (idx, key, value) => {
    if (readOnly) return;
    setRows((prev) =>
      prev.map((r, i) => {
        if (i !== idx) return r;
        const nextRow = { ...r, [key]: value };
        if (key === 'calibrationDate') {
          const autoNext = computeNextCalibrationIsoDate(
            value,
            equipment?.calibrationCycle || '1년'
          );
          if (autoNext) {
            nextRow.nextCalibrationDate = autoNext;
          }
        }
        return nextRow;
      })
    );
    setIsDirty(true);
  };

  const handleAddRow = () => {
    if (readOnly) return;
    setRows((prev) => [...prev, createEmptyCalibrationRow()]);
    setIsDirty(true);
  };

  const handleRemoveRow = (idx) => {
    if (readOnly) return;
    const target = rows[idx];
    if (target?.certId) {
      setDeletedCertIds((prev) => (prev.includes(target.certId) ? prev : [...prev, target.certId]));
    }
    setRows((prev) => {
      const filtered = prev.filter((_, i) => i !== idx);
      while (filtered.length < 4) {
        filtered.push(createEmptyCalibrationRow());
      }
      return filtered;
    });
    setIsDirty(true);
  };

  const handleUploadCertificate = async (idx, e) => {
    if (readOnly) return;
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    if (!isPdf && !isImage) {
      alert('PDF 파일(.pdf) 또는 이미지 파일(JPG, PNG 등)만 업로드할 수 있습니다.');
      return;
    }

    try {
      let dataUrl = '';
      let mimeType = file.type;
      if (isPdf) {
        if (file.size > MAX_CERT_PDF_BYTES) {
          alert(
            `PDF 파일 크기가 너무 큽니다 (${Math.round(file.size / 1024)}KB).\n` +
              `스캔 PDF는 680KB 이하로 압축하거나, 스캔 이미지(JPG/PNG)로 업로드해 주세요.`
          );
          return;
        }
        dataUrl = await readFileAsDataUrl(file);
        mimeType = 'application/pdf';
      } else {
        dataUrl = await readAndOptimizeImage(file, 1400, 1900, 0.85);
        mimeType = 'image/jpeg';
      }

      const row = rows[idx];
      const certId = row.certId || `${equipment.id}_${row.rowId}`;
      setCertCache((prev) => ({
        ...prev,
        [certId]: {
          fileName: file.name,
          mimeType,
          dataUrl,
          fileSize: file.size,
          action: 'upsert'
        }
      }));
      setDeletedCertIds((prev) => prev.filter((id) => id !== certId));
      setRows((prev) =>
        prev.map((r, i) =>
          i === idx
            ? {
                ...r,
                certId,
                certName: file.name,
                certMimeType: mimeType
              }
            : r
        )
      );
      setIsDirty(true);
    } catch (err) {
      console.error(err);
      alert('인증서 파일 처리 중 오류가 발생했습니다.');
    }
  };

  const handleRemoveCertificate = (idx) => {
    if (readOnly) return;
    const row = rows[idx];
    if (!row?.certId) return;
    setDeletedCertIds((prev) => (prev.includes(row.certId) ? prev : [...prev, row.certId]));
    setCertCache((prev) => {
      const next = { ...prev };
      delete next[row.certId];
      return next;
    });
    setRows((prev) =>
      prev.map((r, i) =>
        i === idx ? { ...r, certId: '', certName: '', certMimeType: '' } : r
      )
    );
    setIsDirty(true);
  };

  const handleViewCertificate = async (row) => {
    if (!row?.certId) return;
    let entry = certCache[row.certId];
    if (!entry?.dataUrl) {
      setLoadingCertId(row.certId);
      const fetched = await fetchCalibrationCertificate(row.certId);
      setLoadingCertId('');
      if (!fetched?.dataUrl) {
        alert('저장된 인증서 파일을 찾을 수 없습니다.');
        return;
      }
      entry = {
        fileName: fetched.fileName || row.certName || '인증서',
        mimeType: fetched.mimeType || row.certMimeType || '',
        dataUrl: fetched.dataUrl,
        action: 'cached'
      };
      setCertCache((prev) => ({ ...prev, [row.certId]: entry }));
    }

    const isPdf =
      entry.mimeType === 'application/pdf' ||
      String(entry.dataUrl || '').startsWith('data:application/pdf');
    const blobUrl = isPdf ? dataUrlToBlobUrl(entry.dataUrl) : '';
    setPreviewCert({
      fileName: entry.fileName || row.certName || '인증서',
      mimeType: entry.mimeType,
      isPdf,
      dataUrl: entry.dataUrl,
      blobUrl
    });
  };

  const handleSave = async () => {
    if (readOnly || saving) return;
    if (!String(info.name || '').trim() || !String(info.code || '').trim()) {
      alert('계측기명과 관리번호를 입력해 주세요.');
      return;
    }

    setSaving(true);
    try {
      // 1) 사진 별도 컬렉션(equipment_photos) 저장
      if (dirtyPhoto) {
        await saveEquipmentPhotos(equipment.id, { equipmentPhoto: photoDataUrl });
      }

      // 2) 삭제된 인증서 정리 및 신규/수정 인증서 저장 (calibration_certificates)
      for (const delId of deletedCertIds) {
        await deleteCalibrationCertificate(delId);
      }

      const cleanedHistory = rows
        .map((r) => ({
          rowId: r.rowId || makeRowId(),
          installDate: String(r.installDate || '').trim(),
          installLocation: String(r.installLocation || '').trim(),
          calibrationDate:
            normalizeCalIsoDate(r.calibrationDate) || String(r.calibrationDate || '').trim(),
          nextCalibrationDate:
            normalizeCalIsoDate(r.nextCalibrationDate) ||
            String(r.nextCalibrationDate || '').trim(),
          note: String(r.note || '').trim(),
          certId: r.certId || '',
          certName: r.certName || '',
          certMimeType: r.certMimeType || ''
        }))
        .filter(
          (r) =>
            r.installDate ||
            r.installLocation ||
            r.calibrationDate ||
            r.nextCalibrationDate ||
            r.note ||
            r.certId
        );

      for (const r of cleanedHistory) {
        if (!r.certId) continue;
        const cached = certCache[r.certId];
        if (cached?.action === 'upsert' && cached.dataUrl) {
          await saveCalibrationCertificate(r.certId, {
            equipmentId: equipment.id,
            fileName: cached.fileName,
            mimeType: cached.mimeType,
            dataUrl: cached.dataUrl,
            fileSize: cached.fileSize
          });
        }
      }

      // 3) 검교정일 / 차기교정일 최신 행 기준으로 검교정 리스트(계측기) 필드 즉시 연동
      const datedRows = cleanedHistory.filter(
        (r) => normalizeCalIsoDate(r.calibrationDate) || normalizeCalIsoDate(r.nextCalibrationDate)
      );
      let latestCalRow = null;
      if (datedRows.length > 0) {
        latestCalRow = datedRows.reduce((best, cur) => {
          const bestKey = normalizeCalIsoDate(best.calibrationDate) || '';
          const curKey = normalizeCalIsoDate(cur.calibrationDate) || '';
          return curKey >= bestKey ? cur : best;
        }, datedRows[0]);
      }

      const syncedCalibrationDate = latestCalRow
        ? normalizeCalIsoDate(latestCalRow.calibrationDate) || latestCalRow.calibrationDate || ''
        : equipment.calibrationDate || '';
      const syncedNextCalibrationDate = latestCalRow
        ? normalizeCalIsoDate(latestCalRow.nextCalibrationDate) ||
          latestCalRow.nextCalibrationDate ||
          ''
        : equipment.nextCalibrationDate || '';

      const trimmedSerial = String(info.serialNo || '').trim();
      const normalizedInstallDate =
        normalizeCalIsoDate(info.installDate) || String(info.installDate || '').trim();

      const updatePayload = {
        name: String(info.name || '').trim(),
        code: String(info.code || '').trim(),
        usagePurpose: String(info.usagePurpose || '').trim(),
        manufacturer: String(info.manufacturer || '').trim(),
        modelType: String(info.modelType || '').trim(),
        serialNo: trimmedSerial,
        assetNo: trimmedSerial,
        modelSpec: String(info.modelSpec || '').trim(),
        precision: String(info.precision || '').trim(),
        spec: String(info.spec || '').trim(),
        installDate: normalizedInstallDate,
        calibrationDate: syncedCalibrationDate,
        nextCalibrationDate: syncedNextCalibrationDate,
        calibrationHistory: cleanedHistory
      };

      await updateDoc(doc(db, 'equipments', equipment.id), updatePayload);
      invalidateEquipmentsCache();

      setDirtyPhoto(false);
      setDeletedCertIds([]);
      setIsDirty(false);
      setCertCache((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((k) => {
          if (next[k]?.action === 'upsert') {
            next[k] = { ...next[k], action: 'cached' };
          }
        });
        return next;
      });

      if (onUpdate) {
        onUpdate({
          ...equipment,
          ...updatePayload,
          equipmentPhoto: photoDataUrl
        });
      }
      alert('계측기관리대장이 저장되었으며 검교정 리스트에 검교정일자가 연동되었습니다.');
    } catch (err) {
      console.error(err);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const win = window.open('', '_blank', 'width=900,height=1100');
    if (!win) {
      alert('팝업이 차단되어 인쇄 창을 열 수 없습니다.');
      return;
    }

    const printRows = [...rows];
    while (printRows.length < 4) printRows.push(createEmptyCalibrationRow());

    const rowsHtml = printRows
      .map((r) => {
        const calText = r.calibrationDate ? formatCalDotDate(r.calibrationDate) : '';
        const nextText = r.nextCalibrationDate ? formatCalDotDate(r.nextCalibrationDate) : '';
        return `
          <tr>
            <td>${escapeHtml(r.installDate)}</td>
            <td>${escapeHtml(r.installLocation)}</td>
            <td>${escapeHtml(calText)}</td>
            <td>${escapeHtml(nextText)}</td>
            <td>${escapeHtml(r.note)}</td>
          </tr>`;
      })
      .join('');

    const photoHtml = photoDataUrl
      ? `<img src="${photoDataUrl}" alt="계측기 사진" style="max-width:94%;max-height:360px;object-fit:contain;display:block;margin:12px auto;" />`
      : `<div style="height:260px;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:13px;">등록된 사진 없음</div>`;

    win.document.write(`<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <title>계측기관리대장 - ${escapeHtml(info.name)} (${escapeHtml(info.code)})</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; margin: 0; color: #0f172a; }
    .sheet { border: 2px solid #1e293b; }
    .title-bar { display:flex; align-items:center; justify-content:center; position:relative; padding:12px 14px; border-bottom:1.5px solid #1e293b; }
    .company { position:absolute; left:14px; font-weight:800; font-size:13px; }
    .title { font-size:24px; font-weight:900; letter-spacing:0.35em; }
    table { width:100%; border-collapse:collapse; table-layout:fixed; }
    th, td { border:1px solid #334155; padding:6px 8px; text-align:center; font-size:12px; height:30px; }
    th { background:#f8fafc; font-weight:700; }
    .sec-head { background:#f8fafc; font-weight:800; font-size:15px; letter-spacing:0.3em; padding:6px; border-top:1.5px solid #1e293b; border-bottom:1px solid #334155; text-align:center; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="title-bar">
      <span class="company">(주)조영산업</span>
      <span class="title">계측기관리대장</span>
    </div>
    <table>
      <colgroup>
        <col style="width:13%" /><col style="width:39%" /><col style="width:14%" /><col style="width:34%" />
      </colgroup>
      <tr>
        <th rowspan="2">계측기명</th>
        <td rowspan="2" style="font-weight:700;">${escapeHtml(info.name)}</td>
        <th>관리번호</th>
        <td>${escapeHtml(info.code)}</td>
      </tr>
      <tr>
        <th>사용용도</th>
        <td>${escapeHtml(info.usagePurpose)}</td>
      </tr>
    </table>
    <table style="border-top:none;">
      <colgroup>
        <col style="width:13%" /><col style="width:19%" /><col style="width:11%" /><col style="width:22%" /><col style="width:13%" /><col style="width:22%" />
      </colgroup>
      <tr>
        <th style="border-top:none;">제조회사</th><td style="border-top:none;">${escapeHtml(info.manufacturer)}</td>
        <th style="border-top:none;">형 식</th><td style="border-top:none;">${escapeHtml(info.modelType)}</td>
        <th style="border-top:none;">기기번호</th><td style="border-top:none;">${escapeHtml(info.serialNo)}</td>
      </tr>
      <tr>
        <th>규 격</th><td>${escapeHtml(info.modelSpec)}</td>
        <th>정밀도</th><td>${escapeHtml(info.precision)}</td>
        <th rowspan="2">측정범위</th><td rowspan="2">${escapeHtml(info.spec)}</td>
      </tr>
      <tr>
        <th>취득일자</th><td colspan="3">${escapeHtml(formatKoreanYearMonthDay(info.installDate))}</td>
      </tr>
    </table>
    <div class="sec-head">사 진</div>
    <div style="min-height:340px;display:flex;align-items:center;justify-content:center;border-bottom:1.5px solid #1e293b;">
      ${photoHtml}
    </div>
    <div class="sec-head" style="letter-spacing:0.08em;border-top:none;">설치, 이동사항</div>
    <table>
      <colgroup>
        <col style="width:16%" /><col style="width:20%" /><col style="width:20%" /><col style="width:20%" /><col style="width:24%" />
      </colgroup>
      <thead>
        <tr>
          <th>설치일자</th><th>설치장소</th><th>검교정일</th><th>차기교정일</th><th>비 고</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
    </table>
  </div>
</body>
</html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 250);
  };

  const handleRequestClose = () => {
    if (isDirty && !window.confirm('저장하지 않은 변경사항이 있습니다. 닫으시겠습니까?')) {
      return;
    }
    onClose();
  };

  const cellInputStyle = {
    width: '100%',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    textAlign: 'center',
    fontSize: '12.5px',
    color: '#0f172a',
    padding: '4px 6px',
    fontFamily: 'inherit'
  };

  return (
    <div
      data-cal-ledger-modal="1"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2100,
        padding: '16px'
      }}
    >
      <style>{`
        [data-cal-ledger-modal="1"] .ledger-table th,
        [data-cal-ledger-modal="1"] .ledger-table td {
          border: 1px solid #475569;
          text-align: center;
          vertical-align: middle;
          padding: 4px 6px;
          font-size: 12.5px;
        }
        [data-cal-ledger-modal="1"] .ledger-table th {
          background: #f8fafc;
          font-weight: 800;
          color: #0f172a;
          white-space: nowrap;
        }
        [data-cal-ledger-modal="1"] .ledger-cell-input:focus {
          background: #eff6ff !important;
          border-radius: 3px;
        }
      `}</style>

      <div
        style={{
          background: '#ffffff',
          borderRadius: '10px',
          width: '880px',
          maxWidth: '100%',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.28)'
        }}
      >
        {/* 모달 상단 액션 바 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
            padding: '12px 18px',
            background: '#f1f5f9',
            borderBottom: '1px solid #cbd5e1'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>
              📋 계측기관리대장 ({info.code || '-'} · {info.name || '-'})
            </span>
            {isDirty && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  background: '#fef3c7',
                  color: '#92400e',
                  border: '1px solid #fde68a',
                  padding: '2px 7px',
                  borderRadius: '999px'
                }}
              >
                수정됨 (저장 필요)
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-sm"
              onClick={handlePrint}
              style={{
                background: '#ffffff',
                color: '#0f172a',
                border: '1px solid #94a3b8',
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              🖨️ 인쇄
            </button>
            {!readOnly && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                disabled={saving}
                onClick={handleSave}
                style={{
                  fontWeight: 700,
                  padding: '6px 14px',
                  borderRadius: '6px',
                  cursor: saving ? 'wait' : 'pointer'
                }}
              >
                {saving ? '저장 중...' : '💾 저장 (리스트 연동)'}
              </button>
            )}
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleRequestClose}
              style={{ padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}
            >
              닫기
            </button>
          </div>
        </div>

        {/* 대장 본문 */}
        <div style={{ padding: '18px', overflowY: 'auto', flex: 1, background: '#ffffff' }}>
          <div style={{ border: '2px solid #1e293b', background: '#ffffff' }}>
            {/* 대장 타이틀 배너 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                padding: '12px 16px',
                borderBottom: '1.5px solid #1e293b'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle at 35% 35%, #3b82f6, #1e3a8a)',
                    display: 'inline-block'
                  }}
                />
                <span style={{ fontWeight: 800, fontSize: '13px', color: '#0f172a' }}>
                  (주)조영산업
                </span>
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '23px',
                  fontWeight: 900,
                  letterSpacing: '0.38em',
                  color: '#0f172a'
                }}
              >
                계측기관리대장
              </h2>
            </div>

            {/* 상단 1블록: 계측기명 / 관리번호 / 사용용도 */}
            <table className="ledger-table" style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '13%' }} />
                <col style={{ width: '39%' }} />
                <col style={{ width: '14%' }} />
                <col style={{ width: '34%' }} />
              </colgroup>
              <tbody>
                <tr>
                  <th rowSpan={2} style={{ borderTop: 'none', borderLeft: 'none' }}>계측기명</th>
                  <td rowSpan={2} style={{ borderTop: 'none' }}>
                    <input
                      type="text"
                      className="ledger-cell-input"
                      readOnly={readOnly}
                      value={info.name}
                      onChange={(e) => handleInfoChange('name', e.target.value)}
                      style={{ ...cellInputStyle, fontWeight: 800, fontSize: '13.5px' }}
                      placeholder="계측기명"
                    />
                  </td>
                  <th style={{ borderTop: 'none' }}>관리번호</th>
                  <td style={{ borderTop: 'none', borderRight: 'none' }}>
                    <input
                      type="text"
                      className="ledger-cell-input"
                      readOnly={readOnly}
                      value={info.code}
                      onChange={(e) => handleInfoChange('code', e.target.value)}
                      style={{ ...cellInputStyle, fontWeight: 700 }}
                      placeholder="예: 008"
                    />
                  </td>
                </tr>
                <tr>
                  <th>사용용도</th>
                  <td style={{ borderRight: 'none' }}>
                    <input
                      type="text"
                      className="ledger-cell-input"
                      readOnly={readOnly}
                      value={info.usagePurpose}
                      onChange={(e) => handleInfoChange('usagePurpose', e.target.value)}
                      style={cellInputStyle}
                      placeholder="예: 고무 중량 측정"
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 상단 2블록: 제조회사 / 형식 / 기기번호 / 규격 / 정밀도 / 측정범위 / 취득일자 */}
            <table
              className="ledger-table"
              style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}
            >
              <colgroup>
                <col style={{ width: '13%' }} />
                <col style={{ width: '19%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '13%' }} />
                <col style={{ width: '22%' }} />
              </colgroup>
              <tbody>
                <tr>
                  <th style={{ borderTop: 'none', borderLeft: 'none' }}>제조회사</th>
                  <td style={{ borderTop: 'none' }}>
                    <input
                      type="text"
                      className="ledger-cell-input"
                      readOnly={readOnly}
                      value={info.manufacturer}
                      onChange={(e) => handleInfoChange('manufacturer', e.target.value)}
                      style={cellInputStyle}
                      placeholder="예: CAS"
                    />
                  </td>
                  <th style={{ borderTop: 'none' }}>형 식</th>
                  <td style={{ borderTop: 'none' }}>
                    <input
                      type="text"
                      className="ledger-cell-input"
                      readOnly={readOnly}
                      value={info.modelType}
                      onChange={(e) => handleInfoChange('modelType', e.target.value)}
                      style={cellInputStyle}
                      placeholder="예: 전자식 지시저울"
                    />
                  </td>
                  <th style={{ borderTop: 'none' }}>기기번호</th>
                  <td style={{ borderTop: 'none', borderRight: 'none' }}>
                    <input
                      type="text"
                      className="ledger-cell-input"
                      readOnly={readOnly}
                      value={info.serialNo}
                      onChange={(e) => handleInfoChange('serialNo', e.target.value)}
                      style={cellInputStyle}
                      placeholder="예: WR0385"
                    />
                  </td>
                </tr>
                <tr>
                  <th style={{ borderLeft: 'none' }}>규 격</th>
                  <td>
                    <input
                      type="text"
                      className="ledger-cell-input"
                      readOnly={readOnly}
                      value={info.modelSpec}
                      onChange={(e) => handleInfoChange('modelSpec', e.target.value)}
                      style={cellInputStyle}
                      placeholder="예: MWII-300H"
                    />
                  </td>
                  <th>정밀도</th>
                  <td>
                    <input
                      type="text"
                      className="ledger-cell-input"
                      readOnly={readOnly}
                      value={info.precision}
                      onChange={(e) => handleInfoChange('precision', e.target.value)}
                      style={cellInputStyle}
                      placeholder="예: 0.01g"
                    />
                  </td>
                  <th rowSpan={2}>측정범위</th>
                  <td rowSpan={2} style={{ borderRight: 'none' }}>
                    <input
                      type="text"
                      className="ledger-cell-input"
                      readOnly={readOnly}
                      value={info.spec}
                      onChange={(e) => handleInfoChange('spec', e.target.value)}
                      style={cellInputStyle}
                      placeholder="예: 0.2~300g"
                    />
                  </td>
                </tr>
                <tr>
                  <th style={{ borderLeft: 'none' }}>취득일자</th>
                  <td colSpan={3}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <input
                        type="date"
                        max="9999-12-31"
                        className="ledger-cell-input"
                        readOnly={readOnly}
                        value={normalizeCalIsoDate(info.installDate)}
                        onChange={(e) => handleInfoChange('installDate', e.target.value)}
                        style={{ ...cellInputStyle, width: '150px' }}
                      />
                      {info.installDate && (
                        <span style={{ fontSize: '12px', color: '#475569' }}>
                          ({formatKoreanYearMonthDay(info.installDate)})
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 사 진 영역 */}
            <div
              style={{
                background: '#f8fafc',
                borderTop: '1px solid #475569',
                borderBottom: '1px solid #475569',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <span style={{ fontWeight: 800, fontSize: '15px', letterSpacing: '0.45em', color: '#0f172a' }}>
                사진
              </span>
              {!readOnly && (
                <div style={{ position: 'absolute', right: '10px', display: 'flex', gap: '6px' }}>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handlePhotoUpload}
                  />
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    style={{
                      padding: '3px 9px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      border: '1px solid #93c5fd',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    📷 {photoDataUrl ? '사진 변경' : '사진 업로드'}
                  </button>
                  {photoDataUrl && (
                    <button
                      type="button"
                      onClick={handleClearPhoto}
                      style={{
                        padding: '3px 8px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: '1px solid #fca5a5',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      삭제
                    </button>
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                minHeight: '290px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '14px',
                borderBottom: '1.5px solid #1e293b',
                background: '#ffffff'
              }}
            >
              {photoDataUrl ? (
                <img
                  src={photoDataUrl}
                  alt={`${info.name || '계측기'} 사진`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '340px',
                    objectFit: 'contain',
                    borderRadius: '4px',
                    border: '1px solid #e2e8f0'
                  }}
                />
              ) : (
                <button
                  type="button"
                  disabled={readOnly}
                  onClick={() => !readOnly && photoInputRef.current?.click()}
                  style={{
                    width: '320px',
                    height: '220px',
                    border: '2px dashed #cbd5e1',
                    borderRadius: '8px',
                    background: '#f8fafc',
                    color: '#64748b',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: readOnly ? 'default' : 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ fontSize: '28px' }}>📷</span>
                  <span>계측기 사진 업로드</span>
                  <span style={{ fontSize: '11px', fontWeight: 500 }}>
                    클릭하여 이미지 파일을 선택하세요
                  </span>
                </button>
              )}
            </div>

            {/* 설치, 이동사항 섹션 헤더 */}
            <div
              style={{
                background: '#f8fafc',
                borderBottom: '1px solid #475569',
                padding: '6px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative'
              }}
            >
              <span style={{ fontWeight: 800, fontSize: '14.5px', letterSpacing: '0.08em', color: '#0f172a' }}>
                설치, 이동사항
              </span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={handleAddRow}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    padding: '3px 9px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    background: '#ecfdf5',
                    color: '#065f46',
                    border: '1px solid #6ee7b7',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  + 행 추가
                </button>
              )}
            </div>

            {/* 설치, 이동사항 & 검교정일 + 인증서 업로드 테이블 */}
            <table
              className="ledger-table"
              style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}
            >
              <colgroup>
                <col style={{ width: '13%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '17%' }} />
                <col style={{ width: '19%' }} />
                <col style={{ width: '17%' }} />
                <col style={{ width: '14%' }} />
                {!readOnly && <col style={{ width: '5%' }} />}
              </colgroup>
              <thead>
                <tr>
                  <th style={{ borderLeft: 'none' }}>설치일자</th>
                  <th>설치장소</th>
                  <th>검교정일</th>
                  <th>인증서 (PDF/이미지)</th>
                  <th>차기교정일</th>
                  <th style={{ borderRight: readOnly ? 'none' : undefined }}>비 고</th>
                  {!readOnly && <th style={{ borderRight: 'none' }}>삭제</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const isPdfCert =
                    row.certMimeType === 'application/pdf' ||
                    String(row.certName || '').toLowerCase().endsWith('.pdf');
                  return (
                    <tr key={row.rowId}>
                      <td style={{ borderLeft: 'none' }}>
                        <input
                          type="text"
                          className="ledger-cell-input"
                          readOnly={readOnly}
                          value={row.installDate}
                          onChange={(e) => handleRowChange(idx, 'installDate', e.target.value)}
                          style={cellInputStyle}
                          placeholder="예: 23. 09. 06"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="ledger-cell-input"
                          readOnly={readOnly}
                          value={row.installLocation}
                          onChange={(e) => handleRowChange(idx, 'installLocation', e.target.value)}
                          style={cellInputStyle}
                          placeholder="설치장소"
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          max="9999-12-31"
                          className="ledger-cell-input"
                          readOnly={readOnly}
                          value={normalizeCalIsoDate(row.calibrationDate)}
                          onChange={(e) => handleRowChange(idx, 'calibrationDate', e.target.value)}
                          style={cellInputStyle}
                        />
                      </td>
                      <td>
                        <input
                          ref={(el) => {
                            certInputRefs.current[row.rowId] = el;
                          }}
                          type="file"
                          accept="application/pdf,image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleUploadCertificate(idx, e)}
                        />
                        {row.certId ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                            <button
                              type="button"
                              disabled={loadingCertId === row.certId}
                              onClick={() => handleViewCertificate(row)}
                              title={`${row.certName || '인증서'} 보기`}
                              style={{
                                maxWidth: '100px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                padding: '3px 7px',
                                fontSize: '11px',
                                fontWeight: 700,
                                background: isPdfCert ? '#fef2f2' : '#eff6ff',
                                color: isPdfCert ? '#b91c1c' : '#1d4ed8',
                                border: isPdfCert ? '1px solid #fecaca' : '1px solid #bfdbfe',
                                borderRadius: '4px',
                                cursor: 'pointer'
                              }}
                            >
                              {loadingCertId === row.certId
                                ? '불러오는 중...'
                                : `${isPdfCert ? '📄' : '🖼️'} ${row.certName || '인증서'}`}
                            </button>
                            {!readOnly && (
                              <>
                                <button
                                  type="button"
                                  title="파일 교체"
                                  onClick={() => certInputRefs.current[row.rowId]?.click()}
                                  style={{
                                    padding: '2px 5px',
                                    fontSize: '10.5px',
                                    background: '#f1f5f9',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '3px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  변경
                                </button>
                                <button
                                  type="button"
                                  title="인증서 삭제"
                                  onClick={() => handleRemoveCertificate(idx)}
                                  style={{
                                    padding: '2px 5px',
                                    fontSize: '10.5px',
                                    background: '#fee2e2',
                                    color: '#991b1b',
                                    border: 'none',
                                    borderRadius: '3px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  ×
                                </button>
                              </>
                            )}
                          </div>
                        ) : !readOnly ? (
                          <button
                            type="button"
                            onClick={() => certInputRefs.current[row.rowId]?.click()}
                            style={{
                              padding: '3px 8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              background: '#f8fafc',
                              color: '#334155',
                              border: '1px dashed #94a3b8',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            📎 PDF/이미지 업로드
                          </button>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '11.5px' }}>-</span>
                        )}
                      </td>
                      <td>
                        <input
                          type="date"
                          max="9999-12-31"
                          className="ledger-cell-input"
                          readOnly={readOnly}
                          value={normalizeCalIsoDate(row.nextCalibrationDate)}
                          onChange={(e) => handleRowChange(idx, 'nextCalibrationDate', e.target.value)}
                          style={cellInputStyle}
                        />
                      </td>
                      <td style={{ borderRight: readOnly ? 'none' : undefined }}>
                        <input
                          type="text"
                          className="ledger-cell-input"
                          readOnly={readOnly}
                          value={row.note}
                          onChange={(e) => handleRowChange(idx, 'note', e.target.value)}
                          style={cellInputStyle}
                          placeholder="비고"
                        />
                      </td>
                      {!readOnly && (
                        <td style={{ borderRight: 'none' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(idx)}
                            title="행 삭제"
                            style={{
                              background: '#fee2e2',
                              color: '#991b1b',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            ×
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '8px', fontSize: '11.5px', color: '#64748b' }}>
            * <strong>설치, 이동사항</strong>의 가장 최근 <strong>검교정일 · 차기교정일</strong>은 저장 시 <strong>검교정 리스트(계측기)</strong> 목록에 자동으로 연동됩니다.
          </div>
        </div>
      </div>

      {/* 인증서 미리보기 서브 모달 (PDF / 이미지) */}
      {previewCert && (
        <div
          onClick={() => setPreviewCert(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.72)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 2200,
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '10px',
              width: '860px',
              maxWidth: '100%',
              height: '86vh',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 16px',
                background: '#f1f5f9',
                borderBottom: '1px solid #cbd5e1'
              }}
            >
              <span style={{ fontWeight: 800, fontSize: '13.5px', color: '#0f172a' }}>
                {previewCert.isPdf ? '📄' : '🖼️'} 인증서 미리보기 — {previewCert.fileName}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <a
                  href={previewCert.blobUrl || previewCert.dataUrl}
                  download={previewCert.fileName}
                  style={{
                    padding: '5px 10px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid #93c5fd',
                    borderRadius: '5px',
                    textDecoration: 'none'
                  }}
                >
                  ⬇️ 다운로드
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewCert(null)}
                  style={{
                    padding: '5px 10px',
                    fontSize: '12px',
                    fontWeight: 700,
                    background: '#e2e8f0',
                    color: '#0f172a',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  닫기
                </button>
              </div>
            </div>
            <div
              style={{
                flex: 1,
                overflow: 'auto',
                background: '#1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px'
              }}
            >
              {previewCert.isPdf ? (
                <iframe
                  title={previewCert.fileName}
                  src={previewCert.blobUrl || previewCert.dataUrl}
                  style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
                />
              ) : (
                <img
                  src={previewCert.dataUrl}
                  alt={previewCert.fileName}
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
