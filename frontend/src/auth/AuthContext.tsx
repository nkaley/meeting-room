import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api';
import type { Me } from '../types';

type AuthState = {
  me: Me | null;
  loading: boolean;
  setAuth: (token: string, me: Me) => void;
  refresh: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setMe(null);
      setLoading(false);
      return;
    }
    try {
      const { data } = await api.get<Me>('/auth/me');
      setMe(data);
    } catch {
      localStorage.removeItem('accessToken');
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const setAuth = useCallback((token: string, nextMe: Me) => {
    localStorage.setItem('accessToken', token);
    setMe(nextMe);
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    setMe(null);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ me, loading, setAuth, refresh, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
