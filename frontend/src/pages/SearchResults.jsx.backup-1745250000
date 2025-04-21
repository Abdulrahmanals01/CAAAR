import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import SearchBar from '../components/SearchBar';

const SearchResults = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useState({});
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    priceMin: 0,
    priceMax: 1000,
    carType: 'all',
    features: []
  });

  // Extract search parameters from URL
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const params = {
      location: queryParams.get('location') || '',
      startDate: queryParams.get('startDate') || '',
      endDate: queryParams.get('endDate') || '',
      startTime: queryParams.get('startTime') || '',
      endTime: queryParams.get('endTime') || ''
    };
    setSearchParams(params);
    searchCars(params);
  }, [location.search]);

  // Search cars based on parameters
  const searchCars = async (params) => {
    try {
      setLoading(true);
      // In a real app, you would send these params to your backend
      // For now, we'll just simulate a delay and fetch all cars
      const response = await axios.get('http://localhost:5000/api/cars');
      // Simulate filtering based on location
      const filteredCars = params.location 
        ? response.data?.filter(car => car.location?.toLowerCase().includes(params.location.toLowerCase())) 
        : response.data || [];
      setCars(filteredCars);
      setLoading(false);
    } catch (error) {
      console.error('Error searching cars:', error);
      setCars([]);
      setLoading(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      // Handle feature checkboxes
      if (checked) {
        setFilters({
          ...filters,
          features: [...filters.features, name]
        });
      } else {
        setFilters({
          ...filters,
          features: filters.features.filter(feature => feature !== name)
        });
      }
    } else {
      // Handle other filters
      setFilters({
        ...filters,
        [name]: value
      });
    }
  };

  // Apply filters to cars
  const filteredCars = cars.filter(car => {
    // Filter by price
    const price = car.price_per_day || 0;
    if (price < filters.priceMin || price > filters.priceMax) {
      return false;
    }
    
    // Filter by car type
    if (filters.carType !== 'all' && car.type !== filters.carType) {
      return false;
    }
    
    // Filter by features
    if (filters.features.length > 0) {
      // For a real app, you would check if the car has all selected features
      // This is just a placeholder implementation
      return true;
    }
    
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search bar at the top for refining search */}
      <div className="mb-8">
        <SearchBar />
      </div>
      
      {/* Search parameters summary */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-2">
          {filteredCars.length} cars available in {searchParams.location || 'All locations'}
        </h2>
        <p>
          From {searchParams.startDate} {searchParams.startTime} to {searchParams.endDate} {searchParams.endTime}
        </p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters sidebar */}
        <div className="w-full md:w-1/4">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Filters</h3>
            
            {/* Price range */}
            <div className="mb-4">
              <h4 className="font-medium mb-2">Price range</h4>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="priceMin"
                  value={filters.priceMin}
                  onChange={handleFilterChange}
                  className="w-full p-2 border rounded-md"
                  min="0"
                  max={filters.priceMax}
                />
                <span>to</span>
                <input
                  type="number"
                  name="priceMax"
                  value={filters.priceMax}
                  onChange={handleFilterChange}
                  className="w-full p-2 border rounded-md"
                  min={filters.priceMin}
                />
              </div>
            </div>
            
            {/* Car type */}
            <div className="mb-4">
              <h4 className="font-medium mb-2">Car type</h4>
              <select
                name="carType"
                value={filters.carType}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">All types</option>
                <option value="sedan">Sedan</option>
                <option value="suv">SUV</option>
                <option value="truck">Truck</option>
                <option value="sports">Sports</option>
                <option value="luxury">Luxury</option>
              </select>
            </div>
            
            {/* Features */}
            <div className="mb-4">
              <h4 className="font-medium mb-2">Features</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input 
                    type="checkbox"
                    name="air_conditioning"
                    checked={filters.features.includes('air_conditioning')}
                    onChange={handleFilterChange}
                    className="mr-2"
                  />
                  Air conditioning
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox"
                    name="bluetooth"
                    checked={filters.features.includes('bluetooth')}
                    onChange={handleFilterChange}
                    className="mr-2"
                  />
                  Bluetooth
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox"
                    name="navigation"
                    checked={filters.features.includes('navigation')}
                    onChange={handleFilterChange}
                    className="mr-2"
                  />
                  Navigation system
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox"
                    name="child_seat"
                    checked={filters.features.includes('child_seat')}
                    onChange={handleFilterChange}
                    className="mr-2"
                  />
                  Child seat
                </label>
              </div>
            </div>
          </div>
        </div>
        
        {/* Car listings */}
        <div className="w-full md:w-3/4">
          {loading ? (
            <div className="text-center py-8">Loading cars...</div>
          ) : filteredCars.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow-md text-center">
              <h3 className="text-xl font-semibold mb-2">No cars found</h3>
              <p className="text-gray-600 mb-4">Try adjusting your search parameters or filters</p>
              <Link 
                to="/"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Return to homepage
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredCars.map((car, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{car.make || 'Brand'} {car.model || 'Model'}</h3>
                        <p className="text-gray-600">{car.year || '2023'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-green-600 font-bold">${car.price_per_day || '50'}/day</p>
                        <p className="text-gray-500 text-sm">Total: ${(car.price_per_day || 50) * 3}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-gray-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{car.location || 'Riyadh, Saudi Arabia'}</span>
                    </div>
                    <div className="mt-4 flex justify-between">
                      <div className="flex items-center text-sm">
                        <span className="text-yellow-500 flex">
                          {'★'.repeat(5)} 
                        </span>
                        <span className="ml-1">(27)</span>
                      </div>
                      <Link 
                        to={`/cars/${car.id || index}`} 
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
