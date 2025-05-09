const db = require('../config/database');
const { validationResult } = require('express-validator');
const fs = require('fs');
const path = require('path');

exports.getAllCars = async (req, res) => {
  try {
    
    const {
      location,
      start_date,
      end_date,
      min_price,
      max_price,
      min_year,
      max_year,
      car_type,
      features,
      colors
    } = req.query;

    
    let whereClause = [];
    let values = [];
    let valueIndex = 1;

    
    if (location) {
      // Standardize location search for consistent results
      let searchLocation = location;
      
      // Remove "Saudi Arabia" suffix for consistency
      if (searchLocation.toLowerCase().includes('saudi arabia')) {
        searchLocation = searchLocation.toLowerCase().replace(/,?\s*saudi\s*arabia/gi, '').trim();
      }
      
      // Extract city name only for major cities to ensure consistent results
      const majorCities = ['riyadh', 'jeddah', 'dammam', 'mecca', 'medina'];
      for (const city of majorCities) {
        if (searchLocation.toLowerCase().includes(city)) {
          searchLocation = city;
          break;
        }
      }
      
      console.log(`Original location: "${location}", Normalized location: "${searchLocation}"`);
      
      whereClause.push(`LOWER(location) LIKE LOWER($${valueIndex})`);
      values.push(`%${searchLocation}%`);
      valueIndex++;
    }

    
    if (start_date && end_date) {
      whereClause.push(`availability_start <= $${valueIndex} AND availability_end >= $${valueIndex + 1}`);
      values.push(end_date, start_date); 
      valueIndex += 2;
    }

    
    if (min_price) {
      whereClause.push(`price_per_day >= $${valueIndex}`);
      values.push(min_price);
      valueIndex++;
    }
    if (max_price) {
      whereClause.push(`price_per_day <= $${valueIndex}`);
      values.push(max_price);
      valueIndex++;
    }

    
    if (min_year) {
      whereClause.push(`year >= $${valueIndex}`);
      values.push(min_year);
      valueIndex++;
    }
    if (max_year) {
      whereClause.push(`year <= $${valueIndex}`);
      values.push(max_year); 
      valueIndex++;
    }

    
    if (car_type && car_type !== 'all') {
      whereClause.push(`car_type = $${valueIndex}`);
      values.push(car_type);
      valueIndex++;
    }

    
    if (features) {
      try {
        const featuresArray = JSON.parse(features);
        if (Array.isArray(featuresArray) && featuresArray.length > 0) {
          
          let featureConditions = featuresArray.map((feature, index) => {
            values.push(feature);
            return `features ? $${valueIndex + index}`;  
          });
          whereClause.push(`(${featureConditions.join(' OR ')})`);
          valueIndex += featuresArray.length;
        }
      } catch (err) {
        console.error('Error parsing features filter:', err);
      }
    }

    
    if (colors) {
      try {
        const colorsArray = JSON.parse(colors);
        if (Array.isArray(colorsArray) && colorsArray.length > 0) {
          whereClause.push(`LOWER(color) IN (${colorsArray.map((_, index) => `LOWER($${valueIndex + index})`).join(', ')})`);
          colorsArray.forEach(color => values.push(color));
          valueIndex += colorsArray.length;
        }
      } catch (err) {
        console.error('Error parsing colors filter:', err);
      }
    }

    
    let query = `
      SELECT c.*, u.name as host_name, u.id as user_id
      FROM cars c
      JOIN users u ON c.user_id = u.id
      WHERE c.status = 'available'
    `;

    if (whereClause.length > 0) {
      query += ` AND ${whereClause.join(' AND ')}`;
    }

    
    query += ' ORDER BY c.created_at DESC';

    console.log('Car search query:', query);
    console.log('Query parameters:', values);

    const result = await db.query(query, values);
    console.log(`Found ${result.rows.length} cars`);

    
    // Check for authenticated user
    const userId = req.user ? req.user.id : null;
    let availableCars = result.rows;
    
    if (start_date && end_date) {
      // Get all booking conflicts (accepted bookings from anyone)
      const acceptedBookingConflictQuery = `
        SELECT DISTINCT b.car_id
        FROM bookings b
        WHERE b.status = 'accepted'
          AND (
            (b.start_date <= $1 AND b.end_date >= $2) -- Overlap check
          )
      `;

      const acceptedBookingConflicts = await db.query(acceptedBookingConflictQuery, [end_date, start_date]);
      const acceptedConflictCarIds = new Set(acceptedBookingConflicts.rows.map(row => row.car_id));

      // Filter out cars with accepted booking conflicts
      availableCars = availableCars.filter(car => !acceptedConflictCarIds.has(car.id));
      
      // If user is authenticated, mark cars they've already requested
      if (userId) {
        // Get all cars this user has pending booking requests for
        console.log(`Finding cars with pending bookings for user ${userId}`);
        const userPendingBookingsQuery = `
          SELECT DISTINCT b.car_id
          FROM bookings b
          WHERE b.renter_id = $1 
            AND b.status = 'pending'
            AND (
              (b.start_date <= $2 AND b.end_date >= $3) -- Overlap check
            )
        `;
        
        const userPendingBookings = await db.query(userPendingBookingsQuery, [userId, end_date, start_date]);
        const userPendingCarIds = new Set(userPendingBookings.rows.map(row => row.car_id));
        
        // Mark cars with pending bookings but don't filter them out
        availableCars = availableCars.map(car => {
          if (userPendingCarIds.has(car.id)) {
            return { ...car, has_pending_booking: true };
          }
          return car;
        });
        
        console.log(`Marked ${userPendingCarIds.size} cars with pending bookings by the current user`);
      }

      console.log(`Filtered out ${result.rows.length - availableCars.length} cars with booking conflicts total`);
    }
      
    res.json(availableCars);
  } catch (err) {
    console.error('Error fetching cars:', err);
    res.status(500).json({ message: 'Server error while fetching cars' });
  }
};

exports.getCarById = async (req, res) => {
  try {
    const carId = req.params.id;

    const query = `
      SELECT c.*,
             u.name as host_name,
             u.id as user_id,
             u.created_at as host_joined_date,
             (SELECT AVG(rating) FROM ratings WHERE car_id = c.id) as rating,
             (SELECT AVG(rating) FROM ratings WHERE rating_for = c.user_id) as host_rating
      FROM cars c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `;

    const result = await db.query(query, [carId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }

    
    const car = result.rows[0];
    if (car.image && !car.image.startsWith('http')) {
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

      
      let imagePath = car.image;
      if (!imagePath.startsWith('uploads/')) {
        imagePath = `uploads/cars/${imagePath}`;
      }

      car.image_url = `${baseUrl}/${imagePath}`;
    }

    // Check if the authenticated user has a pending booking for this car
    const userId = req.user ? req.user.id : null;
    if (userId) {
      const pendingBookingQuery = `
        SELECT COUNT(*) as pending_count
        FROM bookings
        WHERE car_id = $1
          AND renter_id = $2
          AND status = 'pending'
      `;
      
      const pendingBookingResult = await db.query(pendingBookingQuery, [carId, userId]);
      const pendingCount = parseInt(pendingBookingResult.rows[0].pending_count);
      
      if (pendingCount > 0) {
        car.has_pending_booking = true;
      }
    }

    res.json(car);
  } catch (err) {
    console.error('Error fetching car details:', err);
    res.status(500).json({ message: 'Server error while fetching car details' });
  }
};

exports.createCar = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const {
      brand,
      model,
      year,
      plate,
      color,
      mileage,
      price_per_day,
      location,
      latitude,
      longitude,
      availability_start,
      availability_end,
      car_type,
      features
    } = req.body;

    
    console.log('Creating car with data:', {
      userId,
      brand,
      model,
      year,
      plate,
      color,
      mileage,
      price_per_day,
      location,
      latitude,
      longitude,
      availability_start,
      availability_end,
      car_type,
      features: typeof features,
      file: req.file ? 'Present' : 'Missing'
    });

    
    const existingCar = await db.query('SELECT * FROM cars WHERE plate = $1', [plate]);
    if (existingCar.rows.length > 0) {
      return res.status(400).json({ message: 'A car with this plate number already exists' });
    }

    
    if (!req.file) {
      return res.status(400).json({ message: 'Car image is required' });
    }
    
    
    let imagePath = req.file.path.replace(/\\/g, '/'); 
    console.log('Original image path:', req.file.path);
    console.log('Normalized image path:', imagePath);
    
    
    if (imagePath.includes('uploads/')) {
      imagePath = imagePath.substring(imagePath.indexOf('uploads/'));
      console.log('Extracted relative path:', imagePath);
    }
    
    
    if (imagePath.length > 250) {
      
      const ext = path.extname(imagePath);
      const basename = path.basename(imagePath, ext);
      const truncatedName = basename.substring(0, 240 - ext.length); 
      imagePath = `uploads/cars/${truncatedName}${ext}`;
      console.log('Truncated image path to fit in column:', imagePath);
    }

    
    let featuresArray = [];
    if (features) {
      try {
        
        if (Array.isArray(features)) {
          featuresArray = features;
        } else {
          
          const parsedFeatures = JSON.parse(features);
          
          if (Array.isArray(parsedFeatures)) {
            featuresArray = parsedFeatures;
          } else if (typeof parsedFeatures === 'object') {
            
            featuresArray = Object.keys(parsedFeatures).filter(key => parsedFeatures[key] === true);
          } else if (typeof parsedFeatures === 'string') {
            
            featuresArray = [parsedFeatures];
          }
        }
      } catch (err) {
        console.error('Error parsing features:', err);
        
        if (typeof features === 'string') {
          featuresArray = [features]; 
        } else if (Array.isArray(features)) {
          featuresArray = features; 
        }
      }
    }

    console.log('Processed features:', featuresArray);
    console.log('Features JSON:', JSON.stringify(featuresArray));

    
    const parsedYear = parseInt(year, 10);
    const parsedMileage = parseInt(mileage, 10);
    const parsedPrice = parseFloat(price_per_day);
    const parsedLatitude = latitude ? parseFloat(latitude) : null;
    const parsedLongitude = longitude ? parseFloat(longitude) : null;

    
    const result = await db.query(
      `INSERT INTO cars (
        user_id, brand, model, year, plate, color, mileage, price_per_day,
        location, latitude, longitude, availability_start, availability_end,
        image, status, car_type, features
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17::jsonb)
      RETURNING *`,
      [
        userId, 
        brand.substring(0, 50), 
        model.substring(0, 50), 
        parsedYear, 
        plate.substring(0, 20), 
        color.substring(0, 30), 
        parsedMileage, 
        parsedPrice,
        location.substring(0, 100), 
        parsedLatitude, 
        parsedLongitude, 
        availability_start, 
        availability_end,
        imagePath.substring(0, 255), 
        'available', 
        car_type ? car_type.substring(0, 20) : null, 
        JSON.stringify(featuresArray)
      ]
    );

    const newCar = result.rows[0];

    
    if (newCar.image) {
      const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
      newCar.image_url = `${baseUrl}/${newCar.image}`;
    }

    res.status(201).json(newCar);
  } catch (err) {
    console.error('Error creating car:', err);
    res.status(500).json({ message: 'Server error while creating car listing' });
  }
};

exports.getHostCars = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Fetching cars for host ${userId}`);

    const query = `
      SELECT c.*,
             (SELECT COUNT(*) FROM bookings b WHERE b.car_id = c.id AND b.status = 'accepted') as active_bookings_count 
      FROM cars c
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `;

    const result = await db.query(query, [userId]);

    console.log(`Found ${result.rows.length} cars for host ${userId}`);

    
    const cars = result.rows.map(car => {
      if (car.image && !car.image.startsWith('http')) {
        const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

        
        let imagePath = car.image;
        if (!imagePath.startsWith('uploads/')) {
          imagePath = `uploads/cars/${imagePath}`;
        }

        car.image_url = `${baseUrl}/${imagePath}`;
      }
      return car;
    });

    res.json(cars);
  } catch (err) {
    console.error('Error fetching host cars:', err);
    res.status(500).json({ message: 'Server error while fetching cars' });
  }
};

exports.checkActiveBookings = async (req, res) => {
  try {
    const carId = req.params.id;
    const userId = req.user.id;

    
    const carCheck = await db.query('SELECT user_id FROM cars WHERE id = $1', [carId]);

    if (carCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (carCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'You can only check bookings for your own cars' });
    }

    
    const bookingsResult = await db.query(
      `SELECT COUNT(*) as count
       FROM bookings
       WHERE car_id = $1 AND status = 'accepted'`,
      [carId]
    );

    const activeBookings = parseInt(bookingsResult.rows[0].count) > 0;

    res.json({
      hasActiveBookings: activeBookings,
      activeBookingsCount: parseInt(bookingsResult.rows[0].count)
    });
  } catch (err) {
    console.error('Error checking active bookings:', err);
    res.status(500).json({ message: 'Server error while checking active bookings' });
  }
};

exports.updateCarAvailability = async (req, res) => {
  try {
    const carId = req.params.id;
    const userId = req.user.id;
    const { availability_start, availability_end } = req.body;

    
    if (new Date(availability_end) < new Date(availability_start)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    
    const carCheck = await db.query('SELECT user_id FROM cars WHERE id = $1', [carId]);

    if (carCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (carCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'You can only update your own cars' });
    }

    
    const bookingsResult = await db.query(
      `SELECT COUNT(*) as count
       FROM bookings
       WHERE car_id = $1
         AND status = 'accepted'
         AND (
           (start_date <= $3 AND end_date >= $2)
         )`,
      [carId, availability_start, availability_end]
    );

    if (parseInt(bookingsResult.rows[0].count) > 0) {
      return res.status(409).json({
        message: 'Cannot update availability as there are accepted bookings in this date range'
      });
    }

    
    const result = await db.query(
      `UPDATE cars
       SET availability_start = $1,
           availability_end = $2,
           updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [availability_start, availability_end, carId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found or you do not have permission' });
    }

    res.json({
      message: 'Car availability updated successfully',
      car: result.rows[0]
    });
  } catch (err) {
    console.error('Error updating car availability:', err);
    res.status(500).json({ message: 'Server error while updating car availability' });
  }
};

exports.deleteCar = async (req, res) => {
  try {
    const carId = req.params.id;
    const userId = req.user.id;

    
    const carCheck = await db.query('SELECT * FROM cars WHERE id = $1', [carId]);

    if (carCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }

    if (carCheck.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'You can only delete your own cars' });
    }

    
    const bookingsResult = await db.query(
      `SELECT COUNT(*) as count
       FROM bookings
       WHERE car_id = $1 AND status = 'accepted'`,
      [carId]
    );

    if (parseInt(bookingsResult.rows[0].count) > 0) {
      return res.status(409).json({
        message: 'Cannot delete car as there are active bookings'
      });
    }

    
    const car = carCheck.rows[0];

    
    await db.query('DELETE FROM cars WHERE id = $1 AND user_id = $2', [carId, userId]);

    
    if (car.image) {
      try {
        
        let imagePath = car.image;
        if (imagePath.startsWith('uploads/')) {
          imagePath = path.join(__dirname, '../../', imagePath);
        } else {
          imagePath = path.join(__dirname, '../../uploads/cars/', imagePath);
        }

        
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(`Deleted image file: ${imagePath}`);
        }
      } catch (fileErr) {
        console.error('Error deleting image file:', fileErr);
        
      }
    }

    res.json({
      message: 'Car deleted successfully',
      success: true
    });
  } catch (err) {
    console.error('Error deleting car:', err);
    res.status(500).json({ message: 'Server error while deleting car' });
  }
};
