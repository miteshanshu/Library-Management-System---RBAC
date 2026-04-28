import api from './axios';

export const adminApi = {
    // ===== User Management =====

    // Get all users with optional filters
    getUsers: (params = {}) => {
        const { role, limit = 50, offset = 0 } = params;
        const queryParams = new URLSearchParams();
        if (role) queryParams.append('role', role);
        queryParams.append('limit', limit);
        queryParams.append('offset', offset);
        return api.get(`/admin/users?${queryParams.toString()}`);
    },

    // Get login activity list
    getLoginList: () => {
        return api.get('/admin/login-list');
    },

    // Create new librarian
    createLibrarian: (data) => {
        return api.post('/admin/librarians', data);
    },

    // Toggle librarian active status
    toggleLibrarianStatus: (userId, isActive) => {
        return api.patch(`/admin/librarians/${userId}`, { is_active: isActive });
    },

    // ===== Book Management =====

    // Add new book
    addBook: (data) => {
        return api.post('/admin/books', data);
    },

    // Edit book
    editBook: (bookId, data) => {
        return api.patch(`/admin/books/${bookId}`, data);
    },

    // Delete book
    deleteBook: (bookId) => {
        return api.delete(`/admin/books/${bookId}`);
    },

    // ===== Book Copies Management =====

    getAllBookCopies: (params = {}) => {
        const { search, limit = 100, offset = 0 } = params;
        const queryParams = new URLSearchParams();
        if (search) queryParams.append('search', search);
        queryParams.append('limit', limit);
        queryParams.append('offset', offset);
        return api.get(`/admin/book-copies?${queryParams.toString()}`);
    },

    // Add book copy
    addBookCopy: (data) => {
        return api.post('/admin/book-copies', data);
    },

    // Update copy status
    updateCopyStatus: (copyId, status, conditionNotes) => {
        return api.patch(`/admin/book-copies/${copyId}/status`, {
            status,
            condition_notes: conditionNotes
        });
    },

    // Set book location
    setBookLocation: (copyId, locationId) => {
        return api.patch(`/admin/book-copies/${copyId}/location`, { location_id: locationId });
    },

    // Delete book copy
    deleteBookCopy: (copyId) => {
        return api.delete(`/admin/book-copies/${copyId}`);
    },

    // Add multiple copies at once with auto-generated barcodes
    addBulkCopies: (bookId, quantity, locationId = null) => {
        return api.post('/admin/book-copies/bulk', {
            book_id: bookId,
            quantity,
            location_id: locationId
        });
    },

    // Bulk delete book copies
    bulkDeleteBookCopies: (copyIds) => {
        return api.post('/admin/book-copies/bulk-delete', { copy_ids: copyIds });
    },

    // ===== Membership Management =====

    // Manage membership types (create/update/delete)
    manageMembershipTypes: (action, data) => {
        return api.post('/admin/membership-types', { action, ...data });
    },

    // Get all membership types
    getMembershipTypes: () => {
        return api.get('/admin/membership-types');
    },

    // Override member status
    overrideMember: (memberId, status) => {
        return api.patch(`/admin/members/${memberId}/override`, { status });
    },

    // ===== Fees & Loans =====

    // Waive fee
    waiveFee: (feeId) => {
        return api.post(`/admin/fees/${feeId}/waive`);
    },

    // Force close loan
    forceCloseLoan: (loanId) => {
        return api.post(`/admin/loans/${loanId}/force-close`);
    },
};

export default adminApi;
