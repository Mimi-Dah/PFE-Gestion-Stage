import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useLayoutStore = create(
  persist(
    (set) => ({
      isDarkMode: false,
      isSidebarOpen: true,
      language: 'fr',
      toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: 'internhub-layout-storage',
    }
  )
);

export default useLayoutStore;
