import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import SearchBar from '../components/SearchBar';

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication status
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    // Fetch cars
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/cars');
      console.log('Fetched cars:', response.data);
      setCars(response.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cars:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-10">Loading...</div>;
  }

  return (
    <div>
      {/* Hero section with background image */}
      <div
        className="relative bg-cover bg-center h-96 flex items-center justify-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=2000&auto=format&fit=crop')",
          backgroundPosition: 'center 60%'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="relative text-center text-white z-10 px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Find your perfect ride</h1>
          <p className="text-xl md:text-2xl mb-8">
            Rent the car you need for your next adventure in Saudi Arabia
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <SearchBar />

      <div className="container mx-auto px-4 py-12">
        {/* Welcome message */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold mb-4">Welcome to Sayarati</h2>
          <p className="text-xl text-gray-600 mb-6">
            The premier car sharing platform in Saudi Arabia
          </p>

          {isLoggedIn ? (
            <div className="bg-green-100 p-4 max-w-md mx-auto rounded">
              <p className="text-green-800">
                You are logged in! You can now browse and book cars or manage your listings.
              </p>
            </div>
          ) : (
            <div className="space-x-4">
              <Link
                to="/login"
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Featured Cars */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Featured Cars</h2>

          {cars.length === 0 ? (
            <p className="text-center text-gray-500">No cars available at the moment.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cars.slice(0, 6).map((car, index) => (
                <div key={car.id || index} className="bg-white p-4 rounded shadow-md hover:shadow-lg transition-shadow">     
                  {car.image_url ? (
                    <img
                      src={car.image_url}
                      alt={`${car.brand} ${car.model}`}
                      className="w-full h-48 object-cover mb-4 rounded"
                      onError={(e) => {
                        console.error("Image failed to load:", car.image_url);
                        e.target.src = "https://via.placeholder.com/400x300?text=Car+Image";
                      }}
                    />
                  ) : (
                    <div className="bg-gray-200 h-48 mb-4 rounded flex items-center justify-center">
                      <span className="text-gray-500">No image available</span>
                    </div>
                  )}
                  <h3 className="font-bold text-lg">{car.brand || car.make || 'Brand'} {car.model || 'Model'}</h3>
                  <p className="text-gray-600">{car.year || '2023'} • {car.location || 'Riyadh'}</p>
                  <p className="text-green-600 font-bold mt-2">${car.price_per_day || '50'}/day</p>
                  <Link
                    to={isLoggedIn ? `/cars/${car.id}` : '/login'}
                    className="block mt-4 text-center bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    {isLoggedIn ? 'View Details' : 'Login to Book'}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How it works section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8 text-center">How Sayarati Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Search for a Car</h3>
              <p className="text-gray-600">Find the perfect car for your needs and schedule in our diverse selection.</p>    
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Book Your Trip</h3>
              <p className="text-gray-600">Book instantly with your verified account. No waiting for approval.</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Hit the Road</h3>
              <p className="text-gray-600">Pick up the car and enjoy your journey with full insurance coverage.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
