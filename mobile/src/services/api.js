import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import useAuthStore from '../store/authStore';
import { ApiError, NetworkError, AuthError, BaseError } from '../utils/errors';
import { errorBus } from '../utils/errorBus';
import { wrapPromise } from '../utils/result';
import { navigateTo } from '../navigation/navigationRef';

export { API_BASE_URL };

const api = axios.create({ baseURL: API_BASE_URL, timeout: 15000 });

api.interceptors.request.use(
  (config) => {
    config.headers['Accept-Language'] = 'fr';

    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      if (__DEV__) {
        console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`);
      }
    }
    return config;
  },
  (error) => {
    const err = new BaseError(error.message);
    errorBus.emit(err);
    return Promise.reject(err);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      const networkErr = new NetworkError('Le serveur est inaccessible. Vérifiez votre connexion.');
      errorBus.emit(networkErr);
      return Promise.reject(networkErr);
    }

    const { status, data } = error.response;
    const backendError = data?.error || {};
    const originalRequest = error.config;

    const isAuthEndpoint =
      originalRequest.url?.includes('auth/login/') ||
      originalRequest.url?.includes('auth/refresh/');

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      const { refreshToken } = useAuthStore.getState();

      if (__DEV__) {
        console.debug('[API] 401 on protected route, attempting token refresh…');
      }

      if (refreshToken) {
        try {
          const res = await axios.post(`${API_BASE_URL}auth/refresh/`, { refresh: refreshToken });
          if (res.status === 200) {
            const newToken = res.data.access;
            const newRefresh = res.data.refresh;
            useAuthStore.getState().setToken(newToken);
            if (newRefresh) {
              useAuthStore.getState().setAuth(useAuthStore.getState().user, newToken, newRefresh);
            }
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        } catch {
          useAuthStore.getState().logout();
          navigateTo('Login');
          return Promise.reject(new AuthError('Session expirée. Veuillez vous reconnecter.'));
        }
      } else {
        useAuthStore.getState().logout();
        navigateTo('Login');
        return Promise.reject(new AuthError());
      }
    }

    if (__DEV__) {
      console.error(`[API] ${status} on ${originalRequest.method?.toUpperCase()} ${originalRequest.url}`, {
        responseData: data,
      });
    }

    const apiErr = new ApiError(
      backendError.message || data?.detail || data?.non_field_errors?.[0] || 'Une erreur inattendue est survenue',
      backendError.code || `HTTP_${status}`,
      status,
      backendError.details || data
    );
    apiErr.response = error.response;

    if (status >= 500) {
      errorBus.emit(apiErr);
    }

    return Promise.reject(apiErr);
  }
);

api.safeRequest = function (promise) {
  return wrapPromise(promise);
};

export default api;
