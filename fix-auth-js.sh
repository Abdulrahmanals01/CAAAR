#!/bin/bash

echo "Fixing auth.js file..."

# Create backup
cp frontend/src/utils/auth.js frontend/src/utils/auth.js.bak-fix

# Update the auth.js file to properly import axios
cat > frontend/src/utils/auth.js << 'EOFJS'
/**
 * Utility functions for authentication
 */
import axios from 'axios';

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

// Get token from localStorage - needed by Inbox.jsx
export const getToken = () => {
  return localStorage.getItem('token');
};

// Initialize auth headers for axios - needed by index.jsx
export const initAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};
EOFJS

echo "✅ Fixed auth.js file with proper axios import"
