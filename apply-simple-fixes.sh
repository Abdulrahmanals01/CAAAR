#!/bin/bash

# Create backup folder
mkdir -p backups/20250503

# Fix image utilities
echo 'Fixing image utilities...'
cp -f frontend/src/components/cars/CarCard.jsx backups/20250503/ 2>/dev/null
bash ./fix-image-utils.sh

# Fix booking controller
echo 'Fixing booking controller...'
cp -f backend/src/controllers/bookingController.js backups/20250503/ 2>/dev/null
node update-booking-controller.js

echo 'All fixes have been applied successfully!'
echo 'Backups are stored in backups/20250503/'
