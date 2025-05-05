const db = require('./src/config/database');

const makeAdmin = async (email) => {
  try {
    const result = await db.query(
      'UPDATE users SET role = $1 WHERE email = $2 RETURNING id, name, email, role',
      ['admin', email]
    );
    
    if (result.rows.length === 0) {
      console.log('User not found with email:', email);
      process.exit(1);
    }
    
    console.log('User promoted to admin:', result.rows[0]);
    process.exit(0);
  } catch (error) {
    console.error('Error making user admin:', error);
    process.exit(1);
  }
};

const email = process.argv[2];
if (!email) {
  console.log('Usage: node make-admin.js user@example.com');
  process.exit(1);
}

makeAdmin(email);
