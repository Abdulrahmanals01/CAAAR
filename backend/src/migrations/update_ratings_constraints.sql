-- First, drop the existing unique constraint on booking_id
ALTER TABLE ratings DROP CONSTRAINT IF EXISTS ratings_booking_id_key;

-- Create a new composite unique constraint to allow both host and renter to rate for the same booking
-- This ensures each user can only submit one rating per booking
ALTER TABLE ratings 
ADD CONSTRAINT ratings_booking_id_rating_by_key UNIQUE (booking_id, rating_by);

-- Update the index for better query performance
DROP INDEX IF EXISTS idx_ratings_booking_id;
CREATE INDEX idx_ratings_booking_id_rating_by ON ratings(booking_id, rating_by);