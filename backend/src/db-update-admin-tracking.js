const db = require('./config/database');
const fs = require('fs');
const path = require('path');

async function createAdminTrackingTables() {
  try {
    // Read and execute the SQL file
    console.log('Creating admin tracking tables...');
    const sqlPath = path.join(__dirname, 'migrations', 'create_admin_tracking_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await db.query(sql);
    console.log('Admin tracking tables created successfully');
    
    return true;
  } catch (err) {
    console.error('Error creating admin tracking tables:', err);
    return false;
  }
}

// Export the function for use in app.js
module.exports = {
  createAdminTrackingTables
};

// If script is run directly, execute the function
if (require.main === module) {
  createAdminTrackingTables()
    .then(() => {
      console.log('Database update completed');
      process.exit(0);
    })
    .catch(err => {
      console.error('Database update failed:', err);
      process.exit(1);
    });
}
