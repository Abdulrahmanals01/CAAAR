import axios from 'axios';
import { isTokenExpiringSoon } from './auth';

const instance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

instance.interceptors.request.use(
  (config) => {
    
    const token = localStorage.getItem('token');
    
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      
      
      if (isTokenExpiringSoon(token)) {
        console.log('Token is about to expire soon. User should re-login.');
        
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => {
    
    const newToken = response.headers['x-new-token'];
    if (newToken) {
      
      localStorage.setItem('token', newToken);
    }
    
    return response;
  },
  (error) => {
    
    if (error.response && error.response.status === 401 && error.response.data.code === 'TOKEN_EXPIRED') {
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      
      
      window.location.href = '/login?expired=true';
    }
    
    return Promise.reject(error);
  }
);

export default instance;
