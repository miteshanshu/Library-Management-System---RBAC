const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const {
  createLibrarian,
  toggleLibrarianStatus,
  getAllUsers,
  getLoginList,
  addBook,
  editBook,
  deleteBook,
  addBookCopy,
  updateCopyStatus,
  setBookLocation,
  deleteBookCopy,
  getMembershipTypes,
  manageMembershipTypes,
  overrideMember,
  waiveFee,
  forceCloseLoan,
  getAllBookCopies,
  addBulkCopies,
  bulkDeleteBookCopies,
} = require('../controllers/adminController');

router.use(authenticate, requireRole('admin'));

router.post('/librarians', createLibrarian);

router.patch('/librarians/:user_id', toggleLibrarianStatus);

router.get('/users', getAllUsers);

router.get('/login-list', getLoginList);

router.post('/books', addBook);

router.patch('/books/:book_id', editBook);

router.delete('/books/:book_id', deleteBook);

router.post('/book-copies', addBookCopy);

router.post('/book-copies/bulk', addBulkCopies);

router.post('/book-copies/bulk-delete', bulkDeleteBookCopies);

router.get('/book-copies', getAllBookCopies);

router.patch('/book-copies/:copy_id/status', updateCopyStatus);

router.patch('/book-copies/:copy_id/location', setBookLocation);

router.delete('/book-copies/:copy_id', deleteBookCopy);

router.get('/membership-types', getMembershipTypes);

router.post('/membership-types', manageMembershipTypes);

router.patch('/members/:member_id/override', overrideMember);

router.post('/fees/:fee_id/waive', waiveFee);

router.post('/loans/:loan_id/force-close', forceCloseLoan);

module.exports = router;
