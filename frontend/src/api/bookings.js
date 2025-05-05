import axios from '../utils/axiosConfig';

export const createBooking = async (bookingData) => {
  try {
    const response = await axios.post('/api/bookings', bookingData);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Error creating booking'
    };
  }
};

export const getUserBookings = async () => {
  try {
    const response = await axios.get('/api/bookings/user');
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Error fetching bookings'
    };
  }
};

export const updateBookingStatus = async (bookingId, status) => {
  try {
    const response = await axios.put(
      `/api/bookings/${bookingId}/status`,
      { status }
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.log('API error response:', error.response);
    return {
      success: false,
      error: error.response?.data?.message || 'Error updating booking status'
    };
  }
};
