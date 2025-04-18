const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const upload = require('../config/multer');

// Register user
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['host', 'renter']).withMessage('Role must be either host or renter'),
    body('phone').notEmpty().withMessage('Phone number is required'),
    body('id_number').notEmpty().withMessage('ID number is required')
  ],
  upload.single('license_image'),
  authController.register
);

// Login user
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required')
  ],
  authController.login
);

// Get current user
router.get('/me', authMiddleware.authenticate, authController.getCurrentUser);

module.exports = router;
