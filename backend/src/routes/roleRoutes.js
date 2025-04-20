const express = require('express');
const router = express.Router();
const { toggleUserRole } = require('../controllers/roleController');
const { authenticate } = require('../middleware/auth');

// @route   POST /api/roles/toggle
// @desc    Toggle user role between host and renter
// @access  Private
router.post('/toggle', authenticate, toggleUserRole);

module.exports = router;
