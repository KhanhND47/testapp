import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppUser } from '../lib/supabase';
import { api, getSessionToken, setSessionToken, clearSessionToken } from '../lib/api/client';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  login: (username: string, password: string, remember: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
  isWorker: boolean;
  isPaint: boolean;
  isPaintLead: boolean;
  isWorkerLead: boolean;
  isLead: boolean;
  isSales: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getSessionToken();
    if (token) {
      verifyToken();
    } else {
      setLoading(false);
    }
  }, []);

  const verifyToken = async () => {
    try {
      const { user: userData } = await api.post<{ user: AppUser }>('api-auth', '/verify');
      if (userData && userData.role) {
        setUser(userData);
      } else {
        clearSessionToken();
        setUser(null);
      }
    } catch {
      clearSessionToken();
      setUser(null);
    }
    setLoading(false);
  };

  const login = async (username: string, password: string, remember: boolean) => {
    try {
      const { user: userData, token } = await api.post<{ user: AppUser; token: string }>(
        'api-auth',
        '/login',
        { username, password }
      );

      if (!userData || !userData.role) {
        return { success: false, error: 'Ten dang nhap hoac mat khau khong dung.' };
      }

      setUser(userData);

      if (remember) {
        setSessionToken(token);
      } else {
        setSessionToken(token);
      }

      return { success: true };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Loi ket noi. Vui long thu lai.';
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setUser(null);
    clearSessionToken();
  };

  const userRole = user?.role ?? null;
  const isAdmin = userRole === 'admin';
  const isWorker = userRole === 'worker';
  const isPaint = userRole === 'paint';
  const isPaintLead = userRole === 'paint_lead';
  const isWorkerLead = userRole === 'worker_lead';
  const isSales = userRole === 'sales';
  const isLead = isPaintLead || isWorkerLead;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isAdmin,
      isWorker,
      isPaint,
      isPaintLead,
      isWorkerLead,
      isLead,
      isSales
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
