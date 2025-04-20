import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Create a new booking
export const createBooking = async (bookingData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const response = await axios.post(`${API_URL}/api/bookings`, bookingData, config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Error creating booking'
    };
  }
};

// Get user's bookings
export const getUserBookings = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const response = await axios.get(`${API_URL}/api/bookings/user`, config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Error fetching bookings'
    };
  }
};

// Update booking status (accept/reject/cancel)
export const updateBookingStatus = async (bookingId, status) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return { success: false, error: 'Authentication required' };
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const response = await axios.put(
      `${API_URL}/api/bookings/${bookingId}/status`,
      { status },
      config
    );
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Error updating booking status'
    };
  }
};
