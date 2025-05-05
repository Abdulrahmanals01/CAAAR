require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./src/config/database');

async function applyMigration() {
  try {
    console.log('Applying insurance fields migration...');
    
    // Read and execute the SQL file
    const sqlPath = path.join(__dirname, 'src', 'migrations', 'add_insurance_fields.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await db.query(sql);
    
    console.log('Successfully added insurance fields to bookings table');
    process.exit(0);
  } catch (error) {
    console.error('Error applying migration:', error);
    process.exit(1);
  }
}

applyMigration();