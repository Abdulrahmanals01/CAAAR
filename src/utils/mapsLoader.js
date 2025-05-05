import { Loader } from '@googlemaps/js-api-loader';

const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

const loader = new Loader({
  apiKey,
  version: 'weekly',
  libraries: ['places'],
  language: 'en',
  region: 'US'
});

export default loader;
