import { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true
      });
      setUser(response.data);
      return response.data;
    } catch (error) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, 
      { email, password },
      { withCredentials: true }
    );
    setUser(response.data.user);
    return response.data;
  };

  const register = async (email, password, name, artistName = null) => {
    const response = await axios.post(`${API}/auth/register`, {
      email,
      password,
      name,
      artist_name: artistName
    });
    return response.data;
  };

  const logout = async () => {
    await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    setUser(null);
  };

  const switchRole = async (artistName = null) => {
    const newRole = artistName || user?.artist_name ? 'artist' : 'user';
    await axios.put(
      `${API}/auth/role?new_role=${newRole}${artistName ? `&artist_name=${artistName}` : ''}`,
      {},
      { withCredentials: true }
    );
    await checkAuth();
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