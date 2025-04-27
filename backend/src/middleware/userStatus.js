const db = require('../config/database');

exports.checkUserStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user status from database
    const result = await db.query(
      'SELECT status, ban_reason, freeze_reason, freeze_until FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = result.rows[0];
    
    // Check if user is banned
    if (user.status === 'banned') {
      return res.status(403).json({ 
        message: 'Your account has been banned',
        reason: user.ban_reason,
        status: 'banned'
      });
    }
    
    // Check if user is frozen
    if (user.status === 'frozen') {
      // Check if freeze period has expired
      if (user.freeze_until && new Date(user.freeze_until) < new Date()) {
        // Automatically unfreeze the user
        await db.query(
          'UPDATE users SET status = $1, freeze_until = NULL, freeze_reason = NULL WHERE id = $2',
          ['active', userId]
        );
      } else {
        return res.status(403).json({ 
          message: 'Your account has been frozen',
          reason: user.freeze_reason,
          until: user.freeze_until,
          status: 'frozen'
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Error checking user status:', error);
    res.status(500).json({ message: 'Server error while checking user status' });
  }
};
