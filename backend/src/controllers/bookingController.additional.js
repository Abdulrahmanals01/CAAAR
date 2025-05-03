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

// Update booking status
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

// Helper functions for booking status updates
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
