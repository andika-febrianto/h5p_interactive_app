import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User, UserRole } from '../types/storyboard';
import {
  hasStoredSession,
  persistAuthResponse,
  login as apiLogin,
  registerAccount,
  fetchMe,
  logoutSession,
} from '../lib/api';

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole, grade?: number, semester?: number) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasStoredSession()) {
      setLoading(false);
      return;
    }
    // fetchMe() goes through request(), which transparently refreshes the
    // access token if it's already expired — so this also covers "closed
    // the tab for a day, access token is stale" on app load.
    fetchMe()
      .then(setUser)
      .catch(() => {
        // Both tokens are dead (refresh failed too) — treat as logged out.
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiLogin({ email, password });
    persistAuthResponse(res);
    setUser(res.user);
  };

  const register = async (name: string, email: string, password: string, role: UserRole, grade?: number, semester?: number) => {
    const res = await registerAccount({ name, email, password, role, grade, semester });
    persistAuthResponse(res);
    setUser(res.user);
  };

  const logout = async () => {
    await logoutSession().catch(() => {
      // Best-effort — logoutSession() already clears local tokens even on failure.
    });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
