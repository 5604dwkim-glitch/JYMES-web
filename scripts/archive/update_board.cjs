const fs = require('fs');
let code = fs.readFileSync('src/components/ReportList.jsx', 'utf8');

const newBoardLogic = `
      {viewMode === 'board' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '16px', padding: '16px', backgroundColor: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          {allWorkers.map(w => {
            const userReports = filteredReports.filter(r => r.workerName === w.name);
            const hasSubmitted = userReports.some(r => r.status !== '임시저장');
            const hasDraft = userReports.some(r => r.status === '임시저장');
            const draft = hasDraft ? userReports.find(r => r.status === '임시저장') : null;
            
            let hasLotCho = false, hasDimCho = false;
            let hasLotJung = false, hasDimJung = false;
            let hasLotJong = false, hasDimJong = false;

            if (draft) {
              hasLotCho = draft.materialLots && Object.entries(draft.materialLots).some(([k, v]) => k.includes('초물') && v && String(v).trim() !== '');
              hasDimCho = draft.dimData && Object.entries(draft.dimData).some(([k, v]) => k.includes('초') && v && String(v).trim() !== '');
              hasLotJung = draft.materialLots && Object.entries(draft.materialLots).some(([k, v]) => k.includes('중물') && v && String(v).trim() !== '');
              hasDimJung = draft.dimData && Object.entries(draft.dimData).some(([k, v]) => k.includes('중') && v && String(v).trim() !== '');
              hasLotJong = draft.materialLots && Object.entries(draft.materialLots).some(([k, v]) => k.includes('종물') && v && String(v).trim() !== '');
              hasDimJong = draft.dimData && Object.entries(draft.dimData).some(([k, v]) => k.includes('종') && v && String(v).trim() !== '');
            }

            return (
              <div 
                key={w.id} 
                onClick={() => { setSearchQuery(w.name); setViewMode('list'); }}
                style={{ 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '12px', 
                  padding: '16px', 
                  textAlign: 'center', 
                  backgroundColor: hasSubmitted ? '#f0fdf4' : (hasDraft ? '#f8fafc' : '#fef2f2'), 
                  cursor: 'pointer', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{ fontSize: '28px' }}>{hasSubmitted ? '✅' : (hasDraft ? '📝' : '❌')}</div>
                <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#334155' }}>{w.name}</div>
                <div style={{ fontSize: '12px', color: hasSubmitted ? '#166534' : (hasDraft ? '#0369a1' : '#991b1b'), fontWeight: '700' }}>
                  {hasSubmitted ? '제출 완료' : (hasDraft ? '작성 중 (임시저장)' : '미제출')}
                </div>

                {!hasSubmitted && hasDraft && (
                  <div style={{ fontSize: '11px', textAlign: 'left', background: '#fff', padding: '8px', borderRadius: '6px', width: '100%', marginTop: '4px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ color: hasLotCho ? '#15803d' : '#94a3b8', fontWeight: hasLotCho ? 'bold' : 'normal' }}>
                      {hasLotCho ? '✅' : '⏳'} 소재 LOT (초물)
                    </div>
                    <div style={{ color: hasDimCho ? '#15803d' : '#94a3b8', fontWeight: hasDimCho ? 'bold' : 'normal' }}>
                      {hasDimCho ? '✅' : '⏳'} 치수검사 (초물)
                    </div>
                    
                    {(hasLotJung || hasDimJung) && (
                      <>
                        <div style={{ borderTop: '1px dashed #e2e8f0', margin: '2px 0' }}></div>
                        <div style={{ color: hasLotJung ? '#15803d' : '#94a3b8', fontWeight: hasLotJung ? 'bold' : 'normal' }}>
                          {hasLotJung ? '✅' : '⏳'} 소재 LOT (중물)
                        </div>
                        <div style={{ color: hasDimJung ? '#15803d' : '#94a3b8', fontWeight: hasDimJung ? 'bold' : 'normal' }}>
                          {hasDimJung ? '✅' : '⏳'} 치수검사 (중물)
                        </div>
                      </>
                    )}

                    {(hasLotJong || hasDimJong) && (
                      <>
                        <div style={{ borderTop: '1px dashed #e2e8f0', margin: '2px 0' }}></div>
                        <div style={{ color: hasLotJong ? '#15803d' : '#94a3b8', fontWeight: hasLotJong ? 'bold' : 'normal' }}>
                          {hasLotJong ? '✅' : '⏳'} 소재 LOT (종물)
                        </div>
                        <div style={{ color: hasDimJong ? '#15803d' : '#94a3b8', fontWeight: hasDimJong ? 'bold' : 'normal' }}>
                          {hasDimJong ? '✅' : '⏳'} 치수검사 (종물)
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (`

const regex = /\{viewMode === 'board' \? \([\s\S]*?\) : \(/;
code = code.replace(regex, newBoardLogic);

fs.writeFileSync('src/components/ReportList.jsx', code);
