import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import axios from '../utils/axiosConfig';
import CarCard from '../components/cars/CarCard';
import MapView from '../components/cars/MapView';
import SearchBar from '../components/SearchBar';

const CarSearch = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('split'); // 'grid', 'map', or 'split'
  const [selectedCar, setSelectedCar] = useState(null);
  const [filters, setFilters] = useState({
    priceMin: 0,
    priceMax: 2000,
    carType: 'all',
    features: []
  });

  // Extract search parameters from URL
  const [searchParams, setSearchParams] = useState({
    location: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '10:00'
  });

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const locationParam = queryParams.get('location');
    const startDateParam = queryParams.get('startDate');
    const endDateParam = queryParams.get('endDate');
    const startTimeParam = queryParams.get('startTime');
    const endTimeParam = queryParams.get('endTime');

    const updatedParams = {
      location: locationParam || searchParams.location,
      startDate: startDateParam || searchParams.startDate,
      endDate: endDateParam || searchParams.endDate,
      startTime: startTimeParam || searchParams.startTime,
      endTime: endTimeParam || searchParams.endTime
    };

    setSearchParams(updatedParams);
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

  // Fetch cars when component mounts or search params change
  useEffect(() => {
    const fetchCars = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/cars', { 
          params: {
            location: searchParams.location,
            start_date: searchParams.startDate,
            end_date: searchParams.endDate
          }
        });
        
        // Add dummy coordinates for testing if not present
        const carsWithCoordinates = response.data.map(car => {
          if (!car.latitude || !car.longitude) {
            // Generate random coordinates around Riyadh
            const lat = 24.7136 + (Math.random() - 0.5) * 0.2;
            const lng = 46.6753 + (Math.random() - 0.5) * 0.2;
            return { ...car, latitude: lat.toString(), longitude: lng.toString() };
          }
          return car;
        });
        
        setCars(carsWithCoordinates);
        setError(null);
      } catch (err) {
        console.error('Error fetching cars:', err);
        setError('Failed to load car listings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchCars();
  }, [searchParams]);

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

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options).replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2');
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Top search bar is already in the header */}

      {/* Main container */}
      <div className="flex flex-col md:flex-row h-full">
        {/* Left sidebar with filters */}
        <div className="md:w-64 bg-white border-r p-4 overflow-y-auto">
          <h3 className="text-xl font-semibold mb-4">Filters</h3>
          
          {/* Price range */}
          <div className="mb-6">
            <h4 className="font-medium mb-2">Price range (SAR)</h4>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                name="priceMin"
                value={filters.priceMin}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded-md"
                min="0"
                placeholder="0"
              />
              <span>to</span>
              <input
                type="number"
                name="priceMax"
                value={filters.priceMax}
                onChange={handleFilterChange}
                className="w-full p-2 border rounded-md"
                min="0"
                placeholder="2000"
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

          {/* Mobile view toggle */}
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
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Car list - left side in split mode */}
          {(viewMode === 'grid' || viewMode === 'split') && (
            <div className={`${viewMode === 'split' ? 'md:w-1/2 border-r' : 'w-full'} overflow-y-auto`}>
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">
                  {filteredCars.length} {filteredCars.length === 1 ? 'car' : 'cars'} available
                </h2>
                <p className="text-gray-600 text-sm">
                  {searchParams.location ? `in ${searchParams.location}` : ''} 
                  {searchParams.startDate && searchParams.endDate ? ` • From ${formatDate(searchParams.startDate)} to ${formatDate(searchParams.endDate)}` : ''}
                </p>
              </div>

              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="p-4">
                  <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
                    <p>{error}</p>
                  </div>
                </div>
              ) : filteredCars.length === 0 ? (
                <div className="p-4">
                  <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <h3 className="text-xl font-semibold mb-2">No cars found</h3>
                    <p className="text-gray-600 mb-4">Try adjusting your search parameters or filters</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredCars.map((car) => (
                    <div
                      key={car.id}
                      id={`car-${car.id}`}
                      className={`hover:bg-gray-50 transition-colors ${
                        selectedCar && selectedCar.id === car.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => setSelectedCar(car)}
                    >
                      <Link to={`/cars/${car.id}`} className="block">
                        <div className="p-4">
                          <CarCard car={car} />
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Map - right side in split mode */}
          {(viewMode === 'map' || viewMode === 'split') && (
            <div className={`${viewMode === 'split' ? 'md:w-1/2' : 'w-full'} h-full relative`}>
              {loading ? (
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
                  <MapView cars={filteredCars} onCarSelect={handleMapCarSelect} />
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-75 px-3 py-1 rounded-full text-sm">
                    Use ctrl + scroll to zoom the map
                  </div>
                </>
              )}
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

export default CarSearch;
