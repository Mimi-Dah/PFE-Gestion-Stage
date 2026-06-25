import axios from 'axios';
import useAuthStore from '../store/authStore';
import { ApiError, NetworkError, AuthError, BaseError } from '../utils/errors';
import { errorBus } from '../utils/errorBus';
import { wrapPromise } from '../utils/result';

const BACKEND_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';
const API_URL = `${BACKEND_URL}/api/v1/`;

export const mediaUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BACKEND_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

const api = axios.create({
  baseURL: API_URL,
});

// Serialise concurrent token refreshes — only one in-flight at a time.
let refreshPromise = null;

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    // Try to get token from Zustand store, fallback to sessionStorage
    const token = useAuthStore.getState().token || sessionStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      if (import.meta.env.MODE === 'development') {
        console.debug(`[API] Attaching token to ${config.url}`);
      }
    }

    // Sync the active language with Django's LocaleMiddleware
    const lang = localStorage.getItem('internhub-lang') || 'fr';
    config.headers['Accept-Language'] = lang;

    return config;
  },
  (error) => {
    const err = new BaseError(error.message);
    errorBus.emit(err);
    return Promise.reject(err);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // 1. Detect Network Errors (Pattern: Network Errors)
    if (!error.response) {
      const networkErr = new NetworkError('The server is unreachable. Please check your connection.');
      console.error('[API] Network Error:', networkErr);
      errorBus.emit(networkErr);
      return Promise.reject(networkErr);
    }

    const { status, data } = error.response;
    const backendError = data?.error || {};
    const originalRequest = error.config;
    
    // 2. Handle 401 Unauthorized errors (token expired)
    // Auth endpoints returning 401 mean wrong credentials — not an expired session.
    // Intercepting them would hide the real error behind "Session expired or invalid".
    const isAuthEndpoint =
      originalRequest.url?.includes('auth/login/') ||
      originalRequest.url?.includes('auth/refresh/');

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      const refreshToken = sessionStorage.getItem('refresh_token');

      if (import.meta.env.MODE === 'development') {
        console.debug('[API] 401 on protected route, attempting token refresh…');
      }

      if (refreshToken) {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${BACKEND_URL}/api/v1/auth/refresh/`, { refresh: refreshToken })
            .then((res) => {
              const newToken = res.data.access;
              const newRefresh = res.data.refresh;
              useAuthStore.getState().setToken(newToken);
              if (newRefresh) {
                sessionStorage.setItem('refresh_token', newRefresh);
                useAuthStore.getState().setAuth(
                  useAuthStore.getState().user,
                  newToken,
                  newRefresh
                );
              }
              return newToken;
            })
            .catch((refreshError) => {
              console.error('[API] Token refresh failed:', refreshError?.response?.data ?? refreshError.message);
              useAuthStore.getState().logout();
              if (window.location.pathname !== '/login') {
                window.location.href = '/login';
              }
              return Promise.reject(new AuthError('Session expirée. Veuillez vous reconnecter.'));
            })
            .finally(() => {
              refreshPromise = null;
            });
        }

        try {
          const newToken = await refreshPromise;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch {
          return Promise.reject(new AuthError('Session expirée. Veuillez vous reconnecter.'));
        }
      } else {
        useAuthStore.getState().logout();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(new AuthError());
      }
    }

    // Debug: log full server response in development to diagnose 401/403 origins
    if (import.meta.env.MODE === 'development') {
      console.error(`[API] ${status} on ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`, {
        requestBody: originalRequest.data,
        responseData: data,
      });
    }

    // 3. Wrap other API errors (Pattern: Meaningful Messages)
    const apiErr = new ApiError(
      backendError.message
        || data?.detail
        || data?.non_field_errors?.[0]
        || 'An unexpected error occurred',
      backendError.code || `HTTP_${status}`,
      status,
      backendError.details || data
    );
    apiErr.response = error.response;

    console.error(`[API] Error ${status}:`, apiErr);
    
    // Don't emit 404s or 400s globally as they are usually handled by components
    if (status >= 500) {
      errorBus.emit(apiErr);
    }
    
    return Promise.reject(apiErr);
  }
);

/**
 * Standardized API call that returns a Result type instead of throwing.
 * Use this in components to avoid boilerplate try-catch.
 */
api.safeRequest = function(promise) {
  return wrapPromise(promise);
};

export default api;
