import axios from 'axios';

// Set default base URL
axios.defaults.baseURL = 'http://localhost:5000';

// Setup token interceptor
const setupAxiosInterceptors = () => {
  // Request interceptor to add auth token to all requests
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle common errors
  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      // Handle 401 errors (unauthorized)
      if (error.response && error.response.status === 401) {
        console.error('Authentication error:', error.response.data);
        
        // Optional: Redirect to login page if token is invalid
        // window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
};

export default setupAxiosInterceptors;
