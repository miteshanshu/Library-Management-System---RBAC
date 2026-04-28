import api from './axios';

export const librarianApi = {
    // ===== Student Management =====

    // Search student by card number or email
    searchStudent: (params) => {
        const queryParams = new URLSearchParams();
        if (params.card_number) queryParams.append('card_number', params.card_number);
        if (params.email) queryParams.append('email', params.email);
        return api.get(`/librarian/students/search?${queryParams.toString()}`);
    },

    // Get student loans
    getStudentLoans: (memberId) => {
        return api.get(`/librarian/students/${memberId}/loans`);
    },

    // Get student overdue loans
    getStudentOverdueLoans: (memberId) => {
        return api.get(`/librarian/students/${memberId}/overdue-loans`);
    },

    // Get student fees
    getStudentFees: (memberId) => {
        return api.get(`/librarian/students/${memberId}/fees`);
    },

    // Get student alerts
    getStudentAlerts: (memberId) => {
        return api.get(`/librarian/students/${memberId}/alerts`);
    },

    // ===== Book Copies =====

    // View book copy status
    viewBookCopyStatus: (copyId) => {
        return api.get(`/librarian/book-copies/${copyId}`);
    },

    // Mark copy as available
    markCopyAvailable: (copyId) => {
        return api.patch(`/librarian/book-copies/${copyId}/mark-available`);
    },

    // Add multiple copies at once with auto-generated barcodes
    addBulkCopies: (bookId, quantity, locationId = null) => {
        return api.post('/librarian/book-copies/bulk', {
            book_id: bookId,
            quantity,
            location_id: locationId
        });
    },

    // ===== Alerts =====

    // Generate overdue alerts
    generateOverdueAlerts: () => {
        return api.post('/librarian/alerts/generate-overdue');
    },

    // Mark alert as resolved
    markAlertResolved: (alertId) => {
        return api.patch(`/librarian/alerts/${alertId}/resolve`);
    },

    // ===== Books =====

    // View books with optional search and pagination
    viewBooks: (params = {}) => {
        const { limit = 50, offset = 0, search } = params;
        const queryParams = new URLSearchParams();
        queryParams.append('limit', limit);
        queryParams.append('offset', offset);
        if (search) queryParams.append('search', search);
        return api.get(`/librarian/books?${queryParams.toString()}`);
    },

    // Get book copies
    viewBookCopies: (bookId) => {
        return api.get(`/librarian/books/${bookId}/copies`);
    },

    // Get book stock status
    getBookStockStatus: (params = {}) => {
        const { limit = 50, offset = 0, search, out_of_stock_only } = params;
        const queryParams = new URLSearchParams();
        queryParams.append('limit', limit);
        queryParams.append('offset', offset);
        if (search) queryParams.append('search', search);
        if (out_of_stock_only) queryParams.append('out_of_stock_only', 'true');
        return api.get(`/librarian/books/stock-status?${queryParams.toString()}`);
    },

    // Scan barcode
    scanBarcode: (barcode) => {
        return api.post('/librarian/scan-barcode', { barcode });
    },

    // Create alert for a student
    createAlert: (data) => {
        return api.post('/librarian/alerts', data);
    },

    // ===== Reservations =====

    // Get all reservations
    getAllReservations: (params = {}) => {
        const { status, limit = 100, offset = 0 } = params;
        const queryParams = new URLSearchParams();
        if (status) queryParams.append('status', status);
        queryParams.append('limit', limit);
        queryParams.append('offset', offset);
        return api.get(`/librarian/reservations?${queryParams.toString()}`);
    },

    // Fulfill a reservation
    fulfillReservation: (reservationId) => {
        return api.patch(`/librarian/reservations/${reservationId}/fulfill`);
    },

    // Cancel a reservation
    cancelReservation: (reservationId) => {
        return api.patch(`/librarian/reservations/${reservationId}/cancel`);
    },
};

export default librarianApi;
