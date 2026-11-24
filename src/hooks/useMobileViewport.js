import { useState, useEffect, useCallback } from 'react';

const FORCE_PC_STORAGE_KEY = 'jymes_mobile_force_pc_view';
const FORCE_PC_EVENT_NAME = 'jymes-mobile-view-override';

function readForcePcFlag() {
  try {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(FORCE_PC_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function detectMobileViewport() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  const isNarrow = Boolean(window.matchMedia && window.matchMedia('(max-width: 768px)').matches);
  const isPreview = document.body?.classList?.contains('mobile-preview-mode') || false;
  return isNarrow || isPreview;
}

/**
 * 실제 모바일 뷰포트(<=768px) 또는 사이드바 "모바일 모드"(mobile-preview-mode) 여부를 실시간 감지한다.
 * 필요 시 sessionStorage 기반 [PC 화면 보기] 토글 상태도 컴포넌트 간 동기화한다.
 */
export function useMobileViewport() {
  const [isMobileViewport, setIsMobileViewport] = useState(() => detectMobileViewport());
  const [forcePcView, setForcePcState] = useState(() => readForcePcFlag());

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return undefined;

    const syncViewport = () => {
      setIsMobileViewport(detectMobileViewport());
    };
    const syncOverride = () => {
      setForcePcState(readForcePcFlag());
    };

    const mql = window.matchMedia ? window.matchMedia('(max-width: 768px)') : null;
    if (mql) {
      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', syncViewport);
      } else if (typeof mql.addListener === 'function') {
        mql.addListener(syncViewport);
      }
    }

    let bodyObserver = null;
    if (typeof MutationObserver !== 'undefined' && document.body) {
      bodyObserver = new MutationObserver(syncViewport);
      bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    }

    window.addEventListener(FORCE_PC_EVENT_NAME, syncOverride);
    syncViewport();

    return () => {
      if (mql) {
        if (typeof mql.removeEventListener === 'function') {
          mql.removeEventListener('change', syncViewport);
        } else if (typeof mql.removeListener === 'function') {
          mql.removeListener(syncViewport);
        }
      }
      bodyObserver?.disconnect();
      window.removeEventListener(FORCE_PC_EVENT_NAME, syncOverride);
    };
  }, []);

  const setForcePcView = useCallback((nextVal) => {
    const boolVal = Boolean(nextVal);
    try {
      if (typeof sessionStorage !== 'undefined') {
        if (boolVal) sessionStorage.setItem(FORCE_PC_STORAGE_KEY, '1');
        else sessionStorage.removeItem(FORCE_PC_STORAGE_KEY);
      }
    } catch {
      // ignore storage errors
    }
    setForcePcState(boolVal);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(FORCE_PC_EVENT_NAME));
    }
  }, []);

  return {
    isMobileViewport,
    forcePcView,
    isMobileDedicatedActive: isMobileViewport && !forcePcView,
    setForcePcView
  };
}
