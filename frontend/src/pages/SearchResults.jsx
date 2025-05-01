import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import SearchBar from '../components/SearchBar';
import MapView from '../components/cars/MapView';
import CarCard from '../components/cars/CarCard';

const SearchResults = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useState({});
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState(null);
  const [viewMode, setViewMode] = useState('split'); // 'grid', 'map', or 'split'
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

  // Check window size on component mount and resize
  useEffect(() => {
    const handleResize = () => {
      // Only show split view by default on larger screens
      setViewMode(window.innerWidth >= 768 ? 'split' : 'grid');
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Search cars based on parameters
  const searchCars = async (params) => {
    try {
      setLoading(true);
      // In a real app, you would send these params to your backend
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
    const carPrice = parseFloat(car.price_per_day) || 0;
    const minPrice = parseFloat(filters.priceMin) || 0;
    const maxPrice = parseFloat(filters.priceMax) || Infinity;

    if (carPrice < minPrice || carPrice > maxPrice) {
      return false;
    }

    // Filter by car type
    if (filters.carType !== 'all' && car.type !== filters.carType) {
      return false;
    }

    // Filter by features (placeholder implementation)
    if (filters.features.length > 0) {
      // For a real app, you would check if the car has all selected features
      return true;
    }

    return true;
  });

  // Handle clicking on a car in the map
  const handleMapCarSelect = (car) => {
    setSelectedCar(car);
    // Scroll to that car in the list if in split view
    if (viewMode === 'split') {
      const carElement = document.getElementById(`car-${car.id}`);
      if (carElement) {
        carElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Search bar and filters at the top */}
      <div className="p-4 border-b">
        <SearchBar />
      </div>

      {/* Main container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Filters sidebar */}
        <div className="w-full md:w-64 p-4 border-r overflow-y-auto bg-white">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Filters</h3>

            {/* View mode toggle for mobile */}
            <div className="md:hidden mb-6">
              <h4 className="font-medium mb-2">View Mode</h4>
              <div className="flex border rounded-md overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 py-2 px-3 text-center ${
                    viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white'
                  }`}
                >
                  List
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`flex-1 py-2 px-3 text-center ${
                    viewMode === 'map' ? 'bg-blue-600 text-white' : 'bg-white'
                  }`}
                >
                  Map
                </button>
              </div>
            </div>

            {/* Price range */}
            <div className="mb-6">
              <h4 className="font-medium mb-2">Price range (SAR)</h4>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  name="priceMin"
                  value={filters.priceMin}
                  onChange={handleFilterChange}
                  className="w-full p-2 border rounded-md"
                  min="0"
                />
                <span>to</span>
                <input
                  type="number"
                  name="priceMax"
                  value={filters.priceMax}
                  onChange={handleFilterChange}
                  className="w-full p-2 border rounded-md"
                  min="0"
                />
              </div>
            </div>

            {/* Car type */}
            <div className="mb-6">
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

        {/* Content area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Car listings (left in split mode or full in grid mode) */}
          {(viewMode === 'grid' || viewMode === 'split') && (
            <div className={`${viewMode === 'split' ? 'w-1/2 border-r' : 'w-full'} overflow-y-auto p-4`}>
              <div className="mb-4">
                <h2 className="text-xl font-semibold">
                  {filteredCars.length} cars available
                  {searchParams.location && ` in ${searchParams.location}`}
                </h2>
                {searchParams.startDate && searchParams.endDate && (
                  <p className="text-gray-600">
                    From {searchParams.startDate} to {searchParams.endDate}
                  </p>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
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
                <div className="grid grid-cols-1 gap-6">
                  {filteredCars.map((car) => (
                    <div 
                      key={car.id} 
                      id={`car-${car.id}`}
                      className={`border rounded-lg overflow-hidden hover:shadow-md transition-shadow ${
                        selectedCar && selectedCar.id === car.id ? 'ring-2 ring-blue-500' : ''
                      }`}
                      onClick={() => setSelectedCar(car)}
                    >
                      <Link to={`/cars/${car.id}`}>
                        <CarCard car={car} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Map (right in split mode or full in map mode) */}
          {(viewMode === 'map' || viewMode === 'split') && (
            <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} h-full`}>
              <div className="h-full">
                <MapView cars={filteredCars} onCarSelect={handleMapCarSelect} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View mode toggle for desktop (fixed at bottom right) */}
      <div className="hidden md:block fixed bottom-6 right-6 z-10">
        <div className="bg-white rounded-full shadow-lg overflow-hidden flex p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-l-full ${
              viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
            }`}
            title="List View"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={`p-2 ${
              viewMode === 'split' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
            }`}
            title="Split View"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`p-2 rounded-r-full ${
              viewMode === 'map' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'
            }`}
            title="Map View"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
