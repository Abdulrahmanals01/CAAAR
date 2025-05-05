import axios from 'axios';

const API_URL = 'http://localhost:5000';

export const getUserProfile = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/api/profiles/${userId}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Get user profile error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Error getting user profile'
    };
  }
};
