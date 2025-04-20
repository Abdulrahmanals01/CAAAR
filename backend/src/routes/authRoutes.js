const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser } = require('../controllers/authController');
const { switchRole } = require('../controllers/switchRole');
const { authenticate } = require('../middleware/auth');
const upload = require('../config/multer');

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post('/register', upload.single('licenseImage'), register);

// @route   POST api/auth/login
// @desc    Login user & get token
// @access  Public
router.post('/login', login);

// @route   GET api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticate, getCurrentUser);

// @route   POST api/auth/switch-role
// @desc    Switch user role between host and renter
// @access  Private
router.post('/switch-role', authenticate, switchRole);

module.exports = router; 