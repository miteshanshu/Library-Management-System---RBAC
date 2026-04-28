import api from './axios';

export const studentApi = {
    // ===== Personal Loans =====

    // Get my loans
    getMyLoans: () => {
        return api.get('/student/my-loans');
    },

    // Get my overdue loans
    getMyOverdueLoans: () => {
        return api.get('/student/my-overdue-loans');
    },

    // ===== Fees & Payments =====

    // Get my fees with summary
    getMyFees: () => {
        return api.get('/student/my-fees');
    },

    // Get payment history
    getPaymentHistory: () => {
        return api.get('/student/payment-history');
    },

    // ===== Alerts =====

    // Get my alerts
    getMyAlerts: () => {
        return api.get('/student/my-alerts');
    },

    // ===== Books Browsing =====

    // Browse books with filters
    browseBooks: (params = {}) => {
        const { limit = 50, offset = 0, search, genre_id, author_id } = params;
        const queryParams = new URLSearchParams();
        queryParams.append('limit', limit);
        queryParams.append('offset', offset);
        if (search) queryParams.append('search', search);
        if (genre_id) queryParams.append('genre_id', genre_id);
        if (author_id) queryParams.append('author_id', author_id);
        return api.get(`/student/books?${queryParams.toString()}`);
    },

    // Get book details
    getBookDetails: (bookId) => {
        return api.get(`/student/books/${bookId}`);
    },

    // Get available copies for a book
    getAvailableCopies: (bookId) => {
        return api.get(`/student/books/${bookId}/available-copies`);
    },
};

export default studentApi;
