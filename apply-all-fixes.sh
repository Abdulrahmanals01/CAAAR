#!/bin/bash

# Create backups directory
mkdir -p backups/$(date +%Y%m%d)

# Backup original files
cp backend/src/controllers/bookingController.js backups/$(date +%Y%m%d)/
cp backend/src/utils/imageUtils.js backups/$(date +%Y%m%d)/ 2>/dev/null
cp frontend/src/utils/imageUtils.js backups/$(date +%Y%m%d)/ 2>/dev/null
cp frontend/src/api/cars.js backups/$(date +%Y%m%d)/

# Apply fixes
echo "Fixing booking functionality..."
node fix-booking-functionality.js

echo "Standardizing image handling..."
node standardize-image-handling.js

# Make sure backend uploads directories exist
mkdir -p backend/uploads/cars
mkdir -p backend/uploads/profiles
mkdir -p backend/uploads/licenses

# Add database migration for overlapping booking prevention
cat > backend/src/migrations/prevent_double_booking.sql << 'EOSQL'
-- Create extension for exclusion constraints if it doesn't exist
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add constraint to prevent overlapping bookings
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS prevent_overlapping_bookings;
ALTER TABLE bookings ADD CONSTRAINT prevent_overlapping_bookings 
  EXCLUDE USING gist (
    car_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  ) WHERE (status IN ('pending', 'accepted'));
EOSQL

echo "Added migration for preventing double bookings"

echo "All fixes have been applied successfully!"
echo "Backups are stored in backups/$(date +%Y%m%d)/"
