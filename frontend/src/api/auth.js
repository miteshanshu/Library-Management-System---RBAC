import api from './axios';

export const authApi = {
    // Login user
    login: (email, password) => {
        return api.post('/auth/login', { email, password });
    },

    // Register new student
    register: (full_name, email, password) => {
        return api.post('/auth/register', { full_name, email, password });
    },

    // Get current user profile
    getMe: () => {
        return api.get('/auth/me');
    },

    updateProfile: (data) => {
        return api.put('/auth/profile', data);
    },

    changePassword: (current_password, new_password) => {
        return api.post('/auth/change-password', { current_password, new_password });
    },
};

export default authApi;
