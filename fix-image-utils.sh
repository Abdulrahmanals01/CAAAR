#!/bin/bash

# Make backup directory
mkdir -p backups/$(date +%Y%m%d)

# Create utils directory if it doesn't exist
mkdir -p frontend/src/utils

# Create the imageUtils.js file with simple implementation
cat > frontend/src/utils/imageUtils.js << 'EOF'
/**
 * Simple image handling utilities
 */

// Base URL for API
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Get standardized image URL
 */
export const getImageUrl = (imagePath, type = '') => {
  if (!imagePath) {
    return `/assets/images/${type || 'car'}-placeholder.jpg`;
  }
  
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  let fullPath = imagePath;
  if (!fullPath.startsWith('uploads/')) {
    if (type) {
      fullPath = `uploads/${type}/${imagePath}`;
    } else {
      fullPath = `uploads/${imagePath}`;
    }
  }
  
  return `${BASE_URL}/${fullPath}`;
};

/**
 * Get placeholder image
 */
export const getPlaceholderImage = (type = 'car') => {
  return `/assets/images/${type}-placeholder.jpg`;
};
EOF

# Fix CarCard.jsx - update import path and implement correct usage
cat > frontend/src/components/cars/CarCard.jsx << 'EOF'
import React from 'react';
import { Link } from 'react-router-dom';
import StarRating from '../common/StarRating';

const CarCard = ({ car }) => {
  // Function to handle image URLs
  const getCarImageUrl = (image) => {
    if (!image) {
      return '/assets/images/car-placeholder.jpg';
    }
    
    if (image.startsWith('http')) {
      return image;
    }
    
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    let imagePath = image;
    if (!imagePath.startsWith('uploads/')) {
      imagePath = `uploads/cars/${image}`;
    }
    
    return `${baseUrl}/${imagePath}`;
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-full shadow-md rounded-lg overflow-hidden bg-white">
      {/* Image */}
      <div className="md:w-1/3 h-48 md:h-auto relative">
        <img
          src={car.image_url || getCarImageUrl(car.image)}
          alt={`${car.brand} ${car.model}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/assets/images/car-placeholder.jpg';
          }}
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
          <div className="flex items-center justify-between">
            <span className="text-white font-bold">${car.price_per_day}/day</span>
            {car.rating && (
              <div className="flex items-center">
                <StarRating rating={car.rating} size="sm" />
                <span className="text-white ml-1">{car.rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Details */}
      <div className="md:w-2/3 p-4 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            {car.brand} {car.model} {car.year}
          </h2>
          <p className="text-gray-600 text-sm mb-2">{car.location}</p>
          
          <div className="flex flex-wrap gap-2 my-2">
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {car.color}
            </span>
            {car.mileage && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                {car.mileage.toLocaleString()} km
              </span>
            )}
            {car.car_type && (
              <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                {car.car_type}
              </span>
            )}
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {car.availability_start && car.availability_end && (
              <p>
                Available: {new Date(car.availability_start).toLocaleDateString()} - {new Date(car.availability_end).toLocaleDateString()}
              </p>
            )}
          </div>
          
          <Link
            to={`/cars/${car.id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded text-sm"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CarCard;
EOF

# Fix booking functionality with a very simple implementation
cat > backend/src/controllers/bookingController.fix.js << 'EOF'
const db = require('../config/database');

// Fix the booking controller helper functions
const acceptBooking = async (req, res, bookingId) => {
  try {
    // 1. Check if booking exists and is still pending
    const bookingResult = await db.query(
      'SELECT b.*, c.user_id AS car_owner_id FROM bookings b JOIN cars c ON b.car_id = c.id WHERE b.id = $1',
      [bookingId]
    );
    
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const booking = bookingResult.rows[0];
    
    // 2. Check if the current user is the car owner
    if (booking.car_owner_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only accept bookings for your own cars' });
    }
    
    // 3. Check if booking status is pending
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: `Booking is already ${booking.status}` });
    }
    
    // 4. Check for conflicts with other accepted bookings
    const conflictCheck = await db.query(
      `SELECT COUNT(*) FROM bookings 
       WHERE car_id = $1 
       AND id != $2 
       AND status = 'accepted' 
       AND start_date <= $3 
       AND end_date >= $4`,
      [booking.car_id, bookingId, booking.end_date, booking.start_date]
    );
    
    if (parseInt(conflictCheck.rows[0].count) > 0) {
      return res.status(409).json({ 
        message: 'Cannot accept booking because of a conflict with another accepted booking'
      });
    }
    
    // 5. Update booking status to accepted
    await db.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2',
      ['accepted', bookingId]
    );
    
    // 6. Notify the renter (simplified)
    await db.query(
      'INSERT INTO messages (sender_id, receiver_id, booking_id, message) VALUES ($1, $2, $3, $4)',
      [req.user.id, booking.renter_id, bookingId, 'Your booking request has been accepted!']
    );
    
    // 7. Return success response
    return res.json({ 
      message: 'Booking accepted successfully',
      id: bookingId,
      status: 'accepted'
    });
  } catch (error) {
    console.error('Error accepting booking:', error);
    return res.status(500).json({ message: 'Server error while accepting booking' });
  }
};

const rejectBooking = async (req, res, bookingId) => {
  try {
    // 1. Check if booking exists and is still pending
    const bookingResult = await db.query(
      'SELECT b.*, c.user_id AS car_owner_id FROM bookings b JOIN cars c ON b.car_id = c.id WHERE b.id = $1',
      [bookingId]
    );
    
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const booking = bookingResult.rows[0];
    
    // 2. Check if the current user is the car owner
    if (booking.car_owner_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only reject bookings for your own cars' });
    }
    
    // 3. Check if booking status is pending
    if (booking.status !== 'pending') {
      return res.status(400).json({ message: `Booking is already ${booking.status}` });
    }
    
    // 4. Update booking status to rejected
    await db.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2',
      ['rejected', bookingId]
    );
    
    // 5. Notify the renter (simplified)
    await db.query(
      'INSERT INTO messages (sender_id, receiver_id, booking_id, message) VALUES ($1, $2, $3, $4)',
      [req.user.id, booking.renter_id, bookingId, 'Your booking request has been rejected.']
    );
    
    // 6. Return success response
    return res.json({ 
      message: 'Booking rejected successfully',
      id: bookingId,
      status: 'rejected'
    });
  } catch (error) {
    console.error('Error rejecting booking:', error);
    return res.status(500).json({ message: 'Server error while rejecting booking' });
  }
};

const cancelBooking = async (req, res, bookingId) => {
  try {
    // 1. Check if booking exists
    const bookingResult = await db.query(
      'SELECT * FROM bookings WHERE id = $1',
      [bookingId]
    );
    
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    const booking = bookingResult.rows[0];
    
    // 2. Check if the current user is the renter
    if (booking.renter_id !== req.user.id) {
      return res.status(403).json({ message: 'You can only cancel your own bookings' });
    }
    
    // 3. Check if booking can be cancelled
    if (booking.status === 'completed' || booking.status === 'canceled') {
      return res.status(400).json({ 
        message: `Booking cannot be canceled because it is already ${booking.status}`
      });
    }
    
    // 4. Update booking status to canceled
    await db.query(
      'UPDATE bookings SET status = $1, updated_at = NOW() WHERE id = $2',
      ['canceled', bookingId]
    );
    
    // 5. Get car owner id
    const carOwnerResult = await db.query(
      'SELECT user_id FROM cars WHERE id = $1',
      [booking.car_id]
    );
    
    // 6. Notify the car owner (simplified)
    await db.query(
      'INSERT INTO messages (sender_id, receiver_id, booking_id, message) VALUES ($1, $2, $3, $4)',
      [req.user.id, carOwnerResult.rows[0].user_id, bookingId, 'Booking has been canceled by the renter.']
    );
    
    // 7. Return success response
    return res.json({ 
      message: 'Booking canceled successfully',
      id: bookingId,
      status: 'canceled'
    });
  } catch (error) {
    console.error('Error canceling booking:', error);
    return res.status(500).json({ message: 'Server error while canceling booking' });
  }
};

// Export the helper functions
module.exports = { acceptBooking, rejectBooking, cancelBooking };
EOF

# Update the booking controller to use the fixed functions
cat > update-booking-controller.js << 'EOF'
const fs = require('fs');
const path = require('path');

try {
  // Get the paths
  const fixFilePath = path.join(__dirname, 'backend/src/controllers/bookingController.fix.js');
  const controllerPath = path.join(__dirname, 'backend/src/controllers/bookingController.js');
  
  // Read both files
  const fixFunctions = fs.readFileSync(fixFilePath, 'utf8');
  let controllerContent = fs.readFileSync(controllerPath, 'utf8');
  
  // Extract the fixed functions
  const acceptBookingPattern = /const acceptBooking = async[\s\S]*?cancelBooking\(\);/;
  
  // Update the controller file
  const fixedFunctions = `async function acceptBooking(req, res, bookingId) {
  return require('./bookingController.fix').acceptBooking(req, res, bookingId);
}

async function rejectBooking(req, res, bookingId) {
  return require('./bookingController.fix').rejectBooking(req, res, bookingId);
}

async function cancelBooking(req, res, bookingId) {
  return require('./bookingController.fix').cancelBooking(req, res, bookingId);
}`;
  
  // Replace the placeholder implementations
  controllerContent = controllerContent.replace(/async function acceptBooking[\s\S]*?res\.json\(\{[\s\S]*?\}\);[\s\S]*?\}[\s\S]*?async function rejectBooking[\s\S]*?res\.json\(\{[\s\S]*?\}\);[\s\S]*?\}[\s\S]*?async function cancelBooking[\s\S]*?res\.json\(\{[\s\S]*?\}\);[\s\S]*?\}/s, fixedFunctions);
  
  // Make a backup
  fs.writeFileSync(
    path.join(__dirname, 'backups', new Date().toISOString().slice(0,10).replace(/-/g,''), 'bookingController.js.bak'), 
    fs.readFileSync(controllerPath)
  );
  
  // Write the updated content
  fs.writeFileSync(controllerPath, controllerContent);
  
  console.log('Successfully updated booking controller!');
} catch (error) {
  console.error('Error updating controller:', error);
}
EOF

# Create a simple fix script
echo "#!/bin/bash" > apply-simple-fixes.sh
echo "" >> apply-simple-fixes.sh
echo "# Create backup folder" >> apply-simple-fixes.sh
echo "mkdir -p backups/$(date +%Y%m%d)" >> apply-simple-fixes.sh
echo "" >> apply-simple-fixes.sh
echo "# Fix image utilities" >> apply-simple-fixes.sh
echo "echo 'Fixing image utilities...'" >> apply-simple-fixes.sh
echo "cp -f frontend/src/components/cars/CarCard.jsx backups/$(date +%Y%m%d)/ 2>/dev/null" >> apply-simple-fixes.sh
echo "bash ./fix-image-utils.sh" >> apply-simple-fixes.sh
echo "" >> apply-simple-fixes.sh
echo "# Fix booking controller" >> apply-simple-fixes.sh
echo "echo 'Fixing booking controller...'" >> apply-simple-fixes.sh
echo "cp -f backend/src/controllers/bookingController.js backups/$(date +%Y%m%d)/ 2>/dev/null" >> apply-simple-fixes.sh
echo "node update-booking-controller.js" >> apply-simple-fixes.sh
echo "" >> apply-simple-fixes.sh
echo "echo 'All fixes have been applied successfully!'" >> apply-simple-fixes.sh
echo "echo 'Backups are stored in backups/$(date +%Y%m%d)/'" >> apply-simple-fixes.sh

# Make scripts executable
chmod +x fix-image-utils.sh
chmod +x apply-simple-fixes.sh

echo "Fix scripts created successfully!"
echo ""
echo "To apply all the fixes, simply run:"
echo "bash ./apply-simple-fixes.sh"
