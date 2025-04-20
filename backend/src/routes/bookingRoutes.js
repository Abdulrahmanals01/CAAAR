const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/auth');

// POST - Create a new booking
router.post(
  '/',
  authMiddleware.authenticate,
  [
    body('car_id').isInt().withMessage('Car ID is required'),
    body('start_date').isDate().withMessage('Valid start date is required'),
    body('end_date').isDate().withMessage('Valid end date is required')
      .custom((value, { req }) => {
        if (new Date(value) < new Date(req.body.start_date)) {
          throw new Error('End date must be after start date');
        }
        return true;
      })
  ],
  bookingController.createBooking
);

// GET - Get user's bookings
router.get('/user', authMiddleware.authenticate, bookingController.getUserBookings);

// PUT - Update booking status
router.put('/:id/status', authMiddleware.authenticate, bookingController.updateBookingStatus);

module.exports = router;
