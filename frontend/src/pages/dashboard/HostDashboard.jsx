import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const HostDashboard = () => {
  const [activeTab, setActiveTab] = useState('current');
  const [allCars, setAllCars] = useState([]);
  const [currentListings, setCurrentListings] = useState([]);
  const [pastListings, setPastListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    fetchHostData();
  }, []);

  const fetchHostData = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('userRole');
      const userId = getUserIdFromToken(token);
      
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      if (userRole !== 'host') {
        setError('Only hosts can access this dashboard');
        setLoading(false);
        return;
      }

      // Set auth header
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      console.log('Fetching host cars with token:', token.substring(0, 20) + '...');
      console.log('User ID from token:', userId);
      console.log('User role:', userRole);

      try {
        // Get all cars first
        const allCarsResponse = await axios.get('http://localhost:5000/api/cars', config);
        console.log('All cars response:', allCarsResponse.data);
        
        // Filter cars by user ID to find host's cars
        const userCars = allCarsResponse.data.filter(car => car.user_id === userId);
        console.log('Filtered cars by user ID:', userCars);
        
        setAllCars(userCars);
        
        // Separate current and past listings based on availability dates
        const currentDate = new Date();
        
        const current = userCars.filter(car => 
          !car.availability_end || 
          new Date(car.availability_end) >= currentDate
        );
        
        const past = userCars.filter(car => 
          car.availability_end && 
          new Date(car.availability_end) < currentDate
        );
        
        setCurrentListings(current);
        setPastListings(past);
        
        setDebugInfo({
          userId,
          userRole,
          allCarsCount: allCarsResponse.data.length,
          filteredCarsCount: userCars.length,
          currentDate: currentDate.toISOString(),
          currentCount: current.length,
          pastCount: past.length
        });
        
      } catch (err) {
        console.error('Error fetching cars:', err);
        setError('Failed to load your car listings. Please try again later.');
        setDebugInfo(prev => ({ 
          ...prev, 
          fetchError: err.message,
          errorResponse: err.response?.data
        }));
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error in dashboard:', err);
      setError('Failed to load dashboard data. Please try again later.');
      setLoading(false);
    }
  };

  // Helper function to decode JWT token and get user ID
  const getUserIdFromToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.user?.id;
    } catch (e) {
      console.error('Error parsing token:', e);
      return null;
    }
  };

  const handleDeleteCar = async (carId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/cars/${carId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      // Update the listings after deletion
      setCurrentListings(currentListings.filter(car => car.id !== carId));
      setAllCars(allCars.filter(car => car.id !== carId));
      alert('Car listing deleted successfully');
    } catch (err) {
      console.error('Error deleting car:', err);
      alert('Failed to delete car listing: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Host Dashboard</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Tab navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex -mb-px">
          <button
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'current' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('current')}
          >
            Current Listings
          </button>
          <button
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'past' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('past')}
          >
            Past Listings
          </button>
          <button
            className={`py-4 px-6 font-medium text-sm ${
              activeTab === 'debug' 
                ? 'border-b-2 border-blue-500 text-blue-600' 
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('debug')}
          >
            Debug Info
          </button>
        </nav>
      </div>
      
      {/* Add new listing button */}
      <div className="mb-6">
        <Link
          to="/list-car"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          + Add New Listing
        </Link>
      </div>
      
      {/* Current listings tab content */}
      {activeTab === 'current' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Current Listings</h2>
          
          {currentListings.length === 0 ? (
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <p className="text-gray-600 mb-4">You don't have any current car listings.</p>
              <Link
                to="/list-car"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                List Your First Car
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentListings.map((car, index) => (
                <div key={car.id || index} className="bg-white rounded-lg shadow-md overflow-hidden">
                  {car.image_url ? (
                    <img 
                      src={car.image_url} 
                      alt={`${car.brand || car.make} ${car.model}`} 
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">No image</span>
                    </div>
                  )}
                  
                  <div className="p-4">
                    <h3 className="font-bold text-lg">
                      {car.brand || car.make} {car.model} ({car.year})
                    </h3>
                    <p className="text-gray-600 mb-2">{car.location}</p>
                    <p className="text-green-600 font-bold">
                      ${car.price_per_day}/day
                    </p>
                    
                    <div className="mt-4 flex justify-between items-center">
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button
                        className="bg-blue-600 text-center text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        onClick={() => window.location.href = `/cars/${car.id}`}
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleDeleteCar(car.id)}
                        className="bg-red-600 text-center text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      >
                        Cancel Listing
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* Past listings tab content */}
      {activeTab === 'past' && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Past Listings</h2>
          
          {pastListings.length === 0 ? (
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <p className="text-gray-600">You don't have any past car listings.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastListings.map((car, index) => (
                <div key={car.id || index} className="bg-white rounded-lg shadow-md overflow-hidden opacity-80">
                  {car.image_url ? (
                    <img 
                      src={car.image_url} 
                      alt={`${car.brand || car.make} ${car.model}`} 
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500">No image</span>
                    </div>
                  )}
                  
                  <div className="p-4">
                    <h3 className="font-bold text-lg">
                      {car.brand || car.make} {car.model} ({car.year})
                    </h3>
                    <p className="text-gray-600 mb-2">{car.location}</p>
                    <p className="text-green-600 font-bold">
                      ${car.price_per_day}/day
                    </p>
                    
                    <div className="mt-4">
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                        Expired
                      </span>
                      <p className="text-sm text-gray-500 mt-2">
                        Listed until: {new Date(car.availability_end).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="mt-3">
                      <button
                        className="w-full bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                        onClick={() => {
                          // Re-list functionality
                          alert('Re-listing feature coming soon!');
                        }}
                      >
                        Relist This Car
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Debug information tab */}
      {activeTab === 'debug' && (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <div className="mb-4">
            <h3 className="font-medium text-lg mb-2">Summary</h3>
            <ul className="list-disc ml-5">
              <li>User ID: {debugInfo.userId}</li>
              <li>Role: {debugInfo.userRole}</li>
              <li>Total Cars in System: {debugInfo.allCarsCount}</li>
              <li>Your Cars: {debugInfo.filteredCarsCount}</li>
              <li>Current Listings: {debugInfo.currentCount}</li>
              <li>Past Listings: {debugInfo.pastCount}</li>
            </ul>
          </div>
          
          <div className="mb-4">
            <h3 className="font-medium text-lg mb-2">Your Car Data</h3>
            <div className="bg-gray-100 p-4 rounded overflow-auto max-h-60">
              <pre className="text-xs">{JSON.stringify(allCars, null, 2)}</pre>
            </div>
          </div>
          
          <div className="mt-4">
            <button
              onClick={fetchHostData}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostDashboard;
