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

export function apiOrigin() {
  if (baseURL) return baseURL;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export function googleOAuthLoginUrl() {
  return `${apiOrigin()}/api/auth/google/login`;
}

if (typeof window !== 'undefined' && baseURL && /\.internal(\/|$)/i.test(baseURL)) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Kloud] REACT_APP_API_URL pointe vers un hôte .internal : le navigateur ne peut pas y accéder. ' +
      'Utilise l’URL HTTPS publique Railway (dashboard → Networking → domaine public).'
  );
}

// Une base vide est voulue en prod Docker : les appels /api restent sur le même hôte,
// et Caddy les proxifie vers le backend.

const TOKEN_KEYS = ['kloud_token', 'pandore_token'];
const REFRESH_TOKEN_KEYS = ['kloud_refresh_token', 'pandore_refresh_token'];
const USER_KEYS = ['kloud_user', 'pandore_user'];
const AUTH_CHANGED_EVENT = 'kloud-auth-changed';
let sessionRefreshBlocked = false;

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
  if (token || refreshToken) sessionRefreshBlocked = false;
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

function clearStoredUser() {
  if (typeof window === 'undefined') return;
  USER_KEYS.forEach((k) => window.localStorage.removeItem(k));
}

function isAuthRefreshUrl(url = '') {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/forgot-password') ||
    url.includes('/auth/reset-password') ||
    url.includes('/likes/state') ||
    url.includes('/follows/state')
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

function formatDetail(detail) {
  if (detail == null) return '';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && item.msg) return String(item.msg);
        return '';
      })
      .filter(Boolean)
      .join(' · ');
  }
  if (typeof detail === 'object') {
    if (detail.msg) return String(detail.msg);
    try {
      return JSON.stringify(detail);
    } catch {
      return '';
    }
  }
  return String(detail);
}

const API_ERROR_FR = {
  'Not authenticated': 'Connecte-toi pour continuer',
  'Invalid credentials': 'Email ou mot de passe incorrect',
  'Invalid token': 'Session invalide',
  'Invalid token type': 'Session invalide',
  'Invalid session': 'Session invalide',
  'Invalid refresh token': 'Session expirée, reconnecte-toi',
  'Refresh token expired': 'Session expirée, reconnecte-toi',
  'Missing refresh token': 'Session expirée, reconnecte-toi',
  'Token expired': 'Session expirée, reconnecte-toi',
  'Session expired': 'Session expirée, reconnecte-toi',
  'User not found': 'Compte introuvable',
  'Email already registered': 'Cet email est déjà utilisé',
  'Admin only': 'Accès réservé aux administrateurs',
  'Not authorized': 'Action non autorisée',
  'Track not found': 'Titre introuvable',
  'Album not found': 'Album introuvable',
  'Playlist not found': 'Playlist introuvable',
  'Profile not found': 'Profil introuvable',
  'File not found': 'Fichier introuvable',
  'Invalid file id': 'Fichier invalide',
  'Empty file': 'Fichier vide',
  'No fields to update': 'Aucun champ à mettre à jour',
  'Only artists can create tracks': 'Seuls les artistes peuvent créer des titres',
  'Only artists can create albums': 'Seuls les artistes peuvent créer des albums',
  'Only artists can upload audio': 'Seuls les artistes peuvent envoyer de l’audio',
  'Only artists can create profiles': 'Seuls les artistes peuvent créer un profil',
  'Only artists can update profiles': 'Seuls les artistes peuvent modifier un profil',
  'Profile already exists': 'Ce profil existe déjà',
  'Artist name required for artist role': 'Le nom d’artiste est requis',
  'Invalid role': 'Rôle invalide',
  'Invalid OAuth state': 'Connexion Google interrompue',
  'Missing code': 'Connexion Google incomplète',
  'Missing access token': 'Connexion incomplète',
  'Token exchange failed': 'Connexion Google impossible',
  'Failed to fetch user info': 'Impossible de récupérer le compte Google',
  'Contest not found': 'Concours introuvable',
  'Audio file could not be served': 'Impossible de lire ce fichier audio',
};

function translateApiMessage(raw) {
  const msg = String(raw || '').trim();
  if (!msg) return '';
  if (API_ERROR_FR[msg]) return API_ERROR_FR[msg];
  const minLen = msg.match(/string should have at least (\d+)/i);
  if (minLen) return `Doit faire au moins ${minLen[1]} caractères`;
  if (/field required/i.test(msg)) return 'Champ requis';
  if (/value is not a valid/i.test(msg)) return 'Valeur invalide';
  if (/not authenticated/i.test(msg)) return 'Connecte-toi pour continuer';
  return msg;
}

/** Message lisible pour les toasts (422 FastAPI, réponse vide, 501 proxy, etc.) */
export function formatApiError(error, fallback = 'Erreur réseau') {
  const status = error?.response?.status;
  const d = error?.response?.data;
  let raw = '';
  if (d && typeof d === 'object' && d.detail != null) {
    raw = formatDetail(d.detail);
  } else if (typeof d === 'string' && d.trim()) {
    raw = d;
  }
  const translated = translateApiMessage(raw);
  if (translated) return translated;
  if (status === 401) return 'Connecte-toi pour continuer';
  if (status) return `Erreur serveur (${status})`;
  if (error?.message) return translateApiMessage(error.message) || error.message;
  return fallback;
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
      sessionRefreshBlocked ||
      isAuthRefreshUrl(url) ||
      typeof window === 'undefined' ||
      (!getAccessToken() && !getRefreshToken())
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
      const refreshStatus = refreshError?.response?.status;
      if (refreshStatus === 401 || refreshStatus === 403) {
        sessionRefreshBlocked = true;
        clearTokens();
        clearStoredUser();
        window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
      }
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

/** Download a protected audio file with the JWT (Authorization), not a public <a href>. */
export async function downloadAuthenticatedFile(pathOrUrl, filename = 'track') {
  const raw = String(pathOrUrl || '').trim();
  if (!raw) throw new Error('Fichier indisponible');
  const requestUrl = /^https?:\/\//i.test(raw) ? raw : raw.startsWith('/') ? raw : `/${raw}`;
  const response = await apiClient.get(requestUrl, { responseType: 'blob' });
  const data = response.data;
  if (data && data.type && data.type.includes('application/json')) {
    throw new Error('Fichier indisponible');
  }
  const blobUrl = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.setAttribute('download', String(filename || 'track').replace(/[/\\?%*:|"<>]/g, '-'));
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
}

/** Adds the JWT so <audio> / download can hit a protected /api/files/audio URL. */
export function withAudioAccessToken(pathOrUrl) {
  const url = resolveApiUrl(pathOrUrl);
  if (!url) return url;
  const token = getAccessToken();
  if (!token) return url;
  try {
    const parsed = new URL(url, typeof window !== 'undefined' ? window.location.href : 'http://localhost');
    if (!parsed.searchParams.has('token')) {
      parsed.searchParams.set('token', token);
    }
    return parsed.toString();
  } catch {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}token=${encodeURIComponent(token)}`;
  }
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

const TRACK_IDS_BATCH = 100;

/** One (or few) GET /tracks?ids=… instead of N GET /tracks/{id}. Preserves requested order. */
export async function fetchTracksByIds(ids) {
  const clean = [];
  const seen = new Set();
  for (const id of ids || []) {
    const tid = String(id || '').trim();
    if (!tid || seen.has(tid)) continue;
    seen.add(tid);
    clean.push(tid);
  }
  if (!clean.length) return [];

  const batches = [];
  for (let i = 0; i < clean.length; i += TRACK_IDS_BATCH) {
    batches.push(clean.slice(i, i + TRACK_IDS_BATCH));
  }
  const chunks = await Promise.all(
    batches.map((batch) =>
      apiClient
        .get('/api/tracks', { params: { ids: batch.join(',') } })
        .then((r) => normalizeApiList(r.data))
        .catch(() => [])
    )
  );
  const byId = new Map();
  for (const list of chunks) {
    for (const track of list) {
      if (track?.track_id) byId.set(track.track_id, track);
    }
  }
  return clean.map((id) => byId.get(id)).filter(Boolean);
}
