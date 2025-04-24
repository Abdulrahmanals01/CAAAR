require('dotenv').config();
const { Pool } = require('pg');

async function updateTrigger() {
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432
  });

  try {
    console.log('Updating booking trigger...');
    const fs = require('fs');
    const sql = fs.readFileSync('fix-double-booking.sql', 'utf8');
    
    await pool.query(sql);
    console.log('Trigger function updated successfully');
    
    // Test if the update worked
    const result = await pool.query("SELECT proname, prosrc FROM pg_proc WHERE proname = 'prevent_double_booking'");
    if (result.rows.length > 0) {
      console.log('Verification successful: Trigger function exists and has been updated');
    } else {
      console.error('Verification failed: Could not find the updated trigger function');
    }
  } catch (error) {
    console.error('Error updating trigger:', error);
  } finally {
    await pool.end();
  }
}

updateTrigger();
