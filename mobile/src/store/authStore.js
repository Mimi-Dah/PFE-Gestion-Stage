import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

const asyncStorage = createJSONStorage(() => AsyncStorage);

const useAuthStore = create()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      rememberMe: true,

      setAuth: (user, token, refreshToken, rememberMe = true) => {
        set({
          user,
          token,
          refreshToken: refreshToken || null,
          isAuthenticated: !!token,
          rememberMe,
        });
      },

      setToken: (token) => {
        set({ token });
      },

      logout: () => {
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
      },

      updateUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      storage: asyncStorage,
      partialize: (state) => (state.rememberMe ? state : { rememberMe: false }),
    }
  )
);

export default useAuthStore;
