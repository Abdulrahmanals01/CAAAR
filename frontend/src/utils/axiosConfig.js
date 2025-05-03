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
