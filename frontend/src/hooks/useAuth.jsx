import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('roadguard_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const u = await api.getMe();
        setUser(u);
      } catch (err) {
        console.warn('Could not load session user, defaulting to demo admin');
        // Default preview user
        setUser({
          id: 1,
          full_name: 'Thiru K. Balasubramanian, IAS',
          email: 'state.admin@tn.gov.in',
          role: 'State Administrator',
          department: 'Transport & Road Safety Commission',
          badge_id: 'TN-IAS-084',
          is_active: true
        });
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    localStorage.setItem('roadguard_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
    return res;
  };

  const switchDemoRole = (demoUser) => {
    setUser({
      id: demoUser.id,
      full_name: demoUser.full_name,
      email: demoUser.email,
      role: demoUser.role,
      department: demoUser.department,
      badge_id: demoUser.badge_id,
      is_active: true
    });
  };

  const logout = () => {
    localStorage.removeItem('roadguard_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, switchDemoRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

