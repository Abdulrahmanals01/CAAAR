import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">Sayarati</Link>
        
        <div className="flex items-center space-x-4">
          <Link to="/cars" className="hover:text-blue-200">Find Cars</Link>
          
          {isAuthenticated ? (
            <>
              {user?.role === 'host' && (
                <Link to="/cars/add" className="hover:text-blue-200">Add Car</Link>
              )}
              
              <Link to="/bookings" className="hover:text-blue-200">My Bookings</Link>
              <Link to="/messages" className="hover:text-blue-200">Messages</Link>
              
              <div className="relative group">
                <button className="hover:text-blue-200">
                  {user?.name || 'Account'} ▼
                </button>
                <div className="absolute right-0 w-48 bg-white shadow-lg rounded-md mt-2 py-2 z-10 hidden group-hover:block">
                  <Link to="/profile" className="block px-4 py-2 text-gray-800 hover:bg-blue-100">Profile</Link>
                  
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="block px-4 py-2 text-gray-800 hover:bg-blue-100">Admin Dashboard</Link>
                  )}
                  
                  <button 
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-blue-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-200">Login</Link>
              <Link to="/register" className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100">
cat > /mnt/c/Users/ddodo/OneDrive/Desktop/CAAAR/frontend/src/components/common/Navbar.jsx << 'EOF'
import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">Sayarati</Link>
        
        <div className="flex items-center space-x-4">
          <Link to="/cars" className="hover:text-blue-200">Find Cars</Link>
          
          {isAuthenticated ? (
            <>
              {user?.role === 'host' && (
                <Link to="/cars/add" className="hover:text-blue-200">Add Car</Link>
              )}
              
              <Link to="/bookings" className="hover:text-blue-200">My Bookings</Link>
              <Link to="/messages" className="hover:text-blue-200">Messages</Link>
              
              <div className="relative group">
                <button className="hover:text-blue-200">
                  {user?.name || 'Account'} ▼
                </button>
                <div className="absolute right-0 w-48 bg-white shadow-lg rounded-md mt-2 py-2 z-10 hidden group-hover:block">
                  <Link to="/profile" className="block px-4 py-2 text-gray-800 hover:bg-blue-100">Profile</Link>
                  
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="block px-4 py-2 text-gray-800 hover:bg-blue-100">Admin Dashboard</Link>
                  )}
                  
                  <button 
                    onClick={logout}
                    className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-blue-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-blue-200">Login</Link>
              <Link to="/register" className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
