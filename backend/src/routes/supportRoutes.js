const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const supportController = require('../controllers/supportController');
const authMiddleware = require('../middleware/auth');

router.post(
  '/inquiry',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('message').trim().notEmpty().withMessage('Message is required')
  ],
  supportController.submitInquiry
);

router.get(
  '/user-info',
  authMiddleware.authenticate,
  supportController.getUserInfo
);

module.exports = router;
