-- Create extension for exclusion constraints if it doesn't exist
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add constraint to prevent overlapping bookings
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS prevent_overlapping_bookings;
ALTER TABLE bookings ADD CONSTRAINT prevent_overlapping_bookings 
  EXCLUDE USING gist (
    car_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  ) WHERE (status IN ('pending', 'accepted'));
