import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { createRating, checkRatingEligibility } from '../../api/ratings';
import StarRating from '../../components/common/StarRating';

const RenterDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('current');
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingEligibility, setRatingEligibility] = useState({});
  const [ratingBookingId, setRatingBookingId] = useState(null);
  const [userRating, setUserRating] = useState(0);
  const [carRating, setCarRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [carComment, setCarComment] = useState('');
  const [ratingError, setRatingError] = useState('');
  const [ratingSuccess, setRatingSuccess] = useState(false);
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
      
      const renterBookings = response.data.filter(booking => booking.renter_id === user.id);
      setBookings(renterBookings);
      
      // Check rating eligibility for completed bookings
      const completedBookings = renterBookings.filter(booking => booking.status === 'completed');
      for (const booking of completedBookings) {
        await checkRatingEligibilityForBooking(booking.id);
      }
      
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
      fetchBookings(); 
    } catch (err) {
      console.error('Error canceling booking:', err);
      alert('Failed to cancel booking: ' + (err.response?.data?.message || err.message));
    }
  };
  
  // Function to check if renter can rate a host/car for a booking
  const checkRatingEligibilityForBooking = async (bookingId) => {
    try {
      const response = await checkRatingEligibility(bookingId);
      
      if (response.success) {
        setRatingEligibility(prev => ({
          ...prev,
          [bookingId]: response.data
        }));
        return response.data;
      } else {
        console.warn(`Error checking eligibility for booking ${bookingId}: ${response.error}`);
        return null;
      }
    } catch (err) {
      console.error(`Error checking rating eligibility for booking ${bookingId}:`, err);
      return null;
    }
  };
  
  // Function to handle opening the rating modal
  const handleOpenRatingModal = async (bookingId) => {
    // Reset rating form
    setUserRating(0);
    setCarRating(0);
    setUserComment('');
    setCarComment('');
    setRatingError('');
    setRatingSuccess(false);
    
    // Check eligibility if not already checked
    if (!ratingEligibility[bookingId]) {
      await checkRatingEligibilityForBooking(bookingId);
    }
    
    // Set the booking ID for rating
    setRatingBookingId(bookingId);
  };
  
  // Function to close the rating modal
  const handleCloseRatingModal = () => {
    setRatingBookingId(null);
  };
  
  // Function to submit a rating
  const handleSubmitRating = async (e) => {
    e.preventDefault();
    setRatingError('');
    
    if (userRating < 1) {
      setRatingError('Please provide a rating for the host (1-5 stars)');
      return;
    }
    
    if (carRating < 1) {
      setRatingError('Please provide a rating for the car (1-5 stars)');
      return;
    }
    
    try {
      // Find the booking
      const booking = bookings.find(b => b.id === ratingBookingId);
      if (!booking) {
        setRatingError('Booking not found');
        return;
      }
      
      const ratingData = {
        booking_id: ratingBookingId,
        rating_for: booking.host_id,
        car_id: booking.car_id,
        rating: userRating,
        comment: userComment,
        car_rating: carRating,
        car_comment: carComment
      };
      
      const response = await createRating(ratingData);
      
      if (response.success) {
        setRatingSuccess(true);
        
        // Update eligibility after successful rating
        setRatingEligibility(prev => ({
          ...prev,
          [ratingBookingId]: {
            ...prev[ratingBookingId],
            eligible: false,
            hasRated: true
          }
        }));
        
        // Close modal after 2 seconds
        setTimeout(() => {
          handleCloseRatingModal();
          fetchBookings(); // Refresh data after rating
        }, 2000);
      } else {
        setRatingError(response.error || 'Failed to submit rating');
      }
    } catch (err) {
      setRatingError('An error occurred while submitting your rating');
      console.error('Rating submission error:', err);
    }
  };

  
  const currentBookings = bookings.filter(booking =>
    booking.status === 'accepted' && new Date(booking.end_date) >= new Date()
  );
  const pendingBookings = bookings.filter(booking => booking.status === 'pending');
  const pastBookings = bookings.filter(booking =>
    ['rejected', 'canceled', 'completed'].includes(booking.status) ||
    (booking.status === 'accepted' && new Date(booking.end_date) < new Date())
  );

  
  const displayedBookings =
    activeTab === 'current' ? currentBookings :
    activeTab === 'pending' ? pendingBookings : pastBookings;

  
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

      {}
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

        {}
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

      {}
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

      {}
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
                  {booking.status === 'completed' && ratingEligibility[booking.id]?.eligible && (
                    <button
                      onClick={() => handleOpenRatingModal(booking.id)}
                      className="w-full block text-center bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600" 
                    >
                      Leave a Review
                    </button>
                  )}
                  {booking.status === 'completed' && ratingEligibility[booking.id]?.hasRated && (
                    <div className="w-full px-4 py-2 bg-gray-100 text-gray-800 rounded flex items-center justify-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Review Submitted
                    </div>
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
      
      {/* Rating Modal */}
      {ratingBookingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">
              Rate Your Experience
            </h2>
            
            {ratingError && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded">
                {ratingError}
              </div>
            )}
            
            {ratingSuccess && (
              <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 mb-4 rounded">
                Rating submitted successfully!
              </div>
            )}
            
            <form onSubmit={handleSubmitRating}>
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">
                  Rate your host:
                </label>
                <StarRating 
                  rating={userRating}
                  size="lg"
                  interactive={true}
                  onChange={setUserRating}
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Host Comment (optional):</label>
                <textarea
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  placeholder="Share your experience with this host..."
                ></textarea>
              </div>
              
              <div className="border-t pt-4 mt-6 mb-6">
                <h4 className="text-lg font-medium mb-4">
                  Rate the Car
                </h4>
                
                <div className="mb-6">
                  <label className="block text-gray-700 mb-2">Car Rating:</label>
                  <StarRating 
                    rating={carRating}
                    size="lg"
                    interactive={true}
                    onChange={setCarRating}
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-gray-700 mb-2">Car Comment (optional):</label>
                  <textarea
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    value={carComment}
                    onChange={(e) => setCarComment(e.target.value)}
                    placeholder="Share your experience with the car..."
                  ></textarea>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseRatingModal}
                  className="px-4 py-2 border border-gray-300 rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={ratingSuccess}
                >
                  {ratingSuccess ? 'Submitted' : 'Submit Rating'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RenterDashboard;
