import React, { useState, useRef, useLayoutEffect } from 'react';
import mapsLoader from '../../utils/mapsLoader';

const LocationPicker = ({ onLocationSelect }) => {
  const mapContainerRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  
  const googleRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const listenersRef = useRef([]);
  
  
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
      </div>
      <p className="mt-2 text-sm text-gray-500">
        Click on the map to set the car's location or drag the marker to adjust.
      </p>
    </div>
  );
};

export default LocationPicker;
