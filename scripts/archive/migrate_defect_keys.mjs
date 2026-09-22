/**
 * migrate_defect_keys.mjs
 * 
 * Firestore daily_stats 컬렉션의 기존 불량 유형 키명을 새 이름으로 마이그레이션합니다.
 * 
 * 변경 내용:
 *  1. [클립머신] 종합 불량  → 삭제 (세부 항목이 없는 기존 데이터이므로 제거)
 *  2. [검사_압출]/[검사_조인트]/[검사_후가공] 계열 → [검사/압출]/[검사/조인트]/[검사/후가공] 계열로 이전
 *  3. [후가공] 사상 불량 → [후가공] 사상불량 (공백 제거)
 *  4. [조인트] 인서트 불량 → [조인트] 인서트불량 (공백 제거)
 * 
 * 실행 방법:
 *   node scripts/utils/migrate_defect_keys.mjs
 * 
 * ⚠️  실행 전 Firestore 백업 권장
 * ⚠️  실행 후 이 파일은 scripts/archive/ 로 이동하세요
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, FieldPath } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Firebase Admin 초기화 ──
// serviceAccountKey.json 파일이 프로젝트 루트에 있어야 합니다.
// Firebase 콘솔 > 프로젝트 설정 > 서비스 계정 > 새 비공개 키 생성
const serviceAccountPath = resolve(__dirname, '../../serviceAccountKey.json');
let serviceAccount;
try {
  serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
} catch (e) {
  console.error('❌ serviceAccountKey.json 파일을 찾을 수 없습니다:', serviceAccountPath);
  console.error('Firebase 콘솔에서 서비스 계정 키를 다운로드하여 프로젝트 루트에 배치하세요.');
  process.exit(1);
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// ── 키 매핑 테이블 ──
// { '구 키': '새 키' }  — 새 키가 null이면 해당 필드를 삭제만 합니다.
const KEY_MAP = {
  // ── [클립머신] 종합 불량 제거 ──
  '[클립머신] 종합 불량': null,   // 세부 데이터 없으므로 삭제

  // ── [검사_압출] → [검사/압출] ──
  '[검사_압출] 스코치':           '[검사/압출] 스카치',
  '[검사_압출] 외면흠':           '[검사/압출] 기스',
  '[검사_압출] 오염/코팅불량':    '[검사/압출] 오염',
  '[검사_압출] 길이불량':         '[검사/압출] 기장',
  '[검사_압출] 소재클립누락':     '[검사/압출] 클립',
  '[검사_압출] 기타':             '[검사/압출] 기타',

  // ── [검사_조인트] → [검사/조인트] ──
  '[검사_조인트] 떨어짐/찢어짐': '[검사/조인트] 빠짐',
  '[검사_조인트] 양부족':         '[검사/조인트] 미성형',
  '[검사_조인트] 밀림/크랙':      '[검사/조인트] 밀림',
  '[검사_조인트] 기포':           '[검사/조인트] 기포',
  '[검사_조인트] 씹힘/삽입불량':  '[검사/조인트] 씹힘',
  '[검사_조인트] 넘침/오버랩':    '[검사/조인트] 오버',
  '[검사_조인트] 후변형':         '[검사/조인트] 변형',
  '[검사_조인트] 이물질':         '[검사/조인트] 이물',
  '[검사_조인트] 꼬임':           '[검사/조인트] 틀어짐',
  '[검사_조인트] 기타':           '[검사/조인트] 기타',

  // ── [검사_후가공] → [검사/후가공] ──
  '[검사_후가공] 과사상':          '[검사/후가공] 사상과다',
  '[검사_후가공] 미사상':          '[검사/후가공] 사상미달',
  '[검사_후가공] 본드오염':        '[검사/후가공] 본드오염',
  '[검사_후가공] 외면오염':        '[검사/후가공] 표면오염',
  '[검사_후가공] 클립누락/반클':   '[검사/후가공] 클립누락',
  '[검사_후가공] 클립홀누락':      '[검사/후가공] 클립홀',
  '[검사_후가공] 드레인홀불량':    '[검사/후가공] 물구멍',
  '[검사_후가공] 클립이종':        '[검사/후가공] 이종클립',
  '[검사_후가공] 절단누락':        '[검사/후가공] 커팅불량',
  '[검사_후가공] 본드누락/접착불량': '[검사/후가공] 본드불량',
  '[검사_후가공] 길이초과':        '[검사/후가공] 기장과다',
  '[검사_후가공] 클립간격불량':    '[검사/후가공] 피치불량',
  '[검사_후가공] 기타':            '[검사/후가공] 기타',

  // ── 공백 정리 ──
  '[후가공] 사상 불량':  '[후가공] 사상불량',
  '[후가공] 조인트 빠짐': '[후가공] 조인트빠짐',
  '[조인트] 인서트 불량': '[조인트] 인서트불량',
};

/**
 * Firestore 키명에는 '/', '[', ']' 가 포함될 수 없으므로
 * statsAggregator.js는 key를 replace(/[\.\\/]/g, '_') 처리하여 저장합니다.
 * 따라서 daily_stats의 defectBreakdowns 필드 키는 이미 언더스코어로 인코딩되어 있습니다.
 * 
 * 예) '[검사/압출] 스카치' → '[검사_압출] 스카치'  (저장 시 / → _)
 *     '[클립머신] 종합 불량' → '[클립머신] 종합 불량' (특수문자 없으므로 그대로)
 * 
 * 이 스크립트는 두 가지 경로를 모두 처리합니다:
 *   a) daily_stats.defectBreakdowns.*  (날짜별 누적)
 *   b) daily_stats.items.*.defects.*  (차종·부품별 세부 누적)
 */

function encodeKey(k) {
  // statsAggregator.js의 인코딩 규칙과 동일
  return k.replace(/[.\\/]/g, '_');
}

async function migrateDoc(docRef, data) {
  // FieldPath를 사용해야 키에 대괄호('[', ']')가 포함되어 있어도 오류가 발생하지 않습니다.
  const updates = [];
  let hasChange = false;
  const updateMap = new Map(); // 중복 FieldPath 방지를 위해 Map 사용

  // ── a) defectBreakdowns 최상위 필드 마이그레이션 ──
  const breakdowns = data.defectBreakdowns || {};
  for (const [oldRaw, newRaw] of Object.entries(KEY_MAP)) {
    const oldEncoded = encodeKey(oldRaw);
    if (breakdowns[oldEncoded] !== undefined) {
      const val = breakdowns[oldEncoded];
      
      // oldEncoded와 newEncoded가 같으면 DB에 저장되는 키가 동일하므로 건너뜀
      if (newRaw !== null) {
        const newEncoded = encodeKey(newRaw);
        if (oldEncoded === newEncoded) continue;
      }
      
      // 구 키 삭제
      const oldPathStr = `defectBreakdowns.${oldEncoded}`;
      updateMap.set(oldPathStr, { path: new FieldPath('defectBreakdowns', oldEncoded), val: FieldValue.delete() });
      
      // 새 키에 값 합산 (null이면 삭제만)
      if (newRaw !== null) {
        const newEncoded = encodeKey(newRaw);
        const existing = breakdowns[newEncoded] || 0;
        const newPathStr = `defectBreakdowns.${newEncoded}`;
        updateMap.set(newPathStr, { path: new FieldPath('defectBreakdowns', newEncoded), val: existing + val });
      }
      hasChange = true;
    }
  }

  // ── b) items.*.defects.* 마이그레이션 ──
  const items = data.items || {};
  for (const [itemKey, itemData] of Object.entries(items)) {
    const defects = itemData.defects || {};
    for (const [oldRaw, newRaw] of Object.entries(KEY_MAP)) {
      const oldEncoded = encodeKey(oldRaw);
      if (defects[oldEncoded] !== undefined) {
        const val = defects[oldEncoded];
        
        if (newRaw !== null) {
          const newEncoded = encodeKey(newRaw);
          if (oldEncoded === newEncoded) continue;
        }

        const oldPathStr = `items.${itemKey}.defects.${oldEncoded}`;
        updateMap.set(oldPathStr, { path: new FieldPath('items', itemKey, 'defects', oldEncoded), val: FieldValue.delete() });
        
        if (newRaw !== null) {
          const newEncoded = encodeKey(newRaw);
          const existing = defects[newEncoded] || 0;
          const newPathStr = `items.${itemKey}.defects.${newEncoded}`;
          updateMap.set(newPathStr, { path: new FieldPath('items', itemKey, 'defects', newEncoded), val: existing + val });
        }
        hasChange = true;
      }
    }
  }

  if (hasChange && updateMap.size > 0) {
    for (const [_, item] of updateMap) {
      updates.push(item.path);
      updates.push(item.val);
    }
    await docRef.update(...updates);
    return true;
  }
  return false;
}

async function run() {
  console.log('🚀 불량 유형 키 마이그레이션 시작...\n');
  
  const snapshot = await db.collection('daily_stats').get();
  if (snapshot.empty) {
    console.log('daily_stats 컬렉션이 비어 있습니다.');
    return;
  }

  let total = 0;
  let migrated = 0;
  let errors = 0;

  for (const docSnap of snapshot.docs) {
    total++;
    try {
      const changed = await migrateDoc(docSnap.ref, docSnap.data());
      if (changed) {
        migrated++;
        console.log(`  ✅ ${docSnap.id} — 마이그레이션 완료`);
      }
    } catch (e) {
      errors++;
      console.error(`  ❌ ${docSnap.id} — 오류: ${e.message}`);
    }
  }

  console.log(`\n📊 결과: 전체 ${total}개 문서 중 ${migrated}개 마이그레이션, ${errors}개 오류`);
  console.log('✔ 완료. 이 파일을 scripts/archive/ 로 이동하세요.');
}

run().catch(e => {
  console.error('치명적 오류:', e);
  process.exit(1);
});
