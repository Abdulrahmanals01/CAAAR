const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
exports.authenticate = (req, res, next) => {
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
    console.log('Auth failed: No token provided in request headers');
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  // Log token (partial) for debugging
  console.log('Token received (first 20 chars):', token.substring(0, 20) + '...');

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Make sure decoded.user exists
    if (!decoded.user) {
      console.log('Auth failed: decoded token has no user property');
      return res.status(401).json({ message: 'Invalid token format' });
    }
    
    req.user = decoded.user;
    console.log(`Auth success: User ID ${req.user.id}, Role: ${req.user.role}`);
    next();
  } catch (err) {
    console.log('Auth failed: JWT verification error', err.message);
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ message: 'Token has expired. Please log in again.' });
    } else {
      res.status(401).json({ message: 'Token is not valid' });
    }
  }
};

// Middleware to check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
};

// Middleware to check if user is host
exports.isHost = (req, res, next) => {
  if (req.user.role !== 'host' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Host role required.' });
  }
  next();
};
