/**
 * This script drops the existing constraint to allow multiple pending bookings
 */

const db = require('./src/config/database');

async function fixConstraint() {
  try {
    console.log('Starting update to allow multiple pending bookings...');
    
    // Check if the constraint exists
    const constraintCheck = await db.query(`
      SELECT COUNT(*) FROM pg_constraint 
      WHERE conname = 'prevent_overlapping_bookings'
    `);
    
    const constraintExists = parseInt(constraintCheck.rows[0].count) > 0;
    
    if (constraintExists) {
      console.log('Dropping existing constraint...');
      await db.query('ALTER TABLE bookings DROP CONSTRAINT IF EXISTS prevent_overlapping_bookings');
      console.log('Constraint dropped successfully');
    } else {
      console.log('Constraint does not exist - nothing to drop');
    }
    
    // We'll create a trigger function to prevent only accepted booking overlaps
    console.log('Creating trigger function for conflict prevention...');
    
    await db.query(`
    CREATE OR REPLACE FUNCTION check_booking_availability() RETURNS TRIGGER AS $$
    BEGIN
      -- Only check conflicts for accepted bookings
      IF (NEW.status = 'accepted') THEN
        -- Check if there's any other accepted booking for the same car and overlapping dates
        IF EXISTS (
          SELECT 1 FROM bookings
          WHERE car_id = NEW.car_id
            AND id != NEW.id
            AND status = 'accepted'
            AND (start_date <= NEW.end_date AND end_date >= NEW.start_date)
        ) THEN
          RAISE EXCEPTION 'Booking conflict: An accepted booking already exists for this car during the selected dates';
        END IF;
      END IF;
      
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    `);
    
    // Check if trigger exists
    const triggerCheck = await db.query(`
      SELECT COUNT(*) FROM pg_trigger 
      WHERE tgname = 'check_booking_availability_trigger'
    `);
    
    const triggerExists = parseInt(triggerCheck.rows[0].count) > 0;
    
    if (triggerExists) {
      console.log('Dropping existing trigger...');
      await db.query('DROP TRIGGER IF EXISTS check_booking_availability_trigger ON bookings');
    }
    
    // Create the trigger
    console.log('Creating trigger...');
    await db.query(`
    CREATE TRIGGER check_booking_availability_trigger
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION check_booking_availability();
    `);
    
    console.log('Update successful! Multiple pending bookings are now allowed for the same car.');
    console.log('Only accepted bookings will be checked for conflicts.');
    
    return true;
  } catch (error) {
    console.error('Update failed:', error);
    return false;
  }
}

// Run the fix
fixConstraint().then(success => {
  if (success) {
    console.log('Script completed successfully');
    setTimeout(() => process.exit(0), 1000);
  } else {
    console.error('Script failed');
    setTimeout(() => process.exit(1), 1000);
  }
}).catch(error => {
  console.error('Unhandled error:', error);
  setTimeout(() => process.exit(1), 1000);
});