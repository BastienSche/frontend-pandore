import { useEffect, useMemo, useState } from 'react';
import { apiClient } from '@/lib/apiClient';

const STORAGE_USER_KEY = 'kloud_user';
const STORAGE_TOKEN_KEY = 'kloud_token';
const LEGACY_USER_KEY = 'pandore_user';
const LEGACY_TOKEN_KEY = 'pandore_token';
const AUTH_CHANGED_EVENT = 'kloud-auth-changed';
const LEGACY_AUTH_CHANGED_EVENT = 'pandore-auth-changed';

const loadStoredUser = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_USER_KEY) || window.localStorage.getItem(LEGACY_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const persistSession = ({ user, token }) => {
  if (user) window.localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(user));
  if (token) window.localStorage.setItem(STORAGE_TOKEN_KEY, token);
  // keep legacy keys for a short transition (safe no-op if unused)
  if (user) window.localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(user));
  if (token) window.localStorage.setItem(LEGACY_TOKEN_KEY, token);
};

const clearSession = () => {
  window.localStorage.removeItem(STORAGE_USER_KEY);
  window.localStorage.removeItem(STORAGE_TOKEN_KEY);
  window.localStorage.removeItem(LEGACY_USER_KEY);
  window.localStorage.removeItem(LEGACY_TOKEN_KEY);
};

const emitAuthChanged = () => {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  window.dispatchEvent(new Event(LEGACY_AUTH_CHANGED_EVENT));
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/api/auth/me');
      setUser(data);
      persistSession({ user: data });
      return data;
    } catch (error) {
      const stored = loadStoredUser();
      setUser(stored);
      return stored;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    const syncFromStorage = () => {
      const stored = loadStoredUser();
      setUser(stored);
    };

    const onStorage = (e) => {
      if (!e) return;
      if (e.key === STORAGE_USER_KEY || e.key === STORAGE_TOKEN_KEY) syncFromStorage();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(AUTH_CHANGED_EVENT, syncFromStorage);
    window.addEventListener(LEGACY_AUTH_CHANGED_EVENT, syncFromStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(AUTH_CHANGED_EVENT, syncFromStorage);
      window.removeEventListener(LEGACY_AUTH_CHANGED_EVENT, syncFromStorage);
    };
  }, []);

  const login = async (email, password) => {
    const { data } = await apiClient.post('/api/auth/login', { email, password });
    const nextUser = data?.user || null;
    const token = data?.token || null;
    if (token) persistSession({ user: nextUser, token });
    if (nextUser) setUser(nextUser);
    emitAuthChanged();
    return data;
  };

  const register = async (email, password, name, artistName = null) => {
    const payload = { email, password, name, artist_name: artistName || null };
    const { data } = await apiClient.post('/api/auth/register', payload);
    setUser(data);
    persistSession({ user: data });
    emitAuthChanged();
    return data;
  };

  const logout = async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } finally {
      clearSession();
      setUser(null);
      emitAuthChanged();
    }
  };

  const switchRole = async (artistName = null) => {
    const params = new URLSearchParams();
    const newRole = artistName || user?.artist_name ? 'artist' : 'user';
    params.set('new_role', newRole);
    if (artistName) params.set('artist_name', artistName);
    const { data } = await apiClient.put(`/api/auth/role?${params.toString()}`);
    const updated = { ...(user || {}), role: data.role, artist_name: data.artist_name };
    setUser(updated);
    persistSession({ user: updated });
    emitAuthChanged();
    return updated;
  };

  const isAuthenticated = useMemo(() => !!user, [user]);

  return {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
    switchRole,
    isAuthenticated
  };
};