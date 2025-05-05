const db = require('./config/database');

async function fixUserRole(userId, correctRole) {
  try {
    const result = await db.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [correctRole, userId]
    );
    
    if (result.rows.length === 0) {
      console.log('User not found');
      return;
    }
    
    console.log('Updated user role:', result.rows[0]);
    console.log(`User ${userId} role set to ${correctRole}`);
    process.exit(0);
  } catch (err) {
    console.error('Error updating role:', err);
    process.exit(1);
  }
}

fixUserRole(1, 'host');
