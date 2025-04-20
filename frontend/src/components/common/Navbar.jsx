import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, currentUser, logout, switchRole } = useContext(AuthContext);
  const [isSwitching, setIsSwitching] = useState(false);
  const navigate = useNavigate();
  
  const handleRoleSwitch = async () => {
    setIsSwitching(true);
    
    try {
      const result = await switchRole();
      
      if (result.success) {
        // Show success message
        alert(`You are now in ${result.newRole} mode`);
        
        // Reload the page to reflect the changes
        window.location.reload();
      } else {
        // Show error message
        alert('Failed to switch roles. Please try again.');
      }
    } catch (error) {
      console.error('Error switching roles:', error);
      alert('An error occurred while switching roles.');
    } finally {
      setIsSwitching(false);
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };
  
  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold">Sayarati</Link>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="hover:text-blue-200 transition">Home</Link>
            <Link to="/cars/search" className="hover:text-blue-200 transition">Find Cars</Link>
            
            {isAuthenticated && (
              <>
                <Link to="/dashboard" className="hover:text-blue-200 transition">Dashboard</Link>
                
                {currentUser?.role === 'host' && (
                  <Link to="/list-car" className="hover:text-blue-200 transition">List Your Car</Link>
                )}
              </>
            )}
          </div>
          
          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Role Switch Button */}
                <button
                  onClick={handleRoleSwitch}
                  disabled={isSwitching}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md transition disabled:opacity-50"
                >
                  {isSwitching ? 'Switching...' : `Switch to ${currentUser?.role === 'host' ? 'Renter' : 'Host'}`}
                </button>
                
                {/* User Info */}
                <span className="hidden md:inline">
                  Welcome, {currentUser?.name || 'User'} ({currentUser?.role})
                </span>
                
                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-white border border-white px-4 py-2 rounded-md hover:bg-white hover:text-blue-600 transition">
                  Login
                </Link>
                <Link to="/register" className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100 transition">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
