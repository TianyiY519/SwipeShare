import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  campus: 'RH' | 'LC';
  profile_picture: string | null;
  bio: string;
  phone_number: string;
  fordham_id: string;
  swipes_donated: number;
  swipes_received: number;
  reliability_score: string;
  is_email_verified: boolean;
  is_staff: boolean;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<any>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        if (token) {
          const res = await api.get('/api/auth/me/');
          setUser(res.data);
        }
      } catch {
        await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login/', { email, password });
    const { tokens, user: u } = res.data;
    await AsyncStorage.setItem('access_token', tokens.access);
    await AsyncStorage.setItem('refresh_token', tokens.refresh);
    setUser(u);
  };

  const register = async (data: any) => {
    const res = await api.post('/api/auth/register/', data);
    if (res.data.tokens) {
      await AsyncStorage.setItem('access_token', res.data.tokens.access);
      await AsyncStorage.setItem('refresh_token', res.data.tokens.refresh);
      setUser(res.data.user);
    }
    return res.data;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await api.get('/api/auth/me/');
      setUser(res.data);
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
