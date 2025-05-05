import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { updateBookingStatus } from '../api/bookings';
import { checkRatingEligibility } from '../api/ratings';
import useAuth from '../hooks/useAuth';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const BookingRequests = () => {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [processingBookingId, setProcessingBookingId] = useState(null);
  const [ratingEligibility, setRatingEligibility] = useState({});
  const { user } = useAuth();
  const navigate = useNavigate();

  
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

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication required. Please log in.');
        setLoading(false);
        return;
      }

      
      if (user?.role !== 'host') {
        setError('Only hosts can view booking requests.');
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_URL}/api/bookings/user`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      
      const hostBookings = response.data.filter(booking => booking.host_id === user.id);
      
      console.log('Host bookings:', hostBookings);
      setBookings(hostBookings);
      setError(null);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [refreshKey, user]);

  const handleAcceptBooking = async (bookingId) => {
    setActionError(null);
    setProcessingBookingId(bookingId);

    try {
      const result = await updateBookingStatus(bookingId, 'accepted');

      if (result.success) {
        setTimeout(() => {
          setRefreshKey(prevKey => prevKey + 1);
        }, 1000);
      } else {
        setActionError(result.error || 'Error accepting booking. Please try again.');
        if (result.error && result.error.includes('already been booked')) {
          setTimeout(() => {
            setRefreshKey(prevKey => prevKey + 1);
          }, 1000);
        }
      }
    } catch (err) {
      console.error('Error accepting booking:', err);
      setActionError('Failed to accept booking. Please try again.');
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handleRejectBooking = async (bookingId) => {
    setActionError(null);
    setProcessingBookingId(bookingId);

    try {
      const result = await updateBookingStatus(bookingId, 'rejected');

      if (result.success) {
        setTimeout(() => {
          setRefreshKey(prevKey => prevKey + 1);
        }, 1000);
      } else {
        setActionError(result.error || 'Error rejecting booking. Please try again.');
        if (result.error && result.error.includes('already been booked')) {
          setTimeout(() => {
            setRefreshKey(prevKey => prevKey + 1);
          }, 1000);
        }
      }
    } catch (err) {
      console.error('Error rejecting booking:', err);
      setActionError('Failed to reject booking. Please try again.');
    } finally {
      setProcessingBookingId(null);
    }
  };

  // Rating is now handled directly in the dashboard
  const handleRateBooking = () => {};

  const handleRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  const pendingBookings = bookings.filter(booking => booking.status === 'pending');
  const currentBookings = bookings.filter(booking => booking.status === 'accepted');
  const pastBookings = bookings.filter(booking =>
    ['rejected', 'canceled', 'completed'].includes(booking.status)
  );

  const displayedBookings =
    activeTab === 'pending' ? pendingBookings :
    activeTab === 'current' ? currentBookings : pastBookings;

  if (!user || user.role !== 'host') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          Only hosts can view booking requests. Please switch to host mode to access this page.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Booking Requests</h1>

      {(error || actionError) && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error || actionError}</p>
        </div>
      )}

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
            Pending <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">{pendingBookings.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('current')}
            className={`mr-8 py-4 px-1 ${
              activeTab === 'current'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Current Trips <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">{currentBookings.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`py-4 px-1 ${
              activeTab === 'past'
                ? 'border-b-2 border-blue-500 text-blue-600'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Past Trips <span className="ml-2 bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">{pastBookings.length}</span>
          </button>
        </nav>
      </div>

      {}
      <div className="mb-4">
        <button
          onClick={handleRefresh}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Refresh Bookings
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : displayedBookings.length > 0 ? (
        <div className="space-y-6">
          {displayedBookings.map(booking => (
            <div key={booking.id} className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="md:flex">
                <div className="md:flex-shrink-0">
                  <img
                    className="h-48 w-full object-cover md:w-48"
                    src={booking.image ? `${API_URL}${booking.image}` : '/car-placeholder.png'}
                    alt={`${booking.brand || ''} ${booking.model || ''}`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/car-placeholder.png';
                    }}
                  />
                </div>
                <div className="p-6 w-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold">{booking.brand || ''} {booking.model || ''} ({booking.year || ''})</h2>
                      <p className="text-gray-600">Renter: {booking.renter_name || 'Unknown'}</p>
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
                      <h3 className="text-sm font-medium text-gray-500">Dates</h3>
                      <p>{new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                      <p>{Math.ceil((new Date(booking.end_date) - new Date(booking.start_date)) / (1000 * 60 * 60 * 24)) + 1} days</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Total Price</h3>
                      <p className="font-semibold">${booking.total_price}</p>
                    </div>
                  </div>

                  {booking.rejection_reason && (
                    <div className="mt-4 text-red-600">
                      <p><strong>Reason for rejection:</strong> {booking.rejection_reason}</p>
                    </div>
                  )}

                  {booking.status === 'pending' && (
                    <div className="mt-6 flex space-x-3">
                      <button
                        onClick={() => handleAcceptBooking(booking.id)}
                        disabled={processingBookingId === booking.id}
                        className={`${
                          processingBookingId === booking.id
                            ? 'bg-green-300 cursor-not-allowed'
                            : 'bg-green-500 hover:bg-green-600'
                        } text-white px-4 py-2 rounded flex items-center`}
                      >
                        {processingBookingId === booking.id && (
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectBooking(booking.id)}
                        disabled={processingBookingId === booking.id}
                        className={`${
                          processingBookingId === booking.id
                            ? 'bg-red-300 cursor-not-allowed'
                            : 'bg-red-500 hover:bg-red-600'
                        } text-white px-4 py-2 rounded flex items-center`}
                      >
                        {processingBookingId === booking.id && (
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        )}
                        Reject
                      </button>
                    </div>
                  )}
                  
                  {booking.status === 'completed' && (
                    <div className="mt-6 flex space-x-3">
                      <button
                        onClick={() => handleRateBooking(booking.id)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded flex items-center"
                      >
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        Rate Renter
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-100 p-8 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-3">No bookings to display</h2>
          {activeTab === 'pending' && <p>When someone wants to rent your car, their request will appear here.</p>}
          {activeTab === 'current' && <p>Your accepted bookings will appear here.</p>}
          {activeTab === 'past' && <p>Your past, completed or rejected bookings will appear here.</p>}
        </div>
      )}
    </div>
  );
};

export default BookingRequests;
