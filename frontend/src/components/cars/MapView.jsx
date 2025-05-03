import React, { useState, useEffect, useRef, useCallback } from 'react';

const MapView = ({ cars: initialCars, onCarSelect, searchLocation }) => {
  // Log the incoming props for debugging
  console.log('MapView received props:', { 
    initialCarsCount: initialCars?.length, 
    searchLocation
  });
  
  const [cars, setCars] = useState(initialCars || []);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapReady, setMapReady] = useState(false);
  const [carsProcessed, setCarsProcessed] = useState(false);
  const mapRef = useRef(null);
  const infoWindowRef = useRef(null);
  const mapLoadTimeoutRef = useRef(null);

  // Default center (Riyadh, Saudi Arabia)
  const defaultCenter = { lat: 24.7136, lng: 46.6753 };

  // Load Google Maps script
  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      // Wait for script to load
      existingScript.addEventListener('load', initializeMap);
      return;
    }

    // Create and load the script
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.addEventListener('load', initializeMap);
    script.addEventListener('error', () => {
      setError('Failed to load Google Maps API');
      setIsLoading(false);
    });

    document.head.appendChild(script);

    // Set a timeout to detect if Google Maps fails to load
    mapLoadTimeoutRef.current = setTimeout(() => {
      if (!window.google || !window.google.maps) {
        setError('Google Maps failed to load in a reasonable time. Please check your connection and try again.');
        setIsLoading(false);
      }
    }, 10000); // 10 seconds timeout

    return () => {
      // Clean up event listener if component unmounts during load
      script.removeEventListener('load', initializeMap);
      
      // Clear timeout
      if (mapLoadTimeoutRef.current) {
        clearTimeout(mapLoadTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create and initialize the map
  const initializeMap = useCallback(() => {
    if (!mapRef.current) return;

    try {
      console.log('Initializing map...');

      // Clear the timeout since the map is now loading
      if (mapLoadTimeoutRef.current) {
        clearTimeout(mapLoadTimeoutRef.current);
      }

      // Create map instance
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 12,
        fullscreenControl: true,
        streetViewControl: true,
        mapTypeControl: true,
        zoomControl: true
      });

      // Create a single reusable info window
      const infoWindow = new window.google.maps.InfoWindow();
      infoWindowRef.current = infoWindow;

      // Store map instance in state
      setMap(mapInstance);
      setMapReady(true);

      // Map is ready
      setIsLoading(false);

      console.log('Map initialized successfully');
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize Google Maps');
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Process cars data once it's available
  useEffect(() => {
    // Skip if we've already processed this batch of cars or if there are no cars
    if (carsProcessed || !cars || cars.length === 0) return;

    // Process cars to ensure valid coordinates
    const processedCars = cars.map(car => {
      if (car.latitude && car.longitude) {
        return {
          ...car,
          latitude: parseFloat(car.latitude),
          longitude: parseFloat(car.longitude)
        };
      }
      return car;
    });

    // Replace the cars array with the processed one
    if (processedCars.length > 0) {
      setCars(processedCars);
    }

    // Set a flag to indicate cars are being processed
    setCarsProcessed(true);

    console.log('Car data available for markers:', cars.length);
    console.log('Cars with valid coordinates:',
      cars.filter(car =>
        car.latitude && car.longitude &&
        !isNaN(parseFloat(car.latitude)) &&
        !isNaN(parseFloat(car.longitude))
      ).length
    );
  }, [cars, carsProcessed, setCars]);

  // Update local state when prop changes and reset the carsProcessed flag
  useEffect(() => {
    setCars(initialCars || []);
    setCarsProcessed(false);
  }, [initialCars]);

  // Simple debug function to log car data
  const logCarCoordinates = (cars) => {
    if (!cars || cars.length === 0) {
      console.log('No cars to display');
      return;
    }
    
    console.log(`Checking coordinates for ${cars.length} cars`);
    const carsWithCoords = cars.filter(car => 
      car && car.latitude && car.longitude && 
      !isNaN(parseFloat(car.latitude)) && 
      !isNaN(parseFloat(car.longitude))
    );
    
    console.log(`Found ${carsWithCoords.length} cars with valid coordinates`);
    
    // Log the first few cars with their coordinates
    carsWithCoords.slice(0, 3).forEach(car => {
      console.log(`Car ID ${car.id}: ${car.brand} ${car.model}, Coords: [${car.latitude}, ${car.longitude}]`);
    });
  };
  
  // Update markers when map is ready AND cars change
  useEffect(() => {
    // Only proceed if the map is ready
    if (!map) {
      console.log('Map not ready yet');
      return;
    }
    
    // Check if we have cars
    if (!cars || cars.length === 0) {
      console.log('No cars to display on map');
      return;
    }
    
    // Log car data for debugging
    logCarCoordinates(cars);
    
    // Create markers function
    const createMarkers = () => {
      console.log('Creating markers - Map ready:', !!map, 'Cars count:', cars.length);

      // Clear all existing car markers (simpler approach)
      if (markers) {
        markers.forEach(marker => {
          // Only clear car markers (not search markers)
          if (!marker.getIcon() || typeof marker.getIcon() !== 'object') {
            marker.setMap(null);
          }
        });
      }

      // Create bounds to fit all markers
      const bounds = new window.google.maps.LatLngBounds();
      const newMarkers = [];
      let validMarkerCount = 0;

      cars.forEach(car => {
        // Ensure car is valid
        if (!car || !car.id) {
          console.log('Invalid car object found in array');
          return;
        }

        // Parse coordinates, ensuring they're valid numbers
        const lat = parseFloat(car.latitude);
        const lng = parseFloat(car.longitude);

        // Skip cars with invalid coordinates
        if (isNaN(lat) || isNaN(lng)) {
          console.log(`Car ${car.id}: Invalid coordinates`, car.latitude, car.longitude);
          return;
        }

        // Create new marker (simpler approach)
        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map: map,
          title: `${car.brand || ''} ${car.model || ''}`.trim() || 'Car'
        });

        // Create info window content
        const content = `
          <div style="width: 200px; padding: 10px;">
            <h3 style="margin: 0 0 5px; font-size: 16px;">${car.brand || ''} ${car.model || ''} ${car.year || ''}</h3>    
            <p style="margin: 5px 0; color: #555;">${car.location || ''}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
              <span style="font-weight: bold; color: #3b82f6;">${car.price_per_day || 0} SAR/day</span>
              <a href="/cars/${car.id}" style="text-decoration: none; background-color: #3b82f6; color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px;">View Details</a>
            </div>
          </div>
        `;

        // Add click event
        marker.addListener('click', () => {
          // Close any open info window
          if (infoWindowRef.current) {
            infoWindowRef.current.close();
          }

          // Set content and open
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(map, marker);

          // Notify parent component
          if (onCarSelect) onCarSelect(car);
        });

        // Add to new markers array
        newMarkers.push(marker);

        // Extend bounds
        bounds.extend({ lat, lng });
        validMarkerCount++;
      });

      console.log(`Created ${validMarkerCount} markers out of ${cars.length} cars`);

      // Update markers in state
      setMarkers(prev => {
        // Keep search location markers
        const searchMarkers = Array.isArray(prev) ? prev.filter(marker => 
          marker && typeof marker.getIcon === 'function' && marker.getIcon() && 
          typeof marker.getIcon() === 'object' && 
          marker.getIcon().path === window.google.maps.SymbolPath.CIRCLE
        ) : [];
        return [...searchMarkers, ...newMarkers];
      });

      // Fit map to markers if we have any
      if (validMarkerCount > 0 && !searchLocation) {
        console.log(`Fitting map to ${validMarkerCount} markers`);

        if (validMarkerCount > 1) {
          map.fitBounds(bounds);

          // Don't zoom in too far
          window.google.maps.event.addListenerOnce(map, 'idle', () => {
            if (map.getZoom() > 15) map.setZoom(15);
          });
        } else {
          // Single marker - center and zoom
          if (newMarkers.length > 0) {
            const position = newMarkers[0].getPosition();
            map.setCenter(position);
            map.setZoom(14);
          }
        }
      }
    };

    // Create markers
    createMarkers();
    
  }, [map, cars, onCarSelect]);

  // Reference to store the search location marker
  const searchMarkerRef = useRef(null);
  
  // Geocode and center map if search location changes
  useEffect(() => {
    if (!map || !searchLocation) return;

    console.log('Processing search location:', searchLocation);

    const geocoder = new window.google.maps.Geocoder();

    // Remove any existing search marker
    if (searchMarkerRef.current) {
      searchMarkerRef.current.setMap(null);
      searchMarkerRef.current = null;
      
      // Remove the search marker from the markers array
      setMarkers(prev => prev.filter(marker => 
        marker.getIcon() === undefined || 
        (typeof marker.getIcon() === 'object' && marker.getIcon().path !== window.google.maps.SymbolPath.CIRCLE)
      ));
    }

    geocoder.geocode({ address: searchLocation + ', Saudi Arabia' }, (results, status) => {
      if (status === 'OK' && results && results.length > 0) {
        const location = results[0].geometry.location;

        // Center map on the location
        map.setCenter(location);
        map.setZoom(13); // Set an appropriate zoom level for city search

        // Add a marker for the location with a distinctive look
        const searchMarker = new window.google.maps.Marker({
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
          },
          // Make sure search marker stays on top
          zIndex: 1000
        });
        
        // Store reference to search marker
        searchMarkerRef.current = searchMarker;
        
        // Add search marker to markers array
        setMarkers(prev => [...prev, searchMarker]);
      } else {
        console.log('Geocoding failed for location:', searchLocation, 'Status:', status);
      }
    });
  }, [map, searchLocation]);

  // Clean up
  useEffect(() => {
    return () => {
      // Clear all markers when component unmounts
      if (markers && markers.length > 0) {
        markers.forEach(marker => {
          if (marker && marker.setMap) {
            marker.setMap(null);
          }
        });
      }
      
      // Clear search marker
      if (searchMarkerRef.current) {
        searchMarkerRef.current.setMap(null);
        searchMarkerRef.current = null;
      }
    };
  }, [markers]);

  return (
    <div className="w-full h-full relative">
      {error && (
        <div className="absolute top-0 left-0 right-0 bg-red-100 border-red-500 text-red-700 p-2 z-10">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-70 z-10">
          <div className="bg-white p-3 rounded-lg shadow-md">Loading map...</div>
        </div>
      )}

      {/* Debug info */}
      <div className="absolute top-0 right-0 bg-white bg-opacity-75 p-2 z-10 text-xs">
        Cars: {cars.length} | Markers: {markers.length}
        {cars.length > 0 && markers.length === 0 && mapReady && (
          <span className="ml-2 text-orange-600">No valid locations found</span>
        )}
      </div>

      <div
        ref={mapRef}
        className="w-full h-full"
        aria-label="Map showing car locations"
      />
    </div>
  );
};

export default MapView;
