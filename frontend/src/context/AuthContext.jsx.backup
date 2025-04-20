import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create the auth context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const userRole = localStorage.getItem('userRole');
      const userName = localStorage.getItem('userName');
      
      setIsAuthenticated(true);
      setCurrentUser({
        role: userRole,
        name: userName
      });
    }
    
    setLoading(false);
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
      
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userName', user.name);
      
      // Update state
      setIsAuthenticated(true);
      setCurrentUser(user);
      
      return true;
    } catch (err) {
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
      
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('userRole', user.role);
      localStorage.setItem('userName', user.name);
      
      // Update state
      setIsAuthenticated(true);
      setCurrentUser(user);
      
      return true;
    } catch (err) {
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
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        'http://localhost:5000/api/roles/toggle',
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        const { token, user } = response.data;
        
        // Update localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('userRole', user.role);
        
        // Update state
        setCurrentUser({
          ...currentUser,
          role: user.role
        });
        
        return { success: true, newRole: user.role };
      } else {
        throw new Error(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to switch role');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Log out
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    
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
