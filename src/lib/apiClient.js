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

