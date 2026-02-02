import { useState, useEffect } from 'react';

const STORAGE_KEY = 'pandore_fake_user';

const createDefaultUser = (overrides = {}) => ({
  user_id: 'artist_0',
  name: 'Demo User',
  email: 'demo@pandore.app',
  role: 'artist',
  artist_name: 'Demo Artist',
  picture: 'https://picsum.photos/seed/pandore-demo-user/200/200',
  ...overrides
});

const loadUser = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultUser();
    return JSON.parse(raw);
  } catch (error) {
    return createDefaultUser();
  }
};

const persistUser = (user) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    const currentUser = loadUser();
    setUser(currentUser);
    setLoading(false);
    return currentUser;
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const loggedUser = persistUser(
      createDefaultUser({
        email,
        name: email?.split('@')[0] || 'Demo User'
      })
    );
    setUser(loggedUser);
    return { user: loggedUser };
  };

  const register = async (email, password, name, artistName = null) => {
    const role = artistName ? 'artist' : 'user';
    const registeredUser = persistUser(
      createDefaultUser({
        email,
        name: name || email?.split('@')[0] || 'Demo User',
        role,
        artist_name: artistName || (role === 'artist' ? 'Demo Artist' : null)
      })
    );
    setUser(registeredUser);
    return { user: registeredUser };
  };

  const logout = async () => {
    window.localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  const switchRole = async (artistName = null) => {
    const newRole = artistName || user?.artist_name ? 'artist' : 'user';
    const updated = persistUser({
      ...user,
      role: newRole,
      artist_name: artistName || user?.artist_name
    });
    setUser(updated);
  };

  return {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
    switchRole,
    isAuthenticated: !!user
  };
};