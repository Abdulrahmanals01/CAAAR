import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

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
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    };
    
    const response = await axios.post(`${API_URL}/api/cars`, carData, config);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error creating car listing' 
    };
  }
};

// Update car listing
export const updateCar = async (carId, carData) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data'
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

// Delete car listing
export const deleteCar = async (carId) => {
  try {
    await axios.delete(`${API_URL}/api/cars/${carId}`);
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
    const response = await axios.get(`${API_URL}/api/host/cars`);
    return { success: true, data: response.data };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.message || 'Error fetching your car listings' 
    };
  }
};
