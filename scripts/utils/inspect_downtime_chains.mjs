/**
 * inspect_downtime_chains.mjs (읽기 전용 점검 도구)
 * 대시보드 "비가동 → 수리 의뢰 → 변동점 연계 현황"이 실제 DB 데이터로 어떻게 조립되는지 콘솔에 출력한다.
 * 사용: node scripts/utils/inspect_downtime_chains.mjs
 */
import { createServer } from 'vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const server = await createServer({
  root: ROOT,
  logLevel: 'silent',
  server: { middlewareMode: true, hmr: false, watch: null },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] }
});

try {
  const fs = await server.ssrLoadModule('/src/services/firestore.js');
  const chain = await server.ssrLoadModule('/src/services/downtimeChain.js');

  const since = new Date(Date.now() - 60 * 86400000).toLocaleDateString('sv-SE');
  const [reports, equipments, molds, changePoints] = await Promise.all([
    fs.fetchDowntimeReports(since),
    fs.fetchEquipments(),
    fs.fetchMolds(),
    fs.fetchChangePoints(true)
  ]);
  console.log(`비가동 일보 ${reports.length}건 / 설비 ${equipments.length} / 금형 ${molds.length} / 변동점 ${changePoints.length}`);
  reports.forEach(r => console.log(' -', r.id, r.date, r.status, `총 ${r.downtimeMinutes}분`,
    `1:${r.downtimeMinutes1 ?? '-'}/${r.downtimeReason1 ?? '-'} 2:${r.downtimeMinutes2 ?? '-'}/${r.downtimeReason2 ?? '-'} 3:${r.downtimeMinutes3 ?? '-'}/${r.downtimeReason3 ?? '-'}`));

  const chains = chain.buildLinkedChains({ reports, equipments, molds, changePoints, sinceDate: since });
  const byOrigin = chains.reduce((m, c) => ({ ...m, [c.origin]: (m[c.origin] || 0) + 1 }), {});
  console.log(`\n연계 목록 ${chains.length}건`, JSON.stringify(byOrigin));
  chains.forEach(c => console.log(
    `[${c.overall}] (${c.origin}) ${c.report ? `${c.report.id} s${c.slot.slotNum} ${c.slot.minutes}분 "${c.slot.reason}"` : `${c.date} ${c.kind} 직접의뢰`}`,
    '| 수리:', c.repair ? `${c.repair.kind}/${c.repair.owner.name}(${c.repair.owner.code || ''}) ${c.repairState}` : '미등록',
    '| 변동점:', c.cp ? `${c.cp.id} ${c.cpState}` : '미등록'
  ));
} finally {
  await server.close();
  process.exit(0);
}
