#!/bin/bash
# Update Maps integration with improved error handling

# Backup and replace mapsLoader.js
cp frontend/src/utils/mapsLoader.js frontend/src/utils/mapsLoader.js.bak
cp frontend/src/utils/mapsLoader.js.new frontend/src/utils/mapsLoader.js
rm frontend/src/utils/mapsLoader.js.new

# Update LocationPicker component to handle errors better
cat > location-picker-error-handling.js << 'EOFJS'
// Add this at the beginning of the useLayoutEffect in LocationPicker.jsx
window.gm_authFailure = () => {
  setError('Google Maps API key is invalid or has expired. Please contact support.');
  setIsLoading(false);
};

// Update the error handling in the catch block
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
EOFJS

echo "
Please manually add the error handling to LocationPicker.jsx:
1. Open frontend/src/components/cars/LocationPicker.jsx
2. Add the gm_authFailure handler at the beginning of useLayoutEffect
3. Update the catch block with better error handling

The code is in location-picker-error-handling.js
"

echo "✅ Maps integration improvements applied"
