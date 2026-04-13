/**
 * Authentication Context
 * Manages global authentication state
 */

import React, {createContext, useState, useContext, useEffect, ReactNode} from 'react';
import {User, LoginResponse} from '@types';
import {authService} from '@services/authService';
import apiClient from '@services/apiClient';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<{message: string; email: string}>;
  logout: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Initialize - check if user is authenticated
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        const authenticated = await apiClient.isAuthenticated();
        if (authenticated) {
          await refreshUser();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  /**
   * Login user
   */
  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response: LoginResponse = await authService.login(email, password);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Register user
   */
  const register = async (data: any): Promise<{message: string; email: string}> => {
    try {
      setIsLoading(true);
      const response = await authService.register(data);
      return response;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout user
   */
  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      // Get refresh token from storage before clearing
      const refreshToken = await apiClient.getClient().defaults.headers.common.Authorization;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  };

  /**
   * Verify email
   */
  const verifyEmail = async (token: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response: LoginResponse = await authService.verifyEmail(token);
      setUser(response.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Email verification error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update user profile
   */
  const updateUser = async (data: Partial<User>): Promise<void> => {
    try {
      setIsLoading(true);
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh user data
   */
  const refreshUser = async (): Promise<void> => {
    try {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Refresh user error:', error);
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    verifyEmail,
    updateUser,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Custom hook to use auth context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
