const db = require('../config/database');

// More robust car availability check
const isCarAvailable = async (carId, startDate, endDate) => {
  try {
    // Validate inputs
    if (!carId || !startDate || !endDate) {
      throw new Error('Missing required parameters for availability check');
    }
    
    // Convert dates to ensure consistent format
    const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
    const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
    
    // First check car exists and is set to available status
    const carCheck = await db.query(
      'SELECT availability_start, availability_end, status FROM cars WHERE id = $1',
      [carId]
    );
    
    if (carCheck.rows.length === 0) {
      throw new Error('Car not found');
    }
    
    const car = carCheck.rows[0];
    
    // Check car status
    if (car.status !== 'available') {
      return {
        available: false,
        reason: `Car is currently marked as ${car.status}`
      };
    }
    
    // Check if requested dates are within car's availability window
    if (formattedStartDate < car.availability_start || formattedEndDate > car.availability_end) {
      return {
        available: false,
        reason: `Car is only available from ${car.availability_start} to ${car.availability_end}`
      };
    }
    
    // Check for overlapping bookings
    const bookingCheck = await db.query(
      `SELECT id FROM bookings 
       WHERE car_id = $1 
       AND status IN ('accepted', 'pending') 
       AND (
         (start_date <= $3 AND end_date >= $2) -- Overlap check
       )`,
      [carId, formattedStartDate, formattedEndDate]
    );
    
    if (bookingCheck.rows.length > 0) {
      return {
        available: false,
        reason: 'Car is already booked for the selected dates',
        conflictingBookings: bookingCheck.rows.map(row => row.id)
      };
    }
    
    return {
      available: true
    };
  } catch (error) {
    console.error('Error checking car availability:', error);
    throw error;
  }
};

// Create a new booking with improved validation
exports.createBooking = async (req, res) => {
  try {
    const { car_id, start_date, end_date } = req.body;
    const renter_id = req.user.id;

    // Check basic validation
    if (!car_id || !start_date || !end_date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check if start date is before end date
    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }
    
    // Ensure booking doesn't start in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to beginning of day
    if (new Date(start_date) < today) {
      return res.status(400).json({ message: 'Booking cannot start in the past' });
    }

    // Check if the user is trying to book their own car
    const carOwnerCheck = await db.query(
      'SELECT user_id FROM cars WHERE id = $1',
      [car_id]
    );

    if (carOwnerCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const carOwnerId = carOwnerCheck.rows[0].user_id;

    // Prevent booking own car
    if (carOwnerId === renter_id) {
      return res.status(403).json({
        message: 'You cannot book your own car'
      });
    }
    
    // Check if user is allowed to make bookings
    const userStatusCheck = await db.query(
      'SELECT status FROM users WHERE id = $1',
      [renter_id]
    );
    
    if (userStatusCheck.rows[0].status === 'frozen' || userStatusCheck.rows[0].status === 'banned') {
      return res.status(403).json({
        message: `Your account is currently ${userStatusCheck.rows[0].status}. You cannot make bookings.`
      });
    }

    // Check availability using the improved function
    const availabilityResult = await isCarAvailable(car_id, start_date, end_date);
    if (!availabilityResult.available) {
      return res.status(409).json({
        message: availabilityResult.reason
      });
    }

    // Calculate total price based on number of days and car price
    const carInfo = await db.query('SELECT price_per_day FROM cars WHERE id = $1', [car_id]);
    const pricePerDay = carInfo.rows[0].price_per_day;
    const days = Math.ceil((new Date(end_date) - new Date(start_date)) / (1000 * 60 * 60 * 24)) + 1;
    const totalPrice = days * pricePerDay;

    // Get a client for transaction
    const client = await db.pool.connect();

    try {
      await client.query('BEGIN');

      // Create booking
      const bookingResult = await client.query(
        `INSERT INTO bookings (renter_id, car_id, start_date, end_date, total_price, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')
         RETURNING *`,
        [renter_id, car_id, start_date, end_date, totalPrice]
      );

      const booking = bookingResult.rows[0];

      // Send initial message from renter to host about the booking
      const initialMessage = `I've requested to book your car from ${new Date(start_date).toLocaleDateString()} to ${new Date(end_date).toLocaleDateString()}.`;

      await client.query(
        'INSERT INTO messages (sender_id, receiver_id, booking_id, message, created_at) VALUES ($1, $2, $3, $4, NOW())',     
        [renter_id, carOwnerId, booking.id, initialMessage]
      );

      await client.query('COMMIT');

      // Return the created booking with additional info
      const bookingWithDetails = {
        ...booking,
        car_owner_id: carOwnerId
      };

      res.status(201).json(bookingWithDetails);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error creating booking:', err);
    res.status(500).json({ message: 'Server error while creating booking' });
  }
};

// Export the availability check for use in other controllers
exports.isCarAvailable = isCarAvailable;

// Get available dates for a car with improved information
exports.getCarAvailability = async (req, res) => {
  try {
    const carId = req.params.id;

    // First, get the car details to check its overall availability period
    const carResult = await db.query('SELECT * FROM cars WHERE id = $1', [carId]);

    if (carResult.rows.length === 0) {
      return res.status(404).json({ message: 'Car not found' });
    }

    const car = carResult.rows[0];

    // Then get all accepted and pending bookings for this car
    const bookingsResult = await db.query(
      `SELECT id, start_date, end_date, status
       FROM bookings
       WHERE car_id = $1
       AND status IN ('accepted', 'pending')
       ORDER BY start_date`,
      [carId]
    );

    // Process the data to create a more useful availability map
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const availabilityStart = new Date(car.availability_start) < today ? today : new Date(car.availability_start);
    const availabilityEnd = new Date(car.availability_end);
    
    // Generate a day-by-day availability map
    const availabilityMap = {};
    let currentDate = new Date(availabilityStart);
    
    while (currentDate <= availabilityEnd) {
      const dateString = currentDate.toISOString().split('T')[0];
      availabilityMap[dateString] = true; // initially mark as available
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Mark booked days as unavailable
    bookingsResult.rows.forEach(booking => {
      let bookingStart = new Date(booking.start_date);
      const bookingEnd = new Date(booking.end_date);
      
      while (bookingStart <= bookingEnd) {
        const dateString = bookingStart.toISOString().split('T')[0];
        if (availabilityMap[dateString]) {
          availabilityMap[dateString] = false; // mark as unavailable
        }
        bookingStart.setDate(bookingStart.getDate() + 1);
      }
    });

    // Convert to array format for easier frontend processing
    const availabilityArray = Object.entries(availabilityMap).map(([date, available]) => ({
      date,
      available
    }));

    // Return the car info, booked periods, and availability map
    res.json({
      car: carResult.rows[0],
      bookedPeriods: bookingsResult.rows,
      availabilityDays: availabilityArray,
      availabilityStart: availabilityStart.toISOString().split('T')[0],
      availabilityEnd: availabilityEnd.toISOString().split('T')[0]
    });
  } catch (err) {
    console.error('Error getting car availability:', err);
    res.status(500).json({ message: 'Server error while getting car availability' });
  }
};

// Other controller methods would go here...
