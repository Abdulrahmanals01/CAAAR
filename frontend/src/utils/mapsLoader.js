import { Loader } from '@googlemaps/js-api-loader';

const loader = new Loader({
  apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
  version: 'weekly',
  libraries: ['places'],
  language: 'en',
  region: 'SA', 
  authReferrerPolicy: 'origin'
});

const handleMapsError = (error) => {
  console.error('Google Maps loading error:', error);
  return {
    error: true,
    message: 'Failed to load Google Maps. Please check your internet connection and try again.'
  };
};

const mapsService = {
  load: () => loader.load().catch(handleMapsError),
  handleMapsError
};

export default mapsService;
