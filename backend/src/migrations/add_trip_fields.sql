-- Add trip_started, trip_ended and photo fields to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS trip_started BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS trip_ended BOOLEAN DEFAULT FALSE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS trip_start_time TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS trip_end_time TIMESTAMP;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS actual_end_date DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS adjusted_price DECIMAL(10, 2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS before_trip_photos JSONB;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS after_trip_photos JSONB;
