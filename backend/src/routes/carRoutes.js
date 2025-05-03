const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const carController = require('../controllers/carController');
const bookingController = require('../controllers/bookingController');
const authMiddleware = require('../middleware/auth');
const upload = require('../config/multer');

// GET - Get all cars (public endpoint)
router.get('/', carController.getAllCars);

// GET - Get host's cars (must come BEFORE the /:id route)
router.get('/owner', authMiddleware.authenticate, authMiddleware.isHost, carController.getHostCars);

// Check if car has active bookings - this must come BEFORE the /:id route
router.get('/:id/active-bookings', authMiddleware.authenticate, authMiddleware.isHost, carController.checkActiveBookings);

// Update car availability - this must come BEFORE the /:id route
router.patch(
  '/:id/availability',
  authMiddleware.authenticate,
  authMiddleware.isHost,
  [
    body('availability_start').isDate().withMessage('Valid availability start date is required'),
    body('availability_end').isDate().withMessage('Valid availability end date is required')
  ],
  carController.updateCarAvailability
);

// Get car availability - this must come BEFORE the /:id route
router.get("/:carId/availability", bookingController.getCarAvailability);

// GET - Get car by ID (public endpoint)
router.get('/:id', carController.getCarById);

// POST - Create a new car listing
router.post(
  '/',
  authMiddleware.authenticate,
  authMiddleware.isHost,
  upload.single('image'),
  [
    body('brand').notEmpty().withMessage('Brand is required'),
    body('model').notEmpty().withMessage('Model is required'),
    body('year').isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Valid year is required'),
    body('plate').notEmpty().withMessage('Plate number is required'),
    body('color').notEmpty().withMessage('Color is required'),
    body('mileage').isInt({ min: 0 }).withMessage('Valid mileage is required'),
    body('price_per_day').isFloat({ min: 0 }).withMessage('Valid price per day is required'),
    body('location').notEmpty().withMessage('Location is required'),
    body('availability_start').isDate().withMessage('Valid availability start date is required'),
    body('availability_end').isDate().withMessage('Valid availability end date is required')
    // Note: Image validation happens in the controller after multer processes the file
  ],
  carController.createCar
);

// DELETE - Delete car by ID
router.delete('/:id', authMiddleware.authenticate, authMiddleware.isHost, carController.deleteCar);

module.exports = router;
