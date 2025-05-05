const db = require('./config/database');

async function autoCompleteBookings() {
  try {
    console.log('Running auto-complete bookings check...');
    
    const today = new Date().toISOString().split('T')[0];
    
    
    const result = await db.query(
      `UPDATE bookings 
       SET status = 'completed' 
       WHERE status = 'accepted' 
       AND end_date < $1 
       RETURNING id, car_id, renter_id`,
      [today]
    );
    
    console.log(`Auto-completed ${result.rowCount} bookings`);
    
    
    for (const booking of result.rows) {
      try {
        
        const carOwnerResult = await db.query(
          'SELECT user_id FROM cars WHERE id = $1',
          [booking.car_id]
        );
        
        if (carOwnerResult.rows.length > 0) {
          const ownerId = carOwnerResult.rows[0].user_id;
          
          
          const message = `Your booking (ID: ${booking.id}) has been automatically marked as completed as the end date has passed.`;
          
          
          await db.query(
            'INSERT INTO messages (sender_id, receiver_id, booking_id, message) VALUES ($1, $2, $3, $4)',
            [ownerId, booking.renter_id, booking.id, message]
          );
          
          
          await db.query(
            'INSERT INTO messages (sender_id, receiver_id, booking_id, message) VALUES ($1, $2, $3, $4)',
            [booking.renter_id, ownerId, booking.id, message]
          );
        }
      } catch (err) {
        console.error(`Error processing messages for completed booking ${booking.id}:`, err);
      }
    }
    
  } catch (err) {
    console.error('Error in autoCompleteBookings:', err);
  }
}

async function autoRejectExpiredBookings() {
  try {
    console.log('Running auto-reject expired bookings check...');
    
    const today = new Date().toISOString().split('T')[0];
    
    
    const result = await db.query(
      `UPDATE bookings 
       SET status = 'rejected', 
           rejection_reason = 'Automatically rejected as the booking start date has passed' 
       WHERE status = 'pending' 
       AND start_date < $1 
       RETURNING id, car_id, renter_id`,
      [today]
    );
    
    console.log(`Auto-rejected ${result.rowCount} expired booking requests`);
    
    
    for (const booking of result.rows) {
      try {
        
        const carOwnerResult = await db.query(
          'SELECT user_id FROM cars WHERE id = $1',
          [booking.car_id]
        );
        
        if (carOwnerResult.rows.length > 0) {
          const ownerId = carOwnerResult.rows[0].user_id;
          
          
          const message = `Your booking request (ID: ${booking.id}) has been automatically rejected as the start date has passed.`;
          
          
          await db.query(
            'INSERT INTO messages (sender_id, receiver_id, booking_id, message) VALUES ($1, $2, $3, $4)',
            [ownerId, booking.renter_id, booking.id, message]
          );
        }
      } catch (err) {
        console.error(`Error processing messages for rejected booking ${booking.id}:`, err);
      }
    }
    
  } catch (err) {
    console.error('Error in autoRejectExpiredBookings:', err);
  }
}

function startScheduler() {
  console.log('Starting booking schedulers...');
  
  
  autoCompleteBookings();
  autoRejectExpiredBookings();
  
  
  setInterval(() => {
    autoCompleteBookings();
  }, 60 * 60 * 1000); 
  
  
  setInterval(() => {
    autoRejectExpiredBookings();
  }, 3 * 60 * 60 * 1000); 
}

module.exports = startScheduler;
