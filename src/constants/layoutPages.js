/**
 * 화면(라우트)별 가로 레이아웃 정책.
 *
 * - FLUID: 화면 폭에 맞춰 자유롭게 줄어드는 기존 방식 유지 (작업일보 모든 카테고리 + 현장 TPM 점검).
 * - 그 외 모든 화면: 최소 가로폭(WIDE_PAGE_MIN_WIDTH)을 유지하고, 폭이 모자라면 가로 스크롤.
 *
 * 최소 가로폭의 실제 CSS 값은 src/index.css 의 `.content-body[data-wide-page="1"]` 규칙에 있으며,
 * 값을 바꿀 때는 아래 상수와 CSS 변수(--wide-page-min-width)를 함께 수정하세요.
 */
export const FLUID_PAGE_PATHS = ['/form', '/drafts', '/reports'];
export const FLUID_PAGE_PREFIXES = ['/tpm-check'];

// 화면 전체 기준 최소 가로 해상도(px). PC는 사이드바(260px) 포함, 모바일은 콘텐츠 영역 기준.
export const WIDE_PAGE_MIN_WIDTH = 1280;

export function isFluidPage(pathname) {
  return (
    FLUID_PAGE_PATHS.includes(pathname) ||
    FLUID_PAGE_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(prefix + '/'))
  );
}
