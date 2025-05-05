import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const DashboardNav = () => {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === 'host') {
    return (
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8 py-4">
            <Link to="/dashboard/host" className="text-gray-700 hover:text-blue-600">
              Dashboard
            </Link>
            <Link to="/list-car" className="text-gray-700 hover:text-blue-600">
              List New Car
            </Link>
            <Link to="/manage-cars" className="text-gray-700 hover:text-blue-600">
              Manage Cars
            </Link>
            <Link to="/booking-requests" className="text-gray-700 hover:text-blue-600">
              Booking Requests
            </Link>
            <Link to="/messages" className="text-gray-700 hover:text-blue-600">
              Messages
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (user.role === 'renter') {
    return (
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8 py-4">
            <Link to="/dashboard/renter" className="text-gray-700 hover:text-blue-600">
              Dashboard
            </Link>
            <Link to="/cars" className="text-gray-700 hover:text-blue-600">
              Browse Cars
            </Link>
            <Link to="/dashboard/renter" className="text-gray-700 hover:text-blue-600">
              My Bookings
            </Link>
            <Link to="/messages" className="text-gray-700 hover:text-blue-600">
              Messages
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default DashboardNav;
