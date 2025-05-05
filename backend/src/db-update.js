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

async function createAdminTrackingTables() {
  try {
    console.log('Checking for admin tracking tables...');

    
    const tableCheck = await db.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_actions')"
    );
    
    if (!tableCheck.rows[0].exists) {
      console.log('Creating admin tracking tables...');

      
      await db.query(`
        CREATE TABLE IF NOT EXISTS deleted_listings (
          id SERIAL PRIMARY KEY,
          original_id INTEGER NOT NULL,
          brand VARCHAR(50) NOT NULL,
          model VARCHAR(50) NOT NULL,
          year INTEGER NOT NULL,
          plate VARCHAR(20) NOT NULL,
          price_per_day DECIMAL(10, 2) NOT NULL,
          owner_id INTEGER NOT NULL,
          owner_name VARCHAR(100) NOT NULL,
          owner_email VARCHAR(100) NOT NULL,
          deleted_by INTEGER NOT NULL REFERENCES users(id),
          deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          reason TEXT
        );

        CREATE INDEX IF NOT EXISTS idx_deleted_listings_owner_id ON deleted_listings(owner_id);
        CREATE INDEX IF NOT EXISTS idx_deleted_listings_deleted_by ON deleted_listings(deleted_by);
      `);

      
      await db.query(`
        CREATE TABLE IF NOT EXISTS admin_actions (
          id SERIAL PRIMARY KEY,
          admin_id INTEGER NOT NULL REFERENCES users(id),
          admin_name VARCHAR(100) NOT NULL,
          action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('freeze', 'unfreeze', 'ban', 'unban', 'delete_listing')),  
          target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('user', 'listing')),
          target_id INTEGER NOT NULL,
          target_name VARCHAR(100) NOT NULL,
          reason TEXT,
          performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
        CREATE INDEX IF NOT EXISTS idx_admin_actions_target ON admin_actions(target_type, target_id);
      `);

      console.log('Admin tracking tables created successfully');
    } else {
      console.log('Admin tracking tables already exist');
    }

    return true;
  } catch (err) {
    console.error('Error creating admin tracking tables:', err);
    return false;
  }
}

module.exports = {
  createCarRatingsTable,
  createAdminTrackingTables
};
