import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserBookings } from '../api/bookings';
import { checkRatingEligibility } from '../api/ratings';
import RatingForm from '../components/ratings/RatingForm';
import useAuth from '../hooks/useAuth';

const Review = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const userRole = localStorage.getItem('userRole') || user?.role;
  const isRenter = userRole === 'renter';

  useEffect(() => {
    const fetchBookingAndEligibility = async () => {
      try {
        setLoading(true);
        
        // First, check rating eligibility
        const eligibilityResponse = await checkRatingEligibility(bookingId);
        if (!eligibilityResponse.success) {
          setError(eligibilityResponse.error || 'Failed to check rating eligibility');
          setLoading(false);
          return;
        }

        const eligibilityData = eligibilityResponse.data;
        setEligibility(eligibilityData);

        // If not eligible, show error
        if (!eligibilityData.eligible) {
          setError('You cannot rate this booking at this time. It may have already been rated or is not completed.');
          setLoading(false);
          return;
        }

        // Get booking details
        const bookingsResponse = await getUserBookings();
        if (!bookingsResponse.success) {
          setError(bookingsResponse.error || 'Failed to load booking details');
          setLoading(false);
          return;
        }

        // Find the specific booking
        const foundBooking = bookingsResponse.data.find(b => b.id.toString() === bookingId);
        if (!foundBooking) {
          setError('Booking not found');
          setLoading(false);
          return;
        }

        setBooking(foundBooking);
        setLoading(false);
      } catch (err) {
        setError('An error occurred while loading the booking details');
        setLoading(false);
      }
    };

    fetchBookingAndEligibility();
  }, [bookingId]);

  const handleRatingSuccess = () => {
    // Redirect to booking history
    navigate('/booking-history');
  };

  const handleCancel = () => {
    // Go back to booking history
    navigate('/booking-history');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
        <button
          onClick={() => navigate('/booking-history')}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Back to Bookings
        </button>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          Booking not found
        </div>
        <button
          onClick={() => navigate('/booking-history')}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
        >
          Back to Bookings
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Rate Your Experience</h1>
      <div className="mb-6 bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">
          {booking.brand} {booking.model} ({booking.year})
        </h2>
        <p className="text-gray-700">
          {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
        </p>
      </div>
      <RatingForm
        booking={booking}
        isRenter={eligibility?.isRenter}
        onSuccess={handleRatingSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default Review;
