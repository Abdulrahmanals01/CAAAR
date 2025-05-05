const jwt = require('jsonwebtoken');
const db = require('../config/database');

exports.authenticate = async (req, res, next) => {
  try {
    
    let token = req.header('x-auth-token');
    
    
    if (!token) {
      const authHeader = req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
      }
    }
    
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      
      if (!decoded.user) {
        return res.status(401).json({ message: 'Invalid token format' });
      }
      
      req.user = decoded.user;
      
      
      const userCheck = await db.query('SELECT id, role FROM users WHERE id = $1', [req.user.id]);
      if (userCheck.rows.length === 0) {
        return res.status(401).json({ message: 'User no longer exists' });
      }
      
      
      if (userCheck.rows[0].role !== req.user.role) {
        req.user.role = userCheck.rows[0].role;
        
        
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
        
        
        res.setHeader('x-new-token', newToken);
      }
      
      next();
    } catch (err) {
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          message: 'Token has expired. Please log in again.', 
          code: 'TOKEN_EXPIRED' 
        });
      }
      
      
      return res.status(401).json({ message: 'Token is not valid' });
    }
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(500).json({ message: 'Server error during authentication' });
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin role required.' });
  }
  next();
};

exports.authorizeAdmin = exports.isAdmin;

exports.isHost = (req, res, next) => {
  if (req.user.role !== 'host' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Host role required.' });
  }
  next();
};

exports.isRenter = (req, res, next) => {
  if (req.user.role !== 'renter' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Renter role required.' });
  }
  next();
};

exports.validatePassword = (req, res, next) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({ message: 'Password is required' });
  }
  
  
  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long' });
  }
  
  
  if (!/[a-z]/.test(password)) {
    return res.status(400).json({ message: 'Password must include at least one lowercase letter' });
  }
  
  
  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({ message: 'Password must include at least one uppercase letter' });
  }
  
  
  if (!/\d/.test(password)) {
    return res.status(400).json({ message: 'Password must include at least one number' });
  }
  
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    return res.status(400).json({ message: 'Password must include at least one special character' });
  }
  
  next();
};
