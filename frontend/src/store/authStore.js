import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const useAuthStore = create()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      
      setAuth: (user, token, refreshToken) => {
        if (token) {
          sessionStorage.setItem('token', token);
        } else {
          sessionStorage.removeItem('token');
        }
        
        if (refreshToken) {
          sessionStorage.setItem('refresh_token', refreshToken);
        } else {
          sessionStorage.removeItem('refresh_token');
        }

        set({ 
          user, 
          token, 
          refreshToken: refreshToken || null, 
          isAuthenticated: !!token 
        });
      },
      
      setToken: (token) => {
        if (token) {
          sessionStorage.setItem('token', token);
        }
        set({ token });
      },
      
      logout: () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('refresh_token');
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false });
      },
      
      updateUser: (user) => set({ user }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => {
        // Ensure tokens are in sessionStorage for the API interceptor after reload
        if (state?.token) {
          sessionStorage.setItem('token', state.token);
        }
        if (state?.refreshToken) {
          sessionStorage.setItem('refresh_token', state.refreshToken);
        }
      }
    }
  )
)

export default useAuthStore;
