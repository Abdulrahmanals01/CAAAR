const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const userStatusMiddleware = require('../middleware/userStatus');
const bookingController = require('../controllers/bookingController');

router.use(authMiddleware.authenticate);
router.use(userStatusMiddleware.checkUserStatus);

router.get('/availability/:id', bookingController.getCarAvailability);

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

router.get('/user', bookingController.getUserBookings);

router.put('/:id/status', bookingController.updateBookingStatus);

module.exports = router;
