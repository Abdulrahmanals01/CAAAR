const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const authMiddleware = require('../middleware/auth');

router.post('/switch', authMiddleware.authenticate, roleController.toggleUserRole);

module.exports = router;
