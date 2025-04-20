const { validationResult } = require('express-validator');
const db = require('../config/database');

// Create a new booking
exports.createBooking = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { car_id, start_date, end_date } = req.body;
    const renter_id = req.user.id;

    // Check if user is a renter
    const userCheck = await db.query('SELECT role FROM users WHERE id = $1', [renter_id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userCheck.rows[0].role !== 'renter') {
      return res.status(403).json({ message: 'Only renters can book cars' });
    }

    // Check if car exists
    const carCheck = await db.query('SELECT * FROM cars WHERE id = $1', [car_id]);
    if (carCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const car = carCheck.rows[0];

    // Prevent booking your own car
    if (car.user_id === renter_id) {
      return res.status(403).json({ message: 'You cannot book your own car' });
    }

    // Check if car is available for the requested dates
    const availabilityCheck = await db.query(
      `SELECT * FROM bookings 
       WHERE car_id = $1 
       AND status IN ('pending', 'accepted') 
       AND (
         (start_date <= $3 AND end_date >= $2) -- Overlap check
       )`,
      [car_id, start_date, end_date]
    );

    if (availabilityCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Car is not available for the selected dates' });
    }

    // Calculate number of days
    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);
    const days = Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calculate total price
    const totalPrice = days * car.price_per_day;

    // Create booking
    const bookingInsert = await db.query(
      `INSERT INTO bookings
       (renter_id, car_id, start_date, end_date, total_price, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [renter_id, car_id, start_date, end_date, totalPrice, 'pending']
    );

    const booking = bookingInsert.rows[0];

    res.status(201).json(booking);
  } catch (err) {
    console.error('Error creating booking:', err.message);
    res.status(500).json({ message: 'Server error while creating booking' });
  }
};

// Get bookings for the current user
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let bookings;
    if (userRole === 'renter') {
      // Get bookings made by the renter
      bookings = await db.query(
        `SELECT b.*, c.brand, c.model, c.year, c.price_per_day, c.image, 
          u.name as host_name
         FROM bookings b
         JOIN cars c ON b.car_id = c.id
         JOIN users u ON c.user_id = u.id
         WHERE b.renter_id = $1
         ORDER BY b.created_at DESC`,
        [userId]
      );
    } else if (userRole === 'host') {
      // Get bookings for cars owned by the host
      bookings = await db.query(
        `SELECT b.*, c.brand, c.model, c.year, c.price_per_day, c.image, 
          u.name as renter_name
         FROM bookings b
         JOIN cars c ON b.car_id = c.id
         JOIN users u ON b.renter_id = u.id
         WHERE c.user_id = $1
         ORDER BY b.created_at DESC`,
        [userId]
      );
    } else {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(bookings.rows);
  } catch (err) {
    console.error('Error fetching bookings:', err.message);
    res.status(500).json({ message: 'Server error while fetching bookings' });
  }
};

// Update booking status (for hosts to accept/reject)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    // Validate status
    if (!['accepted', 'rejected', 'canceled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Get booking details
    const bookingCheck = await db.query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = bookingCheck.rows[0];

    // Check if user is the car owner (for accept/reject) or renter (for cancel)
    if (status === 'canceled') {
      // Only the renter can cancel their booking
      if (booking.renter_id !== userId) {
        return res.status(403).json({ message: 'Only the renter can cancel this booking' });
      }
    } else {
      // For accept/reject, check if user is the car owner
      const carCheck = await db.query('SELECT user_id FROM cars WHERE id = $1', [booking.car_id]);
      if (carCheck.rows.length === 0) {
        return res.status(404).json({ message: 'Car not found' });
      }

      if (carCheck.rows[0].user_id !== userId) {
        return res.status(403).json({ message: 'Only the car owner can accept/reject this booking' });
      }
    }

    // Update booking status
    const updatedBooking = await db.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    res.json(updatedBooking.rows[0]);
  } catch (err) {
    console.error('Error updating booking status:', err.message);
    res.status(500).json({ message: 'Server error while updating booking status' });
  }
};
