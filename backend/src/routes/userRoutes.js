const express = require('express');
const router = express.Router();
const { register } = require('../controllers/authController');
const upload = require('../config/multer');

// @route   POST api/users/register
// @desc    Register a user (alias for auth/register)
// @access  Public
router.post('/register', upload.single('licenseImage'), register);

module.exports = router;
