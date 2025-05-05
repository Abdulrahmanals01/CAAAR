require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./src/config/database');

async function updateRatingsConstraints() {
  console.log('Updating ratings table constraints...');
  
  try {
    const sql = fs.readFileSync(
      path.join(__dirname, 'src', 'migrations', 'update_ratings_constraints.sql'),
      'utf8'
    );
    
    console.log('Executing migration...');
    await db.query(sql);
    
    console.log('Successfully updated ratings table constraints!');
    console.log('The system now allows both hosts and renters to rate for the same booking.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error updating ratings constraints:', error);
    process.exit(1);
  }
}

updateRatingsConstraints();