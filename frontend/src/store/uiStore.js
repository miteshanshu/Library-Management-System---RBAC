import { create } from 'zustand';

const useUIStore = create((set) => ({
    snackbar: {
        open: false,
        message: '',
        severity: 'info', // 'success' | 'info' | 'warning' | 'error'
    },
    showSnackbar: (message, severity = 'info') => set({
        snackbar: { open: true, message, severity }
    }),
    hideSnackbar: () => set((state) => ({
        snackbar: { ...state.snackbar, open: false }
    })),
}));

export default useUIStore;
