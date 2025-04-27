const db = require('../config/database');

// Get all users with their details
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

// Get all active listings
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

// Get deleted listings
exports.getDeletedListings = async (req, res) => {
  try {
    // For now, return empty array as we don't have soft delete implemented
    res.json({
      success: true,
      deletedListings: []
    });
  } catch (error) {
    console.error('Error fetching deleted listings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching deleted listings'
    });
  }
};

// Freeze user account
exports.freezeUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { duration, reason } = req.body;

    // Calculate freeze until date
    const freezeUntil = new Date();
    freezeUntil.setDate(freezeUntil.getDate() + parseInt(duration));

    // Update user status
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

    // Cancel all active bookings (using 'canceled' with one 'l')
    await db.query(`
      UPDATE bookings
      SET status = 'canceled',
          cancellation_reason = 'Account frozen by admin: ' || $1
      WHERE (renter_id = $2 OR (SELECT user_id FROM cars WHERE cars.id = bookings.car_id) = $2)
        AND status NOT IN ('completed', 'canceled')
    `, [reason, userId]);

    // Delete all active listings
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

// Unfreeze user account
exports.unfreezeUser = async (req, res) => {
  try {
    const { userId } = req.params;

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

// Ban user account
exports.banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    // Update user status
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

    // Cancel all active bookings (using 'canceled' with one 'l')
    await db.query(`
      UPDATE bookings
      SET status = 'canceled',
          cancellation_reason = 'Account banned by admin: ' || $1
      WHERE (renter_id = $2 OR (SELECT user_id FROM cars WHERE cars.id = bookings.car_id) = $2)
        AND status NOT IN ('completed', 'canceled')
    `, [reason, userId]);

    // Delete all listings
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

// Unban user account
exports.unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;

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

// Delete listing
exports.deleteListing = async (req, res) => {
  try {
    const { listingId } = req.params;

    // Cancel all active bookings for this car
    await db.query(`
      UPDATE bookings
      SET status = 'canceled',
          cancellation_reason = 'Listing deleted by admin'
      WHERE car_id = $1
        AND status NOT IN ('completed', 'canceled')
    `, [listingId]);

    // Delete the listing
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
