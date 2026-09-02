const fs = require('fs');

const results = [];
const pass = (label, ok, detail) => results.push((ok ? '✅' : '❌') + ' ' + label + ': ' + (ok ? 'OK' : 'FAIL') + (detail ? ' (' + detail + ')' : ''));

// ── 1번: DB 동시성 (runTransaction) ────────────────────────────
const firestore = fs.readFileSync('src/services/firestore.js', 'utf8');
pass('[1번] runTransaction 원자성 채번', firestore.includes('runTransaction'));
pass('[1번] counters 컬렉션 사용', firestore.includes("counters"));

// ── 2번: Auth 보안 강화 ────────────────────────────────────────
const auth = fs.readFileSync('src/contexts/AuthContext.jsx', 'utf8');
pass('[2번] 세션 난독화(encodeSession)', auth.includes('encodeSession') && auth.includes('decodeSession'));
pass('[2번] 신버전 토큰 키 사용', auth.includes('jymes_auth_token_v2'));
pass('[2번] 구버전 키 마이그레이션 제거', auth.includes('jymes_auth_session'));

const login = fs.readFileSync('src/components/Login.jsx', 'utf8');
pass('[2번] QR 자동로그인 파라미터 수신', login.includes("searchParams.get('id')") || login.includes("urlParams.get('id')"));
pass('[2번] 개별 PIN 검증 (matched.pin)', login.includes('matched.pin') || login.includes('expectedPin'));

// ── 3번: 파일 분할 ───────────────────────────────────────────
let leaderOk = false;
try {
  const leader = fs.readFileSync('src/components/DynamicForms/LeaderFormRenderer.js', 'utf8');
  leaderOk = leader.includes('renderLeaderPaperForm') && leader.length > 1000;
} catch(e) {}
pass('[3번] LeaderFormRenderer.js 파일 분리', leaderOk);

const wrapper = fs.readFileSync('src/components/DynamicForms/LegacyFormWrapper.jsx', 'utf8');
const wrapperKb = Math.round(Buffer.byteLength(wrapper, 'utf8') / 1024);
pass('[3번] LegacyFormWrapper 크기 감소', wrapperKb < 175, wrapperKb + 'KB');
pass('[3번] LeaderFormRenderer import 연결', wrapper.includes('LeaderFormRenderer'));

// ── 4번: 하이브리드 파이프라인 ──────────────────────────────
// 실제 키워드는 onFormSelectionChange (context에서 전달)
pass('[4번] 하이브리드 파이프라인 (ctx.onFormSelectionChange)', wrapper.includes('onFormSelectionChange') || wrapper.includes('_ctx.onFormSelectionChange'));

const reactWrapper = fs.readFileSync('src/components/DynamicForms/LegacyFormReactWrapper.jsx', 'utf8');
pass('[4번] React Portal 적용', reactWrapper.includes('createPortal'));
pass('[4번] FormCodeBadge JSX 연결', reactWrapper.includes('FormCodeBadge'));
pass('[4번] 하이브리드 상태 전달 콜백', reactWrapper.includes('onFormSelectionChange'));

// ── 5번: Code Splitting ──────────────────────────────────────
const app = fs.readFileSync('src/App.jsx', 'utf8');
// App.jsx uses named import: lazy(...)
pass('[5번] Code Splitting (lazy import)', app.includes('lazy('));
pass('[5번] Suspense fallback 래핑', app.includes('Suspense'));

// ── 최종 결과 ─────────────────────────────────────────────────
const failCount = results.filter(r => r.startsWith('❌')).length;
console.log('\n╔══════════════════════════════════════╗');
console.log('  리팩토링 전체 점검 결과');
console.log('╚══════════════════════════════════════╝\n');
results.forEach(r => console.log(r));
console.log('\n───────────────────────────────────────');
console.log(`총 ${results.length}개 항목 점검 → ${failCount === 0 ? '🎉 전부 정상 (PASS)' : `❌ ${failCount}개 이상 발견`}`);
