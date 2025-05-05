const jwt = require('jsonwebtoken');
const db = require('../config/database');

exports.toggleUserRole = async (req, res) => {
  try {
    
    const userId = req.user.id;
    
    console.log(`[ROLE SWITCH] Request received for user ID: ${userId}`);
    
    
    const userQuery = await db.query(
      'SELECT id, name, email, role FROM users WHERE id = $1',
      [userId]
    );
    
    if (userQuery.rows.length === 0) {
      console.log(`[ROLE SWITCH] User not found with ID: ${userId}`);
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    
    const user = userQuery.rows[0];
    const currentRole = user.role;
    
    
    const newRole = currentRole === 'host' ? 'renter' : 'host';
    
    console.log(`[ROLE SWITCH] Changing role for user ${user.email} from "${currentRole}" to "${newRole}"`);
    
    
    const updateResult = await db.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [newRole, userId]
    );
    
    if (updateResult.rows.length === 0) {
      console.log(`[ROLE SWITCH] Failed to update role for user ${userId}`);
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to update user role' 
      });
    }
    
    const updatedUser = updateResult.rows[0];
    console.log(`[ROLE SWITCH] Successfully updated role to "${updatedUser.role}" for user ID: ${userId}`);
    
    
    const payload = {
      user: {
        id: updatedUser.id,
        role: updatedUser.role
      }
    };
    
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) {
          console.error(`[ROLE SWITCH] Failed to generate token: ${err.message}`);
          return res.status(500).json({ 
            success: false, 
            message: 'Error generating authentication token' 
          });
        }
        
        
        res.json({
          success: true,
          message: `Role successfully changed to ${newRole}`,
          token,
          user: updatedUser
        });
      }
    );
  } catch (err) {
    console.error(`[ROLE SWITCH] Server error: ${err.message}`);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while processing role change request' 
    });
  }
};
