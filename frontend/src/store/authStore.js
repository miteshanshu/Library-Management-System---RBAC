import { create } from 'zustand';
import { authApi } from '../api/auth';

const readStoredUser = () => {
    const rawUser = localStorage.getItem('user');

    if (!rawUser || rawUser === 'undefined' || rawUser === 'null') {
        return null;
    }

    try {
        return JSON.parse(rawUser);
    } catch (_error) {
        localStorage.removeItem('user');
        return null;
    }
};

const useAuthStore = create((set, get) => ({
    // State
    user: readStoredUser(),
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    isLoading: false,
    isInitialized: false,
    error: null,

    // Actions
    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authApi.login(email, password);
            const { token, user } = response.data || {};

            if (!token || !user) {
                throw new Error(response.message || 'Login response was incomplete');
            }

            // Store in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            set({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
                isInitialized: true,
                error: null,
            });

            return { success: true, user };
        } catch (error) {
            set({
                isLoading: false,
                error: error.message || 'Login failed',
            });
            return { success: false, error: error.message };
        }
    },

    register: async (full_name, email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authApi.register(full_name, email, password);
            const { token, user } = response.data || {};

            if (!token || !user) {
                throw new Error(response.message || 'Registration response was incomplete');
            }

            // Store in localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            set({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
                isInitialized: true,
                error: null,
            });

            return { success: true, user };
        } catch (error) {
            set({
                isLoading: false,
                error: error.message || 'Registration failed',
            });
            return { success: false, error: error.message };
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({
            user: null,
            token: null,
            isAuthenticated: false,
            isInitialized: true,
            error: null,
        });
    },

    checkAuth: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            set({ isAuthenticated: false, user: null, token: null, isInitialized: true, isLoading: false });
            return false;
        }

        set({ isLoading: true, isInitialized: false });
        try {
            const response = await authApi.getMe();
            const user = response.data;

            if (!user) {
                throw new Error(response.message || 'User profile response was incomplete');
            }

            localStorage.setItem('user', JSON.stringify(user));
            set({
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
                isInitialized: true,
            });
            return true;
        } catch (error) {
            // Token invalid, clear auth
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                isInitialized: true,
            });
            return false;
        }
    },

    clearError: () => set({ error: null }),

    // Getters
    getRole: () => get().user?.role || null,
    isAdmin: () => get().user?.role === 'admin',
    isLibrarian: () => get().user?.role === 'librarian',
    isStudent: () => get().user?.role === 'student',
}));

export default useAuthStore;
