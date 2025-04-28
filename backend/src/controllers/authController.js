const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../config/database');

// Register a new user
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  console.log('Request body:', req.body);
  console.log('File:', req.file);

  const { name, email, password, role, phone, id_number } = req.body;
  const licenseImage = req.file ? req.file.path : null;

  try {
    // Check if user already exists
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const newUser = await db.query(
      'INSERT INTO users (name, email, password, role, phone, id_number, license_image) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, role',
      [name, email, hashedPassword, role, phone, id_number, licenseImage]
    );

    // Generate JWT token
    const payload = {
      user: {
        id: newUser.rows[0].id,
        role: newUser.rows[0].role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '30d' }, // Extended to 30 days
      (err, token) => {
        if (err) throw err;
        res.status(201).json({
          token,
          user: {
            id: newUser.rows[0].id,
            name: newUser.rows[0].name,
            email: newUser.rows[0].email,
            role: newUser.rows[0].role
          }
        });
      }
    );
  } catch (err) {
    console.error('Error in user registration:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // Check if user exists with status information
    const result = await db.query(
      'SELECT id, name, email, password, role, status, freeze_until, freeze_reason, ban_reason FROM users WHERE email = $1', 
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if account is banned
    if (user.status === 'banned') {
      return res.status(403).json({
        message: 'Your account has been banned',
        status: 'banned',
        reason: user.ban_reason || 'Violation of terms of service'
      });
    }

    // Check if account is frozen
    if (user.status === 'frozen') {
      const freezeUntil = new Date(user.freeze_until);
      const now = new Date();
      
      // If freeze period has expired, automatically unfreeze the user
      if (freezeUntil < now) {
        await db.query(
          'UPDATE users SET status = $1, freeze_until = NULL, freeze_reason = NULL WHERE id = $2',
          ['active', user.id]
        );
      } else {
        // Return error with freeze information
        return res.status(403).json({
          message: 'Your account has been temporarily frozen',
          status: 'frozen',
          reason: user.freeze_reason || 'Violation of terms of service',
          until: user.freeze_until
        });
      }
    }

    // Generate JWT token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '30d' }, // Extended to 30 days
      (err, token) => {
        if (err) throw err;
        res.json({
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        });
      }
    );
  } catch (err) {
    console.error('Error in user login:', err.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Get current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await db.query(
      'SELECT id, name, email, role, phone, id_number, license_image, created_at, status, freeze_until, freeze_reason, ban_reason FROM users WHERE id = $1',
      [req.user.id]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.rows[0]);
  } catch (err) {
    console.error('Error fetching current user:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Switch user role function
exports.switchRole = async (req, res) => {
  try {
    const userId = req.user.id;

    // If newRole is not provided, toggle between host and renter
    let newRole;
    if (req.body.newRole) {
      newRole = req.body.newRole;
    } else {
      // Get the current role
      const userResult = await db.query('SELECT role FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const currentRole = userResult.rows[0].role;
      newRole = currentRole === 'host' ? 'renter' : 'host';
    }

    console.log(`Switching role for user ${userId} to ${newRole}`);

    // Validate the new role
    if (newRole !== 'host' && newRole !== 'renter') {
      return res.status(400).json({ message: 'Invalid role. Must be either "host" or "renter".' });
    }

    // Update the user's role in the database
    const result = await db.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [newRole, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const updatedUser = result.rows[0];

    // Generate a new token with the updated role
    const token = jwt.sign(
      { user: { id: updatedUser.id, role: updatedUser.role } },
      process.env.JWT_SECRET,
      { expiresIn: '30d' } // Extended to 30 days
    );

    res.json({
      success: true,
      token,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      }
    });
  } catch (err) {
    console.error('Error switching user role:', err);
    res.status(500).json({ message: 'Server error while switching role' });
  }
};
