const PENDING_REDIRECT_KEY = 'jymes_pending_redirect';
const PENDING_REDIRECT_TTL_MS = 15 * 60 * 1000;

export function isSafeRedirectPath(raw) {
  return (
    typeof raw === 'string' &&
    raw.startsWith('/') &&
    !raw.startsWith('//') &&
    !raw.startsWith('/login')
  );
}

export function savePendingRedirect(target) {
  if (!isSafeRedirectPath(target) || target === '/') return;
  try {
    sessionStorage.setItem(PENDING_REDIRECT_KEY, target);
  } catch {
    // ignore storage errors
  }
  try {
    localStorage.setItem(
      PENDING_REDIRECT_KEY,
      JSON.stringify({ target, at: Date.now() })
    );
  } catch {
    // ignore storage errors
  }
}

export function readPendingRedirect(searchParams) {
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const fromQuery =
      searchParams?.get?.('redirect') || urlParams.get('redirect') || '';
    if (isSafeRedirectPath(fromQuery)) {
      return fromQuery;
    }
  } catch {
    // ignore URL errors
  }

  try {
    const fromSession = sessionStorage.getItem(PENDING_REDIRECT_KEY) || '';
    if (isSafeRedirectPath(fromSession)) {
      return fromSession;
    }
  } catch {
    // ignore storage errors
  }

  try {
    const rawLocal = localStorage.getItem(PENDING_REDIRECT_KEY);
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal);
      if (
        parsed &&
        typeof parsed.at === 'number' &&
        Date.now() - parsed.at <= PENDING_REDIRECT_TTL_MS &&
        isSafeRedirectPath(parsed.target)
      ) {
        return parsed.target;
      }
      localStorage.removeItem(PENDING_REDIRECT_KEY);
    }
  } catch {
    // ignore storage errors
  }

  return '/';
}

export function clearPendingRedirect() {
  try {
    sessionStorage.removeItem(PENDING_REDIRECT_KEY);
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(PENDING_REDIRECT_KEY);
  } catch {
    // ignore
  }
}
