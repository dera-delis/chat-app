import axios from 'axios';
import { API_BASE_URL } from '../utils/env';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const isAuthEndpoint = (url: string) => {
  try {
    const parsed = new URL(url, API_BASE_URL);
    return (
      parsed.pathname.startsWith('/auth/login') ||
      parsed.pathname.startsWith('/auth/signup') ||
      parsed.pathname.startsWith('/auth/token')
    );
  } catch {
    return (
      url.startsWith('/auth/login') ||
      url.startsWith('/auth/signup') ||
      url.startsWith('/auth/token')
    );
  }
};

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const url = config.url || '';
    const isAuth = isAuthEndpoint(url);

    if (token && !isAuth) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    } else if (isAuth && config.headers) {
      delete config.headers.Authorization;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors and log responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuth = isAuthEndpoint(url);

    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout - backend server may not be responding';
    } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      error.message = 'Cannot connect to server. Please check if the backend is running.';
    } else if (!error.response) {
      error.message = 'No response from server. Please check if the backend is running.';
    }
    
    if (!isAuth && (error.response?.status === 401 || error.response?.status === 403)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

