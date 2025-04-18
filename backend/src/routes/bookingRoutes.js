const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/auth');

// POST - Create a new booking
router.post(
  '/',
  authMiddleware.authenticate, // Ensure user is logged in
  [
    body('car_id').isInt().withMessage('Valid car ID is required'),
    body('start_date').isDate().withMessage('Valid start date is required'),
    body('end_date').isDate().withMessage('Valid end date is required'),
    body('end_date').custom((value, { req }) => {
      if (new Date(value) < new Date(req.body.start_date)) {
        throw new Error('End date must be after start date');
      }
      return true;
    })
  ],
  bookingController.createBooking
);

// GET - Get all bookings for current user (as renter)
router.get(
  '/renter',
  authMiddleware.authenticate,
  bookingController.getUserBookings
);

// GET - Get current bookings for user (as renter)
router.get(
  '/renter/current',
  authMiddleware.authenticate,
  bookingController.getCurrentUserBookings
);

// GET - Get past bookings for user (as renter)
router.get(
  '/renter/past',
  authMiddleware.authenticate,
  bookingController.getPastUserBookings
);

// GET - Get all bookings for host's cars
router.get(
  '/host',
  authMiddleware.authenticate,
  authMiddleware.isHost,
  bookingController.getHostBookings
);

// GET - Get current bookings for host's cars
router.get(
  '/host/current',
  authMiddleware.authenticate,
  authMiddleware.isHost,
  bookingController.getCurrentHostBookings
);

// GET - Get past bookings for host's cars
router.get(
  '/host/past',
  authMiddleware.authenticate,
  authMiddleware.isHost,
  bookingController.getPastHostBookings
);

// GET - Get pending bookings for host's cars
router.get(
  '/host/pending',
  authMiddleware.authenticate,
  authMiddleware.isHost,
  bookingController.getPendingHostBookings
);

// PATCH - Update booking status (accept/reject)
router.patch(
  '/:id/status',
  authMiddleware.authenticate,
  authMiddleware.isHost,
  [
    body('status').isIn(['accepted', 'rejected']).withMessage('Status must be either accepted or rejected')
  ],
  bookingController.updateBookingStatus
);

module.exports = router;
