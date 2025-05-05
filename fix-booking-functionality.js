
const fs = require('fs');
const path = require('path');

const controllerPath = path.join(__dirname, 'backend/src/controllers/bookingController.js');

let content = fs.readFileSync(controllerPath, 'utf8');

const acceptBookingImpl = `
async function acceptBooking(req, res, bookingId) {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    
    const bookingResult = await client.query(
      'SELECT b.*, c.user_id AS host_id FROM bookings b JOIN cars c ON b.car_id = c.id WHERE b.id = $1',
      [bookingId]
    );
    
    if (bookingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    const booking = bookingResult.rows[0];
    
    
    if (booking.host_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ 
        success: false, 
        message: 'Only the car owner can accept bookings' 
      });
    }
    
    
    if (booking.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: \`Booking is already \${booking.status}\` 
      });
    }
    
    
    const conflictCheckResult = await client.query(
      \`SELECT COUNT(*) as count FROM bookings 
       WHERE car_id = $1 AND id != $2 AND status = 'accepted'
       AND (
         (start_date <= $3 AND end_date >= $4)
       )\`,
      [booking.car_id, bookingId, booking.end_date, booking.start_date]
    );
    
    if (parseInt(conflictCheckResult.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'There is already an accepted booking for this car during the requested period'
      });
    }
    
    
    await client.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2',
      ['accepted', bookingId]
    );
    
    
    await client.query(
      'INSERT INTO messages (sender_id, receiver_id, booking_id, message, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [req.user.id, booking.renter_id, bookingId, 'Your booking request has been accepted!']
    );
    
    await client.query('COMMIT');
    
    return res.json({ 
      success: true, 
      message: 'Booking accepted successfully', 
      id: bookingId,
      status: 'accepted' 
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error accepting booking:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while accepting booking' 
    });
  } finally {
    client.release();
  }
}`;

const rejectBookingImpl = `
async function rejectBooking(req, res, bookingId) {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    
    const bookingResult = await client.query(
      'SELECT b.*, c.user_id AS host_id FROM bookings b JOIN cars c ON b.car_id = c.id WHERE b.id = $1',
      [bookingId]
    );
    
    if (bookingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    const booking = bookingResult.rows[0];
    
    
    if (booking.host_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ 
        success: false, 
        message: 'Only the car owner can reject bookings' 
      });
    }
    
    
    if (booking.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: \`Booking is already \${booking.status}\` 
      });
    }
    
    
    await client.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2',
      ['rejected', bookingId]
    );
    
    
    await client.query(
      'INSERT INTO messages (sender_id, receiver_id, booking_id, message, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [req.user.id, booking.renter_id, bookingId, 'Your booking request has been rejected.']
    );
    
    await client.query('COMMIT');
    
    return res.json({ 
      success: true, 
      message: 'Booking rejected successfully', 
      id: bookingId,
      status: 'rejected' 
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error rejecting booking:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while rejecting booking' 
    });
  } finally {
    client.release();
  }
}`;

const cancelBookingImpl = `
async function cancelBooking(req, res, bookingId) {
  const client = await db.pool.connect();
  
  try {
    await client.query('BEGIN');
    
    
    const bookingResult = await client.query(
      'SELECT * FROM bookings WHERE id = $1',
      [bookingId]
    );
    
    if (bookingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    
    const booking = bookingResult.rows[0];
    
    
    if (booking.renter_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ 
        success: false, 
        message: 'Only the renter can cancel their bookings' 
      });
    }
    
    
    if (booking.status === 'completed') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: 'Completed bookings cannot be canceled' 
      });
    }
    
    
    if (booking.status === 'canceled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: 'Booking is already canceled' 
      });
    }
    
    
    await client.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2',
      ['canceled', bookingId]
    );
    
    
    const carResult = await client.query('SELECT user_id FROM cars WHERE id = $1', [booking.car_id]);
    const hostId = carResult.rows[0].user_id;
    
    
    await client.query(
      'INSERT INTO messages (sender_id, receiver_id, booking_id, message, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [req.user.id, hostId, bookingId, 'I have canceled my booking request.']
    );
    
    await client.query('COMMIT');
    
    return res.json({ 
      success: true, 
      message: 'Booking canceled successfully', 
      id: bookingId,
      status: 'canceled' 
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error canceling booking:', err);
    return res.status(500).json({ 
      success: false, 
      message: 'Server error while canceling booking' 
    });
  } finally {
    client.release();
  }
}`;

content = content.replace(/async function acceptBooking\(req, res, bookingId\) \{[\s\S]*?console\.log\("acceptBooking called for booking:", bookingId\);[\s\S]*?res\.json\(\{ message: "Booking accepted", id: bookingId \}\);[\s\S]*?\}/, acceptBookingImpl);
content = content.replace(/async function rejectBooking\(req, res, bookingId\) \{[\s\S]*?console\.log\("rejectBooking called for booking:", bookingId\);[\s\S]*?res\.json\(\{ message: "Booking rejected", id: bookingId \}\);[\s\S]*?\}/, rejectBookingImpl);
content = content.replace(/async function cancelBooking\(req, res, bookingId\) \{[\s\S]*?console\.log\("cancelBooking called for booking:", bookingId\);[\s\S]*?res\.json\(\{ message: "Booking canceled", id: bookingId \}\);[\s\S]*?\}/, cancelBookingImpl);

fs.writeFileSync(controllerPath, content);

console.log('Booking functionality has been fixed successfully');
