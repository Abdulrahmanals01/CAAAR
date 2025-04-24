import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import { getToken } from '../utils/auth';

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get context values
  const chatContext = useContext(ChatContext);
  const authContext = useContext(AuthContext);
  const unreadCount = chatContext?.unreadCount || 0;

  // Check authentication status when component mounts and when route changes
  useEffect(() => {
    checkAuthStatus();
  }, [location.pathname]);

  const checkAuthStatus = () => {
    const token = getToken();

    if (token) {
      setIsLoggedIn(true);
      // Get user info from localStorage
      setUsername(localStorage.getItem('userName') || 'User');
      setUserRole(localStorage.getItem('userRole') || 'renter');

      // Set auth header for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      setIsLoggedIn(false);
      setUsername('');
      setUserRole('');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  const handleLogout = () => {
    // Use context logout if available
    if (authContext && authContext.logout) {
      authContext.logout();
    } else {
      // Fallback to manual logout
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      localStorage.removeItem('userId');
      delete axios.defaults.headers.common['Authorization'];
    }
    
    setIsLoggedIn(false);
    navigate('/login');
  };

  const handleRoleSwitch = async () => {
    setLoading(true);
    setError('');
    try {
      // Use context switch role if available
      if (authContext && authContext.switchRole) {
        const result = await authContext.switchRole();
        if (result.success) {
          setUserRole(result.newRole);
          window.location.href = '/';
        } else {
          setError('Failed to switch role. Please try again.');
        }
      } else {
        // Fallback to manual role switch
        const token = getToken();
        const currentRole = localStorage.getItem('userRole');
        const newRole = currentRole === 'host' ? 'renter' : 'host';

        console.log('Current role:', currentRole);
        console.log('Switching to role:', newRole);

        const response = await axios.post(
          'http://localhost:5000/api/auth/switch-role',
          { newRole },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );

        console.log('Response:', response.data);

        if (response.data.success || response.data.token) {
          // Update localStorage
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('userRole', response.data.user.role);
          localStorage.setItem('userName', response.data.user.name || username);

          // Set axios default headers
          axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

          // Update state
          setUserRole(response.data.user.role);
          
          // Force page reload
          window.location.href = '/';
        } else {
          console.error('Unexpected response:', response.data);
          setError('Failed to switch role. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error switching role:', error);
      setError('Failed to switch role. Please try again.');
      
      if (error.response && error.response.status === 401) {
        // Token expired, redirect to login
        alert('Your session has expired. Please log in again.');
        handleLogout();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="bg-blue-600 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">Sayarati</Link>

        <nav>
          <ul className="flex space-x-4 items-center">
            <li><Link to="/" className="hover:text-blue-200">Home</Link></li>
            <li><Link to="/cars" className="hover:text-blue-200">Find Cars</Link></li>

            {isLoggedIn ? (
              <>
                <li>
                  <Link
                    to="/dashboard"
                    className="hover:text-blue-200"
                  >
                    Dashboard
                  </Link>
                </li>

                {/* Show List Your Car link only for hosts */}
                {userRole === 'host' && (
                  <li>
                    <Link
                      to="/list-car"
                      className="hover:text-blue-200"
                    >
                      List Your Car
                    </Link>
                  </li>
                )}

                {/* Add message icon with notification badge */}
                <li>
                  <Link to="/messages" className="relative hover:text-blue-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                </li>

                <li>
                  <button
                    onClick={handleRoleSwitch}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded mr-2 disabled:opacity-50"      
                    disabled={loading}
                  >
                    {loading ? 'Switching...' : `Switch to ${userRole === 'host' ? 'Renter' : 'Host'}`}
                  </button>
                </li>
                <li className="flex items-center">
                  <span className="mr-2">Welcome, {username} ({userRole})</span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li><Link to="/login" className="hover:text-blue-200">Login</Link></li>
                <li><Link to="/register" className="hover:text-blue-200">Register</Link></li>
              </>
            )}
          </ul>
        </nav>
      </div>
      {error && (
        <div className="bg-red-100 text-red-700 p-2 text-center">
          {error}
        </div>
      )}
    </header>
  );
};

export default Header;
