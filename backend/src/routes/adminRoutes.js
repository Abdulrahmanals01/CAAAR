const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');

const adminAuth = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

router.use(auth.authenticate, adminAuth);

router.get('/users', adminController.getAllUsers);
router.post('/users/:userId/freeze', adminController.freezeUser);
router.post('/users/:userId/unfreeze', adminController.unfreezeUser);
router.post('/users/:userId/ban', adminController.banUser);
router.post('/users/:userId/unban', adminController.unbanUser);

router.get('/listings', adminController.getAllListings);
router.get('/listings/deleted', adminController.getDeletedListings);
router.delete('/listings/:listingId', adminController.deleteListing);

router.get('/actions', adminController.getAdminActions);

module.exports = router;
