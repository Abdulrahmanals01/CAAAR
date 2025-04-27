import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Get API headers with auth token
const getHeaders = (contentType = 'application/json') => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Content-Type': contentType,
      'Authorization': token ? `Bearer ${token}` : ''
    }
  };
};

// Get all cars with optional filters
export const getCars = async (filters = {}) => {
  try {
    // Convert filters object to query string
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value);
      }
    });
    const response = await axios.get(`${API_URL}/api/cars?${queryParams.toString()}`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Error fetching cars'
    };
  }
};

// Get car by ID
export const getCarById = async (carId) => {
  try {
    const response = await axios.get(`${API_URL}/api/cars/${carId}`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Error fetching car details'
    };
  }
};

// Create new car listing
export const createCar = async (carData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    };

    const response = await axios.post(`${API_URL}/api/cars`, carData, config);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Car creation error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || 'Error creating car listing'
    };
  }
};

// Update car listing
export const updateCar = async (carId, carData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    };

    const response = await axios.put(`${API_URL}/api/cars/${carId}`, carData, config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Error updating car listing'
    };
  }
};

// Update car availability only
export const updateCarAvailability = async (carId, availabilityData) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    const response = await axios.patch(
      `${API_URL}/api/cars/${carId}/availability`, 
      availabilityData, 
      config
    );
    
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Error updating car availability'
    };
  }
};

// Check if car has active bookings
export const checkActiveBookings = async (carId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const response = await axios.get(`${API_URL}/api/cars/${carId}/active-bookings`, config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Error checking active bookings'
    };
  }
};

// Delete car listing
export const deleteCar = async (carId) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    await axios.delete(`${API_URL}/api/cars/${carId}`, config);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Error deleting car listing'
    };
  }
};

// Get host's cars
export const getHostCars = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }

    const config = {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };

    const response = await axios.get(`${API_URL}/api/cars/owner`, config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || 'Error fetching your car listings'
    };
  }
};
