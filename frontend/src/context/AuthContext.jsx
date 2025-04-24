import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { setToken, getToken, clearAuth, setUserData, getUserData, initAuthHeaders } from '../utils/auth';

// Create the auth context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      const token = getToken();
      if (token) {
        const userData = getUserData();
        
        // Initialize axios headers
        initAuthHeaders();
        
        setIsAuthenticated(true);
        setCurrentUser({
          id: userData.id,
          role: userData.role,
          name: userData.name
        });
      }
      
      setLoading(false);
    };
    
    initAuth();
  }, []);

  // Log in a user
  const login = async (email, password) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password
      });

      const { token, user } = response.data;

      // Save auth data
      setToken(token);
      setUserData(user);

      // Update state
      setIsAuthenticated(true);
      setCurrentUser(user);

      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Register a new user
  const register = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/auth/register',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      const { token, user } = response.data;

      // Save auth data
      setToken(token);
      setUserData(user);

      // Update state
      setIsAuthenticated(true);
      setCurrentUser(user);

      return true;
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Switch between host and renter roles
  const switchRole = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getToken();
      const currentRole = localStorage.getItem('userRole');
      const newRole = currentRole === 'host' ? 'renter' : 'host';

      console.log('Switching role from', currentRole, 'to', newRole);

      const response = await axios.post(
        'http://localhost:5000/api/auth/switch-role',
        { newRole },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.token) {
        const { token, user } = response.data;

        // Save updated auth data
        setToken(token);
        setUserData(user);

        // Update state
        setCurrentUser({
          ...currentUser,
          role: user.role
        });

        return { success: true, newRole: user.role };
      } else {
        throw new Error(response.data.message || 'Failed to switch role');
      }
    } catch (err) {
      console.error('Error switching role:', err);
      setError(err.response?.data?.message || 'Failed to switch role');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Log out
  const logout = () => {
    // Clear auth data
    clearAuth();

    // Reset state
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        loading,
        error,
        login,
        register,
        switchRole,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
