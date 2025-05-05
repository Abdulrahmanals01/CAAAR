import React, { useState, useEffect, useRef, useCallback } from 'react';

const MapView = ({ cars: initialCars, onCarSelect, searchLocation }) => {
  
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

  
  const defaultCenter = { lat: 24.7136, lng: 46.6753 };

  
  useEffect(() => {
    
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      
      existingScript.addEventListener('load', initializeMap);
      return;
    }

    
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

    
    mapLoadTimeoutRef.current = setTimeout(() => {
      if (!window.google || !window.google.maps) {
        setError('Google Maps failed to load in a reasonable time. Please check your connection and try again.');
        setIsLoading(false);
      }
    }, 10000); 

    return () => {
      
      script.removeEventListener('load', initializeMap);
      
      
      if (mapLoadTimeoutRef.current) {
        clearTimeout(mapLoadTimeoutRef.current);
      }
    };
    
  }, []);

  
  const initializeMap = useCallback(() => {
    if (!mapRef.current) return;

    try {
      console.log('Initializing map...');

      
      if (mapLoadTimeoutRef.current) {
        clearTimeout(mapLoadTimeoutRef.current);
      }

      
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: 12,
        fullscreenControl: true,
        streetViewControl: true,
        mapTypeControl: true,
        zoomControl: true
      });

      
      const infoWindow = new window.google.maps.InfoWindow();
      infoWindowRef.current = infoWindow;

      
      setMap(mapInstance);
      setMapReady(true);

      
      setIsLoading(false);

      console.log('Map initialized successfully');
    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize Google Maps');
      setIsLoading(false);
    }
    
  }, []);

  
  useEffect(() => {
    
    if (carsProcessed || !cars || cars.length === 0) return;

    
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

    
    if (processedCars.length > 0) {
      setCars(processedCars);
    }

    
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

  
  useEffect(() => {
    if (initialCars && initialCars.length > 0) {
      console.log('Updating cars from new props:', initialCars.length);
      setCars(initialCars);
      setCarsProcessed(false);
    }
  }, [initialCars]);

  
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
    
    
    carsWithCoords.slice(0, 3).forEach(car => {
      console.log(`Car ID ${car.id}: ${car.brand} ${car.model}, Coords: [${car.latitude}, ${car.longitude}]`);
    });
  };
  
  
  useEffect(() => {
    
    if (!map) {
      console.log('Map not ready yet');
      return;
    }
    
    
    if (!cars || cars.length === 0) {
      console.log('No cars to display on map');
      return;
    }
    
    
    logCarCoordinates(cars);
    
    // Add a delay before creating markers to ensure the map is fully rendered
    const markersTimer = setTimeout(() => {
      createMarkers();
    }, 200);
    
    return () => clearTimeout(markersTimer);
    
    // Function to create car markers
    function createMarkers() {
      console.log('Creating markers - Map ready:', !!map, 'Cars count:', cars.length);

      
      // Clear only car markers, not search location marker
      if (markers && markers.length > 0) {
        console.log('Clearing previous markers');
        markers.forEach(marker => {
          // Keep search location marker (circle icon), remove all other markers
          if (!marker.getIcon() || 
              typeof marker.getIcon() !== 'object' || 
              marker.getIcon().path !== window.google.maps.SymbolPath.CIRCLE) {
            marker.setMap(null);
          }
        });
      }

      
      const bounds = new window.google.maps.LatLngBounds();
      const newMarkers = [];
      let validMarkerCount = 0;

      cars.forEach(car => {
        
        if (!car || !car.id) {
          console.log('Invalid car object found in array');
          return;
        }

        
        const lat = parseFloat(car.latitude);
        const lng = parseFloat(car.longitude);

        
        if (isNaN(lat) || isNaN(lng)) {
          console.log(`Car ${car.id}: Invalid coordinates`, car.latitude, car.longitude);
          return;
        }

        
        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          map: map,
          title: `${car.brand || ''} ${car.model || ''}`.trim() || 'Car'
        });

        
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

        
        marker.addListener('click', () => {
          
          if (infoWindowRef.current) {
            infoWindowRef.current.close();
          }

          
          infoWindowRef.current.setContent(content);
          infoWindowRef.current.open(map, marker);

          
          if (onCarSelect) onCarSelect(car);
        });

        
        newMarkers.push(marker);

        
        bounds.extend({ lat, lng });
        validMarkerCount++;
      });

      console.log(`Created ${validMarkerCount} markers out of ${cars.length} cars`);

      
      // Keep existing search marker and add new car markers
      setMarkers(prev => {
        const existingMarkers = Array.isArray(prev) ? prev : [];
        
        // Filter out only the search location marker
        const searchMarkers = existingMarkers.filter(marker => 
          marker && typeof marker.getIcon === 'function' && marker.getIcon() && 
          typeof marker.getIcon() === 'object' && 
          marker.getIcon().path === window.google.maps.SymbolPath.CIRCLE
        );
        
        console.log(`Found ${searchMarkers.length} search markers to preserve`);
        
        // Return combined markers
        return [...searchMarkers, ...newMarkers];
      });

      
      if (validMarkerCount > 0 && !searchLocation) {
        console.log(`Fitting map to ${validMarkerCount} markers`);

        if (validMarkerCount > 1) {
          map.fitBounds(bounds);

          
          window.google.maps.event.addListenerOnce(map, 'idle', () => {
            if (map.getZoom() > 15) map.setZoom(15);
          });
        } else {
          
          if (newMarkers.length > 0) {
            const position = newMarkers[0].getPosition();
            map.setCenter(position);
            map.setZoom(14);
          }
        }
      }
    };

    
    createMarkers();
    
  }, [map, cars, onCarSelect]);

  
  const searchMarkerRef = useRef(null);
  
  
  useEffect(() => {
    if (!map) return;

    console.log('Processing search location:', searchLocation);

    const geocoder = new window.google.maps.Geocoder();

    
    if (searchMarkerRef.current) {
      searchMarkerRef.current.setMap(null);
      searchMarkerRef.current = null;
      
      
      setMarkers(prev => prev.filter(marker => 
        marker.getIcon() === undefined || 
        (typeof marker.getIcon() === 'object' && marker.getIcon().path !== window.google.maps.SymbolPath.CIRCLE)
      ));
    }

    if (searchLocation) {
      // Use the search location directly, let the backend handle normalization
    const geocodeAddress = searchLocation;
    
    geocoder.geocode({ address: geocodeAddress }, (results, status) => {
      if (status === 'OK' && results && results.length > 0) {
        const location = results[0].geometry.location;

        
        map.setCenter(location);
        map.setZoom(13); 

        
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
          
          zIndex: 1000
        });
        
        
        searchMarkerRef.current = searchMarker;
        
        
        setMarkers(prev => [...prev, searchMarker]);
      } else {
        console.log('Geocoding failed for location:', searchLocation, 'Status:', status);
      }
    });
    } else {
      // If no searchLocation but we have car markers, fit bounds to car markers
      if (markers && markers.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        let validMarkerCount = 0;
        
        markers.forEach(marker => {
          if (marker && marker.getPosition && 
              marker.getIcon() !== undefined && 
              (typeof marker.getIcon() !== 'object' || 
               marker.getIcon().path !== window.google.maps.SymbolPath.CIRCLE)) {
            bounds.extend(marker.getPosition());
            validMarkerCount++;
          }
        });
        
        if (validMarkerCount > 0) {
          map.fitBounds(bounds);
          window.google.maps.event.addListenerOnce(map, 'idle', () => {
            if (map.getZoom() > 15) map.setZoom(15);
          });
        }
      }
    }
  }, [map, searchLocation]);

  
  useEffect(() => {
    return () => {
      
      // When component unmounts, clear all markers
      if (markers && markers.length > 0) {
        console.log('Cleanup: removing all markers');
        markers.forEach(marker => {
          if (marker && marker.setMap) {
            marker.setMap(null);
          }
        });
      }
      
      // Clear search marker reference
      if (searchMarkerRef.current) {
        searchMarkerRef.current.setMap(null);
        searchMarkerRef.current = null;
      }
    };
  }, []);

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

      {}
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
