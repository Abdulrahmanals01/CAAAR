import React, { useState, useRef, useLayoutEffect } from 'react';
import mapsLoader from '../../utils/mapsLoader';

const LocationPicker = ({ onLocationSelect }) => {
  const mapContainerRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);
  
  
  const googleRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const listenersRef = useRef([]);
  
  // Function to handle getting current location
  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      return;
    }
    
    setLocationLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        // Center map on current location
        if (mapInstanceRef.current && googleRef.current) {
          const currentPosition = new googleRef.current.maps.LatLng(latitude, longitude);
          mapInstanceRef.current.setCenter(currentPosition);
          
          // Set marker
          if (markerRef.current) {
            markerRef.current.setPosition(currentPosition);
            
            // Get address from coordinates
            const geocoder = new googleRef.current.maps.Geocoder();
            geocoder.geocode({ location: currentPosition }, (results, status) => {
              if (status === 'OK' && results[0]) {
                onLocationSelect({
                  lat: latitude,
                  lng: longitude,
                  address: results[0].formatted_address
                });
              } else {
                onLocationSelect({
                  lat: latitude,
                  lng: longitude
                });
              }
              setLocationLoading(false);
            });
          }
        }
      },
      (error) => {
        console.error("Error getting current location:", error);
        setError("Failed to get your current location. Please ensure location services are enabled.");
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      }
    );
  };
  
  
  useLayoutEffect(() => {
    
    let isMounted = true;
    
    
    window.gm_authFailure = () => {
      if (isMounted) {
        setError('Google Maps API key is invalid or has expired. Please contact support.');
        setIsLoading(false);
      }
    };
    
    const initializeMap = async () => {
      if (!mapContainerRef.current) return;
      
      try {
        setIsLoading(true);
        
        
        const google = await mapsLoader.load();
        googleRef.current = google;

        
        const mapOptions = {
          center: { lat: 24.7136, lng: 46.6753 }, 
          zoom: 12,
          mapTypeControl: true,
          streetViewControl: false
        };

        
        if (!isMounted || !mapContainerRef.current) return;

        
        const mapInstance = new google.maps.Map(mapContainerRef.current, mapOptions);
        mapInstanceRef.current = mapInstance;

        
        const marker = new google.maps.Marker({
          map: mapInstance,
          draggable: true,
          animation: google.maps.Animation.DROP
        });
        markerRef.current = marker;

        
        const clickListener = mapInstance.addListener('click', (event) => {
          if (!isMounted) return;

          
          marker.setPosition(event.latLng);

          
          const location = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };

          
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: event.latLng }, (results, status) => {
            if (!isMounted) return;

            if (status === 'OK' && results[0]) {
              location.address = results[0].formatted_address;
            }

            onLocationSelect(location);
          });
        });

        
        const dragListener = marker.addListener('dragend', () => {
          if (!isMounted) return;

          const position = marker.getPosition();
          const location = {
            lat: position.lat(),
            lng: position.lng()
          };

          
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: position }, (results, status) => {
            if (!isMounted) return;

            if (status === 'OK' && results[0]) {
              location.address = results[0].formatted_address;
            }

            onLocationSelect(location);
          });
        });

        
        listenersRef.current = [
          { target: mapInstance, listener: clickListener },
          { target: marker, listener: dragListener }
        ];

        setIsLoading(false);
      } catch (err) {
        if (!isMounted) return;

        console.error('Error initializing map:', err);
        setError(
          err.message === 'Google Maps JavaScript API error: ApiNotActivatedMapError'
            ? 'The Google Maps API is not properly activated. Please contact support.'
            : 'Failed to load Google Maps. Please try again later.'
        );
        setIsLoading(false);
      }
    };

    initializeMap();

    
    return () => {
      isMounted = false;

      
      if (listenersRef.current.length > 0) {
        listenersRef.current.forEach(({ target, listener }) => {
          if (target && googleRef.current && googleRef.current.maps) {
            googleRef.current.maps.event.removeListener(listener);
          }
        });
        listenersRef.current = [];
      }

      
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }

      
      mapInstanceRef.current = null;
    };
  }, [onLocationSelect]);

  return (
    <div className="w-full">
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}
      <div className="relative">
        <div
          ref={mapContainerRef}
          className="w-full h-64 bg-gray-200 rounded-lg"
          style={{ minHeight: '300px' }}
        ></div>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-50 rounded-lg">      
            <div className="bg-white py-2 px-4 rounded-lg shadow">Loading map...</div>
          </div>
        )}
        
        {/* Current Location Button */}
        <button
          type="button"
          onClick={handleCurrentLocation}
          disabled={locationLoading || isLoading}
          className="absolute top-3 right-3 bg-white py-2 px-3 rounded shadow hover:bg-gray-100 flex items-center space-x-1 text-sm z-10"
        >
          {locationLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Locating...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              <span>Use Current Location</span>
            </>
          )}
        </button>
      </div>
      <p className="mt-2 text-sm text-gray-500">
        Click on the map to set the car's location, drag the marker to adjust, or use your current location.
      </p>
    </div>
  );
};

export default LocationPicker;
