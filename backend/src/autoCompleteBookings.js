const db = require('./config/database');

async function autoCompleteExpiredBookings() {
  try {
    // Get a client from the pool for transaction
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Find all accepted bookings where end_date has passed
      const expiredBookingsQuery = `
        UPDATE bookings
        SET status = 'completed'
        WHERE status = 'accepted'
        AND end_date < CURRENT_DATE
        RETURNING id, car_id, renter_id;
      `;
      
      const result = await client.query(expiredBookingsQuery);
      
      if (result.rows.length > 0) {
        console.log(`Auto-completed ${result.rows.length} bookings that have ended.`);
        
        // Send notification messages for each completed booking
        for (const booking of result.rows) {
          const messageQuery = `
            INSERT INTO messages (sender_id, receiver_id, booking_id, message, created_at)
            SELECT 
              c.user_id as sender_id,
              $1 as receiver_id,
              $2 as booking_id,
              'Your booking has been automatically marked as completed as the rental period has ended.' as message,
              NOW()
            FROM cars c
            WHERE c.id = $3;
          `;
          
          await client.query(messageQuery, [booking.renter_id, booking.id, booking.car_id]);
        }
      }
      
      await client.query('COMMIT');
      console.log('Auto-completion check completed successfully');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error in auto-completion transaction:', err);
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error auto-completing bookings:', err);
  }
}

// Run this function periodically
if (require.main === module) {
  autoCompleteExpiredBookings()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = autoCompleteExpiredBookings;
