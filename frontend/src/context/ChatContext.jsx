import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // Initialize socket connection when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token available for socket connection');
          setConnectionError('No authentication token found');
          return;
        }

        console.log('Connecting to socket with token:', token ? 'Valid token' : 'No token');
        const newSocket = io('http://localhost:5000', {
          auth: { token }
        });

        newSocket.on('connect', () => {
          console.log('Socket connected successfully');
          setIsConnected(true);
          setConnectionError(null);
        });

        newSocket.on('disconnect', () => {
          console.log('Socket disconnected');
          setIsConnected(false);
        });

        newSocket.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
          setIsConnected(false);
          setConnectionError(err.message);
        });

        setSocket(newSocket);

        // Initial unread count
        fetchUnreadCount();

        return () => {
          console.log('Disconnecting socket');
          newSocket.disconnect();
        };
      } catch (error) {
        console.error('Error setting up socket:', error);
        setConnectionError(error.message);
      }
    }
  }, [isAuthenticated]);

  // Fetch unread message count
  const fetchUnreadCount = async () => {
    try {
      // For now, just set a default value
      setUnreadCount(0);
      
      // Real implementation would call the API
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // This is just a placeholder, we're just setting default value above
      /*
      const response = await fetch('http://localhost:5000/api/messages/unread/count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.unreadCount || 0);
      }
      */
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Send a message
  const sendMessage = (receiverId, message, bookingId = null) => {
    if (socket && message.trim()) {
      const messageData = {
        receiver_id: receiverId,
        message: message.trim(),
        booking_id: bookingId
      };
      
      socket.emit('send_message', messageData);
      return true;
    }
    return false;
  };

  // Mark messages as read
  const markMessagesAsRead = (senderId) => {
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <ChatContext.Provider value={{
      socket,
      isConnected,
      connectionError,
      unreadCount,
      sendMessage,
      markMessagesAsRead,
      refreshUnreadCount: fetchUnreadCount
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
