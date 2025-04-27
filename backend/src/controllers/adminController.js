const db = require('../config/database');
const emailService = require('../config/email');

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT id, name, email, phone, role, status, 
             freeze_until, ban_reason, freeze_reason, created_at
      FROM users 
      WHERE id != $1
    `;
    const queryParams = [req.user.id];

    if (search) {
      query += ` AND (LOWER(name) LIKE LOWER($2) OR LOWER(email) LIKE LOWER($2))`;
      queryParams.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC`;
    
    const result = await db.query(query, queryParams);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
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
    
    // Cancel all active bookings
    await db.query(`
      UPDATE bookings 
      SET status = 'cancelled',
          cancellation_reason = 'Account frozen by admin: ' || $1
      WHERE (user_id = $2 OR (SELECT user_id FROM cars WHERE cars.id = bookings.car_id) = $2)
        AND status NOT IN ('completed', 'cancelled')
    `, [reason, userId]);
    
    // Send email notification
    const user = result.rows[0];
    await emailService.sendEmail({
      to: user.email,
      subject: 'Your Sayarati Account Has Been Frozen',
      html: `
        <h1>Account Frozen</h1>
        <p>Dear ${user.name},</p>
        <p>Your Sayarati account has been frozen until ${freezeUntil.toLocaleDateString()}.</p>
        <p>Reason: ${reason}</p>
        <p>During this period, you cannot create new listings or make bookings. All your active bookings have been cancelled.</p>
        <p>If you believe this is a mistake, please contact support.</p>
      `
    });
    
    res.json({
      success: true,
      message: 'User account frozen successfully'
    });
  } catch (error) {
    console.error('Error freezing user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to freeze user account'
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
    
    // Cancel all active bookings
    await db.query(`
      UPDATE bookings 
      SET status = 'cancelled',
          cancellation_reason = 'Account banned by admin: ' || $1
      WHERE (user_id = $2 OR (SELECT user_id FROM cars WHERE cars.id = bookings.car_id) = $2)
        AND status NOT IN ('completed', 'cancelled')
    `, [reason, userId]);
    
    // Delete all user's listings
    await db.query(`
      UPDATE cars 
      SET deleted = true
      WHERE user_id = $1
    `, [userId]);
    
    // Send email notification
    const user = result.rows[0];
    await emailService.sendEmail({
      to: user.email,
      subject: 'Your Sayarati Account Has Been Banned',
      html: `
        <h1>Account Banned</h1>
        <p>Dear ${user.name},</p>
        <p>Your Sayarati account has been permanently banned.</p>
        <p>Reason: ${reason}</p>
        <p>All your active bookings and listings have been cancelled.</p>
        <p>If you believe this is a mistake, please contact support.</p>
      `
    });
    
    res.json({
      success: true,
      message: 'User account banned successfully'
    });
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to ban user account'
    });
  }
};

// Delete a listing
exports.deleteListing = async (req, res) => {
  try {
    const { listingId } = req.params;
    const { reason } = req.body;
    
    // Get listing and user details
    const carQuery = `
      SELECT c.*, u.email, u.name as owner_name 
      FROM cars c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `;
    
    const carResult = await db.query(carQuery, [listingId]);
    
    if (carResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Listing not found'
      });
    }
    
    const car = carResult.rows[0];
    
    // Mark car as deleted
    await db.query(`
      UPDATE cars 
      SET deleted = true
      WHERE id = $1
    `, [listingId]);
    
    // Cancel active bookings for this car
    await db.query(`
      UPDATE bookings 
      SET status = 'cancelled',
          cancellation_reason = 'Listing deleted by admin: ' || $1
      WHERE car_id = $2 AND status NOT IN ('completed', 'cancelled')
    `, [reason, listingId]);
    
    // Create warning record
    await db.query(`
      INSERT INTO listing_warnings (user_id, car_id, reason)
      VALUES ($1, $2, $3)
    `, [car.user_id, listingId, reason]);
    
    // Send email notification
    await emailService.sendEmail({
      to: car.email,
      subject: 'Your Sayarati Listing Has Been Deleted',
      html: `
        <h1>Listing Deleted</h1>
        <p>Dear ${car.owner_name},</p>
        <p>Your listing "${car.brand} ${car.model}" has been deleted by our admin team.</p>
        <p>Reason: ${reason}</p>
        <p>All active bookings for this listing have been cancelled.</p>
        <p>If you believe this is a mistake, please contact support.</p>
      `
    });
    
    res.json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete listing'
    });
  }
};

// Get all listings (admin view)
exports.getAllListings = async (req, res) => {
  try {
    const { search } = req.query;
    let query = `
      SELECT c.*, u.name as owner_name, u.email as owner_email
      FROM cars c
      JOIN users u ON c.user_id = u.id
      WHERE c.deleted = false
    `;
    const queryParams = [];

    if (search) {
      query += ` AND (LOWER(c.brand) LIKE LOWER($1) OR LOWER(c.model) LIKE LOWER($1) OR LOWER(u.name) LIKE LOWER($1))`;
      queryParams.push(`%${search}%`);
    }

    query += ` ORDER BY c.created_at DESC`;
    
    const result = await db.query(query, queryParams);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch listings'
    });
  }
};

// Get deleted listings
exports.getDeletedListings = async (req, res) => {
  try {
    const query = `
      SELECT c.*, u.name as owner_name, u.email as owner_email, lw.reason, lw.created_at as deleted_at
      FROM cars c
      JOIN users u ON c.user_id = u.id
      LEFT JOIN listing_warnings lw ON c.id = lw.car_id
      WHERE c.deleted = true
      ORDER BY lw.created_at DESC
    `;
    
    const result = await db.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching deleted listings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deleted listings'
    });
  }
};
