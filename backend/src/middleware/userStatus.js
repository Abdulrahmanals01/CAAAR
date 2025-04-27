const db = require('../config/database');

exports.checkUserStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(
      'SELECT status, freeze_until FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = result.rows[0];
    
    if (user.status === 'banned') {
      return res.status(403).json({ 
        message: 'Your account has been banned. Please contact support.'
      });
    }
    
    if (user.status === 'frozen') {
      const now = new Date();
      const freezeUntil = new Date(user.freeze_until);
      
      if (now < freezeUntil) {
        return res.status(403).json({ 
          message: `Your account is frozen until ${freezeUntil.toLocaleDateString()}. Please contact support.`
        });
      } else {
        // Unfreeze if time has passed
        await db.query(
          'UPDATE users SET status = $1, freeze_until = NULL, freeze_reason = NULL WHERE id = $2',
          ['active', userId]
        );
      }
    }
    
    next();
  } catch (error) {
    console.error('Error checking user status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
