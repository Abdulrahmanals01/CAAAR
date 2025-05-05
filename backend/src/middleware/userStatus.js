const db = require('../config/database');

exports.checkUserStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;

    
    const result = await db.query(
      'SELECT status, ban_reason, freeze_reason, freeze_until FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = result.rows[0];

    
    const isActiveBookingRequest = req.originalUrl.includes('/api/bookings/') || 
                                  req.originalUrl.includes('/api/messages/');

    
    if ((user.status === 'banned' || user.status === 'frozen') && isActiveBookingRequest) {
      
      if (user.status === 'frozen' && user.freeze_until && new Date(user.freeze_until) < new Date()) {
        await db.query(
          'UPDATE users SET status = $1, freeze_until = NULL, freeze_reason = NULL WHERE id = $2',
          ['active', userId]
        );
        next();
        return;
      }

      
      const activeBookingsCheck = await db.query(`
        SELECT COUNT(*) AS count FROM (
          SELECT id FROM bookings 
          WHERE renter_id = $1 AND status = 'accepted'
          UNION
          SELECT b.id FROM bookings b
          JOIN cars c ON b.car_id = c.id
          WHERE c.user_id = $1 AND b.status = 'accepted'
        ) AS active_bookings
      `, [userId]);

      
      if (activeBookingsCheck.rows[0].count > 0) {
        
        if (req.originalUrl.includes('/api/bookings') || req.originalUrl.includes('/api/messages')) {
          next();
          return;
        }
      }
    }

    
    if (user.status === 'banned') {
      return res.status(403).json({
        message: 'Your account has been banned',
        reason: user.ban_reason,
        status: 'banned'
      });
    }

    
    if (user.status === 'frozen') {
      
      if (user.freeze_until && new Date(user.freeze_until) < new Date()) {
        
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
