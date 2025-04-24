import axios from 'axios';

const API_URL = 'http://localhost:5000';

// Configure axios with auth token
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// Create a new rating
export const createRating = async (ratingData) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/ratings`,
      ratingData,
      getAuthHeader()
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Create rating error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Error creating rating'
    };
  }
};

// Check if user can rate a booking
export const checkRatingEligibility = async (bookingId) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/ratings/check/${bookingId}`,
      getAuthHeader()
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Check rating eligibility error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Error checking rating eligibility'
    };
  }
};

// Get user ratings
export const getUserRatings = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/api/ratings/user/${userId}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Get user ratings error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Error getting user ratings'
    };
  }
};

// Get car ratings
export const getCarRatings = async (carId) => {
  try {
    const response = await axios.get(`${API_URL}/api/ratings/car/${carId}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Get car ratings error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Error getting car ratings'
    };
  }
};
