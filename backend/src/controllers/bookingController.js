const db = require('../config/database');

const getCarAvailability = async (req, res) => {
  try {
    const carId = req.params.id;

    
    const carResult = await db.query('SELECT * FROM cars WHERE id = $1', [carId]);

    if (carResult.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const car = carResult.rows[0];

    
    const bookingsResult = await db.query(
      `SELECT id, start_date, end_date, status
       FROM bookings
       WHERE car_id = $1
       AND status IN ('accepted', 'pending')
       ORDER BY start_date`,
      [carId]
    );

    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const availabilityStart = new Date(car.availability_start) < today ? today : new Date(car.availability_start);      
    const availabilityEnd = new Date(car.availability_end);

    
    const availabilityMap = {};
    let currentDate = new Date(availabilityStart);

    while (currentDate <= availabilityEnd) {
      const dateString = currentDate.toISOString().split('T')[0];
      availabilityMap[dateString] = true; 
      currentDate.setDate(currentDate.getDate() + 1);
    }

    
    bookingsResult.rows.forEach(booking => {
      let bookingStart = new Date(booking.start_date);
      const bookingEnd = new Date(booking.end_date);

      while (bookingStart <= bookingEnd) {
        const dateString = bookingStart.toISOString().split('T')[0];
        if (availabilityMap[dateString]) {
          availabilityMap[dateString] = false; 
        }
        bookingStart.setDate(bookingStart.getDate() + 1);
      }
    });

    
    const availabilityArray = Object.entries(availabilityMap).map(([date, available]) => ({
      date,
      available
    }));

    
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

const isCarAvailable = async (carId, startDate, endDate) => {
  try {
    
    if (!carId || !startDate || !endDate) {
      throw new Error('Missing required parameters for availability check');
    }

    
    const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
    const formattedEndDate = new Date(endDate).toISOString().split('T')[0];

    
    const carCheck = await db.query(
      'SELECT availability_start, availability_end, status FROM cars WHERE id = $1',
      [carId]
    );

    if (carCheck.rows.length === 0) {
      throw new Error('Car not found');
    }

    const car = carCheck.rows[0];

    
    if (car.status !== 'available') {
      return {
        available: false,
        reason: `Car is currently marked as ${car.status}`
      };
    }

    
    if (formattedStartDate < car.availability_start || formattedEndDate > car.availability_end) {
      return {
        available: false,
        reason: `Car is only available from ${car.availability_start} to ${car.availability_end}`
      };
    }

    
    const bookingCheck = await db.query(
      `SELECT id FROM bookings
       WHERE car_id = $1
       AND status = 'accepted'
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

const createBooking = async (req, res) => {
  try {
    const { car_id, start_date, end_date } = req.body;
    const renter_id = req.user.id;

    
    if (!car_id || !start_date || !end_date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    
    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    if (new Date(start_date) < today) {
      return res.status(400).json({ message: 'Booking cannot start in the past' });
    }

    
    const carOwnerCheck = await db.query(
      'SELECT user_id FROM cars WHERE id = $1',
      [car_id]
    );

    if (carOwnerCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const carOwnerId = carOwnerCheck.rows[0].user_id;

    
    if (carOwnerId === renter_id) {
      return res.status(403).json({
        message: 'You cannot book your own car'
      });
    }

    
    const userStatusCheck = await db.query(
      'SELECT status FROM users WHERE id = $1',
      [renter_id]
    );

    if (userStatusCheck.rows[0] && (userStatusCheck.rows[0].status === 'frozen' || userStatusCheck.rows[0].status === 'banned')) {
      return res.status(403).json({
        message: `Your account is currently ${userStatusCheck.rows[0].status}. You cannot make bookings.`
      });
    }
    
    // Check if the user already has a pending booking for this car
    const pendingBookingCheck = await db.query(
      `SELECT COUNT(*) as count FROM bookings 
       WHERE car_id = $1 AND renter_id = $2 AND status = 'pending'`,
      [car_id, renter_id]
    );
    
    if (parseInt(pendingBookingCheck.rows[0].count) > 0) {
      return res.status(409).json({
        message: 'You already have a pending booking request for this car',
        has_pending_booking: true
      });
    }

    
    const availabilityResult = await isCarAvailable(car_id, start_date, end_date);
    if (!availabilityResult.available) {
      return res.status(409).json({
        message: availabilityResult.reason
      });
    }

    
    const carInfo = await db.query('SELECT price_per_day FROM cars WHERE id = $1', [car_id]);
    const pricePerDay = carInfo.rows[0].price_per_day;
    const days = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24)) + 1;
    const totalPrice = days * pricePerDay;

    
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      
      const bookingResult = await client.query(
        `INSERT INTO bookings (renter_id, car_id, start_date, end_date, total_price, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')
         RETURNING *`,
        [renter_id, car_id, start_date, end_date, totalPrice]
      );

      const booking = bookingResult.rows[0];

      
      const initialMessage = `I've requested to book your car from ${new Date(start_date).toLocaleDateString()} to ${new Date(end_date).toLocaleDateString()}.`;

      await client.query(
        'INSERT INTO messages (sender_id, receiver_id, booking_id, message, created_at) VALUES ($1, $2, $3, $4, NOW())',
        [renter_id, carOwnerId, booking.id, initialMessage]
      );

      await client.query('COMMIT');

      
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

const updateBookingStatus = async (req, res) => {
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
  try {
    const userId = req.user.id;
    
    
    const bookingResult = await db.query(
      'SELECT b.*, c.user_id as host_id FROM bookings b JOIN cars c ON b.car_id = c.id WHERE b.id = $1',
      [bookingId]
    );
    
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const booking = bookingResult.rows[0];
    
    
    if (booking.host_id !== userId) {
      return res.status(403).json({ message: 'Only the car owner can accept bookings' });
    }
    
    
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: `Booking is already ${booking.status}` });
    }
    
    
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
    
    
    const updateResult = await db.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['accepted', bookingId]
    );
    
    
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

async function rejectBooking(req, res, bookingId) {
  try {
    const userId = req.user.id;
    
    
    const bookingResult = await db.query(
      'SELECT b.*, c.user_id as host_id FROM bookings b JOIN cars c ON b.car_id = c.id WHERE b.id = $1',
      [bookingId]
    );
    
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const booking = bookingResult.rows[0];
    
    
    if (booking.host_id !== userId) {
      return res.status(403).json({ message: 'Only the car owner can reject bookings' });
    }
    
    
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: `Booking is already ${booking.status}` });
    }
    
    
    const updateResult = await db.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['rejected', bookingId]
    );
    
    
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

async function cancelBooking(req, res, bookingId) {
  try {
    const userId = req.user.id;
    
    
    const bookingResult = await db.query(
      'SELECT * FROM bookings WHERE id = $1',
      [bookingId]
    );
    
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const booking = bookingResult.rows[0];
    
    
    if (booking.renter_id !== userId) {
      return res.status(403).json({ message: 'Only the renter can cancel their booking' });
    }
    
    
    if (booking.status === 'completed') {
      return res.status(400).json({ message: 'Completed bookings cannot be canceled' });
    }
    
    
    if (booking.status === 'canceled') {
      return res.status(400).json({ message: 'Booking is already canceled' });
    }
    
    
    const updateResult = await db.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      ['canceled', bookingId]
    );
    
    
    const carResult = await db.query('SELECT user_id FROM cars WHERE id = $1', [booking.car_id]);
    const hostId = carResult.rows[0].user_id;
    
    
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

module.exports = {
  getCarAvailability,
  isCarAvailable,
  createBooking,
  getUserBookings,
  updateBookingStatus
};
