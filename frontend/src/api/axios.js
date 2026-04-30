import axios from 'axios';

// Create axios instance with base configuration
const BASE_URL =
    import.meta.env.VITE_API_URL ||
    process.env.REACT_APP_API_URL ||
    'https://library-management-system-rbac.onrender.com/api';

const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000,
});

// Request interceptor - add auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - handle errors and extract data
api.interceptors.response.use(
    (response) => {
        const envelope = response.data;
        const normalizedData =
            envelope && typeof envelope === 'object' && 'data' in envelope
                ? envelope.data
                : envelope;

        return {
            ...response,
            rawData: envelope,
            success: envelope?.success ?? true,
            message: envelope?.message,
            data: normalizedData,
        };
    },
    (error) => {
        // Handle different error scenarios
        if (error.response) {
            const { status, data } = error.response;

            // Token expired or invalid - clear auth and redirect
            if (status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Only redirect if not already on login page
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            }

            // Handle forbidden access (RBAC)
            if (status === 403) {
                return Promise.reject(new Error('Access denied'));
            }

            // Return error message from backend
            const message = data?.message || 'An error occurred';
            return Promise.reject(new Error(message));
        }

        if (error.request) {
            return Promise.reject(new Error('Network error. Please check your connection.'));
        }

        return Promise.reject(error);
    }
);

export default api;
