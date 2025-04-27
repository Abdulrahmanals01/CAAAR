import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getConversation, sendMessage as apiSendMessage } from '../../api/messages';
import { AuthContext } from '../../context/AuthContext';
import { ChatContext } from '../../context/ChatContext';
import ChatMessage from '../../components/chat/ChatMessage';
import ChatInput from '../../components/chat/ChatInput';
import { IoArrowBack } from 'react-icons/io5';

const Conversation = () => {
  const { userId } = useParams();
  const { user: currentUser, loading: authLoading } = useContext(AuthContext);
  const { socket, markMessagesAsRead } = useContext(ChatContext);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [lastMessageId, setLastMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  // Initial load of conversation
  useEffect(() => {
    const fetchConversation = async () => {
      if (!currentUser || !currentUser.id) return;
      
      try {
        setLoading(true);
        const response = await getConversation(userId);

        if (response.success) {
          setMessages(response.data);

          // Set other user info
          if (response.data.length > 0) {
            const msg = response.data[0];
            const isOtherUserSender = msg.sender_id.toString() === userId;

            setOtherUser({
              id: userId,
              name: isOtherUserSender ? msg.sender_name : msg.receiver_name
            });

            // Set the last message ID for incremental updates
            if (response.data.length > 0) {
              const ids = response.data.map(m => m.id).filter(id => id);
              setLastMessageId(Math.max(...ids, 0));
            }
          }

          // Mark as read
          markMessagesAsRead(userId);
        } else {
          setError('Failed to load conversation');
        }
      } catch (err) {
        setError('An error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (userId && currentUser && currentUser.id) {
      fetchConversation();
    }
  }, [userId, currentUser]);

  // Fetch only new messages periodically
  useEffect(() => {
    if (!userId || loading || !currentUser || !currentUser.id) return;

    const fetchNewMessages = async () => {
      try {
        // In a real implementation, you would have an API endpoint that accepts a 'since' parameter
        // For now, we'll use the existing endpoint and filter client-side
        const response = await getConversation(userId);

        if (response.success) {
          const existingIds = new Set(messages.map(m => m.id));
          const newMsgs = response.data.filter(m => !existingIds.has(m.id) && m.id > lastMessageId);

          if (newMsgs.length > 0) {
            setMessages(prev => [...prev, ...newMsgs]);

            // Update last message ID
            const ids = newMsgs.map(m => m.id).filter(id => id);
            if (ids.length > 0) {
              setLastMessageId(Math.max(...ids, lastMessageId));
            }

            // Mark new messages as read
            markMessagesAsRead(userId);
          }
        }
      } catch (err) {
        console.error('Error fetching new messages:', err);
        // Don't show error to user for background refreshes
      }
    };

    const intervalId = setInterval(fetchNewMessages, 5000);
    return () => clearInterval(intervalId);
  }, [userId, messages, lastMessageId, loading, currentUser]);

  // Listen for new messages from socket
  useEffect(() => {
    if (socket && currentUser && currentUser.id) {
      const handleNewMessage = (message) => {
        // Add message if it's from this conversation
        if ((message.sender_id.toString() === userId && message.receiver_id === currentUser.id) ||
            (message.sender_id === currentUser.id && message.receiver_id.toString() === userId)) {

          // Check if message is already in our state to avoid duplicates
          setMessages(prev => {
            if (!prev.some(m => m.id === message.id)) {
              return [...prev, message];
            }
            return prev;
          });

          // Mark as read if we are the receiver
          if (message.receiver_id === currentUser.id) {
            markMessagesAsRead(userId);
          }
        }
      };

      socket.on('receive_message', handleNewMessage);
      socket.on('message_sent', handleNewMessage);

      return () => {
        socket.off('receive_message', handleNewMessage);
        socket.off('message_sent', handleNewMessage);
      };
    }
  }, [socket, userId, currentUser, markMessagesAsRead]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSendMessage = async (messageText) => {
    if (!messageText.trim() || !currentUser || !currentUser.id) return;

    try {
      // Optimistically add the message to the UI
      const tempId = `temp-${Date.now()}`;
      const newMessage = {
        id: tempId,
        sender_id: currentUser.id,
        receiver_id: parseInt(userId),
        message: messageText,
        created_at: new Date().toISOString(),
        sender_name: currentUser.name || 'You',
        read: false
      };

      setMessages(prev => [...prev, newMessage]);

      // Send via API
      const response = await apiSendMessage({
        receiver_id: parseInt(userId),
        message: messageText
      });

      if (!response.success) {
        // Remove the temporary message and show error
        setMessages(prev => prev.filter(m => m.id !== tempId));
        setError('Failed to send message');
      } else {
        // Replace temp message with real one if needed
        const realMessage = response.data;
        if (realMessage && realMessage.id) {
          setMessages(prev =>
            prev.map(m => m.id === tempId ? {...realMessage, sender_name: currentUser.name || 'You'} : m)
          );

          // Update last message ID
          if (realMessage.id > lastMessageId) {
            setLastMessageId(realMessage.id);
          }
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    }
  };

  const handleBack = () => {
    navigate('/messages');
  };

  if (authLoading || loading) {
    return <div className="text-center p-4">Loading conversation...</div>;
  }

  if (!currentUser) {
    return <div className="text-center p-4">Please log in to view messages.</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b p-3 flex items-center">
        <button
          onClick={handleBack}
          className="mr-4 p-1 rounded-full hover:bg-gray-100"
        >
          <IoArrowBack size={24} />
        </button>

        <div>
          <h2 className="font-medium">{otherUser?.name || 'Chat'}</h2>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {error && <div className="text-red-500 mb-4">{error}</div>}

        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-400">
            <p>No messages yet. Start the conversation.</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id || `temp-${message.created_at}`}
              message={message}
              isCurrentUser={message.sender_id === currentUser.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSendMessage} />
    </div>
  );
};

export default Conversation;
