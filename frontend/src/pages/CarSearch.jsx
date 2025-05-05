import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { getCars } from '../api/cars';
import CarCard from '../components/cars/CarCard';
import MapView from '../components/cars/MapView';
import CarFilter from '../components/cars/CarFilter';

const CarSearch = () => {
  const location = useLocation();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('split'); 
  const [selectedCar, setSelectedCar] = useState(null);
  const searchTimeoutRef = useRef(null);
  const [filters, setFilters] = useState({
    min_price: '',
    max_price: '',
    car_type: 'all',
    min_year: '',
    max_year: '',
    colors: [],
    features: []
  });

  
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

    
    // Always set search params from URL parameters if present, or use defaults
    const newSearchParams = {
      location: locationParam || '',
      startDate: startDateParam || new Date().toISOString().split('T')[0],
      endDate: endDateParam || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      startTime: startTimeParam || '10:00',
      endTime: endTimeParam || '10:00'
    };
    console.log('Updated search params from URL:', newSearchParams);
    setSearchParams(newSearchParams);
  }, [location.search]);

  
  useEffect(() => {
    const handleResize = () => {
      
      setViewMode(window.innerWidth >= 768 ? 'split' : 'grid');
    };

    
    handleResize();

    
    window.addEventListener('resize', handleResize);

    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  
  useEffect(() => {
    // Don't reset the cars array right away - wait for new data
    setLoading(true);
    
    // Clear any pending search timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set a timeout for the search to prevent too many API calls
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        console.log('Fetching cars with params:', { ...searchParams, ...filters });
        
        // Prepare search filters
        const searchFilters = {
          location: searchParams.location,
          start_date: searchParams.startDate,
          end_date: searchParams.endDate,
          min_price: filters.min_price,
          max_price: filters.max_price,
          min_year: filters.min_year,
          max_year: filters.max_year,
          car_type: filters.car_type === 'all' ? undefined : filters.car_type,
          colors: filters.colors.length > 0 ? filters.colors : undefined,
          features: filters.features.length > 0 ? filters.features : undefined
        };

        const response = await getCars(searchFilters);

        if (response.success) {
          
          const processedCars = response.data.map(car => {
            
            if (car.latitude && car.longitude) {
              return {
                ...car,
                latitude: parseFloat(car.latitude),
                longitude: parseFloat(car.longitude)
              };
            }
            return car;
          });

          console.log("Fetched cars:", processedCars.length);
          console.log("Cars with valid location data:", processedCars.filter(car =>
            car.latitude && car.longitude &&
            !isNaN(car.latitude) && !isNaN(car.longitude)).length);

          setCars(processedCars);
          setError(null);
        } else {
          setError(response.error || 'Failed to load car listings');
          setCars([]);
        }
      } catch (err) {
        console.error('Error fetching cars:', err);
        setError('Failed to load car listings. Please try again later.');
        setCars([]);
      } finally {
        setLoading(false);
      }
    }, 500); 
    
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchParams, filters]);

  
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  
  const handleMapCarSelect = (car) => {
    setSelectedCar(car);
    
    if (viewMode === 'split') {
      const carElement = document.getElementById(`car-${car.id}`);
      if (carElement) {
        carElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
    return new Date(dateString).toLocaleDateString('en-US', options).replace(/(\d+)\/(\d+)\/(\d+)/, '$3-$1-$2');        
  };

  return (
    <div className="flex flex-col h-screen">
      {}
      <div className="flex flex-col md:flex-row h-full">
        {}
        <div className="md:w-64 bg-white border-r p-4 overflow-y-auto">
          <CarFilter onFilterChange={handleFilterChange} />
        </div>

        {}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {}
          {(viewMode === 'grid' || viewMode === 'split') && (
            <div className={`${viewMode === 'split' ? 'md:w-1/2 border-r' : 'w-full'} overflow-y-auto`}>
              <div className="p-4 border-b">
                <h2 className="text-xl font-semibold">
                  {cars.length} {cars.length === 1 ? 'car' : 'cars'} available
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
              ) : cars.length === 0 ? (
                <div className="p-4">
                  <div className="bg-white p-6 rounded-lg shadow-md text-center">
                    <h3 className="text-xl font-semibold mb-2">No cars found</h3>
                    <p className="text-gray-600 mb-4">Try adjusting your search parameters or filters</p>
                  </div>
                </div>
              ) : (
                <div className="divide-y">
                  {cars.map((car) => (
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

          {}
          {(viewMode === 'map' || viewMode === 'split') && (
            <div className={`${viewMode === 'split' ? 'md:w-1/2' : 'w-full'} h-full relative`}>
              {loading ? (
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>     
                </div>
              ) : (
                <>
                  <MapView
                    cars={cars}
                    onCarSelect={handleMapCarSelect}
                    searchLocation={searchParams.location}
                  />
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-75 px-3 py-1 rounded-full text-sm">
                    Use ctrl + scroll to zoom the map
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {}
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
