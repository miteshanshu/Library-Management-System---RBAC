const express = require('express');
const router = express.Router();
const { authenticate, requireRole } = require('../middleware/auth');
const reviewsController = require('../controllers/reviewsController');
const reservationsController = require('../controllers/reservationsController');
const announcementsController = require('../controllers/announcementsController');
const wishlistController = require('../controllers/wishlistController');

// Review Routes
router.post('/reviews', authenticate, reviewsController.addReview);
router.get('/reviews/:bookId', reviewsController.getBookReviews);

// Reservation Routes
router.post('/reservations', authenticate, reservationsController.createReservation);
router.get('/reservations/my', authenticate, reservationsController.getMyReservations);
router.patch('/reservations/:id/cancel', authenticate, reservationsController.cancelReservation);

// Announcement Routes
router.get('/announcements', authenticate, announcementsController.getAnnouncements);
router.post('/announcements', authenticate, requireRole('admin'), announcementsController.createAnnouncement);

// Wishlist Routes
router.get('/wishlist', authenticate, wishlistController.getWishlist);
router.post('/wishlist', authenticate, wishlistController.addToWishlist);
router.delete('/wishlist/:bookId', authenticate, wishlistController.removeFromWishlist);

module.exports = router;
