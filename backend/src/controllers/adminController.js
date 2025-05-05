const db = require('../config/database');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await db.query(`
      SELECT id, name, email, role, created_at, status,
             freeze_until, freeze_reason, ban_reason
      FROM users
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      users: users.rows
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
};

exports.getAllListings = async (req, res) => {
  try {
    const listings = await db.query(`
      SELECT c.*, u.name as owner_name, u.email as owner_email
      FROM cars c
      JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
    `);

    res.json({
      success: true,
      listings: listings.rows
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching listings'
    });
  }
};

exports.getDeletedListings = async (req, res) => {
  try {
    const deletedListings = await db.query(`
      SELECT dl.*, 
             u.name as admin_name
      FROM deleted_listings dl
      JOIN users u ON dl.deleted_by = u.id
      ORDER BY dl.deleted_at DESC
    `);

    res.json({
      success: true,
      deletedListings: deletedListings.rows
    });
  } catch (error) {
    console.error('Error fetching deleted listings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching deleted listings'
    });
  }
};

exports.getAdminActions = async (req, res) => {
  try {
    console.log('Fetching admin actions...');
    const actions = await db.query(`
      SELECT * FROM admin_actions
      ORDER BY performed_at DESC
    `);
    
    console.log('Admin actions found:', actions.rows.length);
    
    res.json({
      success: true,
      actions: actions.rows
    });
  } catch (error) {
    console.error('Error fetching admin actions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admin actions'
    });
  }
};

async function recordAdminAction(adminId, adminName, actionType, targetType, targetId, targetName, reason, expiresAt = null) {
  try {
    console.log('Recording admin action:', {
      adminId, adminName, actionType, targetType, targetId, targetName, reason
    });
    
    
    if (!['freeze', 'unfreeze', 'ban', 'unban', 'delete_listing'].includes(actionType)) {
      console.error('Invalid action_type:', actionType);
      return null;
    }
    
    
    if (!['user', 'listing'].includes(targetType)) {
      console.error('Invalid target_type:', targetType);
      return null;
    }
    
    
    if (!adminId || !targetId) {
      console.error('Missing required fields:', { adminId, targetId });
      return null;
    }
    
    
    const safeAdminName = adminName || 'Admin User';
    const safeTargetName = targetName || 'Target';
    
    const result = await db.query(`
      INSERT INTO admin_actions 
      (admin_id, admin_name, action_type, target_type, target_id, target_name, reason, expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [adminId, safeAdminName, actionType, targetType, targetId, safeTargetName, reason, expiresAt]);
    
    console.log('Admin action recorded successfully:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Error recording admin action:', error);
    return null;
  }
}

exports.freezeUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { duration, reason } = req.body;
    const adminId = req.user.id;
    const adminName = req.user.name || 'Admin User';
    
    console.log('Freezing user:', { userId, adminId, adminName, duration, reason });

    
    const userInfo = await db.query('SELECT name FROM users WHERE id = $1', [userId]);
    if (userInfo.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    const userName = userInfo.rows[0].name;

    
    const freezeUntil = new Date();
    freezeUntil.setDate(freezeUntil.getDate() + parseInt(duration));

    
    const updateQuery = `
      UPDATE users
      SET status = 'frozen',
          freeze_until = $1,
          freeze_reason = $2
      WHERE id = $3
      RETURNING *
    `;

    const result = await db.query(updateQuery, [freezeUntil, reason, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    
    await recordAdminAction(
      adminId,
      adminName,
      'freeze',
      'user',
      userId,
      userName,
      reason,
      freezeUntil
    );

    
    await db.query(`
      UPDATE bookings
      SET status = 'canceled',
          cancellation_reason = 'Account frozen by admin: ' || $1
      WHERE (renter_id = $2 OR (SELECT user_id FROM cars WHERE cars.id = bookings.car_id) = $2)
        AND status NOT IN ('completed', 'canceled')
    `, [reason, userId]);

    
    await db.query(`
      DELETE FROM cars
      WHERE user_id = $1
    `, [userId]);

    res.json({
      success: true,
      message: 'User account frozen successfully'
    });
  } catch (error) {
    console.error('Error freezing user:', error);
    res.status(500).json({
      success: false,
      message: 'Error freezing user account'
    });
  }
};

exports.unfreezeUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;
    const adminName = req.user.name || 'Admin User';

    
    const userInfo = await db.query('SELECT name FROM users WHERE id = $1', [userId]);
    if (userInfo.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    const userName = userInfo.rows[0].name;

    const result = await db.query(`
      UPDATE users
      SET status = 'active',
          freeze_until = NULL,
          freeze_reason = NULL
      WHERE id = $1
      RETURNING *
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    
    await recordAdminAction(
      adminId,
      adminName,
      'unfreeze',
      'user',
      userId,
      userName,
      'Account unfrozen by admin'
    );

    res.json({
      success: true,
      message: 'User account unfrozen successfully'
    });
  } catch (error) {
    console.error('Error unfreezing user:', error);
    res.status(500).json({
      success: false,
      message: 'Error unfreezing user account'
    });
  }
};

exports.banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;
    const adminName = req.user.name || 'Admin User';

    console.log('Ban user request:', { userId, adminId, adminName, reason });

    
    const userInfo = await db.query('SELECT name FROM users WHERE id = $1', [userId]);
    if (userInfo.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    const userName = userInfo.rows[0].name;

    
    const updateQuery = `
      UPDATE users
      SET status = 'banned',
          ban_reason = $1
      WHERE id = $2
      RETURNING *
    `;

    const result = await db.query(updateQuery, [reason, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    
    await recordAdminAction(
      adminId,
      adminName,
      'ban',
      'user',
      userId,
      userName,
      reason
    );

    
    await db.query(`
      UPDATE bookings
      SET status = 'canceled',
          cancellation_reason = 'Account banned by admin: ' || $1
      WHERE (renter_id = $2 OR (SELECT user_id FROM cars WHERE cars.id = bookings.car_id) = $2)
        AND status NOT IN ('completed', 'canceled')
    `, [reason, userId]);

    
    await db.query(`
      DELETE FROM cars
      WHERE user_id = $1
    `, [userId]);

    res.json({
      success: true,
      message: 'User banned successfully'
    });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({
      success: false,
      message: 'Error banning user'
    });
  }
};

exports.unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;
    const adminName = req.user.name || 'Admin User';

    
    const userInfo = await db.query('SELECT name FROM users WHERE id = $1', [userId]);
    if (userInfo.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    const userName = userInfo.rows[0].name;

    const result = await db.query(`
      UPDATE users
      SET status = 'active',
          ban_reason = NULL
      WHERE id = $1
      RETURNING *
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    
    await recordAdminAction(
      adminId,
      adminName,
      'unban',
      'user',
      userId,
      userName,
      'Account unbanned by admin'
    );

    res.json({
      success: true,
      message: 'User account unbanned successfully'
    });
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({
      success: false,
      message: 'Error unbanning user account'
    });
  }
};

exports.deleteListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;
    const adminName = req.user.name || 'Admin User';

    
    const listingDetails = await db.query(`
      SELECT c.*, u.name as owner_name, u.email as owner_email
      FROM cars c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `, [listingId]);

    if (listingDetails.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    const listing = listingDetails.rows[0];
    const listingName = `${listing.brand} ${listing.model} (${listing.year})`;

    
    await db.query(`
      INSERT INTO deleted_listings 
      (original_id, brand, model, year, plate, price_per_day, owner_id, owner_name, owner_email, deleted_by, reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      listing.id,
      listing.brand,
      listing.model,
      listing.year,
      listing.plate,
      listing.price_per_day,
      listing.user_id,
      listing.owner_name,
      listing.owner_email,
      adminId,
      reason
    ]);

    
    await recordAdminAction(
      adminId,
      adminName,
      'delete_listing',
      'listing',
      listingId,
      listingName,
      reason
    );

    
    await db.query(`
      UPDATE bookings
      SET status = 'canceled',
          cancellation_reason = 'Listing deleted by admin: ' || $1
      WHERE car_id = $2
        AND status NOT IN ('completed', 'canceled')
    `, [reason, listingId]);

    
    const result = await db.query(`
      DELETE FROM cars
      WHERE id = $1
      RETURNING *
    `, [listingId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }

    res.json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting listing'
    });
  }
};
