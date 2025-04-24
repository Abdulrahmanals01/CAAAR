const db = require('./src/config/database');

async function rejectExpiredBookings() {
  console.log('Checking for expired booking requests...');
  
  try {
    // Get a client for transaction
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Find all pending bookings where end_date is in the past
      const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
      
      const expiredBookingsResult = await client.query(
        `SELECT b.id, b.renter_id, b.car_id, b.start_date, b.end_date, c.user_id AS host_id
         FROM bookings b
         JOIN cars c ON b.car_id = c.id
         WHERE b.status = 'pending'
         AND b.end_date < $1`,
        [currentDate]
      );
      
      const expiredBookings = expiredBookingsResult.rows;
      console.log(`Found ${expiredBookings.length} expired booking requests`);
      
      if (expiredBookings.length === 0) {
        await client.query('COMMIT');
        return;
      }
      
      // Disable the booking trigger temporarily to avoid constraint issues
      await client.query('ALTER TABLE bookings DISABLE TRIGGER check_booking_availability');
      
      for (const booking of expiredBookings) {
        // Update status to rejected with appropriate reason
        await client.query(
          `UPDATE bookings 
           SET status = 'rejected', 
               rejection_reason = 'Booking request expired: the requested dates have passed',
               updated_at = NOW()
           WHERE id = $1`,
          [booking.id]
        );
        
        // Add a message to notify the renter
        const message = `Your booking request for ${new Date(booking.start_date).toLocaleDateString()} to ${new Date(booking.end_date).toLocaleDateString()} has been automatically rejected because the requested dates have passed.`;
        
        await client.query(
          `INSERT INTO messages (sender_id, receiver_id, booking_id, message, created_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [booking.host_id, booking.renter_id, booking.id, message]
        );
        
        console.log(`Rejected expired booking #${booking.id}`);
      }
      
      // Re-enable the trigger
      await client.query('ALTER TABLE bookings ENABLE TRIGGER check_booking_availability');
      
      await client.query('COMMIT');
      console.log('Successfully processed expired bookings');
      
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
  } catch (error) {
    console.error('Error rejecting expired bookings:', error);
  } finally {
    // Exit if running as a standalone script
    if (require.main === module) {
      process.exit(0);
    }
  }
}

// Run immediately if executed directly
if (require.main === module) {
  rejectExpiredBookings();
} else {
  // Export for use in other files
  module.exports = rejectExpiredBookings;
}
