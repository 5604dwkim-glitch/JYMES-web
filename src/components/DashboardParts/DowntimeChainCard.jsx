import React, { useMemo, useState, useEffect, Suspense, lazy } from 'react';
import { buildLinkedChains, REPAIR_STATE_LABEL, CP_STATE_LABEL, ORIGIN_LABEL } from '../../services/downtimeChain';
import { getEquipmentCategory } from '../../constants/equipmentCategories';

// 일보 상세 모달은 용량이 커서 클릭 시점에만 불러온다 (대시보드 초기 로딩 영향 없음)
const LegacyDetailModal = lazy(() => import('../DynamicForms/LegacyDetailModal'));

const STATE_STYLE = {
  done: { bg: '#ecfdf5', color: '#047857' },
  working: { bg: '#fffbeb', color: '#b45309' },
  received: { bg: '#fef2f2', color: '#b91c1c' },
  pending: { bg: '#fef2f2', color: '#b91c1c' },
  none: { bg: '#f1f5f9', color: '#94a3b8' }
};

const OVERALL_LABEL = { done: '완료', progress: '진행중', unregistered: '미연동' };
const OVERALL_STYLE = {
  done: { bg: '#ecfdf5', color: '#047857' },
  progress: { bg: '#fef2f2', color: '#b91c1c' },
  unregistered: { bg: '#f1f5f9', color: '#64748b' }
};

const KIND_LABEL = { equipment: '설비', mold: '금형' };

// 시작 유형별 ① 칸 배지 색상
const ORIGIN_STYLE = {
  report: { bg: '#eff6ff', color: '#1d4ed8' },
  tpm: { bg: '#f0fdf4', color: '#15803d' },
  direct: { bg: '#fff7ed', color: '#c2410c' }
};

const LOOKBACK_DAYS = 60;

function elapsedDays(dateStr) {
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
}

function Chip({ state, children }) {
  const s = STATE_STYLE[state] || STATE_STYLE.none;
  return (
    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

// 단계 칸: 클릭 가능한 버튼(이동 대상이 있을 때) 또는 비활성 칸(미등록·이동 대상 없음)
function StageBox({ onClick, disabled, title, background, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      data-chain-stage="1"
      style={{
        textAlign: 'left',
        width: '100%',
        minWidth: 0,
        padding: '8px 10px',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        background: background || (disabled ? '#f8fafc' : '#ffffff'),
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'inherit',
        color: 'inherit'
      }}
    >
      {children}
    </button>
  );
}

const ellipsis = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };

export default function DowntimeChainCard({
  reports,
  equipments,
  molds,
  changePoints,
  navigate,
  initialExpanded = false
}) {
  const [expanded, setExpanded] = useState(initialExpanded);
  const [filter, setFilter] = useState('all'); // all | progress | done | unregistered
  const [originFilter, setOriginFilter] = useState('all'); // all | report | tpm | direct
  const [openReport, setOpenReport] = useState(null);

  useEffect(() => {
    if (initialExpanded) setExpanded(true);
  }, [initialExpanded]);

  const allChains = useMemo(() => {
    const sinceDate = new Date(Date.now() - LOOKBACK_DAYS * 86400000).toLocaleDateString('sv-SE');
    return buildLinkedChains({ reports, equipments, molds, changePoints, sinceDate });
  }, [reports, equipments, molds, changePoints]);

  // 시작 유형 필터를 먼저 적용하고, 그 결과를 기준으로 상태별 건수를 계산한다
  const chains = useMemo(
    () => allChains.filter((c) => originFilter === 'all' || c.origin === originFilter),
    [allChains, originFilter]
  );

  const originCounts = useMemo(() => ({
    all: allChains.length,
    report: allChains.filter((c) => c.origin === 'report').length,
    tpm: allChains.filter((c) => c.origin === 'tpm').length,
    direct: allChains.filter((c) => c.origin === 'direct').length
  }), [allChains]);

  const summaryCounts = useMemo(() => {
    let progress = 0;
    let overdue = 0;
    let done = 0;
    let unregistered = 0;
    allChains.forEach((c) => {
      if (c.overall === 'progress') {
        progress += 1;
        const d = elapsedDays(c.date);
        if (d !== null && d > 7) overdue += 1;
      } else if (c.overall === 'done') {
        done += 1;
      } else {
        unregistered += 1;
      }
    });
    return { progress, overdue, done, unregistered, total: allChains.length };
  }, [allChains]);

  const counts = useMemo(() => ({
    all: chains.length,
    progress: chains.filter((c) => c.overall === 'progress').length,
    done: chains.filter((c) => c.overall === 'done').length,
    unregistered: chains.filter((c) => c.overall === 'unregistered').length
  }), [chains]);

  const visible = useMemo(() => {
    const order = { progress: 0, done: 1, unregistered: 2 };
    if (!expanded) {
      // 메인 대시보드 기본 요약 모드: 진행중 건을 먼저 최대 4건 노출 (진행중이 0건이면 최근 완료 3건 표시)
      const inProgress = allChains
        .filter((c) => c.overall === 'progress')
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      if (inProgress.length > 0) return inProgress.slice(0, 4);
      return allChains
        .filter((c) => c.overall === 'done')
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
        .slice(0, 3);
    }

    const list = chains
      .filter((c) => filter === 'all' || c.overall === filter)
      .sort((a, b) => order[a.overall] - order[b.overall] || (b.date || '').localeCompare(a.date || ''));
    return list.slice(0, 30);
  }, [allChains, chains, expanded, filter]);

  const goRepair = (chain) => {
    if (!chain.repair) return;
    const { kind, owner, row } = chain.repair;
    const autoSyncKey = row?.autoSyncKey || chain.key;
    if (kind === 'equipment') {
      const cat = getEquipmentCategory(owner);
      navigate(`/equipment/${cat}`, { state: { openHistory: { equipmentId: owner.id, autoSyncKey } } });
    } else {
      navigate('/mold', { state: { openHistory: { moldId: owner.id, autoSyncKey } } });
    }
  };

  const goChangePoint = (chain) => {
    if (!chain.cp) return;
    navigate('/change-point', { state: { focusChangePointId: chain.cp.id } });
  };

  const filterBtn = (key, label) => (
    <button
      type="button"
      onClick={() => setFilter(key)}
      className="btn btn-sm"
      style={{
        padding: '4px 10px',
        fontSize: '12px',
        fontWeight: 700,
        borderRadius: '14px',
        border: '1px solid ' + (filter === key ? '#2563eb' : '#cbd5e1'),
        background: filter === key ? '#2563eb' : '#ffffff',
        color: filter === key ? '#ffffff' : '#475569'
      }}
    >
      {label} {counts[key]}
    </button>
  );

  return (
    <div className="card" style={{ margin: 0, height: '100%', display: 'flex', flexDirection: 'column' }} data-dashboard-card="downtime-chain">
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h3 className="card-title" style={{ margin: 0, fontSize: '15px' }}>
            {expanded
              ? '🔗 발생(비가동 일보·수리 의뢰) → 수리 진행 → 변동점 연계 현황'
              : '🚨 조치 필요 · 발생 → 수리 진행 → 변동점 연계'}
          </h3>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
            {expanded
              ? `최근 ${LOOKBACK_DAYS}일 · 비가동 일보 없이 설비/금형 수리 의뢰나 TPM 이상으로 시작된 건도 포함 · 각 칸을 누르면 해당 내용으로 이동`
              : '진행중 건 우선 표시 · 각 칸을 누르면 일보 / 설비·금형 이력카드 / 변동점 기록으로 이동'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '12px', background: '#fef2f2', color: '#b91c1c' }}>
            진행중 {summaryCounts.progress}
          </span>
          {summaryCounts.overdue > 0 && (
            <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '12px', background: '#b91c1c', color: '#ffffff' }}>
              D+7 초과 {summaryCounts.overdue}
            </span>
          )}
          <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '12px', background: '#ecfdf5', color: '#047857' }}>
            완료 {summaryCounts.done}
          </span>
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            style={{
              marginLeft: '4px',
              background: 'none',
              border: 'none',
              padding: '2px 4px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#2563eb',
              cursor: 'pointer'
            }}
          >
            {expanded ? '간략히 보기 ▲' : `요약 펼치기 (${summaryCounts.total}) ▼`}
          </button>
          <button
            type="button"
            onClick={() => navigate('/change-point', { state: { initialTab: 'linked' } })}
            style={{
              padding: '4px 10px',
              borderRadius: '8px',
              border: '1px solid #93c5fd',
              background: '#eff6ff',
              color: '#1d4ed8',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            🔗 전체 연계 관리 →
          </button>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: '10px 16px 0', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="form-control"
            aria-label="시작 유형 필터"
            style={{ height: '28px', fontSize: '12px', padding: '0 8px', width: 'auto' }}
          >
            <option value="all">시작 유형 전체 ({originCounts.all})</option>
            <option value="report">비가동 일보 ({originCounts.report})</option>
            <option value="direct">수리 의뢰 직접 등록 ({originCounts.direct})</option>
            <option value="tpm">TPM 점검 이상 ({originCounts.tpm})</option>
          </select>
          {filterBtn('all', '전체')}
          {filterBtn('progress', '진행중')}
          {filterBtn('done', '완료')}
          {counts.unregistered > 0 && filterBtn('unregistered', '미연동')}
        </div>
      )}

      <div style={{ padding: '12px 16px', flex: 1 }}>
        {!expanded && summaryCounts.progress === 0 && summaryCounts.total > 0 && (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', fontSize: '12px', fontWeight: 700, padding: '7px 12px', borderRadius: '8px', marginBottom: '8px' }}>
            ✅ 현재 미완료(진행중) 조치 건이 없습니다 — 최근 완료 내역을 표시합니다.
          </div>
        )}

        {visible.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 0', fontSize: '13px' }}>
            {chains.length === 0 ? `최근 ${LOOKBACK_DAYS}일간 연계된 비가동·수리 의뢰 내역이 없습니다.` : '해당 조건의 내역이 없습니다.'}
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr 16px 1fr 16px 1fr', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#64748b', padding: '0 0 6px' }}>
              <span>상태</span><span>① 발생 (비가동 / 수리 의뢰)</span><span /><span>② 수리 진행</span><span /><span>③ 변동점</span>
            </div>
            {visible.map((c, idx) => {
              const r = c.report;
              const days = c.overall === 'progress' ? elapsedDays(c.date) : null;
              const ov = OVERALL_STYLE[c.overall];
              const os = ORIGIN_STYLE[c.origin];
              const repairName = c.repair
                ? `${c.repair.owner.name || KIND_LABEL[c.repair.kind]}${c.repair.owner.code ? ` (${c.repair.owner.code})` : ''}`
                : '';
              const cpTitle = c.cp ? `${c.cp.issueItem || c.cp.type || '변동점'}` : '';
              const rd = c.repair?.row?.repairDetails || {};
              const requestText = rd.requestContent || c.repair?.row?.issue || '';
              return (
                <div
                  key={`${c.origin}_${c.key}`}
                  data-chain-row={c.key}
                  data-chain-origin={c.origin}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '64px 1fr 16px 1fr 16px 1fr',
                    gap: '6px',
                    alignItems: 'stretch',
                    padding: '6px 0',
                    borderTop: idx === 0 ? 'none' : '1px solid #f1f5f9'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '3px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: ov.bg, color: ov.color }}>
                      {OVERALL_LABEL[c.overall]}
                    </span>
                    {days !== null && <span style={{ fontSize: '10px', fontWeight: 700, color: days > 7 ? '#b91c1c' : '#94a3b8' }}>D+{days}</span>}
                  </div>

                  {r ? (
                    <StageBox onClick={() => setOpenReport(r)} title="작업일보 상세 내용 보기">
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', ...ellipsis }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '8px', marginRight: '6px', background: os.bg, color: os.color }}>
                          {ORIGIN_LABEL.report}
                        </span>
                        {r.carModel || '-'} · {r.processName || '-'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', ...ellipsis }}>
                        {r.date} · {r.workerName || '-'} · {KIND_LABEL[c.kind]} {c.slot.minutes}분{c.slot.reason ? ` · ${c.slot.reason}` : ''}
                      </div>
                    </StageBox>
                  ) : (
                    <StageBox disabled background="#fafaf9" title="작업일보 없이 수리 의뢰에서 시작된 건입니다">
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', ...ellipsis }}>
                        <span style={{ fontSize: '10px', fontWeight: 800, padding: '1px 6px', borderRadius: '8px', marginRight: '6px', background: os.bg, color: os.color }}>
                          {ORIGIN_LABEL[c.origin]}
                        </span>
                        비가동 일보 없음
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', ...ellipsis }}>
                        {c.date} · {rd.pic || '-'}{requestText ? ` · ${requestText}` : ''}
                      </div>
                    </StageBox>
                  )}

                  <span style={{ alignSelf: 'center', color: '#94a3b8', textAlign: 'center' }}>→</span>

                  {c.repair ? (
                    <StageBox onClick={() => goRepair(c)} title={`${KIND_LABEL[c.repair.kind]} 이력카드(수리 의뢰 목록)로 이동`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', ...ellipsis }}>
                          {KIND_LABEL[c.repair.kind]} · {repairName}
                        </span>
                        <Chip state={c.repairState}>{REPAIR_STATE_LABEL[c.repairState]}</Chip>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', ...ellipsis }}>
                        {rd.actionContent || c.repair.row.action || '수리 의뢰서 접수'}
                      </div>
                    </StageBox>
                  ) : (
                    <StageBox disabled title="자동 등록된 수리 의뢰가 없습니다 (대상 설비/금형을 특정하지 못한 경우)">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>수리 의뢰 미등록</span>
                        <Chip state="none">{REPAIR_STATE_LABEL.none}</Chip>
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>대상 설비/금형 미특정</div>
                    </StageBox>
                  )}

                  <span style={{ alignSelf: 'center', color: '#94a3b8', textAlign: 'center' }}>→</span>

                  {c.cp ? (
                    <StageBox onClick={() => goChangePoint(c)} title="변동점 관리에서 해당 기록 보기">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#1e293b', ...ellipsis }}>
                          {c.cp.type || '변동점'} · {cpTitle}
                        </span>
                        <Chip state={c.cpState}>{CP_STATE_LABEL[c.cpState]}</Chip>
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', ...ellipsis }}>
                        {c.cp.qPointInstall ? 'Q.POINT 설치 · ' : ''}{c.cp.actionResult || c.cp.details || ''}
                      </div>
                    </StageBox>
                  ) : (
                    <StageBox disabled title="자동 등록된 변동점이 없습니다">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>변동점 미등록</span>
                        <Chip state="none">{CP_STATE_LABEL.none}</Chip>
                      </div>
                    </StageBox>
                  )}
                </div>
              );
            })}

            {!expanded && summaryCounts.progress > 4 && (
              <div style={{ textAlign: 'center', paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setExpanded(true)}
                  style={{ background: 'none', border: 'none', fontSize: '12px', fontWeight: 700, color: '#2563eb', cursor: 'pointer' }}
                >
                  진행중 외 {summaryCounts.progress - 4}건 더보기 ▼
                </button>
              </div>
            )}

            {expanded && chains.length > 30 && filter === 'all' && (
              <div style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', paddingTop: '8px' }}>
                최신 30건만 표시됩니다 (전체 {chains.length}건)
              </div>
            )}
          </>
        )}
      </div>

      {openReport && (
        <Suspense fallback={null}>
          <LegacyDetailModal report={openReport} onClose={() => setOpenReport(null)} />
        </Suspense>
      )}
    </div>
  );
}
