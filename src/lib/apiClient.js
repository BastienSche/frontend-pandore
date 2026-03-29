import axios from 'axios';

const rawBaseUrl = process.env.REACT_APP_API_URL || process.env.REACT_APP_BACKEND_URL || '';
const baseURL = rawBaseUrl.replace(/\/+$/, '');

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

