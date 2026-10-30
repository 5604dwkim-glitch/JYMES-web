/**
 * 양식(일보)별 렌더링 HTML 스냅샷 회귀 검증 도구 (GEMINI.md 원칙 15)
 *
 * 목적: 특정 양식을 수정/추가했을 때 "다른 양식의 렌더링 결과가 바뀌지 않았음"을 자동으로 증명한다.
 *
 * 사용법:
 *   npm run test:forms                 → 저장된 스냅샷과 비교 (변경된 양식 목록 출력, 변경 시 exit 1)
 *   npm run test:forms:update          → 전체 스냅샷 갱신 (기준선 재생성)
 *   npm run test:forms:update -- 1001  → 지정한 양식만 갱신 (의도적으로 수정한 양식만 기준선 반영)
 *
 * 동작: Vite SSR 로더로 실제 렌더러(Section5 / Qty / LotTable / Downtime)를 불러와
 *       jsdom 컨테이너에 FORM_CODE_MAP 의 모든 양식을 하나씩 렌더링한 뒤 HTML 을 비교한다.
 */
import { createServer } from 'vite';
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const SNAP_DIR = path.join(ROOT, 'tests', 'form-snapshots');

const args = process.argv.slice(2);
const UPDATE = args.includes('--update');
const ONLY = args.filter(a => /^\d{4}$/.test(a)).map(Number);

// ── 1. jsdom 전역 환경 구성 (렌더러가 document / window 를 직접 참조하므로) ──
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const g = globalThis;
const FIXED_NOW = new Date('2026-01-15T09:00:00+09:00').getTime();
const RealDate = Date;
class FixedDate extends RealDate {
  constructor(...a) { if (a.length === 0) super(FIXED_NOW); else super(...a); }
  static now() { return FIXED_NOW; }
}
g.Date = FixedDate; // 날짜 기본값으로 인해 스냅샷이 매일 바뀌는 것을 방지
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'HTMLSelectElement',
  'HTMLTextAreaElement', 'Node', 'NodeList', 'Element', 'Event', 'CustomEvent', 'KeyboardEvent', 'MouseEvent',
  'MutationObserver', 'getComputedStyle', 'localStorage', 'sessionStorage', 'DOMParser', 'requestAnimationFrame', 'cancelAnimationFrame']) {
  if (dom.window[key] !== undefined) {
    try { g[key] = typeof dom.window[key] === 'function' && /^[a-z]/.test(key) ? dom.window[key].bind(dom.window) : dom.window[key]; }
    catch { Object.defineProperty(g, key, { value: dom.window[key], configurable: true, writable: true }); }
  }
}
g.alert = () => {}; g.confirm = () => true;
dom.window.alert = g.alert; dom.window.confirm = g.confirm;
// 앱 로그는 스냅샷 출력과 섞이지 않도록 숨긴다
const realLog = console.log;
console.log = () => {}; console.warn = () => {}; console.info = () => {}; console.debug = () => {};
const out = (...m) => realLog(...m);

const wait = (ms) => new Promise(r => setTimeout(r, ms));

// ── 2. Vite SSR 로더로 실제 소스 모듈 로드 ──
const server = await createServer({
  root: ROOT,
  logLevel: 'silent',
  server: { middlewareMode: true, hmr: false, watch: null },
  appType: 'custom',
  optimizeDeps: { noDiscovery: true, include: [] },
});

let exitCode = 0;
try {
  const windowKeysBefore = new Set(Object.keys(dom.window));
  await server.ssrLoadModule('/src/constants/translations.js'); // window.i18n 전역 등록 (브라우저와 동일)
  const Sections = await server.ssrLoadModule('/src/components/DynamicForms/sections/index.js');
  const { FORM_CODE_MAP } = await server.ssrLoadModule('/src/constants/formMappings.js');
  // 앱이 window.xxx 로 등록한 전역(i18n 등)을 Node 전역에도 노출 (브라우저에서는 window === globalThis)
  for (const k of Object.keys(dom.window)) if (!windowKeysBefore.has(k) && !(k in g)) g[k] = dom.window[k];

  const entries = Object.entries(FORM_CODE_MAP)
    .map(([key, code]) => ({ key, code }))
    .filter(e => e.code < 9000) // 9xxx(반장/지게차/지원)은 별도 렌더러 사용
    .filter(e => ONLY.length === 0 || ONLY.includes(e.code))
    .sort((a, b) => a.code - b.code);

  const normalize = (html) => html
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim() + '\n';

  async function renderForm({ key, code }) {
    const [car, part, ...procParts] = key.split('_');
    const proc = procParts.join('_');
    const doc = dom.window.document;
    doc.body.innerHTML = `
      <div id="__root"><form id="mobileWorkReportForm">
        <input id="carModelValue" value=""><input id="partValue" value=""><input id="processValue" value="">
        <div id="section4Card"><div id="section4LotTableContainer"></div></div>
        <div id="section5DynamicContainer"></div>
        <div id="qtySection"></div>
        <div id="downtimeCard"><label id="downtimeTitleLabel"></label><div id="downtimeList"></div></div>
        <input id="targetQty"><input id="actualQty"><input id="defectQty">
      </form></div>`;
    const container = doc.getElementById('__root');
    const carModelValue = doc.getElementById('carModelValue'); carModelValue.value = car;
    const partValueInput = doc.getElementById('partValue'); partValueInput.value = part;
    const processValue = doc.getElementById('processValue'); processValue.value = proc;
    const noop = () => {};
    const ctx = {
      container, processValue, carModelValue, currentCarCode: car, partValueInput, existingData: null,
      getCurrentFormCode: () => FORM_CODE_MAP[`${carModelValue.value}_${partValueInput.value}_${processValue.value}`] || 9999,
      bindNumberWheelPicker: noop, bindLotDateWheelPicker: noop,
      updateDowntimeSection: () => { try { Sections.updateDowntimeSection(ctx); } catch { /* 스냅샷에서 별도 기록 */ } },
      get qtySection() { return container.querySelector('#qtySection'); },
      isDtCrewClip: () => (car === 'DT CREW' || car === 'DT QUAD') && (part === 'D/SIDE' || !part) && proc === '클립머신',
      currentMakerName: '', molds: [],
    };
    const errors = [];
    const step = (name, fn) => { try { fn(); } catch (e) { errors.push(`${name}: ${e && e.message ? e.message : e}`); } };
    // LegacyFormWrapper 의 실제 호출 순서와 동일
    step('renderSection5', () => Sections.renderSection5(ctx));
    step('renderQtySection', () => Sections.renderQtySection(ctx));
    step('renderSection4LotTable', () => Sections.renderSection4LotTable({}, ctx));
    step('updateDowntimeSection', () => Sections.updateDowntimeSection(ctx));
    await wait(30); // 렌더러 내부 setTimeout 처리 대기
    await wait(30);
    const part1 = (id) => { const el = container.querySelector('#' + id); return el ? el.outerHTML : '(missing)'; };
    return normalize([
      `<!-- form ${code} | ${key} -->`,
      errors.length ? `<!-- ERRORS:\n${errors.join('\n')}\n-->` : '<!-- ERRORS: none -->',
      '<!-- [section4LotTable] -->', part1('section4Card'),
      '<!-- [section5] -->', part1('section5DynamicContainer'),
      '<!-- [qtySection] -->', part1('qtySection'),
      '<!-- [downtime] -->', part1('downtimeCard'),
    ].join('\n'));
  }

  fs.mkdirSync(SNAP_DIR, { recursive: true });
  const changed = [], created = [], same = [];
  for (const e of entries) {
    const html = await renderForm(e);
    const file = path.join(SNAP_DIR, `${e.code}.html`);
    // git autocrlf 로 기준선이 CRLF 로 체크아웃되어도 오탐하지 않도록 줄바꿈 정규화
    const prev = fs.existsSync(file) ? fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') : null;
    if (prev === null) { fs.writeFileSync(file, html, 'utf8'); created.push(e.code); continue; }
    if (prev === html) { same.push(e.code); continue; }
    if (UPDATE) { fs.writeFileSync(file, html, 'utf8'); changed.push(e.code); continue; }
    changed.push(e.code);
    fs.writeFileSync(file.replace(/\.html$/, '.actual.html'), html, 'utf8');
  }

  out(`\n[form-snapshot] 검사 양식 ${entries.length}개`);
  out(`  ✅ 변경 없음 : ${same.length}개`);
  if (created.length) out(`  🆕 신규 기준선 생성 : ${created.join(', ')}`);
  if (changed.length && UPDATE) out(`  ♻️  기준선 갱신 : ${changed.join(', ')}`);
  if (changed.length && !UPDATE) {
    out(`  ❌ 렌더링 결과가 바뀐 양식 : ${changed.join(', ')}`);
    out(`     → tests/form-snapshots/{코드}.actual.html 과 {코드}.html 을 비교하세요.`);
    out(`     → 의도한 변경이면: npm run test:forms:update -- ${changed.join(' ')}`);
    exitCode = 1;
  }
  if (!changed.length || UPDATE) {
    // 비교 통과 시 남아있는 .actual.html 정리
    for (const f of fs.readdirSync(SNAP_DIR)) if (f.endsWith('.actual.html')) {
      const code = Number(f.slice(0, 4));
      if (!changed.includes(code) || UPDATE) fs.unlinkSync(path.join(SNAP_DIR, f));
    }
  }
} catch (e) {
  out('[form-snapshot] 실행 실패:', e && e.stack ? e.stack : e);
  exitCode = 2;
} finally {
  await server.close();
}
process.exit(exitCode);
