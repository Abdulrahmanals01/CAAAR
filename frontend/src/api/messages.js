import axios from 'axios';
const API_URL = 'http://localhost:5000'; // Use direct URL to avoid environment variable issues

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

export const sendMessage = async (messageData) => {
  try {
    const response = await axios.post(
      `${API_URL}/api/messages`,
      messageData,
      getAuthHeader()
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Send message error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Error sending message'
    };
  }
};

export const getConversation = async (userId) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/messages/${userId}`,
      getAuthHeader()
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Get conversation error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Error fetching conversation'
    };
  }
};

export const getBookingMessages = async (bookingId) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/messages/booking/${bookingId}`,
      getAuthHeader()
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Get booking messages error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Error fetching booking messages'
    };
  }
};

export const getAllConversations = async () => {
  try {
    
    const token = localStorage.getItem('token');
    console.log('Using token:', token ? token.substring(0, 15) + '...' : 'no token');
    
    const response = await axios.get(
      `${API_URL}/api/messages`,
      getAuthHeader()
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Get conversations error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Error fetching conversations'
    };
  }
};

export const getUnreadCount = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/api/messages/unread/count`,
      getAuthHeader()
    );
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Get unread count error:', error);
    return {
      success: false,
      error: error.response?.data?.message || 'Error fetching unread count'
    };
  }
};
