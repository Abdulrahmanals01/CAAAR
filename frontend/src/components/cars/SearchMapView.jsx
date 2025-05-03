import React, { useState, useCallback } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { Link } from 'react-router-dom';

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem'
};

// Saudi Arabia default center (Riyadh)
const defaultCenter = {
  lat: 24.7136,
  lng: 46.6753
};

const SearchMapView = ({ cars = [], searchLocation }) => {
  const [map, setMap] = useState(null);
  const [selectedCar, setSelectedCar] = useState(null);
  const [mapError, setMapError] = useState(false);
  
  // Load Google Maps API with consistent settings
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    // Keep libraries array empty for consistency
    libraries: []
  });

  const onLoad = useCallback(function callback(map) {
    try {
      setMap(map);
      
      // Center map on search location if provided
      if (searchLocation) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: searchLocation + ', Saudi Arabia' }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            const location = results[0].geometry.location;
            map.setCenter(location);
            map.setZoom(12);
            
            // Add a marker for the search location
            new window.google.maps.Marker({
              position: location,
              map: map,
              title: results[0].formatted_address || searchLocation,
              icon: {
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#4285F4',
                fillOpacity: 0.3,
                strokeColor: '#4285F4',
                strokeWeight: 2
              }
            });
          }
        });
      }
      
      // If we have cars with locations, fit the map to show all markers
      if (cars.length > 0 && cars.some(car => car.latitude && car.longitude)) {
        const bounds = new window.google.maps.LatLngBounds();
        
        cars.forEach(car => {
          if (car.latitude && car.longitude) {
            const lat = parseFloat(car.latitude);
            const lng = parseFloat(car.longitude);
            if (!isNaN(lat) && !isNaN(lng)) {
              bounds.extend({
                lat,
                lng
              });
            }
          }
        });
        
        // Only adjust if we have valid bounds and no search location
        if (!bounds.isEmpty() && !searchLocation) {
          map.fitBounds(bounds);
        }
      }
    } catch (error) {
      console.error("Error in map onLoad:", error);
    }
  }, [cars, searchLocation]);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  // Display an error message if the map fails to load
  if (loadError || mapError) {
    return (
      <div className="border border-gray-300 rounded-lg flex flex-col items-center justify-center h-64 bg-gray-100 p-4">
        <div className="text-red-500 mb-2">Unable to load Google Maps</div>
        <div className="text-gray-600 text-sm text-center">
          Please check your browser console for more details.
        </div>
      </div>
    );
  }

  // Display a loading state while the map is initializing
  if (!isLoaded) {
    return (
      <div className="border border-gray-300 rounded-lg flex items-center justify-center h-64 bg-gray-100">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }
  
  // Check if any cars have location data
  const carsWithLocation = cars.filter(car => car.latitude && car.longitude);
  
  if (carsWithLocation.length === 0) {
    return (
      <div className="border border-gray-300 rounded-lg flex flex-col items-center justify-center h-64 bg-gray-100 p-4">
        <div className="text-yellow-600 mb-2">No cars with location data</div>
        <div className="text-gray-600 text-sm text-center">
          The current search results don't have geographic coordinates.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg overflow-hidden border border-gray-300">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={10}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          fullscreenControl: false,
          streetViewControl: true,
          mapTypeControl: true,
          zoomControl: true
        }}
      >
        {carsWithLocation.map(car => {
          const lat = parseFloat(car.latitude);
          const lng = parseFloat(car.longitude);
          
          if (isNaN(lat) || isNaN(lng)) {
            return null;
          }
          
          return (
            <Marker 
              key={car.id}
              position={{
                lat,
                lng
              }}
              onClick={() => setSelectedCar(car)}
            />
          );
        })}
        
        {selectedCar && (
          <InfoWindow
            position={{
              lat: parseFloat(selectedCar.latitude),
              lng: parseFloat(selectedCar.longitude)
            }}
            onCloseClick={() => setSelectedCar(null)}
          >
            <div className="p-2 max-w-xs">
              <h3 className="font-bold">{selectedCar.brand} {selectedCar.model} {selectedCar.year}</h3>
              <p className="text-sm text-gray-600">{selectedCar.location}</p>
              <p className="text-sm font-bold mt-1">{selectedCar.price_per_day} SAR/day</p>
              <Link 
                to={`/cars/${selectedCar.id}`}
                className="block mt-2 text-sm text-blue-600 hover:underline"
              >
                View details
              </Link>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default SearchMapView;
