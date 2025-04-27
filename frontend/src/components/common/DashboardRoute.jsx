import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const DashboardRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard based on role
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" />;
    } else if (user.role === 'host') {
      return <Navigate to="/dashboard/host" />;
    } else if (user.role === 'renter') {
      return <Navigate to="/dashboard/renter" />;
    }
  }

  return children;
};

export default DashboardRoute;
