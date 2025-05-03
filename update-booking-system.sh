#!/bin/bash
# Implement booking system improvements

# Copy the fixed booking controller
cp backend/src/controllers/bookingController.fix.js backend/src/controllers/bookingController.js
echo "✅ Updated bookingController.js with improved validation and error handling"

# Apply SQL fixes for double booking prevention
psql -U postgres -d sayarati -f fix-double-booking.sql
echo "✅ Applied database fixes for double booking prevention"

# Update the scheduleTasks.js file to auto-reject expired bookings
cp backend/src/scheduleTasks.js backend/src/scheduleTasks.js.bak
cat > backend/src/scheduleTasks.js.new << 'EOFJS'
const db = require('./config/database');

// Auto-complete bookings that have ended
async function autoCompleteBookings() {
  try {
    console.log('Running auto-complete bookings check...');
    
    const today = new Date().toISOString().split('T')[0];
    
    // Find accepted bookings with end dates that have passed
    const result = await db.query(
      `UPDATE bookings 
       SET status = 'completed' 
       WHERE status = 'accepted' 
       AND end_date < $1 
       RETURNING id, car_id, renter_id`,
      [today]
    );
    
    console.log(`Auto-completed ${result.rowCount} bookings`);
    
    // For each completed booking, create a message notifying both parties
    for (const booking of result.rows) {
      try {
        // Get car owner ID
        const carOwnerResult = await db.query(
          'SELECT user_id FROM cars WHERE id = $1',
          [booking.car_id]
        );
        
        if (carOwnerResult.rows.length > 0) {
          const ownerId = carOwnerResult.rows[0].user_id;
          
          // Create system message for both parties
          const message = `Your booking (ID: ${booking.id}) has been automatically marked as completed as the end date has passed.`;
          
          // Message to renter
          await db.query(
            'INSERT INTO messages (sender_id, receiver_id, booking_id, message) VALUES ($1, $2, $3, $4)',
            [ownerId, booking.renter_id, booking.id, message]
          );
          
          // Message to owner
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

// Auto-reject pending bookings that start in the past
async function autoRejectExpiredBookings() {
  try {
    console.log('Running auto-reject expired bookings check...');
    
    const today = new Date().toISOString().split('T')[0];
    
    // Find pending bookings with start dates that have passed
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
    
    // For each rejected booking, create a message notifying the renter
    for (const booking of result.rows) {
      try {
        // Get car owner ID
        const carOwnerResult = await db.query(
          'SELECT user_id FROM cars WHERE id = $1',
          [booking.car_id]
        );
        
        if (carOwnerResult.rows.length > 0) {
          const ownerId = carOwnerResult.rows[0].user_id;
          
          // Create system message for the renter
          const message = `Your booking request (ID: ${booking.id}) has been automatically rejected as the start date has passed.`;
          
          // Message to renter
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

// Start the schedulers
function startScheduler() {
  console.log('Starting booking schedulers...');
  
  // Run both immediately on startup
  autoCompleteBookings();
  autoRejectExpiredBookings();
  
  // Run auto-complete every hour
  setInterval(() => {
    autoCompleteBookings();
  }, 60 * 60 * 1000); // 1 hour in milliseconds
  
  // Run auto-reject every 3 hours
  setInterval(() => {
    autoRejectExpiredBookings();
  }, 3 * 60 * 60 * 1000); // 3 hours in milliseconds
}

module.exports = startScheduler;
EOFJS

# Replace scheduleTasks.js with improved version
cp backend/src/scheduleTasks.js.new backend/src/scheduleTasks.js
rm backend/src/scheduleTasks.js.new

# Make sure the app.js has the scheduler
grep -q "startScheduler()" backend/src/app.js
if [ $? -ne 0 ]; then
  echo "Warning: Scheduler not found in app.js. Adding it..."
  sed -i '/const helmet = require/a const startScheduler = require(\'./scheduleTasks\');' backend/src/app.js
  sed -i '/createCarRatingsTable()/a // Start scheduler\nstartScheduler();' backend/src/app.js
fi

echo "✅ Booking system improvements have been applied"
