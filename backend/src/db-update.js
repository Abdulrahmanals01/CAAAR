const db = require('./config/database');

const createCarRatingsTable = async () => {
  try {
    await db.query(`
      -- Car Ratings Table (separate from user ratings)
      CREATE TABLE IF NOT EXISTS car_ratings (
          id SERIAL PRIMARY KEY,
          booking_id INTEGER NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
          renter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
          rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
          comment TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Create index on frequently queried fields
      CREATE INDEX IF NOT EXISTS idx_car_ratings_car_id ON car_ratings(car_id);
      CREATE INDEX IF NOT EXISTS idx_car_ratings_renter_id ON car_ratings(renter_id);
      CREATE INDEX IF NOT EXISTS idx_car_ratings_booking_id ON car_ratings(booking_id);
      
      -- Rating categories table for analytics
      CREATE TABLE IF NOT EXISTS car_rating_categories (
          id SERIAL PRIMARY KEY,
          car_rating_id INTEGER NOT NULL REFERENCES car_ratings(id) ON DELETE CASCADE,
          car_id INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
          category VARCHAR(50) NOT NULL,
          rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
  
      CREATE INDEX IF NOT EXISTS idx_car_rating_categories_car_id ON car_rating_categories(car_id);
    `);
    console.log('Car ratings tables created or already exist!');
  } catch (err) {
    console.error('Error creating car_ratings tables:', err);
  }
};

module.exports = { createCarRatingsTable };
