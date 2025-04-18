import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const RenterDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          setError('You must be logged in');
          setLoading(false);
          return;
        }

        const config = {
          headers: { Authorization: `Bearer ${token}` }
        };

        const response = await axios.get('http://localhost:5000/api/bookings/renter', config);
        setBookings(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load bookings');
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  if (loading) return <div className="text-center p-10">Loading...</div>;
  if (error) return <div className="text-red-500 text-center p-10">{error}</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Your Bookings</h1>
      
      <div className="mb-8">
        <Link to="/cars" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          Find Cars to Book
        </Link>
      </div>
      
      {bookings.length === 0 ? (
        <p>You don't have any bookings yet. Start by browsing available cars!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map(booking => (
            <div key={booking.id} className="border rounded-lg p-4 shadow-sm">
              <h3 className="font-bold text-lg">{booking.car.make} {booking.car.model} ({booking.car.year})</h3>
              <p className="text-gray-600">{booking.car.location}</p>
              <div className="mt-2">
                <p><span className="font-semibold">From:</span> {new Date(booking.start_date).toLocaleDateString()}</p>
                <p><span className="font-semibold">To:</span> {new Date(booking.end_date).toLocaleDateString()}</p>
              </div>
              <p className="mt-2">
                <span className="font-semibold">Status:</span> 
                <span className={
                  booking.status === 'approved' ? 'text-green-500 ml-2' :
                  booking.status === 'pending' ? 'text-yellow-500 ml-2' :
                  'text-red-500 ml-2'
                }>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </p>
              <p className="text-green-600 font-bold mt-2">Total: ${booking.total_price}</p>
              
              {booking.status === 'approved' && new Date(booking.end_date) < new Date() && !booking.review && (
                <Link to={`/review/${booking.id}`} className="block mt-4 text-center bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                  Leave a Review
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RenterDashboard;
