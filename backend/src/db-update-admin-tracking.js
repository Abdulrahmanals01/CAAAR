const db = require('./config/database');
const fs = require('fs');
const path = require('path');

async function createAdminTrackingTables() {
  try {
    
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

module.exports = {
  createAdminTrackingTables
};

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
