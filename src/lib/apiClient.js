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

const rawBaseUrl = process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL || '';
const baseURL = normalizeApiBaseUrl(rawBaseUrl);

if (typeof window !== 'undefined' && baseURL && /\.internal(\/|$)/i.test(baseURL)) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Kloud] REACT_APP_API_URL pointe vers un hôte .internal : le navigateur ne peut pas y accéder. ' +
      'Utilise l’URL HTTPS publique Railway (dashboard → Networking → domaine public).'
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

