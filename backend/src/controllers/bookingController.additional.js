
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

exports.updateBookingStatus = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { status } = req.body;
    const userId = req.user.id;

    console.log(`Updating booking ${bookingId} to status: ${status}`);

    
    if (status === 'canceled') {
      return cancelBooking(req, res, bookingId);
    }

    
    if (status === 'accepted') {
      return acceptBooking(req, res, bookingId);
    }

    
    if (status === 'rejected') {
      return rejectBooking(req, res, bookingId);
    }

    
    if (!['pending', 'completed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    
    if (status === 'completed') {
      const client = await db.pool.connect();
      try {
        await client.query('BEGIN');

        
        const bookingResult = await client.query(
          'SELECT b.*, c.user_id AS host_id FROM bookings b JOIN cars c ON b.car_id = c.id WHERE b.id = $1',
          [bookingId]
        );

        if (bookingResult.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ message: 'Booking not found' });
        }

        
        const booking = bookingResult.rows[0];
        if (booking.host_id !== userId) {
          await client.query('ROLLBACK');
          return res.status(403).json({ message: 'Only the car owner can mark bookings as completed' });
        }

        
        await client.query('ALTER TABLE bookings DISABLE TRIGGER check_booking_availability');

        
        const result = await client.query(
          'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
          [status, bookingId]
        );

        
        await client.query('ALTER TABLE bookings ENABLE TRIGGER check_booking_availability');

        await client.query('COMMIT');

        console.log('Booking completed successfully:', result.rows[0]);
        return res.json(result.rows[0]);
      } catch (err) {
        await client.query('ROLLBACK');
        
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

async function acceptBooking(req, res, bookingId) {
  
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    
    await client.query('ALTER TABLE bookings DISABLE TRIGGER check_booking_availability');

    
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

    
    if (host_id !== req.user.id) {
      await client.query('ROLLBACK');
      await client.query('ALTER TABLE bookings ENABLE TRIGGER check_booking_availability');
      return res.status(403).json({ message: 'Only the car owner can accept bookings' });
    }

    
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

    
    await client.query(
      'UPDATE bookings SET status = $1 WHERE id = $2',
      ['accepted', bookingId]
    );

    
    const acceptMessage = `I've accepted your booking request for the dates ${new Date(start_date).toLocaleDateString()} to ${new Date(end_date).toLocaleDateString()}. Looking forward to it!`;

    await client.query(
      'INSERT INTO messages (sender_id, receiver_id, booking_id, message, created_at) VALUES ($1, $2, $3, $4, NOW())',       
      [host_id, renter_id, bookingId, acceptMessage]
    );

    
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

    
    await client.query('ALTER TABLE bookings ENABLE TRIGGER check_booking_availability');

    await client.query('COMMIT');

    
    const result = await client.query(
      'SELECT * FROM bookings WHERE id = $1',
      [bookingId]
    );

    console.log('Booking accepted and overlapping bookings rejected');
    return res.json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');

    
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
  
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    
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

    
    if (host_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ message: 'Only the car owner can reject bookings' });
    }

    
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

    
    const rejectionReason = overlapCheck.rows.length > 0
      ? 'This car has already been booked for these dates'
      : req.body.reason || 'Host declined the booking request';

    if (overlapCheck.rows.length > 0) {
      
      
      await client.query(
        `UPDATE bookings
         SET status = 'rejected',
             rejection_reason = $1
         WHERE id = $2`,
        [rejectionReason, bookingId]
      );
    } else {
      
      await client.query(
        `UPDATE bookings
         SET status = 'rejected',
             rejection_reason = $1
         WHERE id = $2`,
        [rejectionReason, bookingId]
      );
    }

    
    const rejectMessage = `I'm sorry, but I had to decline your booking request for the dates ${new Date(start_date).toLocaleDateString()} to ${new Date(end_date).toLocaleDateString()}. ${rejectionReason}`;

    await client.query(
      'INSERT INTO messages (sender_id, receiver_id, booking_id, message, created_at) VALUES ($1, $2, $3, $4, NOW())',       
      [host_id, renter_id, bookingId, rejectMessage]
    );

    await client.query('COMMIT');

    
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

    
    if (booking.renter_id !== userId) {
      return res.status(403).json({ message: 'You can only cancel your own bookings' });
    }

    
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      
      await client.query('ALTER TABLE bookings DISABLE TRIGGER check_booking_availability');

      
      const result = await client.query(
        'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
        ['canceled', bookingId]
      );

      
      const cancelMessage = `I've canceled my booking request for the dates ${new Date(booking.start_date).toLocaleDateString()} to ${new Date(booking.end_date).toLocaleDateString()}.`;

      await client.query(
        'INSERT INTO messages (sender_id, receiver_id, booking_id, message, created_at) VALUES ($1, $2, $3, $4, NOW())',     
        [userId, booking.host_id, bookingId, cancelMessage]
      );

      
      await client.query('ALTER TABLE bookings ENABLE TRIGGER check_booking_availability');

      await client.query('COMMIT');

      console.log('Booking canceled successfully');
      return res.json(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');

      
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
