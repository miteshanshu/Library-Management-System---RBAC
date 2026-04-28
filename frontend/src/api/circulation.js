import api from './axios';

export const circulationApi = {
    // ===== Checkout & Return =====

    // Checkout book (uses stored procedure)
    checkoutBook: (barcode, memberId) => {
        return api.post('/circulation/checkout', { barcode, member_id: memberId });
    },

    // Issue book (with full validation)
    issueBook: (barcode, memberId) => {
        return api.post('/circulation/issue', { barcode, member_id: memberId });
    },

    // Return book
    returnBook: (loanId) => {
        return api.post('/circulation/return', { loan_id: loanId });
    },

    // ===== Loan Queries =====

    // Get loan details
    getLoanDetails: (loanId) => {
        return api.get(`/circulation/loans/${loanId}`);
    },

    // Get loans by member
    getLoansByMember: (memberId, status) => {
        const queryParams = new URLSearchParams();
        if (status) queryParams.append('status', status);
        const query = queryParams.toString();
        return api.get(`/circulation/member/${memberId}/loans${query ? '?' + query : ''}`);
    },

    // Get active loans by member
    getActiveLoansByMember: (memberId) => {
        return api.get(`/circulation/member/${memberId}/active-loans`);
    },

    // Get copy loan history
    getCopyHistory: (copyId) => {
        return api.get(`/circulation/copy/${copyId}/history`);
    },
};

export default circulationApi;
