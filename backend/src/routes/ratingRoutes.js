const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, ratingController.createRating);

router.get('/check/:booking_id', authenticate, ratingController.checkRatingEligibility);

router.get('/user/:user_id', ratingController.getUserRatings);

router.get('/car/:car_id', ratingController.getCarRatings);

module.exports = router;
