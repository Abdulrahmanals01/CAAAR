const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const carRoutes = require('./carRoutes');
const bookingRoutes = require('./bookingRoutes');

// Map routes to their base paths
router.use('/auth', authRoutes);
router.use('/users', authRoutes);  // Add this line to handle /api/users/... requests
router.use('/cars', carRoutes);
router.use('/bookings', bookingRoutes);

module.exports = router;
