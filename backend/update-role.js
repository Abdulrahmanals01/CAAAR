const { Pool } = require('pg');
require('dotenv').config();

// Create a new pool using the connection string from environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateUserRole() {
  const client = await pool.connect();
  try {
    // Change the role of user with ID 9 to 'host'
    const result = await client.query('UPDATE users SET role = $1 WHERE id = $2 RETURNING *', ['host', 9]);
    
    if (result.rows.length > 0) {
      console.log('User role updated successfully to host');
      console.log('Updated user:', result.rows[0]);
    } else {
      console.log('User not found');
    }
  } catch (error) {
    console.error('Error updating user role:', error);
  } finally {
    client.release();
    pool.end();
  }
}

updateUserRole();
