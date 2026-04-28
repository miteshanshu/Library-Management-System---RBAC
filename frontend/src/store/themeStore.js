import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
    persist(
        (set, get) => ({
            // State
            mode: 'light', // 'light' | 'dark'

            // Actions
            toggleMode: () => {
                set((state) => ({
                    mode: state.mode === 'light' ? 'dark' : 'light',
                }));
            },

            setMode: (mode) => {
                set({ mode });
            },

            // Getters
            isDarkMode: () => get().mode === 'dark',
        }),
        {
            name: 'theme-storage', // localStorage key
        }
    )
);

export default useThemeStore;
