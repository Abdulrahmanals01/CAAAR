const db = require('../config/database');

// Define all controller functions first
const getCarAvailability = async (req, res) => {
  try {
    const carId = req.params.id;

    // First, get the car details to check its overall availability period
    const carResult = await db.query('SELECT * FROM cars WHERE id = $1', [carId]);

    if (carResult.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const car = carResult.rows[0];

    // Then get all accepted and pending bookings for this car
    const bookingsResult = await db.query(
      `SELECT id, start_date, end_date, status
       FROM bookings
       WHERE car_id = $1
       AND status IN ('accepted', 'pending')
       ORDER BY start_date`,
      [carId]
    );

    // Process the data to create a more useful availability map
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const availabilityStart = new Date(car.availability_start) < today ? today : new Date(car.availability_start);      
    const availabilityEnd = new Date(car.availability_end);

    // Generate a day-by-day availability map
    const availabilityMap = {};
    let currentDate = new Date(availabilityStart);

    while (currentDate <= availabilityEnd) {
      const dateString = currentDate.toISOString().split('T')[0];
      availabilityMap[dateString] = true; // initially mark as available
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Mark booked days as unavailable
    bookingsResult.rows.forEach(booking => {
      let bookingStart = new Date(booking.start_date);
      const bookingEnd = new Date(booking.end_date);

      while (bookingStart <= bookingEnd) {
        const dateString = bookingStart.toISOString().split('T')[0];
        if (availabilityMap[dateString]) {
          availabilityMap[dateString] = false; // mark as unavailable
        }
        bookingStart.setDate(bookingStart.getDate() + 1);
      }
    });

    // Convert to array format for easier frontend processing
    const availabilityArray = Object.entries(availabilityMap).map(([date, available]) => ({
      date,
      available
    }));

    // Return the car info, booked periods, and availability map
    res.json({
      car: carResult.rows[0],
      bookedPeriods: bookingsResult.rows,
      availabilityDays: availabilityArray,
      availabilityStart: availabilityStart.toISOString().split('T')[0],
      availabilityEnd: availabilityEnd.toISOString().split('T')[0]
    });
  } catch (err) {
    console.error('Error getting car availability:', err);
    res.status(500).json({ message: 'Server error while getting car availability' });
  }
};

// More robust car availability check
const isCarAvailable = async (carId, startDate, endDate) => {
  try {
    // Validate inputs
    if (!carId || !startDate || !endDate) {
      throw new Error('Missing required parameters for availability check');
    }

    // Convert dates to ensure consistent format
    const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
    const formattedEndDate = new Date(endDate).toISOString().split('T')[0];

    // First check car exists and is set to available status
    const carCheck = await db.query(
      'SELECT availability_start, availability_end, status FROM cars WHERE id = $1',
      [carId]
    );

    if (carCheck.rows.length === 0) {
      throw new Error('Car not found');
    }

    const car = carCheck.rows[0];

    // Check car status
    if (car.status !== 'available') {
      return {
        available: false,
        reason: `Car is currently marked as ${car.status}`
      };
    }

    // Check if requested dates are within car's availability window
    if (formattedStartDate < car.availability_start || formattedEndDate > car.availability_end) {
      return {
        available: false,
        reason: `Car is only available from ${car.availability_start} to ${car.availability_end}`
      };
    }

    // Check for overlapping bookings
    const bookingCheck = await db.query(
      `SELECT id FROM bookings
       WHERE car_id = $1
       AND status IN ('accepted', 'pending')
       AND (
         (start_date <= $3 AND end_date >= $2) -- Overlap check
       )`,
      [carId, formattedStartDate, formattedEndDate]
    );

    if (bookingCheck.rows.length > 0) {
      return {
        available: false,
        reason: 'Car is already booked for the selected dates',
        conflictingBookings: bookingCheck.rows.map(row => row.id)
      };
    }

    return {
      available: true
    };
  } catch (error) {
    console.error('Error checking car availability:', error);
    throw error;
  }
};

// Create a new booking with improved validation
const createBooking = async (req, res) => {
  try {
    const { car_id, start_date, end_date } = req.body;
    const renter_id = req.user.id;

    // Check basic validation
    if (!car_id || !start_date || !end_date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if start date is before end date
    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Ensure booking doesn't start in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day
    if (new Date(start_date) < today) {
      return res.status(400).json({ message: 'Booking cannot start in the past' });
    }

    // Check if the user is trying to book their own car
    const carOwnerCheck = await db.query(
      'SELECT user_id FROM cars WHERE id = $1',
      [car_id]
    );

    if (carOwnerCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const carOwnerId = carOwnerCheck.rows[0].user_id;

    // Prevent booking own car
    if (carOwnerId === renter_id) {
      return res.status(403).json({
        message: 'You cannot book your own car'
      });
    }

    // Check if user is allowed to make bookings
    const userStatusCheck = await db.query(
      'SELECT status FROM users WHERE id = $1',
      [renter_id]
    );

    if (userStatusCheck.rows[0] && (userStatusCheck.rows[0].status === 'frozen' || userStatusCheck.rows[0].status === 'banned')) {
      return res.status(403).json({
        message: `Your account is currently ${userStatusCheck.rows[0].status}. You cannot make bookings.`
      });
    }

    // Check availability using the improved function
    const availabilityResult = await isCarAvailable(car_id, start_date, end_date);
    if (!availabilityResult.available) {
      return res.status(409).json({
        message: availabilityResult.reason
      });
    }

    // Calculate total price based on number of days and car price
    const carInfo = await db.query('SELECT price_per_day FROM cars WHERE id = $1', [car_id]);
    const pricePerDay = carInfo.rows[0].price_per_day;
    const days = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24)) + 1;
    const totalPrice = days * pricePerDay;

    // Get a client for transaction
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // Create booking
      const bookingResult = await client.query(
        `INSERT INTO bookings (renter_id, car_id, start_date, end_date, total_price, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')
         RETURNING *`,
        [renter_id, car_id, start_date, end_date, totalPrice]
      );

      const booking = bookingResult.rows[0];

      // Send initial message from renter to host about the booking
      const initialMessage = `I've requested to book your car from ${new Date(start_date).toLocaleDateString()} to ${new Date(end_date).toLocaleDateString()}.`;

      await client.query(
        'INSERT INTO messages (sender_id, receiver_id, booking_id, message, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [renter_id, carOwnerId, booking.id, initialMessage]
      );

      await client.query('COMMIT');

      // Return the created booking with additional info
      const bookingWithDetails = {
        ...booking,
        car_owner_id: carOwnerId
      };

      res.status(201).json(bookingWithDetails);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ message: 'Server error while creating booking' });
  }
};

// Helper function for status update
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    console.log(`Getting bookings for user ${userId} with role ${userRole}`);

    let query;
    let params;

    if (userRole === 'renter') {
      query = `
        SELECT b.*, c.brand, c.model, c.year, c.price_per_day, c.image,
          u.name as host_name, c.user_id as host_id
        FROM bookings b
        JOIN cars c ON b.car_id = c.id
        JOIN users u ON c.user_id = u.id
        WHERE b.renter_id = $1
        ORDER BY b.created_at DESC
      `;
      params = [userId];
    } else if (userRole === 'host') {
      // For hosts, get all bookings for their cars
      query = `
        SELECT b.*, c.brand, c.model, c.year, c.price_per_day, c.image,
          u.name as renter_name, b.renter_id, c.user_id as host_id
        FROM bookings b
        JOIN cars c ON b.car_id = c.id
        JOIN users u ON b.renter_id = u.id
        WHERE c.user_id = $1
        ORDER BY b.created_at DESC
      `;
      params = [userId];
    } else {
      // For other roles, return both renter and host bookings
      query = `
        SELECT b.*, c.brand, c.model, c.year, c.price_per_day, c.image,
          u_renter.name as renter_name, b.renter_id,
          u_host.name as host_name, c.user_id as host_id
        FROM bookings b
        JOIN cars c ON b.car_id = c.id
        JOIN users u_renter ON b.renter_id = u_renter.id
        JOIN users u_host ON c.user_id = u_host.id
        WHERE (b.renter_id = $1 OR c.user_id = $1)
        ORDER BY b.created_at DESC
      `;
      params = [userId];
    }

    console.log('Booking query:', query);
    const bookings = await db.query(query, params);
    console.log(`Found ${bookings.rows.length} bookings for user ${userId}`);

    res.json(bookings.rows);
  } catch (err) {
    console.error('Error getting bookings:', err);
    res.status(500).json({ message: 'Server error while getting bookings' });
  }
};

// Update booking status function with special handling for different statuses
const updateBookingStatus = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { status } = req.body;
    const userId = req.user.id;

    console.log(`Updating booking ${bookingId} to status: ${status}`);

    // Special handling for cancellation
    if (status === 'canceled') {
      return cancelBooking(req, res, bookingId);
    }

    // Special handling for acceptance
    if (status === 'accepted') {
      return acceptBooking(req, res, bookingId);
    }

    // Special handling for rejection
    if (status === 'rejected') {
      return rejectBooking(req, res, bookingId);
    }

    // For other statuses, continue with normal update
    if (!['pending', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    // Special handling for completed status
    if (status === 'completed') {
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');

        // Get booking details first for verification
        const bookingResult = await client.query(
          'SELECT b.*, c.user_id AS host_id FROM bookings b JOIN cars c ON b.car_id = c.id WHERE b.id = $1',
          [bookingId]
        );

        if (bookingResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ message: 'Booking not found' });
        }

        // Verify the user is the host
        const booking = bookingResult.rows[0];
        if (booking.host_id !== userId) {
          await client.query('ROLLBACK');
          return res.status(403).json({ message: 'Only the car owner can mark bookings as completed' });
        }

        // Temporarily disable trigger
        await client.query('ALTER TABLE bookings DISABLE TRIGGER check_booking_availability');

        // Update booking
        const result = await client.query(
          'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
          [status, bookingId]
        );

        // Re-enable trigger
        await client.query('ALTER TABLE bookings ENABLE TRIGGER check_booking_availability');

        await client.query('COMMIT');

        console.log('Booking completed successfully:', result.rows[0]);
        return res.json(result.rows[0]);
      } catch (err) {
        await client.query('ROLLBACK');
        // Make sure to re-enable the trigger even if there's an error
        try {
          await client.query('ALTER TABLE bookings ENABLE TRIGGER check_booking_availability');
        } catch (enableErr) {
          console.error('Error re-enabling trigger:', enableErr);
        }
        throw err;
      } finally {
        client.release();
      }
    } else {
      // For other statuses, use normal update
      const result = await db.query(
        'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
        [status, bookingId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      console.log('Booking updated successfully:', result.rows[0]);
      return res.json(result.rows[0]);
    }
  } catch (err) {
    console.error('Error updating booking status:', err);
    res.status(500).json({ message: 'Server error while updating booking status' });
  }
};

// Simple acceptBooking implementation
async function acceptBooking(req, res, bookingId) {
  try {
    const userId = req.user.id;
    
    // Get booking details first
    const bookingResult = await db.query(
      'SELECT b.*, c.user_id as host_id FROM bookings b JOIN cars c ON b.car_id = c.id WHERE b.id = $1',
      [bookingId]
    );
    
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const booking = bookingResult.rows[0];
    
    // Verify the user is the host
    if (booking.host_id !== userId) {
      return res.status(403).json({ message: 'Only the car owner can accept bookings' });
    }
    
    // Verify booking is in pending status
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: `Booking is already ${booking.status}` });
    }
    
    // Check for overlapping bookings
    const overlapCheck = await db.query(
      `SELECT COUNT(*) as count FROM bookings
       WHERE car_id = $1 AND id != $2 AND status = 'accepted'
       AND (start_date <= $3 AND end_date >= $4)`,
      [booking.car_id, bookingId, booking.end_date, booking.start_date]
    );
    
    if (parseInt(overlapCheck.rows[0].count) > 0) {
      return res.status(409).json({ 
        message: 'Cannot accept booking due to conflict with another accepted booking'
      });
    }
    
    // Update booking status
    const updateResult = await db.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['accepted', bookingId]
    );
    
    // Notify the renter (simplified)
    await db.query(
      'INSERT INTO messages (sender_id, receiver_id, booking_id, message, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [userId, booking.renter_id, bookingId, 'Your booking request has been accepted!']
    );
    
    return res.json({ 
      message: 'Booking accepted successfully', 
      id: bookingId, 
      status: 'accepted' 
    });
  } catch (err) {
    console.error('Error accepting booking:', err);
    return res.status(500).json({ message: 'Server error while accepting booking' });
  }
}

// Simple rejectBooking implementation
async function rejectBooking(req, res, bookingId) {
  try {
    const userId = req.user.id;
    
    // Get booking details first
    const bookingResult = await db.query(
      'SELECT b.*, c.user_id as host_id FROM bookings b JOIN cars c ON b.car_id = c.id WHERE b.id = $1',
      [bookingId]
    );
    
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const booking = bookingResult.rows[0];
    
    // Verify the user is the host
    if (booking.host_id !== userId) {
      return res.status(403).json({ message: 'Only the car owner can reject bookings' });
    }
    
    // Verify booking is in pending status
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: `Booking is already ${booking.status}` });
    }
    
    // Update booking status
    const updateResult = await db.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['rejected', bookingId]
    );
    
    // Notify the renter (simplified)
    await db.query(
      'INSERT INTO messages (sender_id, receiver_id, booking_id, message, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [userId, booking.renter_id, bookingId, 'Your booking request has been rejected.']
    );
    
    return res.json({ 
      message: 'Booking rejected successfully', 
      id: bookingId, 
      status: 'rejected' 
    });
  } catch (err) {
    console.error('Error rejecting booking:', err);
    return res.status(500).json({ message: 'Server error while rejecting booking' });
  }
}

// Simple cancelBooking implementation
async function cancelBooking(req, res, bookingId) {
  try {
    const userId = req.user.id;
    
    // Get booking details first
    const bookingResult = await db.query(
      'SELECT * FROM bookings WHERE id = $1',
      [bookingId]
    );
    
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const booking = bookingResult.rows[0];
    
    // Verify the user is the renter
    if (booking.renter_id !== userId) {
      return res.status(403).json({ message: 'Only the renter can cancel their booking' });
    }
    
    // Verify booking can be canceled (not completed)
    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Completed bookings cannot be canceled' });
    }
    
    // Verify booking is not already canceled
    if (booking.status === 'canceled') {
      return res.status(400).json({ message: 'Booking is already canceled' });
    }
    
    // Update booking status
    const updateResult = await db.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['canceled', bookingId]
    );
    
    // Get host ID for message
    const carResult = await db.query('SELECT user_id FROM cars WHERE id = $1', [booking.car_id]);
    const hostId = carResult.rows[0].user_id;
    
    // Notify the host (simplified)
    await db.query(
      'INSERT INTO messages (sender_id, receiver_id, booking_id, message, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [userId, hostId, bookingId, 'I have canceled my booking request.']
    );
    
    return res.json({ 
      message: 'Booking canceled successfully', 
      id: bookingId, 
      status: 'canceled' 
    });
  } catch (err) {
    console.error('Error canceling booking:', err);
    return res.status(500).json({ message: 'Server error while canceling booking' });
  }
}

// Export all functions at the bottom of the file
module.exports = {
  getCarAvailability,
  isCarAvailable,
  createBooking,
  getUserBookings,
  updateBookingStatus
};
