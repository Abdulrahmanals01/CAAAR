const db = require('./config/database');

// Add car_type and features columns
const addCarFeaturesAndType = async () => {
  try {
    // Check if columns already exist
    const checkColumnQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'cars' AND column_name IN ('car_type', 'features');
    `;
    
    const existingColumns = await db.query(checkColumnQuery);
    
    // Get existing column names
    const columnNames = existingColumns.rows.map(row => row.column_name);
    
    // Add car_type column if it doesn't exist
    if (!columnNames.includes('car_type')) {
      await db.query(`ALTER TABLE cars ADD COLUMN car_type VARCHAR(50);`);
      console.log('Added car_type column to cars table');
    } else {
      console.log('car_type column already exists');
    }
    
    // Add features column if it doesn't exist
    if (!columnNames.includes('features')) {
      await db.query(`ALTER TABLE cars ADD COLUMN features JSONB DEFAULT '[]'::jsonb;`);
      console.log('Added features column to cars table');
      
      // Create index on features for faster searches
      await db.query(`CREATE INDEX IF NOT EXISTS idx_cars_features ON cars USING GIN(features);`);
      console.log('Created index on features column');
    } else {
      console.log('features column already exists');
    }
    
    // Create index on car_type
    await db.query(`CREATE INDEX IF NOT EXISTS idx_cars_car_type ON cars(car_type);`);
    console.log('Created or confirmed index on car_type column');
    
    console.log('Database update complete');
  } catch (err) {
    console.error('Error updating database schema:', err);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  addCarFeaturesAndType()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Failed to update database schema:', err);
      process.exit(1);
    });
}

module.exports = { addCarFeaturesAndType };
