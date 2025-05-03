const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const userStatusMiddleware = require('../middleware/userStatus');
const bookingController = require('../controllers/bookingController');

// Protect all routes with authentication and status check
router.use(authMiddleware.authenticate);
router.use(userStatusMiddleware.checkUserStatus);

// GET - Get car availability
router.get('/availability/:carId', bookingController.getCarAvailability);

// POST - Create a new booking
router.post(
  '/',
  [
    check('car_id', 'Car ID is required').not().isEmpty(),
    check('start_date', 'Start date is required').isISO8601().toDate(),
    check('end_date', 'End date is required').isISO8601().toDate()
      .custom((end_date, { req }) => {
        if (end_date < req.body.start_date) {
          throw new Error('End date must be after start date');
        }
        return true;
      })
  ],
  bookingController.createBooking
);

// GET - Get user's bookings
router.get('/user', bookingController.getUserBookings);

// PUT - Update booking status
router.put('/:id/status', bookingController.updateBookingStatus);

module.exports = router;
