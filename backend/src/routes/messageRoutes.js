const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authenticate } = require('../middleware/auth');

// Apply authenticate middleware to all routes
router.get('/', authenticate, messageController.getAllConversations);
router.get('/unread/count', authenticate, messageController.getUnreadCount);
router.get('/booking/:bookingId', authenticate, messageController.getBookingMessages);
router.get('/:userId', authenticate, messageController.getConversation);
router.post('/', authenticate, messageController.sendMessage);

module.exports = router;
