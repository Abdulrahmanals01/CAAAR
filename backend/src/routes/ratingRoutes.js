const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { authenticate } = require('../middleware/auth');

// Create a new rating
router.post('/', authenticate, ratingController.createRating);

// Check if a user can rate a booking
router.get('/check/:booking_id', authenticate, ratingController.checkRatingEligibility);

// Get ratings for a user
router.get('/user/:user_id', ratingController.getUserRatings);

// Get ratings for a car
router.get('/car/:car_id', ratingController.getCarRatings);

module.exports = router;
