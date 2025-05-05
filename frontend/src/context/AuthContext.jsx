import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import { setUserData, clearAuth } from '../utils/auth';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        
        setUserData(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        logout();
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      
      setUserData(user);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);

      // Check if there's a redirect URL saved
      const redirectUrl = localStorage.getItem('redirectAfterLogin');
      
      if (redirectUrl) {
        // Clear the redirect URL from localStorage
        localStorage.removeItem('redirectAfterLogin');
        navigate(redirectUrl);
      } else if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);

      
      if (error.response && error.response.status === 403) {
        return {
          success: false,
          error: error.response.data.message,
          status: error.response.data.status,
          reason: error.response.data.reason,
          until: error.response.data.until
        };
      }

      return {
        success: false,
        error: error.response?.data?.message || 'An error occurred during login'
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      
      setUserData(user);
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      navigate('/');
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'An error occurred during registration'
      };
    }
  };

  const logout = () => {
    clearAuth(); 
    setUser(null);
    navigate('/login');
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    
    setUserData(updatedUser);
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const isHost = () => {
    return user?.role === 'host';
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
    isAdmin,
    isHost
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
