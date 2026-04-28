import api from './axios';

export const featuresApi = {
    // Reviews
    addReview: (bookId, rating, comment) => api.post('/features/reviews', { book_id: bookId, rating, comment }),
    getBookReviews: (bookId) => api.get(`/features/reviews/${bookId}`),

    // Reservations
    createReservation: (bookId) => api.post('/features/reservations', { book_id: bookId }),
    getMyReservations: () => api.get('/features/reservations/my'),
    cancelReservation: (id) => api.patch(`/features/reservations/${id}/cancel`),

    // Announcements
    getAnnouncements: () => api.get('/features/announcements'),
    createAnnouncement: (data) => api.post('/features/announcements', data),

    // Wishlist
    getWishlist: () => api.get('/features/wishlist'),
    addToWishlist: (bookId) => api.post('/features/wishlist', { book_id: bookId }),
    removeFromWishlist: (bookId) => api.delete(`/features/wishlist/${bookId}`),
};
