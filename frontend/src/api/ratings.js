import axios from '../utils/axiosConfig';

// Create a new rating
export const createRating = async (ratingData) => {
  try {
    const response = await axios.post('/api/ratings', ratingData);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error creating rating:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Error creating rating'
    };
  }
};

// Check if user can rate a booking
export const checkRatingEligibility = async (bookingId) => {
  try {
    const response = await axios.get(`/api/ratings/check/${bookingId}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error checking rating eligibility:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Error checking rating eligibility'
    };
  }
};

// Get ratings for a car
export const getCarRatings = async (carId) => {
  try {
    const response = await axios.get(`/api/ratings/car/${carId}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error getting car ratings:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Error getting car ratings'
    };
  }
};

// Get ratings for a user
export const getUserRatings = async (userId) => {
  try {
    const response = await axios.get(`/api/ratings/user/${userId}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Error getting user ratings:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Error getting user ratings'
    };
  }
};
