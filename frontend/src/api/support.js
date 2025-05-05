import axios from '../utils/axiosConfig';

export const submitSupportInquiry = async (formData) => {
  try {
    const response = await axios.post('/api/support/inquiry', formData);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error submitting support inquiry:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to submit support inquiry'
    };
  }
};

export const getUserInfo = async () => {
  try {
    const response = await axios.get('/api/support/user-info');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('Error fetching user info:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Failed to fetch user information'
    };
  }
};
