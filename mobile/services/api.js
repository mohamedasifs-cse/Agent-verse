import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Default API base URL from env or local network fallback
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.137.186:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach auth token from SecureStore if available
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('[API Interceptor] Error loading secure token:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for user-friendly error formatting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    let customError = {
      message: 'An unexpected network error occurred.',
      status: error.response?.status,
      original: error,
    };

    if (!error.response) {
      customError.message = 'Network failure. Please check your backend connection and IP settings.';
    } else if (error.response.status === 401) {
      customError.message = 'Session expired or invalid credentials. Please log in again.';
    } else if (error.response.status === 404) {
      customError.message = 'Requested API endpoint not found.';
    } else if (error.response.status >= 500) {
      customError.message = 'Backend server error. Please check server logs.';
    } else if (error.response.data && error.response.data.detail) {
      customError.message = error.response.data.detail;
    }

    return Promise.reject(customError);
  }
);

export { API_BASE_URL };
export default api;
