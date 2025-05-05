const express = require('express');
const router = express.Router();
const { register } = require('../controllers/authController');
const upload = require('../config/multer');

router.post('/register', upload.single('licenseImage'), register);

module.exports = router;
