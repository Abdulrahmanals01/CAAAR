#!/bin/bash

echo "======================================"
echo "Fixing Database Issues"
echo "======================================"
echo ""

# Fix double booking prevention with correct password
echo "Applying database fixes for double booking prevention..."
cat > fix-db.js << EOFJS
const { Pool } = require('pg');
const fs = require('fs');

// SQL to fix the double booking prevention
const fixSql = \`
-- Update the prevent_double_booking function to skip validation for completed bookings
CREATE OR REPLACE FUNCTION prevent_double_booking()
RETURNS TRIGGER AS \$\$
BEGIN
    -- Skip validation for completed or canceled bookings
    IF NEW.status IN ('completed', 'canceled') THEN
        RETURN NEW;
    END IF;

    IF NOT is_car_available(NEW.car_id, NEW.start_date, NEW.end_date) THEN
        RAISE EXCEPTION 'Car is not available for the selected dates';
    END IF;

    RETURN NEW;
END;
\$\$ LANGUAGE plpgsql;
\`;

// Create a pool with the correct password
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sayarati',
  password: "newpassword123",
  port: 5432
});

async function applyDatabaseFixes() {
  console.log("Connecting to database...");
  const client = await pool.connect();
  
  try {
    console.log("Applying SQL fixes...");
    await client.query(fixSql);
    console.log("Database fixes applied successfully!");
    
    // Now run the image standardization code
    console.log("Running image path standardization...");
    
    // Define a normalizeImagePath function
    const normalizeImagePath = (originalPath, type = 'cars') => {
      if (!originalPath) return null;
      
      // If it's already in the correct format, return it
      if (originalPath.startsWith("uploads/") && originalPath.includes(\`/\${type}/\`)) {
        return originalPath;
      }
      
      // Extract filename and normalize
      const basename = originalPath.split('/').pop();
      return \`uploads/\${type}/\${basename}\`;
    };

    // Process car images
    console.log("Processing car images...");
    const carResults = await client.query('SELECT id, image FROM cars WHERE image IS NOT NULL');
    console.log(\`Found \${carResults.rows.length} cars with images\`);
    
    let updatedCarsCount = 0;
    for (const car of carResults.rows) {
      const originalPath = car.image;
      const normalizedPath = normalizeImagePath(originalPath, 'cars');
      
      if (originalPath !== normalizedPath) {
        await client.query('UPDATE cars SET image = $1 WHERE id = $2', [normalizedPath, car.id]);
        updatedCarsCount++;
      }
    }
    console.log(\`Updated \${updatedCarsCount} car images\`);
    
    // Process license images
    console.log("Processing license images...");
    const userResults = await client.query('SELECT id, license_image FROM users WHERE license_image IS NOT NULL');
    console.log(\`Found \${userResults.rows.length} users with license images\`);
    
    let updatedUsersCount = 0;
    for (const user of userResults.rows) {
      const originalPath = user.license_image;
      const normalizedPath = normalizeImagePath(originalPath, 'licenses');
      
      if (originalPath !== normalizedPath) {
        await client.query('UPDATE users SET license_image = $1 WHERE id = $2', [normalizedPath, user.id]);
        updatedUsersCount++;
      }
    }
    console.log(\`Updated \${updatedUsersCount} user license images\`);
    
    console.log("All database fixes completed successfully!");
  } catch (err) {
    console.error("Database error:", err);
  } finally {
    client.release();
    await pool.end();
  }
}

applyDatabaseFixes();
EOFJS

# Run the database fixes
node fix-db.js

# Clean up
rm fix-db.js

echo "======================================"
echo "Now let's update the LocationPicker component"
echo "======================================"

# Create the updated LocationPicker.jsx
cat > frontend/src/components/cars/LocationPicker.jsx.new << 'EOFJS'
import React, { useState, useRef, useLayoutEffect } from 'react';
import mapsLoader from '../../utils/mapsLoader';

// Create a wrapper component that will handle the Google Maps lifecycle
const LocationPicker = ({ onLocationSelect }) => {
  const mapContainerRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use google maps refs to keep track of instances for cleanup
  const googleRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const listenersRef = useRef([]);
  
  // Use useLayoutEffect to ensure DOM manipulation happens before React renders
  useLayoutEffect(() => {
    // Initialize variable to track if component is mounted
    let isMounted = true;
    
    // Add global error handler for Google Maps authentication failures
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
        
        // Load Google Maps API
        const google = await mapsLoader.load();
        googleRef.current = google;

        // Create map instance
        const mapOptions = {
          center: { lat: 24.7136, lng: 46.6753 }, // Riyadh, Saudi Arabia
          zoom: 12,
          mapTypeControl: true,
          streetViewControl: false
        };

        // Only proceed if component is still mounted
        if (!isMounted || !mapContainerRef.current) return;

        // Create new map instance
        const mapInstance = new google.maps.Map(mapContainerRef.current, mapOptions);
        mapInstanceRef.current = mapInstance;

        // Create marker
        const marker = new google.maps.Marker({
          map: mapInstance,
          draggable: true,
          animation: google.maps.Animation.DROP
        });
        markerRef.current = marker;

        // Add click listener to map
        const clickListener = mapInstance.addListener('click', (event) => {
          if (!isMounted) return;

          // Set marker position
          marker.setPosition(event.latLng);

          // Get location data
          const location = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };

          // Use geocoder to get address
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: event.latLng }, (results, status) => {
            if (!isMounted) return;

            if (status === 'OK' && results[0]) {
              location.address = results[0].formatted_address;
            }

            onLocationSelect(location);
          });
        });

        // Add dragend listener to marker
        const dragListener = marker.addListener('dragend', () => {
          if (!isMounted) return;

          const position = marker.getPosition();
          const location = {
            lat: position.lat(),
            lng: position.lng()
          };

          // Use geocoder to get address
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: position }, (results, status) => {
            if (!isMounted) return;

            if (status === 'OK' && results[0]) {
              location.address = results[0].formatted_address;
            }

            onLocationSelect(location);
          });
        });

        // Store listeners for cleanup
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

    // Cleanup function - critical for preventing the DOM node error
    return () => {
      isMounted = false;

      // Clean up event listeners
      if (listenersRef.current.length > 0) {
        listenersRef.current.forEach(({ target, listener }) => {
          if (target && googleRef.current && googleRef.current.maps) {
            googleRef.current.maps.event.removeListener(listener);
          }
        });
        listenersRef.current = [];
      }

      // Clean up marker
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }

      // Clean up map (reference only, don't try to remove the element)
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
EOFJS

# Backup original file and put the new one in place
cp frontend/src/components/cars/LocationPicker.jsx frontend/src/components/cars/LocationPicker.jsx.bak
cp frontend/src/components/cars/LocationPicker.jsx.new frontend/src/components/cars/LocationPicker.jsx
rm frontend/src/components/cars/LocationPicker.jsx.new

# Fix the carController.js max_year bug if it wasn't fixed already
grep -q "values.push(max_year)" backend/src/controllers/carController.js
if [ $? -ne 0 ]; then
  echo "======================================"
  echo "Fixing max_year bug in carController.js"
  echo "======================================"
  cp backend/src/controllers/carController.js backend/src/controllers/carController.js.bak-year-fix
  sed -i 's/values.push(max_price); \/\/ FIX: This should be max_year/values.push(max_year); \/\/ Fixed parameter name/' backend/src/controllers/carController.js
  echo "✅ Fixed max_year parameter bug in carController.js"
fi

# Fix the app.js booking scheduler if it wasn't fixed already
grep -q "startScheduler()" backend/src/app.js
if [ $? -ne 0 ]; then
  echo "======================================"
  echo "Adding scheduler to app.js"
  echo "======================================"
  sed -i '/const helmet = require/a const startScheduler = require("./scheduleTasks");' backend/src/app.js
  sed -i '/createCarRatingsTable()/a // Start scheduler\nstartScheduler();' backend/src/app.js
  echo "✅ Added scheduler to app.js"
else
  echo "Scheduler already exists in app.js, no changes needed"
fi

echo "======================================"
echo "All fixes have been applied successfully!"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Restart the backend server: cd backend && npm run dev"
echo "2. Restart the frontend server: cd frontend && npm start"
echo ""
