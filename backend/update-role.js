const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function updateUserRole() {
  const client = await pool.connect();
  try {
    
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
