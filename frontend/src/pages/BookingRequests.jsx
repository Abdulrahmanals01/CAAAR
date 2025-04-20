import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BookingRequests = () => {
  const [bookingRequests, setBookingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Simulated data since we don't have the actual API endpoint yet
    const mockData = [
      {
        id: 1,
        carId: 1,
        carBrand: 'Toyota',
        carModel: 'Camry',
        carImage: 'http://localhost:5000/uploads/cars/image-1745080430449-981097850.png',
        renterName: 'John Smith',
        startDate: '2025-04-25',
        endDate: '2025-04-28',
        totalPrice: 450,
        status: 'pending'
      },
      {
        id: 2,
        carId: 2,
        carBrand: 'Honda',
        carModel: 'Accord',
        carImage: 'http://localhost:5000/uploads/cars/image-1745080537102-628177336.png',
        renterName: 'Sarah Johnson',
        startDate: '2025-05-01',
        endDate: '2025-05-03',
        totalPrice: 350,
        status: 'pending'
      }
    ];
    
    // Simulate API call
    setTimeout(() => {
      setBookingRequests(mockData);
      setLoading(false);
    }, 1000);
    
    // In a real application, you would fetch from your API:
    /*
    const fetchBookingRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/bookings/requests', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setBookingRequests(response.data);
      } catch (err) {
        console.error('Error fetching booking requests:', err);
        setError('Failed to load booking requests. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBookingRequests();
    */
  }, []);

  const handleAcceptBooking = async (bookingId) => {
    try {
      setBookingRequests(prev => 
        prev.map(booking => 
          booking.id === bookingId ? { ...booking, status: 'accepted' } : booking
        )
      );
      // In real application:
      /*
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/bookings/${bookingId}/accept`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      */
    } catch (err) {
      console.error('Error accepting booking:', err);
      setError('Failed to accept booking. Please try again.');
    }
  };

  const handleRejectBooking = async (bookingId) => {
    try {
      setBookingRequests(prev => 
        prev.map(booking => 
          booking.id === bookingId ? { ...booking, status: 'rejected' } : booking
        )
      );
      // In real application:
      /*
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/bookings/${bookingId}/reject`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      */
    } catch (err) {
      console.error('Error rejecting booking:', err);
      setError('Failed to reject booking. Please try again.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Booking Requests</h1>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : bookingRequests.length > 0 ? (
        <div className="space-y-6">
          {bookingRequests.map(booking => (
            <div key={booking.id} className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="md:flex">
                <div className="md:flex-shrink-0">
                  <img 
                    className="h-48 w-full object-cover md:w-48" 
                    src={booking.carImage} 
                    alt={`${booking.carBrand} ${booking.carModel}`} 
                  />
                </div>
                <div className="p-6 w-full">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-xl font-semibold">{booking.carBrand} {booking.carModel}</h2>
                      <p className="text-gray-600">Requested by: {booking.renterName}</p>
                    </div>
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Dates</h3>
                      <p>{new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Duration</h3>
                      <p>{Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24))} days</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Total Price</h3>
                      <p className="font-semibold">{booking.totalPrice} SAR</p>
                    </div>
                  </div>
                  
                  {booking.status === 'pending' && (
                    <div className="mt-6 flex space-x-3">
                      <button 
                        onClick={() => handleAcceptBooking(booking.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                      >
                        Accept
                      </button>
                      <button 
                        onClick={() => handleRejectBooking(booking.id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                      >
                        Reject
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
          <h2 className="text-xl font-semibold mb-3">No booking requests yet</h2>
          <p>When someone wants to rent your car, their request will appear here.</p>
        </div>
      )}
    </div>
  );
};

export default BookingRequests;
