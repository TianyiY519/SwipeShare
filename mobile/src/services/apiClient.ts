/**
 * Axios API Client with JWT Authentication
 */

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {API_CONFIG, getBaseURL} from '@config/api';
import {AuthTokens} from '@types';

// Storage keys
const TOKEN_KEYS = {
  ACCESS: '@auth_access_token',
  REFRESH: '@auth_refresh_token',
};

class APIClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private refreshSubscribers: ((token: string) => void)[] = [];

  constructor() {
    this.client = axios.create({
      baseURL: getBaseURL(),
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Set up request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await this.getAccessToken();
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      },
    );

    // Response interceptor - handle 401 and refresh tokens
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // If error is 401 and we haven't retried yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Wait for the refresh to complete
            return new Promise(resolve => {
              this.refreshSubscribers.push((token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await this.getRefreshToken();
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            // Refresh the access token
            const response = await axios.post(
              `${getBaseURL()}${API_CONFIG.ENDPOINTS.REFRESH_TOKEN}`,
              {refresh: refreshToken},
            );

            const {access} = response.data;
            await this.setAccessToken(access);

            // Notify all subscribers
            this.refreshSubscribers.forEach(callback => callback(access));
            this.refreshSubscribers = [];

            // Retry the original request
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${access}`;
            }
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            await this.clearTokens();
            // You can emit an event here to navigate to login
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      },
    );
  }

  /**
   * Get access token from storage
   */
  private async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEYS.ACCESS);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  /**
   * Get refresh token from storage
   */
  private async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEYS.REFRESH);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  /**
   * Set access token in storage
   */
  private async setAccessToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(TOKEN_KEYS.ACCESS, token);
    } catch (error) {
      console.error('Error setting access token:', error);
    }
  }

  /**
   * Set tokens in storage
   */
  public async setTokens(tokens: AuthTokens): Promise<void> {
    try {
      await AsyncStorage.multiSet([
        [TOKEN_KEYS.ACCESS, tokens.access],
        [TOKEN_KEYS.REFRESH, tokens.refresh],
      ]);
    } catch (error) {
      console.error('Error setting tokens:', error);
      throw error;
    }
  }

  /**
   * Clear all tokens from storage
   */
  public async clearTokens(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEYS.ACCESS, TOKEN_KEYS.REFRESH]);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  /**
   * Check if user is authenticated
   */
  public async isAuthenticated(): Promise<boolean> {
    const accessToken = await this.getAccessToken();
    return !!accessToken;
  }

  /**
   * Get the Axios instance
   */
  public getClient(): AxiosInstance {
    return this.client;
  }

  /**
   * Make GET request
   */
  public async get<T>(url: string, config = {}): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  /**
   * Make POST request
   */
  public async post<T>(url: string, data?: any, config = {}): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /**
   * Make PUT request
   */
  public async put<T>(url: string, data?: any, config = {}): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  /**
   * Make PATCH request
   */
  public async patch<T>(url: string, data?: any, config = {}): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  /**
   * Make DELETE request
   */
  public async delete<T>(url: string, config = {}): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new APIClient();
export default apiClient;
