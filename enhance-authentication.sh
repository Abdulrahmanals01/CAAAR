#!/bin/bash
# Implement authentication enhancements

# Create improved auth middleware with token refresh support
cp backend/src/middleware/auth.js backend/src/middleware/auth.js.bak
cat > backend/src/middleware/auth.js.new << 'EOFJS'
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
EOFJS

# Replace auth.js with improved version
cp backend/src/middleware/auth.js.new backend/src/middleware/auth.js
rm backend/src/middleware/auth.js.new

# Update frontend auth token refresh handling
cat > frontend/src/utils/auth.js.new << 'EOFJS'
/**
 * Utility functions for authentication
 */

// Store user data in localStorage
export const setUserData = (user) => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('userId', user.id);
    localStorage.setItem('userRole', user.role);
  }
};

// Get current user data from localStorage
export const getUserData = () => {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
};

// Clear all auth data
export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userId');
  localStorage.removeItem('userRole');
};

// Parse token expiration date
export const getTokenExpiration = (token) => {
  try {
    // Extract payload from JWT token
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    
    // Check if exp claim exists
    if (decoded.exp) {
      return new Date(decoded.exp * 1000); // Convert to milliseconds
    }
    
    return null;
  } catch (err) {
    console.error('Error parsing token:', err);
    return null;
  }
};

// Check if token is about to expire (within 1 hour)
export const isTokenExpiringSoon = (token) => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return false;
  
  const now = new Date();
  const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
  
  return (expiration.getTime() - now.getTime()) < oneHour;
};
EOFJS

# Replace auth.js with improved version
cp frontend/src/utils/auth.js frontend/src/utils/auth.js.bak
cp frontend/src/utils/auth.js.new frontend/src/utils/auth.js
rm frontend/src/utils/auth.js.new

# Update axiosConfig.js to handle token refresh
cat > frontend/src/utils/axiosConfig.js.new << 'EOFJS'
import axios from 'axios';
import { isTokenExpiringSoon } from './auth';

// Create a custom axios instance
const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding token and handling expiration
instance.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // Add token to headers if it exists
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      
      // Optional: Check if token is about to expire
      if (isTokenExpiringSoon(token)) {
        console.log('Token is about to expire soon. User should re-login.');
        // You could dispatch an action to show a re-login prompt
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling token refresh
instance.interceptors.response.use(
  (response) => {
    // Check if a new token was sent in the response headers
    const newToken = response.headers['x-new-token'];
    if (newToken) {
      // Update token in localStorage
      localStorage.setItem('token', newToken);
    }
    
    return response;
  },
  (error) => {
    // Handle token expiration error
    if (error.response && error.response.status === 401 && error.response.data.code === 'TOKEN_EXPIRED') {
      // Clear auth data and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      
      // Redirect to login page
      window.location.href = '/login?expired=true';
    }
    
    return Promise.reject(error);
  }
);

export default instance;
EOFJS

# Replace axiosConfig.js with improved version
cp frontend/src/utils/axiosConfig.js frontend/src/utils/axiosConfig.js.bak
cp frontend/src/utils/axiosConfig.js.new frontend/src/utils/axiosConfig.js
rm frontend/src/utils/axiosConfig.js.new

echo "✅ Authentication enhancements have been applied"
