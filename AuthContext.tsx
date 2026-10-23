import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, UserStats } from '../types';
import { api } from '../services/apiClient';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isOffline: boolean;
  stats: UserStats | null;
  aiAvailable: boolean;
  showEmergencyModal: boolean;
  setShowEmergencyModal: (show: boolean) => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  quickDemoLogin: () => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  changePassword: (oldP: string, newP: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<string>;
  refreshStats: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(api.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [aiAvailable, setAiAvailable] = useState<boolean>(true);
  const [showEmergencyModal, setShowEmergencyModal] = useState<boolean>(false);

  // Monitor online / offline state
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check AI availability
  useEffect(() => {
    api.getAIStatus()
      .then(res => setAiAvailable(res.available))
      .catch(() => setAiAvailable(false));
  }, []);

  const refreshUser = useCallback(async () => {
    if (!api.getToken()) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.getMe();
      setUser(res.user);
      const s = await api.getStats();
      setStats(s);
    } catch (err) {
      console.warn('Could not restore session, clearing auth token');
      api.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    if (!user) return;
    try {
      const s = await api.getStats();
      setStats(s);
    } catch (err) {
      console.warn('Failed to refresh stats:', err);
    }
  }, [user]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setToken(res.token);
    setUser(res.user);
    const s = await api.getStats();
    setStats(s);
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    setToken(res.token);
    setUser(res.user);
    const s = await api.getStats();
    setStats(s);
  };

  const quickDemoLogin = async () => {
    const res = await api.demoLogin();
    setToken(res.token);
    setUser(res.user);
    const s = await api.getStats();
    setStats(s);
  };

  const logout = () => {
    api.logout();
    setToken(null);
    setUser(null);
    setStats(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    const res = await api.updateProfile(updates);
    setUser(res.user);
  };

  const changePassword = async (oldP: string, newP: string) => {
    await api.changePassword(oldP, newP);
  };

  const forgotPassword = async (email: string): Promise<string> => {
    const res = await api.forgotPassword(email);
    return res.message;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isOffline,
        stats,
        aiAvailable,
        showEmergencyModal,
        setShowEmergencyModal,
        login,
        register,
        quickDemoLogin,
        logout,
        updateProfile,
        changePassword,
        forgotPassword,
        refreshStats,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
