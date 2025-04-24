const db = require('../config/database');

// Get user profile by ID
exports.getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user details
    const userResult = await db.query(
      `SELECT id, name, email, role, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get user ratings info
    const ratingsQuery = await db.query(
      `SELECT AVG(rating) as average_rating, COUNT(*) as total_ratings
       FROM ratings WHERE rating_for = $1`,
      [userId]
    );

    // Get user's cars if they are a host
    let cars = [];
    if (user.role === 'host') {
      const carsResult = await db.query(
        `SELECT c.*, 
         (SELECT COUNT(*) FROM bookings b WHERE b.car_id = c.id) as total_bookings,
         (SELECT AVG(rating) FROM car_ratings cr WHERE cr.car_id = c.id) as average_rating
         FROM cars c WHERE c.user_id = $1
         ORDER BY c.created_at DESC`,
        [userId]
      );
      cars = carsResult.rows;
    }

    // Get booking stats
    const bookingStatsQuery = await db.query(
      `SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN status = 'canceled' THEN 1 END) as canceled_bookings
       FROM bookings 
       WHERE ${user.role === 'host' ? 
         'car_id IN (SELECT id FROM cars WHERE user_id = $1)' : 
         'renter_id = $1'}`,
      [userId]
    );

    const ratingsInfo = ratingsQuery.rows[0];
    const bookingStats = bookingStatsQuery.rows[0];

    res.json({
      user,
      stats: {
        averageRating: parseFloat(ratingsInfo.average_rating) || 0,
        totalRatings: parseInt(ratingsInfo.total_ratings) || 0,
        totalBookings: parseInt(bookingStats.total_bookings) || 0,
        completedBookings: parseInt(bookingStats.completed_bookings) || 0,
        canceledBookings: parseInt(bookingStats.canceled_bookings) || 0
      },
      cars: cars
    });
  } catch (err) {
    console.error('Error getting user profile:', err);
    res.status(500).json({ message: 'Server error while getting user profile' });
  }
};
