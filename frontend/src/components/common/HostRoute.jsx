import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const HostRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  useEffect(() => {
    // Check authentication and role directly from localStorage
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    
    if (token && userRole === 'host') {
      setIsAuthorized(true);
    }
    
    setLoading(false);
  }, []);
  
  // Show loading indicator while checking auth
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!localStorage.getItem('token')) {
    return <Navigate to="/login" />;
  }
  
  // Redirect to home if not a host
  if (!isAuthorized) {
    return (
      <div className="container mx-auto p-4 mt-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded" role="alert">
          <p className="font-bold">Access Denied</p>
          <p>You need host privileges to access this page. Please switch to host mode first.</p>
        </div>
      </div>
    );
  }
  
  // Render the protected component
  return children;
};

export default HostRoute;
