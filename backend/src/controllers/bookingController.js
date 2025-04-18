const { validationResult } = require('express-validator');
const db = require('../config/database');

// Create a new booking
exports.createBooking = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { car_id, start_date, end_date } = req.body;
  const renter_id = req.user.id;

  try {
    // Check if the car exists
    const carCheck = await db.query('SELECT * FROM cars WHERE id = $1', [car_id]);
    if (carCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const car = carCheck.rows[0];

    // Prevent user from booking their own car
    if (car.user_id === renter_id) {
      return res.status(400).json({ message: 'You cannot book your own car' });
    }

    // Check if the car is available for the requested dates
    if (new Date(start_date) < new Date(car.availability_start) || 
        new Date(end_date) > new Date(car.availability_end)) {
      return res.status(400).json({ message: 'Car is not available for the selected dates' });
    }

    // Check if the car is already booked for these dates
    const bookingCheck = await db.query(
      `SELECT * FROM bookings 
       WHERE car_id = $1 
       AND status IN ('accepted', 'pending') 
       AND (
         (start_date <= $2 AND end_date >= $2) OR 
         (start_date <= $3 AND end_date >= $3) OR
         (start_date >= $2 AND end_date <= $3)
       )`,
      [car_id, start_date, end_date]
    );

    if (bookingCheck.rows.length > 0) {
      return res.status(400).json({ message: 'Car is already booked for some or all of the selected dates' });
    }

    // Calculate total price (days * price_per_day)
    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);
    const days = Math.ceil((endDateObj - startDateObj) / (1000 * 60 * 60 * 24)) + 1;
    const total_price = days * car.price_per_day;

    // Create the booking
    const newBooking = await db.query(
      `INSERT INTO bookings (renter_id, car_id, start_date, end_date, total_price, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [renter_id, car_id, start_date, end_date, total_price, 'pending']
    );

    // Get host details for the response
    const hostDetails = await db.query(
      'SELECT name, email FROM users WHERE id = $1',
      [car.user_id]
    );

    const bookingResponse = {
      ...newBooking.rows[0],
      car: {
        brand: car.brand,
        model: car.model,
        year: car.year,
        image: car.image
      },
      host: hostDetails.rows[0]
    };

    res.status(201).json(bookingResponse);
  } catch (err) {
    console.error('Error creating booking:', err.message);
    res.status(500).json({ message: 'Server error while creating booking' });
  }
};

// Get all bookings for current user (as renter)
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await db.query(
      `SELECT b.*, 
        c.brand, c.model, c.year, c.image, c.price_per_day,
        u.name as host_name, u.email as host_email
       FROM bookings b
       JOIN cars c ON b.car_id = c.id
       JOIN users u ON c.user_id = u.id
       WHERE b.renter_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );

    res.json(bookings.rows);
  } catch (err) {
    console.error('Error fetching user bookings:', err.message);
    res.status(500).json({ message: 'Server error while fetching bookings' });
  }
};

// Get current bookings for user (as renter)
exports.getCurrentUserBookings = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const bookings = await db.query(
      `SELECT b.*, 
        c.brand, c.model, c.year, c.image, c.price_per_day,
        u.name as host_name, u.email as host_email
       FROM bookings b
       JOIN cars c ON b.car_id = c.id
       JOIN users u ON c.user_id = u.id
       WHERE b.renter_id = $1
       AND b.status = 'accepted'
       AND b.end_date >= $2
       ORDER BY b.start_date ASC`,
      [req.user.id, today]
    );

    res.json(bookings.rows);
  } catch (err) {
    console.error('Error fetching current user bookings:', err.message);
    res.status(500).json({ message: 'Server error while fetching current bookings' });
  }
};

// Get past bookings for user (as renter)
exports.getPastUserBookings = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const bookings = await db.query(
      `SELECT b.*, 
        c.brand, c.model, c.year, c.image, c.price_per_day,
        u.name as host_name, u.email as host_email
       FROM bookings b
       JOIN cars c ON b.car_id = c.id
       JOIN users u ON c.user_id = u.id
       WHERE b.renter_id = $1
       AND (b.status = 'completed' OR (b.status = 'accepted' AND b.end_date < $2))
       ORDER BY b.end_date DESC`,
      [req.user.id, today]
    );

    res.json(bookings.rows);
  } catch (err) {
    console.error('Error fetching past user bookings:', err.message);
    res.status(500).json({ message: 'Server error while fetching past bookings' });
  }
};

// Get all bookings for host's cars
exports.getHostBookings = async (req, res) => {
  try {
    // Get the host ID from the authenticated user
    const hostId = req.user.id;
    
    // Query to get all bookings for cars owned by the host
    const bookings = await db.query(
      `SELECT b.*, 
        c.brand, c.model, c.year, c.image, c.price_per_day, c.user_id as host_id,
        u.name as renter_name, u.email as renter_email
       FROM bookings b
       JOIN cars c ON b.car_id = c.id
       JOIN users u ON b.renter_id = u.id
       WHERE c.user_id = $1
       ORDER BY b.created_at DESC`,
      [hostId]
    );

    res.json(bookings.rows);
  } catch (err) {
    console.error('Error fetching host bookings:', err.message);
    res.status(500).json({ message: 'Server error while fetching bookings' });
  }
};

// Get current bookings for host's cars
exports.getCurrentHostBookings = async (req, res) => {
  try {
    const hostId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    const bookings = await db.query(
      `SELECT b.*, 
        c.brand, c.model, c.year, c.image, c.price_per_day, c.user_id as host_id,
        u.name as renter_name, u.email as renter_email, u.phone as renter_phone
       FROM bookings b
       JOIN cars c ON b.car_id = c.id
       JOIN users u ON b.renter_id = u.id
       WHERE c.user_id = $1
       AND b.status = 'accepted'
       AND b.end_date >= $2
       ORDER BY b.start_date ASC`,
      [hostId, today]
    );

    res.json(bookings.rows);
  } catch (err) {
    console.error('Error fetching current host bookings:', err.message);
    res.status(500).json({ message: 'Server error while fetching current bookings' });
  }
};

// Get past bookings for host's cars
exports.getPastHostBookings = async (req, res) => {
  try {
    const hostId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    const bookings = await db.query(
      `SELECT b.*, 
        c.brand, c.model, c.year, c.image, c.price_per_day, c.user_id as host_id,
        u.name as renter_name, u.email as renter_email, u.phone as renter_phone
       FROM bookings b
       JOIN cars c ON b.car_id = c.id
       JOIN users u ON b.renter_id = u.id
       WHERE c.user_id = $1
       AND (b.status = 'completed' OR (b.status = 'accepted' AND b.end_date < $2))
       ORDER BY b.end_date DESC`,
      [hostId, today]
    );

    res.json(bookings.rows);
  } catch (err) {
    console.error('Error fetching past host bookings:', err.message);
    res.status(500).json({ message: 'Server error while fetching past bookings' });
  }
};

// Get all pending bookings for host's cars
exports.getPendingHostBookings = async (req, res) => {
  try {
    // Get the host ID from the authenticated user
    const hostId = req.user.id;
    
    // Query to get pending bookings for cars owned by the host
    const pendingBookings = await db.query(
      `SELECT b.*, 
        c.brand, c.model, c.year, c.image, c.price_per_day, c.user_id as host_id,
        u.name as renter_name, u.email as renter_email, u.phone as renter_phone
       FROM bookings b
       JOIN cars c ON b.car_id = c.id
       JOIN users u ON b.renter_id = u.id
       WHERE c.user_id = $1 AND b.status = 'pending'
       ORDER BY b.created_at DESC`,
      [hostId]
    );

    res.json(pendingBookings.rows);
  } catch (err) {
    console.error('Error fetching pending bookings:', err.message);
    res.status(500).json({ message: 'Server error while fetching pending bookings' });
  }
};

// Update booking status (host accepts or rejects booking)
exports.updateBookingStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { status } = req.body;
  const bookingId = req.params.id;

  try {
    // Check if booking exists
    const bookingCheck = await db.query('SELECT * FROM bookings WHERE id = $1', [bookingId]);
    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = bookingCheck.rows[0];

    // Check if user is the car owner
    const carOwnerCheck = await db.query(
      'SELECT user_id FROM cars WHERE id = $1',
      [booking.car_id]
    );

    if (carOwnerCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const carOwnerId = carOwnerCheck.rows[0].user_id;

    // Only car owner or admin can update booking status
    if (req.user.id !== carOwnerId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this booking' });
    }

    // If accepting, check if car is still available for these dates
    if (status === 'accepted') {
      const availabilityCheck = await db.query(
        `SELECT * FROM bookings 
         WHERE car_id = $1 
         AND id != $2
         AND status = 'accepted' 
         AND (
           (start_date <= $3 AND end_date >= $3) OR 
           (start_date <= $4 AND end_date >= $4) OR
           (start_date >= $3 AND end_date <= $4)
         )`,
        [booking.car_id, bookingId, booking.start_date, booking.end_date]
      );

      if (availabilityCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Car is no longer available for these dates' });
      }
    }

    // Update booking status
    const updatedBooking = await db.query(
      'UPDATE bookings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, bookingId]
    );

    // Get additional details for response
    const bookingDetailsQuery = await db.query(
      `SELECT b.*, 
        c.brand, c.model, c.year, c.image,
        u.name as renter_name, u.email as renter_email
       FROM bookings b
       JOIN cars c ON b.car_id = c.id
       JOIN users u ON b.renter_id = u.id
       WHERE b.id = $1`,
      [bookingId]
    );

    const bookingResponse = bookingDetailsQuery.rows[0];

    res.json(bookingResponse);
  } catch (err) {
    console.error('Error updating booking status:', err.message);
    res.status(500).json({ message: 'Server error while updating booking status' });
  }
};
