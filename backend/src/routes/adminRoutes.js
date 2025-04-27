const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication and admin role
router.use(authMiddleware.authenticate);
router.use(authMiddleware.isAdmin);

// User management
router.get('/users', adminController.getAllUsers);
router.post('/users/:userId/freeze', adminController.freezeUser);
router.post('/users/:userId/unfreeze', adminController.unfreezeUser);
router.post('/users/:userId/ban', adminController.banUser);
router.post('/users/:userId/unban', adminController.unbanUser);

// Listing management
router.get('/listings', adminController.getAllListings);
router.get('/listings/deleted', adminController.getDeletedListings);
router.delete('/listings/:listingId', adminController.deleteListing);

module.exports = router;
