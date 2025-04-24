import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getAllConversations } from '../../api/messages';
import ConversationItem from '../../components/chat/ConversationItem';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { getToken, clearAuth } from '../../utils/auth';

const Inbox = () => {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { userId } = useParams();

  useEffect(() => {
    const fetchConversations = async () => {
      if (!isAuthenticated) {
        console.log('Not authenticated, skipping conversation fetch');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Get token from localStorage
        const token = getToken();
        if (!token) {
          console.log('No token found in localStorage');
          throw new Error('Authentication token not found. Please log in again.');
        }
        
        console.log(`Using token for messages (first 20 chars): ${token.substring(0, 20)}...`);
        
        // Direct API call for better debugging
        const response = await axios.get('http://localhost:5000/api/messages', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        console.log('Conversations response:', response.data);
        setConversations(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching conversations:', err);
        
        // Handle token expiration specifically
        if (err.response && err.response.status === 401) {
          console.log('Authentication error - token may be expired');
          setError('Your session has expired. Please log in again.');
          
          // Optional: Redirect to login
          // clearAuth();
          // if (logout) logout();
          // setTimeout(() => navigate('/login'), 2000);
        } else {
          setError('Failed to load conversations. Please check your connection and try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [isAuthenticated, navigate, logout]);

  const handleConversationClick = (conversation) => {
    navigate(`/messages/${conversation.other_user_id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl p-4">
      <h1 className="text-2xl font-semibold mb-4">Messages</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          {error.includes('session has expired') && (
            <button 
              onClick={() => {
                clearAuth();
                window.location.href = '/login';
              }}
              className="ml-4 bg-red-500 text-white px-2 py-1 rounded text-sm"
            >
              Log in again
            </button>
          )}
        </div>
      )}

      {!error && conversations.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">You don't have any conversations yet.</p>
          <p className="text-sm text-gray-400 mt-2">
            When you book a car or receive a booking request, you'll be able to message the other party here.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          {conversations.map(conversation => (
            <ConversationItem
              key={conversation.other_user_id}
              conversation={conversation}
              isActive={userId === conversation.other_user_id?.toString()}
              onClick={handleConversationClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Inbox;
