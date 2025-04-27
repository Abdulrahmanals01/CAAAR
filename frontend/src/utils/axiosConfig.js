import axios from 'axios';

// Create axios instance with default config
const instance = axios.create({
  baseURL: 'http://localhost:5000'
});

// Setup interceptors
instance.interceptors.request.use(
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

// Response interceptor
instance.interceptors.response.use(
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

export default instance;
