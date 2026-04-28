const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const {
  searchStudent,
  getStudentLoans,
  getStudentOverdueLoans,
  getStudentFees,
  getStudentAlerts,
  viewBookCopyStatus,
  markCopyAvailable,
  generateOverdueAlerts,
  markAlertResolved,
  createAlert,
  viewBooks,
  viewBookCopies,
  scanBarcode,
  getBookStockStatus,
} = require('../controllers/librarianController');

const { addBulkCopies } = require('../controllers/adminController');

router.use(authenticate, requireRole('librarian', 'admin'));

router.get('/students/search', searchStudent);

router.get('/students/:member_id/loans', getStudentLoans);

router.get('/students/:member_id/overdue-loans', getStudentOverdueLoans);

router.get('/students/:member_id/fees', getStudentFees);

router.get('/students/:member_id/alerts', getStudentAlerts);

router.get('/book-copies/:copy_id', viewBookCopyStatus);

router.patch('/book-copies/:copy_id/mark-available', markCopyAvailable);

// Librarians can also add bulk copies
router.post('/book-copies/bulk', addBulkCopies);

router.post('/alerts/generate-overdue', generateOverdueAlerts);

router.patch('/alerts/:alert_id/resolve', markAlertResolved);

router.post('/alerts', createAlert);

router.get('/books/stock-status', getBookStockStatus);

router.get('/books/:book_id/copies', viewBookCopies);

router.get('/books', viewBooks);

router.post('/scan-barcode', scanBarcode);

// Reservations management
const { getAllReservations, fulfillReservation, cancelReservation } = require('../controllers/reservationsController');
router.get('/reservations', getAllReservations);
router.patch('/reservations/:id/fulfill', fulfillReservation);
router.patch('/reservations/:id/cancel', cancelReservation);

module.exports = router;

