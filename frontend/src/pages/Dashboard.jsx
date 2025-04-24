import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { getToken, clearAuth } from '../utils/auth';

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, logout } = useContext(AuthContext);
  const userRole = localStorage.getItem('userRole');
  const userName = localStorage.getItem('userName') || 'User';
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!isAuthenticated) {
        console.log('Not authenticated, skipping booking fetch');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = getToken();
        
        if (!token) {
          console.log('No token found in localStorage');
          setError('Authentication token not found. Please log in again.');
          setLoading(false);
          return;
        }
        
        console.log(`Using token for bookings (first 20 chars): ${token.substring(0, 20)}...`);
        
        const response = await axios.get('http://localhost:5000/api/bookings/user', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Bookings response:', response.data);
        setBookings(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        
        // Handle token expiration specifically
        if (err.response && err.response.status === 401) {
          console.log('Authentication error - token may be expired');
          setError('Your session has expired. Please log in again.');
          
          // Optional: Redirect to login
          // clearAuth();
          // if (logout) logout();
          // setTimeout(() => navigate('/login'), 2000);
        } else {
          setError('Could not load bookings. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [isAuthenticated, navigate, logout]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Your Dashboard</h1>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Welcome, {userName}</h2>
        <p className="mb-2">You are currently in <span className="font-bold">{userRole}</span> mode.</p>
        {userRole === 'host' ? (
          <p>As a host, you can manage your car listings and view booking requests.</p>
        ) : (
          <p>As a renter, you can browse cars and manage your bookings.</p>
        )}
        
        {error && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">
            {error}
            {error.includes('session has expired') && (
              <button 
                onClick={() => {
                  clearAuth();
                  window.location.href = '/login';
                }}
                className="ml-4 bg-red-500 text-white px-2 py-1 rounded text-sm"
              >
                Log in again
              </button>
            )}
          </div>
        )}
        
        {loading && (
          <div className="mt-4 p-3 bg-blue-100 border border-blue-300 text-blue-700 rounded flex items-center">
            <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-blue-700 rounded-full"></div>
            Loading your bookings...
          </div>
        )}
      </div>
      
      {userRole === 'host' ? (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Host Actions</h2>
          <div className="flex flex-col space-y-2">
            <Link to="/list-car" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-center">
              List a New Car
            </Link>
            <Link to="/manage-cars" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-center">    
              Manage Your Cars
            </Link>
            <Link to="/booking-history" className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded text-center">
              View Booking Requests
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Renter Actions</h2>
          <div className="flex flex-col space-y-2">
            <Link to="/cars" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-center">      
              Find a Car to Rent
            </Link>
            <Link to="/booking-history" className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-center">
              View Your Bookings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
