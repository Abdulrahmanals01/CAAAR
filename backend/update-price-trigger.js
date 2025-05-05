require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./src/config/database');

async function applyTriggerUpdate() {
  try {
    console.log('Updating booking price trigger...');
    
    // Read and execute the SQL file
    const sqlPath = path.join(__dirname, 'src', 'migrations', 'fix_price_trigger.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await db.query(sql);
    
    console.log('Successfully updated the booking price trigger');
    
    // Update existing bookings where total_price equals base_price but should include fees
    const updateExistingBookings = `
      UPDATE bookings
      SET total_price = base_price + COALESCE(insurance_amount, 0) + COALESCE(platform_fee, 0)
      WHERE insurance_amount IS NOT NULL
        AND platform_fee IS NOT NULL
        AND total_price = base_price;
    `;
    
    await db.query(updateExistingBookings);
    console.log('Updated existing bookings with insurance to show full price');
    
    process.exit(0);
  } catch (error) {
    console.error('Error applying trigger update:', error);
    process.exit(1);
  }
}

applyTriggerUpdate();