import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../..');

/**
 * 서비스 계정 키(JSON)를 안전한 외부 경로 우선으로 로드합니다.
 * 우선순위:
 *  1) 환경변수 GOOGLE_APPLICATION_CREDENTIALS 또는 JYMES_SERVICE_ACCOUNT_PATH
 *  2) 사용자 홈 보안 폴더: ~/.secrets/jymes-serviceAccountKey.json
 *  3) 상위 디렉토리: ../jymes-serviceAccountKey.json
 *  4) 레거시 루트 경로(폴백): ./serviceAccountKey.json (발견 시 외부 이동 안내 출력)
 */
export function loadServiceAccount() {
  const candidates = [
    process.env.JYMES_SERVICE_ACCOUNT_PATH,
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    resolve(homedir(), '.secrets', 'jymes-serviceAccountKey.json'),
    resolve(PROJECT_ROOT, '..', 'jymes-serviceAccountKey.json'),
    resolve(PROJECT_ROOT, 'serviceAccountKey.json')
  ].filter(Boolean);

  const legacyRootPath = resolve(PROJECT_ROOT, 'serviceAccountKey.json');

  for (const keyPath of candidates) {
    if (existsSync(keyPath)) {
      if (keyPath === legacyRootPath) {
        console.warn(
          `[보안 권고] serviceAccountKey.json 이 프로젝트 폴더 내부에 있습니다. ` +
          `"${resolve(homedir(), '.secrets', 'jymes-serviceAccountKey.json')}" 로 이동해도 모든 유틸 스크립트가 그대로 동작합니다.`
        );
      }
      return JSON.parse(readFileSync(keyPath, 'utf8'));
    }
  }

  throw new Error(
    `Firebase 서비스 계정 키를 찾을 수 없습니다.\n확인한 경로:\n  - ${candidates.join('\n  - ')}`
  );
}
