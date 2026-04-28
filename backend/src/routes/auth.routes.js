const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { login, registerStudent, getCurrentUser, updateProfile, changePassword } = require('../controllers/authController');

router.post('/login', login);

router.post('/register', registerStudent);

router.get('/me', authenticate, getCurrentUser);
router.put('/profile', authenticate, updateProfile);
router.post('/change-password', authenticate, changePassword);

module.exports = router;
