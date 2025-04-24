import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const PrivateRoute = ({ element, requiredRole }) => {
  const { isAuthenticated, loading, currentUser } = useContext(AuthContext);
  
  // Show loading indicator while checking auth
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Check for required role if specified
  if (requiredRole && currentUser && currentUser.role !== requiredRole) {
    return <Navigate to="/" />;
  }
  
  // Render the protected component
  return element;
};

export default PrivateRoute;
