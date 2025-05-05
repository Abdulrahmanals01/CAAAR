
import axios from 'axios';

export const setUserData = (user) => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('userId', user.id);
    localStorage.setItem('userRole', user.role);
  }
};

export const getUserData = () => {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userId');
  localStorage.removeItem('userRole');
};

export const getTokenExpiration = (token) => {
  try {
    
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    
    
    if (decoded.exp) {
      return new Date(decoded.exp * 1000); 
    }
    
    return null;
  } catch (err) {
    console.error('Error parsing token:', err);
    return null;
  }
};

export const isTokenExpiringSoon = (token) => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return false;
  
  const now = new Date();
  const oneHour = 60 * 60 * 1000; 
  
  return (expiration.getTime() - now.getTime()) < oneHour;
};

export const getToken = () => {
  return localStorage.getItem('token');
};

export const initAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
};
