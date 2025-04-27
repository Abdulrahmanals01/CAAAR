import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Redirect based on user role
  if (user.role === 'admin') {
    return <Navigate to="/admin/dashboard" />;
  } else if (user.role === 'host') {
    return <Navigate to="/dashboard/host" />;
  } else if (user.role === 'renter') {
    return <Navigate to="/dashboard/renter" />;
  }

  // Default fallback
  return <Navigate to="/" />;
};

export default Dashboard;
