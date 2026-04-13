/**
 * Authentication Service
 * Handles user authentication, registration, and profile management
 */

import {API_CONFIG} from '@config/api';
import apiClient from './apiClient';
import {
  LoginResponse,
  RegisterRequest,
  User,
  UserStats,
} from '@types';

export const authService = {
  /**
   * Register a new user
   */
  register: async (data: RegisterRequest): Promise<{message: string; email: string}> => {
    const response = await apiClient.post(API_CONFIG.ENDPOINTS.REGISTER, data);
    return response;
  },

  /**
   * Login with email and password
   */
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      API_CONFIG.ENDPOINTS.LOGIN,
      {email, password},
    );

    // Store tokens
    await apiClient.setTokens(response.tokens);

    return response;
  },

  /**
   * Logout user
   */
  logout: async (refreshToken: string): Promise<void> => {
    try {
      await apiClient.post(API_CONFIG.ENDPOINTS.LOGOUT, {refresh: refreshToken});
    } finally {
      // Clear tokens regardless of API response
      await apiClient.clearTokens();
    }
  },

  /**
   * Verify email with token
   */
  verifyEmail: async (token: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      API_CONFIG.ENDPOINTS.VERIFY_EMAIL,
      {token},
    );

    // Store tokens
    await apiClient.setTokens(response.tokens);

    return response;
  },

  /**
   * Resend verification email
   */
  resendVerification: async (email: string): Promise<{message: string}> => {
    return apiClient.post(API_CONFIG.ENDPOINTS.RESEND_VERIFICATION, {email});
  },

  /**
   * Get current user profile
   */
  getCurrentUser: async (): Promise<User> => {
    return apiClient.get<User>(API_CONFIG.ENDPOINTS.ME);
  },

  /**
   * Update user profile
   */
  updateProfile: async (data: Partial<User>): Promise<User> => {
    return apiClient.put<User>(API_CONFIG.ENDPOINTS.ME, data);
  },

  /**
   * Change password
   */
  changePassword: async (
    oldPassword: string,
    newPassword: string,
    newPasswordConfirm: string,
  ): Promise<{message: string}> => {
    return apiClient.post(API_CONFIG.ENDPOINTS.CHANGE_PASSWORD, {
      old_password: oldPassword,
      new_password: newPassword,
      new_password_confirm: newPasswordConfirm,
    });
  },

  /**
   * Get user statistics
   */
  getUserStats: async (): Promise<UserStats> => {
    return apiClient.get<UserStats>(API_CONFIG.ENDPOINTS.USER_STATS);
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: async (): Promise<boolean> => {
    return apiClient.isAuthenticated();
  },
};

export default authService;
