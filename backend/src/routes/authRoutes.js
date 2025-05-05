const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser, switchRole } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const upload = require('../config/multer');

router.post('/register', upload.single('licenseImage'), register);

router.post('/login', login);

router.get('/me', authenticate, getCurrentUser);

router.post('/switch-role', authenticate, switchRole);

module.exports = router;
