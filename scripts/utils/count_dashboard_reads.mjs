/**
 * count_dashboard_reads.mjs (읽기 전용 점검 도구)
 * 메인 대시보드 1회 로딩 시 Firestore 문서 읽기 횟수를 컬렉션 문서 수로 추정한다.
 * (getCountFromServer 집계 쿼리는 인덱스 항목 1,000개당 읽기 1회로 계산되어 비용이 거의 없다)
 */
import { db } from '../../src/firebase.js';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';

const count = async (q) => (await getCountFromServer(q)).data().count;

const n = {
  daily_stats: await count(collection(db, 'daily_stats')),
  equipments: await count(collection(db, 'equipments')),
  molds: await count(collection(db, 'molds')),
  changePoints: await count(collection(db, 'changePoints')),
  reports_all: await count(collection(db, 'reports')),
  reports_downtime: await count(query(collection(db, 'reports'), where('downtimeMinutes', '>', 0))),
  equipment_sets: await count(collection(db, 'equipment_sets')),
  workers: await count(collection(db, 'workers'))
};
console.log('컬렉션별 문서 수:', JSON.stringify(n));

const cp = Math.min(n.changePoints, 200); // fetchChangePoints 는 limit(200)
const first = {
  '일일 통계(daily_stats 전체)': n.daily_stats,
  '설비(equipments 전체, 60분 캐시)': n.equipments,
  '금형(molds 전체, 60분 캐시)': n.molds,
  '변동점(최신 200건, 30분 캐시)': cp,
  '비가동 일보(downtimeMinutes>0 전체, 캐시 없음)': n.reports_downtime
};
let total = 0;
console.log('\n[대시보드 최초 로딩 1회]');
for (const [k, v] of Object.entries(first)) { console.log(`  ${k}: ${v}`); total += v; }
console.log(`  합계: ${total}회`);

const cached = n.daily_stats + n.reports_downtime;
console.log(`\n[캐시가 살아있을 때 재방문(SPA 이동) 1회] 약 ${cached}회 (daily_stats + 비가동 일보는 캐시 없음)`);
console.log(`[새로고침 버튼(강제 갱신) 1회] 약 ${total}회`);
console.log('\n무료 한도(Spark 기준 일 50,000회) 대비:');
console.log(`  최초 로딩 1회 = ${(total / 500).toFixed(1)}%, 관리자 하루 20회 접속 시 약 ${total * 20}회(${(total * 20 / 500).toFixed(1)}%)`);
process.exit(0);
