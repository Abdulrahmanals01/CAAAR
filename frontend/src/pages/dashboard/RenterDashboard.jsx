import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const RenterDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('current');
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('You must be logged in');
        setLoading(false);
        return;
      }

      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.get('http://localhost:5000/api/bookings/user', config);
      // Filter to show only bookings where the user is the renter
      const renterBookings = response.data.filter(booking => booking.renter_id === user.id);
      setBookings(renterBookings);
      setLoading(false);
    } catch (err) {
      setError('Failed to load bookings');
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`http://localhost:5000/api/cars?location=${searchQuery}`);
      setSearchResults(response.data);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/bookings/${bookingId}/status`, 
        { status: 'canceled' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      fetchBookings(); // Refresh data
    } catch (err) {
      console.error('Error canceling booking:', err);
      alert('Failed to cancel booking: ' + (err.response?.data?.message || err.message));
    }
  };

  // Filter bookings by status
  const currentBookings = bookings.filter(booking => 
    booking.status === 'accepted' && new Date(booking.end_date) >= new Date()
  );
  const pendingBookings = bookings.filter(booking => booking.status === 'pending');
  const pastBookings = bookings.filter(booking =>
    ['rejected', 'canceled', 'completed'].includes(booking.status) || 
    (booking.status === 'accepted' && new Date(booking.end_date) < new Date())
  );

  // Get displayed bookings based on active tab
  const displayedBookings =
    activeTab === 'current' ? currentBookings :
    activeTab === 'pending' ? pendingBookings : pastBookings;

  // Calculate counts for tabs
  const counts = {
    current: currentBookings.length,
    pending: pendingBookings.length,
    past: pastBookings.length
  };

  if (loading) return <div className="text-center p-10">Loading...</div>;
  if (error) return <div className="text-red-500 text-center p-10">{error}</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Renter Dashboard</h1>

      {/* Quick Search */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Find a Car</h2>
        <form onSubmit={handleSearch} className="flex gap-4">
          <input
            type="text"
            placeholder="Search by location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border rounded px-4 py-2"
          />
          <button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
            Search
          </button>
          <Link to="/cars" className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600">
            Browse All Cars
          </Link>
        </form>
        
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Search Results:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {searchResults.slice(0, 6).map(car => (
                <Link to={`/cars/${car.id}`} key={car.id} className="border rounded p-4 hover:shadow-lg">
                  <h4 className="font-bold">{car.brand} {car.model}</h4>
                  <p className="text-gray-600">{car.location}</p>
                  <p className="text-green-600">${car.price_per_day}/day</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('current')}
            className={`mr-8 py-4 px-1 ${
              activeTab === 'current'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Current Trips <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">{counts.current}</span>
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`mr-8 py-4 px-1 ${
              activeTab === 'pending'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">{counts.pending}</span>
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`py-4 px-1 ${
              activeTab === 'past'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Past Trips <span className="ml-2 bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">{counts.past}</span>  
          </button>
        </nav>
      </div>

      {/* Bookings Display */}
      {displayedBookings.length === 0 ? (
        <div className="bg-gray-100 p-8 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-3">No bookings to display</h2>
          {activeTab === 'current' && <p>You don't have any active bookings at the moment.</p>}
          {activeTab === 'pending' && <p>You don't have any pending bookings at the moment.</p>}
          {activeTab === 'past' && <p>You don't have any past bookings yet.</p>}
          <Link to="/cars" className="mt-4 inline-block bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600">
            Find a Car to Book
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedBookings.map(booking => (
            <div key={booking.id} className="bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {booking.image && (
                <img
                  src={booking.image.startsWith('http') ? booking.image : `http://localhost:5000/${booking.image}`}
                  alt={`${booking.brand} ${booking.model}`}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="font-bold text-lg mb-2">{booking.brand} {booking.model} ({booking.year})</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><span className="font-semibold">From:</span> {new Date(booking.start_date).toLocaleDateString()}</p>      
                  <p><span className="font-semibold">To:</span> {new Date(booking.end_date).toLocaleDateString()}</p>
                  <p>
                    <span className="font-semibold">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs
                      ${booking.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        booking.status === 'canceled' ? 'bg-gray-100 text-gray-800' :
                        booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'}`}
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </p>
                  <p className="text-green-600 font-bold mt-2">Total: ${booking.total_price}</p>
                </div>

                <div className="mt-4 space-y-2">
                  {booking.status === 'pending' && (
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Cancel Booking
                    </button>
                  )}
                  {booking.status === 'accepted' && new Date(booking.end_date) >= new Date() && (
                    <Link
                      to={`/messages/${booking.host_id}`}
                      className="w-full block text-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Message Host
                    </Link>
                  )}
                  {booking.status === 'completed' && (
                    <Link 
                      to={`/review/${booking.id}`} 
                      className="w-full block text-center bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                      Leave a Review
                    </Link>
                  )}
                  <Link
                    to={`/cars/${booking.car_id}`}
                    className="w-full block text-center bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    View Car Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RenterDashboard;
