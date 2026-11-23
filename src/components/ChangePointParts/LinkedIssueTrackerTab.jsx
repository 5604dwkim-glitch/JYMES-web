import React, { useMemo, useState } from 'react';
import { REPAIR_STATE_LABEL, ORIGIN_LABEL } from '../../services/downtimeChain';
import { fetchReportDowntimePhoto } from '../../services/firestore';
import { normalizeCarModelName } from './DeepChangePointDashboard';

const STAGE_BADGE_MAP = {
  awaiting_repair: {
    label: '수리 필요',
    bg: '#fef2f2',
    color: '#b91c1c',
    border: '#fecaca'
  },
  awaiting_approval: {
    label: '검증·승인 대기',
    bg: '#fffbeb',
    color: '#b45309',
    border: '#fde68a'
  },
  completed: {
    label: '최종 완료',
    bg: '#ecfdf5',
    color: '#047857',
    border: '#a7f3d0'
  },
  unregistered: {
    label: '미연동',
    bg: '#f1f5f9',
    color: '#64748b',
    border: '#cbd5e1'
  }
};

const REPAIR_CHIP_STYLE = {
  done: { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
  working: { bg: '#fef3c7', color: '#b45309', border: '#fcd34d' },
  received: { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
  none: { bg: '#f1f5f9', color: '#64748b', border: '#cbd5e1' }
};

const ORIGIN_CHIP_STYLE = {
  report: { bg: '#eff6ff', color: '#1d4ed8' },
  tpm: { bg: '#f0fdf4', color: '#15803d' },
  direct: { bg: '#fff7ed', color: '#c2410c' },
  auto_cp: { bg: '#eef2ff', color: '#4338ca' },
  manual_cp: { bg: '#f8fafc', color: '#475569' }
};

function calcElapsedDays(dateStr) {
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
}

function buildFiveStageSteps(it, cp) {
  const step1 = { label: '① 발생·접수', state: 'done', sub: it.date || '등록' };
  const step2 = it.hasRepairRow
    ? it.repairState === 'done'
      ? { label: '② 수리조치', state: 'done', sub: '수리완료' }
      : {
          label: '② 수리조치',
          state: 'active',
          sub: it.repairState === 'working' ? '조치중' : '수리대기'
        }
    : { label: '② 수리조치', state: cp ? 'done' : 'pending', sub: cp ? '직접/해당없음' : '미등록' };

  const repairClear = !it.hasRepairRow || it.repairState === 'done';
  const step3 = !cp
    ? { label: '③ 품질검증', state: 'pending', sub: '변동점 미연동' }
    : it.qcDone
      ? { label: '③ 품질검증', state: 'done', sub: '검증완료' }
      : { label: '③ 품질검증', state: repairClear ? 'active' : 'pending', sub: '검증대기' };

  const step4 = !cp
    ? { label: '④ Q-Point', state: 'pending', sub: '대기' }
    : it.qPointDone
      ? { label: '④ Q-Point', state: 'done', sub: '작성완료' }
      : { label: '④ Q-Point', state: it.qcDone ? 'active' : 'pending', sub: '작성권장' };

  const step5 = !cp
    ? { label: '⑤ 최종승인', state: 'pending', sub: '대기' }
    : it.ceoDone
      ? { label: '⑤ 최종승인', state: 'done', sub: '승인완료' }
      : { label: '⑤ 최종승인', state: it.qcDone ? 'active' : 'pending', sub: '승인대기' };

  return [step1, step2, step3, step4, step5];
}

export default function LinkedIssueTrackerTab({
  boardItems = [],
  manualAvailableCount = 0,
  includeManualEquipMold = false,
  onToggleIncludeManual,
  linkedLoading = false,
  savingCpIds = {},
  onOpenReportModal,
  onOpenEquipmentModal,
  onOpenMoldModal,
  onQuickToggleCheck,
  onSyncMissingChangePoint,
  onOpenQPointModal,
  onJumpToDataRow
}) {
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const [kindFilter, setKindFilter] = useState('ALL'); // 'ALL' | 'equipment' | 'mold'
  const [originFilter, setOriginFilter] = useState('ALL'); // 'ALL' | 'report' | 'tpm' | 'direct'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'IN_PROGRESS' | 'AWAITING_REPAIR' | 'AWAITING_APPROVAL' | 'COMPLETED' | 'UNREGISTERED'
  const [searchKeyword, setSearchKeyword] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [loadingPhotoKey, setLoadingPhotoKey] = useState('');
  const [syncingKey, setSyncingKey] = useState('');

  const handleOpenPhotoPreview = async ({ title, directUrl, photoId }) => {
    if (directUrl) {
      setPreviewPhoto({ title, url: directUrl });
      return;
    }
    if (!photoId) return;
    setLoadingPhotoKey(photoId);
    try {
      const url = await fetchReportDowntimePhoto(photoId);
      if (url) setPreviewPhoto({ title, url });
      else alert('저장된 사진 데이터를 찾을 수 없습니다.');
    } catch {
      alert('사진을 불러오지 못했습니다.');
    } finally {
      setLoadingPhotoKey('');
    }
  };

  const handleTriggerMissingSync = async (boardItem) => {
    if (!onSyncMissingChangePoint || !boardItem?.key) return;
    setSyncingKey(boardItem.key);
    try {
      await onSyncMissingChangePoint(boardItem);
    } finally {
      setSyncingKey('');
    }
  };

  const availableYears = useMemo(() => {
    const years = new Set();
    boardItems.forEach((it) => {
      const y = String(it.date || '').slice(0, 4);
      if (/^\d{4}$/.test(y)) years.add(y);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [boardItems]);

  // 기간·종류·시작유형·검색어 1차 필터 (상단 KPI 및 상태별 카운트 계산 기준)
  const baseFiltered = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    return boardItems.filter((it) => {
      const dateStr = String(it.date || '');
      if (selectedYear !== 'ALL' && dateStr.slice(0, 4) !== selectedYear) return false;
      if (selectedMonth !== 'ALL' && dateStr.slice(5, 7) !== selectedMonth) return false;
      if (kindFilter !== 'ALL' && it.kind !== kindFilter) return false;
      if (originFilter !== 'ALL') {
        if (originFilter === 'direct') {
          if (it.origin !== 'direct' && it.origin !== 'auto_cp' && it.origin !== 'manual_cp') return false;
        } else if (it.origin !== originFilter) {
          return false;
        }
      }
      if (kw) {
        const carText = normalizeCarModelName(it.cp?.carModel || it.report?.carModel || it.repair?.owner?.carModel || '');
        const partText = it.cp?.partName || it.report?.itemName || it.repair?.owner?.partName || '';
        const ownerName = it.repair?.owner?.name || '';
        const ownerCode = it.repair?.owner?.code || it.repair?.owner?.moldNumber || '';
        const reasonText = [
          it.slot?.reason,
          it.repair?.row?.issue,
          it.repair?.row?.action,
          it.repair?.row?.repairDetails?.requestContent,
          it.repair?.row?.repairDetails?.actionContent,
          it.cp?.issueItem,
          it.cp?.details,
          it.cp?.actionResult
        ]
          .filter(Boolean)
          .join(' ');
        const haystack = `${dateStr} ${carText} ${partText} ${ownerName} ${ownerCode} ${reasonText}`.toLowerCase();
        if (!haystack.includes(kw)) return false;
      }
      return true;
    });
  }, [boardItems, selectedYear, selectedMonth, kindFilter, originFilter, searchKeyword]);

  const summary = useMemo(() => {
    let total = baseFiltered.length;
    let equipCount = 0;
    let moldCount = 0;
    let awaitingRepair = 0;
    let repairReceived = 0;
    let repairWorking = 0;
    let awaitingApproval = 0;
    let completed = 0;
    let unregistered = 0;
    let overdueCount = 0;

    baseFiltered.forEach((it) => {
      if (it.kind === 'mold') moldCount += 1;
      else equipCount += 1;

      if (it.stageStatus === 'awaiting_repair') {
        awaitingRepair += 1;
        if (it.repairState === 'working') repairWorking += 1;
        else repairReceived += 1;
      } else if (it.stageStatus === 'awaiting_approval') {
        awaitingApproval += 1;
      } else if (it.stageStatus === 'completed') {
        completed += 1;
      } else {
        unregistered += 1;
      }

      if (it.stageStatus === 'awaiting_repair' || it.stageStatus === 'awaiting_approval') {
        const d = calcElapsedDays(it.date);
        if (d !== null && d > 7) overdueCount += 1;
      }
    });

    const inProgress = awaitingRepair + awaitingApproval;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      equipCount,
      moldCount,
      inProgress,
      awaitingRepair,
      repairReceived,
      repairWorking,
      awaitingApproval,
      completed,
      unregistered,
      overdueCount,
      completionRate
    };
  }, [baseFiltered]);

  // 상태 필터까지 반영한 최종 목록 (미완료 건 우선 정렬 후 최신일자 순)
  const visibleItems = useMemo(() => {
    const list = baseFiltered.filter((it) => {
      if (statusFilter === 'IN_PROGRESS') {
        return it.stageStatus === 'awaiting_repair' || it.stageStatus === 'awaiting_approval';
      }
      if (statusFilter === 'AWAITING_REPAIR') return it.stageStatus === 'awaiting_repair';
      if (statusFilter === 'AWAITING_APPROVAL') return it.stageStatus === 'awaiting_approval';
      if (statusFilter === 'COMPLETED') return it.stageStatus === 'completed';
      if (statusFilter === 'UNREGISTERED') return it.stageStatus === 'unregistered';
      return true;
    });

    const rank = {
      awaiting_repair: 0,
      awaiting_approval: 1,
      unregistered: 2,
      completed: 3
    };

    return [...list].sort((a, b) => {
      if (statusFilter === 'ALL') {
        const diff = (rank[a.stageStatus] ?? 9) - (rank[b.stageStatus] ?? 9);
        if (diff !== 0) return diff;
      }
      return String(b.date || '').localeCompare(String(a.date || ''));
    });
  }, [baseFiltered, statusFilter]);

  const hasActiveFilter =
    selectedYear !== 'ALL' ||
    selectedMonth !== 'ALL' ||
    kindFilter !== 'ALL' ||
    originFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    searchKeyword.trim() !== '';

  const resetFilters = () => {
    setSelectedYear('ALL');
    setSelectedMonth('ALL');
    setKindFilter('ALL');
    setOriginFilter('ALL');
    setStatusFilter('ALL');
    setSearchKeyword('');
  };

  return (
    <div
      data-cp-linked-tracker="1"
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        paddingRight: '2px'
      }}
    >
      {/* 1단: 한눈에 보는 단계별 진행 요약 카드 (클릭 시 즉시 필터) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px'
        }}
      >
        <div
          onClick={() => setStatusFilter('ALL')}
          style={{
            background: statusFilter === 'ALL' ? '#f8fafc' : '#ffffff',
            borderRadius: '12px',
            padding: '14px 16px',
            border: statusFilter === 'ALL' ? '2px solid #2563eb' : '1px solid #e2e8f0',
            borderLeft: '5px solid #2563eb',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>전체 연계 추적 건수</div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: '4px 0' }}>
            {summary.total}
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', marginLeft: '4px' }}>건</span>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569' }}>
            🔧 설비 {summary.equipCount}건 · 🗜️ 금형 {summary.moldCount}건
          </div>
        </div>

        <div
          onClick={() => setStatusFilter((prev) => (prev === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS'))}
          style={{
            background: statusFilter === 'IN_PROGRESS' ? '#fef2f2' : summary.inProgress > 0 ? '#fffafa' : '#ffffff',
            borderRadius: '12px',
            padding: '14px 16px',
            border: statusFilter === 'IN_PROGRESS' ? '2px solid #dc2626' : '1px solid #fecaca',
            borderLeft: '5px solid #dc2626',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#b91c1c' }}>🚨 조치 필요 (진행중)</span>
            {summary.overdueCount > 0 && (
              <span style={{ padding: '2px 7px', borderRadius: '999px', fontSize: '10px', fontWeight: 800, background: '#dc2626', color: '#ffffff' }}>
                D+7 지연 {summary.overdueCount}건
              </span>
            )}
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: summary.inProgress > 0 ? '#dc2626' : '#16a34a', margin: '4px 0' }}>
            {summary.inProgress}
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', marginLeft: '4px' }}>건</span>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#7f1d1d' }}>
            수리 미완료 {summary.awaitingRepair} · 검증/승인 대기 {summary.awaitingApproval}
          </div>
        </div>

        <div
          onClick={() => setStatusFilter((prev) => (prev === 'AWAITING_REPAIR' ? 'ALL' : 'AWAITING_REPAIR'))}
          style={{
            background: statusFilter === 'AWAITING_REPAIR' ? '#fff7ed' : '#ffffff',
            borderRadius: '12px',
            padding: '14px 16px',
            border: statusFilter === 'AWAITING_REPAIR' ? '2px solid #ea580c' : '1px solid #e2e8f0',
            borderLeft: '5px solid #ea580c',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#9a3412' }}>🔧 2단계: 설비·금형 수리 대기</div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: '4px 0' }}>
            {summary.awaitingRepair}
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', marginLeft: '4px' }}>건</span>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
            접수 대기 {summary.repairReceived}건 · 조치중 {summary.repairWorking}건
          </div>
        </div>

        <div
          onClick={() => setStatusFilter((prev) => (prev === 'AWAITING_APPROVAL' ? 'ALL' : 'AWAITING_APPROVAL'))}
          style={{
            background: statusFilter === 'AWAITING_APPROVAL' ? '#f5f3ff' : '#ffffff',
            borderRadius: '12px',
            padding: '14px 16px',
            border: statusFilter === 'AWAITING_APPROVAL' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
            borderLeft: '5px solid #7c3aed',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
            cursor: 'pointer'
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#5b21b6' }}>🔍 3단계: 품질검증·승인 대기</div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', margin: '4px 0' }}>
            {summary.awaitingApproval}
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', marginLeft: '4px' }}>건</span>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
            클릭하여 바로 품질검증·공장장 승인 처리
          </div>
        </div>

        <div
          onClick={() => setStatusFilter((prev) => (prev === 'COMPLETED' ? 'ALL' : 'COMPLETED'))}
          style={{
            background: statusFilter === 'COMPLETED' ? '#ecfdf5' : '#ffffff',
            borderRadius: '12px',
            padding: '14px 16px',
            border: statusFilter === 'COMPLETED' ? '2px solid #10b981' : '1px solid #e2e8f0',
            borderLeft: '5px solid #10b981',
            boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#047857' }}>✅ 전 단계 마감 완료</span>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669' }}>{summary.completionRate}%</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#059669', margin: '4px 0' }}>
            {summary.completed}
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', marginLeft: '4px' }}>건</span>
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
            수리 확인 + 품질 검증 + 승인 완료
          </div>
        </div>
      </div>

      {/* 2단: 통합 필터 & 검색 바 */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '10px 14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
          boxShadow: '0 1px 2px rgba(15,23,42,0.04)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700, background: '#f8fafc', color: '#0f172a' }}
          >
            <option value="ALL">전체 연도</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700, background: '#f8fafc', color: '#0f172a' }}
          >
            <option value="ALL">전체 월</option>
            {Array.from({ length: 12 }, (_, i) => {
              const m = String(i + 1).padStart(2, '0');
              return <option key={m} value={m}>{i + 1}월</option>;
            })}
          </select>

          <select
            value={kindFilter}
            onChange={(e) => setKindFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700, background: '#f8fafc', color: '#0f172a' }}
          >
            <option value="ALL">설비 · 금형 전체</option>
            <option value="equipment">🔧 설비 이상만</option>
            <option value="mold">🗜️ 금형 이상만</option>
          </select>

          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px', fontWeight: 700, background: '#f8fafc', color: '#0f172a' }}
          >
            <option value="ALL">발생 경로 전체</option>
            <option value="report">📋 작업일보 비가동</option>
            <option value="tpm">📝 TPM 점검 이상</option>
            <option value="direct">🛠️ 수리의뢰서 / 직접등록</option>
          </select>

          {/* 상태 칩 */}
          <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', gap: '3px', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: `전체 (${summary.total})` },
              { id: 'IN_PROGRESS', label: `진행중 (${summary.inProgress})` },
              { id: 'AWAITING_REPAIR', label: `수리대기 (${summary.awaitingRepair})` },
              { id: 'AWAITING_APPROVAL', label: `검증·승인대기 (${summary.awaitingApproval})` },
              { id: 'COMPLETED', label: `완료 (${summary.completed})` },
              ...(summary.unregistered > 0 ? [{ id: 'UNREGISTERED', label: `미연동 (${summary.unregistered})` }] : [])
            ].map((chip) => {
              const active = statusFilter === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setStatusFilter(chip.id)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: 800,
                    background: active ? '#1e293b' : 'transparent',
                    color: active ? '#ffffff' : '#475569',
                    cursor: 'pointer'
                  }}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="차종·설비명·코드·금형·사유 검색..."
            style={{
              width: '210px',
              padding: '6px 10px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '12px'
            }}
          />

          {(manualAvailableCount > 0 || includeManualEquipMold) && onToggleIncludeManual && (
            <button
              type="button"
              onClick={onToggleIncludeManual}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: includeManualEquipMold ? '1px solid #2563eb' : '1px solid #cbd5e1',
                background: includeManualEquipMold ? '#eff6ff' : '#ffffff',
                color: includeManualEquipMold ? '#1d4ed8' : '#475569',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              {includeManualEquipMold
                ? '✓ 수동 설비·금형 변동점 포함중'
                : `+ 수동 설비·금형 건 포함 (${manualAvailableCount})`}
            </button>
          )}

          {hasActiveFilter && (
            <button
              type="button"
              onClick={resetFilters}
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
              ✕ 초기화
            </button>
          )}
        </div>
      </div>

      {/* 3단: 원스톱 3단계 파이프라인 진행 보드 */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            padding: '10px 16px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>
              🔗 발생 원인 ➔ 설비·금형 수리 ➔ 변동점 마감 통합 추적 리스트
            </span>
            <span style={{ padding: '2px 9px', borderRadius: '999px', fontSize: '12px', fontWeight: 800, background: '#dbeafe', color: '#1d4ed8' }}>
              조회 {visibleItems.length}건
            </span>
            {linkedLoading && (
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                (설비·금형·일보 연계 데이터 동기화 중...)
              </span>
            )}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
            💡 다른 메뉴로 이동할 필요 없이 각 단계의 버튼을 누르면 이 화면에서 바로 상세 팝업 확인 및 검증·승인 처리가 가능합니다.
          </div>
        </div>

        {/* 컬럼 헤더 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '130px minmax(220px, 1fr) 22px minmax(240px, 1.1fr) 22px minmax(280px, 1.25fr)',
            gap: '8px',
            padding: '8px 16px',
            background: '#f1f5f9',
            borderBottom: '1px solid #cbd5e1',
            fontSize: '11px',
            fontWeight: 800,
            color: '#334155'
          }}
        >
          <div>전체 상태 / 일자</div>
          <div>① 발생 원인 (작업일보 · TPM · 수리접수)</div>
          <div />
          <div>② 설비 · 금형 수리 진행 (이력카드 연동)</div>
          <div />
          <div>③ 변동점 검증 · 승인 · Q-Point 마감</div>
        </div>

        {visibleItems.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
            조건에 해당하는 설비·금형 연계 내역이 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {visibleItems.map((it, idx) => {
              const stageMeta = STAGE_BADGE_MAP[it.stageStatus] || STAGE_BADGE_MAP.unregistered;
              const originChip = ORIGIN_CHIP_STYLE[it.origin] || ORIGIN_CHIP_STYLE.direct;
              const repairChip = REPAIR_CHIP_STYLE[it.repairState] || REPAIR_CHIP_STYLE.none;
              const isInProgress = it.stageStatus === 'awaiting_repair' || it.stageStatus === 'awaiting_approval';
              const days = isInProgress ? calcElapsedDays(it.date) : null;

              const r = it.report;
              const owner = it.repair?.owner || null;
              const rd = it.repair?.row?.repairDetails || {};
              const cp = it.cp;
              const isSavingCp = Boolean(cp?.id && savingCpIds[cp.id]);

              const carLabel = normalizeCarModelName(
                cp?.carModel || r?.carModel || owner?.carModel || ''
              );
              const partLabel = cp?.partName || r?.itemName || owner?.partName || '';
              const ownerTitle = owner
                ? `${owner.name || (it.kind === 'mold' ? '금형' : '설비')}${
                    owner.code || owner.moldNumber ? ` (${owner.code || owner.moldNumber})` : ''
                  }`
                : '';
              const repairSyncKey = it.repair?.row?.autoSyncKey || it.repair?.row?.syncId || '';
              const beforeDirectUrl = it.slot?.photoDataUrl || rd.beforeImage || cp?.qPointData?.beforeImage || '';
              const beforePhotoId = it.slot?.photoId || rd.beforePhotoId || cp?.qPointData?.beforePhotoId || '';
              const afterDirectUrl = rd.afterImage || cp?.qPointData?.afterImage || '';
              const fiveSteps = buildFiveStageSteps(it, cp);
              const isSyncingMissing = syncingKey === it.key;

              return (
                <div
                  key={`${it.origin}_${it.key}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '130px minmax(220px, 1fr) 22px minmax(240px, 1.1fr) 22px minmax(280px, 1.25fr)',
                    gap: '8px',
                    alignItems: 'stretch',
                    padding: '12px 16px',
                    borderTop: idx === 0 ? 'none' : '1px solid #e2e8f0',
                    background: isInProgress ? '#fffdf9' : '#ffffff'
                  }}
                >
                  {/* 5단계 변동점 진행 상태바 */}
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      flexWrap: 'wrap',
                      paddingBottom: '8px',
                      marginBottom: '2px',
                      borderBottom: '1px dashed #e2e8f0'
                    }}
                  >
                    {fiveSteps.map((step, sIdx) => {
                      const pillBg =
                        step.state === 'done'
                          ? '#ecfdf5'
                          : step.state === 'active'
                            ? '#eff6ff'
                            : '#f8fafc';
                      const pillColor =
                        step.state === 'done'
                          ? '#047857'
                          : step.state === 'active'
                            ? '#1d4ed8'
                            : '#94a3b8';
                      const pillBorder =
                        step.state === 'done'
                          ? '#a7f3d0'
                          : step.state === 'active'
                            ? '#93c5fd'
                            : '#e2e8f0';
                      return (
                        <React.Fragment key={step.label}>
                          {sIdx > 0 && (
                            <span style={{ color: '#cbd5e1', fontSize: '11px', fontWeight: 900 }}>›</span>
                          )}
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '10px',
                              fontWeight: 800,
                              background: pillBg,
                              color: pillColor,
                              border: `1px solid ${pillBorder}`
                            }}
                          >
                            <span>{step.state === 'done' ? '✓' : step.state === 'active' ? '●' : '○'}</span>
                            <span>{step.label}</span>
                            <span style={{ fontWeight: 600, opacity: 0.9 }}>({step.sub})</span>
                          </span>
                        </React.Fragment>
                      );
                    })}
                  </div>

                  {/* 좌측 전체 상태 및 일자 */}
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '6px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                      <span
                        style={{
                          padding: '3px 9px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 800,
                          background: stageMeta.bg,
                          color: stageMeta.color,
                          border: `1px solid ${stageMeta.border}`
                        }}
                      >
                        {stageMeta.label}
                      </span>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                        {it.date || '-'}
                      </div>
                      {days !== null && (
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: days > 7 ? '#dc2626' : '#64748b'
                          }}
                        >
                          경과 D+{days}{days > 7 ? ' ⚠️' : ''}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '11px', color: '#475569', fontWeight: 700 }}>
                      <span style={{ color: '#1d4ed8' }}>{carLabel}</span>
                      {partLabel && (
                        <div style={{ fontSize: '10px', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {partLabel}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ① 발생 원인 카드 */}
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      background: '#f8fafc',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '8px',
                      minWidth: 0
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span
                          style={{
                            padding: '2px 7px',
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontWeight: 800,
                            background: originChip.bg,
                            color: originChip.color
                          }}
                        >
                          {ORIGIN_LABEL[it.origin] || '수리 접수'}
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
                          {it.kind === 'mold' ? '🗜️ 금형' : '🔧 설비'}
                        </span>
                      </div>

                      {r ? (
                        <>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                            {r.processName || '공정'} · 비가동 {it.slot?.minutes || 0}분
                            {r.workerName ? ` (${r.workerName})` : ''}
                          </div>
                          <div style={{ fontSize: '11px', color: '#334155', marginTop: '3px', lineHeight: 1.4 }}>
                            {it.slot?.equip ? `[${it.slot.equip}] ` : ''}
                            {it.slot?.reason || '비가동 사유 기록'}
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                            {ownerTitle || cp?.issueItem || '현장 이상/수리 접수'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#334155', marginTop: '3px', lineHeight: 1.4 }}>
                            {rd.requestContent || it.repair?.row?.issue || cp?.details || '-'}
                          </div>
                        </>
                      )}
                    </div>

                    {((r && onOpenReportModal) || beforeDirectUrl || beforePhotoId) && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {r && onOpenReportModal && (
                          <button
                            type="button"
                            onClick={() => onOpenReportModal(r)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: '1px solid #93c5fd',
                              background: '#ffffff',
                              color: '#1d4ed8',
                              fontSize: '11px',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            📄 작업일보 상세 팝업
                          </button>
                        )}
                        {(beforeDirectUrl || beforePhotoId) && (
                          <button
                            type="button"
                            disabled={loadingPhotoKey === beforePhotoId}
                            onClick={() =>
                              handleOpenPhotoPreview({
                                title: `${ownerTitle || '현장'} — 수리전/원인 사진`,
                                directUrl: beforeDirectUrl,
                                photoId: beforePhotoId
                              })
                            }
                            style={{
                              padding: '4px 9px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              color: '#334155',
                              fontSize: '11px',
                              fontWeight: 800,
                              cursor: loadingPhotoKey === beforePhotoId ? 'wait' : 'pointer'
                            }}
                          >
                            {loadingPhotoKey === beforePhotoId ? '로딩...' : '📷 수리전 사진'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ alignSelf: 'center', textAlign: 'center', color: '#94a3b8', fontWeight: 900 }}>
                    ➔
                  </div>

                  {/* ② 설비·금형 수리 진행 카드 */}
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: it.stageStatus === 'awaiting_repair' ? '1.5px solid #fca5a5' : '1px solid #e2e8f0',
                      background: it.stageStatus === 'awaiting_repair' ? '#fffafa' : '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '8px',
                      minWidth: 0
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {ownerTitle || '대상 설비/금형 미특정'}
                        </span>
                        <span
                          style={{
                            padding: '2px 7px',
                            borderRadius: '999px',
                            fontSize: '10px',
                            fontWeight: 800,
                            background: repairChip.bg,
                            color: repairChip.color,
                            border: `1px solid ${repairChip.border}`,
                            flexShrink: 0
                          }}
                        >
                          {it.hasRepairRow
                            ? REPAIR_STATE_LABEL[it.repairState]
                            : owner
                              ? '이력카드 연결됨'
                              : '수리 미등록'}
                        </span>
                      </div>

                      {it.hasRepairRow ? (
                        <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.4 }}>
                          <div>
                            <strong>조치:</strong>{' '}
                            {rd.actionContent || it.repair?.row?.action || '수리의뢰서 접수 (현장 조치 대기)'}
                          </div>
                          {(rd.pic || rd.completionDate) && (
                            <div style={{ color: '#64748b', marginTop: '2px' }}>
                              {rd.pic ? `담당: ${rd.pic}` : ''}
                              {rd.pic && rd.completionDate ? ' · ' : ''}
                              {rd.completionDate ? `완료일: ${rd.completionDate}` : ''}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                          {owner
                            ? '설비/금형 이력카드에서 상세 수리 내역을 열람하거나 추가할 수 있습니다.'
                            : '자동 매칭된 설비/금형 이력이 없습니다.'}
                        </div>
                      )}
                    </div>

                    {(owner || afterDirectUrl) && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {owner && it.hasRepairRow ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                const opts = { autoSyncKey: repairSyncKey, openRepair: true };
                                if (it.kind === 'mold') onOpenMoldModal?.(owner, opts);
                                else onOpenEquipmentModal?.(owner, opts);
                              }}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '6px',
                                border: it.repairState !== 'done' ? '1px solid #ef4444' : '1px solid #86efac',
                                background: it.repairState !== 'done' ? '#fef2f2' : '#f0fdf4',
                                color: it.repairState !== 'done' ? '#b91c1c' : '#15803d',
                                fontSize: '11px',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              {it.repairState !== 'done' ? '🔧 수리 처리 / 완료하기' : '🔧 수리의뢰서 보기'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const opts = { autoSyncKey: repairSyncKey, openRepair: false };
                                if (it.kind === 'mold') onOpenMoldModal?.(owner, opts);
                                else onOpenEquipmentModal?.(owner, opts);
                              }}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                background: '#f8fafc',
                                color: '#334155',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              📋 이력카드
                            </button>
                          </>
                        ) : owner ? (
                          <button
                            type="button"
                            onClick={() => {
                              const opts = { autoSyncKey: '', openRepair: false };
                              if (it.kind === 'mold') onOpenMoldModal?.(owner, opts);
                              else onOpenEquipmentModal?.(owner, opts);
                            }}
                            style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              background: '#f8fafc',
                              color: '#0f172a',
                              fontSize: '11px',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            {it.kind === 'mold' ? '🗜️ 금형 이력카드 열기' : '🔧 설비 이력카드 열기'}
                          </button>
                        ) : null}

                        {afterDirectUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenPhotoPreview({
                                title: `${ownerTitle || '현장'} — 수리후 조치 사진`,
                                directUrl: afterDirectUrl
                              })
                            }
                            style={{
                              padding: '4px 9px',
                              borderRadius: '6px',
                              border: '1px solid #86efac',
                              background: '#f0fdf4',
                              color: '#15803d',
                              fontSize: '11px',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            📷 수리후 사진
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ alignSelf: 'center', textAlign: 'center', color: '#94a3b8', fontWeight: 900 }}>
                    ➔
                  </div>

                  {/* ③ 변동점 마감 (인플레이스 즉시 검증·승인·Q-Point) */}
                  <div
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: it.stageStatus === 'awaiting_approval' ? '1.5px solid #fcd34d' : '1px solid #e2e8f0',
                      background: it.stageStatus === 'awaiting_approval' ? '#fffef7' : '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '8px',
                      minWidth: 0
                    }}
                  >
                    {cp ? (
                      <>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>
                              [{cp.type || '변동점'}] {cp.issueItem || '설비/금형 변동'}
                            </span>
                            {it.qPointDone && (
                              <span style={{ padding: '1px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, background: '#dcfce7', color: '#15803d' }}>
                                Q-Point 설치
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '11px', color: '#334155', lineHeight: 1.4 }}>
                            {cp.actionResult || cp.details || '-'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              disabled={isSavingCp}
                              onClick={() => {
                                if (
                                  !it.qcDone &&
                                  it.hasRepairRow &&
                                  it.repairState !== 'done' &&
                                  !window.confirm(
                                    '아직 ② 설비·금형 수리 상태가 [수리완료]로 저장되지 않았습니다.\n먼저 수리완료 처리를 하지 않고 품질검증을 진행하시겠습니까?'
                                  )
                                ) {
                                  return;
                                }
                                onQuickToggleCheck?.(cp, 'qualityCheck', !it.qcDone);
                              }}
                              title="클릭하여 품질 검증 완료/취소 즉시 전환"
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: it.qcDone ? '1px solid #16a34a' : '1px solid #fca5a5',
                                background: it.qcDone ? '#dcfce7' : '#fef2f2',
                                color: it.qcDone ? '#15803d' : '#b91c1c',
                                fontSize: '11px',
                                fontWeight: 800,
                                cursor: isSavingCp ? 'wait' : 'pointer'
                              }}
                            >
                              {it.qcDone ? '✓ 품질검증 완료' : '품질검증 하기'}
                            </button>

                            <button
                              type="button"
                              disabled={isSavingCp}
                              onClick={() => {
                                if (
                                  !it.ceoDone &&
                                  !it.qcDone &&
                                  !window.confirm(
                                    '③ 품질검증이 아직 완료되지 않았습니다.\n품질검증 전에 대표이사 최종승인을 진행하시겠습니까?'
                                  )
                                ) {
                                  return;
                                }
                                onQuickToggleCheck?.(cp, 'ceoCheck', !it.ceoDone);
                              }}
                              title="클릭하여 대표이사(공장장) 승인 완료/취소 즉시 전환"
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: it.ceoDone ? '1px solid #2563eb' : '1px solid #fcd34d',
                                background: it.ceoDone ? '#dbeafe' : '#fffbeb',
                                color: it.ceoDone ? '#1d4ed8' : '#b45309',
                                fontSize: '11px',
                                fontWeight: 800,
                                cursor: isSavingCp ? 'wait' : 'pointer'
                              }}
                            >
                              {it.ceoDone ? '✓ 승인 완료' : '승인 확인'}
                            </button>

                            {onOpenQPointModal && (
                              <button
                                type="button"
                                onClick={() => onOpenQPointModal(cp)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  border: it.qPointDone ? '1px solid #86efac' : '1px solid #cbd5e1',
                                  background: it.qPointDone ? '#f0fdf4' : '#ffffff',
                                  color: it.qPointDone ? '#15803d' : '#334155',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                {it.qPointDone ? '📝 Q-Point 수정' : '📝 Q-Point 작성'}
                              </button>
                            )}
                          </div>

                          {onJumpToDataRow && (
                            <button
                              type="button"
                              onClick={() => onJumpToDataRow(cp.id)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: 'none',
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                fontSize: '11px',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              표 편집 →
                            </button>
                          )}
                        </div>
                      </>
                    ) : it.hasRepairRow && owner && onSyncMissingChangePoint ? (
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '8px', height: '100%' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.4 }}>
                          연결된 변동점 문서가 아직 없습니다. 수리 이력을 바탕으로 변동점 문서를 즉시 생성할 수 있습니다.
                        </div>
                        <div>
                          <button
                            type="button"
                            disabled={isSyncingMissing}
                            onClick={() => handleTriggerMissingSync(it)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: '1px solid #6366f1',
                              background: '#eef2ff',
                              color: '#4338ca',
                              fontSize: '11px',
                              fontWeight: 800,
                              cursor: isSyncingMissing ? 'wait' : 'pointer'
                            }}
                          >
                            {isSyncingMissing ? '생성 중...' : '⚡ 변동점 즉시 연동 생성'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', height: '100%' }}>
                        연결된 변동점 문서가 없습니다. (수리의뢰서 저장 시 자동 생성됩니다)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.72)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              padding: '16px',
              maxWidth: '720px',
              width: '100%',
              boxShadow: '0 20px 50px rgba(0,0,0,0.35)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <strong style={{ fontSize: '14px', color: '#0f172a' }}>{previewPhoto.title}</strong>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
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
            <img
              src={previewPhoto.url}
              alt={previewPhoto.title}
              style={{ width: '100%', maxHeight: '72vh', objectFit: 'contain', borderRadius: '8px', background: '#f8fafc' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
