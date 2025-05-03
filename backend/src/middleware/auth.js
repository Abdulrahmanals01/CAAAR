const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware to verify JWT token
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header - try both formats
    let token = req.header('x-auth-token');
    
    // If token not found in x-auth-token, check Authorization header
    if (!token) {
      const authHeader = req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
      }
    }
    
    // Check if no token
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Make sure decoded.user exists
      if (!decoded.user) {
        return res.status(401).json({ message: 'Invalid token format' });
      }
      
      req.user = decoded.user;
      
      // Optional: Check if user still exists in database
      const userCheck = await db.query('SELECT id, role FROM users WHERE id = $1', [req.user.id]);
      if (userCheck.rows.length === 0) {
        return res.status(401).json({ message: 'User no longer exists' });
      }
      
      // Update user role in case it has changed in the database
      if (userCheck.rows[0].role !== req.user.role) {
        req.user.role = userCheck.rows[0].role;
        
        // Generate new token with updated role
        const payload = {
          user: {
            id: req.user.id,
            role: req.user.role
          }
        };
        
        const newToken = jwt.sign(
          payload,
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN || '30d' }
        );
        
        // Send the new token in the response header
        res.setHeader('x-new-token', newToken);
      }
      
      next();
    } catch (err) {
      // Handle token expiration
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token has expired. Please log in again.', 
          code: 'TOKEN_EXPIRED' 
        });
      }
      
      // Handle other JWT errors
      return res.status(401).json({ message: 'Token is not valid' });
    }
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

// Middleware to check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
};

// Alias for isAdmin to maintain compatibility with new route naming
exports.authorizeAdmin = exports.isAdmin;

// Middleware to check if user is host
exports.isHost = (req, res, next) => {
  if (req.user.role !== 'host' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Host role required.' });
  }
  next();
};

// Middleware to check if user is renter
exports.isRenter = (req, res, next) => {
  if (req.user.role !== 'renter' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Renter role required.' });
  }
  next();
};

// Enhanced password validation middleware for registration
exports.validatePassword = (req, res, next) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }
  
  // Password must be at least 8 characters
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }
  
  // Password must contain at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return res.status(400).json({ message: 'Password must include at least one lowercase letter' });
  }
  
  // Password must contain at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({ message: 'Password must include at least one uppercase letter' });
  }
  
  // Password must contain at least one digit
  if (!/\d/.test(password)) {
    return res.status(400).json({ message: 'Password must include at least one number' });
  }
  
  // Password must contain at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return res.status(400).json({ message: 'Password must include at least one special character' });
  }
  
  next();
};
