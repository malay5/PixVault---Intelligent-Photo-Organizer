const express = require('express');
const router = express.Router();
const { register, login, getMe, deleteAccount } = require('../controllers/authController');
const auth = require('../middleware/auth');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', register);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', login);

// @route   GET api/auth/me
// @desc    Get current user's profile
// @access  Private
router.get('/me', auth, getMe);

// @route   DELETE api/auth/me
// @desc    Delete current user's account
// @access  Private
router.delete('/me', auth, deleteAccount);

module.exports = router;
