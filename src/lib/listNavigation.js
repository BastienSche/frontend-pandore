const SCROLL_KEY = 'kloud:listScroll';

function readMap() {
  try {
    const raw = sessionStorage.getItem(SCROLL_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map) {
  try {
    sessionStorage.setItem(SCROLL_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function listPathKey(pathname, search = '') {
  return `${pathname || ''}${search || ''}`;
}

export function rememberListPosition({ selector } = {}) {
  if (typeof window === 'undefined') return;
  const key = listPathKey(window.location.pathname, window.location.search);
  const map = readMap();
  map[key] = {
    y: window.scrollY || 0,
    selector: selector || map[key]?.selector || '',
    t: Date.now()
  };
  writeMap(map);
}

export function peekListPosition(pathKey) {
  if (typeof window === 'undefined') return null;
  return readMap()[pathKey] || null;
}

export function restoreListPosition(pathKey) {
  if (typeof window === 'undefined') return false;
  const saved = peekListPosition(pathKey);
  if (!saved) return false;
  const y = Number(saved.y) || 0;
  window.scrollTo(0, y);
  const sel = String(saved.selector || '');
  if (sel) {
    const el = document.querySelector(sel);
    if (el) {
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }
  return true;
}

export function goBackInApp(navigate, fallback = '/browse') {
  const idx = window.history.state?.idx;
  if (typeof idx === 'number' && idx > 0) {
    navigate(-1);
    return;
  }
  navigate(fallback);
}
