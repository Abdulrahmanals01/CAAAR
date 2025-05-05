-- Drop the existing constraint
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS prevent_overlapping_bookings;

-- Add updated constraint that only prevents overlapping accepted bookings
ALTER TABLE bookings ADD CONSTRAINT prevent_overlapping_bookings 
  EXCLUDE USING gist (
    car_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  ) WHERE (status = 'accepted');