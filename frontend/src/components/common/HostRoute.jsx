import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const HostRoute = ({ children }) => {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    isHost: false,
    loading: true
  });

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setAuth({
          isAuthenticated: true,
          isHost: user.role === 'host' || user.role === 'admin',
          loading: false
        });
      } catch (err) {
        setAuth({
          isAuthenticated: false,
          isHost: false,
          loading: false
        });
      }
    } else {
      setAuth({
        isAuthenticated: false,
        isHost: false,
        loading: false
      });
    }
  }, []);

  if (auth.loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!auth.isHost) {
    return <Navigate to="/renter-dashboard" />;
  }

  return children;
};

export default HostRoute;
