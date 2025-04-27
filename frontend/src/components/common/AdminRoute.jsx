import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children, element }) => {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    isAdmin: false,
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
          isAdmin: user.role === 'admin',
          loading: false
        });
      } catch (err) {
        setAuth({
          isAuthenticated: false,
          isAdmin: false,
          loading: false
        });
      }
    } else {
      setAuth({
        isAuthenticated: false,
        isAdmin: false,
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

  if (!auth.isAdmin) {
    return <Navigate to="/" />;
  }

  // Support both patterns: children prop and element prop
  return element || children;
};

export default AdminRoute;
