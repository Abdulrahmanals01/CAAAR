/**
 * This script applies the migration to allow multiple pending bookings for the same car dates
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const config = require('./src/config/database').config;

// Create a new pool using the connection parameters from the database config
const pool = new Pool(config);

async function applyMigration() {
  try {
    console.log('Starting migration to allow multiple pending bookings...');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'src', 'migrations', 'allow_multiple_pending_bookings.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    console.log('Executing SQL:', sql);
    
    // Execute the SQL
    const result = await pool.query(sql);
    console.log('Migration executed successfully');
    
    console.log('Migration complete! Multiple pending bookings are now allowed for the same car.');
    return { success: true };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error: error.message };
  } finally {
    // Close the pool
    await pool.end();
    console.log('Database connection closed');
  }
}

// Run the migration
applyMigration().then(result => {
  if (result.success) {
    console.log('Script completed successfully');
    process.exit(0);
  } else {
    console.error('Script failed:', result.error);
    process.exit(1);
  }
}).catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});