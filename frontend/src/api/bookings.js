import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Create a new booking
export const createBooking = async (bookingData) => {
  try {
    const response = await axios.post(`${API_URL}/api/bookings`, bookingData);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error creating booking' 
    };
  }
};

// Get user's bookings (as renter)
export const getUserBookings = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/bookings/renter`);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error fetching your bookings' 
    };
  }
};

// Get host's bookings
export const getHostBookings = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/bookings/host`);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error fetching host bookings' 
    };
  }
};

// Get booking by ID
export const getBookingById = async (bookingId) => {
  try {
    const response = await axios.get(`${API_URL}/api/bookings/${bookingId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error fetching booking details' 
    };
  }
};

// Update booking status (as host)
export const updateBookingStatus = async (bookingId, status) => {
  try {
    const response = await axios.put(`${API_URL}/api/bookings/${bookingId}/status`, { status });
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error updating booking status' 
    };
  }
};

// Cancel booking (as renter)
export const cancelBooking = async (bookingId) => {
  try {
    const response = await axios.put(`${API_URL}/api/bookings/${bookingId}/cancel`);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error canceling booking' 
    };
  }
};

// Create rating for a completed booking
export const createRating = async (ratingData) => {
  try {
    const response = await axios.post(`${API_URL}/api/ratings`, ratingData);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error submitting rating' 
    };
  }
};
