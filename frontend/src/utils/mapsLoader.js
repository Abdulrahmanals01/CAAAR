import { Loader } from '@googlemaps/js-api-loader';

// Create a singleton loader instance with complete configuration
const loader = new Loader({
  apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  version: 'weekly',
  libraries: ['places'],
  language: 'en',
  region: 'SA', // Set to Saudi Arabia
  authReferrerPolicy: 'origin'
});

// Simple error handler for maps loading failures
const handleMapsError = (error) => {
  console.error('Google Maps loading error:', error);
  return {
    error: true,
    message: 'Failed to load Google Maps. Please check your internet connection and try again.'
  };
};

// Create a named export object
const mapsService = {
  load: () => loader.load().catch(handleMapsError),
  handleMapsError
};

// Export the service
export default mapsService;
