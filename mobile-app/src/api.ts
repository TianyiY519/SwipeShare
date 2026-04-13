import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// For web/iOS simulator: localhost
// For Android emulator: 10.0.2.2
// For physical device: use your computer's local IP (e.g., 192.168.1.xxx)
import { Platform } from 'react-native';
export const API_BASE = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach access token to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh expired tokens
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url?.includes('/api/auth/login/')
    ) {
      original._retry = true;
      const refresh = await AsyncStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const res = await axios.post(`${API_BASE}/api/auth/refresh/`, { refresh });
          const newAccess = res.data.access;
          await AsyncStorage.setItem('access_token', newAccess);
          original.headers.Authorization = `Bearer ${newAccess}`;
          return api(original);
        } catch {
          await AsyncStorage.multiRemove(['access_token', 'refresh_token']);
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
