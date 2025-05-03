import { Loader } from '@googlemaps/js-api-loader';

// Get API key from environment variable
const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

// Create a singleton loader instance
const loader = new Loader({
  apiKey,
  version: 'weekly',
  libraries: ['places'],
  language: 'en',
  region: 'US'
});

// Export the loader for use across components
export default loader;
