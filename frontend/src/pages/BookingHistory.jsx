import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Tab } from '@headlessui/react';

const BookingHistory = () => {
  const [currentBookings, setCurrentBookings] = useState([]);
  const [pastBookings, setPastBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Get user role from local storage
    const userStr = localStorage.getItem('user');
    let role = '';
    
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        role = user.role;
        setUserRole(role);
      } catch (err) {
        console.error('Error parsing user data:', err);
        navigate('/login');
        return;
      }
    } else {
      navigate('/login');
      return;
    }

    // Set up axios defaults
    axios.defaults.headers.common['x-auth-token'] = token;

    // Fetch booking data based on role
    fetchBookings(role);
  }, [navigate]);

  const fetchBookings = async (role) => {
    try {
      setLoading(true);
      
      let currentEndpoint, pastEndpoint, pendingEndpoint;
      
      if (role === 'host' || role === 'admin') {
        currentEndpoint = '/api/bookings/host/current';
        pastEndpoint = '/api/bookings/host/past';
        pendingEndpoint = '/api/bookings/host/pending';
      } else {
        // Default to renter
        currentEndpoint = '/api/bookings/renter/current';
        pastEndpoint = '/api/bookings/renter/past';
        pendingEndpoint = null; // Renters don't have pending bookings to approve
      }
      
      // Fetch current bookings
      const currentRes = await axios.get(`${process.env.REACT_APP_API_URL}${currentEndpoint}`);
      setCurrentBookings(currentRes.data);
      
      // Fetch past bookings
      const pastRes = await axios.get(`${process.env.REACT_APP_API_URL}${pastEndpoint}`);
      setPastBookings(pastRes.data);
      
      // Fetch pending bookings if user is a host
      if (pendingEndpoint) {
        const pendingRes = await axios.get(`${process.env.REACT_APP_API_URL}${pendingEndpoint}`);
        setPendingBookings(pendingRes.data);
      }
      
      setError('');
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load booking history. Please try again.');
      
      // If unauthorized, redirect to login
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusBadge = (status) => {
    let colorClass = '';
    
    switch (status) {
      case 'pending':
        colorClass = 'bg-yellow-100 text-yellow-800';
        break;
      case 'accepted':
        colorClass = 'bg-green-100 text-green-800';
        break;
      case 'rejected':
        colorClass = 'bg-red-100 text-red-800';
        break;
      case 'completed':
        colorClass = 'bg-blue-100 text-blue-800';
        break;
      case 'canceled':
        colorClass = 'bg-gray-100 text-gray-800';
        break;
      default:
        colorClass = 'bg-gray-100 text-gray-800';
    }
    
    return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`;
  };

  const handleAcceptBooking = async (bookingId) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/bookings/${bookingId}/status`,
        { status: 'accepted' }
      );
      
      // Refresh bookings after action
      fetchBookings(userRole);
    } catch (err) {
      console.error('Error accepting booking:', err);
      alert(err.response?.data?.message || 'Error accepting booking');
    }
  };

  const handleRejectBooking = async (bookingId) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/bookings/${bookingId}/status`,
        { status: 'rejected' }
      );
      
      // Refresh bookings after action
      fetchBookings(userRole);
    } catch (err) {
      console.error('Error rejecting booking:', err);
      alert(err.response?.data?.message || 'Error rejecting booking');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Booking History</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}
      
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-blue-100 p-1 mb-6">
          {userRole === 'host' && (
            <Tab
              className={({ selected }) =>
                `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                ${selected 
                  ? 'bg-white shadow text-blue-700' 
                  : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-700'
                }`
              }
            >
              Pending Requests
            </Tab>
          )}
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
              ${selected 
                ? 'bg-white shadow text-blue-700' 
                : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-700'
              }`
            }
          >
            Current Bookings
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5
              ${selected 
                ? 'bg-white shadow text-blue-700' 
                : 'text-blue-500 hover:bg-white/[0.12] hover:text-blue-700'
              }`
            }
          >
            Past Bookings
          </Tab>
        </Tab.List>
        
        <Tab.Panels>
          {userRole === 'host' && (
            <Tab.Panel>
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-xl font-semibold">Pending Booking Requests</h2>
                </div>
                {pendingBookings.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No pending booking requests.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Renter
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Car
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Dates
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {pendingBookings.map((booking) => (
                          <tr key={booking.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{booking.renter_name}</div>
                              <div className="text-sm text-gray-500">{booking.renter_email}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img className="h-10 w-10 rounded-full object-cover" 
                                    src={booking.image ? `${process.env.REACT_APP_API_URL}/${booking.image}` : 'https://via.placeholder.com/40'} 
                                    alt="" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {booking.brand} {booking.model}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {booking.year}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {booking.total_price} SAR
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={getStatusBadge(booking.status)}>
                                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button 
                                onClick={() => handleAcceptBooking(booking.id)}
                                className="text-green-600 hover:text-green-900 mr-4"
                              >
                                Accept
                              </button>
                              <button 
                                onClick={() => handleRejectBooking(booking.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Tab.Panel>
          )}
          
          <Tab.Panel>
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Current Bookings</h2>
              </div>
              {currentBookings.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No current bookings.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {userRole === 'host' ? 'Renter' : 'Host'}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Car
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dates
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentBookings.map((booking) => (
                        <tr key={booking.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {userRole === 'host' ? (
                              <>
                                <div className="text-sm font-medium text-gray-900">{booking.renter_name}</div>
                                <div className="text-sm text-gray-500">{booking.renter_email}</div>
                              </>
                            ) : (
                              <>
                                <div className="text-sm font-medium text-gray-900">{booking.host_name}</div>
                                <div className="text-sm text-gray-500">{booking.host_email}</div>
                              </>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img className="h-10 w-10 rounded-full object-cover" 
                                  src={booking.image ? `${process.env.REACT_APP_API_URL}/${booking.image}` : 'https://via.placeholder.com/40'} 
                                  alt="" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {booking.brand} {booking.model}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {booking.year}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {booking.total_price} SAR
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={getStatusBadge(booking.status)}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Tab.Panel>
          
          <Tab.Panel>
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Past Bookings</h2>
              </div>
              {pastBookings.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No past bookings.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {userRole === 'host' ? 'Renter' : 'Host'}
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Car
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dates
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {pastBookings.map((booking) => (
                        <tr key={booking.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {userRole === 'host' ? (
                              <>
                                <div className="text-sm font-medium text-gray-900">{booking.renter_name}</div>
                                <div className="text-sm text-gray-500">{booking.renter_email}</div>
                              </>
                            ) : (
                              <>
                                <div className="text-sm font-medium text-gray-900">{booking.host_name}</div>
                                <div className="text-sm text-gray-500">{booking.host_email}</div>
                              </>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <img className="h-10 w-10 rounded-full object-cover" 
                                  src={booking.image ? `${process.env.REACT_APP_API_URL}/${booking.image}` : 'https://via.placeholder.com/40'} 
                                  alt="" />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {booking.brand} {booking.model}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {booking.year}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {booking.total_price} SAR
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={getStatusBadge(booking.status)}>
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default BookingHistory;
