const jwt = require('jsonwebtoken');
const db = require('../config/database');

exports.switchRole = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get current user info
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Current role and determine new role
    const currentRole = userResult.rows[0].role;
    const newRole = currentRole === 'host' ? 'renter' : 'host';
    
    console.log(`Switching user ${userId} from ${currentRole} to ${newRole}`);
    
    // Update the user's role in the database
    const result = await db.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [newRole, userId]
    );
    
    const updatedUser = result.rows[0];
    
    // Generate a new token with the updated role
    const payload = {
      user: {
        id: updatedUser.id,
        role: updatedUser.role
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '24h' },
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role
          }
        });
      }
    );
  } catch (err) {
    console.error('Error switching user role:', err);
    res.status(500).json({ message: 'Server error while switching role' });
  }
};