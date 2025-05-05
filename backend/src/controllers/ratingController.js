const db = require('../config/database');

exports.createRating = async (req, res) => {
  try {
    const { booking_id, rating_for, car_id, rating, comment, car_rating, car_comment } = req.body;
    const rating_by = req.user.id;

    
    if (!booking_id || !rating_for || !car_id || !rating) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    
    const bookingCheck = await db.query(
      `SELECT b.*, c.user_id as host_id 
       FROM bookings b 
       JOIN cars c ON b.car_id = c.id 
       WHERE b.id = $1`,
      [booking_id]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = bookingCheck.rows[0];

    
    if (booking.status !== 'completed') {
      return res.status(400).json({ 
        message: 'Cannot rate a booking that is not completed' 
      });
    }

    
    const isRenter = booking.renter_id === rating_by;
    const isHost = booking.host_id === rating_by;

    if (!isRenter && !isHost) {
      return res.status(403).json({ 
        message: 'You can only rate bookings you are part of' 
      });
    }

    
    if (isRenter && rating_for === booking.renter_id) {
      return res.status(400).json({ message: 'You cannot rate yourself' });
    }

    if (isHost && rating_for === booking.host_id) {
      return res.status(400).json({ message: 'You cannot rate yourself' });
    }

    
    const existingRating = await db.query(
      'SELECT * FROM ratings WHERE booking_id = $1 AND rating_by = $2 AND rating_for = $3',
      [booking_id, rating_by, rating_for]
    );

    if (existingRating.rows.length > 0) {
      return res.status(400).json({ 
        message: 'You have already rated this user for this booking' 
      });
    }

    
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      
      await client.query(
        `INSERT INTO ratings 
          (booking_id, rating_by, rating_for, car_id, rating, comment, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [booking_id, rating_by, rating_for, car_id, rating, comment || null]
      );

      
      if (isRenter && car_rating) {
        
        if (car_rating < 1 || car_rating > 5) {
          throw new Error('Car rating must be between 1 and 5');
        }
        
        
        await client.query(
          `INSERT INTO car_ratings 
            (booking_id, renter_id, car_id, rating, comment, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [booking_id, rating_by, car_id, car_rating, car_comment || null]
        );
      }
      
      await client.query('COMMIT');
      
      res.status(201).json({ message: 'Rating created successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error creating rating:', err);
    res.status(500).json({ message: 'Server error while creating rating' });
  }
};

exports.checkRatingEligibility = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const user_id = req.user.id;

    
    const bookingCheck = await db.query(
      `SELECT b.*, c.user_id as host_id 
       FROM bookings b 
       JOIN cars c ON b.car_id = c.id 
       WHERE b.id = $1`,
      [booking_id]
    );

    if (bookingCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = bookingCheck.rows[0];

    
    const isRenter = booking.renter_id === user_id;
    const isHost = booking.host_id === user_id;

    if (!isRenter && !isHost) {
      return res.status(403).json({ 
        message: 'You can only rate bookings you are part of' 
      });
    }

    
    if (booking.status !== 'completed') {
      return res.status(400).json({ 
        eligible: false,
        message: 'Booking must be completed before rating'
      });
    }

    
    let hasRated = false;
    
    if (isRenter) {
      
      const renterRating = await db.query(
        'SELECT * FROM ratings WHERE booking_id = $1 AND rating_by = $2 AND rating_for = $3',
        [booking_id, user_id, booking.host_id]
      );
      
      hasRated = renterRating.rows.length > 0;
    } else {
      
      const hostRating = await db.query(
        'SELECT * FROM ratings WHERE booking_id = $1 AND rating_by = $2 AND rating_for = $3',
        [booking_id, user_id, booking.renter_id]
      );
      
      hasRated = hostRating.rows.length > 0;
    }

    res.json({
      eligible: !hasRated,
      isRenter,
      isHost,
      hasRated,
      booking
    });
  } catch (err) {
    console.error('Error checking rating eligibility:', err);
    res.status(500).json({ message: 'Server error while checking rating eligibility' });
  }
};

exports.getUserRatings = async (req, res) => {
  try {
    const { user_id } = req.params;

    
    const ratingsResult = await db.query(
      `SELECT r.*,
        u_by.name as rated_by_name,
        u_for.name as rated_for_name,
        b.start_date, b.end_date,
        c.brand, c.model, c.year
      FROM ratings r
      JOIN users u_by ON r.rating_by = u_by.id
      JOIN users u_for ON r.rating_for = u_for.id
      JOIN bookings b ON r.booking_id = b.id
      JOIN cars c ON r.car_id = c.id
      WHERE r.rating_for = $1
      ORDER BY r.created_at DESC`,
      [user_id]
    );

    
    const carRatingsResult = await db.query(
      `SELECT cr.*, 
        u.name as renter_name,
        c.brand, c.model, c.year
      FROM car_ratings cr
      JOIN users u ON cr.renter_id = u.id
      JOIN cars c ON cr.car_id = c.id
      JOIN bookings b ON cr.booking_id = b.id
      WHERE c.user_id = $1
      ORDER BY cr.created_at DESC`,
      [user_id]
    );

    
    const ratings = ratingsResult.rows;
    let averageRating = 0;
    
    if (ratings.length > 0) {
      const sum = ratings.reduce((total, rating) => total + rating.rating, 0);
      averageRating = sum / ratings.length;
    }

    const carRatings = carRatingsResult.rows;
    let averageCarRating = 0;
    
    if (carRatings.length > 0) {
      const sum = carRatings.reduce((total, rating) => total + rating.rating, 0);
      averageCarRating = sum / carRatings.length;
    }

    res.json({
      ratings,
      carRatings,
      averageRating,
      averageCarRating,
      totalRatings: ratings.length,
      totalCarRatings: carRatings.length
    });
  } catch (err) {
    console.error('Error getting user ratings:', err);
    res.status(500).json({ message: 'Server error while getting user ratings' });
  }
};

exports.getCarRatings = async (req, res) => {
  try {
    const { car_id } = req.params;

    
    const carRatingsResult = await db.query(
      `SELECT cr.*, 
        u.name as renter_name,
        b.start_date, b.end_date
      FROM car_ratings cr
      JOIN users u ON cr.renter_id = u.id
      JOIN bookings b ON cr.booking_id = b.id
      WHERE cr.car_id = $1
      ORDER BY cr.created_at DESC`,
      [car_id]
    );

    
    const ratings = carRatingsResult.rows;
    let averageRating = 0;
    
    if (ratings.length > 0) {
      const sum = ratings.reduce((total, rating) => total + rating.rating, 0);
      averageRating = sum / ratings.length;
    }

    
    const categories = {
      cleanliness: 4.8,
      maintenance: 4.7,
      communication: 4.9,
      convenience: 4.6
    };

    res.json({
      ratings,
      averageRating,
      totalRatings: ratings.length,
      categories
    });
  } catch (err) {
    console.error('Error getting car ratings:', err);
    res.status(500).json({ message: 'Server error while getting car ratings' });
  }
};
