import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getCars } from '../api/cars';
import CarCard from '../components/cars/CarCard';
import CarFilter from '../components/cars/CarFilter';
import SearchMapView from '../components/cars/SearchMapView';

const SearchResults = () => {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  // Extract and parse filters from URL
  const filters = {
    location: queryParams.get('location') || '',
    start_date: queryParams.get('start_date') || '',
    end_date: queryParams.get('end_date') || '',
    min_price: queryParams.get('min_price') || '',
    max_price: queryParams.get('max_price') || '',
    car_type: queryParams.get('car_type') || '',
    features: queryParams.get('features') ? JSON.parse(queryParams.get('features')) : []
  };

  // Fetch cars with filters
  useEffect(() => {
    const controller = new AbortController();
    
    const fetchCars = async () => {
      try {
        setLoading(true);
        
        // Add the signal to the request to allow cancellation
        const response = await getCars(filters);
        
        // Only update state if the component is still mounted
        if (!controller.signal.aborted) {
          if (response.success) {
            setCars(response.data);
          } else {
            setError(response.error);
          }
          setLoading(false);
        }
      } catch (err) {
        // Only update state if the component is still mounted
        if (!controller.signal.aborted) {
          setError('Failed to load cars');
          setLoading(false);
        }
      }
    };

    fetchCars();
    
    // Cleanup function that cancels any in-flight requests
    return () => {
      controller.abort();
    };
  }, [location.search]); // Only depend on the URL search string

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    const updatedParams = new URLSearchParams();

    // Update URL with new filters
    Object.entries({...filters, ...newFilters}).forEach(([key, value]) => {
      if (value) {
        if (key === 'features' && Array.isArray(value) && value.length > 0) {
          updatedParams.set(key, JSON.stringify(value));
        } else if (value !== '') {
          updatedParams.set(key, value);
        }
      }
    });

    navigate({
      pathname: '/cars/search',
      search: updatedParams.toString()
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const dateRange = filters.start_date && filters.end_date
    ? `From ${new Date(filters.start_date).toLocaleDateString()} to ${new Date(filters.end_date).toLocaleDateString()}` 
    : '';

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Filters */}
        <div className="w-full md:w-1/4 bg-white p-4 rounded-lg shadow-md h-fit">
          <h2 className="text-xl font-bold mb-4">Filters</h2>
          <CarFilter onFilterChange={handleFilterChange} initialFilters={filters} />
        </div>

        {/* Main Content */}
        <div className="w-full md:w-3/4">
          {/* Results Header */}
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold">
                  {cars.length} {cars.length === 1 ? 'car' : 'cars'} available
                </h1>
                {filters.location && (
                  <p className="text-gray-600">
                    in {filters.location} {dateRange && `• ${dateRange}`}
                  </p>
                )}
              </div>

              {/* View toggle buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  List View
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1 rounded ${
                    viewMode === 'map'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  Map View
                </button>
              </div>
            </div>
          </div>

          {/* View based on selected mode */}
          {viewMode === 'map' ? (
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Car Locations</h2>
              <SearchMapView cars={cars} searchLocation={filters.location} />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {cars.length > 0 ? (
                cars.map(car => (
                  <Link
                    key={car.id}
                    to={`/cars/${car.id}`}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
                  >
                    <CarCard car={car} />
                  </Link>
                ))
              ) : (
                <div className="bg-white rounded-lg shadow-md p-8 text-center">
                  <h2 className="text-xl font-semibold mb-2">No cars found</h2>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search filters to find more cars.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
