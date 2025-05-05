/**
 * This script directly modifies the database constraint using the existing pool
 */

const db = require('./src/config/database');

async function updateConstraint() {
  try {
    console.log('Starting update to allow multiple pending bookings...');
    
    // Drop the existing constraint
    console.log('Dropping existing constraint...');
    await db.query('ALTER TABLE bookings DROP CONSTRAINT IF EXISTS prevent_overlapping_bookings');
    
    // Add the new constraint
    console.log('Adding new constraint for accepted bookings only...');
    await db.query(`ALTER TABLE bookings ADD CONSTRAINT prevent_overlapping_bookings 
      EXCLUDE USING gist (
        car_id WITH =,
        daterange(start_date, end_date, '[]') WITH &&
      ) WHERE (status = 'accepted')`);
    
    console.log('Update successful! Multiple pending bookings are now allowed for the same car.');
    
    // We don't close the pool here as it's used by the main application
    return true;
  } catch (error) {
    console.error('Update failed:', error);
    return false;
  }
}

// Run the update
updateConstraint().then(success => {
  if (success) {
    console.log('Script completed successfully');
    process.exit(0);
  } else {
    console.error('Script failed');
    process.exit(1);
  }
}).catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});