const express = require('express');
const router = express.Router();

// Import routes
const authRoutes = require('./authRoutes');
const carRoutes = require('./carRoutes');
const bookingRoutes = require('./bookingRoutes');

// Use routes
router.use('/auth', authRoutes);
router.use('/cars', carRoutes);
router.use('/bookings', bookingRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ message: 'API is running' });
});

module.exports = router;
