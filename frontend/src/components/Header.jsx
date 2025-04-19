import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [userRole, setUserRole] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Check authentication status when component mounts and when route changes
  useEffect(() => {
    checkAuthStatus();
  }, [location.pathname]);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    console.log("Checking token:", token ? "Token exists" : "No token");
    
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
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    delete axios.defaults.headers.common['Authorization'];
    setIsLoggedIn(false);
    navigate('/login');
  };

  const toggleRole = () => {
    // Toggle the role
    const newRole = userRole === 'host' ? 'renter' : 'host';
    
    // Store the new role in localStorage
    localStorage.setItem('userRole', newRole);
    setUserRole(newRole);
    
    // Stay on the homepage or navigate there if on another page
    navigate('/');
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
                    to={userRole === 'host' ? '/dashboard/host' : '/dashboard/renter'} 
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
                
                <li>
                  <button 
                    onClick={toggleRole}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded mr-2"
                  >
                    Switch to {userRole === 'host' ? 'Renter' : 'Host'}
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
    </header>
  );
};

export default Header;
