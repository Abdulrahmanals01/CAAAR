import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const [auth, setAuth] = useState({
    isAuthenticated: false,
    loading: true
  });

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      setAuth({
        isAuthenticated: true,
        loading: false
      });
    } else {
      setAuth({
        isAuthenticated: false,
        loading: false
      });
    }
  }, []);

  if (auth.loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return auth.isAuthenticated ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
