import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import apiClient from '../services/apiClient';

const AuthContext = createContext({
  isAuthenticated: true,
  displayName: null,
  logout: async () => {},
  completeAccess: () => {},
  clearSession: () => {},
});

function parseJwt(token) {
  try { return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch { return null; }
}

function restoreSession() {
  const token = localStorage.getItem('access_token');
  const claims = token && parseJwt(token);
  if (claims?.exp && claims.exp * 1000 > Date.now()) {
    const email = localStorage.getItem('access_email') || claims.email;
    return { token, email, displayName: email?.split('@')[0] };
  }
  if (token) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('access_email');
  }
  return null;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(restoreSession);

  const clearSession = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('access_email');
    setSession(null);
  }, []);

  useEffect(() => {
    window.addEventListener('auth:unauthorized', clearSession);
    return () => window.removeEventListener('auth:unauthorized', clearSession);
  }, [clearSession]);

  const completeAccess = useCallback(({ access, email, display_name: displayName }) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('access_email', email);
    setSession({ token: access, email, displayName });
  }, []);
  const logout = useCallback(async () => { try { await apiClient.post('/api/auth/logout/'); } finally { clearSession(); } }, [clearSession]);
  const value = useMemo(() => ({ ...session, isAuthenticated: Boolean(session), completeAccess, logout, clearSession }), [session, completeAccess, logout, clearSession]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
