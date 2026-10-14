import axios from 'axios';

/**
 * If REACT_APP_API_URL has no scheme (e.g. `api.example.com`), axios treats it as a **path**
 * on the current origin → requests hit Netlify instead of your API.
 */
function normalizeApiBaseUrl(raw) {
  let s = String(raw || '').trim().replace(/\/+$/, '');
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  const isLocal =
    /^(localhost|127\.0\.0\.1|\[::1\])/i.test(s) ||
    /^192\.168\./.test(s) ||
    /^10\./.test(s);
  return `${isLocal ? 'http' : 'https'}://${s}`;
}

/** En dev, si aucune env : appeler l’API locale (évite les appels vers localhost:3000/api qui ne sont pas ton FastAPI). */
function defaultApiBaseUrl() {
  if (process.env.NODE_ENV === 'development') {
    return 'http://127.0.0.1:8000';
  }
  return '';
}

const rawBaseUrl =
  process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL || defaultApiBaseUrl();
const baseURL = normalizeApiBaseUrl(rawBaseUrl);

if (typeof window !== 'undefined' && baseURL && /\.internal(\/|$)/i.test(baseURL)) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Kloud] REACT_APP_API_URL pointe vers un hôte .internal : le navigateur ne peut pas y accéder. ' +
      'Utilise l’URL HTTPS publique Railway (dashboard → Networking → domaine public).'
  );
}

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production' && !baseURL) {
  // eslint-disable-next-line no-console
  console.error(
    '[Kloud] REACT_APP_API_URL est vide au build : les appels /api partiront sur le mauvais hôte. ' +
      'Définis REACT_APP_API_URL (URL publique HTTPS du backend) dans Netlify / Vercel / CI.'
  );
}

const TOKEN_KEYS = ['kloud_token', 'pandore_token'];
const REFRESH_TOKEN_KEYS = ['kloud_refresh_token', 'pandore_refresh_token'];
const AUTH_CHANGED_EVENT = 'kloud-auth-changed';

export function getAccessToken() {
  if (typeof window === 'undefined') return null;
  return TOKEN_KEYS.map((k) => window.localStorage.getItem(k)).find(Boolean) || null;
}

export function getRefreshToken() {
  if (typeof window === 'undefined') return null;
  return REFRESH_TOKEN_KEYS.map((k) => window.localStorage.getItem(k)).find(Boolean) || null;
}

export function persistTokens({ token, refreshToken } = {}) {
  if (typeof window === 'undefined') return;
  if (token) {
    window.localStorage.setItem('kloud_token', token);
    window.localStorage.setItem('pandore_token', token);
  }
  if (refreshToken) {
    window.localStorage.setItem('kloud_refresh_token', refreshToken);
    window.localStorage.setItem('pandore_refresh_token', refreshToken);
  }
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  [...TOKEN_KEYS, ...REFRESH_TOKEN_KEYS].forEach((k) => window.localStorage.removeItem(k));
}

function isAuthRefreshUrl(url = '') {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/forgot-password') ||
    url.includes('/auth/reset-password')
  );
}

export const apiClient = axios.create({
  baseURL,
  withCredentials: true
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Message lisible pour les toasts (réponse vide, 501 proxy, etc.) */
export function formatApiError(error) {
  const d = error?.response?.data;
  if (d && typeof d === 'object' && d.detail != null) {
    return typeof d.detail === 'string' ? d.detail : JSON.stringify(d.detail);
  }
  if (error?.response?.status) {
    return `Erreur serveur (${error.response.status})`;
  }
  if (error?.message) return error.message;
  return 'Erreur réseau';
}

let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  const { data } = await axios.post(
    `${baseURL}/api/auth/refresh`,
    refreshToken ? { refresh_token: refreshToken } : {},
    { withCredentials: true }
  );
  const nextAccess = data?.access_token || data?.token || null;
  const nextRefresh = data?.refresh_token || null;
  if (!nextAccess) {
    throw new Error('Refresh failed: missing access token');
  }
  persistTokens({ token: nextAccess, refreshToken: nextRefresh || undefined });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  }
  return nextAccess;
}

apiClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error?.config;
    const status = error?.response?.status;
    const url = original?.url || '';

    if (status === 401 && typeof window !== 'undefined') {
      if (url.includes('/purchases/status')) {
        // eslint-disable-next-line no-console
        console.warn('[Kloud] Session expirée ou non connecté — impossible de confirmer le paiement sans JWT.');
      }
    }

    if (
      status !== 401 ||
      !original ||
      original._retry ||
      isAuthRefreshUrl(url) ||
      typeof window === 'undefined'
    ) {
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const nextAccess = await refreshPromise;
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${nextAccess}`;
      return apiClient(original);
    } catch (refreshError) {
      clearTokens();
      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
      return Promise.reject(refreshError);
    }
  }
);

export function resolveApiUrl(pathOrUrl) {
  if (!pathOrUrl) return pathOrUrl;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (!baseURL) return pathOrUrl;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${baseURL}${path}`;
}

/** List endpoints may return a raw array or `{ items, results, data, ... }` depending on environment. */
export function normalizeApiList(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.results)) return payload.results;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.tracks)) return payload.tracks;
    if (Array.isArray(payload.albums)) return payload.albums;
    if (Array.isArray(payload.artists)) return payload.artists;
  }
  return [];
}
