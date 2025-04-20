const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const carRoutes = require('./carRoutes');
const bookingRoutes = require('./bookingRoutes');
const roleRoutes = require('./roleRoutes');

router.use('/auth', authRoutes);
router.use('/cars', carRoutes);
router.use('/bookings', bookingRoutes);
router.use('/roles', roleRoutes);

module.exports = router;
