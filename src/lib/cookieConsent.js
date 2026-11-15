export const COOKIE_CONSENT_KEY = 'kloud_cookie_consent';
export const COOKIE_CONSENT_EVENT = 'kloud-cookie-consent';

export function getCookieConsent() {
  try {
    const raw = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (raw === 'accepted' || raw === 'refused') return raw;
  } catch {
    // ignore
  }
  return null;
}

export function setCookieConsent(value) {
  const next = value === 'accepted' ? 'accepted' : 'refused';
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, next);
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(COOKIE_CONSENT_EVENT, { detail: next }));
  return next;
}

export function hasAnalyticsConsent() {
  return getCookieConsent() === 'accepted';
}
