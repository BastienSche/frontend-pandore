const KEY = 'kloud_post_login';

export function safeInternalPath(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const path = raw.trim();
  if (!path.startsWith('/') || path.startsWith('//')) return null;
  if (/^https?:/i.test(path)) return null;
  if (/^\/(login|register|auth|forgot-password|reset-password)(\/|\?|$)/.test(path)) return null;
  return path;
}

export function rememberPostLoginPath(path) {
  const safe = safeInternalPath(path);
  try {
    if (safe) sessionStorage.setItem(KEY, safe);
    else sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
  return safe;
}

export function consumePostLoginPath(fallback = '/browse') {
  let stored = null;
  try {
    stored = sessionStorage.getItem(KEY);
    sessionStorage.removeItem(KEY);
  } catch {
    stored = null;
  }
  return safeInternalPath(stored) || fallback;
}

export function goToLogin(navigate, fromPath) {
  const from = rememberPostLoginPath(fromPath) || fromPath || '/';
  navigate('/login', { state: { from } });
}
