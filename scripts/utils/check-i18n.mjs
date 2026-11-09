/**
 * check-i18n.mjs
 * 다국어(ko/en/th/vi) 사전 무결성 및 UI 문자열 부분번역(한·외국어 혼용) 점검 유틸리티
 * 사용법: node scripts/utils/check-i18n.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TRANSLATIONS, i18n } from '../../src/constants/translations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const LANGS = ['ko', 'en', 'th', 'vi'];

let exitCode = 0;

// 1. 키 누락 점검
const koKeys = Object.keys(TRANSLATIONS.ko);
for (const lang of LANGS) {
  const missing = koKeys.filter((k) => !(k in TRANSLATIONS[lang]));
  if (missing.length > 0) {
    console.error(`❌ [${lang}] 누락된 키 (${missing.length}건):`, missing.slice(0, 20));
    exitCode = 1;
  }
}

// 2. 외국어 사전에 한글 잔류 여부 점검
for (const lang of ['en', 'th', 'vi']) {
  const leaked = koKeys.filter((k) => /[가-힣]/.test(TRANSLATIONS[lang][k] || ''));
  if (leaked.length > 0) {
    console.error(`❌ [${lang}] 번역본 내 한글 잔류 (${leaked.length}건):`, leaked.slice(0, 20));
    exitCode = 1;
  }
}

// 3. 컴포넌트 정적 JSX 텍스트 부분번역 점검
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? walk(path.join(dir, e.name))
      : e.name.endsWith('.jsx') || e.name.endsWith('.js')
        ? [path.join(dir, e.name)]
        : []
  );

i18n.setLang('en', false);
const seen = new Set();
const mixedFindings = [];

for (const file of walk(path.join(ROOT, 'src', 'components'))) {
  const txt = fs.readFileSync(file, 'utf8');
  const matches = txt.match(/>([^<>{}\n]*[가-힣][^<>{}\n]*)</g) || [];
  for (const m of matches) {
    const raw = m.slice(1, -1).trim();
    if (!raw || seen.has(raw)) continue;
    seen.add(raw);
    const tr = i18n.translateString(raw);
    if (/[가-힣]/.test(tr) && tr !== raw) {
      mixedFindings.push({ file: path.relative(ROOT, file), raw, tr });
    }
  }
}

if (mixedFindings.length > 0) {
  console.warn(`⚠️  부분 번역(한·영 혼용) 후보 ${mixedFindings.length}건:`);
  for (const item of mixedFindings) {
    console.warn(`  - [${item.file}] "${item.raw}" => "${item.tr}"`);
  }
} else {
  console.log('✅ 정적 JSX 텍스트 내 부분 번역 혼용 0건');
}

if (exitCode === 0) {
  console.log(`✅ 다국어 사전 점검 통과 (총 ${koKeys.length}개 키 × ${LANGS.length}개 언어)`);
}
process.exit(exitCode);
