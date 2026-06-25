import api from './api';

const AuthService = {
    login: async (credentials) => {
        return await api.safeRequest(api.post('auth/login/', credentials));
    },

    register: async (userData) => {
        return await api.safeRequest(api.post('auth/register/', userData));
    },

    getUserProfile: async () => {
        return await api.safeRequest(api.get('auth/me/'));
    },

    logout: async () => {
        sessionStorage.removeItem('token');
    },
};

export default AuthService;
