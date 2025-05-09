import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBooking } from '../../api/bookings';
import useAuth from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/dataFormatter';
import InsuranceModal from './InsuranceModal';

const BookingForm = ({ car }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    start_date: '',
    end_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [basePrice, setBasePrice] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState(null);
  const [days, setDays] = useState(0);

  const isOwnCar = car && car.user_id === user?.id;

  
  useEffect(() => {
    if (car) {
      const today = new Date().toISOString().split('T')[0];
      const availabilityStart = car.availability_start;

      
      const startDate = today > availabilityStart ? today : availabilityStart;

      setFormData({
        start_date: startDate,
        end_date: car.availability_end,
      });
    }
  }, [car]);

  
  useEffect(() => {
    if (formData.start_date && formData.end_date && car) {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const calculatedDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      setDays(calculatedDays);
      const calculatedBasePrice = calculatedDays * car.price_per_day;
      setBasePrice(calculatedBasePrice);
      
      if (selectedInsurance) {
        // If insurance is selected, use the total from insurance calculations
        setTotalPrice(selectedInsurance.totalPrice);
      } else {
        // Otherwise just show the base price
        setTotalPrice(calculatedBasePrice);
      }
    }
  }, [formData, car, selectedInsurance]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Verify user is logged in
    if (!user) {
      setError('You have to login to book a car');
      
      // Save current URL for redirect after login
      localStorage.setItem('redirectAfterLogin', window.location.pathname);
      navigate('/login');
      return;
    }
    
    // Verify not own car
    if (isOwnCar) {
      setError('You cannot book your own car');
      return;
    }

    // Always show insurance modal - insurance selection is mandatory
    setShowInsuranceModal(true);
  };
  
  const handleConfirmBooking = async (insuranceDetails) => {
    setShowInsuranceModal(false);
    setLoading(true);
    setError('');
    setSelectedInsurance(insuranceDetails);
    
    try {
      const bookingData = {
        car_id: car.id,
        start_date: formData.start_date,
        end_date: formData.end_date,
        insurance_type: insuranceDetails.insuranceType,
        insurance_amount: insuranceDetails.insuranceAmount,
        platform_fee: insuranceDetails.platformFeeAmount,
        total_price: insuranceDetails.totalPrice,
        base_price: basePrice
      };

      const response = await createBooking(bookingData);

      if (response.success) {
        setSuccess(true);
        
        const currentRole = user.role;
        
        setTimeout(() => {
          if (localStorage.getItem('userRole') !== currentRole) {
            localStorage.setItem('userRole', currentRole);
          }
          navigate('/dashboard/renter');
        }, 2000);
      } else {
        throw new Error(response.error);
      }
    } catch (err) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  // If not logged in, show message and redirect button
  if (!user) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Book this car</h2>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
          You have to login to book a car
        </div>
        <button
          onClick={() => {
            // Save the current URL to redirect back after login
            localStorage.setItem('redirectAfterLogin', window.location.pathname);
            navigate('/login');
          }}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Log In to Book
        </button>
      </div>
    );
  }
  
  // If car has a pending booking from this user, show a message instead of the booking form
  if (car && car.has_pending_booking) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Book this car</h2>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
          You already have a pending booking request for this car. Please wait for the host to respond to your existing request.
        </div>
        <button
          onClick={() => navigate('/dashboard/renter')}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
        >
          View Your Bookings
        </button>
      </div>
    );
  }

  // If user is a host, admin, or car owner, or if car doesn't exist, don't show booking form
  if (user.role === 'host' || user.role === 'admin' || isOwnCar || !car) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Book this car</h2>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded">
          Booking request sent successfully! Redirecting to your bookings...
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Start Date</label>
          <input
            type="date"
            name="start_date"
            value={formData.start_date}
            onChange={handleChange}
            min={car.availability_start}
            max={car.availability_end}
            required
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">End Date</label>
          <input
            type="date"
            name="end_date"
            value={formData.end_date}
            onChange={handleChange}
            min={formData.start_date}
            max={car.availability_end}
            required
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>

        <div className="mb-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Price Details</h3>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Price per day:</span>
            <span className="font-medium">{formatCurrency(car.price_per_day)} SAR / day</span>
          </div>
          
          {selectedInsurance && (
            <>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Base price ({days} days):</span>
                <span className="font-medium">{formatCurrency(basePrice)} SAR</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Insurance fee ({selectedInsurance.insuranceType === 'full' ? 'Full Coverage' : 'Third Party'}):</span>
                <span className="font-medium">{formatCurrency(selectedInsurance.insuranceAmount)} SAR</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Platform fee:</span>
                <span className="font-medium">{formatCurrency(selectedInsurance.platformFeeAmount)} SAR</span>
              </div>
            </>
          )}
          
          <div className="border-t border-gray-300 my-2"></div>
          <div className="flex justify-between text-lg font-bold">
            <span>Total Price:</span>
            <span>{formatCurrency(totalPrice)} SAR</span>
          </div>
          {selectedInsurance && (
            <p className="text-xs text-gray-500 mt-2">
              * The host receives {formatCurrency(basePrice)} SAR. Insurance and platform fees are added to your total.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Book Now'}
        </button>
      </form>
      
      <InsuranceModal
        isOpen={showInsuranceModal}
        onClose={() => setShowInsuranceModal(false)}
        onConfirm={handleConfirmBooking}
        carPrice={car?.price_per_day}
        days={days}
      />
    </div>
  );
};

export default BookingForm;
