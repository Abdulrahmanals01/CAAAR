import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUserBookings, updateBookingStatus } from '../api/bookings';
import { checkRatingEligibility } from '../api/ratings';
import useAuth from '../hooks/useAuth';
import StarRating from '../components/common/StarRating';
import { formatCurrency } from '../utils/dataFormatter';

const BookingHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('current');
  const [ratingEligibility, setRatingEligibility] = useState({});
  const navigate = useNavigate();

  const { user } = useAuth();
  const userRole = localStorage.getItem('userRole') || user?.role;
  const isRenter = userRole === 'renter';

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await getUserBookings();
      if (response.success) {
        setBookings(response.data);

        // Check rating eligibility for completed bookings
        const completedBookings = response.data.filter(booking =>
          booking.status === 'completed'
        );

        console.log('Completed bookings found:', completedBookings.length);

        for (const booking of completedBookings) {
          await checkEligibility(booking.id);
        }
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async (bookingId) => {
    try {
      console.log(`Checking rating eligibility for booking ${bookingId}`);
      const response = await checkRatingEligibility(bookingId);

      console.log('Eligibility check response:', response);

      if (response.success) {
        setRatingEligibility(prev => ({
          ...prev,
          [bookingId]: response.data
        }));

        console.log(`Rating eligibility for booking ${bookingId}:`, response.data);
      } else {
        console.warn(`Error checking eligibility: ${response.error}`);
      }
    } catch (err) {
      console.error(`Error checking rating eligibility for booking ${bookingId}:`, err);
    }
  };

  const handleStatusUpdate = async (bookingId, status) => {
    try {
      const response = await updateBookingStatus(bookingId, status);
      if (response.success) {
        // Update booking in state
        setBookings(bookings.map(booking =>
          booking.id === bookingId ? { ...booking, status } : booking
        ));

        // If booking is completed, check rating eligibility immediately
        if (status === 'completed') {
          console.log('Booking marked as completed, checking rating eligibility');
          await checkEligibility(bookingId);
        }
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError('Failed to update booking status');
    }
  };

  const handleRateBooking = (bookingId) => {
    // Navigate to the review page for this booking
    navigate(`/review/${bookingId}`);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'canceled':
        return 'bg-gray-100 text-gray-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter bookings based on the active tab
  const currentDate = new Date();

  // Current bookings - accepted bookings (only move to past if status is completed or end_date has passed)
  const currentBookings = bookings.filter(booking =>
    booking.status === 'accepted'
  );

  // Pending bookings - bookings with status 'pending'
  const pendingBookings = bookings.filter(booking =>
    booking.status === 'pending'
  );

  // Past bookings - completed bookings, rejected, or canceled
  const pastBookings = bookings.filter(booking =>
    booking.status === 'completed' ||
    booking.status === 'rejected' ||
    booking.status === 'canceled'
  );

  // Get the filtered bookings based on the active tab
  const getFilteredBookings = () => {
    switch (activeTab) {
      case 'current':
        return currentBookings;
      case 'pending':
        return pendingBookings;
      case 'past':
        return pastBookings;
      default:
        return bookings;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">
        {isRenter ? 'Your Bookings' : 'Booking Requests'}
      </h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
          {error}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex">
          <button
            onClick={() => setActiveTab('current')}
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'current'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Current Trips
            {currentBookings.length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">        
                {currentBookings.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'pending'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pending
            {pendingBookings.length > 0 && (
              <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">    
                {pendingBookings.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'past'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Past Trips
            {pastBookings.length > 0 && (
              <span className="ml-2 bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">        
                {pastBookings.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {getFilteredBookings().length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-500 mb-4 text-5xl">🚗</div>
          <h3 className="text-xl font-semibold mb-2">No bookings found</h3>
          <p className="text-gray-600 mb-6">
            {activeTab === 'current'
              ? "You don't have any current trips."
              : activeTab === 'pending'
              ? "You don't have any pending requests."
              : "You don't have any past trips."}
          </p>
          {isRenter && (
            <Link
              to="/cars/search"
              className="inline-block bg-blue-600 text-white font-medium py-2 px-4 rounded hover:bg-blue-700 transition"

            >
              Find a car to rent
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {getFilteredBookings().map(booking => {
            // Check if rating is eligible
            const eligibilityInfo = ratingEligibility[booking.id] || {};
            const canRate = booking.status === 'completed' && eligibilityInfo.eligible === true;
            const hasRated = eligibilityInfo.hasRated === true;

            return (
              <div key={booking.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col md:flex-row">

                <div className="md:w-1/3 bg-gray-200">
                  {booking.image ? (
                    <img
                      src={booking.image}
                      alt={`${booking.brand} ${booking.model}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <p className="text-gray-500">No image available</p>
                    </div>
                  )}
                </div>
                <div className="p-6 md:w-2/3">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h2 className="text-xl font-bold">
                        {booking.brand} {booking.model} ({booking.year})
                      </h2>
                      <p className="text-gray-600 mt-1">
                        {new Date(booking.start_date).toLocaleDateString()} to {new Date(booking.end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <h3 className="text-gray-500 text-sm">Total Price</h3>
                      <p className="font-medium">{formatCurrency(booking.total_price)}</p>
                    </div>
                    <div>
                      <h3 className="text-gray-500 text-sm">
                        {isRenter ? 'Car Owner' : 'Renter'}
                      </h3>
                      <p className="font-medium">
                        {isRenter ? (
                          <Link to={`/profile/${booking.host_id}`} className="hover:underline text-blue-600">
                            {booking.host_name}
                          </Link>
                        ) : (
                          <Link to={`/profile/${booking.renter_id}`} className="hover:underline text-blue-600">
                            {booking.renter_name}
                          </Link>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons based on role and booking status */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {/* View car details button for both roles */}
                    <Link
                      to={`/cars/${booking.car_id}`}
                      className="inline-block bg-blue-100 text-blue-700 py-1 px-3 rounded-full text-sm font-medium hover:bg-blue-200 transition"
                    >
                      View Car Details
                    </Link>

                    {/* Host actions */}
                    {!isRenter && booking.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(booking.id, 'accepted')}
                          className="bg-green-600 text-white py-1 px-3 rounded-full text-sm font-medium hover:bg-green-700 transition"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(booking.id, 'rejected')}
                          className="bg-red-600 text-white py-1 px-3 rounded-full text-sm font-medium hover:bg-red-700 transition"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {/* Renter actions */}
                    {isRenter && booking.status === 'pending' && (
                      <button
                        onClick={() => handleStatusUpdate(booking.id, 'canceled')}
                        className="bg-gray-600 text-white py-1 px-3 rounded-full text-sm font-medium hover:bg-gray-700 transition"
                      >
                        Cancel
                      </button>
                    )}

                    {/* Trip completed button ONLY for host when trip end date has passed */}
                    {!isRenter && booking.status === 'accepted' && new Date(booking.end_date) < currentDate && (        
                      <button
                        onClick={() => handleStatusUpdate(booking.id, 'completed')}
                        className="bg-blue-600 text-white py-1 px-3 rounded-full text-sm font-medium hover:bg-blue-700 transition"
                      >
                        Mark as Completed
                      </button>
                    )}

                    {/* Message button for both roles if booking is accepted or completed */}
                    {(booking.status === 'accepted' || booking.status === 'completed') && (
                      <Link
                        to={isRenter ? `/messages/${booking.host_id}` : `/messages/${booking.renter_id}`}
                        className="inline-block bg-purple-100 text-purple-700 py-1 px-3 rounded-full text-sm font-medium hover:bg-purple-200 transition"
                      >
                        Message
                      </Link>
                    )}

                    {/* Rating button for completed bookings if eligible */}
                    {booking.status === 'completed' && canRate && (
                      <button
                        onClick={() => handleRateBooking(booking.id)}
                        className="bg-yellow-500 text-white py-1 px-3 rounded-full text-sm font-medium hover:bg-yellow-600 transition"
                      >
                        {isRenter ? 'Rate Host & Car' : 'Rate Renter'}
                      </button>
                    )}

                    {/* Show if already rated */}
                    {booking.status === 'completed' && hasRated && (
                      <span className="inline-flex items-center bg-green-100 text-green-800 py-1 px-3 rounded-full text-sm font-medium">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Rated
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BookingHistory;
