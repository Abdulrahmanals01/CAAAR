import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useAuth from '../../hooks/useAuth';
import { deleteCar, checkActiveBookings } from '../../api/cars';
import { getUserRatings, createRating, checkRatingEligibility } from '../../api/ratings';
import StarRating from '../../components/common/StarRating';

const HostDashboard = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [currentListings, setCurrentListings] = useState([]);
  const [bookingRequests, setBookingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [actionInProgress, setActionInProgress] = useState(false);
  const [statistics, setStatistics] = useState({
    totalEarnings: 0,
    totalBookings: 0,
    activeCars: 0,
    averageRating: 0
  });
  const [ratingEligibility, setRatingEligibility] = useState({});
  const [ratingBookingId, setRatingBookingId] = useState(null);
  const [ratingValue, setRatingValue] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingError, setRatingError] = useState('');
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    fetchHostData();
  }, [user]);

  const fetchHostData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');

      if (!token || !user) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      
      const carsResponse = await axios.get('http://localhost:5000/api/cars/owner', config);
      setCurrentListings(carsResponse.data);

      
      const bookingsResponse = await axios.get('http://localhost:5000/api/bookings/user', config);
      console.log('Raw bookings response:', bookingsResponse.data);

      
      const hostBookings = bookingsResponse.data.filter(booking =>
        booking.host_id === user.id || booking.car_user_id === user.id
      );

      console.log('Filtered host bookings:', hostBookings);
      setBookingRequests(hostBookings);

      // Check rating eligibility for completed bookings
      const completedBookings = hostBookings.filter(booking => booking.status === 'completed');
      for (const booking of completedBookings) {
        await checkRatingEligibilityForBooking(booking.id);
      }
      
      await calculateStatistics(carsResponse.data, hostBookings);

      setLoading(false);
    } catch (err) {
      console.error('Error in dashboard:', err);
      setError('Failed to load dashboard data. Please try again later.');
      setLoading(false);
    }
  };

  const calculateStatistics = async (cars, bookings) => {
    try {
      const completedBookings = bookings.filter(b => b.status === 'completed');
      const totalEarnings = completedBookings.reduce((sum, booking) => sum + Number(booking.total_price), 0);
      
      // Count active cars (those available for booking)
      const activeCars = cars.filter(car => car.is_available !== false).length;
      
      // Fetch the user's ratings from the API
      const ratingsResponse = await getUserRatings(user.id);
      
      let averageRating = 0;
      if (ratingsResponse.success && ratingsResponse.data) {
        // Use the average rating from the API response
        averageRating = ratingsResponse.data.averageRating || 0;
        
        // Round to 1 decimal place for display
        averageRating = Math.round(averageRating * 10) / 10;
      }
      
      setStatistics({
        totalEarnings,
        totalBookings: bookings.length,
        activeCars,
        averageRating
      });
    } catch (error) {
      console.error('Error calculating statistics:', error);
      
      // Set statistics with available data even if ratings fetch fails
      const completedBookings = bookings.filter(b => b.status === 'completed');
      const totalEarnings = completedBookings.reduce((sum, booking) => sum + Number(booking.total_price), 0);
      const activeCars = cars.filter(car => car.is_available !== false).length;
      
      setStatistics({
        totalEarnings,
        totalBookings: bookings.length,
        activeCars,
        averageRating: 0
      });
    }
  };

  
  const pendingRequests = bookingRequests.filter(booking => booking.status === 'pending');
  const currentTrips = bookingRequests.filter(booking => booking.status === 'accepted');
  const pastTrips = bookingRequests.filter(booking =>
    ['rejected', 'canceled', 'completed'].includes(booking.status)
  );

  
  const displayedRequests =
    activeTab === 'current' ? currentTrips :
    activeTab === 'pending' ? pendingRequests :
    pastTrips;

  const counts = {
    current: currentTrips.length,
    pending: pendingRequests.length,
    past: pastTrips.length
  };

  const handleDeleteCar = async (carId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }
    
    setActionInProgress(true);
    setStatusMessage('');
    
    try {
      
      const activeBookingsCheck = await checkActiveBookings(carId);
      
      if (!activeBookingsCheck.success) {
        setStatusMessage(activeBookingsCheck.error || 'Error checking active bookings.');
        setActionInProgress(false);
        return;
      }
      
      if (activeBookingsCheck.data.hasActiveBookings) {
        setStatusMessage('Cannot delete car with active bookings. You must wait until all current bookings are completed.');
        setActionInProgress(false);
        return;
      }
      
      
      const response = await deleteCar(carId);
      
      if (response.success) {
        setStatusMessage('Car listing deleted successfully!');
        
        setCurrentListings(currentListings.filter(car => car.id !== carId));
      } else {
        setStatusMessage(response.error || 'Failed to delete car. Please try again.');
      }
    } catch (err) {
      console.error('Error deleting car:', err);
      setStatusMessage('An unexpected error occurred while deleting the car. Please try again.');
    } finally {
      setActionInProgress(false);
    }
  };

  const handleAcceptBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/bookings/${bookingId}/status`,
        { status: 'accepted' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      fetchHostData(); 
    } catch (err) {
      console.error('Error accepting booking:', err);
      alert('Failed to accept booking: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRejectBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/bookings/${bookingId}/status`,
        { status: 'rejected' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      fetchHostData(); 
    } catch (err) {
      console.error('Error rejecting booking:', err);
      alert('Failed to reject booking: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/bookings/${bookingId}/status`,
        { status: 'completed' },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      fetchHostData();
      // Check rating eligibility right after completing a booking
      await checkRatingEligibilityForBooking(bookingId); 
    } catch (err) {
      console.error('Error completing booking:', err);
      alert('Failed to complete booking: ' + (err.response?.data?.message || err.message));
    }
  };
  
  // Function to check if host can rate a renter for a booking
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
    setRatingValue(0);
    setRatingComment('');
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
    
    if (ratingValue < 1) {
      setRatingError('Please provide a rating (1-5 stars)');
      return;
    }
    
    try {
      // Find the booking
      const booking = bookingRequests.find(b => b.id === ratingBookingId);
      if (!booking) {
        setRatingError('Booking not found');
        return;
      }
      
      const ratingData = {
        booking_id: ratingBookingId,
        rating_for: booking.renter_id,
        car_id: booking.car_id,
        rating: ratingValue,
        comment: ratingComment
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
          fetchHostData(); // Refresh data after rating
        }, 2000);
      } else {
        setRatingError(response.error || 'Failed to submit rating');
      }
    } catch (err) {
      setRatingError('An error occurred while submitting your rating');
      console.error('Rating submission error:', err);
    }
  };

  if (loading) return <div className="text-center p-10">Loading...</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Host Dashboard</h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {statusMessage && (
        <div className={`p-4 mb-6 rounded-md ${statusMessage.includes('success') ? 'bg-green-100 text-green-700 border-l-4 border-green-500' : 'bg-yellow-100 text-yellow-700 border-l-4 border-yellow-500'}`}>
          <p>{statusMessage}</p>
        </div>
      )}

      {/* Host Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Earnings</h3>
          <p className="text-2xl font-bold">${statistics.totalEarnings.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Total Bookings</h3>
          <p className="text-2xl font-bold">{statistics.totalBookings}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Active Cars</h3>
          <p className="text-2xl font-bold">{statistics.activeCars}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-gray-500 text-sm">Average Rating</h3>
          <p className="text-2xl font-bold">
            {statistics.averageRating > 0 
              ? `${statistics.averageRating} ★` 
              : 'N/A'}
          </p>
        </div>
      </div>

      {}
      <div className="flex gap-4 mb-8">
        <Link
          to="/list-car"
          className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 inline-flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />        
          </svg>
          List New Car
        </Link>
        <Link
          to="/manage-cars"
          className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 inline-flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Manage Cars
        </Link>
      </div>

      <h2 className="text-2xl font-bold mb-6">Booking Requests</h2>

      {}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
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
      {displayedRequests.length === 0 ? (
        <div className="bg-gray-100 p-8 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-3">No bookings to display</h2>
          {activeTab === 'pending' && <p>When someone wants to rent your car, their request will appear here.</p>}      
          {activeTab === 'current' && <p>Your accepted bookings will appear here.</p>}
          {activeTab === 'past' && <p>Your past, completed or rejected bookings will appear here.</p>}
        </div>
      ) : (
        <div className="space-y-6">
          {displayedRequests.map(booking => (
            <div key={booking.id} className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="md:flex">
                <div className="md:flex-shrink-0">
                  {booking.image ? (
                    <img
                      className="h-48 w-full object-cover md:w-48"
                      src={booking.image.startsWith('http') ? booking.image : `http://localhost:5000/${booking.image}`} 
                      alt={`${booking.brand} ${booking.model}`}
                    />
                  ) : (
                    <div className="h-48 w-full md:w-48 bg-gray-200 flex items-center justify-center">
                      <p className="text-gray-500">No image available</p>
                    </div>
                  )}
                </div>
                <div className="p-6 w-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold">{booking.brand} {booking.model} ({booking.year})</h2>       
                      <p className="text-gray-600">{new Date(booking.start_date).toLocaleDateString()} to {new Date(booking.end_date).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        booking.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        booking.status === 'canceled' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'}`}
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Total Price</h3>
                      <p className="font-semibold">${booking.total_price}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Renter</h3>
                      <p className="text-blue-600">{booking.renter_name}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Booking ID</h3>
                      <p className="text-gray-600">#{booking.id}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    {booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAcceptBooking(booking.id)}
                          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectBooking(booking.id)}
                          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {booking.status === 'accepted' && (
                      <button
                        onClick={() => handleCompleteBooking(booking.id)}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                      >
                        Mark as Completed
                      </button>
                    )}
                    {booking.status === 'completed' && (
                      <>
                        {ratingEligibility[booking.id]?.eligible && (
                          <button
                            onClick={() => handleOpenRatingModal(booking.id)}
                            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                          >
                            Rate Renter
                          </button>
                        )}
                        {ratingEligibility[booking.id]?.hasRated && (
                          <span className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded">
                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            Rated
                          </span>
                        )}
                      </>
                    )}
                    <Link
                      to={`/messages/${booking.renter_id}`}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                      Message Renter
                    </Link>
                    <Link
                      to={`/cars/${booking.car_id}`}
                      className="bg-blue-100 text-blue-700 px-4 py-2 rounded hover:bg-blue-200"
                    >
                      View Car Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {}
      <h2 className="text-2xl font-bold mb-6 mt-12">Your Car Listings</h2>

      {currentListings.length === 0 ? (
        <div className="bg-gray-100 p-8 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-3">No car listings yet</h2>
          <p className="text-gray-600 mb-4">You don't have any car listings.</p>
          <Link
            to="/list-car"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 inline-block"
          >
            List Your First Car
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentListings.map((car) => (
            <div key={car.id} className="bg-white border rounded-lg shadow-sm overflow-hidden">
              {car.image_url ? (
                <img
                  src={car.image_url}
                  alt={`${car.brand || car.make} ${car.model}`}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">No image</span>
                </div>
              )}

              <div className="p-4">
                <h3 className="font-bold text-lg">
                  {car.brand || car.make} {car.model} ({car.year})
                </h3>
                <p className="text-gray-600 mb-2">{car.location}</p>
                <p className="text-green-600 font-bold">
                  ${car.price_per_day}/day
                </p>

                <div className="mt-4">
                  <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                    Active
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link
                    to={`/cars/${car.id}`}
                    className="bg-blue-500 text-center text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => handleDeleteCar(car.id)}
                    disabled={actionInProgress}
                    className={`text-center text-white px-3 py-1 rounded text-sm ${
                      actionInProgress 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-red-500 hover:bg-red-600'
                    }`}
                  >
                    {actionInProgress ? 'Processing...' : 'Delete'}
                  </button>
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
              Rate Renter
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
                  Rate the renter:
                </label>
                <StarRating 
                  rating={ratingValue}
                  size="lg"
                  interactive={true}
                  onChange={setRatingValue}
                />
              </div>
              
              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Comment (optional):</label>
                <textarea
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Share your experience with this renter..."
                ></textarea>
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

export default HostDashboard;
