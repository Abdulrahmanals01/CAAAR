const db = require('../config/database');

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const { car_id, start_date, end_date } = req.body;
    const renter_id = req.user.id;

    // Check basic validation
    if (!car_id || !start_date || !end_date) {
      return res.status(400).json({ message: 'Missing required fields' });
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

    // Check if car is already booked for these dates
    const availabilityCheck = await db.query(
      'SELECT * FROM is_car_available($1, $2, $3) as available',
      [car_id, start_date, end_date]
    );

    if (!availabilityCheck.rows[0].available) {
      return res.status(409).json({
        message: 'This car is already booked for these dates. Please choose different dates.'
      });
    }

    // Calculate total price based on number of days and car price
    const carInfo = await db.query('SELECT price_per_day FROM cars WHERE id = $1', [car_id]);
    if (carInfo.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }

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

      res.status(201).json(booking);
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

// Get user's bookings
exports.getUserBookings = async (req, res) => {
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

// Update booking status (normal method)
exports.updateBookingStatus = async (req, res) => {
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

// Special function to handle booking acceptance
async function acceptBooking(req, res, bookingId) {
  // Get a client from the pool for transaction
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // Disable the check_booking_availability trigger temporarily
    await client.query('ALTER TABLE bookings DISABLE TRIGGER check_booking_availability');

    // Get the booking details
    const bookingResult = await client.query(
      `SELECT b.*, c.user_id AS host_id, b.renter_id,
              u_renter.name AS renter_name
       FROM bookings b
       JOIN cars c ON b.car_id = c.id
       JOIN users u_renter ON b.renter_id = u_renter.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      await client.query('ALTER TABLE bookings ENABLE TRIGGER check_booking_availability');
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];
    const { car_id, start_date, end_date, host_id, renter_id } = booking;

    // Verify the current user is the host of this car
    if (host_id !== req.user.id) {
      await client.query('ROLLBACK');
      await client.query('ALTER TABLE bookings ENABLE TRIGGER check_booking_availability');
      return res.status(403).json({ message: 'Only the car owner can accept bookings' });
    }

    // Check if there are already any accepted bookings that overlap with this one
    const overlapCheck = await client.query(
      `SELECT id FROM bookings
       WHERE car_id = $1
       AND id != $2
       AND status = 'accepted'
       AND (
         (start_date <= $4 AND end_date >= $3) -- Overlap check
       )`,
      [car_id, bookingId, start_date, end_date]
    );

    if (overlapCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      await client.query('ALTER TABLE bookings ENABLE TRIGGER check_booking_availability');
      return res.status(409).json({
        message: 'This car has already been booked for these dates by another user'
      });
    }

    // Update this booking to 'accepted'
    await client.query(
      'UPDATE bookings SET status = $1 WHERE id = $2',
      ['accepted', bookingId]
    );

    // Send message from host to renter about the acceptance
    const acceptMessage = `I've accepted your booking request for the dates ${new Date(start_date).toLocaleDateString()} to ${new Date(end_date).toLocaleDateString()}. Looking forward to it!`;

    await client.query(
      'INSERT INTO messages (sender_id, receiver_id, booking_id, message, created_at) VALUES ($1, $2, $3, $4, NOW())',       
      [host_id, renter_id, bookingId, acceptMessage]
    );

    // Reject other pending bookings for the same car that overlap with this one
    const rejectResult = await client.query(
      `UPDATE bookings
       SET status = 'rejected',
           rejection_reason = 'Another booking for these dates has been accepted'
       WHERE car_id = $1
         AND id != $2
         AND status = 'pending'
         AND (
           (start_date <= $4 AND end_date >= $3) -- Overlap check
         )
       RETURNING id`,
      [car_id, bookingId, start_date, end_date]
    );

    console.log(`Rejected ${rejectResult.rowCount} overlapping bookings: ${JSON.stringify(rejectResult.rows.map(row => row.id))}`);

    // Re-enable the trigger
    await client.query('ALTER TABLE bookings ENABLE TRIGGER check_booking_availability');

    await client.query('COMMIT');

    // Get the updated booking
    const result = await client.query(
      'SELECT * FROM bookings WHERE id = $1',
      [bookingId]
    );

    console.log('Booking accepted and overlapping bookings rejected');
    return res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');

    // Make sure to re-enable the trigger even if there's an error
    try {
      await client.query('ALTER TABLE bookings ENABLE TRIGGER check_booking_availability');
    } catch (enableErr) {
      console.error('Error re-enabling trigger:', enableErr);
    }

    console.error('Error accepting booking:', err);
    return res.status(500).json({ message: 'Server error while accepting booking' });
  } finally {
    client.release();
  }
}

// Add specific function to handle rejection with proper checks
async function rejectBooking(req, res, bookingId) {
  // Get a client from the pool for transaction
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // Get the booking details
    const bookingResult = await client.query(
      `SELECT b.*, c.user_id AS host_id, b.renter_id
       FROM bookings b
       JOIN cars c ON b.car_id = c.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (bookingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];
    const { car_id, start_date, end_date, host_id, renter_id } = booking;

    // Verify the current user is the host of this car
    if (host_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Only the car owner can reject bookings' });
    }

    // Check if there are already any accepted bookings that overlap with this one
    const overlapCheck = await client.query(
      `SELECT id FROM bookings
       WHERE car_id = $1
       AND id != $2
       AND status = 'accepted'
       AND (
         (start_date <= $4 AND end_date >= $3) -- Overlap check
       )`,
      [car_id, bookingId, start_date, end_date]
    );

    // Set rejection reason
    const rejectionReason = overlapCheck.rows.length > 0
      ? 'This car has already been booked for these dates'
      : req.body.reason || 'Host declined the booking request';

    if (overlapCheck.rows.length > 0) {
      // If there's an accepted booking that overlaps, we should update this one to rejected
      // but with a specific reason
      await client.query(
        `UPDATE bookings
         SET status = 'rejected',
             rejection_reason = $1
         WHERE id = $2`,
        [rejectionReason, bookingId]
      );
    } else {
      // Normal rejection flow
      await client.query(
        `UPDATE bookings
         SET status = 'rejected',
             rejection_reason = $1
         WHERE id = $2`,
        [rejectionReason, bookingId]
      );
    }

    // Send message from host to renter about the rejection
    const rejectMessage = `I'm sorry, but I had to decline your booking request for the dates ${new Date(start_date).toLocaleDateString()} to ${new Date(end_date).toLocaleDateString()}. ${rejectionReason}`;

    await client.query(
      'INSERT INTO messages (sender_id, receiver_id, booking_id, message, created_at) VALUES ($1, $2, $3, $4, NOW())',       
      [host_id, renter_id, bookingId, rejectMessage]
    );

    await client.query('COMMIT');

    // Get the updated booking
    const result = await client.query(
      'SELECT * FROM bookings WHERE id = $1',
      [bookingId]
    );

    return res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error rejecting booking:', err);
    return res.status(500).json({ message: 'Server error while rejecting booking' });
  } finally {
    client.release();
  }
}

// Special function to handle cancellation
async function cancelBooking(req, res, bookingId) {
  try {
    const userId = req.user.id;

    // First check if the booking exists and belongs to this user
    const bookingCheck = await db.query(
      `SELECT b.*, c.user_id AS host_id
       FROM bookings b
       JOIN cars c ON b.car_id = c.id
       WHERE b.id = $1`,
      [bookingId]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = bookingCheck.rows[0];

    // Check if the user is the renter who made this booking
    if (booking.renter_id !== userId) {
      return res.status(403).json({ message: 'You can only cancel your own bookings' });
    }

    // Get a client from the pool for transaction
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // Disable the check_booking_availability trigger temporarily
      await client.query('ALTER TABLE bookings DISABLE TRIGGER check_booking_availability');

      // Update booking status to canceled
      const result = await client.query(
        'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
        ['canceled', bookingId]
      );

      // Send cancellation message from renter to host
      const cancelMessage = `I've canceled my booking request for the dates ${new Date(booking.start_date).toLocaleDateString()} to ${new Date(booking.end_date).toLocaleDateString()}.`;

      await client.query(
        'INSERT INTO messages (sender_id, receiver_id, booking_id, message, created_at) VALUES ($1, $2, $3, $4, NOW())',     
        [userId, booking.host_id, bookingId, cancelMessage]
      );

      // Re-enable the trigger
      await client.query('ALTER TABLE bookings ENABLE TRIGGER check_booking_availability');

      await client.query('COMMIT');

      console.log('Booking canceled successfully');
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
  } catch (err) {
    console.error('Error canceling booking:', err);
    return res.status(500).json({ message: 'Server error while canceling booking' });
  }
}

// Get available dates for a car
exports.getCarAvailability = async (req, res) => {
  try {
    const { carId } = req.params;

    // First, get the car details to check its overall availability period
    const carResult = await db.query('SELECT * FROM cars WHERE id = $1', [carId]);

    if (carResult.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }

    // Then get all accepted bookings for this car
    const bookingsResult = await db.query(
      `SELECT start_date, end_date
       FROM bookings
       WHERE car_id = $1
       AND status = 'accepted'
       ORDER BY start_date`,
      [carId]
    );

    // Return the car info and booked periods
    res.json({
      car: carResult.rows[0],
      bookedPeriods: bookingsResult.rows
    });
  } catch (err) {
    console.error('Error getting car availability:', err);
    res.status(500).json({ message: 'Server error while getting car availability' });
  }
};
