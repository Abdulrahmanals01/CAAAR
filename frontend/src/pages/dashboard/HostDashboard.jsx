import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HostDashboard = () => {
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHostData = async () => {
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

        // Fetch the host's cars
        const carsResponse = await axios.get('http://localhost:5000/api/cars/owner', config);
        setCars(carsResponse.data);

        // Fetch bookings for the host's cars
        const bookingsResponse = await axios.get('http://localhost:5000/api/bookings/host', config);
        setBookings(bookingsResponse.data);
        
        setLoading(false);
      } catch (err) {
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchHostData();
  }, []);

  if (loading) return <div className="text-center p-10">Loading...</div>;
  if (error) return <div className="text-red-500 text-center p-10">{error}</div>;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Host Dashboard</h1>
      
      <div className="mb-10">
        <h2 className="text-2xl font-semibold mb-4">Your Cars</h2>
        {cars.length === 0 ? (
          <p>You haven't listed any cars yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.map(car => (
              <div key={car.id} className="border rounded-lg p-4 shadow-sm">
                <h3 className="font-bold text-lg">{car.make} {car.model} ({car.year})</h3>
                <p className="text-gray-600">{car.location}</p>
                <p className="text-green-600 font-bold mt-2">${car.price_per_day}/day</p>
                <p className="mt-2">Status: <span className={car.is_available ? 'text-green-500' : 'text-red-500'}>
                  {car.is_available ? 'Available' : 'Unavailable'}
                </span></p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold mb-4">Bookings</h2>
        {bookings.length === 0 ? (
          <p>You don't have any bookings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 text-left">Car</th>
                  <th className="py-2 px-4 text-left">Renter</th>
                  <th className="py-2 px-4 text-left">From</th>
                  <th className="py-2 px-4 text-left">To</th>
                  <th className="py-2 px-4 text-left">Status</th>
                  <th className="py-2 px-4 text-left">Amount</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map(booking => (
                  <tr key={booking.id} className="border-b">
                    <td className="py-2 px-4">{booking.car.make} {booking.car.model}</td>
                    <td className="py-2 px-4">{booking.renter.first_name} {booking.renter.last_name}</td>
                    <td className="py-2 px-4">{new Date(booking.start_date).toLocaleDateString()}</td>
                    <td className="py-2 px-4">{new Date(booking.end_date).toLocaleDateString()}</td>
                    <td className="py-2 px-4">
                      <span className={
                        booking.status === 'approved' ? 'text-green-500' :
                        booking.status === 'pending' ? 'text-yellow-500' :
                        'text-red-500'
                      }>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-2 px-4">${booking.total_price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HostDashboard;
