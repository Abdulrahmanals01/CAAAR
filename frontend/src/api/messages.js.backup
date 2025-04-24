import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

// Send a new message
export const sendMessage = async (messageData) => {
  try {
    const response = await axios.post(`${API_URL}/api/messages`, messageData);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error sending message' 
    };
  }
};

// Get conversation with specific user
export const getConversation = async (userId) => {
  try {
    const response = await axios.get(`${API_URL}/api/messages/${userId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error fetching conversation' 
    };
  }
};

// Get messages related to a specific booking
export const getBookingMessages = async (bookingId) => {
  try {
    const response = await axios.get(`${API_URL}/api/messages/booking/${bookingId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error fetching booking messages' 
    };
  }
};

// Mark all messages in a conversation as read
export const markConversationAsRead = async (conversationId) => {
  try {
    const response = await axios.put(`${API_URL}/api/messages/read/${conversationId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error marking messages as read' 
    };
  }
};

// Get all conversations
export const getAllConversations = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/messages`);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error fetching conversations' 
    };
  }
};
