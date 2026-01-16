const isDev = import.meta.env.DEV;
const devApiBaseUrl = 'http://localhost:8000';
const devWsBaseUrl = 'ws://localhost:8000';
const prodApiBaseUrl = window.location.origin;

const isLocalHost = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// When running the app on localhost, always use the local backend.
const preferLocalBackend = isLocalHost;

export const API_BASE_URL = preferLocalBackend
  ? devApiBaseUrl
  : (import.meta.env.VITE_API_BASE_URL || (isDev ? devApiBaseUrl : prodApiBaseUrl));

export const WS_BASE_URL = preferLocalBackend
  ? devWsBaseUrl
  : (import.meta.env.VITE_WS_BASE_URL || API_BASE_URL.replace(/^http/, 'ws'));

