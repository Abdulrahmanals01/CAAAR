const db = require('../config/database');

// Fix the booking controller helper functions
const acceptBooking = async (req, res, bookingId) => {
  try {
    // 1. Check if booking exists and is still pending
    const bookingResult = await db.query(
      'SELECT b.*, c.user_id AS car_owner_id FROM bookings b JOIN cars c ON b.car_id = c.id WHERE b.id = $1',
      [bookingId]
    );
    
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const booking = bookingResult.rows[0];
    
    // 2. Check if the current user is the car owner
    if (booking.car_owner_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only accept bookings for your own cars' });
    }
    
    // 3. Check if booking status is pending
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: `Booking is already ${booking.status}` });
    }
    
    // 4. Check for conflicts with other accepted bookings
    const conflictCheck = await db.query(
      `SELECT COUNT(*) FROM bookings 
       WHERE car_id = $1 
       AND id != $2 
       AND status = 'accepted' 
       AND start_date <= $3 
       AND end_date >= $4`,
      [booking.car_id, bookingId, booking.end_date, booking.start_date]
    );
    
    if (parseInt(conflictCheck.rows[0].count) > 0) {
      return res.status(409).json({ 
        message: 'Cannot accept booking because of a conflict with another accepted booking'
      });
    }
    
    // 5. Update booking status to accepted
    await db.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2',
      ['accepted', bookingId]
    );
    
    // 6. Notify the renter (simplified)
    await db.query(
      'INSERT INTO messages (sender_id, receiver_id, booking_id, message) VALUES ($1, $2, $3, $4)',
      [req.user.id, booking.renter_id, bookingId, 'Your booking request has been accepted!']
    );
    
    // 7. Return success response
    return res.json({ 
      message: 'Booking accepted successfully',
      id: bookingId,
      status: 'accepted'
    });
  } catch (error) {
    console.error('Error accepting booking:', error);
    return res.status(500).json({ message: 'Server error while accepting booking' });
  }
};

const rejectBooking = async (req, res, bookingId) => {
  try {
    // 1. Check if booking exists and is still pending
    const bookingResult = await db.query(
      'SELECT b.*, c.user_id AS car_owner_id FROM bookings b JOIN cars c ON b.car_id = c.id WHERE b.id = $1',
      [bookingId]
    );
    
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const booking = bookingResult.rows[0];
    
    // 2. Check if the current user is the car owner
    if (booking.car_owner_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only reject bookings for your own cars' });
    }
    
    // 3. Check if booking status is pending
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: `Booking is already ${booking.status}` });
    }
    
    // 4. Update booking status to rejected
    await db.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2',
      ['rejected', bookingId]
    );
    
    // 5. Notify the renter (simplified)
    await db.query(
      'INSERT INTO messages (sender_id, receiver_id, booking_id, message) VALUES ($1, $2, $3, $4)',
      [req.user.id, booking.renter_id, bookingId, 'Your booking request has been rejected.']
    );
    
    // 6. Return success response
    return res.json({ 
      message: 'Booking rejected successfully',
      id: bookingId,
      status: 'rejected'
    });
  } catch (error) {
    console.error('Error rejecting booking:', error);
    return res.status(500).json({ message: 'Server error while rejecting booking' });
  }
};

const cancelBooking = async (req, res, bookingId) => {
  try {
    // 1. Check if booking exists
    const bookingResult = await db.query(
      'SELECT * FROM bookings WHERE id = $1',
      [bookingId]
    );
    
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const booking = bookingResult.rows[0];
    
    // 2. Check if the current user is the renter
    if (booking.renter_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only cancel your own bookings' });
    }
    
    // 3. Check if booking can be cancelled
    if (booking.status === 'completed' || booking.status === 'canceled') {
      return res.status(400).json({ 
        message: `Booking cannot be canceled because it is already ${booking.status}`
      });
    }
    
    // 4. Update booking status to canceled
    await db.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2',
      ['canceled', bookingId]
    );
    
    // 5. Get car owner id
    const carOwnerResult = await db.query(
      'SELECT user_id FROM cars WHERE id = $1',
      [booking.car_id]
    );
    
    // 6. Notify the car owner (simplified)
    await db.query(
      'INSERT INTO messages (sender_id, receiver_id, booking_id, message) VALUES ($1, $2, $3, $4)',
      [req.user.id, carOwnerResult.rows[0].user_id, bookingId, 'Booking has been canceled by the renter.']
    );
    
    // 7. Return success response
    return res.json({ 
      message: 'Booking canceled successfully',
      id: bookingId,
      status: 'canceled'
    });
  } catch (error) {
    console.error('Error canceling booking:', error);
    return res.status(500).json({ message: 'Server error while canceling booking' });
  }
};

// Export the helper functions
module.exports = { acceptBooking, rejectBooking, cancelBooking };
