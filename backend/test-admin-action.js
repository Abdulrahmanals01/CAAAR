const db = require('./src/config/database');

async function testAdminAction() {
  try {
    console.log('Testing admin action insertion...');
    
    // First, check if the table exists
    const tableCheck = await db.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'admin_actions')"
    );
    console.log('admin_actions table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Try inserting a test record with a valid action_type
      const result = await db.query(`
        INSERT INTO admin_actions 
        (admin_id, admin_name, action_type, target_type, target_id, target_name, reason, performed_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        RETURNING *
      `, [1, 'Test Admin', 'ban', 'user', 1, 'Test User', 'Test reason']);
      
      console.log('Test record inserted:', result.rows[0]);
      
      // Check all records
      const allRecords = await db.query('SELECT * FROM admin_actions');
      console.log('All admin_actions records:', allRecords.rows);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error testing admin action:', err);
    process.exit(1);
  }
}

testAdminAction();
