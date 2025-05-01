import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { Link } from 'react-router-dom';

const containerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '600px'
};

// Saudi Arabia default center (Riyadh)
const defaultCenter = {
  lat: 24.7136,
  lng: 46.6753
};

function MapView({ cars, onCarSelect = null }) {
  const [map, setMap] = useState(null);
  const [selectedCar, setSelectedCar] = useState(null);
  const [bounds, setBounds] = useState(null);
  const markersRef = useRef({});

  // Load Google Maps API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || ''
  });

  const onLoad = useCallback(function callback(map) {
    const bounds = new window.google.maps.LatLngBounds();
    map.fitBounds(bounds);
    setMap(map);
    setBounds(bounds);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  // Handle car selection
  const handleCarSelect = (car) => {
    setSelectedCar(car);
    if (onCarSelect) {
      onCarSelect(car);
    }
  };

  // Update bounds when cars change
  useEffect(() => {
    if (map && cars && cars.length > 0 && bounds) {
      const newBounds = new window.google.maps.LatLngBounds();
      
      cars.forEach(car => {
        if (car.latitude && car.longitude) {
          const lat = parseFloat(car.latitude);
          const lng = parseFloat(car.longitude);
          
          if (!isNaN(lat) && !isNaN(lng)) {
            newBounds.extend({ lat, lng });
          }
        }
      });
      
      if (!newBounds.isEmpty()) {
        map.fitBounds(newBounds);
        
        // Adjust zoom level if there's only one marker or if the zoom is too far in
        if (cars.length === 1) {
          map.setZoom(14);
        } else if (map.getZoom() > 15) {
          map.setZoom(14);
        }
      }
    }
  }, [map, cars, bounds]);

  // Render map component
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={10}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false,
          zoomControl: true
        }}
      >
        {cars.map(car => {
          if (!car.latitude || !car.longitude) {
            return null;
          }
          
          const lat = parseFloat(car.latitude);
          const lng = parseFloat(car.longitude);
          
          if (isNaN(lat) || isNaN(lng)) {
            return null;
          }
          
          return (
            <Marker
              key={car.id}
              position={{ lat, lng }}
              onClick={() => handleCarSelect(car)}
              label={{
                text: `${car.price_per_day || 0} SAR`,
                className: 'marker-label',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '12px',
                background: 'black',
                padding: '4px 8px',
                borderRadius: '4px'
              }}
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
              <div className="font-bold text-lg">{selectedCar.brand} {selectedCar.model}</div>
              <div className="text-sm mb-2">{selectedCar.price_per_day} SAR/day</div>
              <div className="text-sm mb-2 text-gray-600">{selectedCar.location}</div>
              <Link
                to={`/cars/${selectedCar.id}`}
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-1 rounded"
              >
                View Details
              </Link>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

export default React.memo(MapView);
