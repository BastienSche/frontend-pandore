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

export const apiClient = axios.create({
  baseURL,
  withCredentials: true
});

apiClient.interceptors.request.use((config) => {
  const token = TOKEN_KEYS.map((k) => window.localStorage.getItem(k)).find(Boolean);
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

apiClient.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      const url = error.config?.url || '';
      if (url.includes('/purchases/status')) {
        // eslint-disable-next-line no-console
        console.warn('[Kloud] Session expirée ou non connecté — impossible de confirmer le paiement sans JWT.');
      }
    }
    return Promise.reject(error);
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

